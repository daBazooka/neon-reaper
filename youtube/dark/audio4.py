# usage: python3 audio4.py events.json out.wav     (BPM env, default 120)
# Beat-driven score, numpy only. 4/4, Am - F - C - G (one chord per bar).
# Energy per section (events.json "arr": [t0, t1, energy 0-4, riser, impact, breakdown]):
#   0 pad                       1 + arp, hats, soft kick     2 + kick, bass
#   3 + clap, lead melody       4 + 16th hats, doubled lead
# Ear comfort: kick short and band-limited, no constant sub drone, hats low and band-limited
# (6-9 kHz), whole mix high-passed at 35 Hz and low-passed at 9 kHz, bass sidechained to the kick.
import sys, json, wave, os, numpy as np
SR = 44100
ev = json.load(open(sys.argv[1])); out = sys.argv[2]
DUR = ev['dur']; N = int(DUR * SR) + SR
BPM = float(os.environ.get('BPM', 120)); BEAT = 60 / BPM; BAR = BEAT * 4
rng = np.random.default_rng(21)
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def T(d): return np.arange(int(d * SR)) / SR
def put(buf, t, a, g=1., pan=0.):
    i = int(round(t * SR))
    if i < 0 or i >= buf.shape[1]: return
    a = a[:buf.shape[1] - i]; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(a)] += a * g * l; buf[1, i:i + len(a)] += a * g * r
def fft_filter(x, lo=None, hi=None):
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR); H = np.ones_like(f)
    if lo: H = H / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi: H = H / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * H, n).astype(np.float32)
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)

# ---------------- instruments ----------------
def kick():
    t = T(.38); f = 60 + 110 * np.exp(-t * 32); ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t * 9.5) + .12 * fft_filter(noise(.38), 800, 5000) * np.exp(-t * 220)
    return (y * np.minimum(1, t / .002)).astype(np.float32)
def clap():
    t = T(.24); n = fft_filter(noise(.24), 900, 6500)
    env = np.exp(-t * 20) + .5 * np.where(t > .011, np.exp(-np.maximum(0, t - .011) * 50), 0) + .4 * np.where(t > .022, np.exp(-np.maximum(0, t - .022) * 50), 0)
    return (n * env * 1.3 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 40) * .3).astype(np.float32)
def hat(op=False):
    d = .25 if op else .05; t = T(d)
    return (fft_filter(noise(d), 6000, 9000) * np.exp(-t * (14 if op else 90))).astype(np.float32)
def bassnote(f, d):
    t = T(d); y = np.sin(2 * np.pi * f * t) + .45 * np.sin(4 * np.pi * f * t) + .2 * np.sin(6 * np.pi * f * t)
    return (y * np.minimum(1, t / .004) * np.exp(-t / (d * .75))).astype(np.float32)
def pluck(f, d=.4):
    t = T(d); y = np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t) + .1 * np.sin(6 * np.pi * f * t)
    return (y * np.minimum(1, t / .002) * np.exp(-t / .14)).astype(np.float32)
def lead(m, dur):
    f = mtof(m); t = T(dur + .25); vib = 1 + .004 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / .3)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR; y = np.sin(ph) + .35 * np.sin(2 * ph) + .15 * np.sin(3 * ph)
    env = np.minimum(1, t / .01) * np.where(t < dur, 1, np.exp(-(t - dur) * 14)) * (.75 + .25 * np.exp(-t * 3))
    return (y * env).astype(np.float32)
def padchord(notes, d):
    t = T(d); e = np.minimum(1, t / .3) * np.minimum(1, (d - t) / .35); L = np.zeros(len(t), np.float32); R = np.zeros(len(t), np.float32)
    for m in notes:
        f = mtof(m)
        for buf, det in ((L, .9992), (R, 1.0008)):
            ff = f * det; buf += (np.sin(2 * np.pi * ff * t) + .22 * np.sin(4 * np.pi * ff * t) + .08 * np.sin(6 * np.pi * ff * t)).astype(np.float32)
    return L * e, R * e
def bell(f, d=1.2):
    t = T(d); s = np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 2) + .1 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 4)
    return (s * np.minimum(1, t / .005) * np.exp(-t / .6)).astype(np.float32)
def crash(d=1.8):
    t = T(d); return (fft_filter(noise(d), 3000, 8500) * np.exp(-t * 2.4)).astype(np.float32)
def boom():
    t = T(1.0); f = 60 * np.exp(-t * 1.6) + 34; return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)).astype(np.float32)
def riser_bar(lo, hi, g0, g1):
    n = fft_filter(noise(BAR), lo, hi); t = np.linspace(0, 1, len(n)); return (n * (g0 + (g1 - g0) * t)).astype(np.float32)
def sweep(d):
    t = T(d); f = 220 * (8 ** (t / d)); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / d) ** 2).astype(np.float32)

# ---------------- arrangement ----------------
CH = [dict(bass=45, pad=[57, 60, 64], arp=[69, 72, 76, 81], lead=[(0, 76, 2), (2, 74, 1), (3, 72, 1), (4, 76, 2), (6, 74, 1), (7, 72, 1)]),     # Am
      dict(bass=41, pad=[53, 57, 60], arp=[65, 69, 72, 77], lead=[(0, 77, 2), (2, 76, 1), (3, 74, 1), (4, 72, 2), (6, 74, 1), (7, 76, 1)]),     # F
      dict(bass=48, pad=[60, 64, 67], arp=[72, 76, 79, 84], lead=[(0, 79, 2), (2, 76, 1), (3, 74, 1), (4, 76, 2), (6, 72, 1), (7, 74, 1)]),     # C
      dict(bass=43, pad=[55, 59, 62], arp=[67, 71, 74, 79], lead=[(0, 74, 2), (2, 76, 1), (3, 79, 1), (4, 83, 2), (6, 79, 1), (7, 76, 1)])]     # G
arr = ev.get('arr') or []
def seg_at(t):
    for a in arr:
        if a[0] <= t < a[1]: return a
    return None
DRUM = np.zeros((2, N), np.float32); BASS = np.zeros((2, N), np.float32); PAD = np.zeros((2, N), np.float32)
LEAD = np.zeros((2, N), np.float32); FXB = np.zeros((2, N), np.float32); SFX = np.zeros((2, N), np.float32)
K, CL, HC, HO = kick(), clap(), hat(False), hat(True)
depth = np.zeros(N, np.float32)
LG = [.55, .6, .65, .7, .75]
for b in range(int(DUR / BAR) + 1):
    t0 = b * BAR
    if t0 >= DUR: break
    a = seg_at(t0 + 1e-6)
    if a is None: continue
    en, riser, impact, brk = int(a[2]), a[3], a[4], a[5]
    bi = int(round((t0 - a[0]) / BAR)); nb = int(round((a[1] - a[0]) / BAR)); left = nb - bi
    ch = CH[b % 4]; drums = en >= 2 and not brk
    if en >= 2 and not brk:
        i0 = int(t0 * SR); i1 = min(N, int((t0 + BAR) * SR)); depth[i0:i1] = .62 if en == 4 else .5
    # pad
    L, R = padchord(ch['pad'], BAR + .4); i0 = int(t0 * SR); g = LG[en] * .11 * (1.15 if brk else 1)
    PAD[0, i0:i0 + len(L)] += (L * g)[:N - i0]; PAD[1, i0:i0 + len(R)] += (R * g)[:N - i0]
    # arp (16ths)
    if en >= 1:
        for k in range(16):
            m = ch['arp'][[0, 1, 2, 3, 2, 1, 2, 3][k % 8]]; put(PAD, t0 + k * BEAT / 4, pluck(mtof(m)), (.095 if en >= 2 else .07) * (1.2 if en == 4 else 1), -.4 if k % 2 else .4)
    # hats
    if en >= 1 and not brk:
        for k in range(8):
            tt = t0 + k * BEAT / 2
            if en >= 3:
                put(DRUM, tt, HC, .09, .15); put(DRUM, tt + BEAT / 4, HC, .05, -.15)
            elif k % 2 == 1 or en >= 2:
                put(DRUM, tt, HC, .08, .15)
        if en == 4:
            for k in (3, 7): put(DRUM, t0 + k * BEAT / 2, HO, .06, 0)
    # kick
    if drums:
        for k in range(4): put(DRUM, t0 + k * BEAT, K, .46 if (k == 0 and bi == 0) else .38)
    elif en == 1 and not brk:
        for k in (0, 2): put(DRUM, t0 + k * BEAT, K, .28)
    # bass
    if drums:
        pat = [(0, 1.5), (1.5, .5), (2, 1), (3.5, .5)] if b % 2 == 0 else [(0, 1), (1, .5), (2, 1.5), (3.5, .5)]
        for off, dd in pat: put(BASS, t0 + off * BEAT, bassnote(mtof(ch['bass'] + 12), dd * BEAT * .95), .20)
    # clap
    if en >= 3 and not brk:
        for k in (1, 3): put(DRUM, t0 + k * BEAT, CL, .36, 0)
        if en == 4: put(DRUM, t0 + 3.75 * BEAT, CL, .16, 0)
    # lead melody
    if en >= 3 or brk:
        for (e8, m, ln) in ch['lead']:
            put(LEAD, t0 + e8 * BEAT / 2, lead(m, ln * BEAT / 2 * .92), .075 if not brk else .09, .1)
            if en == 4: put(LEAD, t0 + e8 * BEAT / 2, lead(m - 12, ln * BEAT / 2 * .92), .04, -.1)
    # section start accent and impact
    if bi == 0:
        put(FXB, t0, crash(1.6), .10 if not impact else .2)
        if impact: put(FXB, t0, boom(), .35)
    # riser into the next section
    if riser and left <= 4:
        j = 4 - left; los = [500, 800, 1200, 2000]; his = [2200, 3200, 4600, 7200]; g = [.02, .04, .07, .11]
        put(FXB, t0, riser_bar(los[j], his[j], g[j], g[j] * 1.5), 1.0)
        if left == 4: put(FXB, t0, sweep(4 * BAR) , .04)
        if left == 2:
            for k in range(8): put(DRUM, t0 + k * BEAT / 2 + BAR, CL, .16 + .02 * k, 0)
        if left == 1:
            for k in range(16): put(DRUM, t0 + k * BEAT / 4, CL, .14 + .014 * k, 0)

# ---------------- hit sound effects tied to the picture ----------------
NT = [69, 72, 74, 76, 79, 81, 84, 86]
def pop():
    t = T(.14); f = 420 + 520 * np.minimum(t / .05, 1); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26)).astype(np.float32)
def tick():
    t = T(.05); return (np.sin(2 * np.pi * 1300 * t) * np.exp(-t * 85) * .7).astype(np.float32)
def hit():
    t = T(.5); f = 80 + 90 * np.exp(-t * 18); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)).astype(np.float32)
def chime():
    y = np.zeros(int(1.5 * SR), np.float32)
    for dt, m in ((0, 81), (.12, 85)):
        b_ = bell(mtof(m), 1.3); y[int(dt * SR):int(dt * SR) + len(b_)] += b_[:len(y) - int(dt * SR)]
    return y * .8
def whoosh():
    t = T(.45); return (fft_filter(noise(.45), 500, 3200) * np.sin(np.pi * t / .45) ** 2 * 1.3).astype(np.float32)
def drip():
    t = T(.5); f = 520 + 1100 * np.exp(-t * 9); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12) * .8).astype(np.float32)
SND = {'pop': (pop, .07, 0), 'tick': (tick, .05, .1), 'hit': (hit, .22, 0), 'chime': (chime, .10, 0), 'whoosh': (whoosh, .05, 0), 'drip': (drip, .10, .15)}
for k_ in range(8): SND['nt%d' % k_] = ((lambda kk=k_: bell(mtof(NT[kk]), 1.0)), .085, .06 * (k_ % 3 - 1))
for t, n in ev['snd']:
    if n in SND:
        fn, g, p = SND[n]; put(SFX, t, fn(), g, p)

# ---------------- mix ----------------
tt = np.arange(N) / SR; duck = (1 - depth * np.exp(-np.mod(tt, BEAT) / .16)).astype(np.float32); del tt
BASS *= duck[None, :]; PAD *= duck[None, :]
def make_ir(sec, seed):
    r = np.random.default_rng(seed); n = int(sec * SR); t_ = np.arange(n) / SR
    return fft_filter((r.standard_normal(n) * np.exp(-t_ / (sec / 4.5))).astype(np.float32), 120, 4500)
def reverb(bus, sec, wet):
    res = np.zeros_like(bus)
    for c_ in (0, 1):
        ir = make_ir(sec, 11 + c_); Ln = len(bus[c_]) + len(ir); n = 1 << (Ln - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(bus[c_], n) * np.fft.rfft(ir, n), n)[:len(bus[c_])]
        res[c_] = (y / max(1e-9, np.abs(ir).sum() * .05) * wet).astype(np.float32)
    return res
WET = PAD + LEAD
mix = DRUM + BASS + PAD + LEAD + FXB + SFX
mix += reverb(WET, 2.0, .16); del WET, DRUM, BASS, PAD, LEAD, FXB, SFX
e = int(DUR * SR); mix = mix[:, :e]
for c_ in (0, 1): mix[c_] = fft_filter(fft_filter(mix[c_], lo=35), hi=9000)
f_in = int(.05 * SR); f_out = int(1.4 * SR); mix[:, :f_in] *= np.linspace(0, 1, f_in); mix[:, -f_out:] *= np.linspace(1, 0, f_out)
rms = np.sqrt((mix ** 2).mean()); mix = mix * (10 ** (-15 / 20) / max(rms, 1e-9))
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
pk = np.abs(mix).max()
if pk > .86: mix = mix * (.86 / pk)
w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix.T * 32767).astype(np.int16).tobytes()); w.close()
print('music done, peak %.2f' % np.abs(mix).max())

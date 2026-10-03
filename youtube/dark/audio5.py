# usage: VOICE=voice.wav python3 audio5.py events.json out.wav     (BPM env, default 100)
# Light, warm, major-key score (numpy only). C - G - Am - F, one chord per bar.
# events.json "arr": [t0, t1, energy 1-3, riser, impact, brk, flavour]
#   flavour 0 intro/outro (bells)  1 bison (warm, steady)  2 falcon (airy, rising)  3 shark (smooth, rolling)
#           4 fox (playful pizzicato)  5 ant (tiny marching ticks)
# Ear comfort: soft sine/triangle timbres, no sub-bass, quiet band-limited shaker, whole mix 60 Hz - 9 kHz,
# the music ducks under the narration.
import sys, json, wave, os, numpy as np
SR = 44100
ev = json.load(open(sys.argv[1])); out = sys.argv[2]
DUR = ev['dur']; N = int(DUR * SR) + SR
BPM = float(os.environ.get('BPM', 100)); BEAT = 60 / BPM; BAR = BEAT * 4
rng = np.random.default_rng(5)
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
def smooth(x, n): k = np.ones(n) / n; return np.convolve(x, k, 'same')

# ---------------- instruments ----------------
def kick():
    t = T(.3); f = 52 + 70 * np.exp(-t * 28); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)
    return (y * np.minimum(1, t / .004)).astype(np.float32)
def tom(f0=110):
    t = T(.4); f = f0 * (1 + .5 * np.exp(-t * 25)); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    return (y * np.minimum(1, t / .003) + .08 * fft_filter(noise(.4), 300, 1500) * np.exp(-t * 60)).astype(np.float32)
def shaker(g=1.):
    t = T(.09); return (fft_filter(noise(.09), 4500, 8500) * np.sin(np.pi * np.minimum(1, t / .09)) ** 2 * np.exp(-t * 22) * g).astype(np.float32)
def wood(f=950):
    t = T(.08); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 60) + .15 * fft_filter(noise(.08), 1500, 5000) * np.exp(-t * 90)).astype(np.float32)
def pluck(f, d=.5, dec=.16):
    t = T(d); y = np.sin(2 * np.pi * f * t) + .28 * np.sin(4 * np.pi * f * t) + .08 * np.sin(6 * np.pi * f * t)
    return (y * np.minimum(1, t / .003) * np.exp(-t / dec)).astype(np.float32)
def marimba(f, d=.6):
    t = T(d); y = np.sin(2 * np.pi * f * t) * np.exp(-t / .22) + .35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / .05)
    return (y * np.minimum(1, t / .002)).astype(np.float32)
def bell(f, d=1.4):
    t = T(d); s = np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 2.5) + .08 * np.sin(2 * np.pi * f * 3.02 * t) * np.exp(-t * 5)
    return (s * np.minimum(1, t / .004) * np.exp(-t / .7)).astype(np.float32)
def soft(m, dur):
    f = mtof(m); t = T(dur + .3); vib = 1 + .003 * np.sin(2 * np.pi * 5 * t) * np.minimum(1, t / .4)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR; y = np.sin(ph) + .22 * np.sin(2 * ph) + .06 * np.sin(3 * ph)
    return (y * np.minimum(1, t / .02) * np.where(t < dur, 1, np.exp(-(t - dur) * 10))).astype(np.float32)
def bass(f, d):
    t = T(d); y = np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)
    return (y * np.minimum(1, t / .006) * np.exp(-t / (d * .8))).astype(np.float32)
def padchord(notes, d):
    t = T(d); e = np.minimum(1, t / .5) * np.minimum(1, (d - t) / .5); L = np.zeros(len(t), np.float32); R = np.zeros(len(t), np.float32)
    for m in notes:
        f = mtof(m)
        for buf, det in ((L, .9993), (R, 1.0007)):
            ff = f * det; buf += (np.sin(2 * np.pi * ff * t) + .18 * np.sin(4 * np.pi * ff * t)).astype(np.float32)
    return L * e, R * e
def whoosh():
    t = T(.7); return (fft_filter(noise(.7), 600, 2600) * np.sin(np.pi * t / .7) ** 2).astype(np.float32)
def chimeN(m): return bell(mtof(m), 1.6)

CH = [dict(bass=48, pad=[55, 60, 64], arp=[72, 76, 79, 84]),   # C
      dict(bass=43, pad=[55, 59, 62], arp=[71, 74, 79, 83]),   # G
      dict(bass=45, pad=[57, 60, 64], arp=[72, 76, 81, 84]),   # Am
      dict(bass=41, pad=[57, 60, 65], arp=[72, 77, 81, 84])]   # F
MEL = [[(0, 76, 2), (2, 79, 2), (4, 81, 1), (5, 79, 1), (6, 76, 2)], [(0, 74, 2), (2, 79, 2), (4, 81, 2), (6, 79, 2)],
       [(0, 76, 2), (2, 72, 2), (4, 76, 2), (6, 81, 2)], [(0, 77, 2), (2, 76, 2), (4, 74, 2), (6, 72, 2)]]
# per-flavour settings: kick gain, tom gain, shaker gain, bass pattern, arp (steps per bar, instrument), melody instrument, octave shift, wood gain
FL = {0: dict(k=.10, tom=0, sh=.05, bs='half', arp=(8, 'bell'), mel='soft', oct=0, wd=0),
      1: dict(k=0, tom=.20, sh=.05, bs='q', arp=(8, 'pluck'), mel='soft', oct=0, wd=0),
      2: dict(k=.12, tom=0, sh=.06, bs='half', arp=(16, 'bell'), mel='soft', oct=12, wd=0),
      3: dict(k=.10, tom=0, sh=.07, bs='off', arp=(8, 'pluck'), mel='soft', oct=0, wd=0),
      4: dict(k=.08, tom=0, sh=.04, bs='off', arp=(8, 'pizz'), mel='marimba', oct=0, wd=.10),
      5: dict(k=.10, tom=0, sh=.0, bs='half', arp=(16, 'pizz'), mel='marimba', oct=12, wd=.07),
      6: dict(k=.10, tom=0, sh=.05, bs='half', arp=(8, 'bell'), mel='soft', oct=0, wd=0)}
arr = ev.get('arr') or []
def seg_at(t):
    for a in arr:
        if a[0] <= t < a[1]: return a
    return None
PAD = np.zeros((2, N), np.float32); RHY = np.zeros((2, N), np.float32); BASS = np.zeros((2, N), np.float32)
ARP = np.zeros((2, N), np.float32); MELB = np.zeros((2, N), np.float32); FX = np.zeros((2, N), np.float32)
K = kick(); SHK = shaker(); WD = wood(); TOM = tom()
EG = {1: .6, 2: .85, 3: 1.0}
for b in range(int(DUR / BAR) + 1):
    t0 = b * BAR
    if t0 >= DUR: break
    a = seg_at(t0 + 1e-6)
    if a is None: continue
    en = int(a[2]); fl = int(a[6]) if len(a) > 6 else 0; F = FL[fl]; g = EG.get(en, .8)
    ch = CH[b % 4]
    L, R = padchord(ch['pad'], BAR + .6); i0 = int(t0 * SR); gp = .075 * (1.0 if en >= 2 else 1.2)
    PAD[0, i0:i0 + len(L)] += (L * gp)[:N - i0]; PAD[1, i0:i0 + len(R)] += (R * gp)[:N - i0]
    bi = int(round((t0 - a[0]) / BAR))
    # arp
    steps, inst = F['arp']; seq = [0, 1, 2, 3, 2, 1, 2, 1] if steps == 8 else [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 1, 2, 1]
    for k in range(steps):
        if en == 1 and k % 2 == 1 and steps == 8: continue
        m = ch['arp'][seq[k % len(seq)]]
        tt = t0 + k * BAR / steps
        if inst == 'bell': w = bell(mtof(m), 1.0); gg = .10
        elif inst == 'pizz': w = pluck(mtof(m), .22, .06); gg = .15
        else: w = pluck(mtof(m), .5, .16); gg = .12
        put(ARP, tt, w, gg * g, -.35 if k % 2 else .35)
    # rhythm
    if en >= 2:
        if F['k']:
            for k in (0, 2): put(RHY, t0 + k * BEAT, K, F['k'] * g)
        if F['tom']:
            for k in (0, 2): put(RHY, t0 + k * BEAT, TOM, F['tom'] * g)
            put(RHY, t0 + 3.5 * BEAT, TOM, F['tom'] * .5 * g)
        if F['sh']:
            for k in range(8): put(RHY, t0 + k * BEAT / 2 + (BEAT / 2 if False else 0), SHK, F['sh'] * 1.8 * (1.0 if k % 2 else .7) * g, .2)
        if F['wd']:
            for k in (1, 3): put(RHY, t0 + k * BEAT, WD, F['wd'] * g, -.2)
            if fl == 5:
                for k in range(16): put(RHY, t0 + k * BEAT / 4, WD, F['wd'] * .35 * g, .25)
    # bass
    if en >= 2:
        bf = mtof(ch['bass']); pat = {'q': [(0, 1), (1, 1), (2, 1), (3, 1)], 'half': [(0, 2), (2, 2)], 'off': [(0, 1.5), (2, .5), (2.5, .5), (3.5, .5)]}[F['bs']]
        for off, dd in pat: put(BASS, t0 + off * BEAT, bass(bf, dd * BEAT * .92), .12 * g)
    # melody
    if en >= 3 or (en == 2 and fl in (4, 5) and bi % 2 == 1):
        for (e8, m, ln) in MEL[b % 4]:
            mm = m + F['oct']; d = ln * BEAT / 2 * .95; tt = t0 + e8 * BEAT / 2
            if F['mel'] == 'marimba': put(MELB, tt, marimba(mtof(mm), .7), .22, .1)
            else: put(MELB, tt, soft(mm, d), .11, .1)
    # scene-start chime
    if bi == 0:
        put(FX, t0 + .02, chimeN([84, 88, 91, 88, 84, 91][b % 6]), .08)
# transitions whoosh (from the engine)
for t, n in ev['snd']:
    if n == 'whoosh': put(FX, t, whoosh(), .035)

# ---------------- mix ----------------
def make_ir(sec, seed):
    r = np.random.default_rng(seed); n = int(sec * SR); t_ = np.arange(n) / SR
    return fft_filter((r.standard_normal(n) * np.exp(-t_ / (sec / 4.5))).astype(np.float32), 150, 5000)
def reverb(bus, sec, wet):
    res = np.zeros_like(bus)
    for c_ in (0, 1):
        ir = make_ir(sec, 11 + c_); Ln = len(bus[c_]) + len(ir); n = 1 << (Ln - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(bus[c_], n) * np.fft.rfft(ir, n), n)[:len(bus[c_])]
        res[c_] = (y / max(1e-9, np.abs(ir).sum() * .05) * wet).astype(np.float32)
    return res
WET = PAD + ARP + MELB
mix = PAD + ARP + MELB + RHY + BASS + FX
mix += reverb(WET, 2.2, .20); del WET, PAD, ARP, MELB, RHY, BASS, FX
e = int(DUR * SR); mix = mix[:, :e]
if os.environ.get('VOICE'):
    wv = wave.open(os.environ['VOICE']); vs = np.frombuffer(wv.readframes(wv.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    vs = np.pad(vs, (0, max(0, e - len(vs))))[:e]; vs = fft_filter(vs, lo=80)
    venv = np.clip(smooth(np.abs(vs), int(.2 * SR)) / .05, 0, 1)
    duck = 1 - .5 * smooth(venv, int(.4 * SR))
    mix = mix * duck[None, :].astype(np.float32)
    vb = np.stack([vs, vs]); vb = vb + reverb(vb, .9, .05)
    mix = mix * 1.0 + vb * 1.25
    print('voice mixed')
for c_ in (0, 1): mix[c_] = fft_filter(fft_filter(mix[c_], lo=60), hi=9500)
f_in = int(.8 * SR); f_out = int(2.0 * SR); mix[:, :f_in] *= np.linspace(0, 1, f_in); mix[:, -f_out:] *= np.linspace(1, 0, f_out)
rms = np.sqrt((mix ** 2).mean()); mix = mix * (10 ** (-17 / 20) / max(rms, 1e-9))
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
pk = np.abs(mix).max()
if pk > .86: mix = mix * (.86 / pk)
w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix.T * 32767).astype(np.int16).tobytes()); w.close()
print('done, peak %.2f' % np.abs(mix).max())

# usage: VOICE=voice.wav python3 audio7.py events.json out.wav     (BPM env, default 72)
# Score for THE COST OF OBSESSION (numpy only). Heartbeat motif; sections by flavour:
#  0 cold open / etymology  1 science  2 builders  3 anime (taiko + koto)  4 cost (tolling, sparse)
#  5 the test (ticking clock)  6 blueprint (lift to the relative major)  7 the vow / end (full)
# Ear comfort: no constant drone, thumps are short, soft timbres, mix 60 Hz - 9.5 kHz, music ducks under the voice.
import sys, json, wave, os, numpy as np
SR = 44100
ev = json.load(open(sys.argv[1])); out = sys.argv[2]
DUR = ev['dur']; N = int(DUR * SR) + SR
BPM = float(os.environ.get('BPM', 96)); BEAT = 60 / BPM; BAR = BEAT * 4
rng = np.random.default_rng(7)
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
def smooth(x, n): return np.convolve(x, np.ones(n) / n, 'same')

# ---------------- instruments ----------------
def thump(f=62, d=.32):
    t = T(d); fr = f * (1 + .8 * np.exp(-t * 40)); y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 14)
    return (y * np.minimum(1, t / .004)).astype(np.float32)
def heart():
    a = thump(66, .3); b = np.zeros(int(.5 * SR), np.float32); b[:len(a)] += a; s = int(.26 * SR); c2 = thump(54, .26) * .7; b[s:s + len(c2)] += c2[:len(b) - s]; return b
def taiko(f=88):
    t = T(.9); fr = f * (1 + .9 * np.exp(-t * 22)); y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 4.5)
    n = fft_filter(noise(.9), 200, 2500) * np.exp(-t * 14) * .35
    return ((y + n) * np.minimum(1, t / .003)).astype(np.float32)
def tick():
    t = T(.06); return (fft_filter(noise(.06), 1800, 5200) * np.exp(-t * 120) * 1.8 + np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 160) * .25).astype(np.float32)
def pluck(f, d=.6, dec=.2):
    t = T(d); y = np.sin(2 * np.pi * f * t) + .32 * np.sin(4 * np.pi * f * t) + .1 * np.sin(6 * np.pi * f * t)
    return (y * np.minimum(1, t / .003) * np.exp(-t / dec)).astype(np.float32)
def koto(f):
    t = T(1.2); y = np.sin(2 * np.pi * f * t) * np.exp(-t / .5) + .5 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / .2) + .25 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / .1)
    return (y * np.minimum(1, t / .002)).astype(np.float32)
def flute(m, dur):
    f = mtof(m); t = T(dur + .3); vib = 1 + .006 * np.sin(2 * np.pi * 5.3 * t) * np.minimum(1, t / .5); ph = 2 * np.pi * np.cumsum(f * vib) / SR
    y = np.sin(ph) + .12 * np.sin(2 * ph) + .06 * fft_filter(noise(dur + .3), 1500, 5000)
    return (y * np.minimum(1, t / .08) * np.where(t < dur, 1, np.exp(-(t - dur) * 8))).astype(np.float32)
def strings(notes, d):
    t = T(d); e = np.minimum(1, t / 1.0) * np.minimum(1, (d - t) / 1.0); L = np.zeros(len(t), np.float32); R = np.zeros(len(t), np.float32)
    for m in notes:
        f = mtof(m)
        for buf, det in ((L, .9985), (R, 1.0015)):
            ff = f * det * (1 + .002 * np.sin(2 * np.pi * 5 * t)); ph = 2 * np.pi * np.cumsum(ff) / SR
            buf += (np.sin(ph) + .5 * np.sin(2 * ph) + .33 * np.sin(3 * ph) + .22 * np.sin(4 * ph)).astype(np.float32) * .5
    return fft_filter(L * e, None, 2800), fft_filter(R * e, None, 2800)
def bell(f, d=2.4):
    t = T(d); s = np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 1.5) + .3 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 3)
    return (s * np.minimum(1, t / .004) * np.exp(-t / 1.1)).astype(np.float32)
def bass(f, d):
    t = T(d); y = np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t); return (y * np.minimum(1, t / .01) * np.exp(-t / (d * .8))).astype(np.float32)
def boom():
    t = T(1.4); f = 70 * np.exp(-t * 1.4) + 40; return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6)).astype(np.float32)
def crash(d=2.4):
    t = T(d); return (fft_filter(noise(d), 2500, 8500) * np.exp(-t * 1.9)).astype(np.float32)
def whoosh():
    t = T(.8); return (fft_filter(noise(.8), 500, 2600) * np.sin(np.pi * t / .8) ** 2).astype(np.float32)
def swell(d, hi=6000):
    t = T(d); return (fft_filter(noise(d), 600, hi) * (t / d) ** 2.2).astype(np.float32)
def revswell(d):
    t = T(d); y = np.sin(2 * np.pi * np.cumsum(180 * (4 ** (t / d))) / SR) * (t / d) ** 3; return y.astype(np.float32)

# COST OF OBSESSION world: adrenaline engine (obsession) vs steady metronome (discipline) vs dark tolls (cost).
# flavours: 0 hook  1 discipline (metronome)  2 obsession (drive)  3 cost (sparse, tolling)  4 trap (tense ostinato)  5 leash (major, uplifting)  6 end (fire)
CH = {'m': [dict(root=33, pad=[45, 48, 52], arp=[57, 60, 64, 69]), dict(root=29, pad=[41, 45, 48], arp=[53, 57, 60, 65]),
            dict(root=36, pad=[48, 52, 55], arp=[55, 60, 64, 67]), dict(root=31, pad=[43, 47, 50], arp=[55, 59, 62, 67])],
      'u': [dict(root=36, pad=[48, 52, 55], arp=[60, 64, 67, 72]), dict(root=31, pad=[43, 47, 50], arp=[59, 62, 67, 71]),
            dict(root=33, pad=[45, 48, 52], arp=[57, 60, 64, 69]), dict(root=29, pad=[41, 45, 48], arp=[53, 57, 60, 65])]}
MEL = [[(0, 69, 3), (3, 72, 1), (4, 76, 4)], [(0, 65, 3), (3, 69, 1), (4, 72, 4)], [(0, 67, 3), (3, 72, 1), (4, 76, 4)], [(0, 71, 3), (3, 67, 1), (4, 72, 4)]]
arr = ev.get('arr') or []
def seg_at(t):
    for a in arr:
        if a[0] <= t < a[1]: return a
    return None
PADB = np.zeros((2, N), np.float32); RHY = np.zeros((2, N), np.float32); BASS = np.zeros((2, N), np.float32)
ARP = np.zeros((2, N), np.float32); MELB = np.zeros((2, N), np.float32); FX = np.zeros((2, N), np.float32)
HEART = heart(); TICK = tick(); TAI = taiko(60)
EG = {1: .6, 2: .85, 3: 1.0, 4: 1.2}
def crackle(d):
    t = T(d); n = np.zeros(len(t), np.float32)
    for _ in range(int(d * 14)):
        i = int(rng.integers(0, len(t) - 400)); k = int(rng.integers(40, 300)); n[i:i + k] += (rng.standard_normal(k) * np.exp(-np.arange(k) / (k / 4))).astype(np.float32) * rng.uniform(.2, 1)
    return fft_filter(n, 400, 7000)
for b in range(int(DUR / BAR) + 1):
    t0 = b * BAR
    if t0 >= DUR: break
    a = seg_at(t0 + 1e-6)
    if a is None: continue
    en = int(a[2]); fl = int(a[6]) if len(a) > 6 else 0; g = EG.get(en, .85)
    ch = CH['u' if (fl in (5, 6) or (os.environ.get('MAJ') and fl != 0)) else 'm'][b % 4]
    bi = int(round((t0 - a[0]) / BAR)); nb = max(1, int(round((a[1] - a[0]) / BAR))); left = nb - bi
    L, R = strings(ch['pad'], BAR + 1.6); i0 = int(t0 * SR); gp = {0: .07, 1: .06, 2: .09, 3: .05, 4: .08, 5: .12, 6: .13}[fl] * (1.2 if en == 1 else 1.0)
    PADB[0, i0:i0 + len(L)] += (L * gp)[:N - i0]; PADB[1, i0:i0 + len(R)] += (R * gp)[:N - i0]
    if fl == 0:
        put(RHY, t0, HEART, .30 * g); put(RHY, t0 + 2 * BEAT, HEART, .22 * g)
        for k in range(8): put(RHY, t0 + k * BAR / 8, TICK, .10 + .08 * (k % 2 == 0))
        put(RHY, t0, TAI, .22 * g); put(RHY, t0 + 2 * BEAT, TAI, .16 * g)
        for k in range(4): put(ARP, t0 + k * BEAT, pluck(mtof(ch['arp'][[0, 2, 1, 3][k]] + 12), .5, .18), .07 * g, .3 * (1 if k % 2 else -1))
    if fl == 1:
        for k in range(4): put(RHY, t0 + k * BEAT, TICK, .30 if k == 0 else .20)
        for k in range(4): put(ARP, t0 + k * BEAT + BEAT / 2, pluck(mtof(ch['arp'][[0, 1, 2, 1][k]]), .6, .22), .09 * g, -.3 if k % 2 else .3)
        if en >= 2: put(BASS, t0, bass(mtof(ch['root'] + 12), BEAT * 1.8), .10)
    if fl == 2:
        seq = [0, 1, 2, 3, 2, 1, 3, 2]
        for k in range(8):
            m = ch['arp'][seq[k]] + (12 if (b + k) % 8 == 7 else 0); put(ARP, t0 + k * BAR / 8, pluck(mtof(m), .4, .13), .12 * g, -.35 if k % 2 else .35)
        for k in range(4): put(RHY, t0 + k * BEAT, thump(56, .3), .30 * g if k % 2 == 0 else .18 * g)
        put(RHY, t0, TAI, .32 * g); put(RHY, t0 + 2 * BEAT, TAI, .26 * g); put(RHY, t0 + 3.5 * BEAT, TAI, .16 * g)
        bf = mtof(ch['root'] + 12)
        for k in range(4): put(BASS, t0 + k * BEAT, bass(bf, BEAT * .9), .15 * g)
    if fl == 3:
        put(RHY, t0, HEART, .26 * g)
        if bi % 2 == 0: put(FX, t0, bell(mtof(ch['arp'][0] - 12), 3.6), .15 * max(.35, 1 - .08 * bi))
        if b % 3 == 0: put(FX, t0 + 2 * BEAT, boom(), .12)
        if en >= 3 and bi % 2 == 1: put(RHY, t0 + 1.5 * BEAT, TICK, .18)
    if fl == 4:
        for k in range(16): put(RHY, t0 + k * BAR / 16, TICK, .13 if k % 4 else .24)
        bf = mtof(ch['root'] + 12)
        for k in range(8): put(BASS, t0 + k * BAR / 8, bass(bf * (1.06 if (b + k) % 4 == 3 else 1), BEAT * .42), .12 * g)
        put(RHY, t0, thump(54, .34), .26 * g); put(RHY, t0 + 2 * BEAT, thump(54, .34), .2 * g)
        if en >= 3:
            for k in range(4): put(ARP, t0 + k * BEAT, pluck(mtof(ch['arp'][3 - k] + 12), .4, .12), .08 * g, .3 * (1 if k % 2 else -1))
    if fl == 5:
        seq = [0, 1, 2, 3, 2, 1, 2, 1]
        for k in range(8): put(ARP, t0 + k * BAR / 8, pluck(mtof(ch['arp'][seq[k]]), .55, .24), .11 * g, -.3 if k % 2 else .3)
        put(RHY, t0, thump(58, .34), .22 * g); put(RHY, t0 + 2 * BEAT, thump(58, .34), .18 * g)
        put(BASS, t0, bass(mtof(ch['root'] + 12), BEAT * 1.9), .13 * g)
        if bi % 2 == 0: put(FX, t0, bell(mtof(ch['arp'][1] + 12), 2.4), .05, .2)
    if fl == 6:
        put(FX, t0, crackle(BAR), .22); put(FX, t0 + BEAT, bell(mtof(ch['arp'][bi % 4] + 12), 2.4), .06, .2)
    if (en >= 3 and fl in (0, 2, 4)) or (fl == 5 and en >= 2) or fl == 6:
        for (e, m, ln) in MEL[b % 4]:
            put(MELB, t0 + e * BEAT, flute(m + (0 if fl != 5 else 0), ln * BEAT * .95), .08 if fl in (0, 2, 4) else .11, .1)
    if bi == 0:
        put(FX, t0, crash(2.8), .05)
        if a[4]: put(FX, t0, boom(), .26); put(FX, t0, crash(3.2), .12)
    if a[3] and left <= 2:
        put(FX, t0, swell(BAR, 5500 if left == 1 else 3500), .11 if left == 1 else .05)
        if left == 1: put(FX, t0 + BAR * .35, revswell(BAR * .65), .07)
# hits from the picture (punches)
for t, n in ev['snd']:
    if n == 'hit': put(FX, t, boom(), .15); put(FX, t, crash(1.4), .045)
    elif n == 'whoosh': put(FX, t, whoosh(), .04)

# ---------------- mix ----------------
def make_ir(sec, seed):
    r = np.random.default_rng(seed); n = int(sec * SR); t_ = np.arange(n) / SR
    return fft_filter((r.standard_normal(n) * np.exp(-t_ / (sec / 4.5))).astype(np.float32), 140, 5000)
def reverb(bus, sec, wet):
    res = np.zeros_like(bus)
    for c_ in (0, 1):
        ir = make_ir(sec, 11 + c_); Ln = len(bus[c_]) + len(ir); n = 1 << (Ln - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(bus[c_], n) * np.fft.rfft(ir, n), n)[:len(bus[c_])]
        res[c_] = (y / max(1e-9, np.abs(ir).sum() * .05) * wet).astype(np.float32)
    return res
WET = PADB + ARP + MELB + FX * .6
mix = PADB + ARP + MELB + RHY + BASS + FX
mix += reverb(WET, 2.6, .22); del WET, PADB, ARP, MELB, RHY, BASS, FX
e = int(DUR * SR); mix = mix[:, :e]
if os.environ.get('VOICE'):
    wv = wave.open(os.environ['VOICE']); vs = np.frombuffer(wv.readframes(wv.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    vs = np.pad(vs, (0, max(0, e - len(vs))))[:e]; vs = fft_filter(vs, lo=70)
    venv = np.clip(smooth(np.abs(vs), int(.2 * SR)) / .05, 0, 1)
    duck = 1 - .58 * smooth(venv, int(.45 * SR))
    mix = mix * duck[None, :].astype(np.float32)
    vb = np.stack([vs, vs]); vb = vb + reverb(vb, 1.1, .05)
    mix = mix + vb * 1.3
    print('voice mixed')
for c_ in (0, 1): mix[c_] = fft_filter(fft_filter(mix[c_], lo=60), hi=9500)
f_in = int(1.0 * SR); f_out = int(3.0 * SR); mix[:, :f_in] *= np.linspace(0, 1, f_in); mix[:, -f_out:] *= np.linspace(1, 0, f_out)
rms = np.sqrt((mix ** 2).mean()); mix = mix * (10 ** (-17 / 20) / max(rms, 1e-9))
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
pk = np.abs(mix).max()
if pk > .86: mix = mix * (.86 / pk)
w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix.T * 32767).astype(np.int16).tobytes()); w.close()
print('done, peak %.2f' % np.abs(mix).max())

# usage: python3 audio3.py events.json out.wav
# Warm, ear-friendly score (numpy only). Lessons from Bulletin 06 (measured: 57% of energy under 100 Hz, hiss and
# whine beds, per-character typing clicks, sudden risers/hits, dead-silent gaps):
#   * no sub-bass drone, no mains hum, no hiss bed, no sawtooth, no hidden high tones
#   * a continuous chord bed (I - vi - IV - V in D) so there are never silent gaps
#   * every sound effect is soft, band-limited and quiet; nothing is sudden
#   * master high-pass 55 Hz, low-pass 9 kHz, gentle level normalisation, peak <= -2 dBFS
import sys, json, wave, numpy as np
SR = 44100
ev = json.load(open(sys.argv[1])); out = sys.argv[2]
DUR = ev['dur']; N = int(DUR * SR) + SR
rng = np.random.default_rng(7)
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def T(d): return np.arange(int(d * SR)) / SR

def put(buf, t, a, g=1., pan=0.):
    i = int(t * SR)
    if i < 0 or i >= buf.shape[1]: return
    a = a[:buf.shape[1] - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(a)] += a * g * l; buf[1, i:i + len(a)] += a * g * r

def fft_filter(x, lo=None, hi=None):
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR); H = np.ones_like(f)
    if lo: H = H / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi: H = H / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * H, n).astype(np.float32)

def smooth(x, k):
    k = max(1, int(k)); cs = np.cumsum(np.insert(x, 0, 0)); y = (cs[k:] - cs[:-k]) / k
    return np.pad(y, (k // 2, len(x) - len(y) - k // 2), mode='edge')

import os
BPM = float(os.environ.get('BPM', 76)); BEAT = 60 / BPM; BAR = BEAT * 4
CH = [dict(bass=38, pad=[50, 57, 61, 66]),   # Dmaj7
      dict(bass=35, pad=[50, 54, 57, 61]),   # Bm9-ish
      dict(bass=43, pad=[50, 55, 59, 66]),   # Gmaj7
      dict(bass=45, pad=[52, 57, 61, 66])]   # A6/9

# ---------- layer envelopes from the timeline's music cues ----------
W = {'calm': (1, .7, 0, 0, 0), 'flow': (1, .8, .7, 0, 0), 'drive': (1, .9, .9, .8, .5),
     'rise': (1, .8, .9, .6, .3), 'outro': (1, .6, .3, .7, 0)}
LAYERS = ['pad', 'bass', 'arp', 'bell', 'shk']
tt = np.arange(N) / SR
env = {l: np.zeros(N, dtype=np.float32) for l in LAYERS}
cues = ev.get('music', [])
for li, l in enumerate(LAYERS):
    pts_t = [0.]; pts_v = [0.]
    for a, b, st, lvl in cues:
        w = W.get(st, W['calm'])[li] * lvl
        pts_t += [a + .9, b - .9]; pts_v += [w, w]
    pts_t.append(DUR); pts_v.append(pts_v[-1])
    e = np.interp(tt, pts_t, pts_v)
    env[l] = smooth(e, SR * .8).astype(np.float32)
del tt

MUS = np.zeros((2, N), dtype=np.float32)
SFX = np.zeros((2, N), dtype=np.float32)

# ---------- pad and bass (continuous) ----------
nb = int(DUR / BAR) + 2
for b in range(nb):
    t0 = b * BAR; ch = CH[b % 4]
    if t0 >= DUR: break
    lv = float(env['pad'][min(N - 1, int((t0 + BAR / 2) * SR))])
    if lv > .01:
        d = BAR + 1.2; tt_ = T(d)
        e_ = np.minimum(1, tt_ / .9) * np.minimum(1, (d - tt_) / 1.2)
        for ii, m in enumerate(ch['pad']):
            f = mtof(m + (12 if ii >= 1 else 0))
            for c_, det in ((0, .9991), (1, 1.0009)):
                ff = f * det
                s = np.sin(2 * np.pi * ff * tt_) + .22 * np.sin(4 * np.pi * ff * tt_) + .08 * np.sin(6 * np.pi * ff * tt_)
                MUS[c_, int(t0 * SR):int(t0 * SR) + len(tt_)][:N] += (s * e_ * .026 * lv)[:N - int(t0 * SR)]
    lb = float(env['bass'][min(N - 1, int((t0 + BAR / 2) * SR))])
    if lb > .01:
        for k in (0, 2):
            d = BEAT * 2.4; tt_ = T(d); f = mtof(ch['bass'])
            s = (np.sin(2 * np.pi * f * tt_) + .35 * np.sin(4 * np.pi * f * tt_)) * np.minimum(1, tt_ / .03) * np.exp(-tt_ / 1.1)
            put(MUS, t0 + k * BEAT, s.astype(np.float32), .05 * lb, 0.)

# ---------- arpeggio, bell motif, shaker ----------
def pluck(f, d=.9):
    tt_ = T(d)
    return ((np.sin(2 * np.pi * f * tt_) + .28 * np.sin(4 * np.pi * f * tt_)) * np.minimum(1, tt_ / .004) * np.exp(-tt_ / .32)).astype(np.float32)
def bell(f, d=1.8):
    tt_ = T(d)
    s = np.sin(2 * np.pi * f * tt_) + .30 * np.sin(2 * np.pi * f * 2.0 * tt_) * np.exp(-tt_ * 2) + .10 * np.sin(2 * np.pi * f * 3.01 * tt_) * np.exp(-tt_ * 4)
    return (s * np.minimum(1, tt_ / .006) * np.exp(-tt_ / .75)).astype(np.float32)
seq = [0, 2, 1, 3, 2, 3, 1, 2]
ns = fft_filter(rng.standard_normal(int(.12 * SR)).astype(np.float32), 3500, 7000)
for b in range(nb):
    t0 = b * BAR; ch = CH[b % 4]
    if t0 >= DUR: break
    for k in range(8):
        tn = t0 + k * BEAT / 2
        if tn >= DUR: break
        ia = min(N - 1, int(tn * SR))
        la = float(env['arp'][ia])
        if la > .02:
            put(MUS, tn, pluck(mtof(ch['pad'][seq[k]] + 12)), .085 * la, -.35 if k % 2 else .35)
        ls = float(env['shk'][ia])
        if ls > .02 and k % 2 == 1:
            tt_ = T(.12); put(MUS, tn, (ns * np.exp(-tt_ / .03)).astype(np.float32), .05 * ls, .2 if (k // 2) % 2 else -.2)
    lbl = float(env['bell'][min(N - 1, int((t0 + 1) * SR))])
    if lbl > .02:
        if b % 2 == 0:
            put(MUS, t0, bell(mtof(ch['pad'][3] + 12)), .075 * lbl, .15)
            put(MUS, t0 + BEAT * 2.5, bell(mtof(ch['pad'][2] + 12)), .06 * lbl, -.15)
        else:
            put(MUS, t0 + BEAT, bell(mtof(ch['pad'][1] + 24)), .06 * lbl, .1)
            put(MUS, t0 + BEAT * 3, bell(mtof(ch['pad'][3] + 12)), .06 * lbl, -.1)

# ---------- soft sound effects ----------
def chime():
    y = np.zeros(int(1.6 * SR), dtype=np.float32)
    for dt, m in ((0, 81), (.14, 85)):
        b_ = bell(mtof(m), 1.4); y[int(dt * SR):int(dt * SR) + len(b_)] += b_[:len(y) - int(dt * SR)]
    return y * .9
def tick(f=1100):
    tt_ = T(.06); return (np.sin(2 * np.pi * f * tt_) * np.exp(-tt_ * 85) * .8).astype(np.float32)
def coin():
    tt_ = T(.22); s = np.sin(2 * np.pi * 1760 * tt_) + .5 * np.sin(2 * np.pi * 2349 * tt_ * (tt_ > .05)); return (s * np.exp(-tt_ * 16) * .5).astype(np.float32)
def pop():
    tt_ = T(.14); f = 420 + 520 * np.minimum(tt_ / .05, 1); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt_ * 26)).astype(np.float32)
def hit():
    tt_ = T(.6); f = 70 + 80 * np.exp(-tt_ * 18); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt_ * 7) * 1.0).astype(np.float32)
def riser(d=3.2):
    n = rng.standard_normal(int(d * SR)).astype(np.float32); n = fft_filter(n, 350, 2600)
    tt_ = T(d); return (n * (tt_ / d) ** 2 * np.minimum(1, (d - tt_) / .4) * 1.4).astype(np.float32)
def swell():
    d = 3.6; tt_ = T(d); y = sum(np.sin(2 * np.pi * mtof(m) * tt_) for m in (50, 57, 62))
    return (y * np.sin(np.pi * tt_ / d) ** 2 * .45).astype(np.float32)
SND = {'chime': (chime, .10, 0), 'tick': (tick, .05, .1), 'coin': (coin, .05, .25), 'pop': (pop, .06, 0),
       'hit': (hit, .16, 0), 'riser': (riser, .05, 0), 'swell': (swell, .06, 0)}

def ding(k):
    m = [74, 76, 78, 81, 83, 86, 90, 93][k]; return bell(mtof(m), 1.1) * 1.1
def pullfx():
    n = rng.standard_normal(int(.35 * SR)).astype(np.float32); n = fft_filter(n, 300, 2200); tt_ = T(.35)
    return (n * np.sin(np.pi * tt_ / .35) ** 2 * 1.6).astype(np.float32)
def lose():
    tt_ = T(.5); f = 330 - 110 * np.minimum(tt_ / .4, 1); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt_ * 6) * .8).astype(np.float32)
def jackpot():
    y = np.zeros(int(2.4 * SR), dtype=np.float32)
    for i, m in enumerate((74, 78, 81, 86, 90, 93)):
        b_ = bell(mtof(m), 1.3); o = int(i * .07 * SR); y[o:o + len(b_)] += b_[:len(y) - o] * .8
    for j in range(22):
        c_ = coin(); o = int((.3 + j * .055 + rng.random() * .03) * SR); y[o:o + len(c_)] += c_[:len(y) - o] * .35
    return y
def whoosh():
    n = rng.standard_normal(int(.5 * SR)).astype(np.float32); n = fft_filter(n, 500, 3200); tt_ = T(.5)
    return (n * np.sin(np.pi * tt_ / .5) ** 2 * 1.4).astype(np.float32)
SND.update({'whoosh': (whoosh, .045, 0)})
SND.update({'pull': (pullfx, .07, 0), 'lose': (lose, .07, 0), 'jackpot': (jackpot, .10, 0)})
for k_ in range(8): SND['ding%d' % k_] = ((lambda kk=k_: ding(kk)), .07, .05 * (k_ % 3 - 1))
for t, n in ev['snd']:
    if n in SND:
        fn, g, p = SND[n]; put(SFX, t, fn(), g, p)
for t in ev.get('clicks', []):
    put(SFX, t, tick(rng.uniform(900, 1400)), .03, rng.uniform(-.2, .2))

# ---------- light reverb, master ----------
def make_ir(sec, seed):
    r = np.random.default_rng(seed); n = int(sec * SR); t_ = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t_ / (sec / 4.5)); return fft_filter(ir.astype(np.float32), 120, 4500)
def reverb(bus, sec, wet):
    res = np.zeros_like(bus)
    for c_ in (0, 1):
        ir = make_ir(sec, 11 + c_); L = len(bus[c_]) + len(ir)
        n = 1 << (L - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(bus[c_], n) * np.fft.rfft(ir, n), n)[:len(bus[c_])]
        res[c_] = (y / max(1e-9, np.abs(ir).sum() * .05) * wet).astype(np.float32)
    return res
mix = MUS + reverb(MUS, 2.2, .18) + SFX + reverb(SFX, 1.6, .25)
del MUS, SFX
e = int(DUR * SR); mix = mix[:, :e]
import os
if os.environ.get('VOICE'):
    wv = wave.open(os.environ['VOICE']); vs = np.frombuffer(wv.readframes(wv.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    vs = np.pad(vs, (0, max(0, e - len(vs))))[:e]
    vs = fft_filter(vs, lo=85)
    venv = np.clip(smooth(np.abs(vs), int(.22 * SR)) / .05, 0, 1)
    duck = 1 - .55 * smooth(venv, int(.35 * SR))          # music and effects sit about 7 dB lower under the voice
    mix = mix * duck[None, :].astype(np.float32)
    vb = np.stack([vs, vs]); vb = vb + reverb(np.pad(vb, ((0, 0), (0, 0))), 1.0, .06)
    mix = mix + vb * 1.25
    print('voice mixed; voice rms dBFS %.1f' % (20 * np.log10(np.sqrt((vs ** 2).mean()) + 1e-9)))
for c_ in (0, 1):
    mix[c_] = fft_filter(fft_filter(mix[c_], lo=55), hi=9000)
f_in = int(.6 * SR); f_out = int(1.6 * SR)
mix[:, :f_in] *= np.linspace(0, 1, f_in); mix[:, -f_out:] *= np.linspace(1, 0, f_out)
rms = np.sqrt((mix ** 2).mean()); target = 10 ** (-19 / 20)
mix = mix * (target / max(rms, 1e-9))
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
pk = np.abs(mix).max()
if pk > .8: mix = mix * (.8 / pk)
w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix.T * 32767).astype(np.int16).tobytes()); w.close()

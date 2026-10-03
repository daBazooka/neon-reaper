# usage: python3 voice_animals.py animals.json out.wav [voice]   (VSPEED env)
# Voice drives the timeline: each line is synthesised, scenes are laid out one after another.
import sys, json, wave, os, hashlib, numpy as np
from kokoro_onnx import Kokoro
sc = json.load(open(sys.argv[1])); out = sys.argv[2]; voice = sys.argv[3] if len(sys.argv) > 3 else 'bm_george'
VS = float(os.environ.get('VSPEED', 1.0)); SR = 44100; R = float(os.environ.get('PITCH', 1.0)); DEEP = bool(os.environ.get('DEEP'))
def warm(x):
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR); H = 1 + 1.1 * np.exp(-((f - 120) / 80) ** 2) + .25 * np.exp(-((f - 260) / 140) ** 2)
    y = np.fft.irfft(X * H, n).astype(np.float32); return np.tanh(y * 1.25) / np.tanh(1.25)
k = Kokoro('/tmp/kok/kokoro.onnx', '/tmp/kok/voices.bin')
chunks = []; WL = []; T = []; t = 0.0
for s in sc['scenes']:
    start = t; t += s.get('lead', sc['lead']); lt = []
    for i, text in enumerate(s['lines']):
        os.makedirs('/tmp/vcache', exist_ok=True)
        ck = '/tmp/vcache/' + hashlib.sha1(f'{voice}|{VS * R}|{text}'.encode()).hexdigest() + '.npz'
        if os.path.exists(ck):
            z = np.load(ck); a = z['a']; sr = int(z['sr'])
        else:
            a, sr = k.create(text, voice=voice, speed=VS * R, lang='en-us' if voice[0] == 'a' else 'en-gb'); np.savez(ck, a=a, sr=sr)
        d = len(a) / sr * R; x = np.interp(np.arange(int(d * SR)) / SR, np.arange(len(a)) / sr * R, a).astype(np.float32)
        if DEEP: x = warm(x)
        f = int(.03 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
        ws = text.split(); env = np.convolve(np.abs(a), np.ones(int(.012 * sr)) / int(.012 * sr), 'same'); cum = np.cumsum(env); cum = cum / max(cum[-1], 1e-9)
        wts = [len(w) + (2 if w[-1] in '.,:;?!' else 0) for w in ws]; tot = sum(wts); acc = 0; wl = []
        for w, wt in zip(ws, wts):
            a_ = acc / tot; b_ = (acc + wt) / tot; acc += wt
            ts = np.searchsorted(cum, a_) / sr * R; te = np.searchsorted(cum, min(b_, .9999)) / sr * R
            wl.append([w, round(t + ts, 3), round(t + max(te, ts + .08), 3)])
        WL.append({'t0': round(t, 3), 't1': round(t + d, 3), 'words': wl}); lt.append(round(t - start, 3))
        chunks.append((t, x)); print(f'{s["id"]:4s} line {i} at {t - start:5.1f}s len {d:4.1f}s  {text[:50]}')
        t += d + (sc['gap'] if i < len(s['lines']) - 1 else 0)
    t += sc['tail']; dur = max(t - start, s.get('min', 0)); t = start + dur
    T.append({'id': s['id'], 'start': round(start, 3), 'dur': round(dur, 3), 'lines': lt})
N = int(t * SR) + SR; buf = np.zeros(N, np.float32)
for t0, x in chunks:
    i0 = int(t0 * SR); buf[i0:i0 + len(x)] += x[:N - i0]
w = wave.open(out, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(buf, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
json.dump(WL, open(out[:-4] + '.words.json', 'w')); json.dump({'total': round(t, 3), 'scenes': T}, open(out[:-4] + '.timing.json', 'w'))
print('total %.1fs' % t)

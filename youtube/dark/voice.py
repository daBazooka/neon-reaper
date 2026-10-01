# usage: python3 voice.py script.json events.json out.wav [voice]
# Neural narration (Kokoro, Apache-2.0) placed on the timeline. Each line is checked to fit before the next one.
import sys, json, wave, numpy as np
from kokoro_onnx import Kokoro
script = json.load(open(sys.argv[1])); ev = json.load(open(sys.argv[2])); out = sys.argv[3]
voice = sys.argv[4] if len(sys.argv) > 4 else 'af_heart'
SR = 44100; N = int(ev['dur'] * SR) + SR
k = Kokoro('/tmp/kok/kokoro.onnx', '/tmp/kok/voices.bin')
starts = script['starts']; lines = script['lines']
buf = np.zeros(N, dtype=np.float32); bad = 0; WL = []
import os
VS = float(os.environ.get('VSPEED', .96))
order = [s for s in starts]
for i, (seg, rel, text) in enumerate(lines):
    t0 = starts[seg] + rel
    nxt = None
    for seg2, rel2, _ in lines[i + 1:]:
        nxt = starts[seg2] + rel2; break
    end_seg = starts[seg] + script['durs'][seg]
    limit = min(end_seg, nxt if nxt is not None else end_seg) - .25
    speed = VS
    for _ in range(4):
        s, sr = k.create(text, voice=voice, speed=speed, lang='en-us' if voice[0] == 'a' else 'en-gb')
        d = len(s) / sr
        if t0 + d <= limit or speed >= 1.14: break
        speed += .05
    ok = t0 + d <= limit
    if not ok: bad += 1
    print(f'{seg:4s} {rel:5.1f}s  len {d:4.1f}s  speed {speed:.2f}  {"OK" if ok else "TOO LONG by %.1fs" % (t0 + d - limit)}  {text[:48]}')
    ws_ = text.split(); env_ = np.convolve(np.abs(s), np.ones(int(.012 * sr)) / int(.012 * sr), 'same'); cum_ = np.cumsum(env_); cum_ = cum_ / max(cum_[-1], 1e-9)
    wts = [len(w) + (2 if w[-1] in '.,:;?!' else 0) for w in ws_]; tot_ = sum(wts); acc_ = 0; wl = []
    for w, wt in zip(ws_, wts):
        a_ = acc_ / tot_; b_ = (acc_ + wt) / tot_; acc_ += wt
        ts_ = np.searchsorted(cum_, a_) / sr; te_ = np.searchsorted(cum_, min(b_, .9999)) / sr
        wl.append([w, round(t0 + ts_, 3), round(t0 + max(te_, ts_ + .08), 3)])
    WL.append({'t0': round(t0, 3), 't1': round(t0 + d, 3), 'words': wl})
    x = np.interp(np.arange(int(d * SR)) / SR, np.arange(len(s)) / sr, s).astype(np.float32)
    f = int(.03 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    i0 = int(t0 * SR); buf[i0:i0 + len(x)] += x[:N - i0]
w = wave.open(out, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(buf, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
json.dump(WL, open(out[:-4] + '.words.json', 'w'))
print('lines too long:', bad)

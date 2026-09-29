"""Generate the voice-over: one wav per line + vo/timing.js (used by the page for captions).
Needs: pip install kokoro-onnx soundfile ; model files kokoro.onnx + voices.bin in $KOKORO_DIR (default /tmp/tts)."""
import json, os, sys, soundfile as sf
from kokoro_onnx import Kokoro
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
kd = os.environ.get('KOKORO_DIR', '/tmp/tts')
S = json.load(open(f'{root}/vo/script.json'))
voice = sys.argv[1] if len(sys.argv) > 1 else S['voice']
out = os.environ.get('VO_OUT', f'{root}/vo/{voice}'); os.makedirs(out, exist_ok=True)
BAR = 240 / S['bpm']; BEAT = BAR / 4; LOOP = BAR * 18
k = Kokoro(f'{kd}/kokoro.onnx', f'{kd}/voices.bin')
lines = []
for i, L in enumerate(S['lines']):
    t0 = L['t']
    nxt = S['lines'][i + 1]['t'] if i + 1 < len(S['lines']) else LOOP - 0.3
    sp = S['speed']
    for _ in range(3):
        a, sr = k.create(L['text'], voice=voice, speed=sp, lang='en-us')
        d = len(a) / sr
        if t0 + d <= nxt - 0.12: break
        sp *= 1.04
    sf.write(f'{out}/line{i:02d}.wav', a, sr)
    print(f'{i:02d} start {t0:5.2f} dur {d:4.2f} end {t0+d:5.2f} next {nxt:5.2f} speed {sp:.2f}  {L["text"][:40]}')
    lines.append({'t': round(t0, 3), 'd': round(d, 3), 'text': L['text'], 'chapter': L['chapter']})
json.dump(lines, open(f'{out}/timing.json', 'w'), indent=1)
open(f'{root}/vo/timing.js', 'w').write('window.VO=' + json.dumps(lines) + ';')

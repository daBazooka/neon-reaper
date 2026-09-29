"""Voice-over: one wav per line + timing.js (used by the page for subtitles / sync).
usage: python3 make-voice.py <script.json> [voice]
Lines either have a fixed start "t", or follow the previous line (+ "gap" seconds).
Needs kokoro-onnx + soundfile; model files kokoro.onnx + voices.bin in $KOKORO_DIR (default /tmp/tts)."""
import json, os, sys, soundfile as sf
from kokoro_onnx import Kokoro
script = os.path.abspath(sys.argv[1]); S = json.load(open(script)); outdir = os.path.dirname(script)
voice = sys.argv[2] if len(sys.argv) > 2 else S['voice']
wd = os.path.join(outdir, voice); os.makedirs(wd, exist_ok=True)
k = Kokoro(f"{os.environ.get('KOKORO_DIR','/tmp/tts')}/kokoro.onnx", f"{os.environ.get('KOKORO_DIR','/tmp/tts')}/voices.bin")
lines = []; cur = S.get('start', 0.3)
for i, L in enumerate(S['lines']):
    t0 = L.get('t', cur)
    a, sr = k.create(L['text'], voice=voice, speed=S.get('speed', 1.0), lang='en-us'); d = len(a) / sr
    sf.write(f'{wd}/line{i:02d}.wav', a, sr)
    cur = t0 + d + L.get('gap', S.get('gap', .3))
    print(f'{i:02d} {t0:6.2f} +{d:4.2f} -> {t0+d:6.2f}  {L["text"][:50]}')
    lines.append({'t': round(t0, 3), 'd': round(d, 3), 'text': L['text'], 'chapter': L['chapter']})
json.dump(lines, open(f'{wd}/timing.json', 'w'), indent=1)
end = lines[-1]['t'] + lines[-1]['d']
open(f'{outdir}/timing.js', 'w').write('window.VO=' + json.dumps(lines) + ';window.VO_END=' + str(round(end, 3)) + ';')
print('end', end)

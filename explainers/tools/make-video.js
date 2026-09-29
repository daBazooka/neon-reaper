// Renders episode-01-zipper.html to an MP4 (1080x1920, 30fps, with soundtrack).
// Usage: NODE_PATH=$(npm root -g) node make-video.js <out.mp4> [ffmpeg-path] [seconds]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const out = process.argv[2] || 'episode-01-zipper.mp4';
const ffmpeg = process.argv[3] || 'ffmpeg';
const FPS = 30, LOOP = 18 * 4 * 60 / 110;
const secs = parseFloat(process.argv[4]) || LOOP;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  p.on('pageerror', e => console.error('pageerror', e.message));
  await p.goto('file://' + path.resolve(__dirname, '../episode-01-zipper.html') + '?t=0');
  await p.evaluate(() => document.fonts.ready);
  const wav = path.join(os.tmpdir(), 'nm-audio.raw');
  fs.writeFileSync(wav, Buffer.from(await p.evaluate(s => window.__audio(s), secs), 'base64'));
  const ff = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-f', 's16le', '-ar', '44100', '-ac', '2', '-i', wav,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
    '-t', String(secs), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(secs * FPS);
  for (let i = 0; i < n; i++) {
    const jpg = await p.evaluate(([t, dt]) => window.__frame(t, dt), [i / FPS, 1 / FPS]);
    if (!ff.stdin.write(Buffer.from(jpg, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 100 === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
  console.log('done', out);
})();

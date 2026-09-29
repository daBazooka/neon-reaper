// Renders episode-01-zipper.html: silent 1080x1920@30 video + music bed (raw s16le) into <outdir>.
// Then run tools/mix.py to add the voice-over and produce the final MP4.
// Usage: NODE_PATH=$(npm root -g) node make-video.js <outdir> <ffmpeg-path> [seconds|0] [page.html]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const outDir = process.argv[2] || '.';
const ffmpeg = process.argv[3] || 'ffmpeg';
const FPS = 30, LOOP = 18 * 4 * 60 / 110;
const html = process.argv[5] || 'episode-01-zipper.html';
let secs = parseFloat(process.argv[4]) || LOOP;
fs.mkdirSync(outDir, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  p.on('pageerror', e => console.error('pageerror', e.message));
  await p.goto('file://' + path.resolve(__dirname, '../' + html) + '?t=0');
  await p.evaluate(() => document.fonts.ready);
  const pl = await p.evaluate(() => window.__loop); if (pl && !parseFloat(process.argv[4])) secs = pl;
  console.log('seconds', secs);
  fs.writeFileSync(path.join(outDir, 'music.raw'), Buffer.from(await p.evaluate(s => window.__audio(s), secs), 'base64'));
  const ff = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-t', String(secs), path.join(outDir, 'video.mp4')],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(secs * FPS);
  for (let i = 0; i < n; i++) {
    const jpg = await p.evaluate(([t, dt]) => window.__frame(t, dt), [i / FPS, 1 / FPS]);
    if (!ff.stdin.write(Buffer.from(jpg, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 200 === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
  console.log('done', outDir);
})();

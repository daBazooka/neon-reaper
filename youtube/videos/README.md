# Videos

All four are original motion graphics with synthesised sound. They make **no test claims** and contain no fake results.

| File | Length | Use |
|---|---|---|
| `receipts-trailer-short.mp4` | 28s, 1080x1920 | Channel trailer / first Short. Explains the format, the stamps and the Scoreboard, and ends with the claim-submission call to action. |
| `stamp-verified.mp4` | 3s | Verdict sting to cut into any episode or Short. |
| `stamp-busted.mp4` | 3s | Same, for BUSTED. |
| `stamp-complicated.mp4` | 3s | Same, for IT'S COMPLICATED. |

Notes:
- "RECEIPTS" is a working name. Check YouTube and trademark searches for clashes before using it.
- The trailer's three example claims are illustrative catchphrases, not real videos or products.
- The stamps are on a solid dark background. Place them over footage with a chroma or luma key in your editor, or re-render on a transparent background.
- The SFX are simple synthesised sounds. Replace them with licensed audio if you want a richer sound.

## Re-rendering
Needs Node with Playwright (and a Chromium install), plus Python with `imageio-ffmpeg` and `numpy`.
```
NODE_PATH=$(npm root -g) node tools/render.js trailer <frames-dir>   # or verified | busted | complicated
python3 tools/audio.py trailer out.wav                                 # or: stamp
ffmpeg -framerate 30 -i <frames-dir>/f%04d.jpg -i out.wav -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest out.mp4
```
Edit the text and timing in `tools/motion.html`.

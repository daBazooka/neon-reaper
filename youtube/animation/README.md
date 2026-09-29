# Animation tools (Rex Tries)

- `engine.html`: the 2D animation engine and all skits (Rex, Greg, NoteBot, props, captions, verdict stamps). Every frame is a pure function of time.
- `render.js`: renders frames (or previews / audio events) with Playwright + Chromium.
- `audio.py`: synthesises music (changes per scene), SFX and character blips from the events; needs `numpy`.
- `build.sh`: renders in parallel, mixes audio and encodes H.264/AAC with the ffmpeg bundled in `imageio-ffmpeg`.

```
pip install numpy imageio-ffmpeg
./build.sh short-4am   1080 1920 ../videos/animated/short-1-4am-routine.mp4
./build.sh long-ep1    1920 1080 ../videos/animated/long-ep1-rex-tries-viral-hacks.mp4
```
Projects: `short-4am`, `short-guru`, `short-ai`, `short-app`, `short-speedread`, `long-ep1` (see `PROJ` in `engine.html`).
To add a skit, add an `SK.X = {...}` entry (captions, sfx, music cues, `draw(t)`) and list it in `PROJ`.
Preview frames: `node render.js short-4am 1080 1920 preview <outdir> 1,5,10`.
The rendered MP4s are not committed (large files); rebuild them with the commands above.

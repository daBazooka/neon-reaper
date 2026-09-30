# LOOPERANG

Throw a magic boomerang, loop it through every gem, catch it on the way back. Made for **Poki** (Poki SDK v2).

- Play locally: serve this folder (`npx http-server .`) and open `/` or `dist/index.html`.
- Build: `python3 build.py` inlines everything into `dist/index.html` (100 KB, no external assets).
- Poki upload: `poki/looperang-poki.zip`, thumbnails and videos in `promo/`.
- Submission texts and Poki rules checklist: `POKI-SUBMISSION.md`.

Code: `js/sdk.js` (Poki wrapper), `js/core.js` (physics, level generator, save), `js/game.js` (flow, input),
`js/render.js` (canvas art + the thumbnail scene), `js/ui.js` (menus), `js/audio.js` (synth sound + music).

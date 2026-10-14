# 3D renders for the listing art

`scene.html` builds blocky Roblox-style characters (R6 proportions, rounded blocks, a face, the mustard number sign) in three.js with real lighting, shadows and bloom. `render.mjs` renders it headless (Chromium) into `hero_thumb.png`, `hero_icon.png`, `teams.png` and `win.png`. Then `python3 ../make_masterpiece.py` adds the logo, crosshair, arrow, typed digits and score boxes and writes the final icon and thumbnails 1, 3 and 5.

Setup (once): `npm install three playwright-core` in /tmp/r3d (the paths at the top of render.mjs), Chromium from Playwright (`PLAYWRIGHT_BROWSERS_PATH`). Run: `node render.mjs`.
These are my own blocky characters, not official Roblox renders.

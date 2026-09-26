# CHAINFLING — CrazyGames Submission Listing

Upload the contents of this `chainfling/` folder as the HTML5 build
(zip `index.html`, `style.css`, `js/`). `promo/` holds the cover images
and is **not** part of the game build.

---

## Title

**CHAINFLING**

## Short description (~150 chars)

Drag to slow time, release to fling. Every kill refunds a fling — chain
kills forever, bank off walls, and never stop moving.

## Long description

**One gesture. Endless skill.**

Drag anywhere and time slows to a crawl. Release, and your core rockets
across the arena, ricocheting off the walls and slicing through
everything in its path.

The twist: **every kill refunds a fling.** Re-aim mid-flight and keep
going. Great players never touch the ground; chains of 20, 30 or 50
kills in one flight are possible. But the moment you slow down you're
exposed, so every fling matters.

- **Bank shots:** bounce off a wall first for up to +150% score
- **Streak multiplier:** keep landing flings that kill to climb to x8.
  Miss once and it resets
- **10 enemy types** that each need a different approach: Wardens you
  can only hit from behind, Bombers that start chain reactions, Spikers
  that only break at full speed, Phantoms that fade in and out, and more
- **3 bosses:** The Prism, The Hive and The Serpent (only its tail can
  be cut, and its body works as a pinball bumper)
- **20 powers** to pick from between waves: Wall Nova, Plasma Trail,
  Echo Shard, Arc Chain, Singularity and more
- **Permanent progress:** shards buy upgrades and 7 neon cores. You also
  get player levels and missions that get harder as you go
- **Daily Challenge:** the same seeded run with a twist for everyone,
  every day

## Category

**Primary:** Action · **Secondary:** Arcade / Skill

## Tags

arcade, action, skill, one-touch, slingshot, bullet time, slow motion,
combo, chain, roguelite, upgrades, neon, boss, endless, high score,
daily challenge, mobile, casual

## Controls

- **Drag & release** anywhere (mouse or touch) to aim and fling. Time
  slows while you aim
- Default is **pull-back** (slingshot). Settings has a **Flick** option
  if you'd rather drag toward your target
- **1 / 2 / 3** to pick a power card
- **P / Esc** to pause
- **Enter / Space** to play again on the results screen

Works on desktop and mobile, in both portrait and landscape.

---

## Technical notes (for your reference)

- **Original work, no third-party assets.** All art is procedural canvas
  and all audio (SFX and music) is synthesized with Web Audio at runtime.
  There are no image, audio or font files, no external libraries and no
  web fonts (it uses system fonts only).
- **CrazyGames SDK v3.** The SDK is loaded from
  `sdk.crazygames.com/crazygames-sdk-v3.js`. `init()` resolves before
  `loadingStart()`, then the save is read, then `loadingStop()`.
  `gameplayStart/Stop` wrap every transition: run start, pause and
  resume, power-card picks, revive, death, results and menu. Both calls
  are de-duplicated, so the portal never sees two starts or two stops in
  a row. `happytime()` fires on a boss kill and on a new best score.
- **Progress is saved through `SDK.data`** (so it syncs for logged-in
  players), with `localStorage` as the fallback when the game runs off
  the portal.
- **The portal mute is respected.** `game.settings.muteAudio` and
  `addSettingsChangeListener` silence all audio. Audio also mutes
  whenever the tab is hidden and during any ad.
- **Basic Launch has no ads.** `ADS_ENABLED` at the top of `js/sdk.js`
  is `false`, and while it's false no `sdk.ad` call is ever made. Revive
  costs 150 shards instead. Once CrazyGames confirms Full
  Implementation, set it to `true` and two things turn on:
  - an optional rewarded ad for a revive and for "double shards"
  - a midgame ad on retry or menu, at most once every 3 minutes
- **Portal behavior:**
  - The game auto-pauses on blur or tab switch.
  - Space and arrow keys never scroll the page, and the right-click menu
    is disabled.
  - `touch-action: none` and no pinch-zoom.
  - No fullscreen or pointer-lock requests.
  - No external links.
- **Global error handlers** stop a stray exception from surfacing
  uncaught inside the portal iframe.
- **Adaptive quality.** In AUTO mode the game drops its pixel ratio and
  effects if the frame rate falls. It weighs about 140 KB in total.

---

## Marketing assets (`promo/`)

| File | Use |
|---|---|
| `cover-1920x1080.png` | Landscape cover (16:9) |
| `cover-800x1200.png` | Portrait cover (2:3) |
| `cover-800x800.png` | Square cover (1:1) |
| `trailer-1920x1080.mp4` | 30 s landscape gameplay trailer, 60 fps, H.264 + AAC |
| `trailer-1080x1920.mp4` | 30 s portrait version for mobile and social |

All of these are captured from the real game running its real code; nothing is mocked up. The trailers are played by a scripted bot on a frame-exact clock. Their audio is the game's own synthesized sound, re-rendered sample-accurately (peak −0.7 dBFS, no clipping). The covers show only the game title and no other text.

# UNDERNEATH: CrazyGames Submission Listing

Upload `underneath/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**UNDERNEATH**

## Category
**Primary:** Clicker · **Secondary:** Casual

## Tags
satisfying, scratch, idle, incremental, relaxing, secrets, discovery, puzzle, collection, painting, upgrades, casual, mouse, mobile

## Short description
Every picture hides another. Scrub away the grime, find treasure and secrets, and dive into the painting beneath the painting.

## Long description
**Every picture hides another.**

An old painter hid something in her paintings, layer under layer under layer. Scrub away the dust, grime and stone to see what's underneath.

**Scrub. Uncover. Dive deeper.** Every stroke pays out. Keep scrubbing without stopping and your streak climbs to x5, with chimes rising up the scale as you go.

- **Treasure everywhere:** coins, gems, relic pieces and creatures hide under the grime. Tap a creature before it runs away to add it to your collection
- **Dive INTO the painting:** find the keyhole, restore enough of the painting to unlock it, and zoom down into the world painted beneath: Sunny Meadow, Coral Deep, Jungle Ruins, Glass Desert, Clockwork City, Aurora Peaks, Cosmos... and The Core
- **12 secrets nobody tells you about.** You only get a riddle for each one. Some are gestures, some are hidden in the paintings, and some are just watching you. Can you find them all?
- **32 creatures** to collect, with rare golden shinies
- **8 relics,** each in 4 pieces. Restore one and everything is worth more forever
- **Upgrades:** a wider brush, stiffer bristles, dust moths that scrub for you, a Moth Queen, a sonar lens that pings hidden treasure, firecrackers and a lucky charm
- **Idle friendly:** your moths keep scrubbing while you're away
- **Daily Painting:** a new painting every day, with everything worth x3 and a shiny creature waiting
- **Notes from the painter** hidden in every painting tell her story

Calm, generative music in a new key for every world, and the most satisfying scrubbing sound we could make.

## Controls
- **Mouse:** click and drag across the painting to scrub. Click things you uncover to collect them. Click upgrades to buy them
- **Touch:** drag your finger across the painting to scrub, and tap to collect
- **Keyboard:** **1–8** buy upgrades · **Space** dives through an open keyhole · **Esc** opens settings

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
**Yes, using the Data Module from the CrazyGames SDK.** It saves the painting in progress too.

## Age suitability
Relaxing and non-violent. No fighting, no chat and no text input. Suitable for all ages.

## Assets to upload
- **Game build:** `underneath/dist/index.html` (zip it)
- **Covers:** `underneath/promo/cover-1920x1080.png`, `underneath/promo/cover-800x1200.png`, `underneath/promo/cover-800x800.png`
- **Video:** `underneath/promo/trailer-1920x1080.mp4` (a vertical `underneath/promo/trailer-1080x1920.mp4` is included for social media)

## Marketing assets
The covers are staged in-game frames drawn by the game's own renderer: a sweeping scrub stroke through the grime reveals a sunny meadow full of gems and coins, a butterfly waiting to be caught, a glowing keyhole, a "STREAK x5" pop and the golden eye watching from the grime, with the logo added on top.

The trailer is real gameplay captured frame by frame, with the game's own synthesized music and sound:
1. **0–4 s:** the first strokes uncover a meadow. "EVERY PICTURE HIDES ANOTHER"
2. **4–7 s:** coins pop, a creature is caught. "SCRUB. UNCOVER."
3. **7–12 s:** the keyhole is found and the camera dives into the painting. "FIND THE KEYHOLE... AND DIVE INTO THE PAINTING"
4. **12–19 s:** Coral Deep: a circle summons a whirlwind, a zigzag calls lightning, the golden eye opens. "12 HIDDEN SECRETS" · "SOMETHING IS WATCHING"
5. **19–26 s:** dive after dive: Clockwork City, Aurora Peaks, Cosmos, The Core. "8 WORLDS... ONE INSIDE THE NEXT" · "WHAT LIES BENEATH THE CORE?"
6. **26–30 s:** logo end card: "UNDERNEATH · Every picture hides another."

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** while the player is on the painting. **`gameplayStop()`** when the codex, settings or welcome-back screens are open and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** when a secret is found, a relic is restored, a masterpiece is finished and on every dive to a new depth.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called.

## Note for the reviewer
All art is drawn in code and all music and sound effects are synthesized in code, with no third-party assets. Creatures use the system's built-in emoji. The 12 secrets are part of the design: the codex shows a riddle for each one so players can discover them.

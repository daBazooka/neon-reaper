# CRITICAL MASS: CrazyGames Submission Listing

Upload `criticalmass/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**CRITICAL MASS**

## Category
**Primary:** Casual · **Secondary:** Puzzle

## Tags
chain reaction, satisfying, one tap, explosion, physics, casual, puzzle, upgrades, incremental, relaxing, neon, mouse, mobile, arcade

## Short description
One tap. Total chain reaction. Pop one atom, watch it pop the next, and wipe the whole screen in a single blast.

## Long description
**One tap. Total chain reaction.**

The chamber is full of drifting atoms. Tap once. Your blast pops the atoms it touches, every popped atom explodes too, and the reaction spreads... ×10... ×50... CRITICAL ×100... TOTAL MELTDOWN.

Every pop plays the next note of a song, so a good chain turns into music.

- **Easy to learn, hard to master:** wait for the atoms to drift into the perfect cluster, then tap. One great tap beats a hundred bad ones.
- **10 atom types** that change how the chain spreads: Heavy atoms blast wider, Splitters fling shards across gaps, Magnets pull neighbours in, Lightning zaps the three nearest, Chrono slows time, Novas blow up half the screen, and Void atoms swallow any blast that touches them.
- **Boss reactors every 10 levels:** a shielded core that only a big enough chain can break.
- **5 worlds:** The Lab, Solar Furnace, Toxic Vats, Cryo Chamber and The Void.
- **Upgrades:** bigger blasts, longer blasts, a stronger tap, more energy, Overcharge crits, rarer atoms and extra taps. You keep your energy even when you fail, so every try makes you stronger.
- **Three stars** on every level: hit the goal, then go for a TOTAL MELTDOWN.
- **∞ OVERLOAD mode:** atoms keep flooding in and your taps recharge. How long can you keep the chamber from overloading?
- **Daily Reactor:** a new layout every day with energy ×3.

## Controls
- **Mouse:** move to aim (a ring shows your blast size) and click to set off the reaction
- **Touch:** press to aim and release to fire
- **Keyboard:** **Enter / Space** goes to the next level · **Esc** opens the menu

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
**Yes, using the Data Module from the CrazyGames SDK.**

## Age suitability
Abstract and non-violent: glowing atoms and bubbles. No chat and no text input. Suitable for all ages.

## Assets to upload
- **Game build:** `criticalmass/dist/index.html` (zip it)
- **Covers:** `criticalmass/promo/cover-1920x1080.png`, `criticalmass/promo/cover-800x1200.png`, `criticalmass/promo/cover-800x800.png`
- **Video:** `criticalmass/promo/trailer-1920x1080.mp4` (a vertical `criticalmass/promo/trailer-1080x1920.mp4` is included for social media)

## Marketing assets
The covers are real in-game frames: one tap has set off a huge rainbow chain reaction of Heavy, Splitter, Lightning, Golden and Nova atoms, frozen at its peak, with a big "×120" chain counter and the logo on a dark gradient so the title reads at thumbnail size.

The trailer is real gameplay captured frame by frame, with the game's own synthesized music and sound (every pop plays the next note of the melody):
1. **0–5 s:** one tap wipes out a cluster of atoms. "ONE TAP..." · "...TOTAL CHAIN REACTION"
2. **5–11 s:** Heavy, Splitter, Magnet and Lightning atoms spread the chain. "10 WILD ATOMS" · "EVERY POP PLAYS A NOTE"
3. **11–16 s:** a 140-atom chamber goes up in one reaction. "CHAIN ×10... ×50..." · "TOTAL MELTDOWN"
4. **16–21 s:** a shielded boss core is destroyed. "BREAK THE BOSS REACTOR"
5. **21–26 s:** the endless flood. "∞ OVERLOAD MODE" · "HOW LONG CAN YOU HOLD?"
6. **26–30 s:** logo end card: "CRITICAL MASS · One tap. Total chain reaction."

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** from the first tap of a level. **`gameplayStop()`** on the result screen, the new-atom card, the menus and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on a three-star clear, a total meltdown, a destroyed boss core and a new OVERLOAD best.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called.

## Note for the reviewer
All art is drawn in code and all music and sound effects are synthesized in code, with no third-party assets.

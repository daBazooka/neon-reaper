# DIGFORT — CrazyGames Submission Listing

Upload `dist/index.html` zipped on its own. That single file is the whole game.

## Title
**DIGFORT**

## Category
**Primary:** Strategy (Tower Defense) · **Secondary:** Casual

## Tags
tower defense, mining, blocks, voxel, crafting, strategy, sandbox, building, day and night, survival, roguelite, upgrades, pixel, island, mobile, casual

## Short description
Mine a floating block island by day, then drop the night's monsters into the pits you dug. Dig your defenses and protect the Heart!

## Long description
**Dig your defenses.**

Your island floats in the sky, and at its center glows the Heart. By day, hold on any block to mine it. Dig up stone, coal, iron, gold and rare crystal, and use them to build walls and towers. But every block you mine carves a hole in your own ground, and that's the point.

When night falls, monsters march on the Heart. **Mine the block they're standing on and they fall.** Deep pits hurt, four-deep pits are lethal, and if you dig all the way down to a magma pocket, anything that steps in burns. Walls redirect them, and they'll chew through anything in their way.

- **Mining is your economy *and* your trap-building,** so every block is a decision
- **6 monsters:** Grubs, wall-climbing Stompers, flying Flitters, fast-digging Burrowers, exploding Blastbugs and the giant Stone Warden boss
- **4 towers:** Bow Tower, Blast Crate (blows craters in the ground), Brazier and Crystal Spire. Tap a tower with its own tool to upgrade it to level 3
- **Dawn blessings:** choose 1 of 3 powers after every night
- **The island grows** as you survive, with fresh ore to discover
- **Permanent progress:** better pickaxes, a tougher Heart, starter kits, new towers and 5 world themes. Player levels and missions too
- **Daily Island:** the same seeded island with a twist for everyone, every day

## Controls
- **Hold** on a block to mine it (mouse or touch)
- **Tap** a monster to hit it
- **Tap the hotbar** (or press **1–7**) to pick a block or tower, then tap a spot to build
- **Pinch** (or scroll the mouse wheel) to zoom, and drag with two fingers to pan
- **Space / N** starts the night early for bonus gems
- **P / Esc** pauses

Works on desktop and mobile, in portrait and landscape.

## Progress save
Choose **"Yes, using the Data Module from the CrazyGames SDK"**. On CrazyGames the game saves only through `SDK.data`. It falls back to LocalStorage only when it runs off the portal.

## Technical notes
- **Original work, no third-party assets.** All textures are generated 8×8 pixel art and all sound and music are synthesized with Web Audio. There are no image, audio or font files and no libraries. It isn't affiliated with any other block game, and its monsters, names and visuals are its own.
- **CrazyGames SDK v3** (checked against a stand-in SDK):
  - Call order: `init` → `loadingStart` → save read → `loadingStop`.
  - `gameplayStart/Stop` wrap play, pause, dawn cards, revive and game over, and are de-duplicated so the portal never sees two in a row.
  - `happytime` fires on a boss kill and on a new record.
  - The portal mute (`muteAudio` and the settings listener) works.
- **Basic Launch has no ads.** `ADS_ENABLED = false` in `js/sdk.js`, so no ad call is ever made. The Heart revive costs 60 gems instead. Turning it on later enables a rewarded revive, a rewarded "double gems" button and a midgame ad at most every 3 minutes.
- **Portal behavior:** the game auto-pauses on blur or tab switch. It also:
  - never scrolls the page on Space or the arrow keys
  - blocks the right-click menu
  - has no fullscreen request and no external links
- **Performance:** 60 fps during a busy boss night, thanks to occlusion culling and cached sprites. It drops to a low-quality mode if the frame rate dips.
- **Balance:** a simulated player who plays at human speed survives 4–14 nights, and boss nights (every 5th) act as the walls.

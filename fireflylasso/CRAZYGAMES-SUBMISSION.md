# FIREFLY LASSO: CrazyGames Submission Listing

Upload `fireflylasso/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**FIREFLY LASSO**

## Category
**Primary:** Casual · **Secondary:** Puzzle

## Tags
drawing, satisfying, relaxing, casual, one finger, collection, fireflies, night, upgrades, puzzle, arcade, mouse, mobile, cute

## Short description
Draw a loop. Catch the light. Circle glowing fireflies with your finger, and every firefly in the loop multiplies the others.

## Long description
**Draw a loop. Catch the light.**

It's night in the meadow, and the fireflies are out. Draw with your finger or mouse and your trail becomes a shining lasso. Close a loop around the fireflies to catch them, and they fly into your jar in a shower of light. Every catch plays a music-box chime that climbs higher with every firefly in the loop.

**The bigger the loop, the bigger the light.** Every firefly in a loop multiplies the others:
- **PURE x1.5:** a loop of all one colour.
- **RAINBOW x2:** three or more colours in one loop.
- **LOVE:** catch both Rosepair fireflies together.
- **CHAIN:** loop again within two seconds, up to x3.
- **SWARMS** gather for a few seconds. Catch one whole for a MEGA or LEGENDARY LOOP.

**Watch out:**
- **Wasps** snap your lasso if they touch it, but loop one and it's shooed away.
- **Bats** swoop across the Whispering Woods (watch for the **!**).
- **Spider webs** tangle your rope in the Misty Marsh.
- **Wind and rain** blow through the Starfall Peaks.

**So much to find:**
- **40 nights** in 4 places: Moonlit Meadow, Whispering Woods, Misty Marsh and Starfall Peaks. Earn up to 3 stars on each.
- **The Firefly Queen** visits every tenth night. She dodges your rope, so loop her before she flies away.
- **12 fireflies** to discover in your Codex, including shy Goldies, flickering Blinkers, colour-changing Starlings and two secret species.
- **6 upgrades:** Longer Lasso, Firefly Lure, Brighter Light, Longer Nights, Lucky Charm and the Time Bottle, which slows time once a night.
- **🏮 Midnight Hunt:** an endless mode where your lantern fades. Catch light to keep it burning. How long can you last?

You keep your glow even when you miss the goal, so every night makes you brighter.

## Controls
- **Mouse:** hold the button and draw a loop around the fireflies
- **Touch:** draw a loop with your finger
- **Keyboard:** **B** uses the Time Bottle · **Esc** opens the menu · **Enter / Space** goes to the next night

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
**Yes, using the Data Module from the CrazyGames SDK.**

## Age suitability
Gentle and non-violent: fireflies, a moonlit meadow and cartoon wasps that fly away. No chat and no text input. Suitable for all ages.

## Assets to upload
- **Game build:** `fireflylasso/dist/index.html` (zip it)

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** when a night or hunt starts. **`gameplayStop()`** on the results screen, the menus and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on a three-star night, catching the Queen, a loop of 12 or more fireflies and a new Midnight Hunt best.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called.

## Note for the reviewer
All art is drawn in code and all music and sound effects are synthesized in code, with no third-party assets.

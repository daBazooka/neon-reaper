# TIDECALLER: CrazyGames Submission Listing

Upload `tidecaller/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**TIDECALLER**

## Category
**Primary:** Casual · **Secondary:** Arcade

## Tags
one touch, ocean, boat, physics, satisfying, endless, flip, stunts, casual, arcade, upgrades, missions, mouse, mobile

## Short description
You don't steer the boat. You ARE the ocean. Raise the tide over reefs, drop it under sea caves, and fling your boat into the sky.

## Long description
**You don't steer the boat. You ARE the ocean.**

A brave little boat sails on its own. Drag up and down to move the whole sea:

- **Raise the tide** to float over reefs and jagged rocks.
- **Lower the tide** to slip under sea caves and icy overhangs.
- **Flick the sea up** to fling your boat into the sky, over floating mines and giant tentacles, flipping as it flies.
- **Catch it softly:** pull the sea down as the boat falls for a PERFECT CATCH, a speed boost and a bigger combo. Every coin is multiplied by your combo, up to x10.

**Sail through 6 worlds:** Sunny Lagoon, Coral Reef, Stormy Sea, Frozen North, Moonlit Deep and Volcano Isles. Every 2 km, **THE KRAKEN RISES**. Fly over its arms to escape with a treasure bonus.

- **Missions and ranks:** three missions at a time. Finish them all to rank up from Deckhand to Tidecaller.
- **7 ships to collect:** Dinghy, Sloop, Rubber Duck, Tugboat, Golden Junk, Pirate Galleon and the Royal Yacht, each with its own perks.
- **Upgrades:** Tide Power for bigger launches, Coin Magnet, Coin Value, Hull Plating for extra hearts, and Lucky Bottles.
- **Messages in bottles:** 12 letters from an old sailor are floating somewhere out at sea. Find them all to learn who the first Tidecaller was.

## Controls
- **Mouse:** move the mouse up and down to raise and lower the sea. Move it up fast, then stop, to launch the boat
- **Touch:** drag your finger up and down. Flick up to launch
- **Keyboard:** **↑ / W / Space** raises the tide · **↓ / S** lowers it · **Esc / P** pauses · **Enter** sails again

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
**Yes, using the Data Module from the CrazyGames SDK.**

## Age suitability
Cartoon and non-violent: a little boat, the sea and a friendly-looking Kraken. No chat and no text input. Suitable for all ages.

## Assets to upload
- **Game build:** `tidecaller/dist/index.html` (zip it)
- **Covers:** `tidecaller/promo/cover-1920x1080.png`, `tidecaller/promo/cover-800x1200.png`, `tidecaller/promo/cover-800x800.png`
- **Video:** `tidecaller/promo/trailer-1920x1080.mp4` (a vertical `tidecaller/promo/trailer-1080x1920.mp4` is included for social media)

## Marketing assets
The covers are drawn by the game's own renderer: at sunset over the Coral Reef, the little red boat flies nose-up out of a plume of spray, over a floating mine and past a Kraken tentacle, toward a trail of coins and a gem. The big TIDECALLER logo and "You don't steer the boat. You ARE the ocean." sit on clear sky so they read at thumbnail size.

The trailer is real gameplay captured frame by frame, with the game's own synthesized music and sound:
1. **0–5 s:** the boat sails on its own. "YOU DON'T STEER THE BOAT..." · "...YOU ARE THE OCEAN"
2. **5–9 s:** the tide rises over a reef and drops under a sea cave. "RAISE IT OVER REEFS ↑" · "DROP IT UNDER CAVES ↓"
3. **9–14 s:** a flick launches the boat over a mine, and the sea catches it. "FLICK IT INTO THE SKY!" · "CATCH IT SOFTLY: PERFECT CATCH!"
4. **14–20 s:** a storm, and the Kraken's arms rise. "THE KRAKEN RISES!" · "FLY OVER ITS ARMS"
5. **20–26 s:** Frozen North, Moonlit Deep and Volcano Isles. "6 WILD SEAS" · "7 SHIPS · MISSIONS · SECRETS IN BOTTLES" · "HOW FAR CAN YOU SAIL?"
6. **26–30 s:** logo end card: "TIDECALLER · You don't steer the boat. You ARE the ocean."

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** when a voyage starts. **`gameplayStop()`** on the results screen, the pause menu, the title screen and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on a new best distance, a rank up, escaping the Kraken and reaching a x5 combo.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called.

## Note for the reviewer
All art is drawn in code and all music and sound effects are synthesized in code, with no third-party assets.

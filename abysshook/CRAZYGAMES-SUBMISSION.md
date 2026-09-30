# ABYSS HOOK: CrazyGames Submission Listing

Upload `abysshook/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**ABYSS HOOK**

## Category
**Primary:** Casual · **Secondary:** Arcade

## Tags
fishing, ocean, collection, upgrades, idle, deep sea, casual, arcade, satisfying, one finger, mouse, mobile, fish, treasure

## Short description
Drop the hook. Dodge the fish. Reel up the deep. Catch 72 species across 8 ocean zones, from sunny reefs to the lightless Trench.

## Long description
**Drop the hook. Dodge the fish. Reel up the deep.**

Your hook sinks into the ocean. **On the way down, dodge the fish:** one bite and the hook turns back early. **On the way up, grab everything you touch.** Then your catch flies out of the water: **tap the flying fish** to double their value!

**How deep will you go?**
- **8 ocean zones:** Sunlit Shallows, Coral Gardens, Kelp Forest, Twilight Zone, Midnight Zone, The Abyss, the Sunken City and The Trench. The deeper you go, the stranger, rarer and more valuable the fish.
- **72 species to collect,** from sardines and clownfish to anglerfish, goblin sharks, glass octopuses and the Starwhale. Every one is drawn by hand in the game and waits in your **Fishdex** as a mysterious silhouette until you catch it.
- **✦ Shiny fish:** rare golden variants worth 5x.
- **8 legendary sea monsters,** from the Sunspear Marlin to the Giant Squid, the Kraken and the Leviathan. Hook one and **tap like crazy to reel it in** before it escapes!
- **FRENZY:** hook four fish in a row and your lure goes wild.
- **Treasure chests** on the sea floor, full of coins, gems and bait.
- **Jellyfish** sting your line and steal a fish, so watch out!

**So much to unlock:**
- **6 upgrades:** Longer Line, More Hooks, Wider Lure, Bite Guard, Lucky Charm and Fish Market.
- **8 fishing rods,** from Bamboo to the legendary Trident, each with its own powers.
- **4 baits:** Golden Worm, Glow Bait, Heavy Sinker and Whirl Lure.
- **Player levels, quests and 10 achievement sets.**
- **Zone Mastery:** catch every species in a zone to make all fish worth more forever.
- **Your aquarium earns coins even while you're away,** and a **7-day daily reward** streak brings gifts every day.

## Controls
- **Mouse:** move left and right to steer the hook. Click flying fish to snap them, and click fast to reel in legendaries
- **Touch:** drag to steer. Tap flying fish, and tap fast to reel in legendaries
- **Keyboard:** **← → / A D** steer · **Space / Enter** cast, snap and reel · **Esc / P** pause

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
**Yes, using the Data Module from the CrazyGames SDK.**

## Age suitability
Cartoon fishing, non-violent. No chat and no text input. Suitable for all ages.

## Assets to upload
- **Game build:** `abysshook/dist/index.html` (zip it)
- **Covers:** `abysshook/promo/cover-1920x1080.png`, `abysshook/promo/cover-800x1200.png`, `abysshook/promo/cover-800x800.png`
- **Video:** `abysshook/promo/trailer-1920x1080.mp4` (a vertical `abysshook/promo/trailer-1080x1920.mp4` is included for social media)

## Marketing assets
The covers are drawn by the game's own renderer. They show the whole ocean in one picture: the fishing boat on a sunny surface, the hook loaded with a bunch of fish, and the water turning from bright blue shallows to a dark abyss. A shiny Golden Koi swims near the top, a glowing anglerfish and a glass octopus lurk deeper, and the legendary Kraken rises from the trench rocks. The big ABYSS HOOK logo and "How deep will you go?" sit on the sky so they read at thumbnail size.

The trailer is real gameplay captured frame by frame, with the game's own synthesized music and sound:
1. **0–4.5 s:** the hook drops into the shallows, weaving between fish. "DROP THE HOOK..." · "DODGE THE FISH ON THE WAY DOWN"
2. **4.5–9 s:** the line turns and rips up through a school of fish into FRENZY, with a shiny Golden Koi. "GRAB EVERYTHING ON THE WAY UP!"
3. **9–12.5 s:** the catch explodes out of the water and gets tapped mid-air for combo coins. "TAP THEM MID-AIR FOR DOUBLE COINS!"
4. **12.5–18 s:** a deep dive cuts through the Twilight Zone, the Abyss and the Sunken City. "DIVE DEEPER..." · "...AND DEEPER..." · "...INTO THE UNKNOWN"
5. **18–24 s:** the Kraken bites and is reeled in at the surface, then flies out with the deep-sea catch. "HOOK LEGENDARY SEA MONSTERS!" · "TAP TAP TAP TO REEL IT IN!"
6. **24–26.5 s:** the results screen with new species and the Kraken's Fishdex card. "72 FISH TO COLLECT"
7. **26.5–30 s:** logo end card: "ABYSS HOOK · How deep will you go?"

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** when a dive starts. **`gameplayStop()`** on the results screen, the pause menu, the title screen and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on a new species, a level up, a shiny or legendary catch, and landing a legendary.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called.

## Note for the reviewer
All fish, scenery and effects are drawn in code, and all music and sound effects are synthesized in code, with no third-party assets. A few interface icons are the system's built-in emoji.

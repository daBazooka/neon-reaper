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

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** when a dive starts. **`gameplayStop()`** on the results screen, the pause menu, the title screen and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on a new species, a level up, a shiny or legendary catch, and landing a legendary.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called.

## Note for the reviewer
All fish, scenery and effects are drawn in code, and all music and sound effects are synthesized in code, with no third-party assets. A few interface icons are the system's built-in emoji.

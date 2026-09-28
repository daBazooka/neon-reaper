# TIMBERFALL: CrazyGames Submission Listing

Upload `timberfall/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**TIMBERFALL**

## Category
**Primary:** Action · **Secondary:** Casual

## Tags
survivor, lumberjack, trees, forest, physics, domino, roguelite, upgrades, bullet heaven, night, bosses, 2d, casual, mouse, mobile

## Short description
Every tree is a weapon. Chop, aim the fall and crush the creatures of the night in giant domino chains. Survive until dawn!

## Long description
**Every tree is a weapon.**

Night falls on the forest and the creatures wake up. You have a lantern, an axe and a whole forest of very heavy trees.

**Walk. Chop. TIMBER!** Your axe swings by itself at whatever is in reach. Trees always fall **away from you**, so where you stand is where you aim. Everything under the trunk gets flattened.

- **Domino chains:** a falling tree knocks over the trees it hits. Line them up and watch "TIMBER! ×12" roll across the forest
- **Wood is XP:** every felled tree showers wood chips. Level up and choose from 22 upgrade cards: Lightning Rod, Beaver Buddy, Log Roller, Firebrand Axe, Night Owl, Domino Master and more
- **A living forest:** fallen trees become log walls for a while, stumps regrow into new trees, and golden trees rain gold
- **8 kinds of creatures:** Thornlings, Wisps that fly over logs, charging Tuskers, Rotwolf packs, Puffcaps that burst into poison, armored Barklings, the Owlbear, and **Bandit Beavers that gnaw trees down on top of you**
- **Two bosses:** The Old Stump at 4:30 and The Hollow King at 9:00. Defeat the King and the sun rises
- **Survive until dawn** to unlock the next of **6 forests:** Pine Hollow, Autumn Birchwood, Snowy Taiga, Bamboo Grove, Redwood Giants and the Haunted Wood
- **Endless mode** after dawn, for players who want more
- **Camp upgrades:** spend gold on 7 permanent upgrades, 7 axes (Double Bit, Splitting Maul, Frostbite, Crosscut Saw, Ember, Golden) and 7 flannel outfits
- **Daily Forest** with a twist every day (Windstorm, Giant Forest, Swarm Night, Glass Cabin, Gold Rush) and a daily bonus
- **Missions** that grow harder as you finish them

A campfire folk soundtrack with banjo and fiddle turns minor and frantic when a boss wakes up. Chops thunk, trunks creak, and every crash rings a note higher the longer your chain gets.

## Controls
- **Keyboard:** **WASD** or **arrow keys** to walk. The axe chops by itself · **1 / 2 / 3** pick an upgrade card · **Esc** or **P** pauses · **Enter** plays from the menu or retries
- **Mouse:** click and drag anywhere to walk (a joystick appears where you click)
- **Touch:** drag anywhere to walk, with a floating joystick under your thumb

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
**Yes, using the Data Module from the CrazyGames SDK.**

## Age suitability
Cartoon fantasy action: stylized forest creatures poof into puffs of colour when crushed. There's no blood, no chat and no text input. Suitable for all ages.

## Assets to upload
- **Game build:** `timberfall/dist/index.html` (zip it)
- **Covers:** `timberfall/promo/cover-1920x1080.png`, `timberfall/promo/cover-800x1200.png`, `timberfall/promo/cover-800x800.png`
- **Video:** `timberfall/promo/trailer-1920x1080.mp4` (a vertical `timberfall/promo/trailer-1080x1920.mp4` is included for social media)

## Marketing assets
The covers are staged in-game frames drawn by the game's own renderer: the lumberjack mid-swing as a pine crashes onto a packed crowd of forest creatures, burning logs from an earlier chain, a golden tree and "TIMBER! ×5", with the logo added on top.

The trailer is real gameplay captured frame by frame, with the game's own synthesized music and sound:
1. **0–4 s:** Pine Hollow. The first chop fells a pine onto a crowd. "EVERY TREE IS A WEAPON"
2. **4–10 s:** Autumn Birchwood. One chop topples a line of 7 trees. "LINE THEM UP..." · "DOMINO CHAINS!"
3. **10–15 s:** Snowy Taiga. Lightning, owls, beaver buddies and burning logs against a horde. "22 WILD UPGRADES" · "LIGHTNING. BEAVERS. FIRE."
4. **15–19 s:** Redwood Giants. A redwood crushes The Old Stump. "BOSSES THAT SHAKE THE FOREST"
5. **19–26 s:** Haunted Wood. A tree falls on The Hollow King and the sun rises. "SURVIVE THE NIGHT... UNTIL DAWN"
6. **26–30 s:** logo end card: "TIMBERFALL · Every tree is a weapon."

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** while a run is being played. **`gameplayStop()`** on pause, the revive prompt, dawn, results, menus and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** when a boss is defeated, at dawn and on a new record.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called.

## Note for the reviewer
All art is drawn in code and all music and sound effects are synthesized in code, with no third-party assets.

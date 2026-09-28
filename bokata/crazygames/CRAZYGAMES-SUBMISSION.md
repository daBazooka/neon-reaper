# BO KATA — CrazyGames Submission Listing

Upload `crazygames/index.html` on its own (zip it). That single file is the whole game.

## Title
**BO KATA**

## Category
**Primary:** Casual · **Secondary:** Action

## Tags
kite, kite fighting, flying, festival, one button, casual, 2d, bots, skill, collection, upgrades, relaxing, arcade, mouse, mobile

## Short description
Real-time kite fighting on festival rooftops. Cross threads, win the pench and shout BO KATA!

## Long description
**Cut the sky.**

It's festival day. The rooftops are full of friends, music and kites, and every flyer wants to cut your string and shout **BO KATA!**

**One thumb, endless skill.** Hold and your kite flies toward your pointer. Let go and it spins and drifts on the wind, just like a real fighter kite.

- **The pench:** when two threads cross, a cutting duel begins. Keep your kite flying fast, never let your thread go slack, and dive from above for +30% cutting power
- **Loot falling kites:** cut kites drift away on the wind. Snag them with your kite or thread and they can join your collection
- **Sky Battle:** 12 flyers with 3 kites each. The last flyer standing wins
- **Duel:** 1 vs 1 on neighbouring rooftops
- **42 kites from around the world:** Indian patangs, Malaysian wau with their humming bows, layang-layang fighting kites, Japanese rokkaku and Brazilian pipa
- **Gear:** sharpen and strengthen your manja, pick thread colours and collect charkhi spools
- **7 festival skies** on the Trophy Road: Gully Rooftops, Pink City, River Ghats, Desert Fort, Monsoon Sky, the Pantai Layang beach festival and Lantern Night
- **Daily quests, a daily gift and a daily kite bazaar**
- **Guided first flight:** a practice duel teaches everything in a minute

Dhol and bansuri melodies, gamelan by the sea, wind in the paper and plastic horns every time someone shouts BO KATA.

## Controls
- **Mouse:** hold the button and your kite flies toward the pointer. Release to let it spin and drift. Click the buttons for menus
- **Keyboard:** hold **Space** to pull (the kite heads toward your mouse pointer, so you can steer with the mouse and pull with Space) · **Esc** pauses · **Enter** starts a match from the home screen
- **Touch:** hold anywhere to pull toward your finger, lift to let go
- **Classic control** in Settings: hold to pull, and the kite darts wherever its nose points, like a real patang

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
**Yes, using the Data Module from the CrazyGames SDK.**

## Age suitability
Non-violent: kites cut each other's threads, and no people or animals are ever harmed. No chat and no text input on CrazyGames (the player's CrazyGames username is used as the flyer name). Suitable for all ages.

## Assets to upload
- **Game build:** `crazygames/index.html` (zip it)
- **Covers:** `crazygames/promo/cover-1920x1080.png`, `crazygames/promo/cover-800x1200.png`, `crazygames/promo/cover-800x800.png`
- **Video:** `crazygames/promo/trailer-1920x1080.mp4` (a vertical `crazygames/promo/trailer-1080x1920.mp4` is included for social media)

## Marketing assets
The covers are staged in-game frames drawn by the game's own renderer: a festival sky over pastel rooftops, kites of every shape, threads crossing with sparks at the pench, and the logo added on top.

The trailer is real gameplay captured frame by frame, with the game's own synthesized music and sound (dhol, bansuri, gamelan, wind, humming wau bows, pipudi horns and the crowd):
1. **0–4 s:** countdown on the rooftops of Pink City. "FESTIVAL DAY ON THE ROOFTOPS"
2. **4–9 s:** threads cross, the pench meter fills and the first BO KATA. "CROSS THREADS. WIN THE PENCH."
3. **9–13 s:** a cut Mor Pankh kite drifts by and gets looted. "LOOT FALLING KITES"
4. **13–18 s:** the Pantai Layang beach sky full of wau, layang-layang, rokkaku and pipa. "42 KITES FROM AROUND THE WORLD"
5. **18–25 s:** Lantern Night with sky lanterns and another BO KATA. "7 FESTIVAL SKIES" · "SKY BATTLES & DUELS"
6. **25–29 s:** logo end card: "BO KATA · CUT THE SKY."

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** while a match is being played. **`gameplayStop()`** on pause, results, menus and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on a win and when a new sky is unlocked.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called.
- **Offline only on CrazyGames:** the game's optional online mode stays hidden on the portal, and all opponents are local bots.

## Note for the reviewer
All art is drawn in code and all music and sound effects are synthesized in code, with no third-party assets. Kite fighting is a traditional festival pastime across South and Southeast Asia. The settings screen includes a real-life safety note: never use glass-coated thread.

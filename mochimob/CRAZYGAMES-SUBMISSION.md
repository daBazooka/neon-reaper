# MOCHI MOB: CrazyGames Submission Listing

Upload `mochimob/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**MOCHI MOB**

## Category
**Primary:** Casual · **Secondary:** Action

## Tags
casual, cute, swarm, crowd, idle, upgrade, animals, funny, mouse, mobile, boss, collect, satisfying, kawaii

## Short description
Lead a squishy swarm of hundreds of mochi! Hatch eggs to grow your mob, eat everything, carry giant treasures home and pop the gobblers together.

## Long description
**One mochi is cute. Four hundred mochi is a MOB.**

You don't control a hero. You lead a whole squishy swarm. Move and every mochi hops after you in a jiggly crowd. The bigger your mob gets, the more it can do.

- **🥚 Hatch eggs:** walk your mob into eggs to hatch more mochi. Big blue eggs hatch a crowd!
- **🍓 Eat everything:** berries, cherries, grapes and candy vanish as your mob sweeps across the meadow.
- **🎂 Carry treasures home:** giant cakes, donuts, crystals and cookies are too heavy for one mochi. Bring enough of your mob and they lift it together and haul it back to Mama Mochi's nest. Leave them to it while you lead the rest somewhere else.
- **💥 Squish:** hold to squeeze the mob into a dense ball that smashes crates and rams monsters. Let go and they burst outward in a splash.
- **😈 Pop the gobblers:** purple gobblers gulp down lone mochi, but a big enough mob swarms them and POPS them into fruit and eggs. Every 5th day the Gobbler King himself shows up.

**A surprise every ~15 seconds:**
- Candy Rain
- Mochi Rain (sleepy mochi fall from the sky and join you)
- a Golden Egg that hatches a crowd
- Sugar Rush (super speed, double coins)
- a Sweet Magnet that pulls in all the fruit
- a giant rolling Watermelon you can squish-ram into a fruit explosion
- a Piñata
- a Gobbler Raid

Fill the nest before time runs out to clear the day. Earn stars for finishing fast and for tripling your mob. Spend coins on upgrades (Bigger Mob, Zoomies, Big Bites, Strong Arms, Lucky Eggs, Sweet Tooth) and on 8 mochi flavors from Strawberry to Rainbow. Missions keep something to chase on every day.

Five places to explore: Picnic Park, Candy Canyon, Sunset Beach, Frosty Fields and Moonlight Garden. Days never run out, and the camera keeps zooming out as your mob grows.

## Controls
- **Mouse:** move to lead the mob. Hold the left button to squish, release to burst.
- **Touch:** drag to lead. Hold the pink **SQUISH** button to squish.
- **Keyboard:** **WASD / arrows** lead · **Space** (hold) squish · **Esc / P** pause.

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
Yes. Coins, upgrades, flavors, stars, missions and the current day are saved through the CrazyGames Data Module, with a localStorage fallback.

## Age suitability
Cute and non-violent. Gobblers are silly purple blobs that "pop" into fruit, and mochi that get gulped just go poof. No chat, no text input. Suitable for all ages.

## Assets to upload
- **Game build:** `mochimob/dist/index.html` (zip it)
- **Covers:** `mochimob/promo/cover-1920x1080.png`, `mochimob/promo/cover-800x1200.png`, `mochimob/promo/cover-800x800.png`
- **Video:** `mochimob/promo/trailer-1920x1080.mp4` (a vertical `mochimob/promo/trailer-1080x1920.mp4` is included for social media)

## Marketing assets
The covers are drawn by the game's own renderer: a huge jiggly crowd of mochi on a flowery picnic meadow, with a squad of them hauling a giant strawberry cake ("HEAVE HO!"). A grinning purple gobbler lurks nearby, and eggs, fruit and a mystery crate are scattered around. The MOCHI MOB logo sits on top so it reads at thumbnail size.

The trailer is real gameplay captured frame by frame, with the game's own synthesized music and sound:
1. **0–2.6 s:** the title screen mob chases the cursor. "LEAD A MOB OF MOCHI"
2. **2.6–7 s:** day 1 starts, and eggs hatch as the mob grows. "HATCH EGGS · GROW THE MOB"
3. **7–12.6 s:** MOCHI RAIN! Sleepy mochi fall from the sky and join, and a cake is delivered.
4. **12.6–18.8 s:** GOLDEN EGG! The mob lifts it together and hauls it home. "CARRY TREASURE HOME"
5. **18.8–23.6 s:** SUGAR RUSH! Squished crates explode. "SQUISH & SMASH!"
6. **23.6–31 s:** a 300-mochi mob swarms the Gobbler King until he pops. "300 MOCHI VS THE KING"
7. **31–34 s:** logo end card: "MOCHI MOB · Squish. Hatch. Mob everything."

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** when a day starts. **`gameplayStop()`** on results, pause, the title screen and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on delivering a treasure and popping a gobbler or the Gobbler King.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called and the ×2 coins button stays hidden. The hooks are ready: a midgame break before each new day and an opt-in rewarded ×2 coins on the results screen. Flip `ADS_ENABLED` to `true` after Full Implementation.

## Note for the reviewer
All characters, monsters, backgrounds and effects are drawn in code, and all music and sound effects are synthesized in code, with no third-party assets. A few interface icons are the system's built-in emoji.

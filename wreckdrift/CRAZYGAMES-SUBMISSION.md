# WRECKING DRIFT: CrazyGames Submission Listing

Upload `wreckdrift/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**WRECKING DRIFT**

## Category
**Primary:** Driving · **Secondary:** Action

## Tags
car, drifting, demolition, physics, arena, 2 player, local multiplayer, boss, upgrades, destruction, keyboard, mouse, mobile

## Short description
Your car drags a giant wrecking ball on a chain. Drift to swing it, smash every car in the arena, blow up barrels and wreck the bosses. Play the cup alone or battle a friend in 2-player mode!

## Long description
**Your car drags a wrecking ball. Drift to swing it!**

Every enemy car in the arena wants to ram you. Spin, drift and whip your chained ball into them. The faster it swings, the harder it hits: big hits send cars flying, explode them into coins and chain into DOUBLE, TRIPLE and MEGA WRECK combos.

- **⛓ Real chain physics:** the ball really swings on a chain behind your car. Sharp drifts whip it around, and the chain tugs your car back.
- **🏆 Wrecking Cup:** endless rounds of bumper cars, cops, spiked cars, bomb buggies, heavy trucks and enemy ballers swinging balls of their own. Pick 1 of 3 upgrades after every round: Twin Balls, Fire Ball, Shock Ball, Boom Ball, Drift Nitro, Long Chain, Spiked Bumper and more.
- **👑 Boss every 5th round:** the Big Dozer (its blade blocks hits from the front), the Monster Jumper (dodge its landing slam), the Mega Baller and the King Crusher.
- **💥 Smash everything:** explosive barrels chain into each other, crates burst into coins, cones go flying, and skid marks and scorch marks stay painted on the ground.
- **🏟 Five arenas:** Junkyard, Beach Bowl, slippery Ice Rink, Neon Plaza and Volcano Pit.
- **👥 2-player battle:** two players on one keyboard (or one touchscreen). Wreck your friend first to 5!
- **🚗 Garage:** unlock 6 cars and 6 wrecking balls (Spike Ball, Bowling Ball, Magma Ball, Disco Ball, Tiny Planet...) and permanent upgrades. Daily rewards and missions give you a reason to come back.

How many rounds can you survive?

## Controls
- **Keyboard (Cup):** **↑ / W** gas, **↓ / S** brake and reverse, **← → / A D** steer, **Space** drift. **1 / 2 / 3** pick an upgrade. **Esc / P** pauses.
- **Keyboard (2 Player):** Player 1 uses **WASD** with **Space** to drift. Player 2 uses the **arrow keys** with **Enter** to drift.
- **Mouse / touch:** drag anywhere to steer (the car drives toward your finger and drifts on sharp turns). Hold the **DRIFT** button for bigger swings. In 2-player mode, each player uses one half of the screen.

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
Yes. Coins, cars, balls, upgrades, best round, stats, missions and the daily reward streak are saved through the CrazyGames Data Module, with a localStorage fallback.

## Age suitability
Cartoon cars with faces bump and pop into coins and smoke. No people, no blood or gore. No chat, no text input. Suitable for all ages (PEGI 7 style cartoon action).

## Assets to upload
- **Game build:** `wreckdrift/dist/index.html` (zip it)
- **Covers:** `wreckdrift/promo/cover-1920x1080.png`, `wreckdrift/promo/cover-800x1200.png`, `wreckdrift/promo/cover-800x800.png`
- **Video:** `wreckdrift/promo/trailer-1920x1080.mp4` (a vertical `wreckdrift/promo/trailer-1080x1920.mp4` is included for social media)

## Marketing assets
The covers are drawn by the game's own renderer. A red drifting car whips a flaming wrecking ball on a chain into a green truck, which bursts into debris and gold coins with a "MEGA WRECK!" pop. Angry bumper cars, a cop car, a spiked car and a bomb buggy close in across a sunny junkyard arena covered in skid marks. The yellow-and-red WRECKING DRIFT logo sits on top.

The trailer is real gameplay captured frame by frame, with the game's own synthesized music and sound:
1. **0–2.5 s:** the title screen's self-playing demo. "YOUR CAR DRAGS A WRECKING BALL"
2. **2.5–10 s:** round 1: drifting swings the ball into cars. "DRIFT TO SWING IT" / "WRECK EVERY CAR!"
3. **10–14 s:** ROUND CLEAR, coins fly in, and the upgrade cards appear. "STACK CRAZY UPGRADES"
4. **14–19.6 s:** twin fire balls, shock zaps and a ring of exploding barrels. "BARRELS GO BOOM!"
5. **19.6–25.6 s:** the Big Dozer boss fight. "SMASH THE BOSSES"
6. **25.6–29.4 s:** a 2-player battle in the Volcano Pit. "2 PLAYER BATTLES!"
7. **29.4–32.5 s:** logo end card: "WRECKING DRIFT · Drift to swing your wrecking ball!"

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** when a cup or a 2-player match starts or resumes, and after each upgrade pick. **`gameplayStop()`** on the upgrade screen, game over, the match result, pause, the title screen and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on wrecking a boss and on winning a 2-player match.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called and the ad buttons stay hidden. The hooks are ready: a midgame break before each new cup or match, plus opt-in rewarded "repair & continue" and ×2 coins on the game-over screen. Flip `ADS_ENABLED` to `true` after Full Implementation.

## Note for the reviewer
All art (cars, arenas, effects) is drawn in code, and all music and sound effects are synthesized in code, with no third-party assets. A few interface icons are the system's built-in emoji. The game is original: the chained wrecking ball swung by drifting is its core mechanic.

# WITCHLIGHT: CrazyGames Submission Listing

Upload `witchlight/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**WITCHLIGHT**

## Category
**Primary:** Action · **Secondary:** Casual

## Tags
survival, magic, witch, roguelike, bullet heaven, spells, upgrades, boss, fantasy, cute, mouse, keyboard, mobile

## Short description
A little witch, one lantern, one endless night. Fuse elemental spells, banish swarms of shadows, and watch every one bloom into a glowing flower. Survive until dawn!

## Long description
**The night is full of shadows. You have a lantern and a spellbook.**

Guide a little witch through the endless dark while her spells cast themselves. Every shadow you banish blooms into a **glowing flower**, so the pitch-black world slowly turns into a luminous garden of your own making.

- **🔥 Six elements:** Fireball, Frost Orbit, Chain Lightning, Thorn Pulse, Magic Missiles and Sun Beam. Pick a spell or a charm on every level-up and power them up to level 8.
- **✨ Element fusion:** raise two elements to level 3 and fuse them into something wild. Plasma Storm, Steam Geysers, Blizzard, Meteor Shower, Prism Lasers and the Sunflower Grove. Can you discover all six?
- **🌸 Paint the night with light:** every banished shadow leaves a glowing flower behind, and every boss bursts into a whole meadow.
- **👑 Four night bosses:** the Shadow Wolf, Mothmoon, the Gloom Hydra and finally The Night King. Banish him and the sun rises.
- **🎁 Surprises every few seconds:** treasure chests from glowing elites, shadow swarms, star magnets that pull in every mote, and moonbursts that clear the screen.
- **🌙 Keep growing:** moonstones from every night buy permanent magic (more HP, damage, speed, pickup range, card rerolls, a Phoenix Feather revive) and new witch hats. Missions give you something new to chase on every run.

Survive 8 minutes, defeat The Night King, and bring the dawn.

## Controls
- **Keyboard:** **WASD / arrow keys** to move. Spells cast themselves. **1 / 2 / 3** pick a card. **Esc / P** pauses.
- **Mouse:** click and drag anywhere to move.
- **Touch:** drag anywhere on the screen (virtual joystick).

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
Yes. Moonstones, upgrades, hats, discovered fusions, best time, stats and missions are saved through the CrazyGames Data Module, with a localStorage fallback.

## Age suitability
Cute fantasy. Shadows are blobs with glowing eyes that pop into sparkles and flowers, with no blood or gore. No chat, no text input. Suitable for all ages.

## Assets to upload
- **Game build:** `witchlight/dist/index.html` (zip it)
- **Covers:** `witchlight/promo/cover-1920x1080.png`, `witchlight/promo/cover-800x1200.png`, `witchlight/promo/cover-800x800.png`
- **Video:** `witchlight/promo/trailer-1920x1080.mp4` (a vertical `witchlight/promo/trailer-1080x1920.mp4` is included for social media)

## Marketing assets
The covers are drawn by the game's own renderer. The little witch stands in a meadow of glowing flowers in every colour, which grew from the shadows she banished. Plasma Storm bolts crash down around her, Mothmoon looms nearby with a half-empty health bar, and shadow eyes glint at the edge of her lantern light. The cream-and-violet WITCHLIGHT logo glows in the dark.

The trailer is real gameplay captured frame by frame, with the game's own synthesized music and sound:
1. **0–2.5 s:** the title screen's self-playing demo. "ONE LITTLE WITCH. ONE ENDLESS NIGHT."
2. **2.5–9.6 s:** first spell picked; shadows burst into glowing flowers. "EVERY SHADOW BLOOMS INTO A GLOWING FLOWER" / "THE DARK BECOMES A GARDEN"
3. **9.6–12 s:** a level-up offers a fusion; Fire + Storm becomes Plasma Storm. "FUSE THE ELEMENTS"
4. **12–16 s:** Meteor Shower and Prism Lasers join in. "PLASMA STORMS · METEORS · RAINBOW LASERS"
5. **16–21.6 s:** Mothmoon rises and is banished into a meadow. "BANISH THE NIGHT BOSSES"
6. **21.6–29 s:** The Night King falls and the sun rises over the garden. "SURVIVE UNTIL DAWN"
7. **29–32 s:** logo end card: "WITCHLIGHT · Fuse the elements. Survive until dawn."

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** when a night starts or resumes, and after each card pick. **`gameplayStop()`** on the level-up card screen, game over, dawn, pause, the title screen and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on a new fusion and on defeating a boss.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called and the ad buttons stay hidden. The hooks are ready: a midgame break before each new night, plus opt-in rewarded "revive" and ×2 moonstones on the game-over screen. Flip `ADS_ENABLED` to `true` after Full Implementation.

## Note for the reviewer
All art (witch, shadows, spells, flowers) is drawn in code, and all music and sound effects are synthesized in code, with no third-party assets. A few interface icons are the system's built-in emoji.

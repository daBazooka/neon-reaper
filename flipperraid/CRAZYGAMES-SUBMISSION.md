# FLIPPER RAID: CrazyGames Submission Listing

Upload `flipperraid/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**FLIPPER RAID**

## Category
**Primary:** Arcade · **Secondary:** Casual

## Tags
pinball, arcade, roguelike, dungeon, monsters, boss, upgrades, cards, physics, skill, mouse, keyboard, mobile

## Short description
Pinball meets dungeon crawler! Smash monsters with your pinball, clear rooms, pick power cards that stack into crazy combos, and beat a boss every 5th room.

## Long description
**Pinball meets dungeon crawler.**

Every table is a dungeon room full of monsters, and your pinball is the weapon. Flip it into slimes, bats, shield knights, exploding bomb bugs, splitters and sneaky ghosts. The faster the ball, the harder it hits!

- **⚔ Clear the room, pick a power:** choose 1 of 3 cards after every room. Fire Ball, Lightning (zaps every monster), Bumper Split multiball, Ghost Ball that pierces, Heavy Ball, Lucky Crits, Bumper Bombs, Angel Save and more. They stack, so every run builds into a different crazy combo.
- **👑 Boss every 5th room:** King Slime, Crystal Golem, Forge Dragon, Frost Witch and The Void Eye, each guarded by orbiting shields. Beat one to earn an extra ball.
- **🎰 Real pinball action:** pop bumpers, slingshots, rollover lanes that raise your score multiplier up to x9, and drop-target banks that trigger a JACKPOT plus a bonus multiball.
- **💥 Every hit counts:** big damage numbers, critical hits, chain combos, coin explosions and slow-motion room clears.
- **🌍 Five dungeon floors:** Mossy Dungeon, Crystal Cave, Lava Forge, Frost Keep and Star Vault.

Gems from every raid buy permanent upgrades (more damage, spare balls, a longer ball saver, card rerolls, a head start) and new pinball skins. Missions give you something new to chase on every run.

How deep can you raid?

## Controls
- **Keyboard:** **← / A / Z** left flipper, **→ / D / M** right flipper, **Space** both flippers. **Esc / P** pauses. **1 / 2 / 3** pick a card.
- **Mouse:** click the left or right half of the screen to flip.
- **Touch:** tap the left or right side of the screen.

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
Yes. Gems, perks, ball skins, best room, best score and missions are saved through the CrazyGames Data Module, with a localStorage fallback.

## Age suitability
Cartoon fantasy. Monsters are cute blobs that pop into coins and sparkles, with no blood or gore. No chat, no text input. Suitable for all ages.

## Assets to upload
- **Game build:** `flipperraid/dist/index.html` (zip it)
- **Covers:** `flipperraid/promo/cover-1920x1080.png`, `flipperraid/promo/cover-800x1200.png`, `flipperraid/promo/cover-800x800.png`
- **Video:** `flipperraid/promo/trailer-1920x1080.mp4` (a vertical `flipperraid/promo/trailer-1080x1920.mp4` is included for social media)

## Marketing assets
The covers are drawn by the game's own renderer. A glowing Crystal Cave pinball table is mid-battle: the Crystal Golem boss is guarded by orbiting shields and takes a "CRIT 96" hit, lightning bolts strike from above, and three pinballs are in play at once. A bat, a shield knight, a bomb bug, a slime and a ghost fill the table, around a flashing bumper and a drop-target bank. The gold-and-green FLIPPER RAID logo sits beside it, with flickering dungeon torches.

The trailer is real gameplay captured frame by frame, with the game's own synthesized music and sound:
1. **0–2.5 s:** the title screen's self-playing demo table. "PINBALL MEETS DUNGEON CRAWLER"
2. **2.5–10 s:** room 1, with flipper shots smashing slimes. "SMASH MONSTERS WITH YOUR BALL"
3. **10–11.5 s:** room clear and the card choice. "PICK A POWER EVERY ROOM"
4. **11.5–18 s:** a Lightning + Bumper Bombs + Fire build zaps the whole room, then a drop-target JACKPOT. "STACK CRAZY COMBOS"
5. **18–26.4 s:** the King Slime boss fight ends in BOSS DEFEATED. "BEAT THE BOSSES"
6. **26.4–30 s:** six balls at once. "MULTIBALL MAYHEM!"
7. **30–33 s:** logo end card: "FLIPPER RAID · Pinball meets dungeon crawler. Smash every monster!"

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** when a raid starts or resumes, and after each card pick. **`gameplayStop()`** on the card-pick screen, game over, pause, the title screen and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on jackpots and on defeating a boss.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called and the ad buttons stay hidden. The hooks are ready: a midgame break before each new raid, plus opt-in rewarded "+1 ball" and ×2 gems on the game-over screen. Flip `ADS_ENABLED` to `true` after Full Implementation.

## Note for the reviewer
All art (table, monsters, effects) is drawn in code, and all music and sound effects are synthesized in code, with no third-party assets. A few interface icons are the system's built-in emoji.

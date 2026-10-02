# SUB 5 TO TRUE ADAM

A Roblox glow-up game with a classic, bright Roblox look. You start as a **Sub 5** (a short, wide,
big-headed gag character) and level up to **True Adam** at level **1000**. Your body shape changes
as you level, and the tag above your head shows what you are.

## The gag
Everyone starts as a **Sub 5**: short, very wide, with a goofy cross-eyed face, a big belly and hair all
over their face and body. As you level up the hair and weirdness fade (gone by about level 600) and
your body becomes tall and athletic. The tag above every head says what you are.

## Levels and tiers (1 to 1250)
Levels 1 to 50 come quickly; after 50 the XP cost climbs steeply (level 100 ~3,900 XP, level 500 ~665,000).
Your look (stats + gear) multiplies XP, so a better look levels you faster. The ladder, in order:

`Sub 5` → `Sub 3` → `Sub Human` → `LTN` → `L-LTN` → `M-LTN` → `MTN` → `L-MTN` → `M-MTN` → `H-MTN` →
`L-HTN` → `M-HTN` → `H-HTN` → `L-Chadlite` → `M-Chadlite` → `H-Chadlite` → `L-Chad` → `M-Chad` → `H-Chad` →
`Chad` → `L-Adamlite` → `M-Adamlite` → `H-Adamlite` → `L-Adam` → `M-Adam` → `H-Adam` → **`True Adam`**
(level 1000) → **`True Adam+`** (level 1100+). Start levels are in `Config.Ranks` (`src/shared/Config.luau`).

## What you do
| System | What it is |
|---|---|
| **Click / tap to train** | Click or tap anywhere (hold to keep swinging) to hit yourself with your hammer. Every swing pays Aura (hammer x rebirth x boosts) and a little XP. |
| **Hammer Shop** | 10 hammers on LEGO-stud pedestals right where you spawn (Basic x1 up to True Adam Hammer x512). Stand on a pedestal and press the button to buy or equip; labels show OWNED / EQUIPPED / price. |
| **Crits, Frenzy, Gifts** | Random crits (x5) and jackpots (x25), a Mog Streak that triggers FRENZY (x2), and play-time gifts. See `docs/RETENTION.md`. |
| **Stage Battles** | 15 NPC opponents in a studded battle lane (east of the plaza, or press the BATTLE button). Each is a 7-second tap battle, tougher than the last. Beat stage N to unlock N+1; clearing a stage pays big Aura (repeats pay 40%). |
| **Platforms** | Training now happens on raised, studded platforms with steps and bollards (Gym, Style Studio, Charm Lounge); the stage battle lane has its own "YOU" and "VS" platforms. |
| **Looks change every level** | Body shape, skin tone, face size and the amount of hair all change with every level (half of the whole transformation happens by level 50). |
| **Aura VFX** | Sparks from level 1, flames from tier 6, a ground ring from tier 10, a halo from tier 20; colour follows your tier. |
| **Voice lines** | A deep announcer says "3, 2, 1, Go!", "Level up!", "Rebirth ready!", "Stage cleared!". Uses Roblox text-to-speech by default, pitched down with a bass-boost effect chain (tune `Config.Voice`; turn off in Settings); paste your own recording ids into `Config.VoiceSoundIds`. |
| **Tutorial** | A 5-step first-time guide (swing, buy a hammer, train, hatch a pet, fight stage 1) with a bouncing arrow and small gifts; skippable. |
| **Buildings cost Aura** | Every building is locked until you pay: Gym free, Battle Arena 2.5K, Style Studio 4K, Mog Stage 15K, Charm Lounge 30K, Duel Ring 75K, Crate Shop 120K (buying crates needs it). Each has its own colours, chimneys with coloured smoke, a ground aura ring, chandelier, banners and a patterned floor. Floating signs show price and lock state. |
| **Treadmill Hall** | 20 treadmills in two rows (just outside the plaza, press the 🏃 button to jump there), each a different colour with its own smoke and light beam. Buy one with Aura (Starter is free) and run for Aura every second: +2/s up to +470 billion/s. The belt really moves, you get a speed-lines screen, a wider view, a shockwave every second, and flames / sparks / lightning around you that grow with the tier (the last three are rainbow). **Heat**: every second you keep running adds +5% Aura (up to x2). |
| **Store (real Robux)** | 3 game passes (2x Aura, 2x XP, VIP) and 3 Aura packs. Offers show COMING SOON until you create them on create.roblox.com and paste the ids into `Config.Store`. |
| **Pets** | Hatch Basic / Golden / Mog eggs in the Pets tab for 13 pets (Common to Mythic). Equip 3; they follow you and add a % Aura multiplier plus Aura per second. Duplicates star up to 5 (+25% each). |
| **Pickups** | Walk the plaza to grab apples, protein shakes, dumbbells and trophies (Aura + XP). Chain pickups for a multiplier. |
| **Training** | Gym, Style Studio and Charm Lounge: a 5-rep timing minigame that raises Power / Style / Charm. |
| **Wardrobe + Crates** | 25 cosmetics in 5 rarities; duplicates star up to 5. Crate Shop with pity timers. |
| **Duel Ring** | A 7-second tap battle vs another player or the Mogger Bot. Losing costs nothing. |
| **Mog Competition** | Every ~2.5 minutes entries open at the big central stage. Enter, then flex (tap) for 8 seconds against the field (bots fill empty spots). Top 3 get big Aura, XP, and the winner gets a free crate. |
| **Catwalk** | Walk it for steady Aura and XP. |
| **Quests, daily rewards, events, rebirth, Top Moggers board** | Endless small goals, 7-day streak, Golden Hour / Shard Storm / Duel Frenzy / Runway Night, rebirth for a permanent bonus. |

Every place has its own look. The camera is the normal Roblox camera everywhere, so nothing is ever blocked.

**HUD:** left buttons Shop / Rebirth (with % progress) / Rewards / PVP / MOG (PVP and MOG jump you to the ring or the stage), right buttons Hammers / Wardrobe / Crates / Profile / Settings, the big Aura counter and wide LEVEL bar at the bottom, and a "Click / tap to train" banner at the top. Walk up to any place or pedestal and a big **use** button appears at the bottom of the screen. It works from the character's position (not the camera), so it works from any angle, on mouse, keyboard and touch.

Controls: click / tap = swing, **E** = use, **Space** = hit the zone in training / tap in duels and competitions, **M** = menu.

## Install (easiest)
1. Open `SubFiveToTrueAdam.rbxl` (double-click, or Roblox Studio **File > Open from File**).
2. Press **Play**.

It is built with Rojo from `src/`: `rojo build default.project.json -o SubFiveToTrueAdam.rbxl`.
`SubFiveToTrueAdam.rbxlx` is the same game in text form.

## Layout
```
ReplicatedStorage.Shared      Config, Util, Audio, UI, HammerModel
ServerScriptService.Main      Script + Modules (Data, Stats, Appearance, Cosmetics, Shards, Training, Crates,
                              Duels, Competition, Quests, Daily, Events, Runway, Shop, Nameplate, Board, Quirks, Hammers, Pets, Playtime, Aura, Tutorial, Buildings, Treadmill, Store, Decor, World)
StarterPlayerScripts.Client   LocalScript + Modules (Fx, Toasts, Menu, Hud, 6 tabs, TrainingUI, DuelUI,
                              CompetitionUI, Orbs, Interact, HammerRow, Swing, TabPets, WorldTags, Runner, TabStore)
```
All numbers (tiers, XP curve, body scales, costs, odds, rewards) live in `src/shared/Config.luau`.

## Notes
- Body changes use R15 avatar scaling (works with the default avatar). R6 players get an even scale only.
- Saving needs the place to be published (File > Publish to Roblox, then Game Settings > Security >
  Enable Studio Access to API Services). Without it the game still runs, it just doesn't save.
- Sounds use files that ship with Roblox; swap any in `Config.Sounds`, or set `Config.MusicTrackId`.
- `tests/` has a Roblox mock that validates every property, class and enum against Roblox's API dump.

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
                              Duels, Competition, Quests, Daily, Events, Runway, Shop, Nameplate, Board, Quirks, Hammers, Pets, World)
StarterPlayerScripts.Client   LocalScript + Modules (Fx, Toasts, Menu, Hud, 6 tabs, TrainingUI, DuelUI,
                              CompetitionUI, Orbs, Interact, HammerRow, Swing, TabPets)
```
All numbers (tiers, XP curve, body scales, costs, odds, rewards) live in `src/shared/Config.luau`.

## Notes
- Body changes use R15 avatar scaling (works with the default avatar). R6 players get an even scale only.
- Saving needs the place to be published (File > Publish to Roblox, then Game Settings > Security >
  Enable Studio Access to API Services). Without it the game still runs, it just doesn't save.
- Sounds use files that ship with Roblox; swap any in `Config.Sounds`, or set `Config.MusicTrackId`.
- `tests/` has a Roblox mock that validates every property, class and enum against Roblox's API dump.

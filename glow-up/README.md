# SUB 5 TO TRUE ADAM

A Roblox glow-up game with a classic, bright Roblox look. You start as a **Sub 5** (a short, wide,
big-headed gag character) and level up to **True Adam** at level **1000**. Your body shape changes
as you level, and the tag above your head shows what you are.

## Levels and tiers
- Levels 1 to 1000. Levels 1 to 50 come quickly; after 50 the XP cost climbs steeply
  (level 50 needs ~420 XP, level 100 ~3,900, level 500 ~665,000).
- Tiers (shown above every player): **Sub 5** (1) → **Low-Tier Normie** (10) → **Mid-Tier Normie** (25)
  → **High-Tier Normie** (50) → **Chadlite** (100) → **Chad** (200) → **Gigachad** (450) → **TRUE ADAM** (1000).
- Your look (stats + gear) multiplies XP, so a better look levels you faster.

## What you do
| System | What it is |
|---|---|
| **Coins** | Walk the plaza to collect coins and diamonds (Aura). Chain pickups for a multiplier. |
| **Training** | Gym, Style Studio and Charm Lounge: a 5-rep timing minigame that raises Power / Style / Charm. |
| **Wardrobe + Crates** | 25 cosmetics in 5 rarities; duplicates star up to 5. Crate Shop with pity timers. |
| **Duel Ring** | A 7-second tap battle vs another player or the Mogger Bot. Losing costs nothing. |
| **Mog Competition** | Every ~2.5 minutes entries open at the big central stage. Enter, then flex (tap) for 8 seconds against the field (bots fill empty spots). Top 3 get big Aura, XP, and the winner gets a free crate. |
| **Catwalk** | Walk it for steady Aura and XP. |
| **Quests, daily rewards, events, rebirth, Top Moggers board** | Endless small goals, 7-day streak, Golden Hour / Shard Storm / Duel Frenzy / Runway Night, rebirth for a permanent bonus. |

Controls: **E** interact, **Space** hit the training zone / tap in duels and competitions, **M** menu.

## Install (easiest)
1. Open `SubFiveToTrueAdam.rbxl` (double-click, or Roblox Studio **File > Open from File**).
2. Press **Play**.

It is built with Rojo from `src/`: `rojo build default.project.json -o SubFiveToTrueAdam.rbxl`.
`SubFiveToTrueAdam.rbxlx` is the same game in text form.

## Layout
```
ReplicatedStorage.Shared      Config, Util, Audio, UI
ServerScriptService.Main      Script + Modules (Data, Stats, Appearance, Cosmetics, Shards, Training, Crates,
                              Duels, Competition, Quests, Daily, Events, Runway, Shop, Nameplate, Board, World)
StarterPlayerScripts.Client   LocalScript + Modules (Fx, Toasts, Menu, Hud, 6 tabs, TrainingUI, DuelUI,
                              CompetitionUI, Orbs)
```
All numbers (tiers, XP curve, body scales, costs, odds, rewards) live in `src/shared/Config.luau`.

## Notes
- Body changes use R15 avatar scaling (works with the default avatar). R6 players get an even scale only.
- Saving needs the place to be published (File > Publish to Roblox, then Game Settings > Security >
  Enable Studio Access to API Services). Without it the game still runs, it just doesn't save.
- Sounds use files that ship with Roblox; swap any in `Config.Sounds`, or set `Config.MusicTrackId`.
- `tests/` has a Roblox mock that validates every property, class and enum against Roblox's API dump.

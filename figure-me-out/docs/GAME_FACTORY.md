# Using this project as a "game factory" for your next Roblox games

You said you want to make a bunch of Roblox games with me. This file explains what in this project is **reusable**, how to start a new game from it in a day, and how to choose what to build. Read `docs/ROBLOX_PLAYBOOK.md` first for the *why*.

## 1. What is reusable (the engine)

| Piece | Where | What it gives every new game |
|---|---|---|
| Config-driven rules | `src/shared/Config.luau` | Every number and switch in one file. A new game starts by changing this. |
| Match loop | `src/server/Main/Modules/Match.luau`, `State.luau`, `Modes.luau` | Lobby, countdown, play, results, repeat. Queue for more than N players, a practice round for a lone player, late joiners waiting with a status card. |
| Join and wait flow | `Match.publishQueue`, `HudVideo` waiting card, lobby status screen | "Anybody can join, N play, the rest wait and see when the next match is." |
| Map kit and map vote | `Maps.luau`, `MapKit.luau`, `Votes.luau`, `MapVote.luau` | Themed arenas from data, six-way vote, ties settled randomly. |
| Lobby builder | `LobbyWorld.luau` | A themed waiting area with boards and a status screen. |
| Progression | `Data.luau`, `Progress.luau`, `Badges.luau` | Saves, coins, levels, daily streak, badges, unlocks. |
| Robust client start | `init.client.luau` (`load` / `start`) | One broken screen never stops the game; the error is shown in red. |
| HUD style | `HudVideo.luau` and `UI.luau` | A clean minimal screen; swap the look in one place. |
| Test harness | `tests/` and `tests/run_all.sh` | A Roblox simulator that checks class, property and enum names against Roblox's real API, 400+ checks, and a 61-run clean loop. |
| Build | `default.project.json`, Rojo | `rojo build -o Game.rbxl` to a file you open in Studio. |

**The workflow that keeps everything working:** change code -> `sh tests/run_all.sh` (must be all green) -> rebuild the `.rbxl` -> commit. Older tests are kept working by "pins" (`tests/legacy_pins.luau`), so a redesign never silently breaks what was already proven.

## 2. Starting a new game from it (about a day)

1. Copy the whole `figure-me-out` folder to a new folder and a new git repository.
2. In `Config.luau`: change `GameName`, the **modes** (`Config.Modes.List`), the **round length**, `MaxPlayers`.
3. Decide the **core verb** (one sentence: what does the player *do* every few seconds?). Rewrite only `Guess.luau`, `Combat.luau` and the HUD pieces that show it; keep the loop, lobby, queue, vote and progression.
4. Make 2-3 **maps** with the map kit (data in `Maps.luau`, builders in `MapKit.luau`): each map is about 40 lines of data plus 8-10 small builder functions.
5. Update `tests/` for the new verb (copy `video_scenario.luau` as a template), run `sh tests/run_all.sh`.
6. Make **icon and thumbnails** (`docs/icons/make_icons.py` draws them from code) and the listing text.
7. Follow the launch routine in `docs/ROBLOX_PLAYBOOK.md` section 6.

## 3. How to choose the next games (a simple scorecard)

Give each idea 0-3 points on each line. Build the ones with the highest total, **small first**.

1. **One-sentence pitch** a ten-year-old can repeat.
2. **First 20 seconds**: can a stranger do the fun thing with no reading?
3. **Clip-ability**: does something surprising or funny happen every round?
4. **Works with few players** (or against bots): survives an empty server.
5. **Reason to return tomorrow** (progress, daily, collection, rank).
6. **Friend-friendly**: easy to invite, better with friends.
7. **Cheap to build** with what we already have.
8. **Fresh twist** so it is not just a copy.

## 4. Starter ideas that fit this engine (just ideas, not promises)

| Idea | One-line pitch | Reuses | Main risk |
|---|---|---|---|
| **Who Am I?** | Everyone has a secret word on their back; ask yes/no questions in chat to find yours | lobby, queue, vote, progression | needs chat moderation; very social |
| **Hot Potato Hide** | Hide in the map while one player is "it"; short 2-minute rounds | map kit, match loop, practice | needs a good hide-and-seek map set |
| **Color Clash** | Floors change colour, stand on the right one, last standing wins | match loop, map kit, vote | easy to copy; needs polish and events |
| **Mimic** | One player is secretly a copycat: find them by who repeats the leader | lobby, queue, badges | needs good tell design |
| **Tiny Heist** | Teams of 3 steal one item from a themed map, 5-minute rounds | CTF code (flags), items, team modes | map building time |
| **Number Duel (2-player)** | Fast 1v1 version of this game for quick queues | all of it | small audience |

Pick one, I will help you write its one-page design, then build it with this engine.

## 5. A weekly rhythm that matches how Roblox ranks games

* **Day 1-2:** build or change one thing. Tests green. Publish.
* **Day 3-4:** watch friends play. Fix the worst bounce.
* **Day 5:** ship a small update (a map, a plate, an event) and post a clip.
* **Day 6-7:** read analytics, decide: keep going, change, or stop. Start the next game.

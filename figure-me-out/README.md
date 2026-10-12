# Figure Me Out

A Roblox game for up to 20 players. Everybody wears a secret 3-digit number on their forehead that they cannot see.
Type someone else's number to knock them out. Read numbers with binoculars and photos, hide yours with smoke and
flashbangs, and don't get caught staring at a wall: the game exposes campers. Last one standing wins.

See [docs/GAME_CONCEPT.md](docs/GAME_CONCEPT.md) for the full design.

## Open it in Roblox Studio

The easiest way: open **`FigureMeOut.rbxl`** (in this folder) in Roblox Studio and press **Play** (or Test > Start with 2 or more players).

To rebuild the file from the source yourself (needs [Rojo](https://rojo.space)):

```
rojo build default.project.json -o FigureMeOut.rbxl
```

Or run `rojo serve` and click Connect in the Rojo plugin to live-edit.

## Controls

| Key | What |
|---|---|
| **G** | Guess: aim at someone, then type their 3 digits |
| **Hold right mouse** or **Z** | Binoculars (scroll to zoom) |
| **Click** or **F** | Take a photo |
| **V** | Notebook (your photos, joined up) |
| **3 to 8** | Throw / use an item |
| **M** | Menu (how to play, plates, stats, settings) |
| **◀ ▶** | Change who you watch after you are out |

On a phone or tablet: tap the buttons in the item bar, the GUESS button and the on-screen keypad.

## Folder map

```
src/shared        Config (every number in the game), Rules (pure functions), UI kit, Audio, Util
src/server/Main   the match loop, world builder, guessing, items, photos, anti-camping, bots, saving
src/client/Client the screens: HUD, keypad, binoculars, notebook, alerts, spectate, results, menu
tests             offline tests (see below)
docs              the game concept
```

Change anything in `src/shared/Config.luau`: match length, number of digits, bullets, item counts, grenade sizes, map
size and the plate styles all live there.

## Tests

The game was tested without Roblox, using the Luau command line and a mock of the Roblox API that checks every class,
property, method and enum name against Roblox's real API dump.

```
sh tests/run_all.sh        # needs the luau tools in /tmp/claude-0/lu
```

It runs three suites and a static check:

* **rules**: the pure game rules (guess parsing, unique numbers, bullets, cover timing, photo readability, flash
  blindness, smoke geometry, street routes that never cut through a building...).
* **server**: whole matches with a fake lobby: joining, bots filling, countdown, guessing right and wrong, walls and smoke blocking
  guesses, flashbangs, photos, decoys, scramblers, switcheroos, boots, binoculars, cover warnings and exposure,
  crates, THE REVEAL, results, unlocking plates, second match, leaving, and garbage sent to the remotes.
* **client**: every screen: lobby, how-to-play, HUD, aiming, keypad, photos and notebook, items, binoculars, flash/stun
  /cover/snitch alerts, spectating, results, menu.
* **static**: the analyzer, every server message has a client handler (and the other way round), every
  attribute the client reads is written by the server, and more.

## What I could not check

* **I have not seen the game in Studio.** Everything was verified by the tests above, not with my eyes. Expect to
  adjust looks (sizes, colours, lighting) once you see it.
* **Numbers are physically on the head.** A cheater who reads Workspace could read their own number. For a hobby game
  that is fine; a bigger game would need a different approach.
* **Music, sound effects and animations** are built from the sounds that ship with Roblox and Roblox's own default
  walk animation. Paste real ones into `Config.Sounds` and `Config.MusicTrackId`.
* **Saving** (wins, plates, settings) only works once the place is published to Roblox. In an unpublished place the game
  runs fine and just doesn't remember anything.

# Figure Me Out

A Roblox game for up to 20 players. Everybody wears a secret 3-digit number on their forehead that they cannot see.
Type someone else's number to take one of their three lives. Read numbers with binoculars and photos, hide yours with smoke,
flashbangs, distraction grenades and decoys, sprint away, scan for enemies, hack terminals for clues, ally and betray, collect bounties, and don't
get caught staring at a wall: the game exposes campers. Last one standing wins.

See [docs/GAME_CONCEPT.md](docs/GAME_CONCEPT.md) for the full design and [docs/SETUP_AND_TESTING.md](docs/SETUP_AND_TESTING.md) for setup, a testing checklist and troubleshooting.

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
| **3 to 8** | Use a gadget (flashbang, smoke, distraction grenade, scanner, sprint boost, decoy) |
| **T** | Offer an alliance to the player you aim at (or end yours) |
| **I** | Gadget inventory and your clues |
| **B** | Quick emotes |
| **M** | Menu (how to play, plates, stats, settings) |
| **◀ ▶** | Change who you watch after you are out |

On a phone or tablet: tap the buttons in the gadget bar, the GUESS button and the on-screen keypad. On a controller: X guess, R2 photo, hold L2 for binoculars, Y notebook, L1/R1 choose a gadget and A to use it, Start for the menu.

## Game modes

Matches rotate between three modes (set `Config.Modes.Mode` to `"deathmatch"`, `"team"` or `"ctf"` to lock one; `"rotate"` cycles). The lobby shows which one is next.

- **Deathmatch** - everybody for themselves, 3 lives, last one standing (or most points when time runs out).
- **Team Deathmatch** - RED (west) against BLUE (east), balanced teams, plates and name tags in team colours. A correct guess on the other team scores a point for your team and sends them back to their base protected; nobody is ever out. First to 25 (or the leading team at time-up). Teammates can't be guessed unless `Config.Team.FriendlyFire = true`.
- **Capture the Flag** - each base holds a flag. Walk into the enemy flag to take it (everyone is told, you wear a flag tag), carry it to your own base while your own flag is home to score. Getting hit drops it where you stand; touch your own dropped flag to send it home, or it returns by itself after 20s. A carrier who leaves drops it. First to 3 captures.

All of it is decided on the server; clients only ask. Flags and captures are checked every quarter second from where the players really are, so there is nothing to send that could fake a capture.

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

It runs four suites and a static check:

* **rules**: the pure game rules (guess parsing, unique numbers 1-999, bullets, cover timing, photo readability, flash
  blindness, smoke geometry, street routes that never cut through a building, ranking by lives and points, levels,
  rewards, the shop, and that every terminal clue is true for every number from 1 to 999...).
* **server**: whole matches with a fake lobby: joining, bots filling, countdown, lives and respawn protection, the
  anti-farm pause, wrong and right guesses, walls and smoke blocking guesses, flashbangs, photos (intel points, assists,
  the flash notice), decoy (photos, traps, expiry), sprint boost (stun and binoculars rules), scanner, distraction grenade, binoculars and gadget cooldowns, cover warnings and
  repeat exposure, terminals and their clues, bounties, alliances and betrayals, all five bonus events, crates, THE REVEAL,
  the lives-then-points tiebreak, results, coins/XP paid once, buying and equipping cosmetics, emotes, second match,
  leaving, and garbage sent to the remotes.
* **full house**: 20 real players and a 21st spectator, a whole match (57+ hits to take 19 players x 3 lives) played out
  by random guesses with the books checked after every one (alive count, hits = lives lost, bullets, protection never
  broken), results and ranks for all 20, all 20 paid exactly once, the next match, half the lobby leaving, everyone leaving.
* **client**: every screen: loading screen, lobby profile, how-to-play, HUD (lives, points, cooldowns, bounty, ally),
  aiming, the guess panel, photos and notebook, gadgets, binoculars, flash/stun/cover/snitch/glitch alerts, scanner,
  alliances, clues and inventory, events, emotes, cosmetics shop, spectating, results, menu, controller.
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

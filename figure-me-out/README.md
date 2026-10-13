# Figure Me Out

A Roblox game for up to 20 players, made to match the reference trailer of the original (see [docs/VIDEO_SPEC.md](docs/VIDEO_SPEC.md) for exactly what the video shows and how each thing is done here). Everybody wears a secret **4-digit number on a mustard sign on their forehead**. Put the dot on someone's head and **type their number**: it goes in by itself and they are out. Capture the flag (or team fights) in 25-minute matches: red against blue, respawning, with a red box and a blue box for the score. Take out the **camera (F)** or the **binoculars (G)** to read numbers from far away, grab yellow chests for a flashbang, a smoke bottle or a sound grenade, and **don't cover your number**: facing a wall or sitting still fills a red bar and you get strikes.

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
| **0 to 9** | Just type the number of the player under the dot (4 digits, it sends by itself, Backspace fixes a typo) |
| **F** | Take out the camera (slot F); press again to put it away. **Click** to take a photo (a polaroid drops in) |
| **G** | Take out the binoculars (slot G). **Click** to look through them (click again to lower them). Or hold the **right mouse button** / **Z** to zoom, scroll to change |
| **F / G with a crate item** | The slot now holds a flashbang ⚡, a smoke bottle 🧪 or a sound grenade 🔊: press the key, **click** to throw. When it is used up the camera / binoculars come back |
| **V** | Notebook (your photos, joined up) |
| **B** | Quick emotes |
| **M** | Menu (how to play, plates, stats, settings) |
| **◀ ▶** | Change who you watch after you are out |

On a phone or tablet: tap a player, then the on-screen number pad; tap the F and G slots to use the camera, the binoculars or a grenade straight away. On a controller: X guess, R2 photo, hold L2 for binoculars, Y notebook, L1/R1 choose a gadget and A to use it, Start for the menu.

## The screen (like the video)

Top centre: a **red box and a blue box** with the team scores and a small "-" between them, the **timer** under them (25:00 counting down), three **X marks** for your strikes, and a small **flag icon** beside a box when that team's flag has been taken. Bottom centre: the **F and G slots** (a white slot is the one in your hands). In the middle: a small dot. Under the dot while you type: the **big white digits** with underscores for the missing ones. A short white line at the bottom says "You killed Michael". On the left: your own number on a small sign. Names above heads are small, white and see-through; there are no floating numbers.

## Six maps, and you vote for the next one

From the moment a match ends until the next one starts (the results screen plus the 10-second lobby wait) six cards appear along the bottom of everybody's screen. **Tap a map to vote** (tap another to change your mind; the number on a card is its votes and the leader glows gold). **The map with the most votes is played. If maps are tied, one of the tied maps is picked at random** (and with no votes at all, any of the six can come up). The very first match, which starts the moment the first player arrives, uses the starter map (the School Yard). Plaza Park, the old city map, is still built into the game (`Config.Map.use("city")`) but is not on the cards. Switch voting off with `Config.Vote.Enabled = false` (the game then stays on one map). The arena is rebuilt for the winning map while everybody is on the lobby island; each map also tints the colour grade and the sky a little.

| Map | What it is |
|---|---|
| 🌊 **Waterfall Canyon** | waterfalls, a river that pushes you, a lake, planes overhead (see below) |
| 🏫 **School Yard** | the courtyard from the video: cream walls with an orange band, a blue basketball court, wooden decks with stairs, hedges, planters, log stacks, lockers and yellow chests (the first map) |
| ❄️ **Frosty Peaks** | snow, igloos, snowmen, pines, ice blocks, a frozen pond with an ice spire |
| 🍭 **Candy Kingdom** | lollipops, cupcakes, gumdrops, candy canes, donuts and a giant layered cake |
| 🏜️ **Desert Ruins** | sandstone pillars and ruins, cacti, palms, obelisks and a stepped pyramid |
| 🚀 **Neon Station** | a glowing space station: containers, pylons, tanks, holograms and a reactor core |

The four newer maps are built from a map kit (`src/shared/Maps.luau` has the data, `src/server/Main/Modules/MapKit.luau` the builders): every one is 268 x 268 studs with tall walls, four raised decks with staircases, a landmark in the middle and 64 pieces of cover placed where nobody spawns, and the red base in the west, the blue base in the east (for capture the flag). To add a map, add an entry to `Maps.List`/`Maps.Props`, a builder per prop kind in `MapKit.luau`, and add its id to `Maps.Order` and to the list in `Config.luau`.

## The map: Waterfall Canyon

The arena is **Waterfall Canyon**: a tall cliff along one side with three waterfalls pouring down it (you can walk behind them, and a waterfall blocks sight), a river that runs down the middle into a swimmable lake with an island and a dock, bridges, rock arches, a jungle of trees and boulders, a wrecked plane you can use as cover, a seaplane at the dock, and two planes flying circuits high overhead.

* **The river pushes you.** Wading in the river, the side streams, the pools or under a waterfall carries you the way the water runs (a waterfall shoves hardest). Switch the current off or change its strength with `Config.Water.PushScale`. Bridges and rocks are out of the water.
* **Everything moves on your own screen.** The ripples on the water and the planes are animated by each player's computer from the server clock, so everybody sees the planes in the same place and it costs no network traffic. The planes are scenery: they can't be ridden, shot or hurt anyone.
* **Bots know the map.** They walk between open spots and go round trees, rocks, arches and the lake.
* **Dressing:** soft patches of lighter and darker grass, dirt trails between the bases, bridges and spawn areas, bushes, flower clusters, stones along the river banks, lily pads and reeds on the lake, moss bands and hanging vines on the cliff, lanterns on the dock, fireflies drifting over the grass and a rainbow over the middle waterfall. All of it is decoration that nobody can bump into.
* The whole layout is plain data in `src/shared/Canyon.luau` (waterfall positions, river boxes, spawns, bases, trees...). The old city map ("Plaza Park") is still in the code: put `Config.Map.use("city")` instead of `Config.Map.use("canyon")` at the end of the map section in `Config.luau` to get it back.
* `docs/maps/` has the picture of what the world builder really makes (`built_canyon.png`) next to the six other map ideas.

## Real players, your own number, instant guesses

* **Everybody is shown by their real Roblox name** (display name) on the small name tag above the head, the guess pad, the kill feed and the results. The big gold floating numbers are gone: the number is only ever on the forehead plate (now with bolts and a shine strip). `Config.Number.FloatingTag = true` brings the old floating number back.

* **Real players only, and you drop straight in.** No bots. The very first player to arrive goes **straight into a match** (no lobby wait). Everybody who arrives after that drops into the match that is running (their own number, 3 lives, a few seconds of protection, on the smaller team in team modes) as long as it isn't in its last 20 seconds and isn't full (20). When a match ends there are the results, then the lobby for **10 seconds**, then the next match starts. Someone who leaves can't rejoin the same match. A match nobody else was in pays no win reward. If only one player is left, or a whole team has left, the match ends and the ones still there win. Settings: `Config.Match.FirstMatchAtOnce`, `MinHumans`, `Intermission`.
* **You can see your own number** (big, top-left of the screen; the number is on the forehead plate for everybody else, and there is no floating number above anybody's head) so you know what to hide. Only you are told yours; the server never sends anybody else's.
* **No Enter, no CONFIRM.** Look at somebody and just type their three digits (or press G / Enter, or tap them on a phone first): the guess goes in by itself on the third digit and you see right or wrong at once. `Config.Guess.AutoSubmit = false` brings the CONFIRM button back.
* **Colour grading** follows the moment (warm golden lobby, bright vivid match, punchy pulsing last seconds, celebratory results). Tune it in `Config.Look`.

## The lobby and the spawn pads

The lobby is a floating garden island: stone plaza with a fountain, paths, benches, lamps, flower beds, trees, two small waterfalls spilling into the sky, a golden trophy, bunting between the lamps, floating paper lanterns, a rainbow behind the title banner, glowing lights along the paths, mown stripes in the grass, a title banner, the winners board, a how-to board and a **big status screen** ("WAITING FOR PLAYERS 1 / 2", "NEXT: DEATHMATCH - starts in 8 s", "GET READY!", "MATCH IN PROGRESS - 7 alive"). The spawn pads in the arena (`Workspace.ArenaSpawns`) are **invisible and not solid** while you play; set `Config.Map.ShowSpawns = true` if you want to see them while moving them around in Studio. The code is in `src/server/Main/Modules/LobbyWorld.luau`; `docs/maps/lobby.png` is a picture of what it builds.

## Quick-and-simple mode (the default)

The game ships as: **look at heads, type their number, win.** Matches are 90 seconds, a wrong guess freezes you for 1.5 seconds, there is no tutorial wall (one line of hint at the start of each match), and the screen only shows hearts, points, bullets, the big GUESS button and the timer. Click or tap somebody to open the number pad; on a phone just tap.

Everything else is still in the code but switched off in `Config.Features` (in `src/shared/Config.luau`). Set any of these to `true` to bring it back: `Gadgets` (the hotbar and crates), `Photos` (camera + notebook), `Binoculars`, `Terminals`, `Bounty`, `Alliances`, `Events`. Win in a row to earn a reward multiplier (x1.25, x1.5 ... up to x2).

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

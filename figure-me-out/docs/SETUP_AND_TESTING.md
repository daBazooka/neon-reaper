# Setup, testing and troubleshooting

## 1. Open the game

1. Open **`FigureMeOut.rbxl`** in Roblox Studio. Everything is already in place (scripts, map are built when you press Play).
2. Press **Play** (F5). You join the lobby; after the countdown a match starts with bots filling it to 10 players.

### Where everything lives

| What you asked for | Where it is |
|---|---|
| ReplicatedStorage: shared modules, configuration, gadget definitions | `ReplicatedStorage.Shared`: `Config` (every setting and every gadget), `Rules` (pure game rules), `UI`, `Audio`, `Util`. The `Net` folder with the two RemoteEvents (`Action`, `Notify`) is created by the server when the game starts. |
| ServerScriptService: game controller and managers | `ServerScriptService.Main` (the controller) with `Modules`: `Match` (round manager), `Plates` (number display), `Guess` (guess validation), `Combat` (lives and eliminations), `Items` (gadgets), `Photos`, `Cover` (anti-covering), `Bounty`, `Alliance`, `Terminals`, `Events`, `Pickups`, `Bots`, `Progress` (rewards, coins, XP, cosmetics), `Data` (saving), `World` (builds the map) |
| StarterPlayerScripts: client controller | `StarterPlayer.StarterPlayerScripts.Client` with `Modules`: `Controls` (input), `Hud`, `Keypad` (guess panel), `Scope`, `Album` (notebook), `Alerts`, `Spectate`, `Results`, `Menu`, `Inventory`, `Emotes`, `Markers`, `Fx`, `Toasts`, `View`, `OwnPlate` |
| StarterGui | The screens are built by the client script at runtime (they are plain code), so there are no hand-made UI objects to maintain. |
| Workspace: Lobby, Arena, terminals, pickups | Created by `World` when the server starts: `Lobby`, `Arena` (solid map pieces), `Ground`, `Crates`, `Terminals`, `SpawnPads`, `Lamps`, `Scenery`. |

All round settings (4-minute matches, 3 lives, cooldowns, charges, rewards, event list, map positions...) are in **`Config.luau`**: change a value and the whole game follows.

## 2. Test with several players

The game is for **real players only** (no bots). The first player to arrive goes straight into a match, and everybody who arrives later drops into the running match; between matches there is a 10-second lobby.

1. In Studio go to the **Test** tab, choose **Clients and Servers**, set **Players** to 2 or more, and press **Start**. Each extra window is another player.
2. Everyone joins the lobby. After the 10-second countdown they are all in the same match.

Testing alone? Just press Play: after the 15-second lobby you get a match with god bots. A second test player who arrives in the first 45 seconds drops in.

## 3. Saving (coins, XP, cosmetics, wins)

* Saving needs the game **published** to Roblox, and in Studio you must turn on **Game Settings > Security > Enable Studio Access to API Services**.
* Without it the game still works: it prints `Saving disabled` once and nothing is remembered.
* The top-winners board in the lobby also needs the published game.

## 4. Audio

The game makes its own sounds from the sounds that ship with Roblox. To use your own, put asset ids into `Config.luau`:

* `Config.Sounds` (`Tone`, `Bass`, `Click`, `Flash`, `Footsteps`)
* `Config.MusicTrackId` (one looping song; leave empty for the generated music)

Only use sounds you are allowed to use. If an id can't load, the game skips it silently and prints a note in the Output window.

## 5. Testing checklist

| Check | Expected |
|---|---|
| Press Play alone | 15-second lobby, then a match with god bots. A second player drops straight in. After the match: results, then the lobby (30 s at most), then the next match. |
| Your screen | Your own number is shown big in the top-left box; others' numbers float over their heads (and sit on their foreheads). |
| Look at a player and type 3 digits (or G / Enter / tap first) | The guess goes in by itself on the third digit. Wrong: -1 bullet, frozen 1.5 s. Right: they lose a life, you get points. |
| Hit the same bot again quickly | Refused (protected, then anti-farm pause). |
| Stand facing a wall for 7+ seconds | Warning after 1 s, then "POSITION REVEALED". Smoke never triggers it. |
| Use each gadget (1 to 8) | It works, shows a cooldown on its slot and a charge count. |
| Walk into a gold terminal prompt (plaza corners) | A true clue about your own number, and your position is shown for 5 s. |
| Wait about a minute | A bonus event is announced 5 s ahead. |
| Let the match end | Results with points, lives, survival time, coins and XP; then the lobby; then another match. |
| Two players: aim, press T | An alliance offer appears for them. |
| Leave a player mid-match | They are removed without breaking the match. |

## Testing the modes

Set `Config.Modes.Mode` in `Config.luau` to `"team"` or `"ctf"` and press Play (or use Test > Start with 2+ players). Check: team colours and spawn sides, the score banner at the top, no way to guess a teammate, flags at the two base pads (west red, east blue), taking/dropping/returning/capturing, and the results screen naming the winning team.

## Testing the video-style game

* Two players in Studio (Test > Clients and Servers). Match 1 is capture the flag on the School Yard: check the red and blue boxes, the 25:00 timer, the F and G slots, and that numbers have 4 digits on a mustard sign.
* Aim the dot at the other player and type their 4 digits (the number is on their sign): they are out / score, and you see "You killed <name>".
* F once = polaroid. G once = binoculars (G again lowers them). Walk into a yellow chest: a slot changes to ⚡ 🧪 or 🔊; press its key once to throw; it goes back to the camera / binoculars afterwards.
* Stand facing a wall: the red bar fills and "don't cover your number" shows; after the bar is full you get an X and your number glows for a while.

## Testing the maps and the vote

* In Studio choose Test > Clients and Servers > 2 players. The first player goes straight into a match on Waterfall Canyon. Let it end (or wait out the 90 seconds): the **vote cards** appear along the bottom of both screens. Vote differently on each player, check the numbers on the cards change, then watch the lobby clock: the winner is announced ("Next map: ...") and the match starts on it.
* Make a tie (one vote each for two maps) a few times: it must always be one of those two maps, and not always the same one.
* To look at one map without voting, run this in the Studio command bar (server): `require(game.ServerScriptService.Main.Modules.World).loadMap("frost")` (ids: canyon, city, frost, candy, desert, station), then walk the spawn pads in Workspace.ArenaSpawns.
* Names: every player shows by their Roblox display name. In Studio test sessions that is the test account's name.

## 4. Common problems

* **Nothing happens when I press Play:** open View > Output and look for red text. Send it to me.
* **"Saving disabled":** see section 3. The game works without saving.
* **No sound:** the generated sounds need Roblox's built-in sound files; check Studio's volume. Custom ids in Config only work if you may use them.
* **Bots slide without animating:** Roblox's default walk animation failed to load; the game plays fine anyway.
* **A key does nothing:** keys don't work while a text box has focus (chat). Click the game first.

## Cheating, phones and speed (Milestone 7)

**What the server does about cheaters**

* Every request from a player (`Action`) is type-checked, rate limited per kind (a guess at most every 0.25 s, a photo every 0.5 s, anything else every 0.08 s) and wrapped so a bad one can never crash the server. Vectors with NaN, infinity or huge values, guess texts longer than 16 characters and oversized share lists are refused.
* A guess is decided only on the server: range, line of sight, cooldown, bullets, protection, teammates. Numbers are never sent to other players' computers as data (only the plate, which is part of the game). Brute-forcing numbers stops after 5 bullets and each miss freezes you 3 s.
* Flags, captures, scores, lives and gadget charges are server-only. A request to "capture" does not exist; the server notices where players stand.
* Movement check: if a player ends up much further away than their speed allows (teleport / speed hack), the server puts them back (`Config.Sanity`). Lag spikes are allowed for. Frozen players can't move at all.

**What it can't stop (honest limits)**

* Roblox lets each player's own computer move their own character, so a speed hack can still gain a little per second (about 1.5x the normal speed is tolerated to avoid punishing lag). Flying straight up is not checked.
* An exploiter can read their *own* plate (it is a 3D object everyone receives) and can see through walls with injected tools. Neither lets them hit anyone, because the server needs the *other* player's number, and the number is only ever on that player's forehead.
* Aim assist / auto-typing by a cheating client looks like a fast human. The 5-bullet limit and the 3 s freeze keep it harmless.

**Phones and tablets**: all buttons work by tapping (hotbar, GUESS, keypad with digits, notebook, menu). On touch screens the HUD never shrinks below 78% so buttons stay finger-sized; keyboard hints are hidden when there is no keyboard. Drag the screen to look around, tap the gadget buttons to use binoculars/photo/gadgets.

**Speed**: with 20 players the server sends about 4 messages per second per player in the busiest possible test (everybody guessing and throwing gadgets every second), the number of parts in the world stays level over minutes (grenades, effects and sounds clean up), and one server tick is far below its 250 ms budget. Test files: `tests/exploit_scenario.luau`, `tests/perf_scenario.luau`, `tests/churn_scenario.luau`.

## Where everything lives in Studio (Explorer layout)

Open `FigureMeOut.rbxl` and you get this already assembled (nothing to paste):

```
ReplicatedStorage
  Shared                 Config (every setting), Rules, UI, Audio, Util
  Net                    Action + Notify RemoteEvents (made by the server)
ServerScriptService
  Main                   = the GameManager: Script "Main" + Modules (Match = rounds, intermission and respawns,
                           World = map + spawns, Guess, Combat, Plates = floating numbers ...)
StarterPlayer
  StarterPlayerScripts
    Client               = CameraAndClientSetup (Modules/Camera, Controls, OwnPlate) and the UI (Modules/Hud, Keypad ...)
Workspace
  ArenaSpawns            20 SpawnLocations (needs at least 10). Move them in Studio and rounds use the new places.
  Lobby                  island + LobbySpawnLocation (where everybody appears first)
```

Camera: third person, mouse-wheel zoom 0.5 to 30 studs, walls pull the camera in (no clipping). Change it in `Config.Camera`.
Timers: lobby wait 30 s, or 15 s alone (`Config.Match.Intermission`, `SoloWait`), losing a life or being eliminated sends you back after 3 s (`Config.Lives.RespawnDelay`, `Config.Lives.EliminatedDelay`).

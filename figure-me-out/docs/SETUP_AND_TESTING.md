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

1. In Studio go to the **Test** tab, choose **Clients and Servers**, set **Players** to 2 or more, and press **Start**. Each extra window is another player.
2. Everyone joins the lobby. After the countdown they are all in the same match.

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
| Press Play alone | Lobby, countdown, a match with 9 bots. |
| Your screen | You can see other players' forehead plates but never your own. |
| Aim at a bot, press G, type 3 digits, CONFIRM | Wrong: -1 bullet, frozen 3 s. Right: the bot loses a life, you get points. |
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

## 4. Common problems

* **Nothing happens when I press Play:** open View > Output and look for red text. Send it to me.
* **"Saving disabled":** see section 3. The game works without saving.
* **No sound:** the generated sounds need Roblox's built-in sound files; check Studio's volume. Custom ids in Config only work if you may use them.
* **Bots slide without animating:** Roblox's default walk animation failed to load; the game plays fine anyway.
* **A key does nothing:** keys don't work while a text box has focus (chat). Click the game first.

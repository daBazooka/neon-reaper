# Publishing the game so people anywhere can play, and what to do if you cannot get into a match

## 1. Publish it (once)

1. Open `FigureMeOut.rbxl` in Roblox Studio and log in.
2. **File > Publish to Roblox**. Give it a name and a description (you can use `docs/ROBLOX_LISTING.md`), pick "Public" later in step 3, and publish.
3. **Home > Game Settings** (the cog), and set:
   * **Basic Info**: name, description, and **Playability: Public** (not Private). Without this only you can join.
   * **Basic Info > Max players: 30 or more** (up to 50). The game lets **20 play in a match** and everybody else wait in the lobby, so the server needs room for the waiting players too. If you leave it at 20, the 21st person simply joins another server.
   * **Basic Info > Devices**: tick Computer, Phone, Tablet and Console if you want them all.
   * **Avatar > Avatar type: Player Choice** (and leave "Allow R6 and R15"). That is what makes everybody play with **their own Roblox look**.
   * **Security > Enable Studio Access to API Services**: on. This lets the game save wins, coins and levels (the output says "Saving disabled" while it is off).
4. Press **Save**, then publish again (**File > Publish to Roblox**) so the settings are live.
5. Open the game page on roblox.com and press **Play**, or send the link to friends. Roblox puts people from any country on servers with free places, at any time. A new server starts by itself when the others are full.

I cannot press these buttons for you: they are in your Roblox account, not in the game's files.

## 2. How joining works in the game

* **Anybody can join at any time.** Up to **20 play in a match**.
* **Somebody who arrives in the first 45 seconds of a match (or during the countdown) jumps straight in. Somebody who arrives later waits in the lobby** (and can press "WATCH THE MATCH"). The screen shows a card: "MATCH IN PROGRESS", the mode and map, **how much time is left**, how many are playing (of 20) and how many are waiting, and **when their match starts** ("about 22:00"). When the match is nearly over it says "MATCH ENDING SOON!". The big screen on the lobby wall shows the same.
* While they wait they can walk around the courtyard, vote for the next map when the match ends, and read the boards.
* **The lobby waits at most 30 seconds, and only 15 when you are alone.** Then the match starts, and when fewer than 3 real players are here, god bots (Zeus, Athena, Ares...) fill it up to 6 so you always have somebody to play.
* If more than 20 are waiting, the ones who sat out the last match go first, then whoever has waited longest.

## 3. "I cannot get into the match": checklist

1. **Are you the only player?** The lobby counts down 15 seconds, then the match starts with god bots. For the real game (capture the flag, red against blue) you need a second player: in Studio use **Test > Clients and Servers > 2 Players**.
2. **Did you arrive while a match was on?** Then you are waiting by design. Look at the card at the top of the screen: it says when the next match starts. (Matches are 4 minutes. Anyone who arrives in the first 45 seconds jumps straight in. Use **Test > Clients and Servers** to start two players at the same time.)
3. **Is there a red "SERVER PROBLEM" box on the screen?** Take a screenshot of it. It lists what failed.
4. **Open View > Output** in Studio and look for lines starting with `[FigureMeOut]`. Send me those lines.
5. **A button seems dead?** Press **F8**: a line appears showing the last key or click the game received. All side buttons sit in a column below Roblox's own top bar (clicks there are swallowed by Roblox). Send me that line and a screenshot.
6. If the screen stays on the "FIGURE ME OUT" loading picture for more than 10 seconds, press **Stop** and **Play** again.

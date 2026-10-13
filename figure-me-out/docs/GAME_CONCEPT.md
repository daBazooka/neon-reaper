# FIGURE ME OUT: game concept

> **One line:** everybody wears a secret 3-digit number on their forehead. You can't see yours. Read theirs, take their lives,
> hide yours, and be the last one standing.

## A match (about 5 minutes)

1. **Lobby (14 s).** Everybody waits on a bright glass island and can practise with the binoculars, camera and emotes. Bots fill the match up to 10 so there is always a game (a match needs at least 2 "players"; real players can be up to 20).
2. **Countdown (8 s).** Everyone is placed on a street, frozen. Each player gets a unique colour + animal codename ("🦊 Red Fox"), a unique number from 001 to 999, 3 lives and the starting gadgets. 3, 2, 1, GO!
3. **Play (4 min).** Walk, hide, read, guess, scheme.
4. **The final 30 seconds.** The timer turns red and pulses, the music speeds up, a warning shows, and every plate glows so numbers are easier to read. No events start in this stretch.
5. **Results (12 s).** Winner, ranking, points, lives, survival time and your coins/XP. Then back to the lobby for the next match.

The match ends the moment one player is left. If time runs out, the tiebreak is **most lives, then most points, then most hits**.

## Lives, points and protection

* **3 lives.** A correct guess takes one. You glitch away (frozen 2 s, cartoon pixel burst), then pop up somewhere safe on the map.
* **Protected for 5 s** after coming back (a shield bubble). Nobody can guess you while it lasts.
* **Anti-farm:** you can't score on the same person again for 25 s.
* At 0 lives you are out: your number disappears and you spectate.
* **Points:** hit +100 (x2 in a Double Points event), bounty +150 (x3 in a Bounty Bonus), assist +40, a clear photo of a whole number +10 (once per person every 30 s), staying alive +5 every 20 s, winning +200.
* **Assist:** you photographed someone's whole number in the last minute and somebody else then gets them.

## Guessing

Press **G**. A panel opens with the people you can see (the one under the crosshair is chosen for you), a digit box, the cost of a wrong guess and your cooldown. Type three digits and press **CONFIRM** (or Enter). The panel never shows any number.

* **Right:** they lose a life, you get 2 bullets back.
* **Wrong:** you lose a bullet, freeze for 3 s, and the person you guessed gets an arrow pointing at you.
* Bullets: 5, one comes back every 25 s. You need a clear line of sight and at most 170 studs.
* The server decides everything: the client only asks.

## Gadgets (keys 1 to 8, or tap the slots; controller: L1/R1 to choose, A to use)

| # | Gadget | What it does |
|---|---|---|
| 1 | 🔭 Binoculars | Hold right mouse (or Z / L2). Zoom far (scroll for more). Slow walk while zoomed. Short cooldown. Can't see through walls. |
| 2 | 📷 Snapshot Camera | Click or F. The server works out who is in frame and which digits were readable (close + facing you = all three, medium = some, back turned or far = none). Clear numbers go in your 📒 notebook, joined up across photos. Close up, the person may notice the flash. |
| 3 | 💥 Flashbang | Thrown. Blinds whoever sees it go off, more if they look at it. A wall protects you. Turn away to blink less. |
| 4 | 💨 Smoke Grenade | A cloud nobody can see through for 15 s: no photos, no guesses, no reading. Never counts as "covering". |
| 5 | 🔔 Distraction Grenade | Thrown. Fake footsteps for 8 s. Bots (and people) go to check. |
| 6 | 📡 Scanner | Pings people within 45 studs, even through walls: you see where they are and their codename, never their number. Smoke blocks it. |
| 7 | 👟 Sprint Boost | Run much faster for 5 s (never while frozen, and binoculars still slow you). |
| 8 | 🎭 Decoy | Drops a copy of you for 30 s wearing a DIFFERENT number, with your codename. In a photo it looks like a person. Typing its number is a trap: it pops and freezes the shooter. Your real number never changes. |

Every gadget has a cooldown and (except 1 and 2) a limited number of charges. You start with 2 flashbangs, 2 smokes and 1 of everything else. Find more in glowing 🎁 crates (they refill after 30 s) and supply drops.

## Hiding without camping

* A wall right in front of your forehead for **1 s**: ⚠️ **NUMBER OBSTRUCTED!** with a countdown.
* **6 s**: **YOUR POSITION HAS BEEN REVEALED!** Your plate glows red and a 👁 marker shows over your head (visible through walls) for 20 s.
* Every earlier violation makes it longer (x1.5, x2, ...). The timer drains twice as fast when you turn away, so a quick look at a wall is fine. Smoke and flashbangs never count.

## Bounty, alliances, terminals, events

* **🎯 Bounty:** one player at a time wears a gold tag with the prize (never the number). Whoever hits them gets +150 points and 25 coins, then a new target is picked.
* **🤝 Alliances:** aim at another player and press **T**. If they accept you are allies for 90 s: a green marker on each other and a **SHARE** button in the notebook that sends your notes (you may lie!). Shooting your ally is allowed: it ends the alliance, they are told it was a betrayal, and you can't ally again for 60 s. Alliances give no extra points.
* **🔐 Information terminals** (four, in the plaza): hack one for a clue about **your own** number ("greater than 400", "even", "between 200 and 500"...). Every clue is true, you get 3 per match, with a pause between uses, and it shows your position to everybody for 5 s. That is the risk.
* **Bonus events** (announced 5 s ahead): ✨ Double Points, 🌙 Low Gravity, 🌑 Blackout, 🎯 Bounty Bonus (x3), 📦 Supply Drop.

## Progression (never pay-to-win)

* After every match: coins and XP (more for points and wins). Levels from XP.
* Spend coins in the menu on **trails**, **elimination effects** and **emotes**; **number plates** unlock with wins. Saved with DataStores. Nothing changes how strong you are.
* A match pays out once, even if something goes wrong.

## Screens

Loading screen, lobby (level, coins, waiting players), HUD (timer, alive count, bounty/alliance chips, lives, points, bullets, kill feed, hotbar with cooldowns), guess panel, notebook, gadget inventory (with your clues), emote panel, menu (how to play, cosmetics, plates, stats, settings), spectator bar, results.

## Look

A sunny early-2000s "Windows XP hills" afternoon with a Frutiger Aero feel: glossy aqua glass screens, pastel glass buildings, bubbles, a glass boundary wall and rolling green hills. Numbers appear only on the forehead plate.

## Map: "Neon Arcade Plaza"

A compact 3x3 city grid, bright but not washed out (slate streets, white sidewalks, saturated buildings, navy boundary walls with colourful banners):

* **Central plaza:** a neon-tile floor, a fountain and a tall landmark tower with neon rings and "FIGURE ME OUT" signs (you can see it from everywhere), trees, hedges and benches for cover, and the four information terminals in its corners.
* **Four corner buildings (ARCADE, PIZZA, BOWL, SYNTH):** hollow, each with two doorways facing the plaza, windows, a balcony reached by a staircase, a ladder to a roof with parapet cover, and a big roof sign so you always know where you are.
* **Four courtyards (MARKET WEST/EAST, DOCKS NORTH/SOUTH):** shipping-container cover forming alleys, a second level of containers, and an elevated walkway with a staircase at each end. The two MARKET courtyards are reserved as the team bases for Capture the Flag.
* Streets with lamps, crates for cover, 20 glowing spawn pads and 16 gadget crates.
* A separate floating lobby island with a how-to-play board and a top-winners board.

## What is next

1. Custom animated characters, a real song and sound effects from the Creator Store (the game makes its own sounds and music until then).
2. A second map and a 2-team mode.
3. Ranked mode with seasons, daily quests, a season pass.

# FIGURE ME OUT: game concept

> **One line:** everybody has a secret 3-digit number on their forehead. Type someone else's number and they are out.
> Hide yours, read theirs, be the last one standing.

## Why it works

| Need | What it means | What the game has |
|---|---|---|
| **A rule you get in 5 seconds** | no tutorial needed | "read the number on their head, type it" |
| **Tension every second** | you are hunter and prey at once | you can't see your own number, and someone is always watching |
| **Skill, not just luck** | better players win | aiming, binoculars, timing a flashbang, reading the crowd |
| **Stories to tell** | funny moments to share | "I swapped numbers with the guy who was about to shoot me" |
| **One more match** | short rounds | 5 minutes at most, ends the moment one player is left |

## A match

1. **Lobby (14 s).** Everybody waits on the island. Bots fill the match up to 10 players, so there is always a game. Up to 20 real players.
2. **Countdown (8 s).** Everybody is placed on the streets of Plaza Park, frozen. Each player gets a unique colour + animal codename ("🦊 Red Fox") and a unique 3-digit number (100 to 999).
3. **Play (up to 5 min).** Walk, hide, read, guess. Last one standing wins.
4. **THE REVEAL (last 30 s).** Every plate glows. Chaos.
5. **Results (12 s).** Ranking, numbers, kills. Wins unlock new forehead plates.

## Guessing

Aim at someone, press **G**, type their three digits. It fires on the third digit.

* **Right:** they are out, you get 2 bullets back.
* **Wrong:** you lose a bullet and freeze for 3 seconds. The person you guessed gets a red arrow pointing at you.
* You start with 5 bullets and earn one back every 25 seconds. Out of bullets = you can only hide and watch.
* You need a clear line of sight (walls and smoke block it) and a distance of at most 170 studs.

## Finding numbers

* **🔭 Binoculars (hold right mouse / Z / tap the slot).** Zoom far across the map (scroll to change zoom). You walk slowly while using them.
* **📷 Camera (click / F).** Takes a photo of everyone in the picture. The server decides which digits are readable: all three if they are close and facing you, some of them at medium range, none if their back is turned or they are too far. A photo of a flickering number shows the fake digits.
* **📒 Notebook (V).** Keeps what you learned. Several blurry photos of the same person add up to the full number, then press FIRE.

## Hiding (without camping)

You can't see your own number but you can turn your forehead away, break line of sight, or use items. What you can't do is stare into a wall:

* A wall right in front of your forehead for **1 second** = a red warning with a countdown.
* **6 seconds** = **EXPOSED**: your plate glows red and a 👁 marker shows over your head (visible through walls) for 20 seconds. Numbers are only ever shown on the forehead.
* The timer drains twice as fast when you turn away, so a quick look at a wall is fine.

## Items

Always with you: 🔭 binoculars and 📷 camera. The rest are carried in limited numbers and found in glowing 🎁 crates around the map (they refill after 30 s). Hotkeys 3 to 8.

| Item | What it does |
|---|---|
| 💥 Flashbang (start with 2) | Thrown. After 1.6 s it blinds everyone who can see it: longer if they look at it and the closer they are. A wall protects you. Blinded players can't zoom or take photos. You can blind yourself. |
| 💨 Smoke grenade (start with 2) | Thrown. A thick cloud for 15 s that nobody can see through: no photos, no guesses, no reading. |
| 🎭 Decoy | Drops a copy of you wearing a *different* number for 45 s. Guessing it right freezes the guesser for 6 s. Two copies of the same codename in your notebook means one of them is fake. |
| 📺 Scrambler | For 9 s your plate flickers through fake digits. Photos taken now are worthless. |
| 🔄 Switcheroo | Swaps numbers with the nearest person you can see (within 45 studs). Everything others learned about both of you is wrong now. |
| 👟 Speed boots | Run much faster for 6 s. |

## Everything else

* **Plates:** Classic, Gold (1 win), Neon (3), Hot Pink (6), Ice (10), Royal (20). Pick one in the menu (☰).
* **Stats:** wins, win streak, best streak, matches played, players eliminated. Saved between visits.
* **Top winners board** in the lobby (all-time, across servers once the game is published).
* **Spectating:** after you are out you watch the others (◀ ▶ to switch).
* **Bots** walk the streets, stand in view, and sometimes guess. They are clumsy on purpose.
* **Look:** a sunny early-2000s "Windows XP hills" afternoon with a Frutiger Aero feel: glossy aqua glass screens, pastel glass buildings, bubbles, a glass boundary wall and rolling green hills. Numbers appear only on the forehead plate.
* **Map:** "Plaza Park": a park in the middle, 8 buildings around it with ladders to sniper roofs, streets between, lamps and hedges for cover.

## What is built and what is next

**Built:** everything above, tested offline (see the README).

**Next (in the order I would do them):**
1. Custom animated characters, a real song and sound effects from the Creator Store (the game makes its own sounds and music until then).
2. Ranked mode with a rating and seasons.
3. A second map and a "team" mode (two teams, each wearing one number).
4. Daily quests and a season pass.

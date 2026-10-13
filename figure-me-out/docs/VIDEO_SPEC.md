# What the reference video shows, and how the Roblox game matches it

The reference is a 35-second vertical trailer (720 x 1280) of the Steam game "Figure Me Out" (the logo at the end says "coming to Steam this October"; the watermark is the creator's). I went through it frame by frame (one frame per second, then full-size frames of the HUD, the forehead sign, the photo and the scoreboard). Everything below is something I could **see**. Where the video does not show a rule, I say so and pick the most natural option.

## The idea (spoken captions + gameplay)

"In this game typing the number on someone's forehead kills them, so everyone's trying to figure out everyone else's number. The only thing you can't do is hide, because the game warns you if you cover your number in any way to stop campers. Flashbang and smoke that you can use to make it more difficult, plus binoculars that let you from across the map, or you snap a photo, run past, but be careful: 20 players in a match, everyone is always watching."

## What is on screen

| # | What the video shows | In the Roblox game |
|---|---|---|
| 1 | **4-digit numbers** on foreheads (9233, 2910, 1524, 3095, 309_) | Numbers are 1000-9999 (`Config.Number`) |
| 2 | The number is on a **flat mustard-yellow sign with black digits** stuck on the top of the forehead, over the hair; no glow, no frame | Default forehead plate is exactly that (`Config.PlateStyles` "classic"); plain, no bolts or neon |
| 3 | **Nothing floats above heads except the player's name**: small, white, slightly see-through (Nora, Rose, Honda) | Floating numbers are off; the name tag is small white text with no icon |
| 4 | **Typing**: no pad, no list. You aim at someone (a small white dot is the crosshair) and type; the digits appear **big and white in the lower middle of the screen** with underscores for the missing ones ("92__", "25__", "309_") | Same: `Keypad` in video style shows only the big readout; it sends by itself on the 4th digit. Phones get a number pad |
| 5 | **Kill message**: small white text at the bottom centre, "You killed Michael" | Same text, same place |
| 6 | **Top of the screen**: a red box and a blue box with a white number each, a small "-" between them, the **timer under them in small white digits** (21:32, 16:12) | Same layout (`HudVideo`). Matches run **25:00** |
| 7 | A **small flag icon** appears left of the red box (or right of the blue one) | It shows when that team's flag has been taken, so this is capture the flag. In the trailer the blue flag carrier runs with a flag pole on their back |
| 8 | **Three big X marks** under the timer (one red, two grey; later two red) next to the cover warning | They are the **strikes** for covering your number or camping. Red = a strike used |
| 9 | **Two item slots at the bottom, keys F and G**: rounded squares with a white outline, a little key tag at the bottom-left corner. Empty = dark and see-through; the selected one turns white with a dark icon | Same. Start: **F = camera, G = binoculars**. Flashbang, smoke and sound grenade (speaker icon) are picked up and take over a slot until used, then the camera or binoculars come back |
| 10 | **Binoculars**: big teal-and-black binoculars with orange rings fill the bottom of the screen; zooming shows a black figure-8 vignette | Same, in first person |
| 11 | **Camera**: a photo drops in as a **white polaroid** (picture, thick white border) | Same: a polaroid pops up showing what you caught of the number (digits you could read, "?" where it was too blurry) |
| 12 | **Cover warning**: a red warning triangle, a dark segmented bar filling red from the left, the words "don't cover your number" | Same |
| 13 | **Blur and white flash** (flashbang), a **white-out fog** (smoke), a speaker-icon grenade (sound / distraction) | Flashbang, smoke and sound grenade, as before |
| 14 | **Characters**: cartoon people with big heads, a plain T-shirt in the **team colour** (red or blue) and dark trousers; different hair; 20 on the map | Torso and arms in the team colour, dark trousers, no hats (so nobody covers the sign) |
| 15 | **Map**: a school courtyard with cream walls, an orange skirting, teal and yellow wooden boxes, a blue basketball court with white lines, wooden stairs and decks, hedges, planters, stacks of logs, stone paths, shipping lockers, trees, benches and tiled corridors | New map **School Yard** built in that style, the first map of the game. The other five maps stay as vote options |
| 16 | **Camera**: behind the character (third person), tilted down on the courtyard | As before (third person, mouse-wheel zoom) |
| 17 | **Respawn modes**: a score of 5 - 8 after 9 minutes | Capture the flag first to 10 captures, team fight first to 50 hits, or time up |

## Things the video does not show (my choices)

* What a wrong guess costs: kept as it was (a short freeze).
* What the third strike does: nothing extra beyond a longer "exposed" time each strike, so the game never feels unfair.
* Sounds and music: the trailer's soundtrack is not game audio, so the game keeps its own sounds.
* The title screen and the logo: those belong to the original game's creator. For your own Roblox listing use your own name and art (the generated art in `docs/icons` is yours).

## Added after the first version

* The video never shows a lobby, so the lobby is a courtyard in the same style as the School Yard map.
* The video shows the camera, binoculars, a **flashbang** (lightning-bolt icon), a smoke flask and a speaker (sound) grenade. The flashbang is the **stun grenade**: it blinds and freezes.
* Players keep their **real Roblox avatar and name** (the video's characters are the game's own models; on Roblox the player's avatar is the natural equivalent). Only hats are removed, and in team modes an outline in the team colour replaces the red/blue shirts.
* **Joining:** anybody can join any time, 20 play; late joiners wait in the lobby with a card showing the time left and when their match starts; a lone player gets a practice round.

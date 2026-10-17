# WOBBLE BOW: CrazyGames Submission

An original physics archery duel in one of CrazyGames' most-played single-player genres (ragdoll archery). Nothing is copied: all code, art, sound and names are our own. What sets it apart: wobbly verlet ragdolls that react to every hit, ring-outs (knock your rival off their pillar for an instant win), power orbs, 6 worlds with bosses, an endless arena and local 2-player.

## Game name
Wobble Bow

## Category
Shooting (if the portal doesn't offer it, use Action)

## Tags
Archery, Ragdoll, Physics, 2 Player, Stickman, Bow

## Description
Drag back, aim and let it fly! Wobble Bow is a physics archery duel between floppy ragdoll archers standing on stone pillars. Every arrow sticks where it lands and every hit sends your rival wobbling.

Land headshots for double damage, or knock your opponent right off their pillar for an instant ring-out. Shoot the floating power orbs for triple shots, fire arrows, mega arrows and extra health.

Fight through 60 levels in 6 worlds, from the Green Hills to the Sky Castle, against quick shooters, shield guards, bombers, medics, giants and kings. Earn coins to upgrade health, power, reload speed, aim line, grip and loot, and collect 14 hats. Then test yourself in the endless Arena, or challenge a friend on the same device in 2-player mode.

## Controls
Mouse or touch: drag back from anywhere to aim and set the power, release to shoot.
Keyboard: hold W or Space to aim (the bow sweeps up and down), release to shoot.
2 players: Player 1 holds W (or drags on the left half), Player 2 holds the Up arrow (or drags on the right half).
P: pause

## Platforms and orientation
Desktop and mobile. Landscape and portrait.

## Progress saving
Yes, through the CrazyGames SDK Data Module (localStorage fallback).

## Assets
- Game: `wobblebow/dist/index.html` (zip it). Single file, about 100 KB.
- Covers: `promo/cover-1920x1080.png`, `promo/cover-800x1200.png`, `promo/cover-800x800.png`. The only text is the game title.
- Videos: `promo/trailer-1920x1080.mp4` and `promo/trailer-1080x1620.mp4`. 18 seconds of gameplay, no logo, captions or end card.

## Notes for the reviewer
- First launch goes straight into Level 1. The controls are taught in gameplay with an animated hint that disappears after the first shot. Returning players see the menu, with a live duel playing behind it.
- Retention: 60 levels with 3-star ratings, upgrades, 14 hats (some unlocked with stars), missions that refill, a 7-day login reward, an endless Arena with a best wave, and local 2-player.
- SDK: init → loadingStart → save loaded → loadingStop; gameplayStart/Stop around each fight; happytime on 3-star wins and boss wins. No ads during Basic Launch.
- Escape is not used (pause is on P).
- All art and sound are made in code, with no third-party assets.

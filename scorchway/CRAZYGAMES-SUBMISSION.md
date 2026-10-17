# TORCH DRIFT: CrazyGames Submission

This is a heavily reworked version of SCORCHWAY. SCORCHWAY went through Basic Launch (26.09–08.10.2026) and was rejected for not reaching the performance benchmarks: CTR 0.5% (bottom 20%) and almost no returning players (552 plays from 509 players). The name SCORCHWAY is still taken by that rejected entry, so this version has a new name, new covers and a new long-term progression.

## Game name
Torch Drift

## Category
Driving

## Tags
Car, Drifting, Police, Explosion, Arcade, Upgrade

## Description
You have no guns, just a car that sets the ground on fire every time you drift. Lure the cars chasing you through your flames and watch them explode in chain reactions.

Take on 50 bounties across five regions, from the Dusty Flats to Ash Valley. Every bounty has one goal, such as torching chasers, surviving the heat or wrecking the Juggernaut. Finish fast to earn up to three stars. Stars open new regions and cars, and the cash you earn upgrades your engine, armor, fire and nitro in the workshop.

Come back every day for a growing daily reward, a new Daily Run and a garage stash that fills up while you're away. Or drive the endless highway and see how long you can survive the heat.

## Controls
Mouse: your car steers toward the cursor; turn hard to drift. Hold left button for nitro, right button for the handbrake.
Keyboard: A / D or arrow keys to steer, Space for the handbrake, Shift or W for nitro.
P: pause
1 / 2 / 3: pick a pit-stop upgrade
Mobile: drag to steer, hold the NITRO and DRIFT buttons.

## Platforms and orientation
Desktop and mobile. Landscape and portrait.

## Progress saving
Yes, through the CrazyGames SDK Data Module.

## Assets
- Game: `scorchway/dist/index.html` (zip it). Single file, about 155 KB.
- Covers (new, brighter, readable as small thumbnails): `promo/cover-1920x1080.png`, `promo/cover-800x1200.png`, `promo/cover-800x800.png`. The only text is the game title.
- Videos: `promo/trailer-1920x1080.mp4` and `promo/trailer-1080x1620.mp4`. 18 seconds of gameplay, no logo, captions or end card.

## Note for the reviewer
This game is a reworked version of our earlier submission SCORCHWAY, which was rejected after Basic Launch. What changed:
- New bounty career: 50 short bounties in 5 regions with 3-star ratings, region and car unlocks.
- Deeper workshop: upgrades now go to level 10 (previously 3).
- Daily retention features: a 7-day login reward, a garage stash that fills while the player is away, plus the existing Daily Run and missions.
- First-time players start directly in Bounty 1 (no menu), with the controls shown in gameplay.
- Escape is no longer used (pause is on P).
- SDK: init → loadingStart → save loaded → loadingStop; gameplayStart/Stop around real play; happytime on bounty completion, big burn chains and boss wrecks. No ads during Basic Launch.
- All art and sound are made in code, with no third-party assets.

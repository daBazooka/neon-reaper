# WRECKING DRIFT: CrazyGames Submission

Everything below follows CrazyGames' published requirements (Gameplay, Technical, Quality guidelines, Game covers, Video).

## Game name
WRECKING DRIFT

## Category
Driving

## Tags
Car, Drifting, Physics, Destruction, 2 Player, Arena

## Description
Your car drags a wrecking ball on a chain. Drift to swing it into enemy cars and wreck them before they wreck you.

Clear each round to pick an upgrade, such as twin balls, a fire ball or drift nitro. Every fifth round brings a boss. Explosive barrels, crates and five arenas give every fight something to smash. Earn coins to unlock new cars and wrecking balls in the garage.

Play the Wrecking Cup alone, or challenge a friend in 2-player mode on the same keyboard. First to 5 wrecks wins.

## Controls
Arrow keys or WASD: drive and steer
Space: drift (swings the ball)
P: pause
1 / 2 / 3: pick an upgrade
2 Player: Player 1 uses WASD + Space, Player 2 uses the arrow keys + Enter
Mobile: drag to steer, hold DRIFT to drift

## Platforms and orientation
Desktop and mobile. Landscape and portrait.

## Progress saving
Yes, through the CrazyGames SDK Data Module (localStorage fallback).

## Assets
- Game: `wreckdrift/dist/index.html` (zip it). Single file, 125 KB.
- Covers: `promo/cover-1920x1080.png` (16:9), `promo/cover-800x1200.png` (2:3), `promo/cover-800x800.png` (1:1). The only text on them is the game title, with no borders.
- Videos: `promo/trailer-1920x1080.mp4` (landscape 16:9) and `promo/trailer-1080x1620.mp4` (portrait 2:3). 18 seconds of gameplay each, under 50 MB, with no logo screens, black transitions, black bars, captions or mouse cursor.

## Requirements check
- **Gameplay:** one click from the title screen (PLAY CUP) starts gameplay. English text throughout.
- **Onboarding:** a visual control overlay inside gameplay during the first runs. It is skippable and hides itself once the player has driven, drifted and wrecked a car.
- **Keys:** Escape is not used (browser-reserved). Pause is on P and the pause button.
- **SDK:** init → loadingStart → save loaded → loadingStop. gameplayStart/gameplayStop wrap real gameplay (stopped on menus, the upgrade screen, pause, game over and when the tab is hidden). happytime on a boss wreck and a 2-player win. The portal mute setting mutes all audio.
- **Ads:** none in Basic Launch (`ADS_ENABLED = false`). The midgame and rewarded hooks are ready for Full Launch.
- **Technical:** about 125 KB total, one file, no external requests besides the CrazyGames SDK, loads in under a second.
- **Content:** original game and name. All art and sound are made in code with no third-party assets. Cartoon cars, no blood, no chat. Suitable for all ages.

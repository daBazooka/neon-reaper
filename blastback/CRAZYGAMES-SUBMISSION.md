# BLASTBACK: CrazyGames Submission

Everything below follows CrazyGames' published requirements (Gameplay, Technical, Quality guidelines, Game covers, Video).

## Game name
BLASTBACK

## Category
Shooting

## Tags
Shooter, Physics, Platformer, Arcade, 2 Player, Boss

## Description
Your gun is your only way to move. Every shot kicks you the opposite way, so you aim down to fly up and shoot sideways to dash. You have a few shots per magazine, and landing on a platform or stomping an enemy reloads you. Don't fall into the lava.

Clear waves of slimes, bats, drones and bomb bugs, and pick a power after every wave, such as triple shot, bouncy bullets or explosive rounds. Every fifth wave brings a boss. Earn coins to unlock new guns and colors.

Play alone, or duel a friend in 2-player mode on the same keyboard. First to 5 wins.

## Controls
Mouse: aim, click to shoot
Keyboard: A / D or arrow keys to aim, Space or W to shoot
P: pause
1 / 2 / 3: pick a power
2 Player: Player 1 aims with A / D and shoots with W. Player 2 aims with the left and right arrow keys and shoots with the up arrow.
Mobile: tap where you want to shoot

## Platforms and orientation
Desktop and mobile. Landscape and portrait.

## Progress saving
Yes, through the CrazyGames SDK Data Module (localStorage fallback).

## Assets
- Game: `blastback/dist/index.html` (zip it). Single file, about 104 KB.
- Covers: `promo/cover-1920x1080.png` (16:9), `promo/cover-800x1200.png` (2:3), `promo/cover-800x800.png` (1:1). The only text on them is the game title, with no borders.
- Videos: `promo/trailer-1920x1080.mp4` (landscape 16:9) and `promo/trailer-1080x1620.mp4` (portrait 2:3). 18 seconds of gameplay each, under 50 MB, with no logo screens, black transitions, black bars, captions or mouse cursor.

## Requirements check
- **Gameplay:** one click from the title screen (PLAY) starts gameplay. English text throughout.
- **Onboarding:** a visual control overlay inside gameplay during the first runs. It is skippable and hides itself after the player has shot three times and defeated two enemies.
- **Keys:** Escape is not used (browser-reserved). Pause is on P and the pause button.
- **SDK:** init → loadingStart → save loaded → loadingStop. gameplayStart/gameplayStop wrap real gameplay (stopped on menus, the power screen, pause, game over and when the tab is hidden). happytime on a boss defeat and a 2-player win. The portal mute setting mutes all audio.
- **Ads:** none in Basic Launch (`ADS_ENABLED = false`). The midgame and rewarded hooks are ready for Full Launch.
- **Technical:** about 104 KB total, one file, no external requests besides the CrazyGames SDK.
- **Content:** original game and name. All art and sound are made in code with no third-party assets. Cute cartoon monsters, no blood, no chat. Suitable for all ages.

# TOAST TO THE MOON: CrazyGames Submission

A launch-and-upgrade game, built on the pattern in `CRAZYGAMES-CHECKLIST.md`. Every run is short (20–60 s), every run earns coins, every upgrade makes the next run visibly higher, and there is one clear goal on screen at all times: the Moon at 8,000 m.

## Game name
Toast to the Moon

## Category
Action (if the portal offers Arcade, that fits too; Clicker is a weaker fit, since play is real-time steering, not clicking)

## Tags
Upgrade, Flying, Physics, Idle, Cute, One Button

## Description
A slice of toast has one dream: the Moon. Tap to launch it out of the toaster, then bounce off balloons, birds, satellites and UFOs to climb higher. Steer toward the next boost and fire the jam jets when you're falling.

Every flight earns coins. Spend them on a stronger toaster, more jam, bouncier crusts, butter steering, crumb coins and a coin magnet, then launch again and fly higher than before. Pass through the Back Garden, the Rooftops, Cloud Town, Sky High, the Stratosphere and Space, and dodge storm clouds, planes and meteors along the way.

Unlock 7 more breads, from rye and bagels to waffles, croissants and the Golden Toast, each with a bonus. Missions that refill as you complete them, a 7-day login reward and a bakery that bakes coins while you're away give you a reason to come back every day.

## Controls
Mouse: click to launch. The toast steers toward your cursor; hold the left button for jam jets.
Keyboard: Space or W to launch and for jam jets, A / D or arrow keys to steer.
P: pause
Mobile: tap to launch, drag to steer, hold the JET button.

## Platforms and orientation
Desktop and mobile. Landscape and portrait.

## Progress saving
Yes, through the CrazyGames SDK Data Module (localStorage fallback).

## Assets
- Game: `toastmoon/dist/index.html` (zip it). Single file, about 76 KB.
- Covers: `promo/cover-1920x1080.png`, `promo/cover-800x1200.png`, `promo/cover-800x800.png`. The only text is the game title.
- Videos: `promo/trailer-1920x1080.mp4` and `promo/trailer-1080x1620.mp4`. 18 seconds of gameplay, no logo, captions or end card.

## Notes for the reviewer
- Gameplay starts with one tap: no menu or loading screen in between. The first run teaches the controls in gameplay, with a visual hint that can be skipped.
- SDK: init → loadingStart → save loaded → loadingStop; gameplayStart/Stop around each flight; happytime on a new best altitude and on reaching the Moon. No ads during Basic Launch.
- Escape is not used (pause is on P).
- All art and sound are made in code, with no third-party assets.

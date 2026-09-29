# CrazyGames checklist

Lessons from 11 submissions (6 approved, 5 rejected with "overall quality does not yet meet the expectations of our platform").

## Concept
- **One hook you understand in 5 seconds.** Every approved game has one: dig pits under monsters (DIGFORT), a blade that grows (GROWBLADE), fight beside echoes of yourself (ECHO LEGION), drifting sets fire (SCORCHWAY), kite fighting (BO KATA).
- **Avoid crowded genres** where the game gets compared with big polished hits: horde survival (Neon Reaper, TIMBERFALL), merge-idle (ORBITOPIA), plain slingshot (CHAINFLING). If you use a known genre, the twist has to be the whole game, not a feature.
- **Don't resubmit a rejected game unchanged.** Neon Reaper was rejected 3 times.

## First 10 seconds
- The first screen a player sees should already be playable or one tap away.
- The core action should pay off within seconds (a reveal, an explosion, a chain).
- Bright, readable visuals from the first frame. Avoid dark, murky openings.

## Covers (they decide the CTR)
- **One big hero and one clear idea.** It must still read at thumbnail size (~230×130).
- **High contrast.** Dark backgrounds with glowing action, or bright scenes with dark outlines. No beige-on-beige.
- **Big title** with a thick outline, plus at most one short tagline.
- Check every cover scaled down to 240 px wide before uploading.

## Technical (already done in every game here)
- SDK v3: `init` → `loadingStart` → read save from the Data Module → `loadingStop`.
- `gameplayStart`/`gameplayStop` around real play, pauses and menus. `happytime` on big wins.
- No ads during Basic Launch. Portal mute respected. No third-party assets.
- Works on desktop and mobile, landscape and portrait, and offline as a single file.
- Double-check the title spelling in the submission form.

# CrazyGames checklist

Lessons from 17 submissions: 6 approved (Basic Launch), 8 rejected with "overall quality does not yet meet the expectations of our platform", 3 awaiting review (as of 1 Oct).

| Approved | Rejected | Awaiting |
|---|---|---|
| DIGFORT, GROWBLADE, LUMIBLOOM, ECHO LEGION, SCORCHWAY, BO KATA | Neon Reaper (×3), CHAINFLING, ORBITOPIA, TIMBERFALL, UNDERNEATH, CRITICAL MASS, FIREFLY LASSO, KALEIDREAM | TIDECALLER, SNOWBALL EFFECT, ABYSS HOOK |

## What separates approved from rejected
- **Approved games are all active, real-time skill games in a genre CrazyGames players already search for** (driving, brawler, sword action, tower defense, a fighting game), each with one twist you can say in a sentence.
- **Rejected games fall into four buckets:**
  1. *Low-agency, hyper-casual cores:* one tap (CRITICAL MASS), scrub to reveal (UNDERNEATH), merge-idle (ORBITOPIA), one-gesture slingshot (CHAINFLING).
  2. *Crowded genres where we look like a smaller copy of a big hit:* horde survival (Neon Reaper, TIMBERFALL).
  3. *Too close to one of our own approved games:* FIREFLY LASSO is a second loop-drawing game after LUMIBLOOM.
  4. *No single core:* KALEIDREAM changes game every few seconds, so there is nothing to master.
- **Every approval came from the first batch (26–28 Sep).** Everything submitted after it was rejected or is still waiting. Part of that is likely the buckets above, but submitting ~2 games a day probably also hurts: fewer, deeper submissions are safer.

## After approval: Basic Launch numbers (from the portal)
- Plays 105–458, average playtime 3:19–8:09 (SCORCHWAY best at 8:09).
- Moving to Full Launch needs at least 7 days and 500 plays, then strong engagement. CrazyGames' own guide says successful titles see **10+ minutes average playtime** and **10–15 % day-1 retention**. Our games are under both, so depth and reasons to come back (garage, daily reward, missions) matter as much as the hook.

## Concept
- **One hook you understand in 5 seconds.** Every approved game has one: dig pits under monsters (DIGFORT), a blade that grows (GROWBLADE), fight beside echoes of yourself (ECHO LEGION), drifting sets fire (SCORCHWAY), kite fighting (BO KATA).
- **Pick a genre CrazyGames players search for** (car/driving, action, shooting, 2-player, .io) and add one twist. A local 2-player mode is a cheap win: "2 player games" is one of the site's biggest tags.
- **Avoid crowded genres** where the game gets compared with big polished hits: horde survival (Neon Reaper, TIMBERFALL, and WITCHLIGHT is in the same bucket), merge-idle (ORBITOPIA), plain slingshot (CHAINFLING).
- **Avoid passive cores** (one tap, scrub, idle) and **never repeat our own approved hooks** (FIREFLY LASSO vs LUMIBLOOM). If you use a known genre, the twist has to be the whole game, not a feature.
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

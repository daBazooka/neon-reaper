# CrazyGames checklist

## Status on 17 Oct: every game is rejected
All 24 submissions show "Rejected", including the 6 that had been in Basic Launch.

**Why the 6 Basic Launch games were rejected (metrics gate).** Basic Launch ends after 7 days and 500 plays, or after 21 days. Ours started 26–28 Sep, so it ended around 17 Oct. Promotion to Full Launch depends on playtime, conversion and day-1 retention, benchmarked against other games:

| Metric | Our 6 games | Platform average | Action / Shooting average | "Strong" games |
|---|---|---|---|---|
| Day-1 retention | 1.1–1.9 % | 6.7 % | 8.1 % / 6.5 % | 10–15 % |
| Avg playtime | 3:19–8:09 | – | ~13 min / ~12 min | 10+ min |
| Conversion (1 min) | 48–75 % | – | – | top games 80 %+ |

Day-1 retention was 4–6× below the platform average. No cover, video or listing change fixes that: almost nobody came back the next day.

**Why the other 18 were rejected (initial review).** CrazyGames does not give per-game reasons. Likely factors: shallow games (a hook but no reason to keep playing for days), genres where we look like a smaller copy of a big hit, games too similar to our own earlier ones, and about 24 submissions from one account in about 3 weeks.

**What the games that pass have in common (from CrazyGames' docs and developer reports).**
- A long progression players care about across days: levels, unlocks, upgrades, an incremental layer. Liquid Swarm (an incremental roguelite that passed) had metrics "many in the top 20%".
- Daily hooks: login bonuses, daily quests.
- Progress saved through the Data Module.
- Polish, with no rough edges, and the mobile first minute working (One More Fly failed mainly on mobile conversion).
- Tuning based on real player data (A/B tests, analytics such as ByteBrew), not bots.

**New rules for us.**
1. One game at a time, developed over weeks, not hours.
2. Real people play it before submission. Measure playtime and whether they come back the next day.
3. Target day-1 retention of 8 % or more and playtime of 12 minutes or more before submitting.
4. Resubmit only after meaningful improvements (CrazyGames FAQ).
5. Ask CrazyGames support why the initial-review rejections happened.

## What the most-played CrazyGames games have in common (research, 17 Oct)
CrazyGames' own homepage lists its most popular games as Shell Shockers, Agar.io, Uno Online, Geometry Dash, Moto X3M, Smash Karts, GeoGuessr and Hangman. On mobile, Bloxd.io and Ragdoll Archers lead. Zombie Launcher X reportedly held #1 for six weeks, and idle tycoons and merge puzzles are among the top single-player picks. Liquid Swarm, an incremental roguelite, passed Basic Launch with metrics in the top 20 %.

Patterns:
1. **Familiar format, understood in one second.** No hit needs a tutorial.
2. **Short attempts with constant visible progress.** Levels (Moto X3M, Geometry Dash) or launch → earn → upgrade → launch further (Zombie Launcher X). Every attempt makes the player measurably stronger.
3. **A long goal you can see from the first minute** (finish all levels, reach the end, max everything).
4. **Incremental and idle layers keep sessions long** (clicker average 15 min, versus 12–13 for shooting and action).
5. **Multiplayer drives the very top**, but needs servers. That isn't possible for a single-file game, so we use the single-player patterns above.

**What our 24 games did instead:** a new, unfamiliar mechanic every time, runs that ended with little permanent gain, and no visible long goal.

**Next game:** a launch-and-upgrade game. Every attempt takes 15–40 s and ends on an upgrade screen. The goal (reach the Moon) is visible from the first launch. A bakery earns coins while you're away, and there are a daily reward, missions and collectible breads.

---

## Earlier notes

Lessons from 22 submissions: 6 approved (Basic Launch), 12 rejected with "overall quality does not yet meet the expectations of our platform", 4 awaiting review (as of 1 Oct).

| Approved | Rejected | Awaiting |
|---|---|---|
| DIGFORT, GROWBLADE, LUMIBLOOM, ECHO LEGION, SCORCHWAY, BO KATA | Neon Reaper (×3), CHAINFLING, ORBITOPIA, TIMBERFALL, UNDERNEATH, CRITICAL MASS, FIREFLY LASSO, KALEIDREAM, TIDECALLER, SNOWBALL EFFECT, ABYSS HOOK, WITCHLIGHT | WRECKING DRIFT, FLIPPER RAID, SCRIBBLE SKY, MOCHI MOB |

## CrazyGames' exact rules (from docs.crazygames.com)
- **Gameplay:** land new players in gameplay immediately, or after at most 1 click. English is required.
- **Onboarding:** inside gameplay, skippable, visual rather than text, and it shows the controls (a keyboard overlay or mouse gesture).
- **Keys:** never bind Escape (the browser uses it to exit fullscreen).
- **Technical:** initial download ≤ 50 MB (≤ 20 MB for the mobile homepage), total ≤ 250 MB, ≤ 1500 files. Top games convert 80 %+ of players and load in under 10 s.
- **Covers:** 1920×1080 (16:9), 800×1200 (2:3), 800×800 (1:1). Consistent across all three. No borders. **No text except the game title**: no taglines, no "New", "Play" or "Play now".
- **Video:** **15–20 s**, ≤ 50 MB, two files: landscape 1080p 16:9 **and portrait 1080p 2:3 (1080×1620)**. No black screens, no logo transitions, no black bars, no default mouse cursor. Keep it pure gameplay.
- Every game before WRECKING DRIFT broke the cover rule (taglines) and the video rule (30+ s, 9:16 portrait, captions and a logo end card). Most also used Escape to pause.

## What separates approved from rejected
- **Approved games are all active, real-time skill games in a genre CrazyGames players already search for** (driving, brawler, sword action, tower defense, a fighting game), each with one twist you can say in a sentence.
- **Rejected games fall into four buckets:**
  1. *Low-agency, hyper-casual cores:* one tap (CRITICAL MASS), scrub to reveal (UNDERNEATH), merge-idle (ORBITOPIA), one-gesture slingshot (CHAINFLING).
  2. *Crowded genres where we look like a smaller copy of a big hit:* horde survival (Neon Reaper, TIMBERFALL).
  3. *Too close to one of our own approved games:* FIREFLY LASSO is a second loop-drawing game after LUMIBLOOM.
  4. *No single core:* KALEIDREAM changes game every few seconds, so there is nothing to master.
- **Every approval came from the first batch (26–28 Sep).** Everything submitted after it was rejected or is still waiting. Part of that is likely the buckets above, but submitting ~2 games a day probably also hurts: fewer, deeper submissions are safer.

## After approval: Basic Launch numbers (from the portal)
- Plays 105–458, average playtime 3:19–8:09 (SCORCHWAY best at 8:09), day-1 retention 1.1–1.9 %, conversion 48–75 %, CTR 0.5–1.0 %.
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

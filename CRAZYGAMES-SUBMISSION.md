# NEON REAPER — CrazyGames Submission Listing

Copy-paste ready content for the CrazyGames developer submission form.
All numbers below are pulled directly from the live game code, not estimated.

---

## Title

**NEON REAPER**

---

## Short description (card / thumbnail, ~150 chars)

Dodge, level up, and evolve unstoppable builds in this neon arena survivor — 29 deployments, 17 heroes, and 10 emotional rescue stories.

---

## Long description (game page)

You don't aim. You don't reload. You just move.

NEON REAPER drops you into a glowing arena where your weapons fire
themselves and the only thing standing between you and the swarm is
how well you dodge. Every level-up stacks another weapon or power onto
your build — orbiting blades, chain lightning, homing missiles,
gravity wells — until a run that started with one weak blaster ends in
a screen-filling storm of your own making.

**Ten stories, ten reasons to fight.** Play through fully voiced,
hand-written rescue stories — a parent searching for a stolen child, a
sibling breaking another out of a cage, a marriage a villain believes
he's entitled to end. Each relation has its own cast, its own villain,
its own ending, and its own emotional score that shifts through ten
distinct musical moods to match the moment.

**17 playable Reapers, no two alike.** Every hero has a unique
silhouette, a unique weapon, and a unique ultimate ability — from a
glass-cannon striker who dashes through a spray of shrapnel, to a
walking fortress who shrugs off hits an ordinary run couldn't survive.

**29 curated deployments.** Classic survival, Boss Rush (a new boss
every 45 seconds), Hardcore (one life, no mercy), Time Attack, and a
gentle Easy mode built for a first try — each playable across 6
distinct hazard arenas (ice, lava, gravity rifts, toxic swamp, storm
zones) that change how every fight actually plays out.

**A real progression loop.** Permanent meta-upgrades that carry across
every run, 34 achievements, a daily login streak, and a spin-the-wheel
reward mechanic that replaces watching ads with an actual mini-game —
every spin's worst outcome is still better than what it replaced.

No account required. No paywall to start. Just move.

---

## Category

**Primary:** Action

**Secondary (if the form allows more than one):** Arcade / Shooting

---

## Tags / keywords

survivor, bullet heaven, roguelite, roguelike, arena shooter,
auto-battler, action rpg, boss rush, wave survival, endless,
progression, upgrade, story, narrative, emotional, family, rescue,
neon, cyberpunk, synthwave, procedural music, voiced cutscenes,
character select, permadeath, hardcore mode

---

## Controls

- **Move:** Drag (touch) or WASD / arrow keys — weapons fire automatically
- **Ultimate ability:** SPACE (or the on-screen button)
- **Confirm / skip cutscene:** ENTER
- **Pause:** P (or the pause button)

Fully playable on both touch and keyboard+mouse. Built mobile-first
(portrait-optimized), runs the same on desktop.

---

## Content note (for the reviewer, if the form has a notes field)

The story mode's narrative theme is a family member being taken by an
antagonist and the player's fight to rescue them, across 10 different
family relationships. It's written with restraint — no graphic
violence, no gore — but the premise itself (a missing/abducted loved
one) is emotionally heavier than a typical arcade shooter's plot. Flag
this proactively so it's a known quantity going into review rather
than a surprise; happy to add a stated content advisory in-game if
CrazyGames wants one visible to players.

---

## Technical notes (for your own reference, not for the form)

- Single HTML file, zero external image/audio assets — all art is
  procedural canvas, all audio is synthesized Web Audio. No licensing
  risk from third-party assets.
- CrazyGames SDK v3 already integrated: `init`, `loadingStart/Stop`,
  `gameplayStart/Stop` are called correctly around every state
  transition (run start, pause/resume, revive, chest, cutscenes,
  death). Rewarded + midgame ad calls are wired in, with a working
  fallback if the ad SDK isn't present, so a preview build never
  breaks.
- GLOBAL leaderboard/chat and PLAY WITH FRIENDS are currently
  **inactive by design** — `FIREBASE_CONFIG` near the top of
  `index.html` still holds placeholder values. Both features are
  fully built and will switch on automatically the moment real
  Firebase credentials are filled in; until then, their buttons are
  deliberately hidden rather than shown broken (CrazyGames rejects
  submissions with a non-functional invite button).

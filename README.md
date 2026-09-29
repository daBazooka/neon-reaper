# neon-reaper

This repo holds ten standalone HTML5 games, plus BO KATA, a mobile game project.

| Game | Path | What it is |
|---|---|---|
| **NEON REAPER** | `index.html` | A story-driven arena survivor. See `CRAZYGAMES-SUBMISSION.md`. |
| **CHAINFLING** | `chainfling/` | A one-gesture slingshot action game: drag to slow time, fling, and chain kills. See `chainfling/CRAZYGAMES-SUBMISSION.md`. |
| **DIGFORT** | `digfort/` | A block-world tower defense where you mine the ground out from under the monsters. See `digfort/CRAZYGAMES-SUBMISSION.md`. |
| **GROWBLADE** | `growblade/` | A sword game where the blade slices shapes exactly along its path and grows with every cut. See `growblade/CRAZYGAMES-SUBMISSION.md`. |
| **LUMIBLOOM** | `lumibloom/` | A wholesome loop-drawing game: circle sleeping flowers with a ribbon of light to make them bloom, paint the meadow and free shadow critters. See `lumibloom/CRAZYGAMES-SUBMISSION.md`. |
| **ECHO LEGION** | `echolegion/` | A neon arena brawler: every 5 seconds your past self becomes an echo that replays your moves, so you fight with an army of yourself. See `echolegion/CRAZYGAMES-SUBMISSION.md`. |
| **SCORCHWAY** | `scorchway/` | A top-down desert car chase where drifting sets the ground on fire and pursuers explode in chain reactions. See `scorchway/CRAZYGAMES-SUBMISSION.md`. |
| **BO KATA** | `bokata/` | A real-time kite-fighting game on festival rooftops, packaged as a web game and as native Android and iOS apps (Capacitor). See `bokata/README.md`. |
| **ORBITOPIA** | `orbitopia/` | A physics merge-idle game: fling stardust into orbit, merge twins into moons, planets, stars and black holes, grow life and go Supernova. See `orbitopia/CRAZYGAMES-SUBMISSION.md`. |
| **TIMBERFALL** | `timberfall/` | A lumberjack night-survival game where every tree is a weapon: chop, aim the fall and crush creatures in domino chains until dawn. See `timberfall/CRAZYGAMES-SUBMISSION.md`. |
| **UNDERNEATH** | `underneath/` | A satisfying scrub-and-discover game: clean the grime off a painting, find treasure, creatures and 12 hidden secrets, then dive into the painting beneath the painting. See `underneath/CRAZYGAMES-SUBMISSION.md`. |
| **CRITICAL MASS** | `criticalmass/` | A one-tap chain reaction game: set off one blast, watch every popped atom blast the next, and wipe the whole screen. 10 atom types, boss reactors, upgrades, an endless OVERLOAD mode and a Daily Reactor. See `criticalmass/CRAZYGAMES-SUBMISSION.md`. |
| **TIDECALLER** | `tidecaller/` | You don't steer the boat, you ARE the ocean: raise the tide over reefs, drop it under sea caves, flick it up to fling the boat over mines and Kraken arms, and catch it softly for a Perfect Catch. Missions, ranks, 7 ships, 6 biomes. See `tidecaller/CRAZYGAMES-SUBMISSION.md`. |

Run any of them locally with any static server, for example
`npx http-server .`, then open `/`, `/chainfling/`, `/digfort/`, `/growblade/`, `/lumibloom/`, `/echolegion/`, `/scorchway/`, `/orbitopia/`, `/timberfall/`, `/underneath/`, `/criticalmass/` or `/tidecaller/`. Each game's `dist/index.html` is a single-file build (for TIMBERFALL, UNDERNEATH, CRITICAL MASS and TIDECALLER, rebuild it with that folder's `build.py`).

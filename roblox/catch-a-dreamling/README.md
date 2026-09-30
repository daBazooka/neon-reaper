# CATCH A DREAMLING!

A Roblox catching and collecting game. Glowing dream creatures drift into a shared meadow and everyone
races to catch them. You carry them home to jars on your floating island, where they earn Sparkles.
Every few minutes a server-wide **Dream Event** changes the world for everyone.

## Play it in 30 seconds
1. Open **Roblox Studio**, then **File → Open from File…** and pick `CatchADreamling.rbxlx`.
2. Press **Play**. The whole world (meadow, 8 islands, jars, lighting, sky) is built by the scripts when the server starts.
3. To test with friends, go to **Test → Clients and Servers → 2 Players → Start**.

No meshes, images or uploaded assets are used. Everything is made from parts and scripts.

## What's in the game
- **24 dreamlings** across 7 rarities: Common, Uncommon, Rare, Epic, Legendary, Mythic and Secret.
  Legendary and rarer spawns get a beam of light and a server-wide announcement, so everyone runs for them.
- **Mutations:**
  - Golden x3, Rainbow x6, Disco x4, Galaxy x10, Giant x2, Tiny x1.5.
  - Your Lucky Charm can also mutate a dreamling at the moment you catch it ("LUCKY MUTATION!").
- **The catch race:**
  - Press **E** (or tap) to start catching; the time it takes depends on rarity and your net.
  - Several players can try to catch the same dreamling, and the first to finish wins it.
  - Dreamlings float above your head while you carry them home.
- **Jars on your island** earn Sparkles every second. Collect them by stepping on the glowing pad.
  Three identical dreamlings **merge** into one with +1 ★, which triples its income (up to ★5).
- **Upgrades:**
  - Faster Net, Longer Net, Dream Boots, Bigger Bag and Lucky Charm.
  - Up to 16 jar slots.
  - **Rebirths** reset your run for +50% Sparkles each, forever.
- **9 Dream Events**, one every ~3 minutes for 60 seconds:
  - Disco Night, Low Gravity, Starfall (Legendaries crash down from the sky), Golden Hour.
  - Candy Rain, Giant Dreamlings, Speed Surge, Rainbow Storm.
  - The rare Secret Hour.
- **Dreamdex** with 3D renders, **3 daily quests**, a **7-day login streak**, offline earnings (up to 8 h),
  a guided tutorial, and an all-time **leaderboard** in the meadow.

## Publish it
1. In Studio: **File → Publish to Roblox**.
2. **Game Settings → Security → Enable Studio Access to API Services** turns on saving in Studio. Live servers save anyway.
3. **Game Settings → Places → Max Players = 8**: there are 8 islands per server.
4. Make the experience public in the Creator Hub, then upload the icon and thumbnails from `promo/`.

## Earn Robux (optional)
In the Creator Hub, create these under your experience's **Monetization** page, then paste the IDs into
`ReplicatedStorage → Shared → Config` (`Config.GamePasses` / `Config.Products`).
Anything left at `0` is hidden, and the in-game Store button only appears once an ID is set.

| Type | Name | What it does |
|---|---|---|
| Game pass | DoubleSparkles | 2x Sparkles forever |
| Game pass | VIP | +1 bag slot, +10% luck, golden VIP tag |
| Game pass | AutoCollect | Sparkles go straight to your balance |
| Game pass | SuperLuck | +50% mutation luck |
| Dev product | LuckPotion | x2 luck for 10 minutes |
| Dev product | SparklePack | 30 minutes of income instantly |
| Dev product | SummonStarfall | Starts a Starfall event for the whole server |

## Music
There are no music tracks included (Roblox audio has to come from the Creator Store). Pick a free track in
**Creator Store → Audio**, then put its ID in `MUSIC_ID` near the top of `StarterPlayerScripts → Client`.

## Code layout (Rojo project)
| Path | What it is |
|---|---|
| `src/shared/Config.luau` | All numbers: species, rarities, mutations, upgrades, events, pass IDs |
| `src/shared/Logic.luau` | Pure game rules (income, merging, rolls, costs) |
| `src/shared/Builder.luau` | Builds each dreamling from parts |
| `src/server/World.luau` | Builds the world and lighting |
| `src/server/Game.luau` | Spawning, catching, carrying, jars, events, quests |
| `src/server/Data.luau` | DataStore saves |
| `src/server/Main.server.luau` | Players, remotes, purchases, loops |
| `src/client/Client.client.luau` | All UI and client effects |

Rebuild the place file after editing: `rojo build default.project.json -o CatchADreamling.rbxlx`.

## How it was checked
- `luau-lsp analyze` against the Roblox API type definitions: no errors.
- `lune run tests/logic.test.luau`: rule unit tests plus a 4-hour pacing simulation.
- `lune run tests/server-runtime.luau` and `tests/client-runtime.luau` run the real world builder, all 168
  dreamling variants, the server mechanics and every UI screen against Roblox's reflection data, which rejects
  any invalid property or type.
- It has **not** been played inside Roblox Studio itself, so expect small tuning on your first playtest
  (sizes, lighting taste, pacing).

# GROWBLADE — CrazyGames Submission Listing

Upload `dist/index.html` zipped on its own. That single file is the whole game.

## Title
**GROWBLADE**

## Category
**Primary:** Action · **Secondary:** Io / Arcade

## Tags
sword, slice, cutting, io, growing, arcade, action, satisfying, physics, combo, roguelite, upgrades, boss, high score, casual, mobile

## Short description
Slice shapes exactly where your sword cuts them. Every cut grows your blade, from a tiny dagger to a Worldcleaver!

## Long description
**Slice anything. Your sword grows with every cut.**

Your sword spins around you. Move into shapes and it cuts them **exactly along the line of the blade**: big shapes split into two smaller halves that keep coming, and small pieces shatter into gems. Cut dead-center for a **PERFECT HALF** and double gems.

Every gem makes your blade longer, taking it from Dagger to Longsword, Claymore, Titan Blade, Worldcleaver and beyond. The camera pulls back as it grows. But get hit and your blade chips, so grab the fallen gems back fast!

- **Real slicing:** every cut follows your blade, so no two cuts are the same
- **Dash-spin:** a burst of speed that whips your sword into a huge slash
- **6 shapes:**
  - Blobs
  - Darts that charge at you
  - Tanky Hexas that split again and again
  - Spitters whose orbs you can deflect
  - Steel Ironclads that only the fast blade tip can cut
  - Exploding Boomers
- **The Monolith:** a giant boss you carve apart piece by piece
- **Pick a perk** at every new blade size, including a **Twin Blade** with a second edge
- **Permanent progress:** unlock 7 blade styles and permanent upgrades, plus player levels, missions and a daily challenge

## Controls
- **Mouse:** point where you want to go, and click to dash
- **Touch:** drag anywhere to move, and tap the DASH button or a second finger to dash
- **Keyboard:** WASD or the arrow keys to move, Space to dash
- **1 / 2 / 3** to pick a perk
- **P / Esc** to pause

Works on desktop and mobile, in portrait and landscape.

## Progress save
Choose **"Yes, using the Data Module from the CrazyGames SDK"**.

## Age suitability
Suitable for all ages: cute cartoon shapes with googly eyes. Cut pieces burst into gems, with no blood or gore and no chat.

## Technical notes
- **Original work, no third-party assets.** All art is drawn on canvas and all audio is synthesized with Web Audio. There are no image, audio or font files and no libraries. It's about 115 KB.
- **CrazyGames SDK v3** (checked against a stand-in SDK):
  - Call order: `init` → `loadingStart` → save read → `loadingStop`.
  - `gameplayStart/Stop` wrap play, pause, perk picks, revive and game over, and are de-duplicated.
  - `happytime` fires on a boss kill and on a record blade length.
  - The portal mute works.
- **Saves** go only through the SDK Data Module on CrazyGames, with LocalStorage used off the portal.
- **Basic Launch has no ads.** `ADS_ENABLED = false` in `js/sdk.js`, so no ad calls are made. Revive costs 100 gold instead.
- **Portal behavior:**
  - The game auto-pauses on blur or tab switch.
  - Space and arrow keys never scroll the page, and the right-click menu is disabled.
  - No fullscreen request and no external links.
- **Performance:** 60 fps on desktop and mobile layouts.
- **Balance** (checked with a simulated player):
  - A 20-second warm-up.
  - Shapes bump harmlessly before they "bite", and pieces you just cut can't hurt you.
  - Every new blade size heals a heart.
  - Result: simulated beginners survive 1.5–5 minutes and reach 12–34 m blades.

## Marketing assets (`promo/`)
| File | Use |
|---|---|
| `cover-1920x1080.png` | Landscape cover |
| `cover-800x1200.png` | Portrait cover |
| `cover-800x800.png` | Square cover |
| `trailer-1920x1080.mp4` | 30 s landscape gameplay trailer (60 fps, H.264 + AAC) |
| `trailer-1080x1920.mp4` | 30 s portrait version for mobile and social |

All of these are captured from the real game code. The trailer is played by a scripted bot on a frame-exact clock, and the scenes are staged so each mechanic shows clearly. The audio is the game's own synthesized sound (no clipping). The covers contain only the game title.

# LOOPERANG: Poki submission kit

Everything Poki asks for when you share a game through **Poki for Developers**: the build, the thumbnails, the texts, and a checklist showing how the game meets each of Poki's rules.

> **Be realistic:** Poki is curated. Access to Poki for Developers is limited and they pick the games they publish, so nothing here can guarantee acceptance. What this kit does is remove every technical reason to say no, so the decision comes down to how players respond in Poki's playtests.

---

## 1. Files to upload

| What | File | Poki spec |
|---|---|---|
| Game build | `poki/looperang-poki.zip` (32 KB zipped, `index.html` at the root) | Zip with `index.html` at the root, under 5 MB initial download |
| Same build, unzipped | `dist/index.html` (100 KB, one file, no external assets) | |
| Thumbnail | `promo/thumbnail-1080x1080.png` | Square, 628×628 minimum, full-bleed, **no text or logo** |
| Thumbnail (minimum size) | `promo/thumbnail-628x628.png` | Same image at 628×628 |
| Animated thumbnail | `promo/animated-thumbnail-1080x1080.mp4` | 1080×1080, 60 fps, 5.0 s, H.264, **no audio track**, seamless loop, 2.6 MB |
| Gameplay trailer (for your pitch or socials) | `promo/trailer-1920x1080.mp4` | 32 s, 1080p60, with sound |
| Icon | `promo/icon-512x512.png` | Same art, 512×512 |

**The thumbnail-to-game transition.** On Poki the thumbnail is shown while the game loads, then it fades into the game. LOOPERANG's first frame is the thumbnail itself: the game draws the same scene with the same code, so the fade has no visible jump. After a moment the scene comes alive: the boomerang keeps looping, Roo flicks it back, and an iris wipe opens straight into level 1. The animated thumbnail is also rendered by the game code, starts on exactly the static thumbnail frame, and loops cleanly every 5 seconds.

---

## 2. Store texts

**Title:** LOOPERANG

**Short description (one line):**
Throw a magic boomerang, loop it through every gem, and catch it on the way back!

**Description:**
Roo the kangaroo has a magic boomerang, and it always comes back. Drag back to aim, let go to throw, and watch it curve. Your job is to loop it through every gem before it returns to Roo's paw. Hold the screen while it flies to curve it tighter.

Bounce it off rocks, boing it off jelly bumpers, ride the wind, zip through portals and dodge the spiky Grumbles and spinning saws. Grab the bonus star, catch it fast, and earn all three stars on every level.

- 80 levels across 8 worlds, then endless bonus levels
- One-touch controls: drag, throw, hold
- Every level is guaranteed beatable
- A treasure chest at the end of every world
- A daily challenge with streak rewards
- 8 boomerangs and 8 hats for Roo
- Stuck? A hint shows the golden path

**Controls:**
- Mouse or touch: drag back from anywhere and release to throw. Press and hold while it flies to curve tighter.
- Keyboard: arrow keys aim and set power, **Space** throws, hold **Space** to curve tighter, **R** restarts, **Esc** pauses.

**Suggested categories / tags:** Skill, Casual, Puzzle, Physics, Kids, 1 Player, Mobile, Boomerang, Aim, Levels

**Orientation:** landscape and portrait. In portrait the level rotates to fill the phone, so there's no "rotate your device" screen.

**Audience:** everyone. There's no violence (the boomerang just bounces), no text chat, no gambling, no purchases and no data collection.

---

## 3. Poki rules: how LOOPERANG meets each one

| Poki requirement | How the game meets it |
|---|---|
| Include the Poki SDK v2 | `<script id="pokiSdk" src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js" async>` in `index.html`, wrapped in `js/sdk.js` |
| `PokiSDK.init()` first | Called at boot. If it rejects (ad blocker), the game carries on normally, as Poki asks |
| `gameLoadingFinished()` | Called once, as soon as the game is ready. Everything is inline, so this happens within milliseconds |
| `gameplayStart()` on real play | Fired on the player's first touch, click or key in a level, not on page load |
| `gameplayStop()` whenever play is interrupted | Level-complete panel, pause menu, level select, customize screen, and before every ad |
| Never send the same event twice in a row | The wrapper de-duplicates start/stop |
| `commercialBreak()` only at natural breaks | **Next level**, **Replay**, and starting a level from the menu or daily challenge. Never mid-throw. Poki decides whether an ad actually plays |
| `rewardedBreak()` only when the player opts in | Three buttons with a ▶ badge: **Hint** (small), **Skip level** after 5 misses (medium), **×2 coins** on the win screen (small). The reward is given only if the promise resolves `true` |
| Mute audio during ads | Audio is suspended in the ad's `onStart` and resumed after |
| Block input during ads | Every pointer and keyboard handler checks `SDK.adBusy` |
| No other ads, no in-app purchases | None. Coins are earned only by playing and buy only cosmetics |
| No external links or "more games" | None |
| No external requests (fonts, CDNs, analytics) | Only the Poki SDK itself. Art is drawn on a canvas, sound is synthesized with WebAudio, and fonts are system fonts |
| No splash screens or developer branding | No studio logo. The game's own title shows for about a second over the thumbnail scene, and a tap skips it |
| Fast load, under 5 MB initial download | 100 KB total (32 KB zipped) |
| Get players into play quickly | First-time players go straight into level 1 with a drag hint. Returning players resume their current level. There's no main menu to click through |
| Save progress safely (incognito, blocked storage) | `localStorage` is always wrapped in try/catch, so the game still works without it |
| 16:9, full screen on mobile | Canvas fills the viewport, respects the notch safe areas, and handles resize and rotation live. The top-center strip is left free for Poki's pill |
| Performance: 60 fps target, 30 fps minimum | Median 16.7 ms per frame on the busiest level with the CPU throttled 4×, 95th percentile 33 ms |
| Stops keys scrolling the page | Space and arrow keys call `preventDefault`. Right-click menu and pinch-zoom are blocked |
| Tab hidden | Audio is suspended while the tab is hidden |
| Report errors | Uncaught errors go to `PokiSDK.captureError` |
| Kid-friendly | Cute art, no violence or scary content, no chat, no personal data |

**Tested:**
- The whole SDK flow was run in a headless browser against a stub `PokiSDK`. Event log: `init → gameLoadingFinished → gameplayStart → gameplayStop → rewardedBreak → commercialBreak …`.
- The game was also tested with the SDK blocked, as happens with an ad blocker or offline.

---

## 4. Poki's playtests and the numbers to watch

Poki tests games with real players before they commit, in two stages:

1. **Player Fit Test:** roughly 500 plays. The signal Poki looks for is about **3+ minutes average playtime**, with a good share of players (25%+) staying past 3 minutes.
2. **Web Fit Test:** thousands of players on Poki. Strong games reach about **65%+ conversion** (visitors who actually start playing) and about **5+ minutes average playtime**. Day-1 retention of 10–15% is considered strong.

What LOOPERANG does to push those numbers:
- **Conversion:** the thumbnail is the game's own first frame, and the first touch is already a throw. There's no menu, name prompt or tutorial screen in the way.
- **Playtime:**
  - Levels last 5–20 seconds and retries are instant.
  - Levels 1–5 forgive almost any throw, and the challenge ramps up slowly over 80 levels. Every level ships with a throw that has been proven to clear it, and levels are rejected if they're too unforgiving.
  - After 3 misses the hint button pulses. After 5, a skip is offered, so nobody quits on a wall.
- **Retention:**
  - 3 stars per level: clear it, grab the bonus star, and catch it fast.
  - A treasure chest every 10 levels gives a free cosmetic.
  - Daily challenge with a streak.
  - Coins buy 16 cosmetics.
  - After level 80, bonus levels never run out.

---

## 5. How to submit

1. Open **Poki for Developers** (developers.poki.com) and apply or sign in. If you're not in yet, use their "submit your game" form with the trailer and a playable link.
2. Create a new game and upload **`poki/looperang-poki.zip`**.
3. Use Poki's in-dashboard testing and inspector tools to check the SDK events and ads.
4. Upload `promo/thumbnail-1080x1080.png` as the thumbnail and `promo/animated-thumbnail-1080x1080.mp4` as the animated thumbnail. Paste the texts from section 2.
5. Poki runs the playtests. If the numbers are good they'll offer a publishing deal and suggest improvements based on the data.

### Web exclusivity: important
Poki's standard deal is **web-exclusive**: the game may only appear on Poki on the web, usually for several years. Mobile app stores and Steam are allowed.
- **Don't upload LOOPERANG to CrazyGames, itch.io, GameDistribution or any other web portal**, and don't host it on your own site.
- That's also why LOOPERANG is left out of the itch.io kit in `itch/`.
- If Poki declines it, you're free to publish it anywhere afterwards.

### Getting paid
Poki shares the game's ad revenue with you. Payment and tax details are handled in the Poki for Developers dashboard after you sign a deal, so check there for the current options. A Payoneer receiving account (see the earlier notes) can take EUR/USD bank transfers if a local account isn't supported.

---

## 6. Rebuild / edit

- Source: `index.html`, `style.css`, `js/*.js`.
- `python3 build.py` → `dist/index.html`. Then re-zip: `cd dist && zip ../poki/looperang-poki.zip index.html`.
- The levels are generated from their level number, so every player gets the same 80 levels.
- The daily challenge is generated from the date.
- The generator is `genLevel()` in `js/core.js`. It builds each level around a recorded throw that it proves clears the level, and that throw is also what the hint shows.

# SCRIBBLE SKY: CrazyGames Submission Listing

Upload `scribblesky/dist/index.html` on its own (zip it). That single file is the whole game.

## Title
**SCRIBBLE SKY**

## Category
**Primary:** Casual · **Secondary:** Arcade

## Tags
casual, arcade, drawing, physics, bounce, endless, one finger, mouse, mobile, doodle, satisfying, skill, upgrades

## Short description
Draw lines to bounce a marble up a doodled notebook to the stars! Every line snaps after one bounce, the ink flood is rising, and every few seconds something new happens.

## Long description
**You draw the game while you play it.**

A marble sits at the bottom of a notebook page, and the only way is up. Draw a line under it with your finger or mouse and it bounces off like a trampoline. Every line **snaps into ink splashes after one bounce**, so you're always drawing the next one. Tilt your lines to steer.

- **🎵 Every bounce is a note:** combos climb a musical scale, and a big combo multiplies every star you grab.
- **⚠️ Doodled dangers:** spiky walls, spinning saws, grumpy ink monsters and laser gates (find the gap!). Hit a bomb and it blows up everything around it.
- **🌊 The ink flood is rising:** a hungry wave of ink with angry red eyes climbs after you. Stop bouncing and it swallows you.
- **🃏 Power cards without stopping:** every 300 m three cards float in your path. Bounce into the one you want: Springy Ink, Long Lines, Star Power, Mini Magnet, Triple Ball, Lazy Flood and more. They stack for the whole run.
- **✨ Surprise power-ups:**
  - **MULTIBALL** (3 marbles at once)
  - **FIREBALL** (smash everything)
  - **GIANT BALL**
  - **SLOW-MO**
  - **MAGNET**
  - **RAINBOW INK** (lines don't break)
  - **ROCKET**
  - **BUBBLE** shield
- **★ Bonus peg rooms:** a whole page of colorful pegs that ring like a xylophone as you bounce through them.
- **🌍 New worlds as you climb:** Notebook, Graph Paper, Chalkboard, Candy Pad, Neon Night and Deep Space.
- **🏆 Beat your best:** a dashed line on the page marks your record height.

Coins buy 8 marbles (Eyeball, Donut, Planet, Galaxy and more), 6 inks (from Blue Pen to Rainbow and Gold) and permanent perks: bigger inkpot, faster refill, lucky pencil, bubble start, head start and a second chance. Missions give you something new to chase on every run.

## Controls
- **Mouse:** click and drag to draw a line. Draw under the ball to bounce it, and tilt the line to steer.
- **Touch:** draw with your finger.
- **Keyboard:** **← / A** and **→ / D** drop a tilted line under the ball, **↓ / S / Space** drops a flat one. **Esc / P** pauses.

Works on desktop and mobile, in landscape and portrait.

## Does your game save progress?
Yes. Coins, best height, marbles, inks, perks and missions are saved through the CrazyGames Data Module, with a localStorage fallback.

## Age suitability
Cute and non-violent. The "monsters" are grumpy ink blobs, and when the marble gets inked it just splats. No chat, no text input. Suitable for all ages.

## Assets to upload
- **Game build:** `scribblesky/dist/index.html` (zip it)
- **Covers:** `scribblesky/promo/cover-1920x1080.png`, `scribblesky/promo/cover-800x1200.png`, `scribblesky/promo/cover-800x800.png`
- **Video:** `scribblesky/promo/trailer-1920x1080.mp4` (a vertical `scribblesky/promo/trailer-1080x1920.mp4` is included for social media)

## Marketing assets
The covers are drawn by the game's own renderer on a lined notebook page. The marble shoots upward off a snapping rainbow line, with an "x2 COMBO!" pop and a trail of stars above it. A grumpy ink monster, a spinning saw, a spiky wall, a coin ring and two power-ups surround it, and the ink flood with red eyes rises from the bottom. The hand-drawn SCRIBBLE SKY logo sits on top so it reads at thumbnail size.

The trailer is real gameplay captured frame by frame, with the game's own synthesized music and sound:
1. **0–2.4 s:** the title screen's self-playing demo. "DRAW LINES. BOUNCE UP!"
2. **2.4–9.6 s:** the first climb, with bounce combos and stars. "EVERY LINE IS A TRAMPOLINE" / "BOUNCE THROUGH STARS"
3. **9.6–13.4 s:** a card gate, and the ball bounces into a power card. "PICK A POWER CARD"
4. **13.4–17.2 s:** MULTIBALL, with three marbles bouncing at once. "SURPRISES EVERY SECOND"
5. **17.2–21.4 s:** a bonus peg room ringing like a xylophone. "★ BONUS PEG ROOMS ★"
6. **21.4–25.2 s:** FIREBALL on the Chalkboard world. "NEW WORLDS AS YOU CLIMB"
7. **25.2–29.6 s:** RAINBOW INK in Deep Space with the flood right behind. "OUTRUN THE INK FLOOD!"
8. **29.6–32.8 s:** logo end card: "SCRIBBLE SKY · Draw lines. Bounce up. Outrun the ink!"

## SDK integration (for the reviewer)
- **Order:** `SDK.init()` → `loadingStart()` → save read from the Data Module → `loadingStop()`.
- **`gameplayStart()`** when a run starts or resumes. **`gameplayStop()`** on game over, pause, the title screen and when the tab is hidden. Both are de-duplicated.
- **`happytime()`** on picking a power card and on beating your best height.
- **Mute:** the portal's `muteAudio` setting mutes all game audio.
- **No ads during Basic Launch:** `ADS_ENABLED = false` in `js/sdk.js`, so no ad API is ever called. The ad-based revive and ×2 coins buttons stay hidden; the Second Chance perk revives for free. The hooks are ready: a midgame break before each new run, plus opt-in rewarded revive and ×2 coins. Flip `ADS_ENABLED` to `true` after Full Implementation.

## Note for the reviewer
All art (paper, doodles, marbles, monsters, effects) is drawn in code, and all music and sound effects are synthesized in code, with no third-party assets. A few interface icons are the system's built-in emoji.

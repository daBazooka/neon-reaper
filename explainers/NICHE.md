# NOTHING'S MAGIC — the niche playbook

**Tagline:** *Everything you touch, decoded in 40 seconds.*

**Niche:** short-form (Shorts / Reels / TikTok, 9:16) explainers of everyday objects and life skills.
How a zipper works, why a straw sucks, why toast always lands butter-side down, how to fold a fitted sheet.
Every viewer touched the thing this week and never understood it. That gap is the hook.

Inspiration: Zach D Films (clean motion-graphic explainers, "you use this daily and have no idea how it works").
The goal here is to beat it on **retention engineering**, not just polish.

---

## 1. Why this niche wins

| Lever | How it's used |
|---|---|
| **Infinite, evergreen topic supply** | Every object in a house is an episode. Never runs out, never dates. |
| **Zero-barrier curiosity** | No prior knowledge needed → widest possible audience → algorithm can push it to anyone. |
| **"Wait, WHAT" payoff** | A hidden mechanism (the wedge in a zipper) is a satisfying reveal viewers screenshot and share. |
| **Shareable utility** | Each ep ends with a real-life tip (pencil on a stuck zipper) → saves + sends to friends. |
| **Series format** | Same look, sound and title pattern = viewers binge and recognise the channel in a scroll. |

## 2. The 40-second retention formula (the "Rewatch Engine")

Ep.01 in `episode-01-zipper.html` is built exactly on this. 18 bars at 110 BPM = 39.3 s, everything cut on the beat.

| Time | Beat | Job |
|---|---|---|
| 0 – 4 s | **Hook** | Familiar object + a claim the viewer can't dodge ("you've done this 10,000 times… and have no idea how"). Motion from frame 0. No intro, no logo. |
| 4 – 11 s | **Zoom in** | Cheap wonder: push into the macro view. Colour-code the parts (cyan row / magenta row) so the brain instantly tracks them. |
| 11 – 20 s | **The mechanism** | One idea only. Animate it running forwards, then **backwards**. Highlight the key part with one label. |
| 20 – 26 s | **The "but why"** | Ask the objection the viewer is thinking ("why don't they just pull apart?"), then answer it with numbers on screen (bulb 44 > gap 36). Physical shake + red flash on the jam. |
| 26 – 33 s | **Payoff + tip** | The big-picture insight (it's a wedge = free strength), then a real-life hack they can use today. |
| 33 – 39 s | **Loop bait** | Rapid recap on the beat, then *"watch again and spot the wedge"*. The last frame is the first frame, so it replays seamlessly and the loop counts as extra watch time. |

### Rewatch triggers baked in
1. **Seamless loop.** End state == start state (same zoom, slider position, beat). Viewers don't notice the restart.
2. **A deliberate "spot it" challenge** at the end, which is a reason to rewatch that isn't "please watch again".
3. **Density.** A new visual event every ~0.5 s (beat-locked), so first watch is a blur of understanding and the 2nd-10th watches catch new details (zigzag path, half-step bracket, sparks).
4. **Open loops.** Each caption block asks or promises something that the next block resolves.
5. **Text small enough to skim, big enough to read in 0.8 s.** 3 words per block, one word per eighth-note.

## 3. Style bible (keep identical across episodes)

- **Canvas:** 1080×1920, safe zones: nothing important above y=200 or below y=1450 (platform UI).
- **Palette:** deep violet background, **cyan** = part A / the "given", **magenta** = part B / the "opposing", **gold** = the hero mechanism (wedge/lever/valve), **red** = the problem/failure, **green** = the fix/tip.
- **Type:** Anton (captions, all caps, thick outline + glow), Space Grotesk 700 (labels/chips).
- **Motion:** every element pops with overshoot (`easeOutBack`), camera has slow push-ins, hard zooms on the beat, impact frames (screen shake + chromatic split + white flash) only on scene changes.
- **UI:** thin 6-segment progress bar (chapters), series chip top-left, rounded "chip" labels with leader lines, dimension brackets for measurements.
- **Sound (this is half the addiction):** minor-key synth arp + four-on-the-floor kick from the moment the mechanism appears; **mechanical foley tied to the picture** (each zipper tooth = one tick, pitch up/down with direction); riser + whoosh into every scene, snare roll into the loop point; pad ducked by the kick (sidechain feel). Every caption word has a soft "pop".

## 4. Episode pipeline (repeatable in ~1 day)

1. **Pick** an object with a *hidden mechanism you can draw in one shape* (wedge, lever, siphon, ratchet, bimetal strip…).
2. **Write the 6 beats** above. One idea. If you need a second idea, it's a second episode.
3. **Find the "but why"** objection and a number that answers it.
4. **Find the real-life tip** (something they can do in 10 s).
5. **Build** by copying `episode-01-zipper.html`: change the keyframe tables (`SLIDER`, `ZOOM`, `CYB`), the `CAP` caption list and the world-drawing function. Timing helper `B(bar, beat)` keeps everything on the grid.
6. **Record:** open the page, tap play, screen-record the phone-shaped canvas with system audio (or capture the canvas with `MediaRecorder` + the WebAudio destination). Export 1080×1920.
7. **Title pattern:** `How a {thing} actually works` / `{Thing}: the trick nobody notices`. Caption: one question + "watch it twice".
8. **Post 1-2 a day.** First 3 s decides everything: A/B two hooks per episode.

## 5. First 30 episode ideas

*Zipper (done) · Velcro · Toilet flush (siphon) · Can opener · Microwave (why it heats food, not the plate) · Fridge (heat pump) · Push-button pen click · Retractable tape measure · Spray bottle (Bernoulli) · Door lock (pin tumblers) · Scissors (lever) · Umbrella (linkage) · Sunscreen SPF · Why ice floats · Toaster · Lightbulb (LED vs old) · Shower thermostat · Magnetic phone charger · QR code · Barcode · Touch screen · Noise-cancelling headphones · Elevator · Bike gears · Hair straightener · Bottle cap seals · Aerosol cans · Fitted-sheet fold · Knot that never slips · Why yawns are contagious*

## 6. Metrics to watch and iterate on

- **Average % viewed > 100%** (loop working). This is the number that means people rewatch.
- **Swipe-away at 0-3 s** (hook strength). Change only the first 3 seconds and re-test.
- **Shares/saves per view** (tip quality).
- Series binge rate (do people watch the next episode?).

## 7. Accuracy rule

Explain simply, never wrongly. Where the animation simplifies (real teeth interlock with slightly different tooth geometry; graphite works as a dry lubricant), keep the *idea* true and say "simplified" in the description if needed. Trust compounds; corrections in comments kill a channel.

# The "each episode beats the last" standard

Every new episode must clear **all** of these before it ships, and beat the previous episode on at least three.

| Gate | EP 01 Zipper | EP 02 Circuit breaker |
|---|---|---|
| **Importance** (does it protect, save money, or change a habit?) | curiosity + a pencil tip | fire safety: what to do, what never to do |
| **Depth** (mechanisms explained) | 1 (wedge + lock) | 2 defenses (thermal + magnetic) + trip curve |
| **Live instruments** (numbers the viewer can watch) | none | current, strip temperature, gauge, timers |
| **Real data / graph** | jam dimensions | log-log trip curve with typical values |
| **Cause → effect on screen** | teeth close/open | strip heats → bends → latch → spring; surge → magnetic pull |
| **Actionable ending** | 1 tip | do / don't checklist (3 do, 2 never) |
| **Length** | 39 s | 70 s (still one continuous story) |
| **Hook** | question | stakes ("a wire that could start a fire") |
| **Loop** | end frame = start frame | end pulls back out to the panel = start frame |

## Checklist
1. **Stakes in the first sentence.** Something real is at risk or at stake.
2. **One story, two beats of surprise.** e.g. "heat is too slow → so there's a second defense."
3. **A number on screen for every claim** (typical values, labelled *simplified*).
4. **Show it running.** Particles, heat, motion, tension. Never a static diagram.
5. **Everything keyed to the voice.** Visual events trigger on the word that names them (the code reads word times from `vo/*/timing.js`).
6. **End with what to DO** and what to NEVER do.
7. **Accuracy pass.** Add one honest simplification note to the description.
8. **Sound:** unique foley per mechanism (click, clunk, arc, tick), music ducked under the voice, -14 LUFS.
9. **Loop:** last frame matches first frame.

## Backlog ranked by importance
1. ~~GFCI outlet~~ (done: EP 03)
2. ~~Smoke detector~~ (done: EP 04). Next: CO detector
3. ~~Fridge / 2-hour rule~~ (done: EP 05); ~~how a fridge works~~ (done: EP 07). Toilet flush done (EP 08). Next: air conditioner / heat pump
4. Bleach + ammonia: what actually happens (chemistry of chloramine gas)
5. Seat belt + airbag: the 30 ms sequence
6. Pressure cooker: why it's faster and why lids explode
7. Antibiotics vs virus: why one doesn't work on the other
8. How a lock works, and why cheap locks fail


## EP 03 (GFCI) raised the bar by
- **A running "ledger"**: live OUT / BACK / DIFFERENCE numbers (12.500 A vs 12.495 A) and a balance scale that tips when electrons go missing.
- **A hidden idea made visible**: end-on view of the sensing ring with the two magnetic fields cancelling (net field gauge), then failing to cancel.
- **A "wait, what?" twist**: the danger ladder shows the breaker trips at 15 A, 150× above the current that can stop a heart, so *breakers protect the house, GFCIs protect you*.
- **A story with cause and effect in slow motion**: hair dryer drops, leak path lights up through the water, sense coil, solenoid, contacts, stopwatch, power cut.
- **A game in the loop**: "spot the missing electrons".

## EP 04 (Smoke detector) raised the bar by
- **Two mechanisms, two visual worlds**: an ion chamber (charged particles, a live ammeter, smoke grabbing ions) and a light chamber (a beam, a hidden sensor, smoke scattering light onto it), each with a real "alarm level" meter.
- **A race**: flaming vs smoldering fires, ionization vs photoelectric, so the viewer *sees* why neither is best alone.
- **A relatable hook payoff**: the 3 a.m. chirp explained with a live temperature/battery-voltage chart.
- **A concrete action**: read the manufacture date on the back; stamp EXPIRED at 10 years.
- **Sound design**: Geiger-style clicks while ions form, real piezo T3 alarm beeps.

## EP 05 (2-hour rule) raised the bar by
- **Switching worlds**: the first non-electrical episode proves the format works for any topic (food safety, chemistry, biology).
- **Visible exponential math**: a petri dish that really doubles, then dot grids (64 → 4,096 → 16 million) so the viewer *feels* the growth.
- **A live thermometer** whose marker drives the bacteria's speed and doubling time in real time.
- **A "wait, what?" twist**: reheating can't destroy some toxins (heat kills bacteria, not always their toxins).
- **A four-rule checklist** the viewer can use tonight.

## EP 06 (You have never touched anything) raised the bar by
- **A single idea that reframes reality** ("solid is a force"), told as one continuous powers-of-ten zoom (fingertip → skin cells → rough surfaces → molecules → atoms) with a live scale bar and "view width" readout.
- **Zero-clutter design**: almost no chips, the picture does the talking; the zoom itself is the hook.
- **Real numbers, honest simplifications**: 1 : 100,000 nucleus-to-atom, ~0.3 nm gap, ~250,000× thinner than a hair, 8 billion humans ≈ 2 cm³ (nuclei packed), plus the Pauli rule.
- **A question that follows the viewer out**: "So what else have you been so sure about?"
- **Loop game**: the final frame is the first frame; "find where your finger actually touches".

## EP 07 (Fridge) raised the bar by
- **The most detailed cutaway yet**: a full side-view fridge with a real refrigerant loop; ~220 molecules that change state (liquid droplets, vapor bubbles), pipes colour-graded by temperature, frost on the evaporator, a compressor with a working piston, fins and heat arrows on the condenser, expansion valve, live low/high-side pressure gauges.
- **A follow-the-ring hook**: one highlighted molecule you can track around the whole loop (the "watch again" driver).
- **Camera choreography**: each step zooms to its component, with a numbered station card (temperature, pressure, state).
- **The key insight as a chart**: boiling temperature vs pressure, with food (4 °C) and room (22 °C) lines showing *why* heat flows in at the evaporator and out at the condenser.
- **Everyday payoff**: heat out = heat in + electricity (door open warms the room) and three money-saving tips, with animated mini-demos (dust wiped off coils, dollar-bill test).

## EP 08 (Toilet) raised the bar by
- **Micro-engagement layer**: push/pull poll in the first 3 s, a 3-2-1 countdown quiz ("which part is leaking?") with A/B/C tags, four timed "did you know" fact toasts, and a dye-test clock.
- **Cutaway with physics**: handle, chain, flapper, float, fill valve, overflow tube, rim wash, and water flowing through the real trap with siphon, gurgle and air-pressure arrows.
- **Follow-the-duck loop game**: a rubber duck is sucked through the siphon and floats back; the last frame equals the first.
- **Actionable value**: a free leak test and a $10 fix.

## EP 09 (Memory) raised the bar by
- **A test inside the video**: a 4-digit code at 0 s, recalled at the end, so the viewer experiences the point. The first and last frames match for the loop.
- **A new, directly useful tool**: the forgetting curve turned into a 1-3-7-21 day review schedule plus a 4-step self-test routine.
- **Unique visual explanation**: the curve is drawn live, then a green "flatter every time" sawtooth builds with star chimes rising in pitch at each review.
- **Interactive quiz** (reread vs self-test) with a 3-2-1 countdown and named concepts (active recall, spaced repetition).

## EP 10 (GPS) raised the bar by
- **Counter-intuitive hook**: "your phone never sends a signal to space", proven by the end.
- **Three-layer explanation**: orbit view, a flat-map ring geometry that draws itself ring by ring, then the clock puzzle (4 unknowns = 4 satellites) with a live 300 m error ruler.
- **A "wow" payoff**: Einstein's relativity fix as a ticking error gauge (+38 µs/day, about 10 km), and why satellite clocks are tuned before launch.
- **Quiz with a real insight** (backup / accuracy / clock) and new practical tips (window, offline maps; GPS uses no data).
- **Loop game**: count the satellites; the orbit/satellite motion is periodic so the ending flows into the start.

## EP 11 (Noise Cancelling) raised the bar by
- **Live wave math on screen**: noise, its flipped mirror image and their sum are all computed live, so the viewer watches push + pull go flat.
- **Honest limits**: a dedicated scene on why the mirror arrives late for sudden sounds (bark) while steady hums cancel.
- **Sound design tied to the idea**: a low drone in the mix fades out exactly when the mirror image arrives.
- **Useful takeaways**: listen quieter (hearing safety) and a snug fit; quiz with 3-2-1 countdown; "find the mirror image" loop game.

## EP 12 (Lock) raised the bar by
- **A working mechanism, not a drawing**: every pin height is computed from the key's cut profile as it slides in, so springs compress and pin pairs ride each cut live; check marks appear only where a pin pair truly meets the shear line.
- **Right key vs wrong key** on the same lock, with the straddling pins flagged in red.
- **A surprising number**: the 6x6x6x6x6 = 7,776 build, framed as "a deterrent, not a vault".
- **Practical tips** (dry lubricant, copy from the original) and a "find the shear line" loop game.

## EP 13 (Microwave) raised the bar by
- **A real simulation**: the food's colour map is integrated live from the standing-wave pattern and the plate's motion, so you watch hot spots even out only once the plate turns.
- **A "wow" experiment**: the chocolate-bar measurement of the speed of light, built up as a step-by-step equation.
- **Layered explanation**: reflected waves (forward + reflected = standing), water molecules flipping, then the 2D hot-spot map.
- **Safety value**: stir/stand and the superheated-water warning; quiz with 3-2-1 countdown; "count the hot spots" loop game.

## EP 14 (Soap) raised the bar by
- **A molecular-scale story**: a single soap molecule (head and tail) scaled up, then 40 tadpoles swim in, dive into four grease blobs, wrap them into micelles and carry them off.
- **Myth-correcting insight**: soap mostly *lifts* germs rather than killing them.
- **Everyday value**: the 20-second rule (with a counting ring), the virus fatty-coat explanation, and two handwashing tips; quiz with 3-2-1 countdown.
- **Loop game**: count the micelles.

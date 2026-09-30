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
2. Smoke / CO detector: why they chirp, why they expire
3. Fridge: why food spoils, the 2-hour rule, the danger zone
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

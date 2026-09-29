# Channel: CUTAWAY

> **Everything has an inside.** Cut open one everyday thing. Understand it in a minute.

**Why the name:** a *cutaway* is the engineering drawing that slices an object open to show how it works, which is exactly what every video does. One word, easy to say, easy to remember, and it is the visual signature (every episode opens the object up).

*(Availability of the name/handles isn't verified. Check YouTube, TikTok and Instagram plus trademarks before committing. If `@cutaway` is taken, try `@cutawayhq`, `@watchcutaway` or `@cutaway.explained`. Backup names: **Inner Workings**, **Hidden Machinery**, **Open It Up**, **Under the Surface**.)*

## Identity
| | |
|---|---|
| **Name** | **CUTAWAY** |
| **Tagline** | Everything has an inside. |
| **Handle** | `@cutaway` (or a variant above), same on all platforms |
| **Bio (150 chars)** | `We cut open everyday things to show how they really work. One hidden mechanism per video. New one daily.` |
| **Voice of the brand** | Calm, precise, curious. Like a great engineer explaining it to a friend. No hype, no shouting. |
| **Logo** | A steel dial with one quarter cut away, exposing an amber gear. The cut = the channel's promise. |
| **Series format** | `Episode NN · The {Thing}` in the video HUD |
| **Assets** | `brand/avatar.png` (800×800 profile pic), `brand/banner.png` (2560×1440 YouTube banner, text inside the 1546×423 safe area), `brand/logo-lockup.png` (transparent, mark + wordmark + tagline). Rebuild with `tools/make-brand.js`. |

*Note: EP 01 and EP 02 were rendered under the working name "Everyday Engineered". Re-render them with the CUTAWAY HUD before publishing (change the HUD text/logo in the two HTML files, then re-run the video tools).*

## Look (brand kit)
| Token | Hex | Use |
|---|---|---|
| Charcoal | `#141C27` → `#080C12` | background gradient |
| Ink (cream) | `#F4F1EA` | main text |
| Muted | `#98A6B8` | secondary text |
| **Amber** | `#F2B84B` | the single hero accent: key part, active word, chapter numbers |
| Steel | `#A9BDD2` | "part A" (first row / first component) |
| Copper | `#E0956A` | "part B" (opposing component) |
| Red | `#E4655F` | failure / problem |
| Green | `#6FCF97` | fix / tip |

- **Font:** Inter (800 for headlines/subtitles, 700 for labels). File is in `assets/Inter.ttf` (OFL license).
- **Materials, not glow:** brushed metal, woven fabric, soft drop-shadows, frosted-glass cut-aways. No neon, no glitch, no flashes.
- **Motion:** slow push-ins, eased camera moves, small overshoot on labels only. Nothing shakes except the thing that is physically jamming.
- **Layout (1080×1920):** progress bar + logo top (y<190); chapter tag y≈290; subject centre; **subtitles bottom-third above y=1400** (platform buttons cover the bottom ~450px).

## Voice-over settings
- **Engine used:** Kokoro TTS (open source, runs locally). Default voice **`am_michael`** (calm American male), speed **1.0**.
  Female alternative: **`af_heart`**. British alternative: **`bm_george`**. Switch with `python3 tools/make-voice.py <voice>`.
- **Script rules:** ≤ 3 words/second, one idea per sentence, no filler, questions where the viewer would ask them.
- **Voice processing (in `tools/mix.py`):** high-pass 75 Hz, +2.5 dB presence at 3.5 kHz, gentle compression, music side-chain-ducked under the voice, final loudness **-14 LUFS / -1.5 dBTP**.
- **Want a human-grade voice later?** Drop any studio/AI voice recording into `vo/<voice>/line00.wav…` (same timing file) and re-run `tools/mix.py`; nothing else changes. A recorded human narrator will always beat TTS on trust; consider it once a channel earns.

## Music & sound
- Soft minor-key pad + muted pluck + light pulse, 110 BPM, generated in code (no licensing issues). Sits ~15 dB under the voice.
- Mechanical foley tied to picture (each zipper tooth = one tick). Every episode gets at least one "signature mechanical sound".

## Upload settings (per platform)
| Setting | YouTube Shorts | TikTok | Instagram Reels |
|---|---|---|---|
| File | MP4 H.264 + AAC, 1080×1920, 30 fps | same | same |
| Length | ≤ 60 s (target 35-45 s) | 30-45 s | 30-45 s |
| Title | `How a Zipper Actually Works` (pattern: `How {a thing} actually works` / `Why {thing} does {surprising thing}`) | first line of caption | first line of caption |
| Description | see template below | | |
| Hashtags | `#shorts #howitworks #engineering #science #satisfying` (3-5 max) | `#howitworks #engineering #learnontiktok` | `#howitworks #engineering #explained` |
| Cover / thumbnail | frame at ~15.8 s (the wedge) | auto or same | same |
| Audience | Not made for kids | | |
| Comments | On; pin: *"Which everyday thing should I explain next?"* | | |
| Playlist | `Everyday Engineered: Season 1` | | |

**Description template**
```
{One-sentence hook about the object}.
Chapters: hooks · slider · lock · the trick · the fix
Simplified for clarity: {one honest simplification note}.
New everyday mystery every day. Tell me what to explain next.
```

**Posting plan:** 1 Short/day for the first 30 days (same time daily, ~12:00 and/or ~18:00 audience local time), then 4-5/week.
Post the same episode to all three platforms; A/B test only the first 3 seconds (hook) and the title.

## Policy notes
- **AI voice:** disclose synthetic media where the platform asks for it (TikTok AI-generated-content label, YouTube "altered or synthetic" question). Check the current wording when you upload.
- **Originality:** platforms demote/demonetize mass-produced templated videos. Keep every episode's script, animation and explanation original and accurate, not copy-pasted variations.
- **Accuracy:** simplify, never mislead. State the simplification in the description.

## Files
| File | What |
|---|---|
| `episode-01-zipper.html`, `episode-02-breaker.html` | the animation sources (open in Chrome, or add `?t=15.8` to freeze a frame) |
| `EPISODE-STANDARD.md` | the quality bar every new episode must beat |
| `vo/script.json` | narration script + start times |
| `tools/make-voice.py` | text → voice-over (Kokoro) + subtitle timing |
| `tools/make-video.js` | renders frames + music bed |
| `tools/mix.py` | voice + music + video → final MP4 |
| `assets/Inter.ttf`, `assets/avatar.png` | font, profile picture |

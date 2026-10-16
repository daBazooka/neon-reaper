# What made Bulletin 03 the most engaging video, and the recipe we build from it

Written 2026-10-16. Based on one Studio screenshot (view counts, titles, durations), the repo's own files for every bulletin, and public research. I do **not** have YouTube Analytics (traffic sources, CTR, retention), so this is a ranked set of hypotheses plus a test plan, not proof.

## 1. The data we have

| Video | Length | Views | Engaged views | Title style |
|---|---|---|---|---|
| **Bulletin 03: Still Scrolling (Analog Horror)** | 3:41 | **434** | **431** | plain present-tense phrase |
| Bulletin 04: A Good Friend (Analog Horror) | 5:15 | 21 | 20 | plain phrase |
| Bulletin 05: Turn Me Off (Analog Horror) | 5:59 | 15 | 12 | plain phrase |
| Bulletin 01: THE GLOW / Home Safety Tape | 3:57 | 17 | 9 | branded title |
| Bulletin 02: THE CHOIR / Home Safety Tape | 3:41 | 0 | 0 | branded title |
| Bulletin 06: (renamed) You are made for creating not consuming | 6:21 | 1 | 0 | long statement |

Bulletin 03 has about 20–30x the views of its neighbours, 99% of them "engaged" (431 of 434), and it is one of the shortest. Bulletins 01–04 were all published on 29 September, so publish date alone does not explain it.

**Ruled out (from the data):**
- Length: Bulletin 02 has the same 3:41 runtime and got 0 views.
- The "(Analog Horror)" label: Bulletins 04 and 05 carry it and got 21 and 15.
- Thumbnail style: all use the same 2–3 word style, so the style alone is not the difference. The words are.

**What is unique to Bulletin 03:**
1. **The topic is something the viewer is doing at that moment.** The video is about scrolling, and it is found while scrolling.
2. **The words in the title and thumbnail are the viewer's own thoughts:** "Still Scrolling", "ONE MORE."
3. **The film itself** (read from `engine.html`, scenes `s_intro`, `s1`–`s6`, `s7`, `fin`): only about 100 words of on-screen text in total, no narration. Six rules, each 5–8 words, in second person and imperative, and each rule says the **harmful habit as if it were safety advice**:
   - "THERE IS ALWAYS ONE MORE."
   - "YOUR THUMB KNOWS THE WAY. LET IT."
   - "IF YOU FEEL EMPTY, SCROLL FASTER."
   - "DO NOT WATCH THE SUNSET." (the only warm colour in the series, a hidden exit)
   Then a fourth-wall line: "THIS BULLETIN ENDS WHEN YOU STOP SCROLLING. YOU HAVE NOT STOPPED."
4. **Structure:** calm, then escalation, then a release at the end (the sunset behind you).

## 2. Why that structure plausibly works (psychology, with what the evidence does and does not show)

| Idea | Plain meaning | Evidence status |
|---|---|---|
| **Self-reference effect** | Information tied to "me" is processed and remembered better. Meta-analysis: Symons & Johnson, *Psychological Bulletin* 1997. | Solid for memory. I found nothing proving it raises click-through. |
| **Information-gap curiosity** | Curiosity is the felt gap between what you know and what you want to know; it needs some prior knowledge and a gap that seems closeable. Loewenstein, 1994. | Well-known theory. A 3,106-video comparison by a vendor (OverseerOS) found curiosity-style titles at 0.92x baseline: **curiosity framing does not reliably help on its own**. It amplifies a good idea; it does not rescue a weak one. |
| **Psychological reactance** | A threat to freedom makes the forbidden option more attractive (Brehm). It explains "DO NOT WATCH THE SUNSET" pulling you toward the sunset. | Established theory; boomerang effects depend on conditions, so use it lightly. |
| **Recreational fear** | Safe, fictional fear lets people rehearse coping. A 2020 survey of 310 people found horror fans reported more resilience in the pandemic (Scrivner et al., correlational preprint). | Suggestive only; correlation. |
| **Peak-end** | Endings weigh heavily in how an experience is remembered. | Well supported in general; applied here as a design choice (warm exit at the end). |
| **Zeigarnik / open loops** | "Unfinished things stick in the mind." | **Weak.** A 2025 meta-analysis (Ghibellini & Meier) found no memory advantage for unfinished tasks, only a general tendency to resume them. Do not build the strategy on cliffhangers alone. |

Honest summary: the cross-video data supports **topic fit and viewer-voiced wording** most. The rest (structure, irony, release) is plausible design reasoning, not tested here.

## 3. Recipe v1 (what we make from now on)

1. **Topic: a named behaviour the viewer is doing right now** while watching YouTube. Examples: scrolling, procrastinating, "one more episode", still awake at night, checking.
2. **Title: the act in plain present tense, in the viewer's voice,** with the genre in brackets. e.g. "Starting Tomorrow (Analog Horror)". Do not lead with series branding ("BULLETIN 02: THE CHOIR | Home Safety Tape" got 0).
3. **Thumbnail: 2 words in the viewer's inner voice, one object.** e.g. "NOT TODAY." / "ONE MORE."
4. **Film: about 3:40, six second-person "rules" of 5–8 words, each one the harmful habit presented as advice.** Almost no narration. A fourth-wall line near the end. A real exit in the final rule.
5. **One honest takeaway in the description** (not in the film): a real, checkable technique, so the viewer gets value, with hedged claims and sources.
6. **Shorts:** one rule per Short, same cold open, "full tape on the channel".
7. **No gimmicks:** no fake claims, no misleading packaging.

## 4. Test plan (so we learn instead of guess)

Change one variable at a time:
- **Bulletin 10** ("Starting Tomorrow"): recipe fully applied. Compare its first 48 h with Bulletin 03's first 48 h.
- Use **Test & Compare** on three thumbnails (word choices).
- Next: same recipe, different topic ("Still Awake") to see whether it is the topic or the format.

## 5. Numbers I need from Studio (so the next analysis is real, not guessed)

For Bulletin 03 and Bulletin 04, from **Analytics**:
1. Reach tab: **impressions, click-through rate, and traffic sources** (Browse, Suggested, Search, Shorts feed, External).
2. Engagement tab: **average view duration and the retention graph** (where it dips).
3. Audience tab: new vs returning viewers; **Search terms** that found it.
4. Whether any Shorts from Bulletin 03 were published, and their views.

## Sources
- Symons & Johnson (1997), "The Self-Reference Effect in Memory: A Meta-Analysis", *Psychological Bulletin* 121(3), 371–394.
- Loewenstein (1994), "The Psychology of Curiosity: A Review and Reinterpretation", *Psychological Bulletin*.
- Ghibellini & Meier (2025), meta-analysis of the Zeigarnik effect, *Humanities and Social Sciences Communications*.
- Brehm's psychological reactance theory (overview via PMC reviews on boomerang effects of warning labels).
- Scrivner, Johnson, Kjeldgaard-Christiansen & Clasen (2020), "Pandemic Practice" (preprint, correlational).
- OverseerOS blog analysis of 3,106 matched videos (vendor data; treat with caution).
- Sirois & Pychyl (2013), procrastination as short-term mood repair, *Social and Personality Psychology Compass*.
- Gollwitzer & Sheeran (2006), implementation intentions meta-analysis, *Advances in Experimental Social Psychology* 38.

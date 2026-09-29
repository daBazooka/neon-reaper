# Brand kit: Bureau of Household Attention

## Name
**Recommended display name: `Bureau of Household Attention`** (29 characters; YouTube allows 50).
Why: it is the in-universe institution that issues the tapes, so the channel *is* the fiction. It is memorable, searchable, sounds like a real 90s agency, and states the theme (attention) without saying "horror". Short form for thumbnails and comments: **BHA**.

Handle options (check availability in YouTube Studio; I cannot check from here): `@HouseholdAttention`, `@BureauOfAttention`, `@BHAtapes`, `@BHAbulletins`.

Fallback display names if it is taken or too long for you:
1. `Household Attention Bureau`
2. `BHA Bulletins`
3. `Please Stay Tuned` (works as a tagline and as a name, but is generic to search for)

Before committing: search YouTube and your country's trademark database for "Bureau of Household Attention" and "BHA". The name is fictional and generic, but a clash is possible.

## Files
| File | Size | Use |
|---|---|---|
| `logo.png` | 800x800 | Channel profile picture (YouTube crops it to a circle; the emblem sits well inside it) |
| `logo-transparent.png` | 1024x1024 | Emblem on a transparent background for your editor, thumbnails or intro |
| `banner.jpg` (and `banner.png`) | 2560x1440 | Channel banner. `banner.jpg` is 530 KB, under YouTube's 6 MB limit. Title and tagline are inside YouTube's central safe area (1546x423), so they show on phones, desktop and TV |
| `watermark.png` | 150x150 | Video watermark (Studio > Customization > Branding) |

## The logo
A house outline (home) with a screen for a doorway (the glow) and an eye above it (attention). The eye's pupil is a tiny screen, so it is unclear who is watching whom. It matches the tape's opening card.

## The banner background
A whole block of lit windows, each with a silhouette watching, seen at night. One figure is standing and facing out (top right). The centre is darkened so the title reads. It is the same image as Rule 4 and the finale of Bulletin 01.

## Colours and type
- Deep blue-black `#050912` to `#0b1424`, glow blue `rgb(110,180,255)`, pale text `#dbe9ff`.
- Titles: Georgia (serif, "official 90s bureau"). Labels: a monospace face for the tape/OSD feel.

## Channel "About" text (suggested)
> Recovered household safety bulletins. Please stay tuned.
> New bulletin every Friday. Fiction. Contains low light, tape noise and slow flicker; no rapid flashing.
> Bulletin 01 hides 4 messages. Post what you find, with timestamps.

Regenerate: `NODE_PATH=$(npm root -g) node make.js` (needs Playwright + Chromium). Edit `brand.html` to change text or layout.

## Thumbnails for Bulletin 01 (`thumbs/`, 1280x720 JPG, about 0.2 MB each)
Upload all three and use YouTube's Test & Compare.
| File | Text | Idea | Why |
|---|---|---|---|
| `thumbnail-A.jpg` | STILL WATCHING? | The giant "Are you still watching?" prompt, with a faint NO button, over a silhouette | Instantly relatable; readable at any size; the tiny hidden "look up" at the top edge rewards a close look |
| `thumbnail-B.jpg` | ONE STOOD UP. | A block of watchers; one warm window with a standing figure | Strongest curiosity gap; the only warm colour draws the eye |
| `thumbnail-C.jpg` | 04:12:33 / DON'T COUNT. | Giant watch-time counter over a faint clock | Simple, numeric, high contrast |
Rules followed: one focal point, 1–3 huge words, high contrast, series tag at top-left (clear of the bottom-right timestamp), and every thumbnail matches something the video actually shows.
Regenerate: `NODE_PATH=$(npm root -g) node makethumbs.js`.

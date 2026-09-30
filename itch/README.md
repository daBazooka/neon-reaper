# itch.io upload kit

One folder per game. Each folder has everything for its itch.io page:

| File | What to do with it |
|---|---|
| `<game>-web.zip` | Upload it and tick **"This file will be played in the browser"** |
| `cover-630x500.png` | The cover image (itch's recommended size) |
| `screenshot-*.jpg` | Real gameplay screenshots (1280 × 720) |
| `itch-page.txt` | Every field for the page, plus the description ready to paste |

## Uploading one game (about 5 minutes)
1. Go to **itch.io → Dashboard → Create new project** (https://itch.io/game/new).
2. Fill in **Title**, **Project URL** and **Short description** from `itch-page.txt`.
3. Set **Kind of project** to **HTML** and **Classification** to **Games**.
4. **Uploads:**
   - Upload `<game>-web.zip`.
   - Tick **This file will be played in the browser**.
5. **Embed options:**
   - Embed in page, **960 × 600**.
   - Tick **Mobile friendly** and **Fullscreen button**.
   - Leave **Automatically start on page load** off.
6. **Description:**
   - Paste the part of `itch-page.txt` below the DESCRIPTION line.
   - Genre, Tags and Inputs are listed in the same file.
7. **Media:** add `cover-630x500.png` as the cover and the screenshots. For a trailer, upload the game's
   `promo/trailer-1920x1080.mp4` to YouTube and paste the link.
8. **Pricing:** choose **No payments** or **Donate** (a suggested $2 works well).
9. Save as **Draft**, press **View page**, play it once to check it, then set **Visibility** to **Public**.

## Where each game can also go
- **CrazyGames** doesn't require exclusivity, so a game can live on CrazyGames and itch at the same time.
  If you took CrazyGames' 2-month exclusivity bonus for a game, upload it here only after those 2 months.
- **Poki** wants web exclusivity, and itch counts as web. Keep any game you're pitching to Poki off itch.

## Getting players on itch
- Enter **game jams** (https://itch.io/jams). They're the biggest source of plays and feedback.
- Post a short **devlog** when you update a game. Followers get notified.
- Put all games in a **collection** on your profile, and link your CrazyGames pages in each description.

## Notes
- The builds include the CrazyGames SDK code. Off CrazyGames it switches itself off, no ads are shown,
  and progress saves in the player's browser.
- All 17 games were tested in a cross-origin iframe, the way itch runs them: every one booted and drew
  with no errors.
- NEON REAPER: the Global leaderboard/chat needs your own Firebase project. BO KATA: ONLINE mode needs your
  own multiplayer server. Both games work fully offline without these.
- To rebuild the kit after changing a game: `python3 itch/build_itch.py` from the repo root (needs ffmpeg).

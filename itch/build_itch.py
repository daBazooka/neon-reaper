#!/usr/bin/env python3
"""Build an itch.io upload kit for every HTML5 game in this repo.

For each game it writes itch/<slug>/ with:
  <slug>-web.zip      the game (index.html) to upload as "played in the browser"
  cover-630x500.png   itch's cover image size
  screenshot-*.jpg    real gameplay frames taken from the game's trailer
  itch-page.txt       every field for the itch.io edit page, ready to paste

Run from the repo root:  python3 itch/build_itch.py
Needs ffmpeg on PATH (or FFMPEG=/path/to/ffmpeg).
"""
import os, re, shutil, subprocess, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'itch')
FF = os.environ.get('FFMPEG', 'ffmpeg')

# slug, title, game file, listing, promo folder, itch genre, extra notes
GAMES = [
    ('neon-reaper', 'NEON REAPER', 'index.html', 'CRAZYGAMES-SUBMISSION.md', None, 'Action',
     'The Global leaderboard/chat buttons need your own Firebase project (see the Firebase config in index.html); everything else works offline.'),
    ('chainfling', 'CHAINFLING', 'chainfling/dist/index.html', 'chainfling/CRAZYGAMES-SUBMISSION.md', 'chainfling/promo', 'Action', ''),
    ('digfort', 'DIGFORT', 'digfort/dist/index.html', 'digfort/CRAZYGAMES-SUBMISSION.md', 'digfort/promo', 'Strategy', ''),
    ('growblade', 'GROWBLADE', 'growblade/dist/index.html', 'growblade/CRAZYGAMES-SUBMISSION.md', 'growblade/promo', 'Action', ''),
    ('lumibloom', 'LUMIBLOOM', 'lumibloom/dist/index.html', 'lumibloom/CRAZYGAMES-SUBMISSION.md', 'lumibloom/promo', 'Other', ''),
    ('echo-legion', 'ECHO LEGION', 'echolegion/dist/index.html', 'echolegion/CRAZYGAMES-SUBMISSION.md', 'echolegion/promo', 'Action', ''),
    ('scorchway', 'SCORCHWAY', 'scorchway/dist/index.html', 'scorchway/CRAZYGAMES-SUBMISSION.md', 'scorchway/promo', 'Racing', ''),
    ('bo-kata', 'BO KATA', 'bokata/dist/index.html', 'bokata/crazygames/CRAZYGAMES-SUBMISSION.md', 'bokata/crazygames/promo', 'Action',
     'ONLINE mode needs your own multiplayer server (see bokata/README.md). Offline matches against bots work everywhere.'),
    ('orbitopia', 'ORBITOPIA', 'orbitopia/dist/index.html', 'orbitopia/CRAZYGAMES-SUBMISSION.md', 'orbitopia/promo', 'Simulation', ''),
    ('timberfall', 'TIMBERFALL', 'timberfall/dist/index.html', 'timberfall/CRAZYGAMES-SUBMISSION.md', 'timberfall/promo', 'Survival', ''),
    ('underneath', 'UNDERNEATH', 'underneath/dist/index.html', 'underneath/CRAZYGAMES-SUBMISSION.md', 'underneath/promo', 'Puzzle', ''),
    ('critical-mass', 'CRITICAL MASS', 'criticalmass/dist/index.html', 'criticalmass/CRAZYGAMES-SUBMISSION.md', 'criticalmass/promo', 'Puzzle', ''),
    ('tidecaller', 'TIDECALLER', 'tidecaller/dist/index.html', 'tidecaller/CRAZYGAMES-SUBMISSION.md', 'tidecaller/promo', 'Action', ''),
    ('firefly-lasso', 'FIREFLY LASSO', 'fireflylasso/dist/index.html', 'fireflylasso/CRAZYGAMES-SUBMISSION.md', 'fireflylasso/promo', 'Action', ''),
    ('snowball-effect', 'SNOWBALL EFFECT', 'snowball/dist/index.html', 'snowball/CRAZYGAMES-SUBMISSION.md', 'snowball/promo', 'Action', ''),
    ('abyss-hook', 'ABYSS HOOK', 'abysshook/dist/index.html', 'abysshook/CRAZYGAMES-SUBMISSION.md', 'abysshook/promo', 'Action', ''),
    ('kaleidream', 'KALEIDREAM', 'kaleidream/dist/index.html', 'kaleidream/CRAZYGAMES-SUBMISSION.md', 'kaleidream/promo', 'Action', ''),
]
EXTRA_TAGS = ['casual', 'arcade', 'singleplayer', 'html5']


def sections(md):
    """Split a listing into {lowercase heading: text}."""
    out, key = {}, None
    for line in md.splitlines():
        m = re.match(r'^##\s+(.*)$', line)
        if m:
            key = m.group(1).strip().lower()
            out[key] = []
        elif key is not None:
            out[key].append(line)
    return {k: '\n'.join(v).strip() for k, v in out.items()}


def pick(sec, *names):
    for k, v in sec.items():
        if any(k.startswith(n) for n in names):
            return v
    return ''


def plain(text):
    """Markdown to paste-friendly plain text: keep bullets and line breaks, drop portal/SDK lines."""
    lines = []
    for line in text.splitlines():
        if re.search(r'crazygames|sdk|data module|reviewer', line, re.I):
            continue
        s = re.sub(r'\*\*(.+?)\*\*', r'\1', line)
        s = re.sub(r'\*(.+?)\*', r'\1', s)
        s = re.sub(r'`([^`]*)`', r'\1', s)
        s = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', s)
        s = re.sub(r'^(\s*)[-*] ', lambda m: m.group(1) + '• ', s)
        s = s.replace('<br>', '\n')
        lines.append(s.rstrip())
    text = '\n'.join(lines)
    return re.sub(r'\n{3,}', '\n\n', text).strip()


def tags_from(text):
    raw = re.sub(r'[*`]', '', text)
    raw = raw.replace('\n', ',')
    tags = [t.strip().lower() for t in re.split(r'[,·]', raw) if t.strip()]
    tags = [t for t in tags if len(t) <= 30 and 'crazygames' not in t]
    seen, out = set(), []
    for t in tags + EXTRA_TAGS:
        t = re.sub(r'\s+', '-', t)
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out[:10]


def ff(*args):
    subprocess.run([FF, '-y', '-loglevel', 'error', *args], check=True)


def duration(path):
    r = subprocess.run([FF, '-i', path], capture_output=True, text=True)
    m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', r.stderr)
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)) if m else 30.0


def build(slug, title, game, listing, promo, genre, note):
    d = os.path.join(OUT, slug)
    os.makedirs(d, exist_ok=True)
    # the game: itch wants a zip with index.html at the top level
    with zipfile.ZipFile(os.path.join(d, f'{slug}-web.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(os.path.join(ROOT, game), 'index.html')
    # cover and screenshots
    if promo:
        sq = os.path.join(ROOT, promo, 'cover-800x800.png')
        ff('-i', sq, '-filter_complex',
           '[0]scale=630:630,boxblur=24:2,crop=630:500[bg];[0]scale=500:500[fg];[bg][fg]overlay=(W-w)/2:0',
           '-frames:v', '1', os.path.join(d, 'cover-630x500.png'))
        tr = os.path.join(ROOT, promo, 'trailer-1920x1080.mp4')
        dur = duration(tr)
        for i, frac in enumerate([0.14, 0.36, 0.58, 0.78]):
            ff('-ss', f'{dur * frac:.2f}', '-i', tr, '-frames:v', '1', '-vf', 'scale=1280:720', '-q:v', '3',
               os.path.join(d, f'screenshot-{i + 1}.jpg'))
    else:
        art = os.path.join(OUT, '_neon-reaper-art')
        shutil.copy(os.path.join(art, 'cover-630x500.png'), os.path.join(d, 'cover-630x500.png'))
        for i, name in enumerate(sorted(f for f in os.listdir(art) if f.startswith('shot'))):
            ff('-i', os.path.join(art, name), '-vf', 'scale=1280:720', '-q:v', '3', os.path.join(d, f'screenshot-{i + 1}.jpg'))
    # the page text
    sec = sections(open(os.path.join(ROOT, listing), encoding='utf-8').read())
    short = plain(pick(sec, 'short description'))
    longd = plain(pick(sec, 'long description'))
    controls = plain(pick(sec, 'controls'))
    tags = tags_from(pick(sec, 'tags'))
    page = f"""ITCH.IO PAGE: {title}
{'=' * (13 + len(title))}

Create it at https://itch.io/game/new and fill in the fields below.

Title:                {title}
Project URL:          {slug}
Short description:    {short}
Classification:       Games
Kind of project:      HTML
Release status:       Released
Pricing:              No payments  (or "Donate" with a suggested $2)

Uploads:
  Upload {slug}-web.zip and tick "This file will be played in the browser".

Embed options:
  Embed in page, viewport 960 x 600
  [x] Mobile friendly   (orientation: Default)
  [x] Fullscreen button
  [ ] Automatically start on page load
  [ ] Enable scrollbars

Details:
  Genre:     {genre}
  Tags:      {', '.join(tags)}
  Inputs:    Mouse, Keyboard, Touchscreen
  Accessibility / Links: optional

Cover image:  cover-630x500.png
Screenshots:  {', '.join(sorted(f for f in os.listdir(d) if f.startswith('screenshot')))}
Trailer (optional): upload the trailer to YouTube and paste its link in "Gameplay video or trailer".

AI disclosure:
  If the page asks about AI-generated content, answer honestly: the game's code, art and sound
  were made with AI assistance (all art and audio are generated by code, no image or audio models).
"""
    if note:
        page += f"\nNote: {note}\n"
    page += f"""
----- DESCRIPTION (paste into the Description box) -----

{longd}

HOW TO PLAY
{controls}

Your progress saves automatically in your browser.
"""
    open(os.path.join(d, 'itch-page.txt'), 'w', encoding='utf-8').write(page)
    return d


if __name__ == '__main__':
    for g in GAMES:
        print('built', build(*g))

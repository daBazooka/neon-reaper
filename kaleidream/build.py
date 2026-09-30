#!/usr/bin/env python3
"""Inline style.css and js/*.js into one self-contained dist/index.html.

  python3 build.py              CrazyGames / generic build  -> dist/index.html
  python3 build.py --playgama   Playgama Bridge build       -> playgama/index.html,
                                playgama/playgama-bridge-config.json, playgama/KALEIDREAM-playgama.zip
"""
import os, re, sys, json, zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
PLAYGAMA = '--playgama' in sys.argv
html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
css = open(os.path.join(ROOT, 'style.css'), encoding='utf-8').read()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
if PLAYGAMA:
    # Playgama asks for the Bridge script in <head>, before the game code
    html = html.replace('</head>', '<script src="https://bridge.playgama.com/v2/stable/playgama-bridge.js"></script>\n</head>', 1)
    html = html.replace('<script src="js/sdk.js"></script>', '<script src="js/sdk-playgama.js"></script>')

def inline(m):
    src = open(os.path.join(ROOT, m.group(1)), encoding='utf-8').read()
    return '<script>\n' + src.replace('</script', '<\\/script') + '\n</script>'

html = re.sub(r'<script src="(js/[a-z-]+\.js)"></script>', inline, html)
assert 'src="js/' not in html and 'href="style.css"' not in html
if not PLAYGAMA:
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    out = os.path.join(ROOT, 'dist', 'index.html')
    open(out, 'w', encoding='utf-8').write(html)
    print(out, len(html.encode('utf-8')) // 1024, 'KB')
else:
    d = os.path.join(ROOT, 'playgama')
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html)
    cfg = {'advertisement': {'minimumDelayBetweenInterstitial': 60}, 'game': {'adaptToSafeArea': True}}
    open(os.path.join(d, 'playgama-bridge-config.json'), 'w', encoding='utf-8').write(json.dumps(cfg, indent=2) + '\n')
    zp = os.path.join(d, 'KALEIDREAM-playgama.zip')
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(os.path.join(d, 'index.html'), 'index.html')
        z.write(os.path.join(d, 'playgama-bridge-config.json'), 'playgama-bridge-config.json')
    print(zp, os.path.getsize(zp) // 1024, 'KB')

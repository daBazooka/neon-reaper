#!/usr/bin/env python3
"""Inline style.css and js/*.js into one self-contained dist/index.html."""
import os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
css = open(os.path.join(ROOT, 'style.css'), encoding='utf-8').read()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')

def inline(m):
    src = open(os.path.join(ROOT, m.group(1)), encoding='utf-8').read()
    return '<script>\n' + src.replace('</script', '<\\/script') + '\n</script>'

html = re.sub(r'<script src="(js/[a-z]+\.js)"></script>', inline, html)
assert 'src="js/' not in html and 'href="style.css"' not in html
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', 'index.html')
open(out, 'w', encoding='utf-8').write(html)
print(out, len(html.encode('utf-8')) // 1024, 'KB')

"""Read the rendered PDF and write the printed page number of every contents entry to toc_pages.json.
Usage: python3 toc_pages.py <book.pdf>"""
import json, sys, os, pymupdf
here = os.path.dirname(os.path.abspath(__file__))
entries = json.load(open(os.path.join(here, 'toc_entries.json')))
doc = pymupdf.open(sys.argv[1])
outline = [(lvl, title.strip(), page) for lvl, title, page in doc.get_toc() if lvl <= 2]
def roman(n):
    out = ''
    for v, s in [(10, 'x'), (9, 'ix'), (5, 'v'), (4, 'iv'), (1, 'i')]:
        while n >= v: out += s; n -= v
    return out
# page index (1-based) where decimal numbering restarts = the first Part opener
part1 = next(p for lvl, t, p in outline if t.upper().startswith('THE LIFE YOU ARE SLEEPWALKING'))
norm = lambda s: ''.join(ch for ch in s.upper() if ch.isalnum())
pages, j = {}, 0
for e in entries:
    target = norm(e['title'].split(':')[0])
    while j < len(outline) and not norm(outline[j][1]).startswith(target[:20]): j += 1
    if j == len(outline): sys.exit('not found in PDF outline: ' + e['title'])
    p = outline[j][2]; j += 1
    pages[e['key']] = str(p - part1 + 1) if p >= part1 else roman(p)
json.dump(pages, open(os.path.join(here, 'toc_pages.json'), 'w'), indent=1)
print('pages for', len(pages), 'entries; e.g.', list(pages.items())[:3], list(pages.items())[-2:])

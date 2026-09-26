"""Replace the drawn illustrations with real images from Wikimedia Commons.

Only public-domain or freely licensed files are accepted (PD, CC0, CC BY, CC BY-SA);
anything else is skipped. Each image gets the book's single visual treatment
(high-contrast black and white, grain, vignette, cropped to its slot), and a credits
file is written for the "Image Credits" page.

Needs network access to commons.wikimedia.org and upload.wikimedia.org.
Usage: python3 fetch_images.py            (all slots)
       python3 fetch_images.py tent door  (only these slots)
"""
import io, json, os, re, sys, time, urllib.parse, urllib.request
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, '..', 'images')
CREDITS = os.path.join(HERE, 'image_credits.json')
API = 'https://commons.wikimedia.org/w/api.php'
UA = 'BurnToBecomeBook/1.0 (book production; contact via publisher)'
FREE = re.compile(r'public domain|pd|cc0|cc[- ]by(?:-sa)?', re.I)

FULL = (1800, 2700)   # full-page plates and Part openers (6 x 9 in at 300 dpi)
WIDE = (1500, 1000)   # in-chapter figures

# slot -> (size, [preferred Commons file titles], fallback search, darkness 0..1)
SLOTS = {
    'frontispiece': (FULL, ['File:Herbert James Draper - The Lament for Icarus.jpg'], 'Draper Lament for Icarus', 0.25),
    'part1': (FULL, [], 'person alone smartphone screen dark room', 0.55),
    'part2': (FULL, ['File:Gustave Doré - Jacob Wrestling with the Angel.jpg'], 'Doré Jacob wrestling with the angel engraving', 0.35),
    'part3': (FULL, ['File:Caspar David Friedrich - Wanderer above the sea of fog.jpg'], 'Friedrich Wanderer above the Sea of Fog', 0.35),
    'part4': (FULL, [], 'open empty birdcage', 0.5),
    'part5': (FULL, [], 'campfire night flames dark', 0.45),
    'door': (WIDE, [], 'door ajar light dark room', 0.3),
    'boulder': (WIDE, ['File:Punishment sisyph.jpg'], 'Titian Sisyphus Prado', 0.2),
    'footsteps': (WIDE, [], 'footprints in snow', 0.2),
    'tent': (WIDE, [], 'Le Brun Alexander and Porus', 0.2),
    'enso': (WIDE, [], 'Miyamoto Musashi self-portrait', 0.1),
    'scoreboard': (WIDE, [], 'empty basketball arena', 0.4),
    'airball': (WIDE, [], 'basketball hoop night', 0.4),
    'candle': (WIDE, [], 'candle flame darkness', 0.3),
    'phonecage': (WIDE, [], 'person using smartphone at night', 0.4),
    'onepercent': (WIDE, [], 'Gustave Doré battle engraving army', 0.2),
    'summit': (WIDE, [], 'mountain ridge above clouds', 0.2),
    'sisyphus_rest': (WIDE, [], 'Franz von Stuck Sisyphus', 0.2),
    'embers': (WIDE, [], 'burning embers dark', 0.35),
    'hourglass': (WIDE, [], 'hourglass sand', 0.35),
    'threshold': (WIDE, [], 'silhouette person doorway light', 0.35),
    'star': (WIDE, [], 'Sun ultraviolet Solar Dynamics Observatory', 0.1),
    'river': (WIDE, [], 'Beas river Punjab', 0.2),
}
# quote plates: a photograph under the text (darkened heavily so the words stay legible)
PLATES = {
    'plate_potential': 'boxer training dark gym',
    'plate_mevsme': 'man reflection mirror dark',
    'plate_evidence': 'Miyamoto Musashi shrike withered branch',
    'plate_anger': 'fire flames dark background',
    'plate_burn': 'wildfire night flames',
}


def api(**params):
    params.update(format='json', formatversion=2)
    url = API + '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def info(title, width):
    d = api(action='query', titles=title, prop='imageinfo', iiprop='url|extmetadata|size', iiurlwidth=width)
    page = d['query']['pages'][0]
    if 'imageinfo' not in page:
        return None
    ii = page['imageinfo'][0]
    md = ii.get('extmetadata', {})
    get = lambda k: re.sub('<[^>]+>', '', md.get(k, {}).get('value', '')).strip()
    lic = get('LicenseShortName') or get('License')
    return {'title': title, 'url': ii.get('thumburl') or ii['url'], 'page': ii.get('descriptionurl', ''),
            'artist': get('Artist') or 'Unknown', 'license': lic, 'object': get('ObjectName') or title[5:],
            'w': ii.get('width', 0), 'h': ii.get('height', 0)}


def candidates(titles, query, width):
    for t in titles:
        x = info(t, width)
        if x:
            yield x
    d = api(action='query', list='search', srsearch=query + ' filetype:bitmap', srnamespace=6, srlimit=15)
    for hit in d['query']['search']:
        x = info(hit['title'], width)
        if x:
            yield x


def treat(im, size, dark, plate=False):
    """The book's look: black and white, strong contrast, film grain, vignette, cropped to fill."""
    im = ImageOps.exif_transpose(im).convert('L')
    im = ImageOps.fit(im, size, method=Image.LANCZOS, centering=(0.5, 0.45))
    im = ImageOps.autocontrast(im, cutoff=1)
    im = ImageEnhance.Contrast(im).enhance(1.35)
    a = np.asarray(im).astype(np.float32) / 255.0
    a = a ** (1.0 + dark)                               # push toward black
    h, w = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    a *= np.clip(1.15 - 0.45 * r ** 2, 0.25, 1.0)       # vignette
    if plate:
        a *= 0.42                                        # keep quote text readable
    a += np.random.default_rng(7).normal(0, 0.035, a.shape)  # grain
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def fetch(slot, size, titles, query, dark, plate=False, credits=None):
    for c in candidates(titles, query, max(size) * 2):
        if not FREE.search(c['license'] or ''):
            print(f'  skip (license "{c["license"]}")', c['title']); continue
        if min(c['w'], c['h']) < 900:
            print('  skip (too small)', c['title']); continue
        req = urllib.request.Request(c['url'], headers={'User-Agent': UA})
        data = urllib.request.urlopen(req, timeout=120).read()
        out = treat(Image.open(io.BytesIO(data)), size, dark, plate)
        out.save(os.path.join(IMG, f'{slot}.jpg'), quality=86, optimize=True)
        for ext in ('png',):
            p = os.path.join(IMG, f'{slot}.{ext}')
            if os.path.exists(p): os.remove(p)
        credits[slot] = {k: c[k] for k in ('object', 'artist', 'license', 'page')}
        print(f'{slot:15} <- {c["object"][:60]}  ({c["artist"][:40]}; {c["license"]})')
        return True
    print(f'{slot:15} !! no free image found for "{query}"')
    return False


def main():
    only = set(sys.argv[1:])
    credits = json.load(open(CREDITS)) if os.path.exists(CREDITS) else {}
    for slot, (size, titles, query, dark) in SLOTS.items():
        if not only or slot in only:
            fetch(slot, size, titles, query, dark, credits=credits); time.sleep(0.5)
    for slot, query in PLATES.items():
        if not only or slot in only:
            fetch(slot + '_bg', FULL, [], query, 0.3, plate=True, credits=credits); time.sleep(0.5)
    json.dump(credits, open(CREDITS, 'w'), indent=1, ensure_ascii=False)
    print('credits written:', len(credits))


if __name__ == '__main__':
    main()

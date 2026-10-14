"""Composites the overlays (logo, crosshair, arrow, typed digits) on the 3D renders in render3d/. Run render3d/render.mjs first (needs node + three + playwright-core, see render3d/README.md).
   python3 make_masterpiece.py"""
import json, math, os
import art
from art import Canvas, rgb, Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
R3 = os.path.join(HERE, "render3d")

def load(c, name):
    im = Image.open(os.path.join(R3, name)).convert("RGBA").resize((c.w, c.h), Image.LANCZOS)
    c.img = im
    c.d = ImageDraw.Draw(c.img, "RGBA")
    return json.load(open(os.path.join(R3, name.replace(".png", ".json"))))

def crosshair(c, x, y, r, col=(255, 40, 40, 255)):
    l, d = c.layer()
    w = max(4, c.S(r * 0.1))
    for rr, a in ((r * 1.25, 60), (r * 1.12, 110)):
        d.ellipse([c.S(x - rr), c.S(y - rr), c.S(x + rr), c.S(y + rr)], outline=(255, 40, 40, a), width=c.S(r * 0.12))
    c.paste(l, blur=r * 0.08)
    l, d = c.layer()
    d.ellipse([c.S(x - r), c.S(y - r), c.S(x + r), c.S(y + r)], outline=col, width=w)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        d.line([c.S(x + dx * r * 0.55), c.S(y + dy * r * 0.55), c.S(x + dx * r * 1.35), c.S(y + dy * r * 1.35)], fill=col, width=w)
    d.ellipse([c.S(x - r * 0.1), c.S(y - r * 0.1), c.S(x + r * 0.1), c.S(y + r * 0.1)], fill=col)
    c.paste(l)

def arrow(c, pts, width, fill="#ff2d2d"):
    """a fat curved arrow along pts (list of (x, y)), head at the last point"""
    l, d = c.layer()
    S = c.S
    sh, shd = c.layer()
    for layer, dx, off, col, outline in ((sh, 0, 8, (0, 0, 0, 120), None), (l, 0, 0, rgb(fill), rgb("#ffffff"))):
        dd = ImageDraw.Draw(layer, "RGBA")
        for i in range(len(pts) - 1):
            (x0, y0), (x1, y1) = pts[i], pts[i + 1]
            for t in range(0, 41):
                tt = t / 40
                x, y = x0 + (x1 - x0) * tt, y0 + (y1 - y0) * tt + off
                dd.ellipse([S(x - width / 2), S(y - width / 2), S(x + width / 2), S(y + width / 2)], fill=col)
        (xa, ya), (xb, yb) = pts[-2], pts[-1]
        ang = math.atan2(yb - ya, xb - xa)
        L, Wd = width * 2.6, width * 2.1
        tip = (xb + math.cos(ang) * L * 0.55, yb + math.sin(ang) * L * 0.55 + off)
        base = (xb - math.cos(ang) * L * 0.45, yb - math.sin(ang) * L * 0.45 + off)
        p1 = (base[0] + math.cos(ang + math.pi / 2) * Wd / 2, base[1] + math.sin(ang + math.pi / 2) * Wd / 2)
        p2 = (base[0] + math.cos(ang - math.pi / 2) * Wd / 2, base[1] + math.sin(ang - math.pi / 2) * Wd / 2)
        dd.polygon([(S(tip[0]), S(tip[1])), (S(p1[0]), S(p1[1])), (S(p2[0]), S(p2[1]))], fill=col)
    c.paste(sh, blur=6)
    c.paste(l)
    # white outline pass: redraw slightly smaller red on top of a bigger white one
    l2, d2 = c.layer()
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        for t in range(0, 41):
            tt = t / 40
            x, y = x0 + (x1 - x0) * tt, y0 + (y1 - y0) * tt
            d2.ellipse([S(x - width * 0.36), S(y - width * 0.36), S(x + width * 0.36), S(y + width * 0.36)], fill=rgb(fill))
    c.paste(l2)

def readout(c, x, y, w, h, text, size):
    l, d = c.layer()
    d.rounded_rectangle([c.S(x - w / 2), c.S(y - h / 2), c.S(x + w / 2), c.S(y + h / 2)], radius=c.S(h * 0.28), fill=(12, 26, 60, 240), outline=rgb("#ffe45a"), width=c.S(8))
    c.paste(l)
    c.text((x, y), text, size, fill="#ffffff", stroke="#0a2a5a", sw=0.04, tracking=size * 0.06, shadow=False)

def vs_badge(c, x, y, r):
    l, d = c.layer()
    d.pieslice([c.S(x - r), c.S(y - r), c.S(x + r), c.S(y + r)], 90, 270, fill=(235, 62, 62, 255))
    d.pieslice([c.S(x - r), c.S(y - r), c.S(x + r), c.S(y + r)], 270, 450, fill=(58, 120, 245, 255))
    d.ellipse([c.S(x - r), c.S(y - r), c.S(x + r), c.S(y + r)], outline=(255, 255, 255, 255), width=c.S(r * 0.08))
    c.paste(l)
    c.text((x, y - r * 0.12), "10", r * 0.62, shadow=False, sw=0.07)
    c.text((x, y + r * 0.46), "vs 10", r * 0.34, shadow=False, sw=0.08)

def thumb():
    W, H = 1920, 1080
    c = Canvas(W, H)
    info = load(c, "hero_thumb.png")
    sx, sy = info["sign"]
    crosshair(c, sx + 46, sy + 6, 46)
    arrow(c, [(250, 640), (330, 470), (560, 330), (690, 285)], 52)
    readout(c, 290, 760, 440, 150, "42__", 120)
    vs_badge(c, 150, 150, 105)
    # logo, top right: two stacked words, thick outline
    c.text((1500, 125), "FIGURE", 165, tracking=5)
    c.text((1500, 275), "ME OUT", 165, fill="#ffe45a", tracking=5)
    return c.done(os.path.join(HERE, "thumbnails", "thumbnail_1_hero.png"))

def icon():
    W = 1024
    c = Canvas(W, W)
    info = load(c, "hero_icon.png")
    sx, sy = info["sign"]
    crosshair(c, sx, sy + 4, 64)
    readout(c, 512, 905, 560, 150, "42__", 120)
    c.text((512, 105), "FIGURE ME OUT", 112, tracking=3)
    return c.done(os.path.join(HERE, "icons", "game_icon_1_hero.png"))

def score_box(c, x, y, col, n):
    l, d = c.layer()
    d.rounded_rectangle([c.S(x - 110), c.S(y - 90), c.S(x + 110), c.S(y + 90)], radius=c.S(34), fill=rgb(col), outline=(255, 255, 255, 255), width=c.S(8))
    c.paste(l)
    c.text((x, y + 2), n, 150, shadow=False, sw=0.07)

def coin(c, x, y, r, label=None):
    l, d = c.layer()
    d.ellipse([c.S(x - r), c.S(y - r), c.S(x + r), c.S(y + r)], fill=rgb("#ffcc2e"), outline=rgb("#8a5a00"), width=c.S(r * 0.1))
    d.ellipse([c.S(x - r * 0.72), c.S(y - r * 0.72), c.S(x + r * 0.72), c.S(y + r * 0.72)], outline=rgb("#ffe98a"), width=c.S(r * 0.09))
    c.paste(l)
    c.text((x, y), label or "$", r * 1.0, fill="#8a5a00", stroke="#fff3b0", sw=0.0, shadow=False)

def teams():
    c = Canvas(1920, 1080)
    load(c, "teams.png")
    score_box(c, 820, 110, "#eb3e3e", "7")
    score_box(c, 1100, 110, "#3a78f5", "4")
    c.text((960, 110), "-", 130, shadow=False)
    c.text((960, 262), "10 vs 10", 100, fill="#ffffff", tracking=4)
    c.text((960, 345), "TEAM ELIMINATION", 60, fill="#ffe45a", sw=0.1)
    return c.done(os.path.join(HERE, "thumbnails", "thumbnail_3_elim.png"))

def win():
    c = Canvas(1920, 1080)
    load(c, "win.png")
    c.text((1000, 120), "WIN AS A TEAM!", 175, tracking=4)
    coin(c, 360, 620, 95, "+")
    c.text((360, 770), "+100", 120, fill="#ffe45a", stroke="#0a2a5a", sw=0.07)
    c.text((360, 860), "coins for winners", 44, sw=0.09)
    return c.done(os.path.join(HERE, "thumbnails", "thumbnail_5_rewards.png"))

if __name__ == "__main__":
    thumb(); icon(); teams(); win(); print("made hero thumbnail and icon from the 3D renders")

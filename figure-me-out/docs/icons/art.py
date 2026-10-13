"""A tiny drawing kit for the FIGURE ME OUT icons and thumbnails (PIL only). Everything is drawn at 2x and shrunk for smooth edges."""
import math, os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

FONT_PATH = os.environ.get("FMO_FONT", "/tmp/claude-0/fonts/Fredoka.ttf")
SS = 2  # supersampling

def font(size, weight=700):
    f = ImageFont.truetype(FONT_PATH, int(size * SS))
    try:
        f.set_variation_by_axes([weight, 100])
    except Exception:
        pass
    return f

def rgb(h, a=255):
    h = h.lstrip("#"); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

def shade(c, k, a=None):
    return (max(0, min(255, int(c[0] * k))), max(0, min(255, int(c[1] * k))), max(0, min(255, int(c[2] * k))), c[3] if a is None else a)

def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))

class Canvas:
    def __init__(self, w, h, top="#7fd4ff", bottom="#d8f4ff"):
        self.w, self.h = w * SS, h * SS
        self.img = Image.new("RGBA", (self.w, self.h))
        px = ImageDraw.Draw(self.img)
        t, b = rgb(top), rgb(bottom)
        for y in range(self.h):
            px.line([(0, y), (self.w, y)], fill=mix(t, b, y / (self.h - 1)))
        self.d = ImageDraw.Draw(self.img, "RGBA")

    def S(self, v):
        return int(v * SS)

    def layer(self):
        l = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        return l, ImageDraw.Draw(l, "RGBA")

    def paste(self, l, blur=0):
        if blur:
            l = l.filter(ImageFilter.GaussianBlur(blur * SS))
        self.img.alpha_composite(l)
        self.d = ImageDraw.Draw(self.img, "RGBA")

    # ---- shapes -------------------------------------------------------------------------------------------------
    def glow(self, cx, cy, r, color, strength=1.0):
        l, d = self.layer()
        d.ellipse([self.S(cx - r), self.S(cy - r), self.S(cx + r), self.S(cy + r)], fill=(color[0], color[1], color[2], int(255 * strength)))
        self.paste(l, blur=r / 3)

    def rays(self, cx, cy, n, color, length=2500, spread=0.5, rot=0.0):
        l, d = self.layer()
        for i in range(n):
            a = rot + i * 2 * math.pi / n
            w = math.pi / n * spread
            pts = [(self.S(cx), self.S(cy))] + [(self.S(cx + math.cos(a + s) * length), self.S(cy + math.sin(a + s) * length)) for s in (-w, w)]
            d.polygon(pts, fill=color)
        self.paste(l)

    def cloud(self, cx, cy, s, color=(255, 255, 255, 235)):
        l, d = self.layer()
        for dx, dy, r in [(-1.1, 0.25, 0.8), (-0.35, -0.1, 1.05), (0.55, 0.0, 1.0), (1.25, 0.28, 0.75), (0.1, 0.4, 1.1)]:
            d.ellipse([self.S(cx + (dx - r) * s), self.S(cy + (dy - r * 0.8) * s), self.S(cx + (dx + r) * s), self.S(cy + (dy + r * 0.8) * s)], fill=color)
        sh = l.copy()
        self.paste(l)

    def bubble(self, cx, cy, r, alpha=70):
        l, d = self.layer()
        d.ellipse([self.S(cx - r), self.S(cy - r), self.S(cx + r), self.S(cy + r)], fill=(255, 255, 255, alpha), outline=(255, 255, 255, 190), width=max(2, self.S(r * 0.06)))
        d.ellipse([self.S(cx - r * 0.55), self.S(cy - r * 0.6), self.S(cx - r * 0.1), self.S(cy - r * 0.25)], fill=(255, 255, 255, 190))
        self.paste(l)

    def rainbow(self, cx, cy, r, band, alpha=215):
        cols = ["#ff5a5a", "#ff9f43", "#ffe14d", "#5ad26e", "#4aa3ff", "#a56bff"]
        l, d = self.layer()
        for i, c in enumerate(cols):
            rr = r - i * band
            d.arc([self.S(cx - rr), self.S(cy - rr), self.S(cx + rr), self.S(cy + rr)], 180, 360, fill=rgb(c, alpha), width=self.S(band + 1))
        self.paste(l)

    def hill(self, cx, cy, rx, ry, color):
        l, d = self.layer()
        d.ellipse([self.S(cx - rx), self.S(cy - ry), self.S(cx + rx), self.S(cy + ry)], fill=color)
        d.ellipse([self.S(cx - rx * 0.9), self.S(cy - ry * 1.0), self.S(cx + rx * 0.5), self.S(cy + ry * 0.2)], fill=shade(color, 1.1))
        self.paste(l)

    def waterfall(self, x, y0, w, h, rng=None):
        rng = rng or random.Random(3)
        l, d = self.layer()
        for k in range(14):
            xx = x + (k / 13 - 0.5) * w * 0.92
            ww = w / 13
            top = rgb("#bff0ff", 255)
            d.rounded_rectangle([self.S(xx - ww * 0.5), self.S(y0), self.S(xx + ww * 0.5), self.S(y0 + h)], radius=self.S(ww * 0.4), fill=mix(rgb("#8fdcff"), rgb("#ffffff"), (k % 3) / 3), outline=None)
        for k in range(8):
            xx = x + (rng.random() - 0.5) * w * 0.9
            d.rounded_rectangle([self.S(xx - 3), self.S(y0 + rng.random() * h * 0.5), self.S(xx + 3), self.S(y0 + h * (0.6 + rng.random() * 0.4))], radius=self.S(3), fill=(255, 255, 255, 190))
        self.paste(l)
        self.glow(x, y0 + h, w * 0.7, (255, 255, 255, 255), 0.85)

    def rock(self, x, y, w, h, color="#a89a86"):
        l, d = self.layer()
        c = rgb(color)
        d.rounded_rectangle([self.S(x), self.S(y), self.S(x + w), self.S(y + h)], radius=self.S(w * 0.06), fill=c)
        for k in range(4):
            yy = y + h * (k + 1) / 5
            d.rectangle([self.S(x), self.S(yy), self.S(x + w), self.S(yy + h * 0.025)], fill=shade(c, 0.86 if k % 2 else 1.08))
        self.paste(l)

    def tree(self, x, base, s, leaf="#3fbf55"):
        l, d = self.layer()
        d.rounded_rectangle([self.S(x - s * 0.07), self.S(base - s * 0.5), self.S(x + s * 0.07), self.S(base)], radius=self.S(3), fill=rgb("#7a5230"))
        c = rgb(leaf)
        d.ellipse([self.S(x - s * 0.34), self.S(base - s * 1.0), self.S(x + s * 0.34), self.S(base - s * 0.4)], fill=shade(c, 0.85))
        d.ellipse([self.S(x - s * 0.28), self.S(base - s * 1.1), self.S(x + s * 0.3), self.S(base - s * 0.55)], fill=c)
        d.ellipse([self.S(x - s * 0.16), self.S(base - s * 1.05), self.S(x + s * 0.12), self.S(base - s * 0.8)], fill=shade(c, 1.15))
        self.paste(l)

    # ---- text ---------------------------------------------------------------------------------------------------
    def text(self, xy, s, size, fill="#ffffff", stroke="#10325a", sw=0.08, weight=700, anchor="mm", shadow=True, angle=0, tracking=0):
        f = font(size, weight)
        l, d = self.layer()
        x, y = self.S(xy[0]), self.S(xy[1])
        stroke_w = max(2, int(size * sw * SS))
        if tracking:
            # draw letter by letter for letter spacing
            widths = [f.getlength(ch) for ch in s]
            total = sum(widths) + tracking * SS * (len(s) - 1)
            cx = x - total / 2
            for ch, w in zip(s, widths):
                if shadow:
                    d.text((cx + w / 2 + size * 0.04 * SS, y + size * 0.07 * SS), ch, font=f, fill=(0, 0, 0, 90), anchor="mm", stroke_width=stroke_w, stroke_fill=(0, 0, 0, 90))
                d.text((cx + w / 2, y), ch, font=f, fill=rgb(fill) if isinstance(fill, str) else fill, anchor="mm", stroke_width=stroke_w, stroke_fill=rgb(stroke))
                cx += w + tracking * SS
        else:
            if shadow:
                d.text((x + size * 0.04 * SS, y + size * 0.07 * SS), s, font=f, fill=(0, 0, 0, 90), anchor=anchor, stroke_width=stroke_w, stroke_fill=(0, 0, 0, 90))
            d.text((x, y), s, font=f, fill=rgb(fill) if isinstance(fill, str) else fill, anchor=anchor, stroke_width=stroke_w, stroke_fill=rgb(stroke))
        if angle:
            l = l.rotate(angle, center=(x, y), resample=Image.BICUBIC)
        self.paste(l)

    # ---- the blocky character (a stand-in in the game's style, not a Roblox avatar) -------------------------------------
    def avatar(self, cx, base, s, shirt="#ff6b8b", pants="#3b5bdb", skin="#ffd9a0", number=None, tag=True, plate=True, mood="smile", flip=False, arm_up=None, hair=None):
        """cx = centre x, base = y of the feet, s = height of the whole figure in px."""
        l, d = self.layer()
        u = s / 10.0
        outline = (20, 30, 60, 255)
        ow = max(2, self.S(u * 0.22))
        def rr(x0, y0, x1, y1, color, rad=0.6):
            d.rounded_rectangle([self.S(x0), self.S(y0), self.S(x1), self.S(y1)], radius=self.S(u * rad), fill=rgb(color) if isinstance(color, str) else color, outline=outline, width=ow)
        # legs
        rr(cx - 2.1 * u, base - 3.8 * u, cx - 0.1 * u, base, pants)
        rr(cx + 0.1 * u, base - 3.8 * u, cx + 2.1 * u, base, pants)
        # shoes
        for sx in (-2.2, 0.0):
            d.rounded_rectangle([self.S(cx + sx * u - 0.05 * u), self.S(base - 0.9 * u), self.S(cx + (sx + 2.3) * u), self.S(base)], radius=self.S(u * 0.4), fill=(255, 255, 255, 255), outline=outline, width=ow)
        # torso (with a light stripe across the chest)
        rr(cx - 2.3 * u, base - 7.0 * u, cx + 2.3 * u, base - 3.6 * u, shirt)
        d.rectangle([self.S(cx - 2.15 * u), self.S(base - 5.9 * u), self.S(cx + 2.15 * u), self.S(base - 5.2 * u)], fill=(255, 255, 255, 120))
        # arms
        up = arm_up
        rr(cx - 4.0 * u, base - 6.9 * u, cx - 2.3 * u, base - 4.0 * u, skin, 0.5)
        if up:
            rr(cx + 2.3 * u, base - 9.2 * u, cx + 4.0 * u, base - 6.2 * u, skin, 0.5)
        else:
            rr(cx + 2.3 * u, base - 6.9 * u, cx + 4.0 * u, base - 4.0 * u, skin, 0.5)
        # head
        rr(cx - 2.0 * u, base - 9.9 * u, cx + 2.0 * u, base - 7.1 * u, skin, 0.9)
        # hair
        hc = hair or ["#3b2a20", "#e8a33c", "#7a3e12", "#20242e", "#d94f4f"][int(abs(cx)) % 5]
        d.rounded_rectangle([self.S(cx - 2.05 * u), self.S(base - 10.35 * u), self.S(cx + 2.05 * u), self.S(base - 9.2 * u)], radius=self.S(u * 0.55), fill=rgb(hc), outline=outline, width=ow)
        # face
        ey = base - 7.85 * u
        for ex in (-0.9, 0.9):
            d.ellipse([self.S(cx + ex * u - 0.28 * u), self.S(ey - 0.4 * u), self.S(cx + ex * u + 0.28 * u), self.S(ey + 0.45 * u)], fill=outline)
            d.ellipse([self.S(cx + ex * u - 0.12 * u), self.S(ey - 0.3 * u), self.S(cx + ex * u + 0.1 * u), self.S(ey - 0.05 * u)], fill=(255, 255, 255, 255))
        if mood == "smile":
            d.arc([self.S(cx - 0.8 * u), self.S(ey + 0.1 * u), self.S(cx + 0.8 * u), self.S(ey + 1.0 * u)], 20, 160, fill=outline, width=ow)
        elif mood == "wow":
            d.ellipse([self.S(cx - 0.3 * u), self.S(ey + 0.5 * u), self.S(cx + 0.3 * u), self.S(ey + 1.1 * u)], fill=outline)
        elif mood == "smirk":
            d.arc([self.S(cx - 0.3 * u), self.S(ey + 0.2 * u), self.S(cx + 0.9 * u), self.S(ey + 0.9 * u)], 20, 150, fill=outline, width=ow)
        # forehead plate
        if plate and number:
            pw, ph = 1.9 * u, 0.62 * u
            d.rounded_rectangle([self.S(cx - pw), self.S(base - 9.2 * u), self.S(cx + pw), self.S(base - 9.2 * u + ph * 1.5)], radius=self.S(u * 0.2), fill=(20, 30, 60, 255), outline=(255, 214, 60, 255), width=max(1, self.S(u * 0.08)))
        self.paste(l)
        if plate and number:
            self.text((cx, base - 9.2 * u + 0.45 * u), number, u * 0.62, fill="#ffe45a", stroke="#10325a", sw=0.1, shadow=False)
        if tag and number:
            self.text((cx, base - 11.9 * u), number, u * 1.9, fill="#ffe45a", stroke="#10325a", sw=0.11)

    def done(self, path, size=None):
        out = self.img
        if size:
            out = out.resize(size, Image.LANCZOS)
        else:
            out = out.resize((self.w // SS, self.h // SS), Image.LANCZOS)
        out.convert("RGB").save(path) if path.lower().endswith((".jpg", ".jpeg")) else out.save(path)
        return out

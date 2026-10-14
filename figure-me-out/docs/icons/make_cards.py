"""Makes the two title cards (intro and outro) as 1920x1080 30 fps mp4 files from the 3D renders.  python3 make_cards.py   (needs ffmpeg)
They are TITLE CARDS to put before and after your real gameplay clips in a video editor; they are not gameplay."""
import math, os, subprocess, shutil
import art
from art import Canvas, Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
R3 = os.path.join(HERE, "render3d")
OUT = os.path.join(HERE, "video")
FPS, W, H = 30, 1920, 1080

def text_img(text, size, w, h, fill="#ffffff", stroke="#10325a", tracking=4):
    c = Canvas(w, h)
    c.img = Image.new("RGBA", c.img.size, (0, 0, 0, 0)); c.d = ImageDraw.Draw(c.img, "RGBA")
    c.text((w / 2, h / 2), text, size, fill=fill, stroke=stroke, tracking=tracking)
    return c.img.resize((w, h), Image.LANCZOS)

def ease_back(t):
    t = max(0.0, min(1.0, t)); c1 = 1.70158; c3 = c1 + 1
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2

def ease_out(t):
    t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3

def place(frame, img, cx, cy, scale=1.0, alpha=1.0):
    if scale <= 0.01 or alpha <= 0:
        return
    w, h = int(img.width * scale), int(img.height * scale)
    im = img.resize((max(1, w), max(1, h)), Image.LANCZOS)
    if alpha < 1:
        a = im.getchannel("A").point(lambda v: int(v * alpha)); im.putalpha(a)
    frame.alpha_composite(im, (int(cx - w / 2), int(cy - h / 2)))

def crosshair_img(r=70):
    s = r * 4
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    c = s // 2; col = (255, 40, 40, 255); w = 8
    d.ellipse([c - r, c - r, c + r, c + r], outline=col, width=w)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        d.line([c + dx * r * 0.55, c + dy * r * 0.55, c + dx * r * 1.4, c + dy * r * 1.4], fill=col, width=w)
    d.ellipse([c - 8, c - 8, c + 8, c + 8], fill=col)
    return im.filter(ImageFilter.GaussianBlur(0.6))

def render(name, seconds, make_frame):
    d = os.path.join(OUT, "_frames_" + name)
    shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    n = int(seconds * FPS)
    for i in range(n):
        make_frame(i / FPS, i / (n - 1)).convert("RGB").save(os.path.join(d, f"f{i:04d}.png"))
    out = os.path.join(OUT, name + ".mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(d, "f%04d.png"), "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
                    "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-b:v", "12M", "-r", str(FPS), "-c:a", "aac", "-b:a", "96k", out], check=True)
    shutil.rmtree(d, ignore_errors=True)
    print("made", out, round(os.path.getsize(out) / 1e6, 2), "MB")

def kenburns(img, p, z0=1.0, z1=1.08, fx=0.35, fy=0.3):
    z = z0 + (z1 - z0) * p
    w, h = int(W / z), int(H / z)
    x0 = int((W - w) * fx); y0 = int((H - h) * fy)
    return img.crop((x0, y0, x0 + w, y0 + h)).resize((W, H), Image.LANCZOS)

def intro():
    bg = Image.open(os.path.join(R3, "hero_thumb.png")).convert("RGBA").resize((W, H), Image.LANCZOS)
    logo = Image.open(os.path.join(HERE, "logo.png")).convert("RGBA")
    logo = logo.resize((int(logo.width * 0.9), int(logo.height * 0.9)), Image.LANCZOS)
    tag = text_img("Type their number. Wipe out the other team!", 62, 1700, 130)
    cross = crosshair_img(66)
    def frame(t, p):
        f = kenburns(bg, p, 1.0, 1.07)
        shade = Image.new("RGBA", (W, H), (0, 0, 0, int(160 * max(0, 1 - t / 0.5)))); f.alpha_composite(shade)
        place(f, logo, 1480, 330, ease_back((t - 0.35) / 0.45) * 1.0, min(1, (t - 0.35) / 0.2))
        pulse = 1 + 0.08 * math.sin(t * 9)
        place(f, cross, 812, 262, ease_back((t - 1.1) / 0.35) * pulse * 1.0, min(1, (t - 1.1) / 0.15))
        place(f, tag, 960, 940, 1.0, min(1, (t - 1.6) / 0.35))
        fade = max(0, (t - 3.2) / 0.3)
        if fade:
            f.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(255 * min(1, fade)))))
        return f
    render("intro_card", 3.5, frame)

def outro():
    bg = Image.open(os.path.join(R3, "win.png")).convert("RGBA").resize((W, H), Image.LANCZOS)
    logo = Image.open(os.path.join(HERE, "logo.png")).convert("RGBA")
    logo = logo.resize((int(logo.width * 0.75), int(logo.height * 0.75)), Image.LANCZOS)
    play = text_img("PLAY NOW!", 190, 1300, 260, fill="#ffe45a")
    sub = text_img("10 vs 10  -  4-minute matches  -  free", 56, 1500, 120)
    def frame(t, p):
        f = kenburns(bg, p, 1.0, 1.06, 0.5, 0.4)
        f.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(150 * max(0, 1 - t / 0.4)))))
        place(f, logo, 1500, 300, ease_back((t - 0.2) / 0.45), min(1, (t - 0.2) / 0.2))
        pulse = 1 + 0.05 * math.sin(t * 8)
        place(f, play, 1250, 600, ease_back((t - 0.8) / 0.45) * pulse, min(1, (t - 0.8) / 0.2))
        place(f, sub, 1250, 790, 1.0, min(1, (t - 1.5) / 0.35))
        fade = max(0, (t - 3.2) / 0.3)
        if fade:
            f.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(255 * min(1, fade)))))
        return f
    render("outro_card", 3.5, frame)

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    intro(); outro()

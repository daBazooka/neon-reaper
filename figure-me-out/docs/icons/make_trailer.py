"""An ~58 second animated 'how to play' video (1920x1080, 30 fps, mp4) built from the 3D renders and the listing art.
It is an ANIMATED EXPLAINER, not recorded gameplay.   python3 make_trailer.py   (needs ffmpeg; run render3d/render.mjs first)"""
import math, os, subprocess, shutil, sys
from multiprocessing import Pool
import art
from art import Canvas, Image, ImageDraw, ImageFilter
from make_cards import text_img, ease_back, ease_out, place, kenburns, crosshair_img, FPS, W, H

HERE = os.path.dirname(os.path.abspath(__file__))
R3 = os.path.join(HERE, "render3d")
TH = os.path.join(HERE, "thumbnails")
OUT = os.path.join(HERE, "video")
TOTAL = 58.0

def load(path):
    return Image.open(path).convert("RGBA").resize((W, H), Image.LANCZOS)

def pill(w, h, fill=(12, 26, 60, 235), outline=(255, 228, 90, 255), r=None):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([2, 2, w - 3, h - 3], radius=r or h // 3, fill=fill, outline=outline, width=7)
    return im

def readout(text):
    base = pill(520, 150)
    t = text_img(text, 118, 520, 150, tracking=10, stroke="#0a2a5a")
    base.alpha_composite(t)
    return base

def caption(text):
    t = text_img(text, 50, 1800, 110, stroke="#0a1a3a", tracking=2)
    bar = Image.new("RGBA", (1800, 110), (0, 0, 0, 0)); d = ImageDraw.Draw(bar)
    d.rounded_rectangle([0, 0, 1799, 109], radius=40, fill=(8, 16, 40, 175))
    bar.alpha_composite(t)
    return bar

def burst(text, col=(90, 210, 110, 255), r=130):
    s = r * 2 + 40
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    pts = []
    for i in range(28):
        rr = r if i % 2 == 0 else r * 0.74
        a = 0.2 + i * math.pi / 14
        pts.append((s / 2 + math.cos(a) * rr, s / 2 + math.sin(a) * rr))
    d.polygon(pts, fill=col, outline=(16, 50, 90, 255))
    t = text_img(text, 84, s, s, stroke="#0b5a1a")
    im.alpha_composite(t.rotate(8, resample=Image.BICUBIC))
    return im

def score_box(col, n):
    im = Image.new("RGBA", (220, 180), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([4, 4, 215, 175], radius=34, fill=col, outline=(255, 255, 255, 255), width=8)
    im.alpha_composite(text_img(str(n), 140, 220, 180, stroke="#10325a"))
    return im

def warn_icon():
    im = Image.new("RGBA", (200, 180), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.polygon([(100, 8), (192, 170), (8, 170)], fill=(235, 50, 50, 255), outline=(255, 255, 255, 255))
    im.alpha_composite(text_img("!", 110, 200, 180, stroke="#7a1010"))
    return im

def bar(frac, w=900, h=56):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2, fill=(20, 24, 40, 220), outline=(255, 255, 255, 255), width=5)
    if frac > 0.02:
        d.rounded_rectangle([6, 6, 6 + int((w - 12) * frac), h - 7], radius=h // 2 - 4, fill=(235, 50, 50, 255))
    return im

def coin_img(n):
    im = Image.new("RGBA", (300, 300), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse([10, 10, 290, 290], fill=(255, 204, 46, 255), outline=(138, 90, 0, 255), width=12)
    d.ellipse([46, 46, 254, 254], outline=(255, 233, 138, 255), width=10)
    return im

def glow_card(w, h):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=50, outline=(255, 255, 255, 255), width=14)
    return im.filter(ImageFilter.GaussianBlur(3))

# ---- assets (built once, shared by all worker processes) ----
A = {}
def build_assets():
    A["hero"] = load(os.path.join(R3, "hero_thumb.png"))
    A["close"] = load(os.path.join(R3, "close.png"))
    A["teams"] = load(os.path.join(R3, "teams.png"))
    A["win"] = load(os.path.join(R3, "win.png"))
    A["items"] = load(os.path.join(TH, "thumbnail_4_items.png"))
    A["lobby"] = load(os.path.join(TH, "thumbnail_7_lobby.png"))
    A["quick"] = load(os.path.join(TH, "thumbnail_6_quick.png"))
    logo = Image.open(os.path.join(HERE, "logo.png")).convert("RGBA")
    A["logo"] = logo.resize((int(logo.width * 0.8), int(logo.height * 0.8)), Image.LANCZOS)
    A["cross"] = crosshair_img(66)
    A["read"] = {s: readout(s) for s in ("4___", "42__", "427_", "4271")}
    A["cap"] = {k: caption(v) for k, v in {
        "s2": "Everyone has a secret 4-digit number on a sign on their forehead",
        "s3": "Aim at a player and type their number. Right number = they are out!",
        "s4": "Red vs Blue: up to 10 vs 10. Eliminate the whole other team to win",
        "s5": "F = photo, G = binoculars. Chests give stun grenades and smoke",
        "s6": "Hide your own number! Covering it too long exposes you",
        "s7": "Winners get +100 coins. The player with the most hits is MVP",
        "s8": "30-second lobby, vote for one of 6 maps, 4-minute matches, daily quests",
    }.items()}
    A["out"] = burst("OUT!")
    A["redbox"] = {n: score_box((235, 62, 62, 255), n) for n in range(0, 11)}
    A["bluebox"] = {n: score_box((58, 120, 245, 255), n) for n in range(0, 11)}
    A["dash"] = text_img("-", 130, 120, 180)
    A["vs"] = text_img("10 vs 10", 110, 800, 160, stroke="#10325a")
    A["warn"] = warn_icon()
    A["warntext"] = text_img("DON'T COVER YOUR NUMBER", 56, 1100, 110, stroke="#7a1010")
    A["bars"] = {i: bar(i / 20) for i in range(21)}
    A["tag"] = text_img("Type their number. Wipe out the other team!", 62, 1700, 130)
    A["play"] = text_img("PLAY NOW!", 190, 1300, 260, fill="#ffe45a")
    A["sub"] = text_img("Free  -  10 vs 10  -  4-minute matches", 56, 1500, 120)
    A["plus100"] = text_img("+100", 190, 700, 260, fill="#ffe45a", stroke="#0a2a5a")
    A["coins"] = text_img("coins for winners", 54, 800, 100)
    A["mvp"] = burst("MVP", (255, 143, 171, 255), 120)
    A["note"] = text_img("Animated how-to-play video", 34, 700, 70, stroke="#0a1a3a")
    A["maps"] = text_img("6 MAPS - YOU VOTE!", 110, 1400, 180, fill="#ffe45a", stroke="#10325a")
    A["quests"] = text_img("DAILY QUESTS  -  WIN STREAKS", 80, 1500, 150, stroke="#10325a")
    A["items_titles"] = [text_img(t, 44, 440, 80, stroke="#0a1a3a") for t in ("PHOTO (F)", "BINOCULARS (G)", "STUN GRENADE", "SMOKE")]

def fade(f, t_in, t_out):
    """black fade at the start/end of a scene"""
    pass

def scene_frame(T):
    """returns an RGBA frame for global time T"""
    # ---- timeline ----
    if T < 4.0:
        t, p = T, T / 4.0
        f = kenburns(A["hero"], p, 1.0, 1.07)
        f.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(150 * max(0, 1 - t / 0.5)))))
        place(f, A["logo"], 1480, 330, ease_back((t - 0.35) / 0.45), min(1, (t - 0.35) / 0.2))
        place(f, A["tag"], 960, 930, 1.0, min(1, (t - 1.4) / 0.35))
    elif T < 11.0:
        t = T - 4.0; p = t / 7.0
        f = kenburns(A["close"], p, 1.0, 1.12, 0.5, 0.35)
        pulse = 1 + 0.04 * math.sin(t * 6)
        # the sign gets a ring pulse so the eye goes there
        place(f, A["cross"], 1000, 400, 0, 0)
        place(f, A["cap"]["s2"], 960, 985, 1.0, min(1, t / 0.4))
    elif T < 20.0:
        t = T - 11.0; p = t / 9.0
        f = kenburns(A["hero"], p, 1.0, 1.08)
        place(f, A["cross"], 812, 262, ease_back((t - 0.3) / 0.35) * (1 + 0.07 * math.sin(t * 9)), min(1, (t - 0.3) / 0.15))
        key = "4___" if t < 2.4 else "42__" if t < 3.4 else "427_" if t < 4.4 else "4271"
        if t > 1.5:
            place(f, A["read"][key], 960, 800, ease_back((t - 1.5) / 0.35), min(1, (t - 1.5) / 0.2))
        if t > 5.6:
            place(f, A["out"], 1250, 330, ease_back((t - 5.6) / 0.4), 1.0)
        place(f, A["cap"]["s3"], 960, 985, 1.0, min(1, t / 0.4))
    elif T < 28.0:
        t = T - 20.0; p = t / 8.0
        f = kenburns(A["teams"], p, 1.0, 1.06, 0.5, 0.3)
        red = min(10, int(t / 8.0 * 8)); blue = min(10, int(t / 8.0 * 5))
        place(f, A["redbox"][red], 820, 130, 1.0, min(1, t / 0.4))
        place(f, A["bluebox"][blue], 1100, 130, 1.0, min(1, t / 0.4))
        place(f, A["dash"], 960, 130, 1.0, min(1, t / 0.4))
        place(f, A["vs"], 960, 300, ease_back((t - 0.3) / 0.4), 1.0)
        place(f, A["cap"]["s4"], 960, 985, 1.0, min(1, t / 0.4))
    elif T < 38.0:
        t = T - 28.0; p = t / 10.0
        f = kenburns(A["items"], p, 1.0, 1.03, 0.5, 0.5)
        # a white ring moves from card to card
        idx = min(3, int(t / 2.4))
        place(f, glow_card(430, 560), 270 + idx * 460, 630, 1.0, 0.9)
        place(f, A["cap"]["s5"], 960, 985, 1.0, min(1, t / 0.4))
    elif T < 43.0:
        t = T - 38.0; p = t / 5.0
        f = kenburns(A["hero"], p, 1.0, 1.05, 0.3, 0.3)
        place(f, A["warn"], 420, 560, ease_back(t / 0.4) * (1 + 0.06 * math.sin(t * 10)), 1.0)
        place(f, A["warntext"], 1060, 520, 1.0, min(1, t / 0.4))
        place(f, A["bars"][min(20, int(max(0, t - 0.6) / 3.4 * 20))], 1010, 640, 1.0, min(1, t / 0.4))
        place(f, A["cap"]["s6"], 960, 985, 1.0, min(1, t / 0.4))
    elif T < 50.0:
        t = T - 43.0; p = t / 7.0
        f = kenburns(A["win"], p, 1.0, 1.05, 0.5, 0.4)
        place(f, A["plus100"], 360, 640, ease_back((t - 0.4) / 0.5), min(1, (t - 0.4) / 0.2))
        place(f, A["coins"], 360, 800, 1.0, min(1, (t - 1.0) / 0.4))
        place(f, A["mvp"], 1700, 330, ease_back((t - 2.6) / 0.5), 1.0)
        place(f, A["cap"]["s7"], 960, 985, 1.0, min(1, t / 0.4))
    elif T < 55.0:
        t = T - 50.0; p = t / 5.0
        f = kenburns(A["lobby"] if t < 2.5 else A["quick"], p if t < 2.5 else (t - 2.5) / 2.5, 1.0, 1.05)
        if t < 2.5:
            place(f, A["maps"], 960, 520, ease_back(t / 0.5), 1.0)
        else:
            place(f, A["quests"], 960, 780, ease_back((t - 2.5) / 0.5), 1.0)
        place(f, A["cap"]["s8"], 960, 985, 1.0, min(1, t / 0.4))
    else:
        t = T - 55.0; p = t / 3.0
        f = kenburns(A["win"], p, 1.0, 1.05, 0.5, 0.4)
        f.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(120 * max(0, 1 - t / 0.3)))))
        place(f, A["logo"], 1500, 300, ease_back(t / 0.45), 1.0)
        place(f, A["play"], 1250, 600, ease_back((t - 0.4) / 0.45) * (1 + 0.04 * math.sin(t * 8)), 1.0)
        place(f, A["sub"], 1250, 790, 1.0, min(1, (t - 0.9) / 0.35))
    # soft black fade at every cut so the scenes feel smooth
    cuts = (4.0, 11.0, 20.0, 28.0, 38.0, 43.0, 50.0, 55.0)
    d = min([abs(T - c) for c in cuts] + [T, TOTAL - T])
    if d < 0.2:
        f.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(255 * (1 - d / 0.2) * 0.9))))
    place(f, A["note"], 1550, 1050, 1.0, 0.55)
    return f

def work(i):
    out = os.path.join(OUT, "_trailer_frames", f"f{i:05d}.png")
    scene_frame(i / FPS).convert("RGB").save(out, compress_level=1)
    return i

def main():
    os.makedirs(OUT, exist_ok=True)
    fr = os.path.join(OUT, "_trailer_frames")
    shutil.rmtree(fr, ignore_errors=True); os.makedirs(fr)
    build_assets()
    n = int(TOTAL * FPS)
    with Pool(max(2, (os.cpu_count() or 2))) as pool:
        for k, _ in enumerate(pool.imap_unordered(work, range(n), chunksize=8)):
            if k % 200 == 0:
                print("frames", k, "/", n, flush=True)
    out = os.path.join(OUT, "figure_me_out_trailer.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(fr, "f%05d.png"), "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
                    "-t", str(TOTAL), "-c:v", "libx264", "-preset", "medium", "-b:v", "9M", "-maxrate", "12M", "-bufsize", "18M", "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "aac", "-b:a", "96k", out], check=True)
    shutil.rmtree(fr, ignore_errors=True)
    print("made", out, round(os.path.getsize(out) / 1e6, 1), "MB")

if __name__ == "__main__":
    main()

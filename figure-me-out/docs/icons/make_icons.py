"""Makes every FIGURE ME OUT image: game icons (1024 and 512), thumbnails (1920x1080) and badge icons (512).  python3 make_icons.py"""
import math, os, random
import art
from art import Canvas, rgb

HERE = os.path.dirname(os.path.abspath(__file__))
for d in ("icons", "thumbnails", "badges"):
    os.makedirs(os.path.join(HERE, d), exist_ok=True)

SKY1, SKY2 = "#62c8ff", "#e6f8ff"
SKINS = ["#f5cd30", "#cc8e69", "#f5cd30", "#8d5524", "#e7b78f"]
SHIRTS = ["#ff6b8b", "#ffb142", "#5ad26e", "#4aa3ff", "#a56bff", "#ff6bd6", "#2ed3c0", "#ff7b54"]
PANTS = ["#a3c429", "#2b6f3a", "#3b3f55", "#a3c429", "#1c4e8a", "#6a3fa0"]

def scenery(c, w, h, horizon, rainbow=True, hills=True):
    c.rays(w / 2, horizon + h * 0.2, 22, (255, 255, 255, 38), spread=0.45)
    c.cloud(w * 0.14, h * 0.16, h * 0.09); c.cloud(w * 0.82, h * 0.2, h * 0.11); c.cloud(w * 0.55, h * 0.1, h * 0.07)
    if rainbow:
        c.rainbow(w / 2, horizon, h * 0.5, h * 0.045)
    if hills:
        c.hill(w * 0.16, horizon + h * 0.2, w * 0.4, h * 0.22, rgb("#6ccf62"))
        c.hill(w * 0.86, horizon + h * 0.22, w * 0.44, h * 0.24, rgb("#58c155"))
        c.hill(w * 0.5, horizon + h * 0.4, w * 0.8, h * 0.3, rgb("#7ddc6e"))

def bubbles(c, w, h, n, seed=1, rmin=14, rmax=60):
    r = random.Random(seed)
    for _ in range(n):
        c.bubble(r.random() * w, r.random() * h, rmin + r.random() * (rmax - rmin), alpha=40 + int(r.random() * 40))

def title(c, cx, cy, size, sub=None, stack=False):
    if stack:
        c.text((cx, cy - size * 0.42), "FIGURE", size, tracking=size * 0.02)
        c.text((cx, cy + size * 0.55), "ME OUT", size, fill="#ffe45a", tracking=size * 0.02)
    else:
        c.text((cx, cy), "FIGURE ME OUT", size, tracking=size * 0.015)
    if sub:
        c.text((cx, cy + (size * 1.25 if stack else size * 0.75)), sub, size * 0.38, fill="#ffffff", stroke="#10325a", sw=0.1)

def starburst(c, cx, cy, r, color="#ffe45a", points=14, rot=0.2):
    l, d = c.layer()
    pts = []
    for i in range(points * 2):
        rr = r if i % 2 == 0 else r * 0.72
        a = rot + i * math.pi / points
        pts.append((c.S(cx + math.cos(a) * rr), c.S(cy + math.sin(a) * rr)))
    d.polygon(pts, fill=rgb(color), outline=rgb("#10325a"), width=c.S(r * 0.05))
    c.paste(l)

# ====================================================================================================== GAME ICONS
def split_bg(c, W, H, lean=0.08):
    l, d = c.layer()
    x = W * 0.5
    d.polygon([(0, 0), (c.S(x + W * lean), 0), (c.S(x - W * lean), c.S(H)), (0, c.S(H))], fill=(235, 62, 62, 255))
    d.polygon([(c.S(x + W * lean), 0), (c.S(W), 0), (c.S(W), c.S(H)), (c.S(x - W * lean), c.S(H))], fill=(58, 120, 245, 255))
    c.paste(l)
    c.rays(W / 2, H * 0.55, 22, (255, 255, 255, 36), spread=0.5)
    c.glow(W / 2, H * 0.5, H * 0.55, (255, 255, 255, 255), 0.16)

def crosshair(c, x, y, r):
    l, d = c.layer()
    w = max(3, c.S(r * 0.09))
    d.ellipse([c.S(x - r), c.S(y - r), c.S(x + r), c.S(y + r)], outline=(255, 255, 255, 255), width=w)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        d.line([c.S(x + dx * r * 0.62), c.S(y + dy * r * 0.62), c.S(x + dx * r * 1.28), c.S(y + dy * r * 1.28)], fill=(255, 255, 255, 255), width=w)
    d.ellipse([c.S(x - r * 0.12), c.S(y - r * 0.12), c.S(x + r * 0.12), c.S(y + r * 0.12)], fill=(255, 255, 255, 255))
    c.paste(l)

def icon_hero():
    # the hook in one look: a big Roblox face, a mustard number sign, a crosshair on it, red against blue
    c = Canvas(1024, 1024, "#ff6b6b", "#4aa3ff")
    split_bg(c, 1024, 1024)
    c.avatar(512, 2290, 2100, number="4271", shirt="#ff5a5a", pants=PANTS[2], skin="#f5cd30", mood="smile", plate=False)
    # a big readable sign on the forehead (the plate drawn by avatar() is too small at icon size)
    l, d = c.layer()
    d.rounded_rectangle([c.S(300), c.S(290), c.S(724), c.S(430)], radius=c.S(26), fill=(226, 178, 34, 255), outline=(120, 84, 8, 255), width=c.S(8))
    c.paste(l)
    c.text((512, 362), "4271", 112, fill="#16140f", stroke="#16140f", sw=0.0, shadow=False, tracking=4)
    crosshair(c, 512, 560, 82)
    l, d = c.layer()
    d.rounded_rectangle([c.S(250), c.S(815), c.S(774), c.S(975)], radius=c.S(48), fill=(14, 30, 64, 240), outline=rgb("#ffe45a"), width=c.S(8))
    c.paste(l)
    c.text((512, 895), "42__", 130, fill="#ffffff", stroke="#0a2a5a", sw=0.05, tracking=8, shadow=False)
    c.text((512, 105), "FIGURE ME OUT", 104, tracking=3)
    return c.done(os.path.join(HERE, "icons", "game_icon_1_hero.png"))

def icon_number():
    c = Canvas(1024, 1024, "#ffb347", "#ff6b8b")
    c.rays(512, 480, 20, (255, 255, 255, 55), spread=0.5)
    c.glow(512, 470, 380, (255, 255, 255, 255), 0.35)
    bubbles(c, 1024, 1024, 12, 9, 14, 50)
    # a big floating number tag with a question mark
    l, d = c.layer()
    d.rounded_rectangle([c.S(110), c.S(225), c.S(914), c.S(590)], radius=c.S(110), fill=(16, 38, 84, 245), outline=rgb("#ffe45a"), width=c.S(16))
    c.paste(l)
    c.text((512, 400), "4?2?", 300, fill="#ffe45a", stroke="#0a1f4a", sw=0.05, tracking=14, shadow=False)
    c.avatar(512, 1085, 470, number=None, shirt=SHIRTS[3], pants=PANTS[1], mood="wow", plate=False, tag=False)
    c.text((512, 135), "FIGURE ME OUT", 112, tracking=3)
    return c.done(os.path.join(HERE, "icons", "game_icon_2_number.png"))

def icon_teams():
    c = Canvas(1024, 1024, "#ff6b6b", "#4aa3ff")
    c.rays(512, 520, 22, (255, 255, 255, 50), spread=0.5)
    l, d = c.layer()
    d.polygon([(c.S(0), c.S(0)), (c.S(560), c.S(0)), (c.S(460), c.S(1024)), (c.S(0), c.S(1024))], fill=(235, 70, 70, 255))
    d.polygon([(c.S(560), c.S(0)), (c.S(1024), c.S(0)), (c.S(1024), c.S(1024)), (c.S(460), c.S(1024))], fill=(70, 130, 245, 255))
    c.paste(l)
    c.rays(512, 560, 20, (255, 255, 255, 40), spread=0.5)
    bubbles(c, 1024, 1024, 8, 31, 12, 40)
    c.avatar(270, 1000, 470, number="4722", shirt="#ff5a5a", pants=PANTS[2], arm_up=True)
    c.avatar(760, 1000, 470, number="9031", shirt="#4aa3ff", pants=PANTS[4], skin=SKINS[1], mood="smirk")
    starburst(c, 512, 470, 120, "#ffe45a", 14, 0.2)
    c.text((512, 470), "VS", 120, fill="#ffffff", stroke="#10325a")
    c.text((512, 135), "FIGURE ME OUT", 112, tracking=3)
    c.text((512, 250), "10 vs 10  TEAM ELIMINATION", 52, sw=0.09)
    return c.done(os.path.join(HERE, "icons", "game_icon_3_teams.png"))

def icon_crowd():
    c = Canvas(1024, 1024, "#7b6cff", "#c8b8ff")
    c.rays(512, 520, 24, (255, 255, 255, 48), spread=0.45)
    c.glow(512, 520, 420, (255, 255, 255, 255), 0.25)
    bubbles(c, 1024, 1024, 12, 21, 12, 46)
    spots = [(170, 3), (394, 1), (630, 2), (854, 0)]
    ns = ["3184", "9059", "4722", "6408"]
    for k, (x, i) in enumerate(spots):
        c.avatar(x, 930 + (k % 2) * 40, 400 + (k % 2) * 40, number=ns[i], shirt=SHIRTS[(i * 2 + 1) % 8], pants=PANTS[i % 6], skin=SKINS[i % 5], mood=["smile", "wow", "smirk", "smile"][i], arm_up=(k == 2))
    c.text((512, 120), "GUESS", 170, fill="#ffe45a", tracking=6)
    c.text((512, 255), "THE NUMBER!", 110, tracking=2)
    return c.done(os.path.join(HERE, "icons", "game_icon_4_crowd.png"))

# ====================================================================================================== THUMBNAILS
def thumb_hero():
    # two teams, a crosshair on a number sign, the typed digits and a hit: the whole game in one look. No small text, bottom edge kept clear.
    W, H = 1920, 1080
    c = Canvas(W, H, "#ff6b6b", "#4aa3ff")
    split_bg(c, W, H, 0.06)
    S = 960
    u = S / 5.5
    base = 1240
    hy0 = base - 5.3 * u
    for x, shirt, skin, pants, mood, n in ((470, "#ff5a5a", "#cc8e69", PANTS[0], "smirk", "9031"), (1450, "#4aa3ff", "#f5cd30", PANTS[4], "wow", "4271")):
        c.avatar(x, base, S, number=None, shirt=shirt, pants=pants, skin=skin, mood=mood, plate=False)
        l, d = c.layer()
        d.rounded_rectangle([c.S(x - 0.62 * u), c.S(hy0 + 0.04 * u), c.S(x + 0.62 * u), c.S(hy0 + 0.44 * u)], radius=c.S(14), fill=(226, 178, 34, 255), outline=(120, 84, 8, 255), width=c.S(5))
        c.paste(l)
        c.text((x, hy0 + 0.24 * u), n, u * 0.34, fill="#16140f", stroke="#16140f", sw=0.0, shadow=False, tracking=3)
    crosshair(c, 1450, hy0 + 0.1 * u + 0.45 * u, 62)
    c.text((960, 135), "FIGURE ME OUT", 190, tracking=6)
    l, d = c.layer()
    d.rounded_rectangle([c.S(700), c.S(690), c.S(1220), c.S(850)], radius=c.S(48), fill=(14, 30, 64, 238), outline=rgb("#ffe45a"), width=c.S(8))
    c.paste(l)
    c.text((960, 770), "42__", 130, fill="#ffffff", stroke="#0a2a5a", sw=0.05, tracking=8, shadow=False)
    starburst(c, 1010, 470, 120, "#5ad26e", 14, 0.3)
    c.text((1010, 470), "OUT!", 80, fill="#ffffff", stroke="#0b5a1a", angle=-8)
    return c.done(os.path.join(HERE, "thumbnails", "thumbnail_1_hero.png"))

def keypad(c, x, y, w, typed="47", result=None):
    l, d = c.layer()
    d.rounded_rectangle([c.S(x), c.S(y), c.S(x + w), c.S(y + w * 1.2)], radius=c.S(40), fill=(20, 54, 110, 245), outline=rgb("#6fdcff"), width=c.S(8))
    c.paste(l)
    c.text((x + w / 2, y + 52), "WHO IS 🦊 RED FOX?".replace("🦊 ", ""), 34, fill="#6fdcff", stroke="#0a2a5a", sw=0.08)
    for i in range(3):
        l, d = c.layer()
        bx = x + w * (0.12 + i * 0.29)
        d.rounded_rectangle([c.S(bx), c.S(y + 90), c.S(bx + w * 0.25), c.S(y + 90 + w * 0.26)], radius=c.S(20), fill=(10, 26, 60, 255), outline=rgb("#6fdcff"), width=c.S(5))
        c.paste(l)
        ch = typed[i] if i < len(typed) else "_"
        c.text((bx + w * 0.125, y + 90 + w * 0.13), ch, w * 0.2, fill="#ffffff" if ch != "_" else "#7a93c0", stroke="#0a2a5a", sw=0.06, shadow=False)
    n = 1
    for r in range(3):
        for k in range(3):
            l, d = c.layer()
            bx, by = x + w * (0.12 + k * 0.29), y + w * (0.45 + r * 0.2)
            d.rounded_rectangle([c.S(bx), c.S(by), c.S(bx + w * 0.25), c.S(by + w * 0.17)], radius=c.S(16), fill=(46, 100, 190, 255), outline=(10, 26, 60, 255), width=c.S(4))
            c.paste(l)
            c.text((bx + w * 0.125, by + w * 0.085), str(n), w * 0.11, shadow=False, sw=0.06)
            n += 1

def thumb_guess():
    W, H = 1920, 1080
    c = Canvas(W, H, "#5cc4ff", "#bfeaff")
    scenery(c, W, H, 760, rainbow=False)
    bubbles(c, W, H, 12, 7, 14, 54)
    c.tree(80, 960, 380)
    c.avatar(520, 1060, 590, number="4722", shirt=SHIRTS[1], pants=PANTS[2], mood="smirk")
    c.text((1290, 560), "47__", 250, tracking=8)
    starburst(c, 1010, 760, 150, "#5ad26e", 14, 0.35)
    c.text((1010, 760), "+150", 84, fill="#ffffff", stroke="#0b5a1a", angle=-6)
    starburst(c, 1640, 930, 130, "#ff5a5a", 12, 0.1)
    c.text((1640, 930), "FREEZE!", 52, fill="#ffffff", stroke="#7a1010", angle=8)
    c.text((960, 105), "TYPE THEIR NUMBER!", 128, tracking=3)
    c.text((960, 220), "Look at a player. Type 4 digits. It sends by itself!", 48, sw=0.09)
    return c.done(os.path.join(HERE, "thumbnails", "thumbnail_2_guess.png"))

def team_row(c, x0, x1, base, size, shirt, n, seed):
    r = random.Random(seed)
    step = (x1 - x0) / max(1, n - 1)
    for k in range(n):
        i = r.randint(0, 5)
        c.avatar(x0 + k * step, base + (k % 2) * 30, size, number=str(r.randint(1000, 9999)), shirt=shirt, pants=PANTS[i % 6], skin=SKINS[i % 5], mood=["smile", "smirk", "wow"][k % 3])

def thumb_elim():
    W, H = 1920, 1080
    c = Canvas(W, H, "#7fd0ff", "#e6f8ff")
    c.rays(W / 2, 600, 26, (255, 255, 255, 45))
    c.cloud(250, 170, 100); c.cloud(1700, 190, 120)
    l, d = c.layer()
    d.rectangle([c.S(0), c.S(700), c.S(W), c.S(H)], fill=rgb("#3b8fe8"))
    d.rectangle([c.S(0), c.S(700), c.S(W), c.S(730)], fill=rgb("#ff9b3d"))
    d.ellipse([c.S(760), c.S(780), c.S(1160), c.S(980)], outline=(255, 255, 255, 255), width=c.S(8))
    c.paste(l)
    team_row(c, 190, 760, 1000, 300, "#ff5a5a", 4, 3)
    team_row(c, 1160, 1730, 1000, 300, "#4aa3ff", 4, 9)
    for x, col, n in [(560, "#eb4646", "7"), (1360, "#4682f5", "4")]:
        l, d = c.layer()
        d.rounded_rectangle([c.S(x - 150), c.S(235), c.S(x + 150), c.S(445)], radius=c.S(40), fill=rgb(col), outline=rgb("#ffffff"), width=c.S(8))
        c.paste(l)
        c.text((x, 340), n, 200, shadow=False)
    c.text((960, 340), "-", 150, shadow=False)
    c.text((960, 100), "TEAM ELIMINATION", 150, tracking=4)
    c.text((960, 480), "RED vs BLUE   up to 10 vs 10", 66, fill="#ffffff", sw=0.1)
    c.text((960, 570), "Type their number. One hit and they are out!", 50, sw=0.09)
    return c.done(os.path.join(HERE, "thumbnails", "thumbnail_3_elim.png"))

def gadget(c, kind, cx, cy, r):
    l, d = c.layer()
    d.ellipse([c.S(cx - r), c.S(cy - r), c.S(cx + r), c.S(cy + r)], fill=(14, 30, 64, 235), outline=rgb("#ffffff"), width=c.S(8))
    c.paste(l)
    l, d = c.layer()
    if kind == "camera":
        d.rounded_rectangle([c.S(cx - r * 0.55), c.S(cy - r * 0.3), c.S(cx + r * 0.55), c.S(cy + r * 0.38)], radius=c.S(18), fill=rgb("#e8e8f0"), outline=rgb("#10325a"), width=c.S(5))
        d.ellipse([c.S(cx - r * 0.25), c.S(cy - r * 0.2), c.S(cx + r * 0.25), c.S(cy + r * 0.3)], fill=rgb("#2b3a67"), outline=rgb("#10325a"), width=c.S(5))
    elif kind == "binos":
        for dx in (-0.3, 0.3):
            d.rounded_rectangle([c.S(cx + dx * r - r * 0.24), c.S(cy - r * 0.45), c.S(cx + dx * r + r * 0.24), c.S(cy + r * 0.4)], radius=c.S(20), fill=rgb("#2b2f3a"), outline=rgb("#ff9b3d"), width=c.S(8))
        d.rectangle([c.S(cx - r * 0.1), c.S(cy - r * 0.1), c.S(cx + r * 0.1), c.S(cy + r * 0.15)], fill=rgb("#2b2f3a"))
    elif kind == "stun":
        d.polygon([(c.S(cx + r * 0.1), c.S(cy - r * 0.6)), (c.S(cx - r * 0.35), c.S(cy + r * 0.1)), (c.S(cx - r * 0.02), c.S(cy + r * 0.1)), (c.S(cx - r * 0.15), c.S(cy + r * 0.6)), (c.S(cx + r * 0.38), c.S(cy - r * 0.15)), (c.S(cx + r * 0.04), c.S(cy - r * 0.15))], fill=rgb("#ffe45a"), outline=rgb("#10325a"))
    else:
        d.ellipse([c.S(cx - r * 0.45), c.S(cy - r * 0.35), c.S(cx + r * 0.45), c.S(cy + r * 0.55)], fill=rgb("#cfd6e6"), outline=rgb("#10325a"), width=c.S(5))
        d.rectangle([c.S(cx - r * 0.12), c.S(cy - r * 0.62), c.S(cx + r * 0.12), c.S(cy - r * 0.3)], fill=rgb("#8a93ab"))
    c.paste(l)

def thumb_items():
    W, H = 1920, 1080
    c = Canvas(W, H, "#8a7bff", "#c8c0ff")
    c.rays(W / 2, 560, 28, (255, 255, 255, 40), spread=0.4)
    bubbles(c, W, H, 18, 11, 14, 60)
    items = [("camera", "PHOTO", "press F"), ("binos", "BINOCULARS", "press G"), ("stun", "STUN GRENADE", "freeze + blind"), ("smoke", "SMOKE", "hide in the cloud")]
    for i, (k, name, sub) in enumerate(items):
        x = 270 + i * 460
        l, d = c.layer()
        d.rounded_rectangle([c.S(x - 205), c.S(360), c.S(x + 205), c.S(900)], radius=c.S(50), fill=(255, 255, 255, 235), outline=rgb("#ffe45a"), width=c.S(10))
        c.paste(l)
        gadget(c, k, x, 560, 130)
        c.text((x, 760), name, 46 if len(name) < 12 else 38, fill="#16408a", stroke="#ffffff", sw=0.0, shadow=False)
        c.text((x, 830), sub, 36, fill="#4a5a8a", stroke="#ffffff", sw=0.0, shadow=False)
    c.text((960, 120), "USE YOUR GADGETS", 160, tracking=4)
    c.text((960, 250), "One press. No fuss. Outsmart the other team.", 58, sw=0.09)
    return c.done(os.path.join(HERE, "thumbnails", "thumbnail_4_items.png"))

def thumb_rewards():
    W, H = 1920, 1080
    c = Canvas(W, H, "#ffd86b", "#ffb347")
    c.rays(W / 2, 560, 30, (255, 255, 255, 60), spread=0.5)
    c.glow(W / 2, 600, 700, (255, 255, 255, 255), 0.35)
    bubbles(c, W, H, 16, 17, 14, 56)
    for i, x in enumerate([420, 700, 1220, 1500]):
        c.avatar(x, 1040, 330, number=None, shirt="#ff5a5a" if i < 2 else "#ff5a5a", pants=PANTS[i], skin=SKINS[i], mood="smile", arm_up=True, plate=False)
    l, d = c.layer()
    d.rounded_rectangle([c.S(790), c.S(520), c.S(1130), c.S(760)], radius=c.S(30), fill=rgb("#ffe45a"), outline=rgb("#10325a"), width=c.S(8))
    d.ellipse([c.S(700), c.S(560), c.S(860), c.S(700)], outline=rgb("#ffe45a"), width=c.S(26))
    d.ellipse([c.S(1060), c.S(560), c.S(1220), c.S(700)], outline=rgb("#ffe45a"), width=c.S(26))
    d.rectangle([c.S(915), c.S(760), c.S(1005), c.S(860)], fill=rgb("#e0b000"))
    d.rounded_rectangle([c.S(840), c.S(860), c.S(1080), c.S(910)], radius=c.S(14), fill=rgb("#c99a00"))
    c.paste(l)
    c.text((960, 640), "1", 190, fill="#ffffff", stroke="#7a5200", shadow=False)
    c.text((960, 120), "WIN AS A TEAM!", 170, tracking=4)
    c.text((960, 255), "Winners get +100 coins. The MVP gets a bonus. Win streaks pay more!", 54, sw=0.09)
    starburst(c, 1560, 470, 120, "#5ad26e", 14, 0.3)
    c.text((1560, 470), "+100", 70, fill="#ffffff", stroke="#0b5a1a", angle=-8)
    starburst(c, 360, 470, 110, "#ff8fab", 12, 0.1)
    c.text((360, 470), "MVP", 62, fill="#ffffff", stroke="#7a1030", angle=8)
    return c.done(os.path.join(HERE, "thumbnails", "thumbnail_5_rewards.png"))

def thumb_quick():
    W, H = 1920, 1080
    c = Canvas(W, H, "#5cc4ff", "#bfeaff")
    scenery(c, W, H, 760, rainbow=False)
    bubbles(c, W, H, 12, 3, 14, 54)
    for i, (txt, sub, col) in enumerate([("4 MIN", "quick matches", "#ff9f43"), ("30 s", "short lobby", "#4aa3ff"), ("20", "players per match", "#5ad26e"), ("FREE", "phone, tablet, PC", "#ff6b8b")]):
        x = 240 + i * 480
        l, d = c.layer()
        d.rounded_rectangle([c.S(x - 210), c.S(380), c.S(x + 210), c.S(780)], radius=c.S(60), fill=(255, 255, 255, 240), outline=rgb(col), width=c.S(14))
        c.paste(l)
        c.text((x, 520), txt, 130, fill=col, stroke="#10325a", sw=0.06)
        c.text((x, 680), sub, 42, fill="#16408a", stroke="#ffffff", sw=0.0, shadow=False)
    c.text((960, 125), "ONE MORE MATCH!", 170, tracking=4)
    c.text((960, 255), "Short rounds. Quick rewards. Daily quests and win streaks.", 56, sw=0.09)
    return c.done(os.path.join(HERE, "thumbnails", "thumbnail_6_quick.png"))

def thumb_lobby():
    W, H = 1920, 1080
    c = Canvas(W, H, "#ffb86b", "#ffe6c8")
    c.rays(W / 2, 640, 26, (255, 255, 255, 45))
    c.glow(W / 2, 700, 700, (255, 235, 200, 255), 0.4)
    c.rainbow(W / 2, 820, 640, 56, alpha=170)
    bubbles(c, W, H, 20, 5, 14, 70)
    c.cloud(250, 180, 100); c.cloud(1700, 150, 120)
    # island
    l, d = c.layer()
    d.ellipse([c.S(300), c.S(780), c.S(1620), c.S(1000)], fill=rgb("#8c7a68"))
    d.polygon([(c.S(420), c.S(900)), (c.S(1500), c.S(900)), (c.S(1100), c.S(1090)), (c.S(820), c.S(1090))], fill=rgb("#7a6a5a"))
    d.ellipse([c.S(260), c.S(700), c.S(1660), c.S(940)], fill=rgb("#7ddc6e"))
    d.ellipse([c.S(560), c.S(760), c.S(1360), c.S(900)], fill=rgb("#efe7d6"))
    c.paste(l)
    # fountain
    c.glow(960, 700, 120, (180, 235, 255, 255), 0.7)
    l, d = c.layer()
    d.rounded_rectangle([c.S(900), c.S(640), c.S(1020), c.S(800)], radius=c.S(30), fill=rgb("#f4f0e6"), outline=rgb("#10325a"), width=c.S(5))
    d.ellipse([c.S(820), c.S(770), c.S(1100), c.S(850)], fill=rgb("#8fdcff"), outline=rgb("#10325a"), width=c.S(5))
    c.paste(l)
    for dx in (-130, -60, 60, 130):
        c.bubble(960 + dx, 620 - abs(dx) * 0.3, 22, 120)
    c.tree(430, 850, 300); c.tree(1500, 850, 320)
    for x, i in [(640, 2), (1270, 3), (820, 5), (1110, 1)]:
        c.avatar(x, 900 + (i % 2) * 40, 330, number=str(random.Random(i * 5).randint(1000, 9999)), shirt=SHIRTS[i], pants=PANTS[i % 6], skin=SKINS[i % 5], tag=False, plate=False)
    c.text((960, 125), "FIGURE ME OUT", 180, tracking=5)
    c.text((960, 255), "Your number is on your screen. Keep it hidden!", 60, sw=0.09)
    # countdown pill
    l, d = c.layer()
    d.rounded_rectangle([c.S(620), c.S(960), c.S(1300), c.S(1050)], radius=c.S(45), fill=(14, 30, 64, 235), outline=rgb("#6fdcff"), width=c.S(6))
    c.paste(l)
    c.text((960, 1005), "NEXT MATCH IN 30 s", 58, fill="#ffe45a", stroke="#0a2a5a", shadow=False)
    return c.done(os.path.join(HERE, "thumbnails", "thumbnail_7_lobby.png"))

def thumb_real():
    """Uses REAL Roblox avatar renders if you put PNGs (transparent background, full body) in docs/icons/avatars/ : red_1.png, red_2.png, blue_1.png, blue_2.png.
    Get them from Roblox: Avatar editor > your avatar > or in Studio: Avatar tab > Avatar Preview > screenshot, or the website avatar image. Skipped when the folder is empty."""
    folder = os.path.join(HERE, "avatars")
    files = {n: os.path.join(folder, n + ".png") for n in ("red_1", "red_2", "blue_1", "blue_2")}
    have = {n: p for n, p in files.items() if os.path.exists(p)}
    if not have:
        return None
    W, H = 1920, 1080
    c = Canvas(W, H, "#ff6b6b", "#4aa3ff")
    split_bg(c, W, H, 0.06)
    slots = {"red_1": (330, 1.0), "red_2": (700, 0.8), "blue_1": (1590, 1.0), "blue_2": (1220, 0.8)}
    for n, p in have.items():
        im = art.Image.open(p).convert("RGBA")
        x, k = slots[n]
        h = int(1000 * k) * art.SS
        w = int(im.width * h / im.height)
        im = im.resize((w, h), art.Image.LANCZOS)
        c.img.alpha_composite(im, (c.S(x) - w // 2, c.S(1080 + 20) - h))
    c.d = art.ImageDraw.Draw(c.img, "RGBA")
    c.text((960, 150), "FIGURE ME OUT", 200, tracking=6)
    l, d = c.layer()
    d.rounded_rectangle([c.S(690), c.S(430), c.S(1230), c.S(640)], radius=c.S(44), fill=(14, 30, 64, 235), outline=rgb("#ffe45a"), width=c.S(8))
    c.paste(l)
    c.text((960, 535), "42__", 170, fill="#ffffff", stroke="#0a2a5a", sw=0.05, tracking=10, shadow=False)
    return c.done(os.path.join(HERE, "thumbnails", "thumbnail_0_real_avatars.png"))

# ====================================================================================================== BADGES
def badge(name, label, c1, c2, glyph):
    c = Canvas(512, 512, c1, c2)
    l, d = c.layer()
    d.ellipse([c.S(26), c.S(26), c.S(486), c.S(486)], fill=rgb("#ffe45a"), outline=rgb("#10325a"), width=c.S(10))
    d.ellipse([c.S(48), c.S(48), c.S(464), c.S(464)], fill=rgb(c2), outline=rgb("#10325a"), width=c.S(6))
    c.paste(l)
    c.glow(256, 230, 170, (255, 255, 255, 255), 0.35)
    glyph(c)
    c.text((256, 410), label, 52 if len(label) < 11 else 42, sw=0.09)
    # clip to a circle
    mask = art.Image.new("L", c.img.size, 0)
    md = art.ImageDraw.Draw(mask)
    md.ellipse([c.S(20), c.S(20), c.S(492), c.S(492)], fill=255)
    out = art.Image.new("RGBA", c.img.size, (0, 0, 0, 0))
    out.paste(c.img, (0, 0), mask)
    c.img = out
    return c.done(os.path.join(HERE, "badges", f"badge_{name}.png"))

def g_target(c):
    for r, col in [(120, "#ffffff"), (92, "#ff5a5a"), (62, "#ffffff"), (34, "#ff5a5a")]:
        l, d = c.layer(); d.ellipse([c.S(256 - r), c.S(230 - r), c.S(256 + r), c.S(230 + r)], fill=rgb(col), outline=rgb("#10325a"), width=c.S(5)); c.paste(l)

def g_trophy(c):
    l, d = c.layer()
    gold = rgb("#ffcf3c")
    d.polygon([(c.S(190), c.S(110)), (c.S(322), c.S(110)), (c.S(300), c.S(230)), (c.S(212), c.S(230))], fill=gold, outline=rgb("#10325a"))
    d.arc([c.S(130), c.S(120), c.S(210), c.S(200)], 90, 270, fill=gold, width=c.S(14)); d.arc([c.S(302), c.S(120), c.S(382), c.S(200)], 270, 90, fill=gold, width=c.S(14))
    d.rectangle([c.S(244), c.S(230), c.S(268), c.S(290)], fill=gold, outline=rgb("#10325a"))
    d.rounded_rectangle([c.S(196), c.S(290), c.S(316), c.S(325)], radius=c.S(8), fill=rgb("#b07a1a"), outline=rgb("#10325a"), width=c.S(4))
    c.paste(l)
    c.text((256, 165), "★", 80, fill="#fff6c0", stroke="#a06a10", sw=0.04, shadow=False)

def g_crown(c):
    l, d = c.layer()
    gold = rgb("#ffcf3c")
    d.polygon([(c.S(150), c.S(300)), (c.S(150), c.S(150)), (c.S(210), c.S(220)), (c.S(256), c.S(120)), (c.S(302), c.S(220)), (c.S(362), c.S(150)), (c.S(362), c.S(300))], fill=gold, outline=rgb("#10325a"), width=c.S(6))
    d.rectangle([c.S(150), c.S(300), c.S(362), c.S(330)], fill=rgb("#e8a820"), outline=rgb("#10325a"), width=c.S(5))
    for x, col in [(200, "#ff5a5a"), (256, "#4aa3ff"), (312, "#5ad26e")]:
        d.ellipse([c.S(x - 14), c.S(268 - 14), c.S(x + 14), c.S(268 + 14)], fill=rgb(col), outline=rgb("#10325a"), width=c.S(3))
    c.paste(l)

def g_flame(c):
    l, d = c.layer()
    d.polygon([(c.S(256), c.S(90)), (c.S(330), c.S(190)), (c.S(350), c.S(260)), (c.S(310), c.S(330)), (c.S(200), c.S(330)), (c.S(162), c.S(250)), (c.S(210), c.S(180)), (c.S(236), c.S(215))], fill=rgb("#ff7a1a"), outline=rgb("#10325a"), width=c.S(6))
    d.polygon([(c.S(256), c.S(190)), (c.S(300), c.S(255)), (c.S(284), c.S(318)), (c.S(228), c.S(318)), (c.S(212), c.S(258))], fill=rgb("#ffe14d"))
    c.paste(l)

def g_heart(c):
    l, d = c.layer()
    red = rgb("#ff4d6d")
    d.ellipse([c.S(150), c.S(130), c.S(266), c.S(246)], fill=red, outline=rgb("#10325a"), width=c.S(6))
    d.ellipse([c.S(246), c.S(130), c.S(362), c.S(246)], fill=red, outline=rgb("#10325a"), width=c.S(6))
    d.polygon([(c.S(152), c.S(210)), (c.S(360), c.S(210)), (c.S(256), c.S(340))], fill=red, outline=rgb("#10325a"))
    d.ellipse([c.S(150), c.S(130), c.S(266), c.S(246)], fill=red); d.ellipse([c.S(246), c.S(130), c.S(362), c.S(246)], fill=red)
    d.polygon([(c.S(156), c.S(205)), (c.S(356), c.S(205)), (c.S(256), c.S(332))], fill=red)
    d.ellipse([c.S(180), c.S(155), c.S(210), c.S(185)], fill=(255, 255, 255, 190))
    c.paste(l)

def g_flag(c):
    l, d = c.layer()
    d.rectangle([c.S(196), c.S(100), c.S(214), c.S(330)], fill=rgb("#5a5f73"), outline=rgb("#10325a"), width=c.S(3))
    d.polygon([(c.S(214), c.S(110)), (c.S(350), c.S(160)), (c.S(214), c.S(220))], fill=rgb("#4aa3ff"), outline=rgb("#10325a"), width=c.S(5))
    d.ellipse([c.S(180), c.S(320), c.S(240), c.S(345)], fill=rgb("#3d8a45"), outline=rgb("#10325a"), width=c.S(3))
    c.paste(l)

def g_falls(c):
    c.rock(150, 110, 212, 210, "#a39682")
    c.waterfall(256, 112, 90, 190)
    c.rainbow(256, 300, 110, 10, alpha=210)

def g_welcome(c):
    c.avatar(256, 345, 250, number="7774", shirt="#ff6b8b", pants="#3b5bdb", arm_up=True, plate=False, tag=False)
    starburst(c, 395, 150, 55, "#ffe45a", 10)

def g_wave(c):
    c.avatar(256, 345, 250, number=None, shirt="#5ad26e", pants="#364fc7", mood="wow", arm_up=True, plate=False, tag=False)
    for k in range(3):
        c.bubble(150 + k * 110, 100 - (k % 2) * 20, 22, 120)

def badges():
    jobs = [("welcome", "WELCOME", "#4cc0ff", "#2b8aff", g_welcome), ("first_hit", "FIRST HIT", "#ff9f43", "#e8590c", g_target), ("first_win", "FIRST WIN", "#ffd43b", "#f08c00", g_trophy),
            ("ten_wins", "10 WINS", "#b197fc", "#7048e8", g_crown), ("streak", "WIN STREAK", "#ff8787", "#e03131", g_flame), ("survivor", "SURVIVOR", "#ff8fab", "#d6336c", g_heart),
            ("flag_capture", "CAPTURE!", "#74c0fc", "#1c7ed6", g_flag), ("explorer", "CANYON", "#63e6be", "#0ca678", g_falls)]
    for name, label, c1, c2, glyph in jobs:
        badge(name, label, c1, c2, glyph)

def logo():
    c = Canvas(1400, 520, "#00000000", "#00000000")
    c.img = art.Image.new("RGBA", c.img.size, (0, 0, 0, 0)); c.d = art.ImageDraw.Draw(c.img, "RGBA")
    c.text((700, 150), "FIGURE", 230, tracking=8)
    c.text((700, 370), "ME OUT", 230, fill="#ffe45a", tracking=8)
    out = c.done(os.path.join(HERE, "logo.png"))

if __name__ == "__main__":
    import sys
    which = sys.argv[1:] or ["icons", "thumbs", "badges", "logo"]
    if "icons" in which:
        for f in (icon_hero, icon_number, icon_teams, icon_crowd):
            im = f(); print("made", f.__name__)
    if "thumbs" in which:
        for f in (thumb_hero, thumb_guess, thumb_elim, thumb_items, thumb_rewards, thumb_quick, thumb_lobby, thumb_real):
            r = f(); print("made" if r is not None or f.__name__ != "thumb_real" else "skipped (no avatars/ folder)", f.__name__)
    if "badges" in which:
        badges(); print("made badges")
    if "logo" in which:
        logo(); print("made logo")

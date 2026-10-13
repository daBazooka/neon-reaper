"""The model sheet: close-ups of the real objects the world builder makes, cut out of a dump of its parts.
usage: python3 render_model_sheet.py parts.txt   (writes models/*.png and model_sheet.png next to this file)"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import map_concepts as mc
from render_built_world import colour
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = [
    # name, subtitle, centre x, centre z, radius, elevation, azimuth
    ("WATERFALL", "sheet of water, foam pool, cliff, dry passage behind", 0, 100, 34, 22, -62),
    ("RIVER BRIDGE", "wooden deck, steps and rails over the river", 0, 70, 24, 30, -55),
    ("ROCK ARCH", "two legs and a lintel: walk under it, hide behind it", 57, -22, 20, 26, -50),
    ("WRECKED PLANE", "half-buried and tilted: solid cover on the west side", -104, 52, 22, 28, -50),
    ("DOCK AND ISLAND", "lake island, planked dock out to the shore, seaplane", 14, -86, 32, 30, -50),
    ("FLAG BASE", "the glowing pad and four posts (capture the flag)", -90, 0, 20, 30, -50),
    ("SPAWN PAD", "ten per side, in Workspace.ArenaSpawns", -85, 30, 12, 34, -50),
    ("JUNGLE", "trees (see-through leaves, solid trunks) and boulders", 40, 85, 30, 32, -50),
    ("PLANE IN THE SKY", "flies a circle over the arena (animated on your screen)", 99, 36, 30, 16, -40),
]

def load(src):
    parts = []
    for line in open(src):
        f = line.strip().split("|")
        if len(f) < 10 or f[0] != "PART":
            continue
        name = f[1]; x, y, z, w, h, d = map(float, f[2:8])
        if name in ("Hill", "FarGround", "Bubble", "Floor") or abs(x) > 150 or abs(z) > 150 or (w > 250 and (d > 250 or h < 3)):
            continue
        parts.append((name, x, y, z, w, h, d))
    return parts

def main(src):
    parts = load(src)
    os.makedirs(os.path.join(HERE, "models"), exist_ok=True)
    paths = []
    for i, (title, sub, cx, cz, r, el, az) in enumerate(MODELS, 1):
        sc = mc.Scene(title, sub, "#60b254", "#bfe8ff", "from the real world builder (CanyonWorld.luau), rotation not shown")
        n = 0
        for (name, x, y, z, w, h, d) in parts:
            if abs(x - cx) <= r + w / 2 and abs(z - cz) <= r + d / 2 and y - h / 2 < 80 and not (abs(x) < 1 and abs(z) < 1):
                if "Plane" in name and abs(y) < 30 and title != "PLANE IN THE SKY" and False:
                    continue
                sc.box(x, z, w, d, h, colour(name), y0=y - h / 2, alpha=0.8 if "waterfall" in name.lower() else 1.0)
                n += 1
        # planes are models whose parts the part dump can't place, so they are drawn from their definition
        if title == "WRECKED PLANE":
            sc.plane(-104, 52, 3.5, yaw=0.0, s=1.5, color="#d6453d")
            sc.box(-104, 52, 26, 10, 3, "#b0a696")
        if title == "DOCK AND ISLAND":
            sc.plane(30, -92, 1.0, yaw=math.pi / 2, s=0.9, color="#ffd84d")
        if title == "PLANE IN THE SKY":
            sc.plane(99, 36, 20, yaw=math.pi / 2, s=1.6, color="#ff4d4d")
            sc.line([(99, 36 - 40, 20), (99, 36 + 40, 20)], "#ffffff", 2.0, "--")
        p = os.path.join(HERE, "models", f"model{i}.png")
        mc.render(sc, p, 1200, 840, region=(cx, cz, r), elev=el, azim=az)
        print(title, n, "parts")
        paths.append(p)
    ims = [Image.open(p).convert("RGB").resize((800, 560), Image.LANCZOS) for p in paths]
    sheet = Image.new("RGB", (800 * 3, 560 * 3), "white")
    for i, im in enumerate(ims):
        sheet.paste(im, ((i % 3) * 800, (i // 3) * 560))
    sheet.save(os.path.join(HERE, "model_sheet.png"))

if __name__ == "__main__":
    main(sys.argv[1])

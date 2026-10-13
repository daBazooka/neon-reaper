"""Draws the lobby the world builder really makes (from the part dump).  usage: python3 render_lobby.py parts.txt out.png"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import map_concepts as mc

CYL = ("Grass", "Rock", "EdgeGlow", "Plaza", "FountainBasin", "FountainWater", "FountainColumn", "FountainBowl", "FlowerBed", "SkyIsle", "SkyIsleRock", "Island")
BALL = ("Leaves", "Flower", "LampBulb", "BannerKnob", "Cloud")

def colour(n):
    t = [("Grass", "#7ace5c"), ("EdgeGlow", "#5ad7ff"), ("Rock", "#968a7c"), ("SkyIsleRock", "#968a7c"), ("SkyIsle", "#7ace5c"), ("PlazaRing1", "#5ad7ff"), ("PlazaRing3", "#ffd63c"),
         ("PlazaRing", "#ece6d8"), ("Plaza", "#ece6d8"), ("FountainWater", "#6edcff"), ("Fountain", "#ece6d8"), ("Path", "#e2cea4"), ("FlowerBed", "#96704a"), ("Flower", "#ff78a0"),
         ("Bench", "#a07648"), ("LampPost", "#464c5c"), ("LampBulb", "#ffecaa"), ("Trunk", "#705030"), ("Leaves", "#3ca850"), ("Fall", "#9bdcff"), ("Banner", "#464c5c"), ("Title", "#166096"),
         ("Status", "#0e1e40"), ("Board", "#166096"), ("HowTo", "#166096"), ("Cloud", "#ffffff"), ("Spawn", "#40f0ff")]
    for k, v in t:
        if n.startswith(k):
            return v
    return "#c8c8c8"

def main(src, out):
    sc = mc.Scene("THE LOBBY", "a floating garden island: plaza, fountain, paths, benches, lamps, falls, boards", "#7ace5c", "#bfe8ff", "what the world builder really makes (LobbyWorld.luau)")
    sc.floor = mc.hexc("#bfe8ff")
    n = 0
    for line in open(src):
        f = line.strip().split("|")
        if len(f) < 10 or f[0] != "PART":
            continue
        name = f[1]; x, y, z, w, h, d = map(float, f[2:8])
        if name in ("SparkleAnchor", "FountainSpout", "LobbySpawnLocation"):
            continue
        if not (-190 < x < 190 and 230 < z < 610):
            continue
        base = next((b for b in CYL if name.startswith(b)), None)
        c = colour(name)
        if base:
            r = max(h, d) / 2
            sc.cyl(x, z - 420, r, w, c, y0=y - w / 2, n=28, alpha=0.85 if "Water" in name else 1.0)
        elif name == "Cloud":
            sc.cyl(x, z - 420, max(w, d) / 2, max(h, 2), c, y0=y - h / 2, n=20, alpha=0.8)
        elif any(name.startswith(b) for b in BALL):
            sc.box(x, z - 420, w, d, h, c, y0=y - h / 2)
        else:
            sc.box(x, z - 420, w, d, h, c, y0=y - h / 2, alpha=0.8 if name.startswith("LobbyFall") else 1.0)
        n += 1
    print("shapes", n)
    R = float(os.environ.get("R", "135"))
    mc.render(sc, out, 1500, 1050, region=(0, 0, R), elev=float(os.environ.get("ELEV", "26")), azim=-48, floor=False, zmin=-70 if R > 100 else -12, zspan=190 if R > 100 else 70)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

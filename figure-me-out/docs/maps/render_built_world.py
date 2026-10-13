"""Draws the map the world builder really makes (from a dump of its parts) so it can be compared with the concept picture.
usage: python3 render_built_world.py parts.txt out.png   (parts.txt = the PART| lines printed by tests/dump_scenario.luau)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import map_concepts as mc

def colour(name):
    n = name.lower()
    table = [("waterfall", "#9bdcff"), ("foam", "#ffffff"), ("pool", "#3aaaeb"), ("river", "#3aaaeb"), ("stream", "#3aaaeb"), ("join", "#3aaaeb"),
             ("falllip", "#3aaaeb"), ("lakebed", "#e8d9a0"), ("lakewater", "#4ab8f5"), ("shore", "#eedca0"), ("island", "#eedca0"), ("dock", "#b08850"),
             ("cliff", "#968c80"), ("buttress", "#b0a696"), ("wall", "#b0a696"), ("arch", "#b0a696"), ("boulder", "#8c8c96"), ("trunk", "#704f2f"),
             ("leaves", "#3aa84a"), ("ground", "#60b254"), ("bridge", "#a87c46"), ("body", "#d6453d"), ("wing", "#f5f5fa"), ("tailplane", "#f5f5fa"),
             ("fin", "#d6453d"), ("canopy", "#96d7ff"), ("prop", "#3c3c42"), ("wheel", "#282828"), ("pad", "#40f0ff"), ("spawn", "#40f0ff"), ("base", "#ff6a6a")]
    for k, v in table:
        if k in n:
            return v
    return "#c8c8c8"

def main(src, out):
    sc = mc.Scene("BUILT: WATERFALL CANYON", "what the world builder really makes (from the dump of its parts)", "#60b254", "#bfe8ff", "straight from src/server/Main/Modules/CanyonWorld.luau")
    count = 0
    for line in open(src):
        f = line.strip().split("|")
        if len(f) < 10 or f[0] != "PART":
            continue
        name = f[1]; x, y, z, w, h, d = map(float, f[2:8])
        if abs(x) > 150 or abs(z) > 150 or w > 250 and h < 3 or w > 250 and d > 250:
            continue
        if name in ("Hill", "FarGround", "Bubble"):
            continue
        if name == "Floor":
            continue
        alpha = 0.8 if "waterfall" in name.lower() else 1.0
        sc.box(x, z, w, d, h, colour(name), y0=y - h / 2, alpha=alpha)
        count += 1
    print("boxes", count)
    mc.render(sc, out)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

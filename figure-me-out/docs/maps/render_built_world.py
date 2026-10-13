"""Draws the map the world builder really makes (from a dump of its parts) so it can be compared with the concept picture.
usage: python3 render_built_world.py parts.txt out.png   (parts.txt = the PART| lines printed by tests/dump_scenario.luau)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import map_concepts as mc

def colour(name):
    n = name.lower()
    table = [("rainbow", "#ff9ec8"), ("grasspatch", "#7cc864"), ("trail", "#b89868"), ("bush", "#3a9a4a"), ("flower", "#ff78a0"), ("stone", "#9a9aa2"), ("lilypad", "#46aa50"), ("reed", "#6ea046"), ("cattail", "#70502e"), ("strata", "#b0a08a"), ("vine", "#3c9646"), ("lantern", "#ffe296"), ("waterfall", "#9bdcff"), ("foam", "#ffffff"), ("pool", "#3aaaeb"), ("river", "#3aaaeb"), ("stream", "#3aaaeb"), ("join", "#3aaaeb"),
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
        if name in ("Hill", "FarGround", "Bubble", "FireflyAnchor", "SparkAnchor", "SprayAnchor", "MistAnchor", "Trail"):
            continue
        if name == "Floor":
            continue
        alpha = 0.8 if "waterfall" in name.lower() else 1.0
        if name in ("GrassPatch", "LilyPad", "Island"):
            sc.cyl(x, z, max(h, d) / 2, w, colour(name), y0=y - w / 2, n=24)
        elif name == "RainbowBand":
            sc.box(x, z, 1.6, 0.5, 1.6, colour(name), y0=y - 0.8, alpha=0.7)
        elif name in ("Bush", "Leaves"):
            sc.cyl(x, z, w / 2, h, colour(name), y0=y - h / 2, n=12)
        else:
            sc.box(x, z, w, d, h, colour(name), y0=y - h / 2, alpha=alpha)
        count += 1
    # the dirt trails are turned boxes in the game (the dump has no rotation), so they are drawn from their end points
    trails = [(-90, 0, -14, 12), (90, 0, 14, 12), (-14, 12, -40, 75), (14, 12, 40, 75), (-90, 0, -105, -20), (90, 0, 105, -20), (-90, 0, -85, 30), (90, 0, 85, 30), (-40, -20, -14, 12), (40, -20, 14, 12)]
    for (x1, z1, x2, z2) in trails:
        for k in range(14):
            t = (k + 0.5) / 14
            sc.box(x1 + (x2 - x1) * t, z1 + (z2 - z1) * t, 5, 5, 0.1, "#b89868", y0=0.05)
    print("boxes", count)
    mc.render(sc, out)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

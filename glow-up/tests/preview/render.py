"""Renders orthographic previews of every animal from tests/preview/harness.luau (see run.sh)."""
import json, math, sys
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon

def hull(points):
    pts = sorted(set(map(tuple, points)))
    if len(pts) <= 2: return pts
    def cross(o, a, b): return (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0])
    lo = []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    up = []
    for p in reversed(pts):
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0: up.pop()
        up.append(p)
    return lo[:-1] + up[:-1]

def local_points(part):
    sx, sy, sz = [v / 2 for v in part["z"]]
    c, s = part["c"], part["s"]
    pts = []
    if c == "WedgePart":
        # slope faces front/top; the vertical wall is at +Z
        pts = [(-sx,-sy,-sz),(sx,-sy,-sz),(sx,-sy,sz),(-sx,-sy,sz),(-sx,sy,sz),(sx,sy,sz)]
    elif "Ball" in s:
        for i in range(0, 13):
            th = math.pi * i / 12
            for j in range(0, 24):
                ph = 2 * math.pi * j / 24
                pts.append((sx*math.sin(th)*math.cos(ph), sy*math.cos(th), sz*math.sin(th)*math.sin(ph)))
    elif "Cylinder" in s:
        for j in range(0, 24):
            ph = 2 * math.pi * j / 24
            for x in (-sx, sx):
                pts.append((x, sy*math.cos(ph), sz*math.sin(ph)))
    else:
        pts = [(x*sx, y*sy, z*sz) for x in (-1,1) for y in (-1,1) for z in (-1,1)]
    return pts

def world_points(part):
    r = part["r"]; p = part["p"]
    out = []
    for (x, y, z) in local_points(part):
        out.append((r[0]*x+r[1]*y+r[2]*z+p[0], r[3]*x+r[4]*y+r[5]*z+p[1], r[6]*x+r[7]*y+r[8]*z+p[2]))
    return out

VIEWS = {
    "side":  (lambda p: (p[2], p[1]), lambda p: -p[0]),   # horizontal = Z (front is -Z, on the left), vertical = Y
    "front": (lambda p: (p[0], p[1]), lambda p: p[2]),
    "top":   (lambda p: (p[0], -p[2]), lambda p: -p[1]),
}

def draw(ax, parts, view):
    proj, depth = VIEWS[view]
    items = []
    for part in parts:
        pts = world_points(part)
        d = sum(depth(p) for p in pts) / len(pts)
        items.append((d, part, [proj(p) for p in pts]))
    items.sort(key=lambda t: t[0])
    for d, part, pts2 in items:
        h = hull(pts2)
        if len(h) < 3: continue
        col = tuple(part["k"])
        ax.add_patch(Polygon(h, closed=True, facecolor=col, edgecolor=tuple(max(0, c*0.55) for c in col), linewidth=0.4, alpha=1 - part["t"]))
    ax.set_aspect("equal"); ax.autoscale_view(); ax.axis("off")

def main(path, out, only=None):
    data = json.load(open(path))
    ids = [i for i in data if not only or i in only]
    fig, axes = plt.subplots(len(ids), 3, figsize=(13, 3.4 * len(ids)), facecolor="#dfe9f3")
    if len(ids) == 1: axes = [axes]
    for row, id in zip(axes, ids):
        parts = data[id]["parts"]
        for ax, view in zip(row, ("side", "front", "top")):
            ax.set_facecolor("#dfe9f3")
            draw(ax, parts, view)
            xs = [q for part in parts for q in (world_points(part))]
            pr = [VIEWS[view][0](p) for p in xs]
            ax.set_xlim(min(a for a,b in pr)-0.3, max(a for a,b in pr)+0.3)
            ax.set_ylim(min(b for a,b in pr)-0.3, max(b for a,b in pr)+0.3)
            ax.set_title(f"{id} {view}  ({len(parts)} parts)", fontsize=9)
    plt.tight_layout()
    plt.savefig(out, dpi=100)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3:] or None)

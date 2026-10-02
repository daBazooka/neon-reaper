"""Renders front views of generated faces. usage: python3 tests/preview/face_render.py out.png"""
import json, math, os, subprocess, sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render import hull, world_points

here = os.path.dirname(os.path.abspath(__file__))
harness = open(here + "/harness.luau").read().split("-- ===== load Animals and run =====")[0]
src = open(here + "/face_harness.luau").read()
src = src.replace("HARNESS_PRELUDE", harness)
src = src.replace("(function() GENOME_SOURCE end)()", "(function()\n" + open(here + "/../../src/shared/Genome.luau").read() + "\nend)()")
src = src.replace("(function() FACE_SOURCE end)()", "(function()\n" + open(here + "/../../src/shared/Face.luau").read() + "\nend)()")
open("/tmp/claude-0/preview/face_preview.luau", "w").write(src)
res = subprocess.run([os.environ.get("LUAU", "/tmp/claude-0/lu/luau"), "/tmp/claude-0/preview/face_preview.luau"], capture_output=True, text=True)
if res.returncode != 0:
    print(res.stderr[:1500]); sys.exit(1)
cases = json.loads(res.stdout)
cols = 4
rows = math.ceil(len(cases) / cols)
fig, axes = plt.subplots(rows, cols, figsize=(3.2 * cols, 3.4 * rows), facecolor="#dfe9f3")
for ax, case in zip(axes.flat, cases):
    hc = tuple(case["hc"])
    h = case["head"]
    ax.add_patch(Polygon([(-h[0]/2, -h[1]/2), (h[0]/2, -h[1]/2), (h[0]/2, h[1]/2), (-h[0]/2, h[1]/2)], facecolor=hc, edgecolor="#333", linewidth=0.5))
    items = []
    for part in case["parts"]:
        pts = world_points(part)
        depth = sum(p[2] for p in pts) / len(pts)  # more negative z = nearer the camera (front is -Z)
        items.append((-depth, part, [(p[0], p[1]) for p in pts]))
    items.sort(key=lambda t: t[0])
    for d, part, pts2 in items:
        hh = hull(pts2)
        if len(hh) < 3: continue
        col = tuple(part["k"])
        ax.add_patch(Polygon(hh, closed=True, facecolor=col, edgecolor=tuple(max(0, c * 0.5) for c in col), linewidth=0.3, alpha=1 - part["t"]))
    ax.set_xlim(-0.95, 0.95); ax.set_ylim(-0.85, 1.0); ax.set_aspect("equal"); ax.axis("off")
    ax.set_title(f"player {case['id']}  level {case['level']}", fontsize=9)
plt.tight_layout()
plt.savefig(sys.argv[1], dpi=90)

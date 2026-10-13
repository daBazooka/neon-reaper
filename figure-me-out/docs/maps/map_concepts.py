"""Draws the map concepts for FIGURE ME OUT as 3D previews (python3 map_concepts.py). Every map is a list of simple
shapes on the 268 x 268 stud arena, so the chosen one can be turned into the Luau world builder directly."""
import math, random, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from PIL import Image

HALF = 134
OUT = os.path.dirname(os.path.abspath(__file__))

def hexc(h):
    h = h.lstrip("#"); return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))

def shade(c, k):
    return tuple(max(0, min(1, v * k)) for v in c)

class Scene:
    def __init__(self, name, tagline, floor, sky, notes):
        self.name, self.tagline, self.floor, self.sky, self.notes = name, tagline, hexc(floor), hexc(sky), notes
        self.faces, self.colors, self.spawns, self.labels = [], [], [], []
        self.floor_shapes = []
        self.lines = []

    def poly(self, pts, color, k=1.0, alpha=1.0):
        self.faces.append(pts); self.colors.append(shade(color, k) + (alpha,))

    def box(self, cx, cz, w, d, h, color, y0=0.0, alpha=1.0):
        c = hexc(color)
        x0, x1, z0, z1, y1 = cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, y0 + h
        P = lambda x, y, z: (x, z, y)  # matplotlib axes: X, Y(=world z), Z(=height)
        self.poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], c, 1.12, alpha)
        self.poly([P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], c, 0.80, alpha)
        self.poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], c, 0.92, alpha)
        self.poly([P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)], c, 0.70, alpha)
        self.poly([P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], c, 0.86, alpha)

    def cyl(self, cx, cz, r, h, color, y0=0.0, n=20, alpha=1.0):
        c = hexc(color)
        P = lambda x, y, z: (x, z, y)
        ring = [(cx + r * math.cos(2 * math.pi * i / n), cz + r * math.sin(2 * math.pi * i / n)) for i in range(n)]
        self.poly([P(x, y0 + h, z) for x, z in ring], c, 1.12, alpha)
        for i in range(n):
            (xa, za), (xb, zb) = ring[i], ring[(i + 1) % n]
            k = 0.62 + 0.38 * (0.5 + 0.5 * math.cos(2 * math.pi * (i + 0.5) / n - 2.2))
            self.poly([P(xa, y0, za), P(xb, y0, zb), P(xb, y0 + h, zb), P(xa, y0 + h, za)], c, k, alpha)

    def disc(self, cx, cz, r, color, y=0.02, n=40):
        self.cyl(cx, cz, r, 0.05, color, y0=y, n=n)

    def ramp(self, x0, z0, x1, z1, width, h0, h1, color):
        # a straight ramp from (x0,z0,h0) to (x1,z1,h1), drawn as a stack of steps
        steps = 8
        for i in range(steps):
            t = (i + 0.5) / steps
            cx, cz = x0 + (x1 - x0) * t, z0 + (z1 - z0) * t
            hh = h0 + (h1 - h0) * (i + 1) / steps
            L = math.hypot(x1 - x0, z1 - z0) / steps
            if abs(x1 - x0) > abs(z1 - z0):
                self.box(cx, cz, L * 1.02, width, hh, color, 0)
            else:
                self.box(cx, cz, width, L * 1.02, hh, color, 0)

    def tree(self, x, z, s=1.0, trunk="#8a5a2b", leaves="#2fae4e"):
        self.box(x, z, 1.6 * s, 1.6 * s, 5 * s, trunk)
        self.cyl(x, z, 5 * s, 6 * s, leaves, y0=5 * s, n=12)

    def line(self, pts, color, lw=2.5, style='-'):
        self.lines.append((pts, color, lw, style))

    def plane(self, x, z, y, yaw=0.0, s=1.0, color="#ff4d4d"):
        # a little propeller plane: fuselage, wings, tail fin, tail plane (axis-aligned; yaw picks nose along x or z)
        c = math.cos(yaw); sn = math.sin(yaw)
        def at(dx, dz): return (x + dx * c - dz * sn, z + dx * sn + dz * c)
        fx, fz = at(0, 0)
        along_x = abs(c) > 0.7
        L, W = 16 * s, 3 * s
        if along_x:
            self.box(fx, fz, L, W, 3 * s, color, y0=y)
            self.box(fx - 1 * s, fz, 3 * s, 20 * s, 0.7 * s, "#ffffff", y0=y + 1.2 * s)
            self.box(fx - 7 * s, fz, 3 * s, 8 * s, 0.6 * s, "#ffffff", y0=y + 1.4 * s)
            self.box(fx - 7 * s, fz, 3 * s, 0.6 * s, 4 * s, color, y0=y + 1.4 * s)
            self.box(fx + 8.5 * s, fz, 0.6 * s, 6 * s, 0.6 * s, "#444444", y0=y + 1.2 * s)
        else:
            self.box(fx, fz, W, L, 3 * s, color, y0=y)
            self.box(fx, fz - 1 * s, 20 * s, 3 * s, 0.7 * s, "#ffffff", y0=y + 1.2 * s)
            self.box(fx, fz - 7 * s, 8 * s, 3 * s, 0.6 * s, "#ffffff", y0=y + 1.4 * s)
            self.box(fx, fz - 7 * s, 0.6 * s, 3 * s, 4 * s, color, y0=y + 1.4 * s)
            self.box(fx, fz + 8.5 * s, 6 * s, 0.6 * s, 0.6 * s, "#444444", y0=y + 1.2 * s)

    def waterfall(self, x, z, w, drop, face="z", color="#6fd6ff"):
        # a sheet of falling water down a cliff face, white spray at the bottom
        if face == "z":
            self.box(x, z, w, 2.2, drop, color, y0=0, alpha=0.82)
            self.box(x, z, w * 0.6, 2.4, drop, "#ffffff", y0=0, alpha=0.55)
        else:
            self.box(x, z, 2.2, w, drop, color, y0=0, alpha=0.82)
            self.box(x, z, 2.4, w * 0.6, drop, "#ffffff", y0=0, alpha=0.55)
        self.cyl(x, z + (4 if face == "z" else 0), w * 0.55, 1.2, "#ffffff", y0=0.1, alpha=0.8, n=16)

    def spawn_ring(self, pts):
        self.spawns = pts

def render(scene, path, w=1500, h=1050, region=None, elev=38, azim=-52, floor_h=0.0):
    fig = plt.figure(figsize=(w / 100, h / 100), dpi=100)
    fig.patch.set_facecolor(scene.sky)
    ax = fig.add_axes([0, 0.08, 1, 0.80], projection="3d")
    ax.set_facecolor(scene.sky)
    ax.set_axis_off()
    ax.computed_zorder = False  # draw in the order we say: floor, then things, then spawn pads
    # floor
    H = HALF + 6
    cx0, cz0, rr = region if region else (0, 0, H)
    floor = Poly3DCollection([[(cx0 - rr, cz0 - rr, 0), (cx0 + rr, cz0 - rr, 0), (cx0 + rr, cz0 + rr, 0), (cx0 - rr, cz0 + rr, 0)]], facecolors=[scene.floor + (1,)], edgecolors=[shade(scene.floor, 0.8)], linewidths=0.6)
    floor.set_zorder(1); ax.add_collection3d(floor)
    pc = Poly3DCollection(scene.faces, facecolors=scene.colors, edgecolors=[(0, 0, 0, 0.12)], linewidths=0.25)
    pc.set_zorder(2); ax.add_collection3d(pc)
    for (x, z) in scene.spawns:
        t = [(x + 2.2 * math.cos(a), z + 2.2 * math.sin(a), 0.4 + 0.0) for a in [i * math.pi / 6 for i in range(12)]]
        sp = Poly3DCollection([t], facecolors=[(0.25, 0.95, 1.0, 1)], edgecolors=[(1, 1, 1, 1)], linewidths=0.8); sp.set_zorder(1.5); ax.add_collection3d(sp)
    for pts, col, lw, st in scene.lines:
        ax.plot([p[0] for p in pts], [p[1] for p in pts], [p[2] for p in pts], color=col, linewidth=lw, linestyle=st, zorder=3)
    ax.set_xlim(cx0 - rr, cx0 + rr); ax.set_ylim(cz0 - rr, cz0 + rr); ax.set_zlim(0, 2 * rr * 0.62)
    ax.set_box_aspect((1, 1, 0.62), zoom=1.12)
    ax.view_init(elev=elev, azim=azim)
    ax.dist = 7.4
    fig.text(0.5, 0.945, scene.name, ha="center", va="center", fontsize=40, fontweight="bold", color="white",
             path_effects=[__import__("matplotlib.patheffects", fromlist=["x"]).withStroke(linewidth=6, foreground="#10325a")])
    dark = sum(scene.sky) < 1.2
    ink = "#ffffff" if dark else "#10325a"
    fig.text(0.5, 0.895, scene.tagline, ha="center", va="center", fontsize=19, color=ink, fontweight="bold")
    fig.text(0.5, 0.03, scene.notes, ha="center", va="center", fontsize=15, color=ink, fontweight="bold")
    fig.savefig(path, facecolor=fig.get_facecolor())
    plt.close(fig)

def ring_spawns(n, r, jitter=0):
    return [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]

def grid_spawns(xs, zs):
    return [(x, z) for x in xs for z in zs]

# ------------------------------------------------------------------------------------------------------------- 1
def toy_box():
    s = Scene("1  GIANT TOY BOX", "Play-mat floor, towering ABC blocks, slides and a spinning-top tower", "#7fd1ff", "#bfe8ff",
              "Low cover everywhere  |  climb the block stacks for a view  |  easy to read, great for phones")
    rnd = random.Random(1)
    # play-mat patches
    for i, (c, x, z, w, d) in enumerate([("#ffd84d", -80, -80, 70, 70), ("#ff8fb8", 80, -80, 70, 70), ("#8be28b", -80, 80, 70, 70), ("#c9a0ff", 80, 80, 70, 70)]):
        s.box(x, z, w, d, 0.3, c)
    # central spinning top: cylinder tower with a ring ramp
    s.cyl(0, 0, 15, 4, "#ff5a5a"); s.cyl(0, 0, 10, 20, "#ffd84d", y0=4); s.cyl(0, 0, 14, 3, "#4aa3ff", y0=24); s.cyl(0, 0, 3, 10, "#ffffff", y0=27)
    # alphabet block stacks
    cols = ["#ff6b6b", "#ffd84d", "#4ecb71", "#4aa3ff", "#c77dff", "#ff9f43"]
    spots = [(-100, -30), (100, 30), (-30, 100), (30, -100), (-55, -55), (55, 55), (-55, 55), (55, -55), (-20, -40), (20, 40), (-110, 40), (110, -40)]
    for i, (x, z) in enumerate(spots):
        c = cols[i % 6]
        s.box(x, z, 14, 14, 14, c)
        if i % 2 == 0: s.box(x + 2, z - 1, 10, 10, 10, cols[(i + 2) % 6], y0=14)
        if i % 3 == 0: s.box(x, z, 6, 6, 6, cols[(i + 4) % 6], y0=24)
    # slides (ramps) and see-saws
    s.ramp(-100, -30, -100, -60, 10, 14, 0, "#ffffff"); s.ramp(100, 30, 100, 60, 10, 14, 0, "#ffffff")
    s.ramp(-30, 100, -60, 100, 10, 14, 0, "#ffffff"); s.ramp(30, -100, 60, -100, 10, 14, 0, "#ffffff")
    for (x, z) in [(-70, 0), (70, 0), (0, -70), (0, 70)]:
        s.box(x, z, 30, 5, 3, "#ff9f43"); s.box(x, z, 4, 6, 6, "#555555")
    # toy-train track loop
    for i in range(36):
        a = 2 * math.pi * i / 36
        s.box(122 * math.cos(a), 122 * math.sin(a), 9, 9, 1.2, "#7a5a3a")
    # beanbag balls
    for _ in range(14):
        s.cyl(rnd.uniform(-120, 120), rnd.uniform(-120, 120), 5, 5, rnd.choice(cols), n=14)
    s.spawn_ring(grid_spawns([-120, -60, 60, 120], [-100, -35, 35, 100]) + [(0, 118), (0, -118), (118, 0), (-118, 0)])
    return s

# ------------------------------------------------------------------------------------------------------------- 2
def sky_islands():
    s = Scene("2  SKY ISLANDS", "Floating islands joined by bridges and jump pads. Fall off and you are out!", "#5aa8ff", "#a8dcff",
              "Verticality  |  long sight-lines across the gaps  |  bridges are chokepoints  |  sudden-death edges")
    rnd = random.Random(2)
    s.floor = hexc("#7fc4ff")
    # central island, tall
    s.cyl(0, 0, 38, 10, "#7ddc6a"); s.cyl(0, 0, 38, 8, "#8b6a47", y0=0); s.cyl(0, 0, 38, 2, "#7ddc6a", y0=10)
    s.cyl(0, 0, 9, 16, "#e8e8f5", y0=12); s.cyl(0, 0, 11, 2, "#ff7ab0", y0=28)
    ring = []
    for i in range(6):
        a = 2 * math.pi * i / 6 + 0.3
        x, z = 92 * math.cos(a), 92 * math.sin(a)
        hgt = 6 + (i % 3) * 7
        s.cyl(x, z, 24, hgt, "#8b6a47"); s.cyl(x, z, 24, 2, ["#7ddc6a", "#ffd84d", "#ff9fb2"][i % 3], y0=hgt)
        s.tree(x + 6, z - 5, 1.1)
        s.box(x - 8, z + 6, 7, 7, 5, "#d9d9ea", y0=hgt + 2)
        ring.append((x, z, hgt))
        # bridge to the centre
        bx, bz = (x * 0.52), (z * 0.52)
        L = 36
        for k in range(10):
            t = k / 9
            px, pz = 40 * math.cos(a) + (x - 70 * math.cos(a)) * t * 0.0, 0
            cx = (38 + (92 - 24 - 38) * t) * math.cos(a) + 0
            cz = (38 + (92 - 24 - 38) * t) * math.sin(a)
            s.box(cx, cz, 5, 5, 0.8, "#c9a46a", y0=10 + (hgt - 10) * t)
    # small outer stepping islands
    for i in range(8):
        a = 2 * math.pi * i / 8 + 0.1
        x, z = 124 * math.cos(a), 124 * math.sin(a)
        s.cyl(x, z, 8, 4, "#ffd9a0", y0=rnd.uniform(0, 10))
    # clouds
    for _ in range(14):
        x, z = rnd.uniform(-125, 125), rnd.uniform(-125, 125)
        s.cyl(x, z, rnd.uniform(6, 11), 3, "#ffffff", y0=-2, alpha=0.9)
    sp = [(92 * math.cos(2 * math.pi * i / 6 + 0.3) + dx, 92 * math.sin(2 * math.pi * i / 6 + 0.3) + dz) for i in range(6) for dx, dz in [(-9, 5), (6, -8), (10, 8)]]
    sp += [(25 * math.cos(2 * math.pi * i / 4), 25 * math.sin(2 * math.pi * i / 4)) for i in range(4)]
    s.spawn_ring(sp[:20])
    return s

# ------------------------------------------------------------------------------------------------------------- 3
def mall():
    s = Scene("3  NEON MALL", "Two floors, a glass atrium, shop corridors and escalator ramps", "#ffd1e8", "#2a1f5a",
              "Indoor corridors  |  tons of corners and cover  |  balcony view over the atrium  |  close-range fights")
    wall, trim = "#ff6fb1", "#35e0ff"
    # outer shell walls (low-poly cutaway so you can see inside)
    s.box(0, -124, 260, 4, 14, wall); s.box(0, 124, 260, 4, 14, wall); s.box(-124, 0, 4, 252, 14, wall); s.box(124, 0, 4, 252, 14, wall)
    # atrium (open middle) with balcony ring
    s.box(0, -48, 120, 8, 9, "#7b5cff", y0=0); s.box(0, 48, 120, 8, 9, "#7b5cff"); s.box(-56, 0, 8, 100, 9, "#7b5cff"); s.box(56, 0, 8, 100, 9, "#7b5cff")
    s.cyl(0, 0, 14, 3, "#35e0ff"); s.cyl(0, 0, 9, 14, "#ffffff", y0=3); s.cyl(0, 0, 12, 1.5, "#ffd84d", y0=17)
    # shops in rows
    names = ["#ffb347", "#6bffb3", "#ff6b6b", "#6bb8ff", "#d07bff", "#fff36b"]
    i = 0
    for z in (-104, 104):
        for x in range(-100, 101, 40):
            s.box(x, z, 30, 18, 12, names[i % 6]); s.box(x, z + (6 if z < 0 else -6), 30, 3, 15, trim, y0=0)
            i += 1
    for x in (-104, 104):
        for z in range(-70, 71, 35):
            s.box(x, z, 18, 24, 12, names[i % 6]); i += 1
    # kiosks, benches and planters (cover)
    for (x, z) in [(-80, -30), (-80, 30), (80, -30), (80, 30), (-30, -80), (30, -80), (-30, 80), (30, 80), (-30, 0), (30, 0), (0, -30), (0, 30)]:
        s.box(x, z, 8, 8, 5, "#ffffff"); s.box(x, z, 5, 5, 8, "#ffd84d", y0=5)
    # second floor balconies + ramps up
    for (x0, z0, w, d) in [(-80, -70, 70, 8), (80, -70, 70, 8), (-80, 70, 70, 8), (80, 70, 70, 8)]:
        s.box(x0, z0, w, d, 1.5, "#35e0ff", y0=12)
    s.ramp(-45, -72, -45, -48, 8, 0, 12, "#ffffff"); s.ramp(45, 72, 45, 48, 8, 0, 12, "#ffffff")
    for i in range(14):
        s.cyl(-100 + i * 15.4, 0 + (-1) ** i * 5, 2, 12, "#ffffff", n=8)  # pillars
    s.spawn_ring(grid_spawns([-95, -45, 45, 95], [-85, -40, 40, 85]) + [(0, 85), (0, -85), (85, 0), (-85, 0)])
    return s

# ------------------------------------------------------------------------------------------------------------- 4
def hedge_garden():
    s = Scene("4  HEDGE GARDEN MAZE", "A circular hedge maze around a glowing fountain. Corners everywhere.", "#9be29b", "#d6f5ff",
              "Tight corridors  |  ambush corners  |  fountain plaza in the middle  |  rewards sneaking, not running")
    green, dark = "#2f9a46", "#237a37"
    # concentric hedge rings with gaps
    for r, gaps in [(112, [20, 110, 200, 290]), (88, [65, 155, 245, 335]), (64, [20, 110, 200, 290]), (40, [65, 155, 245, 335])]:
        n = int(2 * math.pi * r / 8)
        for i in range(n):
            a = 360 * i / n
            if any(abs(((a - g + 180) % 360) - 180) < 12 for g in gaps):
                continue
            x, z = r * math.cos(math.radians(a)), r * math.sin(math.radians(a))
            s.box(x, z, 9, 9, 11, green if (i // 3) % 2 else dark)
    # radial hedge dividers
    for a in (45, 135, 225, 315):
        for r in range(46, 106, 8):
            x, z = r * math.cos(math.radians(a)), r * math.sin(math.radians(a))
            s.box(x, z, 8, 8, 11, dark)
    # fountain
    s.cyl(0, 0, 18, 3, "#cfd8e8"); s.cyl(0, 0, 15, 3.5, "#46c8ff", y0=0.5); s.cyl(0, 0, 3, 14, "#e8eef8", y0=3); s.cyl(0, 0, 7, 2, "#46c8ff", y0=14)
    # flower beds and statues in the dead ends
    for k, (x, z) in enumerate([(100, 0), (-100, 0), (0, 100), (0, -100), (76, 76), (-76, 76), (76, -76), (-76, -76)]):
        s.box(x, z, 9, 9, 2, ["#ff6b9a", "#ffd84d", "#c77dff", "#ff9f43"][k % 4])
    for (x, z) in [(124, 124), (-124, 124), (124, -124), (-124, -124)]:
        s.tree(x, z, 1.8)
    # corner gazebos (raised lookouts)
    for (x, z) in [(122, 0), (-122, 0), (0, 122), (0, -122)]:
        s.cyl(x, z, 8, 9, "#ffffff"); s.cyl(x, z, 10, 1.5, "#ff7ab0", y0=9)
    s.spawn_ring(ring_spawns(12, 100) + ring_spawns(8, 76))
    return s

# ------------------------------------------------------------------------------------------------------------- 5
def pirate_cove():
    s = Scene("5  PIRATE COVE", "Sandy docks around a lagoon, with a big ship you can fight on", "#f2d58a", "#9bdcff",
              "Water in the middle  |  piers are chokepoints  |  the ship deck is the high ground  |  cannon towers at the corners")
    rnd = random.Random(5)
    # lagoon
    s.cyl(0, 0, 70, 0.6, "#2aa7e8", y0=0.0, n=40)
    # ship in the lagoon
    s.box(0, 0, 70, 20, 8, "#7a4a22"); s.box(0, 0, 60, 16, 1.2, "#c8a06a", y0=8)
    s.box(-22, 0, 14, 16, 10, "#6a3d1b", y0=8); s.box(26, 0, 18, 16, 6, "#6a3d1b", y0=8)
    for mx in (-8, 12): s.box(mx, 0, 2.4, 2.4, 34, "#5a3b1b", y0=8); s.box(mx, 0, 2, 26, 14, "#ffffff", y0=22)
    # piers radiating to the ship
    for a in (0, 90, 180, 270):
        for r in range(36, 120, 7):
            x, z = r * math.cos(math.radians(a)), r * math.sin(math.radians(a))
            s.box(x, z, 7 if a % 180 == 0 else 7, 7, 1.2, "#b08850", y0=0.5)
    for a in (45, 135, 225, 315):
        for r in range(70, 118, 7):
            x, z = r * math.cos(math.radians(a)), r * math.sin(math.radians(a))
            s.box(x, z, 7, 7, 1.2, "#b08850", y0=0.5)
    # cannon towers
    for (x, z) in [(118, 118), (-118, 118), (118, -118), (-118, -118)]:
        s.cyl(x, z, 11, 20, "#9a9a9a"); s.cyl(x, z, 13, 3, "#6a6a6a", y0=20); s.cyl(x, z, 4, 4, "#222222", y0=23)
    # crates, barrels, rocks, palms
    for _ in range(26):
        x, z = rnd.uniform(-125, 125), rnd.uniform(-125, 125)
        if math.hypot(x, z) < 78: continue
        if rnd.random() < 0.5: s.box(x, z, 6, 6, 6, "#a8743a")
        else: s.cyl(x, z, 3.5, 6, "#7b4a25", n=10)
    for _ in range(14):
        x, z = rnd.uniform(-125, 125), rnd.uniform(-125, 125)
        if math.hypot(x, z) < 80: continue
        s.tree(x, z, 1.2, trunk="#9a6a35", leaves="#35b34a")
    for _ in range(8):
        s.cyl(rnd.uniform(-125, 125), rnd.uniform(-125, 125), rnd.uniform(5, 9), rnd.uniform(5, 14), "#8c8c96", n=7)
    # skull hut
    s.box(-96, 0, 24, 18, 12, "#e8d9b0"); s.box(-96, 0, 26, 20, 3, "#7a4a22", y0=12)
    s.spawn_ring([(100 * math.cos(2 * math.pi * i / 16 + 0.2), 100 * math.sin(2 * math.pi * i / 16 + 0.2)) for i in range(16)] + [(-112, -30), (-112, 30), (112, -30), (112, 30)])
    return s

# ------------------------------------------------------------------------------------------------------------- 6
def candy_factory():
    s = Scene("6  CANDY FACTORY", "Conveyor belts, giant lollipops, gummy walls and a chocolate fountain", "#ffc2dd", "#fff0f8",
              "Moving belts push you around  |  gummy walls block sight  |  lollipop trees for cover  |  sweet and silly")
    rnd = random.Random(6)
    pink, mint, lemon, grape = "#ff8fc0", "#7ef0c4", "#fff06b", "#b98cff"
    # gummy wall maze segments
    walls = [(-90, -70, 8, 60), (90, 70, 8, 60), (-90, 70, 60, 8), (90, -70, 60, 8), (-40, -40, 50, 8), (40, 40, 50, 8), (-40, 40, 8, 50), (40, -40, 8, 50),
             (0, -100, 70, 8), (0, 100, 70, 8), (-110, 0, 8, 40), (110, 0, 8, 40)]
    cols = [pink, mint, lemon, grape]
    for i, (x, z, w, d) in enumerate(walls):
        s.box(x, z, w, d, 12, cols[i % 4])
    # conveyor belts (long dark strips with arrows as light blocks)
    for (x, z, w, d) in [(0, -70, 120, 12), (0, 70, 120, 12), (-70, 0, 12, 100), (70, 0, 12, 100)]:
        s.box(x, z, w, d, 1.2, "#555a6a")
        n = int(max(w, d) / 10)
        for k in range(n):
            if w > d: s.box(x - w / 2 + 6 + k * 10, z, 3, d - 4, 1.6, "#ffe14d", y0=0.4)
            else: s.box(x, z - d / 2 + 6 + k * 10, d - 4, 3, 1.6, "#ffe14d", y0=0.4)
    # chocolate fountain
    s.cyl(0, 0, 20, 2.5, "#7a4a2a"); s.cyl(0, 0, 14, 4, "#5a3320", y0=2.5); s.cyl(0, 0, 4, 20, "#7a4a2a", y0=4); s.cyl(0, 0, 10, 2, "#5a3320", y0=14); s.cyl(0, 0, 7, 2, "#7a4a2a", y0=20)
    # giant lollipops
    for _ in range(16):
        x, z = rnd.uniform(-120, 120), rnd.uniform(-120, 120)
        if math.hypot(x, z) < 28: continue
        s.cyl(x, z, 0.9, 12, "#ffffff"); s.cyl(x, z, 5.5, 2, rnd.choice(cols), y0=12, n=18)
    # cupcake bunkers
    for (x, z) in [(-60, -100), (60, -100), (-60, 100), (60, 100), (-120, -100), (120, 100)]:
        s.cyl(x, z, 8, 5, "#e8b86a"); s.cyl(x, z, 9, 4, rnd.choice(cols), y0=5)
    s.spawn_ring(grid_spawns([-115, -75, 75, 115], [-110, -50, 50, 110]) + [(0, 115), (0, -115), (98, 0), (-98, 0)])
    return s

# ------------------------------------------------------------------------------------------------------------- 7
def waterfall_canyon():
    s = Scene("7  WATERFALL CANYON", "Three working waterfalls, a river that pushes you, a lake and planes flying overhead",
              "#6fbf6a", "#bfe8ff",
              "Waterfalls hide the paths behind them  |  the river current carries you  |  planes fly circuits and one has crashed on a ledge")
    rnd = random.Random(7)
    rock, rock2 = "#9a8f84", "#b3a79b"
    # canyon cliffs along the north edge: stepped terraces with three waterfalls pouring off them
    for i, x in enumerate(range(-120, 121, 30)):
        s.box(x, -118, 30, 22, 26, rock if i % 2 else rock2)
        s.box(x, -112, 26, 14, 14, rock2 if i % 2 else rock, y0=26)
    for (fx, w, d) in [(-70, 16, 40), (0, 22, 46), (70, 16, 40)]:
        s.waterfall(fx, -105, w, 26 + 8, "z")
        s.box(fx, -118, w + 6, 12, 40, "#4aa8d8", y0=26, alpha=0.9)  # the stream running off the top
    # the river: three streams from the falls join into one that runs south to the lake
    river = "#3ab2f0"
    for fx in (-70, 0, 70):
        for k in range(8):
            z = -96 + k * 10
            s.box(fx + (0 - fx) * k / 14, z, 12, 10.5, 0.5, river, y0=0.0, alpha=0.95)
    for k in range(10):
        s.box(0, -20 + k * 10, 20, 10.5, 0.5, river, alpha=0.95)
    s.cyl(0, 78, 44, 0.6, river, n=36)   # the lake
    # lake island with a seaplane dock
    s.cyl(0, 78, 12, 1.6, "#e8d9a8")
    s.box(16, 78, 22, 4, 1.4, "#b08850", y0=0.6)
    s.plane(26, 70, 2.2, yaw=math.pi / 2, s=0.9, color="#ffd84d")  # the seaplane
    # bridges over the river and rock arches
    for z in (-50, 10):
        s.box(0, z, 28, 7, 1.4, "#b08850", y0=3)
        for dx in (-13, 13): s.box(dx, z, 2, 7, 3, "#7b5a33")
    for (x, z) in [(-100, 20), (100, 20), (-60, 55), (60, 55)]:
        s.box(x - 6, z, 5, 5, 18, rock); s.box(x + 6, z, 5, 5, 18, rock); s.box(x, z, 17, 5, 5, rock2, y0=18)
    # ledges behind the falls (dry paths)
    for fx in (-70, 0, 70):
        s.box(fx, -100, 24, 6, 1.2, "#cdbd9a", y0=0.0)
    # jungle
    for _ in range(46):
        x, z = rnd.uniform(-125, 125), rnd.uniform(-95, 125)
        if abs(x) < 16 and z < 60: continue
        if math.hypot(x, z - 78) < 50: continue
        s.tree(x, z, rnd.uniform(1.0, 1.7))
    for _ in range(12):
        s.cyl(rnd.uniform(-120, 120), rnd.uniform(-80, 120), rnd.uniform(4, 8), rnd.uniform(5, 12), "#8c8c96", n=7)
    # crashed plane on the west ledge: a bunker
    s.plane(-100, -60, 8, yaw=0.0, s=1.5, color="#d6453d")
    s.box(-100, -60, 26, 10, 8, rock2)
    # two planes flying a circuit overhead, and the flight path
    ring = [(104 * math.cos(2 * math.pi * k / 40), 104 * math.sin(2 * math.pi * k / 40), 58) for k in range(41)]
    s.line(ring, "#ffffff", 2.2, "--")
    for ang, col in [(0.35, "#ff4d4d"), (3.5, "#4da6ff")]:
        x, z = 104 * math.cos(ang), 104 * math.sin(ang)
        yaw = ang + math.pi / 2
        s.plane(x, z, 58, yaw=0.0 if abs(math.cos(yaw)) > 0.7 else math.pi / 2, s=1.5, color=col)
    s.spawn_ring([(-110 + 44 * i, 45) for i in range(6)] + [(-110 + 44 * i, 118) for i in range(6)] + [(-115, -20), (115, -20), (-115, 80), (115, 80), (-30, 20), (30, 20), (-30, -20), (30, -20)])
    # turn the map around so the cliffs and waterfalls are at the back, facing the viewer
    s.faces = [[(x, -y, h) for (x, y, h) in f] for f in s.faces]
    s.lines = [([(x, -y, h) for (x, y, h) in pts], c, lw, st) for (pts, c, lw, st) in s.lines]
    s.spawns = [(x, -z) for (x, z) in s.spawns]
    return s

if __name__ == "__main__":
    makers = [toy_box, sky_islands, mall, hedge_garden, pirate_cove, candy_factory, waterfall_canyon]
    paths = []
    for i, mk in enumerate(makers, 1):
        sc = mk(); p = os.path.join(OUT, f"map{i}.png"); render(sc, p); paths.append(p); print("drew", sc.name, len(sc.faces), "faces")
    # contact sheet
    ims = [Image.open(p).convert("RGB").resize((750, 525), Image.LANCZOS) for p in paths]
    sheet = Image.new("RGB", (750 * 4, 525 * 2), "white")
    for i, im in enumerate(ims):
        sheet.paste(im, ((i % 4) * 750, (i // 4) * 525))
    sheet.save(os.path.join(OUT, "all_maps.png"))

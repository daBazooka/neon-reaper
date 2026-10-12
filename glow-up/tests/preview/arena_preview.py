"""Renders the Ranked Arena (and the island pieces it reuses) from the real Luau source.
usage: python3 tests/preview/arena_preview.py out.png   (from the glow-up folder)"""
import json, math, os, subprocess, sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render import hull

here = os.path.dirname(os.path.abspath(__file__))
prelude = open(here + "/harness.luau").read().split("-- ===== load Animals and run =====")[0]
src = lambda p: open(os.path.join(here, "../../src/server/Main/Modules", p)).read()
island, arena = src("Island.luau"), src("RankedArena.luau")
script = prelude + """
warn = function(...) print("WARN", ...) end
UDim2 = { fromScale = function() return 0 end, new = function() return 0 end, fromOffset = function() return 0 end }
Vector2 = { new = function(x, y) return { X = x, Y = y } end }
Color3.fromHSV = Color3.fromHSV or function(h, s, v) return Color3.new(v, v, v) end
Random = { new = function(seed) math.randomseed(seed) return { NextNumber = function() return math.random() end, NextInteger = function(_, a, b) return math.random(a, b) end } end }
local ConfigStub = { Stations = {}, StationPos = function() return Vector3.new(0, 0, 0) end, StationFront = function() return Vector3.new(0, 0, -1) end, BattlePos = function() return Vector3.new(0,0,0) end, TreadHallPos = function() return Vector3.new(0,0,0) end }
local RSStub = { WaitForChild = function(self, n) if n == "Shared" then return self end return ConfigStub end }
require = function(x) return x end
game = { GetService = function() return RSStub end }
workspace = { Terrain = { FillBlock = function() end } }
local Island = (function()
""" + island + """
end)()
script = { Parent = { Island = Island } }
local RankedArena = (function()
""" + arena + """
end)()
local parent = Instance.new("Folder")
local info = RankedArena.build(parent, CFrame.new(0, 0, 0))
local out = {}
local function num(x) return string.format("%.3f", x) end
local function walk(node)
	for _, p in node._children do
		if p.ClassName == "Folder" then walk(p)
		elseif p.Size and p.CFrame then
			local cf = p.CFrame
			local r = cf.r
			table.insert(out, string.format('{"n":"%s","s":"%s","z":[%s,%s,%s],"p":[%s,%s,%s],"r":[%s],"k":[%s,%s,%s],"t":%s}', p.Name, tostring(p.Shape), num(p.Size.X), num(p.Size.Y), num(p.Size.Z), num(cf.p.X), num(cf.p.Y), num(cf.p.Z), table.concat((function() local t = {} for i = 1, 9 do t[i] = num(r[i]) end return t end)(), ","), num(p.Color.R), num(p.Color.G), num(p.Color.B), num(p.Transparency or 0)))
		end
	end
end
walk(parent)
print("[" .. table.concat(out, ",") .. "]")
"""
open("/tmp/claude-0/preview/arena_preview.luau", "w").write(script)
res = subprocess.run([os.environ.get("LUAU", "/tmp/claude-0/lu/luau"), "/tmp/claude-0/preview/arena_preview.luau"], capture_output=True, text=True)
if res.returncode != 0:
    print(res.stderr[:1800]); sys.exit(1)
lines = [l for l in res.stdout.splitlines()]
warns = [l for l in lines if l.startswith("WARN")]
for w in warns: print(w)
parts = json.loads([l for l in lines if l.startswith("[")][-1])
print(len(parts), "parts")

def local_points(part):
    sx, sy, sz = [v / 2 for v in part["z"]]
    s = part["s"]
    if "Ball" in s:
        return [(sx*math.sin(math.pi*i/6)*math.cos(2*math.pi*j/10), sy*math.cos(math.pi*i/6), sz*math.sin(math.pi*i/6)*math.sin(2*math.pi*j/10)) for i in range(7) for j in range(10)]
    if "Cylinder" in s:
        return [(x, sy*math.cos(2*math.pi*j/12), sz*math.sin(2*math.pi*j/12)) for j in range(12) for x in (-sx, sx)]
    return [(x*sx, y*sy, z*sz) for x in (-1,1) for y in (-1,1) for z in (-1,1)]

def world(part):
    r, p = part["r"], part["p"]
    return [(r[0]*x+r[1]*y+r[2]*z+p[0], r[3]*x+r[4]*y+r[5]*z+p[1], r[6]*x+r[7]*y+r[8]*z+p[2]) for x, y, z in local_points(part)]

def view(p, yaw, pitch, dist=0):
    x, y, z = p
    x2 = x*math.cos(yaw) - z*math.sin(yaw); z2 = x*math.sin(yaw) + z*math.cos(yaw)
    return (x2, y*math.cos(pitch) - z2*math.sin(pitch)), y*math.sin(pitch) + z2*math.cos(pitch)

def draw(ax, yaw, pitch, keep=lambda n: True):
    items = []
    for part in parts:
        if not keep(part["n"]): continue
        pr = [view(p, yaw, pitch) for p in world(part)]
        xy = [a for a, _ in pr]; depth = sum(d for _, d in pr)/len(pr)
        items.append((depth, part, xy))
    items.sort(key=lambda t: -t[0])
    for d, part, xy in items:
        h = hull(xy)
        if len(h) < 3: continue
        col = tuple(part["k"])
        ax.add_patch(Polygon(h, closed=True, facecolor=col, edgecolor=tuple(max(0, c*0.55) for c in col), linewidth=0.15, alpha=1 - part["t"]))
    ax.autoscale_view(); ax.set_aspect("equal"); ax.axis("off")

fig, axes = plt.subplots(1, 3, figsize=(27, 8), facecolor="#bfe0f5")
# from the plaza side looking into the arena (the entrance is at -z, so look from -z toward +z)
draw(axes[0], 3.14159, 0.50)
# a lower, closer view like the reference screenshot (from the front corner)
draw(axes[1], 2.55, 0.34)
# top view
draw(axes[2], 3.14159, 1.5)
plt.tight_layout()
plt.savefig(sys.argv[1], dpi=70)

"""Renders the whole island (src/server/Main/Modules/Island.luau) from above. usage: python3 map_preview.py out.png"""
import json, math, os, subprocess, sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render import hull

here = os.path.dirname(os.path.abspath(__file__))
prelude = open(here + "/harness.luau").read().split("-- ===== load Animals and run =====")[0]
config = open(here + "/../../src/shared/Config.luau").read()
island = open(here + "/../../src/server/Main/Modules/Island.luau").read()
script = prelude + """
Vector2 = { new = function(x, y) return { X = x, Y = y } end }
UDim2 = { fromScale = function() return {} end, new = function() return {} end }
Random = { new = function(seed) math.randomseed(seed) return { NextNumber = function() return math.random() end, NextInteger = function(_, a, b) return math.random(a, b) end } end }
Color3.fromHSV = Color3.fromHSV or function(h, s, v) return Color3.new(v, v, v) end
local ConfigModule = (function()
""" + config + """
end)()
local RSStub = { WaitForChild = function(self, n) if n == "Shared" then return self end return ConfigModule end }
require = function(x) return x end
game = { GetService = function() return RSStub end }
workspace = { Terrain = { FillBlock = function() end } }
local Island = (function()
""" + island + """
end)()
local parent = Instance.new("Folder")
local info = Island.build(parent)
print("INFO trees", info.trees, "cliff cells", info.cliffCells)
local out = {}
local function num(x) return string.format("%.2f", x) end
local function walk(node)
	for _, p in node._children do
		if p.ClassName == "Folder" then walk(p)
		elseif p.Size and p.CFrame and (p.Transparency or 0) < 0.9 then
			local cf = p.CFrame
			local r = cf.r
			table.insert(out, string.format('{"n":"%s","s":"%s","z":[%s,%s,%s],"p":[%s,%s,%s],"r":[%s],"k":[%s,%s,%s],"t":%s}', p.Name, tostring(p.Shape), num(p.Size.X), num(p.Size.Y), num(p.Size.Z), num(cf.p.X), num(cf.p.Y), num(cf.p.Z), table.concat((function() local t = {} for i = 1, 9 do t[i] = num(r[i]) end return t end)(), ","), num(p.Color.R), num(p.Color.G), num(p.Color.B), num(p.Transparency or 0)))
		end
	end
end
walk(parent)
print("[" .. table.concat(out, ",") .. "]")
"""
open("/tmp/claude-0/preview/map_preview.luau", "w").write(script)
res = subprocess.run([os.environ.get("LUAU", "/tmp/claude-0/lu/luau"), "/tmp/claude-0/preview/map_preview.luau"], capture_output=True, text=True)
sys.stderr.write(res.stderr[:600])
if res.returncode != 0:
    sys.exit(1)
lines = res.stdout.strip().split("\n")
print(lines[0])
parts = json.loads(lines[-1])
print(len(parts), "parts")

def corners(part):
    sx, sy, sz = [v / 2 for v in part["z"]]
    r, p = part["r"], part["p"]
    pts = [(x*sx, y*sy, z*sz) for x in (-1,1) for y in (-1,1) for z in (-1,1)]
    return [(r[0]*x+r[1]*y+r[2]*z+p[0], r[3]*x+r[4]*y+r[5]*z+p[1], r[6]*x+r[7]*y+r[8]*z+p[2]) for x, y, z in pts]

def oblique(p, yaw=0.5, pitch=0.8):
    x, y, z = p
    x2 = x*math.cos(yaw) - z*math.sin(yaw); z2 = x*math.sin(yaw) + z*math.cos(yaw)
    return (x2, y*math.cos(pitch) - z2*math.sin(pitch)), y*math.sin(pitch) + z2*math.cos(pitch)

fig, axes = plt.subplots(1, 2, figsize=(22, 11), facecolor="#8fc4ee")
for ax, mode in zip(axes, ("top", "oblique")):
    items = []
    for part in parts:
        pts = corners(part)
        if mode == "top":
            xy = [(p[0], -p[2]) for p in pts]; depth = sum(p[1] for p in pts)/len(pts)
        else:
            pr = [oblique(p) for p in pts]; xy = [a for a, _ in pr]; depth = -sum(d for _, d in pr)/len(pr)
        items.append((depth, part, xy))
    items.sort(key=lambda t: t[0], reverse=(mode == "oblique"))
    for d, part, xy in items:
        h = hull(xy)
        if len(h) < 3: continue
        col = tuple(part["k"])
        ax.add_patch(Polygon(h, closed=True, facecolor=col, edgecolor=tuple(max(0, c*0.6) for c in col), linewidth=0.1))
    ax.autoscale_view(); ax.set_aspect("equal"); ax.axis("off")
plt.tight_layout()
plt.savefig(sys.argv[1], dpi=70)

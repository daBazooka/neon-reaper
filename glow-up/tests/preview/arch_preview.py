"""Renders a building (shell + decoration) from src/server/Main/Modules/{Architecture,Decor}.luau.
usage: python3 arch_preview.py out.png [gym|studio|lounge]   -> oblique view, front view, and an interior top view"""
import json, math, os, subprocess, sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render import hull

here = os.path.dirname(os.path.abspath(__file__))
building = sys.argv[2] if len(sys.argv) > 2 else "gym"
prelude = open(here + "/harness.luau").read().split("-- ===== load Animals and run =====")[0]
arch = open(here + "/../../src/server/Main/Modules/Architecture.luau").read()
decor = open(here + "/../../src/server/Main/Modules/Decor.luau").read()
gym = open(here + "/../../src/server/Main/Modules/GymEquipment.luau").read()
PALS = {
    "gym": "wall = Color3.fromRGB(150, 64, 56), wallMat = Enum.Material.Brick, accent = Color3.fromRGB(210, 55, 50)",
    "studio": "wall = Color3.fromRGB(238, 196, 214), wallMat = Enum.Material.Marble, accent = Color3.fromRGB(235, 90, 185)",
    "lounge": "wall = Color3.fromRGB(90, 168, 188), wallMat = Enum.Material.Concrete, accent = Color3.fromRGB(40, 185, 200)",
}
script = prelude + """
Color3.fromHSV = function(h, s, v)
	local i = math.floor(h * 6) % 6
	local f = h * 6 - math.floor(h * 6)
	local p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
	local rgb = { {v, t, p}, {q, v, p}, {p, v, t}, {p, q, v}, {t, p, v}, {v, p, q} }
	local c = rgb[i + 1]
	return Color3.new(c[1], c[2], c[3])
end
UDim2 = { fromScale = function() return 0 end, new = function() return 0 end, fromOffset = function() return 0 end }
warn = function(...) print("WARN", ...) end
Vector2 = { new = function(x, y) return { X = x, Y = y } end }
NumberRange = { new = function(a, b) return { Min = a, Max = b or a } end }
NumberSequenceKeypoint = { new = function(t, v) return { Time = t, Value = v } end }
NumberSequence = { new = function(a) return a end }
ColorSequenceKeypoint = { new = function(t, c) return { Time = t, Value = c } end }
ColorSequence = { new = function(a) return a end }
Random = { new = function(seed) math.randomseed(seed) return { NextNumber = function() return math.random() end, NextInteger = function(_, a, b) return math.random(a, b) end } end }
local ConfigStub = { GymPadLocal = Vector3.new(0, 1.2, 3), Weights = {
	{ Kg = 5, Color = Color3.fromRGB(150, 155, 165) }, { Kg = 10, Color = Color3.fromRGB(90, 95, 110) }, { Kg = 20, Color = Color3.fromRGB(70, 130, 230) },
	{ Kg = 30, Color = Color3.fromRGB(80, 200, 110) }, { Kg = 45, Color = Color3.fromRGB(255, 200, 50) }, { Kg = 60, Color = Color3.fromRGB(230, 60, 70) },
	{ Kg = 80, Color = Color3.fromRGB(160, 100, 255) }, { Kg = 100, Color = Color3.fromRGB(80, 255, 230), Neon = true } },
	Buildings = {
	gym = { Main = Color3.fromRGB(210, 55, 50), Glow = Color3.fromRGB(255, 130, 40) },
	studio = { Main = Color3.fromRGB(235, 90, 185), Glow = Color3.fromRGB(255, 140, 225) },
	lounge = { Main = Color3.fromRGB(40, 185, 200), Glow = Color3.fromRGB(100, 245, 235) },
} }
local RSStub = { WaitForChild = function(self, n) if n == "Shared" then return self end return ConfigStub end }
require = function(x) return x end
game = { GetService = function() return RSStub end }
local Architecture = (function()
""" + arch + """
end)()
local GymEq = (function()
""" + gym + """
end)()
script = { Parent = { GymEquipment = GymEq } }
local Decor = (function()
""" + decor + """
end)()
local parent = Instance.new("Folder")
local pal = { """ + PALS[building] + """, floorA = Color3.fromRGB(190, 190, 196), floorB = Color3.fromRGB(110, 112, 120), floorMat = Enum.Material.Slate, roof = Color3.fromRGB(60, 62, 70) }
Architecture.pavilion(parent, CFrame.new(0, 0, 0), pal)
Decor.pavilion(parent, "%s", CFrame.new(0, 0, 0))
local out = {}
local function num(x) return string.format("%%.3f", x) end
local function walk(node)
	for _, p in node._children do
		if p.ClassName == "Folder" then walk(p)
		elseif p.Size and p.CFrame then
			local cf = p.CFrame
			local r = cf.r
			table.insert(out, string.format('{"n":"%%s","c":"%%s","s":"%%s","z":[%%s,%%s,%%s],"p":[%%s,%%s,%%s],"r":[%%s],"k":[%%s,%%s,%%s],"t":%%s,"f":"%%s"}', p.Name, p.ClassName, tostring(p.Shape), num(p.Size.X), num(p.Size.Y), num(p.Size.Z), num(cf.p.X), num(cf.p.Y), num(cf.p.Z), table.concat((function() local t = {} for i = 1, 9 do t[i] = num(r[i]) end return t end)(), ","), num(p.Color.R), num(p.Color.G), num(p.Color.B), num(p.Transparency or 0), (p.Parent and p.Parent.Name) or ""))
		end
	end
end
walk(parent)
print("[" .. table.concat(out, ",") .. "]")
""" % building
open("/tmp/claude-0/preview/arch_preview.luau", "w").write(script)
res = subprocess.run([os.environ.get("LUAU", "/tmp/claude-0/lu/luau"), "/tmp/claude-0/preview/arch_preview.luau"], capture_output=True, text=True)
if res.returncode != 0:
    print(res.stderr[:1800]); sys.exit(1)
parts = json.loads(res.stdout)
print(len(parts), "parts")

def local_points(part):
    sx, sy, sz = [v / 2 for v in part["z"]]
    s = part["s"]
    if "Ball" in s:
        return [(sx*math.sin(math.pi*i/8)*math.cos(2*math.pi*j/16), sy*math.cos(math.pi*i/8), sz*math.sin(math.pi*i/8)*math.sin(2*math.pi*j/16)) for i in range(9) for j in range(16)]
    if "Cylinder" in s:
        return [(x, sy*math.cos(2*math.pi*j/16), sz*math.sin(2*math.pi*j/16)) for j in range(16) for x in (-sx, sx)]
    return [(x*sx, y*sy, z*sz) for x in (-1,1) for y in (-1,1) for z in (-1,1)]

def world(part):
    r, p = part["r"], part["p"]
    return [(r[0]*x+r[1]*y+r[2]*z+p[0], r[3]*x+r[4]*y+r[5]*z+p[1], r[6]*x+r[7]*y+r[8]*z+p[2]) for x, y, z in local_points(part)]

HIDE_INTERIOR = ("Roof", "Parapet", "Ceiling", "Beam", "CeilingLight", "Cornice", "Dentil", "RoofTile", "RoofRidge", "Chimney", "AuraBeacon", "Chandelier", "Crystal", "Lantern", "PendantCord", "PendantLamp", "SmokeSource", "AuraRing", "Banner")

def oblique(p, yaw=0.6, pitch=0.5):
    x, y, z = p
    x2 = x*math.cos(yaw) - z*math.sin(yaw); z2 = x*math.sin(yaw) + z*math.cos(yaw)
    return (x2, y*math.cos(pitch) - z2*math.sin(pitch)), y*math.sin(pitch) + z2*math.cos(pitch)

def draw(ax, mode, keep, yaw=0.6, pitch=0.5, only=None):
    items = []
    for part in parts:
        if only and part.get("f") != only: continue
        if not keep(part["n"]): continue
        pts = world(part)
        if mode == "oblique":
            pr = [oblique(p, yaw, pitch) for p in pts]; xy = [a for a, _ in pr]; depth = -sum(d for _, d in pr)/len(pr)
        elif mode == "front":
            xy = [(p[0], p[1]) for p in pts]; depth = sum(p[2] for p in pts)/len(pts)
        else:  # top view (looking down); nearer = higher y
            xy = [(p[0], -p[2]) for p in pts]; depth = sum(p[1] for p in pts)/len(pts)
        items.append((depth, part, xy))
    items.sort(key=lambda t: t[0], reverse=(mode == "oblique"))
    for d, part, xy in items:
        h = hull(xy)
        if len(h) < 3: continue
        col = tuple(part["k"])
        ax.add_patch(Polygon(h, closed=True, facecolor=col, edgecolor=tuple(max(0, c*0.5) for c in col), linewidth=0.2, alpha=1 - part["t"]))
    ax.autoscale_view(); ax.set_aspect("equal"); ax.axis("off")

fig, axes = plt.subplots(1, 4, figsize=(28, 7), facecolor="#dfe9f3")
draw(axes[0], "oblique", lambda n: n not in ("SmokeSource", "AuraRing"))
draw(axes[1], "front", lambda n: n not in ("SmokeSource", "AuraRing"))
draw(axes[2], "top", lambda n: not any(n.startswith(h) for h in HIDE_INTERIOR))
draw(axes[3], "oblique", lambda n: True, yaw=2.6, pitch=0.62, only="GymEquipment")
plt.tight_layout()
plt.savefig(sys.argv[1], dpi=75)

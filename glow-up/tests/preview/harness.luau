-- Offline preview harness: tiny Vector3/CFrame/Instance implementations so Animals.build can run under the plain
-- Luau CLI and dump every part (size, shape, world transform, colour) as JSON for tests/preview/render.py.
local V = {}
V.__index = function(t, k) if k == "Magnitude" then return math.sqrt(t.X*t.X+t.Y*t.Y+t.Z*t.Z) end return rawget(V, k) end
V.__add = function(a, b) return setmetatable({X=a.X+b.X,Y=a.Y+b.Y,Z=a.Z+b.Z}, V) end
V.__sub = function(a, b) return setmetatable({X=a.X-b.X,Y=a.Y-b.Y,Z=a.Z-b.Z}, V) end
V.__unm = function(a) return setmetatable({X=-a.X,Y=-a.Y,Z=-a.Z}, V) end
V.__mul = function(a, b)
	if type(a) == "number" then return setmetatable({X=a*b.X,Y=a*b.Y,Z=a*b.Z}, V) end
	if type(b) == "number" then return setmetatable({X=a.X*b,Y=a.Y*b,Z=a.Z*b}, V) end
	return setmetatable({X=a.X*b.X,Y=a.Y*b.Y,Z=a.Z*b.Z}, V)
end
Vector3 = { new = function(x, y, z) return setmetatable({X=x or 0,Y=y or 0,Z=z or 0}, V) end }
Vector3.one = Vector3.new(1,1,1)

local C = {}
local function mk(p, r) return setmetatable({p=p, r=r}, C) end
local I3 = {1,0,0,0,1,0,0,0,1}
C.__index = function(t, k)
	if k == "Position" then return t.p end
	if k == "LookVector" then return Vector3.new(-t.r[3], -t.r[6], -t.r[9]) end
	return rawget(C, k)
end
C.__mul = function(a, b)
	if getmetatable(b) == V then
		local r = a.r
		return Vector3.new(r[1]*b.X+r[2]*b.Y+r[3]*b.Z+a.p.X, r[4]*b.X+r[5]*b.Y+r[6]*b.Z+a.p.Y, r[7]*b.X+r[8]*b.Y+r[9]*b.Z+a.p.Z)
	end
	local ar, br = a.r, b.r
	local r = {}
	for i = 0, 2 do for j = 0, 2 do
		r[i*3+j+1] = ar[i*3+1]*br[j+1] + ar[i*3+2]*br[3+j+1] + ar[i*3+3]*br[6+j+1]
	end end
	return mk(a * b.p, r)
end
C.__sub = function(a, b) return mk(a.p - b, a.r) end
C.__add = function(a, b) return mk(a.p + b, a.r) end
function C.Inverse(a)
	local r = a.r
	local t = {r[1], r[4], r[7], r[2], r[5], r[8], r[3], r[6], r[9]}
	local p = a.p
	return mk(Vector3.new(-(t[1]*p.X+t[2]*p.Y+t[3]*p.Z), -(t[4]*p.X+t[5]*p.Y+t[6]*p.Z), -(t[7]*p.X+t[8]*p.Y+t[9]*p.Z)), t)
end
CFrame = {}
function CFrame.new(x, y, z)
	if type(x) == "table" then return mk(x, I3) end
	return mk(Vector3.new(x or 0, y or 0, z or 0), I3)
end
function CFrame.Angles(rx, ry, rz)
	local cx, sx, cy, sy, cz, sz = math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz)
	-- R = Rz * Ry * Rx
	local rxm = {1,0,0, 0,cx,-sx, 0,sx,cx}
	local rym = {cy,0,sy, 0,1,0, -sy,0,cy}
	local rzm = {cz,-sz,0, sz,cz,0, 0,0,1}
	local function m(a, b) local r = {} for i=0,2 do for j=0,2 do r[i*3+j+1]=a[i*3+1]*b[j+1]+a[i*3+2]*b[3+j+1]+a[i*3+3]*b[6+j+1] end end return r end
	return mk(Vector3.new(0,0,0), m(rzm, m(rym, rxm)))
end
local Col = {}
Col.__index = function(t, k) return rawget(Col, k) end
function Col.Lerp(a, b, t) return setmetatable({R=a.R+(b.R-a.R)*t,G=a.G+(b.G-a.G)*t,B=a.B+(b.B-a.B)*t}, Col) end
Color3 = { fromRGB = function(r, g, b) return setmetatable({R=r/255,G=g/255,B=b/255}, Col) end, new = function(r,g,b) return setmetatable({R=r,G=g,B=b}, Col) end }
local E = setmetatable({}, {__index = function(t, k) local s = setmetatable({}, {__index = function(_, n) return k .. "." .. n end}) rawset(t, k, s) return s end})
Enum = E

local Inst = {}
Inst.__index = function(t, k)
	if k == "Parent" then return rawget(t, "_parent") end
	return rawget(Inst, k)
end
Inst.__newindex = function(t, k, v)
	if k == "Parent" then
		rawset(t, "_parent", v)
		if v then table.insert(v._children, t) end
	else
		rawset(t, k, v)
	end
end
function Inst.FindFirstChildOfClass(t, c) for _, ch in t._children do if ch.ClassName == c then return ch end end end
Instance = { new = function(class) return setmetatable({ClassName=class, _children={}, Name=class}, Inst) end }

-- ===== load Animals and run =====
local Animals = (function() ANIMALS_SOURCE end)()
local json = {}
local function num(x) return string.format("%.4f", x) end
for id in Animals.Species do
	local rig = Animals.build(id)
	local world = { [rig.root] = CFrame.new(0, 0, 0) }
	local parts = {}
	for _, ch in rig.model._children do if ch.ClassName ~= "Weld" then table.insert(parts, ch) end end
	local function resolve(p)
		if world[p] then return world[p] end
		local w = p:FindFirstChildOfClass("Weld")
		local base = resolve(w.Part0)
		world[p] = base * w.C0
		return world[p]
	end
	local out = {}
	for _, p in parts do
		local cf = resolve(p)
		if p ~= rig.root and (p.Transparency or 0) < 0.9 then
			local r = cf.r
			table.insert(out, string.format('{"c":"%s","s":"%s","z":[%s,%s,%s],"p":[%s,%s,%s],"r":[%s],"k":[%s,%s,%s],"t":%s}',
				p.ClassName, tostring(p.Shape), num(p.Size.X), num(p.Size.Y), num(p.Size.Z), num(cf.p.X), num(cf.p.Y), num(cf.p.Z),
				table.concat((function() local t = {} for i = 1, 9 do t[i] = num(r[i]) end return t end)(), ","),
				num(p.Color.R), num(p.Color.G), num(p.Color.B), num(p.Transparency or 0)))
		end
	end
	table.insert(json, string.format('"%s":{"ground":%s,"parts":[%s]}', id, num(rig.groundDrop or 0), table.concat(out, ",")))
end
print("{" .. table.concat(json, ",") .. "}")

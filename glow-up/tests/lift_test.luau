-- Stand-alone test for src/server/Main/Modules/Lift.luau using a fake R15 character with real joint tables.
-- usage: python3 tests/build_lift_test.py && luau /tmp/claude-0/lu/lift_test.luau
local fails, passes = 0, 0
local function check(ok, msg)
	if ok then passes += 1 print("PASS  " .. msg) else fails += 1 print("FAIL  " .. msg) end
end

-- minimal stand-ins
local clock = 0
local CF = {}
CF.__index = CF
local function cf(angle) return setmetatable({ a = angle or 0 }, CF) end
CF.__mul = function(x, y) return cf((x.a or 0) + (type(y) == "table" and y.a or 0)) end
local CFrame = { new = function() return cf(0) end, Angles = function(x) return cf(x) end }
local Vector3 = { new = function(x, y, z) return { X = x, Y = y, Z = z } end, one = setmetatable({ X = 1, Y = 1, Z = 1 }, { __mul = function() return { X = 1, Y = 1, Z = 1 } end }) }
local Color3 = { fromRGB = function() return {} end, new = function() return {} end }
local enumAny = setmetatable({}, { __index = function() return setmetatable({}, { __index = function(_, k) return k end }) end })
local Enum = enumAny
ColorSequence = { new = function(c) return c end }
NumberSequence = { new = function(c) return c end }
NumberRange = { new = function(a) return a end }
Vector2 = { new = function() return {} end }
local created = {}
local function newInstance(class)
	local inst = { ClassName = class, _children = {}, _destroyed = false }
	function inst:Destroy() self._destroyed = true; self.Parent = nil end
	function inst:Emit() self.emitted = (self.emitted or 0) + 1 end
	function inst:IsA(c) return c == class end
	table.insert(created, inst)
	return setmetatable(inst, { __newindex = function(t, k, v)
		rawset(t, k, v)
		if k == "Parent" and v and v._children then table.insert(v._children, t) end
	end })
end
local Instance = { new = newInstance }
local tasks = {}
local task = {
	spawn = function(f) local co = coroutine.create(f); local ok, e = coroutine.resume(co); if not ok then print("ERR", e) end; return co end,
	wait = function(n) table.insert(tasks, { clock + (n or 0.03), coroutine.running() }); coroutine.yield() end,
	delay = function(n, f) table.insert(tasks, { clock + n, coroutine.create(f) }) end,
}
local function advance(s)
	local target = clock + s
	while clock < target do
		clock += 0.02
		for i = #tasks, 1, -1 do
			if tasks[i][1] <= clock then local t = table.remove(tasks, i); local ok, e = coroutine.resume(t[2]); if not ok then print("ERR", e) end end
		end
	end
end

-- fake data and config
local power = 0
local ConfigStub = {
	TrainProps = { Power = {}, Style = {}, Charm = {} },
	Weights = { { Power = 0, Kg = 5, Name = "Starter", Color = {}, Scale = 0.9 }, { Power = 30, Kg = 10, Name = "Iron", Color = {}, Scale = 1.0 } },
}
function ConfigStub.WeightFor(p) local best = 1 for i, w in ConfigStub.Weights do if p >= w.Power then best = i end end return best, ConfigStub.Weights[best] end
local DataStub = { get = function() return { Power = power } end }

local function fakeChar()
	local char = { _parts = {}, _children = {} }
	local function motor(rest)
		return { C0 = cf(rest), Parent = {}, IsA = function(_, c) return c == "Motor6D" end }
	end
	local function part(name, jointName)
		local p = { Name = name, _kids = {} }
		if jointName then p._kids[jointName] = motor(0) end
		p.FindFirstChild = function(self, n) return self._kids[n] end
		char._parts[name] = p
		return p
	end
	part("RightUpperArm", "RightShoulder"); part("LeftUpperArm", "LeftShoulder")
	part("RightLowerArm", "RightElbow"); part("LeftLowerArm", "LeftElbow")
	part("RightHand"); part("LeftHand"); part("Head"); part("UpperTorso")
	char.FindFirstChild = function(self, n)
		if n == "LiftProps" then
			for _, c in self._children do if c.Name == "LiftProps" and not c._destroyed then return c end end
			return nil
		end
		return self._parts[n]
	end
	return char
end

local function loadLift()
	local src = LIFT_SOURCE
	-- strip the require lines and plug in the stubs
	src = src:gsub('local ReplicatedStorage = game:GetService%("ReplicatedStorage"%)\n', "")
	src = src:gsub('local Config = require%(.-%)\n', "local Config = CONFIG\n")
	src = src:gsub('local Data = require%(script.Parent.Data%)\n', "local Data = DATA\n")
	local fn = loadstring(src)
	assert(fn, "Lift.luau failed to compile")
	return fn
end
local fn = loadLift()
local env = setmetatable({ CONFIG = ConfigStub, DATA = DataStub, CFrame = CFrame, Vector3 = Vector3, Color3 = Color3, Enum = Enum, Instance = Instance, task = task, os = { clock = function() return clock end }, math = math, ColorSequence = ColorSequence, NumberSequence = NumberSequence, NumberRange = NumberRange, Vector2 = Vector2, warn = print, pairs = pairs, ipairs = ipairs, table = table }, { __index = _G })
setfenv(fn, env)
local Lift = fn()

local attrs = {}
local p = { SetAttribute = function(_, k, v) attrs[k] = v end, GetAttribute = function(_, k) return attrs[k] end }

-- 1. Power: dumbbells in both hands, tier follows the Power stat
local char = fakeChar()
p.Character = char
power = 0
local entry = Lift.begin(p, "Power")
check(entry ~= nil, "begin builds a lift entry")
check(Lift.holding(p), "player is holding something")
check(attrs.LiftKg == 5 and attrs.LiftTier == "Starter", "starter tier is 5 kg")
local folder = nil
for _, c in char._children do if c.Name == "LiftProps" then folder = c end end
check(folder ~= nil and #folder._children >= 10, "both hands hold a dumbbell (" .. tostring(folder and #folder._children) .. " parts)")
local welded = 0
for _, c in folder._children do if c._children and #c._children > 0 then welded += 1 end end
check(welded == #folder._children, "every prop part is welded to the hand")
for _, c in folder._children do
	if c.Massless ~= true or c.CanCollide ~= false then check(false, "prop part is massless and non-colliding") break end
end
check(true, "prop parts are massless and non-colliding")

-- 2. a rep moves the joints and returns them to rest
local right = char._parts.RightLowerArm._kids.RightElbow
local moved = false
Lift.rep(p, "perfect", 1)
for _ = 1, 20 do advance(0.04); if right.C0.a > 0.5 then moved = true end end
check(moved, "a perfect curl bends the elbow (peak seen)")
advance(1.2)
check(right.C0.a == 0, "elbow returns to rest after the rep")
Lift.rep(p, "miss", 2); advance(0.4); Lift.rep(p, "good", 3); advance(1.3)
check(right.C0.a == 0 and char._parts.RightUpperArm._kids.RightShoulder.C0.a == 0, "back-to-back reps always settle at rest")

-- 3. heavier tier after Power grows
Lift.stop(p)
power = 50
Lift.begin(p, "Power")
check(attrs.LiftKg == 10 and attrs.LiftTier == "Iron", "Power 50 holds the Iron 10 kg tier")

-- 4. stop cleans everything up, even mid-rep
Lift.rep(p, "perfect", 4); advance(0.2)
Lift.stop(p)
local folder2; for _, c in char._children do if c.Name == "LiftProps" then folder2 = c end end
check(folder2 ~= nil and folder2._destroyed == true, "stop destroys the props")
check(not Lift.holding(p) and attrs.LiftKg == nil, "stop clears the state and attributes")
check(right.C0.a == 0, "joints are back at rest after stopping mid-rep")
advance(1.5)
check(right.C0.a == 0, "no animation keeps running after stop")

-- 5. Style and Charm props, one hand only
for stat, name in { Style = "MirrorGlass", Charm = "RoseBloom" } do
	local c2 = fakeChar(); p.Character = c2
	Lift.begin(p, stat)
	local f2; for _, c in c2._children do if c.Name == "LiftProps" then f2 = c end end
	local found = false
	for _, c in f2._children do if c.Name == name then found = true end end
	check(found, stat .. " holds the " .. name)
	Lift.rep(p, "good", 1); advance(1.2)
	check(c2._parts.LeftLowerArm._kids.LeftElbow.C0.a == 0, stat .. " rep leaves the left arm alone")
	Lift.stop(p)
end

-- 5b. the equipped hammer is hidden while training and comes back afterwards
do
	local c3 = fakeChar(); p.Character = c3
	local function hammerPart(t) local a = { Transparency = t, attrs = {} } function a:IsA(c) return c == "BasePart" end function a:SetAttribute(k, v) self.attrs[k] = v end function a:GetAttribute(k) return self.attrs[k] end return a end
	local h1, h2 = hammerPart(0), hammerPart(0.25)
	c3._parts.GlowHammer = { GetDescendants = function() return { h1, h2 } end }
	Lift.begin(p, "Power")
	check(h1.Transparency == 1 and h2.Transparency == 1, "hammer is invisible while lifting")
	Lift.stop(p)
	check(h1.Transparency == 0 and h2.Transparency == 0.25, "hammer is visible again, with its old transparency")
end

-- 6. broken characters never crash
p.Character = nil
check(Lift.begin(p, "Power") == nil, "no character: begin does nothing")
p.Character = { FindFirstChild = function() return nil end, _children = {} }
local ok = pcall(function() Lift.begin(p, "Power"); Lift.rep(p, "good", 1); advance(1); Lift.stop(p) end)
check(ok, "a character with no arms or head does not error")
Lift.rep(p, "good", 1); Lift.stop(p); Lift.stop(p)
check(true, "rep and stop with nothing active are harmless")

print(string.format("LIFT TEST: %d passed, %d failed", passes, fails))
if fails > 0 then error("lift test failed") end

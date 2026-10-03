-- Stand-alone test for src/server/Main/Modules/Lift.luau: pose maths plus a fake R15 character with real joint tables.
-- usage: python3 tests/build_lift_test.py && luau /tmp/claude-0/lu/lift_test.luau
local fails, passes = 0, 0
local function check(ok, msg)
	if ok then passes += 1 print("PASS  " .. msg) else fails += 1 print("FAIL  " .. msg) end
end
local function near(a, b, eps) return math.abs(a - b) <= (eps or 1e-6) end

-- minimal stand-ins ------------------------------------------------------------
local clock = 0
local CF = {}
CF.__index = function(t, k)
	if k == "Position" then return t.pos end
	if k == "LookVector" then return { X = 0, Y = 0, Z = -1 } end
	return rawget(CF, k)
end
local function cf(angle, pos) return setmetatable({ a = angle or 0, pos = pos or { X = 0, Y = 0, Z = 0 } }, CF) end
CF.__mul = function(x, y)
	if type(y) == "table" and y.a then
		return cf((x.a or 0) + y.a, { X = x.pos.X + y.pos.X, Y = x.pos.Y + y.pos.Y, Z = x.pos.Z + y.pos.Z })
	end
	return x
end
local V3 = {}
V3.__mul = function() return setmetatable({ X = 1, Y = 1, Z = 1 }, V3) end
V3.__add = function(a, b) return setmetatable({ X = a.X + b.X, Y = a.Y + b.Y, Z = a.Z + b.Z }, V3) end
V3.__sub = function(a, b) return setmetatable({ X = a.X - b.X, Y = a.Y - b.Y, Z = a.Z - b.Z }, V3) end
V3.__index = function(t, k) if k == "Magnitude" then return math.sqrt(t.X ^ 2 + t.Y ^ 2 + t.Z ^ 2) end end
local function v3(x, y, z) return setmetatable({ X = x, Y = y, Z = z }, V3) end
local Vector3 = { new = v3, one = v3(1, 1, 1), zero = v3(0, 0, 0) }
local CFrame = {
	new = function(x, y, z) return cf(0, { X = x or 0, Y = y or 0, Z = z or 0 }) end,
	Angles = function(x) return cf(x) end,
	lookAt = function(a) return cf(0, a) end,
}
local Color3 = { fromRGB = function() return {} end, new = function() return {} end }
local Enum = setmetatable({}, { __index = function() return setmetatable({}, { __index = function(_, k) return k end }) end })
ColorSequence = { new = function(c) return c end }
NumberSequence = { new = function(c) return c end }
NumberRange = { new = function(a) return a end }
Vector2 = { new = function() return {} end }
local function newInstance(class)
	local inst = { ClassName = class, _children = {}, _destroyed = false }
	function inst:Destroy() self._destroyed = true; self.Parent = nil end
	function inst:Emit() self.emitted = (self.emitted or 0) + 1 end
	function inst:IsA(c) return c == class end
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

-- fake data, config and neighbours -------------------------------------------------
local power = 0
local ConfigStub = {
	Weights = { { Power = 0, Kg = 5, Name = "Starter", Color = {}, Scale = 0.9 }, { Power = 30, Kg = 10, Name = "Iron", Color = {}, Scale = 1.0 } },
	GymLayout = { BenchCenter = v3(-9.5, 0, -2), BenchTop = 3.125, PullupBar = v3(12.6, 8.5, 9.0), BagPos = v3(-9.5, 0, -11.5), BagPivotY = 13, SquatBar = v3(9.6, 7.1, 2.3) },
	GymFrame = function() return cf(0, v3(100, 0, 100)) end,
	MachineStandCF = function(m) return cf(0, v3(100 + m.Local.X, 0, 100 + m.Local.Z)) end,
}
function ConfigStub.WeightFor(p) local best = 1 for i, w in ConfigStub.Weights do if p >= w.Power then best = i end end return best, ConfigStub.Weights[best] end
local DataStub = { get = function() return { Power = power } end }
local movementRestored = 0
local StatsStub = { applyMovement = function() movementRestored += 1 end }
local hidden = {}
local GymStub = { setHidden = function(id, h) hidden[id] = h end, swingBag = function(s) hidden.bagSwings = (hidden.bagSwings or 0) + 1 end }
local lockedPlayers = {}
local PlayersStub = { GetPlayers = function() return lockedPlayers end }

local function loadLift()
	local src = LIFT_SOURCE
	src = src:gsub('local Players = game:GetService%("Players"%)\n', "local Players = PLAYERS\n")
	src = src:gsub('local ReplicatedStorage = game:GetService%("ReplicatedStorage"%)\n', "")
	src = src:gsub('local Config = require%(.-%)\n', "local Config = CONFIG\n")
	src = src:gsub('local Data = require%(script.Parent.Data%)\n', "local Data = DATA\n")
	src = src:gsub('local Stats = require%(script.Parent.Stats%)\n', "local Stats = STATS\n")
	src = src:gsub('local GymEquipment = require%(script.Parent.GymEquipment%)\n', "local GymEquipment = GYM\n")
	local fn = loadstring(src)
	assert(fn, "Lift.luau failed to compile")
	return fn
end
local fn = loadLift()
local env = setmetatable({ PLAYERS = PlayersStub, CONFIG = ConfigStub, DATA = DataStub, STATS = StatsStub, GYM = GymStub, CFrame = CFrame, Vector3 = Vector3, Color3 = Color3, Enum = Enum, Instance = Instance, task = task, os = { clock = function() return clock end }, math = math, ColorSequence = ColorSequence, NumberSequence = NumberSequence, NumberRange = NumberRange, Vector2 = Vector2, warn = print, pairs = pairs, ipairs = ipairs, table = table, pcall = pcall }, { __index = _G })
setfenv(fn, env)
local Lift = fn()

-- 1. pose maths ----------------------------------------------------------------------
local d = { u = 1.2, f = 1.1, thigh = 1.5, calf = 1.5 }
local b0, b1 = Lift.pose("bench", 0, d), Lift.pose("bench", 1, d)
check(near(b0.shoulder, 0.5) and b0.elbow > 1, "bench: the bar starts at the chest (elbows bent)")
check(near(b1.shoulder, math.pi / 2, 0.01) and near(b1.elbow, 0, 0.01), "bench: lockout is arms straight up")
local monotonic = true
for i = 1, 10 do
	local a, b = Lift.pose("bench", (i - 1) / 10, d), Lift.pose("bench", i / 10, d)
	if b.shoulder < a.shoulder or b.elbow > a.elbow then monotonic = false end
end
check(monotonic, "bench: pressing never goes backwards")
local s0, s1 = Lift.pose("squat", 0, d), Lift.pose("squat", 1, d)
check(near(s0.drop, 0) and near(s0.back, 0), "squat: standing tall at level 0")
check(s1.drop > 1.0 and s1.drop < 1.8, "squat: the hips drop about " .. string.format("%.2f", s1.drop) .. " studs")
check(near(d.thigh * math.cos(s1.hip) + d.calf * math.cos(s1.hip - s1.knee) + s1.drop, d.thigh + d.calf), "squat: the feet stay on the floor")
check(near(s1.hip - s1.knee + s1.ankle, 0), "squat: the feet stay flat")
check(s1.back > 0 and s1.back < 1.5, "squat: the hips move back a little (" .. string.format("%.2f", s1.back) .. ")")
local pullOk = true
for i = 0, 10 do
	local p = Lift.pose("pullup", i / 10, d)
	if not near(p.shoulder + p.elbow, math.pi, 1e-6) then pullOk = false end
end
check(pullOk, "pull-up: the forearms stay vertical on the bar")
local p0, p1 = Lift.pose("pullup", 0, d), Lift.pose("pullup", 1, d)
check(near(p0.rise, 0) and near(p0.shoulder, math.pi), "pull-up: level 0 is a dead hang")
check(p1.rise > 1.8 * d.u and p1.rise < 2.0 * d.u, "pull-up: chin over the bar lifts the body " .. string.format("%.2f", p1.rise))
local sh0, el0 = Lift.beatPose("bag", 0)
local shP, elP = Lift.beatPose("bag", 0.35)
check(near(sh0, 0.6) and near(el0, 1.9) and shP > 1.4 and elP < 0.3, "bag: guard up, then the arm snaps out and back")
local c0 = Lift.beatPose("cable", 0)
local cm = Lift.beatPose("cable", 0.5)
check(c0 > cm and near(Lift.beatPose("cable", 1), c0), "cable: reach, pull, reach again")

-- 2. a fake R15 body ------------------------------------------------------------------
local attrs = {}
local p = { SetAttribute = function(_, k, v) attrs[k] = v end, GetAttribute = function(_, k) return attrs[k] end }
local function fakeChar()
	local char = { _parts = {}, _children = {} }
	local function motor() return { C0 = cf(0), Parent = {}, IsA = function(_, c) return c == "Motor6D" end } end
	local function part(name, jointName, size)
		local pt = { Name = name, _kids = {}, Size = size or v3(1, 1.2, 1), Position = v3(0, 4, 0) }
		if jointName then pt._kids[jointName] = motor() end
		pt.FindFirstChild = function(self, n) return self._kids[n] end
		char._parts[name] = pt
		return pt
	end
	part("RightUpperArm", "RightShoulder"); part("LeftUpperArm", "LeftShoulder")
	part("RightLowerArm", "RightElbow"); part("LeftLowerArm", "LeftElbow")
	part("RightUpperLeg", "RightHip", v3(1, 1.5, 1)); part("LeftUpperLeg", "LeftHip", v3(1, 1.5, 1))
	part("RightLowerLeg", "RightKnee", v3(1, 1.5, 1)); part("LeftLowerLeg", "LeftKnee", v3(1, 1.5, 1))
	part("RightFoot", "RightAnkle"); part("LeftFoot", "LeftAnkle")
	part("RightHand").Position = v3(1.5, 3, 0); part("LeftHand").Position = v3(-1.5, 3, 0)
	part("Head"); part("UpperTorso")
	local root = { Parent = {}, Anchored = false, Position = v3(0, 3, 0), CFrame = cf(0, v3(0, 3, 0)), AssemblyLinearVelocity = v3(0, 0, 0) }
	char._parts.HumanoidRootPart = root
	char._hum = { WalkSpeed = 16, JumpHeight = 7.5 }
	char.FindFirstChildOfClass = function(self) return self._hum end
	char.FindFirstChild = function(self, n)
		if n == "LiftProps" then
			for _, c in self._children do if c.Name == "LiftProps" and not c._destroyed then return c end end
			return nil
		end
		return self._parts[n]
	end
	return char, root
end
local function joint(char, partName, jointName) return char._parts[partName]._kids[jointName] end
local function props(char) for _, c in char._children do if c.Name == "LiftProps" and not c._destroyed then return c end end end
local function rack() return { Id = "rack", Pose = "curl", Local = v3(0, 0, 10.4), Face = math.pi } end
local function machine(id, pose) return { Id = id, Pose = pose, Local = v3(1, 0, 1), Face = 0 } end

-- 3. dumbbells at the rack: both hands, tier by Power, a rep bends the elbow and returns
local char, root = fakeChar()
p.Character = char
power = 0
local entry = Lift.begin(p, rack())
check(entry ~= nil and Lift.holding(p), "begin starts a machine session")
check(attrs.LiftKg == 5 and attrs.LiftTier == "Starter" and attrs.MachineLock == "rack", "starter tier is 5 kg and the player is locked to the machine")
check(root.Anchored == true and char._hum.WalkSpeed == 0, "the player is held in place (anchored, can't walk)")
local folder = props(char)
check(folder ~= nil and #folder._children >= 10, "both hands hold a dumbbell (" .. tostring(folder and #folder._children) .. " parts)")
local welded, solid = 0, 0
for _, c in folder._children do
	if #c._children > 0 then welded += 1 end
	if c.Massless ~= true or c.CanCollide ~= false then solid += 1 end
end
check(welded == #folder._children and solid == 0, "every prop part is welded, massless and non-colliding")
local elbow = joint(char, "RightLowerArm", "RightElbow")
Lift.rep(p, "perfect", 1)
local peak = 0
for _ = 1, 30 do advance(0.04); peak = math.max(peak, elbow.C0.a) end
check(peak > 1.5, "a perfect curl bends the elbow (peak " .. string.format("%.2f", peak) .. ")")
advance(1.2)
check(near(elbow.C0.a, 0), "the elbow returns to rest after the rep")
Lift.rep(p, "miss", 2); advance(0.4); Lift.rep(p, "good", 3); advance(1.3)
check(near(elbow.C0.a, 0), "back-to-back reps always settle at rest")

-- 4. stopping frees the player, restores everything and removes the props
Lift.rep(p, "perfect", 4); advance(0.2)
Lift.stop(p)
check(not Lift.holding(p) and attrs.LiftKg == nil and attrs.MachineLock == nil, "stop clears the state and the machine lock")
check(root.Anchored == false and movementRestored >= 1, "the player can walk again after stopping")
check(near(elbow.C0.a, 0), "joints are back at rest after stopping mid-rep")
advance(1.5)
check(near(elbow.C0.a, 0), "no animation keeps running after stop")

-- 5. bench press: lie down, hold to push, let go to lower
char, root = fakeChar(); p.Character = char
Lift.begin(p, machine("bench", "bench"))
check(hidden.bench == true, "the static barbell hides while you use it")
check(props(char) ~= nil and #props(char)._children >= 9, "a full barbell with plates is in your hands")
local shoulder = joint(char, "RightUpperArm", "RightShoulder")
advance(0.2)
check(near(shoulder.C0.a, 0.5, 0.05), "at rest on the bench the bar is at the chest")
Lift.holdStart(p, 1.0); advance(1.1)
check(near(shoulder.C0.a, math.pi / 2, 0.05), "holding for the full time reaches lockout")
Lift.holdRelease(p, "good"); advance(1.0)
check(near(shoulder.C0.a, 0.5, 0.05), "letting go lowers the bar back to the chest")
Lift.holdStart(p, 1.0); advance(0.5); Lift.holdRelease(p, "miss"); advance(0.5)
check(near(shoulder.C0.a, 0.5, 0.05), "a missed rep drops the bar quickly")
Lift.stop(p)
check(hidden.bench == false and root.Anchored == false, "stopping shows the static barbell again and frees you")

-- 6. squat: the body goes down and back up
char, root = fakeChar(); p.Character = char
Lift.begin(p, machine("squat", "squat"))
advance(0.2)
local startY = root.CFrame.pos.Y
Lift.holdStart(p, 1.0); advance(1.05)
check(root.CFrame.pos.Y < startY - 1.0, "squatting lowers the hips (" .. string.format("%.2f", startY - root.CFrame.pos.Y) .. " studs)")
local hip = joint(char, "RightUpperLeg", "RightHip")
local knee = joint(char, "RightLowerLeg", "RightKnee")
check(hip.C0.a > 1.2 and knee.C0.a < -1.5, "the thighs go forward and the shins fold back")
Lift.holdRelease(p, "perfect"); advance(1.0)
check(near(root.CFrame.pos.Y, startY, 0.02), "standing back up returns to full height")
Lift.stop(p)

-- 7. pull-up: tapping lifts the body, stopping lets it sink
char, root = fakeChar(); p.Character = char
Lift.begin(p, machine("pullup", "pullup"))
advance(0.2)
local hangY = root.CFrame.pos.Y
for _ = 1, 20 do Lift.mash(p, 1); advance(0.1) end
check(root.CFrame.pos.Y > hangY + 1.5, "tapping pulls the body up (" .. string.format("%.2f", root.CFrame.pos.Y - hangY) .. " studs)")
Lift.relax(p); advance(3)
check(root.CFrame.pos.Y < hangY + 0.3, "stopping lets the body sink back down")
Lift.stop(p)

-- 8. rhythm machines: each beat moves one arm; punches swing the bag
char, root = fakeChar(); p.Character = char
Lift.begin(p, machine("bag", "bag"))
advance(0.2)
local rightShoulder = joint(char, "RightUpperArm", "RightShoulder")
local leftShoulder = joint(char, "LeftUpperArm", "LeftShoulder")
check(near(rightShoulder.C0.a, 0.6, 0.05) and near(leftShoulder.C0.a, 0.6, 0.05), "boxing guard: both fists up")
Lift.beat(p, "R", "perfect")
local punch = 0
for _ = 1, 10 do advance(0.04); punch = math.max(punch, rightShoulder.C0.a) end
check(punch > 1.3 and near(leftShoulder.C0.a, 0.6, 0.05), "a right punch moves only the right arm (peak " .. string.format("%.2f", punch) .. ")")
check((hidden.bagSwings or 0) >= 1, "the punching bag swings when hit")
advance(0.6)
check(near(rightShoulder.C0.a, 0.6, 0.05), "the arm returns to guard")
Lift.stop(p)

-- 9. the safety net frees anyone left locked
char, root = fakeChar(); p.Character = char
root.Anchored = true
attrs.MachineLock = "bench"
p.GetAttribute = function(_, k) return attrs[k] end
p.Character = char
lockedPlayers = { p }
Lift.sweep()
check(root.Anchored == false and attrs.MachineLock == nil, "sweep frees a player who is locked but not training")
lockedPlayers = {}

-- 10. Studio / Lounge items and the hammer
for _, case in { { "hair", "MirrorGlass" }, { "toast", "RoseBloom" } } do
	local c2, r2 = fakeChar(); p.Character = c2
	local m = { Id = case[1], Pose = case[1] }
	local function hammerPart(t) local a = { Transparency = t, attrs = {} } function a:IsA(c) return c == "BasePart" end function a:SetAttribute(k, v) self.attrs[k] = v end function a:GetAttribute(k) return self.attrs[k] end return a end
	local h1 = hammerPart(0.25)
	c2._parts.GlowHammer = { GetDescendants = function() return { h1 } end }
	Lift.begin(p, m)
	local f2 = props(c2)
	local found = false
	for _, c in f2._children do if c.Name == case[2] then found = true end end
	check(found and r2.Anchored == false, case[1] .. " holds the " .. case[2] .. " and does not freeze you")
	check(h1.Transparency == 1, "the hammer is hidden while you train")
	Lift.rep(p, "good", 1); advance(1.2)
	check(near(c2._parts.LeftLowerArm._kids.LeftElbow.C0.a, 0), case[1] .. " rep leaves the left arm alone")
	Lift.stop(p)
	check(h1.Transparency == 0.25, "the hammer comes back with its old transparency")
end

-- 11. broken characters never crash
p.Character = nil
check(Lift.begin(p, rack()) == nil, "no character: begin does nothing")
p.Character = { FindFirstChild = function() return nil end, _children = {}, FindFirstChildOfClass = function() return nil end }
local ok, err = pcall(function() Lift.begin(p, rack()); Lift.rep(p, "good", 1); advance(1); Lift.stop(p) end)
check(ok, "a character with no arms or head does not error " .. tostring(err))
Lift.rep(p, "good", 1); Lift.holdStart(p, 1); Lift.holdRelease(p, "good"); Lift.beat(p, "L", "good"); Lift.mash(p, 1); Lift.relax(p); Lift.stop(p); Lift.stop(p)
check(true, "every call with nothing active is harmless")

print(string.format("LIFT TEST: %d passed, %d failed", passes, fails))
if fails > 0 then error("lift test failed") end

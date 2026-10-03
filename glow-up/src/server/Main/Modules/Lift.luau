-- SUB 5 TO TRUE ADAM: makes training look like training. At every gym machine your character really does the exercise:
-- curls with dumbbells at the rack, lies down and presses a barbell on the bench, front-squats under the bar, pulls
-- cables, throws punches at the swinging bag and hangs from the pull-up bar. The body is posed by turning the arm and
-- leg joints, so every player in the server sees it. Studio and Lounge give you a hand mirror and a rose.
-- Joint maths: turning a joint's C0 about X by +angle swings a hanging limb FORWARD, so arm angle 0 = hanging down,
-- pi/2 = pointing forward, pi = straight up.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)
local GymEquipment = require(script.Parent.GymEquipment)

local Lift = {}

local FOLDER = "LiftProps"
local active = {} -- player -> entry

-- Simple repetition motions (angles at the peak of the rep, 0 = arms hanging down).
local MOTIONS = {
	curl = { time = 0.85, shoulder = 0.12, elbow = 2.05 },
	press = { time = 1.0, shoulder = 2.75, elbow = 0.45 },
	raise = { time = 0.9, shoulder = 1.6, elbow = 0.08 },
	hair = { time = 0.9, shoulder = 2.2, elbow = 2.0, rightOnly = true },
	toast = { time = 0.9, shoulder = 1.15, elbow = 1.7, rightOnly = true },
}
local PLAN = {
	curl = { "curl", "press", "raise", "curl", "press" },
	hair = { "hair" },
	toast = { "toast" },
}
local AMPLITUDE = { perfect = 1, good = 0.85, miss = 0.35 }

local function clamp(x, a, b)
	return math.max(a, math.min(b, x))
end

--------------------------------------------------------------------------------
-- Pose maths (pure functions, tested offline)
--------------------------------------------------------------------------------
-- d = { u = upper arm length, f = forearm length, thigh, calf }; level 0..1 is how far into the movement you are.
function Lift.pose(kind, level, d)
	level = clamp(level or 0, 0, 1)
	if kind == "bench" then
		-- lying down: the bar starts at the chest (level 0) and reaches full lockout overhead (level 1)
		return { shoulder = 0.5 + 1.07 * level, elbow = 1.07 * (1 - level) }
	elseif kind == "squat" then
		-- front squat: bar across the shoulders, hips back and down, feet stay planted
		local hip, knee = 1.35 * level, 1.85 * level
		local drop = (d.thigh + d.calf) - (d.thigh * math.cos(hip) + d.calf * math.cos(hip - knee))
		local back = d.thigh * math.sin(hip) + d.calf * math.sin(hip - knee)
		return { shoulder = 1.0, elbow = 2.1, hip = hip, knee = knee, ankle = knee - hip, drop = drop, back = back }
	elseif kind == "pullup" then
		-- level 0 = dead hang, level 1 = chin over the bar; the forearms stay vertical on the bar
		local psi = math.pi - 2.64 * level
		return { shoulder = psi, elbow = math.pi - psi, hip = 0, knee = 0.6, ankle = 0.6, rise = d.u * (1 + math.cos(psi)) }
	elseif kind == "cable" then
		return { shoulder = 1.2, elbow = 0.25 }
	elseif kind == "bag" then
		return { shoulder = 0.6, elbow = 1.9 }
	end
	return { shoulder = 0, elbow = 0 }
end

-- One arm's angles during a cable pull or a punch; a runs from 0 to 1.
function Lift.beatPose(kind, a)
	if kind == "bag" then
		local k = a < 0.35 and a / 0.35 or (1 - a) / 0.65
		return 0.6 + 0.9 * k, 1.9 - 1.75 * k
	end
	local k = 1 - math.abs(2 * a - 1)
	return 1.2 - 1.05 * k, 0.25 + 1.1 * k
end

--------------------------------------------------------------------------------
-- Finding the body parts
--------------------------------------------------------------------------------
local function motor(char, partName, jointName)
	local part = char:FindFirstChild(partName)
	local joint = part and part:FindFirstChild(jointName)
	if joint and joint:IsA("Motor6D") then
		return joint
	end
	return nil
end

local function findJoints(char)
	local joints = {}
	for _, side in { "Right", "Left" } do
		local j = {
			shoulder = motor(char, side .. "UpperArm", side .. "Shoulder") or motor(char, "Torso", side .. " Shoulder"),
			elbow = motor(char, side .. "LowerArm", side .. "Elbow"),
			hip = motor(char, side .. "UpperLeg", side .. "Hip"),
			knee = motor(char, side .. "LowerLeg", side .. "Knee"),
			ankle = motor(char, side .. "Foot", side .. "Ankle"),
		}
		for _, name in { "shoulder", "elbow", "hip", "knee", "ankle" } do
			j[name .. "Rest"] = j[name] and j[name].C0
		end
		joints[side] = j
	end
	return joints
end

local function sizeY(char, name, fallback)
	local part = char:FindFirstChild(name)
	local size = part and part.Size
	return size and size.Y or fallback
end

local function measure(char)
	return {
		u = sizeY(char, "RightUpperArm", 1.2),
		f = sizeY(char, "RightLowerArm", 1.1),
		thigh = sizeY(char, "RightUpperLeg", 1.5),
		calf = sizeY(char, "RightLowerLeg", 1.5),
	}
end

local function hand(char, side)
	local h = char:FindFirstChild(side .. "Hand")
	if h then
		return h, CFrame.new(0, -0.05, 0)
	end
	local arm = char:FindFirstChild(side .. " Arm")
	if arm then
		return arm, CFrame.new(0, -0.95, 0)
	end
	return nil, nil
end

--------------------------------------------------------------------------------
-- Props held in the hands
--------------------------------------------------------------------------------
local CYL = Enum.PartType.Cylinder
local BALL = Enum.PartType.Ball
local STEEL = Color3.fromRGB(205, 210, 220)

local function piece(folder, hostPart, base, name, size, offset, color, material, shape, extra)
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.Color = color
	p.Material = material or Enum.Material.Metal
	if shape then
		p.Shape = shape
	end
	p.Anchored = false
	p.CanCollide = false
	p.CanQuery = false
	p.CanTouch = false
	p.Massless = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	if extra then
		for k, v in extra do
			p[k] = v
		end
	end
	p.Parent = folder
	local weld = Instance.new("Weld")
	weld.Part0 = hostPart
	weld.Part1 = p
	weld.C0 = base * offset
	weld.Parent = p
	return p
end

local function buildDumbbell(folder, host, base, tier)
	local d = 0.95 * tier.Scale
	local material = tier.Neon and Enum.Material.Neon or Enum.Material.Metal
	piece(folder, host, base, "Handle", Vector3.new(1.35, 0.2, 0.2), CFrame.new(), STEEL, Enum.Material.Metal, CYL)
	for _, side in { -1, 1 } do
		piece(folder, host, base, "Plate", Vector3.new(0.42, d, d), CFrame.new(side * 0.62, 0, 0), tier.Color, material, CYL)
		piece(folder, host, base, "Cap", Vector3.new(0.18, d * 0.55, d * 0.55), CFrame.new(side * 0.88, 0, 0), STEEL, Enum.Material.Metal, CYL)
	end
end

-- A full barbell held by both hands; it hangs off the right hand, shifted to the middle between the hands.
local function buildBarbell(folder, host, base, tier, half)
	local material = tier.Neon and Enum.Material.Neon or Enum.Material.Metal
	local middle = base * CFrame.new(-half, 0, 0)
	piece(folder, host, middle, "Bar", Vector3.new(7.2, 0.24, 0.24), CFrame.new(), STEEL, Enum.Material.Metal, CYL)
	for _, side in { -1, 1 } do
		local x = 2.7
		for i, d in { 3.0, 2.6, 2.1 } do
			local colour = i == 1 and tier.Color or Color3.fromRGB(30, 30, 36)
			piece(folder, host, middle, "Plate", Vector3.new(0.42, d, d), CFrame.new(side * x, 0, 0), colour, i == 1 and material or Enum.Material.Metal, CYL)
			x += 0.5
		end
		piece(folder, host, middle, "Collar", Vector3.new(0.22, 0.6, 0.6), CFrame.new(side * (x + 0.05), 0, 0), STEEL, Enum.Material.Metal, CYL)
	end
end

local function buildHandle(folder, host, base)
	piece(folder, host, base, "CableHandle", Vector3.new(1.2, 0.2, 0.2), CFrame.new(), STEEL, Enum.Material.Metal, CYL)
	piece(folder, host, base, "CableGrip", Vector3.new(0.6, 0.3, 0.3), CFrame.new(), Color3.fromRGB(210, 55, 50), Enum.Material.Fabric, CYL)
end

local function buildGlove(folder, host, base)
	piece(folder, host, base, "Glove", Vector3.one * 1.15, CFrame.new(0, -0.15, -0.1), Color3.fromRGB(215, 40, 50), Enum.Material.Leather, BALL)
	piece(folder, host, base, "GloveCuff", Vector3.new(1.0, 0.3, 1.0), CFrame.new(0, 0.45, 0), Color3.fromRGB(245, 245, 250), Enum.Material.Fabric)
end

local function buildMirror(folder, host, base)
	local gold = Color3.fromRGB(255, 205, 80)
	piece(folder, host, base, "MirrorHandle", Vector3.new(1.1, 0.18, 0.18), CFrame.new(0, 0.45, 0) * CFrame.Angles(0, 0, math.pi / 2), gold, Enum.Material.Metal, CYL)
	piece(folder, host, base, "MirrorRim", Vector3.new(0.14, 1.5, 1.5), CFrame.new(0, 1.05, 0) * CFrame.Angles(0, math.pi / 2, 0), gold, Enum.Material.Metal, CYL)
	piece(folder, host, base, "MirrorGlass", Vector3.new(0.18, 1.25, 1.25), CFrame.new(0, 1.05, -0.03) * CFrame.Angles(0, math.pi / 2, 0), Color3.fromRGB(190, 230, 255), Enum.Material.Glass, CYL, { Reflectance = 0.5, Transparency = 0.1 })
end

local function buildRose(folder, host, base)
	local green = Color3.fromRGB(60, 150, 70)
	piece(folder, host, base, "RoseStem", Vector3.new(1.5, 0.12, 0.12), CFrame.new(0, 0.55, 0) * CFrame.Angles(0, 0, math.pi / 2), green, Enum.Material.SmoothPlastic, CYL)
	piece(folder, host, base, "RoseBloom", Vector3.one * 0.55, CFrame.new(0, 1.35, 0), Color3.fromRGB(225, 40, 70), Enum.Material.SmoothPlastic, BALL)
	piece(folder, host, base, "RoseHeart", Vector3.one * 0.32, CFrame.new(0, 1.5, 0), Color3.fromRGB(255, 110, 140), Enum.Material.SmoothPlastic, BALL)
	for _, side in { -1, 1 } do
		piece(folder, host, base, "RoseLeaf", Vector3.new(0.4, 0.06, 0.2), CFrame.new(side * 0.22, 0.75, 0) * CFrame.Angles(0, 0, side * 0.5), green, Enum.Material.SmoothPlastic)
	end
end

local function emitter(parent, name, color, speed, size, lifetime, accel)
	local e = Instance.new("ParticleEmitter")
	e.Name = name
	e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
	e.Color = ColorSequence.new(color)
	e.Size = NumberSequence.new(size)
	e.Lifetime = NumberRange.new(lifetime * 0.7, lifetime)
	e.Speed = NumberRange.new(speed * 0.6, speed)
	e.SpreadAngle = Vector2.new(60, 60)
	e.Acceleration = accel
	e.LightEmission = 0.4
	e.Rate = 0
	e.Parent = parent
	return e
end

-- The equipped hammer would clip through the props, so it turns invisible while you train.
local function setHammerHidden(char, hidden)
	local model = char and char:FindFirstChild("GlowHammer")
	if not model then
		return
	end
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then
			if hidden then
				if d:GetAttribute("LiftOrigT") == nil then
					d:SetAttribute("LiftOrigT", d.Transparency)
				end
				d.Transparency = 1
			else
				local original = d:GetAttribute("LiftOrigT")
				if original ~= nil then
					d.Transparency = original
					d:SetAttribute("LiftOrigT", nil)
				end
			end
		end
	end
end

--------------------------------------------------------------------------------
-- Moving the body
--------------------------------------------------------------------------------
local function setJoint(joint, rest, angle)
	if joint and joint.Parent and rest then
		joint.C0 = rest * CFrame.Angles(angle, 0, 0)
	end
end

local function restore(entry)
	for _, j in entry.joints do
		for _, name in { "shoulder", "elbow", "hip", "knee", "ankle" } do
			local joint = j[name]
			if joint and joint.Parent and j[name .. "Rest"] then
				joint.C0 = j[name .. "Rest"]
			end
		end
	end
end

local function sideName(side)
	return (side == "L" or side == "Left") and "Left" or "Right"
end

-- Works out and applies the whole body pose for this instant.
local function step(entry, now)
	local dt = math.min(0.2, now - (entry.last or now))
	entry.last = now
	local level = entry.level
	if entry.hold then
		level = clamp((now - entry.hold.t0) / entry.hold.fill, 0, 1)
	elseif entry.release then
		local a = (now - entry.release.t0) / entry.release.dur
		if a >= 1 then
			entry.release = nil
			level = 0
		else
			level = entry.release.from * (1 - a * a * (3 - 2 * a))
		end
	elseif entry.mashing then
		entry.target = math.max(0, entry.target - 0.45 * dt)
		level = level + (entry.target - level) * math.min(1, 10 * dt)
	end
	entry.level = level

	local pose = Lift.pose(entry.kind, level, entry.dims)
	local rep = entry.rep
	local k = 0
	if rep then
		local a = (now - rep.t0) / rep.motion.time
		if a >= 1 then
			entry.rep = nil
			rep = nil
		else
			k = math.sin(a * math.pi) * rep.amp
			if rep.grade == "miss" then
				k *= 1 + math.sin(a * 40) * 0.08 -- a shaky failed rep
			end
		end
	end
	for side, j in entry.joints do
		local sh, el = pose.shoulder or 0, pose.elbow or 0
		local beat = entry.beats[side]
		if beat then
			local a = (now - beat.t0) / beat.dur
			if a >= 1 then
				entry.beats[side] = nil
			else
				sh, el = Lift.beatPose(entry.kind, a)
			end
		end
		if rep and not (rep.motion.rightOnly and side == "Left") then
			sh += rep.motion.shoulder * k
			el += rep.motion.elbow * k
		end
		setJoint(j.shoulder, j.shoulderRest, sh)
		setJoint(j.elbow, j.elbowRest, el)
		if pose.hip then
			setJoint(j.hip, j.hipRest, pose.hip)
			setJoint(j.knee, j.kneeRest, -(pose.knee or 0))
			setJoint(j.ankle, j.ankleRest, pose.ankle or 0)
		end
	end
	local drop, rise, back = pose.drop or 0, pose.rise or 0, pose.back or 0
	if entry.root and entry.root.Parent and entry.baseCF and (drop ~= 0 or rise ~= 0 or back ~= 0 or entry.moved) then
		local key = drop - rise + back * 7
		if entry.lastKey == nil or math.abs(key - entry.lastKey) > 0.004 then
			entry.lastKey = key
			entry.moved = true
			entry.root.CFrame = entry.baseCF * CFrame.new(0, rise - drop, back)
		end
	end
end

local function startLoop(p, entry)
	task.spawn(function()
		while entry.alive and active[p] == entry do
			step(entry, os.clock())
			task.wait(1 / 30)
		end
	end)
end

--------------------------------------------------------------------------------
-- Placing the player at the machine
--------------------------------------------------------------------------------
local function faceCF(position, look)
	return CFrame.lookAt(position, position + Vector3.new(look.X, 0, look.Z))
end

local function placeAt(entry, machine, root, char)
	local frame = Config.GymFrame()
	local rootY = root.Position.Y
	local standCF = Config.MachineStandCF(machine)
	entry.exitCF = faceCF(Vector3.new(standCF.Position.X, rootY, standCF.Position.Z), standCF.LookVector)
	if machine.Pose == "bench" then
		local layout = Config.GymLayout
		local torso = char:FindFirstChild("UpperTorso") or char:FindFirstChild("Torso")
		local thickness = torso and torso.Size.Z / 2 or 0.5
		entry.baseCF = frame * CFrame.new(layout.BenchCenter.X, layout.BenchTop + thickness + 0.1, layout.BenchCenter.Z + 1.0) * CFrame.Angles(math.rad(90), 0, 0)
	elseif machine.Pose == "pullup" then
		local layout = Config.GymLayout
		local shoulder = char:FindFirstChild("RightUpperArm")
		local shoulderRel = shoulder and (shoulder.Position.Y + shoulder.Size.Y / 2 - rootY) or 1.3
		local above = shoulderRel + entry.dims.u + entry.dims.f
		entry.baseCF = frame * CFrame.new(layout.PullupBar.X, layout.PullupBar.Y - above, layout.PullupBar.Z)
	else
		entry.baseCF = entry.exitCF
	end
	root.AssemblyLinearVelocity = Vector3.zero
	root.Anchored = true
	root.CFrame = entry.baseCF
end

local function unlock(p, root)
	if root and root.Parent then
		root.Anchored = false
	end
	p:SetAttribute("MachineLock", nil)
	pcall(Stats.applyMovement, p)
end

--------------------------------------------------------------------------------
-- Public API
--------------------------------------------------------------------------------
-- Starts a machine session. `machine` is an entry of Config.GymMachines or Config.StatMachines.
function Lift.begin(p, machine)
	Lift.stop(p)
	local char = p.Character
	local profile = Data.get(p)
	if not char or not profile or not machine then
		return nil
	end
	local index, tier = Config.WeightFor(profile.Power)
	local folder = Instance.new("Folder")
	folder.Name = FOLDER
	folder.Parent = char
	local entry = {
		char = char,
		folder = folder,
		joints = findJoints(char),
		dims = measure(char),
		machine = machine,
		kind = machine.Pose,
		level = 0,
		target = 0,
		beats = {},
		alive = true,
		root = char:FindFirstChild("HumanoidRootPart"),
	}
	active[p] = entry
	setHammerHidden(char, true)

	-- props
	local pose = machine.Pose
	local rightHand, rightBase = hand(char, "Right")
	local leftHand, leftBase = hand(char, "Left")
	local half = 1.4
	if rightHand and leftHand then
		half = math.max(0.8, (rightHand.Position - leftHand.Position).Magnitude / 2)
	end
	if pose == "bench" or pose == "squat" then
		if rightHand then
			buildBarbell(folder, rightHand, rightBase, tier, half)
		end
		GymEquipment.setHidden(pose, true)
		entry.hidden = pose
	else
		for _, side in { { "Right", rightHand, rightBase }, { "Left", leftHand, leftBase } } do
			local name, host, base = side[1], side[2], side[3]
			if host then
				if pose == "curl" then
					buildDumbbell(folder, host, base, tier)
				elseif pose == "cable" then
					buildHandle(folder, host, base)
				elseif pose == "bag" then
					buildGlove(folder, host, base)
				elseif pose == "hair" and name == "Right" then
					buildMirror(folder, host, base)
				elseif pose == "toast" and name == "Right" then
					buildRose(folder, host, base)
				end
			end
		end
	end

	local head = char:FindFirstChild("Head")
	local torso = char:FindFirstChild("UpperTorso") or char:FindFirstChild("Torso")
	if head then
		entry.sweat = emitter(head, "Sweat", Color3.fromRGB(190, 225, 255), 9, 0.22, 0.7, Vector3.new(0, -40, 0))
	end
	if torso then
		entry.sparks = emitter(torso, "RepSparks", Color3.fromRGB(255, 220, 90), 14, 0.5, 0.8, Vector3.new(0, -6, 0))
	end

	-- gym machines hold you in place; the other buildings let you stand where you are
	if machine.Local and entry.root then
		local hum = char:FindFirstChildOfClass("Humanoid")
		if hum then
			hum.WalkSpeed = 0
			hum.JumpHeight = 0
		end
		p:SetAttribute("MachineLock", machine.Id)
		placeAt(entry, machine, entry.root, char)
	end

	p:SetAttribute("LiftKg", tier.Kg)
	p:SetAttribute("LiftTier", tier.Name)
	p:SetAttribute("LiftIndex", index)
	startLoop(p, entry)
	return entry
end

-- One visible rep for the simple machines (curls, mirror, rose). grade: "perfect" | "good" | "miss".
function Lift.rep(p, grade, repIndex)
	local entry = active[p]
	if not entry or not entry.alive then
		return
	end
	local plan = PLAN[entry.kind]
	if plan then
		local motion = MOTIONS[plan[(math.max(repIndex or 1, 1) - 1) % #plan + 1]]
		entry.rep = { t0 = os.clock(), motion = motion, amp = AMPLITUDE[grade] or 0.6, grade = grade }
	end
	if entry.sweat then
		entry.sweat:Emit(grade == "miss" and 2 or 5)
	end
	if grade == "perfect" and entry.sparks then
		entry.sparks:Emit(16)
	end
end

-- Hold machines: the bar / body moves with how long you hold, then returns when you let go.
function Lift.holdStart(p, fillTime)
	local entry = active[p]
	if entry and entry.alive then
		entry.release = nil
		entry.hold = { t0 = os.clock(), fill = math.max(0.3, fillTime or 1) }
	end
end

function Lift.holdRelease(p, grade)
	local entry = active[p]
	if not entry or not entry.alive then
		return
	end
	local from = entry.level
	if entry.hold then
		from = clamp((os.clock() - entry.hold.t0) / entry.hold.fill, 0, 1)
	end
	entry.hold = nil
	entry.release = { from = from, t0 = os.clock(), dur = grade == "miss" and 0.3 or 0.8 }
	if entry.sweat then
		entry.sweat:Emit(grade == "miss" and 2 or 5)
	end
	if grade == "perfect" and entry.sparks then
		entry.sparks:Emit(16)
	end
end

-- Rhythm machines: one arm pulls / punches. side is "L" or "R"; accuracy "perfect" | "good".
function Lift.beat(p, side, accuracy)
	local entry = active[p]
	if not entry or not entry.alive then
		return
	end
	entry.beats[sideName(side)] = { t0 = os.clock(), dur = entry.kind == "bag" and 0.32 or 0.55 }
	if entry.kind == "bag" then
		GymEquipment.swingBag(accuracy == "perfect" and 1.3 or 0.8)
	end
	if entry.sweat then
		entry.sweat:Emit(1)
	end
	if accuracy == "perfect" and entry.sparks then
		entry.sparks:Emit(6)
	end
end

-- Tap machines: progress 0..1 pulls the body up; it sinks back if you stop.
function Lift.mash(p, progress)
	local entry = active[p]
	if entry and entry.alive then
		entry.mashing = true
		entry.target = clamp(progress, 0, 1)
	end
end

-- The mash round is over: drop back down.
function Lift.relax(p)
	local entry = active[p]
	if entry and entry.alive then
		entry.target = 0
	end
end

function Lift.stop(p)
	local entry = active[p]
	if not entry then
		return
	end
	active[p] = nil
	entry.alive = false
	restore(entry)
	if p:GetAttribute("MachineLock") then
		if entry.exitCF and entry.root and entry.root.Parent then
			entry.root.CFrame = entry.exitCF
		end
		unlock(p, entry.root)
	end
	setHammerHidden(entry.char, false)
	if entry.hidden then
		GymEquipment.setHidden(entry.hidden, false)
	end
	if entry.folder then
		entry.folder:Destroy()
	end
	for _, name in { "sweat", "sparks" } do
		if entry[name] then
			entry[name]:Destroy()
		end
	end
	p:SetAttribute("LiftKg", nil)
	p:SetAttribute("LiftTier", nil)
	p:SetAttribute("LiftIndex", nil)
end

function Lift.holding(p)
	return active[p] ~= nil
end

-- Safety net: nobody can stay frozen at a machine they are no longer using.
function Lift.sweep()
	for _, p in Players:GetPlayers() do
		if p:GetAttribute("MachineLock") and not active[p] then
			local char = p.Character
			unlock(p, char and char:FindFirstChild("HumanoidRootPart"))
		end
	end
end

return Lift

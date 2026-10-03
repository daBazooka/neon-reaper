-- SUB 5 TO TRUE ADAM: makes training look like training. While you train, your character really holds the thing
-- (dumbbells in the gym, a hand mirror in the studio, a rose in the lounge) and performs a visible rep after every
-- press: curls, overhead presses and front raises. The dumbbells get bigger and change colour as your Power grows.
-- Everything is built from simple parts welded to the hands, so every player in the server sees it.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)

local Lift = {}

local FOLDER = "LiftProps"
local active = {} -- player -> entry

-- Peak joint angles (radians) for each kind of rep; 0 = arms hanging down.
local MOTIONS = {
	curl = { time = 0.85, shoulder = 0.12, elbow = 2.05 },
	press = { time = 1.0, shoulder = 2.75, elbow = 0.45 },
	raise = { time = 0.9, shoulder = 1.6, elbow = 0.08 },
	hair = { time = 0.9, shoulder = 2.2, elbow = 2.0, rightOnly = true },
	toast = { time = 0.9, shoulder = 1.15, elbow = 1.7, rightOnly = true },
}
local PLAN = {
	Power = { "curl", "press", "raise", "curl", "press" },
	Style = { "hair" },
	Charm = { "toast" },
}
local AMPLITUDE = { perfect = 1, good = 0.85, miss = 0.35 }

local function motor(char, partName, jointName)
	local part = char:FindFirstChild(partName)
	local joint = part and part:FindFirstChild(jointName)
	if joint and joint:IsA("Motor6D") then
		return joint
	end
	return nil
end

-- Finds the arm joints for an R15 or R6 body.
local function findJoints(char)
	local joints = {}
	for _, side in { "Right", "Left" } do
		local shoulder = motor(char, side .. "UpperArm", side .. "Shoulder") or motor(char, "Torso", side .. " Shoulder")
		local elbow = motor(char, side .. "LowerArm", side .. "Elbow")
		joints[side] = { shoulder = shoulder, elbow = elbow, shoulderRest = shoulder and shoulder.C0, elbowRest = elbow and elbow.C0 }
	end
	return joints
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

local CYL = Enum.PartType.Cylinder
local BALL = Enum.PartType.Ball

local function buildDumbbell(folder, host, base, tier)
	local d = 0.95 * tier.Scale -- head diameter
	local steel = Color3.fromRGB(205, 210, 220)
	local material = tier.Neon and Enum.Material.Neon or Enum.Material.Metal
	-- the handle runs left-right through the fist; a cylinder's long axis is its X axis
	piece(folder, host, base, "Handle", Vector3.new(1.35, 0.2, 0.2), CFrame.new(), steel, Enum.Material.Metal, CYL)
	for _, side in { -1, 1 } do
		piece(folder, host, base, "Plate", Vector3.new(0.42, d, d), CFrame.new(side * 0.62, 0, 0), tier.Color, material, CYL)
		piece(folder, host, base, "Cap", Vector3.new(0.18, d * 0.55, d * 0.55), CFrame.new(side * 0.88, 0, 0), steel, Enum.Material.Metal, CYL)
	end
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

-- The equipped hammer would clip through the dumbbells, so it turns invisible while you train.
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

local function restore(entry)
	for _, j in entry.joints do
		if j.shoulder and j.shoulder.Parent then
			j.shoulder.C0 = j.shoulderRest
		end
		if j.elbow and j.elbow.Parent then
			j.elbow.C0 = j.elbowRest
		end
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

-- Picks up the training prop for `stat` (also sets the attributes the training window shows).
function Lift.begin(p, stat)
	Lift.stop(p)
	local char = p.Character
	local profile = Data.get(p)
	if not char or not profile or not Config.TrainProps[stat] then
		return nil
	end
	local index, tier = Config.WeightFor(profile.Power)
	local folder = Instance.new("Folder")
	folder.Name = FOLDER
	folder.Parent = char
	local entry = { char = char, folder = folder, joints = findJoints(char), token = 0, count = 0, stat = stat, alive = true }
	active[p] = entry
	setHammerHidden(char, true)

	for _, side in { "Right", "Left" } do
		if stat == "Power" or side == "Right" then
			local host, base = hand(char, side)
			if host then
				if stat == "Power" then
					buildDumbbell(folder, host, base, tier)
				elseif stat == "Style" then
					buildMirror(folder, host, base)
				else
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
	p:SetAttribute("LiftKg", tier.Kg)
	p:SetAttribute("LiftTier", tier.Name)
	p:SetAttribute("LiftIndex", index)
	return entry
end

-- One visible rep. `grade` is "perfect", "good" or "miss" (a miss is a weak, wobbly rep).
function Lift.rep(p, grade, repIndex)
	local entry = active[p]
	if not entry or not entry.alive then
		return
	end
	local plan = PLAN[entry.stat] or PLAN.Power
	local motion = MOTIONS[plan[(math.max(repIndex or 1, 1) - 1) % #plan + 1]]
	local amp = AMPLITUDE[grade] or 0.6
	entry.token += 1
	local token = entry.token
	if entry.sweat then
		entry.sweat:Emit(grade == "miss" and 2 or 5)
	end
	if grade == "perfect" and entry.sparks then
		entry.sparks:Emit(16)
	end
	task.spawn(function()
		local t0 = os.clock()
		while entry.alive and entry.token == token do
			local a = (os.clock() - t0) / motion.time
			if a >= 1 then
				break
			end
			local k = math.sin(a * math.pi) * amp
			if grade == "miss" then
				k *= 1 + math.sin(a * 40) * 0.08 -- a shaky failed rep
			end
			for side, j in entry.joints do
				if not (motion.rightOnly and side == "Left") then
					if j.shoulder and j.shoulder.Parent then
						j.shoulder.C0 = j.shoulderRest * CFrame.Angles(motion.shoulder * k, 0, 0)
					end
					if j.elbow and j.elbow.Parent then
						j.elbow.C0 = j.elbowRest * CFrame.Angles(motion.elbow * k, 0, 0)
					end
				end
			end
			task.wait(1 / 30)
		end
		if entry.alive and entry.token == token then
			restore(entry)
		end
	end)
end

function Lift.stop(p)
	local entry = active[p]
	if not entry then
		return
	end
	active[p] = nil
	entry.alive = false
	restore(entry)
	setHammerHidden(entry.char, false)
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

return Lift

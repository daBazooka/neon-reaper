-- SUB 5 TO TRUE ADAM: faces, hair and muscles. Every player has their own face (see Genome) that starts goofy
-- (cross-eyed, buck teeth, unibrow, hair everywhere, big belly) and sharpens with every level: eyes straighten, brows
-- angle, the jaw and cheekbones appear, hair fades, and muscles grow. Everything is built from simple parts.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Genome = require(ReplicatedStorage.Shared.Genome)
local Face = require(ReplicatedStorage.Shared.Face)
local bit, ball, stick = Face.bit, Face.ball, Face.stick
local Data = require(script.Parent.Data)
local Appearance = require(script.Parent.Appearance)

local Quirks = {}

local FOLDER = "GlowQuirks"

local function setFace(head, visible)
	for _, child in head:GetChildren() do
		if child:IsA("Decal") then
			child.Transparency = visible and 0 or 1
		end
	end
end

-- Finds a body part by its R15 or R6 name.
local function limb(char, r15, r6)
	return char:FindFirstChild(r15) or char:FindFirstChild(r6)
end

--------------------------------------------------------------------------------
-- Muscles: traps, lats (the V-taper), pecs, abs, delts, biceps, forearms, thighs and calves grow with level
--------------------------------------------------------------------------------
local function buildPhysique(char, torso, folder, T, level, w, skin)
	local m = math.clamp((level - 8) / 300, 0, 1)
	if m <= 0.02 then
		return
	end
	local line = skin:Lerp(Color3.new(0, 0, 0), 0.2)
	local light = skin:Lerp(Color3.new(1, 1, 1), 0.06)
	for _, side in { -1, 1 } do
		-- pecs
		stick(ball(Vector3.new(T.X * (0.22 + 0.2 * m), T.Y * (0.14 + 0.12 * m), T.Z * (0.18 + 0.2 * m)), skin), torso, CFrame.new(side * T.X * 0.2, T.Y * 0.2, -T.Z * 0.5), folder)
		-- traps rising to the neck, lats flaring out under the arms (the V-taper)
		stick(ball(Vector3.new(T.X * (0.18 + 0.12 * m), T.Y * (0.14 + 0.12 * m), T.Z * 0.5), skin), torso, CFrame.new(side * T.X * 0.2, T.Y * 0.5, T.Z * 0.05), folder)
		stick(ball(Vector3.new(T.X * (0.12 + 0.2 * m), T.Y * 0.62, T.Z * (0.28 + 0.2 * m)), skin), torso, CFrame.new(side * T.X * 0.5, T.Y * 0.02, T.Z * 0.18), folder)
	end
	stick(bit({ Size = Vector3.new(T.X * 0.03, T.Y * 0.16, T.Z * 0.03), Color = line }), torso, CFrame.new(0, T.Y * 0.2, -T.Z * 0.5), folder)
	-- abs (a six-pack once the belly is gone)
	if w < 0.35 and m > 0.12 then
		for row = 0, 3 do
			for _, side in { -1, 1 } do
				stick(bit({ Size = Vector3.new(T.X * 0.18, T.Y * 0.1, T.Z * 0.06), Color = light }), torso, CFrame.new(side * T.X * 0.105, T.Y * (0.0 - row * 0.115), -T.Z * 0.5), folder)
			end
		end
		stick(bit({ Size = Vector3.new(T.X * 0.025, T.Y * 0.5, T.Z * 0.03), Color = line }), torso, CFrame.new(0, -T.Y * 0.1, -T.Z * 0.5), folder)
	end
	-- arms: delts, biceps, triceps, forearms
	for _, name in { { "LeftUpperArm", "Left Arm", "LeftLowerArm" }, { "RightUpperArm", "Right Arm", "RightLowerArm" } } do
		local arm = limb(char, name[1], name[2])
		if arm then
			stick(ball(arm.Size.X * (1.15 + 1.1 * m), skin), arm, CFrame.new(0, arm.Size.Y * 0.32, 0), folder)
			stick(ball(Vector3.new(arm.Size.X * (0.9 + 0.8 * m), arm.Size.Y * 0.42, arm.Size.Z * (0.9 + 0.9 * m)), skin), arm, CFrame.new(0, -arm.Size.Y * 0.02, -arm.Size.Z * 0.15), folder)
			stick(ball(Vector3.new(arm.Size.X * (0.8 + 0.6 * m), arm.Size.Y * 0.4, arm.Size.Z * (0.8 + 0.6 * m)), skin), arm, CFrame.new(0, -arm.Size.Y * 0.02, arm.Size.Z * 0.2), folder)
		end
		local fore = char:FindFirstChild(name[3])
		if fore then
			stick(ball(Vector3.new(fore.Size.X * (0.95 + 0.5 * m), fore.Size.Y * 0.5, fore.Size.Z * (0.95 + 0.5 * m)), skin), fore, CFrame.new(0, fore.Size.Y * 0.2, 0), folder)
		end
	end
	-- thighs and calves
	for _, name in { { "LeftUpperLeg", "Left Leg", "LeftLowerLeg" }, { "RightUpperLeg", "Right Leg", "RightLowerLeg" } } do
		local leg = limb(char, name[1], name[2])
		if leg and m > 0.2 then
			stick(ball(Vector3.new(leg.Size.X * (0.95 + 0.55 * m), leg.Size.Y * 0.5, leg.Size.Z * (0.95 + 0.55 * m)), skin), leg, CFrame.new(0, leg.Size.Y * 0.1, -leg.Size.Z * 0.05), folder)
		end
		local calf = char:FindFirstChild(name[3])
		if calf and m > 0.25 then
			stick(ball(Vector3.new(calf.Size.X * (0.9 + 0.5 * m), calf.Size.Y * 0.5, calf.Size.Z * (0.9 + 0.5 * m)), skin), calf, CFrame.new(0, calf.Size.Y * 0.15, calf.Size.Z * 0.1), folder)
		end
	end
end

-- Hides the avatar's own hair while our styled hair is on (and brings it back at low levels).
local function setAvatarHair(char, hidden)
	for _, acc in char:GetChildren() do
		if acc:IsA("Accessory") and acc.AccessoryType == Enum.AccessoryType.Hair then
			local handle = acc:FindFirstChild("Handle")
			if handle then
				if hidden then
					if handle:GetAttribute("GlowOrigT") == nil then
						handle:SetAttribute("GlowOrigT", handle.Transparency)
					end
					handle.Transparency = 1
				else
					handle.Transparency = handle:GetAttribute("GlowOrigT") or 0
					handle:SetAttribute("GlowOrigT", nil)
				end
			end
		end
	end
end

--------------------------------------------------------------------------------
-- Entry point: rebuilds everything for the player's current level
--------------------------------------------------------------------------------
function Quirks.apply(p)
	local char = p.Character
	local profile = Data.get(p)
	if not char or not profile then
		return
	end
	local head = char:FindFirstChild("Head")
	local torso = char:FindFirstChild("UpperTorso") or char:FindFirstChild("Torso")
	if not head or not torso then
		return
	end
	local old = char:FindFirstChild(FOLDER)
	if old then
		old:Destroy()
	end

	local folder = Instance.new("Folder")
	folder.Name = FOLDER
	folder.Parent = char

	local g = Genome.get(p.UserId)
	local w = Config.Weirdness(profile.Level)
	local T = Appearance.torsoDims(p)
	local dims = Appearance.headDims(p)
	local W, H, D = dims.X, dims.Y, dims.Z
	local skin = head.Color
	local fur = g.hairColor:Lerp(Color3.new(0, 0, 0), 0.35)
	local rng = Random.new(p.UserId) -- same layout every time, so hair doesn't "jump" between levels

	-- Every player gets their own custom face (the default sticker face is hidden).
	setFace(head, false)
	Face.build(head, folder, dims, g, w, skin)
	local styled = profile.Level >= 40
	setAvatarHair(char, styled)
	if styled then
		Face.hair(head, folder, dims, g, profile.Level)
	end

	if w > 0.02 then
		-- Hair all over the face
		for _ = 1, math.ceil(34 * w) do
			local x = (rng:NextNumber() - 0.5) * W * 0.95
			local y = -H * (0.12 + rng:NextNumber() * 0.4)
			local zFront = rng:NextNumber() < 0.7
			local z = zFront and (-D * 0.5) or (-D * 0.3 + rng:NextNumber() * D * 0.4)
			local xSide = zFront and x or ((rng:NextNumber() < 0.5 and -1 or 1) * W * 0.5)
			stick(ball(W * (0.1 + rng:NextNumber() * 0.12), fur), head, CFrame.new(xSide, y, z), folder)
		end
		-- Messy hair on top
		for _ = 1, math.ceil(16 * w) do
			local x = (rng:NextNumber() - 0.5) * W * 0.8
			local z = (rng:NextNumber() - 0.5) * D * 0.8
			local tuft = bit({ Size = Vector3.new(W * 0.08, H * (0.25 + rng:NextNumber() * 0.25), W * 0.08), Color = fur })
			stick(tuft, head, CFrame.new(x, H * 0.55, z) * CFrame.Angles((rng:NextNumber() - 0.5) * 0.9, 0, (rng:NextNumber() - 0.5) * 0.9), folder)
		end
		-- Belly
		local bellySize = math.max(T.X, 2) * 0.85 * (0.3 + 0.7 * w)
		stick(ball(bellySize, skin), torso, CFrame.new(0, -T.Y * 0.35, -T.Z * 0.5 - bellySize * 0.05), folder)
		stick(ball(bellySize * 0.1, Color3.fromRGB(80, 50, 40)), torso, CFrame.new(0, -T.Y * 0.3, -T.Z * 0.5 - bellySize * 0.5), folder)
		-- Hair on the body
		local arms = { limb(char, "LeftUpperArm", "Left Arm"), limb(char, "RightUpperArm", "Right Arm") }
		for i = 1, math.ceil(60 * w) do
			local base, offset
			if i % 3 == 0 and arms[1] then
				base = arms[(i % 2) + 1] or arms[1]
				offset = CFrame.new((rng:NextNumber() < 0.5 and -1 or 1) * 0.55, (rng:NextNumber() - 0.5) * 0.9, (rng:NextNumber() - 0.5) * 0.5)
			else
				base = torso
				local face = rng:NextInteger(1, 3)
				if face == 1 then
					offset = CFrame.new((rng:NextNumber() - 0.5) * T.X * 0.8, T.Y * (0.05 + rng:NextNumber() * 0.4), -T.Z * 0.5)
				elseif face == 2 then
					offset = CFrame.new((rng:NextNumber() - 0.5) * T.X * 0.8, (rng:NextNumber() - 0.5) * T.Y * 0.8, T.Z * 0.5)
				else
					offset = CFrame.new((rng:NextNumber() < 0.5 and -1 or 1) * T.X * 0.5, (rng:NextNumber() - 0.5) * T.Y * 0.8, (rng:NextNumber() - 0.5) * T.Z * 0.7)
				end
			end
			local tuft = bit({ Size = Vector3.new(0.14, 0.5 + rng:NextNumber() * 0.4, 0.14), Color = fur })
			stick(tuft, base, offset * CFrame.Angles((rng:NextNumber() - 0.5) * 1.2, 0, (rng:NextNumber() - 0.5) * 1.2), folder)
		end
	end

	buildPhysique(char, torso, folder, T, profile.Level, w, skin)
end

return Quirks

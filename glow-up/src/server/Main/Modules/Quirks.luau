-- SUB 5 TO TRUE ADAM: the gag that gives the game its name. Everyone starts with a goofy face, a big
-- belly and hair all over their face and body. As you level up it all fades away until you look normal
-- (around level 600) and keep getting more athletic. Everything is built from simple parts.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Appearance = require(script.Parent.Appearance)

local Quirks = {}

local FOLDER = "GlowQuirks"
local FUR = Color3.fromRGB(46, 32, 22)

local function bit(props)
	local part = Instance.new("Part")
	part.Anchored = false
	part.CanCollide = false
	part.CanTouch = false
	part.CanQuery = false
	part.Massless = true
	part.CastShadow = false
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Material = Enum.Material.SmoothPlastic
	for k, v in props do
		part[k] = v
	end
	return part
end

local function stick(part, base, offset, folder)
	part.CFrame = base.CFrame * offset
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = base
	weld.Part1 = part
	weld.Parent = part
	part.Parent = folder
	return part
end

local function ball(size, color)
	return bit({ Shape = Enum.PartType.Ball, Size = Vector3.one * size, Color = color })
end

local function restoreFace(head)
	for _, child in head:GetChildren() do
		if child:IsA("Decal") then
			child.Transparency = 0
		end
	end
end

local function hideFace(head)
	for _, child in head:GetChildren() do
		if child:IsA("Decal") then
			child.Transparency = 1
		end
	end
end

-- Finds a body part by its R15 or R6 name.
local function limb(char, r15, r6)
	return char:FindFirstChild(r15) or char:FindFirstChild(r6)
end

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

	local w = Config.Weirdness(profile.Level)
	if w <= 0.02 then
		restoreFace(head)
		return
	end

	local folder = Instance.new("Folder")
	folder.Name = FOLDER
	folder.Parent = char

	local T = Appearance.torsoDims(p)
	local dims = Appearance.headDims(p)
	local W, H, D = dims.X, dims.Y, dims.Z
	local skin = head.Color
	local rng = Random.new(p.UserId) -- same layout every time, so hair doesn't "jump" between levels

	-- e: how exaggerated the face still is (shrinks a little with every level)
	local e = 0.45 + 0.55 * w
	-- ===== The face =====
	if w > 0.15 then
		hideFace(head)
		local faceZ = -D * 0.5
		-- Mismatched, cross-eyed eyes
		stick(ball(W * 0.34 * e, Color3.new(1, 1, 1)), head, CFrame.new(-W * 0.22, H * 0.1, faceZ), folder)
		stick(ball(W * 0.2, Color3.new(1, 1, 1)), head, CFrame.new(W * 0.2, H * 0.2, faceZ), folder)
		stick(ball(W * 0.13, Color3.new(0, 0, 0)), head, CFrame.new(-W * 0.14, H * 0.08, faceZ - W * 0.15), folder)
		stick(ball(W * 0.09, Color3.new(0, 0, 0)), head, CFrame.new(W * 0.15, H * 0.18, faceZ - W * 0.08), folder)
		-- One big hairy unibrow
		stick(bit({ Size = Vector3.new(W * 0.8, H * 0.13 * e, D * 0.12), Color = FUR }), head, CFrame.new(0, H * 0.34, faceZ) * CFrame.Angles(0, 0, 0.12), folder)
		-- Giant nose with nostrils
		stick(ball(W * 0.3 * e, skin), head, CFrame.new(0, -H * 0.1, faceZ - W * 0.08), folder)
		stick(ball(W * 0.07, Color3.fromRGB(40, 20, 20)), head, CFrame.new(-W * 0.07, -H * 0.16, faceZ - W * 0.28), folder)
		stick(ball(W * 0.07, Color3.fromRGB(40, 20, 20)), head, CFrame.new(W * 0.07, -H * 0.16, faceZ - W * 0.28), folder)
		-- Crooked mouth with buck teeth
		stick(bit({ Size = Vector3.new(W * 0.5, H * 0.1, D * 0.06), Color = Color3.fromRGB(70, 20, 30) }), head, CFrame.new(W * 0.04, -H * 0.34, faceZ) * CFrame.Angles(0, 0, 0.14), folder)
		for side = -1, 1, 2 do
			if w > 0.45 then
			stick(bit({ Size = Vector3.new(W * 0.11, H * 0.17, D * 0.06), Color = Color3.fromRGB(250, 248, 235) }), head, CFrame.new(W * 0.04 + side * W * 0.065, -H * 0.4, faceZ - D * 0.02), folder)
			end
		end
		-- Bushy mustache
		for side = -1, 1, 2 do
			if w > 0.3 then
			stick(bit({ Size = Vector3.new(W * 0.3, H * 0.12, D * 0.1), Color = FUR }), head, CFrame.new(side * W * 0.16, -H * 0.24, faceZ - D * 0.04) * CFrame.Angles(0, 0, -side * 0.18), folder)
			end
		end
	else
		restoreFace(head)
	end

	-- ===== Hair all over the face =====
	local faceHair = math.ceil(34 * w)
	for _ = 1, faceHair do
		local x = (rng:NextNumber() - 0.5) * W * 0.95
		local y = -H * (0.12 + rng:NextNumber() * 0.4)
		local zFront = rng:NextNumber() < 0.7
		local z = zFront and (-D * 0.5) or (-D * 0.3 + rng:NextNumber() * D * 0.4)
		local xSide = zFront and x or ((rng:NextNumber() < 0.5 and -1 or 1) * W * 0.5)
		stick(ball(W * (0.1 + rng:NextNumber() * 0.12), FUR), head, CFrame.new(xSide, y, z), folder)
	end
	-- Messy hair on top
	local topHair = math.ceil(16 * w)
	for _ = 1, topHair do
		local x = (rng:NextNumber() - 0.5) * W * 0.8
		local z = (rng:NextNumber() - 0.5) * D * 0.8
		local tuft = bit({ Size = Vector3.new(W * 0.08, H * (0.25 + rng:NextNumber() * 0.25), W * 0.08), Color = FUR })
		stick(tuft, head, CFrame.new(x, H * 0.55, z) * CFrame.Angles((rng:NextNumber() - 0.5) * 0.9, 0, (rng:NextNumber() - 0.5) * 0.9), folder)
	end

	-- ===== Belly =====
	local bellySize = math.max(T.X, 2) * 0.85 * (0.3 + 0.7 * w)
	local belly = ball(bellySize, skin)
	stick(belly, torso, CFrame.new(0, -T.Y * 0.35, -T.Z * 0.5 - bellySize * 0.05), folder)
	stick(ball(bellySize * 0.1, Color3.fromRGB(80, 50, 40)), torso, CFrame.new(0, -T.Y * 0.3, -T.Z * 0.5 - bellySize * 0.5), folder)

	-- ===== Hair on the body =====
	local arms = {
		limb(char, "LeftUpperArm", "Left Arm"),
		limb(char, "RightUpperArm", "Right Arm"),
	}
	local bodyHair = math.ceil(60 * w)
	for i = 1, bodyHair do
		local base, offset
		if i % 3 == 0 and arms[1] then
			base = arms[(i % 2) + 1] or arms[1]
			offset = CFrame.new((rng:NextNumber() < 0.5 and -1 or 1) * 0.55, (rng:NextNumber() - 0.5) * 0.9, (rng:NextNumber() - 0.5) * 0.5)
		else
			base = torso
			local face = rng:NextInteger(1, 3)
			if face == 1 then -- front (chest)
				offset = CFrame.new((rng:NextNumber() - 0.5) * T.X * 0.8, T.Y * (0.05 + rng:NextNumber() * 0.4), -T.Z * 0.5)
			elseif face == 2 then -- back
				offset = CFrame.new((rng:NextNumber() - 0.5) * T.X * 0.8, (rng:NextNumber() - 0.5) * T.Y * 0.8, T.Z * 0.5)
			else -- sides
				offset = CFrame.new((rng:NextNumber() < 0.5 and -1 or 1) * T.X * 0.5, (rng:NextNumber() - 0.5) * T.Y * 0.8, (rng:NextNumber() - 0.5) * T.Z * 0.7)
			end
		end
		local tuft = bit({ Size = Vector3.new(0.14, 0.5 + rng:NextNumber() * 0.4, 0.14), Color = FUR })
		stick(tuft, base, offset * CFrame.Angles((rng:NextNumber() - 0.5) * 1.2, 0, (rng:NextNumber() - 0.5) * 1.2), folder)
	end
end

return Quirks

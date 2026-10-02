-- SUB 5 TO TRUE ADAM: builds the whole town from code (nothing to import).
-- A bright daytime plaza with grass, concrete, brick and wood: three training pavilions, a crate
-- shop, a boxing ring for duels, a catwalk, and the big Mog Competition stage in the middle.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local World = {}

local rng = Random.new(77)
local PLAZA = Config.PlazaRadius
local STATION_RADIUS = 95
local C3 = Color3.fromRGB
local M = Enum.Material

-- A classic Roblox palette.
local RED, BLUE, YELLOW, GREEN = C3(196, 40, 28), C3(13, 105, 172), C3(245, 205, 48), C3(75, 151, 75)
local WHITE, CONCRETE, DARK, WOOD = C3(242, 243, 243), C3(176, 176, 180), C3(60, 62, 70), C3(124, 92, 70)
local BRICK, ASPHALT, GRASS = C3(166, 106, 70), C3(58, 60, 66), C3(91, 154, 76)

--------------------------------------------------------------------------------
-- Building helpers
--------------------------------------------------------------------------------
local function part(parent, props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in props do
		p[k] = v
	end
	p.Parent = parent
	return p
end

local function block(parent, name, size, cf, color, material, extra)
	local props = { Name = name, Size = size, CFrame = cf, Color = color, Material = material or M.SmoothPlastic }
	if extra then
		for k, v in extra do
			props[k] = v
		end
	end
	return part(parent, props)
end

-- Flat cylinder whose top face is at center.Y.
local function disk(parent, name, center, radius, thickness, color, material)
	return part(parent, {
		Name = name,
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(thickness, radius * 2, radius * 2),
		CFrame = CFrame.new(center.X, center.Y - thickness / 2, center.Z) * CFrame.Angles(0, 0, math.pi / 2),
		Color = color,
		Material = material or M.SmoothPlastic,
	})
end

-- Upright cylinder centred at `center`.
local function post(parent, name, center, radius, height, color, material)
	return part(parent, {
		Name = name,
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(height, radius * 2, radius * 2),
		CFrame = CFrame.new(center) * CFrame.Angles(0, 0, math.pi / 2),
		Color = color,
		Material = material or M.SmoothPlastic,
	})
end

-- A painted sign board whose front faces `facing`.
local function sign(parent, position, facing, size, text, boardColor, textColor)
	local cf = CFrame.lookAt(position, position + facing)
	block(parent, "SignFrame", size + Vector3.new(1, 1, 0), cf * CFrame.new(0, 0, 0.3), WHITE, M.SmoothPlastic, { CanCollide = false })
	local face = block(parent, "Sign", size, cf, boardColor, M.SmoothPlastic, { CanCollide = false })
	local gui = Instance.new("SurfaceGui")
	gui.Face = Enum.NormalId.Front
	gui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	gui.CanvasSize = Vector2.new(size.X * 50, size.Y * 50)
	gui.LightInfluence = 0.2
	gui.Parent = face
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBlack
	label.TextScaled = true
	label.TextColor3 = textColor or WHITE
	label.TextStrokeTransparency = 0
	label.TextStrokeColor3 = C3(0, 0, 0)
	label.Text = text
	label.Parent = gui
	return face, label
end

local function prompt(parent, objectText, actionText, onTriggered)
	local p = Instance.new("ProximityPrompt")
	p.ObjectText = objectText
	p.ActionText = actionText
	p.HoldDuration = 0
	p.KeyboardKeyCode = Enum.KeyCode.E
	p.MaxActivationDistance = 18
	p.RequiresLineOfSight = false
	p.Exclusivity = Enum.ProximityPromptExclusivity.OnePerButton
	p.Parent = parent
	p.Triggered:Connect(function(player)
		onTriggered(player)
	end)
	return p
end

local function promptAnchor(parent, pos)
	return part(parent, {
		Name = "PromptAnchor",
		Size = Vector3.new(4, 2, 4),
		Position = pos + Vector3.new(0, 2.5, 0),
		Transparency = 1,
		CanCollide = false,
		CanQuery = false,
	})
end

local function tree(parent, pos)
	local h = 7 + rng:NextNumber() * 5
	post(parent, "Trunk", pos + Vector3.new(0, h / 2, 0), 1, h, C3(110, 80, 55), M.Wood)
	local leafColor = C3(60 + rng:NextInteger(0, 30), 130 + rng:NextInteger(0, 30), 55)
	local r = 5 + rng:NextNumber() * 2
	for i = 1, 3 do
		part(parent, {
			Name = "Leaves",
			Shape = Enum.PartType.Ball,
			Size = Vector3.one * (r * (1.25 - i * 0.12)),
			Position = pos + Vector3.new((i - 2) * 1.6, h + 1.5 + i * 1.4, (i % 2) * 1.2),
			Color = leafColor,
			Material = M.Grass,
			CanCollide = false,
		})
	end
end

local function lamp(parent, pos)
	post(parent, "LampPole", pos + Vector3.new(0, 6, 0), 0.35, 12, DARK, M.Metal)
	local bulb = part(parent, {
		Name = "LampHead",
		Size = Vector3.new(1.8, 0.8, 1.8),
		Position = pos + Vector3.new(0, 12.3, 0),
		Color = C3(255, 244, 200),
		Material = M.SmoothPlastic,
		CanCollide = false,
	})
	local light = Instance.new("PointLight")
	light.Range = 22
	light.Brightness = 0.8
	light.Color = C3(255, 238, 200)
	light.Parent = bulb
end

local function bench(parent, cf)
	block(parent, "BenchSeat", Vector3.new(6, 0.5, 1.8), cf * CFrame.new(0, 1.6, 0), WOOD, M.Wood)
	block(parent, "BenchBack", Vector3.new(6, 1.6, 0.4), cf * CFrame.new(0, 2.6, 0.8), WOOD, M.Wood)
	for side = -1, 1, 2 do
		block(parent, "BenchLeg", Vector3.new(0.4, 1.6, 1.6), cf * CFrame.new(side * 2.6, 0.8, 0), DARK, M.Metal)
	end
end

local function building(parent, pos, w, h, d, color, facingCenter)
	local cf = CFrame.lookAt(pos, Vector3.new(0, pos.Y, 0))
	block(parent, "Building", Vector3.new(w, h, d), cf * CFrame.new(0, h / 2, 0), color, M.Concrete)
	block(parent, "Roof", Vector3.new(w + 1, 1.2, d + 1), cf * CFrame.new(0, h + 0.6, 0), DARK, M.SmoothPlastic)
	local rows = math.max(1, math.floor((h - 8) / 9))
	for r = 1, rows do
		local y = 5 + (r - 1) * 9
		for _, face in { { 0, -d / 2 - 0.1, w * 0.8, 0.3 }, { 0, d / 2 + 0.1, w * 0.8, 0.3 } } do
			block(parent, "Window", Vector3.new(face[3], 3.4, face[4]), cf * CFrame.new(face[1], y + 2, face[2]), C3(160, 205, 235), M.Glass, { Transparency = 0.25, CanCollide = false })
		end
		for side = -1, 1, 2 do
			block(parent, "Window", Vector3.new(0.3, 3.4, d * 0.8), cf * CFrame.new(side * (w / 2 + 0.1), y + 2, 0), C3(160, 205, 235), M.Glass, { Transparency = 0.25, CanCollide = false })
		end
	end
	block(parent, "Door", Vector3.new(4, 6, 0.3), cf * CFrame.new(0, 3, -d / 2 - 0.15), BLUE, M.SmoothPlastic, { CanCollide = false })
end

--------------------------------------------------------------------------------
-- Lighting: a bright, clear day
--------------------------------------------------------------------------------
local function setupLighting()
	Lighting.ClockTime = 14.2
	Lighting.Brightness = 2.4
	Lighting.Ambient = C3(110, 112, 120)
	Lighting.OutdoorAmbient = C3(125, 128, 140)
	Lighting.GlobalShadows = true
	Lighting.EnvironmentDiffuseScale = 0.6
	Lighting.EnvironmentSpecularScale = 0.4

	for _, child in Lighting:GetChildren() do
		if
			child:IsA("Atmosphere")
			or child:IsA("BloomEffect")
			or child:IsA("ColorCorrectionEffect")
			or child:IsA("SunRaysEffect")
			or child:IsA("DepthOfFieldEffect")
			or child:IsA("BlurEffect")
			or child:IsA("Sky")
		then
			child:Destroy()
		end
	end

	Instance.new("Sky").Parent = Lighting

	local atmo = Instance.new("Atmosphere")
	atmo.Density = 0.22
	atmo.Offset = 0.25
	atmo.Color = C3(199, 214, 235)
	atmo.Decay = C3(160, 185, 215)
	atmo.Glare = 0.2
	atmo.Haze = 0.6
	atmo.Parent = Lighting

	local bloom = Instance.new("BloomEffect")
	bloom.Intensity = 0.25
	bloom.Size = 20
	bloom.Threshold = 1.8
	bloom.Parent = Lighting

	local rays = Instance.new("SunRaysEffect")
	rays.Intensity = 0.08
	rays.Spread = 0.6
	rays.Parent = Lighting

	local tint = Instance.new("ColorCorrectionEffect")
	tint.Name = "GlowTint"
	tint.Saturation = 0.1
	tint.Contrast = 0.04
	tint.Parent = Lighting
end

--------------------------------------------------------------------------------
-- Pavilions (training stations)
--------------------------------------------------------------------------------
local function pavilion(parent, pos, inward, roofColor, signText, signColor)
	local cf = CFrame.lookAt(pos, pos + inward)
	block(parent, "Floor", Vector3.new(32, 0.8, 30), cf * CFrame.new(0, 0.5, 0), C3(160, 160, 166), M.Concrete)
	for sx = -1, 1, 2 do
		for sz = -1, 1, 2 do
			block(parent, "Pillar", Vector3.new(1.8, 13, 1.8), cf * CFrame.new(sx * 14.5, 7.3, sz * 13.5), WHITE, M.Concrete)
		end
	end
	block(parent, "Roof", Vector3.new(35, 1.4, 33), cf * CFrame.new(0, 14.4, 0), roofColor)
	block(parent, "RoofTrim", Vector3.new(36, 0.6, 34), cf * CFrame.new(0, 13.5, 0), WHITE)
	block(parent, "BackWall", Vector3.new(32, 12, 1), cf * CFrame.new(0, 7, 14.6), C3(214, 208, 196), M.Concrete)
	sign(parent, (cf * CFrame.new(0, 18.6, -16)).Position, inward, Vector3.new(26, 5, 0.6), signText, signColor)
	return cf
end

local function stationAt(angle)
	local a = math.rad(angle)
	local pos = Vector3.new(math.cos(a) * STATION_RADIUS, 0, math.sin(a) * STATION_RADIUS)
	local inward = Vector3.new(-math.cos(a), 0, -math.sin(a))
	return pos, inward, Vector3.new(-math.sin(a), 0, math.cos(a))
end

local function buildGym(parent, cb)
	local pos, inward = stationAt(40)
	local cf = pavilion(parent, pos, inward, RED, "💪  GYM", C3(150, 30, 20))
	-- Bench press
	block(parent, "Bench", Vector3.new(2.4, 1.2, 6.5), cf * CFrame.new(0, 1.9, 2), C3(40, 40, 46), M.SmoothPlastic)
	for side = -1, 1, 2 do
		block(parent, "BenchStand", Vector3.new(0.6, 3, 0.6), cf * CFrame.new(side * 2.4, 2.3, 1), DARK, M.Metal)
	end
	local bar = cf * CFrame.new(0, 4.6, 1)
	block(parent, "Bar", Vector3.new(11, 0.5, 0.5), bar, C3(200, 205, 215), M.Metal, { Shape = Enum.PartType.Cylinder })
	for side = -1, 1, 2 do
		block(parent, "Plate", Vector3.new(0.8, 3.4, 3.4), bar * CFrame.new(side * 4.6, 0, 0), C3(30, 30, 36), M.Metal, { Shape = Enum.PartType.Cylinder })
		block(parent, "Plate", Vector3.new(0.7, 2.4, 2.4), bar * CFrame.new(side * 5.3, 0, 0), RED, M.Metal, { Shape = Enum.PartType.Cylinder })
	end
	-- Dumbbell rack along the back wall
	block(parent, "Rack", Vector3.new(14, 2.4, 2.6), cf * CFrame.new(-8, 2, 12.6), DARK, M.Metal)
	for i = 1, 6 do
		local d = cf * CFrame.new(-13.5 + i * 1.9, 3.7, 12.6)
		block(parent, "Dumbbell", Vector3.new(1.8, 0.4, 0.4), d, C3(200, 205, 215), M.Metal, { Shape = Enum.PartType.Cylinder })
		for side = -1, 1, 2 do
			block(parent, "DumbbellHead", Vector3.new(0.5, 1, 1), d * CFrame.new(side * 0.8, 0, 0), C3(30, 30, 36), M.Metal, { Shape = Enum.PartType.Cylinder })
		end
	end
	block(parent, "Mirror", Vector3.new(14, 7, 0.3), cf * CFrame.new(7, 6, 14), C3(190, 215, 235), M.Glass, { Transparency = 0.35, Reflectance = 0.3 })
	prompt(promptAnchor(parent, pos), "Gym", "Train Power", function(p)
		cb.train(p, "Power")
	end)
end

local function buildStudio(parent, cb)
	local pos, inward = stationAt(112)
	local cf = pavilion(parent, pos, inward, C3(190, 70, 140), "💈  STYLE STUDIO", C3(130, 40, 100))
	for i, x in { -7, 7 } do
		local c = cf * CFrame.new(x, 0, 2)
		post(parent, "ChairBase", (c * CFrame.new(0, 1, 0)).Position, 1.3, 0.6, DARK, M.Metal)
		post(parent, "ChairPost", (c * CFrame.new(0, 1.8, 0)).Position, 0.35, 1.4, C3(200, 205, 215), M.Metal)
		block(parent, "ChairSeat", Vector3.new(3.2, 0.9, 3.2), c * CFrame.new(0, 2.8, 0), RED, M.Leather)
		block(parent, "ChairBack", Vector3.new(3.2, 3.6, 0.9), c * CFrame.new(0, 4.4, -1.5), RED, M.Leather)
		block(parent, "ChairHead", Vector3.new(1.8, 1.2, 0.8), c * CFrame.new(0, 6.7, -1.5), RED, M.Leather)
		for side = -1, 1, 2 do
			block(parent, "ChairArm", Vector3.new(0.5, 0.5, 2.6), c * CFrame.new(side * 1.8, 3.9, 0), DARK, M.Metal)
		end
	end
	for i = 1, 3 do
		local x = (i - 2) * 9.5
		block(parent, "MirrorFrame", Vector3.new(7.6, 8.6, 0.5), cf * CFrame.new(x, 6.2, 13.9), DARK, M.Wood)
		block(parent, "Mirror", Vector3.new(6.8, 7.8, 0.3), cf * CFrame.new(x, 6.2, 13.6), C3(195, 220, 240), M.Glass, { Transparency = 0.3, Reflectance = 0.35 })
	end
	block(parent, "Counter", Vector3.new(26, 2.6, 1.8), cf * CFrame.new(0, 2, 12.4), WOOD, M.Wood)
	for i = 1, 7 do
		post(parent, "Bottle", (cf * CFrame.new(-10 + i * 2.7, 4, 12.4)).Position, 0.4, 1.4, ({ BLUE, GREEN, YELLOW, RED })[i % 4 + 1], M.Glass)
	end
	prompt(promptAnchor(parent, pos), "Style Studio", "Train Style", function(p)
		cb.train(p, "Style")
	end)
end

local function buildLounge(parent, cb)
	local pos, inward = stationAt(184)
	local cf = pavilion(parent, pos, inward, C3(60, 140, 190), "🛋️  CHARM LOUNGE", C3(30, 90, 140))
	disk(parent, "Rug", (cf * CFrame.new(0, 0.9, 1)).Position, 9, 0.1, C3(190, 70, 90), M.Fabric)
	block(parent, "SofaSeat", Vector3.new(11, 1.6, 4), cf * CFrame.new(0, 2, 11), C3(120, 80, 150), M.Fabric)
	block(parent, "SofaBack", Vector3.new(11, 3.6, 1), cf * CFrame.new(0, 4, 12.6), C3(100, 64, 130), M.Fabric)
	for side = -1, 1, 2 do
		block(parent, "SofaArm", Vector3.new(1, 3, 4), cf * CFrame.new(side * 5.8, 2.6, 11), C3(100, 64, 130), M.Fabric)
	end
	block(parent, "TableTop", Vector3.new(6, 0.5, 3), cf * CFrame.new(0, 2.5, 5), WOOD, M.Wood)
	for sx = -1, 1, 2 do
		for sz = -1, 1, 2 do
			block(parent, "TableLeg", Vector3.new(0.4, 1.6, 0.4), cf * CFrame.new(sx * 2.4, 1.6, 5 + sz * 1.1), WOOD, M.Wood)
		end
	end
	for _, x in { -13, 13 } do
		post(parent, "Pot", (cf * CFrame.new(x, 1.8, 11)).Position, 1.2, 2, C3(170, 100, 70), M.Concrete)
		part(parent, { Name = "Plant", Shape = Enum.PartType.Ball, Size = Vector3.one * 4, Position = (cf * CFrame.new(x, 4.4, 11)).Position, Color = GREEN, Material = M.Grass, CanCollide = false })
	end
	prompt(promptAnchor(parent, pos), "Charm Lounge", "Train Charm", function(p)
		cb.train(p, "Charm")
	end)
end

local function buildCrateShop(parent, cb)
	local pos, inward = stationAt(256)
	local cf = CFrame.lookAt(pos, pos + inward)
	block(parent, "Base", Vector3.new(26, 0.8, 20), cf * CFrame.new(0, 0.5, 0), C3(150, 120, 90), M.Wood)
	block(parent, "BackWall", Vector3.new(24, 11, 1), cf * CFrame.new(0, 6.3, 9), C3(214, 190, 150), M.Wood)
	block(parent, "Counter", Vector3.new(16, 3.4, 3.4), cf * CFrame.new(0, 2.5, 1.5), WOOD, M.Wood)
	block(parent, "CounterTop", Vector3.new(17, 0.5, 4), cf * CFrame.new(0, 4.4, 1.5), C3(80, 58, 44), M.Wood)
	for side = -1, 1, 2 do
		block(parent, "Post", Vector3.new(1.2, 12.5, 1.2), cf * CFrame.new(side * 12, 6.8, -6), WHITE, M.Wood)
	end
	-- Striped awning
	for i = 1, 10 do
		local x = -11.25 + (i - 1) * 2.5
		block(parent, "Awning", Vector3.new(2.5, 0.4, 15), cf * CFrame.new(x, 12.4, -1) * CFrame.Angles(math.rad(-9), 0, 0), i % 2 == 0 and WHITE or RED, M.Fabric)
	end
	sign(parent, (cf * CFrame.new(0, 17, -8.8)).Position, inward, Vector3.new(22, 4.4, 0.6), "🎁  CRATE SHOP", C3(30, 90, 140))
	for i, crate in Config.Crates do
		local box = cf * CFrame.new((i - 2) * 4.4, 5.8, 1.5)
		block(parent, "CrateDisplay", Vector3.new(2.6, 2.6, 2.6), box, WOOD, M.Wood)
		block(parent, "CrateLid", Vector3.new(2.8, 0.4, 2.8), box * CFrame.new(0, 1.4, 0), crate.Color, M.SmoothPlastic)
		block(parent, "CrateRibbon", Vector3.new(0.5, 2.7, 2.9), box, crate.Color, M.SmoothPlastic)
	end
	for i = 1, 3 do
		block(parent, "StackedCrate", Vector3.new(3, 3, 3), cf * CFrame.new(-10.5 + (i % 2) * 0.4, 2.4 + (i - 1) * 3, 7), WOOD, M.Wood)
		block(parent, "StackedCrate", Vector3.new(3, 3, 3), cf * CFrame.new(10.5 - (i % 2) * 0.4, 2.4 + (i - 1) * 3, 7), WOOD, M.Wood)
	end
	prompt(promptAnchor(parent, pos), "Crate Shop", "Open shop", function(p)
		cb.crates(p)
	end)
end

local function buildDummy(parent, at, facing, cb)
	local cf = CFrame.lookAt(at, at + facing)
	post(parent, "DummyBase", (cf * CFrame.new(0, 0.5, 0)).Position, 2.2, 0.8, DARK, M.Metal)
	post(parent, "DummyPole", (cf * CFrame.new(0, 3, 0)).Position, 0.4, 5, C3(200, 205, 215), M.Metal)
	local body = block(parent, "Dummy", Vector3.new(3, 5, 2.4), cf * CFrame.new(0, 6.2, 0), C3(214, 190, 150), M.Fabric)
	part(parent, { Name = "DummyHead", Shape = Enum.PartType.Ball, Size = Vector3.one * 2.4, Position = (cf * CFrame.new(0, 10, 0)).Position, Color = C3(214, 190, 150), Material = M.Fabric })
	for side = -1, 1, 2 do
		block(parent, "DummyArm", Vector3.new(1, 4, 1), cf * CFrame.new(side * 2.2, 6.4, 0) * CFrame.Angles(0, 0, side * 0.25), C3(214, 190, 150), M.Fabric)
	end
	block(parent, "Target", Vector3.new(2.2, 2.2, 0.3), cf * CFrame.new(0, 6.6, -1.25), RED, M.SmoothPlastic, { CanCollide = false })
	local tag = Instance.new("BillboardGui")
	tag.Size = UDim2.fromOffset(220, 40)
	tag.StudsOffset = Vector3.new(0, 4.5, 0)
	tag.MaxDistance = 90
	tag.Adornee = body
	tag.Parent = body
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBlack
	label.TextSize = 22
	label.TextColor3 = WHITE
	label.TextStrokeTransparency = 0
	label.Text = "MOGGER BOT"
	label.Parent = tag
	prompt(body, "Mogger Bot", "Duel the bot", function(p)
		cb.duelBot(p)
	end)
end

local function buildRing(parent, cb)
	local pos, inward, tangent = stationAt(328)
	local cf = CFrame.lookAt(pos, pos + inward)
	-- Platform with steps toward the plaza
	block(parent, "RingStepLow", Vector3.new(14, 0.9, 5), cf * CFrame.new(0, 0.45, -26.5), C3(150, 150, 156), M.Concrete)
	block(parent, "RingStepHigh", Vector3.new(14, 1.8, 5), cf * CFrame.new(0, 0.9, -23), C3(160, 160, 166), M.Concrete)
	block(parent, "RingBase", Vector3.new(40, 2.6, 40), cf * CFrame.new(0, 1.3, 0), C3(120, 120, 126), M.Concrete)
	block(parent, "Canvas", Vector3.new(36, 0.2, 36), cf * CFrame.new(0, 2.7, 0), C3(228, 224, 214), M.Fabric)
	-- Corner posts + ropes
	local top = Vector3.new(0, 2.8, 0)
	for sx = -1, 1, 2 do
		for sz = -1, 1, 2 do
			block(parent, "CornerPost", Vector3.new(1.2, 7, 1.2), cf * CFrame.new(sx * 17.4, 6.2, sz * 17.4), (sx * sz > 0) and RED or BLUE, M.SmoothPlastic)
			block(parent, "CornerPad", Vector3.new(1.8, 2.2, 1.8), cf * CFrame.new(sx * 17.4, 4.8, sz * 17.4), (sx * sz > 0) and RED or BLUE, M.Fabric)
		end
	end
	for i, y in { 4.2, 5.8, 7.4 } do
		local color = i == 2 and WHITE or (i == 1 and RED or BLUE)
		for side = -1, 1, 2 do
			block(parent, "RopeX", Vector3.new(34.8, 0.35, 0.35), cf * CFrame.new(0, y, side * 17.4), color, M.SmoothPlastic, { CanCollide = false })
			block(parent, "RopeZ", Vector3.new(0.35, 0.35, 34.8), cf * CFrame.new(side * 17.4, y, 0), color, M.SmoothPlastic, { CanCollide = false })
		end
	end
	-- Corner markers where duelists stand
	local padA = cf * CFrame.new(-10, 2.9, 0)
	local padB = cf * CFrame.new(10, 2.9, 0)
	disk(parent, "CornerA", padA.Position, 3.5, 0.15, BLUE, M.SmoothPlastic).CanCollide = false
	disk(parent, "CornerB", padB.Position, 3.5, 0.15, RED, M.SmoothPlastic).CanCollide = false
	sign(parent, (cf * CFrame.new(0, 15, 20)).Position, inward, Vector3.new(26, 5, 0.6), "🥊  DUEL RING", C3(150, 30, 20))
	for side = -1, 1, 2 do
		block(parent, "SignPost", Vector3.new(1.2, 15, 1.2), cf * CFrame.new(side * 15, 7.5, 20), DARK, M.Metal)
	end
	prompt(promptAnchor(parent, pos + Vector3.new(0, 2.6, 0)), "Duel Ring", "Find a duel", function(p)
		cb.duelQueue(p)
	end)
	buildDummy(parent, (cf * CFrame.new(-26, 0.4, -8)).Position, inward, cb)
	return { padA = padA, padB = padB, center = pos + Vector3.new(0, 2.8, 0) }
end

--------------------------------------------------------------------------------
-- The Mog Competition stage (centre of the plaza)
--------------------------------------------------------------------------------
local function buildStage(parent, cb)
	disk(parent, "StageStep", Vector3.new(0, 0.9, 0), 28, 0.9, C3(150, 150, 156), M.Concrete)
	disk(parent, "Stage", Vector3.new(0, 1.8, 0), 24, 0.9, C3(196, 196, 202), M.Concrete)
	disk(parent, "StageEmblem", Vector3.new(0, 1.85, 0), 15, 0.1, YELLOW, M.SmoothPlastic)
	disk(parent, "StageEmblemInner", Vector3.new(0, 1.9, 0), 13.5, 0.1, C3(196, 196, 202), M.Concrete)
	-- Canopy
	for sx = -1, 1, 2 do
		for sz = -1, 1, 2 do
			block(parent, "StagePillar", Vector3.new(2, 31, 2), CFrame.new(sx * 32, 15.5, sz * 22), DARK, M.Metal)
		end
	end
	block(parent, "StageRoof", Vector3.new(70, 2, 48), CFrame.new(0, 32, 0), C3(48, 50, 58), M.Metal)
	block(parent, "StageRoofTrim", Vector3.new(71, 0.7, 49), CFrame.new(0, 30.7, 0), YELLOW, M.SmoothPlastic)
	for i = 1, 8 do
		local x = -28 + (i - 1) * 8
		local lampPart = block(parent, "StageLight", Vector3.new(2.4, 1.6, 2.4), CFrame.new(x, 30, (i % 2 == 0) and -8 or 8), C3(230, 230, 235), M.Metal, { CanCollide = false })
		local light = Instance.new("SpotLight")
		light.Face = Enum.NormalId.Bottom
		light.Angle = 70
		light.Range = 60
		light.Brightness = 1.6
		light.Color = C3(255, 244, 220)
		light.Parent = lampPart
	end
	-- Banners
	sign(parent, Vector3.new(0, 25.5, 23), Vector3.new(0, 0, 1), Vector3.new(48, 9, 0.8), "SUB 5 TO TRUE ADAM", C3(20, 70, 140), C3(255, 214, 70))
	local _, boardLabel = sign(parent, Vector3.new(0, 14.5, 23), Vector3.new(0, 0, 1), Vector3.new(34, 8, 0.8), "MOG COMPETITION\nsoon...", C3(30, 30, 38), WHITE)
	boardLabel.TextScaled = true
	for side = -1, 1, 2 do
		block(parent, "BannerPost", Vector3.new(1.4, 31, 1.4), CFrame.new(side * 27, 15.5, 23), DARK, M.Metal)
	end
	-- Podium
	local function podium(x, h, color, number)
		block(parent, "Podium", Vector3.new(8, h, 6), CFrame.new(x, 1.8 + h / 2, -14), color, M.Metal)
		local face, label = sign(parent, Vector3.new(x, 1.8 + h / 2, -10.9), Vector3.new(0, 0, 1), Vector3.new(5, math.max(1.6, h - 0.6), 0.2), number, color, WHITE)
		return face
	end
	podium(0, 3.6, C3(230, 190, 50), "1")
	podium(-9, 2.5, C3(190, 195, 205), "2")
	podium(9, 1.6, C3(190, 120, 60), "3")
	-- Bleachers on both sides
	for side = -1, 1, 2 do
		for tier = 1, 3 do
			block(parent, "Bleacher", Vector3.new(6, tier * 2, 22), CFrame.new(side * (42 + tier * 6), tier, 0), C3(110, 90, 70), M.Wood)
		end
	end
	prompt(promptAnchor(parent, Vector3.new(0, 1.8, 6)), "Mog Competition", "Enter competition", function(p)
		cb.comp(p)
	end)
	return boardLabel
end

--------------------------------------------------------------------------------
-- Catwalk, Top Moggers board, ground and town
--------------------------------------------------------------------------------
local function buildCatwalk(parent)
	local z1, z2, hw = Config.Runway.MinZ, Config.Runway.MaxZ, Config.Runway.HalfWidth
	local length = z2 - z1
	block(parent, "Catwalk", Vector3.new(hw * 2, 0.6, length), CFrame.new(0, 0.5, (z1 + z2) / 2), WHITE, M.SmoothPlastic)
	for side = -1, 1, 2 do
		block(parent, "CatwalkEdge", Vector3.new(0.6, 0.3, length), CFrame.new(side * (hw - 0.4), 0.9, (z1 + z2) / 2), YELLOW, M.SmoothPlastic, { CanCollide = false })
	end
	for z = z1 + 5, z2 - 5, 10 do
		block(parent, "CatwalkLine", Vector3.new(hw * 2 - 1.5, 0.1, 0.5), CFrame.new(0, 0.85, z), C3(210, 210, 215), M.SmoothPlastic, { CanCollide = false })
	end
	sign(parent, Vector3.new(0, 11, z2 + 4), Vector3.new(0, 0, 1), Vector3.new(24, 5, 0.6), "💃  CATWALK  ·  walk it for Aura", C3(130, 40, 100))
	for side = -1, 1, 2 do
		block(parent, "CatwalkSignPost", Vector3.new(1.2, 12, 1.2), CFrame.new(side * 11, 6, z2 + 4), DARK, M.Metal)
	end
end

local function buildBoard(parent)
	local a = math.rad(148)
	local pos = Vector3.new(math.cos(a) * 132, 11, math.sin(a) * 132)
	local facing = Vector3.new(-math.cos(a), 0, -math.sin(a))
	local face = sign(parent, pos, facing, Vector3.new(34, 18, 0.8), "", C3(30, 40, 70))
	local gui = face:FindFirstChildOfClass("SurfaceGui")
	local title = gui:FindFirstChildOfClass("TextLabel")
	title.Size = UDim2.new(1, 0, 0.2, 0)
	title.Text = "🏆  TOP MOGGERS"
	title.TextColor3 = YELLOW
	local list = Instance.new("TextLabel")
	list.Position = UDim2.fromScale(0.04, 0.22)
	list.Size = UDim2.fromScale(0.92, 0.74)
	list.BackgroundTransparency = 1
	list.Font = Enum.Font.GothamBold
	list.TextSize = 36
	list.TextXAlignment = Enum.TextXAlignment.Left
	list.TextYAlignment = Enum.TextYAlignment.Top
	list.TextColor3 = WHITE
	list.TextStrokeTransparency = 0.3
	list.Text = "Nobody here yet."
	list.Parent = gui
	local tangent = Vector3.new(-math.sin(a), 0, math.cos(a))
	for side = -1, 1, 2 do
		block(parent, "BoardPost", Vector3.new(1.4, 11, 1.4), CFrame.new(pos + tangent * (side * 14) - Vector3.new(0, 5.5, 0)), DARK, M.Metal)
	end
	return list
end

local function buildGround(parent)
	-- Grass field
	block(parent, "Grass", Vector3.new(720, 2, 720), CFrame.new(0, -1, 0), GRASS, M.Grass)
	-- Plaza with a brick border
	disk(parent, "PlazaBorder", Vector3.new(0, 0.18, 0), PLAZA + 4, 0.4, BRICK, M.Brick)
	disk(parent, "Plaza", Vector3.new(0, 0.26, 0), PLAZA, 0.5, CONCRETE, M.Concrete)
	for _, r in { 60, 108 } do
		local ring = disk(parent, "PlazaRing", Vector3.new(0, 0.3, 0), r, 0.1, BRICK, M.Brick)
		ring.CanCollide = false
		local inner = disk(parent, "PlazaRingInner", Vector3.new(0, 0.33, 0), r - 1.5, 0.12, CONCRETE, M.Concrete)
		inner.CanCollide = false
	end
	-- Roads out of the plaza in the four directions, with dashed centre lines
	for _, dir in { Vector3.new(1, 0, 0), Vector3.new(-1, 0, 0), Vector3.new(0, 0, 1), Vector3.new(0, 0, -1) } do
		local mid = dir * (PLAZA + 4 + 90)
		local alongX = dir.X ~= 0
		block(parent, "Road", Vector3.new(alongX and 180 or 20, 0.2, alongX and 20 or 180), CFrame.new(mid.X, 0.1, mid.Z), ASPHALT, M.Asphalt)
		for i = 1, 12 do
			local d = PLAZA + 14 + (i - 1) * 14
			block(parent, "RoadLine", Vector3.new(alongX and 6 or 0.7, 0.05, alongX and 0.7 or 6), CFrame.new(dir.X * d, 0.24, dir.Z * d), YELLOW, M.SmoothPlastic, { CanCollide = false })
		end
	end
	-- Invisible walls around the field
	for _, w in {
		{ Vector3.new(720, 80, 2), Vector3.new(0, 38, 360) },
		{ Vector3.new(720, 80, 2), Vector3.new(0, 38, -360) },
		{ Vector3.new(2, 80, 720), Vector3.new(360, 38, 0) },
		{ Vector3.new(2, 80, 720), Vector3.new(-360, 38, 0) },
	} do
		part(parent, { Name = "EdgeWall", Size = w[1], Position = w[2], Transparency = 1, CanQuery = false })
	end
end

local function buildTown(parent)
	-- Buildings beyond the plaza, away from the roads
	local colors = { C3(206, 190, 160), C3(176, 140, 120), C3(150, 160, 175), C3(190, 170, 130), C3(160, 130, 110) }
	local count = 0
	local attempts = 0
	while count < 22 and attempts < 200 do
		attempts += 1
		local a = rng:NextNumber() * math.pi * 2
		local r = 205 + rng:NextNumber() * 100
		local x, z = math.cos(a) * r, math.sin(a) * r
		if math.abs(x) > 24 and math.abs(z) > 24 then
			count += 1
			building(parent, Vector3.new(x, 0, z), 24 + rng:NextNumber() * 14, 30 + rng:NextNumber() * 40, 22 + rng:NextNumber() * 10, colors[rng:NextInteger(1, #colors)])
		end
	end
	-- Trees on the grass
	local trees = 0
	attempts = 0
	while trees < 70 and attempts < 400 do
		attempts += 1
		local a = rng:NextNumber() * math.pi * 2
		local r = PLAZA + 14 + rng:NextNumber() * 190
		local x, z = math.cos(a) * r, math.sin(a) * r
		if math.abs(x) > 18 and math.abs(z) > 18 then
			trees += 1
			tree(parent, Vector3.new(x, 0, z))
		end
	end
	-- Lamps and benches around the plaza edge
	for i = 1, 20 do
		local a = (i / 20) * math.pi * 2
		lamp(parent, Vector3.new(math.cos(a) * (PLAZA - 6), 0.5, math.sin(a) * (PLAZA - 6)))
	end
	for i = 1, 12 do
		local a = (i / 12) * math.pi * 2 + 0.13
		local pos = Vector3.new(math.cos(a) * (PLAZA - 14), 0.5, math.sin(a) * (PLAZA - 14))
		bench(parent, CFrame.lookAt(pos, Vector3.new(0, 0.5, 0)))
	end
end

--------------------------------------------------------------------------------
-- Coin placement
--------------------------------------------------------------------------------
local function shardSlots(avoid)
	local slots = {}
	local attempts = 0
	while #slots < 150 and attempts < 3000 do
		attempts += 1
		local a = rng:NextNumber() * math.pi * 2
		local r = 8 + math.sqrt(rng:NextNumber()) * (PLAZA - 16)
		local x, z = math.cos(a) * r, math.sin(a) * r
		local ok = true
		for _, zone in avoid do
			if (Vector3.new(x, 0, z) - zone.pos).Magnitude < zone.r then
				ok = false
			end
		end
		if math.abs(x) < 14 and z > 20 and z < 104 then
			ok = false
		end
		if ok then
			table.insert(slots, Vector3.new(x, 3.4, z))
		end
	end
	return slots
end

--------------------------------------------------------------------------------
-- Entry point
--------------------------------------------------------------------------------
function World.build(cb)
	for _, child in workspace:GetChildren() do
		if child.Name == "Baseplate" or child.Name == "SpawnLocation" or child.Name == "GlowWorld" then
			child:Destroy()
		end
	end
	setupLighting()

	local world = Instance.new("Folder")
	world.Name = "GlowWorld"
	world.Parent = workspace

	buildGround(world)
	buildTown(world)
	buildCatwalk(world)
	local boardLabel = buildBoard(world)
	local compBoard = buildStage(world, cb)

	local spawn = Instance.new("SpawnLocation")
	spawn.Anchored = true
	spawn.Size = Vector3.new(12, 1, 12)
	spawn.Position = Vector3.new(0, 0.6, 118)
	spawn.Transparency = 1
	spawn.CanCollide = false
	spawn.Duration = 0
	spawn.Parent = world

	buildGym(world, cb)
	buildStudio(world, cb)
	buildLounge(world, cb)
	buildCrateShop(world, cb)
	local arena = buildRing(world, cb)

	local avoid = { { pos = Vector3.zero, r = 36 }, { pos = Vector3.new(0, 0, 118), r = 8 } }
	for _, angle in { 40, 112, 184, 256, 328 } do
		local pos = stationAt(angle)
		table.insert(avoid, { pos = pos, r = 28 })
	end

	return {
		slots = shardSlots(avoid),
		arena = arena,
		board = boardLabel,
		compBoard = compBoard,
		stage = { center = Vector3.new(0, 1.8, 0) },
	}
end

return World

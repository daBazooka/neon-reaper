-- GLOW UP installer 4 of 7 (server).
-- HOW TO USE: stop any running test, paste this WHOLE script into the Command Bar
-- (the bar at the bottom of Studio) and press Enter. Then run the next installer.
local RS = game:GetService("ReplicatedStorage")
local SSS = game:GetService("ServerScriptService")
local SPS = game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts")

local function remove(parent, name)
	for _, child in parent:GetChildren() do
		if child.Name == name then
			child:Destroy()
		end
	end
end

local function getOrMake(class, name, parent)
	local existing = parent:FindFirstChild(name)
	if existing and existing.ClassName == class then
		return existing
	end
	if existing then
		existing:Destroy()
	end
	local inst = Instance.new(class)
	inst.Name = name
	inst.Parent = parent
	return inst
end

local created = 0
local function put(class, name, parent, source)
	local inst = getOrMake(class, name, parent)
	inst.Source = source
	created += 1
	return inst
end

local modules = getOrMake("Folder", "Modules", SSS:WaitForChild("Main"))
put("ModuleScript", "World", modules, [=====[
-- GLOW UP: builds the whole neon district from code (no models to import).
-- A round plaza with three training stations, a crate shop, a duel arena, a central runway,
-- a Hall of Icons screen, and a glowing skyline around the edge.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local World = {}

local rng = Random.new(2024)
local PLAZA = Config.PlazaRadius
local STATION_RADIUS = 95
local C3 = Color3.fromRGB

local NEON = { C3(90, 214, 255), C3(255, 92, 190), C3(150, 92, 255), C3(255, 204, 84), C3(90, 255, 160) }

--------------------------------------------------------------------------------
-- Part helpers
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

-- A flat cylinder whose top face sits at center.Y.
local function disk(parent, name, center, radius, thickness, color, material)
	return part(parent, {
		Name = name,
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(thickness, radius * 2, radius * 2),
		CFrame = CFrame.new(center.X, center.Y - thickness / 2, center.Z) * CFrame.Angles(0, 0, math.pi / 2),
		Color = color,
		Material = material or Enum.Material.SmoothPlastic,
	})
end

-- A vertical cylinder (axis up) centred at `center`.
local function pillar(parent, name, center, radius, height, color, material)
	return part(parent, {
		Name = name,
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(height, radius * 2, radius * 2),
		CFrame = CFrame.new(center) * CFrame.Angles(0, 0, math.pi / 2),
		Color = color,
		Material = material or Enum.Material.SmoothPlastic,
	})
end

local function sparkles(parent, color, rate, size, speed)
	local e = Instance.new("ParticleEmitter")
	e.Color = ColorSequence.new(color)
	e.LightEmission = 1
	e.Rate = rate
	e.Lifetime = NumberRange.new(1.5, 3)
	e.Speed = NumberRange.new(speed * 0.5, speed)
	e.SpreadAngle = Vector2.new(180, 180)
	e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, size), NumberSequenceKeypoint.new(1, 0) })
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(1, 1) })
	e.Parent = parent
	return e
end

-- A glowing text sign whose front faces `facing`.
local function sign(parent, position, facing, size, text, color, textColor)
	local cf = CFrame.lookAt(position, position + facing)
	local back = part(parent, {
		Name = "SignGlow",
		Size = size + Vector3.new(0.8, 0.8, 0),
		CFrame = cf * CFrame.new(0, 0, 0.3),
		Color = color,
		Material = Enum.Material.Neon,
		CanCollide = false,
	})
	local face = part(parent, {
		Name = "Sign",
		Size = size,
		CFrame = cf,
		Color = C3(14, 10, 34),
		Material = Enum.Material.SmoothPlastic,
		CanCollide = false,
	})
	local gui = Instance.new("SurfaceGui")
	gui.Face = Enum.NormalId.Front
	gui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	gui.CanvasSize = Vector2.new(size.X * 50, size.Y * 50)
	gui.LightInfluence = 0
	gui.Brightness = 1.5
	gui.Parent = face
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBlack
	label.TextScaled = true
	label.TextColor3 = textColor or color
	label.Text = text
	label.Parent = gui
	return face, label, back
end

local function prompt(parent, objectText, actionText, onTriggered)
	local p = Instance.new("ProximityPrompt")
	p.ObjectText = objectText
	p.ActionText = actionText
	p.HoldDuration = 0
	p.KeyboardKeyCode = Enum.KeyCode.E
	p.MaxActivationDistance = 16
	p.RequiresLineOfSight = false
	p.Exclusivity = Enum.ProximityPromptExclusivity.OnePerButton
	p.Parent = parent
	p.Triggered:Connect(function(player)
		onTriggered(player)
	end)
	return p
end

--------------------------------------------------------------------------------
-- Lighting
--------------------------------------------------------------------------------
local function setupLighting()
	Lighting.ClockTime = 0
	Lighting.Brightness = 1.6
	Lighting.Ambient = C3(70, 48, 120)
	Lighting.OutdoorAmbient = C3(80, 58, 140)
	Lighting.GlobalShadows = true

	-- Remove the template's default effects so they don't fight with ours.
	for _, child in Lighting:GetChildren() do
		if
			child:IsA("Atmosphere")
			or child:IsA("BloomEffect")
			or child:IsA("ColorCorrectionEffect")
			or child:IsA("SunRaysEffect")
			or child:IsA("DepthOfFieldEffect")
			or child:IsA("BlurEffect")
		then
			child:Destroy()
		end
	end

	local atmo = Instance.new("Atmosphere")
	atmo.Name = "GlowAtmosphere"
	atmo.Density = 0.32
	atmo.Color = C3(160, 112, 255)
	atmo.Decay = C3(70, 30, 130)
	atmo.Haze = 1.4
	atmo.Parent = Lighting

	local bloom = Instance.new("BloomEffect")
	bloom.Name = "GlowBloom"
	bloom.Intensity = 1.1
	bloom.Size = 26
	bloom.Threshold = 0.85
	bloom.Parent = Lighting

	local tint = Instance.new("ColorCorrectionEffect")
	tint.Name = "GlowTint"
	tint.Saturation = 0.22
	tint.Contrast = 0.1
	tint.Parent = Lighting
end

--------------------------------------------------------------------------------
-- Stations
--------------------------------------------------------------------------------
local function stationFrame(parent, name, angle, color, signText)
	local a = math.rad(angle)
	local pos = Vector3.new(math.cos(a) * STATION_RADIUS, 0, math.sin(a) * STATION_RADIUS)
	local inward = Vector3.new(-math.cos(a), 0, -math.sin(a))
	local tangent = Vector3.new(-math.sin(a), 0, math.cos(a))
	local model = Instance.new("Folder")
	model.Name = name
	model.Parent = parent

	disk(model, "Glow", pos + Vector3.new(0, 0.3, 0), 17.8, 0.6, color, Enum.Material.Neon)
	disk(model, "Base", pos + Vector3.new(0, 0.5, 0), 17, 1, C3(24, 19, 52))
	sign(model, pos - inward * 13 + Vector3.new(0, 11, 0), inward, Vector3.new(18, 5, 0.6), signText, color, C3(255, 255, 255))
	-- two glowing posts holding the sign up
	for side = -1, 1, 2 do
		part(model, {
			Name = "Post",
			Size = Vector3.new(0.8, 9, 0.8),
			Position = pos - inward * 13 + tangent * (side * 8.5) + Vector3.new(0, 4.5, 0),
			Color = color,
			Material = Enum.Material.Neon,
			CanCollide = false,
		})
	end
	return model, pos, inward, tangent
end

local function promptPart(parent, pos)
	return part(parent, {
		Name = "PromptAnchor",
		Size = Vector3.new(4, 2, 4),
		Position = pos + Vector3.new(0, 2.5, 0),
		Transparency = 1,
		CanCollide = false,
		CanQuery = false,
	})
end

local function buildGym(parent, cb)
	local color = Config.Stats.Power.Color
	local model, pos, inward = stationFrame(parent, "Gym", 20, color, "💪  GYM")
	local orient = CFrame.lookAt(pos, pos + inward)
	part(model, { Name = "Bench", Size = Vector3.new(6, 1.2, 2.2), CFrame = orient * CFrame.new(0, 1.6, 0), Color = C3(40, 32, 80) })
	part(model, { Name = "BenchGlow", Size = Vector3.new(6.2, 0.2, 0.4), CFrame = orient * CFrame.new(0, 2.25, 1), Color = color, Material = Enum.Material.Neon })
	local barCf = orient * CFrame.new(0, 5.2, 0)
	part(model, { Name = "Bar", Shape = Enum.PartType.Cylinder, Size = Vector3.new(10, 0.5, 0.5), CFrame = barCf, Color = C3(200, 205, 225), Material = Enum.Material.Metal })
	for side = -1, 1, 2 do
		part(model, { Name = "Plate", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.8, 3.6, 3.6), CFrame = barCf * CFrame.new(side * 4.2, 0, 0), Color = C3(30, 26, 60), Material = Enum.Material.Metal })
		part(model, { Name = "PlateGlow", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.5, 2.2, 2.2), CFrame = barCf * CFrame.new(side * 4.7, 0, 0), Color = color, Material = Enum.Material.Neon })
	end
	prompt(promptPart(model, pos), "Gym", "Train Power", function(p)
		cb.train(p, "Power")
	end)
end

local function buildStudio(parent, cb)
	local color = Config.Stats.Style.Color
	local model, pos, inward, tangent = stationFrame(parent, "StyleStudio", 92, color, "💅  STYLE STUDIO")
	for i = -1, 1 do
		local at = pos + tangent * (i * 7) - inward * 6 + Vector3.new(0, 5, 0)
		local cf = CFrame.lookAt(at, at + inward)
		part(model, { Name = "Mirror", Size = Vector3.new(5, 9, 0.4), CFrame = cf, Color = C3(190, 220, 255), Material = Enum.Material.Glass, Transparency = 0.35, Reflectance = 0.3 })
		for side = -1, 1, 2 do
			part(model, { Name = "MirrorFrame", Size = Vector3.new(0.35, 9.4, 0.5), CFrame = cf * CFrame.new(side * 2.6, 0, 0), Color = color, Material = Enum.Material.Neon })
		end
		part(model, { Name = "MirrorFrameTop", Size = Vector3.new(5.6, 0.35, 0.5), CFrame = cf * CFrame.new(0, 4.6, 0), Color = color, Material = Enum.Material.Neon })
	end
	local seat = CFrame.lookAt(pos + Vector3.new(0, 0, 0), pos + inward * -1)
	part(model, { Name = "ChairSeat", Size = Vector3.new(3, 1, 3), CFrame = seat * CFrame.new(0, 1.6, 0), Color = C3(60, 40, 110) })
	part(model, { Name = "ChairBack", Size = Vector3.new(3, 3.5, 0.6), CFrame = seat * CFrame.new(0, 3.4, 1.2), Color = color, Material = Enum.Material.Neon })
	prompt(promptPart(model, pos), "Style Studio", "Train Style", function(p)
		cb.train(p, "Style")
	end)
end

local function buildLounge(parent, cb)
	local color = Config.Stats.Charm.Color
	local model, pos, inward, tangent = stationFrame(parent, "CharmLounge", 164, color, "✨  CHARM LOUNGE")
	local orient = CFrame.lookAt(pos - inward * 5, pos)
	part(model, { Name = "SofaSeat", Size = Vector3.new(9, 1.4, 3.6), CFrame = orient * CFrame.new(0, 1.7, 0), Color = C3(60, 40, 120) })
	part(model, { Name = "SofaBack", Size = Vector3.new(9, 3, 0.9), CFrame = orient * CFrame.new(0, 3.2, 1.6), Color = C3(80, 52, 150) })
	for side = -1, 1, 2 do
		part(model, { Name = "SofaArm", Size = Vector3.new(0.9, 2.4, 3.6), CFrame = orient * CFrame.new(side * 4.6, 2.4, 0), Color = C3(80, 52, 150) })
	end
	for i = 1, 6 do
		local a = (i / 6) * math.pi * 2
		local orb = part(model, {
			Name = "CharmOrb",
			Shape = Enum.PartType.Ball,
			Size = Vector3.one * (1 + (i % 3) * 0.4),
			Position = pos + Vector3.new(math.cos(a) * 9, 5 + (i % 3) * 2, math.sin(a) * 9),
			Color = color,
			Material = Enum.Material.Neon,
			CanCollide = false,
		})
		sparkles(orb, color, 5, 0.4, 1)
	end
	prompt(promptPart(model, pos), "Charm Lounge", "Train Charm", function(p)
		cb.train(p, "Charm")
	end)
end

local function buildCrateShop(parent, cb)
	local color = C3(255, 204, 84)
	local model, pos = stationFrame(parent, "CrateShop", 236, color, "🎁  GLOW CRATES")
	pillar(model, "Pedestal", pos + Vector3.new(0, 2.5, 0), 5, 4, C3(30, 24, 66), Enum.Material.SmoothPlastic)
	disk(model, "PedestalTop", pos + Vector3.new(0, 4.6, 0), 5.4, 0.4, color, Enum.Material.Neon)
	for i, crate in Config.Crates do
		local a = (i / #Config.Crates) * math.pi * 2
		local cube = part(model, {
			Name = "CrateModel",
			Size = Vector3.one * 2.6,
			CFrame = CFrame.new(pos + Vector3.new(math.cos(a) * 2.8, 7.2 + (i % 2) * 0.8, math.sin(a) * 2.8)) * CFrame.Angles(0.4, a, 0.3),
			Color = crate.Color,
			Material = Enum.Material.Neon,
			CanCollide = false,
		})
		sparkles(cube, crate.Color, 8, 0.5, 2)
	end
	part(model, {
		Name = "Beam",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(40, 4, 4),
		CFrame = CFrame.new(pos + Vector3.new(0, 24, 0)) * CFrame.Angles(0, 0, math.pi / 2),
		Color = color,
		Material = Enum.Material.Neon,
		Transparency = 0.85,
		CanCollide = false,
	})
	prompt(promptPart(model, pos), "Glow Crates", "Open shop", function(p)
		cb.crates(p)
	end)
end

local function buildMannequin(parent, at, facing, cb)
	local model = Instance.new("Model")
	model.Name = "MoggerBot"
	model.Parent = parent
	local cf = CFrame.lookAt(at, at + facing)
	local metal = C3(200, 205, 230)
	local torso = part(model, { Name = "Torso", Size = Vector3.new(2.4, 3, 1.2), CFrame = cf * CFrame.new(0, 4.6, 0), Color = metal, Material = Enum.Material.Metal })
	part(model, { Name = "Head", Shape = Enum.PartType.Ball, Size = Vector3.one * 1.9, CFrame = cf * CFrame.new(0, 7, 0), Color = metal, Material = Enum.Material.Metal })
	part(model, { Name = "Visor", Size = Vector3.new(1.7, 0.4, 0.3), CFrame = cf * CFrame.new(0, 7.1, -0.85), Color = C3(255, 70, 160), Material = Enum.Material.Neon })
	for side = -1, 1, 2 do
		part(model, { Name = "Arm", Size = Vector3.new(0.8, 3, 0.8), CFrame = cf * CFrame.new(side * 1.7, 4.6, 0), Color = metal, Material = Enum.Material.Metal })
		part(model, { Name = "Leg", Size = Vector3.new(1, 3.2, 1), CFrame = cf * CFrame.new(side * 0.7, 1.6, 0), Color = metal, Material = Enum.Material.Metal })
	end
	part(model, { Name = "ChestGlow", Size = Vector3.new(1.4, 0.4, 0.2), CFrame = cf * CFrame.new(0, 5.2, -0.65), Color = C3(255, 70, 160), Material = Enum.Material.Neon })
	local tag = Instance.new("BillboardGui")
	tag.Size = UDim2.fromOffset(200, 40)
	tag.StudsOffset = Vector3.new(0, 4.2, 0)
	tag.MaxDistance = 80
	tag.Adornee = torso
	tag.Parent = torso
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBlack
	label.TextSize = 20
	label.TextColor3 = C3(255, 120, 200)
	label.TextStrokeTransparency = 0.4
	label.Text = "MOGGER BOT"
	label.Parent = tag
	prompt(torso, "Mogger Bot", "Duel", function(p)
		cb.duelBot(p)
	end)
end

local function buildArena(parent, cb)
	local color = C3(255, 92, 190)
	local model, pos, inward, tangent = stationFrame(parent, "DuelArena", 308, color, "⚔️  DUEL ARENA")
	disk(model, "Step", pos + Vector3.new(0, 0.9, 0), 26, 0.8, C3(30, 24, 66))
	disk(model, "RimGlow", pos + Vector3.new(0, 1.55, 0), 24.8, 0.3, color, Enum.Material.Neon)
	disk(model, "Floor", pos + Vector3.new(0, 1.6, 0), 24, 0.7, C3(18, 14, 42))
	local padA = pos + tangent * 12 + Vector3.new(0, 1.65, 0)
	local padB = pos - tangent * 12 + Vector3.new(0, 1.65, 0)
	disk(model, "PadA", padA, 4, 0.2, C3(90, 214, 255), Enum.Material.Neon).CanCollide = false
	disk(model, "PadB", padB, 4, 0.2, C3(255, 92, 190), Enum.Material.Neon).CanCollide = false
	for i = 1, 4 do
		local a = (i / 4) * math.pi * 2 + math.pi / 4
		local post = Vector3.new(pos.X + math.cos(a) * 22, 0, pos.Z + math.sin(a) * 22)
		part(model, { Name = "Post", Size = Vector3.new(1.2, 7, 1.2), Position = post + Vector3.new(0, 5, 0), Color = C3(30, 24, 66) })
		part(model, { Name = "PostLight", Size = Vector3.new(1.6, 0.8, 1.6), Position = post + Vector3.new(0, 8.6, 0), Color = color, Material = Enum.Material.Neon })
	end
	prompt(promptPart(model, pos + Vector3.new(0, 1.6, 0)), "Duel Arena", "Find a duel", function(p)
		cb.duelQueue(p)
	end)
	buildMannequin(model, pos + inward * 14 + Vector3.new(0, 1.6, 0), -inward, cb)
	local center = pos + Vector3.new(0, 1.6, 0)
	return { padA = CFrame.new(padA), padB = CFrame.new(padB), center = center }, pos
end

--------------------------------------------------------------------------------
-- Runway, board, ground, skyline
--------------------------------------------------------------------------------
local function buildRunway(parent)
	local L, W = Config.Runway.Length, Config.Runway.Width
	part(parent, { Name = "Runway", Size = Vector3.new(L, 0.5, W), Position = Vector3.new(0, 0.25, 0), Color = C3(16, 12, 38), Reflectance = 0.12 })
	for side = -1, 1, 2 do
		part(parent, { Name = "RunwayEdge", Size = Vector3.new(L, 0.3, 0.6), Position = Vector3.new(0, 0.5, side * (W / 2)), Color = side < 0 and C3(90, 214, 255) or C3(255, 92, 190), Material = Enum.Material.Neon, CanCollide = false })
	end
	for x = -L / 2 + 4, L / 2 - 4, 8 do
		part(parent, { Name = "RunwayStripe", Size = Vector3.new(0.6, 0.08, W - 2), Position = Vector3.new(x, 0.52, 0), Color = C3(255, 255, 255), Material = Enum.Material.Neon, Transparency = 0.55, CanCollide = false })
	end
	disk(parent, "StageGlow", Vector3.new(L / 2 + 14, 0.35, 0), 12.6, 0.4, C3(255, 92, 190), Enum.Material.Neon)
	disk(parent, "Stage", Vector3.new(L / 2 + 14, 0.7, 0), 12, 0.7, C3(22, 17, 50))
	for i, color in { C3(255, 92, 190), C3(90, 214, 255), C3(255, 255, 255) } do
		part(parent, {
			Name = "Spotlight",
			Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(60, 4 + i, 4 + i),
			CFrame = CFrame.new(L / 2 + 14 + (i - 2) * 6, 31, 0) * CFrame.Angles(0, 0, math.pi / 2),
			Color = color,
			Material = Enum.Material.Neon,
			Transparency = 0.88,
			CanCollide = false,
		})
	end
	sign(parent, Vector3.new(-L / 2 - 4, 12, 0), Vector3.new(1, 0, 0), Vector3.new(18, 5, 0.6), "💃  RUNWAY", C3(255, 92, 190), C3(255, 255, 255))
end

local function buildBoard(parent)
	local a = math.rad(272)
	local pos = Vector3.new(math.cos(a) * 138, 11, math.sin(a) * 138)
	local face, _, _ = sign(parent, pos, Vector3.new(-math.cos(a), 0, -math.sin(a)), Vector3.new(34, 18, 0.8), "", C3(150, 92, 255))
	local gui = face:FindFirstChildOfClass("SurfaceGui")
	local title = gui:FindFirstChildOfClass("TextLabel")
	title.Size = UDim2.new(1, 0, 0.2, 0)
	title.Text = "🏆 HALL OF ICONS"
	title.TextColor3 = C3(255, 204, 84)
	local list = Instance.new("TextLabel")
	list.Position = UDim2.fromScale(0.04, 0.22)
	list.Size = UDim2.fromScale(0.92, 0.74)
	list.BackgroundTransparency = 1
	list.Font = Enum.Font.GothamBold
	list.TextSize = 36
	list.TextXAlignment = Enum.TextXAlignment.Left
	list.TextYAlignment = Enum.TextYAlignment.Top
	list.TextColor3 = C3(235, 230, 255)
	list.Text = "Be the first Icon."
	list.Parent = gui
	for side = -1, 1, 2 do
		part(parent, {
			Name = "BoardPost",
			Size = Vector3.new(1, 11, 1),
			Position = pos + Vector3.new(0, -5.5, 0) + Vector3.new(-math.sin(a), 0, math.cos(a)) * (side * 12),
			Color = C3(30, 24, 66),
		})
	end
	return list
end

local function buildGround(parent)
	disk(parent, "PlazaRim", Vector3.new(0, -0.4, 0), PLAZA + 3, 1.5, C3(130, 90, 255), Enum.Material.Neon)
	disk(parent, "Plaza", Vector3.new(0, 0, 0), PLAZA, 4, C3(22, 17, 48))
	for _, r in { 40, 80, 120, 150 } do
		local ring = disk(parent, "GridRing", Vector3.new(0, 0.06, 0), r, 0.12, C3(110, 80, 230), Enum.Material.Neon)
		ring.CanCollide = false
		ring.Transparency = 0.45
		local inner = disk(parent, "GridRingInner", Vector3.new(0, 0.08, 0), r - 0.5, 0.14, C3(22, 17, 48))
		inner.CanCollide = false
	end
	for i = 1, 12 do
		local a = (i / 12) * math.pi * 2
		part(parent, {
			Name = "GridSpoke",
			Size = Vector3.new(100, 0.1, 0.35),
			CFrame = CFrame.new(math.cos(a) * 75, 0.1, math.sin(a) * 75) * CFrame.Angles(0, -a, 0),
			Color = C3(110, 80, 230),
			Material = Enum.Material.Neon,
			Transparency = 0.5,
			CanCollide = false,
		})
	end
	-- Invisible wall so nobody wanders off the edge.
	for i = 1, 48 do
		local a = (i / 48) * math.pi * 2
		part(parent, {
			Name = "EdgeWall",
			Size = Vector3.new(22, 60, 2),
			CFrame = CFrame.new(math.cos(a) * (PLAZA + 2), 28, math.sin(a) * (PLAZA + 2)) * CFrame.Angles(0, -a + math.pi / 2, 0),
			Transparency = 1,
			CanQuery = false,
		})
	end
	local fireflies = part(parent, {
		Name = "Fireflies",
		Size = Vector3.new(PLAZA * 2, 40, PLAZA * 2),
		Position = Vector3.new(0, 22, 0),
		Transparency = 1,
		CanCollide = false,
		CanQuery = false,
		CanTouch = false,
	})
	sparkles(fireflies, C3(190, 170, 255), 60, 0.5, 2)
end

local function buildSkyline(parent)
	local words = { "GLOW UP", "AURA", "ICON", "MOG", "RIZZ", "MAIN CHARACTER" }
	local signed = 0
	for i = 1, 44 do
		local a = (i / 44) * math.pi * 2 + rng:NextNumber() * 0.08
		local radius = 190 + rng:NextNumber() * 55
		local w = 16 + rng:NextNumber() * 20
		local h = 50 + rng:NextNumber() * 130
		local x, z = math.cos(a) * radius, math.sin(a) * radius
		part(parent, { Name = "Tower", Size = Vector3.new(w, h, w), Position = Vector3.new(x, h / 2 - 2, z), Color = C3(16, 13, 38) })
		local bandCount = rng:NextInteger(2, 5)
		for b = 1, bandCount do
			part(parent, {
				Name = "TowerBand",
				Size = Vector3.new(w + 0.4, 0.9, w + 0.4),
				Position = Vector3.new(x, (h / (bandCount + 1)) * b, z),
				Color = NEON[rng:NextInteger(1, #NEON)],
				Material = Enum.Material.Neon,
				CanCollide = false,
			})
		end
		if signed < #words and i % 7 == 0 then
			signed += 1
			local inward = Vector3.new(-math.cos(a), 0, -math.sin(a))
			sign(parent, Vector3.new(x, h * 0.7, z) + inward * (w / 2 + 0.6), inward, Vector3.new(w * 0.9, 9, 0.6), words[signed], NEON[(signed % #NEON) + 1], C3(255, 255, 255))
		end
	end
end

--------------------------------------------------------------------------------
-- Shard placement
--------------------------------------------------------------------------------
local function shardSlots(stationCenters)
	local slots = {}
	local attempts = 0
	while #slots < 140 and attempts < 2000 do
		attempts += 1
		local a = rng:NextNumber() * math.pi * 2
		local r = 10 + math.sqrt(rng:NextNumber()) * (PLAZA - 22)
		local x, z = math.cos(a) * r, math.sin(a) * r
		local ok = not (math.abs(x) < 48 and math.abs(z) < 12) and not (x > 40 and x < 80 and math.abs(z) < 16)
		for _, c in stationCenters do
			if (Vector3.new(x, 0, z) - c).Magnitude < 22 then
				ok = false
			end
		end
		if ok then
			table.insert(slots, Vector3.new(x, 3.2, z))
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
	buildRunway(world)
	buildSkyline(world)
	local boardLabel = buildBoard(world)

	local spawn = Instance.new("SpawnLocation")
	spawn.Anchored = true
	spawn.Size = Vector3.new(10, 1, 10)
	spawn.Position = Vector3.new(0, 0.5, 28)
	spawn.Transparency = 1
	spawn.CanCollide = false
	spawn.Duration = 0
	spawn.Parent = world
	disk(world, "SpawnGlow", Vector3.new(0, 0.12, 28), 6, 0.1, C3(90, 214, 255), Enum.Material.Neon).CanCollide = false

	buildGym(world, cb)
	buildStudio(world, cb)
	buildLounge(world, cb)
	buildCrateShop(world, cb)
	local arena, arenaPos = buildArena(world, cb)

	local centers = {}
	for _, angle in { 20, 92, 164, 236, 308 } do
		local a = math.rad(angle)
		table.insert(centers, Vector3.new(math.cos(a) * STATION_RADIUS, 0, math.sin(a) * STATION_RADIUS))
	end

	return { slots = shardSlots(centers), arena = arena, board = boardLabel }
end

return World
]=====])
print("GLOW UP installer 4/7 done (" .. created .. " scripts). Now run installer 5.")

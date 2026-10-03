-- SUB 5 TO TRUE ADAM: everything you would find in a real gym, built from parts: a big dumbbell rack (5 kg to 100 kg),
-- bench press, squat rack, cable machine, plate trees, kettlebells, a punching bag, mirrors and a glowing LIFT pad in
-- the middle where training happens. All local to the gym's frame `cf` (floor top at y = 0.9, entrance toward -Z).
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local GymEquipment = {}

local M = Enum.Material
local C3 = Color3.fromRGB
local CYL, BALL = Enum.PartType.Cylinder, Enum.PartType.Ball
local FLOOR = 0.9

local STEEL = C3(205, 210, 220)
local DARKSTEEL = C3(58, 60, 70)
local BLACK = C3(30, 30, 36)
local RED = C3(210, 55, 50)
local YELLOW = C3(255, 214, 70)

local function make(parent, props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false -- decoration never blocks players or the camera
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = M.SmoothPlastic
	for k, v in props do
		p[k] = v
	end
	p.Parent = parent
	return p
end

local function box(parent, name, size, cf, color, material, extra)
	local props = { Name = name, Size = size, CFrame = cf, Color = color, Material = material or M.SmoothPlastic }
	if extra then
		for k, v in extra do
			props[k] = v
		end
	end
	return make(parent, props)
end

-- Cylinder whose long axis is cf's X axis (pass cf * CFrame.Angles(0, 0, math.pi / 2) for an upright one).
local function cyl(parent, name, cf, length, diameter, color, material, extra)
	local props = { Name = name, Shape = CYL, Size = Vector3.new(length, diameter, diameter), CFrame = cf, Color = color, Material = material or M.Metal }
	if extra then
		for k, v in extra do
			props[k] = v
		end
	end
	return make(parent, props)
end

local function upright(parent, name, cf, height, diameter, color, material)
	return cyl(parent, name, cf * CFrame.Angles(0, 0, math.pi / 2), height, diameter, color, material)
end

local function ball(parent, name, cf, diameter, color, material)
	return make(parent, { Name = name, Shape = BALL, Size = Vector3.one * diameter, CFrame = cf, Color = color, Material = material or M.Metal })
end

-- A cylinder stretched between two world points (cables, chains).
local function rod(parent, name, a, b, thickness, color, material)
	local length = (a - b).Magnitude
	if length < 0.05 then
		return nil
	end
	return cyl(parent, name, CFrame.lookAt((a + b) / 2, b) * CFrame.Angles(0, math.pi / 2, 0), length, thickness, color, material or M.Metal)
end

local function surfaceText(part, face, text, color, size, scaled)
	local gui = Instance.new("SurfaceGui")
	gui.Face = face
	gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	gui.PixelsPerStud = 40
	gui.LightInfluence = 0.3
	gui.Parent = part
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBlack
	label.TextScaled = scaled ~= false
	label.TextSize = size or 24
	label.TextColor3 = color or C3(255, 255, 255)
	label.Text = text
	label.Parent = gui
	return label
end

local function glow(parent, color, range, brightness)
	local light = Instance.new("PointLight")
	light.Color = color
	light.Range = range
	light.Brightness = brightness
	light.Parent = parent
	return light
end

--------------------------------------------------------------------------------
-- Dumbbell rack on the back wall: 16 pairs from 5 kg to 100 kg, bigger heads and a new colour every step
--------------------------------------------------------------------------------
local RACK_KG = { 5, 7.5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100 }

local function dumbbell(parent, at, headDiameter, color, neon)
	local material = neon and M.Neon or M.Metal
	cyl(parent, "DumbbellHandle", at, 1.5, 0.22, STEEL, M.Metal)
	for _, side in { -1, 1 } do
		cyl(parent, "DumbbellHead", at * CFrame.new(side * 0.62, 0, 0), 0.5, headDiameter, color, material)
		cyl(parent, "DumbbellCap", at * CFrame.new(side * 0.92, 0, 0), 0.18, headDiameter * 0.5, STEEL, M.Metal)
	end
end

local function dumbbellRack(parent, cf)
	local z = 13.0
	for _, x in { -11.2, 11.2 } do
		box(parent, "RackUpright", Vector3.new(0.6, 7.2, 1.9), cf * CFrame.new(x, FLOOR + 3.6, z), DARKSTEEL, M.Metal)
		box(parent, "RackFoot", Vector3.new(0.9, 0.3, 2.6), cf * CFrame.new(x, FLOOR + 0.15, z), BLACK, M.Metal)
	end
	box(parent, "RackTopBar", Vector3.new(23, 0.5, 0.6), cf * CFrame.new(0, FLOOR + 7.0, z + 0.5), RED, M.Metal)
	local trays = { FLOOR + 1.0, FLOOR + 3.7 }
	for row, trayY in trays do
		box(parent, "RackTray", Vector3.new(22.4, 0.3, 2.0), cf * CFrame.new(0, trayY, z), DARKSTEEL, M.Metal)
		local strip = box(parent, "RackLabelStrip", Vector3.new(22.4, 0.8, 0.2), cf * CFrame.new(0, trayY - 0.5, z - 1.0), BLACK, M.SmoothPlastic)
		local gui = Instance.new("SurfaceGui")
		gui.Face = Enum.NormalId.Front
		gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
		gui.PixelsPerStud = 40
		gui.Parent = strip
		for col = 1, 8 do
			local j = (row - 1) * 8 + col
			local lbl = Instance.new("TextLabel")
			lbl.Position = UDim2.fromScale((col - 1) / 8, 0)
			lbl.Size = UDim2.fromScale(1 / 8, 1)
			lbl.BackgroundTransparency = 1
			lbl.Font = Enum.Font.GothamBlack
			lbl.TextScaled = true
			lbl.TextColor3 = YELLOW
			lbl.Text = tostring(RACK_KG[j])
			lbl.Parent = gui
		end
	end
	for row, trayY in trays do
		for col = 1, 8 do
			local j = (row - 1) * 8 + col
			local tier = Config.Weights[math.min(#Config.Weights, math.ceil(j / 2))]
			local d = row == 1 and (0.8 + 0.13 * col) or (1.5 + 0.1 * col)
			local x = -9.8 + (col - 1) * 2.8
			dumbbell(parent, cf * CFrame.new(x, trayY + 0.15 + d / 2, z), d, tier.Color, tier.Neon)
		end
	end
end

--------------------------------------------------------------------------------
-- Mirror wall with a neon slogan
--------------------------------------------------------------------------------
local function mirrorWall(parent, cf)
	local z = 14.82
	box(parent, "MirrorGlass", Vector3.new(24, 9.2, 0.15), cf * CFrame.new(0, FLOOR + 4.9, z), C3(190, 215, 235), M.Glass, { Transparency = 0.35, Reflectance = 0.35 })
	for _, y in { FLOOR + 0.2, FLOOR + 9.6 } do
		box(parent, "MirrorFrame", Vector3.new(24.6, 0.4, 0.3), cf * CFrame.new(0, y, z - 0.05), RED, M.Metal)
	end
	for _, x in { -12.2, 12.2 } do
		box(parent, "MirrorFrame", Vector3.new(0.4, 9.8, 0.3), cf * CFrame.new(x, FLOOR + 4.9, z - 0.05), RED, M.Metal)
	end
	local sign = box(parent, "NeonSign", Vector3.new(15, 1.7, 0.2), cf * CFrame.new(0, FLOOR + 11.3, z - 0.1), C3(25, 10, 12), M.SmoothPlastic)
	surfaceText(sign, Enum.NormalId.Front, "NO PAIN  ·  NO GAIN", C3(255, 90, 80))
	glow(sign, C3(255, 90, 80), 22, 0.8)
end

--------------------------------------------------------------------------------
-- The glowing LIFT pad: a wooden platform with a neon dumbbell inlaid in the rubber
--------------------------------------------------------------------------------
local function liftPad(parent, cf)
	local c = cf * CFrame.new(Config.GymPadLocal.X, 0, Config.GymPadLocal.Z)
	box(parent, "LiftPlatform", Vector3.new(12, 0.3, 12), c * CFrame.new(0, FLOOR + 0.15, 0), C3(150, 108, 70), M.WoodPlanks)
	box(parent, "LiftRubber", Vector3.new(10.4, 0.06, 10.4), c * CFrame.new(0, FLOOR + 0.32, 0), C3(32, 32, 38), M.Rubber)
	local top = FLOOR + 0.37
	for _, s in { -1, 1 } do
		box(parent, "PadBorder", Vector3.new(11.2, 0.06, 0.35), c * CFrame.new(0, top, s * 5.4), YELLOW, M.Neon)
		box(parent, "PadBorder", Vector3.new(0.35, 0.06, 10.5), c * CFrame.new(s * 5.4, top, 0), YELLOW, M.Neon)
	end
	-- the inlaid dumbbell (identical from every side, so it never reads upside down)
	box(parent, "PadHandle", Vector3.new(4.2, 0.06, 0.55), c * CFrame.new(0, top, 0), YELLOW, M.Neon)
	for _, s in { -1, 1 } do
		box(parent, "PadHead", Vector3.new(0.9, 0.06, 3.2), c * CFrame.new(s * 2.2, top, 0), YELLOW, M.Neon)
		box(parent, "PadHead", Vector3.new(0.6, 0.06, 2.2), c * CFrame.new(s * 3.0, top, 0), YELLOW, M.Neon)
	end
	local lamp = box(parent, "PadLight", Vector3.one * 0.4, c * CFrame.new(0, FLOOR + 6, 0), YELLOW, M.Neon, { Transparency = 1 })
	glow(lamp, YELLOW, 28, 1.2)
end

--------------------------------------------------------------------------------
-- Bench press (left side)
--------------------------------------------------------------------------------
local function plateSet(parent, at, side, sizes)
	local x = 2.7
	for i, d in sizes do
		local colour = i == 1 and RED or (i == 2 and C3(60, 110, 220) or BLACK)
		cyl(parent, "BarPlate", at * CFrame.new(side * x, 0, 0), 0.42, d, colour, M.Metal)
		x += 0.5
	end
	cyl(parent, "BarCollar", at * CFrame.new(side * (x + 0.05), 0, 0), 0.22, 0.6, STEEL, M.Metal)
end

local function benchPress(parent, cf)
	local c = cf * CFrame.new(-8.6, 0, -3)
	box(parent, "BenchPad", Vector3.new(1.5, 0.55, 5.6), c * CFrame.new(0, FLOOR + 1.95, 0), BLACK, M.Leather)
	box(parent, "BenchStripe", Vector3.new(0.3, 0.57, 5.6), c * CFrame.new(0, FLOOR + 1.96, 0), RED, M.Leather)
	for _, z in { -2.2, 2.2 } do
		box(parent, "BenchLeg", Vector3.new(2.4, 0.3, 0.4), c * CFrame.new(0, FLOOR + 0.15, z), DARKSTEEL, M.Metal)
		box(parent, "BenchPost", Vector3.new(0.4, 1.6, 0.4), c * CFrame.new(0, FLOOR + 1.1, z), DARKSTEEL, M.Metal)
	end
	for _, x in { -2.0, 2.0 } do
		box(parent, "BenchUpright", Vector3.new(0.5, 4.2, 0.5), c * CFrame.new(x, FLOOR + 2.1, 2.9), DARKSTEEL, M.Metal)
		box(parent, "BenchHook", Vector3.new(0.6, 0.25, 0.9), c * CFrame.new(x, FLOOR + 3.55, 2.65), RED, M.Metal)
		box(parent, "BenchFoot", Vector3.new(0.7, 0.3, 2.4), c * CFrame.new(x, FLOOR + 0.15, 2.9), BLACK, M.Metal)
	end
	local bar = c * CFrame.new(0, FLOOR + 3.85, 2.65)
	cyl(parent, "Barbell", bar, 7.4, 0.24, STEEL, M.Metal)
	for _, side in { -1, 1 } do
		plateSet(parent, bar, side, { 3.0, 2.6, 2.1 })
	end
	box(parent, "BenchMat", Vector3.new(7, 0.06, 8.6), c * CFrame.new(0, FLOOR + 0.05, 0), C3(40, 40, 46), M.Rubber)
end

--------------------------------------------------------------------------------
-- Squat rack (right side)
--------------------------------------------------------------------------------
local function squatRack(parent, cf)
	local c = cf * CFrame.new(9.6, 0, 6)
	box(parent, "SquatMat", Vector3.new(10.5, 0.06, 8), c * CFrame.new(0, FLOOR + 0.05, 0), C3(38, 38, 44), M.Rubber)
	box(parent, "SquatWood", Vector3.new(8.4, 0.12, 5), c * CFrame.new(0, FLOOR + 0.11, 0), C3(150, 108, 70), M.WoodPlanks)
	for _, side in { -1, 1 } do
		box(parent, "RackUpright", Vector3.new(0.6, 8.4, 0.6), c * CFrame.new(side * 2.6, FLOOR + 4.2, 0), DARKSTEEL, M.Metal)
		box(parent, "RackFoot", Vector3.new(0.8, 0.3, 4), c * CFrame.new(side * 2.6, FLOOR + 0.15, 0), BLACK, M.Metal)
		box(parent, "RackHook", Vector3.new(0.7, 0.25, 1.0), c * CFrame.new(side * 2.6, FLOOR + 5.9, -0.7), RED, M.Metal)
		box(parent, "SafetyArm", Vector3.new(0.5, 0.25, 2.2), c * CFrame.new(side * 2.6, FLOOR + 2.4, -1.0), RED, M.Metal)
	end
	box(parent, "RackTop", Vector3.new(5.8, 0.6, 0.6), c * CFrame.new(0, FLOOR + 8.4, 0), RED, M.Metal)
	local bar = c * CFrame.new(0, FLOOR + 6.2, -0.7)
	cyl(parent, "SquatBar", bar, 7.6, 0.24, STEEL, M.Metal)
	for _, side in { -1, 1 } do
		plateSet(parent, bar, side, { 3.2, 2.8, 2.4, 2.0 })
	end
	-- chalk bucket
	cyl(parent, "ChalkBucket", c * CFrame.new(4.4, FLOOR + 0.9, 2.2) * CFrame.Angles(0, 0, math.pi / 2), 1.6, 1.3, C3(240, 240, 245), M.SmoothPlastic)
	cyl(parent, "ChalkTop", c * CFrame.new(4.4, FLOOR + 1.75, 2.2) * CFrame.Angles(0, 0, math.pi / 2), 0.2, 1.1, C3(250, 250, 255), M.Sand)
end

--------------------------------------------------------------------------------
-- Cable crossover machine (right wall, near the door)
--------------------------------------------------------------------------------
local function cableMachine(parent, cf)
	local base = cf * CFrame.new(11.4, 0, -9)
	local points = {}
	for _, side in { -1, 1 } do
		local tower = base * CFrame.new(side * 3.7, 0, 0)
		box(parent, "CableTower", Vector3.new(1.7, 10.4, 0.5), tower * CFrame.new(0, FLOOR + 5.2, 0.9), DARKSTEEL, M.Metal)
		box(parent, "CableTowerSide", Vector3.new(0.4, 10.4, 1.8), tower * CFrame.new(-0.65, FLOOR + 5.2, 0), DARKSTEEL, M.Metal)
		box(parent, "CableTowerSide", Vector3.new(0.4, 10.4, 1.8), tower * CFrame.new(0.65, FLOOR + 5.2, 0), DARKSTEEL, M.Metal)
		box(parent, "CableBase", Vector3.new(2.2, 0.4, 2.8), tower * CFrame.new(0, FLOOR + 0.2, 0), BLACK, M.Metal)
		for i = 1, 11 do
			local colour = i <= 4 and C3(220, 70, 60) or (i <= 8 and C3(70, 120, 225) or C3(235, 195, 60))
			box(parent, "WeightSlab", Vector3.new(0.9, 0.5, 1.3), tower * CFrame.new(0, FLOOR + 0.7 + i * 0.62, 0), colour, M.Metal)
		end
		cyl(parent, "Pulley", tower * CFrame.new(0, FLOOR + 9.6, -0.5), 0.3, 0.9, STEEL, M.Metal)
		cyl(parent, "Pulley", tower * CFrame.new(0, FLOOR + 3.2, -1.0), 0.3, 0.9, STEEL, M.Metal)
		local handle = base * CFrame.new(side * 1.2, FLOOR + 4.3, -2.6)
		box(parent, "CableHandle", Vector3.new(1.2, 0.2, 0.2), handle, STEEL, M.Metal)
		table.insert(points, { top = (tower * CFrame.new(0, FLOOR + 9.6, -0.5)).Position, handle = handle.Position })
	end
	for _, pt in points do
		rod(parent, "Cable", pt.top, pt.handle, 0.08, C3(90, 92, 100), M.Metal)
	end
	box(parent, "CableCrossbar", Vector3.new(8.4, 0.6, 0.6), base * CFrame.new(0, FLOOR + 10.5, 0.2), RED, M.Metal)
end

--------------------------------------------------------------------------------
-- Left wall: kettlebell shelf, plate stacks, water cooler, punching bag
--------------------------------------------------------------------------------
local function kettlebells(parent, cf)
	box(parent, "KettlebellShelf", Vector3.new(1.8, 1.0, 10), cf * CFrame.new(-14.4, FLOOR + 0.5, 3.6), C3(120, 84, 58), M.Wood)
	for i = 1, 6 do
		local z = -0.6 + i * 1.4
		local d = 1.0 + i * 0.12
		local colour = i % 2 == 0 and RED or BLACK
		ball(parent, "Kettlebell", cf * CFrame.new(-14.4, FLOOR + 1.0 + d / 2, z), d, colour, M.Metal)
		upright(parent, "KettlebellHandle", cf * CFrame.new(-14.4 + d * 0.38, FLOOR + 1.0 + d + 0.2, z), 0.7, 0.16, colour, M.Metal)
		upright(parent, "KettlebellHandle", cf * CFrame.new(-14.4 - d * 0.38, FLOOR + 1.0 + d + 0.2, z), 0.7, 0.16, colour, M.Metal)
		box(parent, "KettlebellGrip", Vector3.new(d * 0.9, 0.16, 0.16), cf * CFrame.new(-14.4, FLOOR + 1.0 + d + 0.52, z), colour, M.Metal)
	end
end

local function plateTrees(parent, cf)
	for n, z in { 11.0, 13.2 } do
		local c = cf * CFrame.new(-14.2, 0, z)
		upright(parent, "PlatePost", c * CFrame.new(0, FLOOR + 2.4, 0), 4.8, 0.3, STEEL, M.Metal)
		cyl(parent, "PlateBase", c * CFrame.new(0, FLOOR + 0.1, 0) * CFrame.Angles(0, 0, math.pi / 2), 0.2, 2.6, BLACK, M.Metal)
		for i = 1, 6 do
			local d = 2.5 - (i % 3) * 0.2
			local colour = (i + n) % 3 == 0 and RED or ((i + n) % 3 == 1 and C3(60, 110, 220) or BLACK)
			cyl(parent, "StackPlate", c * CFrame.new(0, FLOOR + 0.2 + i * 0.52, 0) * CFrame.Angles(0, 0, math.pi / 2), 0.42, d, colour, M.Metal)
		end
	end
end

local function punchingBag(parent, cf)
	local x, z = -8.6, -11.5
	rod(parent, "BagChain", (cf * CFrame.new(x, 13.0, z)).Position, (cf * CFrame.new(x, 9.4, z)).Position, 0.14, C3(120, 124, 132), M.Metal)
	upright(parent, "BagTop", cf * CFrame.new(x, 9.2, z), 0.4, 1.2, DARKSTEEL, M.Metal)
	upright(parent, "PunchingBag", cf * CFrame.new(x, 6.6, z), 5.0, 2.2, C3(150, 40, 36), M.Leather)
	upright(parent, "BagBand", cf * CFrame.new(x, 7.6, z), 0.5, 2.3, YELLOW, M.Fabric)
	upright(parent, "BagBand", cf * CFrame.new(x, 5.6, z), 0.5, 2.3, YELLOW, M.Fabric)
	upright(parent, "BagBottom", cf * CFrame.new(x, 4.0, z), 0.3, 1.9, BLACK, M.Leather)
end

local function waterCooler(parent, cf)
	local x, z = -14.4, -12.5
	box(parent, "CoolerBase", Vector3.new(1.7, 2.6, 1.7), cf * CFrame.new(x, FLOOR + 1.3, z), C3(235, 238, 245), M.SmoothPlastic)
	box(parent, "CoolerTap", Vector3.new(0.5, 0.25, 0.4), cf * CFrame.new(x + 0.9, FLOOR + 2.0, z), C3(70, 130, 230), M.SmoothPlastic)
	upright(parent, "CoolerJug", cf * CFrame.new(x, FLOOR + 3.7, z), 2.0, 1.3, C3(120, 190, 255), M.Glass)
	upright(parent, "CoolerCap", cf * CFrame.new(x, FLOOR + 4.8, z), 0.3, 0.7, C3(70, 130, 230), M.SmoothPlastic)
end

-- A giant landmark dumbbell on the roof so the gym can be spotted from anywhere in the plaza.
local function roofDumbbell(parent, cf)
	local at = cf * CFrame.new(0, 23.5, 6)
	cyl(parent, "GiantHandle", at, 13, 1.1, STEEL, M.Metal)
	for _, side in { -1, 1 } do
		cyl(parent, "GiantPlate", at * CFrame.new(side * 5.4, 0, 0), 1.6, 6.8, RED, M.Metal)
		cyl(parent, "GiantPlate", at * CFrame.new(side * 6.6, 0, 0), 1.2, 5.2, BLACK, M.Metal)
		cyl(parent, "GiantCap", at * CFrame.new(side * 7.5, 0, 0), 0.6, 2.6, YELLOW, M.Metal)
	end
	for _, x in { -3, 3 } do
		box(parent, "GiantStand", Vector3.new(0.8, 9.2, 0.8), cf * CFrame.new(x, 18.95, 6), DARKSTEEL, M.Metal)
	end
end

local function floorTape(parent, cf)
	for _, z in { -13.2, -1.4 } do
		box(parent, "FloorTape", Vector3.new(30, 0.04, 0.3), cf * CFrame.new(0, FLOOR + 0.03, z), YELLOW, M.SmoothPlastic)
	end
end

function GymEquipment.build(parent, cf)
	local folder = Instance.new("Folder")
	folder.Name = "GymEquipment"
	folder.Parent = parent
	for _, build in { liftPad, dumbbellRack, mirrorWall, benchPress, squatRack, cableMachine, kettlebells, plateTrees, punchingBag, waterCooler, roofDumbbell, floorTape } do
		local ok, err = pcall(build, folder, cf)
		if not ok then
			warn("[TrueAdam] gym equipment piece failed:", err)
		end
	end
	return folder
end

return GymEquipment

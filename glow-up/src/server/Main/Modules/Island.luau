-- SUB 5 TO TRUE ADAM: the island. A bright voxel (LEGO-style) world: studded green lawns, tan brick paths with gold
-- trim, blocky trees, flowers, bushes and rocks, gold-and-black lamp posts, stone statue busts, and a ring of stepped
-- green-topped cliffs around the whole map with water and small islands beyond. Everything is plain parts, and
-- the studs are the real Roblox stud surface.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local Island = {}

local M = Enum.Material
local C3 = Color3.fromRGB

local HALF = 273 -- the flat island is this big in every direction (a multiple of 14 plus half a cell)
local CELL = 14

local GRASS_A, GRASS_B = C3(94, 178, 74), C3(80, 160, 62)
local LEAF_A, LEAF_B = C3(70, 172, 66), C3(52, 140, 56)
local DIRT_A, DIRT_B = C3(158, 96, 58), C3(134, 80, 48)
local TAN_A, TAN_B = C3(238, 216, 164), C3(224, 200, 144)
local GOLD, BLACK = C3(240, 192, 56), C3(30, 32, 40)
local STONE, STONE_D = C3(238, 238, 242), C3(176, 178, 186)
local WOOD = C3(124, 88, 62)

local rng = Random.new(20240)

--------------------------------------------------------------------------------
-- Parts
--------------------------------------------------------------------------------
-- A LEGO-style block: Plastic with real studs on top.
local function brick(parent, name, size, cf, color, studs, extra)
	local p = Instance.new("Part")
	p.Name = name
	p.Anchored = true
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = M.Plastic
	p.TopSurface = studs == false and Enum.SurfaceType.Smooth or Enum.SurfaceType.Studs
	p.BottomSurface = Enum.SurfaceType.Smooth
	if extra then
		for k, v in extra do
			p[k] = v
		end
	end
	p.Parent = parent
	return p
end

local function glass(parent, name, size, cf, color)
	local p = brick(parent, name, size, cf, color, false, { Material = M.Glass, Transparency = 0.25, CanCollide = false })
	return p
end

local function light(part, color, range, brightness)
	local l = Instance.new("PointLight")
	l.Color = color
	l.Range = range
	l.Brightness = brightness
	l.Parent = part
end

--------------------------------------------------------------------------------
-- Where things may NOT be scattered (buildings, paths, stage, spawn, catwalk)
--------------------------------------------------------------------------------
local strips = {} -- radial path segments { a, b } so scenery stays off them

local function distToSegment(px, pz, a, b)
	local dx, dz = b.X - a.X, b.Z - a.Z
	local len2 = dx * dx + dz * dz
	local t = len2 > 0 and math.clamp(((px - a.X) * dx + (pz - a.Z) * dz) / len2, 0, 1) or 0
	local cx, cz = a.X + dx * t, a.Z + dz * t
	return math.sqrt((px - cx) ^ 2 + (pz - cz) ^ 2)
end

local BUSTS = { Vector3.new(-73, 0, -61), Vector3.new(36, 0, -88) }

-- Anything big that is already standing there (everything except the paths).
local function occupied(x: number, z: number, margin: number?)
	local m: number = margin or 0
	if math.abs(x) < 58 + m and math.abs(z) < 58 + m then
		return true -- centre plaza and the stage
	end
	if math.abs(x) < 70 + m and math.abs(z) < 24 + m then
		return true -- stage bleachers
	end
	if math.abs(x) < 70 + m and z > 96 and z < 152 + m then
		return true -- hammer shop and spawn
	end
	local here = Vector3.new(x, 0, z)
	for name in Config.Stations do
		if (Config.StationPos(name) - here).Magnitude < 34 + m then
			return true
		end
	end
	-- the Ranked Arena: a walled pit behind the Ring station (x = right, z = toward the back wall)
	local ring, front = Config.StationPos("Ring"), Config.StationFront("Ring")
	local dx, dz = x - ring.X, z - ring.Z
	local lx = dx * -front.Z + dz * front.X
	local lz = -(dx * front.X + dz * front.Z)
	if math.abs(lx) < 56 + m and lz > -62 - m and lz < 56 + m then
		return true
	end
	if (Config.BattlePos() - here).Magnitude < 54 + m then
		return true
	end
	if (Config.TreadHallPos() - here).Magnitude < 64 + m then
		return true
	end
	if (Vector3.new(-112, 0, 70) - here).Magnitude < 26 + m then
		return true -- the Top Moggers board
	end
	for _, spot in BUSTS do
		if (spot - here).Magnitude < 14 + m then
			return true
		end
	end
	return false
end

-- Scenery also stays off the paths.
local function blocked(x: number, z: number, margin: number?)
	local m: number = margin or 0
	if math.abs(x) < 17 + m or math.abs(z) < 17 + m then
		return true -- the main cross of paths
	end
	if occupied(x, z, margin) then
		return true
	end
	for _, seg in strips do
		if distToSegment(x, z, seg[1], seg[2]) < 9 + m then
			return true
		end
	end
	return false
end

--------------------------------------------------------------------------------
-- Scenery pieces
--------------------------------------------------------------------------------
local function voxelTree(parent, pos, scale)
	local s = scale or (0.9 + rng:NextNumber() * 0.7)
	local trunkH = 5 * s
	brick(parent, "Trunk", Vector3.new(1.8 * s, trunkH, 1.8 * s), CFrame.new(pos.X, pos.Y + trunkH / 2, pos.Z), C3(112, 74, 46), false)
	local y = pos.Y + trunkH
	local layers = { { 8.4, 3 }, { 6.2, 3 }, { 3.8, 3 } }
	for i, layer in layers do
		local w, h = layer[1] * s, layer[2] * s
		local color = (i % 2 == 1) and LEAF_A or LEAF_B
		brick(parent, "Leaves", Vector3.new(w, h, w), CFrame.new(pos.X, y + h / 2 - 0.4 * s, pos.Z), color, true, { CanCollide = false })
		y += h - 0.4 * s
	end
	-- a couple of loose cubes make the crown look less perfect
	for _ = 1, 2 do
		local ox, oz = (rng:NextNumber() - 0.5) * 7 * s, (rng:NextNumber() - 0.5) * 7 * s
		brick(parent, "Leaves", Vector3.new(2.4 * s, 2.4 * s, 2.4 * s), CFrame.new(pos.X + ox, pos.Y + trunkH + 1.2 * s, pos.Z + oz), LEAF_B, true, { CanCollide = false })
	end
end

-- A pine tree: a stack of shrinking needle layers on a thin trunk.
local function pineTree(parent, pos, scale)
	local s = scale or (0.9 + rng:NextNumber() * 0.7)
	local trunkH = 4 * s
	brick(parent, "Trunk", Vector3.new(1.5 * s, trunkH, 1.5 * s), CFrame.new(pos.X, pos.Y + trunkH / 2, pos.Z), C3(100, 68, 42), false)
	local y = pos.Y + trunkH * 0.7
	for i, w in { 7.2, 5.6, 4.0, 2.4 } do
		local h = 2.4 * s
		brick(parent, "Needles", Vector3.new(w * s, h, w * s), CFrame.new(pos.X, y + h / 2, pos.Z), (i % 2 == 1) and C3(48, 128, 70) or C3(38, 110, 60), true, { CanCollide = false })
		y += h * 0.8
	end
	brick(parent, "PineTip", Vector3.new(s, 1.4 * s, s), CFrame.new(pos.X, y + 0.5 * s, pos.Z), C3(64, 150, 84), true, { CanCollide = false })
end

local FLOWER_COLORS = { C3(255, 255, 255), C3(255, 226, 90), C3(255, 150, 190), C3(150, 200, 255) }

local function flowers(parent, pos)
	local n = rng:NextInteger(4, 8)
	for _ = 1, n do
		local ox, oz = (rng:NextNumber() - 0.5) * 6, (rng:NextNumber() - 0.5) * 6
		local h = 1 + rng:NextNumber() * 0.8
		brick(parent, "Stem", Vector3.new(0.25, h, 0.25), CFrame.new(pos.X + ox, pos.Y + h / 2, pos.Z + oz), C3(60, 140, 60), false, { CanCollide = false })
		local petal = FLOWER_COLORS[rng:NextInteger(1, #FLOWER_COLORS)]
		brick(parent, "Petals", Vector3.new(1, 0.45, 1), CFrame.new(pos.X + ox, pos.Y + h + 0.2, pos.Z + oz), petal, false, { CanCollide = false })
		brick(parent, "FlowerHeart", Vector3.new(0.4, 0.3, 0.4), CFrame.new(pos.X + ox, pos.Y + h + 0.5, pos.Z + oz), C3(255, 190, 40), false, { CanCollide = false })
	end
end

local function bush(parent, pos)
	local w = 2.6 + rng:NextNumber() * 1.4
	brick(parent, "Bush", Vector3.new(w, w * 0.8, w), CFrame.new(pos.X, pos.Y + w * 0.4, pos.Z), LEAF_B, true)
	brick(parent, "Bush", Vector3.new(w * 0.7, w * 0.6, w * 0.7), CFrame.new(pos.X + w * 0.6, pos.Y + w * 0.3, pos.Z + w * 0.2), LEAF_A, true, { CanCollide = false })
	for _ = 1, 3 do
		brick(parent, "BushFlower", Vector3.new(0.6, 0.4, 0.6), CFrame.new(pos.X + (rng:NextNumber() - 0.5) * w * 0.7, pos.Y + w * 0.82, pos.Z + (rng:NextNumber() - 0.5) * w * 0.7), C3(255, 255, 255), false, { CanCollide = false })
	end
end

local function rock(parent, pos)
	local w = 2.4 + rng:NextNumber() * 1.6
	brick(parent, "Rock", Vector3.new(w, w * 0.7, w * 1.1), CFrame.new(pos.X, pos.Y + w * 0.35, pos.Z), C3(150, 152, 160), true)
	brick(parent, "Rock", Vector3.new(w * 0.65, w * 0.6, w * 0.65), CFrame.new(pos.X + w * 0.2, pos.Y + w * 0.95, pos.Z), C3(170, 172, 180), true, { CanCollide = false })
	brick(parent, "Rock", Vector3.new(w * 0.5, w * 0.5, w * 0.5), CFrame.new(pos.X - w * 0.7, pos.Y + w * 0.25, pos.Z + w * 0.4), C3(130, 132, 140), true, { CanCollide = false })
end

-- A tall gold-and-black lamp post with a glowing lantern.
local function lamp(parent, pos, lit)
	brick(parent, "LampBase", Vector3.new(2.4, 1.4, 2.4), CFrame.new(pos.X, pos.Y + 0.7, pos.Z), GOLD, true)
	brick(parent, "LampBaseTop", Vector3.new(1.6, 0.6, 1.6), CFrame.new(pos.X, pos.Y + 1.7, pos.Z), BLACK, false)
	brick(parent, "LampPole", Vector3.new(0.55, 9, 0.55), CFrame.new(pos.X, pos.Y + 6.2, pos.Z), BLACK, false)
	brick(parent, "LampCollar", Vector3.new(1.2, 0.5, 1.2), CFrame.new(pos.X, pos.Y + 10.5, pos.Z), GOLD, false)
	local lantern = glass(parent, "Lantern", Vector3.new(1.7, 2.4, 1.7), CFrame.new(pos.X, pos.Y + 12, pos.Z), C3(255, 236, 170))
	brick(parent, "LampCap", Vector3.new(2.3, 0.6, 2.3), CFrame.new(pos.X, pos.Y + 13.5, pos.Z), BLACK, false)
	brick(parent, "LampFinial", Vector3.new(0.8, 0.8, 0.8), CFrame.new(pos.X, pos.Y + 14.2, pos.Z), GOLD, false)
	if lit then
		light(lantern, C3(255, 226, 160), 30, 0.9)
	end
end

local function bench(parent, cf)
	brick(parent, "BenchSeat", Vector3.new(6, 0.5, 1.8), cf * CFrame.new(0, 1.8, 0), WOOD, true)
	brick(parent, "BenchBack", Vector3.new(6, 1.6, 0.4), cf * CFrame.new(0, 2.8, 0.8), WOOD, false)
	for side = -1, 1, 2 do
		brick(parent, "BenchLeg", Vector3.new(0.5, 1.8, 1.7), cf * CFrame.new(side * 2.5, 0.9, 0), BLACK, false)
	end
end

--------------------------------------------------------------------------------
-- Paths: tan brick with gold edge trim
--------------------------------------------------------------------------------
local function pathBlock(parent, center, length, width, yawCF)
	local cf = yawCF
	brick(parent, "Path", Vector3.new(width, 0.3, length), cf, TAN_A, true)
	-- darker tile bands so the path reads as paving
	local bands = math.floor(length / 10)
	for i = 1, bands do
		if i % 2 == 0 then
			brick(parent, "PathTile", Vector3.new(width - 0.4, 0.34, 4.8), cf * CFrame.new(0, 0, -length / 2 + (i - 0.5) * 10), TAN_B, true, { CanCollide = false })
		end
	end
	for side = -1, 1, 2 do
		brick(parent, "PathTrim", Vector3.new(0.7, 0.4, length), cf * CFrame.new(side * (width / 2 + 0.2), 0.02, 0), GOLD, false, { CanCollide = false })
	end
end

local function strip(parent, a, b, width)
	local mid = (a + b) / 2
	local len = (b - a).Magnitude
	if len < 1 then
		return
	end
	table.insert(strips, { a, b })
	pathBlock(parent, mid, len, width, CFrame.lookAt(Vector3.new(mid.X, 0.15, mid.Z), Vector3.new(b.X, 0.15, b.Z)))
end

--------------------------------------------------------------------------------
-- Statue bust on a black-and-gold pedestal
--------------------------------------------------------------------------------
local function bust(parent, pos, label)
	local cf = CFrame.lookAt(Vector3.new(pos.X, 0, pos.Z), Vector3.new(0, 0, 0))
	brick(parent, "BustPedestal", Vector3.new(16, 5.5, 14), cf * CFrame.new(0, 2.75, 0), BLACK, true)
	for _, y in { 0.35, 5.5 } do
		brick(parent, "BustTrim", Vector3.new(16.8, 0.7, 14.8), cf * CFrame.new(0, y, 0), GOLD, false)
	end
	local top = 5.9
	brick(parent, "BustShoulders", Vector3.new(14, 4.4, 6.6), cf * CFrame.new(0, top + 2.2, 0.4), STONE, true)
	brick(parent, "BustChest", Vector3.new(10, 3, 6.8), cf * CFrame.new(0, top + 5.2, 0.4), STONE_D, true)
	brick(parent, "BustNeck", Vector3.new(4.4, 3, 4.4), cf * CFrame.new(0, top + 7.6, 0), STONE, true)
	brick(parent, "BustHead", Vector3.new(7.4, 8.4, 7), cf * CFrame.new(0, top + 12.2, 0), STONE, true)
	brick(parent, "BustJaw", Vector3.new(6.2, 2.4, 6.6), cf * CFrame.new(0, top + 8.2, -0.5), STONE, false)
	brick(parent, "BustChin", Vector3.new(3.4, 1.6, 1.6), cf * CFrame.new(0, top + 8.4, -3.9), STONE, false)
	brick(parent, "BustNose", Vector3.new(1.4, 3, 1.6), cf * CFrame.new(0, top + 11.8, -4.4), STONE, false)
	brick(parent, "BustBrow", Vector3.new(6.6, 0.9, 1.5), cf * CFrame.new(0, top + 13.7, -3.9), STONE_D, false)
	for side = -1, 1, 2 do
		brick(parent, "BustEye", Vector3.new(1.3, 0.8, 0.4), cf * CFrame.new(side * 1.9, top + 12.8, -3.7), BLACK, false)
		brick(parent, "BustEar", Vector3.new(0.9, 2.2, 1.6), cf * CFrame.new(side * 4.1, top + 12, 0.2), STONE_D, false)
		brick(parent, "BustCheek", Vector3.new(1.6, 1.4, 0.8), cf * CFrame.new(side * 2.4, top + 10.6, -3.7), STONE_D, false)
	end
	brick(parent, "BustMouth", Vector3.new(2.4, 0.4, 0.4), cf * CFrame.new(0, top + 9.6, -3.6), STONE_D, false)
	brick(parent, "BustHair", Vector3.new(7.8, 2.6, 7.4), cf * CFrame.new(0, top + 16.7, 0.1), C3(214, 214, 220), true)
	brick(parent, "BustHairFront", Vector3.new(6.2, 1.2, 1.6), cf * CFrame.new(0, top + 15.6, -3.5), C3(206, 206, 212), true)
	-- gold name plate on the front of the pedestal
	local plate = brick(parent, "BustPlate", Vector3.new(11, 2.4, 0.4), cf * CFrame.new(0, 2.8, -7.1), GOLD, false, { CanCollide = false })
	local gui = Instance.new("SurfaceGui")
	gui.Face = Enum.NormalId.Front
	gui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	gui.CanvasSize = Vector2.new(440, 96)
	gui.Parent = plate
	local text = Instance.new("TextLabel")
	text.Size = UDim2.fromScale(1, 1)
	text.BackgroundTransparency = 1
	text.Font = Enum.Font.GothamBlack
	text.TextScaled = true
	text.TextColor3 = BLACK
	text.Text = label
	text.Parent = gui
end

--------------------------------------------------------------------------------
-- Stepped green cliffs all around the island, with trees on top
--------------------------------------------------------------------------------
local function cliffs(parent)
	local N = 23 -- cell index of the outermost ring (19 = last cell inside the flat island)
	local count = 0
	for kx = -N, N do
		for kz = -N, N do
			local ring = math.max(math.abs(kx), math.abs(kz)) - 19
			if ring >= 1 then
				local level = ring + (rng:NextNumber() < 0.3 and 1 or 0)
				level = math.min(level, 5)
				local h = level * 8
				local cx, cz = kx * CELL, kz * CELL
				local dirt = ((kx + kz) % 2 == 0) and DIRT_A or DIRT_B
				-- dirt column from below the water up to the cap
				brick(parent, "CliffDirt", Vector3.new(CELL, h + 21, CELL), CFrame.new(cx, (h - 21) / 2, cz), dirt, false)
				-- darker strata bands so the wall reads as layered earth
				for band = 1, level - 1 do
					brick(parent, "CliffStrata", Vector3.new(CELL + 0.1, 0.9, CELL + 0.1), CFrame.new(cx, band * 8 - 0.4, cz), DIRT_B:Lerp(Color3.new(0, 0, 0), 0.15), false, { CanCollide = false })
				end
				-- the green studded cap, slightly wider than the dirt like a lawn lip
				brick(parent, "CliffGrass", Vector3.new(CELL + 0.5, 1.4, CELL + 0.5), CFrame.new(cx, h + 0.7, cz), ((kx * 3 + kz) % 3 == 0) and GRASS_B or GRASS_A, true)
				count += 1
				if ring >= 2 and rng:NextNumber() < 0.28 then
					voxelTree(parent, Vector3.new(cx + (rng:NextNumber() - 0.5) * 6, h + 1.4, cz + (rng:NextNumber() - 0.5) * 6), 0.9 + rng:NextNumber() * 0.6)
				end
			end
		end
	end
	return count
end

-- Small floating islands out in the water, each with a few trees.
local function farIslands(parent)
	for i = 1, 8 do
		local a = (i / 8) * math.pi * 2 + rng:NextNumber() * 0.4
		local r = 470 + rng:NextNumber() * 130
		local x, z = math.cos(a) * r, math.sin(a) * r
		local w = 40 + rng:NextNumber() * 40
		brick(parent, "FarIslandDirt", Vector3.new(w, 12, w), CFrame.new(x, -8, z), DIRT_A, false)
		brick(parent, "FarIslandGrass", Vector3.new(w + 1, 2.5, w + 1), CFrame.new(x, 0.4, z), GRASS_A, true)
		for _ = 1, 3 do
			voxelTree(parent, Vector3.new(x + (rng:NextNumber() - 0.5) * w * 0.6, 1.6, z + (rng:NextNumber() - 0.5) * w * 0.6))
		end
	end
end

--------------------------------------------------------------------------------
-- More detail all over the map: signposts, flower beds, ponds, market stalls, hay, logs, mushrooms, grass tufts,
-- flags, clouds, camp fires and a windmill. Every piece is a handful of plain parts.
--------------------------------------------------------------------------------
local CYL = Enum.PartType.Cylinder

-- A flat disc (a cylinder lying down), top face at pos.Y + height.
local function disc(parent, name, pos, diameter, height, color, studs, extra)
	local props = { Shape = CYL }
	if extra then
		for k, v in extra do
			props[k] = v
		end
	end
	return brick(parent, name, Vector3.new(height, diameter, diameter), CFrame.new(pos.X, pos.Y + height / 2, pos.Z) * CFrame.Angles(0, 0, math.pi / 2), color, studs, props)
end

local function signpost(parent, pos, facing, text, color)
	local cf = CFrame.lookAt(Vector3.new(pos.X, 0, pos.Z), Vector3.new(pos.X + facing.X, 0, pos.Z + facing.Z))
	brick(parent, "SignPost", Vector3.new(0.8, 8, 0.8), cf * CFrame.new(0, 4, 0), WOOD, false)
	brick(parent, "SignPostCap", Vector3.new(1.4, 0.6, 1.4), cf * CFrame.new(0, 8.2, 0), GOLD, true)
	local board = brick(parent, "SignBoard", Vector3.new(9, 2.6, 0.5), cf * CFrame.new(0, 6.3, -0.5), color, false)
	brick(parent, "SignTrim", Vector3.new(9.6, 3.2, 0.3), cf * CFrame.new(0, 6.3, -0.2), GOLD, false)
	local gui = Instance.new("SurfaceGui")
	gui.Face = Enum.NormalId.Front
	gui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	gui.CanvasSize = Vector2.new(360, 104)
	gui.Parent = board
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBlack
	label.TextScaled = true
	label.TextColor3 = C3(255, 255, 255)
	label.TextStrokeTransparency = 0.3
	label.Text = text
	label.Parent = gui
end

local function flowerBed(parent, pos, radius)
	disc(parent, "BedSoil", pos, radius * 2, 0.5, C3(104, 72, 48), false)
	local count = 12
	for i = 1, count do
		local a = (i / count) * math.pi * 2
		local at = Vector3.new(pos.X + math.cos(a) * radius, 0, pos.Z + math.sin(a) * radius)
		brick(parent, "BedStone", Vector3.new(radius * 0.58, 1.1, 1.6), CFrame.new(at.X, 0.55, at.Z) * CFrame.Angles(0, -a + math.pi / 2, 0), (i % 2 == 0) and STONE or STONE_D, true)
	end
	for _ = 1, 7 do
		local a, r = rng:NextNumber() * math.pi * 2, rng:NextNumber() * (radius - 2)
		flowers(parent, Vector3.new(pos.X + math.cos(a) * r, 0.5, pos.Z + math.sin(a) * r))
	end
	bush(parent, Vector3.new(pos.X, 0.5, pos.Z))
end

local function pond(parent, pos, radius)
	disc(parent, "PondSand", pos, radius * 2 + 7, 0.25, TAN_A, true)
	local water = disc(parent, "PondWater", Vector3.new(pos.X, 0.02, pos.Z), radius * 2, 0.16, C3(70, 150, 230), false, { Material = M.Glass, Transparency = 0.25, Reflectance = 0.2 })
	water.CanCollide = false
	for _ = 1, 7 do
		local a, r = rng:NextNumber() * math.pi * 2, rng:NextNumber() * (radius - 3)
		local x, z = pos.X + math.cos(a) * r, pos.Z + math.sin(a) * r
		disc(parent, "LilyPad", Vector3.new(x, 0.15, z), 1.8, 0.1, C3(60, 160, 70), false, { CanCollide = false })
		if rng:NextNumber() < 0.5 then
			brick(parent, "LilyFlower", Vector3.new(0.7, 0.5, 0.7), CFrame.new(x, 0.5, z), C3(255, 160, 200), false, { CanCollide = false })
		end
	end
	for i = 1, 14 do
		local a = rng:NextNumber() * math.pi * 2
		local x, z = pos.X + math.cos(a) * (radius + 0.5), pos.Z + math.sin(a) * (radius + 0.5)
		local h = 2.2 + rng:NextNumber() * 1.6
		brick(parent, "Reed", Vector3.new(0.3, h, 0.3), CFrame.new(x, h / 2, z), C3(86, 150, 60), false, { CanCollide = false })
		if i % 3 == 0 then
			brick(parent, "ReedHead", Vector3.new(0.45, 0.9, 0.45), CFrame.new(x, h + 0.3, z), C3(120, 80, 50), false, { CanCollide = false })
		end
	end
	for _ = 1, 5 do
		local a = rng:NextNumber() * math.pi * 2
		rock(parent, Vector3.new(pos.X + math.cos(a) * (radius + 2.5), 0, pos.Z + math.sin(a) * (radius + 2.5)))
	end
	-- a little wooden jetty
	for i = 1, 5 do
		brick(parent, "JettyPlank", Vector3.new(3.4, 0.35, 1.2), CFrame.new(pos.X - radius + i * 1.3 - 1.2, 0.5, pos.Z), WOOD, true)
	end
	for _, dz in { -1.6, 1.6 } do
		brick(parent, "JettyPost", Vector3.new(0.5, 1.6, 0.5), CFrame.new(pos.X - radius + 4.6, 0.3, pos.Z + dz), C3(96, 66, 46), false)
	end
end

local FRUIT = { C3(230, 60, 60), C3(255, 190, 50), C3(120, 190, 70), C3(250, 120, 60), C3(160, 80, 200) }

local function stall(parent, cf, colorA, colorB)
	brick(parent, "StallCounter", Vector3.new(9, 3, 3), cf * CFrame.new(0, 1.5, 0), WOOD, true)
	brick(parent, "StallCounterTop", Vector3.new(9.6, 0.4, 3.6), cf * CFrame.new(0, 3.2, 0), C3(150, 110, 78), true)
	brick(parent, "StallBack", Vector3.new(9, 6.4, 0.5), cf * CFrame.new(0, 3.2, 1.9), C3(176, 130, 92), false)
	for _, x in { -4.4, 4.4 } do
		for _, z in { -1.6, 1.8 } do
			brick(parent, "StallPost", Vector3.new(0.6, 7.4, 0.6), cf * CFrame.new(x, 3.7, z), C3(110, 76, 52), false)
		end
	end
	for i = 1, 6 do
		brick(parent, "Awning", Vector3.new(1.62, 0.3, 5.4), cf * CFrame.new(-4.05 + (i - 1) * 1.62, 7.5, 0) * CFrame.Angles(-0.18, 0, 0), (i % 2 == 0) and colorA or colorB, false, { Material = M.Fabric })
	end
	for i = 1, 6 do
		brick(parent, "AwningFringe", Vector3.new(1.62, 0.9, 0.2), cf * CFrame.new(-4.05 + (i - 1) * 1.62, 7.0, -2.62), (i % 2 == 0) and colorA or colorB, false, { Material = M.Fabric, CanCollide = false })
	end
	for i = 1, 5 do
		local x = -3.6 + (i - 1) * 1.8
		brick(parent, "FruitCrate", Vector3.new(1.5, 0.9, 1.5), cf * CFrame.new(x, 3.8, -0.4), C3(190, 140, 90), true, { CanCollide = false })
		for j = 1, 3 do
			brick(parent, "Fruit", Vector3.one * 0.7, cf * CFrame.new(x + (j - 2) * 0.4, 4.45 + (j % 2) * 0.12, -0.4 + (j % 2) * 0.3), FRUIT[(i + j) % #FRUIT + 1], false, { Shape = Enum.PartType.Ball, CanCollide = false })
		end
	end
	brick(parent, "StallLantern", Vector3.one * 0.9, cf * CFrame.new(0, 6.6, -2.2), C3(255, 226, 150), false, { Material = M.Neon, CanCollide = false })
end

local function hay(parent, pos)
	local yaw = rng:NextNumber() * math.pi
	local cf = CFrame.new(pos.X, 0, pos.Z) * CFrame.Angles(0, yaw, 0)
	brick(parent, "HayBale", Vector3.new(3.2, 2.6, 2.6), cf * CFrame.new(0, 1.3, 0), C3(232, 196, 90), true)
	brick(parent, "HayBand", Vector3.new(0.4, 2.7, 2.7), cf * CFrame.new(-0.7, 1.3, 0), C3(160, 110, 50), false, { CanCollide = false })
	brick(parent, "HayBand", Vector3.new(0.4, 2.7, 2.7), cf * CFrame.new(0.7, 1.3, 0), C3(160, 110, 50), false, { CanCollide = false })
	if rng:NextNumber() < 0.6 then
		brick(parent, "HayBale", Vector3.new(3.2, 2.6, 2.6), cf * CFrame.new(0.4, 3.9, 0.2) * CFrame.Angles(0, 0.3, 0), C3(222, 186, 80), true)
	end
end

local function logPile(parent, pos)
	local cf = CFrame.new(pos.X, 0, pos.Z) * CFrame.Angles(0, rng:NextNumber() * math.pi, 0)
	for _, l in { { -0.8, 0.7 }, { 0.8, 0.7 }, { 0, 1.9 } } do
		disc(parent, "Log", Vector3.new(0, 0, 0), 1.4, 5, C3(112, 76, 48), false, { CFrame = cf * CFrame.new(0, l[2], l[1] * 0.8) * CFrame.Angles(0, math.pi / 2, math.pi / 2) })
	end
end

local function mushrooms(parent, pos)
	for i = 1, 3 do
		local x, z = pos.X + (rng:NextNumber() - 0.5) * 3, pos.Z + (rng:NextNumber() - 0.5) * 3
		local s = 0.7 + rng:NextNumber() * 0.7
		brick(parent, "MushroomStem", Vector3.new(0.6 * s, 1.1 * s, 0.6 * s), CFrame.new(x, 0.55 * s, z), C3(246, 240, 226), false, { CanCollide = false })
		brick(parent, "MushroomCap", Vector3.new(1.7 * s, 0.7 * s, 1.7 * s), CFrame.new(x, 1.3 * s, z), i == 2 and C3(240, 190, 70) or C3(220, 60, 60), false, { CanCollide = false })
		brick(parent, "MushroomDot", Vector3.new(0.4 * s, 0.15, 0.4 * s), CFrame.new(x + 0.3 * s, 1.68 * s, z), C3(255, 255, 255), false, { CanCollide = false })
	end
end

local function tuft(parent, pos)
	for i = 1, 2 do
		local h = 0.9 + rng:NextNumber() * 0.8
		brick(parent, "Grass", Vector3.new(0.22, h, 0.22), CFrame.new(pos.X + (i - 1.5) * 0.4, h / 2, pos.Z) * CFrame.Angles(0, 0, (rng:NextNumber() - 0.5) * 0.5), (i == 1) and C3(70, 160, 60) or C3(96, 184, 74), false, { CanCollide = false, CanQuery = false })
	end
end

local function flag(parent, pos, color)
	brick(parent, "FlagPole", Vector3.new(0.35, 10, 0.35), CFrame.new(pos.X, pos.Y + 5, pos.Z), C3(190, 194, 204), false)
	brick(parent, "FlagBall", Vector3.one * 0.8, CFrame.new(pos.X, pos.Y + 10.2, pos.Z), GOLD, false, { Shape = Enum.PartType.Ball })
	brick(parent, "Flag", Vector3.new(4.4, 2.6, 0.15), CFrame.new(pos.X + 2.4, pos.Y + 8.6, pos.Z), color, false, { Material = M.Fabric, CanCollide = false })
	brick(parent, "FlagStripe", Vector3.new(4.4, 0.6, 0.2), CFrame.new(pos.X + 2.4, pos.Y + 8.6, pos.Z), GOLD, false, { Material = M.Fabric, CanCollide = false })
end

local function cloud(parent, pos)
	local n = rng:NextInteger(4, 7)
	for i = 1, n do
		local w = 14 + rng:NextNumber() * 18
		brick(parent, "Cloud", Vector3.new(w, 6 + rng:NextNumber() * 4, 10 + rng:NextNumber() * 8), CFrame.new(pos.X + (i - n / 2) * 11 + (rng:NextNumber() - 0.5) * 8, pos.Y + (rng:NextNumber() - 0.5) * 5, pos.Z + (rng:NextNumber() - 0.5) * 12), C3(255, 255, 255), false, { Material = M.SmoothPlastic, Transparency = 0.08, CanCollide = false, CanQuery = false, CanTouch = false, CastShadow = false })
	end
end

local function campfire(parent, pos)
	for i = 1, 8 do
		local a = (i / 8) * math.pi * 2
		brick(parent, "FireStone", Vector3.new(1.3, 0.9, 1.3), CFrame.new(pos.X + math.cos(a) * 2.2, 0.45, pos.Z + math.sin(a) * 2.2) * CFrame.Angles(0, a, 0), (i % 2 == 0) and STONE_D or C3(130, 132, 140), true)
	end
	for i = 1, 3 do
		disc(parent, "FireLog", Vector3.new(0, 0, 0), 0.8, 3.2, C3(96, 64, 42), false, { CFrame = CFrame.new(pos.X, 0.6, pos.Z) * CFrame.Angles(0, i * 1.05, math.pi / 2) * CFrame.new(0, 0, 0), Position = Vector3.zero, CanCollide = false })
	end
	local flame = brick(parent, "Flame", Vector3.new(1.6, 2.4, 1.6), CFrame.new(pos.X, 1.8, pos.Z), C3(255, 140, 40), false, { Material = M.Neon, CanCollide = false })
	brick(parent, "FlameCore", Vector3.new(0.9, 1.6, 0.9), CFrame.new(pos.X, 1.7, pos.Z), C3(255, 226, 120), false, { Material = M.Neon, CanCollide = false })
	light(flame, C3(255, 170, 80), 30, 1.1)
	for i = 1, 2 do
		local a = i * math.pi
		brick(parent, "LogSeat", Vector3.new(4.6, 1.3, 1.5), CFrame.new(pos.X + math.cos(a) * 5.4, 0.65, pos.Z + math.sin(a) * 5.4) * CFrame.Angles(0, a + math.pi / 2, 0), C3(124, 88, 62), true)
	end
end

local function windmill(parent, pos)
	local cf = CFrame.lookAt(Vector3.new(pos.X, 0, pos.Z), Vector3.new(0, 0, 0))
	local widths = { 11, 10, 9, 8, 7 }
	local y = 0
	for i, w in widths do
		brick(parent, "MillTower", Vector3.new(w, 4, w), cf * CFrame.new(0, y + 2, 0), (i % 2 == 0) and C3(240, 224, 190) or C3(228, 208, 172), true)
		y += 4
	end
	brick(parent, "MillBand", Vector3.new(11.6, 0.8, 11.6), cf * CFrame.new(0, 0.4, 0), STONE_D, true)
	for i, w in { 8.4, 6, 3.4 } do
		brick(parent, "MillRoof", Vector3.new(w, 2.4, w), cf * CFrame.new(0, y + 1.2 + (i - 1) * 2.2, 0), C3(176, 60, 56), true)
	end
	brick(parent, "MillDoor", Vector3.new(3, 5, 0.6), cf * CFrame.new(0, 2.5, -5.4), C3(110, 76, 52), false)
	for _, wy in { 9, 15 } do
		brick(parent, "MillWindow", Vector3.new(2, 2.4, 0.5), cf * CFrame.new(0, wy, -4.6), C3(130, 200, 240), false, { Material = M.Glass })
	end
	-- the four sails around a hub on the front
	local hub = cf * CFrame.new(0, y - 3, -4.8)
	brick(parent, "MillHub", Vector3.one * 2, hub, C3(110, 76, 52), false, { Shape = Enum.PartType.Ball })
	for k = 0, 3 do
		local sail = hub * CFrame.Angles(0, 0, k * math.pi / 2 + 0.35)
		brick(parent, "MillSailBeam", Vector3.new(1.0, 17, 0.5), sail * CFrame.new(0, 0, -0.4), WOOD, false, { CanCollide = false })
		brick(parent, "MillSailCloth", Vector3.new(3.6, 12, 0.2), sail * CFrame.new(2.4, 1.5, -0.7), C3(246, 242, 232), false, { Material = M.Fabric, CanCollide = false })
	end
end

-- Picks `count` well-spaced free spots on the lawns.
local function pickSpots(count, rMin, rMax, margin, minSep, used)
	local spots = {}
	local tries = 0
	while #spots < count and tries < 4000 do
		tries += 1
		local a = rng:NextNumber() * math.pi * 2
		local r = rMin + rng:NextNumber() * (rMax - rMin)
		local x, z = math.cos(a) * r, math.sin(a) * r
		if math.abs(x) < HALF - 20 and math.abs(z) < HALF - 20 and not blocked(x, z, margin) then
			local ok = true
			for _, u in used do
				if (Vector3.new(x, 0, z) - u).Magnitude < minSep then
					ok = false
					break
				end
			end
			if ok then
				local v = Vector3.new(x, 0, z)
				table.insert(spots, v)
				table.insert(used, v)
			end
		end
	end
	return spots
end

local function details(parent)
	local used = {}
	local made = { signs = 0, beds = 0, ponds = 0, stalls = 0, camps = 0, clouds = 0 }
	-- signposts: where each path leaves the plaza, pointing the way
	local names = { Gym = "GYM", Studio = "STYLE STUDIO", Lounge = "CHARM LOUNGE", Crates = "CRATE SHOP", Ring = "RANKED ARENA" }
	local function post(dir, text, color)
		local d = Vector3.new(dir.X, 0, dir.Z).Unit
		local side = Vector3.new(-d.Z, 0, d.X)
		local at = d * 70 + side * 12
		signpost(parent, at, -d, text, color)
		made.signs += 1
	end
	for name, text in names do
		post(Config.StationPos(name), text, (name == "Ring") and C3(30, 36, 66) or C3(150, 60, 50))
	end
	post(Config.BattlePos(), "STAGE BATTLE", C3(50, 90, 190))
	post(Config.TreadHallPos(), "TREADMILLS", C3(50, 150, 80))

	-- flags on the plaza corners
	for i, c in { C3(236, 70, 90), C3(60, 150, 230), C3(250, 200, 60), C3(90, 200, 120) } do
		local sx, sz = (i % 2 == 1) and 1 or -1, (i <= 2) and 1 or -1
		flag(parent, Vector3.new(sx * 52.5, 6.6, sz * 52.5), c)
	end

	-- flower beds, ponds, stalls, camps, a windmill
	for _, p in pickSpots(7, 80, 190, 14, 46, used) do
		flowerBed(parent, p, 7 + rng:NextNumber() * 2.5)
		made.beds += 1
	end
	for _, p in pickSpots(3, 130, 230, 26, 80, used) do
		pond(parent, p, 12 + rng:NextNumber() * 5)
		made.ponds += 1
	end
	for i, p in pickSpots(5, 72, 130, 14, 50, used) do
		stall(parent, CFrame.lookAt(p, Vector3.new(0, 0, 0)), (i % 2 == 0) and C3(236, 70, 90) or C3(60, 150, 230), C3(255, 255, 255))
		made.stalls += 1
	end
	for _, p in pickSpots(3, 140, 230, 12, 60, used) do
		campfire(parent, p)
		made.camps += 1
	end
	for _, p in pickSpots(1, 170, 235, 18, 60, used) do
		windmill(parent, p)
	end

	-- small things everywhere
	local function scatter(count, builder, margin)
		local placed, tries = 0, 0
		while placed < count and tries < count * 12 do
			tries += 1
			local x = (rng:NextNumber() * 2 - 1) * (HALF - 14)
			local z = (rng:NextNumber() * 2 - 1) * (HALF - 14)
			if not blocked(x, z, margin) then
				placed += 1
				builder(parent, Vector3.new(x, 0, z))
			end
		end
	end
	scatter(26, hay, 5)
	scatter(22, logPile, 5)
	scatter(46, mushrooms, 3)
	scatter(46, function(p, v) pineTree(p, v) end, 6)
	scatter(280, tuft, 1)

	-- clouds drifting high above the island
	for i = 1, 26 do
		local a = rng:NextNumber() * math.pi * 2
		local r = 60 + rng:NextNumber() * 480
		cloud(parent, Vector3.new(math.cos(a) * r, 150 + rng:NextNumber() * 90, math.sin(a) * r))
		made.clouds += 1
	end
	return made
end

--------------------------------------------------------------------------------
-- Build everything
--------------------------------------------------------------------------------
function Island.build(parent)
	local folder = Instance.new("Folder")
	folder.Name = "Island"
	folder.Parent = parent

	-- the lawn and the earth under it
	brick(folder, "IslandDirt", Vector3.new(HALF * 2, 20, HALF * 2), CFrame.new(0, -11, 0), DIRT_A, false)
	brick(folder, "Lawn", Vector3.new(HALF * 2, 1, HALF * 2), CFrame.new(0, -0.5, 0), GRASS_A, true)
	-- lighter and darker squares of lawn, like mown stripes
	for ix = -9, 9 do
		for iz = -9, 9 do
			if (ix + iz) % 2 == 0 and (math.abs(ix) > 1 and math.abs(iz) > 1) then
				brick(folder, "LawnPatch", Vector3.new(28, 0.06, 28), CFrame.new(ix * 28, 0.03, iz * 28), GRASS_B, true, { CanCollide = false })
			end
		end
	end

	-- the main cross of paths and the paths to each building
	local reach = HALF - 4
	pathBlock(folder, Vector3.zero, reach * 2, 20, CFrame.new(0, 0.15, 0))
	pathBlock(folder, Vector3.zero, reach * 2, 20, CFrame.new(0, 0.15, 0) * CFrame.Angles(0, math.pi / 2, 0))
	table.insert(strips, { Vector3.new(-reach, 0, 0), Vector3.new(reach, 0, 0) })
	table.insert(strips, { Vector3.new(0, 0, -reach), Vector3.new(0, 0, reach) })
	for name in Config.Stations do
		local pos, front = Config.StationPos(name), Config.StationFront(name)
		strip(folder, pos.Unit * 56, pos + front * (name == "Ring" and 50 or 22), 9)
	end
	strip(folder, Config.BattlePos().Unit * 56, Config.BattlePos() + Config.BattleFront() * 36, 9)
	strip(folder, Config.TreadHallPos().Unit * 56, (Config.TreadHallCF() * CFrame.new(0, 0, -30)).Position, 9)

	-- the central plaza: a big tan square with a gold border and corner pillars
	brick(folder, "Plaza", Vector3.new(104, 0.4, 104), CFrame.new(0, 0.2, 0), TAN_A, true)
	for ix = -3, 3 do
		for iz = -3, 3 do
			if (ix + iz) % 2 == 0 then
				brick(folder, "PlazaTile", Vector3.new(14, 0.45, 14), CFrame.new(ix * 14, 0.22, iz * 14), TAN_B, true, { CanCollide = false })
			end
		end
	end
	for side = -1, 1, 2 do
		brick(folder, "PlazaTrim", Vector3.new(105, 0.5, 1), CFrame.new(0, 0.25, side * 52.5), GOLD, false, { CanCollide = false })
		brick(folder, "PlazaTrim", Vector3.new(1, 0.5, 105), CFrame.new(side * 52.5, 0.25, 0), GOLD, false, { CanCollide = false })
	end
	for sx = -1, 1, 2 do
		for sz = -1, 1, 2 do
			brick(folder, "PlazaCorner", Vector3.new(4, 5, 4), CFrame.new(sx * 52.5, 2.5, sz * 52.5), BLACK, true)
			brick(folder, "PlazaCornerCap", Vector3.new(4.8, 0.8, 4.8), CFrame.new(sx * 52.5, 5.4, sz * 52.5), GOLD, false)
			brick(folder, "PlazaCornerCrown", Vector3.new(2, 1.4, 2), CFrame.new(sx * 52.5, 6.5, sz * 52.5), GOLD, true)
		end
	end

	-- lamps and benches along the paths
	for _, dir in { Vector3.new(1, 0, 0), Vector3.new(-1, 0, 0), Vector3.new(0, 0, 1), Vector3.new(0, 0, -1) } do
		local side = Vector3.new(-dir.Z, 0, dir.X)
		for i = 0, 6 do
			local d = 66 + i * 28
			for s = -1, 1, 2 do
				local p = dir * d + side * (13 * s)
				if not occupied(p.X, p.Z, 4) then
					lamp(folder, p + Vector3.new(0, 0.3, 0), i % 2 == 0)
				end
			end
			local bp = dir * (d + 14) + side * 15
			if i % 2 == 1 and not occupied(bp.X, bp.Z, 4) then
				bench(folder, CFrame.lookAt(bp, dir * (d + 14)) + Vector3.new(0, 0.3, 0))
			end
		end
	end

	-- two stone statue busts guarding the plaza
	bust(folder, BUSTS[1], "TRUE ADAM")
	bust(folder, BUSTS[2], "TRUE ADAM+")

	-- scenery on the lawns
	local function place(count, builder, margin, attempts)
		local placed, tries = 0, 0
		while placed < count and tries < attempts do
			tries += 1
			local x = (rng:NextNumber() * 2 - 1) * (HALF - 14)
			local z = (rng:NextNumber() * 2 - 1) * (HALF - 14)
			if not blocked(x, z, margin) then
				placed += 1
				builder(folder, Vector3.new(x, 0, z))
			end
		end
		return placed
	end
	local trees = place(150, voxelTree, 6, 3000)
	local extras = details(folder)
	place(110, bush, 4, 2000)
	place(170, flowers, 3, 2500)
	place(46, rock, 4, 1500)

	-- stepped green cliffs around everything, water and small islands beyond
	local cells = cliffs(folder)
	farIslands(folder)
	pcall(function()
		workspace.Terrain:FillBlock(CFrame.new(0, -14, 0), Vector3.new(3200, 24, 3200), Enum.Material.Water)
	end)
	-- invisible walls at the edge of the flat island
	for _, w in {
		{ Vector3.new(HALF * 2 + 8, 90, 2), Vector3.new(0, 44, HALF + 1) },
		{ Vector3.new(HALF * 2 + 8, 90, 2), Vector3.new(0, 44, -HALF - 1) },
		{ Vector3.new(2, 90, HALF * 2 + 8), Vector3.new(HALF + 1, 44, 0) },
		{ Vector3.new(2, 90, HALF * 2 + 8), Vector3.new(-HALF - 1, 44, 0) },
	} do
		local wall = brick(folder, "EdgeWall", w[1], CFrame.new(w[2]), C3(255, 255, 255), false, { Transparency = 1, CanQuery = false })
		wall.CanTouch = false
	end
	return { trees = trees, cliffCells = cells, extras = extras }
end

-- Pieces the Ranked Arena reuses so its cliffs match the rest of the island.
Island.voxelTree = voxelTree
Island.pineTree = pineTree
Island.rock = rock
Island.flowers = flowers

return Island

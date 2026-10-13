-- FIGURE ME OUT: builds the four maps that come from the map kit: Frosty Peaks, Candy Kingdom, Desert Ruins and Neon Station.
-- Each map is a big open arena (268 x 268) with a landmark in the middle, four raised decks with staircases, tall boundary walls and
-- about forty pieces of themed cover scattered where Maps.layout says (never on a spawn, a base, a crate or a terminal).
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Maps = require(Shared:WaitForChild("Maps"))

local MapKit = {}

local C = Color3.fromRGB
local M = Enum.Material
local PI = math.pi

--------------------------------------------------------------------------------
-- Small building blocks
--------------------------------------------------------------------------------
local function part(parent, name, size, cf, color, material, soft)
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.CFrame = cf
	p.Anchored = true
	p.Color = color
	p.Material = material or M.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	if soft then
		-- decoration: never blocks a hit, a view or a step
		p.CanCollide = false
		p.CanQuery = false
		p.CanTouch = false
		p.CastShadow = false
	end
	p.Parent = parent
	return p
end

-- A box standing on the ground (or at height y0), turned by `rot` degrees, centred at (x, z).
local function box(parent, name, x, z, w, h, d, y0, rot, color, material, soft)
	return part(parent, name, Vector3.new(w, h, d), CFrame.new(x, y0 + h / 2, z) * CFrame.Angles(0, math.rad(rot or 0), 0), color, material, soft)
end

-- An upright cylinder: diameter `dia`, height `h`, its bottom at y0.
local function cyl(parent, name, x, z, dia, h, y0, color, material, soft)
	local p = part(parent, name, Vector3.new(h, dia, dia), CFrame.new(x, y0 + h / 2, z) * CFrame.Angles(0, 0, PI / 2), color, material, soft)
	p.Shape = Enum.PartType.Cylinder
	return p
end

-- A cylinder lying down, pointing along `rot` degrees (0 = along x).
local function pipe(parent, name, x, y, z, length, dia, rot, color, material, soft)
	local p = part(parent, name, Vector3.new(length, dia, dia), CFrame.new(x, y, z) * CFrame.Angles(0, math.rad(rot), 0), color, material, soft)
	p.Shape = Enum.PartType.Cylinder
	return p
end

local function ball(parent, name, x, y, z, dia, color, material, soft, sy)
	local p = part(parent, name, Vector3.new(dia, dia * (sy or 1), dia), CFrame.new(x, y, z), color, material, soft)
	p.Shape = Enum.PartType.Ball
	return p
end

-- A staircase of `count` steps (each `rise` high and `run` deep, `width` wide) that climbs towards the deck edge at (x, edgeZ);
-- `sgn` is the direction in z the stairs run away from the deck.
local function stairs(parent, x, edgeZ, sgn, width, count, rise, run, color)
	for k = 1, count do
		local from, to = (count - k) * run, (count - k + 1) * run
		local z1, z2 = edgeZ + sgn * from, edgeZ + sgn * to
		part(parent, "Step", Vector3.new(width, k * rise, run), CFrame.new(x, k * rise / 2, (z1 + z2) / 2), color, M.SmoothPlastic)
	end
end

local function pick(list, variant)
	return list[(variant - 1) % #list + 1]
end

--------------------------------------------------------------------------------
-- Frosty Peaks
--------------------------------------------------------------------------------
local WHITE, SNOW = C(250, 252, 255), C(238, 246, 255)
local ICE, ICE2 = C(150, 210, 250), C(110, 180, 240)
local PINE, WOOD = C(46, 128, 86), C(138, 98, 62)

local frostProps = {}
function frostProps.igloo(f, x, z, rot, s)
	local dome = ball(f, "Igloo", x, 0, z, 15 * s, SNOW, M.Snow)
	local lookX, lookZ = math.cos(math.rad(rot)), math.sin(math.rad(rot))
	box(f, "IglooPorch", x + lookX * 6.5 * s, z - lookZ * 6.5 * s, 5 * s, 4 * s, 5 * s, 0, rot, SNOW, M.Snow)
	box(f, "IglooDoor", x + lookX * 9.1 * s, z - lookZ * 9.1 * s, 0.3, 3 * s, 3 * s, 0, rot, C(40, 70, 120), M.SmoothPlastic, true)
	for i = 1, 3 do -- ice-brick lines: thin rings round the dome
		local y = 1.7 * i * s
		local ring = ball(f, "IglooLine", x, y, z, 2 * math.sqrt(7.5 * 7.5 - (1.7 * i) * (1.7 * i)) * s + 0.1, ICE, M.Ice, true, 0.02)
		ring.Transparency = 0.5
	end
	return dome
end
function frostProps.pine(f, x, z, rot, s)
	cyl(f, "PineTrunk", x, z, 1.4 * s, 4 * s, 0, WOOD, M.Wood)
	for i = 1, 3 do
		local d, y = (10 - i * 2.4) * s, (2.4 + (i - 1) * 3.2) * s
		cyl(f, "PineTier", x, z, d, 2.6 * s, y, PINE, M.Grass)
		cyl(f, "PineSnow", x, z, d * 0.86, 0.7 * s, y + 2.4 * s, WHITE, M.Snow)
	end
	ball(f, "PineStar", x, 11.2 * s, z, 1.1 * s, C(255, 226, 90), M.Neon, true)
end
function frostProps.snowman(f, x, z, rot, s)
	ball(f, "SnowmanBase", x, 2.2 * s, z, 4.8 * s, WHITE, M.Snow)
	ball(f, "SnowmanMid", x, 5.4 * s, z, 3.5 * s, WHITE, M.Snow)
	ball(f, "SnowmanHead", x, 8 * s, z, 2.6 * s, WHITE, M.Snow)
	local fx, fz = math.cos(math.rad(rot)), -math.sin(math.rad(rot))
	box(f, "Carrot", x + fx * 1.4 * s, z + fz * 1.4 * s, 0.4 * s, 0.4 * s, 1.4 * s, 7.85 * s, rot + 90, C(255, 140, 30), M.SmoothPlastic, true)
	for _, e in { -0.45, 0.45 } do
		ball(f, "Coal", x + fx * 1.2 * s - fz * e * s, 8.4 * s, z + fz * 1.2 * s + fx * e * s, 0.4 * s, C(30, 30, 40), M.SmoothPlastic, true)
	end
	cyl(f, "Scarf", x, z, 3.1 * s, 0.7 * s, 6.5 * s, C(230, 60, 70), M.Fabric, true)
	cyl(f, "HatBrim", x, z, 3.2 * s, 0.25 * s, 9.2 * s, C(40, 40, 60), M.SmoothPlastic, true)
	cyl(f, "Hat", x, z, 1.9 * s, 1.5 * s, 9.4 * s, C(40, 40, 60), M.SmoothPlastic, true)
end
function frostProps.iceblock(f, x, z, rot, s, variant)
	local b = box(f, "IceBlock", x, z, 7 * s, 6 * s, 7 * s, 0, rot, ICE, M.Ice)
	b.Transparency = 0.25
	local core = box(f, "IceCore", x, z, 3.6 * s, 3.6 * s, 3.6 * s, 1.2 * s, rot + 20, ICE2, M.Glass, true)
	core.Transparency = 0.1
end
function frostProps.crystal(f, x, z, rot, s, variant)
	for i = 1, 3 do
		local h = (8 + i * 2.5) * s
		local a = rot + i * 120
		local ox, oz = math.cos(math.rad(a)) * 1.6 * s, -math.sin(math.rad(a)) * 1.6 * s
		local p = part(f, "Crystal", Vector3.new(2.2 * s, h, 2.2 * s), CFrame.new(x + ox, h / 2 - 0.5, z + oz) * CFrame.Angles(math.rad(8 * (i - 2)), math.rad(a), math.rad(6 * (2 - i))), pick({ ICE, C(180, 160, 255), C(140, 230, 255) }, variant + i), M.Glass)
		p.Transparency = 0.2
	end
	ball(f, "CrystalGlow", x, 1.2 * s, z, 2 * s, C(190, 240, 255), M.Neon, true)
end
function frostProps.cabin(f, x, z, rot, s)
	box(f, "CabinWalls", x, z, 14 * s, 7 * s, 11 * s, 0, rot, WOOD, M.Wood)
	for _, side in { -1, 1 } do
		local r = part(f, "CabinRoof", Vector3.new(15.5 * s, 0.9, 7.2 * s), CFrame.new(x, 8 * s, z) * CFrame.Angles(0, math.rad(rot), 0) * CFrame.new(0, 0, side * 2.9 * s) * CFrame.Angles(side * -0.5, 0, 0), WHITE, M.Snow)
		r.CanCollide = false
	end
	box(f, "CabinChimney", x + math.cos(math.rad(rot)) * 4 * s, z - math.sin(math.rad(rot)) * 4 * s, 2 * s, 5 * s, 2 * s, 7 * s, rot, C(150, 90, 80), M.Brick, true)
	local fx, fz = math.cos(math.rad(rot + 90)), -math.sin(math.rad(rot + 90))
	box(f, "CabinDoor", x + fx * 5.55 * s, z + fz * 5.55 * s, 3 * s, 4.5 * s, 0.3, 0, rot + 90, C(90, 60, 40), M.Wood, true)
	box(f, "CabinWindow", x + fx * 5.55 * s + math.cos(math.rad(rot)) * 4.2 * s, z + fz * 5.55 * s - math.sin(math.rad(rot)) * 4.2 * s, 2.4 * s, 2.4 * s, 0.3, 3 * s, rot + 90, C(255, 226, 120), M.Neon, true)
end
function frostProps.drift(f, x, z, rot, s)
	ball(f, "Drift", x, 0.4, z, 9 * s, WHITE, M.Snow, false, 0.45)
end

local function frostCenter(f)
	cyl(f, "Pond", 0, 0, 38, 0.5, 0, C(160, 214, 250), M.Ice)
	cyl(f, "PondRing", 0, 0, 40, 0.4, 0, WHITE, M.Snow)
	for i = 1, 6 do
		local a = i * PI / 3
		local p = part(f, "SpirePillar", Vector3.new(2.4, 12 + (i % 2) * 5, 2.4), CFrame.new(math.cos(a) * 12, 7, math.sin(a) * 12) * CFrame.Angles(0.12, a, 0.1), ICE, M.Ice)
		p.Transparency = 0.2
	end
	local spire = part(f, "Spire", Vector3.new(5, 26, 5), CFrame.new(0, 13, 0) * CFrame.Angles(0.04, 0.8, 0.04), C(190, 232, 255), M.Glass)
	spire.Transparency = 0.15
	ball(f, "SpireGlow", 0, 9, 0, 4, C(160, 240, 255), M.Neon, true)
	for _, y in { 8, 15, 22 } do
		cyl(f, "SpireRing", 0, 0, 10 - y * 0.2, 0.5, y, C(120, 220, 255), M.Neon, true)
	end
end

--------------------------------------------------------------------------------
-- Candy Kingdom
--------------------------------------------------------------------------------
local PINKS = { C(255, 120, 170), C(255, 170, 70), C(120, 220, 160), C(150, 130, 255), C(255, 226, 90), C(90, 200, 255) }
local candyProps = {}
function candyProps.lollipop(f, x, z, rot, s, variant)
	local col, col2 = pick(PINKS, variant), pick(PINKS, variant + 2)
	cyl(f, "LollipopStick", x, z, 0.9 * s, 9 * s, 0, WHITE, M.SmoothPlastic)
	local disc = part(f, "LollipopDisc", Vector3.new(1.2 * s, 8 * s, 8 * s), CFrame.new(x, 12.4 * s, z) * CFrame.Angles(0, math.rad(rot), 0), col, M.SmoothPlastic)
	disc.Shape = Enum.PartType.Cylinder
	local swirl = part(f, "LollipopSwirl", Vector3.new(1.4 * s, 5.4 * s, 5.4 * s), CFrame.new(x, 12.4 * s, z) * CFrame.Angles(0, math.rad(rot), 0), col2, M.SmoothPlastic, true)
	swirl.Shape = Enum.PartType.Cylinder
	local core = part(f, "LollipopCore", Vector3.new(1.6 * s, 2.4 * s, 2.4 * s), CFrame.new(x, 12.4 * s, z) * CFrame.Angles(0, math.rad(rot), 0), WHITE, M.SmoothPlastic, true)
	core.Shape = Enum.PartType.Cylinder
end
function candyProps.cupcake(f, x, z, rot, s, variant)
	cyl(f, "CupcakeCup", x, z, 6 * s, 3.4 * s, 0, pick({ C(255, 255, 255), C(255, 214, 120), C(150, 220, 255) }, variant), M.SmoothPlastic)
	for i = 0, 5 do
		local a = i * PI / 3
		box(f, "CupcakeRidge", x + math.cos(a) * 3 * s, z + math.sin(a) * 3 * s, 0.4, 3.2 * s, 0.4, 0.1, 0, C(255, 255, 255), M.SmoothPlastic, true)
	end
	ball(f, "CupcakeFrosting", x, 4.4 * s, z, 6.6 * s, pick(PINKS, variant + 1), M.SmoothPlastic, false, 0.8)
	ball(f, "CupcakeCherry", x, 7.4 * s, z, 1.6 * s, C(230, 40, 60), M.Glass, true)
end
function candyProps.gumdrop(f, x, z, rot, s, variant)
	local col = pick(PINKS, variant + 3)
	ball(f, "Gumdrop", x, 1.2 * s, z, 7.4 * s, col, M.SmoothPlastic, false, 0.9)
	for i = 0, 6 do
		local a = i * 0.9 + rot
		ball(f, "Sugar", x + math.cos(a) * 2.6 * s, 3 * s + (i % 3) * 0.7 * s, z + math.sin(a) * 2.6 * s, 0.35, WHITE, M.Neon, true)
	end
end
function candyProps.cane(f, x, z, rot, s)
	for i = 1, 6 do
		cyl(f, "CaneStripe", x, z, 1.7 * s, 1.7 * s, (i - 1) * 1.7 * s, i % 2 == 0 and WHITE or C(235, 50, 70), M.SmoothPlastic)
	end
	local hook = pipe(f, "CaneHook", x + math.cos(math.rad(rot)) * 1.2 * s, 10.5 * s, z - math.sin(math.rad(rot)) * 1.2 * s, 3.6 * s, 1.7 * s, rot, C(235, 50, 70), M.SmoothPlastic)
	return hook
end
function candyProps.donut(f, x, z, rot, s, variant)
	cyl(f, "Donut", x, z, 12 * s, 3 * s, 0, C(236, 180, 110), M.SmoothPlastic)
	cyl(f, "DonutIcing", x, z, 12.2 * s, 0.7 * s, 3 * s, pick(PINKS, variant), M.SmoothPlastic)
	cyl(f, "DonutHole", x, z, 3.4 * s, 0.9 * s, 3.1 * s, C(255, 205, 228), M.SmoothPlastic, true)
	for i = 0, 8 do
		local a = i * 0.7 + rot
		local r = 3.5 + (i % 3) * 1.2
		box(f, "Sprinkle", x + math.cos(a) * r * s, z + math.sin(a) * r * s, 0.25, 0.25, 1, 3.7 * s, i * 40, pick(PINKS, i + 1), M.Neon, true)
	end
end
function candyProps.cookie(f, x, z, rot, s)
	cyl(f, "Cookie", x, z, 11 * s, 2.6 * s, 0, C(196, 140, 82), M.Sand)
	for i = 0, 6 do
		local a = i * 0.9 + rot
		ball(f, "Chip", x + math.cos(a) * (1.5 + i % 3 * 1.3) * s, 2.6 * s, z + math.sin(a) * (1.5 + i % 3 * 1.3) * s, 1.1 * s, C(80, 48, 30), M.SmoothPlastic, true)
	end
end

local function candyCenter(f)
	local tiers = { { 34, 3, C(255, 150, 200) }, { 24, 3, C(255, 244, 250) }, { 14, 3, C(255, 120, 170) } }
	local y = 0
	for i, t in tiers do
		cyl(f, "CakeTier", 0, 0, t[1], t[2], y, t[3], M.SmoothPlastic)
		cyl(f, "CakeIcing", 0, 0, t[1] + 0.6, 0.5, y + t[2] - 0.1, WHITE, M.SmoothPlastic, true)
		for k = 0, 11 do
			local a = k * PI / 6
			ball(f, "CakeDrop", math.cos(a) * t[1] / 2, y + t[2] - 0.8, math.sin(a) * t[1] / 2, 1.6, pick(PINKS, k + i), M.SmoothPlastic, true)
		end
		y += t[2]
	end
	for k = 0, 4 do
		local a = k * PI * 2 / 5
		cyl(f, "Candle", math.cos(a) * 4, math.sin(a) * 4, 0.8, 4, y, pick(PINKS, k), M.SmoothPlastic, true)
		ball(f, "Flame", math.cos(a) * 4, y + 4.5, math.sin(a) * 4, 1, C(255, 220, 90), M.Neon, true)
	end
	ball(f, "CakeCherry", 0, y + 1.6, 0, 3.4, C(230, 40, 60), M.Glass)
end

--------------------------------------------------------------------------------
-- Desert Ruins
--------------------------------------------------------------------------------
local SAND, STONE, DARKSTONE = C(238, 204, 140), C(214, 170, 108), C(176, 130, 84)
local desertProps = {}
function desertProps.pillar(f, x, z, rot, s, variant)
	local h = (variant == 1 and 7 or 14) * s
	box(f, "PillarBase", x, z, 5 * s, 1.2 * s, 5 * s, 0, rot, DARKSTONE, M.Sandstone)
	cyl(f, "Pillar", x, z, 3.4 * s, h, 1.2 * s, STONE, M.Sandstone)
	for i = 1, 3 do
		cyl(f, "PillarRing", x, z, 3.7 * s, 0.4, 1.2 * s + i * h / 4, DARKSTONE, M.Sandstone, true)
	end
	if variant ~= 1 then
		box(f, "PillarCap", x, z, 5.2 * s, 1.2 * s, 5.2 * s, h + 1.2 * s, rot, DARKSTONE, M.Sandstone)
	else
		box(f, "Rubble", x + 2.6 * s, z + 1.4 * s, 2 * s, 1.2 * s, 1.6 * s, 0, rot + 30, STONE, M.Sandstone, true)
	end
end
function desertProps.ruin(f, x, z, rot, s)
	local c, sn = math.cos(math.rad(rot)), -math.sin(math.rad(rot))
	box(f, "RuinWall", x, z, 14 * s, 9 * s, 2.6 * s, 0, rot, STONE, M.Sandstone)
	box(f, "RuinWallShort", x + c * 6 * s - sn * 3 * s, z + sn * 6 * s + c * 3 * s, 2.6 * s, 5.5 * s, 6 * s, 0, rot, DARKSTONE, M.Sandstone)
	box(f, "RuinArch", x - c * 3 * s, z - sn * 3 * s, 3 * s, 3 * s, 3 * s, 9 * s, rot + 15, STONE, M.Sandstone, true)
	for i = 1, 3 do
		box(f, "Rubble", x - c * (4 - i * 3) * s + sn * 3.4 * s, z - sn * (4 - i * 3) * s - c * 3.4 * s, 1.6 * s, 1.1 * s, 1.5 * s, 0, rot + i * 40, DARKSTONE, M.Sandstone, true)
	end
end
function desertProps.cactus(f, x, z, rot, s)
	local green = C(80, 160, 80)
	cyl(f, "Cactus", x, z, 2.2 * s, 9 * s, 0, green, M.Grass)
	for side = -1, 1, 2 do
		local ax, az = math.cos(math.rad(rot)) * side, -math.sin(math.rad(rot)) * side
		pipe(f, "CactusArm", x + ax * 1.9 * s, 4.4 * s + (side + 1) * 0.5 * s, z + az * 1.9 * s, 2.6 * s, 1.3 * s, rot, green, M.Grass)
		cyl(f, "CactusArmUp", x + ax * 3.1 * s, z + az * 3.1 * s, 1.3 * s, 3.2 * s, 4.4 * s + (side + 1) * 0.5 * s, green, M.Grass)
	end
	ball(f, "CactusFlower", x, 9.4 * s, z, 1 * s, C(255, 120, 170), M.SmoothPlastic, true)
end
function desertProps.minipyramid(f, x, z, rot, s)
	for i = 1, 3 do
		box(f, "MiniPyramid", x, z, (15 - i * 4) * s, 2.6 * s, (15 - i * 4) * s, (i - 1) * 2.6 * s, rot, i % 2 == 0 and STONE or DARKSTONE, M.Sandstone)
	end
end
function desertProps.rocks(f, x, z, rot, s, variant)
	ball(f, "Rock", x, 1.6 * s, z, 7 * s, C(190, 150, 110), M.Rock, false, 0.7)
	ball(f, "Rock", x + 3.4 * s, 0.8 * s, z + 1 * s, 4 * s, C(176, 136, 98), M.Rock, false, 0.7)
	ball(f, "Rock", x - 2.6 * s, 0.7 * s, z - 2 * s, 3.4 * s, C(200, 160, 120), M.Rock, false, 0.7)
end
function desertProps.palm(f, x, z, rot, s)
	cyl(f, "PalmTrunk", x, z, 1.3 * s, 11 * s, 0, C(150, 110, 70), M.Wood)
	for i = 0, 5 do
		local a = i * PI / 3 + rot
		part(f, "PalmLeaf", Vector3.new(7 * s, 0.25, 1.8 * s), CFrame.new(x + math.cos(a) * 3 * s, 11.2 * s, z + math.sin(a) * 3 * s) * CFrame.Angles(0, -a, -0.35), C(70, 160, 70), M.Grass, true)
	end
	ball(f, "Coconut", x + 0.6, 10.4 * s, z, 1 * s, C(110, 74, 44), M.SmoothPlastic, true)
end
function desertProps.obelisk(f, x, z, rot, s)
	box(f, "ObeliskBase", x, z, 4.4 * s, 1.5 * s, 4.4 * s, 0, rot, DARKSTONE, M.Sandstone)
	box(f, "Obelisk", x, z, 3 * s, 16 * s, 3 * s, 1.5 * s, rot, STONE, M.Sandstone)
	box(f, "ObeliskTip", x, z, 2 * s, 2 * s, 2 * s, 17.5 * s, rot + 45, C(255, 214, 90), M.Neon, true)
	for i = 0, 4 do
		box(f, "Glyph", x, z, 3.1 * s, 0.4, 3.1 * s, 4 * s + i * 2.4 * s, rot, C(110, 70, 40), M.SmoothPlastic, true)
	end
end

local function desertCenter(f)
	local steps = { { 38, 4 }, { 30, 4 }, { 22, 4 }, { 14, 4 }, { 7, 4 } }
	for i, st in steps do
		box(f, "Pyramid", 0, 0, st[1], st[2], st[1], (i - 1) * st[2], 0, i % 2 == 0 and STONE or SAND, M.Sandstone)
	end
	box(f, "PyramidCap", 0, 0, 3.4, 3.4, 3.4, 20, 45, C(255, 214, 90), M.Neon)
	pipe(f, "SunDisc", 0, 27, 0, 0.8, 9, 0, C(255, 190, 60), M.Neon, true)
	for _, a in { 0, PI / 2, PI, PI * 1.5 } do
		box(f, "PyramidBrazier", math.cos(a) * 21, math.sin(a) * 21, 2, 2.4, 2, 0, 0, DARKSTONE, M.Sandstone, true)
		ball(f, "PyramidFlame", math.cos(a) * 21, 3.1, math.sin(a) * 21, 1.8, C(255, 150, 40), M.Neon, true)
	end
end

--------------------------------------------------------------------------------
-- Neon Station
--------------------------------------------------------------------------------
local METAL, DARK, CYAN, MAG = C(70, 78, 112), C(40, 44, 70), C(70, 240, 255), C(255, 80, 200)
local CARGO = { C(220, 80, 70), C(240, 160, 50), C(70, 150, 230), C(60, 190, 160) }
local stationProps = {}
function stationProps.container(f, x, z, rot, s, variant)
	local col = pick(CARGO, variant)
	local c, sn = math.cos(math.rad(rot)), -math.sin(math.rad(rot))
	box(f, "Container", x, z, 14 * s, 6.5 * s, 6 * s, 0, rot, col, M.Metal)
	for i = -3, 3 do
		box(f, "ContainerRib", x + c * i * 1.8 * s, z + sn * i * 1.8 * s, 0.4, 6.7 * s, 6.2 * s, 0, rot, col:Lerp(C(0, 0, 0), 0.25), M.Metal, true)
	end
	box(f, "ContainerStripe", x, z, 14.2 * s, 0.5, 6.2 * s, 5.2 * s, rot, CYAN, M.Neon, true)
end
function stationProps.pipe(f, x, z, rot, s)
	local c, sn = math.cos(math.rad(rot)), -math.sin(math.rad(rot))
	pipe(f, "Pipe", x, 2.4 * s, z, 12 * s, 3.2 * s, rot, METAL, M.Metal)
	for _, side in { -1, 1 } do
		box(f, "PipeLeg", x + c * side * 4.4 * s, z + sn * side * 4.4 * s, 1.2 * s, 1.4 * s, 1.2 * s, 0, rot, DARK, M.Metal)
	end
	pipe(f, "PipeBand", x, 2.4 * s, z, 0.7, 3.5 * s, rot, MAG, M.Neon, true)
end
function stationProps.console(f, x, z, rot, s)
	box(f, "Console", x, z, 6 * s, 3.4 * s, 3 * s, 0, rot, DARK, M.Metal)
	local c, sn = math.cos(math.rad(rot)), -math.sin(math.rad(rot))
	part(f, "Screen", Vector3.new(5 * s, 2.4 * s, 0.3), CFrame.new(x, 4.6 * s, z) * CFrame.Angles(0, math.rad(rot), -0.2) * CFrame.Angles(0.2, 0, 0), C(40, 200, 255), M.Neon, true)
	for i = -2, 2 do
		ball(f, "Light", x + c * i * 1 * s, 3.5 * s, z + sn * i * 1 * s, 0.35, i % 2 == 0 and MAG or CYAN, M.Neon, true)
	end
end
function stationProps.pylon(f, x, z, rot, s)
	cyl(f, "Pylon", x, z, 2 * s, 16 * s, 0, DARK, M.Metal)
	for _, y in { 3, 8, 13 } do
		cyl(f, "PylonRing", x, z, 2.6 * s, 0.5, y * s, CYAN, M.Neon, true)
	end
	ball(f, "PylonTop", x, 16.6 * s, z, 1.6 * s, MAG, M.Neon, true)
end
function stationProps.tank(f, x, z, rot, s)
	cyl(f, "Tank", x, z, 8 * s, 9 * s, 0, METAL, M.Metal)
	ball(f, "TankDome", x, 9 * s, z, 8 * s, METAL, M.Metal, false, 0.45)
	cyl(f, "TankBand", x, z, 8.3 * s, 0.7, 4 * s, CYAN, M.Neon, true)
	cyl(f, "TankBand", x, z, 8.3 * s, 0.7, 6.4 * s, MAG, M.Neon, true)
end
function stationProps.holo(f, x, z, rot, s)
	cyl(f, "HoloBase", x, z, 4.4 * s, 1.2 * s, 0, DARK, M.Metal)
	local g = ball(f, "Hologram", x, 4.2 * s, z, 3.6 * s, C(90, 240, 255), M.Neon, true)
	g.Transparency = 0.55
	cyl(f, "HoloRing", x, z, 5 * s, 0.25, 4.1 * s, MAG, M.Neon, true)
	cyl(f, "HoloPost", x, z, 0.8 * s, 3 * s, 1.2 * s, DARK, M.Metal)
end
function stationProps.crate(f, x, z, rot, s, variant)
	box(f, "Crate", x, z, 5 * s, 5 * s, 5 * s, 0, rot, METAL, M.Metal)
	box(f, "CrateBand", x, z, 5.2 * s, 0.5, 5.2 * s, 2.2 * s, rot, pick({ CYAN, MAG }, variant), M.Neon, true)
	box(f, "CrateBand", x, z, 0.5, 5.2 * s, 5.2 * s, 0, rot, pick({ CYAN, MAG }, variant), M.Neon, true)
end

local function stationCenter(f)
	cyl(f, "ReactorBase", 0, 0, 34, 2, 0, DARK, M.Metal)
	cyl(f, "ReactorPad", 0, 0, 28, 0.4, 2, METAL, M.DiamondPlate)
	local core = cyl(f, "ReactorCore", 0, 0, 9, 26, 2.4, C(60, 220, 255), M.Neon)
	core.Transparency = 0.15
	for _, y in { 6, 12, 18, 24 } do
		cyl(f, "ReactorRing", 0, 0, 15 - (y - 6) * 0.25, 0.7, y, MAG, M.Neon, true)
	end
	for k = 0, 5 do
		local a = k * PI / 3
		box(f, "ReactorStrut", math.cos(a) * 12, math.sin(a) * 12, 1.4, 9, 1.4, 2, math.deg(-a), DARK, M.Metal)
	end
	local light = Instance.new("PointLight")
	light.Range = 70
	light.Brightness = 2.5
	light.Color = C(110, 230, 255)
	light.Parent = core
end

--------------------------------------------------------------------------------
-- School Yard (the courtyard of the original game: cream walls with an orange band, teal and yellow wooden boxes, a blue
-- basketball court, wooden decks, hedges, planters, log stacks, lockers and round trees)
--------------------------------------------------------------------------------
local PLASTER, ORANGE, TEAL, YELLOW = C(238, 228, 208), C(226, 110, 40), C(40, 150, 150), C(230, 190, 70)
local PLANK, PLANK2, LEAF = C(166, 112, 60), C(132, 88, 46), C(70, 150, 70)
local schoolProps = {}
function schoolProps.bench(f, x, z, rot, s)
	local c, sn = math.cos(math.rad(rot)), -math.sin(math.rad(rot))
	box(f, "BenchSeat", x, z, 6 * s, 0.6, 2 * s, 1.6 * s, rot, PLANK, M.Wood)
	box(f, "BenchBack", x - sn * 0.9 * s, z - c * 0.9 * s, 6 * s, 1.6 * s, 0.4, 2.2 * s, rot, PLANK2, M.Wood)
	for _, side in { -1, 1 } do
		box(f, "BenchLeg", x + c * side * 2.4 * s, z + sn * side * 2.4 * s, 0.5, 1.6 * s, 1.8 * s, 0, rot, C(60, 60, 66), M.Metal)
	end
end
function schoolProps.hedge(f, x, z, rot, s)
	box(f, "Hedge", x, z, 9 * s, 3.4 * s, 2.6 * s, 0, rot, LEAF, M.Grass)
	local c, sn = math.cos(math.rad(rot)), -math.sin(math.rad(rot))
	for i = -2, 2 do
		ball(f, "HedgeTop", x + c * i * 1.8 * s, 3.5 * s, z + sn * i * 1.8 * s, 2.8 * s, C(92, 168, 84), M.Grass, true)
	end
end
function schoolProps.planter(f, x, z, rot, s)
	box(f, "Planter", x, z, 5 * s, 2.2 * s, 3.2 * s, 0, rot, PLANK, M.Wood)
	box(f, "PlanterSoil", x, z, 4.4 * s, 0.3, 2.6 * s, 2.2 * s, rot, C(80, 56, 38), M.Ground, true)
	for i = -1, 1 do
		ball(f, "PlanterBush", x + i * 1.3 * s, 3.2 * s, z, 2.2 * s, i == 0 and LEAF or C(96, 172, 88), M.Grass, true)
	end
end
function schoolProps.logs(f, x, z, rot, s)
	local c, sn = math.cos(math.rad(rot)), -math.sin(math.rad(rot))
	for row = 0, 2 do
		for i = 0, 3 - row do
			local off = (i - (3 - row) / 2) * 1.25 * s
			pipe(f, "Log", x - sn * off, (0.6 + row * 1.05) * s, z + c * off, 5 * s, 1.15 * s, rot, row % 2 == 0 and PLANK or PLANK2, M.Wood)
		end
	end
	for _, side in { -1, 1 } do
		box(f, "LogPost", x + c * side * 2.7 * s, z + sn * side * 2.7 * s, 0.4, 3.4 * s, 0.4, 0, rot, PLANK2, M.Wood, true)
	end
end
function schoolProps.locker(f, x, z, rot, s, variant)
	local col = pick({ TEAL, ORANGE, C(120, 126, 140) }, variant)
	local c, sn = math.cos(math.rad(rot)), -math.sin(math.rad(rot))
	box(f, "Lockers", x, z, 8 * s, 7 * s, 2.4 * s, 0, rot, col, M.Metal)
	for i = -1, 1 do
		box(f, "LockerDoor", x + c * i * 2.6 * s, z + sn * i * 2.6 * s, 2.4 * s, 6 * s, 2.5 * s, 0.5, rot, col:Lerp(C(0, 0, 0), 0.18), M.Metal, true)
	end
end
function schoolProps.tree(f, x, z, rot, s)
	cyl(f, "TreeTrunk", x, z, 1.7 * s, 6.5 * s, 0, C(120, 84, 52), M.Wood)
	ball(f, "TreeCanopy", x, 11 * s, z, 11 * s, C(66, 150, 70), M.Grass)
	ball(f, "TreeCanopy", x + 2.6 * s, 9 * s, z + 1.5 * s, 7.5 * s, C(82, 168, 80), M.Grass)
	ball(f, "TreeCanopy", x - 2.4 * s, 9.6 * s, z - 1.4 * s, 7 * s, C(58, 138, 64), M.Grass)
end
function schoolProps.stack(f, x, z, rot, s, variant)
	-- teal and yellow wooden boxes, stacked
	local a, b = pick({ TEAL, YELLOW }, variant), pick({ YELLOW, TEAL }, variant)
	box(f, "CrateBox", x, z, 4.6 * s, 3.6 * s, 4.6 * s, 0, rot, a, M.Wood)
	box(f, "CrateTrim", x, z, 4.8 * s, 0.4, 4.8 * s, 3.4 * s, rot, PLANK2, M.Wood, true)
	box(f, "CrateBox", x + 0.4 * s, z - 0.2 * s, 4 * s, 3.2 * s, 4 * s, 3.6 * s, rot + 12, b, M.Wood)
end
function schoolProps.fence(f, x, z, rot, s)
	local c, sn = math.cos(math.rad(rot)), -math.sin(math.rad(rot))
	box(f, "FenceBoards", x, z, 9 * s, 4.4 * s, 0.4, 0, rot, PLANK, M.Wood)
	for i = -2, 2 do
		box(f, "FencePost", x + c * i * 2.2 * s, z + sn * i * 2.2 * s, 0.5, 5 * s, 0.7, 0, rot, PLANK2, M.Wood, true)
	end
	box(f, "FenceRail", x, z, 9.2 * s, 0.4, 0.7, 3 * s, rot, PLANK2, M.Wood, true)
end
function schoolProps.bush(f, x, z, rot, s)
	ball(f, "Bush", x, 1.6 * s, z, 4.6 * s, LEAF, M.Grass, false, 0.8)
	ball(f, "BushFlower", x + 1 * s, 3 * s, z + 0.5 * s, 0.8 * s, C(255, 130, 170), M.SmoothPlastic, true)
end

local function schoolCenter(f)
	-- the basketball court: a blue slab with white lines and a hoop at each end
	box(f, "Court", 0, 0, 38, 0.3, 22, 0, 0, C(54, 116, 188), M.SmoothPlastic)
	box(f, "CourtEdge", 0, 0, 40, 0.2, 24, 0, 0, C(226, 120, 60), M.SmoothPlastic, true)
	local function line(x, z, w, d)
		box(f, "CourtLine", x, z, w, 0.06, d, 0.32, 0, WHITE, M.SmoothPlastic, true)
	end
	line(0, -10.5, 36, 0.4); line(0, 10.5, 36, 0.4); line(-18, 0, 0.4, 21); line(18, 0, 0.4, 21); line(0, 0, 0.4, 21)
	cyl(f, "CourtCircle", 0, 0, 8, 0.06, 0.32, WHITE, M.SmoothPlastic, true)
	cyl(f, "CourtCircleInner", 0, 0, 7.2, 0.07, 0.33, C(54, 116, 188), M.SmoothPlastic, true)
	for _, side in { -1, 1 } do
		line(side * 13, 0, 0.4, 9); line(side * 15.5, -4.5, 5, 0.4); line(side * 15.5, 4.5, 5, 0.4)
		local hx = side * 19.2
		cyl(f, "HoopPole", hx + side * 1.4, 0, 0.7, 10, 0, C(70, 74, 82), M.Metal)
		box(f, "HoopBoard", hx, 0, 0.4, 4, 6, 8, 0, WHITE, M.SmoothPlastic)
		cyl(f, "HoopRim", hx - side * 1.1, 0, 2.2, 0.2, 8.6, C(255, 110, 40), M.Neon, true)
		box(f, "HoopSquare", hx - side * 0.25, 0, 0.1, 2, 2.6, 8.4, 0, C(40, 40, 46), M.SmoothPlastic, true)
	end
end

--------------------------------------------------------------------------------
-- The shared parts: ground, decks, walls
--------------------------------------------------------------------------------
local PROPS = { school = schoolProps, frost = frostProps, candy = candyProps, desert = desertProps, station = stationProps }
local CENTERS = { school = schoolCenter, frost = frostCenter, candy = candyCenter, desert = desertCenter, station = stationCenter }
local DECKS = {
	school = { Body = PLANK, Mat = M.Wood, Trim = PLANK2, Stair = C(190, 134, 76), Light = nil },
	frost = { Body = ICE, Mat = M.Ice, Trim = WHITE, Stair = SNOW, Light = C(160, 240, 255) },
	candy = { Body = C(255, 150, 200), Mat = M.SmoothPlastic, Trim = WHITE, Stair = C(255, 226, 120), Light = C(255, 255, 255) },
	desert = { Body = STONE, Mat = M.Sandstone, Trim = DARKSTONE, Stair = SAND, Light = C(255, 190, 70) },
	station = { Body = METAL, Mat = M.Metal, Trim = DARK, Stair = DARK, Light = CYAN },
}

local function deck(parent, id, d)
	local pal = DECKS[id]
	local x, z, sgn = d[1], d[2], d[3]
	local size, h = Maps.DeckSize, Maps.DeckHeight
	box(parent, "Deck", x, z, size, h, size, 0, 0, pal.Body, pal.Mat)
	box(parent, "DeckTop", x, z, size + 0.6, 0.6, size + 0.6, h, 0, pal.Trim, pal.Mat)
	-- a low rim on three sides (the stairs side stays open)
	for _, side in { -1, 1 } do
		box(parent, "DeckRim", x + side * (size / 2 - 0.4), z, 0.8, 1.6, size, h + 0.6, 0, pal.Trim, pal.Mat)
	end
	box(parent, "DeckRim", x, z - sgn * (size / 2 - 0.4), size, 1.6, 0.8, h + 0.6, 0, pal.Trim, pal.Mat)
	stairs(parent, x, z + sgn * size / 2, sgn, 6, h, 1, 2, pal.Stair)
	if pal.Light then
		box(parent, "DeckGlow", x, z, size - 2, 0.2, size - 2, h + 0.6, 0, pal.Light, M.Neon, true)
	end
end

local function walls(parent, id, spec)
	local half = Maps.Half + 2
	local h = spec.Height
	local segs = 12
	local len = (half * 2 + 4) / segs
	for side = 1, 4 do
		for i = 0, segs - 1 do
			local t = -half - 2 + len * (i + 0.5)
			local x, z, w, d
			if side == 1 then x, z, w, d = t, -half, len + 0.2, 4
			elseif side == 2 then x, z, w, d = t, half, len + 0.2, 4
			elseif side == 3 then x, z, w, d = -half, t, 4, len + 0.2
			else x, z, w, d = half, t, 4, len + 0.2 end
			local color = spec.Color
			if spec.Alt and i % 2 == 1 then
				color = spec.Alt
			end
			part(parent, "Wall", Vector3.new(w, h, d), CFrame.new(x, h / 2, z), color, spec.Material)
		end
	end
	-- a bright cap along the top of every wall
	for _, def in { { 0, -half, half * 2 + 4, 1 }, { 0, half, half * 2 + 4, 1 }, { -half, 0, 1, half * 2 + 4 }, { half, 0, 1, half * 2 + 4 } } do
		part(parent, "WallCap", Vector3.new(def[3], 1.2, def[4]), CFrame.new(def[1], h + 0.6, def[2]), spec.Trim, spec.Cap or M.Neon, true)
	end
end

local function decorGround(parent, id, spec)
	local seed = 77
	local function rnd()
		seed = (seed * 48271) % 2147483647
		return seed / 2147483647
	end
	if id == "station" then
		-- a glowing grid on the floor
		for t = -120, 120, 20 do
			part(parent, "GridLine", Vector3.new(0.4, 0.06, 262), CFrame.new(t, 0.04, 0), CYAN, M.Neon, true)
			part(parent, "GridLine", Vector3.new(262, 0.06, 0.4), CFrame.new(0, 0.04, t), CYAN, M.Neon, true)
		end
		for _, b in { -100, 100 } do
			part(parent, "LaunchPad", Vector3.new(22, 0.08, 22), CFrame.new(b, 0.06, 0), MAG, M.Neon, true).Transparency = 0.7
		end
		return
	end
	if id == "school" then
		-- a stone path from each base to the court, tan paving patches and white painted lines
		for _, side in { -1, 1 } do
			for k = 0, 9 do
				box(parent, "StoneTile", side * (30 + k * 6.2), (k % 2) * 1.2 - 0.6, 5, 0.14, 4.2, 0.04, k * 7, C(168, 164, 160), M.Slate, true)
			end
		end
		for _ = 1, 36 do
			local x, z = (rnd() * 2 - 1) * 120, (rnd() * 2 - 1) * 120
			box(parent, "PavingPatch", x, z, 8 + rnd() * 14, 0.06, 6 + rnd() * 10, 0.04, rnd() * 90, spec.Patch, M.Concrete, true)
		end
		for _, z in { -64, 64 } do
			box(parent, "PaintedLine", 0, z, 150, 0.06, 0.5, 0.06, 0, WHITE, M.SmoothPlastic, true)
		end
		return
	end
	for _ = 1, 70 do
		local x, z = (rnd() * 2 - 1) * 126, (rnd() * 2 - 1) * 126
		if id == "candy" then
			local p = box(parent, "Sprinkle", x, z, 0.5, 0.15, 2.4, 0.06, rnd() * 180, pick(PINKS, 1 + math.floor(rnd() * 6)), M.Neon, true)
			p.Transparency = 0.1
		elseif id == "frost" then
			local p = ball(parent, "SnowPatch", x, 0.05, z, 6 + rnd() * 10, spec.Patch, M.Snow, true, 0.02)
			p.Transparency = 0.3
		else
			local p = ball(parent, "SandPatch", x, 0.05, z, 8 + rnd() * 14, spec.Patch, M.Sand, true, 0.02)
			p.Transparency = 0.3
		end
	end
end

local function wallDetail(parent, id, spec)
	local half = Maps.Half + 2
	if id == "school" then
		-- an orange band along the bottom of every wall, rows of windows, teal doors and a dark roof line
		for _, def in { { 0, -half + 2.05, 0 }, { 0, half - 2.05, 0 }, { -half + 2.05, 0, 90 }, { half - 2.05, 0, 90 } } do
			local along = def[3] == 0
			box(parent, "WallBand", def[1], def[2], along and 264 or 0.3, 7, along and 0.3 or 264, 0, 0, ORANGE, M.SmoothPlastic, true)
			for i = -4, 4 do
				local off = i * 28 + 8
				local wx, wz = along and off or def[1], along and def[2] or off
				box(parent, "Window", wx, wz, along and 9 or 0.3, 6, along and 0.3 or 9, 17, 0, C(40, 70, 110), M.Glass, true).Transparency = 0.25
				box(parent, "WindowFrame", wx, wz, along and 10 or 0.2, 7, along and 0.2 or 10, 16.5, 0, C(250, 246, 236), M.SmoothPlastic, true)
				if i % 3 == 0 then
					box(parent, "Door", wx + (along and 14 or 0), wz + (along and 0 or 14), along and 6 or 0.3, 10, along and 0.3 or 6, 0, 0, TEAL, M.Wood, true)
				end
			end
		end
		return
	end
	if id == "candy" then
		for i = -5, 5 do
			local off = i * 24
			for _, o in { { off, -half + 3 }, { off, half - 3 }, { -half + 3, off }, { half - 3, off } } do
				ball(parent, "WallGumdrop", o[1], spec.Height + 1.6, o[2], 5, pick(PINKS, i + 6), M.SmoothPlastic, true, 0.8)
			end
		end
	elseif id == "frost" then
		for i = -5, 5 do
			local off = i * 24 + 6
			for _, o in { { off, -half - 4, 0 }, { off, half + 4, 0 }, { -half - 4, off, 90 }, { half + 4, off, 90 } } do
				local peak = part(parent, "IcePeak", Vector3.new(14, 22 + (i % 3) * 8, 14), CFrame.new(o[1], spec.Height + 4, o[2]) * CFrame.Angles(0.2, math.rad(o[3] + i * 20), 0.2), ICE, M.Ice, true)
				peak.Transparency = 0.15
			end
		end
	elseif id == "desert" then
		for i = -10, 10 do
			local off = i * 12.5
			for _, o in { { off, -half }, { off, half }, { -half, off }, { half, off } } do
				if i % 2 == 0 then
					part(parent, "Merlon", Vector3.new(4, 3, 4), CFrame.new(o[1], spec.Height + 2.2, o[2]), STONE, M.Sandstone, true)
				end
			end
		end
	else
		for i = -4, 4 do
			local off = i * 28
			for _, o in { { off, -half + 2.1, 0 }, { off, half - 2.1, 0 }, { -half + 2.1, off, 90 }, { half - 2.1, off, 90 } } do
				local win = part(parent, "Window", Vector3.new(o[3] == 0 and 18 or 0.3, 10, o[3] == 0 and 0.3 or 18), CFrame.new(o[1], spec.Height * 0.55, o[2]), C(30, 70, 150), M.Glass, true)
				win.Transparency = 0.25
			end
		end
	end
end

-- Builds the map `id` into the `arena` and `ground` folders.
function MapKit.build(arena, ground, id)
	local spec = Maps.List[id]
	local layout = Maps.layout(id)
	assert(spec and layout, "no map kit layout for " .. tostring(id))
	local g = spec.Ground
	part(ground, "Floor", Vector3.new(280, 2, 280), CFrame.new(0, -1, 0), g.Color, g.Material)
	decorGround(ground, id, g)
	walls(arena, id, { Color = spec.Wall.Color, Alt = id == "candy" and WHITE or nil, Material = spec.Wall.Material, Trim = spec.Wall.Trim, Height = spec.Wall.Height, Cap = id == "frost" and M.Ice or spec.Wall.Cap })
	wallDetail(arena, id, spec.Wall)
	CENTERS[id](arena)
	for _, d in layout.Decks do
		deck(arena, id, d)
	end
	local props = PROPS[id]
	for _, p in layout.Props do
		local build = props[p.Kind]
		if build then
			build(arena, p.X, p.Z, p.Rot, p.Size, p.Variant)
		end
	end
end

return MapKit

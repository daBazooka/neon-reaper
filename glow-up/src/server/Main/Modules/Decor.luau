-- SUB 5 TO TRUE ADAM: makes every building feel rich. Each one gets its own colour theme, chimneys that puff coloured
-- smoke, a ground aura ring, accent lights, a chandelier, a patterned floor and hanging banners.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local GymEquipment = require(script.Parent.GymEquipment)

local Decor = {}

local M = Enum.Material
local C3 = Color3.fromRGB
local SMOKE = "rbxasset://textures/particles/smoke_main.dds"
local SPARKS = "rbxasset://textures/particles/sparkles_main.dds"
local DARK = Color3.fromRGB(46, 48, 58)

local function part(parent, props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = M.SmoothPlastic
	p.CanCollide = false -- decoration never blocks players (or the camera)
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

local function rainbow()
	local keys = {}
	for i = 0, 6 do
		table.insert(keys, ColorSequenceKeypoint.new(i / 6, Color3.fromHSV(i / 6, 0.75, 1)))
	end
	return ColorSequence.new(keys)
end

-- Coloured smoke (and a few sparks) rising from a point. scale 1 = a chimney, 0.4 = a small vent.
-- Pass the string "rainbow" as the colour for a smoke that cycles through every hue.
function Decor.smoke(parent, position, color, scale)
	scale = scale or 1
	local isRainbow = color == "rainbow"
	if isRainbow then
		color = Color3.fromRGB(255, 255, 255)
	end
	local anchor = part(parent, { Name = "SmokeSource", Size = Vector3.one * 0.5, Position = position, Transparency = 1, CanCollide = false, CanQuery = false, CanTouch = false })
	local e = Instance.new("ParticleEmitter")
	e.Name = "Smoke"
	e.Texture = SMOKE
	e.Color = isRainbow and rainbow() or ColorSequence.new(color:Lerp(Color3.new(1, 1, 1), 0.25), color)
	e.LightEmission = 0.35
	e.Rate = 7 + 6 * scale
	e.Lifetime = NumberRange.new(3, 5)
	e.Speed = NumberRange.new(3, 6)
	e.SpreadAngle = Vector2.new(14, 14)
	e.Acceleration = Vector3.new(0, 2, 0)
	e.Rotation = NumberRange.new(0, 360)
	e.RotSpeed = NumberRange.new(-20, 20)
	e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 2 * scale), NumberSequenceKeypoint.new(1, 9 * scale) })
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.45), NumberSequenceKeypoint.new(0.7, 0.75), NumberSequenceKeypoint.new(1, 1) })
	e.Parent = anchor
	local sparks = Instance.new("ParticleEmitter")
	sparks.Name = "Sparks"
	sparks.Texture = SPARKS
	sparks.Color = isRainbow and rainbow() or ColorSequence.new(Color3.new(1, 1, 1), color)
	sparks.LightEmission = 0.7
	sparks.Rate = 3 + 3 * scale
	sparks.Lifetime = NumberRange.new(1.5, 2.5)
	sparks.Speed = NumberRange.new(4, 9)
	sparks.SpreadAngle = Vector2.new(25, 25)
	sparks.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.7 * scale), NumberSequenceKeypoint.new(1, 0) })
	sparks.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(1, 1) })
	sparks.Parent = anchor
	return anchor
end

local function glowLight(parent, color, range, brightness)
	local l = Instance.new("PointLight")
	l.Color = color
	l.Range = range
	l.Brightness = brightness
	l.Parent = parent
end

-- A big flat ring on the ground that tints the area around a building with its aura colour.
function Decor.groundAura(parent, centerPos, radius, color)
	local ring = part(parent, {
		Name = "AuraRing",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.12, radius * 2, radius * 2),
		CFrame = CFrame.new(centerPos.X, 0.36, centerPos.Z) * CFrame.Angles(0, 0, math.pi / 2),
		Color = color,
		Transparency = 0.8,
		CanCollide = false,
		CanQuery = false,
		CanTouch = false,
	})
	return ring
end

-- Two chimneys on the roof, each puffing smoke in the building's colour.
function Decor.chimneys(parent, cf, y, spread, color, z)
	for side = -1, 1, 2 do
		local base = cf * CFrame.new(side * spread, y, z or 4)
		part(parent, { Name = "Chimney", Shape = Enum.PartType.Cylinder, Size = Vector3.new(7, 3.4, 3.4), CFrame = base * CFrame.new(0, 3.5, 0) * CFrame.Angles(0, 0, math.pi / 2), Color = DARK, Material = M.Metal })
		part(parent, { Name = "ChimneyRim", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.8, 4, 4), CFrame = base * CFrame.new(0, 7.2, 0) * CFrame.Angles(0, 0, math.pi / 2), Color = color, Material = M.SmoothPlastic })
		Decor.smoke(parent, (base * CFrame.new(0, 8, 0)).Position, color, 1)
	end
end


--------------------------------------------------------------------------------
-- Interior props that make each building feel like what it is
--------------------------------------------------------------------------------
local WOODC = C3(120, 84, 58)

local function gymProps(parent, cf)
	GymEquipment.build(parent, cf)
end

local function studioProps(parent, cf)
	-- wash basins along the side wall, pendant lamps over the barber chairs, a waiting bench
	for i = 1, 2 do
		local z = -3 + i * 5
		block(parent, "BasinCabinet", Vector3.new(2.6, 2.6, 3), cf * CFrame.new(-14.2, 2.2, z), C3(246, 242, 238), M.SmoothPlastic, { CanCollide = true })
		part(parent, { Name = "Basin", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.5, 2.2, 2.2), CFrame = cf * CFrame.new(-14.2, 3.6, z) * CFrame.Angles(0, 0, math.pi / 2), Color = C3(236, 240, 246), Material = M.Marble })
		block(parent, "Faucet", Vector3.new(0.2, 1.2, 0.2), cf * CFrame.new(-14.9, 4.4, z), C3(210, 214, 222), M.Metal)
		block(parent, "FaucetSpout", Vector3.new(0.9, 0.18, 0.18), cf * CFrame.new(-14.5, 5, z), C3(210, 214, 222), M.Metal)
	end
	for _, x in { -7, 7 } do
		block(parent, "PendantCord", Vector3.new(0.1, 3.5, 0.1), cf * CFrame.new(x, 10.7, 2), DARK, M.Metal)
		local lamp = part(parent, { Name = "PendantLamp", Shape = Enum.PartType.Ball, Size = Vector3.new(2.4, 1.8, 2.4), CFrame = cf * CFrame.new(x, 8.8, 2), Color = C3(255, 236, 214), Transparency = 0.1 })
		glowLight(lamp, C3(255, 226, 190), 24, 1)
	end
	block(parent, "WaitingBench", Vector3.new(7, 0.6, 2), cf * CFrame.new(11, 1.8, -3), C3(60, 50, 56), M.Leather, { CanCollide = true })
	block(parent, "WaitingBenchBack", Vector3.new(7, 2.2, 0.5), cf * CFrame.new(11, 3, -2.2), C3(60, 50, 56), M.Leather)
	for sx = -1, 1, 2 do
		block(parent, "WaitingBenchLeg", Vector3.new(0.4, 1.4, 1.6), cf * CFrame.new(11 + sx * 3.2, 1.2, -3), DARK, M.Metal)
	end
	-- a rack of products on the back wall
	for row = 1, 3 do
		block(parent, "ProductShelf", Vector3.new(7, 0.25, 1), cf * CFrame.new(-11, 3 + row * 2.2, 13.4), C3(236, 230, 224), M.Marble)
		for i = 1, 6 do
			part(parent, { Name = "Product", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1, 0.55, 0.55), CFrame = cf * CFrame.new(-13.2 + i * 0.85, 3.7 + row * 2.2, 13.4) * CFrame.Angles(0, 0, math.pi / 2), Color = Color3.fromHSV((i * 0.17 + row * 0.1) % 1, 0.5, 0.95), Material = M.Glass })
		end
	end
end

local function loungeProps(parent, cf)
	-- a stone fireplace with a real fire and a full bookshelf on the back wall, and two armchairs
	local fp = cf * CFrame.new(-10.5, 0.9, 13.5)
	block(parent, "FireplaceStone", Vector3.new(8, 8, 1.8), fp * CFrame.new(0, 4, 0), C3(150, 144, 136), M.Brick, { CanCollide = true })
	block(parent, "FireplaceHole", Vector3.new(4.4, 3.4, 1.9), fp * CFrame.new(0, 2.4, -0.15), C3(24, 20, 20), M.SmoothPlastic)
	block(parent, "Mantel", Vector3.new(9, 0.5, 2.6), fp * CFrame.new(0, 5.6, -0.3), WOODC, M.Wood)
	for i = -1, 1 do
		part(parent, { Name = "Log", Shape = Enum.PartType.Cylinder, Size = Vector3.new(3.4, 0.7, 0.7), CFrame = fp * CFrame.new(i * 0.9, 1.2 + (i == 0 and 0.5 or 0), -0.6) * CFrame.Angles(0, math.pi / 2, 0), Color = C3(80, 52, 34), Material = M.Wood })
	end
	local base = block(parent, "FireBase", Vector3.new(3, 0.4, 1), fp * CFrame.new(0, 1.5, -0.6), C3(255, 140, 40), M.SmoothPlastic, { Transparency = 1 })
	local flame = Instance.new("Fire")
	flame.Color = C3(255, 140, 40)
	flame.SecondaryColor = C3(255, 70, 20)
	flame.Size = 6
	flame.Heat = 8
	flame.Parent = base
	glowLight(base, C3(255, 150, 70), 28, 1.4)
	local shelf = cf * CFrame.new(10.8, 0.9, 13.8)
	block(parent, "BookshelfFrame", Vector3.new(8, 10, 1.4), shelf * CFrame.new(0, 5, 0), WOODC, M.Wood, { CanCollide = true })
	for row = 1, 4 do
		block(parent, "Shelf", Vector3.new(7.6, 0.3, 1.5), shelf * CFrame.new(0, row * 2.1, -0.1), C3(98, 68, 46), M.Wood)
		local rng = Random.new(row * 31)
		local xpos = -3.6
		while xpos < 3.4 do
			local bw = 0.3 + rng:NextNumber() * 0.4
			local bh = 1.2 + rng:NextNumber() * 0.7
			block(parent, "Book", Vector3.new(bw, bh, 0.9), shelf * CFrame.new(xpos + bw / 2, row * 2.1 - 2.1 + 0.15 + bh / 2 + 0.0, -0.35), Color3.fromHSV(rng:NextNumber(), 0.55, 0.8), M.SmoothPlastic)
			xpos += bw + 0.05
		end
	end
	for _, x in { -7, 7 } do
		local chair = cf * CFrame.new(x, 0.9, 1.5) * CFrame.Angles(0, x < 0 and math.rad(40) or math.rad(-40), 0)
		block(parent, "ArmchairSeat", Vector3.new(3.4, 1.2, 3.4), chair * CFrame.new(0, 1.2, 0), C3(176, 76, 84), M.Fabric, { CanCollide = true })
		block(parent, "ArmchairBack", Vector3.new(3.4, 3.2, 0.9), chair * CFrame.new(0, 3, 1.4), C3(160, 66, 74), M.Fabric)
		for side = -1, 1, 2 do
			block(parent, "ArmchairArm", Vector3.new(0.7, 2.2, 3.4), chair * CFrame.new(side * 1.9, 1.9, 0), C3(160, 66, 74), M.Fabric)
		end
	end
end



-- Full interior + exterior treatment for the open pavilions (Gym, Studio, Lounge, Crate Shop).
-- cf is the pavilion frame (floor top at y = 0.9, entrance toward local -Z, roof at y = 14.4).
function Decor.pavilion(parent, id, cf)
	local def = Config.Buildings[id]
	local main, glow = def.Main, def.Glow
	-- chimneys with smoke + aura light on the roof
	Decor.chimneys(parent, cf, 15, 10, glow)
	local lamp = part(parent, { Name = "AuraBeacon", Shape = Enum.PartType.Ball, Size = Vector3.one * 2.6, CFrame = cf * CFrame.new(0, 17, 0), Color = glow, Transparency = 0.15, CanCollide = false })
	glowLight(lamp, glow, 60, 1.4)
	Decor.groundAura(parent, cf.Position, 30, glow)
	-- a floor medallion in the building colours under the chandelier
	for i, r in { 4.4, 3.8, 2.2 } do
		part(parent, { Name = "FloorMedallion", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.06, r * 2, r * 2), CFrame = cf * CFrame.new(0, 0.95 + i * 0.01, 2) * CFrame.Angles(0, 0, math.pi / 2), Color = (i % 2 == 1) and main or main:Lerp(Color3.new(1, 1, 1), 0.7) })
	end
	-- chandelier: a hanging ring of glowing glass balls
	local chand = cf * CFrame.new(0, 10.5, 2)
	block(parent, "ChandelierChain", Vector3.new(0.3, 3.4, 0.3), chand * CFrame.new(0, 2.2, 0), DARK, M.Metal, { CanCollide = false })
	block(parent, "ChandelierRing", Vector3.new(5, 0.4, 5), chand, main, M.Metal, { CanCollide = false, Shape = Enum.PartType.Cylinder })
	for i = 1, 8 do
		local a = (i / 8) * math.pi * 2
		local bulb = part(parent, { Name = "Crystal", Shape = Enum.PartType.Ball, Size = Vector3.one * 0.9, CFrame = chand * CFrame.new(math.cos(a) * 2.3, -0.7, math.sin(a) * 2.3), Color = glow, Transparency = 0.1, CanCollide = false })
		if i % 4 == 0 then
			glowLight(bulb, glow, 26, 1.1)
		end
	end
	-- hanging banners on the back wall
	for _, x in { -11, 11 } do
		block(parent, "Banner", Vector3.new(3.6, 8, 0.3), cf * CFrame.new(x, 8, 13.2), main, M.Fabric, { CanCollide = false })
		block(parent, "BannerTrim", Vector3.new(3.9, 0.5, 0.4), cf * CFrame.new(x, 12.1, 13.2), glow, M.SmoothPlastic, { CanCollide = false })
		block(parent, "BannerEmblem", Vector3.new(1.8, 1.8, 0.35), cf * CFrame.new(x, 8.5, 13.0) * CFrame.Angles(0, 0, math.pi / 4), glow, M.SmoothPlastic, { CanCollide = false })
	end
	-- a welcome carpet leading in
	block(parent, "Carpet", Vector3.new(6, 0.08, 14), cf * CFrame.new(0, 0.95, -9), main, M.Fabric, { CanCollide = false })
	block(parent, "CarpetTrim", Vector3.new(6.6, 0.07, 14.6), cf * CFrame.new(0, 0.94, -9), glow, M.Fabric, { CanCollide = false })
	Decor.exterior(parent, id, cf)
	if id == "gym" then
		gymProps(parent, cf)
	elseif id == "studio" then
		studioProps(parent, cf)
	elseif id == "lounge" then
		loungeProps(parent, cf)
	end
end

-- Extra exterior detail for the pavilions: roof tiles, gutters, lanterns, flower boxes, a stone path, floor trim.
function Decor.exterior(parent, id, cf)
	local def = Config.Buildings[id]
	local main, glow = def.Main, def.Glow
	local dark = main:Lerp(Color3.new(0, 0, 0), 0.35)
	local rng = Random.new(#id * 977)
	-- roof tiles: rows of alternating shades across the top, with a ridge cap and gutters
	for i = 1, 6 do
		block(parent, "RoofTile", Vector3.new(36, 0.3, 5.2), cf * CFrame.new(0, 15.25, -15 + (i - 1) * 6), i % 2 == 0 and main or dark, M.SmoothPlastic)
	end
	block(parent, "RoofRidge", Vector3.new(37, 0.8, 1.2), cf * CFrame.new(0, 15.7, 0), glow, M.SmoothPlastic, { CanCollide = false })
	-- lanterns hanging from the front pillars
	for side = -1, 1, 2 do
		block(parent, "LanternChain", Vector3.new(0.12, 1.4, 0.12), cf * CFrame.new(side * 7.6, 11.4, -17.0), DARK, M.Metal, { CanCollide = false })
		local lantern = block(parent, "Lantern", Vector3.new(1.1, 1.6, 1.1), cf * CFrame.new(side * 7.6, 9.9, -17.0), glow, M.Glass, { Transparency = 0.25, CanCollide = false })
		glowLight(lantern, glow, 22, 1)
		block(parent, "LanternCap", Vector3.new(1.4, 0.3, 1.4), cf * CFrame.new(side * 7.6, 10.9, -17.0), DARK, M.Metal, { CanCollide = false })
	end
	-- flower boxes beside the entrance
	for side = -1, 1, 2 do
		local box = cf * CFrame.new(side * 12.8, 0.9, -17.2)
		block(parent, "FlowerBox", Vector3.new(5.2, 1.3, 1.8), box * CFrame.new(0, 0.65, 0), C3(120, 82, 56), M.Wood)
		part(parent, { Name = "Bush", Shape = Enum.PartType.Ball, Size = Vector3.new(4.8, 1.2, 1.5), CFrame = box * CFrame.new(0, 1.5, 0), Color = C3(60, 140, 62), Material = M.Grass, CanCollide = false })
		for i = 1, 8 do
			local color = ({ main, glow, Color3.new(1, 1, 1), C3(255, 220, 90) })[rng:NextInteger(1, 4)]
			part(parent, { Name = "Flower", Shape = Enum.PartType.Ball, Size = Vector3.one * 0.6, CFrame = box * CFrame.new(-2.3 + (i - 1) * 0.65, 2.1 + rng:NextNumber() * 0.2, (rng:NextNumber() - 0.5) * 0.8), Color = color, CanCollide = false })
		end
	end
	-- a stone path leading out from the entrance
	for i = 1, 8 do
		block(parent, "PathStone", Vector3.new(5 + (i % 2), 0.16, 2.8), cf * CFrame.new(((i % 3) - 1) * 0.5, 0.26, -19.5 - i * 3.4), i % 2 == 0 and C3(196, 194, 188) or C3(170, 168, 162), M.Slate, { CanCollide = false })
	end
	-- potted plants in the back corners
	for side = -1, 1, 2 do
		local pot = cf * CFrame.new(side * 12.6, 0.9, 12)
		part(parent, { Name = "Pot", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1.8, 2.2, 2.2), CFrame = pot * CFrame.new(0, 0.9, 0) * CFrame.Angles(0, 0, math.pi / 2), Color = C3(176, 104, 72), Material = M.Concrete })
		for i = 1, 5 do
			local a = (i / 5) * math.pi * 2
			part(parent, { Name = "Leaf", Shape = Enum.PartType.Ball, Size = Vector3.new(1.4, 2.6, 1.4), CFrame = pot * CFrame.new(math.cos(a) * 0.7, 3, math.sin(a) * 0.7) * CFrame.Angles(math.sin(a) * 0.4, 0, math.cos(a) * 0.4), Color = C3(54, 142 + i * 6, 70), Material = M.Grass, CanCollide = false })
		end
	end
end

return Decor

-- SUB 5 TO TRUE ADAM: makes every building feel rich. Each one gets its own colour theme, chimneys that puff coloured
-- smoke, a ground aura ring, accent lights, a chandelier, a patterned floor and hanging banners.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local Decor = {}

local M = Enum.Material
local SMOKE = "rbxasset://textures/particles/smoke_main.dds"
local SPARKS = "rbxasset://textures/particles/sparkles_main.dds"
local DARK = Color3.fromRGB(46, 48, 58)

local function part(parent, props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = M.SmoothPlastic
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
	-- patterned floor: two coloured rings and a centre medallion
	for i, r in { 12.5, 8.5, 4.5 } do
		local ring = part(parent, { Name = "FloorRing", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.06, r * 2, r * 2), CFrame = cf * CFrame.new(0, 0.93 + i * 0.01, 0) * CFrame.Angles(0, 0, math.pi / 2), Color = (i % 2 == 1) and main or main:Lerp(Color3.new(1, 1, 1), 0.6), CanCollide = false })
		ring.Transparency = 0.1
	end
	-- accent light strips under the roof edge
	for _, z in { -15.5, 15.5 } do
		local strip = block(parent, "LightStrip", Vector3.new(33, 0.5, 0.5), cf * CFrame.new(0, 13, z), glow, M.SmoothPlastic, { CanCollide = false })
		glowLight(strip, glow, 24, 0.9)
	end
	-- pillar caps in the building colour
	for sx = -1, 1, 2 do
		for sz = -1, 1, 2 do
			block(parent, "PillarCap", Vector3.new(2.6, 0.9, 2.6), cf * CFrame.new(sx * 14.5, 13.8, sz * 13.5), main, M.SmoothPlastic)
			block(parent, "PillarBase", Vector3.new(2.6, 0.9, 2.6), cf * CFrame.new(sx * 14.5, 1.3, sz * 13.5), main, M.SmoothPlastic)
		end
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
end

return Decor

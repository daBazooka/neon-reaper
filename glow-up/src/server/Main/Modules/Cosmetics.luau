-- SUB 5 TO TRUE ADAM: the wardrobe. Owns the inventory (with star levels) and builds the glowing
-- accessories players wear. Everything is made from parts and effects, so nothing needs uploading.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)
local Appearance = require(script.Parent.Appearance)

local Cosmetics = {}

local FOLDER = "GlowCosmetics"

--------------------------------------------------------------------------------
-- Inventory
--------------------------------------------------------------------------------
local function writeInventory(p, profile)
	local parts = {}
	for id, stars in profile.Inv do
		table.insert(parts, id .. ":" .. stars)
	end
	table.sort(parts)
	p:SetAttribute("Inv", table.concat(parts, ","))
	for _, slot in Config.Slots do
		p:SetAttribute("Eq_" .. slot, profile.Eq[slot] or "")
	end
end

function Cosmetics.sync(p)
	local profile = Data.get(p)
	if profile then
		writeInventory(p, profile)
	end
end

-- Returns "new", "star" (duplicate levelled up) or "max" (duplicate of a max-star item), plus the stars.
function Cosmetics.grant(p, id)
	local profile = Data.get(p)
	local c = Config.CosmeticById[id]
	if not profile or not c then
		return nil
	end
	local stars = profile.Inv[id]
	local status
	if not stars then
		profile.Inv[id] = 1
		status = "new"
	elseif stars < Config.MaxStars then
		profile.Inv[id] = stars + 1
		status = "star"
	else
		status = "max"
	end
	writeInventory(p, profile)
	Stats.recompute(p)
	return status, profile.Inv[id]
end

function Cosmetics.equip(p, id)
	local profile = Data.get(p)
	local c = Config.CosmeticById[id]
	if not profile or not c or not profile.Inv[id] then
		return
	end
	profile.Eq[c.Slot] = id
	writeInventory(p, profile)
	Stats.recompute(p)
	Cosmetics.apply(p)
end

function Cosmetics.unequip(p, slot)
	local profile = Data.get(p)
	if not profile or not table.find(Config.Slots, slot) then
		return
	end
	profile.Eq[slot] = nil
	writeInventory(p, profile)
	Stats.recompute(p)
	Cosmetics.apply(p)
end

--------------------------------------------------------------------------------
-- Visuals
--------------------------------------------------------------------------------
local function accessoryPart(props)
	local part = Instance.new("Part")
	part.Anchored = false
	part.CanCollide = false
	part.CanTouch = false
	part.CanQuery = false
	part.Massless = true
	part.CastShadow = false
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in props do
		part[k] = v
	end
	return part
end

local ctxNow -- the build context currently being used (for size scaling)

-- Positions `part` relative to `base` and welds it there. Accessories scale with the body so
-- a hat still fits a big head and wings still fit a wide back.
local function attach(part, base, offset, folder)
	local s = (ctxNow and base == ctxNow.head) and ctxNow.hs or (ctxNow and ctxNow.bs or 1)
	part.Size = part.Size * s
	local rotation = offset - offset.Position
	part.CFrame = base.CFrame * (CFrame.new(offset.Position * s) * rotation)
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = base
	weld.Part1 = part
	weld.Parent = part
	part.Parent = folder
	return part
end

local function glowMaterial(spec)
	return spec.Glow and Enum.Material.Metal or Enum.Material.SmoothPlastic
end

local function sparkle(parent, color, rate)
	local e = Instance.new("ParticleEmitter")
	e.Color = ColorSequence.new(color)
	e.LightEmission = 1
	e.Rate = rate or 12
	e.Lifetime = NumberRange.new(0.6, 1.2)
	e.Speed = NumberRange.new(0.5, 2)
	e.SpreadAngle = Vector2.new(180, 180)
	e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 0) })
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(1, 1) })
	e.Parent = parent
	return e
end

local function rainbow()
	return ColorSequence.new({
		ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 90, 140)),
		ColorSequenceKeypoint.new(0.25, Color3.fromRGB(255, 220, 90)),
		ColorSequenceKeypoint.new(0.5, Color3.fromRGB(90, 255, 160)),
		ColorSequenceKeypoint.new(0.75, Color3.fromRGB(90, 190, 255)),
		ColorSequenceKeypoint.new(1, Color3.fromRGB(200, 120, 255)),
	})
end

local builders = {}

function builders.cap(spec, ctx)
	local band = accessoryPart({ Size = Vector3.new(2.15, 0.55, 2.15), Color = spec.Color, Material = Enum.Material.SmoothPlastic })
	attach(band, ctx.head, CFrame.new(0, 0.7, 0), ctx.folder)
	local brim = accessoryPart({ Size = Vector3.new(1.7, 0.15, 1.0), Color = spec.Color, Material = Enum.Material.SmoothPlastic })
	attach(brim, ctx.head, CFrame.new(0, 0.5, -1.2), ctx.folder)
end

function builders.halo(spec, ctx)
	local ring = accessoryPart({
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.14, 2.7, 2.7),
		Color = spec.Color,
		Material = Enum.Material.SmoothPlastic,
	})
	attach(ring, ctx.head, CFrame.new(0, 1.5, 0) * CFrame.Angles(0, 0, math.pi / 2), ctx.folder)
	local light = Instance.new("PointLight")
	light.Color = spec.Color
	light.Range = 10
	light.Brightness = 1.5
	light.Parent = ring
end

function builders.crown(spec, ctx)
	local base = accessoryPart({ Size = Vector3.new(2.1, 0.45, 2.1), Color = spec.Color, Material = Enum.Material.SmoothPlastic })
	attach(base, ctx.head, CFrame.new(0, 0.85, 0), ctx.folder)
	for i = 1, 5 do
		local angle = (i / 5) * math.pi * 2
		local spike = accessoryPart({
			Size = Vector3.new(0.38, 1.0, 0.38),
			Color = spec.Color,
			Material = Enum.Material.SmoothPlastic,
		})
		attach(spike, ctx.head, CFrame.new(math.cos(angle) * 0.85, 1.4, math.sin(angle) * 0.85), ctx.folder)
		if spec.Sparkle and i == 1 then
			sparkle(spike, spec.Color, 14)
		end
	end
end

function builders.horns(spec, ctx)
	for side = -1, 1, 2 do
		local horn = accessoryPart({ Size = Vector3.new(0.4, 1.5, 0.4), Color = spec.Color, Material = Enum.Material.SmoothPlastic })
		attach(horn, ctx.head, CFrame.new(side * 0.75, 1.15, 0) * CFrame.Angles(0, 0, -side * 0.45), ctx.folder)
		if spec.Sparkle then
			sparkle(horn, spec.Color, 16)
		end
	end
end

function builders.cape(spec, ctx)
	local body = accessoryPart({
		Size = Vector3.new(2.0, 3.1, 0.15),
		Color = spec.Color,
		Material = glowMaterial(spec),
	})
	attach(body, ctx.torso, CFrame.new(0, -0.35, 0.78) * CFrame.Angles(0.12, 0, 0), ctx.folder)
	if spec.Glow then
		local edge = accessoryPart({ Size = Vector3.new(2.1, 0.12, 0.2), Color = Color3.new(1, 1, 1), Material = Enum.Material.SmoothPlastic })
		attach(edge, ctx.torso, CFrame.new(0, -1.9, 0.9) * CFrame.Angles(0.12, 0, 0), ctx.folder)
	end
end

function builders.wings(spec, ctx)
	for side = -1, 1, 2 do
		for i = 1, 3 do
			local feather = accessoryPart({
				Size = Vector3.new(0.18, 2.8 - i * 0.55, 1.1),
				Color = spec.Color,
				Material = Enum.Material.SmoothPlastic,
				Transparency = 0.12 * i,
			})
			attach(
				feather,
				ctx.torso,
				CFrame.new(side * (0.9 + i * 0.7), 1.0 - i * 0.35, 0.8)
					* CFrame.Angles(0.15, side * 0.7, side * (0.35 + i * 0.12)),
				ctx.folder
			)
			if spec.Sparkle and i == 3 then
				sparkle(feather, spec.Color, 10)
			end
		end
	end
end

function builders.visor(spec, ctx)
	local bar = accessoryPart({
		Size = Vector3.new(2.05, 0.5, 0.25),
		Color = spec.Color,
		Material = glowMaterial(spec),
		Transparency = spec.Glow and 0.15 or 0,
	})
	attach(bar, ctx.head, CFrame.new(0, 0.15, -0.62), ctx.folder)
	if spec.Sparkle then
		sparkle(bar, spec.Color, 8)
	end
end

function builders.mask(spec, ctx)
	local plate = accessoryPart({ Size = Vector3.new(1.95, 1.1, 0.2), Color = spec.Color, Material = glowMaterial(spec) })
	attach(plate, ctx.head, CFrame.new(0, 0, -0.62), ctx.folder)
	local slit = accessoryPart({ Size = Vector3.new(1.5, 0.18, 0.22), Color = Color3.new(0.05, 0.05, 0.1), Material = Enum.Material.SmoothPlastic })
	attach(slit, ctx.head, CFrame.new(0, 0.15, -0.72), ctx.folder)
end

function builders.aura(spec, ctx)
	local e = Instance.new("ParticleEmitter")
	e.Name = "GlowAura"
	e.Color = spec.Rainbow and rainbow() or ColorSequence.new(spec.Color)
	e.LightEmission = 1
	e.Rate = 28
	e.Lifetime = NumberRange.new(1.2, 2.2)
	e.Speed = NumberRange.new(1, 4)
	e.SpreadAngle = Vector2.new(180, 180)
	e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 0) })
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 1) })
	e.Parent = ctx.root
	local light = Instance.new("PointLight")
	light.Name = "GlowAuraLight"
	light.Color = spec.Rainbow and Color3.fromRGB(255, 200, 255) or spec.Color
	light.Range = 14
	light.Brightness = 1.2
	light.Parent = ctx.root
end

function builders.trail(spec, ctx)
	local a0 = Instance.new("Attachment")
	a0.Name = "GlowTrailA0"
	a0.Position = Vector3.new(0, 0.9, 0)
	a0.Parent = ctx.root
	local a1 = Instance.new("Attachment")
	a1.Name = "GlowTrailA1"
	a1.Position = Vector3.new(0, -0.9, 0)
	a1.Parent = ctx.root
	local trail = Instance.new("Trail")
	trail.Name = "GlowTrail"
	trail.Attachment0 = a0
	trail.Attachment1 = a1
	trail.Lifetime = 0.8
	trail.LightEmission = 1
	trail.Color = spec.Rainbow and rainbow() or ColorSequence.new(spec.Color, Color3.new(1, 1, 1))
	trail.Transparency = NumberSequence.new(0.1, 1)
	trail.Parent = ctx.root
end

local function clear(char)
	local old = char:FindFirstChild(FOLDER)
	if old then
		old:Destroy()
	end
	local root = char:FindFirstChild("HumanoidRootPart")
	if root then
		for _, child in root:GetChildren() do
			if string.sub(child.Name, 1, 4) == "Glow" then
				child:Destroy()
			end
		end
	end
end

-- Rebuilds everything the player is wearing.
function Cosmetics.apply(p)
	local char = p.Character
	local profile = Data.get(p)
	if not char or not profile then
		return
	end
	local head = char:FindFirstChild("Head")
	local root = char:FindFirstChild("HumanoidRootPart")
	local torso = char:FindFirstChild("UpperTorso") or char:FindFirstChild("Torso")
	if not head or not root or not torso then
		return
	end
	clear(char)
	local folder = Instance.new("Folder")
	folder.Name = FOLDER
	folder.Parent = char
	local hs, bs = Appearance.accessoryScales(p)
	local ctx = { head = head, root = root, torso = torso, folder = folder, hs = hs, bs = bs }
	ctxNow = ctx
	for _, slot in Config.Slots do
		local id = profile.Eq[slot]
		local c = id and Config.CosmeticById[id]
		if c then
			local build = builders[c.Build.Kind]
			if build then
				local ok, err = pcall(build, c.Build, ctx)
				if not ok then
					warn("[TrueAdam] cosmetic failed:", id, err)
				end
			end
		end
	end
end

function Cosmetics.onCharacter(p)
	Cosmetics.sync(p)
	Cosmetics.apply(p)
end

function Cosmetics.handle(p, kind, a, b)
	if kind == "Equip" and type(a) == "string" then
		Cosmetics.equip(p, a)
	elseif kind == "Unequip" and type(a) == "string" then
		Cosmetics.unequip(p, a)
	end
end

return Cosmetics

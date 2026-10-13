-- FIGURE ME OUT: builds "Waterfall Canyon" (the layout lives in Shared/Canyon.luau): a cliff wall with three waterfalls, a
-- river that runs down the middle into a swimmable lake, bridges, rock arches, jungle, a wrecked plane, a seaplane at the
-- dock, and two planes that fly circuits overhead (their flying is animated on every player's screen by the client).
-- What blocks sight and movement goes in Workspace.Arena; decoration is never solid.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Canyon = require(Shared:WaitForChild("Canyon"))
local Rules = require(Shared:WaitForChild("Rules"))

local CanyonWorld = {}

local C = Color3.fromRGB
local GRASS, SAND, ROCK, ROCK2, WATER = C(96, 178, 84), C(238, 220, 160), C(150, 140, 128), C(176, 166, 150), C(58, 170, 235)
local Z0 = Canyon.Wall.Z

local function part(parent, name, size, position, color, material)
	local p = Instance.new("Part")
	p.Name = name
	p.Size = size
	p.Position = position
	p.Anchored = true
	p.Color = color
	p.Material = material or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = parent
	return p
end

-- Decoration: never blocks sight, hits or movement.
local function deco(parent, name, size, position, color, material)
	local p = part(parent, name, size, position, color, material)
	p.CanCollide = false
	p.CanQuery = false
	p.CastShadow = false
	return p
end

-- A solid cuboid; `y0` is the height of its bottom.
local function block(parent, name, x, z, w, d, h, y0, color, material)
	return part(parent, name, Vector3.new(w, h, d), Vector3.new(x, y0 + h / 2, z), color, material)
end

local function folder(name)
	local old = workspace:FindFirstChild(name)
	if old then
		old:Destroy()
	end
	local f = Instance.new("Folder")
	f.Name = name
	f.Parent = workspace
	return f
end

-- A ripple pattern drawn on a face of a part that the client slides along it (that is what makes water look like it flows).
-- `speed` is in screens per second (negative = the other way); `bars` thin light bands, repeated twice so the loop is seamless.
local function flowing(p, face, speed, bars, alpha)
	local gui = Instance.new("SurfaceGui")
	gui.Name = "FlowGui"
	gui.Face = face
	gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	gui.PixelsPerStud = 12
	gui.LightInfluence = 0
	gui.ClipsDescendants = true
	gui:SetAttribute("FlowSpeed", speed)
	gui.Parent = p
	local scroll = Instance.new("Frame")
	scroll.Name = "Scroll"
	scroll.BackgroundTransparency = 1
	scroll.Size = UDim2.fromScale(1, 2)
	scroll.Position = UDim2.fromScale(0, -1)
	scroll.Parent = gui
	for i = 0, bars * 2 - 1 do
		local bar = Instance.new("Frame")
		bar.Name = "Bar"
		bar.BorderSizePixel = 0
		bar.BackgroundColor3 = C(255, 255, 255)
		bar.BackgroundTransparency = alpha
		bar.Size = UDim2.fromScale(0.82, 0.18 / bars)
		bar.Position = UDim2.fromScale(0.09 + 0.08 * ((i * 7) % 3), (i + 0.3 + 0.35 * ((i * 5) % 3) / 3) / (bars * 2))
		bar.Parent = scroll
	end
	return gui
end

-- A little propeller plane. The nose points along -Z (the way the model faces). `Prop` is the propeller.
local function planeModel(name, color)
	local m = Instance.new("Model")
	m.Name = name
	local body = part(m, "Body", Vector3.new(3, 3, 16), Vector3.new(0, 0, 0), color, Enum.Material.Metal)
	part(m, "Wing", Vector3.new(22, 0.8, 4.5), Vector3.new(0, 0.8, -1), C(245, 245, 250), Enum.Material.Metal)
	part(m, "TailPlane", Vector3.new(8, 0.6, 3), Vector3.new(0, 0.6, 7), C(245, 245, 250), Enum.Material.Metal)
	part(m, "Fin", Vector3.new(0.6, 4, 3), Vector3.new(0, 2.6, 7), color, Enum.Material.Metal)
	part(m, "Canopy", Vector3.new(2.4, 1.6, 4), Vector3.new(0, 2, -2), C(150, 215, 255), Enum.Material.Glass)
	part(m, "Prop", Vector3.new(0.4, 6, 0.8), Vector3.new(0, 0, -8.6), C(60, 60, 66), Enum.Material.Metal)
	part(m, "Wheel", Vector3.new(0.8, 1.4, 1.4), Vector3.new(-1.6, -2, -1), C(40, 40, 44))
	part(m, "Wheel", Vector3.new(0.8, 1.4, 1.4), Vector3.new(1.6, -2, -1), C(40, 40, 44))
	m.PrimaryPart = body
	return m
end

-- Puts a plane model in the world at a position and facing, solid or not.
local function placePlane(m, parent, position, yaw, pitch, roll, solid)
	m:PivotTo(CFrame.new(position) * CFrame.Angles(pitch or 0, yaw or 0, roll or 0))
	for _, p in m:GetDescendants() do
		if p:IsA("BasePart") then
			p.CanCollide = solid
			p.CanQuery = solid
			p.CanTouch = false
		end
	end
	m.Parent = parent
end

local function tree(parent, x, z, size)
	local trunk = part(parent, "Trunk", Vector3.new(1.6 * size, 6 * size, 1.6 * size), Vector3.new(x, 3 * size, z), C(112, 80, 48), Enum.Material.Wood)
	trunk.CanTouch = false
	local leaves = part(parent, "Leaves", Vector3.new(9 * size, 8 * size, 9 * size), Vector3.new(x, 9 * size, z), C(54 + (x * 7) % 30, 160 + (z * 5) % 40, 70), Enum.Material.Grass)
	leaves.Shape = Enum.PartType.Ball
	leaves.CanCollide = false
	leaves.CanQuery = false -- you can see through foliage; trunks still block
	leaves.CanTouch = false
end

local function waterfalls(arena, deco_f)
	for i, f in Canyon.Falls do
		-- the sheet of water: walk straight through it, but it blocks sight (so a waterfall hides what is behind it)
		local z = Z0 - Canyon.FallGap - Canyon.FallThick / 2
		local sheet = part(arena, "Waterfall" .. i, Vector3.new(f.Width, Canyon.Wall.Height, Canyon.FallThick), Vector3.new(f.X, Canyon.Wall.Height / 2, z), C(150, 218, 255), Enum.Material.SmoothPlastic)
		sheet.Transparency = 0.3
		sheet.CanCollide = false
		sheet.CanTouch = false
		sheet.CastShadow = false
		flowing(sheet, Enum.NormalId.Front, Config.Water.FallSpeed, 6, 0.35)
		flowing(sheet, Enum.NormalId.Back, Config.Water.FallSpeed, 6, 0.35)
		-- the stream running off the top of the cliff, and the foam pool where it lands
		deco(deco_f, "FallLip", Vector3.new(f.Width + 6, 1.4, 24), Vector3.new(f.X, Canyon.Wall.Height + 0.3, Z0 + 10), WATER)
		local pool = part(deco_f, "Pool", Vector3.new(f.Width + 8, 0.6, 16), Vector3.new(f.X, 0.3, 102), WATER, Enum.Material.SmoothPlastic)
		pool.CanQuery = false
		pool.CanTouch = false
		local foam = deco(deco_f, "Foam", Vector3.new(f.Width + 2, 0.2, 5), Vector3.new(f.X, 0.7, z - 3), C(255, 255, 255), Enum.Material.SmoothPlastic)
		foam.Transparency = 0.25
		-- spray and mist
		for _, def in { { "Spray", 30, 1.4, 14, 3, 7 }, { "Mist", 10, 3, 4, 8, 16 } } do
			local anchor = deco(deco_f, def[1] .. "Anchor", Vector3.new(f.Width, 1, 2), Vector3.new(f.X, 2, z - 1.5), C(255, 255, 255))
			anchor.Transparency = 1
			local e = Instance.new("ParticleEmitter")
			e.Name = def[1]
			e.Rate = def[2]
			e.Lifetime = NumberRange.new(def[3] * 0.7, def[3])
			e.Speed = NumberRange.new(def[4] * 0.5, def[4])
			e.SpreadAngle = Vector2.new(35, 35)
			e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, def[5]), NumberSequenceKeypoint.new(1, def[6]) })
			e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.55), NumberSequenceKeypoint.new(1, 1) })
			e.Color = ColorSequence.new(C(255, 255, 255))
			e.LightEmission = 0.4
			e.EmissionDirection = Enum.NormalId.Front
			e.Parent = anchor
		end
		-- a waterfall sound, if a sound id is set in Config.Sounds.Waterfall
		if Config.Sounds.Waterfall and Config.Sounds.Waterfall ~= "" then
			local sound = Instance.new("Sound")
			sound.Name = "Roar"
			sound.SoundId = Config.Sounds.Waterfall
			sound.Looped = true
			sound.Volume = 0.8
			sound.RollOffMaxDistance = 90
			sound.Parent = sheet
			sound:Play()
		end
	end
end

local function river(deco_f)
	for _, w in Canyon.Water do
		if string.sub(w.Name, 1, 4) == "Fall" or string.sub(w.Name, 1, 4) == "Pool" then
			continue -- (built with the waterfalls)
		end
		local top = 0.6 - (w.Name == "River" and 0 or 0.02)
		local p = part(deco_f, w.Name, Vector3.new(w.W, top, w.D), Vector3.new(w.X, top / 2, w.Z), WATER, Enum.Material.SmoothPlastic)
		p.CanQuery = false
		p.CanTouch = false
		if w.FX == 0 then
			-- the ripples run south (a SurfaceGui on the top face has "up" = towards -z)
			flowing(p, Enum.NormalId.Top, Config.Water.RiverSpeed, 6, 0.55)
		end
	end
end

local function lake(ground, deco_f)
	local l = Canyon.Lake
	-- the bed and the water: real terrain water you can swim in
	part(deco_f, "LakeBed", Vector3.new(l.Size, 2, l.Size), Vector3.new(l.X, -l.Depth - 1, l.Z), SAND, Enum.Material.Sand)
	local ok = pcall(function()
		workspace.Terrain:FillBlock(CFrame.new(l.X, -l.Depth / 2 + l.Surface / 2, l.Z), Vector3.new(l.Size, l.Depth + l.Surface, l.Size), Enum.Material.Water)
	end)
	if not ok then
		-- if terrain water is not available, a glassy slab stands in
		local slab = deco(deco_f, "LakeWater", Vector3.new(l.Size, 0.6, l.Size), Vector3.new(l.X, l.Surface - 0.3, l.Z), WATER, Enum.Material.Glass)
		slab.Transparency = 0.35
	end
	-- sandy shore around it
	for _, s in { { 0, 1 }, { 0, -1 }, { 1, 0 }, { -1, 0 } } do
		local w = s[1] == 0 and l.Size + 12 or 6
		local d = s[2] == 0 and l.Size + 12 or 6
		deco(ground, "Shore", Vector3.new(w, 0.1, d), Vector3.new(l.X + s[1] * (l.Size / 2 + 3), 0.05, l.Z + s[2] * (l.Size / 2 + 3)), SAND, Enum.Material.Sand)
	end
	-- the island and the dock
	local isl = part(ground, "Island", Vector3.new(7, Canyon.Island.Radius * 2, Canyon.Island.Radius * 2), Vector3.new(Canyon.Island.X, -2.5, Canyon.Island.Z), SAND, Enum.Material.Sand)
	isl.Shape = Enum.PartType.Cylinder
	isl.CFrame = CFrame.new(Canyon.Island.X, -2.5, Canyon.Island.Z) * CFrame.Angles(0, 0, math.pi / 2)
	local d = Canyon.Dock
	local len = d.X2 - d.X1
	block(ground, "Dock", (d.X1 + d.X2) / 2, d.Z, len, d.Width, 0.5, 0.45, C(176, 136, 80), Enum.Material.Wood)
	for k = 0, 4 do
		for _, side in { -1, 1 } do
			part(ground, "DockPost", Vector3.new(0.8, 3, 0.8), Vector3.new(d.X1 + 2 + k * (len - 4) / 4, 0.4, d.Z + side * (d.Width / 2)), C(110, 78, 48), Enum.Material.Wood)
		end
	end
	tree(ground, Canyon.Island.X - 2, Canyon.Island.Z + 2, 1.2)
end

local function bridges(arena)
	for _, b in Canyon.Bridges do
		local deck = block(arena, "BridgeDeck", b.X, b.Z, 28, 7, 0.8, 2.6, C(176, 136, 80), Enum.Material.Wood)
		deck.CanTouch = false
		for k = 1, 3 do
			-- steps up at both ends (so every player and bot can walk on)
			for _, side in { -1, 1 } do
				block(arena, "BridgeStep", b.X + side * (14 + (4 - k) * 1.4 - 0.7), b.Z, 1.4, 7, k * 0.86, 0, C(150, 112, 66), Enum.Material.Wood)
			end
		end
		for _, side in { -1, 1 } do
			block(arena, "BridgeRail", b.X, b.Z + side * 3.3, 28, 0.5, 0.6, 3.9, C(120, 86, 50), Enum.Material.Wood)
			for k = -2, 2 do
				block(arena, "BridgePost", b.X + k * 6, b.Z + side * 3.3, 0.6, 0.6, 1.5, 3.4, C(120, 86, 50), Enum.Material.Wood)
			end
		end
	end
end

function CanyonWorld.build(arena, ground)
	local scenery = folder("CanyonScenery")
	local deco_f = folder("Water")
	local H = Canyon.Half
	-- the ground: grass with a square hole for the lake
	local l = Canyon.Lake
	local lo, hi = l.Z - l.Size / 2, l.Z + l.Size / 2
	local function slab(name, x, z, w, d)
		part(ground, name, Vector3.new(w, 2, d), Vector3.new(x, -1, z), GRASS, Enum.Material.Grass)
	end
	slab("GroundNorth", 0, (hi + H + 4) / 2, (H + 4) * 2, H + 4 - hi)
	slab("GroundSouth", 0, (-H - 4 + lo) / 2, (H + 4) * 2, lo + H + 4)
	slab("GroundWest", (-H - 4 + l.X - l.Size / 2) / 2, l.Z, l.X - l.Size / 2 + H + 4, l.Size)
	slab("GroundEast", (H + 4 + l.X + l.Size / 2) / 2, l.Z, H + 4 - l.X - l.Size / 2, l.Size)

	-- the cliff along the north edge (and rock walls round the rest)
	block(arena, "Cliff", 0, Z0 + 10, (H + 4) * 2, 20, Canyon.Wall.Height, 0, ROCK, Enum.Material.Slate)
	for i, x in { -125, -100, -45, -30, 30, 45, 100, 125 } do
		block(arena, "Buttress", x, Z0 - 4, 14, 8, 22 + (i % 3) * 4, 0, i % 2 == 0 and ROCK2 or ROCK, Enum.Material.Slate)
	end
	for _, def in { { "WallW", -H - 2, 0, 4, (H + 4) * 2 }, { "WallE", H + 2, 0, 4, (H + 4) * 2 }, { "WallS", 0, -H - 2, (H + 4) * 2, 4 } } do
		block(arena, def[1], def[2], def[3], def[4], def[5], 24, 0, ROCK2, Enum.Material.Slate)
	end

	waterfalls(arena, deco_f)
	river(deco_f)
	lake(ground, deco_f)
	bridges(arena)

	-- rock arches
	for _, a in Canyon.Arches do
		block(arena, "ArchLeg", a.X - 6, a.Z, 5, 5, 18, 0, ROCK2, Enum.Material.Slate)
		block(arena, "ArchLeg", a.X + 6, a.Z, 5, 5, 18, 0, ROCK2, Enum.Material.Slate)
		block(arena, "ArchTop", a.X, a.Z, 17, 5.5, 5, 18, ROCK, Enum.Material.Slate)
	end
	-- boulders and trees (the same places every time, and the bots know about them)
	for i, r in Canyon.Rocks do
		local rock = block(arena, "Boulder", r[1], r[2], r[3] * 2, r[3] * 1.8, r[4], 0, i % 2 == 0 and ROCK or ROCK2, Enum.Material.Slate)
		rock.CFrame = CFrame.new(r[1], r[4] / 2, r[2]) * CFrame.Angles(0, i * 0.9, 0)
	end
	for _, t in Canyon.Trees do
		tree(arena, t[1], t[2], t[3])
	end

	-- the wrecked plane (half buried, tilted, a bunker) and the seaplane at the dock
	local wreck = planeModel("WreckedPlane", C(214, 69, 61))
	placePlane(wreck, arena, Vector3.new(Canyon.Wreck.X, 3.5, Canyon.Wreck.Z), 0.6, -0.2, 0.3, true)
	local sea = planeModel("Seaplane", C(255, 216, 77))
	placePlane(sea, scenery, Vector3.new(Canyon.Seaplane.X, 2.2, Canyon.Seaplane.Z), math.pi / 2, 0, 0, false)

	-- the planes in the sky: the client makes them fly (see Client/Modules/Ambient)
	local sky = folder("Planes")
	for i = 1, #Canyon.Planes.Starts do
		local m = planeModel("Plane" .. i, i == 1 and C(255, 77, 77) or C(77, 166, 255))
		m:SetAttribute("PlaneIndex", i)
		local x, y, z, yaw = Rules.planePose(0, Canyon.Planes, i)
		placePlane(m, sky, Vector3.new(x, y, z), yaw, 0, 0, false)
	end
end

CanyonWorld.flowing = flowing -- (the lobby uses the same flowing-water look)

return CanyonWorld

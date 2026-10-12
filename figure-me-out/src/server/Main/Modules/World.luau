-- FIGURE ME OUT: builds the world from plain parts: "Plaza Park" (the arena, a city of 8 buildings around a park, with
-- streets between them) and the lobby island where everybody waits for the next match. The look is early-2000s
-- nostalgia with a Frutiger Aero feel: sunny sky, rolling green hills, glossy aqua glass, pastel buildings, bubbles.
local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Pickups = require(script.Parent.Pickups)
local Terminals = require(script.Parent.Terminals)

local World = {}

local C = Color3.fromRGB
local AQUA, LIME, WHITE = C(90, 215, 255), C(130, 225, 90), C(244, 250, 255)

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

local function neon(parent, name, size, position, color)
	local p = part(parent, name, size, position, color, Enum.Material.Neon)
	p.CanCollide = false
	p.CanQuery = false
	return p
end

local function tree(parent, x, z)
	local trunk = part(parent, "Trunk", Vector3.new(2, 9, 2), Vector3.new(x, 4.5, z), C(110, 78, 48), Enum.Material.Wood)
	trunk.Shape = Enum.PartType.Cylinder
	trunk.Size = Vector3.new(9, 2, 2)
	trunk.CFrame = CFrame.new(x, 4.5, z) * CFrame.Angles(0, 0, math.pi / 2)
	local leaves = part(parent, "Leaves", Vector3.new(12, 10, 12), Vector3.new(x, 12, z), C(84, 196, 78), Enum.Material.Grass)
	leaves.Shape = Enum.PartType.Ball
end

local function lamp(parent, x, z)
	local pole = part(parent, "Lamp", Vector3.new(0.6, 9, 0.6), Vector3.new(x, 4.5, z), WHITE, Enum.Material.Metal)
	local bulb = part(parent, "Bulb", Vector3.new(2, 2, 2), Vector3.new(x, 9.8, z), C(180, 240, 255), Enum.Material.Glass)
	bulb.Shape = Enum.PartType.Ball
	bulb.Transparency = 0.25
	pole.CanQuery = false
	bulb.CanQuery = false
	bulb.CanCollide = false
end

local function building(parent, b, index)
	local h = Config.Map.BuildingHeight
	local s = b.Size
	local palette = { C(140, 214, 232), C(160, 228, 186), C(160, 196, 244), C(250, 238, 160), C(255, 204, 176), C(208, 188, 242), C(244, 248, 252), C(255, 182, 176) }
	local color = palette[(index - 1) % #palette + 1]
	part(parent, "Building", Vector3.new(s, h, s), Vector3.new(b.X, h / 2, b.Z), color, Enum.Material.SmoothPlastic)
	-- glowing roof edge and window bands (they are decoration, so they can't be hit by guesses or block sight)
	local trim = index % 2 == 0 and AQUA or LIME
	neon(parent, "RoofGlowN", Vector3.new(s + 0.6, 0.5, 0.5), Vector3.new(b.X, h + 0.25, b.Z - s / 2), trim)
	neon(parent, "RoofGlowS", Vector3.new(s + 0.6, 0.5, 0.5), Vector3.new(b.X, h + 0.25, b.Z + s / 2), trim)
	neon(parent, "RoofGlowE", Vector3.new(0.5, 0.5, s + 0.6), Vector3.new(b.X + s / 2, h + 0.25, b.Z), trim)
	neon(parent, "RoofGlowW", Vector3.new(0.5, 0.5, s + 0.6), Vector3.new(b.X - s / 2, h + 0.25, b.Z), trim)
	for _, y in { 5, 10 } do
		local band = part(parent, "Windows", Vector3.new(s + 0.2, 2.2, s + 0.2), Vector3.new(b.X, y, b.Z), C(110, 200, 245), Enum.Material.Glass)
		band.Transparency = 0.4
		band.CanCollide = false
		band.CanQuery = false
	end
	-- sniper roof: low walls on three sides, and a ladder up the fourth (the side facing the middle of the map)
	local lip = 2.6
	part(parent, "Parapet", Vector3.new(s, lip, 1), Vector3.new(b.X, h + lip / 2, b.Z - s / 2 + 0.5), color:Lerp(C(255, 255, 255), 0.4))
	part(parent, "Parapet", Vector3.new(s, lip, 1), Vector3.new(b.X, h + lip / 2, b.Z + s / 2 - 0.5), color:Lerp(C(255, 255, 255), 0.4))
	local towardX = b.X == 0 and 0 or (b.X > 0 and -1 or 1)
	if towardX ~= 0 then
		part(parent, "Parapet", Vector3.new(1, lip, s), Vector3.new(b.X - towardX * (s / 2 - 0.5), h + lip / 2, b.Z), color:Lerp(C(255, 255, 255), 0.4))
		local truss = Instance.new("TrussPart")
		truss.Name = "Ladder"
		truss.Size = Vector3.new(2, h + 1, 2)
		truss.Position = Vector3.new(b.X + towardX * (s / 2 + 1), (h + 1) / 2, b.Z)
		truss.Anchored = true
		truss.Color = C(255, 205, 70)
		truss.Parent = parent
	else
		part(parent, "Parapet", Vector3.new(1, lip, s), Vector3.new(b.X - (s / 2 - 0.5), h + lip / 2, b.Z), color:Lerp(C(255, 255, 255), 0.4))
		local truss = Instance.new("TrussPart")
		truss.Name = "Ladder"
		truss.Size = Vector3.new(2, h + 1, 2)
		truss.Position = Vector3.new(b.X + (s / 2 + 1), (h + 1) / 2, b.Z)
		truss.Anchored = true
		truss.Color = C(255, 205, 70)
		truss.Parent = parent
	end
end

local function buildArena()
	local arena = folder("Arena")
	local ground = folder("Ground")
	local m = Config.Map
	local full = (m.Half + 4) * 2
	part(ground, "Floor", Vector3.new(full, 2, full), Vector3.new(0, -1, 0), C(186, 204, 220), Enum.Material.Concrete)
	-- sidewalk slabs, one per city block (the middle one is the park)
	for _, bx in m.BlockCenters do
		for _, bz in m.BlockCenters do
			local park = bx == 0 and bz == 0
			part(ground, park and "Park" or "Block", Vector3.new(m.Block, 0.4, m.Block), Vector3.new(bx, 0.2, bz), park and C(104, 204, 72) or C(238, 244, 250), park and Enum.Material.Grass or Enum.Material.SmoothPlastic)
		end
	end
	-- dashed lane lines down every street
	local L = (m.Block + m.Street) / 2
	for _, line in { -L, L } do
		for t = -m.Half + 6, m.Half - 6, 12 do
			neon(ground, "Lane", Vector3.new(0.5, 0.05, 5), Vector3.new(line, 0.03, t), C(255, 255, 255)).CanQuery = false
			neon(ground, "Lane", Vector3.new(5, 0.05, 0.5), Vector3.new(t, 0.03, line), C(255, 255, 255)).CanQuery = false
		end
	end
	for i, b in m.Buildings do
		building(arena, b, i)
	end
	-- boundary walls
	local wall = m.Half + 2
	local height = 40
	part(arena, "WallN", Vector3.new(wall * 2 + 4, height, 4), Vector3.new(0, height / 2, -wall), C(160, 224, 248), Enum.Material.Glass)
	part(arena, "WallS", Vector3.new(wall * 2 + 4, height, 4), Vector3.new(0, height / 2, wall), C(160, 224, 248), Enum.Material.Glass)
	part(arena, "WallE", Vector3.new(4, height, wall * 2), Vector3.new(wall, height / 2, 0), C(160, 224, 248), Enum.Material.Glass)
	part(arena, "WallW", Vector3.new(4, height, wall * 2), Vector3.new(-wall, height / 2, 0), C(160, 224, 248), Enum.Material.Glass)
	for _, w in arena:GetChildren() do
		if string.sub(w.Name, 1, 4) == "Wall" then
			w.Transparency = 0.45
		end
	end
	-- the park: fountain, trees, benches, hedges
	local pool = part(arena, "Fountain", Vector3.new(1.4, 12, 12), Vector3.new(0, 0.7, 0), C(246, 250, 255), Enum.Material.Marble)
	pool.Shape = Enum.PartType.Cylinder
	pool.CFrame = CFrame.new(0, 0.7, 0) * CFrame.Angles(0, 0, math.pi / 2)
	local water = neon(arena, "Water", Vector3.new(0.4, 10, 10), Vector3.new(0, 1.5, 0), C(110, 220, 255))
	water.Material = Enum.Material.Glass
	water.Transparency = 0.25
	water.Shape = Enum.PartType.Cylinder
	water.CFrame = CFrame.new(0, 1.5, 0) * CFrame.Angles(0, 0, math.pi / 2)
	water.CanCollide = false
	for _, t in { { -20, -18 }, { 20, -18 }, { -20, 18 }, { 20, 18 }, { 0, -24 }, { 0, 24 }, { -26, 0 }, { 26, 0 } } do
		tree(arena, t[1], t[2])
	end
	for _, h in { { -12, 0, 10, 2 }, { 12, 0, 10, 2 }, { 0, -12, 2, 10 }, { 0, 12, 2, 10 } } do
		part(arena, "Hedge", Vector3.new(h[3], 3.5, h[4]), Vector3.new(h[1], 1.75, h[2]), C(60, 168, 70), Enum.Material.Grass)
	end
	for _, bn in { { -9, -9 }, { 9, 9 }, { -9, 9 }, { 9, -9 } } do
		part(arena, "Bench", Vector3.new(6, 1.2, 2), Vector3.new(bn[1], 0.8, bn[2]), C(120, 85, 55), Enum.Material.Wood)
	end
	-- crates and bus-stop style cover scattered on the streets
	for i, p in { { 43, 0 }, { -43, 0 }, { 0, 43 }, { 0, -43 }, { 43, 60 }, { -43, -60 }, { 60, -43 }, { -60, 43 } } do
		part(arena, "Crate" .. i, Vector3.new(5, 4, 5), Vector3.new(p[1], 2, p[2]), C(150, 105, 60), Enum.Material.Wood)
	end
	-- street lamps
	local lamps = folder("Lamps")
	for _, sx in { -1, 1 } do
		for _, sz in { -1, 1 } do
			lamp(lamps, 31 * sx, 31 * sz)
			lamp(lamps, 55 * sx, 55 * sz)
			lamp(lamps, 31 * sx, 112 * sz)
			lamp(lamps, 112 * sx, 31 * sz)
		end
	end
	-- clearly marked spawn points: glowing pads on the street
	local pads = folder("SpawnPads")
	for i, spawn in m.Spawns do
		local pad = neon(pads, "SpawnPad" .. i, Vector3.new(6, 0.15, 6), Vector3.new(spawn.X, 0.5, spawn.Z), C(120, 230, 255))
		pad.Shape = Enum.PartType.Cylinder
		pad.Size = Vector3.new(0.15, 6, 6)
		pad.CFrame = CFrame.new(spawn.X, 0.5, spawn.Z) * CFrame.Angles(0, 0, math.pi / 2)
		pad.Transparency = 0.35
	end
	local crates = folder("Crates")
	Pickups.build(crates)
	Terminals.build(folder("Terminals"))
end

local board

local function buildLobby()
	local lobby = folder("Lobby")
	local c = Config.Map.Lobby
	local base = part(lobby, "Island", Vector3.new(2, 130, 130), c + Vector3.new(0, -1, 0), C(236, 246, 255), Enum.Material.SmoothPlastic)
	base.Shape = Enum.PartType.Cylinder
	base.CFrame = CFrame.new(c.X, c.Y - 1, c.Z) * CFrame.Angles(0, 0, math.pi / 2)
	local ring = neon(lobby, "Ring", Vector3.new(0.6, 126, 126), c + Vector3.new(0, 0.05, 0), AQUA)
	ring.Shape = Enum.PartType.Cylinder
	ring.CFrame = CFrame.new(c.X, c.Y + 0.05, c.Z) * CFrame.Angles(0, 0, math.pi / 2)
	ring.CanCollide = false
	local inner = part(lobby, "Floor", Vector3.new(0.4, 118, 118), c + Vector3.new(0, 0.2, 0), C(196, 232, 252), Enum.Material.Glass)
	inner.Shape = Enum.PartType.Cylinder
	inner.CFrame = CFrame.new(c.X, c.Y + 0.2, c.Z) * CFrame.Angles(0, 0, math.pi / 2)

	-- big title sign
	local sign = part(lobby, "Sign", Vector3.new(60, 16, 1), c + Vector3.new(0, 14, 50), C(22, 96, 150))
	local gui = Instance.new("SurfaceGui")
	gui.Face = Enum.NormalId.Back
	gui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	gui.CanvasSize = Vector2.new(960, 256)
	gui.LightInfluence = 0
	gui.Parent = sign
	local title = Instance.new("TextLabel")
	title.Size = UDim2.fromScale(1, 0.62)
	title.BackgroundTransparency = 1
	title.Font = Enum.Font.GothamBlack
	title.TextScaled = true
	title.Text = "FIGURE ME OUT"
	title.TextColor3 = WHITE
	title.Parent = gui
	local subtitle = Instance.new("TextLabel")
	subtitle.Position = UDim2.fromScale(0, 0.64)
	subtitle.Size = UDim2.fromScale(1, 0.3)
	subtitle.BackgroundTransparency = 1
	subtitle.Font = Enum.Font.GothamBold
	subtitle.TextScaled = true
	subtitle.Text = "Read their number. Hide yours."
	subtitle.TextColor3 = C(180, 255, 150)
	subtitle.Parent = gui

	-- leaderboard board (text is set by World.setBoard)
	local bpart = part(lobby, "Board", Vector3.new(26, 22, 1), c + Vector3.new(-42, 12, 28), C(22, 96, 150))
	bpart.CFrame = CFrame.new(bpart.Position, Vector3.new(c.X, bpart.Position.Y, c.Z))
	local bgui = Instance.new("SurfaceGui")
	bgui.Face = Enum.NormalId.Front
	bgui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	bgui.CanvasSize = Vector2.new(520, 440)
	bgui.LightInfluence = 0
	bgui.Parent = bpart
	local head = Instance.new("TextLabel")
	head.Size = UDim2.new(1, 0, 0, 70)
	head.BackgroundTransparency = 1
	head.Font = Enum.Font.GothamBlack
	head.TextScaled = true
	head.Text = "🏆 TOP WINNERS"
	head.TextColor3 = C(255, 214, 60)
	head.Parent = bgui
	board = Instance.new("TextLabel")
	board.Name = "Lines"
	board.Position = UDim2.fromOffset(20, 80)
	board.Size = UDim2.new(1, -40, 1, -90)
	board.BackgroundTransparency = 1
	board.Font = Enum.Font.GothamBold
	board.TextSize = 30
	board.TextXAlignment = Enum.TextXAlignment.Left
	board.TextYAlignment = Enum.TextYAlignment.Top
	board.TextColor3 = C(255, 255, 255)
	board.Text = "Win a match to get on the board!"
	board.Parent = bgui

	-- how to play board
	local hpart = part(lobby, "HowTo", Vector3.new(26, 22, 1), c + Vector3.new(42, 12, 28), C(22, 96, 150))
	hpart.CFrame = CFrame.new(hpart.Position, Vector3.new(c.X, hpart.Position.Y, c.Z))
	local hgui = Instance.new("SurfaceGui")
	hgui.Face = Enum.NormalId.Front
	hgui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	hgui.CanvasSize = Vector2.new(520, 440)
	hgui.LightInfluence = 0
	hgui.Parent = hpart
	local htitle = head:Clone()
	htitle.Text = "HOW TO PLAY"
	htitle.TextColor3 = WHITE
	htitle.Parent = hgui
	local how = board:Clone()
	how.Name = "Lines"
	how.TextSize = 25
	how.Text = "• Everyone has a secret 3-digit number on their forehead.\n• Aim at someone, press G and type THEIR number: they are out!\n• Hide yours, but don't stare at walls: you'll be exposed.\n• 🔭 zoom  📷 photo  💥 flash  💨 smoke\n• Last one standing wins."
	how.Parent = hgui

	for i = 1, Config.Match.MaxPlayers do
		local angle = (i / Config.Match.MaxPlayers) * math.pi * 2
		local pad = part(lobby, "Pad", Vector3.new(4, 0.3, 4), c + Vector3.new(math.cos(angle) * 30, 0.35, math.sin(angle) * 30), C(130, 214, 250))
		pad.CanQuery = false
	end
end

function World.lobbySpawn(i)
	local c = Config.Map.Lobby
	local angle = (((i - 1) % Config.Match.MaxPlayers + 1) / Config.Match.MaxPlayers) * math.pi * 2
	return c + Vector3.new(math.cos(angle) * 30, 4, math.sin(angle) * 30)
end

function World.arenaSpawn(i)
	local list = Config.Map.Spawns
	return list[(i - 1) % #list + 1]
end

function World.setBoard(lines)
	if board then
		board.Text = table.concat(lines, "\n")
	end
end

local function effect(class, props)
	local e = Lighting:FindFirstChildOfClass(class) or Instance.new(class)
	for k, v in props do
		e[k] = v
	end
	e.Parent = Lighting
	return e
end

-- A bright, sunny afternoon.
local function lighting()
	Lighting.ClockTime = 14
	Lighting.Brightness = 3
	Lighting.Ambient = C(150, 168, 190)
	Lighting.OutdoorAmbient = C(170, 188, 210)
	Lighting.ColorShift_Top = C(255, 244, 220)
	Lighting.EnvironmentDiffuseScale = 0.7
	Lighting.EnvironmentSpecularScale = 0.6
	Lighting.GlobalShadows = true
	Lighting.FogColor = C(200, 230, 255)
	Lighting.FogEnd = 2500
	local sky = Lighting:FindFirstChildOfClass("Sky") or Instance.new("Sky")
	sky.StarCount = 0
	sky.Parent = Lighting
	effect("Atmosphere", { Density = 0.3, Color = C(190, 225, 255), Decay = C(120, 180, 240), Haze = 0.8, Glare = 0.2 })
	effect("Bloom", { Intensity = 0.35, Size = 28, Threshold = 0.95 })
	effect("SunRaysEffect", { Intensity = 0.1, Spread = 0.8 })
	effect("ColorCorrectionEffect", { Saturation = 0.18, Contrast = 0.06, TintColor = C(244, 252, 255) })
	local clouds = workspace.Terrain:FindFirstChildOfClass("Clouds") or Instance.new("Clouds")
	clouds.Cover = 0.55
	clouds.Density = 0.5
	clouds.Parent = workspace.Terrain
end

-- Rolling green hills in the distance, a hazy horizon and floating bubbles (all decoration: nothing here can be hit).
local function scenery()
	local f = folder("Scenery")
	local function deco(p)
		p.CanCollide = false
		p.CanQuery = false
		p.CanTouch = false
		p.CastShadow = false
		return p
	end
	local hills = {
		{ -420, -300, 330 }, { 60, -520, 420 }, { 520, -260, 360 }, { 620, 200, 300 }, { 380, 560, 380 },
		{ -140, 640, 340 }, { -560, 380, 360 }, { -640, -60, 300 },
	}
	for _, h in hills do
		local hill = deco(part(f, "Hill", Vector3.new(h[3], h[3], h[3]), Vector3.new(h[1], -h[3] * 0.38, h[2]), C(118, 204, 78), Enum.Material.Grass))
		hill.Shape = Enum.PartType.Ball
	end
	deco(part(f, "FarGround", Vector3.new(3000, 2, 3000), Vector3.new(0, -26, 0), C(128, 208, 84), Enum.Material.Grass))
	-- bubbles: translucent glassy balls drifting above the streets
	local seed = 17
	local function rnd()
		seed = (seed * 48271) % 2147483647
		return seed / 2147483647
	end
	for _ = 1, 40 do
		local size = 3 + rnd() * 7
		local b = deco(part(f, "Bubble", Vector3.new(size, size, size), Vector3.new((rnd() - 0.5) * 240, 8 + rnd() * 26, (rnd() - 0.5) * 240), C(190, 235, 255), Enum.Material.Glass))
		b.Shape = Enum.PartType.Ball
		b.Transparency = 0.55
		b.Reflectance = 0.3
	end
end

-- Builds everything. Each piece is separate, so a problem in one decoration can never stop the game. Returns a list of
-- error messages (empty when everything worked).
function World.build()
	local errors = {}
	local function step(name, fn)
		local ok, err = pcall(fn)
		if not ok then
			warn("[FigureMeOut] world step '" .. name .. "' failed: " .. tostring(err))
			table.insert(errors, name .. ": " .. tostring(err))
		end
	end
	step("lighting", lighting)
	step("arena", buildArena)
	step("lobby", buildLobby)
	step("scenery", scenery)
	step("folders", function()
		for _, name in { "Smoke", "Decoys", "Bots", "Effects" } do
			folder(name)
		end
	end)
	return errors
end

return World

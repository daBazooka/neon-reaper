-- FIGURE ME OUT: the lobby, a floating garden island where everybody waits for the next match: grass and trees, a stone plaza with a
-- fountain, paths, benches, lamps, flower beds, two little waterfalls spilling off the edge into the sky, a big title banner,
-- the winners board, a how-to board and a big status screen ("WAITING FOR PLAYERS 1/2", "NEXT: DEATHMATCH - 8 s").
-- Players are placed on a ring of radius 30 round the middle (see World.lobbySpawn), so nothing solid stands on that ring.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local CanyonWorld = require(script.Parent.CanyonWorld)

local LobbyWorld = {}

local C = Color3.fromRGB
local GRASS, ROCK, STONE, WOOD = C(122, 206, 92), C(150, 138, 124), C(236, 230, 216), C(160, 118, 72)
local AQUA, GOLD, WHITE = C(90, 215, 255), C(255, 214, 60), C(250, 252, 255)

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

local function deco(parent, name, size, position, color, material)
	local p = part(parent, name, size, position, color, material)
	p.CanCollide = false
	p.CanQuery = false
	p.CastShadow = false
	return p
end

-- A round slab standing on its end (Roblox cylinders lie along x, so it is turned upright).
local function disc(parent, name, cx, cy, cz, radius, height, color, material, solid)
	local p = part(parent, name, Vector3.new(height, radius * 2, radius * 2), Vector3.new(cx, cy, cz), color, material)
	p.Shape = Enum.PartType.Cylinder
	p.CFrame = CFrame.new(cx, cy, cz) * CFrame.Angles(0, 0, math.pi / 2)
	if solid == false then
		p.CanCollide = false
		p.CanQuery = false
		p.CastShadow = false
	end
	return p
end

local function ball(parent, name, size, position, color, material)
	local p = part(parent, name, Vector3.new(size, size, size), position, color, material)
	p.Shape = Enum.PartType.Ball
	return p
end

local function tree(parent, x, y, z, size)
	part(parent, "Trunk", Vector3.new(1.6 * size, 6 * size, 1.6 * size), Vector3.new(x, y + 3 * size, z), C(112, 80, 48), Enum.Material.Wood)
	local leaves = ball(parent, "Leaves", 9 * size, Vector3.new(x, y + 9 * size, z), C(60 + (x * 3) % 40, 170 + (z * 5) % 40, 80), Enum.Material.Grass)
	leaves.CanCollide = false
	leaves.CanQuery = false
	local top = ball(parent, "Leaves", 6 * size, Vector3.new(x + 1 * size, y + 12.5 * size, z), C(90, 200, 100), Enum.Material.Grass)
	top.CanCollide = false
	top.CanQuery = false
end

local function lamp(parent, x, z)
	part(parent, "LampPost", Vector3.new(0.7, 9, 0.7), Vector3.new(x, 4.5, z), C(70, 76, 92), Enum.Material.Metal)
	local bulb = ball(parent, "LampBulb", 2.4, Vector3.new(x, 9.8, z), C(255, 236, 170), Enum.Material.Neon)
	bulb.CanCollide = false
	bulb.CanQuery = false
	local light = Instance.new("PointLight")
	light.Color = C(255, 226, 160)
	light.Range = 22
	light.Brightness = 1.4
	light.Parent = bulb
end

local function bench(parent, x, z, facing)
	local seat = part(parent, "BenchSeat", Vector3.new(6, 0.6, 2), Vector3.new(x, 1.6, z), WOOD, Enum.Material.Wood)
	seat.CFrame = CFrame.new(x, 1.6, z) * CFrame.Angles(0, facing, 0)
	local back = part(parent, "BenchBack", Vector3.new(6, 1.8, 0.4), Vector3.new(x, 2.8, z), WOOD, Enum.Material.Wood)
	back.CFrame = CFrame.new(x, 2.8, z) * CFrame.Angles(0, facing, 0) * CFrame.new(0, 0, 0.9)
	for _, dx in { -2.4, 2.4 } do
		local leg = part(parent, "BenchLeg", Vector3.new(0.5, 1.4, 1.6), Vector3.new(x, 0.7, z), C(70, 76, 92), Enum.Material.Metal)
		leg.CFrame = CFrame.new(x, 0.7, z) * CFrame.Angles(0, facing, 0) * CFrame.new(dx, 0, 0)
	end
end

-- A flat board with text on one face (a SurfaceGui). Returns the part and the label.
local function board(parent, name, size, position, lookAt, color, face)
	local p = part(parent, name, size, position, color, Enum.Material.SmoothPlastic)
	p.CFrame = CFrame.new(position, lookAt)
	local gui = Instance.new("SurfaceGui")
	gui.Face = face or Enum.NormalId.Front
	gui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	gui.CanvasSize = Vector2.new(size.X * 20, size.Y * 20)
	gui.LightInfluence = 0
	gui.Parent = p
	return p, gui
end

local function label(gui, props)
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1
	l.Font = Enum.Font.FredokaOne
	l.TextScaled = true
	l.TextColor3 = WHITE
	for k, v in props do
		l[k] = v
	end
	l.Parent = gui
	return l
end

-- Builds everything and returns { board = <winners text label>, status = { title = label, sub = label } }.
function LobbyWorld.build(lobby)
	local c = Config.Map.Lobby
	local top = c.Y

	-- the island: a grass top over layers of rock getting smaller towards the bottom
	disc(lobby, "Grass", c.X, top - 1.5, c.Z, 64, 3, GRASS, Enum.Material.Grass)
	for i, def in { { 60, 10 }, { 48, 10 }, { 34, 10 }, { 20, 10 }, { 8, 12 } } do
		disc(lobby, "Rock" .. i, c.X, top - 3 - i * 9, c.Z, def[1], def[2], i % 2 == 0 and ROCK or C(168, 156, 140), Enum.Material.Slate)
	end
	disc(lobby, "EdgeGlow", c.X, top - 0.9, c.Z, 65, 1.4, AQUA, Enum.Material.Neon, false).Transparency = 0.15 -- a glowing rim round the grass

	-- mown stripes: bands of lighter and darker grass in rings
	for i, def in { { 60, C(132, 214, 104) }, { 52, C(116, 196, 90) }, { 44, C(132, 214, 104) }, { 36, C(116, 196, 90) } } do
		disc(lobby, "Mown" .. i, c.X, top + 0.02 + i * 0.01, c.Z, def[1], 0.1, def[2], Enum.Material.Grass, false)
	end

	-- the plaza and the fountain
	disc(lobby, "Plaza", c.X, top + 0.2, c.Z, 22, 0.4, STONE, Enum.Material.Marble)
	disc(lobby, "PlazaRing1", c.X, top + 0.45, c.Z, 20, 0.1, AQUA, Enum.Material.Neon, false)
	disc(lobby, "PlazaRing2", c.X, top + 0.5, c.Z, 19, 0.1, STONE, Enum.Material.Marble, false)
	disc(lobby, "PlazaRing3", c.X, top + 0.45, c.Z, 13, 0.1, GOLD, Enum.Material.Neon, false)
	disc(lobby, "PlazaRing4", c.X, top + 0.5, c.Z, 12, 0.1, STONE, Enum.Material.Marble, false)
	disc(lobby, "FountainBasin", c.X, top + 0.9, c.Z, 8.5, 1.4, STONE, Enum.Material.Marble)
	local water = disc(lobby, "FountainWater", c.X, top + 1.5, c.Z, 7.6, 0.4, C(110, 220, 255), Enum.Material.Glass, false)
	water.Transparency = 0.3
	disc(lobby, "FountainColumn", c.X, top + 4, c.Z, 1.3, 6, STONE, Enum.Material.Marble)
	disc(lobby, "FountainBowl", c.X, top + 7.2, c.Z, 3.4, 0.9, STONE, Enum.Material.Marble)
	local spout = deco(lobby, "FountainSpout", Vector3.new(1, 1, 1), Vector3.new(c.X, top + 8, c.Z), WHITE)
	spout.Transparency = 1
	local spray = Instance.new("ParticleEmitter")
	spray.Name = "Spray"
	spray.Rate = 40
	spray.Lifetime = NumberRange.new(1.2, 1.8)
	spray.Speed = NumberRange.new(10, 14)
	spray.SpreadAngle = Vector2.new(26, 26)
	spray.Acceleration = Vector3.new(0, -22, 0)
	spray.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.7), NumberSequenceKeypoint.new(1, 0.2) })
	spray.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(1, 1) })
	spray.Color = ColorSequence.new(C(190, 235, 255))
	spray.LightEmission = 0.5
	spray.EmissionDirection = Enum.NormalId.Top
	spray.Parent = spout
	-- slow glittering sparkles over the plaza
	local sparkAnchor = deco(lobby, "SparkleAnchor", Vector3.new(40, 1, 40), Vector3.new(c.X, top + 14, c.Z), WHITE)
	sparkAnchor.Transparency = 1
	local sparkle = Instance.new("ParticleEmitter")
	sparkle.Name = "Sparkles"
	sparkle.Rate = 6
	sparkle.Lifetime = NumberRange.new(4, 6)
	sparkle.Speed = NumberRange.new(0.5, 1.5)
	sparkle.SpreadAngle = Vector2.new(180, 180)
	sparkle.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 0) })
	sparkle.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 1) })
	sparkle.Color = ColorSequence.new(C(255, 240, 180))
	sparkle.LightEmission = 0.8
	sparkle.Parent = sparkAnchor

	-- stone paths out to the four sides
	for _, dir in { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } } do
		local len = 36
		local mid = 22 + len / 2
		local w, d = dir[1] ~= 0 and len or 8, dir[2] ~= 0 and len or 8
		part(lobby, "Path", Vector3.new(w, 0.3, d), Vector3.new(c.X + dir[1] * mid, top + 0.15, c.Z + dir[2] * mid), C(226, 206, 164), Enum.Material.Cobblestone)
	end

	-- flower beds between the plaza and the spawn ring, and benches, lamps and trees further out
	local bedColors = { C(255, 120, 160), C(255, 214, 80), C(190, 130, 255), C(255, 150, 70), C(120, 200, 255), C(255, 255, 255) }
	for i = 1, 12 do
		local a = (i / 12) * math.pi * 2 + 0.26
		local x, z = c.X + math.cos(a) * 24.5, c.Z + math.sin(a) * 24.5
		disc(lobby, "FlowerBed", x, top + 0.4, z, 2.4, 0.8, C(150, 108, 70), Enum.Material.Wood)
		for k = 1, 5 do
			local fa = k * 1.256
			local f = ball(lobby, "Flower", 0.9, Vector3.new(x + math.cos(fa) * 1.2, top + 1.1, z + math.sin(fa) * 1.2), bedColors[(i + k) % 6 + 1], Enum.Material.SmoothPlastic)
			f.CanCollide = false
			f.CanQuery = false
		end
	end
	for i = 1, 8 do
		local a = (i / 8) * math.pi * 2 + 0.39
		bench(lobby, c.X + math.cos(a) * 41, c.Z + math.sin(a) * 41, -a + math.pi / 2)
	end
	for i = 1, 12 do
		local a = (i / 12) * math.pi * 2
		lamp(lobby, c.X + math.cos(a) * 37, c.Z + math.sin(a) * 37)
	end
	-- (trees stay clear of the boards, the status screen and the banner)
	local keepClear = { { -46, 26 }, { 46, 26 }, { 0, -46 }, { 0, 50 }, { -32, 50 }, { 32, 50 } }
	for i = 1, 22 do
		local a = (i / 22) * math.pi * 2 + 0.2
		local r = 54 + (i % 3) * 3
		local x, z = math.cos(a) * r, math.sin(a) * r
		local free = true
		for _, k in keepClear do
			if (k[1] - x) ^ 2 + (k[2] - z) ^ 2 < 15 ^ 2 then
				free = false
			end
		end
		if free then
			tree(lobby, c.X + x, top, c.Z + z, 1.0 + (i % 4) * 0.18)
		end
	end

	-- two little waterfalls over the edge, falling into the sky
	for _, angle in { 3.75, 5.35 } do
		local x, z = c.X + math.cos(angle) * 60, c.Z + math.sin(angle) * 60
		local ox, oz = math.cos(angle), math.sin(angle)
		part(lobby, "FallRock", Vector3.new(11, 7, 7), Vector3.new(x - ox * 3, top + 3.5, z - oz * 3), ROCK, Enum.Material.Slate)
		part(lobby, "FallPool", Vector3.new(9, 0.4, 5), Vector3.new(x - ox * 1, top + 0.3, z - oz * 1), C(80, 190, 245), Enum.Material.Glass).CanCollide = false
		local sheet = part(lobby, "LobbyFall", Vector3.new(6, 70, 1.4), Vector3.new(x + ox * 3.4, top - 30, z + oz * 3.4), C(150, 218, 255), Enum.Material.SmoothPlastic)
		sheet.CFrame = CFrame.new(sheet.Position, Vector3.new(c.X, sheet.Position.Y, c.Z))
		sheet.Transparency = 0.3
		sheet.CanCollide = false
		sheet.CanQuery = false
		sheet.CastShadow = false
		CanyonWorld.flowing(sheet, Enum.NormalId.Front, Config.Water.FallSpeed, 6, 0.35)
		CanyonWorld.flowing(sheet, Enum.NormalId.Back, Config.Water.FallSpeed, 6, 0.35)
	end

	-- a golden trophy on a marble pedestal in the plaza (win a match to be on the board!)
	local tx, tz = c.X + 14, c.Z + 11
	part(lobby, "TrophyPedestal", Vector3.new(4.6, 3, 4.6), Vector3.new(tx, top + 1.9, tz), STONE, Enum.Material.Marble)
	part(lobby, "TrophyPlinth", Vector3.new(5.4, 0.6, 5.4), Vector3.new(tx, top + 0.7, tz), C(210, 200, 182), Enum.Material.Marble)
	local gold = C(255, 200, 60)
	disc(lobby, "TrophyBase", tx, top + 3.6, tz, 1.6, 0.5, gold, Enum.Material.Metal, false)
	disc(lobby, "TrophyStem", tx, top + 4.8, tz, 0.5, 2, gold, Enum.Material.Metal, false)
	disc(lobby, "TrophyCupLow", tx, top + 6.2, tz, 1.5, 0.9, gold, Enum.Material.Metal, false)
	disc(lobby, "TrophyCup", tx, top + 7.1, tz, 2.1, 1.2, gold, Enum.Material.Metal, false)
	for _, side in { -1, 1 } do
		local handle = ball(lobby, "TrophyHandle", 1.3, Vector3.new(tx + side * 2.3, top + 7, tz), gold, Enum.Material.Metal)
		handle.CanCollide = false
		handle.CanQuery = false
	end
	local star = ball(lobby, "TrophyStar", 1.4, Vector3.new(tx, top + 9.2, tz), C(255, 250, 190), Enum.Material.Neon)
	star.CanCollide = false
	star.CanQuery = false
	local starLight = Instance.new("PointLight")
	starLight.Color = C(255, 230, 150)
	starLight.Range = 18
	starLight.Brightness = 1.5
	starLight.Parent = star

	-- glowing stepping lights along the paths
	for _, dir in { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } } do
		for k = 0, 5 do
			local r = 26 + k * 6
			for _, side in { -4.6, 4.6 } do
				local x = c.X + dir[1] * r + (dir[1] == 0 and side or 0)
				local z = c.Z + dir[2] * r + (dir[2] == 0 and side or 0)
				disc(lobby, "PathLight", x, top + 0.45, z, 0.45, 0.3, AQUA, Enum.Material.Neon, false)
			end
		end
	end

	-- bunting: little coloured flags strung between the lamps
	local flagColours = { C(255, 100, 140), C(255, 214, 80), C(110, 200, 255), C(150, 230, 120), C(200, 140, 255) }
	for i = 1, 12 do
		local a1, a2 = (i / 12) * math.pi * 2, ((i % 12 + 1) / 12) * math.pi * 2
		local x1, z1, x2, z2 = math.cos(a1) * 37, math.sin(a1) * 37, math.cos(a2) * 37, math.sin(a2) * 37
		for k = 1, 7 do
			local t = k / 8
			local fx, fz = x1 + (x2 - x1) * t, z1 + (z2 - z1) * t
			local flag = ball(lobby, "Flag", 0.95, Vector3.new(c.X + fx, top + 9.6 - 1.4 * math.sin(math.pi * t), c.Z + fz), flagColours[(i + k) % 5 + 1], Enum.Material.SmoothPlastic)
			flag.CanCollide = false
			flag.CanQuery = false
			flag.CastShadow = false
		end
	end

	-- paper lanterns floating on strings above the garden
	for i = 1, 10 do
		local a = i * 0.63 + 0.2
		local r = 44 + (i % 3) * 3
		local y = top + 15 + (i % 4) * 2
		local string_ = deco(lobby, "LanternString", Vector3.new(0.15, 6, 0.15), Vector3.new(c.X + math.cos(a) * r, y + 3.6, c.Z + math.sin(a) * r), C(90, 90, 100))
		local lantern = ball(lobby, "PaperLantern", 2.6, Vector3.new(c.X + math.cos(a) * r, y, c.Z + math.sin(a) * r), flagColours[i % 5 + 1], Enum.Material.Neon)
		lantern.CanCollide = false
		lantern.CanQuery = false
		lantern.Transparency = 0.15
		local glow = Instance.new("PointLight")
		glow.Color = lantern.Color
		glow.Range = 16
		glow.Brightness = 1
		glow.Parent = lantern
	end

	-- a rainbow behind the banner
	CanyonWorld.rainbow(lobby, c.X, top - 4, c.Z + 66, 54, 2.2)

	-- the title banner on two tall posts (read from the middle)
	for _, dx in { -32, 32 } do
		part(lobby, "BannerPost", Vector3.new(2, 34, 2), Vector3.new(c.X + dx, top + 17, c.Z + 50), C(70, 76, 92), Enum.Material.Metal)
		ball(lobby, "BannerKnob", 3, Vector3.new(c.X + dx, top + 35, c.Z + 50), GOLD, Enum.Material.Neon).CanCollide = false
	end
	local _, titleGui = board(lobby, "Title", Vector3.new(60, 14, 1), Vector3.new(c.X, top + 26, c.Z + 50), Vector3.new(c.X, top + 26, c.Z), C(22, 96, 150), Enum.NormalId.Front)
	label(titleGui, { Size = UDim2.fromScale(1, 0.62), Text = "FIGURE ME OUT", TextColor3 = WHITE })
	label(titleGui, { Position = UDim2.fromScale(0, 0.64), Size = UDim2.fromScale(1, 0.3), Text = "Read their number. Hide yours.", Font = Enum.Font.GothamBold, TextColor3 = C(180, 255, 150) })

	-- the status screen, facing the spawn ring
	local screen, statusGui = board(lobby, "StatusScreen", Vector3.new(34, 14, 1.2), Vector3.new(c.X, top + 12, c.Z - 46), Vector3.new(c.X, top + 12, c.Z), C(14, 30, 64), Enum.NormalId.Front)
	part(lobby, "StatusFrame", Vector3.new(36, 16, 0.8), Vector3.new(c.X, top + 12, c.Z - 46.5), AQUA, Enum.Material.Neon).CanCollide = false
	for _, dx in { -14, 14 } do
		part(lobby, "StatusLeg", Vector3.new(1.4, 12, 1.4), Vector3.new(c.X + dx, top + 5, c.Z - 47), C(70, 76, 92), Enum.Material.Metal)
	end
	local statusTitle = label(statusGui, { Position = UDim2.fromScale(0.04, 0.08), Size = UDim2.fromScale(0.92, 0.5), Text = "WAITING FOR PLAYERS", TextColor3 = GOLD })
	local statusSub = label(statusGui, { Position = UDim2.fromScale(0.04, 0.6), Size = UDim2.fromScale(0.92, 0.3), Text = "", Font = Enum.Font.GothamBold, TextColor3 = WHITE })

	-- the winners board (left) and the how-to board (right)
	local bpart, bgui = board(lobby, "Board", Vector3.new(26, 22, 1), Vector3.new(c.X - 46, top + 13, c.Z + 26), Vector3.new(c.X, top + 13, c.Z), C(22, 96, 150), Enum.NormalId.Front)
	part(lobby, "BoardPost", Vector3.new(1.4, 12, 1.4), Vector3.new(c.X - 46, top + 6, c.Z + 26), C(70, 76, 92), Enum.Material.Metal)
	label(bgui, { Size = UDim2.new(1, 0, 0, 70), Text = "🏆 TOP WINNERS", TextColor3 = GOLD })
	local winners = label(bgui, { Position = UDim2.fromOffset(20, 80), Size = UDim2.new(1, -40, 1, -90), Text = "Win a match to get on the board!", Font = Enum.Font.GothamBold, TextScaled = false, TextSize = 30, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top })
	local hpart, hgui = board(lobby, "HowTo", Vector3.new(26, 22, 1), Vector3.new(c.X + 46, top + 13, c.Z + 26), Vector3.new(c.X, top + 13, c.Z), C(22, 96, 150), Enum.NormalId.Front)
	part(lobby, "HowToPost", Vector3.new(1.4, 12, 1.4), Vector3.new(c.X + 46, top + 6, c.Z + 26), C(70, 76, 92), Enum.Material.Metal)
	label(hgui, { Size = UDim2.new(1, 0, 0, 70), Text = "HOW TO PLAY", TextColor3 = WHITE })
	label(hgui, { Position = UDim2.fromOffset(20, 80), Size = UDim2.new(1, -40, 1, -90), Text = "• Everyone has a " .. Config.Number.Digits .. "-digit number on a sign on their forehead.\n• Yours is on your screen: keep it hidden!\n• Put the dot on someone and type THEIR number.\n• Right = they are out. Wrong = you freeze.\n• F camera, G binoculars, chests give grenades.", Font = Enum.Font.GothamBold, TextScaled = false, TextSize = 25, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top })

	-- the skyline: little floating islands with trees, and clouds
	for i = 1, 7 do
		local a = i * 0.9 + 0.3
		local r = 120 + (i % 3) * 22
		local x, z, y = c.X + math.cos(a) * r, c.Z + math.sin(a) * r, top - 6 + (i % 4) * 9
		disc(lobby, "SkyIsle", x, y, z, 12, 6, GRASS, Enum.Material.Grass, false)
		disc(lobby, "SkyIsleRock", x, y - 8, z, 8, 10, ROCK, Enum.Material.Slate, false)
		tree(lobby, x, y + 3, z, 1.1)
	end
	for i = 1, 9 do
		local a = i * 0.7
		local r = 115 + (i % 4) * 20
		local cloud = ball(lobby, "Cloud", 12 + (i % 3) * 6, Vector3.new(c.X + math.cos(a) * r, top - 14 + (i % 5) * 8, c.Z + math.sin(a) * r), WHITE, Enum.Material.SmoothPlastic)
		cloud.Size = Vector3.new(cloud.Size.X * 1.6, cloud.Size.Y * 0.5, cloud.Size.Z)
		cloud.Transparency = 0.25
		cloud.CanCollide = false
		cloud.CanQuery = false
		cloud.CastShadow = false
	end

	-- the default spawn: anybody Roblox spawns on its own (joining, resetting) appears in the lobby. It is invisible and you can't bump into it.
	local home = Instance.new("SpawnLocation")
	home.Name = "LobbySpawnLocation"
	home.Size = Vector3.new(6, 0.4, 6)
	home.Position = Vector3.new(c.X, top + 0.6, c.Z - 30)
	home.Anchored = true
	home.Neutral = true
	home.Duration = 0
	home.Transparency = 1
	home.CanCollide = false
	home.CanQuery = false
	home.TopSurface = Enum.SurfaceType.Smooth
	home.Parent = lobby

	return { board = winners, status = { title = statusTitle, sub = statusSub } }
end

return LobbyWorld

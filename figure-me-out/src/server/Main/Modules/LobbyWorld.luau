-- FIGURE ME OUT: the lobby, a school courtyard like the one in the original game: terracotta paving, cream walls with an orange band,
-- teal doors, a blue basketball court in the middle, wooden decks with stairs, hedges, planters, lockers, log stacks, teal and yellow
-- boxes, benches and trees, with the title banner, the winners board, the how-to board and a big status screen on the walls
-- ("WAITING FOR PLAYERS", "NEXT: CAPTURE THE FLAG - 8 s", "MATCH IN PROGRESS - 12:30 left").
-- Players are placed on a ring of radius 30 round the middle (see World.lobbySpawn), so nothing solid stands on that ring.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))

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
	local H = 74 -- the courtyard is 148 x 148 inside its walls
	local PLASTER, ORANGE, TEAL, YELLOW = C(238, 228, 208), C(226, 110, 40), C(40, 150, 150), C(230, 190, 70)
	local PLANK, PLANK2, LEAF = C(166, 112, 60), C(132, 88, 46), C(70, 150, 70)
	local function solid(name, x, z, w, h, d, y0, color, material, rot)
		local p = part(lobby, name, Vector3.new(w, h, d), Vector3.new(c.X + x, top + y0 + h / 2, c.Z + z), color, material)
		if rot then
			p.CFrame = CFrame.new(c.X + x, top + y0 + h / 2, c.Z + z) * CFrame.Angles(0, math.rad(rot), 0)
		end
		return p
	end
	local function soft(name, x, z, w, h, d, y0, color, material, rot)
		local p = solid(name, x, z, w, h, d, y0, color, material, rot)
		p.CanCollide = false
		p.CanQuery = false
		p.CastShadow = false
		return p
	end

	-- the ground: terracotta paving with tan patches, white painted lines and cobblestone paths out from the court
	solid("Floor", 0, 0, H * 2 + 8, 2, H * 2 + 8, -2, C(212, 150, 126), Enum.Material.Concrete)
	for i = 1, 40 do
		local a = i * 2.399
		local r = 12 + (i * 37) % 58
		soft("PavingPatch", math.cos(a) * r, math.sin(a) * r, 8 + (i % 5) * 3, 0.06, 6 + (i % 4) * 3, 0.04, C(232, 190, 130), Enum.Material.Concrete, i * 23)
	end
	for _, z in { -52, 52 } do
		soft("PaintedLine", 0, z, 140, 0.06, 0.5, 0.06, WHITE, Enum.Material.SmoothPlastic)
	end
	for _, dir in { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } } do
		for k = 0, 8 do
			local d = 26 + k * 5.6
			soft("StoneTile", dir[1] * d + (dir[1] == 0 and (k % 2) * 1.2 - 0.6 or 0), dir[2] * d + (dir[2] == 0 and (k % 2) * 1.2 - 0.6 or 0), 5, 0.14, 4.2, 0.04, C(168, 164, 160), Enum.Material.Slate, k * 7)
		end
	end

	-- the walls: cream plaster with an orange band, windows and teal doors, and a dark roof line
	local wallDefs = { { 0, -H, H * 2 + 8, 4 }, { 0, H, H * 2 + 8, 4 }, { -H, 0, 4, H * 2 + 8 }, { H, 0, 4, H * 2 + 8 } }
	for i, def in wallDefs do
		solid("Wall", def[1], def[2], def[3], 34, def[4], 0, PLASTER, Enum.Material.SmoothPlastic)
		soft("WallCap", def[1], def[2], def[3], 1.6, def[4] + 1.2, 34, C(70, 58, 66), Enum.Material.SmoothPlastic)
		local along = i <= 2
		local inward = (i == 1 and 1) or (i == 2 and -1) or (i == 3 and 1) or -1
		local px, pz = def[1] + (along and 0 or inward * 2.1), def[2] + (along and inward * 2.1 or 0)
		soft("WallBand", px, pz, along and H * 2 or 0.3, 7, along and 0.3 or H * 2, 0, ORANGE, Enum.Material.SmoothPlastic)
		for k = -3, 3 do
			local off = k * 20 + 6
			local wx, wz = along and off or px, along and pz or off
			soft("Window", wx, wz, along and 9 or 0.3, 6, along and 0.3 or 9, 18, C(40, 70, 110), Enum.Material.Glass).Transparency = 0.25
			soft("WindowFrame", wx, wz, along and 10 or 0.2, 7, along and 0.2 or 10, 17.5, C(250, 246, 236), Enum.Material.SmoothPlastic)
			if k % 3 == 0 then
				soft("Door", wx + (along and 12 or 0), wz + (along and 0 or 12), along and 6 or 0.3, 10, along and 0.3 or 6, 0, TEAL, Enum.Material.Wood)
			end
		end
	end

	-- the basketball court in the middle (the spawn ring of radius 30 is round it) with a hoop at each end
	solid("Court", 0, 0, 38, 0.3, 22, 0, C(54, 116, 188), Enum.Material.SmoothPlastic)
	soft("CourtEdge", 0, 0, 40, 0.2, 24, 0, ORANGE, Enum.Material.SmoothPlastic)
	for _, l in { { 0, -10.5, 36, 0.4 }, { 0, 10.5, 36, 0.4 }, { -18, 0, 0.4, 21 }, { 18, 0, 0.4, 21 }, { 0, 0, 0.4, 21 } } do
		soft("CourtLine", l[1], l[2], l[3], 0.06, l[4], 0.32, WHITE, Enum.Material.SmoothPlastic)
	end
	disc(lobby, "CourtCircle", c.X, top + 0.34, c.Z, 4, 0.06, WHITE, Enum.Material.SmoothPlastic, false)
	disc(lobby, "CourtCircleInner", c.X, top + 0.35, c.Z, 3.6, 0.07, C(54, 116, 188), Enum.Material.SmoothPlastic, false)
	for _, side in { -1, 1 } do
		disc(lobby, "HoopPole", c.X + side * 20.6, top + 5, c.Z, 0.35, 10, C(70, 74, 82), Enum.Material.Metal)
		solid("HoopBoard", side * 19.2, 0, 0.4, 4, 6, 8, WHITE, Enum.Material.SmoothPlastic)
		disc(lobby, "HoopRim", c.X + side * 18.1, top + 8.6, c.Z, 1.1, 0.2, C(255, 110, 40), Enum.Material.Neon, false)
	end

	-- the four wooden decks with stairs (8 high), one in each corner, to climb and look down on the court
	for _, sx in { -1, 1 } do
		for _, sz in { -1, 1 } do
			local x, z = 52 * sx, 50 * sz
			solid("Deck", x, z, 16, 8, 16, 0, PLANK, Enum.Material.Wood)
			soft("DeckTop", x, z, 16.6, 0.6, 16.6, 8, PLANK2, Enum.Material.Wood).CanCollide = true
			for k = 1, 8 do
				local from = (8 - k) * 2
				local mid = z - sz * (8 + from + 1)
				solid("Step", x, mid, 6, k, 2, 0, C(190, 134, 76), Enum.Material.Wood)
			end
		end
	end

	-- the dressing, all outside the spawn ring and clear of the boards
	local function hedge(x, z, rot)
		solid("Hedge", x, z, 9, 3.4, 2.6, 0, LEAF, Enum.Material.Grass, rot)
	end
	local function planter(x, z)
		solid("Planter", x, z, 5, 2.2, 3.2, 0, PLANK, Enum.Material.Wood)
		ball(lobby, "PlanterBush", 2.6, Vector3.new(c.X + x, top + 3.3, c.Z + z), LEAF, Enum.Material.Grass).CanCollide = false
	end
	local function stack(x, z, a, b)
		solid("CrateBox", x, z, 4.6, 3.6, 4.6, 0, a, Enum.Material.Wood)
		solid("CrateBox", x + 0.4, z - 0.2, 4, 3.2, 4, 3.6, b, Enum.Material.Wood, 12)
	end
	local function logs(x, z)
		for row = 0, 2 do
			for i = 0, 3 - row do
				local p = part(lobby, "Log", Vector3.new(5, 1.15, 1.15), Vector3.new(c.X + x, top + 0.6 + row * 1.05, c.Z + z + (i - (3 - row) / 2) * 1.25), row % 2 == 0 and PLANK or PLANK2, Enum.Material.Wood)
				p.Shape = Enum.PartType.Cylinder
			end
		end
	end
	local function lockers(x, z, color)
		solid("Lockers", x, z, 8, 7, 2.4, 0, color, Enum.Material.Metal)
		for i = -1, 1 do
			soft("LockerDoor", x + i * 2.6, z - 1.2, 2.4, 6, 0.2, 0.5, color:Lerp(C(0, 0, 0), 0.18), Enum.Material.Metal)
		end
	end
	for _, x in { -62, -48, 48, 62 } do
		lockers(x, H - 4, x % 2 == 0 and TEAL or ORANGE)
		hedge(x, -H + 4, 0)
	end
	for _, z in { -34, 0, 34 } do
		hedge(-H + 4, z, 90)
		hedge(H - 4, z, 90)
	end
	planter(-36, H - 8); planter(36, H - 8); planter(-36, -H + 8); planter(36, -H + 8)
	stack(-66, 20, TEAL, YELLOW); stack(66, -20, YELLOW, TEAL); stack(-66, -22, YELLOW, TEAL); stack(66, 22, TEAL, YELLOW)
	logs(-30, 60); logs(30, -60)
	for i = 1, 8 do
		local a = (i / 8) * math.pi * 2 + 0.39
		bench(lobby, c.X + math.cos(a) * 41, c.Z + math.sin(a) * 41, -a + math.pi / 2)
	end
	for i = 1, 8 do
		local a = (i / 8) * math.pi * 2
		lamp(lobby, c.X + math.cos(a) * 36, c.Z + math.sin(a) * 36)
	end
	for _, t in { { -66, 66 }, { 66, 66 }, { -66, -66 }, { 66, -66 }, { -40, 62 }, { 40, 62 }, { -66, 0 }, { 66, 0 } } do
		tree(lobby, c.X + t[1], top, c.Z + t[2], 1.1)
	end

	-- a golden trophy on a marble pedestal by the court (win a match to be on the board!)
	local tx, tz = c.X + 14, c.Z + 15
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

	-- the title banner on the north wall
	local _, titleGui = board(lobby, "Title", Vector3.new(60, 14, 1), Vector3.new(c.X, top + 22, c.Z + H - 3), Vector3.new(c.X, top + 22, c.Z), C(40, 150, 150), Enum.NormalId.Front)
	soft("TitleFrame", 0, H - 2.4, 62, 16, 0.4, 14, ORANGE, Enum.Material.SmoothPlastic)
	label(titleGui, { Size = UDim2.fromScale(1, 0.62), Text = "FIGURE ME OUT", TextColor3 = WHITE })
	label(titleGui, { Position = UDim2.fromScale(0, 0.64), Size = UDim2.fromScale(1, 0.3), Text = "Read their number. Hide yours.", Font = Enum.Font.GothamBold, TextColor3 = C(255, 226, 120) })

	-- the status screen on the south wall: what is on, how long it has left, when the next match starts
	local screen, statusGui = board(lobby, "StatusScreen", Vector3.new(44, 16, 1.2), Vector3.new(c.X, top + 18, c.Z - H + 3), Vector3.new(c.X, top + 18, c.Z), C(14, 30, 64), Enum.NormalId.Front)
	soft("StatusFrame", 0, -H + 2.4, 46, 18, 0.4, 9, ORANGE, Enum.Material.SmoothPlastic)
	local statusTitle = label(statusGui, { Position = UDim2.fromScale(0.04, 0.08), Size = UDim2.fromScale(0.92, 0.46), Text = "WAITING FOR PLAYERS", TextColor3 = GOLD })
	local statusSub = label(statusGui, { Position = UDim2.fromScale(0.04, 0.56), Size = UDim2.fromScale(0.92, 0.36), Text = "", Font = Enum.Font.GothamBold, TextColor3 = WHITE })

	-- the winners board (west wall) and the how-to board (east wall)
	local bpart, bgui = board(lobby, "Board", Vector3.new(26, 22, 1), Vector3.new(c.X - H + 3, top + 17, c.Z + 8), Vector3.new(c.X, top + 17, c.Z + 8), C(40, 150, 150), Enum.NormalId.Front)
	label(bgui, { Size = UDim2.new(1, 0, 0, 70), Text = "🏆 TOP WINNERS", TextColor3 = GOLD })
	local winners = label(bgui, { Position = UDim2.fromOffset(20, 80), Size = UDim2.new(1, -40, 1, -90), Text = "Win a match to get on the board!", Font = Enum.Font.GothamBold, TextScaled = false, TextSize = 30, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top })
	local hpart, hgui = board(lobby, "HowTo", Vector3.new(26, 22, 1), Vector3.new(c.X + H - 3, top + 17, c.Z + 8), Vector3.new(c.X, top + 17, c.Z + 8), C(40, 150, 150), Enum.NormalId.Front)
	label(hgui, { Size = UDim2.new(1, 0, 0, 70), Text = "HOW TO PLAY", TextColor3 = WHITE })
	label(hgui, { Position = UDim2.fromOffset(20, 80), Size = UDim2.new(1, -40, 1, -90), Text = "• Everyone has a " .. Config.Number.Digits .. "-digit number on a sign on their forehead.\n• Yours is on your screen: keep it hidden!\n• Put the dot on someone and type THEIR number.\n• Right = they are out. Wrong = you freeze.\n• F camera, G binoculars, chests give grenades.\n• Joined late? Wait here: the next match starts soon.", Font = Enum.Font.GothamBold, TextScaled = false, TextSize = 22, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top })

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

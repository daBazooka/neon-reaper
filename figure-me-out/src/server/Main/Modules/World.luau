-- FIGURE ME OUT: builds the world from plain parts: "Plaza Park" (the arena, a city of 8 buildings around a park, with
-- streets between them) and the lobby island where everybody waits for the next match. The look is early-2000s
-- nostalgia with a Frutiger Aero feel: sunny sky, rolling green hills, glossy aqua glass, pastel buildings, bubbles.
local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Pickups = require(script.Parent.Pickups)
local Terminals = require(script.Parent.Terminals)
local CanyonWorld = require(script.Parent.CanyonWorld)

local World = {}

local C = Color3.fromRGB
local AQUA, WHITE = C(90, 215, 255), C(244, 250, 255)

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

-- Decoration: never blocks sight, hits or movement.
local function deco(parent, name, size, position, color, material)
	local p = part(parent, name, size, position, color, material)
	p.CanCollide = false
	p.CanQuery = false
	p.CastShadow = false
	return p
end

-- A solid box between two corners.
local function box(parent, name, a, b, color, material)
	local lo = Vector3.new(math.min(a.X, b.X), math.min(a.Y, b.Y), math.min(a.Z, b.Z))
	local hi = Vector3.new(math.max(a.X, b.X), math.max(a.Y, b.Y), math.max(a.Z, b.Z))
	return part(parent, name, hi - lo, (hi + lo) / 2, color, material)
end

-- A lit sign: text on a flat board. facing = "+x" | "-x" | "+z" | "-z" (the direction the writing faces).
local function sign(parent, text, w, h, position, facing, bg, fg)
	local alongX = facing == "+x" or facing == "-x"
	local p = deco(parent, "Sign", alongX and Vector3.new(0.6, h, w) or Vector3.new(w, h, 0.6), position, bg, Enum.Material.SmoothPlastic)
	local face = ({ ["+x"] = Enum.NormalId.Right, ["-x"] = Enum.NormalId.Left, ["+z"] = Enum.NormalId.Back, ["-z"] = Enum.NormalId.Front })[facing]
	local gui = Instance.new("SurfaceGui")
	gui.Face = face
	gui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	gui.CanvasSize = Vector2.new(w * 24, h * 24)
	gui.LightInfluence = 0
	gui.Parent = p
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBlack
	label.TextScaled = true
	label.Text = text
	label.TextColor3 = fg or WHITE
	label.Parent = gui
	return p
end

-- A staircase of `count` steps, each `rise` high, climbing along `dir` ("x" or "z") with sign `sgn` (+1 / -1) from `start`.
-- The bottom step starts at `start` (a point on the floor) and the top step ends `count * run` further on.
local function stairs(parent, name, start, dir, sgn, width, count, rise, run, color)
	for k = 1, count do
		local from = (k - 1) * run
		local lo, hi
		if dir == "z" then
			local z1, z2 = start.Z + sgn * from, start.Z + sgn * (from + run)
			lo = Vector3.new(start.X - width / 2, 0, math.min(z1, z2))
			hi = Vector3.new(start.X + width / 2, k * rise, math.max(z1, z2))
		else
			local x1, x2 = start.X + sgn * from, start.X + sgn * (from + run)
			lo = Vector3.new(math.min(x1, x2), 0, start.Z - width / 2)
			hi = Vector3.new(math.max(x1, x2), k * rise, start.Z + width / 2)
		end
		box(parent, name, lo, hi, color, Enum.Material.SmoothPlastic)
	end
end

-- A hollow building: two doorways facing the plaza, windows, a balcony with a staircase, a roof you reach by ladder.
local function building(parent, b)
	local P = Config.Map.Plan
	local h, t, half = P.Height, P.Wall, b.Size / 2
	local sx = b.X > 0 and -1 or 1 -- toward the plaza
	local sz = b.Z > 0 and -1 or 1
	local wallColor, trim = b.Color, b.Trim
	local doorHalf = P.Door / 2
	local function wallBox(x1, x2, y1, y2, z1, z2, name)
		return box(parent, name or "Wall", Vector3.new(x1, y1, z1), Vector3.new(x2, y2, z2), wallColor, Enum.Material.SmoothPlastic)
	end
	-- the two solid walls (the sides away from the plaza)
	local farZ = b.Z - sz * (half - t / 2)
	wallBox(b.X - half, b.X + half, 0, h, farZ - t / 2, farZ + t / 2)
	local farX = b.X - sx * (half - t / 2)
	wallBox(farX - t / 2, farX + t / 2, 0, h, b.Z - half, b.Z + half)
	-- the two walls with a doorway in the middle (the sides toward the plaza)
	local doorZ = b.Z + sz * (half - t / 2)
	wallBox(b.X - half, b.X - doorHalf, 0, h, doorZ - t / 2, doorZ + t / 2)
	wallBox(b.X + doorHalf, b.X + half, 0, h, doorZ - t / 2, doorZ + t / 2)
	wallBox(b.X - doorHalf, b.X + doorHalf, P.DoorHeight, h, doorZ - t / 2, doorZ + t / 2, "Lintel")
	local doorX = b.X + sx * (half - t / 2)
	wallBox(doorX - t / 2, doorX + t / 2, 0, h, b.Z - half, b.Z - doorHalf)
	wallBox(doorX - t / 2, doorX + t / 2, 0, h, b.Z + doorHalf, b.Z + half)
	wallBox(doorX - t / 2, doorX + t / 2, P.DoorHeight, h, b.Z - doorHalf, b.Z + doorHalf, "Lintel")
	-- roof
	box(parent, "Roof", Vector3.new(b.X - half, h - 1, b.Z - half), Vector3.new(b.X + half, h, b.Z + half), wallColor:Lerp(WHITE, 0.25), Enum.Material.SmoothPlastic)

	-- inside: a balcony along the far wall and a staircase up to it
	local inner = half - t
	local xFar = b.X - sx * inner
	local mezzLo = Vector3.new(math.min(xFar, xFar + sx * P.MezzDepth), P.Mezz - 1, b.Z - inner)
	local mezzHi = Vector3.new(math.max(xFar, xFar + sx * P.MezzDepth), P.Mezz, b.Z + inner - P.MezzDepth)
	box(parent, "Balcony", mezzLo, mezzHi, WHITE, Enum.Material.SmoothPlastic)
	-- a low rail on the open edge of the balcony
	local railX = xFar + sx * (P.MezzDepth - 0.25)
	box(parent, "Rail", Vector3.new(railX - 0.25, P.Mezz, b.Z - inner), Vector3.new(railX + 0.25, P.Mezz + 3, b.Z + inner - P.MezzDepth), trim, Enum.Material.SmoothPlastic)
	-- the staircase starts at the +z end of the room and climbs toward -z until it meets the balcony
	stairs(parent, "Step", Vector3.new(xFar + sx * (P.StairWidth / 2), 0, b.Z + inner), "z", -1, P.StairWidth, P.Steps, P.Rise, P.MezzDepth / P.Steps, WHITE)

	-- inside lighting (the roof blocks the sun)
	for _, o in { { -8, -8 }, { 8, 8 }, { -8, 8 }, { 8, -8 } } do
		local lamp = deco(parent, "CeilingLight", Vector3.new(4, 0.3, 4), Vector3.new(b.X + o[1], h - 1.2, b.Z + o[2]), C(255, 250, 235), Enum.Material.Neon)
		local light = Instance.new("PointLight")
		light.Range = 24
		light.Brightness = 1.2
		light.Parent = lamp
	end
	-- facade: windows on the solid walls, neon on the door frames and along the roof edge
	for _, y in { 5, 12 } do
		for off = -14, 14, 14 do
			local w1 = deco(parent, "Window", Vector3.new(7, 4, 0.4), Vector3.new(b.X + off, y, farZ - sz * (t / 2 + 0.1)), C(120, 215, 255), Enum.Material.Glass)
			w1.Transparency = 0.35
			local w2 = deco(parent, "Window", Vector3.new(0.4, 4, 7), Vector3.new(farX - sx * (t / 2 + 0.1), y, b.Z + off), C(120, 215, 255), Enum.Material.Glass)
			w2.Transparency = 0.35
		end
	end
	for _, side in { -1, 1 } do
		deco(parent, "DoorGlow", Vector3.new(0.6, P.DoorHeight, 0.6), Vector3.new(b.X + side * (doorHalf + 0.3), P.DoorHeight / 2, doorZ + sz * (t / 2 + 0.3)), trim, Enum.Material.Neon)
		deco(parent, "DoorGlow", Vector3.new(0.6, P.DoorHeight, 0.6), Vector3.new(doorX + sx * (t / 2 + 0.3), P.DoorHeight / 2, b.Z + side * (doorHalf + 0.3)), trim, Enum.Material.Neon)
	end
	deco(parent, "RoofGlow", Vector3.new(b.Size + 0.6, 0.6, 0.6), Vector3.new(b.X, h + 0.3, b.Z + sz * half), trim, Enum.Material.Neon)
	deco(parent, "RoofGlow", Vector3.new(b.Size + 0.6, 0.6, 0.6), Vector3.new(b.X, h + 0.3, b.Z - sz * half), trim, Enum.Material.Neon)
	deco(parent, "RoofGlow", Vector3.new(0.6, 0.6, b.Size + 0.6), Vector3.new(b.X + sx * half, h + 0.3, b.Z), trim, Enum.Material.Neon)
	deco(parent, "RoofGlow", Vector3.new(0.6, 0.6, b.Size + 0.6), Vector3.new(b.X - sx * half, h + 0.3, b.Z), trim, Enum.Material.Neon)
	-- a big sign on the roof facing each doorway, and a skirting stripe so no wall is a blank slab
	sign(parent, b.Name, 26, 7, Vector3.new(b.X, h + 4.5, b.Z + sz * (half - 1)), sz > 0 and "+z" or "-z", C(20, 28, 60), trim)
	sign(parent, b.Name, 26, 7, Vector3.new(b.X + sx * (half - 1), h + 4.5, b.Z), sx > 0 and "+x" or "-x", C(20, 28, 60), trim)
	deco(parent, "Skirting", Vector3.new(b.Size + 0.4, 1.2, b.Size + 0.4), Vector3.new(b.X, 0.8, b.Z), trim:Lerp(wallColor, 0.5), Enum.Material.SmoothPlastic)
	-- low parapet on the roof (cover for rooftop players) and the ladder on the plaza side
	local lip = 2.6
	box(parent, "Parapet", Vector3.new(b.X - half, h, b.Z - sz * half), Vector3.new(b.X + half, h + lip, b.Z - sz * half + sz * 1), WHITE, Enum.Material.SmoothPlastic)
	box(parent, "Parapet", Vector3.new(b.X - sx * half, h, b.Z - half), Vector3.new(b.X - sx * half + sx * 1, h + lip, b.Z + half), WHITE, Enum.Material.SmoothPlastic)
	local truss = Instance.new("TrussPart")
	truss.Name = "Ladder"
	truss.Size = Vector3.new(2, h + 1, 2)
	truss.Position = Vector3.new(b.X + sx * (half + 1), (h + 1) / 2, b.Z + sz * (half - 6))
	truss.Anchored = true
	truss.Color = C(255, 205, 70)
	truss.Parent = parent
end

local CONTAINER_COLORS = { C(235, 70, 60), C(40, 185, 175), C(250, 200, 40), C(70, 120, 235) }

-- An open courtyard: container cover forming alleys, and an elevated walkway with a staircase at each end.
local function courtyard(parent, cy)
	local P = Config.Map.Plan
	local cx, cz = cy.X, cy.Z
	local function container(i, x, y, z, alongX)
		local size = alongX and Vector3.new(12, 5, 5) or Vector3.new(5, 5, 12)
		local c = part(parent, "Container", size, Vector3.new(x, y + 2.5, z), CONTAINER_COLORS[(i - 1) % #CONTAINER_COLORS + 1], Enum.Material.Metal)
		deco(parent, "ContainerStripe", alongX and Vector3.new(12.2, 0.6, 5.2) or Vector3.new(5.2, 0.6, 12.2), Vector3.new(x, y + 4.4, z), WHITE, Enum.Material.SmoothPlastic)
		return c
	end
	-- two rows of containers either side of a central lane, with gaps to run through
	local n = 0
	for _, row in { -17, 17 } do
		for _, off in { -19, 19 } do
			n += 1
			container(n, cx + off, 0.4, cz + row, true)
		end
	end
	-- a few stacked on top: a second level you can reach from the walkway
	container(5, cx - 19, 5.4, cz - 17, true)
	container(6, cx + 19, 5.4, cz + 17, true)
	-- cross containers closing the ends of the alley, with a gap in the middle
	container(7, cx - 27, 0.4, cz - 6, false)
	container(8, cx + 27, 0.4, cz + 6, false)

	-- the elevated walkway down the middle: on pillars, with rails, and a staircase at each end
	local half = P.DeckLength / 2
	box(parent, "Walkway", Vector3.new(cx - half, P.DeckHeight - 1, cz - P.DeckWidth / 2), Vector3.new(cx + half, P.DeckHeight, cz + P.DeckWidth / 2), WHITE, Enum.Material.SmoothPlastic)
	for _, ex in { -half + 1, half - 1 } do
		for _, ez in { -P.DeckWidth / 2 + 0.5, P.DeckWidth / 2 - 0.5 } do
			box(parent, "Pillar", Vector3.new(cx + ex - 0.5, 0, cz + ez - 0.5), Vector3.new(cx + ex + 0.5, P.DeckHeight - 1, cz + ez + 0.5), C(60, 70, 110), Enum.Material.Metal)
		end
	end
	for _, side in { -1, 1 } do
		box(parent, "Rail", Vector3.new(cx - half, P.DeckHeight, cz + side * P.DeckWidth / 2 - 0.25), Vector3.new(cx + half, P.DeckHeight + 2.8, cz + side * P.DeckWidth / 2 + 0.25), C(255, 120, 200), Enum.Material.SmoothPlastic)
	end
	local run = 12 / P.Steps
	-- each staircase starts on the ground 12 studs out and climbs toward the walkway, its top step meeting the walkway's end
	stairs(parent, "Step", Vector3.new(cx - half - 12, 0, cz), "x", 1, P.StairWidth, P.Steps, P.Rise, run, WHITE)
	stairs(parent, "Step", Vector3.new(cx + half + 12, 0, cz), "x", -1, P.StairWidth, P.Steps, P.Rise, run, WHITE)
	deco(parent, "WalkwayGlow", Vector3.new(P.DeckLength, 0.3, 0.4), Vector3.new(cx, P.DeckHeight - 0.9, cz - P.DeckWidth / 2 - 0.1), C(90, 230, 255), Enum.Material.Neon)
	-- landmark: a neon gate at each end of the block, and the name on a board
	for _, gz in { -29, 29 } do
		deco(parent, "GatePost", Vector3.new(1, 12, 1), Vector3.new(cx - 8, 6, cz + gz), C(255, 120, 200), Enum.Material.Neon)
		deco(parent, "GatePost", Vector3.new(1, 12, 1), Vector3.new(cx + 8, 6, cz + gz), C(255, 120, 200), Enum.Material.Neon)
		deco(parent, "GateBar", Vector3.new(17, 1, 1), Vector3.new(cx, 12, cz + gz), C(90, 230, 255), Enum.Material.Neon)
	end
	sign(parent, cy.Name, 12, 3.5, Vector3.new(cx - 29.8, 7, cz - 6), "-x", C(20, 28, 60), C(255, 226, 90))
end

local function buildCity(arena, ground)
	local m = Config.Map
	local full = (m.Half + 4) * 2
	part(ground, "Floor", Vector3.new(full, 2, full), Vector3.new(0, -1, 0), C(84, 96, 124), Enum.Material.Concrete)
	-- sidewalk slabs, one per city block; the middle one is the plaza
	for _, bx in m.BlockCenters do
		for _, bz in m.BlockCenters do
			local plaza = bx == 0 and bz == 0
			part(ground, plaza and "Plaza" or "Block", Vector3.new(m.Block, 0.4, m.Block), Vector3.new(bx, 0.2, bz), plaza and C(40, 52, 104) or C(226, 234, 246), Enum.Material.SmoothPlastic)
		end
	end
	-- the plaza floor: a neon tile grid
	for tx = -2, 2 do
		for tz = -2, 2 do
			if (tx + tz) % 2 == 0 then
				deco(ground, "Tile", Vector3.new(11, 0.1, 11), Vector3.new(tx * 12, 0.45, tz * 12), C(70, 100, 190), Enum.Material.SmoothPlastic)
			end
		end
	end
	-- dashed lane lines down every street
	local L = (m.Block + m.Street) / 2
	for _, line in { -L, L } do
		for t = -m.Half + 6, m.Half - 6, 12 do
			neon(ground, "Lane", Vector3.new(0.5, 0.05, 5), Vector3.new(line, 0.03, t), C(255, 255, 255))
			neon(ground, "Lane", Vector3.new(5, 0.05, 0.5), Vector3.new(t, 0.03, line), C(255, 255, 255))
		end
	end
	for _, b in m.Buildings do
		building(arena, b)
	end
	for _, cy in m.Courtyards do
		courtyard(arena, cy)
	end

	-- the boundary: tall navy walls with a colourful banner every few steps and a neon cap, so no wall is a blank slab
	local wall = m.Half + 2
	local height = 30
	local navy = C(30, 42, 92)
	part(arena, "WallN", Vector3.new(wall * 2 + 4, height, 4), Vector3.new(0, height / 2, -wall), navy)
	part(arena, "WallS", Vector3.new(wall * 2 + 4, height, 4), Vector3.new(0, height / 2, wall), navy)
	part(arena, "WallE", Vector3.new(4, height, wall * 2), Vector3.new(wall, height / 2, 0), navy)
	part(arena, "WallW", Vector3.new(4, height, wall * 2), Vector3.new(-wall, height / 2, 0), navy)
	local banners = { C(255, 70, 150), C(40, 180, 230), C(255, 150, 40), C(140, 90, 255), C(70, 210, 120) }
	local n = 0
	for off = -112, 112, 28 do
		n += 1
		local color = banners[n % #banners + 1]
		deco(arena, "Banner", Vector3.new(22, 14, 0.4), Vector3.new(off, 13, -m.Half + 0.1), color, Enum.Material.SmoothPlastic)
		deco(arena, "Banner", Vector3.new(22, 14, 0.4), Vector3.new(off, 13, m.Half - 0.1), color, Enum.Material.SmoothPlastic)
		deco(arena, "Banner", Vector3.new(0.4, 14, 22), Vector3.new(-m.Half + 0.1, 13, off), color, Enum.Material.SmoothPlastic)
		deco(arena, "Banner", Vector3.new(0.4, 14, 22), Vector3.new(m.Half - 0.1, 13, off), color, Enum.Material.SmoothPlastic)
	end
	deco(arena, "WallCap", Vector3.new(wall * 2, 0.8, 0.8), Vector3.new(0, height - 0.4, -m.Half + 0.4), C(90, 230, 255), Enum.Material.Neon)
	deco(arena, "WallCap", Vector3.new(wall * 2, 0.8, 0.8), Vector3.new(0, height - 0.4, m.Half - 0.4), C(90, 230, 255), Enum.Material.Neon)
	deco(arena, "WallCap", Vector3.new(0.8, 0.8, wall * 2), Vector3.new(-m.Half + 0.4, height - 0.4, 0), C(90, 230, 255), Enum.Material.Neon)
	deco(arena, "WallCap", Vector3.new(0.8, 0.8, wall * 2), Vector3.new(m.Half - 0.4, height - 0.4, 0), C(90, 230, 255), Enum.Material.Neon)

	-- the plaza: fountain, a landmark tower with neon rings, trees, hedges and benches for cover
	local pool = part(arena, "Fountain", Vector3.new(1.4, 12, 12), Vector3.new(0, 0.7, 0), C(246, 250, 255), Enum.Material.Marble)
	pool.Shape = Enum.PartType.Cylinder
	pool.CFrame = CFrame.new(0, 0.7, 0) * CFrame.Angles(0, 0, math.pi / 2)
	local water = neon(arena, "Water", Vector3.new(0.4, 10, 10), Vector3.new(0, 1.5, 0), C(110, 220, 255))
	water.Material = Enum.Material.Glass
	water.Transparency = 0.25
	water.Shape = Enum.PartType.Cylinder
	water.CFrame = CFrame.new(0, 1.5, 0) * CFrame.Angles(0, 0, math.pi / 2)
	part(arena, "Landmark", Vector3.new(3, 34, 3), Vector3.new(0, 17, 0), WHITE, Enum.Material.SmoothPlastic)
	for i, y in { 10, 20, 30 } do
		local ring = deco(arena, "LandmarkRing", Vector3.new(0.8, 10, 10), Vector3.new(0, y, 0), banners[i], Enum.Material.Neon)
		ring.Shape = Enum.PartType.Cylinder
		ring.CFrame = CFrame.new(0, y, 0) * CFrame.Angles(0, 0, math.pi / 2)
	end
	for _, o in { { 0, -2.1, "-z" }, { 0, 2.1, "+z" }, { -2.1, 0, "-x" }, { 2.1, 0, "+x" } } do
		sign(arena, "FIGURE ME OUT", 3, 12, Vector3.new(o[1], 25, o[2]), o[3], C(20, 28, 60), C(90, 230, 255))
	end
	for _, t in { { -20, -18 }, { 20, -18 }, { -20, 18 }, { 20, 18 }, { 0, -24 }, { 0, 24 }, { -26, 0 }, { 26, 0 } } do
		tree(arena, t[1], t[2])
	end
	for _, h in { { -12, 0, 10, 2 }, { 12, 0, 10, 2 }, { 0, -12, 2, 10 }, { 0, 12, 2, 10 } } do
		part(arena, "Hedge", Vector3.new(h[3], 3.5, h[4]), Vector3.new(h[1], 1.75, h[2]), C(60, 168, 70), Enum.Material.Grass)
	end
	for _, bn in { { -9, -9 }, { 9, 9 }, { -9, 9 }, { 9, -9 } } do
		part(arena, "Bench", Vector3.new(6, 1.2, 2), Vector3.new(bn[1], 0.8, bn[2]), C(255, 150, 40), Enum.Material.Wood)
	end
	-- crates and bus-stop style cover scattered on the streets
	for i, p in { { 43, 0 }, { -43, 0 }, { 0, 43 }, { 0, -43 }, { 43, 60 }, { -43, -60 }, { 60, -43 }, { -60, 43 } } do
		part(arena, "Crate" .. i, Vector3.new(5, 4, 5), Vector3.new(p[1], 2, p[2]), C(255, 190, 60), Enum.Material.Wood)
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
end

local function buildArena()
	local arena = folder("Arena")
	local ground = folder("Ground")
	local m = Config.Map
	if m.Theme == "canyon" then
		CanyonWorld.build(arena, ground)
	else
		buildCity(arena, ground)
	end
	-- Workspace.ArenaSpawns: one SpawnLocation per spawn point (disabled, so they are only used when a round starts).
	-- Drag them around in Studio and the game uses the new places; add or delete some, there are always at least 10 in use
	-- (if the folder is ever missing or empty the positions in Config.Map.Spawns are used instead).
	local pads = folder("ArenaSpawns")
	for i, spawn in m.Spawns do
		local pad = Instance.new("SpawnLocation")
		pad.Name = "ArenaSpawn" .. i
		pad.Size = Vector3.new(6, 0.4, 6)
		pad.Position = Vector3.new(spawn.X, spawn.Y - 3, spawn.Z)
		pad.Anchored = true
		pad.Enabled = false
		pad.Neutral = true
		pad.AllowTeamChangeOnTouch = false
		pad.Duration = 0
		pad.Material = Enum.Material.Neon
		pad.Color = C(120, 230, 255)
		pad.Transparency = 0.35
		pad.CanQuery = false
		pad.TopSurface = Enum.SurfaceType.Smooth
		pad.Parent = pads
	end
	local crates = folder("Crates")
	Pickups.build(crates)
	Terminals.build(folder("Terminals"))
end

-- The two team bases (used by team deathmatch and capture the flag): a coloured pad, corner posts and a sign.
local function buildBases()
	local bases = folder("Bases")
	for team, at in Config.Map.Bases do
		local t = Config.Teams[team]
		local toward = team == 1 and "+x" or "-x" -- the sign faces the plaza
		local pad = neon(bases, "BasePad" .. team, Vector3.new(18, 0.15, 18), Vector3.new(at.X, 0.55, at.Z), t.Color)
		pad.Transparency = 0.45
		for _, dx in { -9, 9 } do
			for _, dz in { -9, 9 } do
				neon(bases, "BasePost", Vector3.new(0.8, 9, 0.8), Vector3.new(at.X + dx, 4.5, at.Z + dz), t.Color)
			end
		end
		sign(bases, t.Icon .. " " .. t.Name .. " BASE", 14, 3, Vector3.new(at.X + (team == 1 and 9.5 or -9.5), 10.5, at.Z), toward, C(20, 30, 60), t.Color)
	end
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
	-- the default spawn: anybody Roblox spawns on its own (joining, resetting) appears in the lobby
	local home = Instance.new("SpawnLocation")
	home.Name = "LobbySpawnLocation"
	home.Size = Vector3.new(10, 0.4, 10)
	home.Position = c + Vector3.new(0, 0.5, 0)
	home.Anchored = true
	home.Neutral = true
	home.Duration = 0
	home.Transparency = 0.6
	home.Material = Enum.Material.Neon
	home.Color = AQUA
	home.TopSurface = Enum.SurfaceType.Smooth
	home.Parent = lobby
end

function World.lobbySpawn(i)
	local c = Config.Map.Lobby
	local angle = (((i - 1) % Config.Match.MaxPlayers + 1) / Config.Match.MaxPlayers) * math.pi * 2
	return c + Vector3.new(math.cos(angle) * 30, 4, math.sin(angle) * 30)
end

-- Where players stand when a round starts: the pads in Workspace.ArenaSpawns (so you can move them in Studio), or the
-- built-in list when that folder is missing or has fewer than 10 pads.
function World.arenaSpawns()
	local list = {}
	local pads = workspace:FindFirstChild("ArenaSpawns")
	if pads then
		for _, pad in pads:GetChildren() do
			if pad:IsA("BasePart") then
				table.insert(list, Vector3.new(pad.Position.X, pad.Position.Y + 3, pad.Position.Z))
			end
		end
	end
	if #list < 10 then
		return Config.Map.Spawns
	end
	table.sort(list, function(a, b)
		if a.X ~= b.X then
			return a.X < b.X
		end
		return a.Z < b.Z
	end)
	return list
end

function World.arenaSpawn(i)
	local list = World.arenaSpawns()
	return list[(i - 1) % #list + 1]
end

function World.setBoard(lines)
	if board then
		board.Text = table.concat(lines, "\n")
	end
end

-- Finds or creates a lighting effect and sets its properties. Optional: if anything about it fails, the game goes on.
local function effect(parent, class, props)
	local ok, err = pcall(function()
		local e = parent:FindFirstChildOfClass(class)
		if not e then
			e = Instance.new(class)
		end
		for k, v in props do
			e[k] = v
		end
		e.Parent = parent
	end)
	if not ok then
		warn("[FigureMeOut] optional effect " .. class .. " skipped: " .. tostring(err))
	end
	return ok
end

-- A bright but not washed-out afternoon: moderate exposure, strong contrast, a little bloom.
local function lighting()
	local look = Config.Look.play
	Lighting.ClockTime = look.Clock
	Lighting.Brightness = look.Brightness
	Lighting.Ambient = C(120, 134, 158)
	Lighting.OutdoorAmbient = C(140, 154, 178)
	Lighting.ColorShift_Top = C(255, 244, 220)
	Lighting.EnvironmentDiffuseScale = 0.6
	Lighting.EnvironmentSpecularScale = 0.5
	Lighting.GlobalShadows = true
	Lighting.FogColor = C(190, 220, 250)
	Lighting.FogEnd = 2500
	effect(Lighting, "Sky", { StarCount = 0 })
	effect(Lighting, "Atmosphere", { Density = 0.25, Color = C(190, 220, 250), Decay = C(120, 170, 230), Haze = 0.6, Glare = 0.1 })
	effect(Lighting, "BloomEffect", { Intensity = look.Bloom, Size = 20, Threshold = 1.1 })
	effect(Lighting, "SunRaysEffect", { Intensity = 0.06, Spread = 0.8 })
	effect(Lighting, "ColorCorrectionEffect", { Saturation = look.Saturation, Contrast = look.Contrast, Brightness = look.Shift, TintColor = look.Tint })
	effect(workspace.Terrain, "Clouds", { Cover = 0.55, Density = 0.5 })
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
	step("bases", buildBases)
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

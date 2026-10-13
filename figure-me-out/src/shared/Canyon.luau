-- FIGURE ME OUT: the layout of "Waterfall Canyon", as plain data. Both the world builder (server) and the bots, the water
-- current and the animations (client) read it, so a waterfall is in the same place for everybody.
--
-- The arena is 268 x 268 studs (x and z from -134 to 134). The cliff with the three waterfalls is along z = +134.
-- The three streams run south (towards -z), join one river down the middle and end in the lake at the south end.
-- Everything is "x, z on the ground" - heights are decided by the builder.
local Canyon = {}

Canyon.Half = 134

-- The cliff wall: its front face is at z = Wall.Z (it reaches up to Wall.Height).
Canyon.Wall = { Z = 118, Height = 34 }

-- Waterfalls pouring over the cliff. The sheet of water hangs Gap studs in front of the rock, so there is a dry passage behind it.
Canyon.Falls = {
	{ X = -70, Width = 16 },
	{ X = 0, Width = 22 },
	{ X = 70, Width = 16 },
}
Canyon.FallGap = 4 -- dry corridor between the water sheet and the rock
Canyon.FallThick = 2

-- Water you can wade through. FX, FZ = the direction it pushes you, Push = how hard (studs per second squared; Config.Water.PushScale scales all of them).
-- Boxes: centre (X, Z) and size (W along x, D along z).
Canyon.Water = {}
local function water(name, x, z, w, d, fx, fz, push)
	table.insert(Canyon.Water, { Name = name, X = x, Z = z, W = w, D = d, FX = fx, FZ = fz, Push = push })
end
-- the plunge pools under the falls (the water shoves you away from the cliff)
for i, f in Canyon.Falls do
	water("Fall" .. i, f.X, 111.5, f.Width, 5, 0, -1, 70)
	water("Pool" .. i, f.X, 102, f.Width + 8, 16, 0, -1, 30)
end
-- the river: down the middle, and two side streams that join it
water("River", 0, 28, 14, 148, 0, -1, 22)
water("StreamW", -70, 70, 10, 52, 0, -1, 22)
water("StreamE", 70, 70, 10, 52, 0, -1, 22)
water("JoinW", -38.5, 44, 63, 10, 1, 0, 22)
water("JoinE", 38.5, 44, 63, 10, -1, 0, 22)

-- The lake at the south end: real swimmable water.
Canyon.Lake = { X = 0, Z = -84, Size = 72, Depth = 6, Surface = 0.8 }
-- the island and the dock out to the east shore
Canyon.Island = { X = 0, Z = -84, Radius = 10 }
Canyon.Dock = { X1 = 10, X2 = 36, Z = -84, Width = 4 }

-- bridges over the river (decks, 28 x 7, 3 studs up)
Canyon.Bridges = { { X = 0, Z = 70 }, { X = 0, Z = 12 } }

-- rock arches (two legs and a lintel)
Canyon.Arches = { { X = -102, Z = -50 }, { X = 102, Z = -50 }, { X = -62, Z = -22 }, { X = 62, Z = -22 } }

-- the wrecked plane on the west side, and the seaplane at the dock
Canyon.Wreck = { X = -104, Z = 52 }
Canyon.Seaplane = { X = 30, Z = -92 }

-- planes flying circuits high over the arena: centre, radius, height, speed (studs per second) and the angle each one starts at
Canyon.Planes = {
	Center = { X = 0, Z = 0 },
	Radius = 104,
	Height = 58,
	Speed = 30,
	Starts = { 0.35, 3.49 },
}

-- 20 places to start a round: dry ground, ten on the west half and ten on the east half (team matches use the halves).
Canyon.Spawns = {
	{ -110, 30 }, { -85, 30 }, { -55, 30 }, { -30, 30 },
	{ 30, 30 }, { 55, 30 }, { 85, 30 }, { 110, 30 },
	{ -105, -20 }, { -75, -20 }, { -40, -20 }, { -20, -20 },
	{ 20, -20 }, { 40, -20 }, { 75, -20 }, { 105, -20 },
	{ -40, 75 }, { -100, 75 }, { 40, 75 }, { 100, 75 },
}
-- capture-the-flag bases: a clearing on each side
Canyon.Bases = { { -90, 0 }, { 90, 0 } }
Canyon.Terminals = { { -26, 60 }, { 26, 60 }, { -26, 0 }, { 26, 0 } }
Canyon.DropSpots = { { -30, 10 }, { 30, -10 }, { 22, 52 }, { -22, -32 } }

-- A few well-placed spots that are open ground: bots walk from one to another.
Canyon.Nodes = {
	{ -110, 30 }, { -85, 30 }, { -55, 30 }, { -30, 30 }, { 30, 30 }, { 55, 30 }, { 85, 30 }, { 110, 30 },
	{ -105, -20 }, { -75, -20 }, { -40, -20 }, { -20, -20 }, { 20, -20 }, { 40, -20 }, { 75, -20 }, { 105, -20 },
	{ -40, 75 }, { -100, 75 }, { 40, 75 }, { 100, 75 },
	{ -88, 0 }, { 88, 0 }, { -45, 55 }, { 45, 55 },
	{ -100, -75 }, { -75, -100 }, { 75, -100 }, { 100, -75 }, { -70, -60 }, { 70, -60 }, { -20, -34 }, { 20, -34 },
	{ -84, -50 }, { 84, -50 }, { -118, -50 }, { 118, -50 }, { -88, -80 }, { 88, -80 },
}

-- Round things bots must walk around: { x, z, radius }. Trees and rocks are added below.
Canyon.Blockers = {}
for _, a in Canyon.Arches do
	table.insert(Canyon.Blockers, { a.X - 6, a.Z, 4 })
	table.insert(Canyon.Blockers, { a.X + 6, a.Z, 4 })
end
table.insert(Canyon.Blockers, { Canyon.Wreck.X, Canyon.Wreck.Z, 11 })
table.insert(Canyon.Blockers, { Canyon.Lake.X, Canyon.Lake.Z, 48 }) -- the lake, and its shore

-- Crates (gadget pick-ups, only used when Config.Features.Gadgets is on): sixteen open spots.
Canyon.Crates = {
	{ -60, 8 }, { 60, 8 }, { -60, -40 }, { 60, -40 }, { -95, 20 }, { 95, 20 }, { -20, 80 }, { 20, 80 },
	{ -45, 58 }, { 45, 58 }, { -12, -6 + 40 }, { 12, 26 }, { -120, 0 }, { 120, 0 }, { -62, -62 }, { 62, -62 },
}

-- A fixed pseudo-random sequence, so the scenery is the same every time (and the same for everybody).
local seed = 7
local function nextRandom()
	seed = (seed * 1103515245 + 12345) % 2147483648
	return seed / 2147483648
end

local function inRect(x, z, cx, cz, w, d, pad)
	return math.abs(x - cx) <= w / 2 + pad and math.abs(z - cz) <= d / 2 + pad
end

-- Is this a free spot for a tree or a boulder?
local function freeSpot(x, z, radius)
	if math.abs(x) > 122 or z > 92 or z < -122 then
		return false
	end
	for _, s in Canyon.Spawns do
		if (s[1] - x) ^ 2 + (s[2] - z) ^ 2 < (9 + radius) ^ 2 then
			return false
		end
	end
	for _, b in Canyon.Bases do
		if (b[1] - x) ^ 2 + (b[2] - z) ^ 2 < (18 + radius) ^ 2 then
			return false
		end
	end
	for _, n in Canyon.Nodes do
		if (n[1] - x) ^ 2 + (n[2] - z) ^ 2 < (7 + radius) ^ 2 then
			return false
		end
	end
	for _, t in Canyon.Terminals do
		if (t[1] - x) ^ 2 + (t[2] - z) ^ 2 < (8 + radius) ^ 2 then
			return false
		end
	end
	for _, w in Canyon.Water do
		if inRect(x, z, w.X, w.Z, w.W, w.D, 6 + radius) then
			return false
		end
	end
	for _, b in Canyon.Bridges do
		if inRect(x, z, b.X, b.Z, 28, 7, 6 + radius) then
			return false
		end
	end
	if inRect(x, z, Canyon.Lake.X, Canyon.Lake.Z, Canyon.Lake.Size, Canyon.Lake.Size, 12 + radius) then
		return false
	end
	for _, a in Canyon.Arches do
		if (a.X - x) ^ 2 + (a.Z - z) ^ 2 < (14 + radius) ^ 2 then
			return false
		end
	end
	if (Canyon.Wreck.X - x) ^ 2 + (Canyon.Wreck.Z - z) ^ 2 < (18 + radius) ^ 2 then
		return false
	end
	for _, c in Canyon.Crates do
		if (c[1] - x) ^ 2 + (c[2] - z) ^ 2 < (6 + radius) ^ 2 then
			return false
		end
	end
	for _, c in Canyon.DropSpots do
		if (c[1] - x) ^ 2 + (c[2] - z) ^ 2 < (7 + radius) ^ 2 then
			return false
		end
	end
	for _, p in Canyon.Trees or {} do
		if (p[1] - x) ^ 2 + (p[2] - z) ^ 2 < (7 + radius) ^ 2 then
			return false
		end
	end
	for _, p in Canyon.Rocks or {} do
		if (p[1] - x) ^ 2 + (p[2] - z) ^ 2 < (9 + radius) ^ 2 then
			return false
		end
	end
	return true
end

Canyon.Trees = {} -- { x, z, size }
Canyon.Rocks = {} -- { x, z, radius, height }
for _ = 1, 400 do
	if #Canyon.Rocks >= 14 then
		break
	end
	local x, z = (nextRandom() * 2 - 1) * 122, -122 + nextRandom() * 214
	local r = 3.5 + nextRandom() * 3
	if freeSpot(x, z, r) then
		table.insert(Canyon.Rocks, { x, z, r, 4 + nextRandom() * 7 })
		table.insert(Canyon.Blockers, { x, z, r })
	end
end
for _ = 1, 1500 do
	if #Canyon.Trees >= 44 then
		break
	end
	local x, z = (nextRandom() * 2 - 1) * 122, -122 + nextRandom() * 214
	if freeSpot(x, z, 2) then
		table.insert(Canyon.Trees, { x, z, 0.9 + nextRandom() * 0.8 })
		table.insert(Canyon.Blockers, { x, z, 2.2 })
	end
end

return Canyon

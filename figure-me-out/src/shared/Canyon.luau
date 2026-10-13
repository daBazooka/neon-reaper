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
Canyon.Arches = { { X = -102, Z = -50 }, { X = 102, Z = -50 }, { X = -57, Z = -22 }, { X = 57, Z = -22 } }

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
	{ -100, -75 }, { -92, -100 }, { 92, -100 }, { 100, -75 }, { -70, -60 }, { 70, -60 }, { -20, -34 }, { 20, -34 },
	{ -84, -50 }, { 84, -50 }, { -118, -50 }, { 118, -50 }, { -88, -80 }, { 88, -80 }, { -60, -42 }, { 60, -42 }, { -100, -35 }, { 100, -35 },
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

-- Bots must be able to walk from any open spot to any other (round the trees, with room to spare). If the scenery boxed a spot in,
-- the trees closest to it are taken down. (The same check runs in the tests.)
local function clearLine(ax, az, bx, bz, pad)
	local dx, dz = bx - ax, bz - az
	local len2 = dx * dx + dz * dz
	for _, o in Canyon.Blockers do
		local t = 0
		if len2 > 0 then
			t = math.clamp(((o[1] - ax) * dx + (o[2] - az) * dz) / len2, 0, 1)
		end
		local px, pz = ax + dx * t, az + dz * t
		local r = o[3] + pad
		if (px - o[1]) ^ 2 + (pz - o[2]) ^ 2 < r * r then
			return false
		end
	end
	return true
end
Canyon.WalkPad = 4
for _ = 1, 40 do
	local comp, count = {}, 0
	local nodes = Canyon.Nodes
	for start = 1, #nodes do
		if not comp[start] then
			count += 1
			comp[start] = count
			local stack = { start }
			while #stack > 0 do
				local u = table.remove(stack)
				for v = 1, #nodes do
					if not comp[v] and clearLine(nodes[u][1], nodes[u][2], nodes[v][1], nodes[v][2], Canyon.WalkPad) then
						comp[v] = count
						table.insert(stack, v)
					end
				end
			end
		end
	end
	if count == 1 then
		break
	end
	-- take down the trees around the nodes that are cut off (every component except the biggest)
	local sizes = {}
	for i = 1, #nodes do
		sizes[comp[i]] = (sizes[comp[i]] or 0) + 1
	end
	local biggest = 1
	for c, n in sizes do
		if n > sizes[biggest] then
			biggest = c
		end
	end
	local removed = false
	for i = 1, #nodes do
		if comp[i] ~= biggest then
			for k = #Canyon.Trees, 1, -1 do
				local t = Canyon.Trees[k]
				if (t[1] - nodes[i][1]) ^ 2 + (t[2] - nodes[i][2]) ^ 2 < 15 ^ 2 then
					table.remove(Canyon.Trees, k)
					for b = #Canyon.Blockers, 1, -1 do
						local o = Canyon.Blockers[b]
						if o[1] == t[1] and o[2] == t[2] then
							table.remove(Canyon.Blockers, b)
							break
						end
					end
					removed = true
					break
				end
			end
		end
	end
	if not removed then
		break
	end
end

-- ---- decoration (never solid, never in the way): the same every time ----
local function decorFree(x, z, pad)
	if math.abs(x) > 124 or z > 94 or z < -124 then
		return false
	end
	for _, w in Canyon.Water do
		if inRect(x, z, w.X, w.Z, w.W, w.D, pad) then
			return false
		end
	end
	if inRect(x, z, Canyon.Lake.X, Canyon.Lake.Z, Canyon.Lake.Size, Canyon.Lake.Size, pad) then
		return false
	end
	for _, b in Canyon.Bases do
		if (b[1] - x) ^ 2 + (b[2] - z) ^ 2 < 10 ^ 2 then
			return false
		end
	end
	return true
end

Canyon.Patches = {} -- big soft patches of lighter and darker grass: { x, z, radius, tone }
for i = 1, 400 do
	if #Canyon.Patches >= 22 then
		break
	end
	local x, z = (nextRandom() * 2 - 1) * 120, -120 + nextRandom() * 212
	if decorFree(x, z, 6) then
		table.insert(Canyon.Patches, { x, z, 8 + nextRandom() * 10, #Canyon.Patches % 2 })
	end
end
Canyon.Bushes = {} -- { x, z, size }
for i = 1, 900 do
	if #Canyon.Bushes >= 70 then
		break
	end
	local x, z = (nextRandom() * 2 - 1) * 122, -122 + nextRandom() * 214
	if decorFree(x, z, 3) then
		table.insert(Canyon.Bushes, { x, z, 1.6 + nextRandom() * 1.8 })
	end
end
Canyon.Flowers = {} -- clusters: { x, z, colour 1-6 }
for i = 1, 900 do
	if #Canyon.Flowers >= 34 then
		break
	end
	local x, z = (nextRandom() * 2 - 1) * 122, -122 + nextRandom() * 214
	if decorFree(x, z, 3) then
		table.insert(Canyon.Flowers, { x, z, 1 + math.floor(nextRandom() * 6) })
	end
end
-- stones along the river banks
Canyon.Stones = {} -- { x, z, size }
for _, w in Canyon.Water do
	if string.sub(w.Name, 1, 4) ~= "Fall" and string.sub(w.Name, 1, 4) ~= "Pool" then
		local alongZ = w.D >= w.W
		local len = alongZ and w.D or w.W
		local k = 0
		while k * 9 < len - 6 do
			for _, side in { -1, 1 } do
				local off = (alongZ and w.W or w.D) / 2 + 1.2 + nextRandom() * 1.2
				local along = -len / 2 + 4 + k * 9 + nextRandom() * 3
				local x, z = w.X + (alongZ and side * off or along), w.Z + (alongZ and along or side * off)
				if math.abs(x) < 124 and z < 96 and z > -48 then
					table.insert(Canyon.Stones, { x, z, 0.9 + nextRandom() * 1.6 })
				end
			end
			k += 1
		end
	end
end
-- lily pads on the lake, reeds round its shore
Canyon.Lilies = {}
for i = 1, 200 do
	if #Canyon.Lilies >= 9 then
		break
	end
	local x = Canyon.Lake.X + (nextRandom() * 2 - 1) * 30
	local z = Canyon.Lake.Z + (nextRandom() * 2 - 1) * 30
	local fromIsland = math.sqrt((x - Canyon.Island.X) ^ 2 + (z - Canyon.Island.Z) ^ 2)
	if fromIsland > 15 and not (x > 6 and math.abs(z - Canyon.Dock.Z) < 6) then
		table.insert(Canyon.Lilies, { x, z, 1 + nextRandom() * 0.8 })
	end
end
Canyon.Reeds = {}
for k = 0, 13 do
	local t = (k + nextRandom() * 0.6) / 14
	local side = k % 4
	local half = Canyon.Lake.Size / 2 - 1
	local x, z
	if side == 0 then x, z = -half + t * 2 * half, Canyon.Lake.Z + half
	elseif side == 1 then x, z = -half + t * 2 * half, Canyon.Lake.Z - half
	elseif side == 2 then x, z = -half, Canyon.Lake.Z - half + t * 2 * half
	else x, z = half, Canyon.Lake.Z - half + t * 2 * half end
	if not (side == 3 and math.abs(z - Canyon.Dock.Z) < 4) and not (side == 0 and math.abs(x) < 9) then
		table.insert(Canyon.Reeds, { x + Canyon.Lake.X, z })
	end
end
-- dirt trails between the bases, the bridges and the spawn clusters: { x1, z1, x2, z2 }
Canyon.Trails = {
	{ -90, 0, -14, 12 }, { 90, 0, 14, 12 }, { -14, 12, -40, 75 }, { 14, 12, 40, 75 },
	{ -90, 0, -105, -20 }, { 90, 0, 105, -20 }, { -90, 0, -85, 30 }, { 90, 0, 85, 30 },
	{ -40, -20, -14, 12 }, { 40, -20, 14, 12 },
}

return Canyon

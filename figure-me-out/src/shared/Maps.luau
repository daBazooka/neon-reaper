-- FIGURE ME OUT: the six maps players vote on, and the layout of the four built from the map kit (Frosty Peaks, Candy Kingdom,
-- Desert Ruins, Neon Station). Waterfall Canyon (Canyon.luau) and Plaza Park (World.luau) have their own layouts.
-- Everything here is plain data worked out the same way every time, so the server builds it, the tests check it, and nobody
-- ever spawns inside a wall. All maps are 268 x 268 studs (x and z from -134 to 134), the red base is in the west, blue in the east.
local Maps = {}

local C = Color3.fromRGB

Maps.Order = { "school", "canyon", "frost", "candy", "desert", "station" } -- the six maps on the vote cards (Plaza Park, "city", is still built into the game but is not offered)
Maps.FirstMap = "school" -- the very first match (nobody could vote yet): the school courtyard, like the original game

-- Name, icon and one-line blurb are shown on the vote cards. Look = changes to the "play" and "final" colour grades on this map
-- (Clock = time of day, Tint = colour cast, Saturation = colour strength). Atmo = lighting colours the server applies for the match.
Maps.List = {
	canyon = {
		Id = "canyon", Name = "Waterfall Canyon", Icon = "🌊", Blurb = "Waterfalls, a pushy river and planes overhead", Card = C(64, 190, 160),
		Look = { Clock = 14.0 },
		Scenery = { Hill = C(118, 204, 78), Far = C(128, 208, 84), Bubbles = true },
	},
	city = {
		Id = "city", Name = "Plaza Park", Icon = "🏙️", Blurb = "Streets, buildings with balconies and a park", Card = C(255, 112, 170),
		Look = { Clock = 14.5 },
		Scenery = { Hill = C(118, 204, 78), Far = C(128, 208, 84), Bubbles = true },
	},
	school = {
		Id = "school", Name = "School Yard", Icon = "🏫", Blurb = "A school courtyard: basketball court, wooden decks and yellow chests", Card = C(255, 150, 70),
		Look = { Clock = 13.5, Tint = C(255, 247, 232), Saturation = 0.2 },
		Atmo = { Ambient = C(150, 146, 150), Outdoor = C(168, 164, 170), Fog = C(214, 228, 244), Haze = 0.5, AtmoColor = C(206, 224, 244) },
		Scenery = { Hill = C(118, 190, 86), Far = C(128, 196, 92), Bubbles = false },
		Ground = { Color = C(212, 150, 126), Material = Enum.Material.Concrete, Patch = C(232, 190, 130) },
		Wall = { Color = C(238, 228, 208), Material = Enum.Material.SmoothPlastic, Trim = C(70, 58, 66), Height = 30, Cap = Enum.Material.SmoothPlastic },
	},
	frost = {
		Id = "frost", Name = "Frosty Peaks", Icon = "❄️", Blurb = "Igloos, snowmen and a frozen pond", Card = C(120, 200, 255),
		Look = { Clock = 12.5, Tint = C(232, 244, 255), Saturation = 0.12 },
		Atmo = { Ambient = C(150, 170, 205), Outdoor = C(170, 188, 220), Fog = C(214, 232, 250), Haze = 0.5, AtmoColor = C(206, 226, 250) },
		Scenery = { Hill = C(236, 244, 252), Far = C(226, 238, 250), Bubbles = false, Flakes = true },
		Ground = { Color = C(240, 247, 255), Material = Enum.Material.Snow, Patch = C(190, 224, 250) },
		Wall = { Color = C(160, 205, 240), Material = Enum.Material.Ice, Trim = C(255, 255, 255), Height = 38 },
	},
	candy = {
		Id = "candy", Name = "Candy Kingdom", Icon = "🍭", Blurb = "Lollipops, cupcakes and a giant cake", Card = C(255, 130, 190),
		Look = { Clock = 15.0, Tint = C(255, 240, 248), Saturation = 0.28 },
		Atmo = { Ambient = C(170, 150, 175), Outdoor = C(190, 168, 190), Fog = C(255, 218, 236), Haze = 0.4, AtmoColor = C(255, 214, 234) },
		Scenery = { Hill = C(255, 170, 214), Far = C(255, 196, 226), Bubbles = true, BubbleColor = C(255, 220, 240) },
		Ground = { Color = C(255, 205, 228), Material = Enum.Material.SmoothPlastic, Patch = C(255, 244, 250) },
		Wall = { Color = C(255, 150, 200), Material = Enum.Material.SmoothPlastic, Trim = C(255, 255, 255), Height = 30 },
	},
	desert = {
		Id = "desert", Name = "Desert Ruins", Icon = "🏜️", Blurb = "Sandstone pillars, cacti and a stepped pyramid", Card = C(240, 170, 80),
		Look = { Clock = 10.5, Tint = C(255, 238, 214), Saturation = 0.22 },
		Atmo = { Ambient = C(160, 138, 108), Outdoor = C(184, 158, 124), Fog = C(250, 224, 180), Haze = 0.5, AtmoColor = C(250, 222, 176) },
		Scenery = { Hill = C(236, 196, 120), Far = C(232, 194, 124), Bubbles = false },
		Ground = { Color = C(238, 204, 140), Material = Enum.Material.Sand, Patch = C(222, 184, 116) },
		Wall = { Color = C(214, 170, 108), Material = Enum.Material.Sandstone, Trim = C(190, 140, 80), Height = 32 },
	},
	station = {
		Id = "station", Name = "Neon Station", Icon = "🚀", Blurb = "A glowing space station with a reactor core", Card = C(140, 110, 255),
		Look = { Clock = 0.0, Brightness = 2.0, Tint = C(226, 232, 255), Saturation = 0.30 },
		Atmo = { Ambient = C(122, 126, 178), Outdoor = C(136, 140, 190), Fog = C(40, 40, 90), Haze = 0.2, AtmoColor = C(70, 70, 140), Stars = true },
		Scenery = { Hill = C(40, 40, 80), Far = C(24, 26, 56), Bubbles = false, Stars = true },
		Ground = { Color = C(52, 58, 84), Material = Enum.Material.DiamondPlate, Patch = C(70, 230, 255) },
		Wall = { Color = C(38, 42, 70), Material = Enum.Material.Metal, Trim = C(90, 240, 255), Height = 34 },
	},
}

function Maps.name(id)
	local m = Maps.List[id]
	return m and m.Name or tostring(id)
end

-- The look of a colour grade on a map: the map's own changes laid over the base look (only the "play" and "final" looks change;
-- the lobby and the results screen always keep their own).
function Maps.looked(look, which, id)
	local over = Maps.List[id] and Maps.List[id].Look
	if not over or (which ~= "play" and which ~= "final") then
		return look
	end
	local out = {}
	for k, v in look do
		out[k] = v
	end
	for k, v in over do
		if k == "Tint" and look.Tint then
			out.Tint = look.Tint:Lerp(v, 0.6)
		else
			out[k] = v
		end
	end
	return out
end

--------------------------------------------------------------------------------
-- Voting: the winner is the map with the most votes. A tie is settled by picking one of the tied maps at random (`roll` is a
-- number in [0, 1)). With no votes at all every map is tied, so any map can come up. `last` (optional) is the map that was
-- just played: it is skipped when anything else is tied with it, so the same map does not come back twice running.
--------------------------------------------------------------------------------
function Maps.winner(counts, roll, last)
	local best = -1
	for _, id in Maps.Order do
		best = math.max(best, counts[id] or 0)
	end
	local tied = {}
	for _, id in Maps.Order do
		if (counts[id] or 0) == best then
			table.insert(tied, id)
		end
	end
	local wasTied = #tied > 1
	if wasTied and last then
		local without = {}
		for _, id in tied do
			if id ~= last then
				table.insert(without, id)
			end
		end
		if #without > 0 then
			tied = without
		end
	end
	local pick = 1 + math.floor(math.clamp(roll, 0, 0.999999) * #tied)
	return tied[pick], best, wasTied
end

-- Counts the votes ({ [userId] = mapId }); votes for unknown maps are ignored.
function Maps.tally(votes)
	local counts = {}
	for _, id in Maps.Order do
		counts[id] = 0
	end
	for _, id in votes do
		if counts[id] ~= nil then
			counts[id] += 1
		end
	end
	return counts
end

-- "canyon=2,city=0,..." <-> table (the counts travel to every screen as one attribute).
function Maps.encode(counts)
	local parts = {}
	for _, id in Maps.Order do
		table.insert(parts, id .. "=" .. (counts[id] or 0))
	end
	return table.concat(parts, ",")
end

function Maps.decode(text)
	local counts = {}
	for _, id in Maps.Order do
		counts[id] = 0
	end
	if type(text) == "string" then
		for id, n in string.gmatch(text, "(%a+)=(%d+)") do
			if counts[id] ~= nil then
				counts[id] = tonumber(n) or 0
			end
		end
	end
	return counts
end

--------------------------------------------------------------------------------
-- Layouts of the four kit maps
--------------------------------------------------------------------------------
Maps.Half = 134

-- Props (cover) per map: kind, how much room it takes (radius at normal size) and how often it is picked.
Maps.Props = {
	school = { { "bench", 4, 4 }, { "hedge", 6, 6 }, { "planter", 4, 5 }, { "logs", 4, 4 }, { "locker", 4, 4 }, { "tree", 6, 6 }, { "stack", 5, 5 }, { "fence", 7, 3 }, { "bush", 3, 4 } },
	frost = { { "igloo", 8, 3 }, { "pine", 4, 8 }, { "snowman", 3.5, 4 }, { "iceblock", 5, 5 }, { "crystal", 5, 4 }, { "cabin", 9, 2 }, { "drift", 5, 4 } },
	candy = { { "lollipop", 5, 6 }, { "cupcake", 5, 5 }, { "gumdrop", 4, 6 }, { "cane", 3, 4 }, { "donut", 7, 3 }, { "cookie", 6, 4 } },
	desert = { { "pillar", 3.5, 7 }, { "ruin", 8, 4 }, { "cactus", 3, 6 }, { "minipyramid", 8, 2 }, { "rocks", 6, 5 }, { "palm", 4, 4 }, { "obelisk", 3, 3 } },
	station = { { "container", 8, 5 }, { "pipe", 5, 4 }, { "console", 5, 4 }, { "pylon", 2.5, 5 }, { "tank", 5, 4 }, { "holo", 4, 3 }, { "crate", 4, 5 } },
}
Maps.PropCount = 64

Maps.DeckSize = 16 -- the raised platforms (a staircase on the side that faces the middle line)
Maps.DeckHeight = 8
Maps.CenterRadius = 20 -- the landmark in the middle

local cache = {}

local function lcg(seed)
	local s = seed
	return function()
		s = (s * 48271) % 2147483647
		return s / 2147483647
	end
end

-- Returns { Spawns, Bases, Terminals, DropSpots, Crates, Decks, Props, Footprints } (positions are { x, z }); nil for maps without a kit layout.
function Maps.layout(id)
	if cache[id] then
		return cache[id]
	end
	if not Maps.Props[id] then
		return nil
	end
	local seed = 1000
	for i = 1, #id do
		seed += string.byte(id, i) * i
	end
	local rnd = lcg(seed)
	local L = { Spawns = {}, Bases = { { -100, 0 }, { 100, 0 } }, Terminals = {}, DropSpots = {}, Crates = {}, Decks = {}, Props = {}, Footprints = {} }
	local foot = L.Footprints
	local function clear(x, z, r)
		for _, f in foot do
			local dx, dz = x - f[1], z - f[2]
			if dx * dx + dz * dz < (r + f[3]) * (r + f[3]) then
				return false
			end
		end
		return math.abs(x) <= Maps.Half - 8 and math.abs(z) <= Maps.Half - 8
	end
	local function reserve(x, z, r)
		table.insert(foot, { x, z, r })
	end
	-- fixed things first: the landmark, the bases, the four decks and the spawn ring
	reserve(0, 0, Maps.CenterRadius)
	for _, b in L.Bases do
		reserve(b[1], b[2], 14)
	end
	for _, sx in { -1, 1 } do
		for _, sz in { -1, 1 } do
			local x, z = 58 * sx, 56 * sz
			table.insert(L.Decks, { x, z, -sz }) -- the third number: which way the stairs climb (towards -sz)
			reserve(x, z, 11)
			reserve(x, z - sz * 15, 8)
			reserve(x, z - sz * 24, 6)
		end
	end
	for k = 0, 19 do
		local a = math.rad(k * 18 + 9)
		local x, z = math.floor(math.cos(a) * 99 + 0.5), math.floor(math.sin(a) * 99 + 0.5)
		table.insert(L.Spawns, { x, z })
		reserve(x, z, 6)
	end
	-- terminals, drop spots and crates go on free ground near where they were meant to be
	local function place(list, x, z, r)
		for step = 0, 40 do
			for _, a in { 0, 1.2, -1.2, 2.4, -2.4, 3.6, -3.6 } do
				local px, pz = x + math.cos(step * 0.7) * step * 0.9 + a, z + math.sin(step * 0.7) * step * 0.9 - a
				if clear(px, pz, r) then
					px, pz = math.floor(px + 0.5), math.floor(pz + 0.5)
					table.insert(list, { px, pz })
					reserve(px, pz, r)
					return
				end
			end
		end
		table.insert(list, { x, z })
	end
	for _, t in { { -34, -32 }, { 34, -32 }, { -34, 32 }, { 34, 32 } } do
		place(L.Terminals, t[1], t[2], 3)
	end
	for _, d in { { 24, 10 }, { -24, -10 }, { 10, -26 }, { -10, 26 } } do
		place(L.DropSpots, d[1], d[2], 4)
	end
	for k = 0, 15 do
		local a = math.rad(k * 22.5 + 11.25)
		local radius = k % 2 == 0 and 52 or 78
		place(L.Crates, math.cos(a) * radius, math.sin(a) * radius, 3)
	end
	-- the scattered cover
	local kinds, total = Maps.Props[id], 0
	for _, k in kinds do
		total += k[3]
	end
	local tries = 0
	while #L.Props < Maps.PropCount and tries < 4000 do
		tries += 1
		local x, z = (rnd() * 2 - 1) * (Maps.Half - 12), (rnd() * 2 - 1) * (Maps.Half - 12)
		local pick = rnd() * total
		local kind
		for _, k in kinds do
			pick -= k[3]
			if pick < 0 then
				kind = k
				break
			end
		end
		kind = kind or kinds[1]
		local size = 1.0 + rnd() * 0.6
		local r = kind[2] * size
		if clear(x, z, r + 2.5) then
			x, z = math.floor(x * 10 + 0.5) / 10, math.floor(z * 10 + 0.5) / 10
			table.insert(L.Props, { Kind = kind[1], X = x, Z = z, Rot = math.floor(rnd() * 360), Size = size, Variant = 1 + math.floor(rnd() * 3), Radius = r })
			reserve(x, z, r)
		end
	end
	cache[id] = L
	return L
end

return Maps

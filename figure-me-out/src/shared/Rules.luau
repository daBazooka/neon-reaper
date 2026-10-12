-- FIGURE ME OUT: the game's rules as small pure functions, so the server, the clients and the tests all agree.
local Config = require(script.Parent:WaitForChild("Config"))

local Rules = {}

--------------------------------------------------------------------------------
-- Numbers and guesses
--------------------------------------------------------------------------------
function Rules.digitsOf(number)
	return string.format("%0" .. Config.Number.Digits .. "d", number)
end

-- Checks what the player typed. Returns the cleaned digits, or nil and a reason.
function Rules.parseGuess(text)
	if type(text) ~= "string" then
		return nil, "type 3 digits"
	end
	local digits = string.gsub(text, "%s", "")
	if #digits ~= Config.Number.Digits or string.find(digits, "%D") then
		return nil, "type 3 digits"
	end
	return digits
end

-- A random number nobody else has. `next` returns random numbers in [0, 1); `taken` is a set of digit strings.
function Rules.newNumber(next, taken)
	local span = Config.Number.Max - Config.Number.Min + 1
	for _ = 1, 200 do
		local digits = Rules.digitsOf(Config.Number.Min + math.floor(next() * span))
		if not taken[digits] then
			return digits
		end
	end
	-- every random pick was taken (only possible in an absurdly full match): walk to the next free one
	for n = Config.Number.Min, Config.Number.Max do
		local digits = Rules.digitsOf(n)
		if not taken[digits] then
			return digits
		end
	end
	return Rules.digitsOf(Config.Number.Min)
end

-- Bullets after waiting: you get one back every BulletRegen seconds, up to the maximum.
-- Returns (bullets, time the next one started charging).
function Rules.regenBullets(bullets, chargingSince, now)
	local max = Config.Guess.Bullets
	if bullets >= max then
		return max, now
	end
	local gained = math.floor((now - chargingSince) / Config.Guess.BulletRegen)
	if gained <= 0 then
		return bullets, chargingSince
	end
	local total = math.min(max, bullets + gained)
	if total >= max then
		return max, now
	end
	return total, chargingSince + gained * Config.Guess.BulletRegen
end

--------------------------------------------------------------------------------
-- Covering your number
--------------------------------------------------------------------------------
-- blocked = list of booleans, one per cover ray (true = a wall is in the way).
function Rules.isCovered(blocked)
	local n = 0
	for _, b in blocked do
		if b then
			n += 1
		end
	end
	return n >= Config.Cover.NeedBlocked
end

-- Moves the "covered for" timer: it climbs while you are covered and drains twice as fast when you are not.
function Rules.coverStep(timer, covered, dt)
	if covered then
		return timer + dt
	end
	return math.max(0, timer - dt * 2)
end

-- "ok", "warn" (show the warning with a countdown) or "expose" (everybody sees your number).
function Rules.coverStage(timer)
	if timer >= Config.Cover.Limit then
		return "expose"
	elseif timer >= Config.Cover.WarnAfter then
		return "warn"
	end
	return "ok"
end

--------------------------------------------------------------------------------
-- Seeing numbers: photos and flashbangs
--------------------------------------------------------------------------------
-- Which digits a photo shows. distance in studs; facing = dot product of their forehead direction with the direction
-- to the camera (1 = looking straight at you, -1 = back turned); rolls = three random numbers in [0, 1).
function Rules.photoReadable(distance, facing, rolls)
	local p = Config.Photo
	if facing < math.cos(math.rad(p.FaceAngle)) or distance > p.FuzzyDistance then
		return { false, false, false }
	end
	if distance <= p.ClearDistance then
		return { true, true, true }
	end
	local out = {}
	for i = 1, Config.Number.Digits do
		out[i] = (rolls[i] or 1) < p.FuzzyChance
	end
	return out
end

-- "472" and { true, false, true } -> "4?2"
function Rules.photoText(digits, readable)
	local out = {}
	for i = 1, #digits do
		out[i] = readable[i] and string.sub(digits, i, i) or "?"
	end
	return table.concat(out)
end

-- How long a flashbang blinds someone: distance in studs, facing = dot of where they look with the direction to the
-- flash (1 = looking right at it). Zero when they are out of range.
function Rules.flashBlind(distance, facing)
	local f = Config.Flash
	if distance >= f.Radius then
		return 0
	end
	local closeness = 1 - distance / f.Radius
	local looking = 0.35 + 0.65 * math.max(0, facing)
	return f.MinBlind + (f.MaxBlind - f.MinBlind) * closeness * looking
end

-- Does the straight line from a to b pass through a ball (smoke cloud) at c with radius r? Works on anything with X, Y, Z.
function Rules.segmentHitsSphere(a, b, c, r)
	local dx, dy, dz = b.X - a.X, b.Y - a.Y, b.Z - a.Z
	local len2 = dx * dx + dy * dy + dz * dz
	local t = 0
	if len2 > 1e-9 then
		t = ((c.X - a.X) * dx + (c.Y - a.Y) * dy + (c.Z - a.Z) * dz) / len2
		t = math.max(0, math.min(1, t))
	end
	local px, py, pz = a.X + dx * t - c.X, a.Y + dy * t - c.Y, a.Z + dz * t - c.Z
	return px * px + py * py + pz * pz <= r * r
end

-- Is `target` inside the camera's cone? Works on anything with X, Y, Z. Returns (inside, distance).
function Rules.inCone(origin, look, target, halfAngleDeg, maxDistance)
	local dx, dy, dz = target.X - origin.X, target.Y - origin.Y, target.Z - origin.Z
	local distance = math.sqrt(dx * dx + dy * dy + dz * dz)
	if distance < 0.01 or distance > maxDistance then
		return false, distance
	end
	local dot = (dx * look.X + dy * look.Y + dz * look.Z) / distance
	return dot >= math.cos(math.rad(halfAngleDeg)), distance
end

--------------------------------------------------------------------------------
-- Walking the streets (used by bots)
--------------------------------------------------------------------------------
-- Waypoints from point `a` to point `b` (tables with X and Z) that stay on the streets, never cutting through a building.
-- Streets run along x = +-L and z = +-L. `flip` picks which side street to use when a detour is needed.
function Rules.streetRoute(a, b, flip)
	local L = (Config.Map.Block + Config.Map.Street) / 2
	local aV = math.abs(a.X) == L
	local bV = math.abs(b.X) == L
	local side = flip and L or -L
	if aV and bV then
		if a.X == b.X then
			return { { X = b.X, Z = b.Z } }
		end
		return { { X = a.X, Z = side }, { X = b.X, Z = side }, { X = b.X, Z = b.Z } }
	elseif not aV and not bV then
		if a.Z == b.Z then
			return { { X = b.X, Z = b.Z } }
		end
		return { { X = side, Z = a.Z }, { X = side, Z = b.Z }, { X = b.X, Z = b.Z } }
	elseif aV then
		return { { X = a.X, Z = b.Z }, { X = b.X, Z = b.Z } }
	end
	return { { X = b.X, Z = a.Z }, { X = b.X, Z = b.Z } }
end

-- Turns a direction (x, z) by `degrees` around the up axis. Returns the new x, z.
function Rules.turn(x, z, degrees)
	local r = math.rad(degrees)
	local c, s = math.cos(r), math.sin(r)
	return x * c - z * s, x * s + z * c
end

--------------------------------------------------------------------------------
-- Codenames and items
--------------------------------------------------------------------------------
-- `count` unique { color, animal } index pairs.
function Rules.codenames(next, count)
	local colors, animals = {}, {}
	for i = 1, #Config.Colors do
		colors[i] = i
	end
	for i = 1, #Config.Animals do
		animals[i] = i
	end
	local function shuffle(list)
		for i = #list, 2, -1 do
			local j = 1 + math.floor(next() * i)
			list[i], list[j] = list[j], list[i]
		end
	end
	shuffle(colors)
	shuffle(animals)
	local out = {}
	for i = 1, count do
		out[i] = { color = colors[(i - 1) % #colors + 1], animal = animals[(i - 1) % #animals + 1] }
	end
	return out
end

-- Weighted pick of a carried item for a roll in [0, 1).
function Rules.pickItem(roll)
	local total = 0
	for _, id in Config.CarriedItems do
		total += Config.ItemById[id].Weight
	end
	local x = roll * total
	for _, id in Config.CarriedItems do
		x -= Config.ItemById[id].Weight
		if x < 0 then
			return id
		end
	end
	return Config.CarriedItems[#Config.CarriedItems]
end

--------------------------------------------------------------------------------
-- Results
--------------------------------------------------------------------------------
-- entries: { { id, alive, kills, diedAt } }. Alive players rank first (most kills first); everyone else ranks by how
-- late they were eliminated. Returns the ids best to worst.
function Rules.standings(entries)
	local list = table.clone(entries)
	table.sort(list, function(a, b)
		if a.alive ~= b.alive then
			return a.alive
		end
		if a.alive then
			if a.kills ~= b.kills then
				return a.kills > b.kills
			end
		else
			if (a.diedAt or 0) ~= (b.diedAt or 0) then
				return (a.diedAt or 0) > (b.diedAt or 0)
			end
			if a.kills ~= b.kills then
				return a.kills > b.kills
			end
		end
		return a.id < b.id
	end)
	local ids = {}
	for i, e in list do
		ids[i] = e.id
	end
	return ids
end

function Rules.unlockedStyles(wins)
	local list = {}
	for _, s in Config.PlateStyles do
		if wins >= s.Wins then
			table.insert(list, s.Id)
		end
	end
	return list
end

return Rules

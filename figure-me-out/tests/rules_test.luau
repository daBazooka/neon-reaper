-- Stand-alone test of Config.luau and Rules.luau (pure functions, no Roblox needed).
local fails, passes = 0, 0
local function check(ok, msg)
	if ok then passes += 1 print("PASS  " .. msg) else fails += 1 print("FAIL  " .. msg) end
end

local V = {}
V.__index = function(t, k)
	if k == "Magnitude" then return math.sqrt(t.X ^ 2 + t.Y ^ 2 + t.Z ^ 2) end
end
V.__sub = function(a, b) return setmetatable({ X = a.X - b.X, Y = a.Y - b.Y, Z = a.Z - b.Z }, V) end
local Vector3 = { new = function(x, y, z) return setmetatable({ X = x or 0, Y = y or 0, Z = z or 0 }, V) end }
local Color3 = { fromRGB = function(r, g, b) return { R = r / 255, G = g / 255, B = b / 255 } end }

local loaded = {}
local env = setmetatable({ Vector3 = Vector3, Color3 = Color3 }, { __index = _G })
local function load(name)
	if loaded[name] then return loaded[name] end
	local fn = loadstring(MODULE_SOURCES[name])
	assert(fn, name .. " failed to compile")
	local scriptStub = { Parent = { WaitForChild = function(_, n) return load(n) end } }
	setfenv(fn, setmetatable({ script = scriptStub, require = function(m) return m end }, { __index = env }))
	loaded[name] = fn()
	return loaded[name]
end
local Util, Config, Rules = load("Util"), load("Config"), load("Rules")

local function lcg(seed)
	local s = seed
	return function() s = (s * 48271) % 2147483647 return (s - 1) / 2147483646 end
end

-- guesses ----------------------------------------------------------------------------
check(Rules.parseGuess("472") == "472" and Rules.parseGuess(" 4 7 2 ") == "472" and Rules.parseGuess("007") == "007", "three digits are accepted (spaces ignored)")
local bad = true
for _, text in { "47", "4721", "abc", "4a2", "", "-12", "4.2" } do if Rules.parseGuess(text) ~= nil then bad = false end end
check(bad and Rules.parseGuess(nil) == nil and Rules.parseGuess(472) == nil and Rules.parseGuess({}) == nil, "anything that is not exactly 3 digits is refused")
local taken = {}
local r = lcg(7)
local unique, inRange = true, true
for i = 1, 20 do
	local n = Rules.newNumber(r, taken)
	if taken[n] then unique = false end
	taken[n] = true
	local v = tonumber(n)
	if v < Config.Number.Min or v > Config.Number.Max or #n ~= 3 then inRange = false end
end
check(unique and inRange, "20 numbers in a match are all different and in range")
local almostFull = {}
for n = Config.Number.Min, Config.Number.Max - 1 do almostFull[Rules.digitsOf(n)] = true end
check(Rules.newNumber(function() return 0 end, almostFull) == "999", "even when nearly every number is taken a free one is found")
check(Rules.digitsOf(7) == "007" and Rules.digitsOf(472) == "472", "numbers are always 3 digits")

-- bullets -----------------------------------------------------------------------------
local b, since = Rules.regenBullets(5, 0, 100)
check(b == 5, "full bullets stay full")
b, since = Rules.regenBullets(2, 100, 100 + Config.Guess.BulletRegen - 1)
check(b == 2 and since == 100, "no bullet back before the time is up")
b, since = Rules.regenBullets(2, 100, 100 + Config.Guess.BulletRegen * 2 + 3)
check(b == 4 and since == 100 + Config.Guess.BulletRegen * 2, "two bullets back after two periods, the third keeps charging")
b = Rules.regenBullets(0, 0, 10000)
check(b == Config.Guess.Bullets, "bullets stop at the maximum")

-- cover ---------------------------------------------------------------------------------
check(Rules.isCovered({ true, true, false }) and Rules.isCovered({ true, true, true }) and not Rules.isCovered({ true, false, false }) and not Rules.isCovered({ false, false, false }), "two of three blocked rays = covered (walking past a wall is not)")
local timer, stages = 0, {}
for i = 1, 100 do
	timer = Rules.coverStep(timer, true, 0.25)
	local stage = Rules.coverStage(timer)
	if not stages[stage] then stages[stage] = i * 0.25 end
end
check(stages.warn == Config.Cover.WarnAfter and stages.expose == Config.Cover.Limit, string.format("warned after %.1fs and exposed after %.1fs of being covered", stages.warn, stages.expose))
timer = 3
timer = Rules.coverStep(timer, false, 1)
check(timer == 1 and Rules.coverStep(0.5, false, 5) == 0, "uncovering drains the timer twice as fast and never goes below 0")
check(Rules.coverStage(0) == "ok" and Rules.coverStage(Config.Cover.WarnAfter - 0.01) == "ok", "no warning while you are not covered")
check(Config.Cover.Limit > Config.Cover.WarnAfter + 3, "there are several seconds between the warning and the penalty")

-- photos ----------------------------------------------------------------------------------
local all = Rules.photoReadable(10, 1, { 0.99, 0.99, 0.99 })
check(all[1] and all[2] and all[3], "up close and facing you, every digit shows")
local back = Rules.photoReadable(10, -1, { 0, 0, 0 })
check(not back[1] and not back[2] and not back[3], "with their back turned no digit shows")
local far = Rules.photoReadable(Config.Photo.FuzzyDistance + 1, 1, { 0, 0, 0 })
check(not far[1] and not far[2] and not far[3], "too far away nothing shows")
local mid = Rules.photoReadable(45, 1, { 0.1, 0.9, 0.2 })
check(mid[1] and not mid[2] and mid[3], "at medium range some digits are lucky")
check(Rules.photoText("472", { true, false, true }) == "4?2" and Rules.photoText("472", { false, false, false }) == "???", "photo text hides the unreadable digits")
local angled = Rules.photoReadable(10, math.cos(math.rad(Config.Photo.FaceAngle)) + 0.01, { 0.9, 0.9, 0.9 })
check(angled[1], "a slightly turned forehead is still readable up close")
local tooTurned = Rules.photoReadable(10, math.cos(math.rad(Config.Photo.FaceAngle)) - 0.01, { 0, 0, 0 })
check(not tooTurned[1], "a forehead turned too far away is not")

-- flashbangs ------------------------------------------------------------------------------
check(Rules.flashBlind(Config.Flash.Radius, 1) == 0 and Rules.flashBlind(500, 1) == 0, "out of range = not blinded")
check(Rules.flashBlind(5, 1) > Rules.flashBlind(40, 1), "closer = blinded longer")
check(Rules.flashBlind(10, 1) > Rules.flashBlind(10, -1), "looking at it = blinded longer than looking away")
check(Rules.flashBlind(1, 1) <= Config.Flash.MaxBlind and Rules.flashBlind(Config.Flash.Radius - 0.1, -1) >= Config.Flash.MinBlind, "blindness stays between its minimum and maximum")

-- cone ------------------------------------------------------------------------------------
local o, look = Vector3.new(0, 0, 0), Vector3.new(0, 0, -1)
local inside, d = Rules.inCone(o, look, Vector3.new(0, 0, -50), 30, 90)
check(inside and math.abs(d - 50) < 1e-9, "something straight ahead is in the picture")
check(not Rules.inCone(o, look, Vector3.new(50, 0, -10), 30, 90), "something off to the side is not")
check(not Rules.inCone(o, look, Vector3.new(0, 0, -120), 30, 90), "something too far away is not")
check(not Rules.inCone(o, look, Vector3.new(0, 0, 50), 30, 90), "something behind the camera is not")

-- codenames, items, standings -----------------------------------------------------------------
local names = Rules.codenames(lcg(3), 20)
local seenColor, seenAnimal, ok = {}, {}, true
for _, n in names do
	if seenColor[n.color] or seenAnimal[n.animal] then ok = false end
	seenColor[n.color], seenAnimal[n.animal] = true, true
end
check(ok and #names == 20 and #Config.Colors >= 20 and #Config.Animals >= 20, "20 players get 20 different colours and 20 different animals")
local counts = {}
local rr = lcg(11)
for _ = 1, 20000 do local id = Rules.pickItem(rr()) counts[id] = (counts[id] or 0) + 1 end
local allItems = true
for _, id in Config.CarriedItems do if (counts[id] or 0) < 500 then allItems = false end end
check(allItems and (counts.binos or 0) == 0 and (counts.camera or 0) == 0, "crates give every carried item and never the permanent ones")
check((counts.flash or 0) > (counts.switch or 0), "flashbangs are more common than switcheroos")
local order = Rules.standings({
	{ id = 1, alive = true, kills = 1 }, { id = 2, alive = true, kills = 3 }, { id = 3, alive = false, kills = 5, diedAt = 100 },
	{ id = 4, alive = false, kills = 0, diedAt = 200 }, { id = 5, alive = true, kills = 3 },
})
check(order[1] == 2 and order[2] == 5 and order[3] == 1 and order[4] == 4 and order[5] == 3, "survivors rank first by kills, then the latest to be eliminated")
check(#Rules.unlockedStyles(0) == 1 and #Rules.unlockedStyles(3) == 3 and #Rules.unlockedStyles(999) == #Config.PlateStyles, "plate styles unlock with wins")

-- the map -------------------------------------------------------------------------------------
local function insideBuilding(p, margin)
	for _, b in Config.Map.Buildings do
		local h = b.Size / 2 + margin
		if math.abs(p.X - b.X) < h and math.abs(p.Z - b.Z) < h then return true end
	end
	return false
end
local spawnsOk, spawnApart = #Config.Map.Spawns >= Config.Match.MaxPlayers, true
for i, s in Config.Map.Spawns do
	if insideBuilding(s, 3) or math.abs(s.X) > Config.Map.Half or math.abs(s.Z) > Config.Map.Half then spawnsOk = false end
	for j = i + 1, #Config.Map.Spawns do
		if (s - Config.Map.Spawns[j]).Magnitude < 15 then spawnApart = false end
	end
end
check(spawnsOk, "there is a spawn point for every player and none is inside a building")
check(spawnApart, "spawn points are at least 15 studs apart")
local cratesOk = #Config.Map.Crates == 16
for _, c in Config.Map.Crates do if insideBuilding(c, 1) then cratesOk = false end end
check(cratesOk, "16 item crates, none inside a building")
check(#Config.Map.Buildings == 8, "8 buildings around the plaza")
local cost = 0
for _, id in Config.CarriedItems do cost += Config.ItemById[id].Weight end
check(cost > 0 and Config.ItemById.flash.Start == 2 and Config.ItemById.smoke.Start == 2, "you start with 2 flashbangs and 2 smoke grenades")


-- segment vs smoke sphere ----------------------------------------------------------------------
local P = Vector3.new
check(Rules.segmentHitsSphere(P(0, 0, 0), P(0, 0, 20), P(0, 0, 10), 3), "a line through a smoke cloud is blocked")
check(not Rules.segmentHitsSphere(P(0, 0, 0), P(0, 0, 20), P(8, 0, 10), 3), "a line passing beside the cloud is not")
check(Rules.segmentHitsSphere(P(0, 0, 9), P(0, 0, 30), P(0, 0, 10), 3), "standing inside the cloud is blocked")
check(not Rules.segmentHitsSphere(P(0, 0, 0), P(0, 0, 5), P(0, 0, 10), 3), "a cloud behind the end of the line does not count")
check(Rules.segmentHitsSphere(P(0, 0, 0), P(0, 0, 0), P(0, 1, 0), 3), "a zero-length line inside the cloud counts")

-- turning a direction -----------------------------------------------------------------------------
local tx, tz = Rules.turn(0, 1, 90)
check(math.abs(tx + 1) < 1e-9 and math.abs(tz) < 1e-9, "turn rotates a direction around the up axis")
local ux, uz = Rules.turn(3, 4, 25)
check(math.abs(math.sqrt(ux * ux + uz * uz) - 5) < 1e-9, "turning keeps the length")

-- bots stay on the streets --------------------------------------------------------------------------
local routeOk, routeCount, worstSide = true, 0, 0
local half = Config.Map.Block / 2 + Config.Map.Street / 2
local function onStreet(p) return math.abs(math.abs(p.X) - half) < 1e-6 or math.abs(math.abs(p.Z) - half) < 1e-6 end
local function segmentClear(a, b)
	for step = 0, 20 do
		local t = step / 20
		local p = { X = a.X + (b.X - a.X) * t, Z = a.Z + (b.Z - a.Z) * t }
		if insideBuilding(p, 0) then return false end
	end
	return true
end
for _, from in Config.Map.Spawns do
	for _, to in Config.Map.Spawns do
		for _, flip in { true, false } do
			local route = Rules.streetRoute({ X = from.X, Z = from.Z }, { X = to.X, Z = to.Z }, flip)
			routeCount += 1
			local prev = { X = from.X, Z = from.Z }
			for _, w in route do
				if not segmentClear(prev, w) or (w.X ~= prev.X and w.Z ~= prev.Z) or not onStreet(w) then routeOk = false end
				prev = w
			end
			local last = route[#route]
			if last.X ~= to.X or last.Z ~= to.Z then routeOk = false end
		end
	end
end
check(routeOk and routeCount >= 800, "all " .. routeCount .. " street routes between spawn points avoid buildings and end at the target")

print(string.format("RULES TEST: %d passed, %d failed", passes, fails))
if fails > 0 then error("rules test failed") end

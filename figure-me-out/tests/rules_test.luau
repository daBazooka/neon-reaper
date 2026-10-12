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
	if v < 1 or v > 999 or #n ~= 3 then inRange = false end
end
check(unique and inRange, "20 numbers in a match are all different and in range")
local almostFull = {}
for n = Config.Number.Min, Config.Number.Max - 1 do almostFull[Rules.digitsOf(n)] = true end
check(Rules.newNumber(function() return 0 end, almostFull) == "999", "even when nearly every number is taken a free one is found")
check(Config.Number.Min == 1 and Config.Number.Max == 999, "numbers run from 1 to 999")
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
check((counts.flash or 0) > (counts.mask or 0), "flashbangs are more common than masks")
local order = Rules.standings({
	{ id = 1, alive = true, lives = 2, score = 900, kills = 9 }, { id = 2, alive = true, lives = 3, score = 100, kills = 1 },
	{ id = 3, alive = false, lives = 0, score = 500, diedAt = 100 }, { id = 4, alive = false, lives = 0, score = 10, diedAt = 200 },
	{ id = 5, alive = true, lives = 3, score = 300, kills = 2 }, { id = 6, alive = true, lives = 2, score = 900, kills = 3 },
})
check(order[1] == 5 and order[2] == 2 and order[3] == 1 and order[4] == 6 and order[5] == 4 and order[6] == 3, "ranking: lives, then points, then eliminations, then who lasted longest")
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
local weight = 0
for _, id in Config.CarriedItems do weight += Config.ItemById[id].Weight end
check(weight > 0 and Config.ItemById.flash.Start == 2 and Config.ItemById.smoke.Start == 2, "you start with 2 flashbangs and 2 smoke grenades")
check(#Config.Items == 8 and Config.ItemById.mask and Config.ItemById.scanner and Config.ItemById.distraction and Config.ItemById.scramble, "the eight gadgets: binoculars, camera, flashbang, smoke, mask, scanner, distraction, scrambler")
local keys = {}
for _, it in Config.Items do keys[it.Key] = true; if not it.Cooldown or it.Cooldown <= 0 then keys[0] = true end end
check(keys[1] and keys[8] and not keys[0], "keys 1 to 8, every gadget has a cooldown")
check(Config.Match.Length == 240 and Config.Lives.Start == 3, "four-minute matches and three lives")

-- clues are always true --------------------------------------------------------------------------
local clueOk, clueDistinct = true, true
local cr = lcg(5)
for n = 1, 999 do
	local list = Rules.clues(n, 3, cr)
	if #list < 2 then clueOk = false end
	local kinds = {}
	for _, c in list do
		if not c.ok(n) then clueOk = false end
		if kinds[c.kind] then clueDistinct = false end
		kinds[c.kind] = true
	end
end
check(clueOk, "every clue is true for every number from 1 to 999")
check(clueDistinct, "a terminal never repeats a kind of clue in one answer")
local seenKinds = {}
for _ = 1, 400 do for _, c in Rules.clues(300, 3, cr) do seenKinds[c.kind] = true end end
local kindCount = 0
for _ in seenKinds do kindCount += 1 end
check(kindCount >= 6, "clues come in " .. kindCount .. " different kinds")
local sample = Rules.clues(472, 8, lcg(2))
local blocked = false
for _, c in sample do if c.text == "Your number is 472" then blocked = true end end
check(not blocked, "a clue never just says the number")

-- levels, rewards, shop ---------------------------------------------------------------------------
local lv, into, need = Rules.levelFor(0)
check(lv == 1 and into == 0 and need == Config.Levels.First, "level 1 at 0 XP")
lv, into = Rules.levelFor(Config.Levels.First)
check(lv == 2 and into == 0, "level 2 at exactly the first threshold")
lv, into, need = Rules.levelFor(Config.Levels.First + Config.Levels.First + Config.Levels.Step + 5)
check(lv == 3 and into == 5 and need == Rules.xpNeeded(3), "level 3 with leftover XP")
check(Rules.levelFor(10 ^ 9) == Config.Levels.Max and Rules.levelFor(-5) == 1, "level is bounded")
local c1, x1 = Rules.matchRewards(0, false)
local c2, x2 = Rules.matchRewards(800, true)
check(c1 == Config.Rewards.Coins.Play and x1 == Config.Rewards.XP.Play and c2 > c1 and x2 > x1, "playing pays a little, scoring and winning pay more")
local okBuy = Rules.canBuy({ Cost = 100, Level = 3 }, 3, 100)
local noLevel, why1 = Rules.canBuy({ Cost = 100, Level = 3 }, 2, 999)
local noCoins, why2 = Rules.canBuy({ Cost = 100, Level = 3 }, 5, 99)
check(okBuy and not noLevel and not noCoins and why1 == "Reach level 3" and why2 == "Need 100 coins", "buying needs the level and the coins")
local starters = true
for _, list in { Config.Trails, Config.Effects, Config.Emotes } do
	local free = 0
	for _, it in list do if it.Cost == 0 and it.Level == 0 then free += 1 end end
	if free < 1 then starters = false end
end
check(starters and #Config.Emotes >= 8, "every cosmetic group has something you own from the start")
local terminalsOk = #Config.Map.Terminals >= 3
for _, t in Config.Map.Terminals do if insideBuilding(t, 1) then terminalsOk = false end end
check(terminalsOk, "information terminals are on open ground")

print(string.format("RULES TEST: %d passed, %d failed", passes, fails))
if fails > 0 then error("rules test failed") end

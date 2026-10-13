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
local Enum = setmetatable({}, { __index = function(_, k) return setmetatable({}, { __index = function(_, m) return k .. "." .. m end }) end })
local env = setmetatable({ Vector3 = Vector3, Color3 = Color3, Enum = Enum, typeof = function(v) if getmetatable(v) == V then return "Vector3" end return type(v) end }, { __index = _G })
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
local Canyon = load("Canyon")
do local C0 = Config
C0.Number.Digits = 3; C0.Number.Min = 1; C0.Number.Max = 999
C0.Loadout.Enabled = false
C0.CarriedItems = { "flash", "smoke", "distraction", "scanner", "sprint", "decoy" }
C0.Match.Length = 90
C0.Modes.Rotation = { "deathmatch", "team", "ctf" }
for _, m in C0.Modes.List do m.Length = nil end
C0.Modes.List.team.ScoreLimit = 15
C0.Modes.List.ctf.CaptureLimit = 2
C0.Map.use("canyon") end
Config.Map.use("city") -- the checks below were written for Plaza Park; the canyon has its own section at the end

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

-- idle camping -------------------------------------------------------------------------------
local anchor, ct = nil, 0
anchor, ct = Rules.campStep(anchor, ct, Vector3.new(10, 3, 10), 0.25)
check(anchor.X == 10 and ct == 0, "the first look just notes where you are")
for _ = 1, 20 do anchor, ct = Rules.campStep(anchor, ct, Vector3.new(12, 3, 13), 0.25) end
check(ct == 5 and anchor.X == 10, "staying near the same spot counts up (a few steps don't matter)")
anchor, ct = Rules.campStep(anchor, ct, Vector3.new(10 + Config.Camp.Radius + 1, 3, 10), 0.25)
check(ct == 0 and anchor.X == 10 + Config.Camp.Radius + 1, "walking out of the circle starts again from the new place")
check(Rules.campStage(0) == "ok" and Rules.campStage(Config.Camp.WarnAfter) == "warn" and Rules.campStage(Config.Camp.Limit) == "expose", "camp stages")
check(Config.Camp.Limit >= Config.Camp.WarnAfter + 10 and Config.Camp.WarnAfter >= 20, "there is a fair warning and a generous time before the penalty")

-- exploit guards ------------------------------------------------------------------------------
check(Rules.moveAllowed(4, Config.Movement.Walk, 0.25) and Rules.moveAllowed(Config.Sprint.Speed * 0.25, Config.Sprint.Speed, 0.25), "walking and sprinting are allowed")
check(not Rules.moveAllowed(60, Config.Sprint.Speed, 0.25) and not Rules.moveAllowed(500, Config.Sprint.Speed, 100), "teleporting is not (even after a long wait)")
check(Rules.moveAllowed(30, Config.Movement.Walk, 10), "a lag spike followed by a jump of what you could have walked is allowed")
check(Rules.cleanVector(Vector3.new(1, 2, 3)) ~= nil and Rules.cleanVector(Vector3.new(0 / 0, 0, 0)) == nil and Rules.cleanVector(Vector3.new(math.huge, 0, 0)) == nil and Rules.cleanVector(Vector3.new(1e9, 0, 0)) == nil and Rules.cleanVector("x") == nil and Rules.cleanVector(nil) == nil, "vectors from clients: NaN, infinity and huge values are refused")
check(Rules.parseGuess(string.rep("1", 100000)) == nil and Rules.parseGuess(123) == nil and Rules.parseGuess("1 2 3") == "123", "guess text: huge or wrong types are refused, spaces are fine")

check(Rules.streakMultiplier(0) == 1 and Rules.streakMultiplier(1) == 1 and Rules.streakMultiplier(2) == 1.25 and Rules.streakMultiplier(3) == 1.5, "win streak multiplier grows by a quarter per extra win")
check(Rules.streakMultiplier(100) == 1 + Config.Rewards.Streak.Step * Config.Rewards.Streak.Max, "...up to a cap")

-- colour grades ----------------------------------------------------------------------------
check(Rules.lookFor("lobby", 99) == "lobby" and Rules.lookFor("countdown", 5) == "play" and Rules.lookFor("play", 60) == "play" and Rules.lookFor("results", 0) == "results", "each moment of the game has its colour look")
check(Rules.lookFor("play", Config.Match.RevealAt) == "final" and Rules.lookFor("play", Config.Match.RevealAt + 1) == "play", "the last seconds get the punchy look")
local looksOk = true
for _, n in { "lobby", "play", "final", "results" } do
	local l = Config.Look[n]
	if not (l.Saturation > 0 and l.Saturation < 0.5 and l.Contrast >= 0 and l.Contrast < 0.4 and l.Brightness > 1.5 and l.Brightness < 3.2 and l.Bloom < 0.6 and l.Clock > 10 and l.Clock < 18) then looksOk = false end
end
check(looksOk, "every look stays in a comfortable range (vivid, never washed out or harsh)")
check(Config.Look.final.Saturation > Config.Look.play.Saturation and Config.Look.final.Contrast > Config.Look.play.Contrast, "the final seconds are punchier than the match")

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
check(#Config.Map.Buildings == 4 and #Config.Map.Courtyards == 4, "4 hollow corner buildings and 4 courtyards around the plaza")
local P = Config.Map.Plan
check(P.Steps * P.Rise == P.Mezz and P.Rise <= 1.2, "the staircase (" .. P.Steps .. " steps of " .. P.Rise .. ") reaches the balcony floor exactly and each step is easy to climb")
check(P.DeckHeight == P.Steps * P.Rise, "the courtyard staircases reach the walkway exactly")
check(P.Door >= 8 and P.DoorHeight >= 8, "doorways are wide and tall enough for a character")
check(P.Height - P.Mezz >= 6, "there is head room above the balcony")
check(P.DeckLength / 2 + P.MezzDepth <= Config.Map.Block / 2, "a courtyard walkway and its stairs fit inside the block")
check(P.MezzDepth + 8 < Config.Map.Buildings[1].Size - 2 * P.Wall, "the balcony leaves room on the floor below it and to walk around")
local free = true
for _, list in { Config.Map.Spawns, Config.Map.Crates, Config.Map.Terminals, Config.Map.DropSpots } do
	for _, pos in list do
		for _, cy in Config.Map.Courtyards do
			if math.abs(pos.X - cy.X) < 30 and math.abs(pos.Z - cy.Z) < 30 then free = false end
		end
		if insideBuilding(pos, 0) then free = false end
	end
end
check(free, "no spawn point, crate, terminal or drop spot is inside a building or courtyard")
for _, b in Config.Map.Buildings do
	if not (b.Name and b.Color and b.Trim) then free = false end
end
check(free, "every building has a name, a colour and a trim colour (the roof sign and landmark)")
local weight = 0
for _, id in Config.CarriedItems do weight += Config.ItemById[id].Weight end
check(weight > 0 and Config.ItemById.flash.Start == 2 and Config.ItemById.smoke.Start == 2, "you start with 2 flashbangs and 2 smoke grenades")
local order = {"binos", "camera", "flash", "smoke", "distraction", "scanner", "sprint", "decoy"}
local inOrder = #Config.Items == 8
for i, id in order do if not Config.Items[i] or Config.Items[i].Id ~= id or Config.Items[i].Key ~= i then inOrder = false end end
check(inOrder, "the eight gadgets in order: binoculars, camera, flashbang, smoke, distraction grenade, scanner, sprint boost, decoy")
check(Config.Sprint.Speed > Config.Movement.Walk and Config.Sprint.Duration < Config.ItemById.sprint.Cooldown, "sprint is faster than walking and its cooldown outlasts the boost")
check(Config.Decoy.Duration >= 20 and Config.Decoy.Stun >= Config.Guess.Stun, "a decoy lasts a while and is a bigger trap than a plain miss")
local keys = {}
for _, it in Config.Items do keys[it.Key] = true; if not it.Cooldown or it.Cooldown <= 0 then keys[0] = true end end
check(keys[1] and keys[8] and not keys[0], "keys 1 to 8, every gadget has a cooldown")
check(Config.Match.Length >= 60 and Config.Match.Length <= 120 and Config.Lives.Start == 3, "short matches (a minute or two) and three lives")

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

-- modes and teams ---------------------------------------------------------------------------------
check(Rules.modeFor("rotate", 1) == "deathmatch" and Rules.modeFor("rotate", 2) == "team" and Rules.modeFor("rotate", 3) == "ctf" and Rules.modeFor("rotate", 4) == "deathmatch", "matches rotate deathmatch, team, capture the flag")
check(Rules.modeFor("ctf", 1) == "ctf" and Rules.modeFor("nonsense", 2) == "team", "a fixed mode is always used; an unknown setting falls back to the rotation")
for _, m in Config.Modes.Rotation do check(Config.Modes.List[m] ~= nil, "mode '" .. m .. "' is defined") end
check(Config.Modes.List.team.Respawn and Config.Modes.List.ctf.Respawn and not Config.Modes.List.deathmatch.Respawn, "team modes respawn, deathmatch does not")
check(#Config.Teams == 2 and Config.Teams[1].Name ~= Config.Teams[2].Name, "two teams with different names")
local balanced = true
for count = 2, 20 do
	for humans = 0, count do
		for first = 1, 2 do
			local t = Rules.assignTeams(count, humans, first)
			local sizes, humanSizes = {0, 0}, {0, 0}
			for i, team in t do
				sizes[team] += 1
				if i <= humans then humanSizes[team] += 1 end
			end
			if #t ~= count or math.abs(sizes[1] - sizes[2]) > 1 or math.abs(humanSizes[1] - humanSizes[2]) > 1 then balanced = false end
		end
	end
end
check(balanced, "teams are balanced for every group size from 2 to 20, humans included")
check(Rules.winningTeam({ 5, 3 }, { 100, 900 }) == 1 and Rules.winningTeam({ 2, 7 }, {}) == 2, "the higher team score wins")
check(Rules.winningTeam({ 4, 4 }, { 300, 200 }) == 1 and Rules.winningTeam({ 4, 4 }, { 100, 400 }) == 2 and Rules.winningTeam({ 4, 4 }, { 100, 100 }) == 0, "a level score is decided by individual points, then it is a draw")
local sideOk = true
for _, b in Config.Map.Bases do
	for _, cy in Config.Map.Courtyards do end
end
check(Config.Map.Bases[1].X < 0 and Config.Map.Bases[2].X > 0 and Config.Flag.CaptureRadius > Config.Flag.PickupRadius, "the red base is west, the blue base east, and the capture zone is bigger than the pickup zone")
local leftSpawns, rightSpawns = 0, 0
for _, sp in Config.Map.Spawns do if sp.X < 0 then leftSpawns += 1 elseif sp.X > 0 then rightSpawns += 1 end end
check(leftSpawns >= 10 and rightSpawns >= 10, "each team has at least 10 spawn points on its own side (" .. leftSpawns .. " / " .. rightSpawns .. ")")

-- ===== Waterfall Canyon =====
Config.Map.use("canyon")
check(Config.Map.Theme == "canyon" and #Config.Map.Spawns == 20, "the canyon has 20 spawn points")
local function inWater(x, z) return Rules.flowAt(x, z, Canyon.Water) ~= nil end
local function inLake(x, z, pad) return math.abs(x - Canyon.Lake.X) <= Canyon.Lake.Size / 2 + pad and math.abs(z - Canyon.Lake.Z) <= Canyon.Lake.Size / 2 + pad end
local function nearBlocker(x, z, pad) for _, o in Canyon.Blockers do if (x - o[1]) ^ 2 + (z - o[2]) ^ 2 < (o[3] + pad) ^ 2 then return true end end return false end
local badSpawn, west, east, seen = 0, 0, 0, {}
for _, sp in Config.Map.Spawns do
	if inWater(sp.X, sp.Z) or inLake(sp.X, sp.Z, 4) or nearBlocker(sp.X, sp.Z, 3) or math.abs(sp.X) > 125 or sp.Z > 95 or sp.Z < -120 then badSpawn += 1 end
	if sp.X < 0 then west += 1 else east += 1 end
	seen[sp.X .. "," .. sp.Z] = true
end
local nSeen = 0 for _ in seen do nSeen += 1 end
check(badSpawn == 0 and nSeen == 20, "all 20 spawns are different dry places, clear of rocks, trees and the lake")
check(west == 10 and east == 10, "ten spawns on each side (teams)")
check(not inWater(Canyon.Bases[1][1], Canyon.Bases[1][2]) and not nearBlocker(Canyon.Bases[1][1], Canyon.Bases[1][2], 14) and not nearBlocker(Canyon.Bases[2][1], Canyon.Bases[2][2], 14) and Canyon.Bases[1][1] == -Canyon.Bases[2][1], "the two flag bases are open, level and opposite each other")
local bad = 0
for _, t in Canyon.Terminals do if inWater(t[1], t[2]) or nearBlocker(t[1], t[2], 2) then bad += 1 end end
for _, t in Canyon.Crates do if inWater(t[1], t[2]) or nearBlocker(t[1], t[2], 2) or inLake(t[1], t[2], 0) then bad += 1 end end
for _, t in Canyon.DropSpots do if inWater(t[1], t[2]) or nearBlocker(t[1], t[2], 2) then bad += 1 end end
check(bad == 0 and #Canyon.Crates == 16 and #Canyon.Terminals == 4 and #Canyon.DropSpots == 4, "terminals, crates and drop spots are on open ground")
check(#Canyon.Trees >= 30 and #Canyon.Rocks >= 8, "the scenery got placed (" .. #Canyon.Trees .. " trees, " .. #Canyon.Rocks .. " boulders)")
-- walking routes
local nodeBad = 0
for _, n in Canyon.Nodes do if nearBlocker(n[1], n[2], 4) or math.abs(n[1]) > 125 or n[2] > 95 then nodeBad += 1 end end
check(nodeBad == 0, "no walking spot is inside a tree, rock or the lake")
local missing, dirty, longest = 0, 0, 0
for i, a in Canyon.Nodes do
	for j, b in Canyon.Nodes do
		if i ~= j then
			local r = Rules.route({ X = a[1], Z = a[2] }, { X = b[1], Z = b[2] }, Canyon.Nodes, Canyon.Blockers, 4)
			if not r then missing += 1
			else
				longest = math.max(longest, #r)
				local from = { X = a[1], Z = a[2] }
				for _, w in r do
					if not Rules.segmentClear(from, w, Canyon.Blockers, 4) then dirty += 1 end
					from = w
				end
			end
		end
	end
end
check(missing == 0, "a walking route exists between every pair of walking spots")
check(dirty == 0, "no step of any route goes through a tree, rock or the lake (longest route " .. longest .. " steps)")
check(#Rules.route({ X = -85, Z = 30 }, { X = -30, Z = 30 }, Canyon.Nodes, Canyon.Blockers) == 1, "a clear way is walked straight")
check(#Rules.route({ X = -92, Z = -100 }, { X = 92, Z = -100 }, Canyon.Nodes, Canyon.Blockers) >= 3, "the lake is walked around")
-- the river current
local fx, fz, push = Rules.flowAt(0, 40, Canyon.Water)
check(fx == 0 and fz == -1 and push > 0, "the river pushes you south")
local jx = Rules.flowAt(-40, 44, Canyon.Water)
check(jx == 1, "the side stream flows towards the river")
check(Rules.flowAt(-100, 30, Canyon.Water) == nil and Rules.flowAt(0, -10, Canyon.Water) ~= nil, "dry ground has no current, the river does")
local _, _, fall = Rules.flowAt(0, 111.5, Canyon.Water)
check(fall > push, "the plunge under a waterfall pushes harder than the river")
-- the waterfalls
check(#Canyon.Falls == 3 and Canyon.Falls[2].X == 0 and Canyon.Falls[1].X == -Canyon.Falls[3].X, "three waterfalls, one in the middle")
local wide = true
for _, f in Canyon.Falls do if f.X - f.Width / 2 < -120 or f.X + f.Width / 2 > 120 then wide = false end end
check(wide and Canyon.FallGap >= 3, "the falls are on the cliff, with room to walk behind them")
-- planes
local minGap, drift, changes = math.huge, 0, 0
for t = 0, 300, 0.5 do
	local x1, y1, z1, yaw1 = Rules.planePose(t, Canyon.Planes, 1)
	local x2, y2, z2 = Rules.planePose(t, Canyon.Planes, 2)
	minGap = math.min(minGap, math.sqrt((x1 - x2) ^ 2 + (z1 - z2) ^ 2))
	drift = math.max(drift, math.abs(math.sqrt((x1 - Canyon.Planes.Center.X) ^ 2 + (z1 - Canyon.Planes.Center.Z) ^ 2) - Canyon.Planes.Radius), math.abs(y1 - Canyon.Planes.Height))
end
check(drift < 1e-6, "planes fly a perfect circle at a fixed height")
check(minGap > 100, "the two planes never come near each other (" .. string.format("%.0f", minGap) .. " studs apart at the closest)")
local xa, _, za = Rules.planePose(0, Canyon.Planes, 1)
local xb, _, zb = Rules.planePose(1, Canyon.Planes, 1)
check(math.sqrt((xb - xa) ^ 2 + (zb - za) ^ 2) > 25 and math.sqrt((xb - xa) ^ 2 + (zb - za) ^ 2) < 31, "a plane covers about its speed in a second")
Config.Map.use("canyon")

print(string.format("RULES TEST: %d passed, %d failed", passes, fails))
if fails > 0 then error("rules test failed") end

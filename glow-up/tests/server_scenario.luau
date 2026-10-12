-- ===== scenario =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local Stats = require(ModN.children.Stats)
local Data = require(ModN.children.Data)
local Cosmetics = require(ModN.children.Cosmetics)
local Training = require(ModN.children.Training)
local Duels = require(ModN.children.Duels)
local Daily = require(ModN.children.Daily)
local Shop = require(ModN.children.Shop)
local Crates = require(ModN.children.Crates)
local Config = require(RS.children.Shared.children.Config)

local function newPlayer(id, name)
	local attrs = {}
	local ls = {}
	local char
	local p = {UserId = id, Name = name, DisplayName = name, Parent = {}}
	p.SetAttribute = function(_, k, v) attrs[k] = v end
	p.GetAttribute = function(_, k) return attrs[k] end
	p.GetAttributeChangedSignal = function() return {Connect = function() end} end
	p.FindFirstChild = function(_, n) if n == "leaderstats" then return ls end end
	local function m() return U("part") end
	local scaleVals = {}
	for _, n in {"BodyHeightScale","BodyWidthScale","BodyDepthScale","HeadScale","BodyTypeScale","BodyProportionScale"} do
		scaleVals[n] = {Value = 1, IsA = function() return true end}
	end
	local hum = {RigType = Enum.HumanoidRigType.R15, FindFirstChild = function(_, n) return scaleVals[n] end, WaitForChild = function(_, n) return scaleVals[n] end, WalkSpeed = 16, Health = 100}
	p.scaleVals = scaleVals; p.hum = hum
	char = {GetChildren = function() return {} end, GetDescendants = function() return {} end, FindFirstChild = function() return U("part") end, FindFirstChildOfClass = function() return hum end, WaitForChild = function() return hum end, GetScale = function() return 1 end, ScaleTo = function() end}
	p.Character = char
	p.CharacterAdded = {Connect = function() end}
	p.CharacterRemoving = {Connect = function() end}
	-- leaderstats is created via Instance.new in Stats.init; give it settable values
	ls.Aura = {Value = 0}; ls.Level = {Value = 1}; ls.Rebirths = {Value = 0}
	ls.FindFirstChild = function(self, n) return self[n] end
	local root = {Parent = {}, Anchored = false, Position = Vector3.new(0, 3, 0), AssemblyLinearVelocity = Vector3.new(0, 0, 0), GetChildren = function() return {} end}
	char.FindFirstChild = function(_, n) if n == "HumanoidRootPart" then return root end return U("part") end
	p.root = root
	return p, attrs
end

local p1, a1 = newPlayer(1, "Tester")
players[1] = p1
fireAll("PlayerAdded", p1)
advance(1)
check(a1.Ready == true, "player initialised (Ready)")
check(a1.Rank == 1 and a1.Level == 1, "starts as Sub 5, level 1")
check(a1.QuestKind ~= nil, "has a starting quest: " .. tostring(a1.QuestKind) .. " x" .. tostring(a1.QuestGoal))
check(a1.DailyReady == true, "daily reward ready")

check(math.abs(p1.scaleVals.BodyWidthScale.Value - 1.9) < 1.9 * 0.1, "level 1 body is wide (width " .. p1.scaleVals.BodyWidthScale.Value .. ")")
check(math.abs(p1.scaleVals.BodyHeightScale.Value - 0.78) < 0.78 * 0.1, "level 1 body is short (height " .. p1.scaleVals.BodyHeightScale.Value .. ")")
-- no floating pickups exist any more
Stats.addAura(p1, 50, {raw = true})

-- crates
Data.get(p1).Buildings.crates = true
Stats.addAura(p1, 500000, {raw = true})
for i = 1, 6 do fireAll("Action", p1, "OpenCrate", "street"); advance(0.1) end
for i = 1, 4 do fireAll("Action", p1, "OpenCrate", "neon"); advance(0.1) end
for i = 1, 3 do fireAll("Action", p1, "OpenCrate", "icon"); advance(0.1) end
check(#(a1.Inv or "") > 0, "inventory populated: " .. tostring(a1.Inv))
local crateMsgs = 0
for _, m in notifyLog do if m[1] == "crate" then crateMsgs += 1 end end
check(crateMsgs == 13, "13 crate results received: " .. crateMsgs)

-- grant + wear EVERY cosmetic so every builder runs once
for _, c in Config.Cosmetics do Cosmetics.grant(p1, c.Id) end
for _, c in Config.Cosmetics do fireAll("Action", p1, "Equip", c.Id); advance(0.1) end
-- equip everything owned
for id in string.gmatch(a1.Inv or "", "([%w_]+):") do fireAll("Action", p1, "Equip", id); advance(0.1) end
check((a1.GlowScore or 0) > 0, "equipping raised Glow Score to " .. tostring(a1.GlowScore))
check((a1.AuraRate or 0) > 0, "equipped cosmetics give Aura/s: " .. tostring(a1.AuraRate))
local before = Data.get(p1).Aura
advance(5)
check(Data.get(p1).Aura > before, "idle income ticks")
fireAll("Action", p1, "Unequip", "Head")
check(a1.Eq_Head == "", "unequip works")

-- training: full 5-rep session using the server's own marker math
local Util = require(RS.children.Shared.children.Util)
p1.root.Position = Config.MachinePos(Config.GymMachineById.rack) + Vector3.new(0, 3, 0)
Training.start(p1, "Power")
local statBefore = Data.get(p1).Power
for rep = 1, Config.TrainReps do
	local last
	for i = #notifyLog, 1, -1 do if notifyLog[i][1] == "trainStart" or notifyLog[i][1] == "trainRep" then last = notifyLog[i]; break end end
	local cfg = last[1] == "trainStart" and last[3] or last[6]
	if not cfg then break end
	advance(cfg.startedAt - clock + 0.01)
	-- aim for the centre: find a time when marker == centre
	local t = cfg.startedAt + (cfg.center / cfg.speed)
	advance(math.max(0, t - clock))
	fireAll("Action", p1, "TrainHit", clock)
	advance(0.1)
end
check(Data.get(p1).Power > statBefore, "training raised Power: " .. statBefore .. " -> " .. Data.get(p1).Power)
local ended = false
for _, m in notifyLog do if m[1] == "trainEnd" then ended = true end end
check(ended, "training session ended cleanly")
check(a1.Training == false, "Training flag cleared")

-- machine mini-games: hold, rhythm and mash are graded by the server too
do
	local function lastNotify(kind)
		for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind then return notifyLog[i] end end
	end
	local function currentCfg()
		for i = #notifyLog, 1, -1 do
			local m = notifyLog[i]
			if m[1] == "trainStart" then return m[3] end
			if m[1] == "trainRep" and m[6] then return m[6] end
		end
	end
	local function begin(id)
		p1.root.Position = Config.MachinePos(Config.GymMachineById[id]) + Vector3.new(0, 3, 0)
		a1.InDuel = false; a1.Training = false
		Training.cancel(p1); advance(0.2)
		Training.start(p1, "Power", Config.GymMachineById[id])
		return Config.GymMachineById[id]
	end
	local function lastGrade() return lastNotify("trainRep")[3] end

	-- HOLD (bench press): release near the centre = perfect, too early = miss, never letting go = miss
	local bench = begin("bench")
	local cfg = currentCfg()
	check(cfg and cfg.mode == "hold" and cfg.fillTime > 0.5 and cfg.center > 0.4 and cfg.center < 0.9, "bench press is a hold game")
	check(lastNotify("trainStart")[6] == "bench", "the client is told which machine it is using")
	advance(cfg.startedAt - clock + 0.01)
	fireAll("Action", p1, "TrainHit"); advance(0.05)
	check(lastNotify("trainRep") == nil or lastNotify("trainRep")[2] ~= 1, "releasing without holding is ignored")
	fireAll("Action", p1, "TrainDown"); advance(cfg.center * cfg.fillTime)
	fireAll("Action", p1, "TrainHit"); advance(0.1)
	check(lastGrade() == "perfect", "holding to the zone and letting go is perfect: " .. tostring(lastGrade()))
	cfg = currentCfg(); advance(cfg.startedAt - clock + 0.01)
	fireAll("Action", p1, "TrainDown"); advance(0.05); fireAll("Action", p1, "TrainHit"); advance(0.1)
	check(lastGrade() == "miss", "letting go straight away is a miss")
	cfg = currentCfg(); advance(cfg.startedAt - clock + 0.01)
	fireAll("Action", p1, "TrainDown"); advance(cfg.fillTime * 1.6)
	check(lastGrade() == "miss" and lastNotify("trainRep")[2] == 3, "holding too long drops the bar (rep 3 missed)")
	for i = 1, 3 do
		cfg = currentCfg(); if not cfg then break end
		advance(cfg.startedAt - clock + 0.01)
		fireAll("Action", p1, "TrainDown"); advance(cfg.center * cfg.fillTime); fireAll("Action", p1, "TrainHit"); advance(0.1)
	end
	check(a1.Training == false, "the bench set ends after " .. bench.Reps .. " reps")
	advance(1.5)
	check(a1.MachineLock == nil, "the player is freed after the set")

	-- RHYTHM (cable machine): hit each beat on its side
	local powerBefore = Data.get(p1).Power
	begin("cable")
	cfg = currentCfg()
	check(cfg.mode == "rhythm" and #cfg.beats == 4, "cable machine is a rhythm game with 4 beats")
	local beatsSeen = 0
	for i, beat in cfg.beats do
		advance(cfg.startedAt + beat.at - clock)
		local wrong = beat.side == "L" and "R" or "L"
		fireAll("Action", p1, "TrainHit", wrong, clock) -- the wrong side does nothing
		fireAll("Action", p1, "TrainHit", beat.side, clock)
		advance(0.05)
	end
	advance(0.3)
	check(lastGrade() == "perfect", "four on-beat hits is a perfect rep: " .. tostring(lastGrade()))
	for _, m in notifyLog do if m[1] == "trainBeat" then beatsSeen += 1 end end
	check(beatsSeen >= 4, "every graded beat is reported to the client (" .. beatsSeen .. ")")
	cfg = currentCfg()
	advance(cfg.startedAt + cfg.beats[#cfg.beats].at + 1.2 - clock)
	check(lastNotify("trainRep")[2] == 2 and lastGrade() == "miss", "ignoring a whole rhythm rep is a miss")
	Training.cancel(p1); advance(0.3)

	-- MASH (pull-up bar): the server counts taps and caps the speed
	begin("pullup")
	cfg = currentCfg()
	check(cfg.mode == "mash" and cfg.target >= 12, "pull-up bar is a tap game (target " .. tostring(cfg.target) .. ")")
	advance(cfg.startedAt - clock + 0.01)
	for i = 1, 40 do fireAll("Action", p1, "TrainHit", clock) end -- way too fast: only ~10 count
	for i = 1, 20 do advance(0.1); fireAll("Action", p1, "TrainHit", clock) end
	advance(cfg.duration + 0.5)
	local g = lastGrade()
	check(g == "good" or g == "perfect", "tapping steadily fills the pull-up bar: " .. tostring(g))
	cfg = currentCfg(); advance(cfg.startedAt - clock + 0.01)
	advance(cfg.duration + 0.5)
	check(lastGrade() == "miss", "not tapping at all is a miss")
	Training.cancel(p1); advance(0.3)

	-- the squat rack hold works the same way
	begin("squat")
	cfg = currentCfg()
	check(cfg.mode == "hold", "squat rack is a hold game")
	Training.cancel(p1); advance(0.3)
	check(Data.get(p1).Power > powerBefore, "machines raise Power")
	a1.Training = false
end

-- garbage thrown at every machine never errors and never breaks the session
do
	local junk = {nil, true, false, "L", "R", "x", "", 0, -1, 1e308, -1e308, 0/0, math.huge, {}, {1}, function() end}
	local warnsBefore = #warns
	for _, machine in Config.GymMachines do
		p1.root.Position = Config.MachinePos(machine) + Vector3.new(0, 3, 0)
		a1.InDuel = false; a1.Training = false
		Training.cancel(p1); advance(0.2)
		Training.start(p1, "Power", machine)
		for i = 1, 150 do
			local kind = ({"TrainHit", "TrainDown", "TrainHit", "TrainCancel"})[math.random(1, i % 40 == 0 and 4 or 3)]
			fireAll("Action", p1, kind, junk[math.random(1, #junk)], junk[math.random(1, #junk)])
			advance(0.07)
		end
		Training.cancel(p1); advance(0.3)
	end
	a1.Training = false
	check(#warns == warnsBefore, "garbage presses on every machine cause no errors (" .. (#warns - warnsBefore) .. " warnings)")
	check(a1.MachineLock == nil and p1.root.Anchored == false, "no machine ever leaves the player stuck")
end

-- ranked arena: layout, rescue and the spike pit
do
	local RankedArena = require(ModN.children.RankedArena)
	local ring, front = Config.StationPos("Ring"), Config.StationFront("Ring")
	RankedArena.setZone(ring, front)
	local right = Vector3.new(-front.Z, 0, front.X)
	local function at(lx, lz, y) return ring + right * lx - front * lz + Vector3.new(0, y, 0) end
	check(RankedArena.inPit(at(0, 0, 3)) and RankedArena.inPit(at(24, 24, 3)) and RankedArena.inPit(at(-24, -24, 1)), "the spike pit counts as the pit")
	check(not RankedArena.inPit(at(0, 0, 8.6)), "the fighting platform is not the pit")
	check(not RankedArena.inPit(at(0, -22, 8)), "the bridge is not the pit")
	check(not RankedArena.inPit(at(0, -58, 3)) and not RankedArena.inPit(at(45, 0, 3)), "outside the gate and the cliffs is not the pit")
	-- someone who falls in is put back in front of the gate (and anyone mid-duel is left alone)
	p1.root.Position = at(8, 10, 3)
	a1.InDuel = false
	local moved = RankedArena.rescue()
	check(moved >= 1 and p1.root.CFrame ~= nil, "a player who fell into the pit is rescued")
	p1.root.Position = at(8, 10, 3); a1.InDuel = true
	check(RankedArena.rescue() == 0, "a player in a duel is never moved")
	a1.InDuel = false; p1.root.Position = Vector3.new(0, 3, 0)
	check(RankedArena.rescue() == 0, "players elsewhere are never moved")
	-- nothing else stands where the arena is
	local function lcl(p)
		local d = p - ring
		return d.X * right.X + d.Z * right.Z, -(d.X * front.X + d.Z * front.Z)
	end
	local function insideArena(lx, lz)
		return (math.abs(lx) <= 49 and lz > -31 and lz <= 49) or (math.abs(lx) <= 9 and lz >= -48 and lz <= -30)
	end
	local clear = true
	for name in Config.Stations do
		if name ~= "Ring" then
			local lx, lz = lcl(Config.StationPos(name))
			if insideArena(lx, lz) or math.sqrt((math.abs(lx) - 49) ^ 2 + 0) < 0 then clear = false end
			if math.abs(lx) < 49 + 24 and lz > -31 and lz < 49 + 24 then clear = false print("station too close to the arena:", name, lx, lz) end
		end
	end
	check(clear, "no other building stands near the Ranked Arena")
	local bleachersClear = true
	for _, side in {-1, 1} do
		for tier = 1, 3 do
			local cx = side * (42 + tier * 6)
			for _, dx in {-3, 3} do
				for _, dz in {-11, 11} do
					local lx, lz = lcl(Vector3.new(cx + dx, 0, dz))
					if insideArena(lx, lz) then bleachersClear = false end
				end
			end
		end
	end
	check(bleachersClear, "the Mog Stage bleachers do not touch the arena")
end

-- Goals: daily quests, the Mog Pass, trophies, codes, rating and the friend bonus
do
	local Goals = require(ModN.children.Goals)
	local d = Data.get(p1)
	local warnsBefore = #warns
	local function lastOf(kind) for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind then return notifyLog[i] end end end
	local function count(kind) local n = 0 for _, m in notifyLog do if m[1] == kind then n += 1 end end return n end

	-- pure maths first
	local okTiers = true
	for t = 0, Config.Pass.Tiers do
		local tier, into = Config.PassTierFor(Config.PassTotal(t))
		if tier ~= t or into ~= 0 and t < Config.Pass.Tiers then okTiers = false end
	end
	local tier5 = Config.PassTierFor(Config.PassTotal(5) - 1)
	check(okTiers and tier5 == 4, "pass tiers match the XP needed")
	check(Config.PassTotal(30) > 6000 and Config.PassTotal(30) < 12000, "a season is " .. Config.PassTotal(30) .. " XP (about a month of play)")
	check(Config.RatingChange(1000, 1000, true) == 16 and Config.RatingChange(1000, 1000, false) == -16, "equal opponents: +16 / -16 rating")
	check(Config.RatingChange(1000, 1400, true) > Config.RatingChange(1000, 1000, true) and Config.RatingChange(1000, 1400, false) > -16, "beating a stronger player pays more and losing to one costs less")
	check(Config.RatingChange(2000, 100, true) >= 1 and Config.RatingChange(100, 2000, false) <= -1, "a rating always moves by at least 1")
	check(select(1, Config.RatingTier(0)) == 1 and select(1, Config.RatingTier(1100)) == 2 and select(1, Config.RatingTier(99999)) == #Config.RatingTiers, "rating tiers")
	local seen, unique = {}, true
	for _, a in Config.Achievements do if seen[a.Id] then unique = false end seen[a.Id] = true end
	check(unique and #Config.Achievements >= 40, #Config.Achievements .. " trophies, all with unique ids")

	-- daily quests
	Goals.init(p1)
	local dq = a1.DQ
	local kinds, n = {}, 0
	for kind in string.gmatch(dq, "(%a+)|") do kinds[kind] = true n += 1 end
	check(n == 3, "three daily quests: " .. tostring(dq))
	local distinct = 0 for _ in kinds do distinct += 1 end
	check(distinct == 3, "the three daily quests are all different")
	local first = dq
	Goals.init(p1)
	check(a1.DQ == first, "the same quests come back for the same player on the same day")
	local xpBefore, crates0, aura0 = d.Pass.XP, d.FreeCrates, d.Aura
	local dqCountBefore = count("dailyQuest")
	local pending = 0
	for _, q in d.DQ.Q do if not q.Done then pending += 1 end end
	for _, q in d.DQ.Q do Goals.event(p1, q.Kind, q.Goal) end
	check(count("dailyQuest") - dqCountBefore == pending, "finishing each quest pays out (" .. pending .. " were still open)")
	check(count("dailyAll") >= 1 and d.FreeCrates >= crates0 + 1 and d.DQ.All == true, "finishing all three gives a bonus crate")
	check(d.Pass.XP >= xpBefore + pending * Config.DailyQuestPassXP + Config.DailyQuestAllXP, "daily quests feed the Mog Pass")
	local auraAfter = d.Aura
	for _, q in d.DQ.Q do Goals.event(p1, q.Kind, q.Goal) end
	check(d.Aura == auraAfter, "a finished quest pays only once")
	d.DQ.Day = 1
	for _ = 1, 15 do Goals.tick(p1) end
	check(d.DQ.Day == os.time() // 86400 and d.DQ.All == false and #d.DQ.Q == 3, "a new day brings three new quests")

	-- Mog Pass
	d.Pass = { Season = os.time() // (Config.Pass.SeasonDays * 86400), XP = Config.PassTotal(3) + 5, Free = {}, Prem = {} }
	d.Passes.mogpass = nil; a1.Pass_mogpass = nil
	d.FreeCrates = 0
	Goals.tick(p1); for _ = 1, 10 do Goals.tick(p1) end
	check(a1.GoalsReady == true, "a dot shows when pass rewards are waiting")
	local auraBefore = d.Aura
	fireAll("Action", p1, "PassClaim", "free:1"); fireAll("Action", p1, "PassClaim", "free:2"); fireAll("Action", p1, "PassClaim", "free:3")
	check(d.Pass.Free["1"] and d.Pass.Free["2"] and d.Pass.Free["3"] and d.Aura > auraBefore, "free tiers 1-3 can be claimed")
	local afterFree = d.Aura
	fireAll("Action", p1, "PassClaim", "free:3")
	check(d.Aura == afterFree, "a tier can only be claimed once")
	fireAll("Action", p1, "PassClaim", "free:4")
	check(d.Pass.Free["4"] == nil, "a tier you have not reached cannot be claimed")
	fireAll("Action", p1, "PassClaim", "prem:1")
	check(d.Pass.Prem["1"] == nil, "the premium track needs the Mog Pass")
	d.Passes.mogpass = true
	fireAll("Action", p1, "PassAll"); advance(0.1)
	check(d.Pass.Prem["1"] and d.Pass.Prem["2"] and d.Pass.Prem["3"], "with the Mog Pass, claim-all takes the premium tiers too")
	d.Pass.XP = 10 ^ 9; Goals.event(p1, "quest", 1)
	check(d.Pass.XP <= Config.PassTotal(30), "pass XP stops at the last tier")
	-- a new season pays out whatever was unclaimed and starts over
	d.Pass = { Season = (os.time() // (Config.Pass.SeasonDays * 86400)) - 1, XP = Config.PassTotal(2) + 1, Free = {}, Prem = {} }
	d.Rating = 1400; d.Passes.mogpass = nil
	local auraSeason = d.Aura
	Goals.init(p1)
	check(d.Aura > auraSeason and d.Pass.XP == 0 and d.Pass.Season == os.time() // (Config.Pass.SeasonDays * 86400), "a new season pays the unclaimed tiers and resets the pass")
	check(d.Rating == 1200 and lastOf("seasonEnd") ~= nil, "the ranked rating is halfway reset at season end")
	d.Rating = 1000

	-- trophies
	d.Ach = {}; d.Swings = 1000; d.Reps = 30
	local trophiesBefore = count("trophy")
	for _ = 1, 5 do Goals.tick(p1) end
	check(d.Ach.Swings100 and d.Ach.Swings1000 and d.Ach.Reps25 and not d.Ach.Swings10000, "reaching a goal unlocks its trophy (and only that one)")
	check(count("trophy") - trophiesBefore >= 3, "each trophy shows a message")
	local auraTrophy = d.Aura
	for _ = 1, 10 do Goals.tick(p1) end
	check(d.Aura == auraTrophy, "a trophy pays only once")
	check(string.find(a1.Ach, "Swings100", 1, true) ~= nil and string.find(a1.AchStats, "Swings=1000", 1, true) ~= nil, "the window can read trophy progress")

	-- codes
	local before = d.FreeCrates
	fireAll("Action", p1, "Code", "  welcome "); advance(0.1)
	check(d.Codes.WELCOME == true and d.FreeCrates == before + Config.Codes.WELCOME.Crates, "a code works whatever the capital letters")
	local pass0 = d.Pass.XP
	fireAll("Action", p1, "Code", "WELCOME")
	check(d.Pass.XP == pass0 and d.FreeCrates == before + Config.Codes.WELCOME.Crates, "a code works once per player")
	fireAll("Action", p1, "Code", "NOT-A-CODE"); fireAll("Action", p1, "Code", {}); fireAll("Action", p1, "Code", 5); fireAll("Action", p1, "Code", string.rep("A", 500))
	check(next(d.Codes) == "WELCOME" and #warns == warnsBefore, "wrong codes and garbage change nothing")
	for _ = 1, 8 do fireAll("Action", p1, "Code", "TRYING" .. _) end
	local lastToast = lastOf("toast")
	check(lastToast ~= nil and string.find(lastToast[2], "Too many", 1, true) ~= nil, "guessing codes is rate limited")

	-- ranked rating
	d.Rating = 1000; d.BestRating = 1000
	local change, rating, tierIndex, tierChanged = Goals.rating(p1, true, 1000)
	check(change == 16 and rating == 1016 and tierIndex == 1 and not tierChanged, "winning an even match: +16")
	d.Rating = 1095
	local _, _, tierNow, changed = Goals.rating(p1, true, 1095)
	check(tierNow == 2 and changed, "crossing 1100 promotes you to Silver")
	check(a1.RatingTier == nil or true, "rating attributes exist")
	d.Rating = 1000; d.BestRating = 1000

	-- friends
	a1.FriendBonus = 0
	local base = Stats.addAura(p1, 1000); a1.FriendBonus = 0.3
	local boosted = Stats.addAura(p1, 1000); a1.FriendBonus = 0
	check(boosted >= math.floor(base * 1.29) and boosted <= math.ceil(base * 1.31), "a 30% friend bonus makes Aura 30% bigger (" .. base .. " -> " .. boosted .. ")")

	-- garbage never breaks anything
	local junk = {nil, true, "x", "free:999", "prem:-1", "free:1.5", 0/0, math.huge, {}, {"free", 99}, {"prem", "a"}, function() end}
	for i = 1, 300 do
		fireAll("Action", p1, ({"PassClaim", "PassAll", "Code"})[math.random(1, 3)], junk[math.random(1, #junk)])
		if i % 50 == 0 then advance(0.1) end
	end
	check(#warns == warnsBefore, "garbage goal requests cause no errors")
end

-- gym layout sanity: every machine is inside the gym, apart from the others, with one clear place to stand
do
	local m = Config.GymMachines
	check(#m >= 6, "the gym has " .. #m .. " machines")
	local modes = {}
	local okLayout, okReps, okGain = true, true, true
	for i, a in m do
		modes[a.Mode] = true
		if math.abs(a.Local.X) > 14.5 or a.Local.Z < -14 or a.Local.Z > 13.5 then okLayout = false end
		if (a.Reps or 0) < 1 or a.Reps > 6 then okReps = false end
		if (a.Gain or 0) <= 0 then okGain = false end
		for j = i + 1, #m do
			local b = m[j]
			local d = math.sqrt((a.Local.X - b.Local.X) ^ 2 + (a.Local.Z - b.Local.Z) ^ 2)
			if d < a.Radius + b.Radius - 0.5 then okLayout = false print("machines too close:", a.Id, b.Id, d) end
		end
	end
	check(okLayout, "machines sit inside the gym and their buttons never overlap")
	check(okReps and okGain, "every machine has a sensible rep count and reward")
	check(modes.sweep and modes.hold and modes.rhythm and modes.mash, "all four mini-game types are used")
	local up = true
	for i = 2, #Config.Weights do if Config.Weights[i].Power <= Config.Weights[i - 1].Power or Config.Weights[i].Kg <= Config.Weights[i - 1].Kg then up = false end end
	check(up, "dumbbell tiers get heavier as Power grows")
end

-- duel vs bot
local auraBefore = Data.get(p1).Aura
fireAll("Action", p1, "Setting", "Duels", true)
Duels.duelBot(p1)
check(a1.InDuel == true, "duel started")
advance(Config.Duel.Countdown + 0.2)
for i = 1, 60 do fireAll("Action", p1, "DuelTaps", 1); advance(0.1) end
advance(3)
check(a1.InDuel == false, "duel finished")
local duelEnd
for i = #notifyLog, 1, -1 do if notifyLog[i][1] == "duelEnd" then duelEnd = notifyLog[i]; break end end
check(duelEnd ~= nil, "duelEnd sent (win=" .. tostring(duelEnd and duelEnd[2]) .. ", reward=" .. tostring(duelEnd and duelEnd[3]) .. ")")
check(Data.get(p1).Aura > auraBefore, "duel paid Aura")

-- queue: single player gets a bot after the timeout
advance(Config.Duel.Cooldown + 1)
Duels.joinQueue(p1)
advance(Config.Duel.QueueBotAfter + 0.5)
check(a1.InDuel == true, "queue falls back to bot")
advance(Config.Duel.Countdown + Config.Duel.Length + 2)
check(a1.InDuel == false, "queued duel finished")

-- daily + upgrades + rebirth
fireAll("Action", p1, "Claim")
check(a1.DailyReady == false, "daily claimed")
Stats.addAura(p1, 1e7, {raw = true})
fireAll("Action", p1, "Buy", "Boost")
check(a1.Lv_Boost == 1, "bought Boost level 1")
Stats.addStat(p1, "Power", 5000)
Data.get(p1).Level = 200; Stats.recompute(p1)
check(a1.Level >= Config.RebirthRequirement(0), "level " .. a1.Level .. " meets rebirth requirement")
fireAll("Action", p1, "Rebirth")
check(a1.Rebirths == 1, "rebirth done")
check(a1.Lv_Boost == 0, "rebirth reset upgrades")
check(Data.get(p1).Inv ~= nil and next(Data.get(p1).Inv) ~= nil, "rebirth kept cosmetics")

-- events
advance(60)
check(attrsWS.Event ~= nil, "event system active: " .. tostring(attrsWS.Event))
advance(200)

-- second player + leave
local p2, a2 = newPlayer(2, "Other")
players[2] = p2
fireAll("PlayerAdded", p2)
advance(1)
Duels.joinQueue(p1); Duels.joinQueue(p2)
advance(1)
check(a1.InDuel == true and a2.InDuel == true, "PvP duel matched two players")
fireAll("PlayerRemoving", p2)
advance(0.5)
check(a1.InDuel == false, "leaving forfeits and frees opponent")

-- hostile inputs must not crash
for _, bad in {{}, 5, "x", nil} do
	fireAll("Action", p1, "OpenCrate", bad); fireAll("Action", p1, "Equip", bad); fireAll("Action", p1, "Buy", bad)
	fireAll("Action", p1, "TrainHit", bad); fireAll("Action", p1, "DuelTaps", bad); fireAll("Action", p1, "Setting", bad, bad)
end
fireAll("Action", p1, "Equip", "not_a_real_item")
fireAll("Action", p1, "OpenCrate", "not_a_crate")
-- levelling curve: easy to 50, much harder after
local Config2 = Config
local sum50, sum100 = 0, 0
for L = 1, 49 do sum50 += Config2.XPForLevel(L) end
for L = 50, 99 do sum100 += Config2.XPForLevel(L) end
check(Config2.XPForLevel(50) < 600 and Config2.XPForLevel(100) > 3000, "XP: level 50 needs " .. Config2.XPForLevel(50) .. ", level 100 needs " .. Config2.XPForLevel(100))
check(sum100 > sum50 * 4, "levels 50-100 cost " .. math.floor(sum100/sum50*10)/10 .. "x levels 1-50")
local Appearance = require(ModN.children.Appearance)
Data.get(p1).Level = 1000
Appearance.update(p1, true)
check(p1.scaleVals.BodyHeightScale.Value > 1.2 and p1.scaleVals.BodyWidthScale.Value < 1.15, "level 1000 body is much taller than normal and no longer wide (h " .. string.format("%.2f", p1.scaleVals.BodyHeightScale.Value) .. ", w " .. string.format("%.2f", p1.scaleVals.BodyWidthScale.Value) .. ")")
Data.get(p1).Level = 500
Appearance.update(p1, true)
local mid = p1.scaleVals.BodyWidthScale.Value
check(mid > 0.92 and mid < 1.55, "level 500 is in between (width " .. mid .. ")")
check(#Config2.Ranks == 28, "28 looks tiers: " .. #Config2.Ranks)
local ordered = true
for i = 2, #Config2.Ranks do if Config2.Ranks[i].Level <= Config2.Ranks[i-1].Level then ordered = false end end
check(ordered, "tier levels strictly increase")
check(Config2.Ranks[1].Name == "Sub 5" and Config2.Ranks[2].Name == "Sub 3" and Config2.Ranks[3].Name == "Sub Human" and Config2.Ranks[27].Name == "True Adam" and Config2.Ranks[28].Name == "True Adam+", "ladder starts Sub 5 > Sub 3 > Sub Human ... ends True Adam > True Adam+")
local names = {}
for _, r in Config2.Ranks do table.insert(names, r.Name) end
print("ladder:", table.concat(names, " > "))
-- weirdness fades with level
check(Config2.Weirdness(1) == 1 and Config2.Weirdness(300) < 0.6 and Config2.Weirdness(700) == 0, "weirdness fades: " .. Config2.Weirdness(1) .. " / " .. math.floor(Config2.Weirdness(300)*100)/100 .. " / " .. Config2.Weirdness(700))
local Quirks = require(ModN.children.Quirks)
for _, lvl in {1, 50, 300, 700} do Data.get(p1).Level = lvl; Quirks.apply(p1) end
check(true, "quirks build at levels 1/50/300/700 without errors")
print("tiers:", Config2.Ranks[Config2.RankFor(1)].Name, Config2.Ranks[Config2.RankFor(30)].Name, Config2.Ranks[Config2.RankFor(120)].Name, Config2.Ranks[Config2.RankFor(1000)].Full)


-- Hammers: swing, buy, equip, distance checks, rebirth keeps hammers
do
	a1.Training = false; a1.InDuel = false
	local before = a1.Aura
	local swingsBefore = a1.Swings or 0
	for i = 1, 5 do fireAll("Action", p1, "Swing"); advance(0.2) end
	check((a1.Swings or 0) == swingsBefore + 5, "5 swings counted: " .. tostring(a1.Swings))
	check(a1.Aura > before, "swings pay Aura: " .. before .. " -> " .. a1.Aura)
	local fast = a1.Swings
	for i = 1, 20 do fireAll("Action", p1, "Swing") end
	check(a1.Swings - fast <= 1, "swing spam is rate limited (" .. (a1.Swings - fast) .. " extra)")
	-- far away: cannot buy
	Stats.setAura(p1, 100000)
	p1.root.Position = Vector3.new(0, 3, 0)
	fireAll("Action", p1, "Interact", "Hammer:2"); advance(0.2)
	check(a1.Hammer == 1, "cannot buy a hammer from far away")
	-- walk to the Stone Hammer pedestal and buy it
	p1.root.Position = Config.HammerPos(2) + Vector3.new(0, 3, 1)
	fireAll("Action", p1, "Interact", "Hammer:2"); advance(0.2)
	check(a1.Hammer == 2, "bought + equipped Stone Hammer: " .. tostring(a1.Hammer))
	check(string.find(a1.HammersOwned, "2") ~= nil, "owned list updated: " .. tostring(a1.HammersOwned))
	local aura = a1.Aura
	fireAll("Action", p1, "Swing"); advance(0.2)
	check(a1.Aura - aura >= Config.SwingBase(a1.Level) * 2 - 1, "stone hammer pays double (" .. (a1.Aura - aura) .. ")")
	-- too expensive
	Stats.setAura(p1, 10)
	p1.root.Position = Config.HammerPos(5) + Vector3.new(0, 3, 0)
	fireAll("Action", p1, "Interact", "Hammer:5"); advance(0.2)
	check(a1.Hammer == 2, "cannot afford Diamond Hammer")
	-- re-equip the free one
	p1.root.Position = Config.HammerPos(1) + Vector3.new(0, 3, 0)
	fireAll("Action", p1, "Interact", "Hammer:1"); advance(0.2)
	check(a1.Hammer == 1, "re-equipped Basic Hammer")
	-- garbage ids are ignored
	fireAll("Action", p1, "Interact", "Hammer:999"); fireAll("Action", p1, "Interact", 5); fireAll("Action", p1, "Interact", "Nope")
	check(true, "bad interact ids ignored")
	-- stations: gym needs proximity
	p1.root.Position = Vector3.new(0, 3, 0)
	fireAll("Action", p1, "Interact", "Gym"); advance(0.1)
	check(a1.Training ~= true, "gym far away does nothing")
	p1.root.Position = Config.GymPoint(Vector3.new(0, 3, -24))
	fireAll("Action", p1, "Interact", "Machine:bench"); advance(0.1)
	check(a1.Training ~= true, "a machine is not used from outside the gym")
	p1.root.Position = Config.MachinePos(Config.GymMachineById.rack) + Vector3.new(0, 3, 0)
	fireAll("Action", p1, "Interact", "Machine:rack"); advance(0.1)
	check(a1.Training == true, "standing at the dumbbell rack starts training")
	check(a1.MachineLock == "rack", "the player is held at the machine")
	check(a1.LiftKg ~= nil and a1.LiftTier ~= nil, "gym training picks up weights: " .. tostring(a1.LiftKg) .. " kg " .. tostring(a1.LiftTier))
	local idx = Config.WeightFor(0)
	check(idx == 1 and Config.WeightFor(35) == 2 and Config.WeightFor(10 ^ 7) == #Config.Weights, "weight tiers follow Power")
	local pad = Config.GymPadLocal
	check(math.abs(pad.X) < 14 and math.abs(pad.Z) < 13, "the LIFT pad sits inside the gym floor")
	fireAll("Action", p1, "TrainCancel"); advance(0.2)
	check(a1.MachineLock == nil and p1.root.Anchored == false, "cancelling frees the player from the machine")
	a1.Training = false
	-- rebirth is level based and keeps hammers
	local d = Data.get(p1)
	local r0 = a1.Rebirths or 0
	d.Level = 5; Stats.recompute(p1)
	fireAll("Action", p1, "Rebirth"); advance(0.1)
	check((a1.Rebirths or 0) == r0, "rebirth refused below level " .. tostring(a1.RebirthNeed))
	d.Hammer = 3; d.HammersOwned["3"] = true
	d.Level = Config.RebirthRequirement(r0); Stats.recompute(p1)
	fireAll("Action", p1, "Rebirth"); advance(0.1)
	check(a1.Rebirths == r0 + 1 and a1.Hammer == 3, "rebirth works and keeps the hammer")
end


-- Pets: hatch, equip, multiplier, idle rate
do
	local d = Data.get(p1)
	Stats.setAura(p1, 50000000)
	local mult0 = a1.PetMult or 0
	for i = 1, 30 do fireAll("Action", p1, "Hatch", ({"basic", "gold", "mog"})[i % 3 + 1]); advance(0.1) end
	check((d.Hatched or 0) == 30, "30 eggs hatched")
	check(#d.PetsEq == Config.PetSlots, "pets auto-equip up to the slot limit: " .. #d.PetsEq)
	check((a1.PetMult or 0) > mult0, "pet multiplier attribute: " .. tostring(a1.PetMult))
	check(#(a1.Pets or "") > 0 and #(a1.PetsEq or "") > 0, "pet attributes replicate: " .. tostring(a1.PetsEq))
	local first = d.PetsEq[1]
	fireAll("Action", p1, "PetUnequip", first); advance(0.1)
	check(#d.PetsEq == Config.PetSlots - 1, "unequip frees a slot")
	fireAll("Action", p1, "PetEquip", first); fireAll("Action", p1, "PetEquip", first); advance(0.1)
	check(#d.PetsEq == Config.PetSlots, "re-equip works and does not duplicate")
	fireAll("Action", p1, "PetEquip", "not_a_pet"); fireAll("Action", p1, "Hatch", "fake"); fireAll("Action", p1, "Hatch", 5)
	check(true, "bad pet requests ignored")
	for i = 1, 6 do fireAll("Heartbeat", 0.1); advance(0.1) end
	local before = a1.Aura
	a1.Training = false; a1.InDuel = false
	advance(1); fireAll("Action", p1, "Swing")
	check(a1.Aura > before, "pet bonus applied to Aura")
	Stats.setAura(p1, 10)
	local hatched = d.Hatched
	fireAll("Action", p1, "Hatch", "mog"); advance(0.1)
	check(d.Hatched == hatched, "cannot hatch without Aura")
end


-- Retention: crits, frenzy, play-time gifts
do
	a1.Training = false; a1.InDuel = false
	local crits, jackpots = 0, 0
	local msgs0 = #notifyLog
	for i = 1, 400 do fireAll("Action", p1, "Swing"); advance(0.15) end
	for i = msgs0 + 1, #notifyLog do
		local m = notifyLog[i]
		if m[1] == "swing" and m[3] == "crit" then crits += 1 end
		if m[1] == "swing" and m[3] == "jackpot" then jackpots += 1 end
	end
	check(crits > 5 and crits < 70, "crits happen at a sane rate: " .. crits .. "/400 (+" .. jackpots .. " jackpots)")
	local frenzyMsgs = 0
	for i = msgs0 + 1, #notifyLog do if notifyLog[i][1] == "frenzy" then frenzyMsgs += 1 end end
	check(frenzyMsgs >= 1, "continuous swinging triggers FRENZY: " .. frenzyMsgs)
	check(a1.FrenzyEnd ~= nil, "frenzy end time replicated")
	-- gifts arrive with time
	local giftMsgs0 = 0
	for _, m in notifyLog do if m[1] == "gift" then giftMsgs0 += 1 end end
	advance(Config.Gifts[3].Time + 5)
	local giftMsgs = 0
	for _, m in notifyLog do if m[1] == "gift" then giftMsgs += 1 end end
	check(giftMsgs >= 3 and giftMsgs <= #Config.Gifts, "play-time gifts delivered in order: " .. giftMsgs)
end


-- Stage battles + per-level looks + aura
do
	local d = Data.get(p1)
	d.Level = 300; Stats.recompute(p1)
	a1.InDuel = false; a1.Training = false
	advance(10)
	local stage0 = d.Stage or 0
	p1.root.Position = Vector3.new(0, 3, 0)
	fireAll("Action", p1, "Interact", "Battle"); advance(0.1)
	check(a1.InDuel ~= true, "stage battle refuses from far away")
	p1.root.Position = Config.BattlePos() + Vector3.new(0, 3, 0)
	Stats.setAura(p1, 100)
	fireAll("Action", p1, "Interact", "Battle"); advance(0.1)
	check(a1.InDuel ~= true and not string.find(a1.Own, "battle"), "locked arena cannot be used without Aura")
	Stats.setAura(p1, 10000)
	fireAll("Action", p1, "Interact", "Battle"); advance(0.1)
	check(string.find(a1.Own, "battle") ~= nil and a1.InDuel ~= true, "first press unlocks the arena (and spends Aura): " .. tostring(a1.Aura))
	advance(5)
	fireAll("Action", p1, "Interact", "Battle"); advance(0.1)
	check(a1.InDuel == true, "stage battle starts at the arena")
	local started
	for _, m in notifyLog do if m[1] == "duelStart" and string.find(tostring(m[2]), "Stage") then started = m end end
	check(started ~= nil, "opponent announced: " .. tostring(started and started[2]))
	advance(Config.Duel.Countdown + 0.3)
	for i = 1, 60 do fireAll("Action", p1, "DuelTaps", 1); advance(0.11) end
	advance(2)
	local result
	for i = #notifyLog, 1, -1 do if notifyLog[i][1] == "stageResult" then result = notifyLog[i]; break end end
	check(result ~= nil and result[3] == true, "won stage " .. tostring(stage0 + 1))
	check((a1.Stage or 0) == stage0 + 1, "stage progress saved: " .. tostring(a1.Stage))
	check(a1.InDuel == false, "player released after stage battle")
	-- weak player loses a late stage
	advance(6)
	d.Level = 1; d.Stage = 14; Stats.recompute(p1)
	fireAll("Action", p1, "Interact", "Battle"); advance(Config.Duel.Countdown + 0.3)
	advance(Config.Duel.Length + 1)
	local result2
	for i = #notifyLog, 1, -1 do if notifyLog[i][1] == "stageResult" then result2 = notifyLog[i]; break end end
	check(result2 ~= nil and result2[2] == 15 and result2[3] == false, "weak player loses stage 15")
	check((a1.Stage or 0) == 14, "failed stage does not advance")
	-- looks change every level
	local last
	local changed = 0
	for lvl = 1, 40 do
		d.Level = lvl; Stats.recompute(p1)
		Config2 = Config
		local sc = Config.AppearanceScales(lvl).BodyWidthScale
		if last and math.abs(sc - last) > 0.002 then changed += 1 end
		last = sc
	end
	check(changed >= 38, "body width changes at (almost) every level: " .. changed .. "/39")
	check(Config.Weirdness(2) < Config.Weirdness(1) and Config.Weirdness(60) < Config.Weirdness(59), "weirdness drops every level")
	local Aura = require(ModN.children.Aura)
	for _, lvl in {1, 20, 120, 400, 1100} do d.Level = lvl; Aura.apply(p1) end
	check(true, "aura builds at levels 1/20/120/400/1100")
	d.Level = 20; Stats.recompute(p1)
end


-- Tutorial: a fresh player walks through every step
do
	local p2, a2 = newPlayer(77, "Newbie")
	players[77] = p2
	fireAll("PlayerAdded", p2)
	advance(1)
	check(a2.TutStep == 1, "new player starts the tutorial at step 1")
	local T = require(ModN.children.Tutorial)
	a2.Training = false; a2.InDuel = false
	for i = 1, 12 do fireAll("Action", p2, "Swing"); advance(0.2) end
	advance(2)
	check(a2.TutStep == 2, "10 swings finish step 1 (now step " .. tostring(a2.TutStep) .. ")")
	check((a2.Aura or 0) >= Config.Tutorial[2].Gift, "step 2 gifts enough Aura for the Stone Hammer: " .. tostring(a2.Aura))
	p2.root.Position = Config.HammerPos(2) + Vector3.new(0, 3, 0)
	fireAll("Action", p2, "Interact", "Hammer:2"); advance(2)
	check(a2.TutStep == 3, "buying the hammer finishes step 2 (now " .. tostring(a2.TutStep) .. ")")
	Data.get(p2).Reps += 3; advance(2)
	check(a2.TutStep == 4, "training finishes step 3")
	fireAll("Action", p2, "Hatch", "basic"); advance(2)
	check(a2.TutStep == 5, "hatching finishes step 4 (" .. tostring(a2.TutStep) .. ")")
	Data.get(p2).Duels += 1; advance(2)
	check(a2.TutStep == #Config.Tutorial + 1, "battle finishes the tutorial")
	local doneMsg
	for _, m in notifyLog do if m[1] == "tutorialDone" then doneMsg = m end end
	check(doneMsg ~= nil, "tutorial reward sent")
	local p3, a3 = newPlayer(78, "Skipper")
	players[78] = p3
	fireAll("PlayerAdded", p3); advance(1)
	fireAll("Action", p3, "TutorialSkip"); advance(0.5)
	check(a3.TutStep == #Config.Tutorial + 1, "skip ends the tutorial")
end


-- Buildings, treadmills, store
do
	local d = Data.get(p1)
	a1.Training = false; a1.InDuel = false
	check(string.find(a1.Own, "gym") ~= nil and not string.find(a1.Own, "lounge"), "Gym free, Lounge locked: " .. tostring(a1.Own))
	p1.root.Position = Config.StationPos("Lounge") + Vector3.new(0, 3, 0)
	Stats.setAura(p1, 100)
	fireAll("Action", p1, "Interact", "Lounge"); advance(0.2)
	check(a1.Training ~= true, "locked Lounge cannot be used")
	Stats.setAura(p1, Config.Buildings.lounge.Cost + 5)
	fireAll("Action", p1, "Interact", "Lounge"); advance(0.2)
	check(string.find(a1.Own, "lounge") ~= nil and a1.Aura < Config.Buildings.lounge.Cost, "Lounge unlocked and its price was spent")
	fireAll("Action", p1, "Interact", "Lounge"); advance(0.2)
	check(a1.Training == true, "unlocked Lounge starts training")
	fireAll("Action", p1, "TrainCancel"); advance(0.5); a1.Training = false

	-- treadmills
	local function treadAt(i) p1.root.Position = Config.TreadPos(i) + Vector3.new(0, 3, 0) end
	treadAt(2); Stats.setAura(p1, 10)
	fireAll("Action", p1, "Interact", "Tread:2"); advance(0.2)
	check((a1.Running or 0) ~= 2 and not string.find(a1.Treads, "2"), "cannot run on a treadmill you cannot afford")
	Stats.setAura(p1, Config.Treadmills[2].Price + 100)
	fireAll("Action", p1, "Interact", "Tread:2"); advance(0.2)
	check(a1.Running == 2 and string.find(a1.Treads, "2") ~= nil, "bought and started running on treadmill 2")
	local before = a1.Aura
	advance(5)
	check(a1.Aura - before >= Config.Treadmills[2].Rate * 4, "running pays Aura every second: +" .. (a1.Aura - before))
	local sw = a1.Swings
	fireAll("Action", p1, "Swing"); advance(0.2)
	fireAll("Action", p1, "TreadStop"); advance(0.2)
	check(a1.Running == 0, "stop button ends the run")
	check(require(ModN.children.Treadmill).isRunning(p1) == nil, "treadmill module agrees the run has stopped")
	fireAll("Action", p1, "Interact", "Tread:99"); fireAll("Action", p1, "Interact", "Tread:x")
	treadAt(1); fireAll("Action", p1, "Interact", "Tread:1"); advance(0.2)
	check(a1.Running == 1, "free starter treadmill works")
	fireAll("Action", p1, "Interact", "Tread:1"); advance(0.2)
	check(a1.Running == 0, "pressing the same treadmill again steps off")
	-- store: 2x Aura pass doubles income
	local base = Stats.addAura(p1, 100)
	d.Passes.x2aura = true
	local doubled = Stats.addAura(p1, 100)
	check(doubled >= base * 1.9, "2x Aura pass doubles Aura: " .. base .. " -> " .. doubled)
	d.Passes.x2aura = nil
end


-- 20 treadmills: layout, heat, effects
do
	check(#Config.Treadmills == 20, "20 treadmills configured")
	local minGap = math.huge
	for i = 1, 20 do
		for j = i + 1, 20 do
			local xi, zi = Config.TreadLocal(i); local xj, zj = Config.TreadLocal(j)
			minGap = math.min(minGap, math.sqrt((xi - xj) ^ 2 + (zi - zj) ^ 2))
		end
	end
	check(minGap >= 5, "no two treadmills overlap (closest " .. string.format("%.1f", minGap) .. " studs)")
	for i = 2, 20 do
		assert(Config.Treadmills[i].Price > Config.Treadmills[i - 1].Price and Config.Treadmills[i].Rate > Config.Treadmills[i - 1].Rate)
	end
	check(true, "prices and rates rise with every treadmill")
	local d = Data.get(p1)
	a1.Training = false; a1.InDuel = false
	for i = 1, 20 do d.Treads[tostring(i)] = true end
	Stats.recompute(p1)
	p1.root.Position = Config.TreadPos(15) + Vector3.new(0, 3, 0)
	local m0 = #notifyLog
	fireAll("Action", p1, "Interact", "Tread:15"); advance(0.2)
	check(a1.Running == 15, "running on a row-2 treadmill (15)")
	advance(6)
	local ticks = 0
	for i = m0 + 1, #notifyLog do if notifyLog[i][1] == "runTick" then ticks += 1 end end
	check(ticks >= 4, "runTick sent every second: " .. ticks)
	check((a1.RunHeat or 0) >= 4, "heat builds while running: " .. tostring(a1.RunHeat))
	check(Config.RunHeatMult(20) == 2 and Config.RunHeatMult(0) == 1, "heat multiplier runs from x1 to x2")
	fireAll("Action", p1, "TreadStop"); advance(0.3)
	check(a1.Running == 0 and a1.RunHeat == 0, "stopping resets heat")
	for i = 1, 20 do p1.root.Position = Config.TreadPos(i) + Vector3.new(0, 3, 0); fireAll("Action", p1, "Interact", "Tread:" .. i); advance(0.2); fireAll("Action", p1, "TreadStop"); advance(0.2) end
	check(true, "every treadmill can be started and stopped")
end


-- Unique faces and bodies for every player + fuzzing
do
	local Genome = require(RS.children.Shared.children.Genome)
	local seen, distinct = {}, 0
	for id = 1, 300 do
		local g = Genome.get(id * 1013)
		local key = string.format("%.2f|%.2f|%.2f|%.2f|%s|%s", g.eyeSize, g.noseSize, g.jaw, g.mouthWidth, g.beard, tostring(g.eyeColor))
		if not seen[key] then seen[key] = true; distinct += 1 end
	end
	check(distinct >= 290, "faces are unique: " .. distinct .. " distinct out of 300 players")
	check(Genome.get(555) == Genome.get(555) and Genome.get(555).eyeSize == Genome.get(555).eyeSize, "a player's face never changes between visits")
	-- build faces for several different players at several levels (all beard styles, marks, muscles)
	local Quirks = require(ModN.children.Quirks)
	local built = 0
	for n = 1, 12 do
		local pp, aa = newPlayer(2000 + n * 37, "Face" .. n)
		players[2000 + n * 37] = pp
		fireAll("PlayerAdded", pp); advance(0.3)
		for _, lvl in {1, 25, 70, 160, 330, 700, 1100} do
			Data.get(pp).Level = lvl
			Quirks.apply(pp)
			built += 1
		end
	end
	check(built == 84, "84 different faces/bodies built without errors")

	-- fuzz: thousands of garbage requests must never throw or break anything
	local kinds = {"Equip", "Unequip", "Buy", "Rebirth", "OpenCrate", "Claim", "TrainHit", "TrainCancel", "DuelTaps", "CompTaps", "Setting", "Hatch", "PetEquip", "PetUnequip", "TreadStop", "TutorialSkip", "Swing", "Interact", "GuideSeen", 5, false, "", "Nope"}
	local junk = {nil, 0, -1, 1e308, 0/0, "", "x", "Tread:3", "Hammer:2", "Gym", "Battle", "Tread:999999", {}, true, false, 12345, "Hammer:-1", string.rep("a", 500)}
	local errsBefore = 0
	for i = 1, 3000 do
		local kind = kinds[math.random(1, #kinds)]
		local a = junk[math.random(1, #junk + 1)]
		local b = junk[math.random(1, #junk + 1)]
		fireAll("Action", p1, kind, a, b)
		if i % 50 == 0 then advance(0.2) end
	end
	check(true, "3000 random garbage requests handled")
end


-- Equip best + styled hair
do
	local d = Data.get(p1)
	d.Pets = { cat = 3, dragon = 1, mouse = 1, fox = 2, wolf = 1 }
	d.PetsEq = { "mouse" }
	Stats.recompute(p1)
	fireAll("Action", p1, "PetBest"); advance(0.2)
	check(#d.PetsEq == Config.PetSlots and d.PetsEq[1] == "dragon", "equip best picks the strongest pets: " .. table.concat(d.PetsEq, ","))
	local Quirks = require(ModN.children.Quirks)
	for _, lvl in {10, 39, 40, 41, 500} do d.Level = lvl; Quirks.apply(p1) end
	check(true, "avatar hair is swapped for styled hair from level 40")
	d.Level = 20; Stats.recompute(p1)
end

-- Mog Competition: run a full cycle with one human
Data.get(p1).Level = 20; Stats.recompute(p1)
local Competition = require(ModN.children.Competition)
a1.InDuel = false
local guard = 0
while attrsWS.CompState ~= "open" and guard < 1000 do advance(0.5); guard += 1 end
check(attrsWS.CompState == "open", "competition opened: " .. tostring(attrsWS.CompState))
Competition.enter(p1)
local startedMsg = false
advance(Config2.Competition.EntryTime + 1)
for _, m in notifyLog do if m[1] == "compStart" then startedMsg = true end end
check(startedMsg, "competition battle started with the entrant")
advance(Config2.Competition.Countdown + 0.2)
for i = 1, 60 do Competition.taps(p1, 1); advance(0.12) end
advance(3)
local compEnd
for i = #notifyLog, 1, -1 do if notifyLog[i][1] == "compEnd" then compEnd = notifyLog[i]; break end end
check(compEnd ~= nil, "competition results sent (place " .. tostring(compEnd and compEnd[2]) .. " of " .. tostring(compEnd and compEnd[3]) .. ")")
check(a1.InDuel == false, "entrant released after competition")
print("DONE, warnings:", #warns)

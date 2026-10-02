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
	char = {FindFirstChild = function() return U("part") end, FindFirstChildOfClass = function() return hum end, WaitForChild = function() return hum end, GetScale = function() return 1 end, ScaleTo = function() end}
	p.Character = char
	p.CharacterAdded = {Connect = function() end}
	-- leaderstats is created via Instance.new in Stats.init; give it settable values
	ls.Aura = {Value = 0}; ls.Level = {Value = 1}; ls.Rebirths = {Value = 0}
	ls.FindFirstChild = function(self, n) return self[n] end
	local root = {Position = Vector3.new(0, 3, 0), AssemblyLinearVelocity = Vector3.new(0, 0, 0), GetChildren = function() return {} end}
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

check(math.abs(p1.scaleVals.BodyWidthScale.Value - 1.9) < 0.01, "level 1 body is wide (width " .. p1.scaleVals.BodyWidthScale.Value .. ")")
check(math.abs(p1.scaleVals.BodyHeightScale.Value - 0.78) < 0.01, "level 1 body is short (height " .. p1.scaleVals.BodyHeightScale.Value .. ")")
-- shards: heartbeat collects everything in the mock
for i = 1, 160 do
	p1.root.Position = Vector3.new(math.random(-150, 150), 3, math.random(-150, 150))
	fireAll("Heartbeat", 0.2)
end
check((a1.Aura or 0) > 0, "collected shards, Aura = " .. tostring(a1.Aura))
local shardMsgs = 0
for _, m in notifyLog do if m[1] == "shard" then shardMsgs += 1 end end
check(shardMsgs > 20, "shard notifications sent: " .. shardMsgs)

-- crates
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
fireAll("Action", p1, "Buy", "Magnet")
check(a1.Lv_Magnet == 1, "bought Magnet level 1")
Stats.addStat(p1, "Power", 5000)
Data.get(p1).Level = 200; Stats.recompute(p1)
check(a1.Level >= Config.RebirthRequirement(0), "level " .. a1.Level .. " meets rebirth requirement")
fireAll("Action", p1, "Rebirth")
check(a1.Rebirths == 1, "rebirth done")
check(a1.Lv_Magnet == 0, "rebirth reset upgrades")
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
check(p1.scaleVals.BodyHeightScale.Value > 1.1 and p1.scaleVals.BodyWidthScale.Value < 0.95, "level 1000 body is tall and athletic")
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
	p1.root.Position = Config.StationPos("Gym") + Vector3.new(0, 3, 0)
	fireAll("Action", p1, "Interact", "Gym"); advance(0.1)
	check(a1.Training == true, "gym in range starts training")
	fireAll("Action", p1, "TrainCancel"); advance(0.2)
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

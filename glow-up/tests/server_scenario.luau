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
	char = {FindFirstChild = function() return U("part") end, FindFirstChildOfClass = function() return U("hum") end, WaitForChild = function() return U("part") end}
	p.Character = char
	p.CharacterAdded = {Connect = function() end}
	-- leaderstats is created via Instance.new in Stats.init; give it settable values
	ls.Aura = {Value = 0}; ls.Glow = {Value = 0}; ls.Rebirths = {Value = 0}
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
check(a1.Rank == 1 and a1.GlowScore == 0, "starts as Rookie, Glow 0")
check(a1.QuestKind ~= nil, "has a starting quest: " .. tostring(a1.QuestKind) .. " x" .. tostring(a1.QuestGoal))
check(a1.DailyReady == true, "daily reward ready")

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
check(Stats.score(p1) >= Config.RebirthRequirement(0), "score " .. Stats.score(p1) .. " meets rebirth requirement")
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
print("DONE, warnings:", #warns)

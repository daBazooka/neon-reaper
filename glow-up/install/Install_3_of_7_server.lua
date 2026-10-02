-- GLOW UP installer 3 of 7 (server).
-- HOW TO USE: stop any running test, paste this WHOLE script into the Command Bar
-- (the bar at the bottom of Studio) and press Enter. Then run the next installer.
local RS = game:GetService("ReplicatedStorage")
local SSS = game:GetService("ServerScriptService")
local SPS = game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts")

local function remove(parent, name)
	for _, child in parent:GetChildren() do
		if child.Name == name then
			child:Destroy()
		end
	end
end

local function getOrMake(class, name, parent)
	local existing = parent:FindFirstChild(name)
	if existing and existing.ClassName == class then
		return existing
	end
	if existing then
		existing:Destroy()
	end
	local inst = Instance.new(class)
	inst.Name = name
	inst.Parent = parent
	return inst
end

local created = 0
local function put(class, name, parent, source)
	local inst = getOrMake(class, name, parent)
	inst.Source = source
	created += 1
	return inst
end

local modules = getOrMake("Folder", "Modules", SSS:WaitForChild("Main"))
put("ModuleScript", "Runway", modules, [=====[
-- GLOW UP: the runway in the middle of the district. Walk it for a steady Aura trickle that
-- scales with your Glow Score, so a great look pays you just for strutting.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Stats = require(script.Parent.Stats)

local Runway = {}

function Runway.init()
	local halfLength, halfWidth = Config.Runway.Length / 2, Config.Runway.Width / 2
	task.spawn(function()
		while true do
			task.wait(1)
			for _, p in Players:GetPlayers() do
				local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
				local profileReady = p:GetAttribute("Ready")
				if root and profileReady and not p:GetAttribute("InDuel") then
					local pos = root.Position
					local onRunway = math.abs(pos.X) <= halfLength and math.abs(pos.Z) <= halfWidth and pos.Y < 8
					local walking = root.AssemblyLinearVelocity.Magnitude > 4
					p:SetAttribute("OnRunway", onRunway)
					if onRunway and walking then
						local perSecond = math.max(2, Stats.score(p) * Config.Runway.AuraPerScore)
						Stats.addAuraFractional(p, perSecond * Stats.eventMult("RunwayMult"))
					end
				end
			end
		end
	end)
end

return Runway
]=====])
put("ModuleScript", "Shards", modules, [=====[
-- GLOW UP: the Aura shards floating around the district. Walk near one to collect it.
-- Chaining pickups quickly builds a multiplier.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")
local CollectionService = game:GetService("CollectionService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Stats = require(script.Parent.Stats)
local Quests = require(script.Parent.Quests)

local Shards = {}

local rng = Random.new()
local folder
local live = {} -- shard Part -> slot
local slots = {}

local function pickType(luck)
	local total, weights = 0, {}
	for i, t in Config.ShardTypes do
		local w = t.Weight * (i >= 3 and (1 + luck * 0.5) or 1)
		weights[i] = w
		total += w
	end
	local roll = rng:NextNumber() * total
	for i, t in Config.ShardTypes do
		roll -= weights[i]
		if roll <= 0 then
			return t
		end
	end
	return Config.ShardTypes[1]
end

local function rollMutation()
	for _, m in Config.ShardMutations do
		if rng:NextNumber() < m.Chance then
			return m
		end
	end
	return nil
end

local function spawn(slot)
	local t = pickType(slot.luck)
	local mut = rollMutation()
	local color = mut and mut.Color or t.Color
	local shard = Instance.new("Part")
	shard.Name = "Shard"
	shard.Shape = Enum.PartType.Ball
	shard.Size = Vector3.one * (1.4 + t.Scale + (mut and 0.5 or 0))
	shard.Material = Enum.Material.Neon
	shard.Color = color
	shard.Anchored = true
	shard.CanCollide = false
	shard.CanTouch = false
	shard.CanQuery = false
	shard.CastShadow = false
	shard.Position = slot.pos
	shard:SetAttribute("Value", t.Value * (mut and mut.Mult or 1))
	shard:SetAttribute("Tier", t.Name)
	shard:SetAttribute("Mut", mut and mut.Name or nil)

	local light = Instance.new("PointLight")
	light.Color = color
	light.Range = 8 + t.Scale * 6
	light.Brightness = 1.4
	light.Parent = shard

	local e = Instance.new("ParticleEmitter")
	e.Color = ColorSequence.new(color)
	e.LightEmission = 1
	e.Rate = 4 + math.sqrt(t.Value) + (mut and 16 or 0)
	e.Lifetime = NumberRange.new(1.5, 3)
	e.Speed = NumberRange.new(1, 2)
	e.SpreadAngle = Vector2.new(180, 180)
	e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.35), NumberSequenceKeypoint.new(1, 0) })
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(1, 1) })
	e.Parent = shard

	CollectionService:AddTag(shard, "Shard")
	shard.Parent = folder
	live[shard] = slot
end

function Shards.build(slotPositions)
	folder = Instance.new("Folder")
	folder.Name = "Shards"
	folder.Parent = workspace
	for _, pos in slotPositions do
		local slot = { pos = pos, luck = 0 }
		table.insert(slots, slot)
		spawn(slot)
	end
end

-- A burst of rich temporary shards (Shard Storm event).
function Shards.storm(count)
	local r = Config.PlazaRadius - 10
	for _ = 1, count do
		local a = rng:NextNumber() * math.pi * 2
		local d = math.sqrt(rng:NextNumber()) * r
		spawn({ pos = Vector3.new(math.cos(a) * d, 3.2, math.sin(a) * d), luck = 6, temp = true })
	end
end

function Shards.clearTemp()
	for shard, slot in live do
		if slot.temp then
			live[shard] = nil
			shard:Destroy()
		end
	end
end

local function collect(p, shard, root)
	local slot = live[shard]
	if not slot then
		return
	end
	live[shard] = nil
	shard:SetAttribute("Taken", true)

	local now = workspace:GetServerTimeNow()
	local chain = p:GetAttribute("Chain") or 0
	if now > (p:GetAttribute("ChainExpire") or 0) then
		chain = 0
	end
	chain = math.min(chain + 1, Config.ChainMax)
	p:SetAttribute("Chain", chain)
	p:SetAttribute("ChainExpire", now + Config.ChainWindow)

	local rank = p:GetAttribute("Rank") or 1
	local base = shard:GetAttribute("Value") * Config.RankScaling(rank) * Config.ChainMult(chain)
	local gained = Stats.addAura(p, base)
	Stats.send(p, "shard", shard.Position, gained, shard:GetAttribute("Tier"), shard.Color, shard:GetAttribute("Mut"), chain)
	Quests.progress(p, "shards", 1)

	TweenService:Create(shard, TweenInfo.new(0.18, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
		Position = root.Position,
		Size = Vector3.one * 0.2,
	}):Play()
	Debris:AddItem(shard, 0.25)

	if not slot.temp then
		task.delay(Config.ShardRespawn, function()
			spawn(slot)
		end)
	end
end

function Shards.init()
	local acc = 0
	RunService.Heartbeat:Connect(function(dt)
		acc += dt
		if acc < 0.1 then
			return
		end
		acc = 0
		for _, p in Players:GetPlayers() do
			local char = p.Character
			local root = char and char:FindFirstChild("HumanoidRootPart")
			local hum = char and char:FindFirstChildOfClass("Humanoid")
			if root and hum and hum.Health > 0 then
				local radius = p:GetAttribute("MagnetRadius") or 9
				local pos = root.Position
				for shard in live do
					if (shard.Position - pos).Magnitude <= radius then
						collect(p, shard, root)
					end
				end
			end
		end
	end)
end

return Shards
]=====])
put("ModuleScript", "Shop", modules, [=====[
-- GLOW UP: upgrades and rebirth.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Shop = {}

local upgradeById = {}
for _, def in Config.Upgrades do
	upgradeById[def.Id] = def
end

function Shop.buy(p, id)
	local def = upgradeById[id]
	local profile = Data.get(p)
	if not def or not profile then
		return
	end
	local level = profile.Levels[id] or 0
	if level >= def.Max then
		return
	end
	if not Stats.spend(p, Config.UpgradeCost(def, level)) then
		Stats.toast(p, "Not enough Aura", "bad")
		return
	end
	profile.Levels[id] = level + 1
	p:SetAttribute("Lv_" .. id, level + 1)
	Stats.applyMovement(p)
	Stats.recompute(p)
	Stats.send(p, "upgrade", id, level + 1)
end

function Shop.rebirth(p)
	local profile = Data.get(p)
	if not profile then
		return
	end
	if Stats.score(p) < Config.RebirthRequirement(profile.Rebirths) then
		Stats.toast(p, "Reach a higher Glow Score to rebirth", "bad")
		return
	end
	profile.Rebirths += 1
	profile.Power, profile.Style, profile.Charm = 0, 0, 0
	profile.Levels = {}
	for _, def in Config.Upgrades do
		p:SetAttribute("Lv_" .. def.Id, 0)
	end
	Stats.setAura(p, 0)
	Stats.addFreeCrates(p, 2)
	Stats.applyMovement(p)
	Stats.recompute(p)
	Stats.send(p, "rebirth", profile.Rebirths)
end

function Shop.handle(p, kind, a)
	if kind == "Buy" and type(a) == "string" then
		Shop.buy(p, a)
	elseif kind == "Rebirth" then
		Shop.rebirth(p)
	end
end

return Shop
]=====])
put("ModuleScript", "Stats", modules, [=====[
-- GLOW UP: the heart of progression. Owns Aura, stats, Glow Score, rank and the
-- attributes the client reads. Every other system goes through here.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)

local Stats = {}

local function notify()
	return ReplicatedStorage:WaitForChild("Net"):WaitForChild("Notify")
end

--------------------------------------------------------------------------------
-- Small helpers
--------------------------------------------------------------------------------
function Stats.toast(p, text, kind)
	notify():FireClient(p, "toast", text, kind or "info")
end

function Stats.send(p, ...)
	notify():FireClient(p, ...)
end

local function currentEvent()
	local id = workspace:GetAttribute("Event")
	return id and id ~= "" and Config.EventById[id] or nil
end

function Stats.eventMult(kind)
	local ev = currentEvent()
	return ev and ev[kind] or 1
end

--------------------------------------------------------------------------------
-- Derived values
--------------------------------------------------------------------------------
function Stats.level(p, id)
	local profile = Data.get(p)
	return profile and profile.Levels[id] or 0
end

function Stats.computeScore(profile)
	local statTotal = profile.Power + profile.Style + profile.Charm
	local total = statTotal * Config.StatScore
	for slot, id in profile.Eq do
		local c = Config.CosmeticById[id]
		local stars = profile.Inv[id]
		if c and stars then
			total += Config.CosmeticPower(c, stars)
		end
	end
	return math.floor(total * Config.RebirthMult(profile.Rebirths))
end

function Stats.computeRate(profile)
	local total = 0
	for slot, id in profile.Eq do
		local c = Config.CosmeticById[id]
		local stars = profile.Inv[id]
		if c and stars then
			total += Config.CosmeticAps(c, stars)
		end
	end
	return total * Config.RebirthMult(profile.Rebirths) * Config.BoostMult(profile.Levels.Boost or 0)
end

function Stats.score(p)
	return p:GetAttribute("GlowScore") or 0
end

--------------------------------------------------------------------------------
-- Attribute mirror (what the client sees)
--------------------------------------------------------------------------------
local function setLeaderstat(p, name, value)
	local ls = p:FindFirstChild("leaderstats")
	local v = ls and ls:FindFirstChild(name)
	if v then
		v.Value = value
	end
end

function Stats.recompute(p)
	local profile = Data.get(p)
	if not profile then
		return
	end
	local oldRank = p:GetAttribute("Rank") or 1
	local score = Stats.computeScore(profile)
	local rank = Config.RankFor(score)

	p:SetAttribute("GlowScore", score)
	p:SetAttribute("AuraRate", Stats.computeRate(profile))
	p:SetAttribute("Rank", rank)
	p:SetAttribute("Power", math.floor(profile.Power * 10) / 10)
	p:SetAttribute("Style", math.floor(profile.Style * 10) / 10)
	p:SetAttribute("Charm", math.floor(profile.Charm * 10) / 10)
	p:SetAttribute("Rebirths", profile.Rebirths)
	setLeaderstat(p, "Glow", score)
	setLeaderstat(p, "Rebirths", profile.Rebirths)

	if rank > oldRank and p:GetAttribute("Ready") then
		Stats.send(p, "rank", rank)
	end
	local magnet = Config.MagnetRadius(profile.Levels.Magnet or 0)
	p:SetAttribute("MagnetRadius", magnet)
end

function Stats.init(p)
	local profile = Data.get(p)

	local ls = Instance.new("Folder")
	ls.Name = "leaderstats"
	for _, name in { "Aura", "Glow", "Rebirths" } do
		local v = Instance.new("IntValue")
		v.Name = name
		v.Parent = ls
	end
	ls.Parent = p

	p:SetAttribute("Aura", math.floor(profile.Aura))
	setLeaderstat(p, "Aura", math.floor(profile.Aura))
	for _, def in Config.Upgrades do
		p:SetAttribute("Lv_" .. def.Id, profile.Levels[def.Id] or 0)
	end
	p:SetAttribute("FreeCrates", profile.FreeCrates)
	for _, crate in Config.Crates do
		if crate.PityAfter then
			p:SetAttribute("Pity_" .. crate.Id, profile.Pity[crate.Id] or 0)
		end
	end
	p:SetAttribute("Wins", profile.Wins)
	p:SetAttribute("DuelStreak", 0)
	p:SetAttribute("Chain", 0)
	p:SetAttribute("ChainExpire", 0)
	for key, value in profile.Settings do
		p:SetAttribute("Set_" .. key, value)
	end
	Stats.recompute(p)
	p:SetAttribute("Ready", true)
end

--------------------------------------------------------------------------------
-- Aura
--------------------------------------------------------------------------------
function Stats.getAura(p)
	local profile = Data.get(p)
	return profile and profile.Aura or 0
end

local function writeAura(p, profile)
	profile.Aura = math.max(0, profile.Aura)
	local shown = math.floor(profile.Aura)
	p:SetAttribute("Aura", shown)
	setLeaderstat(p, "Aura", shown)
end

-- Adds Aura including every multiplier. opts.raw skips multipliers. Returns the amount given.
function Stats.addAura(p, base, opts)
	local profile = Data.get(p)
	if not profile then
		return 0
	end
	local amount = base
	if not (opts and opts.raw) then
		amount = base
			* Config.RebirthMult(profile.Rebirths)
			* Config.BoostMult(profile.Levels.Boost or 0)
			* Stats.eventMult("AuraMult")
	end
	amount = math.max(0, math.floor(amount + 0.5))
	profile.Aura += amount
	writeAura(p, profile)
	return amount
end

-- Fractional income (runway, idle rate) accumulates here so small amounts aren't lost.
local fractions = {}
function Stats.addAuraFractional(p, base, opts)
	local profile = Data.get(p)
	if not profile then
		return 0
	end
	local amount = base
	if not (opts and opts.raw) then
		amount = base * Config.RebirthMult(profile.Rebirths) * Stats.eventMult("AuraMult")
	end
	local acc = (fractions[p] or 0) + amount
	local whole = math.floor(acc)
	fractions[p] = acc - whole
	if whole > 0 then
		profile.Aura += whole
		writeAura(p, profile)
	end
	return whole
end

function Stats.spend(p, cost)
	local profile = Data.get(p)
	if not profile or profile.Aura < cost then
		return false
	end
	profile.Aura -= cost
	writeAura(p, profile)
	return true
end

function Stats.setAura(p, value)
	local profile = Data.get(p)
	if profile then
		profile.Aura = value
		writeAura(p, profile)
	end
end

function Stats.addStat(p, stat, amount)
	local profile = Data.get(p)
	if not profile or profile[stat] == nil then
		return
	end
	profile[stat] += amount
	Stats.recompute(p)
end

function Stats.addFreeCrates(p, n)
	local profile = Data.get(p)
	profile.FreeCrates += n
	p:SetAttribute("FreeCrates", profile.FreeCrates)
end

function Stats.setSetting(p, key, value)
	local profile = Data.get(p)
	if profile and profile.Settings[key] ~= nil then
		profile.Settings[key] = value and true or false
		p:SetAttribute("Set_" .. key, profile.Settings[key])
	end
end

--------------------------------------------------------------------------------
-- Movement
--------------------------------------------------------------------------------
function Stats.applyMovement(p)
	local profile = Data.get(p)
	local hum = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
	if not profile or not hum then
		return
	end
	hum.WalkSpeed = Config.WalkSpeed(profile.Levels.Boots or 0)
	hum.UseJumpPower = false
	hum.JumpHeight = 7.5
end

function Stats.forget(p)
	fractions[p] = nil
end

return Stats
]=====])
put("ModuleScript", "Training", modules, [=====[
-- GLOW UP: the training minigame. A marker sweeps a bar; hit the zone for stat gains.
-- The server picks the zone, computes where the marker was when you pressed, and grades it,
-- so the result can't be faked from the client.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Util = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Util"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)
local Quests = require(script.Parent.Quests)

local Training = {}

local rng = Random.new()
local sessions = {} -- Player -> session

local GOOD_WIDTH = 0.26
local PERFECT_WIDTH = 0.09
local REP_TIMEOUT = 5

local function newRep(session)
	session.rep += 1
	session.token += 1
	session.resolved = false
	session.speed = 0.9 + 0.15 * session.rep
	session.center = 0.3 + rng:NextNumber() * 0.4
	session.startedAt = workspace:GetServerTimeNow() + 1.1
	return {
		rep = session.rep,
		reps = Config.TrainReps,
		startedAt = session.startedAt,
		speed = session.speed,
		center = session.center,
		goodWidth = GOOD_WIDTH,
		perfectWidth = PERFECT_WIDTH,
	}
end

local resolve

local function armTimeout(p, session)
	local token = session.token
	task.delay(REP_TIMEOUT + 1.1, function()
		if sessions[p] == session and session.token == token and not session.resolved then
			resolve(p, session, "miss")
		end
	end)
end

resolve = function(p, session, grade)
	if session.resolved then
		return
	end
	session.resolved = true
	local profile = Data.get(p)
	local gain = 0

	if grade == "perfect" then
		session.streak += 1
	elseif grade == "miss" then
		session.streak = 0
	end

	if grade ~= "miss" and profile then
		local base = grade == "perfect" and 2 or 1
		local streakMult = 1 + math.min(session.streak, 5) * 0.1
		gain = base * Config.TrainMult(profile.Levels.Training or 0) * streakMult
		Stats.addStat(p, session.stat, gain)
		Stats.addAura(p, gain * 4 * Config.RankScaling(p:GetAttribute("Rank") or 1))
		profile.Reps += 1
		Quests.progress(p, "train", 1)
		if grade == "perfect" then
			profile.Perfects += 1
			Quests.progress(p, "perfect", 1)
		end
		session.total += gain
	end

	local nextRep
	local done = session.rep >= Config.TrainReps
	if not done then
		nextRep = newRep(session)
		armTimeout(p, session)
	end
	Stats.send(p, "trainRep", session.rep - (done and 0 or 1), grade, gain, session.streak, nextRep)
	if done then
		Stats.send(p, "trainEnd", session.stat, session.total)
		sessions[p] = nil
		p:SetAttribute("Training", false)
	end
end

function Training.start(p, stat)
	if sessions[p] or p:GetAttribute("InDuel") or not Config.Stats[stat] then
		return
	end
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	local session = {
		stat = stat,
		rep = 0,
		token = 0,
		streak = 0,
		total = 0,
		resolved = true,
		origin = root and root.Position,
	}
	sessions[p] = session
	p:SetAttribute("Training", true)
	local cfg = newRep(session)
	armTimeout(p, session)
	Stats.send(p, "trainStart", stat, cfg)
end

function Training.cancel(p)
	if sessions[p] then
		sessions[p] = nil
		p:SetAttribute("Training", false)
		Stats.send(p, "trainEnd", nil, 0)
	end
end

function Training.hit(p, clientTime)
	local session = sessions[p]
	if not session or session.resolved then
		return
	end
	local now = workspace:GetServerTimeNow()
	local t = type(clientTime) == "number" and clientTime or now
	t = math.clamp(t, now - 0.6, now)
	if t < session.startedAt then
		return
	end
	local marker = Util.tri((t - session.startedAt) * session.speed)
	local dist = math.abs(marker - session.center)
	local grade = "miss"
	if dist <= PERFECT_WIDTH / 2 then
		grade = "perfect"
	elseif dist <= GOOD_WIDTH / 2 then
		grade = "good"
	end
	resolve(p, session, grade)
end

function Training.init()
	-- Walking away from the station cancels the session.
	task.spawn(function()
		while true do
			task.wait(1)
			for p, session in sessions do
				local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
				if not root or (session.origin and (root.Position - session.origin).Magnitude > 22) then
					Training.cancel(p)
				end
			end
		end
	end)
end

function Training.release(p)
	sessions[p] = nil
end

function Training.handle(p, kind, a)
	if kind == "TrainHit" then
		Training.hit(p, a)
	elseif kind == "TrainCancel" then
		Training.cancel(p)
	end
end

return Training
]=====])
print("GLOW UP installer 3/7 done (" .. created .. " scripts). Now run installer 4.")

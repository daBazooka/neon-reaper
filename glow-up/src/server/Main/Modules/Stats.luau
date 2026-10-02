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

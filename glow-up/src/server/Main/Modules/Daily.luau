-- SUB 5 TO TRUE ADAM: 7-day login streak. Missing a day restarts the cycle.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Daily = {}

local function today()
	return os.time() // 86400
end

local function nextDay(profile)
	local d = profile.Daily
	if d.Last >= today() - 1 then
		return d.Streak % #Config.Daily + 1
	end
	return 1
end

function Daily.refresh(p)
	local profile = Data.get(p)
	if not profile then
		return
	end
	p:SetAttribute("DailyReady", profile.Daily.Last < today())
	p:SetAttribute("DailyDay", nextDay(profile))
	p:SetAttribute("DailyStreak", profile.Daily.Streak)
end

function Daily.claim(p)
	local profile = Data.get(p)
	if not profile or profile.Daily.Last >= today() then
		return
	end
	local day = nextDay(profile)
	local reward = Config.Daily[day]
	local aura = reward.Aura * (1 + profile.Rebirths)
	profile.Daily.Streak = profile.Daily.Last == today() - 1 and profile.Daily.Streak + 1 or 1
	profile.Daily.Last = today()
	Stats.addAura(p, aura, { raw = true })
	if reward.Crates then
		Stats.addFreeCrates(p, reward.Crates)
	end
	Daily.refresh(p)
	Stats.send(p, "daily", day, aura, reward.Crates or 0)
end

return Daily

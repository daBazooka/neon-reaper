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

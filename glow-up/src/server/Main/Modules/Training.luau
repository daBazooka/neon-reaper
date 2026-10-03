-- SUB 5 TO TRUE ADAM: machine training. Every gym machine has its own mini-game, and the server grades all of them,
-- so results can't be faked from the client:
--   sweep  - a marker sweeps a bar; press while it is in the zone (dumbbell rack, mirror, rose)
--   hold   - hold to push, let go in the zone (bench press, squat rack)
--   rhythm - alternate Left / Right on the beat (cable machine, punching bag)
--   mash   - tap as fast as you can before the time runs out (pull-up bar)
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Util = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Util"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)
local Quests = require(script.Parent.Quests)
local Lift = require(script.Parent.Lift)

local Training = {}

local rng = Random.new()
local sessions = {} -- Player -> session

local GOOD_WIDTH = 0.26
local PERFECT_WIDTH = 0.09
local REP_TIMEOUT = 5
local BEAT_GOOD = 0.24
local BEAT_PERFECT = 0.09
local MASH_RATE = 10 -- taps per second that count
local COUNTDOWN = 1.1

local function serverNow()
	return workspace:GetServerTimeNow()
end

local function gradeByDistance(dist, perfectWidth, goodWidth)
	if dist <= perfectWidth / 2 then
		return "perfect"
	elseif dist <= goodWidth / 2 then
		return "good"
	end
	return "miss"
end

local resolve

-- Runs `fn` after `seconds` if the session is still on the same rep.
local function later(p, session, seconds, fn)
	local token = session.token
	task.delay(seconds, function()
		if sessions[p] == session and session.token == token and not session.resolved then
			fn()
		end
	end)
end

--------------------------------------------------------------------------------
-- Modes: new(session) builds the next rep and returns (config for the client, seconds until it expires)
--------------------------------------------------------------------------------
local MODES = {}

MODES.sweep = {
	new = function(session)
		session.speed = 0.9 + 0.15 * session.rep
		session.center = 0.3 + rng:NextNumber() * 0.4
		session.startedAt = serverNow() + COUNTDOWN
		return {
			startedAt = session.startedAt,
			speed = session.speed,
			center = session.center,
			goodWidth = GOOD_WIDTH,
			perfectWidth = PERFECT_WIDTH,
		}, REP_TIMEOUT + COUNTDOWN
	end,
	timeout = function(p, session)
		resolve(p, session, "miss")
	end,
	hit = function(p, session, clientTime)
		local now = serverNow()
		local t = type(clientTime) == "number" and clientTime or now
		t = math.clamp(t, now - 0.6, now)
		if t < session.startedAt then
			return
		end
		local marker = Util.tri((t - session.startedAt) * session.speed)
		resolve(p, session, gradeByDistance(math.abs(marker - session.center), PERFECT_WIDTH, GOOD_WIDTH))
	end,
}

MODES.hold = {
	new = function(session)
		session.fill = math.max(0.9, 1.5 - 0.12 * session.rep)
		session.center = 0.5 + rng:NextNumber() * 0.35
		session.downAt = nil
		session.startedAt = serverNow() + COUNTDOWN
		return {
			startedAt = session.startedAt,
			fillTime = session.fill,
			center = session.center,
			goodWidth = 0.24,
			perfectWidth = 0.09,
		}, REP_TIMEOUT + COUNTDOWN
	end,
	timeout = function(p, session)
		resolve(p, session, "miss")
	end,
	down = function(p, session)
		local now = serverNow()
		if session.downAt or now < session.startedAt - 0.1 then
			return
		end
		session.downAt = now
		Lift.holdStart(p, session.fill)
		local mark = now
		-- holding far too long drops the bar
		later(p, session, session.fill * 1.3 + 0.25, function()
			if session.downAt == mark then
				resolve(p, session, "miss")
			end
		end)
	end,
	hit = function(p, session)
		if not session.downAt then
			return
		end
		local level = (serverNow() - session.downAt) / session.fill
		if level > 1.08 then
			resolve(p, session, "miss")
		else
			resolve(p, session, gradeByDistance(math.abs(math.min(level, 1) - session.center), 0.09, 0.24))
		end
	end,
}

MODES.rhythm = {
	new = function(session)
		local count = 4
		local lead = 1.4
		local gap = math.max(0.45, 0.72 - 0.05 * session.rep)
		session.startedAt = serverNow()
		session.beats = {}
		local list = {}
		local side = rng:NextNumber() < 0.5 and "L" or "R"
		for i = 1, count do
			local offset = lead + (i - 1) * gap
			table.insert(session.beats, { at = session.startedAt + offset, side = side, hit = nil })
			table.insert(list, { at = offset, side = side })
			if rng:NextNumber() < 0.75 then
				side = side == "L" and "R" or "L"
			end
		end
		session.lastBeat = lead + (count - 1) * gap
		return { startedAt = session.startedAt, beats = list, travel = 1.3, window = BEAT_GOOD }, session.lastBeat + 0.45
	end,
	timeout = function(p, session)
		MODES.rhythm.finish(p, session)
	end,
	finish = function(p, session)
		if session.resolved then
			return
		end
		local hits, perfects = 0, 0
		for _, beat in session.beats do
			if beat.hit then
				hits += 1
				if beat.hit == "perfect" then
					perfects += 1
				end
			end
		end
		local grade = "miss"
		if hits == #session.beats and perfects >= 3 then
			grade = "perfect"
		elseif hits >= 2 then
			grade = "good"
		end
		resolve(p, session, grade)
	end,
	hit = function(p, session, side, clientTime)
		if side ~= "L" and side ~= "R" then
			return
		end
		local now = serverNow()
		local t = type(clientTime) == "number" and clientTime or now
		t = math.clamp(t, now - 0.6, now)
		local best, bestDist, bestIndex
		for i, beat in session.beats do
			if not beat.hit and beat.side == side then
				local d = math.abs(t - beat.at)
				if d <= BEAT_GOOD + 0.04 and (not bestDist or d < bestDist) then
					best, bestDist, bestIndex = beat, d, i
				end
			end
		end
		if not best then
			return -- wrong side or off the beat: nothing happens
		end
		best.hit = bestDist <= BEAT_PERFECT and "perfect" or "good"
		Lift.beat(p, side, best.hit)
		Stats.send(p, "trainBeat", bestIndex, best.hit)
		for _, beat in session.beats do
			if not beat.hit and now < beat.at + BEAT_GOOD then
				return
			end
		end
		if now > session.beats[#session.beats].at - 0.05 then
			MODES.rhythm.finish(p, session)
		end
	end,
}

MODES.mash = {
	new = function(session)
		session.duration = 3.4
		session.target = 12 + 3 * session.rep
		session.count = 0
		session.tapTimes = {}
		session.startedAt = serverNow() + COUNTDOWN
		return { startedAt = session.startedAt, duration = session.duration, target = session.target }, COUNTDOWN + session.duration + 0.25
	end,
	timeout = function(p, session)
		MODES.mash.finish(p, session)
	end,
	finish = function(p, session)
		if session.resolved then
			return
		end
		local ratio = session.count / session.target
		resolve(p, session, ratio >= 1.25 and "perfect" or (ratio >= 1 and "good" or "miss"))
	end,
	hit = function(p, session)
		local now = serverNow()
		if now < session.startedAt or now > session.startedAt + session.duration + 0.15 then
			return
		end
		local recent = 0
		for i = #session.tapTimes, 1, -1 do
			if now - session.tapTimes[i] <= 1 then
				recent += 1
			else
				table.remove(session.tapTimes, i)
			end
		end
		if recent >= MASH_RATE then
			return
		end
		table.insert(session.tapTimes, now)
		session.count += 1
		Lift.mash(p, session.count / session.target)
	end,
}

--------------------------------------------------------------------------------
-- Reps
--------------------------------------------------------------------------------
local function newRep(session)
	session.rep += 1
	session.token += 1
	session.resolved = false
	local cfg, timeout = MODES[session.mode].new(session)
	cfg.mode = session.mode
	cfg.rep = session.rep
	cfg.reps = session.reps
	return cfg, timeout
end

local function arm(p, session, timeout)
	later(p, session, timeout, function()
		MODES[session.mode].timeout(p, session)
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
		session.misses += 1
	end

	if grade ~= "miss" and profile then
		local base = grade == "perfect" and 2 or 1
		local streakMult = 1 + math.min(session.streak, 5) * 0.1
		gain = base * (session.machine.Gain or 1) * Config.TrainMult(profile.Levels.Training or 0) * streakMult
		Stats.addStat(p, session.stat, gain)
		Stats.addAura(p, gain * 4 * Config.RankScaling(p:GetAttribute("Rank") or 1))
		Stats.addXP(p, gain * 10)
		profile.Reps += 1
		Quests.progress(p, "train", 1)
		if grade == "perfect" then
			profile.Perfects += 1
			Quests.progress(p, "perfect", 1)
		end
		session.total += gain
	end

	local mode = session.mode
	local repNumber = session.rep
	if mode == "sweep" then
		Lift.rep(p, grade, repNumber)
	elseif mode == "hold" then
		Lift.holdRelease(p, grade)
	elseif mode == "mash" then
		Lift.relax(p)
	end

	local nextRep
	local done = session.rep >= session.reps
	if not done then
		local cfg, timeout = newRep(session)
		nextRep = cfg
		arm(p, session, timeout)
	end
	Stats.send(p, "trainRep", repNumber, grade, gain, session.streak, nextRep)
	if done then
		-- a clean set (no misses) pays a 25% bonus
		local bonus = 0
		if session.misses == 0 and profile then
			bonus = session.total * 0.25
			Stats.addStat(p, session.stat, bonus)
			Stats.addAura(p, bonus * 4 * Config.RankScaling(p:GetAttribute("Rank") or 1))
			Stats.addXP(p, bonus * 10)
			session.total += bonus
		end
		-- beating your own best set on a machine is a record
		local record = false
		if profile then
			local best = profile.Records[session.machine.Id] or 0
			if session.total > best + 0.05 then
				profile.Records[session.machine.Id] = session.total
				record = best > 0
			end
		end
		Stats.send(p, "trainEnd", session.stat, session.total, bonus > 0, record)
		sessions[p] = nil
		p:SetAttribute("Training", false)
		task.delay(1.1, function()
			if not sessions[p] then
				Lift.stop(p)
			end
		end)
	end
end

--------------------------------------------------------------------------------
-- Public API
--------------------------------------------------------------------------------
-- machine: an entry of Config.GymMachines (or nil for the stat's default machine)
function Training.start(p, stat, machine)
	if sessions[p] or p:GetAttribute("InDuel") or not Config.Stats[stat] then
		return
	end
	machine = machine or Config.StatMachines[stat] or Config.GymMachineById.rack
	if not MODES[machine.Mode] then
		return
	end
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	local session = {
		stat = stat,
		machine = machine,
		mode = machine.Mode,
		reps = machine.Reps or Config.TrainReps,
		rep = 0,
		token = 0,
		streak = 0,
		misses = 0,
		total = 0,
		resolved = true,
		origin = machine.Local and Config.MachinePos(machine) or (root and root.Position),
	}
	sessions[p] = session
	p:SetAttribute("Training", true)
	Lift.begin(p, machine)
	local cfg, timeout = newRep(session)
	arm(p, session, timeout)
	Stats.send(p, "trainStart", stat, cfg, p:GetAttribute("LiftKg"), p:GetAttribute("LiftTier"), machine.Id)
end

function Training.cancel(p)
	if sessions[p] then
		sessions[p] = nil
		p:SetAttribute("Training", false)
		Stats.send(p, "trainEnd", nil, 0)
	end
	Lift.stop(p)
end

-- "TrainHit": the press / release / tap. a and b depend on the mode (see MODES).
function Training.hit(p, a, b)
	local session = sessions[p]
	if not session or session.resolved then
		return
	end
	MODES[session.mode].hit(p, session, a, b)
end

-- "TrainDown": the start of a hold.
function Training.down(p)
	local session = sessions[p]
	if not session or session.resolved then
		return
	end
	local mode = MODES[session.mode]
	if mode.down then
		mode.down(p, session)
	end
end

function Training.init()
	-- Walking away from the station cancels the session; the safety net frees anyone left frozen at a machine.
	task.spawn(function()
		while true do
			task.wait(1)
			for p, session in sessions do
				local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
				if not root or (session.origin and (root.Position - session.origin).Magnitude > 24) then
					Training.cancel(p)
				end
			end
			Lift.sweep()
		end
	end)
end

function Training.release(p)
	sessions[p] = nil
	Lift.stop(p)
end

function Training.handle(p, kind, a, b)
	if kind == "TrainHit" then
		Training.hit(p, a, b)
	elseif kind == "TrainDown" then
		Training.down(p)
	elseif kind == "TrainCancel" then
		Training.cancel(p)
	end
end

return Training

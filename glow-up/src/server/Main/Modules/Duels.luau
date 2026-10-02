-- SUB 5 TO TRUE ADAM: "mog" duels. Two players (or a player and a bot) face off in a 7-second tap battle.
-- Your Glow Score gives you an edge, but a fast tapper can upset a higher-ranked rival.
-- Losing never costs you anything: you still get a consolation reward.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)
local Quests = require(script.Parent.Quests)

local Duels = {}

local rng = Random.new()
local arena -- { padA = CFrame, padB = CFrame, center = Vector3 }
local battleArena -- same, for the stage-battle lane
local queue = {} -- ordered list of waiting players
local duelOf = {} -- Player -> duel
local lastEnd = {} -- Player -> os.clock() of last duel end

function Duels.setArena(info, battle)
	arena = info
	battleArena = battle
end

local function removeFromQueue(p)
	local i = table.find(queue, p)
	if i then
		table.remove(queue, i)
	end
end

local function canDuel(p, forBattle)
	local profile = Data.get(p)
	if not profile or not (forBattle and battleArena or arena) then
		return false, "Duels aren't ready yet"
	end
	if not forBattle and not profile.Settings.Duels then
		return false, "Turn Duels on in Settings first"
	end
	if duelOf[p] or p:GetAttribute("InDuel") then
		return false, "You're already in a duel"
	end
	if p:GetAttribute("Training") then
		return false, "Finish training first"
	end
	if lastEnd[p] and os.clock() - lastEnd[p] < Config.Duel.Cooldown then
		return false, "Catch your breath for a second"
	end
	return true
end

local function setFrozen(p, frozen)
	local hum = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
	if not hum then
		return
	end
	if frozen then
		hum.WalkSpeed = 0
		hum.JumpHeight = 0
	else
		Stats.applyMovement(p)
	end
end

local function place(p, cf, where)
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if root then
		root.AssemblyLinearVelocity = Vector3.zero
		root.CFrame = CFrame.lookAt(cf.Position + Vector3.new(0, 3, 0), where.center + Vector3.new(0, 3, 0))
	end
end

local function effort(taps, myScore, oppScore)
	local maxTaps = Config.Duel.MaxTapsPerSecond * Config.Duel.Length
	local share = myScore / math.max(1, myScore + oppScore)
	return (math.min(taps, maxTaps) / maxTaps) * 50 + share * 50
end

local function finish(duel)
	if duel.over then
		return
	end
	duel.over = true
	local a, b = duel.a, duel.b
	local ta, tb = duel.tapsA, duel.tapsB

	local ea = effort(ta, duel.scoreA, duel.scoreB) * (0.94 + rng:NextNumber() * 0.12)
	local eb = effort(tb, duel.scoreB, duel.scoreA) * (0.94 + rng:NextNumber() * 0.12)
	local aWins = ea >= eb

	local function settle(p, wins, oppScore, myTaps, oppTaps, myEff, oppEff)
		if not p or p.Parent == nil then
			return
		end
		local profile = Data.get(p)
		if not profile then
			return
		end
		duelOf[p] = nil
		lastEnd[p] = os.clock()
		p:SetAttribute("InDuel", false)
		setFrozen(p, false)

		local reward = 60 + oppScore * 0.35
		local stage = duel.stage
		if stage then
			local def = Config.Battle.Stages[stage]
			reward = def.Reward
			local first = wins and stage > (profile.Stage or 0)
			if first then
				profile.Stage = stage
				p:SetAttribute("Stage", stage)
				Stats.addFreeCrates(p, stage % 5 == 0 and 2 or 0)
			else
				reward *= 0.4
			end
			Stats.send(p, "stageResult", stage, wins, first, profile.Stage or 0)
		end
		if wins then
			local streak = (p:GetAttribute("DuelStreak") or 0) + 1
			p:SetAttribute("DuelStreak", streak)
			profile.Wins += 1
			profile.BestStreak = math.max(profile.BestStreak, streak)
			p:SetAttribute("Wins", profile.Wins)
			reward *= 1 + math.min(streak - 1, 10) * 0.1
			Quests.progress(p, "duel", 1)
		else
			p:SetAttribute("DuelStreak", 0)
			reward *= 0.25
		end
		profile.Duels += 1
		Stats.addXP(p, wins and (40 + oppScore * 0.05) or 15)
		reward *= Stats.eventMult("DuelMult")
		local given = Stats.addAura(p, math.max(10, reward))
		Stats.send(p, "duelEnd", wins, given, myTaps, oppTaps, myEff, oppEff, p:GetAttribute("DuelStreak") or 0)
	end

	settle(a, aWins, duel.scoreB, ta, tb, ea, eb)
	settle(b, not aWins, duel.scoreA, tb, ta, eb, ea)
end

local function startDuel(a, b, opts)
	opts = opts or {}
	local where = opts.arena or arena
	removeFromQueue(a)
	if b then
		removeFromQueue(b)
	end
	local cfg = Config.Duel
	local now = workspace:GetServerTimeNow()
	local scoreA = Stats.score(a)
	local scoreB = opts.score or (b and Stats.score(b))
	if not scoreB then
		local streak = a:GetAttribute("DuelStreak") or 0
		scoreB = math.max(20, math.floor(scoreA * (0.75 + rng:NextNumber() * 0.5) * (1 + math.min(streak, 6) * 0.04)))
	end

	local duel = {
		a = a,
		b = b,
		scoreA = scoreA,
		scoreB = scoreB,
		tapsA = 0,
		tapsB = 0,
		tStart = now + cfg.Countdown,
		tEnd = now + cfg.Countdown + cfg.Length,
		botRate = opts.rate or (6 + rng:NextNumber() * 4),
		stage = opts.stage,
		over = false,
	}
	duelOf[a] = duel
	a:SetAttribute("InDuel", true)
	place(a, where.padA, where)
	setFrozen(a, true)
	if b then
		duelOf[b] = duel
		b:SetAttribute("InDuel", true)
		place(b, where.padB, where)
		setFrozen(b, true)
	end

	local function info(p)
		return p and { p.DisplayName, p:GetAttribute("Rank") or 1 } or { opts.name or "Mogger Bot", opts.rank or Config.RankFor(math.max(1, math.floor(scoreB / 10))) }
	end
	local ia, ib = info(a), info(b)
	Stats.send(a, "duelStart", ib[1], ib[2], scoreB, scoreA, duel.tStart, cfg.Length)
	if b then
		Stats.send(b, "duelStart", ia[1], ia[2], scoreA, scoreB, duel.tStart, cfg.Length)
	end

	-- Live progress for both sides (and the bot's simulated taps).
	task.spawn(function()
		while not duel.over do
			task.wait(0.25)
			local t = workspace:GetServerTimeNow()
			if not b and t > duel.tStart then
				local elapsed = math.min(t, duel.tEnd) - duel.tStart
				duel.tapsB = math.floor(elapsed * duel.botRate)
			end
			if a.Parent then
				Stats.send(a, "duelProgress", duel.tapsB)
			end
			if b and b.Parent then
				Stats.send(b, "duelProgress", duel.tapsA)
			end
		end
	end)
	task.delay(cfg.Countdown + cfg.Length + 0.5, function()
		finish(duel)
	end)
end

function Duels.joinQueue(p)
	local ok, why = canDuel(p)
	if not ok then
		if table.find(queue, p) then
			removeFromQueue(p)
			Stats.toast(p, "Left the duel queue", "info")
		else
			Stats.toast(p, why, "bad")
		end
		return
	end
	if table.find(queue, p) then
		removeFromQueue(p)
		Stats.toast(p, "Left the duel queue", "info")
		return
	end
	for _, other in queue do
		if other ~= p and other.Parent and canDuel(other) then
			startDuel(other, p)
			return
		end
	end
	table.insert(queue, p)
	Stats.toast(p, "Searching for a rival... a bot steps in after " .. Config.Duel.QueueBotAfter .. "s", "info")
	task.delay(Config.Duel.QueueBotAfter, function()
		if table.find(queue, p) and p.Parent and canDuel(p) then
			startDuel(p, nil)
		end
	end)
end

-- One of the 15 stage battles. Only the next unbeaten stage (or any earlier one) can be fought.
function Duels.stageFight(p)
	local ok, why = canDuel(p, true)
	if not ok then
		Stats.toast(p, why, "bad")
		return
	end
	local profile = Data.get(p)
	local cleared = profile.Stage or 0
	local stage = math.min(cleared + 1, Config.Battle.Count)
	local def = Config.Battle.Stages[stage]
	startDuel(p, nil, {
		arena = battleArena,
		stage = stage,
		name = "Stage " .. stage .. ": " .. def.Name,
		rank = def.Rank,
		score = def.Power,
		rate = def.Rate,
	})
	if battleArena.setOpponent then
		battleArena.setOpponent(def)
	end
end

function Duels.duelBot(p)
	local ok, why = canDuel(p)
	if not ok then
		Stats.toast(p, why, "bad")
		return
	end
	startDuel(p, nil)
end

function Duels.taps(p, n)
	local duel = duelOf[p]
	if not duel or duel.over or type(n) ~= "number" then
		return
	end
	local now = workspace:GetServerTimeNow()
	if now < duel.tStart - 0.1 or now > duel.tEnd + 0.2 then
		return
	end
	local elapsed = math.max(0, now - duel.tStart)
	local allowed = Config.Duel.MaxTapsPerSecond * elapsed + 4
	n = math.clamp(math.floor(n), 0, 20)
	if duel.a == p then
		duel.tapsA = math.min(duel.tapsA + n, allowed)
	else
		duel.tapsB = math.min(duel.tapsB + n, allowed)
	end
end

function Duels.release(p)
	removeFromQueue(p)
	local duel = duelOf[p]
	duelOf[p] = nil
	lastEnd[p] = nil
	if duel and not duel.over then
		-- A player who leaves forfeits; the other side is paid out immediately.
		if duel.a == p then
			duel.tapsA = 0
		else
			duel.tapsB = 0
		end
		finish(duel)
	end
end

function Duels.handle(p, kind, a)
	if kind == "DuelTaps" then
		Duels.taps(p, a)
	end
end

return Duels

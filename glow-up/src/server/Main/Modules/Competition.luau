-- SUB 5 TO TRUE ADAM: the Mog Competition. Every few minutes entries open at the central stage.
-- Everyone who entered flexes (taps) for 8 seconds; the higher your Mog Power and the faster you
-- tap, the higher you place. Bots fill the field so it always feels like a crowd.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Util = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Util"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Competition = {}

local cfg = Config.Competition
local rng = Random.new()
local stage -- { center = Vector3 }
local board -- TextLabel on the stage screen
local entrants = {} -- Player -> true
local battle -- active battle table
local state = "idle"

function Competition.setStage(info, boardLabel)
	stage = info
	board = boardLabel
end

local function setState(newState, endsAt)
	state = newState
	workspace:SetAttribute("CompState", newState)
	workspace:SetAttribute("CompEnd", endsAt or 0)
end

local function setBoard(text)
	if board then
		board.Text = text
	end
end

local function sayAll(...)
	for _, p in Players:GetPlayers() do
		if p:GetAttribute("Ready") then
			Stats.send(p, ...)
		end
	end
end

local function validEntrant(p)
	return p.Parent ~= nil and p:GetAttribute("Ready") and not p:GetAttribute("InDuel")
end

function Competition.enter(p)
	if state ~= "open" then
		local left = math.max(0, (workspace:GetAttribute("CompEnd") or 0) - workspace:GetServerTimeNow())
		Stats.toast(p, "Entries are closed. Next competition in " .. Util.clock(left), "info")
		return
	end
	if entrants[p] then
		Stats.toast(p, "You're already entered. Stay near the stage!", "info")
		return
	end
	if p:GetAttribute("InDuel") or p:GetAttribute("Training") then
		Stats.toast(p, "Finish what you're doing first", "bad")
		return
	end
	entrants[p] = true
	Stats.toast(p, "You're in the Mog Competition! Stay near the stage", "good")
end

function Competition.taps(p, n)
	if not battle or battle.over or type(n) ~= "number" then
		return
	end
	local entry = battle.byPlayer[p]
	if not entry then
		return
	end
	local now = workspace:GetServerTimeNow()
	if now < battle.tStart - 0.1 or now > battle.tEnd + 0.2 then
		return
	end
	local allowed = Config.Duel.MaxTapsPerSecond * math.max(0, now - battle.tStart) + 4
	entry.taps = math.min(entry.taps + math.clamp(math.floor(n), 0, 20), allowed)
end

--------------------------------------------------------------------------------
-- Battle
--------------------------------------------------------------------------------
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

local function placeOnStage(p, index, count)
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if root and stage then
		local x = (index - (count + 1) / 2) * 6
		local pos = stage.center + Vector3.new(x, 3.5, 4)
		root.AssemblyLinearVelocity = Vector3.zero
		root.CFrame = CFrame.lookAt(pos, pos + Vector3.new(0, 0, 1))
	end
end

local function ranking(entries, forPlayer)
	local sorted = table.clone(entries)
	table.sort(sorted, function(a, b)
		return a.taps > b.taps
	end)
	local out = {}
	for i = 1, math.min(6, #sorted) do
		out[i] = { n = sorted[i].name, t = sorted[i].taps, m = sorted[i].player == forPlayer }
	end
	return out
end

local function finish(b)
	b.over = true
	local maxTaps = Config.Duel.MaxTapsPerSecond * cfg.Length
	local topScore = 1
	for _, e in b.entries do
		topScore = math.max(topScore, e.score)
	end
	for _, e in b.entries do
		e.points = (math.min(e.taps, maxTaps) / maxTaps) * 40 + (e.score / topScore) * 60
		e.points *= 0.95 + rng:NextNumber() * 0.1
	end
	table.sort(b.entries, function(x, y)
		return x.points > y.points
	end)

	local summary = {}
	for i = 1, math.min(5, #b.entries) do
		summary[i] = { n = b.entries[i].name, p = math.floor(b.entries[i].points + 0.5) }
	end

	for place, e in b.entries do
		local p = e.player
		if p then
			setFrozen(p, false)
			p:SetAttribute("InDuel", false)
			if p.Parent then
				local profile = Data.get(p)
				if profile then
					local multiplier = place == 1 and 3 or place == 2 and 2 or place == 3 and 1.4 or 0.6
					local aura = Stats.addAura(p, (200 + topScore * 0.5) * multiplier)
					local xp = (place == 1 and 400) or (place == 2 and 250) or (place == 3 and 150) or 80
					if place == 1 then
						Stats.addFreeCrates(p, 1)
						profile.Wins += 1
						p:SetAttribute("Wins", profile.Wins)
					end
					Stats.addXP(p, xp)
					Stats.send(p, "compEnd", place, #b.entries, aura, place == 1, summary)
				end
			end
		end
	end
	battle = nil
end

local function runBattle()
	local humans = {}
	for p in entrants do
		if validEntrant(p) then
			table.insert(humans, p)
		end
	end
	entrants = {}
	if #humans == 0 then
		setBoard("No entrants this time.\nNext competition soon!")
		return
	end

	local avgScore = 0
	for _, p in humans do
		avgScore += Stats.score(p)
	end
	avgScore /= #humans

	local entries = {}
	local byPlayer = {}
	for _, p in humans do
		local entry = { player = p, name = p.DisplayName, score = Stats.score(p), taps = 0 }
		table.insert(entries, entry)
		byPlayer[p] = entry
	end
	local botIndex = 0
	while #entries < cfg.MinFieldSize do
		botIndex += 1
		table.insert(entries, {
			name = cfg.BotNames[(botIndex - 1) % #cfg.BotNames + 1],
			score = math.max(20, avgScore * (0.6 + rng:NextNumber() * 0.8)),
			taps = 0,
			rate = 5 + rng:NextNumber() * 5,
		})
	end

	local now = workspace:GetServerTimeNow()
	local b = {
		entries = entries,
		byPlayer = byPlayer,
		tStart = now + cfg.Countdown,
		tEnd = now + cfg.Countdown + cfg.Length,
		over = false,
	}
	battle = b
	setState("battle", b.tEnd)

	for i, p in humans do
		p:SetAttribute("InDuel", true)
		placeOnStage(p, i, #humans)
		setFrozen(p, true)
		local roster = {}
		for _, e in entries do
			table.insert(roster, { n = e.name, s = math.floor(e.score), m = e.player == p })
		end
		Stats.send(p, "compStart", b.tStart, cfg.Length, roster)
	end
	setBoard("MOG COMPETITION\nIN PROGRESS!")

	while workspace:GetServerTimeNow() < b.tEnd + 0.4 do
		task.wait(0.4)
		local t = workspace:GetServerTimeNow()
		for _, e in entries do
			if e.rate and t > b.tStart then
				e.taps = math.floor((math.min(t, b.tEnd) - b.tStart) * e.rate)
			end
		end
		for _, p in humans do
			if p.Parent then
				Stats.send(p, "compProgress", ranking(entries, p))
			end
		end
	end
	finish(b)
	local top = b.entries[1]
	setBoard(string.format("WINNER: %s\n(%d points)", top.name, math.floor(top.points + 0.5)))
	task.wait(8)
end

--------------------------------------------------------------------------------
-- Schedule
--------------------------------------------------------------------------------
function Competition.init()
	task.spawn(function()
		task.wait(20)
		while true do
			-- Waiting for the next one
			local nextAt = workspace:GetServerTimeNow() + cfg.Gap
			setState("idle", nextAt)
			while workspace:GetServerTimeNow() < nextAt do
				setBoard("MOG COMPETITION\nnext in " .. Util.clock(nextAt - workspace:GetServerTimeNow()))
				task.wait(1)
			end

			-- Entries open
			entrants = {}
			local closeAt = workspace:GetServerTimeNow() + cfg.EntryTime
			setState("open", closeAt)
			sayAll("toast", "🏆 MOG COMPETITION is open! Press E at the stage to enter", "gold")
			while workspace:GetServerTimeNow() < closeAt do
				local count = 0
				for _ in entrants do
					count += 1
				end
				setBoard(string.format("ENTRIES OPEN\n%s left  ·  %d entered", Util.clock(closeAt - workspace:GetServerTimeNow()), count))
				task.wait(1)
			end

			runBattle()
		end
	end)
end

function Competition.release(p)
	entrants[p] = nil
	if battle and battle.byPlayer[p] then
		battle.byPlayer[p].player = nil
	end
end

function Competition.handle(p, kind, a)
	if kind == "CompTaps" then
		Competition.taps(p, a)
	end
end

return Competition

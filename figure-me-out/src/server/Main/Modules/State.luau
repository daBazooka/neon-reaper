-- FIGURE ME OUT: who is in the match right now. Every player and bot in a match is an "entity" with an id (a player's
-- user id; bots count down from -1). This module only keeps the list and writes the
-- few attributes the screens read; the other modules do the playing.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local State = {}

State.phase = "lobby" -- lobby | countdown | play | results
State.phaseEnd = 0
State.entities = {} -- id -> entity
State.order = {} -- ids in the order they were added
State.decoys = {} -- id (1,000,000 and up) -> { id, owner, number, model, code, icon, expires }
State.revealing = false
State.playStart = -1e9 -- when the match began playing (the late-join window counts from here)
State.mode = Config.Modes.List.deathmatch -- the mode being played (a Config.Modes.List entry)
State.teamScore = { 0, 0 } -- team modes: hits (team deathmatch) or captures (capture the flag)
State.matchId = 0
State.onChange = nil -- set by Match: called when the alive list changes

function State.now()
	return workspace:GetServerTimeNow()
end

State.peak = 0 -- the most players this match has had at once (a match that never had two does not pay win rewards)

function State.add(e)
	State.entities[e.id] = e
	table.insert(State.order, e.id)
	State.peak = math.max(State.peak, #State.order)
end

function State.clear()
	State.peak = 0
	State.entities = {}
	State.order = {}
	State.decoys = {}
end

function State.get(id)
	return State.entities[id]
end

function State.byPlayer(p)
	return p and State.entities[p.UserId] or nil
end

function State.list()
	local list = {}
	for _, id in State.order do
		local e = State.entities[id]
		if e then
			table.insert(list, e)
		end
	end
	return list
end

function State.aliveList()
	local list = {}
	for _, id in State.order do
		local e = State.entities[id]
		if e and e.alive then
			table.insert(list, e)
		end
	end
	return list
end

function State.aliveCount()
	return #State.aliveList()
end

-- The digits of every number in use (so nobody gets a duplicate).
function State.takenNumbers()
	local taken = {}
	for _, e in State.entities do
		taken[e.number or ""] = true
	end
	for _, d in State.decoys do
		taken[d.number] = true
	end
	return taken
end

function State.setPhase(phase, endsAt)
	State.phase = phase
	State.phaseEnd = endsAt or 0
	State.writeWorld()
end

-- What every screen needs to know about the match.
function State.writeWorld()
	workspace:SetAttribute("Phase", State.phase)
	workspace:SetAttribute("PhaseEnd", State.phaseEnd)
	workspace:SetAttribute("Alive", State.aliveCount())
	workspace:SetAttribute("Total", #State.order)
	workspace:SetAttribute("Reveal", State.revealing)
	workspace:SetAttribute("MatchId", State.matchId)
	workspace:SetAttribute("Mode", State.mode.Id)
	workspace:SetAttribute("ModeName", State.mode.Name)
	workspace:SetAttribute("Team1Score", State.teamScore[1])
	workspace:SetAttribute("Team2Score", State.teamScore[2])
	workspace:SetAttribute("ScoreLimit", State.mode.ScoreLimit or State.mode.CaptureLimit or 0)
end

-- Per-entity attributes: shown to spectators and used by the HUD. Humans get them on the Player, bots on their model.
function State.writeEntity(e)
	local targets = {}
	if e.player then
		table.insert(targets, e.player)
	end
	if e.char then
		table.insert(targets, e.char)
	end
	for _, t in targets do
		t:SetAttribute("Alive", e.alive == true)
		t:SetAttribute("Lives", e.lives or 0)
		t:SetAttribute("Score", e.score or 0)
		t:SetAttribute("Protected", (e.protectedUntil or 0) > State.now())
		t:SetAttribute("Bounty", e.bounty == true)
		t:SetAttribute("Ally", e.ally or 0)
		t:SetAttribute("Team", e.team or 0)
		t:SetAttribute("Code", e.code or "")
		t:SetAttribute("Icon", e.icon or "")
		t:SetAttribute("EntityId", e.id)
	end
	local p = e.player
	if p then
		p:SetAttribute("Kills", e.kills or 0)
		p:SetAttribute("Bullets", e.bullets or 0)
		p:SetAttribute("Stunned", (e.stunUntil or 0) > State.now())
		p:SetAttribute("Exposed", (e.exposedUntil or 0) > State.now())
		for _, id in Config.CarriedItems do
			p:SetAttribute("It_" .. id, (e.items and e.items[id]) or 0)
		end
		-- the two item slots (F and G) and the strikes for covering your number or camping (shown as X marks)
		p:SetAttribute("SlotF", e.slots and e.slots.F.id or "")
		p:SetAttribute("SlotG", e.slots and e.slots.G.id or "")
		p:SetAttribute("Strikes", math.min(3, (e.violations or 0) + (e.campViolations or 0)))
		local stats = p:FindFirstChild("leaderstats")
		if stats and stats:FindFirstChild("Kills") then
			stats.Kills.Value = e.kills or 0
		end
	end
end

return State

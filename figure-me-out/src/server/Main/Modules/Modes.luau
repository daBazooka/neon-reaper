-- FIGURE ME OUT: the game modes. One framework, three rule sets (see Config.Modes): deathmatch, team deathmatch and capture the
-- flag. This module decides which mode the next match uses, splits people into teams, scores team hits and says when a match is over.
-- Guessing, gadgets, photos, bounties and everything else are shared by all modes.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local State = require(script.Parent.State)
local Flags = require(script.Parent.Flags)

local Modes = {}

local rng = Random.new()
Modes.next = "deathmatch" -- the mode of the upcoming match (shown in the lobby)

-- Chooses the mode of the upcoming match and announces it in the lobby.
function Modes.chooseNext()
	Modes.next = Rules.modeFor(Config.Modes.Mode, State.matchId + 1)
	workspace:SetAttribute("NextMode", Modes.next)
	workspace:SetAttribute("NextModeName", Config.Modes.List[Modes.next].Name)
	return Modes.next
end

-- Starts the mode for the match being set up.
function Modes.begin()
	State.mode = Config.Modes.List[Modes.next] or Config.Modes.List.deathmatch
	State.teamScore = { 0, 0 }
	if State.mode.Id == "ctf" then
		Flags.reset()
	else
		Flags.clear()
	end
	State.writeWorld()
	return State.mode
end

-- Assigns every entity a team (team modes). `list` is the entities, real players first.
function Modes.assignTeams(list)
	if not State.mode.Teams then
		return
	end
	local humans = 0
	for _, e in list do
		if e.player then
			humans += 1
		end
	end
	local teams = Rules.assignTeams(#list, humans, rng:NextInteger(1, 2))
	for i, e in list do
		e.team = teams[i]
		e.color = Config.Teams[e.team].Color
	end
end

-- A hit was scored: team deathmatch scores it for the killer's team, and a flag carrier who was hit drops the flag.
function Modes.onHit(killer, victim)
	Flags.dropCarried(victim, "hit")
	if State.mode.Id == "team" and killer.team and killer.team ~= victim.team then
		State.teamScore[killer.team] += 1
		State.writeWorld()
	end
end

function Modes.teamPoints()
	local points = { 0, 0 }
	for _, e in State.list() do
		if e.team then
			points[e.team] += e.score or 0
		end
	end
	return points
end

-- Is the match over (before the clock runs out)?
function Modes.over()
	local mode = State.mode
	local started = #State.order >= 2 -- (a match somebody plays alone, for practice, just runs until the clock ends)
	if not mode.Teams then
		return started and State.aliveCount() <= 1
	end
	if started then
		-- a team with nobody left in it has lost (everybody on it left the game)
		local alive = { 0, 0 }
		for _, e in State.aliveList() do
			if e.team then
				alive[e.team] += 1
			end
		end
		if alive[1] == 0 or alive[2] == 0 then
			return true
		end
	end
	local limit = mode.ScoreLimit or mode.CaptureLimit
	return State.teamScore[1] >= limit or State.teamScore[2] >= limit
end

-- The winning team (1 or 2), or 0 for a draw. Only for team modes.
function Modes.winningTeam()
	if #State.order >= 2 then
		local alive = { 0, 0 }
		for _, e in State.aliveList() do
			if e.team then
				alive[e.team] += 1
			end
		end
		if alive[1] == 0 and alive[2] > 0 then
			return 2
		elseif alive[2] == 0 and alive[1] > 0 then
			return 1
		end
	end
	return Rules.winningTeam(State.teamScore, Modes.teamPoints())
end

return Modes

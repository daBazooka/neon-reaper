-- FIGURE ME OUT: the map vote. From the moment a match ends until the lobby wait is over, everybody can vote for the next map
-- (one vote each, changeable). The map with the most votes is played; maps tied on votes are settled by a random pick among
-- the tied ones (and with no votes at all, any of the six can come up). The counts are shown live on everybody's screen.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Maps = require(Shared:WaitForChild("Maps"))
local Net = require(script.Parent.Net)

local Votes = {}

local rng = Random.new()
local open = false
local votes = {} -- userId -> map id
local players = {} -- userId -> player (so a vote can be shown on that player's own screen)
Votes.last = nil -- the map played last (a tie avoids it when there is anything else tied)

local function publish()
	local counts = Maps.tally(votes)
	workspace:SetAttribute("VoteCounts", Maps.encode(counts))
	local lead = Maps.winner(counts, 0, nil)
	workspace:SetAttribute("VoteLead", open and lead or "")
end

function Votes.isOpen()
	return open
end

function Votes.counts()
	return Maps.tally(votes)
end

-- Opens a fresh vote (everybody's old vote is cleared).
function Votes.open()
	if not Config.Vote.Enabled then
		return
	end
	for _, p in players do
		p:SetAttribute("MyVote", "")
	end
	votes, players = {}, {}
	open = true
	workspace:SetAttribute("VoteOpen", true)
	publish()
end

-- Somebody votes for a map. Returns true when the vote was counted.
function Votes.cast(p, id)
	if not open or type(id) ~= "string" or not Maps.List[id] or not p or not p.Parent then
		return false
	end
	votes[p.UserId] = id
	players[p.UserId] = p
	p:SetAttribute("MyVote", id)
	publish()
	return true
end

-- A player who leaves takes their vote back.
function Votes.leave(p)
	if votes[p.UserId] then
		votes[p.UserId] = nil
		players[p.UserId] = nil
		publish()
	end
end

-- Closes the vote and returns the map to play next: (map id, its votes, true when maps were tied).
-- `roll` is optional (a number in [0, 1)), for tests.
function Votes.close(roll)
	local counts = Maps.tally(votes)
	local id, best, tied = Maps.winner(counts, roll or rng:NextNumber(), Votes.last)
	open = false
	workspace:SetAttribute("VoteOpen", false)
	workspace:SetAttribute("VoteLead", "")
	for _, p in players do
		p:SetAttribute("MyVote", "")
	end
	Votes.last = id
	Net.sendAll("mapPicked", id, best, tied)
	votes, players = {}, {}
	publish()
	return id, best, tied
end

return Votes

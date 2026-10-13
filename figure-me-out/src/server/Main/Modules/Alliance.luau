-- FIGURE ME OUT: temporary alliances. Voluntary, short, and breakable: shooting your ally ends it (a betrayal). Allies get a
-- marker on each other and may choose to share what they know. Nothing here pays extra points, so it can't be farmed.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Vision = require(script.Parent.Vision)

local Alliance = {}

local offers = {} -- target id -> { from = id, expires = time }

local function label(e)
	return e.icon .. " " .. e.code
end

function Alliance.areAllies(a, b)
	return a ~= nil and b ~= nil and a.ally == b.id and b.ally == a.id
end

function Alliance.reset()
	offers = {}
end

local function clear(e)
	e.ally = nil
	e.allyUntil = nil
	State.writeEntity(e)
end

-- Ends the alliance for both. betrayal = true when `breaker` shot their ally.
function Alliance.betray(breaker, victim)
	if not Alliance.areAllies(breaker, victim) then
		return false
	end
	clear(breaker)
	clear(victim)
	breaker.allyBlockUntil = State.now() + Config.Alliance.ReAllyAfterBetrayal
	if victim.player then
		Net.send(victim.player, "ally", "betrayed", label(breaker), 0)
		Net.toast(victim.player, label(breaker) .. " BETRAYED you!", "bad")
	end
	if breaker.player then
		Net.send(breaker.player, "ally", "broken", label(victim), 0)
	end
	return true
end

-- Ends it politely (the player pressed the button, or time ran out).
function Alliance.dissolve(e, reason)
	local other = e.ally and State.entities[e.ally]
	clear(e)
	if other then
		clear(other)
		if other.player then
			Net.send(other.player, "ally", reason or "ended", label(e), 0)
		end
	end
	if e.player then
		Net.send(e.player, "ally", reason or "ended", other and label(other) or "", 0)
	end
end

-- `from` asks the player `toId` to team up.
function Alliance.propose(from, toId)
	local now = State.now()
	local to = State.entities[toId]
	if State.phase ~= "play" or not from or not from.alive or not from.player or not to or not to.alive or not to.player or to == from then
		return false
	end
	if State.mode.Teams then
		Net.toast(from.player, "Teams are fixed in this mode", "bad")
		return false
	end
	if from.ally or to.ally then
		if from.player then
			Net.toast(from.player, "One of you already has an ally", "bad")
		end
		return false
	end
	if (from.allyBlockUntil or 0) > now or (to.allyBlockUntil or 0) > now or (from.allyAskAt or -100) + 3 > now then
		Net.toast(from.player, "Not right now", "bad")
		return false
	end
	local a, b = Vision.head(from), Vision.head(to)
	if not a or not b or (a.Position - b.Position).Magnitude > Config.Alliance.Range or Vision.blocked(a.Position, b.Position, true) then
		Net.toast(from.player, "Get closer and make sure you can see them", "bad")
		return false
	end
	from.allyAskAt = now
	offers[to.id] = { from = from.id, expires = now + 15 }
	Net.send(to.player, "allyOffer", label(from), from.id)
	Net.toast(from.player, "Alliance offer sent to " .. label(to), "info")
	return true
end

-- `e` answers the offer from `fromId`.
function Alliance.respond(e, fromId, yes)
	local offer = offers[e.id]
	local from = State.entities[fromId]
	offers[e.id] = nil
	if not offer or offer.from ~= fromId or offer.expires < State.now() or not from or not from.alive or not e.alive then
		return false
	end
	if not yes then
		if from.player then
			Net.toast(from.player, label(e) .. " said no", "info")
		end
		return false
	end
	if from.ally or e.ally then
		return false
	end
	local untilT = State.now() + Config.Alliance.Duration
	from.ally, e.ally = e.id, from.id
	from.allyUntil, e.allyUntil = untilT, untilT
	State.writeEntity(from)
	State.writeEntity(e)
	Net.send(from.player, "ally", "on", label(e), Config.Alliance.Duration)
	Net.send(e.player, "ally", "on", label(from), Config.Alliance.Duration)
	return true
end

function Alliance.leave(e)
	if e.ally then
		Alliance.dissolve(e, "left")
	end
end

-- entries: { { id, text } } where text is like "4?7" (what the sender's notebook says). Allies may lie, so the receiver
-- decides what to believe: the server only checks the shape and that the two really are allies.
function Alliance.share(e, entries)
	local ally = e.ally and State.entities[e.ally]
	if not ally or not ally.player or not Alliance.areAllies(e, ally) or type(entries) ~= "table" then
		return false
	end
	local clean = {}
	for _, row in entries do
		if #clean >= Config.Alliance.MaxShare then
			break
		end
		if type(row) == "table" and type(row[1]) == "number" and type(row[2]) == "string" and string.match(row[2], "^[%d%?][%d%?][%d%?]$") then
			local about = State.entities[row[1]]
			if about and about ~= ally and about ~= e then
				table.insert(clean, { about.id, about.code, about.icon, row[2], 0 })
			end
		end
	end
	if #clean == 0 then
		return false
	end
	Net.send(ally.player, "shared", label(e), clean)
	return true
end

function Alliance.tick(now)
	for id, offer in offers do
		if offer.expires < now then
			offers[id] = nil
		end
	end
	for _, e in State.list() do
		if e.ally and ((e.allyUntil or 0) < now or not e.alive) then
			Alliance.dissolve(e, "ended")
		end
	end
end

return Alliance

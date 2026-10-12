-- FIGURE ME OUT: typing someone's number. Right = they lose a life. Wrong = you lose a bullet and freeze for a moment, and
-- the person you guessed gets an arrow pointing at you. All of it is decided here on the server.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Vision = require(script.Parent.Vision)
local Combat = require(script.Parent.Combat)
local Alliance = require(script.Parent.Alliance)

local Guess = {}

local function fail(e, text)
	if e.player then
		Net.toast(e.player, text, "bad")
		Net.send(e.player, "guessResult", "invalid")
	end
	return "invalid"
end

-- Core rule, used for players and bots. Returns "hit" | "miss" | or a reason it was refused.
function Guess.attempt(e, targetId, text)
	if State.phase ~= "play" or not e or not e.alive then
		return "closed"
	end
	local now = State.now()
	if (e.stunUntil or 0) > now then
		return "stunned"
	end
	if now - (e.lastGuess or -100) < Config.Guess.Cooldown then
		return "cooldown"
	end
	local digits = Rules.parseGuess(text)
	if not digits then
		return fail(e, "Type all 3 digits")
	end
	local target = State.entities[targetId]
	if not target or target == e or not target.alive then
		return fail(e, "Aim at someone first")
	end
	local from, to = Vision.head(e), Vision.head(target)
	if not from or not to then
		return fail(e, "Can't see them")
	end
	if (from.Position - to.Position).Magnitude > Config.Guess.MaxDistance or Vision.blocked(from.Position, to.Position, true) then
		return fail(e, "You can't see them")
	end
	if (target.protectedUntil or 0) > now then
		return fail(e, "They are protected for a moment")
	end
	if now - ((e.hitTimes or {})[target.id] or -1000) < Config.Lives.AntiFarm then
		return fail(e, "You just got them. Pick someone else")
	end
	if (e.bullets or 0) < 1 then
		return fail(e, "Out of bullets")
	end
	e.lastGuess = now
	if (e.bullets or 0) >= Config.Guess.Bullets then
		e.chargeSince = now
	end
	if Alliance.areAllies(e, target) then
		Alliance.betray(e, target) -- shooting your ally ends the deal (and tells them)
	end
	if digits == target.number then
		if e.player then
			Net.send(e.player, "guessResult", "hit")
		end
		Combat.strike(target, e, "guess")
		return "hit"
	end
	e.bullets -= 1
	Combat.stun(e, Config.Guess.Stun)
	State.writeEntity(e)
	if e.player then
		Net.send(e.player, "guessResult", "miss")
	end
	if target.player then
		Net.send(target.player, "snitch", from.Position, Config.Guess.WarnTime)
	end
	return "miss"
end

function Guess.handle(p, targetId, text)
	local e = State.byPlayer(p)
	if not e or type(targetId) ~= "number" then
		return "bad"
	end
	return Guess.attempt(e, targetId, text)
end

return Guess

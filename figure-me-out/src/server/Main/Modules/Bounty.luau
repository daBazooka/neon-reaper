-- FIGURE ME OUT: the bounty. One player at a time wears a 🎯 tag with a prize. Whoever gets them wins the prize, and a new
-- target is picked. The tag never shows the number.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Plates = require(script.Parent.Plates)

local Bounty = {}

local rng = Random.new()
local target = nil
local expires, nextAt = 0, 0
Bounty.paused = false -- tests switch the bounty off so scores are predictable
Bounty.multiplier = function() -- Events: bounty bonus
	return 1
end

local function label(e)
	return e.icon .. " " .. e.code
end

function Bounty.current()
	return target
end

function Bounty.clear()
	if target then
		target.bounty = false
		Plates.showBounty(target, false, 0)
		State.writeEntity(target)
	end
	target = nil
end

function Bounty.reset()
	Bounty.clear()
	expires = 0
	nextAt = State.now() + 20
end

function Bounty.assign(now)
	local list = State.aliveList()
	if #list < 3 then
		return false
	end
	local pick = list[rng:NextInteger(1, #list)]
	Bounty.clear()
	target = pick
	pick.bounty = true
	expires = now + Config.Bounty.Lasts
	local reward = Config.Bounty.Reward * Bounty.multiplier()
	Plates.showBounty(pick, true, reward)
	State.writeEntity(pick)
	Net.sendAll("bounty", label(pick), reward, pick.id)
	return true
end

-- Called when `killer` got `victim`. Returns the bonus points paid (0 when it wasn't the bounty target).
function Bounty.claim(killer, victim)
	if victim ~= target or killer == victim then
		return 0
	end
	local reward = Config.Bounty.Reward * Bounty.multiplier()
	killer.score = (killer.score or 0) + reward
	killer.bonusCoins = (killer.bonusCoins or 0) + Config.Bounty.Coins
	State.writeEntity(killer)
	if killer.player then
		Net.send(killer.player, "bountyWon", reward, Config.Bounty.Coins)
	end
	Bounty.clear()
	nextAt = State.now() + 4
	return reward
end

function Bounty.tick(now)
	if Bounty.paused then
		return
	end
	if target and (not target.alive or now > expires) then
		Bounty.clear()
		nextAt = now + 3
	end
	if not target and now >= nextAt then
		Bounty.assign(now)
		nextAt = now + 5
	end
end

return Bounty

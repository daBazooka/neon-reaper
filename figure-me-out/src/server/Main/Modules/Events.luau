-- FIGURE ME OUT: bonus events. Every minute or so a short event is announced, then it runs: double points, low gravity,
-- a blackout, triple bounties or a supply drop. Everything an event changes is put back when it ends (or when the match does).
local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Combat = require(script.Parent.Combat)
local Bounty = require(script.Parent.Bounty)
local Pickups = require(script.Parent.Pickups)

local Events = {}

local rng = Random.new()
local nextAt, startAt, endAt = 0, 0, 0
local pending, running, last = nil, nil, nil
local saved = nil
local startedAt = 0

Events.paused = false -- tests switch events off so scores are predictable
Events.active = nil -- the id of the running event, for the tests and the screens

local function gap()
	local g = Config.Events.Gap
	return g[1] + rng:NextNumber() * (g[2] - g[1])
end

function Events.reset(now)
	Events.stop()
	startedAt = now
	nextAt = now + Config.Events.First
	pending, last = nil, nil
end

local function apply(def)
	if def.Id == "double" then
		Combat.multiplier = function()
			return 2
		end
	elseif def.Id == "gravity" then
		saved = saved or {}
		saved.Gravity = workspace.Gravity
		workspace.Gravity = Config.Events.LowGravity
	elseif def.Id == "blackout" then
		saved = saved or {}
		saved.Brightness, saved.Ambient, saved.OutdoorAmbient = Lighting.Brightness, Lighting.Ambient, Lighting.OutdoorAmbient
		Lighting.Brightness = 0.3
		Lighting.Ambient = Color3.fromRGB(25, 35, 60)
		Lighting.OutdoorAmbient = Color3.fromRGB(25, 35, 60)
	elseif def.Id == "bounty" then
		Bounty.multiplier = function()
			return 3
		end
	elseif def.Id == "drop" then
		local spots = Config.Map.DropSpots
		local at = spots[rng:NextInteger(1, #spots)]
		Pickups.drop(Vector3.new(at.X, 0, at.Z))
	end
end

local function revert()
	Combat.multiplier = function()
		return 1
	end
	Bounty.multiplier = function()
		return 1
	end
	if saved then
		if saved.Gravity then
			workspace.Gravity = saved.Gravity
		end
		if saved.Brightness then
			Lighting.Brightness, Lighting.Ambient, Lighting.OutdoorAmbient = saved.Brightness, saved.Ambient, saved.OutdoorAmbient
		end
		saved = nil
	end
end

function Events.stop()
	revert()
	pending, running = nil, nil
	Events.active = nil
end

function Events.tick(now)
	if Events.paused then
		return
	end
	if running and now >= endAt then
		Net.sendAll("event", "end", running.Id, running.Name, running.Icon, "")
		revert()
		running = nil
		Events.active = nil
		nextAt = now + gap()
	end
	if pending and now >= startAt then
		running, pending = pending, nil
		endAt = now + running.Seconds
		Events.active = running.Id
		apply(running)
		Net.sendAll("event", "start", running.Id, running.Name, running.Icon, running.Text, running.Seconds)
	end
	-- not in the last stretch of the match: the finale stays clean
	if not running and not pending and now >= nextAt and State.phaseEnd - now > Config.Match.RevealAt + 20 then
		local list = {}
		for _, ev in Config.Events.List do
			if not Config.Events.Skip[ev.Id] then
				table.insert(list, ev)
			end
		end
		local pick = list[rng:NextInteger(1, #list)]
		if pick.Id == last then
			pick = list[(rng:NextInteger(1, #list - 1) + (table.find(list, pick) or 1) - 1) % #list + 1]
		end
		last = pick.Id
		pending = pick
		startAt = now + Config.Events.Warn
		Net.sendAll("event", "warn", pick.Id, pick.Name, pick.Icon, pick.Text, Config.Events.Warn)
	end
end

return Events

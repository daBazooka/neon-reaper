-- SUB 5 TO TRUE ADAM: a server-wide event every few minutes. Clients read the "Event" attributes on workspace.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Shards = require(script.Parent.Shards)

local Events = {}

local rng = Random.new()

local function tint(color)
	local effect = Lighting:FindFirstChild("GlowTint")
	if effect then
		TweenService:Create(effect, TweenInfo.new(2), { TintColor = color }):Play()
	end
end

local function start(ev)
	workspace:SetAttribute("Event", ev.Id)
	workspace:SetAttribute("EventEnd", workspace:GetServerTimeNow() + ev.Duration)
	tint(ev.Tint)
	if ev.Id == "Storm" then
		Shards.storm(50)
	end
end

local function finish()
	workspace:SetAttribute("Event", "")
	tint(Color3.new(1, 1, 1))
	Shards.clearTemp()
end

function Events.init()
	workspace:SetAttribute("Event", "")
	task.spawn(function()
		task.wait(45)
		while true do
			local ev = Config.Events[rng:NextInteger(1, #Config.Events)]
			start(ev)
			task.wait(ev.Duration)
			finish()
			task.wait(rng:NextInteger(Config.EventGap[1], Config.EventGap[2]))
		end
	end)
end

return Events

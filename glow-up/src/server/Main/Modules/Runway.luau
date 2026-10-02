-- SUB 5 TO TRUE ADAM: the runway in the middle of the district. Walk it for a steady Aura trickle that
-- scales with your Glow Score, so a great look pays you just for strutting.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Stats = require(script.Parent.Stats)

local Runway = {}

function Runway.init()
	local halfWidth = Config.Runway.HalfWidth
	task.spawn(function()
		while true do
			task.wait(1)
			for _, p in Players:GetPlayers() do
				local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
				local profileReady = p:GetAttribute("Ready")
				if root and profileReady and not p:GetAttribute("InDuel") then
					local pos = root.Position
					local onRunway = math.abs(pos.X) <= halfWidth and pos.Z >= Config.Runway.MinZ and pos.Z <= Config.Runway.MaxZ and pos.Y < 8
					local walking = root.AssemblyLinearVelocity.Magnitude > 4
					p:SetAttribute("OnRunway", onRunway)
					if onRunway and walking then
						local perSecond = math.max(2, Stats.score(p) * Config.Runway.AuraPerScore)
						Stats.addAuraFractional(p, perSecond * Stats.eventMult("RunwayMult"))
						Stats.addXP(p, math.max(0.5, Stats.score(p) * 0.004))
					end
				end
			end
		end
	end)
end

return Runway

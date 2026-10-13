-- FIGURE ME OUT: the river current in Waterfall Canyon. Anybody standing in the river, a side stream, a plunge pool or
-- under a waterfall is pushed the way the water runs. The push is a VectorForce on the character (so it works for the
-- player's own computer too). Bridges, rocks and the lake are not affected: the lake is real water you simply swim in.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Canyon = require(Shared:WaitForChild("Canyon"))
local Rules = require(Shared:WaitForChild("Rules"))
local State = require(script.Parent.State)

local Water = {}

local function removeForce(e)
	if e.waterForce then
		e.waterForce:Destroy()
		e.waterForce = nil
		e.waterRoot = nil
	end
end

-- Pushes (or stops pushing) one entity. Returns the push strength it is feeling (0 when out of the water).
function Water.apply(e)
	local root = e.char and e.char:FindFirstChild("HumanoidRootPart")
	if not root or not e.alive then
		removeForce(e)
		return 0
	end
	local fx, fz, push = Rules.flowAt(root.Position.X, root.Position.Z, Canyon.Water)
	if not fx or root.Position.Y > Config.Water.HighAbove or Config.Water.PushScale <= 0 then
		removeForce(e)
		return 0
	end
	if e.waterRoot ~= root then
		removeForce(e)
	end
	if not e.waterForce then
		local attachment = Instance.new("Attachment")
		attachment.Name = "WaterAttachment"
		attachment.Parent = root
		local force = Instance.new("VectorForce")
		force.Name = "WaterCurrent"
		force.Attachment0 = attachment
		force.RelativeTo = Enum.ActuatorRelativeTo.World
		force.ApplyAtCenterOfMass = true
		force.Parent = root
		e.waterForce = force
		e.waterRoot = root
	end
	local mass = root.AssemblyMass
	local strength = push * Config.Water.PushScale
	e.waterForce.Force = Vector3.new(fx * strength * mass, 0, fz * strength * mass)
	return strength
end

-- Called every quarter second during a match.
function Water.tick()
	if Config.Map.Theme ~= "canyon" then
		return
	end
	for _, e in State.aliveList() do
		Water.apply(e)
	end
end

return Water

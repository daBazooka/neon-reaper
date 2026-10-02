-- GLOW UP: shards bob and spin locally so the server never has to animate them.
local CollectionService = game:GetService("CollectionService")
local RunService = game:GetService("RunService")

local Orbs = {}

local tracked = {}

local function track(shard)
	if shard:IsA("BasePart") then
		tracked[shard] = shard.Position
	end
end

function Orbs.init()
	CollectionService:GetInstanceAddedSignal("Shard"):Connect(track)
	CollectionService:GetInstanceRemovedSignal("Shard"):Connect(function(shard)
		tracked[shard] = nil
	end)
	for _, shard in CollectionService:GetTagged("Shard") do
		track(shard)
	end
	RunService.RenderStepped:Connect(function()
		local t = os.clock()
		for shard, base in tracked do
			if shard.Parent and not shard:GetAttribute("Taken") then
				shard.CFrame = CFrame.new(base + Vector3.new(0, math.sin(t * 2 + base.X * 0.3) * 0.6, 0)) * CFrame.Angles(0, t, 0)
			end
		end
	end)
end

return Orbs

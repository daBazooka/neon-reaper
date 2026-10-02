-- SUB 5 TO TRUE ADAM: pickups bob and spin locally so the server never has to animate them, and
-- when one is grabbed it flies into the player before it disappears.
local Players = game:GetService("Players")
local CollectionService = game:GetService("CollectionService")
local RunService = game:GetService("RunService")

local Orbs = {}

local player = Players.LocalPlayer
local tracked = {} -- model -> { base = Vector3, takenAt = number? , from = Vector3? }

local function track(model)
	if model:IsA("Model") then
		tracked[model] = { base = model:GetAttribute("Pos") or model:GetPivot().Position }
	end
end

function Orbs.init()
	CollectionService:GetInstanceAddedSignal("Shard"):Connect(track)
	CollectionService:GetInstanceRemovedSignal("Shard"):Connect(function(model)
		tracked[model] = nil
	end)
	for _, model in CollectionService:GetTagged("Shard") do
		track(model)
	end

	RunService.RenderStepped:Connect(function()
		local t = os.clock()
		local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
		local here = root and root.Position
		for model, state in tracked do
			if model.Parent then
				local base = state.base
				if here and (base - here).Magnitude < 110 then
					if model:GetAttribute("Taken") then
						-- Fly into the player
						state.takenAt = state.takenAt or t
						local alpha = math.clamp((t - state.takenAt) / 0.2, 0, 1)
						local pos = base:Lerp(here + Vector3.new(0, 1.5, 0), alpha)
						model:PivotTo(CFrame.new(pos) * CFrame.Angles(0, t * 8, 0))
					else
						local bob = math.sin(t * 2 + base.X * 0.3) * 0.6
						model:PivotTo(CFrame.new(base + Vector3.new(0, bob, 0)) * CFrame.Angles(0, t + base.Z * 0.1, 0))
					end
				end
			end
		end
	end)
end

return Orbs

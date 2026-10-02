-- SUB 5 TO TRUE ADAM: plays the running animation while you are on a treadmill (the server does the freezing and the
-- Aura). Uses Roblox's own default run animations, so nothing has to be uploaded.
local Players = game:GetService("Players")

local Runner = {}

local player = Players.LocalPlayer
local RUN_R15, RUN_R6 = "rbxassetid://913376220", "rbxassetid://180426354"
local track

function Runner.stop()
	if track then
		pcall(function()
			track:Stop(0.2)
			track:Destroy()
		end)
		track = nil
	end
end

function Runner.start(treadmillId)
	Runner.stop()
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	local animator = hum and hum:FindFirstChildOfClass("Animator")
	if not animator then
		return
	end
	pcall(function()
		local anim = Instance.new("Animation")
		anim.AnimationId = hum.RigType == Enum.HumanoidRigType.R15 and RUN_R15 or RUN_R6
		track = animator:LoadAnimation(anim)
		track.Looped = true
		track.Priority = Enum.AnimationPriority.Action
		track:Play(0.2)
		track:AdjustSpeed(1 + treadmillId * 0.12)
	end)
end

return Runner

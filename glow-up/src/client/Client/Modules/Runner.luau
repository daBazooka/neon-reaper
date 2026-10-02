-- SUB 5 TO TRUE ADAM: everything you see and feel while running on a treadmill: the run animation, a wider field of
-- view, speed lines rushing past, and (from init.client) a shockwave and number every second. The server does the
-- freezing, the Aura and the flames around you.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Fx = require(script.Parent.Fx)

local Runner = {}

local player = Players.LocalPlayer
local RUN_R15, RUN_R6 = "rbxassetid://913376220", "rbxassetid://180426354"
local track
local lines -- container for the speed lines
local activeId = 0
local acc = 0

function Runner.init(gui)
	lines = UI.new("Frame", {
		Name = "SpeedLines",
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		ZIndex = 0,
		Visible = false,
	}, gui)
	RunService.RenderStepped:Connect(function(dt)
		if activeId == 0 then
			return
		end
		acc += dt
		local interval = math.max(0.02, 0.07 - activeId * 0.002)
		while acc >= interval do
			acc -= interval
			local def = Config.Treadmills[activeId]
			local angle = math.random() * math.pi * 2
			local line = UI.new("Frame", {
				AnchorPoint = Vector2.new(0.5, 0.5),
				Size = UDim2.fromOffset(3, 40 + math.random() * 70),
				Position = UDim2.fromScale(0.5 + math.cos(angle) * 0.18, 0.5 + math.sin(angle) * 0.18),
				Rotation = math.deg(angle) + 90,
				BackgroundColor3 = def.Rainbow and Color3.fromHSV(math.random(), 0.7, 1) or def.Color:Lerp(Color3.new(1, 1, 1), 0.4),
				BackgroundTransparency = 0.35,
				BorderSizePixel = 0,
			}, lines)
			UI.tween(line, 0.45, {
				Position = UDim2.fromScale(0.5 + math.cos(angle) * 0.75, 0.5 + math.sin(angle) * 0.75),
				BackgroundTransparency = 1,
			}, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
			task.delay(0.5, function()
				line:Destroy()
			end)
		end
	end)
end

function Runner.stop()
	activeId = 0
	if lines then
		lines.Visible = false
	end
	Fx.setBaseFov(70)
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
	activeId = treadmillId
	if lines then
		lines.Visible = true
	end
	Fx.setBaseFov(78 + math.min(treadmillId, 20) * 0.8)
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
		track:AdjustSpeed(1 + treadmillId * 0.08)
	end)
end

-- Once a second: a shockwave under your feet, a number over your head, and a punch of camera.
function Runner.tick(gained, heat, id)
	local char = player.Character
	local root = char and char:FindFirstChild("HumanoidRootPart")
	local head = char and char:FindFirstChild("Head")
	if not root or not head then
		return
	end
	local def = Config.Treadmills[id]
	local color = def.Rainbow and Color3.fromHSV((os.clock() * 0.6) % 1, 0.7, 1) or def.Color
	Fx.ring(root.Position, color, 10 + id * 1.2)
	Fx.floatText(head.Position + Vector3.new(0, 2.5, 0), "+" .. Util.fmt(gained), color, 20 + math.min(id, 12))
	Fx.punch(0.8 + id * 0.1)
	if heat % 5 == 0 then
		Fx.pillar(root.Position, color, 40 + id * 3)
		Fx.burst(root.Position, color, 20 + id * 2)
		Fx.shake(0.15 + id * 0.01, 0.25)
	end
end

return Runner

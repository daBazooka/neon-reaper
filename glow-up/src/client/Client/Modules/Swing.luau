-- SUB 5 TO TRUE ADAM: click / tap anywhere (or hold) to swing your hammer at your own face.
-- Every swing earns Aura (hammer x rebirth x boosts) and a little XP. The server does the maths; this
-- file only handles the input and the feel (arm swing, sound, floating number).
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))
local Fx = require(script.Parent.Fx)

local Swing = {}

local player = Players.LocalPlayer
local holding = false
local lastSwing = 0
local swingCount = 0
local Action, Menu
local armBusy = false

local function blocked()
	return Menu.isOpen() or player:GetAttribute("Training") == true or player:GetAttribute("InDuel") == true
end

local function shoulder()
	local char = player.Character
	if not char then
		return nil
	end
	local arm = char:FindFirstChild("RightUpperArm")
	local motor = arm and arm:FindFirstChild("RightShoulder")
	if not motor then
		local torso = char:FindFirstChild("Torso")
		motor = torso and torso:FindFirstChild("Right Shoulder")
	end
	return motor
end

-- A quick overhead chop with the right arm (only you see this; the hammer in hand shows for everyone).
local function animateArm()
	local motor = shoulder()
	if not motor or armBusy then
		return
	end
	armBusy = true
	local rest = motor.C0
	local down = TweenService:Create(motor, TweenInfo.new(0.07, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { C0 = rest * CFrame.Angles(math.rad(-120), 0, 0) })
	local up = TweenService:Create(motor, TweenInfo.new(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { C0 = rest })
	down.Completed:Once(function()
		up:Play()
	end)
	up.Completed:Once(function()
		motor.C0 = rest
		armBusy = false
	end)
	down:Play()
end

local function doSwing()
	local now = os.clock()
	if now - lastSwing < Config.SwingInterval or blocked() then
		return
	end
	lastSwing = now
	animateArm()
	Action:FireServer("Swing")
end

local function isPress(input)
	return input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch
end

function Swing.init(gui, action, menu)
	Action, Menu = action, menu

	UserInputService.InputBegan:Connect(function(input, processed)
		if processed or not isPress(input) then
			return
		end
		holding = true
		doSwing()
	end)
	UserInputService.InputEnded:Connect(function(input)
		if isPress(input) then
			holding = false
		end
	end)
	-- Holding the button keeps swinging.
	RunService.Heartbeat:Connect(function()
		if holding then
			doSwing()
		end
	end)
end

-- The server confirmed a swing and says how much it paid. tag is "crit" / "jackpot" / nil.
function Swing.result(gained, tag, frenzy)
	swingCount += 1
	local char = player.Character
	local head = char and char:FindFirstChild("Head")
	local root = char and char:FindFirstChild("HumanoidRootPart")
	if not head or not root then
		return
	end
	local C = UI.Colors
	if tag == "jackpot" then
		Audio.reveal(5)
		Fx.shake(0.6, 0.6)
		Fx.flash(C.Gold, 0.4, 0.6)
		Fx.ring(root.Position, C.Gold, 40)
		Fx.pillar(root.Position, C.Gold, 90)
		Fx.burst(head.Position, C.Gold, 60)
		Fx.floatText(head.Position + Vector3.new(0, 3, 0), "JACKPOT!  +" .. Util.fmt(gained), C.Gold, 34)
		return
	elseif tag == "crit" then
		Audio.reveal(3)
		Fx.shake(0.3, 0.3)
		Fx.ring(root.Position, C.Orange, 22)
		Fx.burst(head.Position, C.Orange, 24)
		Fx.floatText(head.Position + Vector3.new(0, 3, 0), "CRIT!  +" .. Util.fmt(gained), C.Orange, 28)
		return
	end
	Audio.pickup(0, 1)
	Fx.punch(0.6)
	local color = frenzy and C.Orange or C.Yellow
	if swingCount % 3 == 1 then
		Fx.floatText(head.Position + Vector3.new(0, 2.5, 0), "+" .. Util.fmt(gained), color, frenzy and 24 or 20)
	end
	if swingCount % 4 == 1 or frenzy then
		Fx.burst(head.Position, color, frenzy and 10 or 5)
	end
end

return Swing

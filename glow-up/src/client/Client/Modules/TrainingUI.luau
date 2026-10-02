-- SUB 5 TO TRUE ADAM: the training minigame overlay. A marker sweeps a bar; press Space (or tap) while it
-- is inside the zone. The server decides the zone and grades the press, so this only draws it.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local ContextActionService = game:GetService("ContextActionService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))
local Fx = require(script.Parent.Fx)
local Toasts = require(script.Parent.Toasts)

local TrainingUI = {}

local C = UI.Colors
local panel, title, dots, bar, goodZone, perfectZone, marker, message, hint, scale, msgScale
local Action
local cfg, stat
local pressed = false
local frozenPos = 0
local resultText, resultColor
local active = false

local GRADE = {
	perfect = { text = "PERFECT", color = Color3.fromRGB(255, 214, 90) },
	good = { text = "GOOD", color = Color3.fromRGB(90, 230, 150) },
	miss = { text = "MISS", color = Color3.fromRGB(255, 100, 120) },
}

local function layoutZones()
	if not cfg then
		return
	end
	goodZone.Position = UDim2.fromScale(cfg.center - cfg.goodWidth / 2, 0)
	goodZone.Size = UDim2.fromScale(cfg.goodWidth, 1)
	perfectZone.Position = UDim2.fromScale(cfg.center - cfg.perfectWidth / 2, 0)
	perfectZone.Size = UDim2.fromScale(cfg.perfectWidth, 1)
end

local function press()
	if not active or not cfg or pressed then
		return
	end
	local now = workspace:GetServerTimeNow()
	if now < cfg.startedAt then
		return
	end
	pressed = true
	frozenPos = Util.tri((now - cfg.startedAt) * cfg.speed)
	Audio.click()
	Action:FireServer("TrainHit", now)
end

function TrainingUI.init(gui, action)
	Action = action
	panel = UI.panel(gui, {
		Name = "Training",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -112),
		Size = UDim2.fromOffset(470, 170),
		Visible = false,
		ZIndex = 10,
	})
	scale = UI.new("UIScale", {}, panel)
	title = UI.label(panel, {
		Position = UDim2.fromOffset(20, 12),
		Size = UDim2.fromOffset(280, 26),
		Font = UI.Fonts.Title,
		TextSize = 18,
		TextWrapped = false,
		Text = "TRAINING",
		ZIndex = 11,
	})
	dots = {}
	for i = 1, Config.TrainReps do
		local dot = UI.new("Frame", {
			AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, -20 - (Config.TrainReps - i) * 20, 0, 18),
			Size = UDim2.fromOffset(14, 14),
			BackgroundColor3 = C.Disabled,
			ZIndex = 11,
		}, panel)
		UI.corner(dot, 7)
		dots[i] = dot
	end

	local barButton = UI.new("TextButton", {
		Position = UDim2.fromOffset(20, 48),
		Size = UDim2.new(1, -40, 0, 40),
		BackgroundColor3 = Color3.fromRGB(14, 11, 32),
		AutoButtonColor = false,
		Text = "",
		ZIndex = 11,
		ClipsDescendants = true,
	}, panel)
	UI.corner(barButton, 12)
	UI.stroke(barButton, C.Stroke, 1.5, 0.5)
	bar = barButton
	goodZone = UI.new("Frame", { BackgroundColor3 = C.Good, BackgroundTransparency = 0.35, BorderSizePixel = 0, ZIndex = 12 }, bar)
	perfectZone = UI.new("Frame", { BackgroundColor3 = C.Gold, BackgroundTransparency = 0.1, BorderSizePixel = 0, ZIndex = 13 }, bar)
	marker = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 0),
		Size = UDim2.new(0, 6, 1, 0),
		BackgroundColor3 = Color3.new(1, 1, 1),
		BorderSizePixel = 0,
		ZIndex = 14,
	}, bar)
	UI.corner(marker, 3)
	barButton.Activated:Connect(press)

	message = UI.label(panel, {
		Position = UDim2.fromOffset(20, 96),
		Size = UDim2.new(1, -40, 0, 36),
		Font = UI.Fonts.Title,
		TextSize = 26,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "",
		ZIndex = 11,
	})
	msgScale = UI.new("UIScale", {}, message)
	hint = UI.label(panel, {
		Position = UDim2.fromOffset(20, 138),
		Size = UDim2.new(1, -40, 0, 20),
		Font = UI.Fonts.Body,
		TextSize = 13,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "Press SPACE or tap the bar when the marker is in the gold zone",
		ZIndex = 11,
	})
	local cancel = UI.button(panel, {
		AnchorPoint = Vector2.new(1, 1),
		Position = UDim2.new(1, -12, 1, -10),
		Size = UDim2.fromOffset(26, 26),
		Text = "✕",
		TextSize = 12,
		ZIndex = 12,
		Radius = 13,
	}, "card")
	cancel.Activated:Connect(function()
		Action:FireServer("TrainCancel")
	end)

	-- Space is "swallowed" while training so the character doesn't jump away.
	ContextActionService:BindActionAtPriority("GlowTrainPress", function(_, state)
		if active then
			if state == Enum.UserInputState.Begin then
				press()
			end
			return Enum.ContextActionResult.Sink
		end
		return Enum.ContextActionResult.Pass
	end, false, Enum.ContextActionPriority.High.Value, Enum.KeyCode.Space)

	RunService.RenderStepped:Connect(function()
		if not active or not cfg then
			return
		end
		local now = workspace:GetServerTimeNow()
		if now < cfg.startedAt then
			marker.Position = UDim2.fromScale(0, 0)
			if resultText then
				message.Text = resultText
				message.TextColor3 = resultColor
			else
				message.Text = string.format("GET READY  %.1f", cfg.startedAt - now)
				message.TextColor3 = C.Muted
			end
			return
		end
		resultText = nil
		if pressed then
			marker.Position = UDim2.fromScale(frozenPos, 0)
		else
			message.Text = "NOW!"
			message.TextColor3 = C.Text
			marker.Position = UDim2.fromScale(Util.tri((now - cfg.startedAt) * cfg.speed), 0)
		end
	end)
end

local function setDots(upTo, grade)
	if grade then
		dots[upTo].BackgroundColor3 = GRADE[grade].color
	end
end

local function loadCfg(newCfg)
	cfg = newCfg
	pressed = false
	if cfg then
		layoutZones()
	end
end

function TrainingUI.start(statId, firstCfg)
	stat = statId
	local def = Config.Stats[statId]
	active = true
	resultText = nil
	title.Text = def.Icon .. "  " .. def.Station .. " TRAINING"
	title.TextColor3 = def.Color
	for _, dot in dots do
		dot.BackgroundColor3 = C.Disabled
	end
	loadCfg(firstCfg)
	panel.Visible = true
	UI.pop(scale, 0.92)
end

function TrainingUI.rep(repIndex, grade, gain, streak, nextCfg)
	local g = GRADE[grade]
	if not g then
		return
	end
	setDots(repIndex, grade)
	local def = Config.Stats[stat]
	if grade == "miss" then
		resultText = "MISS"
		Audio.error()
	else
		resultText = string.format("%s  +%.1f %s", g.text, gain, def and def.Name or "")
		if grade == "perfect" then
			Audio.pickup(8 + math.min(streak, 6), 3)
			Fx.punch(3)
		else
			Audio.pickup(3, 1)
		end
	end
	resultColor = g.color
	message.Text = resultText
	message.TextColor3 = resultColor
	UI.pop(msgScale, 1.2)
	if nextCfg then
		loadCfg(nextCfg)
	end
end

function TrainingUI.finish(statId, total)
	active = false
	cfg = nil
	if statId and total and total > 0 then
		local def = Config.Stats[statId]
		Toasts.push(string.format("%s +%.1f %s", def.Icon, total, def.Name), "good")
		Audio.quest()
	end
	task.delay(statId and 1.2 or 0, function()
		if not active then
			panel.Visible = false
		end
	end)
end

return TrainingUI

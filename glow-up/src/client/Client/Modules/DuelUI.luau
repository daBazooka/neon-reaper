-- SUB 5 TO TRUE ADAM: duel overlay. Both sides tap as fast as they can for 7 seconds; Mog Power gives an
-- edge but speed can upset a higher rank. Win or lose, you always get rewarded.
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

local DuelUI = {}

local player = Players.LocalPlayer
local C = UI.Colors
local Action
local root, myName, myInfo, oppName, oppInfo, myBar, oppBar, center, tapButton, tapScale, resultLabel
local duel -- { tStart, length, myTaps, oppTaps, sent, lastTickSecond }
local pendingSend = 0
local lastSend = 0

local function card(parent, anchorX, color)
	local c = UI.panel(parent, {
		AnchorPoint = Vector2.new(anchorX, 0),
		Position = UDim2.new(anchorX, anchorX == 0 and 12 or -12, 0, 8),
		Size = UDim2.fromOffset(190, 52),
		ZIndex = 31,
	})
	c:FindFirstChildOfClass("UIStroke").Color = color
	local name = UI.label(c, {
		Position = UDim2.fromOffset(12, 5),
		Size = UDim2.new(1, -24, 0, 20),
		Font = UI.Fonts.Title,
		TextSize = 14,
		TextXAlignment = anchorX == 0 and Enum.TextXAlignment.Left or Enum.TextXAlignment.Right,
		TextWrapped = false,
		ZIndex = 32,
	})
	local info = UI.label(c, {
		Position = UDim2.fromOffset(12, 28),
		Size = UDim2.new(1, -24, 0, 18),
		Font = UI.Fonts.Bold,
		TextSize = 10,
		TextColor3 = C.Muted,
		TextXAlignment = anchorX == 0 and Enum.TextXAlignment.Left or Enum.TextXAlignment.Right,
		TextWrapped = false,
		ZIndex = 32,
	})
	return name, info
end

local function tap()
	if not duel then
		return
	end
	local now = workspace:GetServerTimeNow()
	if now < duel.tStart or now > duel.tStart + duel.length then
		return
	end
	duel.myTaps += 1
	pendingSend += 1
	Audio.play("Tone", 0.9 + (duel.myTaps % 8) * 0.07, 0.35)
	UI.pop(tapScale, 0.93)
end

function DuelUI.init(gui, action)
	Action = action
	root = UI.new("Frame", {
		Name = "Duel",
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		Visible = false,
		ZIndex = 30,
	}, gui)
	myName, myInfo = card(root, 0, C.Cyan)
	oppName, oppInfo = card(root, 1, C.Accent2)

	local bars = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 8),
		Size = UDim2.fromOffset(280, 36),
		BackgroundTransparency = 1,
		ZIndex = 31,
	}, root)
	myBar = UI.bar(bars, { Position = UDim2.fromOffset(0, 2), Size = UDim2.new(1, 0, 0, 12) }, C.Sky)
	oppBar = UI.bar(bars, { Position = UDim2.fromOffset(0, 20), Size = UDim2.new(1, 0, 0, 12) }, C.Pink)

	center = UI.label(root, {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.32),
		Size = UDim2.fromOffset(400, 70),
		Font = UI.Fonts.Title,
		TextSize = 56,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0.2,
		TextStrokeColor3 = Color3.fromRGB(18, 10, 44),
		Text = "",
		ZIndex = 32,
	})
	resultLabel = UI.label(root, {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.43),
		Size = UDim2.fromOffset(520, 40),
		Font = UI.Fonts.Bold,
		TextSize = 15,
		TextXAlignment = Enum.TextXAlignment.Center,
		Text = "",
		ZIndex = 32,
	})

	tapButton = UI.button(root, {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -24),
		Size = UDim2.fromOffset(180, 64),
		Text = "TAP!",
		TextSize = 28,
		ZIndex = 33,
		Radius = 16,
	}, "primary")
	tapButton.Font = UI.Fonts.Title
	tapScale = UI.new("UIScale", {}, tapButton)
	tapButton.Activated:Connect(tap)

	ContextActionService:BindActionAtPriority("GlowDuelTap", function(_, state)
		if duel then
			if state == Enum.UserInputState.Begin then
				tap()
			end
			return Enum.ContextActionResult.Sink
		end
		return Enum.ContextActionResult.Pass
	end, false, Enum.ContextActionPriority.High.Value, Enum.KeyCode.Space)

	RunService.RenderStepped:Connect(function()
		if not duel then
			return
		end
		local now = workspace:GetServerTimeNow()
		local maxTaps = Config.Duel.MaxTapsPerSecond * duel.length
		myBar.set(duel.myTaps / maxTaps * 2.2)
		oppBar.set(duel.oppTaps / maxTaps * 2.2)

		if now < duel.tStart then
			local left = math.ceil(duel.tStart - now)
			center.Text = tostring(left)
			center.TextColor3 = C.Gold
			if left ~= duel.lastTick then
				duel.lastTick = left
				Audio.countdown(false, left)
			end
			tapButton.BackgroundTransparency = 0.5
		elseif now <= duel.tStart + duel.length then
			if not duel.started then
				duel.started = true
				Audio.countdown(true)
				Fx.punch(6)
			end
			center.Text = "TAP!"
			center.TextColor3 = C.Good
			tapButton.BackgroundTransparency = 0
			local remaining = duel.tStart + duel.length - now
			resultLabel.Text = string.format("%.1fs", remaining)
			resultLabel.TextColor3 = C.Text
		end

		if pendingSend > 0 and os.clock() - lastSend > 0.1 then
			Action:FireServer("DuelTaps", pendingSend)
			pendingSend = 0
			lastSend = os.clock()
		end
	end)
end

function DuelUI.start(oppNameText, oppRank, oppScore, myScore, tStart, length)
	local myRank = Config.Ranks[player:GetAttribute("Rank") or 1]
	local opp = Config.Ranks[oppRank] or Config.Ranks[1]
	myName.Text = player.DisplayName
	myName.TextColor3 = myRank.Color
	myInfo.Text = string.format("%s  ·  POWER %s", myRank.Name:upper(), Util.fmt(myScore))
	oppName.Text = oppNameText
	oppName.TextColor3 = opp.Color
	oppInfo.Text = string.format("%s  ·  POWER %s", opp.Name:upper(), Util.fmt(oppScore))
	duel = { tStart = tStart, length = length, myTaps = 0, oppTaps = 0, lastTick = 0 }
	pendingSend = 0
	resultLabel.Text = ""
	tapButton.Visible = true
	root.Visible = true
end

function DuelUI.progress(oppTaps)
	if duel then
		duel.oppTaps = oppTaps
	end
end

function DuelUI.finish(win, given, myTaps, oppTaps, myEff, oppEff, streak)
	if not duel then
		return
	end
	if pendingSend > 0 then
		Action:FireServer("DuelTaps", pendingSend)
		pendingSend = 0
	end
	duel.oppTaps = oppTaps
	tapButton.Visible = false
	if win then
		center.Text = "MOG!"
		center.TextColor3 = C.Gold
		Audio.win()
		Fx.flash(C.Gold, 0.4, 0.8)
		Fx.shake(0.5, 0.6)
		resultLabel.Text = string.format("You out-glowed %s   ·   +✦%s%s", oppName.Text, Util.fmt(given), streak > 1 and ("   ·   🔥 streak " .. streak) or "")
	else
		center.Text = "RESPECT"
		center.TextColor3 = C.Cyan
		Audio.lose()
		resultLabel.Text = string.format("%s took this one   ·   still earned +✦%s", oppName.Text, Util.fmt(given))
	end
	resultLabel.TextColor3 = C.Text
	local finished = duel
	duel = nil
	task.delay(3.6, function()
		if duel == nil then
			root.Visible = false
		end
	end)
	return finished
end

return DuelUI

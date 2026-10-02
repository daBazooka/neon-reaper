-- SUB 5 TO TRUE ADAM: Mog Competition overlay. Everyone on stage flexes (taps) for 8 seconds; a live
-- leaderboard shows who's ahead, then the final placings and your reward.
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

local CompetitionUI = {}

local C = UI.Colors
local Action
local root, title, center, tapButton, tapScale, listFrame, rows, resultPanel, resultTitle, resultBody
local comp -- { tStart, length, myTaps, lastTick, started }
local pendingSend, lastSend = 0, 0

local function tap()
	if not comp then
		return
	end
	local now = workspace:GetServerTimeNow()
	if now < comp.tStart or now > comp.tStart + comp.length then
		return
	end
	comp.myTaps += 1
	pendingSend += 1
	Audio.play("Tone", 0.9 + (comp.myTaps % 8) * 0.07, 0.35)
	UI.pop(tapScale, 0.93)
end

function CompetitionUI.init(gui, action)
	Action = action
	root = UI.new("Frame", {
		Name = "Competition",
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		Visible = false,
		ZIndex = 30,
	}, gui)

	title = UI.label(root, {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 8),
		Size = UDim2.fromOffset(420, 26),
		Font = UI.Fonts.Title,
		TextSize = 18,
		TextColor3 = C.Gold,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "🏆 MOG COMPETITION",
		ZIndex = 31,
	})
	center = UI.label(root, {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.3),
		Size = UDim2.fromOffset(400, 70),
		Font = UI.Fonts.Title,
		TextSize = 56,
		TextStrokeTransparency = 0,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "",
		ZIndex = 32,
	})

	-- Live leaderboard (right side)
	listFrame = UI.panel(root, {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -8, 0.5, -20),
		Size = UDim2.fromOffset(190, 190),
		ZIndex = 31,
	})
	UI.label(listFrame, {
		Position = UDim2.fromOffset(10, 5),
		Size = UDim2.new(1, -20, 0, 16),
		Font = UI.Fonts.Title,
		TextSize = 11,
		TextWrapped = false,
		Text = "LIVE RANKING",
		ZIndex = 32,
	})
	rows = {}
	for i = 1, 6 do
		local row = UI.new("Frame", {
			Position = UDim2.fromOffset(8, 26 + (i - 1) * 26),
			Size = UDim2.new(1, -16, 0, 22),
			BackgroundColor3 = C.Card,
			ZIndex = 32,
		}, listFrame)
		UI.corner(row, 8)
		local fill = UI.new("Frame", {
			Size = UDim2.fromScale(0, 1),
			BackgroundColor3 = C.Accent,
			BackgroundTransparency = 0.35,
			BorderSizePixel = 0,
			ZIndex = 32,
		}, row)
		UI.corner(fill, 8)
		local label = UI.label(row, {
			Position = UDim2.fromOffset(8, 0),
			Size = UDim2.new(1, -16, 1, 0),
			Font = UI.Fonts.Bold,
			TextSize = 10,
			TextWrapped = false,
			Text = "",
			ZIndex = 34,
		})
		rows[i] = { row = row, fill = fill, label = label }
	end

	tapButton = UI.button(root, {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -24),
		Size = UDim2.fromOffset(180, 64),
		Text = "FLEX!",
		TextSize = 28,
		ZIndex = 33,
		Radius = 16,
	}, "primary")
	tapScale = UI.new("UIScale", {}, tapButton)
	tapButton.Activated:Connect(tap)

	-- Results panel
	resultPanel = UI.panel(root, {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.45),
		Size = UDim2.fromOffset(340, 270),
		Visible = false,
		ZIndex = 40,
	})
	resultTitle = UI.label(resultPanel, {
		Position = UDim2.fromOffset(14, 10),
		Size = UDim2.new(1, -28, 0, 34),
		Font = UI.Fonts.Title,
		TextSize = 22,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "",
		ZIndex = 41,
	})
	resultBody = UI.label(resultPanel, {
		Position = UDim2.fromOffset(18, 52),
		Size = UDim2.new(1, -36, 1, -100),
		Font = UI.Fonts.Bold,
		TextSize = 13,
		TextYAlignment = Enum.TextYAlignment.Top,
		Text = "",
		ZIndex = 41,
	})
	local close = UI.button(resultPanel, {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -12),
		Size = UDim2.fromOffset(140, 34),
		Text = "CONTINUE",
		ZIndex = 42,
	}, "primary")
	close.Activated:Connect(function()
		Audio.click()
		root.Visible = false
		resultPanel.Visible = false
	end)

	ContextActionService:BindActionAtPriority("GlowCompTap", function(_, state)
		if comp then
			if state == Enum.UserInputState.Begin then
				tap()
			end
			return Enum.ContextActionResult.Sink
		end
		return Enum.ContextActionResult.Pass
	end, false, Enum.ContextActionPriority.High.Value, Enum.KeyCode.Space)

	RunService.RenderStepped:Connect(function()
		if not comp then
			return
		end
		local now = workspace:GetServerTimeNow()
		if now < comp.tStart then
			local left = math.ceil(comp.tStart - now)
			center.Text = tostring(left)
			center.TextColor3 = C.Gold
			if left ~= comp.lastTick then
				comp.lastTick = left
				Audio.countdown(false, left)
			end
			tapButton.BackgroundTransparency = 0.5
		elseif now <= comp.tStart + comp.length then
			if not comp.started then
				comp.started = true
				Audio.countdown(true)
				Fx.punch(6)
			end
			center.Text = "FLEX!"
			center.TextColor3 = C.Good
			tapButton.BackgroundTransparency = 0
			title.Text = string.format("🏆 MOG COMPETITION  ·  %.1fs", comp.tStart + comp.length - now)
		end
		if pendingSend > 0 and os.clock() - lastSend > 0.1 then
			Action:FireServer("CompTaps", pendingSend)
			pendingSend = 0
			lastSend = os.clock()
		end
	end)
end

local function drawRoster(list)
	local top = 1
	for _, e in list do
		top = math.max(top, e.t or 0)
	end
	for i, ref in rows do
		local e = list[i]
		ref.row.Visible = e ~= nil
		if e then
			ref.label.Text = string.format("%d.  %s", i, e.n)
			ref.label.TextColor3 = e.m and C.Gold or C.Text
			ref.fill.Size = UDim2.fromScale(math.clamp((e.t or 0) / math.max(top, 20), 0, 1), 1)
			ref.fill.BackgroundColor3 = e.m and C.Gold or C.Accent
		end
	end
end

function CompetitionUI.start(tStart, length, roster)
	comp = { tStart = tStart, length = length, myTaps = 0, lastTick = 0 }
	pendingSend = 0
	local list = {}
	for _, e in roster do
		table.insert(list, { n = e.n, t = 0, m = e.m })
	end
	drawRoster(list)
	title.Text = "🏆 MOG COMPETITION"
	resultPanel.Visible = false
	tapButton.Visible = true
	listFrame.Visible = true
	center.Text = ""
	root.Visible = true
end

function CompetitionUI.progress(list)
	if comp then
		drawRoster(list)
	end
end

function CompetitionUI.finish(place, total, aura, winner, summary)
	if pendingSend > 0 then
		Action:FireServer("CompTaps", pendingSend)
		pendingSend = 0
	end
	comp = nil
	tapButton.Visible = false
	listFrame.Visible = false
	center.Text = ""
	title.Text = "🏆 MOG COMPETITION"
	local lines = {}
	for i, e in summary do
		table.insert(lines, string.format("%d.  %s  —  %d pts", i, e.n, e.p))
	end
	resultTitle.Text = winner and "YOU WON! 👑" or string.format("YOU PLACED #%d OF %d", place, total)
	resultTitle.TextColor3 = winner and C.Gold or C.Cyan
	resultBody.Text = table.concat(lines, "\n") .. string.format("\n\nReward: +✦%s Aura%s", Util.fmt(aura), winner and "  +  a free crate" or "")
	resultPanel.Visible = true
	if winner then
		Audio.win()
		Fx.flash(C.Gold, 0.4, 0.8)
		Fx.shake(0.5, 0.6)
	else
		Audio.lose()
	end
end

return CompetitionUI

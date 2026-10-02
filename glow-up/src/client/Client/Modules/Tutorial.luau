-- SUB 5 TO TRUE ADAM: the first-time tutorial card and the bouncing arrow that points at where to go.
-- It reads the TutStep attribute from the server (7 = finished). Players can skip it.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))

local Tutorial = {}

local player = Players.LocalPlayer
local C = UI.Colors
local DONE = #Config.Tutorial + 1

local card, title, body, bar, countLabel, scale
local pointer, pointerGui
local shownStep = 0

-- Where the arrow should point for each step (nil = no arrow).
local function target(step)
	if step == 2 then
		return Config.HammerPos(2) + Vector3.new(0, 11, 0)
	elseif step == 3 then
		local pos, front = Config.StationPos("Gym"), Config.StationFront("Gym")
		return pos + front * 7 + Vector3.new(0, 8, 0)
	elseif step == 5 then
		return Config.BattlePos() + Config.BattleFront() * 30 + Vector3.new(0, 10, 0)
	end
	return nil
end

local function ensurePointer()
	if pointer then
		return
	end
	pointer = UI.new("Part", {
		Name = "TutorialPointer",
		Size = Vector3.one,
		Transparency = 1,
		Anchored = true,
		CanCollide = false,
		CanQuery = false,
		CanTouch = false,
	}, workspace)
	pointerGui = UI.new("BillboardGui", {
		Adornee = pointer,
		Size = UDim2.fromOffset(120, 90),
		AlwaysOnTop = true,
		MaxDistance = 400,
	}, pointer)
	UI.label(pointerGui, {
		Size = UDim2.new(1, 0, 0, 24),
		Font = UI.Fonts.Title,
		TextSize = 18,
		TextColor3 = C.Yellow,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0,
		Text = "GO HERE",
	})
	UI.label(pointerGui, {
		Position = UDim2.fromOffset(0, 22),
		Size = UDim2.new(1, 0, 0, 60),
		Font = UI.Fonts.Title,
		TextSize = 54,
		TextColor3 = C.Yellow,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0,
		Text = "▼",
	})
end

local function show(step)
	local def = Config.Tutorial[step]
	if not def then
		card.Visible = false
		if pointer then
			pointer.Parent = nil
		end
		return
	end
	card.Visible = true
	title.Text = string.format("TUTORIAL %d/%d  ·  %s", step, #Config.Tutorial, def.Title:upper())
	body.Text = def.Text
	bar.back.Visible = def.Goal ~= nil
	countLabel.Visible = def.Goal ~= nil
	if step ~= shownStep then
		shownStep = step
		UI.pop(scale, 1.1)
		if step == 1 then
			Audio.say("welcome")
		else
			Audio.say("nice")
		end
		Audio.quest()
	end
	local at = target(step)
	if at then
		ensurePointer()
		pointer.Parent = workspace
		pointer.Position = at
	elseif pointer then
		pointer.Parent = nil
	end
end

function Tutorial.init(gui, Action)
	card = UI.panel(gui, {
		Name = "TutorialCard",
		AnchorPoint = Vector2.new(0, 0),
		Position = UDim2.new(0, 84, 0.5, -185),
		Size = UDim2.fromOffset(270, 132),
		Visible = false,
		Radius = 12,
	})
	card:FindFirstChildOfClass("UIStroke").Color = C.Yellow
	scale = UI.new("UIScale", {}, card)
	title = UI.label(card, {
		Position = UDim2.fromOffset(10, 6),
		Size = UDim2.new(1, -20, 0, 16),
		Font = UI.Fonts.Title,
		TextSize = 11,
		TextColor3 = C.Yellow,
		TextWrapped = false,
		Text = "",
	})
	body = UI.label(card, {
		Position = UDim2.fromOffset(10, 24),
		Size = UDim2.new(1, -20, 0, 66),
		Font = UI.Fonts.Bold,
		TextSize = 12,
		TextYAlignment = Enum.TextYAlignment.Top,
		Text = "",
	})
	bar = UI.bar(card, { Position = UDim2.new(0, 10, 1, -26), Size = UDim2.new(1, -90, 0, 8) }, C.Good)
	countLabel = UI.label(card, {
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(1, -78, 1, -22),
		Size = UDim2.fromOffset(30, 14),
		Font = UI.Fonts.Title,
		TextSize = 11,
		TextColor3 = C.Good,
		TextWrapped = false,
		Text = "",
	})
	local skip = UI.button(card, {
		AnchorPoint = Vector2.new(1, 1),
		Position = UDim2.new(1, -8, 1, -6),
		Size = UDim2.fromOffset(46, 20),
		BackgroundColor3 = C.Disabled,
		Text = "SKIP",
		TextSize = 10,
		Radius = 6,
	}, "card")
	skip.Activated:Connect(function()
		Audio.click()
		Action:FireServer("TutorialSkip")
	end)

	local lastStep = 0
	local t0 = os.clock()
	RunService.Heartbeat:Connect(function()
		local step = player:GetAttribute("TutStep") or DONE
		if step ~= lastStep then
			lastStep = step
			show(step)
		end
		if step < DONE then
			local goal = player:GetAttribute("TutGoal") or 0
			if goal > 0 then
				local progress = player:GetAttribute("TutProgress") or 0
				bar.set(progress / goal)
				countLabel.Text = progress .. "/" .. goal
			end
			if pointer and pointer.Parent then
				local at = target(step)
				if at then
					pointer.Position = at + Vector3.new(0, math.sin((os.clock() - t0) * 4) * 1.2, 0)
				end
			end
		end
	end)
end

-- True while the tutorial is still running (the HUD hides the quest so the screen stays simple).
function Tutorial.active()
	return (player:GetAttribute("TutStep") or DONE) < DONE
end

return Tutorial

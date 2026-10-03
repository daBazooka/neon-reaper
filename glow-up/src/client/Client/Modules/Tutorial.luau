-- SUB 5 TO TRUE ADAM: the first-time guide. A brand-new player sees NO banners, cards or voice. They only get arrows:
-- a bouncing arrow over where to go, a trail of glowing dots on the ground leading there, a pulsing hand when they
-- should click, and an arrow on the button to press. The server counts the steps (TutStep, 6 = finished).
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

local TRAIL_DOTS = 16
local TRAIL_SPACING = 5.5

local Hud, Interact, Menu
local pointer, pointerGui, pointerIcon
local trail = {}
local screenArrow, screenArrowLabel
local clickHint
local lastStep = 0

local function flat(a, b)
	local d = a - b
	return Vector3.new(d.X, 0, d.Z).Magnitude
end

local function rootPosition()
	local char = player.Character
	local root = char and char:FindFirstChild("HumanoidRootPart")
	return root and root.Position
end

-- Where the world arrow goes for each step, with the icon on it. Returns nil when there is nothing to walk to.
local function target(step, here)
	if step == 2 then
		return Config.HammerPos(2) + Vector3.new(0, 10, 0), "🔨"
	elseif step == 3 then
		local station, front = Config.StationPos("Gym"), Config.StationFront("Gym")
		local rack = Config.MachinePos(Config.GymMachineById.rack)
		if here and flat(here, station) < 20 then
			return rack + Vector3.new(0, 7, 0), "🏋️"
		end
		return station + front * 20 + Vector3.new(0, 10, 0), "🏋️"
	elseif step == 5 then
		return Config.BattlePos() + Config.BattleFront() * 30 + Vector3.new(0, 10, 0), "⚔️"
	end
	return nil
end

local function ensureWorld()
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
		Size = UDim2.fromOffset(110, 110),
		AlwaysOnTop = true,
		MaxDistance = 600,
	}, pointer)
	pointerIcon = UI.label(pointerGui, {
		Size = UDim2.new(1, 0, 0, 40),
		Font = UI.Fonts.Title,
		TextSize = 34,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 1,
		Text = "",
	})
	UI.label(pointerGui, {
		Position = UDim2.fromOffset(0, 36),
		Size = UDim2.new(1, 0, 0, 70),
		Font = UI.Fonts.Title,
		TextSize = 64,
		TextColor3 = C.Yellow,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0,
		Text = "▼",
	})
	for i = 1, TRAIL_DOTS do
		trail[i] = UI.new("Part", {
			Name = "TutorialDot",
			Shape = Enum.PartType.Ball,
			Size = Vector3.one,
			Material = Enum.Material.Neon,
			Color = C.Yellow,
			Transparency = 1,
			Anchored = true,
			CanCollide = false,
			CanQuery = false,
			CanTouch = false,
		}, workspace)
	end
end

local function hideWorld()
	if pointer then
		pointer.Parent = nil
	end
	for _, dot in trail do
		dot.Transparency = 1
	end
end

-- Arrows drawn on the screen (over a button), and the pulsing click hand for step 1.
local function ensureScreen(gui)
	screenArrow = UI.new("Frame", {
		Name = "TutorialArrow",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Size = UDim2.fromOffset(70, 70),
		BackgroundTransparency = 1,
		Visible = false,
		ZIndex = 60,
	}, gui)
	screenArrowLabel = UI.label(screenArrow, {
		Size = UDim2.fromScale(1, 1),
		Font = UI.Fonts.Title,
		TextSize = 60,
		TextColor3 = C.Yellow,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0,
		ZIndex = 61,
		Text = "▼",
	})
	clickHint = UI.new("Frame", {
		Name = "TutorialClick",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.62),
		Size = UDim2.fromOffset(90, 90),
		BackgroundTransparency = 1,
		Visible = false,
		ZIndex = 60,
	}, gui)
	local ring = UI.new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(0.8, 0.8), BackgroundTransparency = 0.7, BackgroundColor3 = C.Yellow, ZIndex = 60 }, clickHint)
	UI.corner(ring, 45)
	UI.stroke(ring, C.Yellow, 3, 0)
	UI.label(clickHint, {
		Size = UDim2.fromScale(1, 1),
		Font = UI.Fonts.Title,
		TextSize = 52,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 1,
		ZIndex = 61,
		Text = "👆",
	})
end

-- The dotted trail from the player to the target, scrolling toward it.
local function drawTrail(from, to, t)
	local groundY = from.Y - 2.6
	local flatDir = Vector3.new(to.X - from.X, 0, to.Z - from.Z)
	local distance = flatDir.Magnitude
	if distance < 4 then
		for _, dot in trail do
			dot.Transparency = 1
		end
		return
	end
	local dir = flatDir.Unit
	local phase = (t * 4) % TRAIL_SPACING
	for i, dot in trail do
		local along = (i - 1) * TRAIL_SPACING + phase + 4
		if along >= distance - 2 then
			dot.Transparency = 1
		else
			local fade = math.clamp(1 - along / (TRAIL_DOTS * TRAIL_SPACING), 0.1, 1)
			local size = 0.9 + 0.35 * math.sin(t * 6 - i * 0.7)
			dot.Size = Vector3.one * size
			dot.Position = Vector3.new(from.X + dir.X * along, groundY, from.Z + dir.Z * along)
			dot.Transparency = 1 - fade * 0.85
		end
	end
end

function Tutorial.init(gui, Action, hud, interact, menu)
	Hud, Interact, Menu = hud, interact, menu
	ensureScreen(gui)
	-- A small skip chip for players who already know the game (the only text a new player sees).
	local skip = UI.button(gui, {
		Name = "TutorialSkip",
		AnchorPoint = Vector2.new(0, 0),
		Position = UDim2.new(0, 84, 0, 8),
		Size = UDim2.fromOffset(62, 22),
		BackgroundColor3 = C.Disabled,
		BackgroundTransparency = 0.35,
		Text = "SKIP",
		TextSize = 10,
		Radius = 8,
		Visible = false,
	}, "card")
	skip.Activated:Connect(function()
		Audio.click()
		Action:FireServer("TutorialSkip")
	end)

	local t0 = os.clock()
	RunService.Heartbeat:Connect(function()
		local step = player:GetAttribute("TutStep") or DONE
		if step ~= lastStep then
			lastStep = step
			if step >= DONE then
				hideWorld()
			end
		end
		skip.Visible = step < DONE
		if step >= DONE then
			screenArrow.Visible = false
			clickHint.Visible = false
			return
		end
		local t = os.clock() - t0
		local here = rootPosition()
		local trainingNow = player:GetAttribute("Training") == true

		-- world arrow + dotted trail
		local at, icon
		if here and not trainingNow then
			at, icon = target(step, here)
		end
		if at then
			ensureWorld()
			pointer.Parent = workspace
			pointerIcon.Text = icon
			pointer.Position = at + Vector3.new(0, math.sin(t * 4) * 1.2, 0)
			drawTrail(here, at, t)
		else
			hideWorld()
		end

		-- screen arrows: the "use" button when you are standing at the right place, or the Pets button
		local arrowTarget
		if step == 3 and not trainingNow and Interact.current() == "Machine:rack" then
			arrowTarget = Interact.button()
		elseif step == 4 and not Menu.isOpen() then
			arrowTarget = Hud.button("Pets")
		elseif step == 5 and Interact.current() == "Battle" then
			arrowTarget = Interact.button()
		end
		if arrowTarget then
			local pos, size = arrowTarget.AbsolutePosition, arrowTarget.AbsoluteSize
			local bounce = math.sin(t * 6) * 6
			if arrowTarget == Interact.button() then
				screenArrowLabel.Text = "▼"
				screenArrow.Position = UDim2.fromOffset(pos.X + size.X / 2, pos.Y - 30 + bounce)
			else
				screenArrowLabel.Text = "◀"
				screenArrow.Position = UDim2.fromOffset(pos.X + size.X + 30 + bounce, pos.Y + size.Y / 2)
			end
			screenArrow.Visible = true
		else
			screenArrow.Visible = false
		end

		-- step 1: pulse a hand where to click
		clickHint.Visible = step == 1
		if step == 1 then
			local s = 1 + 0.12 * math.sin(t * 6)
			clickHint.Size = UDim2.fromOffset(90 * s, 90 * s)
		end
	end)
end

-- True while the tutorial is still running (the HUD hides the quest so the screen stays simple).
function Tutorial.active()
	return (player:GetAttribute("TutStep") or DONE) < DONE
end

return Tutorial

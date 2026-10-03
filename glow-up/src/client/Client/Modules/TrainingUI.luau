-- SUB 5 TO TRUE ADAM: the machine training window. Each kind of machine has its own mini-game:
--   sweep  - press while the white line is in the gold zone      (SPACE / click / LIFT!)
--   hold   - hold to push the bar, let go in the gold zone       (hold SPACE / mouse / HOLD)
--   rhythm - notes fall down two lanes, hit Left (A) and Right (D) on the line
--   mash   - tap as fast as you can until the bar is full        (SPACE / click / TAP!)
-- The server decides every zone and grades every press, so this window only draws things and sends presses.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local ContextActionService = game:GetService("ContextActionService")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))
local Fx = require(script.Parent.Fx)
local Toasts = require(script.Parent.Toasts)

local TrainingUI = {}

local player = Players.LocalPlayer
local camera = workspace:WaitForChild("Camera")
local C = UI.Colors

local MAX_DOTS = 6
local LANE_COLOR = { L = Color3.fromRGB(90, 200, 255), R = Color3.fromRGB(255, 110, 190) }

local panel, title, dots, message, msgScale, tip, scale
local barArea, goodZone, perfectZone, marker, fill
local rhythmArea, lanes, noteFrames, hitLine
local mashArea, mashBar, mashCount, mashTime
local controls = {}
local holdButton, tapButton
local Action

local cfg, stat, machine
local active = false
local pressed = false -- the single press of a sweep / hold rep has been used
local holding, holdAt, frozenLevel = false, 0, 0
local frozenPos = 0
local resultText, resultColor, resultUntil = nil, nil, 0
local mashCount_, mashStamps = 0, {}
local beatResult = {} -- beat index -> "perfect" | "good"
local lastTapSide

local GRADE = {
	perfect = { text = "PERFECT", color = Color3.fromRGB(255, 214, 90) },
	good = { text = "GOOD", color = Color3.fromRGB(90, 230, 150) },
	miss = { text = "MISS", color = Color3.fromRGB(255, 100, 120) },
}

local function serverNow()
	return workspace:GetServerTimeNow()
end

local function mode()
	return cfg and cfg.mode
end

--------------------------------------------------------------------------------
-- Sending presses
--------------------------------------------------------------------------------
local function ready()
	return active and cfg and serverNow() >= cfg.startedAt
end

local function sweepPress()
	if not ready() or pressed or mode() ~= "sweep" then
		return
	end
	pressed = true
	local now = serverNow()
	frozenPos = Util.tri((now - cfg.startedAt) * cfg.speed)
	Audio.click()
	Action:FireServer("TrainHit", now)
end

local function holdDown()
	if not active or not cfg or mode() ~= "hold" or pressed or holding or serverNow() < cfg.startedAt - 0.1 then
		return
	end
	holding, holdAt = true, serverNow()
	Audio.click()
	Action:FireServer("TrainDown")
end

local function holdUp()
	if not holding then
		return
	end
	holding = false
	pressed = true
	frozenLevel = math.clamp((serverNow() - holdAt) / cfg.fillTime, 0, 1.2)
	Action:FireServer("TrainHit")
end

local function beatTap(side)
	if not ready() or mode() ~= "rhythm" then
		return
	end
	lastTapSide = side
	Audio.click()
	Action:FireServer("TrainHit", side, serverNow())
end

local function mashTap()
	if not ready() or mode() ~= "mash" then
		return
	end
	local now = os.clock()
	for i = #mashStamps, 1, -1 do
		if now - mashStamps[i] > 1 then
			table.remove(mashStamps, i)
		end
	end
	if #mashStamps >= 12 then
		return
	end
	table.insert(mashStamps, now)
	mashCount_ += 1
	Audio.click()
	Action:FireServer("TrainHit", serverNow())
end

local function primaryDown()
	local m = mode()
	if m == "sweep" then
		sweepPress()
	elseif m == "hold" then
		holdDown()
	elseif m == "mash" then
		mashTap()
	end
end

local function primaryUp()
	if mode() == "hold" then
		holdUp()
	end
end

--------------------------------------------------------------------------------
-- Building the window
--------------------------------------------------------------------------------
local function bigButton(parent, props)
	props.Radius = props.Radius or 12
	props.ZIndex = props.ZIndex or 13
	props.TextSize = props.TextSize or 22
	return UI.button(parent, props, "primary")
end

local function layoutZones()
	if not cfg or not cfg.center then
		return
	end
	goodZone.Position = UDim2.fromScale(cfg.center - cfg.goodWidth / 2, 0)
	goodZone.Size = UDim2.fromScale(cfg.goodWidth, 1)
	perfectZone.Position = UDim2.fromScale(cfg.center - cfg.perfectWidth / 2, 0)
	perfectZone.Size = UDim2.fromScale(cfg.perfectWidth, 1)
end

local function showMode(m)
	barArea.Visible = m == "sweep" or m == "hold"
	fill.Visible = m == "hold"
	rhythmArea.Visible = m == "rhythm"
	mashArea.Visible = m == "mash"
	for name, frame in controls do
		frame.Visible = name == m
	end
end

local function loadCfg(newCfg)
	cfg = newCfg
	pressed = false
	holding = false
	frozenLevel = 0
	frozenPos = 0
	mashCount_ = 0
	mashStamps = {}
	beatResult = {}
	if not cfg then
		return
	end
	showMode(cfg.mode)
	if cfg.mode == "sweep" or cfg.mode == "hold" then
		layoutZones()
	end
	if cfg.mode == "rhythm" then
		for i, note in noteFrames do
			local beat = cfg.beats[i]
			note.Visible = beat ~= nil
			if beat then
				note.BackgroundColor3 = LANE_COLOR[beat.side]
				note.Position = UDim2.new(beat.side == "L" and 0.25 or 0.75, 0, 0, -30)
				note.Size = UDim2.fromOffset(34, 34)
				note.BackgroundTransparency = 0
				note:FindFirstChildOfClass("TextLabel").Text = beat.side == "L" and "A" or "D"
			end
		end
	end
	if cfg.mode == "mash" then
		mashBar.set(0)
		mashCount.Text = "0 / " .. cfg.target
	end
end

function TrainingUI.init(gui, action)
	Action = action
	panel = UI.panel(gui, {
		Name = "Training",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -66),
		Size = UDim2.fromOffset(460, 208),
		Visible = false,
		ZIndex = 10,
	})
	scale = UI.new("UIScale", {}, panel)
	title = UI.label(panel, {
		TextTruncate = Enum.TextTruncate.AtEnd,
		Position = UDim2.fromOffset(14, 8),
		Size = UDim2.new(1, -170, 0, 18),
		Font = UI.Fonts.Title,
		TextSize = 12,
		TextWrapped = false,
		Text = "TRAINING",
		ZIndex = 11,
	})
	dots = {}
	for i = 1, MAX_DOTS do
		local dot = UI.new("Frame", {
			AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, -40 - (MAX_DOTS - i) * 16, 0, 11),
			Size = UDim2.fromOffset(11, 11),
			BackgroundColor3 = C.Disabled,
			ZIndex = 11,
		}, panel)
		UI.corner(dot, 7)
		dots[i] = dot
	end
	local cancel = UI.button(panel, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -8, 0, 6),
		Size = UDim2.fromOffset(22, 22),
		Text = "✕",
		TextSize = 10,
		ZIndex = 12,
		Radius = 11,
	}, "card")
	cancel.Activated:Connect(function()
		Action:FireServer("TrainCancel")
	end)

	-- sweep / hold bar
	barArea = UI.new("Frame", { Position = UDim2.fromOffset(14, 34), Size = UDim2.new(1, -28, 0, 72), BackgroundTransparency = 1, ZIndex = 11 }, panel)
	local bar = UI.new("Frame", {
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.fromScale(0, 0.5),
		Size = UDim2.new(1, 0, 0, 34),
		BackgroundColor3 = Color3.fromRGB(14, 11, 32),
		ClipsDescendants = true,
		ZIndex = 11,
	}, barArea)
	UI.corner(bar, 12)
	UI.stroke(bar, C.Stroke, 1.5, 0.4)
	fill = UI.new("Frame", { BackgroundColor3 = C.Accent, BackgroundTransparency = 0.45, BorderSizePixel = 0, Size = UDim2.fromScale(0, 1), ZIndex = 11 }, bar)
	goodZone = UI.new("Frame", { BackgroundColor3 = C.Good, BackgroundTransparency = 0.35, BorderSizePixel = 0, ZIndex = 12 }, bar)
	perfectZone = UI.new("Frame", { BackgroundColor3 = C.Gold, BackgroundTransparency = 0.1, BorderSizePixel = 0, ZIndex = 13 }, bar)
	marker = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 0),
		Size = UDim2.new(0, 7, 1, 0),
		BackgroundColor3 = Color3.new(1, 1, 1),
		BorderSizePixel = 0,
		ZIndex = 14,
	}, bar)
	UI.corner(marker, 3)

	-- rhythm lanes
	rhythmArea = UI.new("Frame", { Position = UDim2.fromOffset(14, 34), Size = UDim2.new(1, -28, 0, 72), BackgroundColor3 = Color3.fromRGB(14, 11, 32), ClipsDescendants = true, Visible = false, ZIndex = 11 }, panel)
	UI.corner(rhythmArea, 12)
	UI.stroke(rhythmArea, C.Stroke, 1.5, 0.4)
	lanes = {}
	for i, side in { "L", "R" } do
		local lane = UI.new("Frame", { Position = UDim2.fromScale((i - 1) * 0.5, 0), Size = UDim2.fromScale(0.5, 1), BackgroundColor3 = LANE_COLOR[side], BackgroundTransparency = 0.88, BorderSizePixel = 0, ZIndex = 11 }, rhythmArea)
		lanes[side] = lane
	end
	hitLine = UI.new("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.fromScale(0, 0.82), Size = UDim2.new(1, 0, 0, 4), BackgroundColor3 = Color3.new(1, 1, 1), BorderSizePixel = 0, ZIndex = 12 }, rhythmArea)
	noteFrames = {}
	for i = 1, 6 do
		local note = UI.new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Size = UDim2.fromOffset(34, 34), Visible = false, ZIndex = 13 }, rhythmArea)
		UI.corner(note, 17)
		UI.stroke(note, Color3.new(1, 1, 1), 2, 0)
		UI.label(note, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Title, TextSize = 16, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, ZIndex = 14, Text = "" })
		noteFrames[i] = note
	end

	-- mash
	mashArea = UI.new("Frame", { Position = UDim2.fromOffset(14, 34), Size = UDim2.new(1, -28, 0, 72), BackgroundTransparency = 1, Visible = false, ZIndex = 11 }, panel)
	mashCount = UI.label(mashArea, { Position = UDim2.fromOffset(0, 2), Size = UDim2.new(1, 0, 0, 36), Font = UI.Fonts.Title, TextSize = 30, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, ZIndex = 12, Text = "" })
	mashBar = UI.bar(mashArea, { Position = UDim2.fromOffset(0, 42), Size = UDim2.new(1, 0, 0, 14) }, C.Good)
	mashTime = UI.bar(mashArea, { Position = UDim2.fromOffset(0, 60), Size = UDim2.new(1, 0, 0, 6) }, C.Orange)

	message = UI.label(panel, {
		Position = UDim2.fromOffset(14, 110),
		Size = UDim2.new(1, -28, 0, 22),
		Font = UI.Fonts.Title,
		TextSize = 17,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "",
		ZIndex = 11,
	})
	msgScale = UI.new("UIScale", {}, message)
	tip = UI.label(panel, {
		Position = UDim2.fromOffset(14, 132),
		Size = UDim2.new(1, -28, 0, 16),
		Font = UI.Fonts.Body,
		TextSize = 11,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "",
		ZIndex = 11,
	})

	-- the big buttons (one set per mode)
	local function row(name)
		local frame = UI.new("Frame", { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -8), Size = UDim2.new(1, -28, 0, 48), BackgroundTransparency = 1, Visible = false, ZIndex = 12 }, panel)
		controls[name] = frame
		return frame
	end
	local sweepButton = bigButton(row("sweep"), { Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.Good, Text = "LIFT!" })
	sweepButton.Activated:Connect(sweepPress)
	holdButton = bigButton(row("hold"), { Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.Accent2, Text = "HOLD TO PUSH" })
	holdButton.MouseButton1Down:Connect(holdDown)
	holdButton.MouseButton1Up:Connect(holdUp)
	holdButton.MouseLeave:Connect(holdUp)
	local rhythm = row("rhythm")
	local left = bigButton(rhythm, { Size = UDim2.new(0.5, -4, 1, 0), BackgroundColor3 = LANE_COLOR.L, Text = "◀  LEFT  (A)" })
	left.MouseButton1Down:Connect(function()
		beatTap("L")
	end)
	local right = bigButton(rhythm, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.fromScale(1, 0), Size = UDim2.new(0.5, -4, 1, 0), BackgroundColor3 = LANE_COLOR.R, Text = "RIGHT  (D)  ▶" })
	right.MouseButton1Down:Connect(function()
		beatTap("R")
	end)
	tapButton = bigButton(row("mash"), { Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.Good, Text = "TAP! TAP! TAP!" })
	tapButton.MouseButton1Down:Connect(mashTap)

	-- keyboard: SPACE does the main action, A / D (or the arrows) are the two sides
	ContextActionService:BindActionAtPriority("GlowTrainPress", function(_, state)
		if not active then
			return Enum.ContextActionResult.Pass
		end
		if state == Enum.UserInputState.Begin then
			primaryDown()
		elseif state == Enum.UserInputState.End then
			primaryUp()
		end
		return Enum.ContextActionResult.Sink
	end, false, Enum.ContextActionPriority.High.Value, Enum.KeyCode.Space)
	for _, entry in { { "GlowTrainLeft", "L", Enum.KeyCode.A, Enum.KeyCode.Left }, { "GlowTrainRight", "R", Enum.KeyCode.D, Enum.KeyCode.Right } } do
		ContextActionService:BindActionAtPriority(entry[1], function(_, state)
			if not active or mode() ~= "rhythm" then
				return Enum.ContextActionResult.Pass
			end
			if state == Enum.UserInputState.Begin then
				beatTap(entry[2])
			end
			return Enum.ContextActionResult.Sink
		end, false, Enum.ContextActionPriority.High.Value, entry[3], entry[4])
	end

	-- a click or tap anywhere in the world works too (in rhythm mode the left / right half of the screen is the side)
	UserInputService.InputBegan:Connect(function(input, processed)
		if not active or processed then
			return
		end
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			if mode() == "rhythm" then
				local x = input.Position and input.Position.X or 0
				beatTap(x < camera.ViewportSize.X / 2 and "L" or "R")
			else
				primaryDown()
			end
		end
	end)
	UserInputService.InputEnded:Connect(function(input)
		if active and (input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch) then
			primaryUp()
		end
	end)

	RunService.RenderStepped:Connect(function()
		if not active or not cfg then
			return
		end
		local now = serverNow()
		local m = cfg.mode
		local started = now >= cfg.startedAt
		local prompt, promptColor = "", C.Text
		if not started then
			prompt, promptColor = string.format("GET READY  %.1f", cfg.startedAt - now), C.Muted
		end
		if m == "sweep" then
			marker.Position = UDim2.fromScale(started and (pressed and frozenPos or Util.tri((now - cfg.startedAt) * cfg.speed)) or 0, 0)
			if started and not pressed then
				prompt = "NOW!"
			end
		elseif m == "hold" then
			local level = 0
			if holding then
				level = math.clamp((now - holdAt) / cfg.fillTime, 0, 1.2)
			elseif pressed then
				level = frozenLevel
			end
			if started and not pressed then
				prompt, promptColor = holding and "LET GO IN THE GOLD!" or "HOLD!", holding and C.Gold or C.Text
			end
			local shown = math.min(level, 1)
			fill.Size = UDim2.fromScale(shown, 1)
			marker.Position = UDim2.fromScale(shown, 0)
			local inZone = math.abs(shown - cfg.center) <= cfg.goodWidth / 2
			fill.BackgroundColor3 = (holding and inZone) and C.Gold or C.Accent
		elseif m == "rhythm" then
			local height = rhythmArea.AbsoluteSize.Y
			local hitY = height * 0.82
			for i, beat in cfg.beats do
				local note = noteFrames[i]
				if note then
					local t = beat.at + cfg.startedAt - now -- seconds until the beat
					if beatResult[i] then
						note.Visible = false
					else
						note.Visible = t > -0.35 and t < cfg.travel
						note.Position = UDim2.new(beat.side == "L" and 0.25 or 0.75, 0, 0, hitY - (t / cfg.travel) * (hitY + 20))
						note.Size = math.abs(t) <= cfg.window and UDim2.fromOffset(42, 42) or UDim2.fromOffset(34, 34)
					end
				end
			end
			if now > cfg.startedAt - 1.2 then
				prompt, promptColor = "HIT THE LINE!", C.Text
			end
		elseif m == "mash" then
			local left = cfg.startedAt + cfg.duration - now
			mashCount.Text = mashCount_ .. " / " .. cfg.target
			mashBar.set(math.min(1, mashCount_ / cfg.target))
			mashBar.fill.BackgroundColor3 = mashCount_ >= cfg.target and C.Gold or C.Good
			mashTime.set(started and math.clamp(left / cfg.duration, 0, 1) or 1)
			if started then
				prompt = left > 0 and string.format("TAP!  %.1fs", left) or "..."
				promptColor = mashCount_ >= cfg.target and C.Gold or C.Text
			end
		end
		-- the latest result stays up for a moment, then the prompt returns
		if resultText and os.clock() < resultUntil then
			message.Text, message.TextColor3 = resultText, resultColor
		else
			message.Text, message.TextColor3 = prompt, promptColor
		end
	end)
end

--------------------------------------------------------------------------------
-- Server messages
--------------------------------------------------------------------------------
function TrainingUI.start(statId, firstCfg, kg, tierName, machineId)
	stat = statId
	local def = Config.Stats[statId]
	machine = Config.GymMachineById[machineId or ""] or Config.StatMachines[statId] or Config.GymMachineById.rack
	active = true
	resultText, resultUntil = nil, 0
	local heading = machine.Icon .. "  " .. machine.Name:upper()
	if statId == "Power" and kg then
		heading ..= string.format("  ·  %s %s KG", tostring(tierName or "Iron"):upper(), Util.fmt(kg))
	end
	title.Text = heading
	title.TextColor3 = def.Color
	tip.Text = machine.Tip or ""
	local reps = (firstCfg and firstCfg.reps) or Config.TrainReps
	for i, dot in dots do
		dot.Visible = i <= reps
		dot.BackgroundColor3 = C.Disabled
	end
	loadCfg(firstCfg)
	panel.Visible = true
	UI.pop(scale, 0.92)
end

function TrainingUI.rep(repIndex, grade, gain, streak, nextCfg)
	local g = GRADE[grade]
	if not g or not stat then
		return
	end
	if dots[repIndex] then
		dots[repIndex].BackgroundColor3 = g.color
	end
	local def = Config.Stats[stat]
	local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
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
		if root then
			Fx.floatText(root.Position + Vector3.new(0, 3.5, 0), string.format("+%.1f %s", gain, def and def.Name or ""), g.color, grade == "perfect" and 26 or 20)
			Fx.burst(root.Position, g.color, grade == "perfect" and 18 or 8)
		end
	end
	resultColor = g.color
	resultUntil = os.clock() + 1.0
	UI.pop(msgScale, 1.2)
	if nextCfg then
		loadCfg(nextCfg)
	end
end

-- The server graded one beat of a rhythm machine.
function TrainingUI.beat(index, accuracy)
	beatResult[index] = accuracy
	local g = GRADE[accuracy]
	if not g then
		return
	end
	resultText, resultColor, resultUntil = g.text .. "!", g.color, os.clock() + 0.45
	UI.pop(msgScale, 1.25)
	if accuracy == "perfect" then
		Audio.pickup(10, 3)
	else
		Audio.pickup(4, 1)
	end
	local lane = cfg and cfg.beats and cfg.beats[index] and lanes[cfg.beats[index].side]
	if lane then
		lane.BackgroundTransparency = 0.4
		UI.tween(lane, 0.3, { BackgroundTransparency = 0.88 })
	end
end

function TrainingUI.finish(statId, total, clean, record)
	active = false
	cfg = nil
	holding = false
	if statId and total and total > 0 then
		local def = Config.Stats[statId]
		Toasts.push(string.format("%s +%.1f %s%s", def.Icon, total, def.Name, clean and "  ·  CLEAN SET +25%!" or ""), clean and "gold" or "good")
		if record then
			Toasts.push("🏅 NEW RECORD on the " .. (machine and machine.Name or "machine") .. "!", "gold")
			Audio.levelUp(false)
		end
		Audio.quest()
	end
	task.delay(statId and 1.2 or 0, function()
		if not active then
			panel.Visible = false
		end
	end)
end

return TrainingUI

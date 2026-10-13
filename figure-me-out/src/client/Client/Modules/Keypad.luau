-- FIGURE ME OUT: the guess panel. Press G (or tap GUESS): pick who you mean from the list of people you can see (the one under
-- the crosshair is chosen for you), type their three digits and press CONFIRM (or Enter). The panel tells you what a wrong
-- guess costs before you commit, and shows the cooldown. Nothing here ever shows a number: you have to find it yourself.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))
local Rules = require(Shared:WaitForChild("Rules"))
local View = require(script.Parent:WaitForChild("View"))

local Keypad = {}

local player = Players.LocalPlayer
local C = UI.Colors
local deps
local panel, slotLabels, title, cooldownLabel, confirm, chipRow
local typed = ""
local target = nil
local lastGuessAt = -100
local chips = {}

local DIGIT_KEYS = {}
for i = 0, 9 do
	DIGIT_KEYS[Enum.KeyCode[({ "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine" })[i + 1]]] = tostring(i)
	DIGIT_KEYS[Enum.KeyCode[({ "KeypadZero", "KeypadOne", "KeypadTwo", "KeypadThree", "KeypadFour", "KeypadFive", "KeypadSix", "KeypadSeven", "KeypadEight", "KeypadNine" })[i + 1]]] = tostring(i)
end

function Keypad.isOpen()
	return panel ~= nil and panel.Visible
end

function Keypad.target()
	return target
end

local function redraw()
	for i, l in slotLabels do
		local ch = string.sub(typed, i, i)
		l.Text = ch ~= "" and ch or "_"
		l.TextColor3 = ch ~= "" and C.Text or C.Muted
	end
	local ready = #typed == Config.Number.Digits and target ~= nil
	confirm.BackgroundColor3 = ready and C.Good or C.Disabled
	confirm.Text = ready and "CONFIRM" or "TYPE 3 DIGITS"
end

-- People you could guess right now: alive, in sight, in range. Nearest first, the crosshair target first of all.
local function candidates()
	local head = View.myHead()
	local list = {}
	if not head then
		return list
	end
	local camera = View.camera()
	local origin = camera and camera.CFrame.Position or head.Position
	for _, e in View.aliveOthers() do
		local distance = (e.head.Position - head.Position).Magnitude
		if distance <= Config.Guess.MaxDistance and not View.blocked(origin, e.head.Position) then
			e.distance = distance
			table.insert(list, e)
		end
	end
	table.sort(list, function(a, b)
		return a.distance < b.distance
	end)
	return list
end

local function setTarget(entity)
	target = entity
	if entity then
		title.Text = "WHO IS " .. entity.icon .. " " .. string.upper(entity.code) .. "?"
	else
		title.Text = "AIM AT SOMEONE"
	end
	for id, chip in chips do
		chip.stroke.Transparency = (entity and id == entity.id) and 0 or 1
		chip.button.BackgroundColor3 = (entity and id == entity.id) and C.Accent2 or C.Card
	end
	redraw()
end

local function refreshChips()
	for _, chip in chips do
		chip.button:Destroy()
	end
	chips = {}
	local aimed = View.aimed()
	local list = candidates()
	if aimed then
		for i, e in list do
			if e.id == aimed.id then
				table.remove(list, i)
				table.insert(list, 1, e)
				break
			end
		end
	end
	for i = 1, math.min(5, #list) do
		local e = list[i]
		local b = UI.button(chipRow, {
			LayoutOrder = i,
			Size = UDim2.fromOffset(98, 40),
			Text = e.icon .. " " .. e.code .. "\n" .. math.floor(e.distance + 0.5) .. " m",
			TextSize = 11,
			TextWrapped = true,
			BackgroundColor3 = C.Card,
			ZIndex = 32,
		}, "card")
		local st = UI.stroke(b, C.Accent, 3, 1)
		b.MouseButton1Click:Connect(function()
			Audio.click()
			typed = ""
			setTarget(e)
		end)
		chips[e.id] = { button = b, stroke = st, entity = e }
	end
	return list
end

function Keypad.init(gui, d)
	deps = d
	panel = UI.panel(gui, {
		Name = "Keypad",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -84),
		Size = UDim2.fromOffset(340, 430),
		Visible = false,
		ZIndex = 30,
	})
	UI.modal(panel)
	title = UI.label(panel, { Position = UDim2.fromOffset(0, 8), Size = UDim2.new(1, 0, 0, 24), Font = UI.Fonts.Title, TextSize = 18, TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = C.Accent, Text = "WHO IS IT?", ZIndex = 31 })
	chipRow = UI.new("Frame", { Position = UDim2.fromOffset(10, 36), Size = UDim2.new(1, -20, 0, 44), BackgroundTransparency = 1, ZIndex = 31 }, panel)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 4), SortOrder = Enum.SortOrder.LayoutOrder }, chipRow)
	slotLabels = {}
	for i = 1, Config.Number.Digits do
		local box = UI.new("Frame", { Position = UDim2.fromOffset(62 + (i - 1) * 78, 90), Size = UDim2.fromOffset(68, 56), BackgroundColor3 = C.Bg, BorderSizePixel = 0, ZIndex = 31 }, panel)
		UI.corner(box, 10)
		UI.stroke(box, C.Accent, 2)
		slotLabels[i] = UI.label(box, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Title, TextSize = 36, TextXAlignment = Enum.TextXAlignment.Center, Text = "_", ZIndex = 32 })
	end
	UI.label(panel, {
		Position = UDim2.fromOffset(14, 152),
		Size = UDim2.new(1, -28, 0, 30),
		Font = UI.Fonts.Bold,
		TextSize = 11,
		TextColor3 = C.Orange,
		TextXAlignment = Enum.TextXAlignment.Center,
		Text = "⚠ A wrong guess costs a bullet, freezes you for " .. Config.Guess.Stun .. "s, and shows them where you are.",
		ZIndex = 31,
	})
	cooldownLabel = UI.label(panel, { Position = UDim2.fromOffset(0, 184), Size = UDim2.new(1, 0, 0, 16), Font = UI.Fonts.Bold, TextSize = 12, TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = C.Good, Text = "READY", ZIndex = 31 })
	for n = 1, 10 do
		local digit = n == 10 and 0 or n
		local row, col = math.floor((n - 1) / 3), (n - 1) % 3
		if n == 10 then
			row, col = 3, 1
		end
		local b = UI.button(panel, { Position = UDim2.fromOffset(40 + col * 90, 204 + row * 42), Size = UDim2.fromOffset(80, 36), Text = tostring(digit), TextSize = 20, BackgroundColor3 = C.Card, ZIndex = 31 }, "card")
		b.MouseButton1Click:Connect(function()
			Keypad.press(tostring(digit))
		end)
	end
	local back = UI.button(panel, { Position = UDim2.fromOffset(40, 204 + 3 * 42), Size = UDim2.fromOffset(80, 36), Text = "⌫", TextSize = 20, BackgroundColor3 = C.Card, ZIndex = 31 }, "card")
	back.MouseButton1Click:Connect(function()
		Keypad.back()
	end)
	local cancel = UI.button(panel, { Position = UDim2.fromOffset(220, 204 + 3 * 42), Size = UDim2.fromOffset(80, 36), Text = "✕", TextSize = 20, BackgroundColor3 = C.Danger, ZIndex = 31 })
	cancel.MouseButton1Click:Connect(function()
		Keypad.close()
	end)
	confirm = UI.button(panel, { Position = UDim2.fromOffset(40, 204 + 4 * 42 + 4), Size = UDim2.fromOffset(260, 40), Text = "TYPE 3 DIGITS", TextSize = 18, BackgroundColor3 = C.Disabled, ZIndex = 31 })
	confirm.MouseButton1Click:Connect(function()
		Keypad.submit()
	end)
	task.spawn(function()
		while true do
			task.wait(0.2)
			if panel.Visible then
				Keypad.update()
			end
		end
	end)
end

function Keypad.update()
	local now = View.now()
	local wait = lastGuessAt + Config.Guess.Cooldown - now
	if player:GetAttribute("Stunned") == true then
		cooldownLabel.Text = "FROZEN"
		cooldownLabel.TextColor3 = C.Danger
	elseif wait > 0 then
		cooldownLabel.Text = "COOLDOWN " .. string.format("%.1f", wait) .. "s"
		cooldownLabel.TextColor3 = C.Orange
	else
		cooldownLabel.Text = "READY  •  " .. (player:GetAttribute("Bullets") or 0) .. " bullets"
		cooldownLabel.TextColor3 = C.Good
	end
	-- the person left sight or went out: forget them
	if target then
		local e = View.byId(target.id)
		if not e or not e.alive then
			typed = ""
			setTarget(nil)
		end
	end
end

-- Opens the panel for whoever is under the crosshair (or `entity` when given, or the nearest person in sight).
function Keypad.open(entity)
	if not panel then
		return false
	end
	if View.phase() ~= "play" or not View.amAlive() then
		return false
	end
	typed = ""
	local list = refreshChips()
	entity = entity or View.aimed() or list[1]
	if not entity then
		deps.Toasts.push("Nobody in sight: aim at someone first", "bad")
		Audio.error()
		return false
	end
	setTarget(entity)
	panel.Visible = true
	Keypad.update()
	Audio.click()
	return true
end

function Keypad.close()
	if panel then
		panel.Visible = false
	end
	typed = ""
	target = nil
end

function Keypad.back()
	if #typed > 0 then
		typed = string.sub(typed, 1, #typed - 1)
		redraw()
	end
end

function Keypad.press(ch)
	if not Keypad.isOpen() or #typed >= Config.Number.Digits then
		return
	end
	typed ..= ch
	Audio.play("Click", 1 + #typed * 0.12, 0.5)
	redraw()
	if #typed == Config.Number.Digits and Config.Guess.AutoSubmit then
		Keypad.submit()
	end
end

function Keypad.submit()
	local digits = Rules.parseGuess(typed)
	if not digits or not target then
		Audio.error()
		return
	end
	local id = target.id
	lastGuessAt = View.now()
	deps.send("Guess", id, digits)
	deps.Controls.guessSent(target)
	Keypad.close()
end

-- Called with every key press while the panel is open. Returns true when the key was used.
function Keypad.key(input)
	if not Keypad.isOpen() then
		return false
	end
	local digit = DIGIT_KEYS[input.KeyCode]
	if digit then
		Keypad.press(digit)
		return true
	end
	if input.KeyCode == Enum.KeyCode.Backspace then
		Keypad.back()
		return true
	elseif input.KeyCode == Enum.KeyCode.Return or input.KeyCode == Enum.KeyCode.KeypadEnter then
		Keypad.submit()
		return true
	elseif input.KeyCode == Enum.KeyCode.Escape or input.KeyCode == Enum.KeyCode.G then
		Keypad.close()
		return true
	end
	return false
end

return Keypad

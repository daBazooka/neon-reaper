-- FIGURE ME OUT: the guess keypad. Press G while aiming at someone, type their three digits and it fires by itself.
-- Works with the keyboard and with the on-screen buttons (for phones and tablets).
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))
local Rules = require(Shared:WaitForChild("Rules"))
local View = require(script.Parent:WaitForChild("View"))

local Keypad = {}

local C = UI.Colors
local deps
local panel, slotLabels, title, sub
local typed = ""
local target = nil

local DIGIT_KEYS = {}
for i = 0, 9 do
	DIGIT_KEYS[Enum.KeyCode[({ "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine" })[i + 1]]] = tostring(i)
	DIGIT_KEYS[Enum.KeyCode[({ "KeypadZero", "KeypadOne", "KeypadTwo", "KeypadThree", "KeypadFour", "KeypadFive", "KeypadSix", "KeypadSeven", "KeypadEight", "KeypadNine" })[i + 1]]] = tostring(i)
end

function Keypad.isOpen()
	return panel ~= nil and panel.Visible
end

local function redraw()
	for i, l in slotLabels do
		local ch = string.sub(typed, i, i)
		l.Text = ch ~= "" and ch or "_"
		l.TextColor3 = ch ~= "" and C.Text or C.Muted
	end
end

function Keypad.init(gui, d)
	deps = d
	panel = UI.panel(gui, {
		Name = "Keypad",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -90),
		Size = UDim2.fromOffset(300, 292),
		Visible = false,
		ZIndex = 30,
	})
	title = UI.label(panel, {
		Position = UDim2.fromOffset(0, 8),
		Size = UDim2.new(1, 0, 0, 24),
		Font = UI.Fonts.Title,
		TextSize = 18,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = C.Accent,
		Text = "WHO IS IT?",
		ZIndex = 31,
	})
	sub = UI.label(panel, {
		Position = UDim2.fromOffset(0, 30),
		Size = UDim2.new(1, 0, 0, 16),
		Font = UI.Fonts.Bold,
		TextSize = 12,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = C.Muted,
		Text = "type their 3 digits",
		ZIndex = 31,
	})
	slotLabels = {}
	for i = 1, Config.Number.Digits do
		local box = UI.new("Frame", {
			Position = UDim2.fromOffset(50 + (i - 1) * 68, 52),
			Size = UDim2.fromOffset(60, 52),
			BackgroundColor3 = C.Bg,
			BorderSizePixel = 0,
			ZIndex = 31,
		}, panel)
		UI.corner(box, 10)
		UI.stroke(box, C.Accent, 2)
		slotLabels[i] = UI.label(box, {
			Size = UDim2.fromScale(1, 1),
			Font = UI.Fonts.Title,
			TextSize = 34,
			TextXAlignment = Enum.TextXAlignment.Center,
			Text = "_",
			ZIndex = 32,
		})
	end
	for n = 1, 10 do
		local digit = n == 10 and 0 or n
		local row, col = math.floor((n - 1) / 3), (n - 1) % 3
		if n == 10 then
			row, col = 3, 1
		end
		local b = UI.button(panel, {
			Position = UDim2.fromOffset(40 + col * 78, 114 + row * 42),
			Size = UDim2.fromOffset(70, 36),
			Text = tostring(digit),
			TextSize = 20,
			BackgroundColor3 = C.Card,
			ZIndex = 31,
		}, "card")
		b.MouseButton1Click:Connect(function()
			Keypad.press(tostring(digit))
		end)
	end
	local back = UI.button(panel, {
		Position = UDim2.fromOffset(40, 114 + 3 * 42),
		Size = UDim2.fromOffset(70, 36),
		Text = "⌫",
		TextSize = 20,
		BackgroundColor3 = C.Card,
		ZIndex = 31,
	}, "card")
	back.MouseButton1Click:Connect(function()
		Keypad.back()
	end)
	local cancel = UI.button(panel, {
		Position = UDim2.fromOffset(196, 114 + 3 * 42),
		Size = UDim2.fromOffset(70, 36),
		Text = "✕",
		TextSize = 20,
		BackgroundColor3 = C.Danger,
		ZIndex = 31,
	})
	cancel.MouseButton1Click:Connect(function()
		Keypad.close()
	end)
end

-- Opens the keypad for whoever is under the crosshair (or for `entity` when given). Returns true when it opened.
function Keypad.open(entity)
	if not panel then
		return false
	end
	if View.phase() ~= "play" or not View.amAlive() then
		return false
	end
	entity = entity or View.aimed()
	if not entity then
		deps.Toasts.push("Aim at someone first", "bad")
		Audio.error()
		return false
	end
	target = entity
	typed = ""
	title.Text = "WHO IS " .. entity.icon .. " " .. string.upper(entity.code) .. "?"
	sub.Text = "type their 3 digits"
	redraw()
	panel.Visible = true
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
	if #typed == Config.Number.Digits then
		Keypad.submit()
	end
end

function Keypad.submit()
	local digits = Rules.parseGuess(typed)
	if not digits or not target then
		return
	end
	local id = target.id
	deps.send("Guess", id, digits)
	deps.Controls.guessSent(target)
	Keypad.close()
end

-- Called with every key press while the keypad is open. Returns true when the key was used.
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
	elseif input.KeyCode == Enum.KeyCode.Escape or input.KeyCode == Enum.KeyCode.G then
		Keypad.close()
		return true
	end
	return false
end

return Keypad

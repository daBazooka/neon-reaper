-- FIGURE ME OUT: the screen of the original game, and nothing else. A red box and a blue box with the team scores (a little flag
-- icon beside a box when that team's flag has been taken), the timer under them, three X marks for your strikes (covering your
-- number, camping), a dot for a crosshair, one short line at the bottom ("You killed Michael"), and two item slots, F and G.
-- Your own number sits on a small mustard sign on the left, so you know what to hide. It has the same public functions as the
-- older glass screen (Hud.lua), so the rest of the client does not care which one is running (Config.Hud.Style picks it).
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))
local View = require(script.Parent:WaitForChild("View"))

local Hud = {}

local player = Players.LocalPlayer
local C = UI.Colors
local deps
local gui
local refs = {}
local slots = {} -- key ("F" / "G") -> { frame, icon, count, shade, cd, key }
local cooldowns = {} -- item id -> time it is ready again
local held = nil -- "F" or "G": the slot you are holding right now (binoculars up, or the older take-out-then-click way)
local pulse = {} -- key -> time until which the slot lights up after a one-press use
local shown = nil -- { id, untilT }: the camera or grenade drawn for a moment after a one-press use
local lastSecond = -1
local finalShown = false
local uiScale = 1
local scaleObjects = {}
local scaleAt = -10
local messages = {}
local playStart = nil -- when the current match started playing (for the first-matches hint)

local RED, BLUE = Color3.fromRGB(236, 72, 84), Color3.fromRGB(58, 128, 244)
local SIGN, INK = Color3.fromRGB(226, 178, 34), Color3.fromRGB(22, 20, 16)

local function clock(seconds)
	seconds = math.max(0, math.floor(seconds))
	return string.format("%02d:%02d", seconds // 60, seconds % 60)
end

local function box(parent, props, color, radius)
	local f = UI.new("Frame", props, parent)
	f.BackgroundColor3 = color
	f.BorderSizePixel = 0
	UI.corner(f, radius or 8)
	return f
end

local function scaled(obj)
	local s = UI.new("UIScale", {}, obj)
	table.insert(scaleObjects, s)
	return s
end

--------------------------------------------------------------------------------
-- Building the screen
--------------------------------------------------------------------------------
local function buildScores(root)
	local row = UI.new("Frame", { Name = "Scores", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 10), Size = UDim2.fromOffset(330, 52), BackgroundTransparency = 1 }, root)
	scaled(row)
	refs.scoreRow = row
	local function scoreBox(name, x, color)
		local b = box(row, { Name = name, Position = UDim2.fromOffset(x, 0), Size = UDim2.fromOffset(128, 50) }, color, 10)
		UI.stroke(b, Color3.new(1, 1, 1), 2.5, 0.05)
		UI.gradient(b, Color3.new(1, 1, 1), Color3.fromRGB(205, 205, 215), 90)
		local n = UI.label(b, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Title, TextSize = 32, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 0.75, Text = "0" })
		return b, n
	end
	refs.redBox, refs.redScore = scoreBox("Red", 0, RED)
	refs.blueBox, refs.blueScore = scoreBox("Blue", 202, BLUE)
	UI.label(row, { Position = UDim2.fromOffset(128, 0), Size = UDim2.fromOffset(74, 50), Font = UI.Fonts.Title, TextSize = 28, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "-" })
	-- the flag icons: red's sits left of the red box, blue's right of the blue box
	refs.redFlag = UI.label(row, { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(0, -4, 0.5, 0), Size = UDim2.fromOffset(34, 40), Font = UI.Fonts.Title, TextSize = 34, TextColor3 = RED, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "⚑", Visible = false })
	refs.blueFlag = UI.label(row, { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(1, 4, 0.5, 0), Size = UDim2.fromOffset(34, 40), Font = UI.Fonts.Title, TextSize = 34, TextColor3 = BLUE, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "⚑", Visible = false })
	-- free for all: one dark box with the number of people still in
	refs.aliveBox = box(row, { Name = "Alive", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 0), Size = UDim2.fromOffset(150, 50), Visible = false }, Color3.fromRGB(36, 40, 52), 10)
	UI.stroke(refs.aliveBox, Color3.new(1, 1, 1), 2.5, 0.05)
	refs.aliveText = UI.label(refs.aliveBox, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Title, TextSize = 26, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "" })
	-- timer and strikes under the boxes
	local under = UI.new("Frame", { Name = "Under", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 64), Size = UDim2.fromOffset(300, 90), BackgroundTransparency = 1 }, root)
	scaled(under)
	refs.timer = UI.label(under, { Position = UDim2.fromOffset(0, 0), Size = UDim2.new(1, 0, 0, 26), Font = UI.Fonts.Title, TextSize = 22, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 0.45, Text = "00:00" })
	refs.status = UI.label(under, { Position = UDim2.fromOffset(0, 26), Size = UDim2.new(1, 0, 0, 18), Font = UI.Fonts.Bold, TextSize = 13, TextColor3 = C.Muted, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "" })
	refs.strikes = {}
	local strikeRow = UI.new("Frame", { Name = "Strikes", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 30), Size = UDim2.fromOffset(180, 56), BackgroundTransparency = 1 }, under)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6), HorizontalAlignment = Enum.HorizontalAlignment.Center, SortOrder = Enum.SortOrder.LayoutOrder }, strikeRow)
	for i = 1, 3 do
		refs.strikes[i] = UI.label(strikeRow, { LayoutOrder = i, Size = UDim2.fromOffset(52, 52), Font = UI.Fonts.Title, TextSize = 50, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextColor3 = Color3.fromRGB(190, 190, 198), TextStrokeColor3 = Color3.new(1, 1, 1), TextStrokeTransparency = 0.35, Text = "✕" })
	end
	refs.strikeRow = strikeRow
end

local function buildSlots(root)
	local bar = UI.new("Frame", { Name = "Slots", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -22), Size = UDim2.fromOffset(190, 100), BackgroundTransparency = 1 }, root)
	scaled(bar)
	refs.slotBar = bar
	for i, key in { "F", "G" } do
		local f = UI.new("TextButton", {
			Name = "Slot" .. key,
			Position = UDim2.fromOffset((i - 1) * 100, 0),
			Size = UDim2.fromOffset(90, 90),
			BackgroundColor3 = Color3.fromRGB(20, 24, 28),
			BackgroundTransparency = 0.45,
			AutoButtonColor = false,
			BorderSizePixel = 0,
			Text = "",
		}, bar)
		UI.corner(f, 12)
		local stroke = UI.stroke(f, Color3.new(1, 1, 1), 2.5, 0.05)
		local icon = UI.label(f, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Title, TextSize = 44, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 1, Text = "" })
		local count = UI.label(f, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -6, 0, 3), Size = UDim2.fromOffset(30, 20), Font = UI.Fonts.Title, TextSize = 16, TextXAlignment = Enum.TextXAlignment.Right, TextWrapped = false, Text = "" })
		local shade = box(f, { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 5 }, Color3.new(0, 0, 0), 12)
		local cd = UI.label(f, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Title, TextSize = 26, TextXAlignment = Enum.TextXAlignment.Center, Text = "", ZIndex = 6 })
		-- the little key tag at the bottom-left corner
		local tag = box(f, { Position = UDim2.fromOffset(-6, 70), Size = UDim2.fromOffset(26, 26), ZIndex = 7 }, Color3.fromRGB(250, 250, 250), 6)
		UI.stroke(tag, Color3.fromRGB(60, 60, 66), 1.5, 0.2)
		UI.label(tag, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Title, TextSize = 17, TextColor3 = Color3.fromRGB(40, 40, 46), TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 1, Text = key, ZIndex = 8 })
		f.MouseButton1Click:Connect(function()
			Hud.pressSlot(key, UserInputService.TouchEnabled)
		end)
		slots[key] = { frame = f, stroke = stroke, icon = icon, count = count, shade = shade, cd = cd }
	end
end

-- What you hold in your hands, drawn big at the bottom of the screen: the binoculars (black barrels, a teal band, an orange rim) or
-- the camera. (The original game shows a 3D model; flat shapes keep it light and work on every device.)
local function buildViewmodels(root)
	local vm = UI.new("Frame", { Name = "Viewmodel", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Visible = false, ZIndex = 12 }, root)
	refs.viewmodel = vm
	refs.binos = UI.new("Frame", { Name = "Binoculars", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, 70), Size = UDim2.fromOffset(420, 330), BackgroundTransparency = 1, ZIndex = 12, Visible = false }, vm)
	for _, x in { 0, 220 } do
		local barrel = box(refs.binos, { Position = UDim2.fromOffset(x, 0), Size = UDim2.fromOffset(190, 330), ZIndex = 12 }, Color3.fromRGB(28, 30, 34), 36)
		box(barrel, { Position = UDim2.fromOffset(0, 150), Size = UDim2.fromOffset(190, 180), ZIndex = 12 }, Color3.fromRGB(40, 150, 150), 30)
		box(barrel, { Position = UDim2.fromOffset(-4, 128), Size = UDim2.fromOffset(198, 26), ZIndex = 13 }, Color3.fromRGB(232, 150, 36), 12)
		local lens = box(barrel, { Position = UDim2.fromOffset(22, 8), Size = UDim2.fromOffset(146, 70), ZIndex = 13 }, Color3.fromRGB(8, 10, 14), 35)
		UI.stroke(lens, Color3.fromRGB(70, 74, 82), 4, 0)
	end
	box(refs.binos, { Position = UDim2.fromOffset(180, 150), Size = UDim2.fromOffset(60, 60), ZIndex = 11 }, Color3.fromRGB(70, 66, 60), 10)
	refs.camera = UI.new("Frame", { Name = "CameraModel", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, 40), Size = UDim2.fromOffset(300, 200), BackgroundTransparency = 1, ZIndex = 12, Visible = false }, vm)
	local body = box(refs.camera, { Size = UDim2.fromScale(1, 1), ZIndex = 12 }, Color3.fromRGB(38, 40, 46), 22)
	UI.stroke(body, Color3.fromRGB(92, 96, 104), 3, 0)
	box(body, { Position = UDim2.fromOffset(20, 16), Size = UDim2.fromOffset(60, 24), ZIndex = 13 }, Color3.fromRGB(230, 70, 70), 8)
	local lens = box(body, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.55), Size = UDim2.fromOffset(120, 120), ZIndex = 13 }, Color3.fromRGB(14, 16, 20), 60)
	UI.stroke(lens, Color3.fromRGB(150, 156, 166), 6, 0)
	box(lens, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(60, 60), ZIndex = 14 }, Color3.fromRGB(40, 70, 110), 30)
	refs.grenade = UI.label(vm, { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.62, 0, 1, -20), Size = UDim2.fromOffset(160, 160), Font = UI.Fonts.Title, TextSize = 120, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 1, Text = "", ZIndex = 12, Visible = false })
end

-- The waiting card: shown to everybody who is not playing right now (somebody who arrived late, or who is out). It says what is
-- going on and exactly when they will be in a match.
local function buildWaiting(root)
	local card = UI.new("Frame", { Name = "Waiting", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0.2, 0), Size = UDim2.fromOffset(460, 198), BackgroundColor3 = Color3.fromRGB(16, 20, 26), BackgroundTransparency = 0.35, BorderSizePixel = 0, Visible = false, ZIndex = 18 }, root)
	UI.corner(card, 16)
	UI.stroke(card, Color3.new(1, 1, 1), 2, 0.45)
	scaled(card)
	refs.wait = card
	refs.waitTitle = UI.label(card, { Position = UDim2.fromOffset(0, 10), Size = UDim2.new(1, 0, 0, 34), Font = UI.Fonts.Title, TextSize = 28, TextColor3 = C.Gold, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "", ZIndex = 19 })
	refs.waitMode = UI.label(card, { Position = UDim2.fromOffset(0, 46), Size = UDim2.new(1, 0, 0, 24), Font = UI.Fonts.Bold, TextSize = 19, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "", ZIndex = 19 })
	refs.waitInfo = UI.label(card, { Position = UDim2.fromOffset(0, 72), Size = UDim2.new(1, 0, 0, 24), Font = UI.Fonts.Bold, TextSize = 18, TextColor3 = C.Muted, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "", ZIndex = 19 })
	refs.waitWatch = UI.button(card, { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 150), Size = UDim2.fromOffset(250, 40), Text = "👁 WATCH THE MATCH", TextSize = 18, BackgroundColor3 = Color3.fromRGB(70, 130, 210), ZIndex = 20, Visible = false }, "card")
	refs.waitWatch.MouseButton1Click:Connect(function()
		Audio.click()
		deps.Spectate.toggleWatch()
	end)
	-- READY: when everybody here presses it the next match starts at once (no waiting out the clock)
	refs.waitReady = UI.button(card, { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 150), Size = UDim2.fromOffset(300, 40), Text = "▶ READY: start now", TextSize = 18, BackgroundColor3 = Color3.fromRGB(60, 170, 90), ZIndex = 20, Visible = false }, "card")
	refs.waitReady.MouseButton1Click:Connect(function()
		Audio.click()
		deps.send("Ready", player:GetAttribute("Ready") ~= true)
	end)
	refs.waitNext = UI.label(card, { Position = UDim2.fromOffset(10, 100), Size = UDim2.new(1, -20, 0, 42), Font = UI.Fonts.Bold, TextSize = 18, TextColor3 = C.Mint, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = true, Text = "", ZIndex = 19 })
end

function Hud.init(screen, d)
	gui = screen
	deps = d
	local root = UI.new("Frame", { Name = "Hud", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1 }, gui)
	refs.root = root
	buildWaiting(root)
	buildViewmodels(root)
	buildScores(root)
	buildSlots(root)

	-- crosshair: a small white dot with a dark ring
	refs.cross = UI.new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(9, 9), BackgroundColor3 = Color3.new(1, 1, 1), BorderSizePixel = 0, ZIndex = 14 }, root)
	UI.corner(refs.cross, 5)
	refs.crossStroke = UI.stroke(refs.cross, Color3.fromRGB(30, 34, 40), 1.5, 0.15)

	-- your own number on a small mustard sign (left, middle of the screen)
	local sign = box(root, { Name = "MySign", AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 14, 0.45, 0), Size = UDim2.fromOffset(150, 78) }, SIGN, 10)
	UI.stroke(sign, Color3.fromRGB(150, 108, 14), 2.5, 0)
	scaled(sign)
	refs.sign = sign
	refs.signCaption = UI.label(sign, { Position = UDim2.fromOffset(0, 5), Size = UDim2.new(1, 0, 0, 16), Font = UI.Fonts.Bold, TextSize = 12, TextColor3 = Color3.fromRGB(80, 56, 8), TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 1, Text = "YOUR NUMBER" })
	refs.meDigits = UI.label(sign, { Position = UDim2.fromOffset(0, 20), Size = UDim2.new(1, 0, 0, 54), Font = UI.Fonts.Title, TextSize = 44, TextColor3 = INK, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 1, Text = "----" })
	refs.sign.Visible = false

	-- the lobby: your level and coins (small, bottom left) and the emote button
	local profile = UI.new("Frame", { Name = "Profile", AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 14, 1, -14), Size = UDim2.fromOffset(260, 124), BackgroundTransparency = 1 }, root)
	scaled(profile)
	refs.profile = profile
	refs.level = UI.label(profile, { Position = UDim2.fromOffset(0, 0), Size = UDim2.fromOffset(150, 24), Font = UI.Fonts.Title, TextSize = 20, TextWrapped = false, Text = "LEVEL 1" })
	refs.coins = UI.label(profile, { Position = UDim2.fromOffset(120, 2), Size = UDim2.fromOffset(120, 22), Font = UI.Fonts.Title, TextSize = 18, TextColor3 = C.Gold, TextXAlignment = Enum.TextXAlignment.Right, TextWrapped = false, Text = "🪙 0" })
	refs.xpBar = UI.bar(profile, { Position = UDim2.fromOffset(0, 28), Size = UDim2.fromOffset(240, 10) }, C.Good)
	refs.xpText = UI.label(profile, { Position = UDim2.fromOffset(0, 40), Size = UDim2.fromOffset(240, 16), Font = UI.Fonts.Bold, TextSize = 12, TextColor3 = C.Muted, Text = "" })
	refs.quests = UI.label(profile, { Position = UDim2.fromOffset(0, 60), Size = UDim2.fromOffset(260, 64), Font = UI.Fonts.Bold, TextSize = 14, TextColor3 = C.Mint, TextYAlignment = Enum.TextYAlignment.Top, TextWrapped = false, Text = "" })

	-- small round buttons, top right: menu, help, settings, emotes
	local function cornerButton(text, x, onClick)
		local b = UI.new("TextButton", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -12, 0, 68 + x), Size = UDim2.fromOffset(46, 46), BackgroundColor3 = Color3.fromRGB(20, 24, 28), BackgroundTransparency = 0.45, AutoButtonColor = false, BorderSizePixel = 0, Font = UI.Fonts.Title, TextSize = 20, TextColor3 = Color3.new(1, 1, 1), Text = text }, root)
		UI.corner(b, 23)
		UI.stroke(b, Color3.new(1, 1, 1), 1.5, 0.3)
		b.MouseButton1Click:Connect(function()
			Audio.click()
			onClick()
		end)
		return b
	end
	cornerButton("☰", 0, function() deps.Menu.toggle() end)
	cornerButton("?", 52, function() deps.Menu.open("How to play") end)
	cornerButton("⚙", 104, function() deps.Menu.open("Settings") end)
	cornerButton("💬", 156, function() deps.Emotes.toggle() end)
	cornerButton("👥", 208, function() Hud.invite() end)

	-- the dash button (bottom right; also the Q key)
	local dash = UI.new("TextButton", { Name = "Dash", AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -150, 1, -26), Size = UDim2.fromOffset(96, 96), BackgroundColor3 = Color3.fromRGB(20, 24, 28), BackgroundTransparency = 0.45, AutoButtonColor = false, BorderSizePixel = 0, Text = "", Visible = false }, root)
	UI.corner(dash, 48)
	UI.stroke(dash, Color3.new(1, 1, 1), 2.5, 0.05)
	scaled(dash)
	UI.label(dash, { Size = UDim2.new(1, 0, 0, 50), Position = UDim2.fromOffset(0, 12), Font = UI.Fonts.Title, TextSize = 36, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 1, Text = "💨" })
	refs.dashLabel = UI.label(dash, { Size = UDim2.new(1, 0, 0, 24), Position = UDim2.fromOffset(0, 62), Font = UI.Fonts.Title, TextSize = 17, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 1, Text = "DASH  Q" })
	refs.dashShade = box(dash, { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 5 }, Color3.new(0, 0, 0), 48)
	dash.MouseButton1Click:Connect(function()
		Hud.dash()
	end)
	refs.dash = dash

	-- the number pad button (123): shows the on-screen pad, for tapping the number instead of typing it
	local numbers = UI.new("TextButton", { Name = "NumbersButton", AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -258, 1, -30), Size = UDim2.fromOffset(88, 88), BackgroundColor3 = Color3.fromRGB(20, 24, 28), BackgroundTransparency = 0.45, AutoButtonColor = false, BorderSizePixel = 0, Text = "", Visible = false }, root)
	UI.corner(numbers, 44)
	UI.stroke(numbers, Color3.new(1, 1, 1), 2.5, 0.05)
	scaled(numbers)
	UI.label(numbers, { Size = UDim2.new(1, 0, 0, 46), Position = UDim2.fromOffset(0, 10), Font = UI.Fonts.Title, TextSize = 32, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 1, Text = "123" })
	refs.numbersLabel = UI.label(numbers, { Size = UDim2.new(1, 0, 0, 22), Position = UDim2.fromOffset(0, 58), Font = UI.Fonts.Title, TextSize = 15, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 1, Text = "NUMBER" })
	numbers.MouseButton1Click:Connect(function()
		Audio.click()
		Hud.numbers()
	end)
	refs.numbers = numbers

	-- a small line that says what the game made of your last key press or click (F8 turns it on and off), for finding out why something does not respond
	refs.debug = UI.label(root, { Position = UDim2.new(0, 14, 1, -190), Size = UDim2.fromOffset(520, 60), Font = UI.Fonts.Bold, TextSize = 13, TextColor3 = Color3.fromRGB(150, 255, 170), TextYAlignment = Enum.TextYAlignment.Top, BackgroundColor3 = Color3.fromRGB(0, 0, 0), BackgroundTransparency = 0.5, Visible = false, ZIndex = 250, Text = "" })

	-- the bounty: one player carries a gold target; whoever gets their number gets the prize
	refs.bounty = UI.label(root, { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 158), Size = UDim2.fromOffset(420, 26), Font = UI.Fonts.Bold, TextSize = 18, TextColor3 = C.Gold, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 0.4, Text = "", Visible = false, ZIndex = 16 })

	-- the one-line hint for the first three matches (never in the way afterwards)
	refs.tip = UI.label(root, { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -128), Size = UDim2.fromOffset(640, 30), Font = UI.Fonts.Bold, TextSize = 19, TextColor3 = C.Gold, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 0.4, Text = "", Visible = false, ZIndex = 16 })
	scaled(refs.tip)

	-- the short lines at the bottom ("You killed Michael")
	refs.messages = UI.new("Frame", { Name = "Messages", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 0.9, 0), Size = UDim2.fromOffset(420, 70), BackgroundTransparency = 1, ZIndex = 15 }, root)
	UI.new("UIListLayout", { SortOrder = Enum.SortOrder.LayoutOrder, VerticalAlignment = Enum.VerticalAlignment.Bottom, HorizontalAlignment = Enum.HorizontalAlignment.Center, Padding = UDim.new(0, 2) }, refs.messages)
	scaled(refs.messages)

	-- a server problem is shown in red so it can be reported
	refs.error = UI.label(root, { Position = UDim2.fromOffset(12, 130), Size = UDim2.fromOffset(520, 120), Font = UI.Fonts.Bold, TextSize = 13, TextColor3 = Color3.fromRGB(255, 120, 120), TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, BackgroundColor3 = Color3.fromRGB(40, 0, 0), BackgroundTransparency = 0.2, Visible = false, ZIndex = 300, Text = "" })

	RunService.RenderStepped:Connect(function()
		Hud.update()
	end)
	player:GetAttributeChangedSignal("Alive"):Connect(function()
		Hud.update()
	end)
end

--------------------------------------------------------------------------------
-- The two item slots
--------------------------------------------------------------------------------
-- The item in slot F or G (the camera and the binoculars until a crate item takes over).
function Hud.slotItem(key)
	local id = player:GetAttribute("Slot" .. key)
	if type(id) ~= "string" or id == "" then
		id = Config.Loadout[key]
	end
	return id
end

-- Which slot holds this item, or nil.
function Hud.slotOf(id)
	for _, key in { "F", "G" } do
		if Hud.slotItem(key) == id then
			return key
		end
	end
	return nil
end

function Hud.heldItem()
	return held and Hud.slotItem(held) or nil
end

function Hud.held()
	return held
end

local function count(id)
	local item = Config.ItemById[id]
	if item and item.Permanent then
		return 1
	end
	return player:GetAttribute("It_" .. id) or 0
end

function Hud.unhold()
	if held and Hud.slotItem(held) == "binos" then
		deps.Scope.set(false)
	end
	held = nil
end

-- F or G was pressed (or the slot was tapped). ONE press does the thing (Config.Loadout.OnePress): the camera takes a photo, a
-- grenade is thrown, the binoculars look through (press again to lower them). Without OnePress (or with `immediate` off) the older
-- way applies: the first press takes the item out, a click uses it.
function Hud.pressSlot(key, immediate)
	if View.phase() ~= "play" or not View.amAlive() then
		Audio.error()
		return
	end
	immediate = immediate or Config.Loadout.OnePress
	local id = Hud.slotItem(key)
	if immediate and id ~= "binos" then
		-- a short flash of the slot and of the camera or grenade, so the press feels answered
		pulse[key] = View.now() + 0.35
		shown = { id = id, untilT = View.now() + 0.55 }
	end
	if id == "binos" then
		if immediate then
			deps.Scope.toggle()
			held = deps.Scope.isOn() and key or nil
			return
		end
	elseif id == "camera" then
		if immediate then
			deps.Controls.snap()
			return
		end
	else
		if count(id) < 1 then
			Audio.error()
			return
		end
		if immediate then
			deps.Controls.use(id)
			return
		end
	end
	if held == key then
		Hud.unhold()
		return
	end
	Hud.unhold()
	held = key
	Audio.play("Click", 1.1, 0.5)
end

-- A left click (or the controller's A) while holding something: take the photo, throw the grenade, or zoom the binoculars.
function Hud.useHeld()
	if Config.Loadout.OnePress then
		return false -- (one press already did it)
	end
	local id = Hud.heldItem()
	if not id then
		return false
	end
	if id == "camera" then
		deps.Controls.snap()
	elseif id == "binos" then
		deps.Scope.toggle()
	else
		deps.Controls.use(id)
		held = nil
	end
	return true
end

-- What a hotbar press from the controller does: the slot that holds this item.
function Hud.activate(id)
	local key = Hud.slotOf(id)
	if key then
		Hud.pressSlot(key, true)
	else
		Audio.error()
	end
end

-- The invite button: opens Roblox's own "invite friends" window (friends who join play WITH you, and playing together is one of the best
-- ways to keep a game alive). Does nothing where Roblox does not allow it.
function Hud.invite()
	local ok, allowed = pcall(function()
		return game:GetService("SocialService"):CanSendGameInviteAsync(player)
	end)
	if ok and allowed then
		pcall(function()
			game:GetService("SocialService"):PromptGameInvite(player)
		end)
	else
		deps.Toasts.push("Share the game link with your friends: they can join you from your profile", "info")
	end
end

-- The dash (Q or the DASH button): a quick burst forward. The server decides; this only asks and plays the sound.
function Hud.dash()
	if View.phase() ~= "play" or not View.amAlive() or player:GetAttribute("Stunned") == true then
		return false
	end
	if (player:GetAttribute("DashReady") or 0) > View.now() then
		Audio.error()
		return false
	end
	local camera = View.camera()
	deps.send("Dash", camera and camera.CFrame.LookVector or nil)
	deps.Fx.punch(5)
	Audio.play("Tone", 1.6, 0.4)
	return true
end

function Hud.select(id) end -- (the slot highlight follows what you hold; kept for the older callers)

--------------------------------------------------------------------------------
-- Messages from the server
--------------------------------------------------------------------------------
function Hud.setMyNumber(text)
	if refs.meDigits then
		refs.meDigits.Text = text or "----"
	end
end

-- One short white line at the bottom of the screen that fades after a few seconds.
function Hud.say(text, color, seconds)
	if not refs.messages then
		return
	end
	local line = UI.label(refs.messages, { LayoutOrder = math.floor(os.clock() * 100), Size = UDim2.new(1, 0, 0, 24), Font = UI.Fonts.Bold, TextSize = 19, TextColor3 = color or Color3.new(1, 1, 1), TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, TextStrokeTransparency = 0.45, Text = text })
	table.insert(messages, line)
	while #messages > 2 do
		local oldest = table.remove(messages, 1)
		if oldest then
			oldest:Destroy()
		end
	end
	task.delay(seconds or 3.2, function()
		local i = table.find(messages, line)
		if i then
			table.remove(messages, i)
		end
		line:Destroy()
	end)
end

function Hud.youKilled(code)
	Hud.say("You killed " .. code)
end

function Hud.feed(text, color)
	Hud.say(text, color)
end

function Hud.snapCooldown(seconds)
	cooldowns.camera = View.now() + seconds
end

function Hud.setCooldown(id, seconds)
	cooldowns[id] = View.now() + seconds
end

function Hud.cooldownLeft(id)
	return math.max(0, (cooldowns[id] or 0) - View.now())
end

-- The bounty chip text under the timer while a bounty target is alive.
local bounty = nil -- { label, reward, id }
function Hud.setBounty(label, reward, id)
	bounty = { label = label, reward = reward, id = id }
end

-- The 123 button: shows or hides the on-screen number pad.
function Hud.numbers()
	local on = deps.Keypad.togglePad()
	if on and View.phase() == "play" and View.amAlive() then
		deps.Toasts.push("Tap the digits of the number on their sign: it picks the person under the dot, or the nearest one you can see", "info")
	end
	return on
end
function Hud.setAlly() end

function Hud.uiScale()
	return uiScale
end

local function updateScale()
	local camera = View.camera()
	local vp = camera and camera.ViewportSize
	if not vp or type(vp.X) ~= "number" then
		return
	end
	-- fingers need bigger buttons than a mouse does, so touch screens never shrink the screen as far
	local floor = UserInputService.TouchEnabled and 0.7 or 0.55
	local want = math.clamp(math.min(vp.X / 1100, vp.Y / 650), floor, 1.1)
	if math.abs(want - uiScale) > 0.01 then
		uiScale = want
		for _, obj in scaleObjects do
			obj.Scale = want
		end
	end
end

--------------------------------------------------------------------------------
-- Every frame
--------------------------------------------------------------------------------
function Hud.update()
	if not refs.root then
		return
	end
	if os.clock() - scaleAt > 1 then
		scaleAt = os.clock()
		updateScale()
	end
	local phase = View.phase()
	local left = View.timeLeft()
	local playing = player:GetAttribute("Alive") == true and (phase == "play" or phase == "countdown")
	local mode = workspace:GetAttribute("Mode")
	local teamMode = (mode == "team" or mode == "ctf" or mode == "elim") and (phase == "play" or phase == "countdown")

	-- scores: the red and the blue box in team modes, one box with the people left in free for all
	refs.redBox.Visible = teamMode
	refs.blueBox.Visible = teamMode
	refs.aliveBox.Visible = not teamMode and (phase == "play" or phase == "countdown")
	if teamMode then
		refs.redScore.Text = tostring(workspace:GetAttribute("Team1Score") or 0)
		refs.blueScore.Text = tostring(workspace:GetAttribute("Team2Score") or 0)
	elseif refs.aliveBox.Visible then
		refs.aliveText.Text = "👥 " .. View.aliveCount() .. "/" .. View.total()
	end
	-- a flag is shown beside a box when that team's flag has been taken or dropped
	local function flagState(team)
		return workspace:GetAttribute("Flag" .. team) or "home"
	end
	refs.redFlag.Visible = teamMode and mode == "ctf" and flagState(1) ~= "home"
	refs.blueFlag.Visible = teamMode and mode == "ctf" and flagState(2) ~= "home"

	-- timer
	local waiting = phase == "lobby" and Players.NumPlayers < Config.Match.MinHumans
	if waiting then
		refs.timer.Text = "WAITING FOR PLAYERS"
		refs.status.Text = ""
	elseif phase == "lobby" then
		refs.timer.Text = "NEXT MATCH  " .. clock(left)
		refs.status.Text = workspace:GetAttribute("NextModeName") or ""
	elseif phase == "results" then
		refs.timer.Text = "RESULTS"
		refs.status.Text = ""
	else
		refs.timer.Text = clock(left)
		refs.status.Text = phase == "countdown" and "GET READY" or ""
		if phase == "play" and mode == "elim" then
			-- the hits are the score; this line says how many are still standing on each side
			refs.status.Text = "🔴 " .. (workspace:GetAttribute("Team1Alive") or 0) .. " left   •   🔵 " .. (workspace:GetAttribute("Team2Alive") or 0) .. " left"
		end
	end
	local final = phase == "play" and left <= Config.Match.RevealAt
	refs.timer.TextColor3 = final and C.Danger or Color3.new(1, 1, 1)
	if final then
		if not finalShown then
			finalShown = true
			deps.Fx.announce(Config.Match.RevealAt .. " SECONDS LEFT!", "", C.Danger, 0.2)
			Audio.setIntensity(true)
		end
	elseif finalShown and phase ~= "play" then
		finalShown = false
		Audio.setIntensity(false)
	end
	-- countdown beeps for the last 3 seconds before the start, and ticks in the last seconds of the lobby and the match
	local second = math.ceil(left)
	if phase == "countdown" and second ~= lastSecond and second >= 1 and second <= 3 then
		Audio.countdown(second, false)
		deps.Fx.announce(tostring(second), "", C.Gold, 0.3)
	end
	if phase == "lobby" and second ~= lastSecond and second >= 1 and second <= 5 and left <= 5 then
		Audio.tick()
	end
	if phase == "play" and second ~= lastSecond and second <= 10 and second >= 1 and left <= 10 then
		Audio.tick()
	end
	lastSecond = second

	-- strikes: one red X for every time you covered your number or camped (three at most)
	local strikes = player:GetAttribute("Strikes") or 0
	refs.strikeRow.Visible = playing
	for i, mark in refs.strikes do
		local used = i <= strikes
		mark.TextColor3 = used and Color3.fromRGB(240, 70, 84) or Color3.fromRGB(190, 190, 198)
		mark.TextTransparency = used and 0 or 0.4
	end

	-- your own number, and in the lobby your level
	refs.sign.Visible = playing and Config.Number.ShowOwn
	refs.profile.Visible = not playing and phase ~= "results"
	if refs.profile.Visible then
		refs.level.Text = "LEVEL " .. (player:GetAttribute("Level") or 1)
		refs.coins.Text = "🪙 " .. (player:GetAttribute("Coins") or 0)
		local into, need = player:GetAttribute("XPInto") or 0, player:GetAttribute("XPNeed") or 1
		refs.xpBar.set(into / math.max(1, need))
		refs.xpText.Text = into .. " / " .. need .. " XP"
		-- today's quests: "play=1/3,hit=0/5,photo=0/3" -> three lines, a tick when done
		local lines = {}
		local raw = player:GetAttribute("Quests")
		for _, def in Config.Quests.List do
			local got, goal = string.match(type(raw) == "string" and raw or "", def.Id .. "=(%d+)/(%d+)")
			local done = got ~= nil and tonumber(got) >= tonumber(goal)
			table.insert(lines, (done and "✅ " or "📅 ") .. def.Name .. "  " .. (got or "0") .. "/" .. def.Goal .. "  (+" .. def.Coins .. " 🪙)")
		end
		refs.quests.Text = table.concat(lines, "\n")
	end

	-- the waiting card: for everybody who is not in the match that is on (arrived late, or out)
	local inMatch = player:GetAttribute("Playing") == true
	local showWait = not playing and phase ~= "results" or (not inMatch and phase == "results")
	if phase == "lobby" then
		showWait = true
	end
	refs.wait.Visible = showWait
	-- waiting players can watch the match instead of standing about (a button on the card); while they watch the card shrinks to that button
	local canWatch = showWait and not inMatch and (phase == "play" or phase == "countdown")
	local watching = canWatch and deps.Spectate.wantsToWatch() == true
	refs.waitWatch.Visible = canWatch
	local canReady = showWait and phase == "lobby" and Players.NumPlayers >= 2
	refs.waitReady.Visible = canReady
	refs.waitReady.Text = player:GetAttribute("Ready") == true and ("✔ READY  " .. (workspace:GetAttribute("ReadyCount") or 0) .. "/" .. Players.NumPlayers .. "  (tap to cancel)") or "▶ READY: start now"
	refs.waitWatch.Text = watching and "↩ BACK TO THE LOBBY" or "👁 WATCH THE MATCH"
	for _, l in { refs.waitTitle, refs.waitMode, refs.waitInfo, refs.waitNext } do
		l.Visible = not watching
	end
	refs.wait.Size = watching and UDim2.fromOffset(300, 60) or UDim2.fromOffset(460, (canWatch or canReady) and 198 or 150)
	refs.waitWatch.Position = watching and UDim2.new(0.5, 0, 0, 10) or UDim2.new(0.5, 0, 0, 150)
	if showWait then
		local waiters = workspace:GetAttribute("Waiting") or 0
		local total = View.total()
		local maxPlayers = workspace:GetAttribute("MaxPlayers") or Config.Match.MaxPlayers
		local modeName = workspace:GetAttribute("ModeName") or ""
		local mapName = workspace:GetAttribute("MapName") or ""
		local resultsTime = mode == "practice" and 3 or Config.Match.ResultsTime
		if phase == "lobby" then
			refs.waitTitle.Text = Players.NumPlayers < Config.Match.MinHumans and "WAITING FOR PLAYERS" or ("NEXT MATCH IN " .. clock(left))
			refs.waitMode.Text = workspace:GetAttribute("NextModeName") or ""
			refs.waitInfo.Text = "👥 " .. math.min(Players.NumPlayers, maxPlayers) .. "/" .. maxPlayers .. " ready"
			refs.waitNext.Text = Players.NumPlayers > maxPlayers and ("Server full: " .. (Players.NumPlayers - maxPlayers) .. " will wait for the one after") or "Vote for the next map with the cards below"
		elseif phase == "countdown" then
			refs.waitTitle.Text = "NEXT MATCH STARTING"
			refs.waitMode.Text = modeName .. (mapName ~= "" and ("  •  " .. mapName) or "")
			refs.waitInfo.Text = "👥 " .. total .. "/" .. maxPlayers .. " playing"
			refs.waitNext.Text = "This one is full. You play the next match, starting in about " .. clock(left + (mode == "practice" and 3 or Config.Match.Length) + resultsTime + Config.Match.Intermission)
		elseif phase == "results" then
			refs.waitTitle.Text = "MATCH OVER"
			refs.waitMode.Text = "Next match in " .. clock(left + Config.Match.Intermission)
			refs.waitInfo.Text = "👥 " .. (waiters + total) .. " here"
			refs.waitNext.Text = "Vote for the next map with the cards below"
		else
			local ending = left <= 60
			refs.waitTitle.Text = inMatch and "YOU ARE OUT" or (ending and "MATCH ENDING SOON!" or "MATCH IN PROGRESS")
			refs.waitTitle.TextColor3 = (ending and left <= Config.Match.RevealAt) and C.Danger or C.Gold
			refs.waitMode.Text = modeName .. (mapName ~= "" and ("  •  " .. mapName) or "")
			refs.waitInfo.Text = "⏱ " .. clock(left) .. " left   •   👥 " .. total .. "/" .. maxPlayers .. " playing   •   " .. waiters .. " waiting"
			local pos = player:GetAttribute("QueuePos") or 0
			refs.waitNext.Text = (inMatch and "You can watch, and play the next match" or "You play the next match") .. ": starts in about " .. clock(left + resultsTime + Config.Match.Intermission) .. (pos > 1 and ("   (you are #" .. pos .. " in line)") or "")
		end
	end

	-- the first-matches hint
	if phase == "play" and playing then
		playStart = playStart or os.clock()
	else
		playStart = nil
	end
	local early = Config.Hud.Tips and playStart ~= nil and ((player:GetAttribute("Games") or 0) < 3 or mode == "practice") and os.clock() - playStart < (mode == "practice" and 60 or 25)
	refs.tip.Visible = early == true
	if early then
		refs.tip.Text = mode == "practice" and "PRACTICE: walk up to a dummy, read the number on its sign and type it.  F = photo, G = binoculars." or "Put the dot on a head and type their 4 digits.  F = photo, G = binoculars."
	end

	-- the two slots
	local now = View.now()
	if not playing or phase ~= "play" then
		if held then
			Hud.unhold()
		end
	end
	if held and Config.Loadout.OnePress and Hud.slotItem(held) == "binos" and not deps.Scope.isOn() then
		held = nil -- (you lowered them, or a flash knocked them down)
	end
	if held and (Hud.slotItem(held) ~= "camera" and Hud.slotItem(held) ~= "binos") and count(Hud.slotItem(held)) < 1 then
		held = nil -- (used up)
	end
	if held and Hud.slotItem(held) == "binos" and phase == "play" and not View.amAlive() then
		held = nil
	end
	for key, slot in slots do
		local id = Hud.slotItem(key)
		local item = Config.ItemById[id]
		slot.icon.Text = item and item.Icon or ""
		local have = count(id)
		slot.count.Text = (item and not item.Permanent and have > 1) and ("x" .. have) or ""
		local cd = math.max(0, (cooldowns[id] or 0) - now)
		local usable = playing and phase == "play" and have > 0 and cd <= 0
		slot.shade.BackgroundTransparency = usable and 1 or 0.6
		slot.cd.Text = cd > 0.05 and string.format(cd >= 10 and "%d" or "%.1f", cd) or ""
		local isHeld = held == key or (pulse[key] or 0) > now
		slot.frame.BackgroundColor3 = isHeld and Color3.new(1, 1, 1) or Color3.fromRGB(20, 24, 28)
		slot.frame.BackgroundTransparency = isHeld and 0.04 or 0.45
		slot.icon.TextColor3 = isHeld and Color3.fromRGB(30, 32, 38) or Color3.new(1, 1, 1)
	end
	refs.slotBar.Visible = playing
	refs.dash.Visible = playing and phase == "play"
	refs.numbers.Visible = playing and phase == "play"
	refs.numbersLabel.Text = deps.Keypad.padShown() and "HIDE" or "NUMBER"
	local bountyAlive = false
	if bounty and phase == "play" then
		local e = View.byId(bounty.id)
		bountyAlive = e ~= nil and e.alive == true
	end
	refs.bounty.Visible = bountyAlive
	if bountyAlive then
		refs.bounty.Text = "🎯 BOUNTY  " .. bounty.label .. "  +" .. bounty.reward
	end
	refs.debug.Visible = deps.Controls.debugOn()
	if refs.debug.Visible then
		refs.debug.Text = deps.Controls.debugText() .. "\nphase=" .. phase .. "  alive=" .. tostring(player:GetAttribute("Alive")) .. "  playing=" .. tostring(player:GetAttribute("Playing")) .. "  target=" .. (View.aimed() and View.aimed().code or "none")
	end
	local dashWait = math.max(0, (player:GetAttribute("DashReady") or 0) - View.now())
	refs.dashShade.BackgroundTransparency = dashWait > 0 and 0.55 or 1
	refs.dashLabel.Text = dashWait > 0.05 and string.format("%.1f", dashWait) or "DASH  Q"

	-- what you hold, drawn at the bottom of the screen (the binoculars hide while you look through them)
	local id = Hud.heldItem()
	if not id and shown and shown.untilT > now then
		id = shown.id
	end
	local zoomed = deps.Scope.isOn()
	refs.viewmodel.Visible = id ~= nil and playing and not zoomed
	refs.binos.Visible = id == "binos"
	refs.camera.Visible = id == "camera"
	refs.grenade.Visible = id ~= nil and id ~= "binos" and id ~= "camera"
	if refs.grenade.Visible then
		refs.grenade.Text = Config.ItemById[id].Icon
	end

	-- the crosshair turns yellow while it is on somebody
	refs.cross.Visible = playing and not zoomed
	if playing and phase == "play" then
		local target = View.aimed()
		refs.cross.BackgroundColor3 = target and C.Yellow or Color3.new(1, 1, 1)
	end

	local bootError = workspace:GetAttribute("BootErrors")
	refs.error.Visible = type(bootError) == "string" and bootError ~= ""
	if refs.error.Visible then
		refs.error.Text = "⚠ SERVER PROBLEM (please screenshot this):\n" .. bootError
	end
end

return Hud

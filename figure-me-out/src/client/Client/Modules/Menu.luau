-- FIGURE ME OUT: the menu window: how to play, forehead plates you unlock by winning, your stats and the settings.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))

local Menu = {}

local player = Players.LocalPlayer
local C = UI.Colors
local deps
local window, body
local tabs = {} -- name -> { button, page }
local current
local plateCards = {}
local statLabels = {}
local toggles = {}

local TABS = { "How to play", "Plates", "Stats", "Settings" }

local STEPS = {
	{ "🪪", "Everybody has a secret number", "A 3-digit number is printed on every forehead. You can't see yours, but everybody else can." },
	{ "🎯", "Guess to knock people out", "Aim at someone, press G and type THEIR number. Right = they're out. Wrong = you freeze for 3 seconds and lose a bullet." },
	{ "🔭", "Find the numbers", "Hold the right mouse button for binoculars and read digits from across the map. Click to snap a photo: the notebook (V) joins up digits from several photos." },
	{ "💥", "Mess with their eyes", "Flashbangs blind everyone who sees them go off. Smoke grenades make a cloud nobody can see through. Grab 🎁 crates for decoys, scramblers, switcheroos and boots." },
	{ "🚫", "No hiding in corners", "Staring at a wall hides your number, so the game warns you. Ignore it and your number floats above your head for everyone!" },
	{ "👁", "Someone is always watching", "A wrong guess points an arrow at the guesser. In the last 30 seconds THE REVEAL shows every number. Last one standing wins!" },
}

local function page(name)
	local p = UI.new("ScrollingFrame", {
		Name = name,
		Position = UDim2.fromOffset(0, 0),
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 5,
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		CanvasSize = UDim2.new(),
		Visible = false,
		ZIndex = 62,
	}, body)
	return p
end

local function buildHowTo(p)
	UI.new("UIListLayout", { SortOrder = Enum.SortOrder.LayoutOrder, Padding = UDim.new(0, 8) }, p)
	for i, s in STEPS do
		local card = UI.new("Frame", { LayoutOrder = i, Size = UDim2.new(1, -8, 0, 74), BackgroundColor3 = C.Card, BorderSizePixel = 0, ZIndex = 63 }, p)
		UI.corner(card, 12)
		UI.label(card, { Position = UDim2.fromOffset(8, 8), Size = UDim2.fromOffset(52, 52), Font = UI.Fonts.Title, TextSize = 36, TextXAlignment = Enum.TextXAlignment.Center, Text = s[1], ZIndex = 64 })
		UI.label(card, { Position = UDim2.fromOffset(66, 6), Size = UDim2.new(1, -74, 0, 20), Font = UI.Fonts.Title, TextSize = 15, TextColor3 = C.Accent, Text = s[2], ZIndex = 64 })
		UI.label(card, { Position = UDim2.fromOffset(66, 26), Size = UDim2.new(1, -74, 0, 44), Font = UI.Fonts.Body, TextSize = 12, TextColor3 = C.Muted, TextYAlignment = Enum.TextYAlignment.Top, Text = s[3], ZIndex = 64 })
	end
	local go = UI.button(p, { LayoutOrder = 100, Size = UDim2.new(1, -8, 0, 46), Text = "LET'S GO!", TextSize = 20, BackgroundColor3 = C.Good, ZIndex = 63 })
	go.MouseButton1Click:Connect(function()
		Audio.click()
		deps.send("Seen")
		Menu.close()
	end)
end

local function buildPlates(p)
	UI.new("UIGridLayout", { CellSize = UDim2.fromOffset(190, 118), CellPadding = UDim2.fromOffset(10, 10), SortOrder = Enum.SortOrder.LayoutOrder }, p)
	for i, style in Config.PlateStyles do
		local card = UI.new("TextButton", { LayoutOrder = i, Text = "", AutoButtonColor = false, BackgroundColor3 = C.Card, BorderSizePixel = 0, ZIndex = 63 }, p)
		UI.corner(card, 12)
		local stroke = UI.stroke(card, C.Stroke, 2)
		local preview = UI.new("Frame", { Position = UDim2.fromOffset(34, 12), Size = UDim2.fromOffset(122, 50), BackgroundColor3 = style.Back, BorderSizePixel = 0, ZIndex = 64 }, card)
		UI.corner(preview, 6)
		UI.stroke(preview, style.Rim, 3)
		UI.label(preview, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Title, TextSize = 36, TextColor3 = style.Text, TextXAlignment = Enum.TextXAlignment.Center, Text = "472", ZIndex = 65 })
		UI.label(card, { Position = UDim2.fromOffset(0, 68), Size = UDim2.new(1, 0, 0, 20), Font = UI.Fonts.Title, TextSize = 15, TextXAlignment = Enum.TextXAlignment.Center, Text = style.Name, ZIndex = 64 })
		local status = UI.label(card, { Position = UDim2.fromOffset(0, 90), Size = UDim2.new(1, 0, 0, 20), Font = UI.Fonts.Bold, TextSize = 12, TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = C.Muted, Text = "", ZIndex = 64 })
		card.MouseButton1Click:Connect(function()
			if (player:GetAttribute("Wins") or 0) >= style.Wins then
				Audio.click()
				deps.send("Style", style.Id)
			else
				Audio.error()
				deps.Toasts.push("Win " .. style.Wins .. " match" .. (style.Wins == 1 and "" or "es") .. " to unlock " .. style.Name, "bad")
			end
		end)
		plateCards[style.Id] = { card = card, stroke = stroke, status = status, style = style }
	end
end

local function buildStats(p)
	UI.new("UIListLayout", { SortOrder = Enum.SortOrder.LayoutOrder, Padding = UDim.new(0, 8) }, p)
	local rows = {
		{ "Wins", "🏆 Matches won" },
		{ "Streak", "🔥 Win streak" },
		{ "BestStreak", "⭐ Best win streak" },
		{ "Games", "🎮 Matches played" },
		{ "TotalKills", "🎯 Players eliminated" },
	}
	for i, r in rows do
		local row = UI.new("Frame", { LayoutOrder = i, Size = UDim2.new(1, -8, 0, 52), BackgroundColor3 = C.Card, BorderSizePixel = 0, ZIndex = 63 }, p)
		UI.corner(row, 12)
		UI.label(row, { Position = UDim2.fromOffset(14, 0), Size = UDim2.new(0.7, 0, 1, 0), Font = UI.Fonts.Bold, TextSize = 17, Text = r[2], ZIndex = 64 })
		statLabels[r[1]] = UI.label(row, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -14, 0, 0), Size = UDim2.fromOffset(110, 52), Font = UI.Fonts.Title, TextSize = 26, TextColor3 = C.Gold, TextXAlignment = Enum.TextXAlignment.Right, Text = "0", ZIndex = 64 })
	end
end

local function buildSettings(p)
	UI.new("UIListLayout", { SortOrder = Enum.SortOrder.LayoutOrder, Padding = UDim.new(0, 8) }, p)
	local rows = {
		{ "Music", "🎵 Music" },
		{ "Sfx", "🔊 Sound effects" },
		{ "Fx", "✨ Screen shake and flashes" },
	}
	for i, r in rows do
		local row = UI.new("Frame", { LayoutOrder = i, Size = UDim2.new(1, -8, 0, 52), BackgroundColor3 = C.Card, BorderSizePixel = 0, ZIndex = 63 }, p)
		UI.corner(row, 12)
		UI.label(row, { Position = UDim2.fromOffset(14, 0), Size = UDim2.new(0.6, 0, 1, 0), Font = UI.Fonts.Bold, TextSize = 17, Text = r[2], ZIndex = 64 })
		local btn = UI.button(row, { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -12, 0.5, 0), Size = UDim2.fromOffset(84, 34), Text = "ON", TextSize = 16, BackgroundColor3 = C.Good, ZIndex = 64 })
		btn.MouseButton1Click:Connect(function()
			local value = not (player:GetAttribute(r[1]) ~= false)
			player:SetAttribute(r[1], value)
			deps.send("Setting", r[1], value)
			Audio.click()
			Menu.applySettings()
			Menu.refresh()
		end)
		toggles[r[1]] = btn
	end
end

function Menu.applySettings()
	Audio.setMusic(player:GetAttribute("Music") ~= false)
	Audio.setSfx(player:GetAttribute("Sfx") ~= false)
end

function Menu.init(gui, d)
	deps = d
	window = UI.panel(gui, {
		Name = "Menu",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(470, 480),
		Visible = false,
		ZIndex = 60,
	})
	UI.label(window, { Position = UDim2.fromOffset(16, 10), Size = UDim2.new(1, -70, 0, 30), Font = UI.Fonts.Title, TextSize = 24, TextColor3 = C.Accent, Text = "FIGURE ME OUT", ZIndex = 61 })
	local close = UI.button(window, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -12, 0, 10), Size = UDim2.fromOffset(40, 32), Text = "✕", TextSize = 18, BackgroundColor3 = C.Danger, ZIndex = 61 })
	close.MouseButton1Click:Connect(function()
		Audio.click()
		Menu.close()
	end)
	local tabBar = UI.new("Frame", { Position = UDim2.fromOffset(12, 48), Size = UDim2.new(1, -24, 0, 36), BackgroundTransparency = 1, ZIndex = 61 }, window)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6) }, tabBar)
	body = UI.new("Frame", { Position = UDim2.fromOffset(12, 92), Size = UDim2.new(1, -24, 1, -104), BackgroundTransparency = 1, ZIndex = 61 }, window)
	local builders = { ["How to play"] = buildHowTo, Plates = buildPlates, Stats = buildStats, Settings = buildSettings }
	for _, name in TABS do
		local b = UI.button(tabBar, { Size = UDim2.fromOffset(104, 34), Text = name, TextSize = 13, BackgroundColor3 = C.Card, ZIndex = 62 }, "card")
		local p = page(name)
		builders[name](p)
		tabs[name] = { button = b, page = p }
		b.MouseButton1Click:Connect(function()
			Audio.click()
			Menu.open(name)
		end)
	end
	for _, key in { "Wins", "Streak", "BestStreak", "Games", "TotalKills", "Style", "Music", "Sfx", "Fx" } do
		player:GetAttributeChangedSignal(key):Connect(function()
			Menu.refresh()
			if key == "Music" or key == "Sfx" then
				Menu.applySettings()
			end
		end)
	end
	Menu.applySettings()
end

function Menu.isOpen()
	return window ~= nil and window.Visible
end

function Menu.open(name)
	name = tabs[name] and name or current or "How to play"
	current = name
	window.Visible = true
	for n, t in tabs do
		t.page.Visible = n == name
		t.button.BackgroundColor3 = n == name and C.Accent or C.Card
	end
	Menu.refresh()
end

function Menu.close()
	if window then
		window.Visible = false
	end
end

function Menu.toggle()
	if Menu.isOpen() then
		Menu.close()
	else
		Menu.open(current)
	end
end

function Menu.refresh()
	if not window then
		return
	end
	local wins = player:GetAttribute("Wins") or 0
	local equipped = player:GetAttribute("Style") or "classic"
	for id, c in plateCards do
		local unlocked = wins >= c.style.Wins
		c.card.BackgroundColor3 = unlocked and C.Card or Color3.fromRGB(28, 30, 44)
		c.stroke.Color = id == equipped and C.Good or C.Stroke
		c.stroke.Thickness = id == equipped and 4 or 2
		c.status.Text = id == equipped and "✓ EQUIPPED" or (unlocked and "tap to equip" or ("🔒 " .. c.style.Wins .. " wins"))
		c.status.TextColor3 = id == equipped and C.Good or C.Muted
	end
	for key, label in statLabels do
		label.Text = tostring(player:GetAttribute(key) or 0)
	end
	for key, btn in toggles do
		local on = player:GetAttribute(key) ~= false
		btn.Text = on and "ON" or "OFF"
		btn.BackgroundColor3 = on and C.Good or C.Disabled
	end
end

return Menu

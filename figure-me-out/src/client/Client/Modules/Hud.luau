-- FIGURE ME OUT: the always-on screen: timer and alive count, your codename and bullets, the kill feed, the item
-- hotbar, the crosshair with the name of whoever you are aiming at, and the small buttons in the corners.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))
local View = require(script.Parent:WaitForChild("View"))

local Hud = {}

local player = Players.LocalPlayer
local C = UI.Colors
local deps
local gui
local refs = {}
local feed = {}
local slots = {}
local lastSecond = -1
local snapReadyAt = 0
local aimAt, aimTarget, aimDistance = 0, nil, 0

local function chip(parent, props)
	local f = UI.panel(parent, props)
	return f
end

function Hud.init(screen, d)
	gui = screen
	deps = d
	local root = UI.new("Frame", { Name = "Hud", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1 }, gui)
	refs.root = root

	-- top centre: phase + timer + alive
	local top = chip(root, {
		Name = "Top",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 12),
		Size = UDim2.fromOffset(280, 64),
	})
	refs.phase = UI.label(top, {
		Position = UDim2.fromOffset(0, 5),
		Size = UDim2.new(1, 0, 0, 16),
		Font = UI.Fonts.Bold,
		TextSize = 13,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Center,
		Text = "LOBBY",
	})
	refs.timer = UI.label(top, {
		Position = UDim2.fromOffset(0, 18),
		Size = UDim2.new(0.55, 0, 0, 40),
		Font = UI.Fonts.Title,
		TextSize = 34,
		TextXAlignment = Enum.TextXAlignment.Center,
		Text = "0:00",
	})
	refs.alive = UI.label(top, {
		Position = UDim2.new(0.55, 0, 0, 18),
		Size = UDim2.new(0.45, -8, 0, 40),
		Font = UI.Fonts.Title,
		TextSize = 22,
		TextColor3 = C.Good,
		TextXAlignment = Enum.TextXAlignment.Center,
		Text = "",
	})

	-- top left: who you are + bullets
	local me = chip(root, {
		Name = "Me",
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 12, 0.45, 0), -- left-middle: the top-left corner belongs to Roblox's menu and chat
		Size = UDim2.fromOffset(250, 78),
	})
	refs.meBox = me
	refs.meTitle = UI.label(me, {
		Position = UDim2.fromOffset(12, 6),
		Size = UDim2.new(1, -24, 0, 14),
		Font = UI.Fonts.Bold,
		TextSize = 12,
		TextColor3 = C.Muted,
		Text = "YOUR CODENAME",
	})
	refs.meName = UI.label(me, {
		Position = UDim2.fromOffset(12, 20),
		Size = UDim2.new(1, -24, 0, 26),
		Font = UI.Fonts.Title,
		TextSize = 20,
		Text = "-",
	})
	refs.pips = {}
	for i = 1, Config.Guess.Bullets do
		local pip = UI.new("Frame", {
			Position = UDim2.fromOffset(12 + (i - 1) * 26, 52),
			Size = UDim2.fromOffset(20, 16),
			BackgroundColor3 = C.Gold,
			BorderSizePixel = 0,
		}, me)
		UI.corner(pip, 5)
		UI.stroke(pip, C.Stroke, 2)
		refs.pips[i] = pip
	end
	refs.meHint = UI.label(me, {
		Position = UDim2.fromOffset(140, 50),
		Size = UDim2.new(1, -150, 0, 20),
		Font = UI.Fonts.Bold,
		TextSize = 11,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Right,
		Text = "bullets",
	})

	-- top right: small buttons
	local function cornerButton(text, x, onClick)
		local b = UI.button(root, {
			AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, -12 - x, 0, 12),
			Size = UDim2.fromOffset(44, 44),
			Text = text,
			TextSize = 22,
			BackgroundColor3 = C.Card,
		}, "card")
		b.MouseButton1Click:Connect(function()
			Audio.click()
			onClick()
		end)
		return b
	end
	cornerButton("☰", 0, function()
		deps.Menu.toggle()
	end)
	cornerButton("📒", 52, function()
		deps.Album.toggle()
	end)
	cornerButton("?", 104, function()
		deps.Menu.open("How to play")
	end)

	-- kill feed (right side)
	refs.feed = UI.new("Frame", {
		Name = "Feed",
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -12, 0, 70),
		Size = UDim2.fromOffset(330, 160),
		BackgroundTransparency = 1,
	}, root)
	UI.new("UIListLayout", { SortOrder = Enum.SortOrder.LayoutOrder, Padding = UDim.new(0, 4), HorizontalAlignment = Enum.HorizontalAlignment.Right }, refs.feed)

	-- crosshair + aimed name
	refs.cross = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(18, 18),
		BackgroundTransparency = 1,
	}, root)
	refs.crossStroke = UI.stroke(refs.cross, Color3.new(1, 1, 1), 2, 0.25)
	UI.corner(refs.cross, 9)
	refs.aimLabel = UI.label(root, {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0.5, 20),
		Size = UDim2.fromOffset(300, 44),
		Font = UI.Fonts.Title,
		TextSize = 18,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = C.Accent,
		Text = "",
	})

	-- hotbar
	local bar = UI.new("Frame", {
		Name = "Hotbar",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -12),
		Size = UDim2.fromOffset(#Config.Items * 62, 62),
		BackgroundTransparency = 1,
	}, root)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 4), SortOrder = Enum.SortOrder.LayoutOrder }, bar)
	for i, item in Config.Items do
		local b = UI.button(bar, {
			LayoutOrder = i,
			Size = UDim2.fromOffset(58, 58),
			Text = item.Icon,
			TextSize = 28,
			BackgroundColor3 = C.Card,
		}, "card")
		UI.label(b, {
			Position = UDim2.fromOffset(5, 2),
			Size = UDim2.fromOffset(16, 14),
			Font = UI.Fonts.Title,
			TextSize = 12,
			TextColor3 = C.Gold,
			Text = tostring(item.Key),
		})
		local count = UI.label(b, {
			AnchorPoint = Vector2.new(1, 1),
			Position = UDim2.new(1, -4, 1, -2),
			Size = UDim2.fromOffset(30, 16),
			Font = UI.Fonts.Title,
			TextSize = 15,
			TextXAlignment = Enum.TextXAlignment.Right,
			Text = "",
		})
		local shade = UI.new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 5 }, b)
		UI.corner(shade, 12)
		b.MouseButton1Click:Connect(function()
			Hud.activate(item.Id)
		end)
		slots[item.Id] = { button = b, count = count, shade = shade, item = item }
	end

	-- guess button (also G)
	local guess = UI.button(root, {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, #Config.Items * 31 + 70, 1, -16),
		Size = UDim2.fromOffset(92, 50),
		Text = "GUESS  G",
		TextSize = 15,
		BackgroundColor3 = C.Accent2,
	})
	guess.MouseButton1Click:Connect(function()
		deps.Controls.guess()
	end)
	refs.tips = UI.label(root, {
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 14, 1, -14),
		Size = UDim2.fromOffset(270, 60),
		Font = UI.Fonts.Bold,
		TextSize = 12,
		TextColor3 = C.Muted,
		Text = "G guess   RMB hold: binoculars   click / F: photo   V notebook   1-8 items",
	})

	RunService.RenderStepped:Connect(function()
		Hud.update()
	end)
	player:GetAttributeChangedSignal("Alive"):Connect(function()
		Hud.update()
	end)
end

-- What a hotbar press does.
function Hud.activate(id)
	local c = deps.Controls
	if id == "binos" then
		deps.Scope.toggle()
	elseif id == "camera" then
		c.snap()
	else
		c.use(id)
	end
end

function Hud.feed(text, color)
	if not refs.feed then
		return
	end
	local line = UI.panel(refs.feed, { Size = UDim2.fromOffset(330, 26), Radius = 8, BackgroundColor3 = C.Panel, LayoutOrder = -math.floor(os.clock() * 100) })
	UI.label(line, {
		Position = UDim2.fromOffset(8, 0),
		Size = UDim2.new(1, -16, 1, 0),
		Font = UI.Fonts.Bold,
		TextSize = 13,
		TextColor3 = color or C.Text,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		Text = text,
	})
	table.insert(feed, line)
	while #feed > 6 do
		table.remove(feed, 1):Destroy()
	end
	task.delay(9, function()
		local i = table.find(feed, line)
		if i then
			table.remove(feed, i)
		end
		line:Destroy()
	end)
end

function Hud.snapCooldown(seconds)
	snapReadyAt = View.now() + seconds
end

local PHASE_TEXT = { lobby = "NEXT MATCH IN", countdown = "GET READY", play = "TIME LEFT", results = "RESULTS" }

function Hud.update()
	if not refs.root then
		return
	end
	local phase = View.phase()
	local left = View.timeLeft()
	refs.phase.Text = PHASE_TEXT[phase] or ""
	refs.timer.Text = Util.clock(left)
	refs.timer.TextColor3 = (phase == "play" and left <= Config.Match.RevealAt) and C.Danger or C.Text
	if phase == "play" or phase == "countdown" or phase == "results" then
		refs.alive.Text = "👥 " .. View.aliveCount() .. "/" .. View.total()
	else
		refs.alive.Text = Players.NumPlayers .. " in lobby"
	end
	-- countdown beeps for the last 3 seconds before the start
	local second = math.ceil(left)
	if phase == "countdown" and second ~= lastSecond and second >= 1 and second <= 3 then
		Audio.countdown(second, false)
		deps.Fx.announce(tostring(second), "", C.Gold, 0.3)
	end
	if phase == "play" and second ~= lastSecond and second <= 10 and second >= 1 and left <= 10 then
		Audio.tick()
	end
	lastSecond = second

	-- you
	local playing = player:GetAttribute("Alive") == true and (phase == "play" or phase == "countdown")
	refs.meBox.Visible = playing
	if playing then
		refs.meName.Text = (player:GetAttribute("Icon") or "") .. " " .. (player:GetAttribute("Code") or "")
		local bullets = player:GetAttribute("Bullets") or 0
		for i, pip in refs.pips do
			pip.BackgroundColor3 = i <= bullets and C.Gold or Color3.fromRGB(60, 62, 80)
		end
		refs.meHint.Text = (player:GetAttribute("Kills") or 0) .. " out"
	end

	-- hotbar
	local now = View.now()
	for id, slot in slots do
		local item = slot.item
		local have = item.Permanent and 1 or (player:GetAttribute("It_" .. id) or 0)
		slot.count.Text = item.Permanent and "" or ("x" .. have)
		local usable = playing and have > 0 and phase == "play"
		if id == "camera" and now < snapReadyAt then
			usable = false
		end
		slot.shade.BackgroundTransparency = usable and 1 or 0.55
	end

	-- crosshair + the name of whoever you are aiming at
	refs.cross.Visible = playing and not deps.Scope.isOn()
	if playing and phase == "play" then
		if os.clock() - aimAt > 0.1 then
			aimAt = os.clock()
			aimTarget, aimDistance = View.aimed()
		end
		local target, distance = aimTarget, aimDistance
		if target then
			refs.aimLabel.Text = target.icon .. " " .. target.code .. "   " .. math.floor(distance + 0.5) .. " m\n[G] to guess"
			refs.crossStroke.Color = C.Accent
		else
			refs.aimLabel.Text = ""
			refs.crossStroke.Color = Color3.new(1, 1, 1)
		end
	else
		refs.aimLabel.Text = ""
	end
	refs.tips.Visible = playing
end

return Hud

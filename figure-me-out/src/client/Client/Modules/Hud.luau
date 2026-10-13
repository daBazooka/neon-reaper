-- FIGURE ME OUT: the always-on screen: timer and alive count, your codename, lives, points and bullets, the kill feed, the
-- gadget hotbar with cooldowns, the crosshair with the name of whoever you are aiming at, bounty and alliance chips,
-- and the small buttons on the left and in the corners.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

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
local myDigits = nil
local lastSecond = -1
local snapReadyAt = 0
local aimAt, aimTarget, aimDistance = 0, nil, 0
local bounty = nil -- { id, label, reward }
local allyUntil, allyLabel = 0, ""
local finalShown = false
local uiScale = 1
local scaleObjects = {}
local scaleAt = -10

function Hud.init(screen, d)
	gui = screen
	deps = d
	local root = UI.new("Frame", { Name = "Hud", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1 }, gui)
	refs.root = root

	-- top centre: phase + timer + alive
	local top = UI.panel(root, {
		Name = "Top",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 12),
		Size = UDim2.fromOffset(300, 64),
	})
	refs.top = top
	refs.topScale = UI.new("UIScale", {}, top)
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
		Size = UDim2.new(0.5, 0, 0, 40),
		Font = UI.Fonts.Title,
		TextSize = 34,
		TextXAlignment = Enum.TextXAlignment.Center,
		Text = "0:00",
	})
	refs.alive = UI.label(top, {
		Position = UDim2.new(0.5, 0, 0, 18),
		Size = UDim2.new(0.5, -8, 0, 40),
		Font = UI.Fonts.Title,
		TextSize = 22,
		TextColor3 = C.Good,
		TextXAlignment = Enum.TextXAlignment.Center,
		Text = "",
	})

	-- chips under the timer: bounty and alliance
	refs.chips = UI.new("Frame", { Position = UDim2.new(0.5, -150, 0, 82), Size = UDim2.fromOffset(300, 100), BackgroundTransparency = 1 }, root)
	UI.new("UIListLayout", { SortOrder = Enum.SortOrder.LayoutOrder, Padding = UDim.new(0, 4), HorizontalAlignment = Enum.HorizontalAlignment.Center }, refs.chips)
	refs.modeChip = UI.panel(refs.chips, { Size = UDim2.fromOffset(280, 40), Radius = 8, BackgroundColor3 = Color3.fromRGB(24, 40, 64), Visible = false, LayoutOrder = 0 })
	refs.modeText = UI.label(refs.modeChip, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Bold, TextSize = 14, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = true, Text = "" })
	refs.bountyChip = UI.panel(refs.chips, { Size = UDim2.fromOffset(280, 26), Radius = 8, BackgroundColor3 = Color3.fromRGB(150, 110, 20), Visible = false, LayoutOrder = 1 })
	refs.bountyText = UI.label(refs.bountyChip, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Bold, TextSize = 13, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "" })
	refs.allyChip = UI.panel(refs.chips, { Size = UDim2.fromOffset(280, 26), Radius = 8, BackgroundColor3 = Color3.fromRGB(30, 130, 70), Visible = false, LayoutOrder = 2 })
	refs.allyText = UI.label(refs.allyChip, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Bold, TextSize = 13, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "" })

	-- left side: who you are (in a match) or your profile (in the lobby)
	local me = UI.panel(root, {
		Name = "Me",
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 12, 0.45, 0), -- left-middle: the top-left corner belongs to Roblox's menu and chat
		Size = UDim2.fromOffset(270, 104),
	})
	refs.meBox = me
	refs.meTitle = UI.label(me, { Position = UDim2.fromOffset(12, 6), Size = UDim2.fromOffset(134, 14), Font = UI.Fonts.Bold, TextSize = 12, TextColor3 = C.Muted, Text = "YOUR CODENAME" })
	refs.meName = UI.label(me, { Position = UDim2.fromOffset(12, 20), Size = UDim2.fromOffset(136, 26), Font = UI.Fonts.Title, TextSize = 16, TextWrapped = false, Text = "-" })
	-- your own digits, big: you must know them to hide them
	refs.meCaption = UI.label(me, { Position = UDim2.fromOffset(150, 6), Size = UDim2.fromOffset(108, 14), Font = UI.Fonts.Bold, TextSize = 11, TextColor3 = C.Muted, TextXAlignment = Enum.TextXAlignment.Center, Text = "YOUR NUMBER" })
	refs.meDigits = UI.label(me, { Position = UDim2.fromOffset(150, 18), Size = UDim2.fromOffset(108, 44), Font = UI.Fonts.Title, TextSize = 40, TextWrapped = false, TextColor3 = C.Gold, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 0.5, Text = "---" })
	refs.meCaption.Visible = Config.Number.ShowOwn
	refs.meDigits.Visible = Config.Number.ShowOwn
	refs.hearts = UI.label(me, { Position = UDim2.fromOffset(12, 48), Size = UDim2.fromOffset(120, 22), Font = UI.Fonts.Title, TextSize = 20, TextWrapped = false, Text = "" })
	refs.score = UI.label(me, { Position = UDim2.fromOffset(150, 60), Size = UDim2.fromOffset(108, 18), Font = UI.Fonts.Title, TextSize = 15, TextColor3 = C.Gold, TextXAlignment = Enum.TextXAlignment.Center, Text = "" })
	refs.pips = {}
	for i = 1, Config.Guess.Bullets do
		local pip = UI.new("Frame", { Position = UDim2.fromOffset(12 + (i - 1) * 26, 78), Size = UDim2.fromOffset(20, 16), BackgroundColor3 = C.Gold, BorderSizePixel = 0 }, me)
		UI.corner(pip, 5)
		UI.stroke(pip, C.Stroke, 2)
		refs.pips[i] = pip
	end
	refs.meHint = UI.label(me, { Position = UDim2.fromOffset(150, 80), Size = UDim2.fromOffset(108, 16), Font = UI.Fonts.Bold, TextSize = 11, TextColor3 = C.Muted, TextXAlignment = Enum.TextXAlignment.Center, Text = "bullets" })

	local profile = UI.panel(root, {
		Name = "Profile",
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 12, 0.45, 0),
		Size = UDim2.fromOffset(270, 96),
	})
	refs.profile = profile
	refs.level = UI.label(profile, { Position = UDim2.fromOffset(12, 6), Size = UDim2.new(0.6, 0, 0, 24), Font = UI.Fonts.Title, TextSize = 20, Text = "LEVEL 1" })
	refs.coins = UI.label(profile, { Position = UDim2.new(0.5, 0, 0, 8), Size = UDim2.new(0.5, -12, 0, 22), Font = UI.Fonts.Title, TextSize = 18, TextColor3 = C.Gold, TextXAlignment = Enum.TextXAlignment.Right, Text = "🪙 0" })
	refs.xpBar = UI.bar(profile, { Position = UDim2.fromOffset(12, 38), Size = UDim2.new(1, -24, 0, 12) }, C.Good)
	refs.xpText = UI.label(profile, { Position = UDim2.fromOffset(12, 52), Size = UDim2.new(1, -24, 0, 16), Font = UI.Fonts.Bold, TextSize = 12, TextColor3 = C.Muted, Text = "" })
	refs.profileHint = UI.label(profile, { Position = UDim2.fromOffset(12, 70), Size = UDim2.new(1, -24, 0, 20), Font = UI.Fonts.Bold, TextSize = 12, TextColor3 = C.Accent, Text = "Practise here: try the 🔭 and 📷!" })

	-- left quick buttons: emote, alliance, gadget inventory
	refs.quick = UI.new("Frame", { AnchorPoint = Vector2.new(0, 0), Position = UDim2.new(0, 12, 0.45, 62), Size = UDim2.fromOffset(160, 44), BackgroundTransparency = 1 }, root)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8) }, refs.quick)
	local function quick(text, order, onClick)
		local b = UI.button(refs.quick, { LayoutOrder = order, Size = UDim2.fromOffset(46, 44), Text = text, TextSize = 22, BackgroundColor3 = C.Card }, "card")
		b.MouseButton1Click:Connect(function()
			Audio.click()
			onClick()
		end)
		return b
	end
	quick("💬", 1, function() deps.Emotes.toggle() end)
	if Config.Features.Alliances then
		refs.allyButton = quick("🤝", 2, function() deps.Controls.ally() end)
	end
	if Config.Features.Gadgets then
		quick("🎒", 3, function() deps.Inventory.toggle() end)
	end

	-- top right: small buttons
	local function cornerButton(text, x, onClick)
		local b = UI.button(root, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -12 - x, 0, 12), Size = UDim2.fromOffset(44, 44), Text = text, TextSize = 22, BackgroundColor3 = C.Card }, "card")
		b.MouseButton1Click:Connect(function()
			Audio.click()
			onClick()
		end)
		return b
	end
	local slot = 0
	local function nextSlot()
		slot += 52
		return slot - 52
	end
	cornerButton("☰", nextSlot(), function() deps.Menu.toggle() end)
	if Config.Features.Photos then
		cornerButton("📒", nextSlot(), function() deps.Album.toggle() end)
	end
	cornerButton("?", nextSlot(), function() deps.Menu.open("How to play") end)
	cornerButton("⚙", nextSlot(), function() deps.Menu.open("Settings") end)

	-- kill feed (right side)
	refs.feed = UI.new("Frame", { Name = "Feed", AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -12, 0, 70), Size = UDim2.fromOffset(330, 160), BackgroundTransparency = 1 }, root)
	UI.new("UIListLayout", { SortOrder = Enum.SortOrder.LayoutOrder, Padding = UDim.new(0, 4), HorizontalAlignment = Enum.HorizontalAlignment.Right }, refs.feed)

	-- crosshair + aimed name
	refs.cross = UI.new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromOffset(18, 18), BackgroundTransparency = 1 }, root)
	refs.crossStroke = UI.stroke(refs.cross, Color3.new(1, 1, 1), 2, 0.25)
	UI.corner(refs.cross, 9)
	refs.aimLabel = UI.label(root, { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0.5, 20), Size = UDim2.fromOffset(300, 44), Font = UI.Fonts.Title, TextSize = 18, TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = C.Accent, Text = "" })

	-- gadget hotbar
	local F = Config.Features
	local shown = {}
	for _, item in Config.Items do
		if (item.Id == "binos" and F.Binoculars) or (item.Id == "camera" and F.Photos) or (not item.Permanent and F.Gadgets) then
			table.insert(shown, item)
		end
	end
	local bar = UI.new("Frame", { Name = "Hotbar", AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -12), Size = UDim2.fromOffset(math.max(1, #shown * 62), 62), BackgroundTransparency = 1, Visible = #shown > 0 }, root)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 4), SortOrder = Enum.SortOrder.LayoutOrder }, bar)
	for i, item in shown do
		local b = UI.button(bar, { LayoutOrder = i, Size = UDim2.fromOffset(58, 58), Text = item.Icon, TextSize = 28, BackgroundColor3 = C.Card }, "card")
		UI.label(b, { Position = UDim2.fromOffset(5, 2), Size = UDim2.fromOffset(16, 14), Font = UI.Fonts.Title, TextSize = 12, TextColor3 = C.Gold, Text = tostring(item.Key) })
		local count = UI.label(b, { AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -4, 1, -2), Size = UDim2.fromOffset(30, 16), Font = UI.Fonts.Title, TextSize = 15, TextXAlignment = Enum.TextXAlignment.Right, Text = "" })
		local shade = UI.new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(0, 0, 0), BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 5 }, b)
		UI.corner(shade, 12)
		local cd = UI.label(b, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Title, TextSize = 22, TextXAlignment = Enum.TextXAlignment.Center, Text = "", ZIndex = 6 })
		local selected = UI.stroke(b, C.Accent, 3, 1)
		b.MouseButton1Click:Connect(function()
			Hud.activate(item.Id)
		end)
		slots[item.Id] = { button = b, count = count, shade = shade, cd = cd, item = item, cdUntil = 0, selected = selected }
	end

	-- guess button (also G)
	local guess
	if #shown > 0 then
		guess = UI.button(root, {
			AnchorPoint = Vector2.new(0.5, 1),
			Position = UDim2.new(0.5, #shown * 31 + 70, 1, -16),
			Size = UDim2.fromOffset(92, 50),
			Text = "GUESS  G",
			TextSize = 15,
			BackgroundColor3 = C.Accent2,
		})
	else
		-- nothing else to press: one big friendly button in the thumb corner
		guess = UI.button(root, {
			AnchorPoint = Vector2.new(1, 1),
			Position = UDim2.new(1, -24, 1, -24),
			Size = UDim2.fromOffset(150, 70),
			Text = "GUESS",
			TextSize = 26,
			BackgroundColor3 = C.Accent2,
		})
	end
	refs.guessButton = guess
	guess.MouseButton1Click:Connect(function()
		deps.Controls.guess()
	end)
	refs.error = UI.label(root, {
		Position = UDim2.fromOffset(12, 130),
		Size = UDim2.fromOffset(520, 120),
		Font = UI.Fonts.Bold,
		TextSize = 13,
		TextColor3 = Color3.fromRGB(255, 120, 120),
		TextXAlignment = Enum.TextXAlignment.Left,
		TextYAlignment = Enum.TextYAlignment.Top,
		BackgroundColor3 = Color3.fromRGB(40, 0, 0),
		BackgroundTransparency = 0.2,
		Visible = false,
		ZIndex = 300,
		Text = "",
	})
	-- one short line at the start of a match, then it gets out of the way
	local touch = UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled
	refs.tips = UI.label(root, { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, #shown > 0 and -84 or -24), Size = UDim2.fromOffset(520, 34), Font = UI.Fonts.Title, TextSize = 22, TextXAlignment = Enum.TextXAlignment.Center, TextColor3 = C.Gold, TextStrokeTransparency = 0.4, Text = touch and "TAP A PLAYER ➔ TYPE THEIR NUMBER ➔ WIN!" or "LOOK AT HEADS ➔ TYPE THEIR NUMBER ➔ WIN!" })
	-- everything important can shrink on small screens (phones, small windows)
	for _, thing in { me, profile, refs.quick, bar, guess, refs.feed } do
		table.insert(scaleObjects, UI.new("UIScale", {}, thing))
	end
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

-- Your own digits, as the server told you (nil clears them).
function Hud.setMyNumber(text)
	myDigits = text
	if refs.meDigits then
		refs.meDigits.Text = text or "---"
	end
end

function Hud.feed(text, color)
	if not refs.feed then
		return
	end
	local line = UI.panel(refs.feed, { Size = UDim2.fromOffset(330, 26), Radius = 8, LayoutOrder = -math.floor(os.clock() * 100) })
	UI.label(line, { Position = UDim2.fromOffset(8, 0), Size = UDim2.new(1, -16, 1, 0), Font = UI.Fonts.Bold, TextSize = 13, TextColor3 = color or C.Text, TextXAlignment = Enum.TextXAlignment.Right, TextWrapped = false, Text = text })
	table.insert(feed, line)
	while #feed > 6 do
		local oldest = table.remove(feed, 1)
		if oldest then
			oldest:Destroy()
		end
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

-- The server says a gadget is cooling down.
function Hud.setCooldown(id, seconds)
	local slot = slots[id]
	if slot then
		slot.cdUntil = View.now() + seconds
	end
	if id == "camera" then
		snapReadyAt = View.now() + seconds
	end
end

function Hud.cooldownLeft(id)
	local slot = slots[id]
	return slot and math.max(0, slot.cdUntil - View.now()) or 0
end

function Hud.setBounty(label, reward, id)
	bounty = { id = id, label = label, reward = reward }
end

function Hud.setAlly(label, seconds)
	allyLabel = label
	allyUntil = seconds > 0 and View.now() + seconds or 0
end

-- Highlights the slot of the gadget you are using right now (binoculars while zoomed).
function Hud.select(id)
	for sid, slot in slots do
		slot.selected.Transparency = sid == id and 0 or 1
	end
end

local PHASE_TEXT = { lobby = "NEXT MATCH IN", countdown = "GET READY", play = "MATCH TIME", results = "RESULTS" }

-- The size everything is drawn at for this screen: 1 is the normal size, smaller on small screens.
function Hud.uiScale()
	return uiScale
end

local function updateScale()
	local camera = View.camera()
	local vp = camera and camera.ViewportSize
	if not vp or type(vp.X) ~= "number" then
		return
	end
	-- fingers need bigger buttons than a mouse does, so touch screens never shrink the HUD as far
	local floor = UserInputService.TouchEnabled and 0.78 or 0.62
	local want = math.clamp(math.min(vp.X / 1100, vp.Y / 650), floor, 1.1)
	if math.abs(want - uiScale) > 0.01 then
		uiScale = want
		for _, obj in scaleObjects do
			obj.Scale = want
		end
	end
end

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
	local alive = View.aliveCount()
	local playing = player:GetAttribute("Alive") == true and (phase == "play" or phase == "countdown")
	refs.phase.Text = PHASE_TEXT[phase] or ""
	-- not enough real players yet: the lobby waits (the clock does not run)
	local waiting = phase == "lobby" and Players.NumPlayers < Config.Match.MinHumans
	if waiting then
		refs.phase.Text = "WAITING FOR PLAYERS"
	end
	if phase == "play" and alive <= 3 and alive > 0 then
		refs.phase.Text = "⚠ ONLY " .. alive .. " LEFT"
	end
	refs.timer.Text = waiting and (Players.NumPlayers .. "/" .. Config.Match.MinHumans) or Util.clock(left)
	local final = phase == "play" and left <= Config.Match.RevealAt
	refs.timer.TextColor3 = final and C.Danger or C.Text
	if final then
		refs.topScale.Scale = uiScale * (1 + 0.05 * math.abs(math.sin(os.clock() * 5)))
		if not finalShown then
			finalShown = true
			deps.Fx.announce(Config.Match.RevealAt .. " SECONDS LEFT!", "Every plate glows. Make it count!", C.Danger, 0.2)
			Audio.setIntensity(true)
		end
	else
		refs.topScale.Scale = uiScale
		if finalShown and phase ~= "play" then
			finalShown = false
			Audio.setIntensity(false)
		end
	end
	if phase == "play" or phase == "countdown" or phase == "results" then
		refs.alive.Text = "👥 " .. alive .. "/" .. View.total()
		refs.alive.TextColor3 = (phase == "play" and alive <= 3) and C.Danger or C.Good
	else
		refs.alive.Text = Players.NumPlayers .. " waiting"
		refs.alive.TextColor3 = C.Good
	end
	-- countdown beeps for the last 3 seconds before the start
	local second = math.ceil(left)
	if phase == "countdown" and second ~= lastSecond and second >= 1 and second <= 3 then
		Audio.countdown(second, false)
		deps.Fx.announce(tostring(second), "", C.Gold, 0.3)
	end
	-- the lobby wait ticks down its last 5 seconds (only once a match is really about to start)
	if phase == "lobby" and second ~= lastSecond and second >= 1 and second <= 5 and left <= 5 then
		Audio.tick()
	end
	if phase == "play" and second ~= lastSecond and second <= 10 and second >= 1 and left <= 10 then
		Audio.tick()
	end
	lastSecond = second

	-- you (in a match) or your profile (in the lobby)
	refs.meBox.Visible = playing
	refs.profile.Visible = not playing and phase ~= "results"
	-- mode banner: team scores (and where the flags are) while playing; what comes next in the lobby
	local mode = workspace:GetAttribute("Mode")
	local teamMode = mode == "team" or mode == "ctf"
	local nextName = workspace:GetAttribute("NextModeName")
	local modeLine
	if (phase == "play" or phase == "countdown") and mode then
		if string.sub(refs.phase.Text, 1, 1) ~= "⚠" then
			refs.phase.Text = (workspace:GetAttribute("ModeName") or "") .. (phase == "countdown" and "  •  GET READY" or "")
		end
		if teamMode then
			local c1, c2 = Config.Teams[1], Config.Teams[2]
			local limit = workspace:GetAttribute("ScoreLimit") or 0
			modeLine = c1.Icon .. " " .. (workspace:GetAttribute("Team1Score") or 0) .. "   first to " .. limit .. "   " .. (workspace:GetAttribute("Team2Score") or 0) .. " " .. c2.Icon
			if mode == "ctf" then
				local function flagText(t)
					local st = workspace:GetAttribute("Flag" .. t)
					if st == "carried" then
						return "taken by " .. (workspace:GetAttribute("FlagCarrier" .. t) or "?")
					end
					return st or "home"
				end
				modeLine = modeLine .. "\n🚩 " .. Config.Teams[1].Name .. ": " .. flagText(1) .. "  |  " .. Config.Teams[2].Name .. ": " .. flagText(2)
			end
			local mine = player:GetAttribute("Team")
			refs.modeChip.BackgroundColor3 = mine and Config.Teams[mine].Color:Lerp(Color3.fromRGB(10, 20, 40), 0.55) or Color3.fromRGB(24, 40, 64)
		end
	elseif phase == "lobby" and nextName then
		modeLine = "NEXT: " .. nextName
		refs.modeChip.BackgroundColor3 = Color3.fromRGB(24, 40, 64)
	end
	refs.modeChip.Visible = modeLine ~= nil
	if modeLine then
		refs.modeText.Text = modeLine
	end
	if playing then
		refs.hearts.Visible = not teamMode
		refs.meName.Text = (player:GetAttribute("Icon") or "") .. " " .. (player:GetAttribute("Code") or "")
		local lives = player:GetAttribute("Lives") or 0
		local myTeam = player:GetAttribute("Team")
		if teamMode and myTeam then
			refs.meTitle.Text = Config.Teams[myTeam].Icon .. " TEAM " .. Config.Teams[myTeam].Name
		else
			refs.meTitle.Text = "YOUR CODENAME"
		end
		refs.hearts.Text = string.rep("❤", lives) .. string.rep("🖤", math.max(0, Config.Lives.Start - lives))
		refs.score.Text = "⭐ " .. (player:GetAttribute("Score") or 0)
		local bullets = player:GetAttribute("Bullets") or 0
		for i, pip in refs.pips do
			pip.BackgroundColor3 = i <= bullets and C.Gold or Color3.fromRGB(60, 90, 120)
		end
		refs.meHint.Text = (player:GetAttribute("Kills") or 0) .. " hits"
	else
		local level = player:GetAttribute("Level") or 1
		refs.level.Text = "LEVEL " .. level
		refs.coins.Text = "🪙 " .. (player:GetAttribute("Coins") or 0)
		local into, need = player:GetAttribute("XPInto") or 0, player:GetAttribute("XPNeed") or 1
		refs.xpBar.set(into / math.max(1, need))
		refs.xpText.Text = into .. " / " .. need .. " XP"
	end

	-- bounty and alliance chips
	local showBounty = false
	if bounty and phase == "play" then
		local e = View.byId(bounty.id)
		if e and e.alive then
			showBounty = true
			refs.bountyText.Text = "🎯 BOUNTY  " .. bounty.label .. "  +" .. bounty.reward
		end
	end
	refs.bountyChip.Visible = showBounty
	local now = View.now()
	local allied = (player:GetAttribute("Ally") or 0) ~= 0 and phase == "play"
	refs.allyChip.Visible = allied
	if allied then
		refs.allyText.Text = "🤝 ALLY  " .. allyLabel .. (allyUntil > now and ("  " .. math.ceil(allyUntil - now) .. "s") or "")
	end

	-- gadget hotbar
	for id, slot in slots do
		local item = slot.item
		local have = item.Permanent and 1 or (player:GetAttribute("It_" .. id) or 0)
		slot.count.Text = item.Permanent and "" or ("x" .. have)
		local cd = math.max(0, slot.cdUntil - now)
		local usable = playing and have > 0 and phase == "play" and cd <= 0
		slot.shade.BackgroundTransparency = usable and 1 or 0.55
		slot.cd.Text = cd > 0.05 and string.format(cd >= 10 and "%d" or "%.1f", cd) or ""
	end
	Hud.select(deps.Scope.isOn() and "binos" or nil)

	-- crosshair + the name of whoever you are aiming at
	refs.cross.Visible = playing and not deps.Scope.isOn()
	if playing and phase == "play" then
		if os.clock() - aimAt > 0.1 then
			aimAt = os.clock()
			aimTarget, aimDistance = View.aimed()
		end
		local target, distance = aimTarget, aimDistance
		if target then
			refs.aimLabel.Text = target.icon .. " " .. target.code .. "   " .. math.floor(distance + 0.5) .. " m\n[G] guess" .. (target.player and "   [T] ally" or "")
			refs.crossStroke.Color = C.Accent
		else
			refs.aimLabel.Text = ""
			refs.crossStroke.Color = Color3.new(1, 1, 1)
		end
	else
		refs.aimLabel.Text = ""
	end
	-- a server problem is shown in red so it can be reported
	local bootError = workspace:GetAttribute("BootErrors")
	refs.error.Visible = type(bootError) == "string" and bootError ~= ""
	if refs.error.Visible then
		refs.error.Text = "⚠ SERVER PROBLEM (please screenshot this):\n" .. bootError
	end
	-- the one-line hint only shows at the start of a match, then gets out of the way
	refs.tips.Visible = playing and (phase == "countdown" or Config.Match.Length - left < 15)
end

return Hud

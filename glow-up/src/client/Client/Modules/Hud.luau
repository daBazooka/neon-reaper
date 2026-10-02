-- SUB 5 TO TRUE ADAM: the always-on screen.
--   Top centre: hint banner, then Aura / Rebirths / multiplier pills, then small status chips.
--   Left edge: big icon buttons (Shop, Rebirth with %, Rewards, PVP, MOG).
--   Right edge: smaller buttons (Hammers, Wardrobe, Crates, Profile, Settings).
--   Bottom centre: the big Aura counter and the wide LEVEL bar. Bottom left: the current quest.
-- Every button is a normal on-screen button, so it works the same from any camera angle.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))

local Hud = {}

local player = Players.LocalPlayer
local camera = workspace:WaitForChild("Camera")
local C = UI.Colors

local refs = {}
local fitScales = {} -- one UIScale per HUD block, resized together for small screens
local shownAura = 0
local pending, lastGain = 0, 0
local lastAura = 0

local function tint(panel, color)
	local stroke = panel:FindFirstChildOfClass("UIStroke")
	if stroke then
		stroke.Color = color
	end
end

local function pill(parent, name, size, color)
	local frame = UI.panel(parent, { Name = name, Size = size, Radius = 10 })
	tint(frame, color)
	return frame
end

local function addFit(frame)
	table.insert(fitScales, UI.new("UIScale", {}, frame))
end

-- Moves the character somewhere (the buttons that jump you to a place).
local function teleport(position, lookAt)
	local char = player.Character
	local root = char and char:FindFirstChild("HumanoidRootPart")
	if root then
		root.AssemblyLinearVelocity = Vector3.zero
		root.CFrame = CFrame.lookAt(position, Vector3.new(lookAt.X, position.Y, lookAt.Z))
	end
end

local TELEPORTS = {
	PVP = function()
		local ring = Config.StationPos("Ring")
		local front = Config.StationFront("Ring")
		teleport(ring + front * 32 + Vector3.new(0, 4, 0), ring)
	end,
	MOG = function()
		teleport(Vector3.new(0, 5, 12), Vector3.new(0, 5, -20))
	end,
	Hammers = function()
		teleport(Vector3.new(0, 4, Config.HammerRowZ + 10), Vector3.new(0, 4, Config.HammerRowZ - 30))
	end,
}

--------------------------------------------------------------------------------
-- Top: banner, pills, chips
--------------------------------------------------------------------------------
local function buildTop(gui)
	local stack = UI.new("Frame", {
		Name = "Top",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 6),
		Size = UDim2.fromOffset(460, 150),
		BackgroundTransparency = 1,
	}, gui)
	addFit(stack)
	UI.new("UIListLayout", {
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		Padding = UDim.new(0, 5),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, stack)

	-- Hint banner
	local banner = pill(stack, "Banner", UDim2.fromOffset(440, 28), C.Orange)
	banner.LayoutOrder = 1
	refs.banner = UI.label(banner, {
		Size = UDim2.fromScale(1, 1),
		Font = UI.Fonts.Title,
		TextSize = 13,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "",
	})

	-- Pills row
	local row = UI.new("Frame", { Name = "Pills", Size = UDim2.fromOffset(440, 30), BackgroundTransparency = 1, LayoutOrder = 2 }, stack)
	UI.new("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		Padding = UDim.new(0, 6),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, row)
	local function counter(order, width, color, textColor)
		local frame = pill(row, "Counter", UDim2.fromOffset(width, 30), color)
		frame.LayoutOrder = order
		local label = UI.label(frame, {
			Size = UDim2.fromScale(1, 1),
			Font = UI.Fonts.Title,
			TextSize = 15,
			TextColor3 = textColor,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = "",
		})
		return label
	end
	refs.auraPill = counter(1, 170, C.Gold, C.Yellow)
	refs.rebirthPill = counter(2, 110, C.Mint, C.Mint)
	refs.multPill = counter(3, 140, C.Pink, C.Pink)

	-- Chips (chain, event, competition), only visible while relevant
	local chips = UI.new("Frame", { Name = "Chips", Size = UDim2.fromOffset(440, 70), BackgroundTransparency = 1, LayoutOrder = 3 }, stack)
	UI.new("UIListLayout", {
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		Padding = UDim.new(0, 4),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, chips)
	local function chip(order, color, width)
		local c = pill(chips, "Chip", UDim2.fromOffset(width, 22), color)
		c.LayoutOrder = order
		c.Visible = false
		local label = UI.label(c, {
			Size = UDim2.fromScale(1, 1),
			Font = UI.Fonts.Title,
			TextSize = 11,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = "",
		})
		return c, label
	end
	refs.chain, refs.chainText = chip(1, C.Sky, 170)
	refs.chainScale = UI.new("UIScale", {}, refs.chain)
	refs.chainBar = UI.bar(refs.chain, { Position = UDim2.new(0, 10, 1, -5), Size = UDim2.new(1, -20, 0, 2) }, C.Sky)
	refs.streak, refs.streakText = chip(0, C.Orange, 200)
	refs.streakScale = UI.new("UIScale", {}, refs.streak)
	refs.streakBar = UI.bar(refs.streak, { Position = UDim2.new(0, 10, 1, -5), Size = UDim2.new(1, -20, 0, 2) }, C.Orange)
	refs.gift, refs.giftText = chip(4, C.Mint, 200)
	refs.comp, refs.compText = chip(2, C.Orange, 300)
	refs.event, refs.eventText = chip(3, C.Pink, 300)
end

--------------------------------------------------------------------------------
-- Side buttons
--------------------------------------------------------------------------------
-- A big icon button with its name underneath. Returns the button, its caption label and its badge dot.
local function sideButton(parent, order, size, color, icon, name, onClick)
	local button = UI.button(parent, {
		LayoutOrder = order,
		Size = UDim2.fromOffset(size, size),
		BackgroundColor3 = color,
		Text = "",
		Radius = 12,
	}, "card")
	UI.label(button, {
		Size = UDim2.new(1, 0, 0, size * 0.5),
		Position = UDim2.fromOffset(0, size * 0.08),
		Font = UI.Fonts.Bold,
		TextSize = math.floor(size * 0.42),
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 1,
		Text = icon,
	})
	local caption = UI.label(button, {
		Size = UDim2.new(1, 0, 0, size * 0.28),
		Position = UDim2.new(0, 0, 1, -size * 0.34),
		Font = UI.Fonts.Title,
		TextSize = math.floor(size * 0.18),
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0.1,
		Text = name:upper(),
	})
	local badge = UI.new("Frame", {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -2, 0, 2),
		Size = UDim2.fromOffset(13, 13),
		BackgroundColor3 = C.Danger,
		Visible = false,
		ZIndex = 5,
	}, button)
	UI.corner(badge, 7)
	UI.stroke(badge, Color3.new(1, 1, 1), 1.5, 0)
	button.Activated:Connect(function()
		Audio.click()
		onClick()
	end)
	return button, caption, badge
end

local function buildSides(gui, Menu)
	refs.badges = {}
	local left = UI.new("Frame", {
		Name = "LeftButtons",
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 8, 0.5, -10),
		Size = UDim2.fromOffset(66, 5 * 66 + 4 * 8),
		BackgroundTransparency = 1,
	}, gui)
	addFit(left)
	UI.new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, left)

	local _, _, shopBadge = sideButton(left, 1, 66, C.Yellow, "🛒", "Shop", function()
		Menu.toggle("Upgrades")
	end)
	refs.badges.Upgrades = shopBadge
	local rebirthBtn, rebirthCaption = sideButton(left, 2, 66, C.Good, "🔄", "Rebirth", function()
		Hud.toggleRebirth()
	end)
	refs.rebirthCaption = rebirthCaption
	refs.rebirthBar = UI.bar(rebirthBtn, { Position = UDim2.new(0, 6, 1, -8), Size = UDim2.new(1, -12, 0, 4) }, Color3.new(1, 1, 1))
	local _, _, rewardsBadge = sideButton(left, 3, 66, C.Pink, "🎁", "Rewards", function()
		Menu.toggle("Rewards")
	end)
	refs.badges.Rewards = rewardsBadge
	sideButton(left, 4, 66, C.Danger, "🥊", "PVP", TELEPORTS.PVP)
	sideButton(left, 5, 66, C.Orange, "🏆", "MOG", TELEPORTS.MOG)

	local right = UI.new("Frame", {
		Name = "RightButtons",
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -8, 0.5, -10),
		Size = UDim2.fromOffset(52, 6 * 52 + 5 * 6),
		BackgroundTransparency = 1,
	}, gui)
	addFit(right)
	UI.new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }, right)
	sideButton(right, 1, 52, C.Mint, "🔨", "Hammers", TELEPORTS.Hammers)
	sideButton(right, 2, 52, C.Pink, "🐾", "Pets", function()
		Menu.toggle("Pets")
	end)
	local _, _, wardrobeBadge = sideButton(right, 3, 52, C.Purple, "👗", "Wardrobe", function()
		Menu.toggle("Wardrobe")
	end)
	refs.badges.Wardrobe = wardrobeBadge
	local _, _, crateBadge = sideButton(right, 4, 52, C.Sky, "📦", "Crates", function()
		Menu.toggle("Crates")
	end)
	refs.badges.Crates = crateBadge
	sideButton(right, 5, 52, C.Accent, "📈", "Profile", function()
		Menu.toggle("Profile")
	end)
	sideButton(right, 6, 52, C.Disabled, "⚙️", "Settings", function()
		Menu.toggle("Settings")
	end)
end

--------------------------------------------------------------------------------
-- Bottom: big Aura counter + wide LEVEL bar, and the quest
--------------------------------------------------------------------------------
local function buildBottom(gui)
	local box = UI.new("Frame", {
		Name = "Bottom",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -8),
		Size = UDim2.fromOffset(520, 84),
		BackgroundTransparency = 1,
	}, gui)
	addFit(box)

	refs.bigAura = UI.label(box, {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 0),
		Size = UDim2.new(1, 0, 0, 44),
		Font = UI.Fonts.Title,
		TextSize = 36,
		TextColor3 = C.Yellow,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0,
		Text = "🏆 0",
	})
	refs.auraScale = UI.new("UIScale", {}, refs.bigAura)
	refs.ticker = UI.label(box, {
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0.5, 130, 0, 22),
		Size = UDim2.fromOffset(120, 20),
		Font = UI.Fonts.Title,
		TextSize = 16,
		TextColor3 = C.Mint,
		TextWrapped = false,
		TextTransparency = 1,
		Text = "",
	})

	local levelBar = UI.panel(box, {
		Name = "LevelBar",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, 0),
		Size = UDim2.fromOffset(520, 34),
		Radius = 12,
	})
	refs.levelFrame = levelBar
	refs.xpBar = UI.bar(levelBar, { Position = UDim2.fromOffset(6, 6), Size = UDim2.new(1, -12, 1, -12) }, C.Purple)
	refs.levelText = UI.label(levelBar, {
		Size = UDim2.fromScale(1, 1),
		Font = UI.Fonts.Title,
		TextSize = 16,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0,
		ZIndex = 5,
		Text = "",
	})

	-- Quest, bottom-left
	local quest = pill(gui, "Quest", UDim2.fromOffset(200, 42), C.Mint)
	refs.quest = quest
	quest.AnchorPoint = Vector2.new(0, 1)
	quest.Position = UDim2.new(0, 8, 1, -8)
	refs.questScale = UI.new("UIScale", {}, quest)
	table.insert(fitScales, refs.questScale)
	refs.questText = UI.label(quest, {
		Position = UDim2.fromOffset(10, 3),
		Size = UDim2.new(1, -52, 0, 16),
		Font = UI.Fonts.Bold,
		TextSize = 11,
		TextWrapped = false,
		Text = "",
	})
	refs.questBar = UI.bar(quest, { Position = UDim2.new(0, 10, 1, -13), Size = UDim2.new(1, -20, 0, 6) }, C.Mint)
	refs.questCount = UI.label(quest, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -10, 0, 3),
		Size = UDim2.fromOffset(40, 16),
		Font = UI.Fonts.Title,
		TextSize = 10,
		TextColor3 = C.Mint,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		Text = "",
	})
end

--------------------------------------------------------------------------------
-- Rebirth window
--------------------------------------------------------------------------------
local function buildRebirth(gui, Action)
	local win = UI.panel(gui, {
		Name = "RebirthWindow",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(360, 250),
		Visible = false,
		ZIndex = 20,
	})
	addFit(win)
	tint(win, C.Good)
	refs.rebirthWin = win
	UI.label(win, {
		Position = UDim2.fromOffset(16, 12),
		Size = UDim2.new(1, -60, 0, 28),
		Font = UI.Fonts.Title,
		TextSize = 22,
		TextColor3 = C.Good,
		TextWrapped = false,
		Text = "🔄 REBIRTH",
		ZIndex = 21,
	})
	local close = UI.button(win, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -10, 0, 10),
		Size = UDim2.fromOffset(30, 30),
		BackgroundColor3 = C.Danger,
		Text = "X",
		TextSize = 16,
		ZIndex = 22,
		Radius = 8,
	}, "card")
	close.Activated:Connect(function()
		Audio.click()
		Hud.toggleRebirth(false)
	end)
	refs.rebirthInfo = UI.label(win, {
		Position = UDim2.fromOffset(16, 48),
		Size = UDim2.new(1, -32, 0, 96),
		Font = UI.Fonts.Bold,
		TextSize = 14,
		TextColor3 = C.Muted,
		TextYAlignment = Enum.TextYAlignment.Top,
		ZIndex = 21,
		Text = "",
	})
	refs.rebirthProg = UI.bar(win, { Position = UDim2.fromOffset(16, 150), Size = UDim2.new(1, -32, 0, 14) }, C.Good)
	refs.rebirthProg.back.ZIndex = 21
	refs.rebirthProg.fill.ZIndex = 22
	refs.rebirthGo = UI.button(win, {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -14),
		Size = UDim2.new(1, -32, 0, 44),
		Text = "REBIRTH NOW",
		TextSize = 20,
		ZIndex = 21,
	})
	refs.rebirthGo.Activated:Connect(function()
		local need = player:GetAttribute("RebirthNeed") or 20
		if (player:GetAttribute("Level") or 1) >= need then
			Action:FireServer("Rebirth")
			Hud.toggleRebirth(false)
		else
			Audio.error()
		end
	end)
end

function Hud.toggleRebirth(force)
	local win = refs.rebirthWin
	local show = force
	if show == nil then
		show = not win.Visible
	end
	win.Visible = show
	if show then
		Hud.refresh()
	end
end

--------------------------------------------------------------------------------
-- Init
--------------------------------------------------------------------------------
function Hud.init(gui, Menu, Action)
	buildTop(gui)
	buildSides(gui, Menu)
	buildBottom(gui)
	buildRebirth(gui, Action)

	-- Shrink the whole HUD on small screens (phones) so nothing crowds the view.
	local function fit()
		local v = camera.ViewportSize
		local s = math.clamp(math.min(v.X / 900, v.Y / 520), 0.6, 1)
		for _, scale in fitScales do
			scale.Scale = s
		end
	end
	fit()
	camera:GetPropertyChangedSignal("ViewportSize"):Connect(fit)

	UserInputService.InputBegan:Connect(function(input, processed)
		if not processed and input.KeyCode == Enum.KeyCode.M then
			Menu.toggle()
		end
	end)

	player:GetAttributeChangedSignal("Aura"):Connect(function()
		local now = player:GetAttribute("Aura") or 0
		if now > lastAura then
			pending += now - lastAura
			lastGain = os.clock()
			UI.pop(refs.auraScale, 1.06)
		end
		lastAura = now
	end)

	local lastSlow = 0
	RunService.RenderStepped:Connect(function(dt)
		local t = os.clock()

		local aura = player:GetAttribute("Aura") or 0
		shownAura += (aura - shownAura) * math.min(1, dt * 9)
		if math.abs(aura - shownAura) < 0.5 then
			shownAura = aura
		end
		refs.bigAura.Text = "🏆 " .. Util.fmt(shownAura)
		refs.auraPill.Text = "🏆 " .. Util.fmt(shownAura)

		if pending > 0 then
			refs.ticker.Text = "+" .. Util.fmt(pending)
			if t - lastGain < 1.1 then
				refs.ticker.TextTransparency = 0
			else
				refs.ticker.TextTransparency = math.min(1, (t - lastGain - 1.1) / 0.4)
				if refs.ticker.TextTransparency >= 1 then
					pending = 0
				end
			end
		end

		local chain = player:GetAttribute("Chain") or 0
		local remaining = (player:GetAttribute("ChainExpire") or 0) - workspace:GetServerTimeNow()
		if chain >= 3 and remaining > 0 then
			refs.chain.Visible = true
			refs.chainText.Text = string.format("CHAIN x%d  ·  +%d%%", chain, math.floor((Config.ChainMult(chain) - 1) * 100 + 0.5))
			refs.chainText.TextColor3 = C.Sky:Lerp(C.Pink, math.clamp(chain / Config.ChainMax, 0, 1))
			refs.chainBar.set(remaining / Config.ChainWindow)
		else
			refs.chain.Visible = false
		end

		-- Mog Streak / Frenzy chip
		local now = workspace:GetServerTimeNow()
		local frenzyLeft = (player:GetAttribute("FrenzyEnd") or 0) - now
		local combo = player:GetAttribute("SwingCombo") or 0
		if frenzyLeft > 0 then
			refs.streak.Visible = true
			refs.streakText.Text = string.format("🔥 FRENZY x%d  ·  %.1fs", Config.Frenzy.Mult, frenzyLeft)
			refs.streakText.TextColor3 = C.Yellow
			refs.streakBar.set(frenzyLeft / Config.Frenzy.Duration)
			refs.streakBar.fill.BackgroundColor3 = C.Yellow
		elseif combo >= 5 and (t - lastGain) < 1.2 then
			refs.streak.Visible = true
			refs.streakText.Text = string.format("MOG STREAK  %d/%d", combo, Config.Frenzy.Combo)
			refs.streakText.TextColor3 = C.Orange
			refs.streakBar.set(combo / Config.Frenzy.Combo)
			refs.streakBar.fill.BackgroundColor3 = C.Orange
		else
			refs.streak.Visible = false
		end
		-- Next play-time gift
		local giftIn = (player:GetAttribute("GiftAt") or 0) - now
		if (player:GetAttribute("GiftAt") or 0) > 0 and giftIn > 0 then
			refs.gift.Visible = true
			refs.giftText.Text = "🎁 Gift in " .. Util.clock(giftIn)
			refs.giftText.TextColor3 = C.Mint
		else
			refs.gift.Visible = false
		end

		if t - lastSlow > 0.15 then
			lastSlow = t
			Hud.refresh()
		end
	end)
end

function Hud.pulseChain()
	UI.pop(refs.chainScale, 1.12)
end

function Hud.pulseQuest()
	UI.pop(refs.questScale, 1.15)
end

-- The total multiplier on every swing (hammer x pets x rebirth x boost x event).
function Hud.swingMult()
	local hammer = Config.HammerById[player:GetAttribute("Hammer") or 1] or Config.Hammers[1]
	local rebirths = player:GetAttribute("Rebirths") or 0
	local ev = workspace:GetAttribute("Event")
	local evDef = ev and ev ~= "" and Config.EventById[ev]
	local boost = Config.BoostMult(player:GetAttribute("Lv_Boost") or 0)
	return hammer.Mult * (1 + (player:GetAttribute("PetMult") or 0)) * Config.RebirthMult(rebirths) * boost * ((evDef and evDef.AuraMult) or 1)
end

function Hud.refresh()
	local level = player:GetAttribute("Level") or 1
	local rankIndex = player:GetAttribute("Rank") or 1
	local rank = Config.Ranks[rankIndex]
	local xp = player:GetAttribute("XP") or 0
	local needed = player:GetAttribute("XPNeeded") or 1
	local rebirths = player:GetAttribute("Rebirths") or 0
	local need = player:GetAttribute("RebirthNeed") or Config.RebirthRequirement(rebirths)

	-- Level bar
	refs.levelText.Text = string.format("LEVEL %s   %s/%s   ·   %s", Util.fmt(level), Util.fmt(xp), Util.fmt(needed), rank.Name:upper())
	refs.xpBar.fill.BackgroundColor3 = rank.Color
	refs.xpBar.set(xp / needed)
	tint(refs.levelFrame, rank.Color)

	-- Banner + pills
	local mult = Hud.swingMult()
	refs.banner.Text = string.format("Click / tap to train  •  ×%s Aura  •  Rebirth at Level %d", Util.fmt(mult), need)
	refs.rebirthPill.Text = "★ " .. rebirths
	refs.multPill.Text = "×" .. Util.fmt(mult) .. " per swing"

	-- Rebirth button percentage + window
	local pct = math.clamp(level / need, 0, 1)
	refs.rebirthCaption.Text = math.floor(pct * 100) .. "%"
	refs.rebirthBar.set(pct)
	if refs.rebirthWin.Visible then
		local ready = level >= need
		refs.rebirthInfo.Text = string.format(
			"Reach level %d to be reborn.\nYou keep your level, hammers and outfits.\nAura, stats and upgrades reset.\nEvery rebirth adds +50%% Aura and XP forever and gives 2 free crates.",
			need
		)
		refs.rebirthProg.set(pct)
		refs.rebirthGo.Text = ready and "REBIRTH NOW" or string.format("LEVEL %d / %d", level, need)
		refs.rebirthGo.BackgroundColor3 = ready and C.Good or C.Disabled
	end

	-- Quest
	local kind = player:GetAttribute("QuestKind")
	refs.quest.Visible = kind ~= nil
	if kind then
		local goal = player:GetAttribute("QuestGoal") or 1
		local progress = player:GetAttribute("QuestProgress") or 0
		refs.questText.Text = Config.QuestText(kind, goal)
		refs.questCount.Text = progress .. "/" .. goal
		refs.questBar.set(progress / goal)
	end

	-- Event chip
	local id = workspace:GetAttribute("Event")
	local ev = id and id ~= "" and Config.EventById[id]
	local left = (workspace:GetAttribute("EventEnd") or 0) - workspace:GetServerTimeNow()
	if ev and left > 0 then
		refs.event.Visible = true
		refs.eventText.Text = string.format("%s %s  %s  ·  %s", ev.Icon, ev.Name, Util.clock(left), ev.Desc)
		refs.eventText.TextColor3 = C.Pink
	else
		refs.event.Visible = false
	end

	-- Mog Competition chip
	local compState = workspace:GetAttribute("CompState")
	local compLeft = (workspace:GetAttribute("CompEnd") or 0) - workspace:GetServerTimeNow()
	if compState == "open" and compLeft > 0 then
		refs.comp.Visible = true
		refs.compText.Text = string.format("🏆 MOG COMPETITION OPEN %s  ·  press MOG", Util.clock(compLeft))
		refs.compText.TextColor3 = C.Orange
	elseif compState == "idle" and compLeft > 0 then
		refs.comp.Visible = true
		refs.compText.Text = string.format("🏆 Mog Competition in %s", Util.clock(compLeft))
		refs.compText.TextColor3 = C.Muted
	else
		refs.comp.Visible = false
	end

	-- Badges: a dot means "something is waiting for you"
	local aura = player:GetAttribute("Aura") or 0
	local affordable = false
	for _, def in Config.Upgrades do
		local lvl = player:GetAttribute("Lv_" .. def.Id) or 0
		if lvl < def.Max and aura >= Config.UpgradeCost(def, lvl) then
			affordable = true
		end
	end
	refs.badges.Rewards.Visible = player:GetAttribute("DailyReady") == true
	refs.badges.Crates.Visible = (player:GetAttribute("FreeCrates") or 0) > 0
	refs.badges.Upgrades.Visible = affordable
	refs.badges.Wardrobe.Visible = refs.newItem == true
end

function Hud.setNewItem(flag)
	refs.newItem = flag
end

return Hud

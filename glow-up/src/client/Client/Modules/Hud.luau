-- SUB 5 TO TRUE ADAM: the always-on screen, kept small so it never gets in the way of the action.
-- Top: Aura and level pills (with a thin XP bar). Under them: tiny chips that only show up when
-- relevant (chain, competition, event). Left: one small quest. Bottom: a compact colourful dock.
-- Every kind of information has its own colour so it can be read at a glance.
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
local C = UI.Colors

local DOCK = {
	{ name = "Wardrobe", icon = "👗", color = C.Pink },
	{ name = "Crates", icon = "🎁", color = C.Orange },
	{ name = "Upgrades", icon = "⬆️", color = C.Mint },
	{ name = "Profile", icon = "📈", color = C.Sky },
	{ name = "Rewards", icon = "📅", color = C.Yellow },
	{ name = "Settings", icon = "⚙️", color = C.Purple },
}

local refs = {}
local shownAura = 0
local pending, lastGain = 0, 0
local lastAura = 0

local function tint(panel, color)
	local stroke = panel:FindFirstChildOfClass("UIStroke")
	if stroke then
		stroke.Color = color
	end
end

-- A small rounded pill with a coloured outline.
local function pill(parent, name, size, color)
	local frame = UI.panel(parent, { Name = name, Size = size, Radius = 10 })
	tint(frame, color)
	return frame
end

local function buildTop(gui)
	local row = UI.new("Frame", {
		Name = "TopRow",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 6),
		Size = UDim2.fromOffset(380, 34),
		BackgroundTransparency = 1,
	}, gui)
	UI.new("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		Padding = UDim.new(0, 8),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, row)

	-- Aura (gold)
	local aura = pill(row, "Aura", UDim2.fromOffset(150, 32), C.Gold)
	aura.LayoutOrder = 1
	refs.auraScale = UI.new("UIScale", {}, aura)
	refs.aura = UI.label(aura, {
		Position = UDim2.fromOffset(10, 0),
		Size = UDim2.new(1, -20, 1, 0),
		Font = UI.Fonts.Title,
		TextSize = 17,
		TextColor3 = C.Yellow,
		TextWrapped = false,
		Text = "✦ 0",
	})
	refs.ticker = UI.label(aura, {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -8, 0.5, 0),
		Size = UDim2.fromOffset(60, 16),
		Font = UI.Fonts.Title,
		TextSize = 12,
		TextColor3 = C.Mint,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		TextTransparency = 1,
		Text = "",
	})

	-- Level + tier (colour follows the tier)
	local level = pill(row, "Level", UDim2.fromOffset(222, 32), C.Purple)
	level.LayoutOrder = 2
	refs.levelFrame = level
	refs.level = UI.label(level, {
		Position = UDim2.fromOffset(10, 1),
		Size = UDim2.new(1, -20, 0, 20),
		Font = UI.Fonts.Title,
		TextSize = 13,
		TextWrapped = false,
		Text = "",
	})
	refs.xpBar = UI.bar(level, { Position = UDim2.new(0, 10, 1, -9), Size = UDim2.new(1, -20, 0, 5) }, C.Purple)
	refs.xpText = UI.label(level, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -10, 0, 1),
		Size = UDim2.fromOffset(90, 20),
		Font = UI.Fonts.Bold,
		TextSize = 10,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		Text = "",
	})
end

local function buildChips(gui)
	-- Small status chips under the top row; only visible while relevant.
	local stack = UI.new("Frame", {
		Name = "Chips",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 44),
		Size = UDim2.fromOffset(260, 80),
		BackgroundTransparency = 1,
	}, gui)
	UI.new("UIListLayout", {
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		Padding = UDim.new(0, 4),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, stack)

	local function chip(order, color, width)
		local c = pill(stack, "Chip", UDim2.fromOffset(width, 22), color)
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

	refs.chain, refs.chainText = chip(1, C.Sky, 150)
	refs.chainScale = UI.new("UIScale", {}, refs.chain)
	refs.chainBar = UI.bar(refs.chain, { Position = UDim2.new(0, 10, 1, -5), Size = UDim2.new(1, -20, 0, 2) }, C.Sky)
	refs.comp, refs.compText = chip(2, C.Orange, 260)
	refs.event, refs.eventText = chip(3, C.Pink, 260)

	-- Quest (mint), on the left edge below the Roblox chat
	refs.quest = pill(gui, "Quest", UDim2.fromOffset(190, 40), C.Mint)
	refs.quest.AnchorPoint = Vector2.new(0, 0.5)
	refs.quest.Position = UDim2.new(0, 10, 0.5, -30)
	refs.questScale = UI.new("UIScale", {}, refs.quest)
	refs.questText = UI.label(refs.quest, {
		Position = UDim2.fromOffset(10, 3),
		Size = UDim2.new(1, -52, 0, 16),
		Font = UI.Fonts.Bold,
		TextSize = 11,
		TextWrapped = false,
		Text = "",
	})
	refs.questBar = UI.bar(refs.quest, { Position = UDim2.new(0, 10, 1, -12), Size = UDim2.new(1, -20, 0, 6) }, C.Mint)
	refs.questCount = UI.label(refs.quest, {
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

local function buildDock(gui, Menu)
	local dock = UI.new("Frame", {
		Name = "Dock",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -8),
		Size = UDim2.fromOffset(#DOCK * 50, 50),
		BackgroundTransparency = 1,
	}, gui)
	UI.new("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		VerticalAlignment = Enum.VerticalAlignment.Center,
		Padding = UDim.new(0, 6),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, dock)
	refs.badges = {}
	for i, entry in DOCK do
		local button = UI.button(dock, {
			LayoutOrder = i,
			Size = UDim2.fromOffset(44, 48),
			BackgroundColor3 = entry.color,
			Text = "",
			Radius = 12,
		}, "card")
		UI.label(button, {
			Size = UDim2.new(1, 0, 0, 26),
			Position = UDim2.fromOffset(0, 4),
			Font = UI.Fonts.Bold,
			TextSize = 20,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			TextStrokeTransparency = 1,
			Text = entry.icon,
		})
		UI.label(button, {
			Size = UDim2.new(1, 0, 0, 12),
			Position = UDim2.new(0, 0, 1, -15),
			Font = UI.Fonts.Title,
			TextSize = 8,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			TextStrokeTransparency = 0.2,
			Text = entry.name:upper(),
		})
		local badge = UI.new("Frame", {
			AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, -1, 0, 1),
			Size = UDim2.fromOffset(11, 11),
			BackgroundColor3 = C.Danger,
			Visible = false,
			ZIndex = 5,
		}, button)
		UI.corner(badge, 6)
		UI.stroke(badge, Color3.new(1, 1, 1), 1.5, 0)
		refs.badges[entry.name] = badge
		button.Activated:Connect(function()
			Audio.click()
			Menu.toggle(entry.name)
		end)
	end
end

function Hud.init(gui, Menu)
	buildTop(gui)
	buildChips(gui)
	buildDock(gui, Menu)

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
			UI.pop(refs.auraScale, 1.05)
		end
		lastAura = now
	end)

	local lastSlow = 0
	RunService.RenderStepped:Connect(function(dt)
		local t = os.clock()

		-- Aura counter rolls up smoothly.
		local aura = player:GetAttribute("Aura") or 0
		shownAura += (aura - shownAura) * math.min(1, dt * 9)
		if math.abs(aura - shownAura) < 0.5 then
			shownAura = aura
		end
		refs.aura.Text = "✦ " .. Util.fmt(shownAura)

		-- Gain ticker: merges rapid pickups into one number, then fades.
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

		-- Chain chip
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

function Hud.refresh()
	-- Level, tier and XP
	local level = player:GetAttribute("Level") or 1
	local rankIndex = player:GetAttribute("Rank") or 1
	local rank = Config.Ranks[rankIndex]
	local xp = player:GetAttribute("XP") or 0
	local needed = player:GetAttribute("XPNeeded") or 1
	refs.level.Text = string.format("LV %s  ·  %s", Util.fmt(level), rank.Name:upper())
	refs.level.TextColor3 = rank.Color
	refs.xpText.Text = string.format("%s/%s", Util.fmt(xp), Util.fmt(needed))
	refs.xpBar.fill.BackgroundColor3 = rank.Color
	refs.xpBar.set(xp / needed)
	tint(refs.levelFrame, rank.Color)

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
		refs.compText.Text = string.format("🏆 MOG COMPETITION OPEN %s  ·  go to the stage", Util.clock(compLeft))
		refs.compText.TextColor3 = C.Orange
	elseif compState == "idle" and compLeft > 0 then
		refs.comp.Visible = true
		refs.compText.Text = string.format("🏆 Mog Competition in %s", Util.clock(compLeft))
		refs.compText.TextColor3 = C.Muted
	else
		refs.comp.Visible = false
	end

	-- Dock badges: a dot means "something is waiting for you"
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

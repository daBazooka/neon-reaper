-- SUB 5 TO TRUE ADAM: the always-on screen. Deliberately minimal: your Aura (with rank progress), one
-- quest, a chain chip and an event banner only when relevant, and a dock that opens the menu.
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
	{ name = "Wardrobe", icon = "👗" },
	{ name = "Crates", icon = "🎁" },
	{ name = "Upgrades", icon = "⬆️" },
	{ name = "Profile", icon = "📈" },
	{ name = "Rewards", icon = "📅" },
	{ name = "Settings", icon = "⚙️" },
}

local refs = {}
local shownAura = 0
local pending, lastGain = 0, 0
local lastAura = 0

local function buildAuraCard(gui)
	local card = UI.panel(gui, {
		Name = "AuraCard",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 8),
		Size = UDim2.fromOffset(360, 94),
	})
	refs.cardScale = UI.new("UIScale", {}, card)

	refs.aura = UI.label(card, {
		Position = UDim2.fromOffset(18, 6),
		Size = UDim2.fromOffset(190, 42),
		Font = UI.Fonts.Title,
		TextSize = 34,
		TextColor3 = C.Gold,
		TextWrapped = false,
		Text = "✦ 0",
	})
	refs.ticker = UI.label(card, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -16, 0, 12),
		Size = UDim2.fromOffset(110, 26),
		Font = UI.Fonts.Title,
		TextSize = 20,
		TextColor3 = C.Good,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		TextTransparency = 1,
		Text = "",
	})
	refs.rate = UI.label(card, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -16, 0, 38),
		Size = UDim2.fromOffset(110, 16),
		Font = UI.Fonts.Bold,
		TextSize = 12,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		Text = "",
	})
	refs.rank = UI.label(card, {
		Position = UDim2.fromOffset(18, 48),
		Size = UDim2.fromOffset(210, 18),
		Font = UI.Fonts.Title,
		TextSize = 14,
		TextWrapped = false,
		Text = "",
	})
	refs.rankBar = UI.bar(card, {
		Position = UDim2.new(0, 18, 1, -16),
		Size = UDim2.new(1, -36, 0, 8),
	}, C.Accent)
	refs.rankNext = UI.label(card, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -18, 0, 48),
		Size = UDim2.fromOffset(130, 18),
		Font = UI.Fonts.Bold,
		TextSize = 12,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		Text = "",
	})
end

local function buildChips(gui)
	-- Chain chip
	refs.chain = UI.panel(gui, {
		Name = "ChainChip",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 110),
		Size = UDim2.fromOffset(220, 32),
		Visible = false,
		Radius = 16,
	})
	refs.chainScale = UI.new("UIScale", {}, refs.chain)
	refs.chainText = UI.label(refs.chain, {
		Size = UDim2.new(1, 0, 0, 26),
		Font = UI.Fonts.Title,
		TextSize = 15,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "",
	})
	refs.chainBar = UI.bar(refs.chain, { Position = UDim2.new(0, 14, 1, -8), Size = UDim2.new(1, -28, 0, 3) }, C.Cyan)

	-- Event banner
	refs.event = UI.panel(gui, {
		Name = "EventBanner",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 188),
		Size = UDim2.fromOffset(300, 46),
		Visible = false,
		Radius = 14,
	})
	refs.eventTitle = UI.label(refs.event, {
		Position = UDim2.fromOffset(14, 4),
		Size = UDim2.new(1, -28, 0, 22),
		Font = UI.Fonts.Title,
		TextSize = 16,
		TextWrapped = false,
		Text = "",
	})
	refs.eventDesc = UI.label(refs.event, {
		Position = UDim2.fromOffset(14, 24),
		Size = UDim2.new(1, -28, 0, 16),
		Font = UI.Fonts.Body,
		TextSize = 12,
		TextColor3 = C.Muted,
		TextWrapped = false,
		Text = "",
	})

	-- Mog Competition chip
	refs.comp = UI.panel(gui, {
		Name = "CompChip",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 148),
		Size = UDim2.fromOffset(300, 34),
		Visible = false,
		Radius = 14,
	})
	refs.compText = UI.label(refs.comp, {
		Size = UDim2.fromScale(1, 1),
		Font = UI.Fonts.Title,
		TextSize = 14,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "",
	})

	-- Quest chip (left edge, below the Roblox chat)
	refs.quest = UI.panel(gui, {
		Name = "QuestChip",
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 14, 0.5, -40),
		Size = UDim2.fromOffset(250, 62),
		Radius = 14,
	})
	refs.questScale = UI.new("UIScale", {}, refs.quest)
	refs.questText = UI.label(refs.quest, {
		Position = UDim2.fromOffset(14, 6),
		Size = UDim2.new(1, -28, 0, 20),
		Font = UI.Fonts.Bold,
		TextSize = 14,
		TextWrapped = false,
		Text = "",
	})
	refs.questBar = UI.bar(refs.quest, { Position = UDim2.new(0, 14, 1, -22), Size = UDim2.new(1, -28, 0, 10) }, C.Good)
	refs.questCount = UI.label(refs.quest, {
		Position = UDim2.fromOffset(14, 24),
		Size = UDim2.new(1, -28, 0, 12),
		Font = UI.Fonts.Bold,
		TextSize = 11,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		Text = "",
	})
end

local function buildDock(gui, Menu)
	local dock = UI.panel(gui, {
		Name = "Dock",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -14),
		Size = UDim2.fromOffset(#DOCK * 70 + 14, 76),
		Radius = 22,
	})
	UI.new("UIScale", {}, dock)
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
			Size = UDim2.fromOffset(64, 62),
			Text = "",
		}, "card")
		UI.label(button, {
			Size = UDim2.new(1, 0, 0, 36),
			Position = UDim2.fromOffset(0, 4),
			Font = UI.Fonts.Bold,
			TextSize = 26,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = entry.icon,
		})
		UI.label(button, {
			Size = UDim2.new(1, 0, 0, 16),
			Position = UDim2.new(0, 0, 1, -20),
			Font = UI.Fonts.Bold,
			TextSize = 11,
			TextColor3 = C.Muted,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = entry.name,
		})
		local badge = UI.new("Frame", {
			AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, -4, 0, 4),
			Size = UDim2.fromOffset(12, 12),
			BackgroundColor3 = C.Accent2,
			Visible = false,
			ZIndex = 5,
		}, button)
		UI.corner(badge, 6)
		UI.stroke(badge, Color3.new(1, 1, 1), 1.5, 0.2)
		refs.badges[entry.name] = badge
		button.Activated:Connect(function()
			Audio.click()
			Menu.toggle(entry.name)
		end)
	end
end

function Hud.init(gui, Menu)
	buildAuraCard(gui)
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
			UI.pop(refs.cardScale, 1.04)
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
			refs.chainBar.set(remaining / Config.ChainWindow)
			refs.chainText.TextColor3 = C.Cyan:Lerp(C.Accent2, math.clamp(chain / Config.ChainMax, 0, 1))
		else
			refs.chain.Visible = false
		end

		if t - lastSlow > 0.15 then
			lastSlow = t
			Hud.refresh(Menu)
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
	-- Level + XP progress, and which looks tier you are
	local level = player:GetAttribute("Level") or 1
	local rankIndex = player:GetAttribute("Rank") or 1
	local rank = Config.Ranks[rankIndex]
	local nextRank = Config.Ranks[rankIndex + 1]
	local xp = player:GetAttribute("XP") or 0
	local needed = player:GetAttribute("XPNeeded") or 1
	refs.rank.Text = string.format("LV %s  ·  %s", Util.fmt(level), rank.Name:upper())
	refs.rank.TextColor3 = rank.Color
	refs.rankBar.fill.BackgroundColor3 = rank.Color
	refs.rankBar.set(xp / needed)
	if nextRank then
		refs.rankNext.Text = string.format("%s / %s XP", Util.fmt(xp), Util.fmt(needed))
	else
		refs.rankNext.Text = string.format("%s / %s XP", Util.fmt(xp), Util.fmt(needed))
	end
	local rate = player:GetAttribute("AuraRate") or 0
	refs.rate.Text = rate > 0 and ("+" .. Util.fmt(rate) .. " /s") or ""

	-- Quest
	local kind = player:GetAttribute("QuestKind")
	refs.quest.Visible = kind ~= nil
	if kind then
		local goal = player:GetAttribute("QuestGoal") or 1
		local progress = player:GetAttribute("QuestProgress") or 0
		refs.questText.Text = "🎯 " .. Config.QuestText(kind, goal)
		refs.questCount.Text = progress .. " / " .. goal
		refs.questBar.set(progress / goal)
	end

	-- Event banner
	local id = workspace:GetAttribute("Event")
	local ev = id and id ~= "" and Config.EventById[id]
	local left = (workspace:GetAttribute("EventEnd") or 0) - workspace:GetServerTimeNow()
	if ev and left > 0 then
		refs.event.Visible = true
		refs.eventTitle.Text = string.format("%s %s  ·  %s", ev.Icon, ev.Name, Util.clock(left))
		refs.eventTitle.TextColor3 = ev.Tint
		refs.eventDesc.Text = ev.Desc
	else
		refs.event.Visible = false
	end

	-- Mog Competition countdown
	local compState = workspace:GetAttribute("CompState")
	local compLeft = (workspace:GetAttribute("CompEnd") or 0) - workspace:GetServerTimeNow()
	if compState == "open" and compLeft > 0 then
		refs.comp.Visible = true
		refs.compText.Text = string.format("🏆 MOG COMPETITION OPEN  %s  ·  go to the stage!", Util.clock(compLeft))
		refs.compText.TextColor3 = C.Gold
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

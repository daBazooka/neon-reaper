-- SUB 5 TO TRUE ADAM: your character sheet: rank, stats, duel record and the current quest.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))

local player = Players.LocalPlayer
local C = UI.Colors

local TabProfile = {}

function TabProfile.build(parent)
	local hero = UI.panel(parent, {
		Size = UDim2.new(1, -8, 0, 110),
		BackgroundColor3 = C.Card,
		Radius = 16,
	})
	local rankLabel = UI.label(hero, {
		Position = UDim2.fromOffset(20, 12),
		Size = UDim2.new(1, -40, 0, 38),
		Font = UI.Fonts.Title,
		TextSize = 32,
		TextWrapped = false,
		Text = "",
	})
	local scoreLabel = UI.label(hero, {
		Position = UDim2.fromOffset(20, 52),
		Size = UDim2.new(1, -40, 0, 20),
		Font = UI.Fonts.Bold,
		TextSize = 15,
		TextColor3 = C.Muted,
		TextWrapped = false,
		Text = "",
	})
	local rankBar = UI.bar(hero, { Position = UDim2.new(0, 20, 1, -26), Size = UDim2.new(1, -40, 0, 10) }, C.Accent)
	local rankHint = UI.label(hero, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -20, 0, 14),
		Size = UDim2.fromOffset(200, 18),
		Font = UI.Fonts.Bold,
		TextSize = 12,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		Text = "",
	})

	-- Stat cards
	local statRow = UI.new("Frame", {
		Position = UDim2.fromOffset(0, 122),
		Size = UDim2.new(1, -8, 0, 110),
		BackgroundTransparency = 1,
	}, parent)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 10) }, statRow)
	local statRefs = {}
	for _, id in Config.StatOrder do
		local def = Config.Stats[id]
		local card = UI.panel(statRow, { Size = UDim2.new(1 / 3, -7, 1, 0), BackgroundColor3 = C.Card, Radius = 14 })
		card:FindFirstChildOfClass("UIStroke").Color = def.Color
		UI.label(card, {
			Position = UDim2.fromOffset(0, 8),
			Size = UDim2.new(1, 0, 0, 34),
			Font = UI.Fonts.Bold,
			TextSize = 28,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = def.Icon,
		})
		statRefs[id] = UI.label(card, {
			Position = UDim2.fromOffset(0, 42),
			Size = UDim2.new(1, 0, 0, 30),
			Font = UI.Fonts.Title,
			TextSize = 24,
			TextColor3 = def.Color,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = "0",
		})
		UI.label(card, {
			Position = UDim2.fromOffset(0, 76),
			Size = UDim2.new(1, 0, 0, 20),
			Font = UI.Fonts.Bold,
			TextSize = 12,
			TextColor3 = C.Muted,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = def.Name:upper() .. "  ·  " .. def.Station,
		})
	end

	local record = UI.label(parent, {
		Position = UDim2.fromOffset(0, 244),
		Size = UDim2.new(1, -8, 0, 22),
		Font = UI.Fonts.Bold,
		TextSize = 15,
		TextColor3 = C.Text,
		TextWrapped = false,
		Text = "",
	})
	local questTitle = UI.label(parent, {
		Position = UDim2.fromOffset(0, 276),
		Size = UDim2.new(1, -8, 0, 20),
		Font = UI.Fonts.Title,
		TextSize = 14,
		TextColor3 = C.Muted,
		TextWrapped = false,
		Text = "CURRENT QUEST",
	})
	local questCard = UI.panel(parent, {
		Position = UDim2.fromOffset(0, 300),
		Size = UDim2.new(1, -8, 0, 70),
		BackgroundColor3 = C.Card,
		Radius = 14,
	})
	local questText = UI.label(questCard, {
		Position = UDim2.fromOffset(16, 8),
		Size = UDim2.new(1, -32, 0, 22),
		Font = UI.Fonts.Bold,
		TextSize = 16,
		TextWrapped = false,
		Text = "",
	})
	local questBar = UI.bar(questCard, { Position = UDim2.new(0, 16, 1, -22), Size = UDim2.new(1, -32, 0, 10) }, C.Good)
	local questReward = UI.label(questCard, {
		Position = UDim2.fromOffset(16, 32),
		Size = UDim2.new(1, -32, 0, 16),
		Font = UI.Fonts.Body,
		TextSize = 12,
		TextColor3 = C.Muted,
		TextWrapped = false,
		Text = "",
	})

	local function refresh()
		local rankIndex = player:GetAttribute("Rank") or 1
		local rank = Config.Ranks[rankIndex]
		local nextRank = Config.Ranks[rankIndex + 1]
		local score = player:GetAttribute("GlowScore") or 0
		local rebirths = player:GetAttribute("Rebirths") or 0
		rankLabel.Text = (rebirths > 0 and ("★" .. rebirths .. "  ") or "") .. rank.Full:upper()
		rankLabel.TextColor3 = rank.Color
		scoreLabel.Text = string.format("Level %s   ·   Mog Power %s   ·   Rebirths %d", Util.fmt(player:GetAttribute("Level") or 1), Util.fmt(score), rebirths)
		rankBar.fill.BackgroundColor3 = rank.Color
		rankBar.set((player:GetAttribute("XP") or 0) / (player:GetAttribute("XPNeeded") or 1))
		if nextRank then
			rankHint.Text = string.format("Next tier: %s at level %s", nextRank.Full, Util.fmt(nextRank.Level))
		else
			rankHint.Text = "Highest tier reached"
		end
		for id, label in statRefs do
			label.Text = Util.fmt(player:GetAttribute(id) or 0)
		end
		record.Text = string.format(
			"⚔️  Duel wins %d     🔥 Win streak %d",
			player:GetAttribute("Wins") or 0,
			player:GetAttribute("DuelStreak") or 0
		)
		local kind = player:GetAttribute("QuestKind")
		if kind then
			local goal = player:GetAttribute("QuestGoal") or 1
			local progress = player:GetAttribute("QuestProgress") or 0
			questText.Text = "🎯 " .. Config.QuestText(kind, goal)
			questBar.set(progress / goal)
			questReward.Text = string.format("%d / %d   ·   Reward ✦ %s", progress, goal, Util.fmt(player:GetAttribute("QuestReward") or 0))
		end
	end
	return { refresh = refresh }
end

return TabProfile

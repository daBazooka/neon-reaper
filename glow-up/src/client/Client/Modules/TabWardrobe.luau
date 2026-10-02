-- SUB 5 TO TRUE ADAM: the wardrobe. A collection grid: owned items can be worn, unowned ones show as locked
-- silhouettes so players can see what they're chasing.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))

local player = Players.LocalPlayer
local C = UI.Colors

local TabWardrobe = {}

function TabWardrobe.build(parent, Action)
	local filter = "All"
	local cards = {} -- cosmetic id -> card refs

	-- Header: collection counter and totals
	local summary = UI.label(parent, {
		Size = UDim2.new(1, -4, 0, 22),
		Font = UI.Fonts.Bold,
		TextSize = 15,
		TextColor3 = C.Muted,
		TextWrapped = false,
		Text = "",
	})

	-- Slot filter
	local bar = UI.new("Frame", {
		Position = UDim2.fromOffset(0, 28),
		Size = UDim2.new(1, 0, 0, 34),
		BackgroundTransparency = 1,
	}, parent)
	UI.new("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		Padding = UDim.new(0, 6),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, bar)
	local filterButtons = {}
	local names = { "All" }
	for _, slot in Config.Slots do
		table.insert(names, slot)
	end

	local scroller = UI.new("ScrollingFrame", {
		Position = UDim2.fromOffset(0, 70),
		Size = UDim2.new(1, 0, 1, -70),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 4,
		ScrollBarImageColor3 = C.Accent,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
	}, parent)
	UI.new("UIGridLayout", {
		CellSize = UDim2.fromOffset(136, 150),
		CellPadding = UDim2.fromOffset(10, 10),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, scroller)
	UI.new("UIPadding", { PaddingBottom = UDim.new(0, 10), PaddingRight = UDim.new(0, 8) }, scroller)

	local function applyFilter()
		for id, card in cards do
			local c = Config.CosmeticById[id]
			card.frame.Visible = filter == "All" or c.Slot == filter
		end
		for name, b in filterButtons do
			UI.tween(b, 0.12, { BackgroundColor3 = name == filter and C.Accent or C.Card })
		end
	end

	for i, name in names do
		local label = name == "All" and "All" or (Config.SlotIcons[name] .. " " .. name)
		local b = UI.button(bar, {
			LayoutOrder = i,
			Size = UDim2.fromOffset(name == "All" and 52 or 92, 30),
			Text = label,
			TextSize = 13,
			Radius = 15,
		}, "card")
		filterButtons[name] = b
		b.Activated:Connect(function()
			Audio.click()
			filter = name
			applyFilter()
		end)
	end

	-- Cards, ordered by slot then rarity
	local ordered = table.clone(Config.Cosmetics)
	table.sort(ordered, function(a, b)
		if a.Slot ~= b.Slot then
			return table.find(Config.Slots, a.Slot) < table.find(Config.Slots, b.Slot)
		end
		return Config.Rarities[a.Rarity].Order < Config.Rarities[b.Rarity].Order
	end)

	for i, c in ordered do
		local rarityColor = Config.Rarities[c.Rarity].Color
		local frame = UI.button(scroller, { LayoutOrder = i, Text = "" }, "card")
		local stroke = UI.stroke(frame, rarityColor, 2, 0.4)
		local icon = UI.label(frame, {
			Position = UDim2.fromOffset(0, 8),
			Size = UDim2.new(1, 0, 0, 52),
			Font = UI.Fonts.Bold,
			TextSize = 40,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = c.Icon,
		})
		local name = UI.label(frame, {
			Position = UDim2.fromOffset(6, 62),
			Size = UDim2.new(1, -12, 0, 18),
			Font = UI.Fonts.Bold,
			TextSize = 13,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = c.Name,
		})
		local rarity = UI.label(frame, {
			Position = UDim2.fromOffset(6, 80),
			Size = UDim2.new(1, -12, 0, 14),
			Font = UI.Fonts.Bold,
			TextSize = 11,
			TextColor3 = rarityColor,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = c.Rarity:upper(),
		})
		local stars = UI.label(frame, {
			Position = UDim2.fromOffset(6, 96),
			Size = UDim2.new(1, -12, 0, 16),
			Font = UI.Fonts.Bold,
			TextSize = 13,
			TextColor3 = C.Gold,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = "",
		})
		local stat = UI.label(frame, {
			Position = UDim2.fromOffset(6, 114),
			Size = UDim2.new(1, -12, 0, 14),
			Font = UI.Fonts.Body,
			TextSize = 11,
			TextColor3 = C.Muted,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = "",
		})
		local tag = UI.label(frame, {
			AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, -6, 0, 6),
			Size = UDim2.fromOffset(70, 16),
			Font = UI.Fonts.Title,
			TextSize = 10,
			TextColor3 = C.Good,
			TextXAlignment = Enum.TextXAlignment.Right,
			TextWrapped = false,
			Text = "",
		})
		frame.Activated:Connect(function()
			local inv = Util.parseInventory(player:GetAttribute("Inv"))
			if not inv[c.Id] then
				Audio.error()
				return
			end
			Audio.equip()
			if player:GetAttribute("Eq_" .. c.Slot) == c.Id then
				Action:FireServer("Unequip", c.Slot)
			else
				Action:FireServer("Equip", c.Id)
			end
		end)
		cards[c.Id] = { frame = frame, icon = icon, name = name, stars = stars, stat = stat, tag = tag, stroke = stroke, c = c }
	end

	local function refresh()
		local inv = Util.parseInventory(player:GetAttribute("Inv"))
		local owned = 0
		for id, card in cards do
			local c = card.c
			local stars = inv[id]
			if stars then
				owned += 1
				card.icon.TextTransparency = 0
				card.name.Text = c.Name
				card.name.TextColor3 = C.Text
				card.stars.Text = string.rep("★", stars) .. string.rep("☆", Config.MaxStars - stars)
				card.stat.Text = string.format("+%s Glow · %s/s", Util.fmt(Config.CosmeticPower(c, stars)), Util.fmt(Config.CosmeticAps(c, stars)))
				local equipped = player:GetAttribute("Eq_" .. c.Slot) == id
				card.tag.Text = equipped and "WORN" or ""
				card.stroke.Transparency = equipped and 0 or 0.4
				card.stroke.Thickness = equipped and 3 or 2
			else
				card.icon.TextTransparency = 0.82
				card.name.Text = "???"
				card.name.TextColor3 = C.Muted
				card.stars.Text = ""
				card.stat.Text = "Find in crates"
				card.tag.Text = ""
				card.stroke.Transparency = 0.8
				card.stroke.Thickness = 1
			end
		end
		summary.Text = string.format(
			"Collection %d/%d   ·   Mog Power %s   ·   +%s Aura/s",
			owned,
			#Config.Cosmetics,
			Util.fmt(player:GetAttribute("GlowScore") or 0),
			Util.fmt(player:GetAttribute("AuraRate") or 0)
		)
	end

	applyFilter()
	return { refresh = refresh }
end

return TabWardrobe

-- SUB 5 TO TRUE ADAM: the Pets tab. Hatch eggs at the top, manage your pets below.
-- Tap a pet to equip / unequip it (3 slots).
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))

local player = Players.LocalPlayer
local C = UI.Colors

local TabPets = {}

local function owned()
	local map = {}
	for id, n in string.gmatch(player:GetAttribute("Pets") or "", "(%w+):(%d+)") do
		map[id] = tonumber(n)
	end
	return map
end

local function equipped()
	local set = {}
	for id in string.gmatch(player:GetAttribute("PetsEq") or "", "%w+") do
		set[id] = true
	end
	return set
end

function TabPets.build(parent, Action)
	UI.label(parent, {
		Size = UDim2.new(1, 0, 0, 26),
		Font = UI.Fonts.Title,
		TextSize = 20,
		TextWrapped = false,
		Text = "🐾  Pets",
	})
	local summary = UI.label(parent, {
		Position = UDim2.fromOffset(0, 28),
		Size = UDim2.new(1, 0, 0, 20),
		Font = UI.Fonts.Bold,
		TextSize = 13,
		TextColor3 = C.Mint,
		TextWrapped = false,
		Text = "",
	})

	-- Eggs
	local eggRow = UI.new("Frame", { Position = UDim2.fromOffset(0, 54), Size = UDim2.new(1, -8, 0, 92), BackgroundTransparency = 1 }, parent)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder }, eggRow)
	local eggButtons = {}
	for i, egg in Config.Eggs do
		local btn = UI.button(eggRow, {
			LayoutOrder = i,
			Size = UDim2.new(1 / #Config.Eggs, -7, 1, 0),
			BackgroundColor3 = egg.Color:Lerp(C.Card, 0.55),
			Text = "",
			Radius = 12,
		}, "card")
		UI.label(btn, {
			Position = UDim2.fromOffset(8, 4),
			Size = UDim2.new(1, -16, 0, 22),
			Font = UI.Fonts.Title,
			TextSize = 15,
			TextColor3 = egg.Color,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = "🥚 " .. egg.Name,
		})
		local odds = {}
		for _, rarity in Config.RarityOrder do
			if egg.Odds[rarity] then
				table.insert(odds, string.format("%s %d%%", rarity, egg.Odds[rarity]))
			end
		end
		UI.label(btn, {
			Position = UDim2.fromOffset(6, 26),
			Size = UDim2.new(1, -12, 0, 36),
			Font = UI.Fonts.Body,
			TextSize = 10,
			TextColor3 = C.Muted,
			TextXAlignment = Enum.TextXAlignment.Center,
			Text = table.concat(odds, " · "),
		})
		local cost = UI.label(btn, {
			Position = UDim2.new(0, 0, 1, -26),
			Size = UDim2.new(1, 0, 0, 22),
			Font = UI.Fonts.Title,
			TextSize = 16,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = "🏆 " .. Util.fmt(egg.Cost),
		})
		btn.Activated:Connect(function()
			Audio.click()
			Action:FireServer("Hatch", egg.Id)
		end)
		eggButtons[egg.Id] = cost
	end

	-- Pet grid
	local scroll = UI.new("ScrollingFrame", {
		Position = UDim2.fromOffset(0, 154),
		Size = UDim2.new(1, -8, 1, -154),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 4,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
	}, parent)
	UI.new("UIGridLayout", {
		CellSize = UDim2.fromOffset(112, 96),
		CellPadding = UDim2.fromOffset(8, 8),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, scroll)
	local cards = {}
	for i, pet in Config.Pets do
		local color = Config.Rarities[pet.Rarity].Color
		local card = UI.button(scroll, {
			LayoutOrder = i,
			BackgroundColor3 = C.Card,
			Text = "",
			Radius = 10,
		}, "card")
		UI.label(card, {
			Position = UDim2.fromOffset(4, 4),
			Size = UDim2.new(1, -8, 0, 28),
			Font = UI.Fonts.Title,
			TextSize = 22,
			TextColor3 = pet.Color,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = "🐾",
		})
		UI.label(card, {
			Position = UDim2.fromOffset(4, 32),
			Size = UDim2.new(1, -8, 0, 28),
			Font = UI.Fonts.Bold,
			TextSize = 11,
			TextColor3 = color,
			TextXAlignment = Enum.TextXAlignment.Center,
			Text = pet.Name,
		})
		local stat = UI.label(card, {
			Position = UDim2.fromOffset(4, 60),
			Size = UDim2.new(1, -8, 0, 30),
			Font = UI.Fonts.Body,
			TextSize = 10,
			TextColor3 = C.Muted,
			TextXAlignment = Enum.TextXAlignment.Center,
			Text = "",
		})
		card.Activated:Connect(function()
			Audio.click()
			local on = equipped()[pet.Id]
			Action:FireServer(on and "PetUnequip" or "PetEquip", pet.Id)
		end)
		cards[pet.Id] = { card = card, stat = stat, color = color }
	end

	local function refresh()
		local have, on = owned(), equipped()
		local aura = player:GetAttribute("Aura") or 0
		local count = 0
		for _ in on do
			count += 1
		end
		summary.Text = string.format("Equipped %d/%d   ·   Pet bonus +%d%% Aura   ·   click a pet to equip it", count, Config.PetSlots, math.floor((player:GetAttribute("PetMult") or 0) * 100 + 0.5))
		for id, cost in eggButtons do
			local egg = Config.EggById[id]
			cost.TextColor3 = aura >= egg.Cost and C.Yellow or C.Danger
		end
		for id, ref in cards do
			local pet = Config.PetById[id]
			local copies = have[id]
			local stroke = ref.card:FindFirstChildOfClass("UIStroke")
			if copies then
				ref.card.BackgroundTransparency = 0
				ref.stat.Text = string.format("+%d%% Aura  ·  %s Aura/s\n%s%s", math.floor(Config.PetMult(pet, copies) * 100 + 0.5), Util.fmt(Config.PetAps(pet, copies)), string.rep("★", Config.PetStars(copies)), on[id] and "  EQUIPPED" or "")
				stroke.Color = on[id] and C.Good or ref.color
			else
				ref.card.BackgroundTransparency = 0.6
				ref.stat.Text = "not found yet"
				stroke.Color = C.Stroke
			end
		end
	end
	return { refresh = refresh }
end

return TabPets

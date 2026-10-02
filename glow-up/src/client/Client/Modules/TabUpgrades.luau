-- SUB 5 TO TRUE ADAM: upgrades (bought with Aura) and the rebirth button.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))

local player = Players.LocalPlayer
local C = UI.Colors

local TabUpgrades = {}

function TabUpgrades.build(parent, Action)
	local list = UI.new("ScrollingFrame", {
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 4,
		ScrollBarImageColor3 = C.Accent,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
	}, parent)
	UI.new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, list)
	UI.new("UIPadding", { PaddingRight = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8) }, list)

	local function row(order, height)
		local r = UI.panel(list, {
			LayoutOrder = order,
			Size = UDim2.new(1, 0, 0, height or 68),
			BackgroundColor3 = C.Card,
			Radius = 14,
		})
		return r
	end

	local refs = {}
	for i, def in Config.Upgrades do
		local r = row(i)
		UI.label(r, {
			Position = UDim2.fromOffset(14, 0),
			Size = UDim2.fromOffset(46, 68),
			Font = UI.Fonts.Bold,
			TextSize = 34,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = def.Icon,
		})
		local name = UI.label(r, {
			Position = UDim2.fromOffset(70, 10),
			Size = UDim2.new(1, -210, 0, 22),
			Font = UI.Fonts.Bold,
			TextSize = 17,
			TextWrapped = false,
			Text = def.Name,
		})
		UI.label(r, {
			Position = UDim2.fromOffset(70, 34),
			Size = UDim2.new(1, -210, 0, 20),
			Font = UI.Fonts.Body,
			TextSize = 13,
			TextColor3 = C.Muted,
			TextWrapped = false,
			Text = def.Desc,
		})
		local levelBar = UI.bar(r, { Position = UDim2.fromOffset(70, 56), Size = UDim2.new(1, -210, 0, 5) }, C.Accent)
		local buy = UI.button(r, {
			AnchorPoint = Vector2.new(1, 0.5),
			Position = UDim2.new(1, -12, 0.5, 0),
			Size = UDim2.fromOffset(110, 46),
			Text = "",
			TextSize = 16,
		}, "primary")
		buy.Activated:Connect(function()
			Audio.click()
			Action:FireServer("Buy", def.Id)
		end)
		refs[def.Id] = { name = name, buy = buy, bar = levelBar, def = def }
	end

	-- Rebirth
	local reb = row(100, 96)
	local rebStroke = reb:FindFirstChildOfClass("UIStroke")
	rebStroke.Color = C.Gold
	rebStroke.Transparency = 0.3
	UI.label(reb, {
		Position = UDim2.fromOffset(14, 0),
		Size = UDim2.fromOffset(46, 96),
		Font = UI.Fonts.Bold,
		TextSize = 38,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "🌟",
	})
	UI.label(reb, {
		Position = UDim2.fromOffset(70, 10),
		Size = UDim2.new(1, -210, 0, 24),
		Font = UI.Fonts.Title,
		TextSize = 19,
		TextColor3 = C.Gold,
		TextWrapped = false,
		Text = "REBIRTH",
	})
	local rebDesc = UI.label(reb, {
		Position = UDim2.fromOffset(70, 36),
		Size = UDim2.new(1, -210, 0, 50),
		Font = UI.Fonts.Body,
		TextSize = 13,
		TextColor3 = C.Muted,
		Text = "",
	})
	local rebButton = UI.button(reb, {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -12, 0.5, 0),
		Size = UDim2.fromOffset(110, 46),
		Text = "REBIRTH",
		TextSize = 15,
	}, "primary")
	rebButton.Activated:Connect(function()
		Audio.click()
		Action:FireServer("Rebirth")
	end)

	local function refresh()
		local aura = player:GetAttribute("Aura") or 0
		for id, ref in refs do
			local lvl = player:GetAttribute("Lv_" .. id) or 0
			ref.name.Text = string.format("%s   Lv %d", ref.def.Name, lvl)
			ref.bar.set(lvl / ref.def.Max)
			if lvl >= ref.def.Max then
				ref.buy.Text = "MAX"
				ref.buy.BackgroundTransparency = 0.5
			else
				local cost = Config.UpgradeCost(ref.def, lvl)
				ref.buy.Text = "✦ " .. Util.fmt(cost)
				ref.buy.BackgroundTransparency = aura >= cost and 0 or 0.5
			end
		end
		local rebirths = player:GetAttribute("Rebirths") or 0
		local need = Config.RebirthRequirement(rebirths)
		local score = player:GetAttribute("Level") or 1
		rebDesc.Text = string.format(
			"Reset Aura, stats and upgrades (you keep your level and every cosmetic). Gain +25%% Aura and Mog Power forever, plus 2 free crates.\nNeeds level %s  (you are level %s)",
			Util.fmt(need),
			Util.fmt(score)
		)
		rebButton.BackgroundTransparency = score >= need and 0 or 0.5
	end
	return { refresh = refresh }
end

return TabUpgrades

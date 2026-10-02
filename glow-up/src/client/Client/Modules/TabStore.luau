-- SUB 5 TO TRUE ADAM: the Store tab (real Robux). Offers without a real id yet show "COMING SOON".
local Players = game:GetService("Players")
local MarketplaceService = game:GetService("MarketplaceService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))

local player = Players.LocalPlayer
local C = UI.Colors

local TabStore = {}

local function offerRow(parent, order, y, title, desc, color)
	local row = UI.panel(parent, { LayoutOrder = order, Size = UDim2.new(1, -8, 0, 54), Radius = 10 })
	row:FindFirstChildOfClass("UIStroke").Color = color
	UI.label(row, {
		Position = UDim2.fromOffset(12, 5),
		Size = UDim2.new(1, -140, 0, 20),
		Font = UI.Fonts.Title,
		TextSize = 15,
		TextColor3 = color,
		TextWrapped = false,
		Text = title,
	})
	local d = UI.label(row, {
		Position = UDim2.fromOffset(12, 26),
		Size = UDim2.new(1, -140, 0, 24),
		Font = UI.Fonts.Body,
		TextSize = 11,
		TextColor3 = C.Muted,
		Text = desc,
	})
	local button = UI.button(row, {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -10, 0.5, 0),
		Size = UDim2.fromOffset(112, 38),
		Text = "",
		TextSize = 13,
	}, "primary")
	return row, button, d
end

function TabStore.build(parent)
	UI.label(parent, {
		Size = UDim2.new(1, 0, 0, 26),
		Font = UI.Fonts.Title,
		TextSize = 20,
		TextWrapped = false,
		Text = "💎  Store",
	})
	local scroll = UI.new("ScrollingFrame", {
		Position = UDim2.fromOffset(0, 34),
		Size = UDim2.new(1, -4, 1, -34),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 4,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
	}, parent)
	UI.new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, scroll)
	local refreshers = {}

	for i, pass in Config.Store.Passes do
		local _, button = offerRow(scroll, i, 0, "⭐ " .. pass.Name, pass.Desc, C.Gold)
		button.Activated:Connect(function()
			Audio.click()
			if pass.PassId ~= 0 and player:GetAttribute("Pass_" .. pass.Id) ~= true then
				pcall(function()
					MarketplaceService:PromptGamePassPurchase(player, pass.PassId)
				end)
			end
		end)
		table.insert(refreshers, function()
			if player:GetAttribute("Pass_" .. pass.Id) == true then
				button.Text, button.BackgroundColor3 = "OWNED", C.Good
			elseif pass.PassId == 0 then
				button.Text, button.BackgroundColor3 = "COMING SOON", C.Disabled
			else
				button.Text, button.BackgroundColor3 = "BUY WITH R$", C.Accent2
			end
		end)
	end
	for i, product in Config.Store.Products do
		local _, button, desc = offerRow(scroll, 10 + i, 0, "🏆 " .. product.Name, "", C.Mint)
		button.Activated:Connect(function()
			Audio.click()
			if product.ProductId ~= 0 then
				pcall(function()
					MarketplaceService:PromptProductPurchase(player, product.ProductId)
				end)
			end
		end)
		table.insert(refreshers, function()
			desc.Text = string.format("Instantly gives %s Aura at your level.", Util.fmt(Config.ProductAura(player:GetAttribute("Level") or 1, product.Size)))
			if product.ProductId == 0 then
				button.Text, button.BackgroundColor3 = "COMING SOON", C.Disabled
			else
				button.Text, button.BackgroundColor3 = "BUY WITH R$", C.Accent2
			end
		end)
	end
	return {
		refresh = function()
			for _, fn in refreshers do
				fn()
			end
		end,
	}
end

return TabStore

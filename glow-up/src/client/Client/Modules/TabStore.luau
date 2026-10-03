-- SUB 5 TO TRUE ADAM: the Store window. Colourful offer cards with a green Robux button each. Offers whose id
-- is still 0 in Config.Store show "Coming soon" under the button and cannot be bought yet.
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

local RAINBOW = ColorSequence.new({
	ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 90, 90)),
	ColorSequenceKeypoint.new(0.25, Color3.fromRGB(255, 200, 60)),
	ColorSequenceKeypoint.new(0.5, Color3.fromRGB(90, 230, 120)),
	ColorSequenceKeypoint.new(0.75, Color3.fromRGB(80, 170, 255)),
	ColorSequenceKeypoint.new(1, Color3.fromRGB(200, 100, 255)),
})

-- The coloured title bar with a red X, shared by the Store and Rewards windows.
function TabStore.header(page, title, color, onClose)
	local bar = UI.new("Frame", { Size = UDim2.new(1, 0, 0, 56), BackgroundColor3 = color, BorderSizePixel = 0, ZIndex = 23 }, page)
	UI.corner(bar, 20)
	UI.gradient(bar, Color3.new(1, 1, 1), Color3.fromRGB(205, 205, 205), 90)
	-- square off the bottom corners so the bar meets the body cleanly
	UI.new("Frame", { Position = UDim2.new(0, 0, 1, -20), Size = UDim2.new(1, 0, 0, 20), BackgroundColor3 = color, BorderSizePixel = 0, ZIndex = 23 }, bar)
	UI.label(bar, {
		Position = UDim2.fromOffset(24, 0),
		Size = UDim2.new(1, -90, 1, 0),
		Font = UI.Fonts.Title,
		TextSize = 30,
		TextWrapped = false,
		TextStrokeTransparency = 0,
		Text = title,
		ZIndex = 25,
	})
	local x = UI.button(bar, {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -14, 0.5, 0),
		Size = UDim2.fromOffset(40, 40),
		BackgroundColor3 = C.Danger,
		Text = "X",
		TextSize = 22,
		Radius = 10,
		ZIndex = 26,
	}, "primary")
	x.Activated:Connect(function()
		Audio.click()
		onClose()
	end)
	return bar
end

local function card(parent, order, offer, kind, onBuy)
	local color = offer.Color or C.Accent
	local frame = UI.new("Frame", { LayoutOrder = order, BackgroundColor3 = color, BorderSizePixel = 0, ZIndex = 24 }, parent)
	UI.corner(frame, 14)
	UI.stroke(frame, Color3.fromRGB(10, 14, 30), 3, 0)
	if offer.Rainbow then
		UI.new("UIGradient", { Color = RAINBOW, Rotation = 35 }, frame)
	else
		UI.gradient(frame, Color3.new(1, 1, 1), Color3.fromRGB(165, 170, 190), 90)
	end
	UI.label(frame, {
		Position = UDim2.fromOffset(0, 14),
		Size = UDim2.new(1, 0, 0, 56),
		Font = UI.Fonts.Title,
		TextSize = 46,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 1,
		Text = offer.Icon or "⭐",
		ZIndex = 25,
	})
	UI.label(frame, {
		Position = UDim2.fromOffset(6, 74),
		Size = UDim2.new(1, -12, 0, 22),
		Font = UI.Fonts.Title,
		TextSize = 16,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0,
		Text = offer.Name,
		ZIndex = 25,
	})
	local desc = UI.label(frame, {
		Position = UDim2.fromOffset(8, 98),
		Size = UDim2.new(1, -16, 0, 32),
		Font = UI.Fonts.Bold,
		TextSize = 11,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextYAlignment = Enum.TextYAlignment.Top,
		TextStrokeTransparency = 0.2,
		Text = offer.Desc or "",
		ZIndex = 25,
	})
	local button = UI.button(frame, {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -22),
		Size = UDim2.new(1, -20, 0, 34),
		BackgroundColor3 = C.Good,
		Text = "R$ " .. offer.Price,
		TextSize = 16,
		Radius = 9,
		ZIndex = 26,
	}, "primary")
	button.Activated:Connect(function()
		Audio.click()
		onBuy()
	end)
	local soon = UI.label(frame, {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -4),
		Size = UDim2.new(1, -10, 0, 14),
		Font = UI.Fonts.Bold,
		TextSize = 10,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextColor3 = Color3.fromRGB(240, 240, 255),
		Text = "Coming soon",
		ZIndex = 25,
	})
	if offer.Tag then
		local ribbon = UI.new("TextLabel", {
			Position = UDim2.fromOffset(-6, 8),
			Size = UDim2.fromOffset(92, 20),
			BackgroundColor3 = C.Danger,
			Font = UI.Fonts.Title,
			TextSize = 11,
			TextColor3 = Color3.new(1, 1, 1),
			Text = offer.Tag,
			ZIndex = 27,
			Rotation = -8,
		}, frame)
		UI.corner(ribbon, 5)
		UI.stroke(ribbon, Color3.new(1, 1, 1), 1.5, 0)
	end
	return { button = button, soon = soon, desc = desc, frame = frame }
end

function TabStore.build(parent, Menu)
	local body = UI.new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(34, 48, 96), BorderSizePixel = 0, ZIndex = 22 }, parent)
	UI.corner(body, 20)
	TabStore.header(parent, "🛒  STORE", Color3.fromRGB(255, 200, 40), function()
		Menu.close()
	end)
	local scroll = UI.new("ScrollingFrame", {
		Position = UDim2.fromOffset(16, 68),
		Size = UDim2.new(1, -32, 1, -80),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 4,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		ZIndex = 23,
	}, parent)
	UI.new("UIGridLayout", {
		CellSize = UDim2.fromOffset(166, 196),
		CellPadding = UDim2.fromOffset(10, 12),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, scroll)
	UI.new("UIPadding", { PaddingTop = UDim.new(0, 6), PaddingLeft = UDim.new(0, 4) }, scroll)

	local refreshers = {}
	local order = 0
	local function add(offer, kind)
		order += 1
		local owned = false
		local c = card(scroll, order, offer, kind, function()
			if kind == "pass" then
				if offer.PassId ~= 0 and not owned then
					pcall(function()
						MarketplaceService:PromptGamePassPurchase(player, offer.PassId)
					end)
				end
			elseif offer.ProductId ~= 0 then
				pcall(function()
					MarketplaceService:PromptProductPurchase(player, offer.ProductId)
				end)
			end
		end)
		table.insert(refreshers, function()
			local id = kind == "pass" and offer.PassId or offer.ProductId
			owned = kind == "pass" and player:GetAttribute("Pass_" .. offer.Id) == true
			if kind == "product" then
				local amount = Util.fmt(Config.ProductAura(player:GetAttribute("Level") or 1, offer.Size))
				c.desc.Text = "+" .. amount .. " Aura" .. (offer.Crates and (" · " .. offer.Crates .. " crates") or "")
			end
			if owned then
				c.button.Text, c.button.BackgroundColor3 = "OWNED", C.Disabled
				c.soon.Visible = false
			else
				c.button.Text, c.button.BackgroundColor3 = "R$ " .. offer.Price, C.Good
				c.soon.Visible = id == 0
			end
		end)
	end
	for _, product in Config.Store.Products do
		if product.Id == "starter" then
			add(product, "product")
		end
	end
	for _, pass in Config.Store.Passes do
		add(pass, "pass")
	end
	for _, product in Config.Store.Products do
		if product.Id ~= "starter" then
			add(product, "product")
		end
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

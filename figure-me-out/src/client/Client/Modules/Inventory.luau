-- FIGURE ME OUT: the gadget inventory (🎒 or I). Every gadget with its charges, cooldown and what it does, plus the clues you
-- hacked from information terminals this match.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))
local View = require(script.Parent:WaitForChild("View"))

local Inventory = {}

local player = Players.LocalPlayer
local C = UI.Colors
local deps
local window, cards, clueLabel
local clues = {}

function Inventory.isOpen()
	return window ~= nil and window.Visible
end

function Inventory.init(gui, d)
	deps = d
	window = UI.panel(gui, {
		Name = "Inventory",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(560, 470),
		Visible = false,
		ZIndex = 58,
	})
	UI.modal(window)
	UI.label(window, { Position = UDim2.fromOffset(16, 10), Size = UDim2.new(1, -70, 0, 28), Font = UI.Fonts.Title, TextSize = 22, Text = "🎒 GADGETS", ZIndex = 59 })
	local close = UI.button(window, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -12, 0, 10), Size = UDim2.fromOffset(40, 32), Text = "✕", TextSize = 18, BackgroundColor3 = C.Danger, ZIndex = 59 })
	close.MouseButton1Click:Connect(function()
		Inventory.close()
	end)
	local grid = UI.new("Frame", { Position = UDim2.fromOffset(12, 48), Size = UDim2.new(1, -24, 0, 300), BackgroundTransparency = 1, ZIndex = 59 }, window)
	UI.new("UIGridLayout", { CellSize = UDim2.fromOffset(266, 70), CellPadding = UDim2.fromOffset(8, 8), SortOrder = Enum.SortOrder.LayoutOrder }, grid)
	cards = {}
	for i, item in Config.Items do
		local card = UI.new("Frame", { LayoutOrder = i, BackgroundColor3 = C.Card, BorderSizePixel = 0, ZIndex = 60 }, grid)
		UI.corner(card, 10)
		UI.label(card, { Position = UDim2.fromOffset(8, 6), Size = UDim2.fromOffset(44, 44), Font = UI.Fonts.Title, TextSize = 30, TextXAlignment = Enum.TextXAlignment.Center, Text = item.Icon, ZIndex = 61 })
		UI.label(card, { Position = UDim2.fromOffset(54, 4), Size = UDim2.new(1, -110, 0, 18), Font = UI.Fonts.Title, TextSize = 13, TextWrapped = false, Text = item.Key .. "  " .. item.Name, ZIndex = 61 })
		UI.label(card, { Position = UDim2.fromOffset(54, 22), Size = UDim2.new(1, -60, 0, 44), Font = UI.Fonts.Body, TextSize = 11, TextColor3 = C.Muted, TextYAlignment = Enum.TextYAlignment.Top, Text = item.Tip, ZIndex = 61 })
		local state = UI.label(card, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -8, 0, 4), Size = UDim2.fromOffset(60, 18), Font = UI.Fonts.Title, TextSize = 13, TextColor3 = C.Gold, TextXAlignment = Enum.TextXAlignment.Right, Text = "", ZIndex = 61 })
		cards[item.Id] = state
	end
	UI.label(window, { Position = UDim2.fromOffset(16, 354), Size = UDim2.new(1, -32, 0, 20), Font = UI.Fonts.Title, TextSize = 15, TextColor3 = C.Accent, Text = "🔐 CLUES FROM TERMINALS (all true)", ZIndex = 59 })
	clueLabel = UI.label(window, { Position = UDim2.fromOffset(16, 376), Size = UDim2.new(1, -32, 0, 84), Font = UI.Fonts.Bold, TextSize = 14, TextYAlignment = Enum.TextYAlignment.Top, Text = "", ZIndex = 59 })
	task.spawn(function()
		while true do
			task.wait(0.4)
			if window.Visible then
				Inventory.refresh()
			end
		end
	end)
end

function Inventory.addClue(text)
	table.insert(clues, text)
	if window and window.Visible then
		Inventory.refresh()
	end
end

function Inventory.resetClues()
	clues = {}
end

function Inventory.refresh()
	for id, label in cards do
		local item = Config.ItemById[id]
		local cd = deps.Hud.cooldownLeft(id)
		local text
		if item.Permanent then
			text = cd > 0 and string.format("%.1fs", cd) or "READY"
		else
			local have = player:GetAttribute("It_" .. id) or 0
			text = "x" .. have .. (cd > 0 and ("  " .. string.format("%.0fs", cd)) or "")
		end
		label.Text = text
	end
	if #clues == 0 then
		clueLabel.Text = "Hack an information terminal in the plaza to learn something about YOUR number. It shows where you are for a moment!"
	else
		clueLabel.Text = "• " .. table.concat(clues, "\n• ")
	end
end

function Inventory.open()
	window.Visible = true
	Inventory.refresh()
	Audio.click()
end

function Inventory.close()
	if window then
		window.Visible = false
	end
end

function Inventory.toggle()
	if Inventory.isOpen() then
		Inventory.close()
	else
		Inventory.open()
	end
end

return Inventory

-- FIGURE ME OUT: the quick emote panel (💬 button). Tap an emoji and it pops up over your head for a few seconds. Great for
-- bluffing, begging for an alliance, or just being silly. More emotes are unlocked with coins in the menu.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))

local Emotes = {}

local player = Players.LocalPlayer
local deps
local panel, grid
local lastAt = -100

function Emotes.isOpen()
	return panel ~= nil and panel.Visible
end

-- Emotes you own, from the "Owned" list the server publishes ("emote:wave,trail:aqua,...").
function Emotes.owned()
	local set = {}
	for entry in string.gmatch(player:GetAttribute("Owned") or "", "[^,]+") do
		local id = string.match(entry, "^emote:(.+)$")
		if id then
			set[id] = true
		end
	end
	local list = {}
	for _, e in Config.Emotes do
		if set[e.Id] or (e.Cost == 0 and e.Level == 0) then
			table.insert(list, e)
		end
	end
	return list
end

function Emotes.init(gui, d)
	deps = d
	panel = UI.panel(gui, {
		Name = "Emotes",
		AnchorPoint = Vector2.new(0, 0),
		Position = UDim2.new(0, 12, 0.45, 116),
		Size = UDim2.fromOffset(250, 130),
		Visible = false,
		ZIndex = 38,
	})
	UI.label(panel, { Position = UDim2.fromOffset(12, 6), Size = UDim2.new(1, -24, 0, 18), Font = UI.Fonts.Title, TextSize = 14, TextColor3 = UI.Colors.Accent, Text = "💬 QUICK EMOTES", ZIndex = 39 })
	grid = UI.new("Frame", { Position = UDim2.fromOffset(10, 30), Size = UDim2.new(1, -20, 1, -38), BackgroundTransparency = 1, ZIndex = 39 }, panel)
	UI.new("UIGridLayout", { CellSize = UDim2.fromOffset(52, 44), CellPadding = UDim2.fromOffset(6, 6), SortOrder = Enum.SortOrder.LayoutOrder }, grid)
end

function Emotes.refresh()
	for _, c in grid:GetChildren() do
		if c:IsA("TextButton") then
			c:Destroy()
		end
	end
	for i, e in Emotes.owned() do
		local b = UI.button(grid, { LayoutOrder = i, Size = UDim2.fromOffset(52, 44), Text = e.Icon, TextSize = 26, BackgroundColor3 = UI.Colors.Card, ZIndex = 40 }, "card")
		b.MouseButton1Click:Connect(function()
			Emotes.play(e.Id)
		end)
	end
end

function Emotes.play(id)
	local now = os.clock()
	if now - lastAt < Config.EmoteCooldown then
		return false
	end
	lastAt = now
	deps.send("Emote", id)
	Audio.click()
	panel.Visible = false
	return true
end

function Emotes.toggle()
	if panel.Visible then
		panel.Visible = false
	else
		Emotes.refresh()
		panel.Visible = true
	end
end

function Emotes.close()
	if panel then
		panel.Visible = false
	end
end

return Emotes

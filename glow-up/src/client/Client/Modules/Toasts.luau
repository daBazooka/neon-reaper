-- GLOW UP: small, calm notifications. Max three at once, identical messages merge into "x2",
-- and they sit above the dock so they never cover the action.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local UI = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("UI"))

local Toasts = {}

local holder
local active = {} -- list of { frame, text, count, label, token }

local KIND_COLOR = {
	info = UI.Colors.Cyan,
	good = UI.Colors.Good,
	gold = UI.Colors.Gold,
	bad = UI.Colors.Danger,
}

function Toasts.init(gui)
	holder = UI.new("Frame", {
		Name = "Toasts",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -104),
		Size = UDim2.fromOffset(420, 160),
		BackgroundTransparency = 1,
	}, gui)
	UI.new("UIListLayout", {
		SortOrder = Enum.SortOrder.LayoutOrder,
		VerticalAlignment = Enum.VerticalAlignment.Bottom,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		Padding = UDim.new(0, 6),
	}, holder)
end

local order = 0

local function remove(entry)
	local i = table.find(active, entry)
	if i then
		table.remove(active, i)
	end
	UI.tween(entry.frame, 0.25, { BackgroundTransparency = 1 })
	UI.tween(entry.label, 0.25, { TextTransparency = 1 })
	task.delay(0.3, function()
		entry.frame:Destroy()
	end)
end

function Toasts.push(text, kind)
	if not holder then
		return
	end
	local color = KIND_COLOR[kind or "info"] or UI.Colors.Cyan

	for _, entry in active do
		if entry.text == text then
			entry.count += 1
			entry.label.Text = text .. "  x" .. entry.count
			entry.token += 1
			local token = entry.token
			task.delay(2.8, function()
				if entry.token == token and table.find(active, entry) then
					remove(entry)
				end
			end)
			return
		end
	end

	if #active >= 3 then
		remove(active[1])
	end

	order += 1
	local frame = UI.new("Frame", {
		LayoutOrder = order,
		Size = UDim2.fromOffset(10, 34),
		AutomaticSize = Enum.AutomaticSize.X,
		BackgroundColor3 = UI.Colors.Panel,
		BackgroundTransparency = 0.12,
		BorderSizePixel = 0,
	}, holder)
	UI.corner(frame, 17)
	UI.stroke(frame, color, 1.5, 0.35)
	UI.new("UIPadding", { PaddingLeft = UDim.new(0, 16), PaddingRight = UDim.new(0, 16) }, frame)
	local label = UI.label(frame, {
		Size = UDim2.fromOffset(10, 34),
		AutomaticSize = Enum.AutomaticSize.X,
		Font = UI.Fonts.Bold,
		TextSize = 15,
		TextWrapped = false,
		TextColor3 = UI.Colors.Text,
		Text = text,
	})
	local entry = { frame = frame, text = text, count = 1, label = label, token = 0 }
	table.insert(active, entry)
	task.delay(2.8, function()
		if entry.token == 0 and table.find(active, entry) then
			remove(entry)
		end
	end)
end

return Toasts

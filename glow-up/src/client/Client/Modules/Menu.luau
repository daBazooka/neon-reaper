-- SUB 5 TO TRUE ADAM: the one main menu. A single window with a tab list so the screen never fills up with
-- competing panels. Tabs register themselves with Menu.addTab(name, icon, builder).
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))

local Menu = {}

local camera = workspace:WaitForChild("Camera")
local backdrop, window, content, scale
local tabs = {} -- ordered { name, icon, builder, button, page, refresh }
local current
local open = false
local onChanged = {}

local WINDOW_W, WINDOW_H = 760, 460

function Menu.isOpen()
	return open
end

function Menu.current()
	return current
end

function Menu.onChanged(fn)
	table.insert(onChanged, fn)
end

local function fitScale()
	local v = camera.ViewportSize
	local s = math.min(v.X / (WINDOW_W + 40), v.Y / (WINDOW_H + 40), 1)
	return math.max(0.5, s)
end

local function select(name)
	for _, tab in tabs do
		local active = tab.name == name
		tab.page.Visible = active
		UI.tween(tab.button, 0.15, {
			BackgroundColor3 = active and UI.Colors.Accent or UI.Colors.Card,
			BackgroundTransparency = active and 0.1 or 0.35,
		})
		if active then
			current = name
			if tab.refresh then
				tab.refresh()
			end
		end
	end
	for _, fn in onChanged do
		fn(name)
	end
end

function Menu.init(gui)
	backdrop = UI.new("TextButton", {
		Name = "MenuBackdrop",
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = Color3.fromRGB(6, 4, 16),
		BackgroundTransparency = 1,
		AutoButtonColor = false,
		Text = "",
		Visible = false,
		ZIndex = 20,
	}, gui)
	backdrop.Activated:Connect(function()
		Menu.close()
	end)

	window = UI.panel(backdrop, {
		Name = "Window",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(WINDOW_W, WINDOW_H),
		BackgroundTransparency = 0.04,
		ZIndex = 21,
		Radius = 20,
	})
	scale = UI.new("UIScale", { Scale = fitScale() }, window)
	camera:GetPropertyChangedSignal("ViewportSize"):Connect(function()
		scale.Scale = fitScale()
	end)
	-- Clicks inside the window must not fall through to the backdrop.
	UI.new("TextButton", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Text = "", ZIndex = 21, AutoButtonColor = false }, window)

	local header = UI.label(window, {
		Position = UDim2.fromOffset(24, 14),
		Size = UDim2.fromOffset(420, 30),
		Font = UI.Fonts.Title,
		TextSize = 24,
		TextColor3 = UI.Colors.Text,
		Text = Config.GameName:upper(),
		ZIndex = 22,
	})
	UI.gradient(header, UI.Colors.Cyan, UI.Colors.Accent2, 0)

	local closeButton = UI.button(window, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -16, 0, 14),
		Size = UDim2.fromOffset(34, 34),
		Text = "✕",
		TextSize = 16,
		ZIndex = 23,
		Radius = 17,
	}, "card")
	closeButton.Activated:Connect(function()
		Audio.click()
		Menu.close()
	end)

	local sidebar = UI.new("Frame", {
		Position = UDim2.fromOffset(16, 62),
		Size = UDim2.fromOffset(170, WINDOW_H - 78),
		BackgroundTransparency = 1,
		ZIndex = 22,
	}, window)
	UI.new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }, sidebar)
	Menu.sidebar = sidebar

	content = UI.new("Frame", {
		Position = UDim2.fromOffset(200, 62),
		Size = UDim2.fromOffset(WINDOW_W - 216, WINDOW_H - 78),
		BackgroundTransparency = 1,
		ZIndex = 22,
		ClipsDescendants = true,
	}, window)
end

function Menu.addTab(name, icon, builder)
	local index = #tabs + 1
	local button = UI.button(Menu.sidebar, {
		LayoutOrder = index,
		Size = UDim2.new(1, 0, 0, 38),
		BackgroundTransparency = 0.35,
		Text = "",
		ZIndex = 23,
	}, "card")
	UI.label(button, {
		Position = UDim2.fromOffset(14, 0),
		Size = UDim2.new(1, -20, 1, 0),
		Font = UI.Fonts.Bold,
		TextSize = 15,
		Text = icon .. "   " .. name,
		TextWrapped = false,
		ZIndex = 24,
	})
	local badge = UI.new("Frame", {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -10, 0.5, 0),
		Size = UDim2.fromOffset(10, 10),
		BackgroundColor3 = UI.Colors.Accent2,
		Visible = false,
		ZIndex = 25,
	}, button)
	UI.corner(badge, 5)

	local page = UI.new("Frame", {
		Name = name,
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		Visible = false,
		ZIndex = 22,
	}, content)
	local api = builder(page) or {}
	local tab = { name = name, icon = icon, button = button, page = page, refresh = api.refresh, badge = badge }
	table.insert(tabs, tab)
	button.Activated:Connect(function()
		Audio.click()
		select(name)
	end)
	return tab
end

function Menu.setBadge(name, visible)
	for _, tab in tabs do
		if tab.name == name then
			tab.badge.Visible = visible
		end
	end
end

function Menu.open(name)
	if not backdrop then
		return
	end
	if not open then
		open = true
		backdrop.Visible = true
		backdrop.BackgroundTransparency = 1
		UI.tween(backdrop, 0.2, { BackgroundTransparency = 0.45 })
		local target = fitScale()
		scale.Scale = target * 0.9
		UI.tween(scale, 0.25, { Scale = target }, Enum.EasingStyle.Back)
	end
	select(name or current or (tabs[1] and tabs[1].name))
end

function Menu.close()
	if not open then
		return
	end
	open = false
	UI.tween(backdrop, 0.15, { BackgroundTransparency = 1 })
	UI.tween(scale, 0.15, { Scale = fitScale() * 0.92 })
	task.delay(0.16, function()
		if not open then
			backdrop.Visible = false
		end
	end)
	for _, fn in onChanged do
		fn(nil)
	end
end

function Menu.toggle(name)
	if open and (name == nil or current == name) then
		Menu.close()
	else
		Menu.open(name)
	end
end

-- Refresh the visible tab (called a few times a second while open).
function Menu.refresh()
	if not open then
		return
	end
	for _, tab in tabs do
		if tab.name == current and tab.refresh then
			tab.refresh()
		end
	end
end

return Menu

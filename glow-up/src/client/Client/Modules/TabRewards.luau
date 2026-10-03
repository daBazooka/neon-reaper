-- SUB 5 TO TRUE ADAM: the Rewards window with three tabs, FREE (free crates + live event), Timed (play-time gifts
-- that arrive on their own) and Daily (7-day login streak with a big rainbow Day 7 card).
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))
local TabStore = require(script.Parent.TabStore)

local player = Players.LocalPlayer
local C = UI.Colors

local TabRewards = {}

local RAINBOW = ColorSequence.new({
	ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 90, 90)),
	ColorSequenceKeypoint.new(0.25, Color3.fromRGB(255, 200, 60)),
	ColorSequenceKeypoint.new(0.5, Color3.fromRGB(90, 230, 120)),
	ColorSequenceKeypoint.new(0.75, Color3.fromRGB(80, 170, 255)),
	ColorSequenceKeypoint.new(1, Color3.fromRGB(200, 100, 255)),
})

local function box(parent, props, color, radius)
	props.BackgroundColor3 = color
	props.BorderSizePixel = 0
	props.ZIndex = props.ZIndex or 24
	local f = UI.new("Frame", props, parent)
	UI.corner(f, radius or 12)
	UI.stroke(f, Color3.fromRGB(10, 14, 30), 3, 0)
	return f
end

local function text(parent, props)
	props.ZIndex = props.ZIndex or 26
	props.TextXAlignment = props.TextXAlignment or Enum.TextXAlignment.Center
	if props.TextWrapped == nil then
		props.TextWrapped = false
	end
	return UI.label(parent, props)
end

function TabRewards.build(parent, Action, Menu)
	local body = UI.new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(34, 48, 96), BorderSizePixel = 0, ZIndex = 22 }, parent)
	UI.corner(body, 20)
	TabStore.header(parent, "🎁  REWARDS", Color3.fromRGB(255, 150, 60), function()
		Menu.close()
	end)

	-- Tab buttons
	local pages, buttons = {}, {}
	local function show(name)
		for key, page in pages do
			page.Visible = key == name
		end
		for key, b in buttons do
			b.BackgroundColor3 = key == name and C.Good or C.Disabled
		end
	end
	local tabRow = UI.new("Frame", { Position = UDim2.fromOffset(20, 66), Size = UDim2.fromOffset(330, 34), BackgroundTransparency = 1, ZIndex = 24 }, parent)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, tabRow)
	for i, name in { "FREE", "Timed", "Daily" } do
		local b = UI.button(tabRow, { LayoutOrder = i, Size = UDim2.fromOffset(100, 34), Text = name:upper(), TextSize = 15, Radius = 9, ZIndex = 25 }, "primary")
		b.Activated:Connect(function()
			Audio.click()
			show(name)
		end)
		buttons[name] = b
		pages[name] = UI.new("Frame", { Position = UDim2.fromOffset(20, 108), Size = UDim2.new(1, -40, 1, -122), BackgroundTransparency = 1, Visible = false, ZIndex = 23 }, parent)
	end
	local refreshers = {}

	----------------------------------------------------------------------------
	-- DAILY
	----------------------------------------------------------------------------
	local daily = pages.Daily
	local cells = {}
	local grid = UI.new("Frame", { Size = UDim2.new(1, -170, 1, -60), BackgroundTransparency = 1, ZIndex = 23 }, daily)
	UI.new("UIGridLayout", { CellSize = UDim2.fromOffset(150, 118), CellPadding = UDim2.fromOffset(10, 10), SortOrder = Enum.SortOrder.LayoutOrder }, grid)
	for day = 1, 7 do
		local reward = Config.Daily[day]
		local isLast = day == 7
		local cell = box(isLast and daily or grid, isLast and {
			AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, 0, 0, 0),
			Size = UDim2.new(0, 150, 1, -60),
		} or { LayoutOrder = day }, isLast and Color3.new(1, 1, 1) or Color3.fromRGB(88, 160, 255))
		if isLast then
			UI.new("UIGradient", { Color = RAINBOW, Rotation = 60 }, cell)
		else
			UI.gradient(cell, Color3.new(1, 1, 1), Color3.fromRGB(165, 170, 200), 90)
		end
		text(cell, { Position = UDim2.fromOffset(0, 6), Size = UDim2.new(1, 0, 0, 20), Font = UI.Fonts.Title, TextSize = 15, Text = "DAY " .. day, TextStrokeTransparency = 0 })
		text(cell, {
			Position = UDim2.fromOffset(0, isLast and 40 or 28),
			Size = UDim2.new(1, 0, 0, isLast and 90 or 40),
			Font = UI.Fonts.Title,
			TextSize = isLast and 78 or 38,
			TextStrokeTransparency = 1,
			Text = isLast and "😎" or (reward.Crates and "🎁" or "✦"),
		})
		local label = "✦ " .. Util.fmt(reward.Aura)
		if reward.Crates then
			label ..= "  +" .. reward.Crates .. " 🎁"
		end
		text(cell, { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, isLast and -34 or -8), Size = UDim2.new(1, -8, 0, 22), Font = UI.Fonts.Title, TextSize = 14, TextStrokeTransparency = 0, Text = label })
		if isLast then
			text(cell, { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -10), Size = UDim2.new(1, -8, 0, 20), Font = UI.Fonts.Title, TextSize = 12, TextStrokeTransparency = 0, Text = "BONUS DAY" })
		end
		local tick = text(cell, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Title, TextSize = 54, TextColor3 = Color3.fromRGB(80, 255, 120), BackgroundTransparency = 0.45, BackgroundColor3 = Color3.fromRGB(10, 20, 40), Text = "✓", Visible = false, ZIndex = 30 })
		UI.corner(tick, 12)
		cells[day] = { cell = cell, tick = tick }
	end
	local claim = UI.button(daily, {
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 0, 1, 0),
		Size = UDim2.new(1, 0, 0, 46),
		Text = "CLAIM NOW",
		TextSize = 20,
		ZIndex = 26,
	}, "primary")
	claim.Activated:Connect(function()
		Audio.click()
		Action:FireServer("Claim")
	end)
	table.insert(refreshers, function()
		local ready = player:GetAttribute("DailyReady") == true
		local day = player:GetAttribute("DailyDay") or 1
		for d, entry in cells do
			local isNext = d == day
			entry.tick.Visible = d < day or (d == day and not ready)
			entry.cell:FindFirstChildOfClass("UIStroke").Color = (isNext and ready) and C.Gold or Color3.fromRGB(10, 14, 30)
		end
		claim.Text = ready and ("CLAIM DAY " .. day .. " NOW") or "COME BACK TOMORROW"
		claim.BackgroundColor3 = ready and C.Good or C.Disabled
	end)

	----------------------------------------------------------------------------
	-- TIMED (play-time gifts arrive on their own)
	----------------------------------------------------------------------------
	local timed = pages.Timed
	text(timed, { Size = UDim2.new(1, 0, 0, 22), Font = UI.Fonts.Bold, TextSize = 14, TextColor3 = C.Muted, Text = "Just stay and play. A gift arrives by itself each time a timer ends." })
	local row = UI.new("Frame", { Position = UDim2.fromOffset(0, 32), Size = UDim2.new(1, 0, 1, -32), BackgroundTransparency = 1, ZIndex = 23 }, timed)
	UI.new("UIGridLayout", { CellSize = UDim2.fromOffset(98, 150), CellPadding = UDim2.fromOffset(8, 8), SortOrder = Enum.SortOrder.LayoutOrder }, row)
	local gifts = {}
	for i, gift in Config.Gifts do
		local cell = box(row, { LayoutOrder = i }, Color3.fromRGB(88, 160, 255), 12)
		UI.gradient(cell, Color3.new(1, 1, 1), Color3.fromRGB(165, 170, 200), 90)
		text(cell, { Position = UDim2.fromOffset(0, 6), Size = UDim2.new(1, 0, 0, 20), Font = UI.Fonts.Title, TextSize = 13, TextStrokeTransparency = 0, Text = Util.clock(gift.Time) })
		text(cell, { Position = UDim2.fromOffset(0, 30), Size = UDim2.new(1, 0, 0, 44), Font = UI.Fonts.Title, TextSize = 36, TextStrokeTransparency = 1, Text = gift.Crates > 0 and "🎁" or "✦" })
		local amount = text(cell, { Position = UDim2.fromOffset(0, 80), Size = UDim2.new(1, 0, 0, 20), Font = UI.Fonts.Title, TextSize = 13, TextStrokeTransparency = 0, Text = "" })
		local state = text(cell, { Position = UDim2.fromOffset(0, 118), Size = UDim2.new(1, 0, 0, 22), Font = UI.Fonts.Title, TextSize = 12, TextStrokeTransparency = 0, Text = "" })
		gifts[i] = { cell = cell, amount = amount, state = state }
	end
	table.insert(refreshers, function()
		local claimed = player:GetAttribute("GiftsClaimed") or 0
		local at = player:GetAttribute("GiftAt") or 0
		local level = player:GetAttribute("Level") or 1
		for i, g in gifts do
			local gift = Config.Gifts[i]
			g.amount.Text = "+" .. Util.fmt(Config.GiftAura(level, gift.Size)) .. (gift.Crates > 0 and (" +" .. gift.Crates .. "🎁") or "")
			if i <= claimed then
				g.state.Text, g.state.TextColor3 = "✓ CLAIMED", Color3.fromRGB(110, 255, 140)
				g.cell.BackgroundColor3 = Color3.fromRGB(70, 150, 90)
			elseif i == claimed + 1 and at > 0 then
				g.state.Text, g.state.TextColor3 = Util.clock(math.max(0, at - workspace:GetServerTimeNow())), C.Yellow
				g.cell.BackgroundColor3 = Color3.fromRGB(88, 160, 255)
			else
				g.state.Text, g.state.TextColor3 = "LOCKED", C.Muted
				g.cell.BackgroundColor3 = Color3.fromRGB(88, 160, 255)
			end
		end
	end)

	----------------------------------------------------------------------------
	-- FREE (free crates + the live event)
	----------------------------------------------------------------------------
	local free = pages.FREE
	local crateCard = box(free, { Size = UDim2.new(1, 0, 0, 84) }, Color3.fromRGB(255, 112, 176), 12)
	UI.gradient(crateCard, Color3.new(1, 1, 1), Color3.fromRGB(190, 160, 200), 90)
	text(crateCard, { Position = UDim2.fromOffset(16, 0), Size = UDim2.fromOffset(70, 84), Font = UI.Fonts.Title, TextSize = 50, TextStrokeTransparency = 1, Text = "📦" })
	local crateText = text(crateCard, { Position = UDim2.fromOffset(92, 12), Size = UDim2.new(1, -250, 0, 60), Font = UI.Fonts.Title, TextSize = 18, TextXAlignment = Enum.TextXAlignment.Left, TextWrapped = true, TextStrokeTransparency = 0, Text = "" })
	local open = UI.button(crateCard, { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -14, 0.5, 0), Size = UDim2.fromOffset(130, 44), Text = "OPEN", TextSize = 18, ZIndex = 27 }, "primary")
	open.Activated:Connect(function()
		Audio.click()
		Menu.open("Crates")
	end)
	local eventCard = box(free, { Position = UDim2.fromOffset(0, 96), Size = UDim2.new(1, 0, 0, 84) }, Color3.fromRGB(255, 190, 60), 12)
	UI.gradient(eventCard, Color3.new(1, 1, 1), Color3.fromRGB(200, 190, 160), 90)
	local eventText = text(eventCard, { Position = UDim2.fromOffset(16, 8), Size = UDim2.new(1, -32, 1, -16), Font = UI.Fonts.Title, TextSize = 16, TextXAlignment = Enum.TextXAlignment.Left, TextWrapped = true, TextStrokeTransparency = 0, Text = "" })
	table.insert(refreshers, function()
		local n = player:GetAttribute("FreeCrates") or 0
		crateText.Text = n > 0 and ("You have " .. n .. " free crate" .. (n == 1 and "" or "s") .. "!") or "No free crates right now. Gifts and daily rewards bring more."
		open.BackgroundColor3 = n > 0 and C.Good or C.Disabled
		local id = workspace:GetAttribute("Event")
		local ev = id and id ~= "" and Config.EventById[id]
		local left = (workspace:GetAttribute("EventEnd") or 0) - workspace:GetServerTimeNow()
		if ev and left > 0 then
			eventText.Text = string.format("%s %s is live (%s left)\n%s", ev.Icon, ev.Name, Util.clock(left), ev.Desc)
		else
			eventText.Text = "No event right now. Golden Hour, Duel Frenzy and Runway Night start every few minutes."
		end
	end)

	show("Daily")
	return {
		refresh = function()
			for _, fn in refreshers do
				fn()
			end
		end,
	}
end

return TabRewards

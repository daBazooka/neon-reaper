-- SUB 5 TO TRUE ADAM: the Goals window, the "come back tomorrow" screen. Four tabs:
--   DAILY   three fresh quests every day (finish all three for a bonus crate)
--   PASS    the 28-day Mog Pass: 30 tiers, a free track and a premium track
--   TROPHIES long-term goals with several tiers each
--   CODES   redeem a code
-- It only reads the attributes the server writes and asks the server to claim.
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

local TabGoals = {}

local NAVY = Color3.fromRGB(34, 48, 96)
local OUTLINE = Color3.fromRGB(10, 14, 30)

--------------------------------------------------------------------------------
-- Reading what the server wrote
--------------------------------------------------------------------------------
local function parseDQ(text)
	local list = {}
	for kind, goal, prog, done, reward in string.gmatch(text or "", "(%a+)|(%d+)|(%d+)|(%d)|(%d+)") do
		table.insert(list, { kind = kind, goal = tonumber(goal), prog = tonumber(prog), done = done == "1", reward = tonumber(reward) })
	end
	return list
end

local function parseStats(text)
	local stats = {}
	for key, value in string.gmatch(text or "", "(%a+)=(%d+)") do
		stats[key] = tonumber(value)
	end
	return stats
end

local function parseSet(text)
	local set = {}
	for key in string.gmatch(text or "", "[%w_]+") do
		set[key] = true
	end
	return set
end

local function clockDays(seconds)
	seconds = math.max(0, math.floor(seconds))
	local d = seconds // 86400
	local h = (seconds % 86400) // 3600
	local m = (seconds % 3600) // 60
	if d > 0 then
		return string.format("%dd %dh", d, h)
	end
	return string.format("%dh %02dm", h, m)
end

--------------------------------------------------------------------------------
-- Little builders
--------------------------------------------------------------------------------
local function box(parent, props, color, radius)
	props.BackgroundColor3 = color
	props.BorderSizePixel = 0
	props.ZIndex = props.ZIndex or 24
	local f = UI.new("Frame", props, parent)
	UI.corner(f, radius or 12)
	UI.stroke(f, OUTLINE, 2.5, 0)
	return f
end

local function text(parent, props)
	props.ZIndex = props.ZIndex or 26
	if props.TextWrapped == nil then
		props.TextWrapped = false
	end
	props.TextXAlignment = props.TextXAlignment or Enum.TextXAlignment.Left
	return UI.label(parent, props)
end

local function rewardText(track, tier)
	local r = Config.PassReward(track, tier)
	local level = player:GetAttribute("Level") or 1
	local s = "✦" .. Util.fmt(Config.GiftAura(level, r.Size))
	if r.Crates > 0 then
		s ..= "\n🎁 x" .. r.Crates
	end
	return s, r
end

--------------------------------------------------------------------------------
-- The window
--------------------------------------------------------------------------------
function TabGoals.build(parent, Action, Menu)
	local body = UI.new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = NAVY, BorderSizePixel = 0, ZIndex = 22 }, parent)
	UI.corner(body, 20)
	TabStore.header(parent, "🎯  GOALS", Color3.fromRGB(162, 112, 255), function()
		Menu.close()
	end)

	local pages, buttons = {}, {}
	local function show(name)
		for key, page in pages do
			page.Visible = key == name
		end
		for key, b in buttons do
			b.BackgroundColor3 = key == name and C.Good or C.Disabled
		end
	end
	local order = { { "DAILY", "📜 DAILY" }, { "PASS", "🎫 MOG PASS" }, { "TROPHIES", "🏆 TROPHIES" }, { "CODES", "🎁 CODES" } }
	local tabRow = UI.new("Frame", { Position = UDim2.fromOffset(20, 64), Size = UDim2.fromOffset(470, 34), BackgroundTransparency = 1, ZIndex = 24 }, parent)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }, tabRow)
	for i, entry in order do
		local b = UI.button(tabRow, { LayoutOrder = i, Size = UDim2.fromOffset(110, 34), Text = entry[2], TextSize = 13, Radius = 9, ZIndex = 25 }, "primary")
		b.Activated:Connect(function()
			Audio.click()
			show(entry[1])
		end)
		buttons[entry[1]] = b
		pages[entry[1]] = UI.new("Frame", { Position = UDim2.fromOffset(20, 106), Size = UDim2.new(1, -40, 1, -120), BackgroundTransparency = 1, Visible = false, ZIndex = 23 }, parent)
	end
	-- ranked + friends summary, top right
	local summary = text(parent, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -20, 0, 66), Size = UDim2.fromOffset(250, 32), Font = UI.Fonts.Bold, TextSize = 12, TextXAlignment = Enum.TextXAlignment.Right, TextWrapped = true, TextColor3 = C.Muted, Text = "" })
	local refreshers = {}

	----------------------------------------------------------------------------
	-- DAILY QUESTS
	----------------------------------------------------------------------------
	local daily = pages.DAILY
	local cards = {}
	for i = 1, Config.DailyQuestCount do
		local card = box(daily, { Position = UDim2.fromOffset(0, (i - 1) * 84), Size = UDim2.new(1, 0, 0, 76) }, Color3.fromRGB(88, 160, 255), 14)
		UI.gradient(card, Color3.new(1, 1, 1), Color3.fromRGB(170, 176, 205), 90)
		local icon = text(card, { Position = UDim2.fromOffset(12, 0), Size = UDim2.fromOffset(52, 76), Font = UI.Fonts.Title, TextSize = 36, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 1, Text = "" })
		local label = text(card, { Position = UDim2.fromOffset(70, 8), Size = UDim2.new(1, -230, 0, 22), Font = UI.Fonts.Title, TextSize = 15, TextStrokeTransparency = 0.2, Text = "" })
		local bar = UI.bar(card, { Position = UDim2.fromOffset(70, 40), Size = UDim2.new(1, -230, 0, 14) }, C.Good)
		bar.back.ZIndex = 25
		bar.fill.ZIndex = 26
		local count = text(card, { Position = UDim2.fromOffset(70, 55), Size = UDim2.new(1, -230, 0, 16), Font = UI.Fonts.Bold, TextSize = 11, TextStrokeTransparency = 0.4, Text = "" })
		local reward = text(card, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -14, 0, 10), Size = UDim2.fromOffset(140, 56), Font = UI.Fonts.Title, TextSize = 14, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = true, TextStrokeTransparency = 0.2, Text = "" })
		local tick = text(card, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Title, TextSize = 46, TextColor3 = Color3.fromRGB(80, 255, 120), BackgroundTransparency = 0.5, BackgroundColor3 = Color3.fromRGB(10, 20, 40), TextXAlignment = Enum.TextXAlignment.Center, Text = "✓  DONE", Visible = false, ZIndex = 30 })
		UI.corner(tick, 14)
		cards[i] = { card = card, icon = icon, label = label, bar = bar, count = count, reward = reward, tick = tick }
	end
	local bonus = box(daily, { Position = UDim2.fromOffset(0, 258), Size = UDim2.new(1, 0, 0, 52) }, Color3.fromRGB(255, 190, 60), 14)
	UI.gradient(bonus, Color3.new(1, 1, 1), Color3.fromRGB(200, 190, 160), 90)
	local bonusText = text(bonus, { Position = UDim2.fromOffset(14, 0), Size = UDim2.new(1, -28, 1, 0), Font = UI.Fonts.Title, TextSize = 15, TextStrokeTransparency = 0.2, TextWrapped = true, Text = "" })
	local resetText = text(daily, { Position = UDim2.fromOffset(0, 318), Size = UDim2.new(1, 0, 0, 20), Font = UI.Fonts.Bold, TextSize = 12, TextColor3 = C.Muted, TextXAlignment = Enum.TextXAlignment.Center, Text = "" })
	table.insert(refreshers, function()
		local quests = parseDQ(player:GetAttribute("DQ"))
		for i, c in cards do
			local q = quests[i]
			c.card.Visible = q ~= nil
			if q then
				local def = Config.DailyQuestByKind[q.kind]
				c.icon.Text = def and def.Icon or "🎯"
				c.label.Text = def and string.format(def.Text, q.goal) or q.kind
				c.bar.set(q.prog / math.max(1, q.goal))
				c.count.Text = string.format("%s / %s", Util.fmt(q.prog), Util.fmt(q.goal))
				c.reward.Text = string.format("✦%s\n+%d pass XP", Util.fmt(q.reward), Config.DailyQuestPassXP)
				c.tick.Visible = q.done
			end
		end
		local all = player:GetAttribute("DQAll") == true
		bonusText.Text = all and "🌟 All three done! You got a bonus crate and extra pass XP." or string.format("🌟 Finish all %d: 🎁 a free crate + %d pass XP", Config.DailyQuestCount, Config.DailyQuestAllXP)
		resetText.Text = "New quests in " .. clockDays(86400 - os.time() % 86400)
	end)

	----------------------------------------------------------------------------
	-- MOG PASS
	----------------------------------------------------------------------------
	local pass = pages.PASS
	local seasonText = text(pass, { Size = UDim2.new(1, -180, 0, 20), Font = UI.Fonts.Title, TextSize = 15, Text = "" })
	local passBar = UI.bar(pass, { Position = UDim2.fromOffset(0, 26), Size = UDim2.new(1, -180, 0, 16) }, C.Accent2)
	passBar.back.ZIndex = 25
	passBar.fill.ZIndex = 26
	local claimAll = UI.button(pass, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, 0, 0, 0), Size = UDim2.fromOffset(168, 42), Text = "CLAIM ALL", TextSize = 16, Radius = 10, ZIndex = 26 }, "primary")
	claimAll.Activated:Connect(function()
		Audio.click()
		Action:FireServer("PassAll")
	end)
	local scroll = UI.new("ScrollingFrame", {
		Position = UDim2.fromOffset(0, 52),
		Size = UDim2.new(1, 0, 1, -76),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 6,
		CanvasSize = UDim2.fromOffset(Config.Pass.Tiers * 96 + 70, 0),
		ScrollingDirection = Enum.ScrollingDirection.X,
		ZIndex = 23,
	}, pass)
	-- row labels on the left
	text(scroll, { Position = UDim2.fromOffset(0, 40), Size = UDim2.fromOffset(60, 84), Font = UI.Fonts.Title, TextSize = 12, TextColor3 = Color3.fromRGB(200, 150, 255), TextWrapped = true, Text = "PREMIUM\n🎫" })
	text(scroll, { Position = UDim2.fromOffset(0, 134), Size = UDim2.fromOffset(60, 84), Font = UI.Fonts.Title, TextSize = 12, TextColor3 = C.Good, TextWrapped = true, Text = "FREE" })
	local cells = {}
	for t = 1, Config.Pass.Tiers do
		local x = 66 + (t - 1) * 96
		local head = text(scroll, { Position = UDim2.fromOffset(x, 4), Size = UDim2.fromOffset(88, 30), Font = UI.Fonts.Title, TextSize = 18, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 0.2, Text = tostring(t) })
		for k, track in { "prem", "free" } do
			local color = track == "prem" and Color3.fromRGB(162, 112, 255) or Color3.fromRGB(80, 170, 255)
			local cell = UI.new("TextButton", {
				Position = UDim2.fromOffset(x, k == 1 and 40 or 134),
				Size = UDim2.fromOffset(88, 86),
				BackgroundColor3 = color,
				BorderSizePixel = 0,
				AutoButtonColor = false,
				Text = "",
				ZIndex = 24,
			}, scroll)
			UI.corner(cell, 12)
			local stroke = UI.stroke(cell, OUTLINE, 2.5, 0)
			local label = text(cell, { Size = UDim2.fromScale(1, 1), Font = UI.Fonts.Title, TextSize = 13, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = true, TextStrokeTransparency = 0.2, Text = "" })
			local tag = text(cell, { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -2), Size = UDim2.new(1, 0, 0, 14), Font = UI.Fonts.Title, TextSize = 10, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 0.3, Text = "" })
			cell.Activated:Connect(function()
				Audio.click()
				Action:FireServer("PassClaim", track .. ":" .. t)
			end)
			cells[track .. t] = { cell = cell, stroke = stroke, label = label, tag = tag, color = color }
		end
		cells["head" .. t] = { head = head }
	end
	local passNote = text(pass, { AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 0, 1, 0), Size = UDim2.new(1, 0, 0, 20), Font = UI.Fonts.Bold, TextSize = 11, TextColor3 = C.Muted, Text = "" })
	table.insert(refreshers, function()
		local xp = player:GetAttribute("PassXP") or 0
		local reached, into, need = Config.PassTierFor(xp)
		local ownsPass = player:GetAttribute("Pass_mogpass") == true
		local freeSet, premSet = parseSet(player:GetAttribute("PassFree")), parseSet(player:GetAttribute("PassPrem"))
		seasonText.Text = string.format("Season ends in %s   ·   Tier %d / %d%s", clockDays(Config.Pass.SeasonDays * 86400 - os.time() % (Config.Pass.SeasonDays * 86400)), reached, Config.Pass.Tiers, need > 0 and string.format("   ·   %s / %s XP", Util.fmt(into), Util.fmt(need)) or "   ·   COMPLETE!")
		passBar.set(need > 0 and into / need or 1)
		local anyReady = false
		for t = 1, Config.Pass.Tiers do
			for _, track in { "prem", "free" } do
				local c = cells[track .. t]
				local set = track == "prem" and premSet or freeSet
				local label = rewardText(track, t)
				local locked = t > reached
				local claimed = set[tostring(t)] == true
				local noPass = track == "prem" and not ownsPass
				local ready = not locked and not claimed and not noPass
				anyReady = anyReady or ready
				c.label.Text = (track == "prem" and noPass and not claimed) and ("🔒\n" .. label) or label
				c.cell.BackgroundColor3 = claimed and Color3.fromRGB(70, 84, 120) or (locked and Color3.fromRGB(88, 96, 130) or c.color)
				c.cell.BackgroundTransparency = claimed and 0.3 or 0
				c.stroke.Color = ready and Color3.fromRGB(80, 255, 120) or OUTLINE
				c.stroke.Thickness = ready and 4 or 2.5
				c.tag.Text = claimed and "✓ CLAIMED" or (ready and "TAP TO CLAIM" or "")
				c.tag.TextColor3 = claimed and C.Muted or Color3.fromRGB(80, 255, 120)
			end
			cells["head" .. t].head.TextColor3 = t <= reached and C.Gold or C.Muted
		end
		claimAll.BackgroundColor3 = anyReady and C.Good or C.Disabled
		passNote.Text = ownsPass and "🎫 Mog Pass active: both tracks pay out." or "🔒 The premium track needs the Mog Pass (see the Store). The free track is yours."
	end)

	----------------------------------------------------------------------------
	-- TROPHIES
	----------------------------------------------------------------------------
	local trophies = pages.TROPHIES
	local tscroll = UI.new("ScrollingFrame", {
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 6,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		ZIndex = 23,
	}, trophies)
	UI.new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, tscroll)
	local rows = {}
	for i, line in Config.AchLines do
		local row = box(tscroll, { LayoutOrder = i, Size = UDim2.new(1, -12, 0, 66) }, Color3.fromRGB(70, 96, 170), 12)
		UI.gradient(row, Color3.new(1, 1, 1), Color3.fromRGB(180, 186, 212), 90)
		local icon = text(row, { Position = UDim2.fromOffset(8, 0), Size = UDim2.fromOffset(50, 66), Font = UI.Fonts.Title, TextSize = 32, TextXAlignment = Enum.TextXAlignment.Center, TextStrokeTransparency = 1, Text = line.Icon })
		local title = text(row, { Position = UDim2.fromOffset(62, 6), Size = UDim2.new(1, -250, 0, 20), Font = UI.Fonts.Title, TextSize = 14, TextStrokeTransparency = 0.2, Text = "" })
		local bar = UI.bar(row, { Position = UDim2.fromOffset(62, 32), Size = UDim2.new(1, -250, 0, 12) }, C.Good)
		bar.back.ZIndex = 25
		bar.fill.ZIndex = 26
		local count = text(row, { Position = UDim2.fromOffset(62, 46), Size = UDim2.new(1, -250, 0, 16), Font = UI.Fonts.Bold, TextSize = 11, TextStrokeTransparency = 0.4, Text = "" })
		local pips = {}
		for k = 1, #line.Goals do
			local pip = UI.new("Frame", { AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -14 - (#line.Goals - k) * 24, 0.5, 0), Size = UDim2.fromOffset(18, 18), BackgroundColor3 = C.Disabled, BorderSizePixel = 0, ZIndex = 26 }, row)
			UI.corner(pip, 9)
			UI.stroke(pip, OUTLINE, 2, 0)
			pips[k] = pip
		end
		rows[i] = { title = title, bar = bar, count = count, pips = pips, line = line }
	end
	table.insert(refreshers, function()
		local stats = parseStats(player:GetAttribute("AchStats"))
		local done = parseSet(player:GetAttribute("Ach"))
		for _, r in rows do
			local value = stats[r.line.Stat] or 0
			local nextTier
			for k, goal in r.line.Goals do
				local isDone = done[r.line.Stat .. goal] == true
				r.pips[k].BackgroundColor3 = isDone and C.Gold or C.Disabled
				if not isDone and not nextTier then
					nextTier = k
				end
			end
			if nextTier then
				local goal = r.line.Goals[nextTier]
				r.title.Text = r.line.Name .. "  ·  " .. string.format(r.line.Text, Util.fmt(goal))
				r.bar.set(math.min(1, value / goal))
				r.count.Text = string.format("%s / %s", Util.fmt(value), Util.fmt(goal))
			else
				r.title.Text = r.line.Name .. "  ·  ALL DONE 👑"
				r.bar.set(1)
				r.count.Text = Util.fmt(value)
			end
		end
	end)

	----------------------------------------------------------------------------
	-- CODES
	----------------------------------------------------------------------------
	local codes = pages.CODES
	text(codes, { Position = UDim2.fromOffset(0, 10), Size = UDim2.new(1, 0, 0, 30), Font = UI.Fonts.Title, TextSize = 22, TextXAlignment = Enum.TextXAlignment.Center, Text = "🎁  Have a code?" })
	local input = UI.new("TextBox", {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, -80, 0, 60),
		Size = UDim2.fromOffset(300, 48),
		BackgroundColor3 = Color3.fromRGB(14, 11, 32),
		BorderSizePixel = 0,
		Font = UI.Fonts.Title,
		TextSize = 22,
		TextColor3 = Color3.new(1, 1, 1),
		PlaceholderText = "TYPE A CODE",
		PlaceholderColor3 = C.Muted,
		Text = "",
		ClearTextOnFocus = false,
		ZIndex = 25,
	}, codes)
	UI.corner(input, 12)
	UI.stroke(input, OUTLINE, 2.5, 0)
	local redeem = UI.button(codes, { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 130, 0, 60), Size = UDim2.fromOffset(150, 48), BackgroundColor3 = C.Good, Text = "REDEEM", TextSize = 18, Radius = 12, ZIndex = 26 }, "primary")
	local function submit()
		local value = input.Text
		if value ~= "" then
			Audio.click()
			Action:FireServer("Code", value)
			input.Text = ""
		end
	end
	redeem.Activated:Connect(submit)
	input.FocusLost:Connect(function(enter)
		if enter then
			submit()
		end
	end)
	text(codes, { Position = UDim2.fromOffset(0, 130), Size = UDim2.new(1, 0, 0, 60), Font = UI.Fonts.Body, TextSize = 14, TextColor3 = C.Muted, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = true, Text = "New codes appear on the game page and our social links.\nEach code works once per player and can give Aura, crates and Mog Pass XP." })

	table.insert(refreshers, function()
		local rating = player:GetAttribute("Rating") or Config.RatingStart
		local _, tier = Config.RatingTier(rating)
		local friends = player:GetAttribute("FriendCount") or 0
		summary.Text = string.format("%s %s  ·  %s rating\n👥 Friends here: %d  (+%d%% Aura)", tier.Icon, tier.Name, Util.fmt(rating), friends, math.floor(math.min(friends, Config.FriendBonusMax) * Config.FriendBonusEach * 100 + 0.5))
	end)

	show("DAILY")
	return {
		refresh = function()
			for _, fn in refreshers do
				fn()
			end
		end,
		show = show,
	}
end

return TabGoals

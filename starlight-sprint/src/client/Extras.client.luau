-- Starlight Sprint: client extras. Daily rewards, wisp eggs + orbiting pets, cosmic event banner, offline toast.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Audio = require(Shared:WaitForChild("Audio"))
local Action = ReplicatedStorage:WaitForChild("Action")
local Popup = ReplicatedStorage:WaitForChild("Popup")

local function make(class, props, parent)
	local inst = Instance.new(class)
	for k, v in props do
		inst[k] = v
	end
	inst.Parent = parent
	return inst
end

local function styled(frame, radius)
	make("UICorner", { CornerRadius = UDim.new(0, radius or 12) }, frame)
	make("UIStroke", { Color = Color3.fromRGB(140, 110, 255), Thickness = 2, Transparency = 0.2 }, frame)
	return frame
end

local function fmt(n)
	if n >= 1e9 then
		return string.format("%.2fB", n / 1e9)
	elseif n >= 1e6 then
		return string.format("%.2fM", n / 1e6)
	elseif n >= 1e4 then
		return string.format("%.1fK", n / 1e3)
	end
	return tostring(math.floor(n))
end


-- Shrinks a panel on short windows so it never runs off-screen.
local camera = workspace:WaitForChild("Camera")
local function fitScale(scaleObj)
	local function update()
		scaleObj.Scale = math.clamp(camera.ViewportSize.Y / 720, 0.55, 1)
	end
	update()
	camera:GetPropertyChangedSignal("ViewportSize"):Connect(update)
end

local PANEL_BG = Color3.fromRGB(22, 16, 48)
local GREEN, GREY, GOLD = Color3.fromRGB(70, 200, 120), Color3.fromRGB(80, 75, 110), Color3.fromRGB(255, 190, 60)

local gui = make("ScreenGui", { Name = "StarlightExtras", ResetOnSpawn = false }, player:WaitForChild("PlayerGui"))

local function sideButton(text, row)
	return styled(make("TextButton", {
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 16, 1, -16 - row * 64),
		Size = UDim2.fromOffset(150, 56),
		BackgroundColor3 = Color3.fromRGB(110, 70, 255),
		Font = Enum.Font.GothamBlack,
		TextSize = 22,
		TextColor3 = Color3.new(1, 1, 1),
		Text = text,
	}, gui))
end

local function sidePanel(width, height)
	local frame = styled(make("Frame", {
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 16, 1, -150),
		Size = UDim2.fromOffset(width, height),
		BackgroundColor3 = PANEL_BG,
		BackgroundTransparency = 0.05,
		Visible = false,
	}, gui), 16)
	fitScale(make("UIScale", {}, frame))
	return frame
end

local function label(parent, props)
	local base = {
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		TextSize = 16,
		TextColor3 = Color3.new(1, 1, 1),
	}
	for k, v in props do
		base[k] = v
	end
	return make("TextLabel", base, parent)
end

--------------------------------------------------------------------------------
-- Toasts + event banner
--------------------------------------------------------------------------------
local function toast(text, color)
	local t = styled(make("Frame", {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, -80),
		Size = UDim2.fromOffset(420, 52),
		BackgroundColor3 = PANEL_BG,
	}, gui))
	label(t, { Size = UDim2.fromScale(1, 1), Text = text, TextSize = 20, TextColor3 = color or Color3.new(1, 1, 1) })
	TweenService:Create(t, TweenInfo.new(0.4, Enum.EasingStyle.Back), { Position = UDim2.new(0.5, 0, 0, 160) }):Play()
	task.delay(4, function()
		TweenService:Create(t, TweenInfo.new(0.4), { Position = UDim2.new(0.5, 0, 0, -80) }):Play()
		task.wait(0.5)
		t:Destroy()
	end)
end

local banner = styled(make("Frame", {
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 84),
	Size = UDim2.fromOffset(380, 64),
	BackgroundColor3 = PANEL_BG,
	Visible = false,
}, gui))
local bannerTitle = label(banner, {
	Size = UDim2.new(1, 0, 0, 30),
	Position = UDim2.fromOffset(0, 4),
	Font = Enum.Font.GothamBlack,
	TextSize = 24,
})
local bannerDesc = label(banner, {
	Size = UDim2.new(1, 0, 0, 22),
	Position = UDim2.fromOffset(0, 34),
	Font = Enum.Font.Gotham,
	TextSize = 14,
	TextColor3 = Color3.fromRGB(200, 190, 240),
})

local eventById = {}
for _, ev in Config.Events do
	eventById[ev.Id] = ev
end

local function refreshBanner()
	local id = workspace:GetAttribute("Event")
	local ev = id and eventById[id]
	local left = (workspace:GetAttribute("EventEnd") or 0) - workspace:GetServerTimeNow()
	if ev and left > 0 then
		banner.Visible = true
		bannerTitle.Text = string.format("%s  %ds", ev.Name, math.ceil(left))
		bannerTitle.TextColor3 = ev.Tint:Lerp(Color3.new(1, 1, 1), 0.2)
		bannerDesc.Text = ev.Desc
	else
		banner.Visible = false
	end
end

local lastEvent = ""
workspace:GetAttributeChangedSignal("Event"):Connect(function()
	local id = workspace:GetAttribute("Event") or ""
	if id ~= "" and id ~= lastEvent and eventById[id] then
		Audio.event()
		toast(eventById[id].Name .. " has begun!", GOLD)
	end
	lastEvent = id
end)

--------------------------------------------------------------------------------
-- Daily rewards
--------------------------------------------------------------------------------
local dailyButton = sideButton("🎁 DAILY", 0)
local dailyPanel = sidePanel(360, 250)
label(dailyPanel, {
	Size = UDim2.new(1, 0, 0, 30),
	Position = UDim2.fromOffset(0, 8),
	Text = "Daily Rewards",
	Font = Enum.Font.GothamBlack,
	TextSize = 22,
})
local dayCells = {}
for i, reward in Config.Daily do
	local col = (i - 1) % 4
	local row = (i - 1) // 4
	local cell = make("Frame", {
		Position = UDim2.fromOffset(12 + col * 86, 48 + row * 76),
		Size = UDim2.fromOffset(80, 70),
		BackgroundColor3 = Color3.fromRGB(38, 30, 80),
	}, dailyPanel)
	make("UICorner", { CornerRadius = UDim.new(0, 10) }, cell)
	label(cell, { Size = UDim2.new(1, 0, 0, 18), Position = UDim2.fromOffset(0, 4), Text = "Day " .. i, TextSize = 13 })
	local text = "✨" .. fmt(reward.Dust)
	if reward.Eggs then
		text ..= "\n🥚 x" .. reward.Eggs
	end
	label(cell, { Size = UDim2.new(1, 0, 1, -22), Position = UDim2.fromOffset(0, 22), Text = text, TextSize = 14 })
	dayCells[i] = cell
end
local claimButton = make("TextButton", {
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -12),
	Size = UDim2.new(1, -24, 0, 44),
	Font = Enum.Font.GothamBlack,
	TextSize = 20,
	TextColor3 = Color3.new(1, 1, 1),
	Text = "CLAIM",
}, dailyPanel)
make("UICorner", { CornerRadius = UDim.new(0, 10) }, claimButton)
claimButton.Activated:Connect(function()
	Audio.click()
	Action:FireServer("Claim")
end)
dailyButton.Activated:Connect(function()
	Audio.click()
	dailyPanel.Visible = not dailyPanel.Visible
end)

local function refreshDaily()
	local ready = player:GetAttribute("DailyReady")
	local day = player:GetAttribute("DailyDay") or 1
	for i, cell in dayCells do
		local isNext = i == day
		cell.BackgroundColor3 = isNext and (ready and GOLD or Color3.fromRGB(90, 70, 160)) or Color3.fromRGB(38, 30, 80)
	end
	claimButton.Text = ready and "CLAIM DAY " .. day or "Come back tomorrow!"
	claimButton.BackgroundColor3 = ready and GREEN or GREY
	dailyButton.Text = ready and "🎁 DAILY !" or "🎁 DAILY"
	dailyButton.BackgroundColor3 = ready and GOLD or Color3.fromRGB(110, 70, 255)
end

--------------------------------------------------------------------------------
-- Wisp eggs
--------------------------------------------------------------------------------
local eggButton = sideButton("🥚 WISPS", 1)
local eggPanel = sidePanel(360, 330)
label(eggPanel, {
	Size = UDim2.new(1, 0, 0, 30),
	Position = UDim2.fromOffset(0, 8),
	Text = "Wisp Nest",
	Font = Enum.Font.GothamBlack,
	TextSize = 22,
})
local rateLabel = label(eggPanel, {
	Size = UDim2.new(1, 0, 0, 22),
	Position = UDim2.fromOffset(0, 38),
	Text = "",
	TextColor3 = Color3.fromRGB(255, 235, 150),
})
local slotCells = {}
for i = 1, Config.MaxWisps do
	local col = (i - 1) % 4
	local row = (i - 1) // 4
	local cell = make("Frame", {
		Position = UDim2.fromOffset(12 + col * 86, 70 + row * 76),
		Size = UDim2.fromOffset(80, 70),
		BackgroundColor3 = Color3.fromRGB(38, 30, 80),
	}, eggPanel)
	make("UICorner", { CornerRadius = UDim.new(0, 10) }, cell)
	slotCells[i] = {
		cell = cell,
		name = label(cell, { Size = UDim2.new(1, 0, 0, 24), Position = UDim2.fromOffset(0, 12), TextSize = 14, Text = "-" }),
		rate = label(cell, {
			Size = UDim2.new(1, 0, 0, 18),
			Position = UDim2.fromOffset(0, 38),
			TextSize = 12,
			Font = Enum.Font.Gotham,
			Text = "empty",
		}),
	}
end
local hatchButton = make("TextButton", {
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -12),
	Size = UDim2.new(1, -24, 0, 50),
	Font = Enum.Font.GothamBlack,
	TextSize = 20,
	TextColor3 = Color3.new(1, 1, 1),
	Text = "",
}, eggPanel)
make("UICorner", { CornerRadius = UDim.new(0, 10) }, hatchButton)
hatchButton.Activated:Connect(function()
	Audio.click()
	Action:FireServer("Hatch")
end)
eggButton.Activated:Connect(function()
	Audio.click()
	eggPanel.Visible = not eggPanel.Visible
end)

local function parseWisps(p)
	local ids = {}
	for id in string.gmatch(p:GetAttribute("Wisps") or "", "[^,]+") do
		table.insert(ids, id)
	end
	return ids
end

local function refreshEggs()
	local asc = player:GetAttribute("Ascensions") or 0
	local ids = parseWisps(player)
	for i, slot in slotCells do
		local w = ids[i] and Config.WispById(ids[i])
		if w then
			slot.name.Text = w.Name
			slot.name.TextColor3 = w.Color
			slot.rate.Text = w.Rarity .. " · " .. fmt(w.Rate) .. "/s"
		else
			slot.name.Text = "-"
			slot.name.TextColor3 = Color3.new(1, 1, 1)
			slot.rate.Text = "empty"
		end
	end
	rateLabel.Text = string.format("✨ %s dust / second", fmt(player:GetAttribute("WispRate") or 0))
	local free = player:GetAttribute("FreeEggs") or 0
	local cost = Config.EggCost(asc)
	local dust = player:GetAttribute("Dust") or 0
	if free > 0 then
		hatchButton.Text = string.format("HATCH FREE EGG (%d)", free)
		hatchButton.BackgroundColor3 = GOLD
	else
		hatchButton.Text = "HATCH EGG  ✨" .. fmt(cost)
		hatchButton.BackgroundColor3 = dust >= cost and GREEN or GREY
	end
end

-- Hatch reveal
local reveal = make("Frame", {
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = Color3.new(0, 0, 0),
	BackgroundTransparency = 0.35,
	Visible = false,
	ZIndex = 40,
}, gui)
local revealEgg = label(reveal, {
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.45),
	Size = UDim2.fromOffset(200, 200),
	Text = "🥚",
	TextSize = 140,
	ZIndex = 41,
})
local revealName = label(reveal, {
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.55),
	Size = UDim2.fromOffset(600, 70),
	Font = Enum.Font.GothamBlack,
	TextSize = 56,
	TextTransparency = 1,
	ZIndex = 41,
})
local revealInfo = label(reveal, {
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.63),
	Size = UDim2.fromOffset(600, 40),
	TextSize = 24,
	TextTransparency = 1,
	ZIndex = 41,
})

local revealToken = 0
local function showHatch(id, status)
	local w = Config.WispById(id)
	if not w then
		return
	end
	revealToken += 1
	local token = revealToken
	reveal.Visible = true
	revealName.TextTransparency, revealInfo.TextTransparency = 1, 1
	revealEgg.Visible = true
	for i = 1, 8 do
		revealEgg.Rotation = (i % 2 == 0 and 1 or -1) * (6 + i * 2)
		Audio.hatchTick(i)
		task.wait(0.12)
	end
	if token ~= revealToken then
		return
	end
	revealEgg.Visible = false
	revealEgg.Rotation = 0
	local rank = 1
	for i, wisp in Config.Wisps do
		if wisp.Id == id then
			rank = i
		end
	end
	Audio.reveal(rank)
	revealName.Text = w.Name
	revealName.TextColor3 = w.Color
	revealInfo.Text = string.format(
		"%s · %s dust/s%s",
		w.Rarity,
		fmt(w.Rate),
		status == "refund" and "  (nest full: half cost refunded)" or (status == "replaced" and "  (replaced your weakest)" or "")
	)
	revealInfo.TextColor3 = w.Color
	revealName.Size = UDim2.fromOffset(300, 30)
	TweenService:Create(revealName, TweenInfo.new(0.4, Enum.EasingStyle.Back), { Size = UDim2.fromOffset(600, 70), TextTransparency = 0 }):Play()
	TweenService:Create(revealInfo, TweenInfo.new(0.4), { TextTransparency = 0 }):Play()
	task.wait(2.6)
	if token == revealToken then
		reveal.Visible = false
	end
end

Popup.OnClientEvent:Connect(function(kind, a, b, c)
	if kind == "hatch" then
		task.spawn(showHatch, a, b)
	elseif kind == "daily" then
		Audio.daily()
		toast(string.format("Day %d claimed: +%s dust%s", a, fmt(b), c > 0 and (" +" .. c .. " 🥚") or ""), GOLD)
	end
end)

--------------------------------------------------------------------------------
-- Orbiting wisps (rendered locally for every player)
--------------------------------------------------------------------------------
local visuals = {} -- Player -> { key = string, parts = {Part} }

local function clearVisual(p)
	local v = visuals[p]
	if v then
		for _, part in v.parts do
			part:Destroy()
		end
		visuals[p] = nil
	end
end

local function buildVisual(p, key)
	clearVisual(p)
	local parts = {}
	for id in string.gmatch(key, "[^,]+") do
		local w = Config.WispById(id)
		if w then
			local size = 0.9 + math.log10(w.Rate + 1) * 0.35
			local part = make("Part", {
				Name = "Wisp",
				Shape = Enum.PartType.Ball,
				Size = Vector3.one * size,
				Material = Enum.Material.Neon,
				Color = w.Color,
				Anchored = true,
				CanCollide = false,
				CanTouch = false,
				CanQuery = false,
				CastShadow = false,
			}, workspace)
			make("PointLight", { Color = w.Color, Range = 8, Brightness = 1.2 }, part)
			local e = make("ParticleEmitter", {
				Color = ColorSequence.new(w.Color),
				LightEmission = 1,
				Rate = 10,
				Lifetime = NumberRange.new(0.6, 1),
				Speed = NumberRange.new(0.5, 1.5),
				SpreadAngle = Vector2.new(180, 180),
				Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 0) }),
				Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(1, 1) }),
			}, part)
			e.Name = "Sparkle"
			table.insert(parts, part)
		end
	end
	visuals[p] = { key = key, parts = parts }
end

Players.PlayerRemoving:Connect(clearVisual)

local lastSlow = 0
RunService.RenderStepped:Connect(function()
	local t = os.clock()
	for _, p in Players:GetPlayers() do
		local key = p:GetAttribute("Wisps") or ""
		local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
		local v = visuals[p]
		if not root or key == "" then
			if v then
				clearVisual(p)
			end
		else
			if not v or v.key ~= key then
				buildVisual(p, key)
				v = visuals[p]
			end
			local n = #v.parts
			for i, part in v.parts do
				local ang = t * 0.9 + (i / n) * math.pi * 2
				local rad = 4 + (i % 2) * 1.2
				local pos = root.Position + Vector3.new(math.cos(ang) * rad, 1.5 + math.sin(t * 2 + i) * 0.5 + (i % 3) * 0.4, math.sin(ang) * rad)
				part.Position = pos
			end
		end
	end

	if t - lastSlow > 0.2 then
		lastSlow = t
		refreshBanner()
		refreshDaily()
		refreshEggs()
	end
end)

--------------------------------------------------------------------------------
-- Welcome-back moment
--------------------------------------------------------------------------------
task.spawn(function()
	task.wait(2)
	local gain = player:GetAttribute("OfflineGain")
	if gain and gain > 0 then
		toast("Your wisps earned ✨" .. fmt(gain) .. " while you were away!", Color3.fromRGB(255, 235, 150))
		task.wait(4.5)
	end
	if player:GetAttribute("DailyReady") then
		dailyPanel.Visible = true
	end
end)

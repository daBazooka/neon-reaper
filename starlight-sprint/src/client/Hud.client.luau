-- Starlight Sprint: client HUD + game feel.
-- Rolling dust counter, level bar, quest tracker, combo meter, pitched pickup notes,
-- camera punch/shake, particle bursts, milestone callouts, shop, music toggle.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local CollectionService = game:GetService("CollectionService")
local Debris = game:GetService("Debris")

local player = Players.LocalPlayer
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Audio = require(Shared:WaitForChild("Audio"))
local Action = ReplicatedStorage:WaitForChild("Action")
local Popup = ReplicatedStorage:WaitForChild("Popup")
local camera = workspace:WaitForChild("Camera")

Audio.Init()
Audio.startMusic()

local GOLD = Color3.fromRGB(255, 205, 70)
local PANEL_BG = Color3.fromRGB(22, 16, 48)
local GREEN, GREY = Color3.fromRGB(70, 200, 120), Color3.fromRGB(80, 75, 110)

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
	n = math.floor(n + 0.5)
	if n >= 1e12 then
		return string.format("%.2fT", n / 1e12)
	elseif n >= 1e9 then
		return string.format("%.2fB", n / 1e9)
	elseif n >= 1e6 then
		return string.format("%.2fM", n / 1e6)
	elseif n >= 1e4 then
		return string.format("%.1fK", n / 1e3)
	end
	return tostring(n)
end

-- Shrinks a panel on short windows so it never runs off-screen.
local function fitScale(scaleObj)
	local function update()
		scaleObj.Scale = math.clamp(camera.ViewportSize.Y / 720, 0.55, 1)
	end
	update()
	camera:GetPropertyChangedSignal("ViewportSize"):Connect(update)
end

local function pop(scaleObj, amount)
	scaleObj.Scale = amount
	TweenService:Create(scaleObj, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Scale = 1 }):Play()
end

--------------------------------------------------------------------------------
-- Layout: top-left starts right of Roblox's own menu buttons
--------------------------------------------------------------------------------
local gui = make("ScreenGui", { Name = "StarlightHud", ResetOnSpawn = false }, player:WaitForChild("PlayerGui"))

-- Dust counter
local dustFrame = styled(make("Frame", {
	Position = UDim2.new(0, 220, 0, 12),
	Size = UDim2.fromOffset(230, 58),
	BackgroundColor3 = PANEL_BG,
	BackgroundTransparency = 0.1,
}, gui))
local dustScale = make("UIScale", {}, dustFrame)
local dustLabel = make("TextLabel", {
	Size = UDim2.fromScale(1, 1),
	BackgroundTransparency = 1,
	Font = Enum.Font.GothamBlack,
	TextScaled = true,
	TextColor3 = Color3.fromRGB(255, 235, 150),
	Text = "✨ 0",
}, dustFrame)
make("UIPadding", { PaddingTop = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8) }, dustFrame)

local ascLabel = make("TextLabel", {
	Position = UDim2.new(0, 220, 0, 74),
	Size = UDim2.fromOffset(230, 20),
	BackgroundTransparency = 1,
	Font = Enum.Font.GothamBold,
	TextSize = 15,
	TextXAlignment = Enum.TextXAlignment.Left,
	TextColor3 = Color3.fromRGB(200, 190, 255),
	Text = "",
}, gui)

-- Quest tracker
local questFrame = styled(make("Frame", {
	Position = UDim2.new(0, 220, 0, 98),
	Size = UDim2.fromOffset(260, 56),
	BackgroundColor3 = PANEL_BG,
	BackgroundTransparency = 0.15,
}, gui), 10)
local questScale = make("UIScale", {}, questFrame)
local questText = make("TextLabel", {
	Position = UDim2.fromOffset(10, 4),
	Size = UDim2.new(1, -20, 0, 22),
	BackgroundTransparency = 1,
	Font = Enum.Font.GothamBold,
	TextSize = 15,
	TextXAlignment = Enum.TextXAlignment.Left,
	TextColor3 = Color3.new(1, 1, 1),
	Text = "",
}, questFrame)
local questBarBack = make("Frame", {
	Position = UDim2.new(0, 10, 1, -20),
	Size = UDim2.new(1, -20, 0, 12),
	BackgroundColor3 = Color3.fromRGB(50, 40, 90),
	BorderSizePixel = 0,
}, questFrame)
make("UICorner", { CornerRadius = UDim.new(1, 0) }, questBarBack)
local questBar = make("Frame", {
	Size = UDim2.fromScale(0, 1),
	BackgroundColor3 = GREEN,
	BorderSizePixel = 0,
}, questBarBack)
make("UICorner", { CornerRadius = UDim.new(1, 0) }, questBar)
local questCount = make("TextLabel", {
	Size = UDim2.fromScale(1, 1),
	BackgroundTransparency = 1,
	Font = Enum.Font.GothamBold,
	TextSize = 11,
	TextColor3 = Color3.new(1, 1, 1),
	Text = "",
}, questBarBack)

-- Combo meter
local comboFrame = styled(make("Frame", {
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 12),
	Size = UDim2.fromOffset(280, 54),
	BackgroundColor3 = PANEL_BG,
	BackgroundTransparency = 0.1,
	Visible = false,
}, gui))
local comboScale = make("UIScale", {}, comboFrame)
local comboLabel = make("TextLabel", {
	Size = UDim2.new(1, 0, 0, 36),
	BackgroundTransparency = 1,
	Font = Enum.Font.GothamBlack,
	TextSize = 26,
	TextColor3 = Color3.new(1, 1, 1),
	Text = "",
}, comboFrame)
local barBack = make("Frame", {
	Position = UDim2.new(0, 14, 1, -14),
	Size = UDim2.new(1, -28, 0, 6),
	BackgroundColor3 = Color3.fromRGB(50, 40, 90),
	BorderSizePixel = 0,
}, comboFrame)
make("UICorner", { CornerRadius = UDim.new(1, 0) }, barBack)
local bar = make("Frame", {
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = Color3.fromRGB(90, 210, 255),
	BorderSizePixel = 0,
}, barBack)
make("UICorner", { CornerRadius = UDim.new(1, 0) }, bar)

-- Level bar (bottom centre)
local levelFrame = styled(make("Frame", {
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -14),
	Size = UDim2.fromOffset(340, 36),
	BackgroundColor3 = PANEL_BG,
	BackgroundTransparency = 0.1,
}, gui), 10)
local levelScale = make("UIScale", {}, levelFrame)
local levelLabel = make("TextLabel", {
	Position = UDim2.fromOffset(10, 0),
	Size = UDim2.fromOffset(70, 36),
	BackgroundTransparency = 1,
	Font = Enum.Font.GothamBlack,
	TextSize = 18,
	TextColor3 = GOLD,
	TextXAlignment = Enum.TextXAlignment.Left,
	Text = "LV 1",
}, levelFrame)
local xpBack = make("Frame", {
	Position = UDim2.fromOffset(80, 11),
	Size = UDim2.new(1, -92, 0, 14),
	BackgroundColor3 = Color3.fromRGB(50, 40, 90),
	BorderSizePixel = 0,
}, levelFrame)
make("UICorner", { CornerRadius = UDim.new(1, 0) }, xpBack)
local xpBar = make("Frame", {
	Size = UDim2.fromScale(0, 1),
	BackgroundColor3 = Color3.fromRGB(150, 110, 255),
	BorderSizePixel = 0,
}, xpBack)
make("UICorner", { CornerRadius = UDim.new(1, 0) }, xpBar)
local xpText = make("TextLabel", {
	Size = UDim2.fromScale(1, 1),
	BackgroundTransparency = 1,
	Font = Enum.Font.GothamBold,
	TextSize = 11,
	TextColor3 = Color3.new(1, 1, 1),
	Text = "",
}, xpBack)

-- Music toggle
local muteButton = styled(make("TextButton", {
	AnchorPoint = Vector2.new(0, 1),
	Position = UDim2.new(0.5, 180, 1, -14),
	Size = UDim2.fromOffset(36, 36),
	BackgroundColor3 = PANEL_BG,
	Font = Enum.Font.GothamBold,
	TextSize = 18,
	TextColor3 = Color3.new(1, 1, 1),
	Text = "🎵",
}, gui), 10)
muteButton.Activated:Connect(function()
	local on = not Audio.musicOn()
	Audio.setMusic(on)
	muteButton.Text = on and "🎵" or "🔇"
	Audio.click()
end)

-- Full-screen flash
local flash = make("Frame", {
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = Color3.new(1, 1, 1),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ZIndex = 50,
}, gui)

local function flashScreen(color, strength, dur)
	flash.BackgroundColor3 = color
	flash.BackgroundTransparency = 1 - strength
	TweenService:Create(flash, TweenInfo.new(dur or 0.5), { BackgroundTransparency = 1 }):Play()
end

--------------------------------------------------------------------------------
-- Shop
--------------------------------------------------------------------------------
local shopButton = styled(make("TextButton", {
	AnchorPoint = Vector2.new(1, 1),
	Position = UDim2.new(1, -16, 1, -16),
	Size = UDim2.fromOffset(150, 56),
	BackgroundColor3 = Color3.fromRGB(110, 70, 255),
	Font = Enum.Font.GothamBlack,
	TextSize = 24,
	TextColor3 = Color3.new(1, 1, 1),
	Text = "✨ SHOP",
}, gui))

local panel = styled(make("Frame", {
	AnchorPoint = Vector2.new(1, 1),
	Position = UDim2.new(1, -16, 1, -80),
	Size = UDim2.fromOffset(340, 400),
	BackgroundColor3 = PANEL_BG,
	BackgroundTransparency = 0.05,
	Visible = false,
}, gui), 16)
fitScale(make("UIScale", {}, panel))
make("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, panel)
make("UIPadding", {
	PaddingTop = UDim.new(0, 10),
	PaddingBottom = UDim.new(0, 10),
	PaddingLeft = UDim.new(0, 10),
	PaddingRight = UDim.new(0, 10),
}, panel)

local rows = {}
local function makeRow(order, title, desc, onClick)
	local row = make("Frame", {
		LayoutOrder = order,
		Size = UDim2.new(1, 0, 0, 62),
		BackgroundColor3 = Color3.fromRGB(38, 30, 80),
	}, panel)
	make("UICorner", { CornerRadius = UDim.new(0, 10) }, row)
	local name = make("TextLabel", {
		Position = UDim2.fromOffset(10, 6),
		Size = UDim2.new(1, -120, 0, 24),
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		TextSize = 17,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextColor3 = Color3.new(1, 1, 1),
		Text = title,
	}, row)
	make("TextLabel", {
		Position = UDim2.fromOffset(10, 32),
		Size = UDim2.new(1, -120, 0, 22),
		BackgroundTransparency = 1,
		Font = Enum.Font.Gotham,
		TextSize = 13,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextColor3 = Color3.fromRGB(190, 180, 230),
		Text = desc,
	}, row)
	local btn = make("TextButton", {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -8, 0.5, 0),
		Size = UDim2.fromOffset(100, 44),
		Font = Enum.Font.GothamBlack,
		TextSize = 16,
		TextColor3 = Color3.new(1, 1, 1),
		Text = "",
	}, row)
	make("UICorner", { CornerRadius = UDim.new(0, 8) }, btn)
	local btnScale = make("UIScale", {}, btn)
	btn.Activated:Connect(function()
		Audio.click()
		onClick()
	end)
	return { name = name, btn = btn, scale = btnScale, title = title }
end

for i, def in Config.Upgrades do
	local row = makeRow(i, def.Name, def.Desc, function()
		Action:FireServer("Buy", def.Id)
	end)
	row.def = def
	table.insert(rows, row)
	player:GetAttributeChangedSignal("Lv_" .. def.Id):Connect(function()
		if (player:GetAttribute("Lv_" .. def.Id) or 0) > 0 then
			Audio.purchase()
			pop(row.scale, 1.25)
		end
	end)
end
local ascendRow = makeRow(10, "🌟 ASCEND", "Reset, +50% dust forever, new aura", function()
	Action:FireServer("Ascend")
end)

shopButton.Activated:Connect(function()
	Audio.click()
	panel.Visible = not panel.Visible
end)

local function refreshShop()
	local dust = player:GetAttribute("Dust") or 0
	for _, row in rows do
		local lvl = player:GetAttribute("Lv_" .. row.def.Id) or 0
		row.name.Text = string.format("%s  Lv %d", row.title, lvl)
		if lvl >= row.def.Max then
			row.btn.Text = "MAX"
			row.btn.BackgroundColor3 = GREY
		else
			local cost = Config.UpgradeCost(row.def, lvl)
			row.btn.Text = fmt(cost)
			row.btn.BackgroundColor3 = dust >= cost and GREEN or GREY
		end
	end
	local asc = player:GetAttribute("Ascensions") or 0
	local cost = Config.AscendCost(asc)
	ascendRow.btn.Text = fmt(cost)
	ascendRow.btn.BackgroundColor3 = dust >= cost and Color3.fromRGB(255, 170, 40) or GREY
	ascLabel.Text = asc > 0 and string.format("🌟 Ascension %d  (x%.1f)", asc, 1 + 0.5 * asc) or ""
end

--------------------------------------------------------------------------------
-- Juice: camera punch + shake, floating text, bursts, announcements
--------------------------------------------------------------------------------
local fovKick = 0
local shakeMag, shakeTime = 0, 0
local BASE_FOV = 70

local function punch(amount)
	fovKick = math.max(fovKick, amount)
end

local function shake(mag, dur)
	shakeMag = math.max(shakeMag, mag)
	shakeTime = math.max(shakeTime, dur)
end

local function newAnchor(pos, lifetime)
	local anchor = make("Part", {
		Anchored = true,
		CanCollide = false,
		CanTouch = false,
		CanQuery = false,
		Transparency = 1,
		Size = Vector3.one * 0.1,
		Position = pos,
	}, workspace)
	Debris:AddItem(anchor, lifetime)
	return anchor
end

local function floatText(pos, text, color, size)
	local anchor = newAnchor(pos + Vector3.new((math.random() - 0.5) * 2, 0, (math.random() - 0.5) * 2), 1.2)
	local bb = make("BillboardGui", {
		Adornee = anchor,
		AlwaysOnTop = true,
		Size = UDim2.fromOffset(280, size + 10),
	}, anchor)
	local label = make("TextLabel", {
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBlack,
		TextSize = size,
		TextColor3 = color,
		TextStrokeTransparency = 0.2,
		TextStrokeColor3 = Color3.fromRGB(20, 10, 50),
		Text = text,
	}, bb)
	local grow = make("UIScale", { Scale = 0.4 }, label)
	TweenService:Create(grow, TweenInfo.new(0.18, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Scale = 1 }):Play()
	TweenService:Create(bb, TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
		StudsOffset = Vector3.new(0, 6, 0),
	}):Play()
	TweenService:Create(label, TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
		TextTransparency = 1,
		TextStrokeTransparency = 1,
	}):Play()
end

local function burst(pos, color, count)
	local anchor = newAnchor(pos, 1.5)
	local e = make("ParticleEmitter", {
		Color = ColorSequence.new(color),
		LightEmission = 1,
		Rate = 0,
		Lifetime = NumberRange.new(0.4, 0.8),
		Speed = NumberRange.new(10, 22),
		SpreadAngle = Vector2.new(180, 180),
		Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.7), NumberSequenceKeypoint.new(1, 0) }),
		Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(1, 1) }),
	}, anchor)
	e:Emit(count)
end

-- Big centred callout (level ups, quests, combo milestones).
local function announce(title, sub, color, y)
	local holder = make("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(0.5, 0, y or 0.3, 0),
		Size = UDim2.fromOffset(640, 110),
		BackgroundTransparency = 1,
		ZIndex = 30,
	}, gui)
	local scale = make("UIScale", { Scale = 0.3 }, holder)
	local t = make("TextLabel", {
		Size = UDim2.new(1, 0, 0, 64),
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBlack,
		TextSize = 56,
		TextColor3 = color,
		TextStrokeTransparency = 0.1,
		TextStrokeColor3 = Color3.fromRGB(20, 10, 50),
		Text = title,
		ZIndex = 30,
	}, holder)
	local s = make("TextLabel", {
		Position = UDim2.fromOffset(0, 64),
		Size = UDim2.new(1, 0, 0, 34),
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		TextSize = 26,
		TextColor3 = Color3.new(1, 1, 1),
		TextStrokeTransparency = 0.2,
		TextStrokeColor3 = Color3.fromRGB(20, 10, 50),
		Text = sub or "",
		ZIndex = 30,
	}, holder)
	TweenService:Create(scale, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Scale = 1 }):Play()
	task.delay(1.6, function()
		TweenService:Create(t, TweenInfo.new(0.5), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
		TweenService:Create(s, TweenInfo.new(0.5), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
		task.wait(0.6)
		holder:Destroy()
	end)
end

--------------------------------------------------------------------------------
-- Server events
--------------------------------------------------------------------------------
Popup.OnClientEvent:Connect(function(kind, a, b, c, d, e, f, g)
	if kind == "orb" then
		local pos, gained, combo, tier, color, mut, lucky = a, b, c, d, e, f, g
		local rank = Config.TierIndex(tier)
		Audio.pickup(combo, rank + (mut and 2 or 0))

		local text = (mut and (mut:upper() .. "! ") or "") .. "+" .. fmt(gained)
		floatText(pos, text, color, mut and 40 or (rank > 1 and 34 or 24))
		burst(pos, color, 6 + rank * 5 + (mut and 15 or 0))
		punch(1.5 + rank * 1.2 + (mut and 4 or 0))
		pop(comboScale, 1.15)

		if mut or lucky then
			shake(0.3, 0.35)
			flashScreen(color, 0.35, 0.4)
		end
		if lucky then
			floatText(pos + Vector3.new(0, 3, 0), "LUCKY x" .. Config.LuckyMult .. "!", GOLD, 46)
			Audio.milestone(combo)
		end

		local milestone = Config.ComboMilestones[combo]
		if milestone then
			Audio.milestone(combo)
			announce(milestone, "x" .. combo .. " COMBO", GOLD, 0.22)
			shake(0.2 + combo * 0.006, 0.4)
		end
	elseif kind == "level" then
		local level, dust, eggs = a, b, c
		Audio.levelUp()
		shake(0.4, 0.5)
		flashScreen(GOLD, 0.45, 0.8)
		announce("LEVEL " .. level .. "!", "+" .. fmt(dust) .. " ✨" .. (eggs > 0 and ("  +" .. eggs .. " 🥚 FREE EGG") or ""), GOLD, 0.3)
		pop(levelScale, 1.2)
	elseif kind == "quest" then
		local text, reward = a, b
		Audio.quest()
		flashScreen(GREEN, 0.25, 0.5)
		announce("QUEST COMPLETE!", text .. "  +" .. fmt(reward) .. " ✨", GREEN, 0.38)
		pop(questScale, 1.2)
	elseif kind == "ascend" then
		Audio.ascend()
		shake(0.7, 0.9)
		flashScreen(Color3.new(1, 1, 1), 1, 1.4)
		local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
		if root then
			burst(root.Position, Config.AuraColor(a), 120)
		end
		announce("ASCENDED!", "Aura " .. a .. " unlocked  ·  +50% dust forever", Config.AuraColor(a), 0.3)
	end
end)

--------------------------------------------------------------------------------
-- Dust counter pop
--------------------------------------------------------------------------------
local lastDust = 0
player:GetAttributeChangedSignal("Dust"):Connect(function()
	local d = player:GetAttribute("Dust") or 0
	if d > lastDust then
		pop(dustScale, 1.1)
	end
	lastDust = d
end)

--------------------------------------------------------------------------------
-- Orbs bob and spin locally so the server never has to animate them
--------------------------------------------------------------------------------
local tracked = {}
local function track(orb)
	if orb:IsA("BasePart") then
		tracked[orb] = orb.Position
	end
end
CollectionService:GetInstanceAddedSignal("Orb"):Connect(track)
CollectionService:GetInstanceRemovedSignal("Orb"):Connect(function(orb)
	tracked[orb] = nil
end)
for _, orb in CollectionService:GetTagged("Orb") do
	track(orb)
end

--------------------------------------------------------------------------------
-- Per-frame updates
--------------------------------------------------------------------------------
local shownDust = 0
local shownQuest = 0
local shownXP = 0
local lastSlow = 0

RunService.RenderStepped:Connect(function(dt)
	local t = os.clock()

	for orb, base in tracked do
		if orb.Parent and not orb:GetAttribute("Taken") then
			orb.CFrame = CFrame.new(base + Vector3.new(0, math.sin(t * 2 + base.X * 0.3) * 0.6, 0)) * CFrame.Angles(0, t, 0)
		end
	end

	-- Camera punch + shake
	fovKick = fovKick * (1 - math.min(1, dt * 12))
	camera.FieldOfView = BASE_FOV + fovKick
	local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
	if hum then
		if shakeTime > 0 then
			shakeTime -= dt
			local m = shakeMag * math.clamp(shakeTime / 0.3, 0, 1)
			hum.CameraOffset = Vector3.new((math.random() - 0.5) * m, (math.random() - 0.5) * m, 0)
		else
			shakeMag = 0
			hum.CameraOffset = Vector3.zero
		end
	end

	-- Dust counter rolls up instead of jumping
	local dust = player:GetAttribute("Dust") or 0
	shownDust += (dust - shownDust) * math.min(1, dt * 9)
	if math.abs(dust - shownDust) < 0.5 then
		shownDust = dust
	end
	dustLabel.Text = "✨ " .. fmt(shownDust)

	-- Combo meter
	local combo = player:GetAttribute("Combo") or 0
	local remaining = (player:GetAttribute("ComboExpire") or 0) - workspace:GetServerTimeNow()
	if combo > 0 and remaining > 0 then
		comboFrame.Visible = true
		local hot = math.clamp(combo / Config.ComboMax, 0, 1)
		comboLabel.Text = string.format("COMBO %d  ·  x%.1f", combo, Config.ComboMult(combo))
		comboLabel.TextColor3 = Color3.new(1, 1, 1):Lerp(Color3.fromRGB(255, 190, 60), hot)
		bar.Size = UDim2.fromScale(math.clamp(remaining / Config.ComboWindow, 0, 1), 1)
		bar.BackgroundColor3 = Color3.fromRGB(90, 210, 255):Lerp(Color3.fromRGB(255, 90, 160), hot)
	else
		comboFrame.Visible = false
	end

	-- Quest bar
	local kind = player:GetAttribute("QuestKind")
	if kind then
		local goal = player:GetAttribute("QuestGoal") or 1
		local progress = player:GetAttribute("QuestProgress") or 0
		questText.Text = "🎯 " .. Config.QuestText(kind, goal)
		questCount.Text = progress .. " / " .. goal
		shownQuest += (progress / goal - shownQuest) * math.min(1, dt * 10)
		questBar.Size = UDim2.fromScale(math.clamp(shownQuest, 0, 1), 1)
	end

	-- XP bar
	local level = player:GetAttribute("Level") or 1
	local xp = player:GetAttribute("XP") or 0
	local needed = player:GetAttribute("XPNeeded") or 1
	levelLabel.Text = "LV " .. level
	xpText.Text = fmt(xp) .. " / " .. fmt(needed)
	shownXP += (xp / needed - shownXP) * math.min(1, dt * 10)
	xpBar.Size = UDim2.fromScale(math.clamp(shownXP, 0, 1), 1)

	if t - lastSlow > 0.15 then
		lastSlow = t
		refreshShop()
	end
end)

refreshShop()

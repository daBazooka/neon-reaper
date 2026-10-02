-- Starlight Sprint: client. Builds the HUD/shop in code and adds the juice (popups, bobbing orbs, combo bar).
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local CollectionService = game:GetService("CollectionService")
local Debris = game:GetService("Debris")

local player = Players.LocalPlayer
local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
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
	return tostring(n)
end

--------------------------------------------------------------------------------
-- HUD
--------------------------------------------------------------------------------
local gui = make("ScreenGui", { Name = "StarlightHud", ResetOnSpawn = false, IgnoreGuiInset = false }, player:WaitForChild("PlayerGui"))

local dustFrame = styled(make("Frame", {
	Position = UDim2.new(0, 16, 0, 16),
	Size = UDim2.fromOffset(230, 58),
	BackgroundColor3 = Color3.fromRGB(22, 16, 48),
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
	Position = UDim2.new(0, 16, 0, 78),
	Size = UDim2.fromOffset(230, 22),
	BackgroundTransparency = 1,
	Font = Enum.Font.GothamBold,
	TextSize = 16,
	TextXAlignment = Enum.TextXAlignment.Left,
	TextColor3 = Color3.fromRGB(200, 190, 255),
	Text = "",
}, gui)

local comboFrame = styled(make("Frame", {
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 16),
	Size = UDim2.fromOffset(300, 54),
	BackgroundColor3 = Color3.fromRGB(22, 16, 48),
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

local flash = make("Frame", {
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = Color3.new(1, 1, 1),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ZIndex = 50,
}, gui)

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
	BackgroundColor3 = Color3.fromRGB(22, 16, 48),
	BackgroundTransparency = 0.05,
	Visible = false,
}, gui), 16)
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
	btn.Activated:Connect(onClick)
	return { name = name, btn = btn, title = title }
end

for i, def in Config.Upgrades do
	local row = makeRow(i, def.Name, def.Desc, function()
		Action:FireServer("Buy", def.Id)
	end)
	row.def = def
	table.insert(rows, row)
end
local ascendRow = makeRow(10, "🌟 ASCEND", "Reset, +50% dust forever, new aura", function()
	Action:FireServer("Ascend")
end)

shopButton.Activated:Connect(function()
	panel.Visible = not panel.Visible
end)

local GREEN, GREY = Color3.fromRGB(70, 200, 120), Color3.fromRGB(80, 75, 110)
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
-- Juice
--------------------------------------------------------------------------------
local function pop(scaleObj, amount)
	scaleObj.Scale = amount
	TweenService:Create(scaleObj, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Scale = 1 }):Play()
end

local lastDust = 0
player:GetAttributeChangedSignal("Dust"):Connect(function()
	local d = player:GetAttribute("Dust") or 0
	dustLabel.Text = "✨ " .. fmt(d)
	if d > lastDust then
		pop(dustScale, 1.12)
	end
	lastDust = d
end)

local function floatText(pos, text, color, size)
	local anchor = make("Part", {
		Anchored = true,
		CanCollide = false,
		CanTouch = false,
		CanQuery = false,
		Transparency = 1,
		Size = Vector3.one * 0.1,
		Position = pos,
	}, workspace)
	local bb = make("BillboardGui", {
		Adornee = anchor,
		AlwaysOnTop = true,
		Size = UDim2.fromOffset(240, size + 10),
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
	local info = TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	TweenService:Create(bb, info, { StudsOffset = Vector3.new(0, 6, 0) }):Play()
	TweenService:Create(label, TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
		TextTransparency = 1,
		TextStrokeTransparency = 1,
	}):Play()
	Debris:AddItem(anchor, 1.1)
end

local chime
if Config.PickupSoundId ~= "" then
	chime = make("Sound", { SoundId = Config.PickupSoundId, Volume = 0.6 }, gui)
end

Popup.OnClientEvent:Connect(function(kind, a, b, c, d, e, f)
	if kind == "orb" then
		local pos, gained, combo, tier, color = a, b, c, d, e
		local big = tier ~= "Spark" or f ~= nil
		local text = (f and (f:upper() .. "! ") or "") .. "+" .. fmt(gained)
		floatText(pos, text, color, f and 40 or (big and 34 or 24))
		pop(comboScale, 1.15)
		if chime then
			chime.PlaybackSpeed = 1 + math.min(combo, 24) * 0.04
			chime:Play()
		end
	elseif kind == "ascend" then
		flash.BackgroundTransparency = 0
		TweenService:Create(flash, TweenInfo.new(1.2), { BackgroundTransparency = 1 }):Play()
		local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
		if root then
			floatText(root.Position + Vector3.new(0, 4, 0), "ASCENDED!", Config.AuraColor(a), 52)
		end
	end
end)

-- Orbs bob and spin locally so the server never has to animate them.
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

local lastShopRefresh = 0
RunService.RenderStepped:Connect(function()
	local t = os.clock()
	for orb, base in tracked do
		if orb.Parent and not orb:GetAttribute("Taken") then
			orb.CFrame = CFrame.new(base + Vector3.new(0, math.sin(t * 2 + base.X * 0.3) * 0.6, 0)) * CFrame.Angles(0, t, 0)
		end
	end

	-- Combo meter
	local combo = player:GetAttribute("Combo") or 0
	local remaining = (player:GetAttribute("ComboExpire") or 0) - workspace:GetServerTimeNow()
	if combo > 0 and remaining > 0 then
		comboFrame.Visible = true
		local mult = Config.ComboMult(combo)
		comboLabel.Text = string.format("COMBO %d  ·  x%.1f", combo, mult)
		local hot = math.clamp(combo / Config.ComboMax, 0, 1)
		comboLabel.TextColor3 = Color3.new(1, 1, 1):Lerp(Color3.fromRGB(255, 190, 60), hot)
		bar.Size = UDim2.fromScale(math.clamp(remaining / Config.ComboWindow, 0, 1), 1)
		bar.BackgroundColor3 = Color3.fromRGB(90, 210, 255):Lerp(Color3.fromRGB(255, 90, 160), hot)
	else
		comboFrame.Visible = false
	end

	if t - lastShopRefresh > 0.15 then
		lastShopRefresh = t
		refreshShop()
	end
end)

refreshShop()

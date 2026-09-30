-- CATCH A DREAMLING! client: every screen is built here in code.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local Lighting = game:GetService("Lighting")
local MarketplaceService = game:GetService("MarketplaceService")
local SoundService = game:GetService("SoundService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Logic = require(Shared:WaitForChild("Logic"))
local Builder = require(Shared:WaitForChild("Builder"))
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local ToClient = Remotes:WaitForChild("ToClient") :: RemoteEvent
local ToServer = Remotes:WaitForChild("ToServer") :: RemoteEvent

local rgb = Builder.rgb
local FONT = Enum.Font.FredokaOne
local INK = Color3.fromRGB(40, 18, 70)

-- state from the server
local S: any = { sparkles = 0, unclaimed = 0, income = 0, luck = 1, up = {}, jars = {}, dex = {}, quests = {}, stats = {}, carry = {}, slots = 4, bag = 1, rebirths = 0, passes = {}, tut = 0 }

---------------------------------------------------------------- tiny UI kit
local function new(class: string, props: {[string]: any}?, children: {Instance}?): any
	local o = Instance.new(class)
	if props then for k, v in props do if k ~= "Parent" then (o :: any)[k] = v end end end
	if children then for _, c in children do c.Parent = o end end
	if props and props.Parent then o.Parent = props.Parent end
	return o
end
local function corner(r: number?) return new("UICorner", { CornerRadius = UDim.new(0, r or 14) }) end
local function stroke(c: Color3?, t: number?) return new("UIStroke", { Color = c or INK, Thickness = t or 3, ApplyStrokeMode = Enum.ApplyStrokeMode.Border }) end
local function grad(a: Color3, b: Color3, rot: number?) return new("UIGradient", { Color = ColorSequence.new(a, b), Rotation = rot or 90 }) end
local function label(props: {[string]: any}): TextLabel
	local t = new("TextLabel", { BackgroundTransparency = 1, Font = FONT, TextColor3 = Color3.new(1, 1, 1), TextScaled = true })
	for k, v in props do (t :: any)[k] = v end
	if not t:FindFirstChildOfClass("UIStroke") then new("UIStroke", { Color = INK, Thickness = 2, Parent = t }) end
	return t
end
local function button(props: {[string]: any}, c1: Color3, c2: Color3, onClick: () -> ()): TextButton
	local b = new("TextButton", { AutoButtonColor = false, Font = FONT, TextColor3 = Color3.new(1, 1, 1), TextScaled = true, BackgroundColor3 = Color3.new(1, 1, 1) }, { corner(14), stroke(INK, 3), grad(c1, c2) })
	for k, v in props do (b :: any)[k] = v end
	new("UIStroke", { Color = INK, Thickness = 2, ApplyStrokeMode = Enum.ApplyStrokeMode.Contextual, Parent = b })
	new("UIPadding", { PaddingTop = UDim.new(0, 5), PaddingBottom = UDim.new(0, 5), PaddingLeft = UDim.new(0, 6), PaddingRight = UDim.new(0, 6), Parent = b })
	local sc = new("UIScale", { Parent = b })
	b.MouseEnter:Connect(function() TweenService:Create(sc, TweenInfo.new(0.1), { Scale = 1.06 }):Play() end)
	b.MouseLeave:Connect(function() TweenService:Create(sc, TweenInfo.new(0.1), { Scale = 1 }):Play() end)
	b.Activated:Connect(function()
		sc.Scale = 0.9
		TweenService:Create(sc, TweenInfo.new(0.25, Enum.EasingStyle.Back), { Scale = 1 }):Play()
		onClick()
	end)
	return b
end
local function pop(o: GuiObject)
	local sc = o:FindFirstChildOfClass("UIScale") or new("UIScale", { Parent = o })
	sc.Scale = 0.4
	TweenService:Create(sc, TweenInfo.new(0.35, Enum.EasingStyle.Back), { Scale = 1 }):Play()
end

---------------------------------------------------------------- sounds
-- Built-in engine sounds only; set Config-style ids here if you want your own music.
local MUSIC_ID = "" -- e.g. "rbxassetid://1234567890" from the Creator Store audio library
local function sfx(pitch: number, vol: number?)
	local s = new("Sound", { SoundId = "rbxasset://sounds/electronicpingshort.wav", PlaybackSpeed = pitch, Volume = vol or 0.5, Parent = SoundService })
	s:Play()
	s.Ended:Connect(function() s:Destroy() end)
end
local function chord(base: number, n: number)
	for i = 0, n - 1 do task.delay(i * 0.07, function() sfx(base * (2 ^ (({0, 4, 7, 12, 16, 19, 24})[i + 1] / 12)), 0.4) end) end
end
if MUSIC_ID ~= "" then new("Sound", { SoundId = MUSIC_ID, Looped = true, Volume = 0.25, Parent = SoundService }):Play() end

---------------------------------------------------------------- screen
local gui = new("ScreenGui", { Name = "DreamUI", ResetOnSpawn = false, IgnoreGuiInset = true, ZIndexBehavior = Enum.ZIndexBehavior.Sibling, Parent = player:WaitForChild("PlayerGui") })
local uiScale = new("UIScale", { Parent = gui })
local function rescale()
	local v = workspace.CurrentCamera.ViewportSize
	uiScale.Scale = math.clamp(math.min(v.X / 1280, v.Y / 720) * 1.05, 0.55, 1.25)
end
rescale()
workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(rescale)

-- top bar: sparkles and income
local top = new("Frame", { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 12), Size = UDim2.fromOffset(340, 90), BackgroundTransparency = 1, Parent = gui })
local sparkBox = new("Frame", { Size = UDim2.fromOffset(340, 58), BackgroundColor3 = Color3.new(1, 1, 1), Parent = top }, { corner(20), stroke(INK, 3), grad(Color3.fromRGB(120, 70, 220), Color3.fromRGB(70, 35, 150)) })
label({ Text = "✦", Size = UDim2.fromOffset(50, 50), Position = UDim2.fromOffset(8, 4), TextColor3 = Color3.fromRGB(255, 225, 90), Parent = sparkBox })
local sparkLbl = label({ Text = "0", Size = UDim2.new(1, -70, 0, 46), Position = UDim2.fromOffset(58, 6), TextXAlignment = Enum.TextXAlignment.Left, Parent = sparkBox })
local incomeLbl = label({ Text = "+0 /s", Size = UDim2.fromOffset(340, 24), Position = UDim2.fromOffset(0, 62), TextColor3 = Color3.fromRGB(255, 240, 160), Parent = top })
local luckLbl = label({ Text = "", Size = UDim2.fromOffset(160, 20), Position = UDim2.fromOffset(90, 86), TextColor3 = Color3.fromRGB(150, 255, 160), Parent = top })
local collectHint = label({ Text = "", Size = UDim2.fromOffset(420, 22), AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 118), TextColor3 = Color3.fromRGB(255, 230, 120), Parent = gui })

-- event banner (top right)
local evBox = new("Frame", { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -14, 0, 12), Size = UDim2.fromOffset(300, 86), BackgroundColor3 = Color3.new(1, 1, 1), Parent = gui }, { corner(18), stroke(INK, 3), grad(Color3.fromRGB(60, 30, 110), Color3.fromRGB(30, 15, 60)) })
local evTitle = label({ Text = "DREAM EVENT", Size = UDim2.new(1, -16, 0, 30), Position = UDim2.fromOffset(8, 6), Parent = evBox })
local evDesc = label({ Text = "", Size = UDim2.new(1, -16, 0, 20), Position = UDim2.fromOffset(8, 36), TextColor3 = Color3.fromRGB(230, 215, 255), Parent = evBox })
local evTime = label({ Text = "", Size = UDim2.new(1, -16, 0, 22), Position = UDim2.fromOffset(8, 58), TextColor3 = Color3.fromRGB(255, 230, 120), Parent = evBox })

-- announcement slide
local announce = label({ Text = "", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.24, 0), Size = UDim2.fromOffset(900, 46), TextTransparency = 1, Parent = gui })
local annStroke = announce:FindFirstChildOfClass("UIStroke") :: UIStroke
local annToken = 0
local function showAnnounce(text: string, color: {number}?)
	annToken += 1
	local my = annToken
	announce.Text = text
	announce.TextColor3 = if color then rgb(color) else Color3.new(1, 1, 1)
	if color and color[1] + color[2] + color[3] > 700 then announce.TextColor3 = Color3.fromRGB(255, 240, 150) end
	announce.TextTransparency = 0; annStroke.Transparency = 0
	pop(announce)
	task.delay(4.2, function()
		if my ~= annToken then return end
		TweenService:Create(announce, TweenInfo.new(0.6), { TextTransparency = 1 }):Play()
		TweenService:Create(annStroke, TweenInfo.new(0.6), { Transparency = 1 }):Play()
	end)
end

-- toasts
local toastList = new("Frame", { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -110), Size = UDim2.fromOffset(520, 170), BackgroundTransparency = 1, Parent = gui },
	{ new("UIListLayout", { VerticalAlignment = Enum.VerticalAlignment.Bottom, HorizontalAlignment = Enum.HorizontalAlignment.Center, Padding = UDim.new(0, 6) }) })
local function toast(text: string, color: {number}?)
	local f = new("Frame", { Size = UDim2.fromOffset(500, 38), BackgroundColor3 = Color3.new(1, 1, 1), Parent = toastList }, { corner(12), stroke(INK, 2), grad(Color3.fromRGB(90, 50, 170), Color3.fromRGB(60, 30, 120)) })
	label({ Text = text, Size = UDim2.new(1, -16, 1, -8), Position = UDim2.fromOffset(8, 4), TextColor3 = if color then rgb(color) else Color3.new(1, 1, 1), Parent = f })
	pop(f)
	local kids = toastList:GetChildren()
	if #kids > 5 then for i = 2, #kids - 4 do if kids[i]:IsA("Frame") then kids[i]:Destroy() end end end
	task.delay(3.2, function() if f.Parent then f:Destroy() end end)
end

-- floating "+123" numbers
local function floatText(text: string, color: Color3, big: boolean?)
	local t = label({ Text = text, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, math.random(-60, 60), 0.62, 0), Size = UDim2.fromOffset(if big then 420 else 260, if big then 56 else 34), TextColor3 = color, Parent = gui })
	pop(t)
	TweenService:Create(t, TweenInfo.new(1.4, Enum.EasingStyle.Quad), { Position = t.Position - UDim2.fromOffset(0, 140), TextTransparency = 1 }):Play()
	task.delay(1.5, function() t:Destroy() end)
end

---------------------------------------------------------------- side menu and panels
local panels: {[string]: Frame} = {}
local current: string? = nil
local function closePanels() for _, p in panels do p.Visible = false end; current = nil end
local function openPanel(name: string)
	if current == name then closePanels(); return end
	closePanels()
	panels[name].Visible = true
	current = name
	pop(panels[name])
	sfx(1.4, 0.3)
end
local function makePanel(name: string, title: string): (Frame, ScrollingFrame)
	local f = new("Frame", { Name = name, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.52), Size = UDim2.fromOffset(620, 470), BackgroundColor3 = Color3.new(1, 1, 1), Visible = false, Parent = gui }, { corner(24), stroke(INK, 4), grad(Color3.fromRGB(95, 55, 175), Color3.fromRGB(50, 25, 100)) })
	label({ Text = title, Size = UDim2.new(1, -120, 0, 44), Position = UDim2.fromOffset(20, 12), TextXAlignment = Enum.TextXAlignment.Left, Parent = f })
	button({ Text = "X", Size = UDim2.fromOffset(46, 46), Position = UDim2.new(1, -58, 0, 10) }, Color3.fromRGB(255, 110, 130), Color3.fromRGB(210, 50, 90), closePanels).Parent = f
	local body = new("ScrollingFrame", { Position = UDim2.fromOffset(16, 66), Size = UDim2.new(1, -32, 1, -82), BackgroundTransparency = 1, ScrollBarThickness = 8, BorderSizePixel = 0, AutomaticCanvasSize = Enum.AutomaticSize.Y, CanvasSize = UDim2.new(), Parent = f })
	panels[name] = f
	return f, body
end

local menu = new("Frame", { AnchorPoint = Vector2.new(0, 0.5), Position = UDim2.new(0, 12, 0.5, 0), Size = UDim2.fromOffset(92, 470), BackgroundTransparency = 1, Parent = gui }, { new("UIListLayout", { Padding = UDim.new(0, 8) }) })
local badges: {[string]: TextLabel} = {}
local function menuButton(name: string, icon: string, c1: Color3, c2: Color3, fn: () -> ())
	local b = button({ Text = "", Size = UDim2.fromOffset(88, 66) }, c1, c2, fn)
	label({ Text = icon, Size = UDim2.new(1, 0, 0, 34), Position = UDim2.fromOffset(0, 0), Parent = b })
	label({ Text = name, Size = UDim2.new(1, 0, 0, 18), Position = UDim2.fromOffset(0, 36), Parent = b })
	local bd = label({ Text = "!", Size = UDim2.fromOffset(24, 24), Position = UDim2.new(1, -14, 0, -12), BackgroundTransparency = 0, BackgroundColor3 = Color3.fromRGB(255, 60, 100), Visible = false, Parent = b })
	corner(12).Parent = bd
	badges[name] = bd
	b.Parent = menu
end

---------------------------------------------------------------- viewport renders of dreamlings
local function viewport(parent: GuiObject, id: string, mut: string?, silhouette: boolean?): ViewportFrame
	local vf = new("ViewportFrame", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Ambient = Color3.fromRGB(200, 190, 230), LightColor = Color3.new(1, 1, 1), LightDirection = Vector3.new(-1, -1, -1), Parent = parent })
	local m = Builder.build(id, mut, { anchored = true })
	m:PivotTo(CFrame.new())
	if silhouette then
		for _, d in m:GetDescendants() do
			if d:IsA("BasePart") then d.Color = Color3.fromRGB(20, 10, 40); d.Material = Enum.Material.SmoothPlastic end
			if d:IsA("ParticleEmitter") or d:IsA("PointLight") or d:IsA("Sparkles") then d:Destroy() end
		end
	end
	m.Parent = vf
	local cam = new("Camera", { FieldOfView = 40, Parent = vf })
	local size = m:GetExtentsSize().Magnitude
	cam.CFrame = CFrame.lookAt(Vector3.new(0, size * 0.25, -size * 1.45), Vector3.zero)
	vf.CurrentCamera = cam
	return vf
end

---------------------------------------------------------------- shop
local _, shopBody = makePanel("Shop", "DREAM SHOP")
new("UIListLayout", { Padding = UDim.new(0, 8), Parent = shopBody })
local function buildShop()
	for _, c in shopBody:GetChildren() do if c:IsA("Frame") then c:Destroy() end end
	local rows = {}
	for _, u in Config.Upgrades do table.insert(rows, { id = u.id, name = u.name, desc = u.desc, lvl = S.up[u.id] or 0, max = u.max, cost = Logic.upgradeCost(u.id, S.up[u.id] or 0) }) end
	table.insert(rows, { id = "slot", name = "Extra Jar", desc = "Hold one more dreamling on your island", lvl = S.slots - Config.StartSlots, max = Config.MaxSlots - Config.StartSlots, cost = Logic.slotCost(S.slots) })
	for i, r in rows do
		local f = new("Frame", { LayoutOrder = i, Size = UDim2.new(1, -12, 0, 70), BackgroundColor3 = Color3.fromRGB(255, 255, 255), BackgroundTransparency = 0.88, Parent = shopBody }, { corner(14) })
		label({ Text = r.name .. "  (" .. r.lvl .. "/" .. r.max .. ")", Size = UDim2.new(0.62, 0, 0, 30), Position = UDim2.fromOffset(12, 6), TextXAlignment = Enum.TextXAlignment.Left, Parent = f })
		label({ Text = r.desc, Size = UDim2.new(0.62, 0, 0, 22), Position = UDim2.fromOffset(12, 38), TextXAlignment = Enum.TextXAlignment.Left, TextColor3 = Color3.fromRGB(220, 205, 255), Parent = f })
		local maxed = r.lvl >= r.max
		local can = not maxed and S.sparkles >= r.cost
		local b = button({ Text = if maxed then "MAX" else "✦ " .. Logic.fmt(r.cost), Size = UDim2.new(0.32, 0, 0, 50), Position = UDim2.new(0.66, 0, 0, 10) },
			if can then Color3.fromRGB(120, 240, 130) else Color3.fromRGB(150, 140, 170), if can then Color3.fromRGB(40, 170, 80) else Color3.fromRGB(100, 90, 120),
			function()
				if r.id == "slot" then ToServer:FireServer("slot") else ToServer:FireServer("buy", r.id) end
			end)
		b.Parent = f
	end
end

---------------------------------------------------------------- dreamdex
local _, dexBody = makePanel("Dex", "DREAMDEX")
local dexHead = label({ Text = "", Size = UDim2.new(1, -12, 0, 26), TextColor3 = Color3.fromRGB(255, 230, 120), LayoutOrder = 0, Parent = dexBody })
local dexGrid = new("Frame", { Size = UDim2.new(1, -12, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, LayoutOrder = 1, Parent = dexBody }, { new("UIGridLayout", { CellSize = UDim2.fromOffset(128, 150), CellPadding = UDim2.fromOffset(8, 8), SortOrder = Enum.SortOrder.LayoutOrder }) })
new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder, Parent = dexBody })
local dexBuiltFor = ""
local function buildDex()
	local key = ""
	for _, sp in Config.Species do key ..= (if S.dex[sp.id] then "1" else "0") end
	local found = 0
	for _, sp in Config.Species do if S.dex[sp.id] then found += 1 end end
	dexHead.Text = found .. " / " .. #Config.Species .. " dreamlings discovered"
	if key == dexBuiltFor then return end
	dexBuiltFor = key
	for _, c in dexGrid:GetChildren() do if c:IsA("Frame") then c:Destroy() end end
	for i, sp in Config.Species do
		local r = Config.RarityById[sp.rarity]
		local have = S.dex[sp.id] ~= nil
		local card = new("Frame", { LayoutOrder = i, BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 0.85, Parent = dexGrid }, { corner(14), stroke(rgb(r.color), 3) })
		local vp = new("Frame", { Size = UDim2.new(1, 0, 0, 100), BackgroundTransparency = 1, Parent = card })
		viewport(vp, sp.id, nil, not have)
		label({ Text = if have then sp.name else "???", Size = UDim2.new(1, -8, 0, 22), Position = UDim2.fromOffset(4, 100), Parent = card })
		label({ Text = r.name .. (if have then "  x" .. S.dex[sp.id] else ""), Size = UDim2.new(1, -8, 0, 18), Position = UDim2.fromOffset(4, 124), TextColor3 = rgb(r.color), Parent = card })
	end
end

---------------------------------------------------------------- jars
local _, jarBody = makePanel("Jars", "MY JARS")
new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder, Parent = jarBody })
local function buildJars()
	for _, c in jarBody:GetChildren() do if c:IsA("GuiObject") then c:Destroy() end end
	local top_ = new("Frame", { LayoutOrder = 0, Size = UDim2.new(1, -12, 0, 60), BackgroundTransparency = 1, Parent = jarBody })
	label({ Text = #S.jars .. " / " .. S.slots .. " jars  ·  +" .. Logic.fmt(S.income) .. " /s", Size = UDim2.new(0.55, 0, 1, 0), TextXAlignment = Enum.TextXAlignment.Left, Parent = top_ })
	button({ Text = "MERGE 3 → ★", Size = UDim2.new(0.42, 0, 0, 52), Position = UDim2.new(0.58, 0, 0, 4) }, Color3.fromRGB(150, 255, 210), Color3.fromRGB(40, 180, 140), function() ToServer:FireServer("merge") end).Parent = top_
	label({ LayoutOrder = 1, Text = "3 of the same dreamling with the same stars evolve into one with +1 ★ (x3 income)", Size = UDim2.new(1, -12, 0, 20), TextColor3 = Color3.fromRGB(215, 200, 255), Parent = jarBody })
	for i, j in S.jars do
		local sp = Config.SpeciesById[j.id]
		local r = Config.RarityById[sp.rarity]
		local f = new("Frame", { LayoutOrder = 10 + i, Size = UDim2.new(1, -12, 0, 64), BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 0.88, Parent = jarBody }, { corner(12) })
		local vp = new("Frame", { Size = UDim2.fromOffset(64, 64), BackgroundTransparency = 1, Parent = f })
		viewport(vp, j.id, j.mut)
		label({ Text = (if j.mut then Config.MutationById[j.mut].name .. " " else "") .. sp.name .. "  " .. string.rep("★", j.star), Size = UDim2.new(0.5, 0, 0, 30), Position = UDim2.fromOffset(72, 4), TextXAlignment = Enum.TextXAlignment.Left, TextColor3 = rgb(r.color), Parent = f })
		label({ Text = "+" .. Logic.fmt(Logic.jarIncome(j) * Logic.incomeMult(S.rebirths, S.passes.DoubleSparkles == true)) .. " /s", Size = UDim2.new(0.5, 0, 0, 22), Position = UDim2.fromOffset(72, 36), TextXAlignment = Enum.TextXAlignment.Left, TextColor3 = Color3.fromRGB(255, 240, 150), Parent = f })
		local idx = i
		button({ Text = "SELL ✦" .. Logic.fmt(Logic.sellValue(j)), Size = UDim2.new(0.3, 0, 0, 44), Position = UDim2.new(0.68, 0, 0, 10) }, Color3.fromRGB(255, 190, 120), Color3.fromRGB(220, 110, 60), function() ToServer:FireServer("sell", idx) end).Parent = f
	end
end

---------------------------------------------------------------- quests
local _, questBody = makePanel("Quests", "DAILY QUESTS")
new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder, Parent = questBody })
local function buildQuests()
	for _, c in questBody:GetChildren() do if c:IsA("GuiObject") then c:Destroy() end end
	for i, q in S.quests do
		local f = new("Frame", { LayoutOrder = i, Size = UDim2.new(1, -12, 0, 78), BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = if q.done then 0.75 else 0.88, Parent = questBody }, { corner(14) })
		label({ Text = q.text, Size = UDim2.new(0.62, 0, 0, 30), Position = UDim2.fromOffset(12, 8), TextXAlignment = Enum.TextXAlignment.Left, Parent = f })
		local bar = new("Frame", { Size = UDim2.new(0.6, 0, 0, 14), Position = UDim2.fromOffset(12, 50), BackgroundColor3 = Color3.fromRGB(30, 15, 60), Parent = f }, { corner(7) })
		new("Frame", { Size = UDim2.fromScale(math.clamp(q.p / q.n, 0, 1), 1), BackgroundColor3 = Color3.new(1, 1, 1), Parent = bar }, { corner(7), grad(Color3.fromRGB(255, 120, 220), Color3.fromRGB(255, 230, 100), 0) })
		local idx = i
		local can = q.done and not q.claimed
		button({ Text = if q.claimed then "DONE ✓" elseif q.done then "CLAIM!" else q.p .. "/" .. q.n, Size = UDim2.new(0.32, 0, 0, 54), Position = UDim2.new(0.66, 0, 0, 12) },
			if can then Color3.fromRGB(255, 230, 100) else Color3.fromRGB(150, 140, 170), if can then Color3.fromRGB(255, 160, 40) else Color3.fromRGB(100, 90, 120),
			function() if can then ToServer:FireServer("claimQuest", idx) end end).Parent = f
	end
	local streak = S.daily and S.daily.streak or 0
	label({ LayoutOrder = 10, Text = "Daily login streak: day " .. streak .. "  ·  new quests every day!", Size = UDim2.new(1, -12, 0, 26), TextColor3 = Color3.fromRGB(255, 230, 120), Parent = questBody })
	local st = S.stats or {}
	label({ LayoutOrder = 11, Text = "Caught " .. (st.caught or 0) .. " · Rares " .. (st.rares or 0) .. " · Legends " .. (st.legends or 0) .. " · Mutated " .. (st.mutated or 0) .. " · Merges " .. (st.merges or 0), Size = UDim2.new(1, -12, 0, 22), TextColor3 = Color3.fromRGB(215, 200, 255), Parent = questBody })
end

---------------------------------------------------------------- rebirth
local _, rbBody = makePanel("Rebirth", "REBIRTH")
local function buildRebirth()
	for _, c in rbBody:GetChildren() do if c:IsA("GuiObject") then c:Destroy() end end
	local cost = Logic.rebirthCost(S.rebirths)
	label({ Text = "Rebirths: " .. S.rebirths .. "   ·   Income x" .. string.format("%.1f", Logic.incomeMult(S.rebirths, false)), Size = UDim2.new(1, -12, 0, 34), Position = UDim2.fromOffset(0, 10), Parent = rbBody })
	label({ Text = "Rebirth resets your Sparkles, jars and upgrades,\nbut every rebirth gives +50% Sparkles FOREVER.\nYour Dreamdex is kept.", Size = UDim2.new(1, -12, 0, 90), Position = UDim2.fromOffset(0, 56), TextColor3 = Color3.fromRGB(225, 210, 255), Parent = rbBody })
	label({ Text = "Next: x" .. string.format("%.1f", Logic.incomeMult(S.rebirths + 1, false)) .. "  for ✦ " .. Logic.fmt(cost), Size = UDim2.new(1, -12, 0, 34), Position = UDim2.fromOffset(0, 160), TextColor3 = Color3.fromRGB(255, 230, 120), Parent = rbBody })
	local can = S.sparkles >= cost
	button({ Text = if can then "REBIRTH NOW!" else Logic.fmt(math.max(0, cost - S.sparkles)) .. " to go", Size = UDim2.new(0.6, 0, 0, 64), Position = UDim2.new(0.2, 0, 0, 216) },
		if can then Color3.fromRGB(255, 140, 240) else Color3.fromRGB(150, 140, 170), if can then Color3.fromRGB(150, 60, 230) else Color3.fromRGB(100, 90, 120),
		function() if can then ToServer:FireServer("rebirth") end end).Parent = rbBody
	local bar = new("Frame", { Size = UDim2.new(0.8, 0, 0, 18), Position = UDim2.new(0.1, 0, 0, 296), BackgroundColor3 = Color3.fromRGB(30, 15, 60), Parent = rbBody }, { corner(9) })
	new("Frame", { Size = UDim2.fromScale(math.clamp(S.sparkles / cost, 0, 1), 1), BackgroundColor3 = Color3.new(1, 1, 1), Parent = bar }, { corner(9), grad(Color3.fromRGB(255, 120, 220), Color3.fromRGB(150, 90, 255), 0) })
end

---------------------------------------------------------------- robux store
local _, storeBody = makePanel("Store", "DREAM STORE")
new("UIListLayout", { Padding = UDim.new(0, 8), Parent = storeBody })
local STORE_ITEMS = {
	{ kind = "pass", key = "DoubleSparkles", name = "2x Sparkles", desc = "Double Sparkles from every jar, forever" },
	{ kind = "pass", key = "VIP", name = "VIP", desc = "+1 bag slot, +10% luck and a golden VIP tag" },
	{ kind = "pass", key = "AutoCollect", name = "Auto Collect", desc = "Sparkles go straight to you, no pad needed" },
	{ kind = "pass", key = "SuperLuck", name = "Super Luck", desc = "+50% mutation luck forever" },
	{ kind = "product", key = "LuckPotion", name = "Luck Potion", desc = "x2 luck for 10 minutes" },
	{ kind = "product", key = "SparklePack", name = "Sparkle Pack", desc = "30 minutes of income, right now" },
	{ kind = "product", key = "SummonStarfall", name = "Summon Starfall", desc = "Legendaries fall for EVERYONE in the server" },
}
local anyStore = false
for _, it in STORE_ITEMS do
	local id = if it.kind == "pass" then Config.GamePasses[it.key] else Config.Products[it.key]
	if id and id ~= 0 then
		anyStore = true
		local f = new("Frame", { Size = UDim2.new(1, -12, 0, 70), BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 0.88, Parent = storeBody }, { corner(14) })
		label({ Text = it.name, Size = UDim2.new(0.6, 0, 0, 30), Position = UDim2.fromOffset(12, 6), TextXAlignment = Enum.TextXAlignment.Left, TextColor3 = Color3.fromRGB(255, 230, 120), Parent = f })
		label({ Text = it.desc, Size = UDim2.new(0.6, 0, 0, 22), Position = UDim2.fromOffset(12, 38), TextXAlignment = Enum.TextXAlignment.Left, Parent = f })
		button({ Text = "BUY", Size = UDim2.new(0.3, 0, 0, 50), Position = UDim2.new(0.67, 0, 0, 10) }, Color3.fromRGB(120, 240, 130), Color3.fromRGB(40, 170, 80), function()
			if it.kind == "pass" then MarketplaceService:PromptGamePassPurchase(player, id) else MarketplaceService:PromptProductPurchase(player, id) end
		end).Parent = f
	end
end

---------------------------------------------------------------- menu buttons
menuButton("Shop", "🛒", Color3.fromRGB(120, 240, 130), Color3.fromRGB(40, 170, 80), function() buildShop(); openPanel("Shop") end)
menuButton("Jars", "🫙", Color3.fromRGB(120, 210, 255), Color3.fromRGB(50, 120, 230), function() buildJars(); openPanel("Jars") end)
menuButton("Dex", "📖", Color3.fromRGB(255, 190, 120), Color3.fromRGB(230, 110, 60), function() buildDex(); openPanel("Dex") end)
menuButton("Quests", "📜", Color3.fromRGB(255, 230, 100), Color3.fromRGB(255, 160, 40), function() buildQuests(); openPanel("Quests") end)
menuButton("Rebirth", "🔁", Color3.fromRGB(255, 140, 240), Color3.fromRGB(150, 60, 230), function() buildRebirth(); openPanel("Rebirth") end)
if anyStore then menuButton("Store", "💎", Color3.fromRGB(140, 255, 240), Color3.fromRGB(60, 170, 230), function() openPanel("Store") end) end
menuButton("Home", "🏝️", Color3.fromRGB(200, 200, 255), Color3.fromRGB(120, 110, 220), function() ToServer:FireServer("home") end)

local function refreshOpen(cheap: boolean?)
	if current == "Shop" then buildShop() elseif current == "Rebirth" then buildRebirth()
	elseif not cheap then
		if current == "Jars" then buildJars() elseif current == "Dex" then buildDex() elseif current == "Quests" then buildQuests() end
	end
	local ready = false
	for _, q in S.quests do if q.done and not q.claimed then ready = true end end
	badges.Quests.Visible = ready
	local _, merges = Logic.mergeJars(S.jars)
	badges.Jars.Visible = merges > 0
	badges.Rebirth.Visible = S.sparkles >= Logic.rebirthCost(S.rebirths)
	local affordable = false
	for _, u in Config.Upgrades do if (S.up[u.id] or 0) < u.max and S.sparkles >= Logic.upgradeCost(u.id, S.up[u.id] or 0) then affordable = true end end
	badges.Shop.Visible = affordable
end

---------------------------------------------------------------- the big catch reveal
local reveal = new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.45), Size = UDim2.fromOffset(380, 400), BackgroundColor3 = Color3.new(1, 1, 1), Visible = false, Parent = gui }, { corner(28), stroke(INK, 4) })
local revGrad = grad(Color3.fromRGB(100, 60, 190), Color3.fromRGB(40, 20, 90)); revGrad.Parent = reveal
local revTop = label({ Text = "NEW DREAMLING!", Size = UDim2.new(1, -20, 0, 40), Position = UDim2.fromOffset(10, 12), TextColor3 = Color3.fromRGB(255, 230, 120), Parent = reveal })
local revView = new("Frame", { Size = UDim2.new(1, 0, 0, 220), Position = UDim2.fromOffset(0, 50), BackgroundTransparency = 1, Parent = reveal })
local revName = label({ Text = "", Size = UDim2.new(1, -20, 0, 40), Position = UDim2.fromOffset(10, 270), Parent = reveal })
local revRar = label({ Text = "", Size = UDim2.new(1, -20, 0, 26), Position = UDim2.fromOffset(10, 310), Parent = reveal })
local revInfo = label({ Text = "", Size = UDim2.new(1, -20, 0, 24), Position = UDim2.fromOffset(10, 340), TextColor3 = Color3.fromRGB(255, 240, 160), Parent = reveal })
local revLore = label({ Text = "", Size = UDim2.new(1, -20, 0, 20), Position = UDim2.fromOffset(10, 368), TextColor3 = Color3.fromRGB(220, 205, 255), Parent = reveal })
local revSpin: ViewportFrame? = nil
local revToken = 0
local function showReveal(id: string, mut: string?, isNew: boolean, bonus: number, lucky: boolean)
	revToken += 1
	local my = revToken
	local sp = Config.SpeciesById[id]
	local r = Config.RarityById[sp.rarity]
	revTop.Text = if lucky then "LUCKY MUTATION!" elseif isNew then "NEW DREAMLING!" else "CAUGHT!"
	revName.Text = (if mut then Config.MutationById[mut].name .. " " else "") .. sp.name
	revRar.Text = string.upper(r.name)
	revRar.TextColor3 = rgb(r.color)
	revInfo.Text = "+" .. Logic.fmt(Logic.jarIncome({ id = id, mut = mut, star = 1 })) .. " /s in a jar" .. (if bonus > 0 then "   ·   Discovery bonus ✦" .. Logic.fmt(bonus) else "")
	revLore.Text = sp.lore
	revGrad.Color = ColorSequence.new(rgb(r.color):Lerp(Color3.fromRGB(60, 30, 120), 0.55), Color3.fromRGB(30, 15, 70))
	if revSpin then revSpin:Destroy() end
	revSpin = viewport(revView, id, mut)
	reveal.Visible = true
	pop(reveal)
	chord(if r.order >= 5 then 0.8 else 1.1, 3 + math.min(4, r.order))
	local hold = if r.order >= 5 then 3.6 elseif isNew or mut then 2.6 else 1.6
	task.delay(hold, function() if my == revToken then reveal.Visible = false end end)
end
reveal.InputBegan:Connect(function(i) if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then reveal.Visible = false end end)

---------------------------------------------------------------- catch progress bar (above the dreamling)
local catchBB: BillboardGui? = nil
local catchConn: RBXScriptConnection? = nil
local function stopCatchBar()
	if catchConn then catchConn:Disconnect(); catchConn = nil end
	if catchBB then catchBB:Destroy(); catchBB = nil end
end
local function startCatchBar(model: Model, dur: number)
	stopCatchBar()
	local root = model.PrimaryPart
	if not root then return end
	local bb = new("BillboardGui", { Size = UDim2.fromOffset(170, 34), StudsOffsetWorldSpace = Vector3.new(0, model:GetExtentsSize().Y / 2 + 4.5, 0), AlwaysOnTop = true, LightInfluence = 0, Adornee = root, Parent = gui })
	local back = new("Frame", { Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(30, 15, 60), Parent = bb }, { corner(12), stroke(Color3.new(1, 1, 1), 2) })
	local fill = new("Frame", { Size = UDim2.fromScale(0, 1), BackgroundColor3 = Color3.new(1, 1, 1), Parent = back }, { corner(12), grad(Color3.fromRGB(120, 255, 200), Color3.fromRGB(255, 230, 100), 0) })
	label({ Text = "CATCHING...", Size = UDim2.fromScale(1, 1), Parent = back })
	catchBB = bb
	local t0 = os.clock()
	local lastTick = 0
	catchConn = RunService.RenderStepped:Connect(function()
		local k = math.clamp((os.clock() - t0) / dur, 0, 1)
		fill.Size = UDim2.fromScale(k, 1)
		if k - lastTick > 0.2 then lastTick = k; sfx(0.8 + k, 0.15) end
	end)
end

---------------------------------------------------------------- tutorial guide beam
local guideA0 = new("Attachment", { Name = "GuideA0" })
local guideA1 = new("Attachment", { Name = "GuideA1" })
local guideAnchor = new("Part", { Name = "GuideAnchor", Anchored = true, CanCollide = false, CanQuery = false, CanTouch = false, Transparency = 1, Size = Vector3.one, Parent = workspace })
guideA1.Parent = guideAnchor
local guideBeam = new("Beam", { Attachment0 = guideA0, Attachment1 = guideA1, Width0 = 1.2, Width1 = 1.2, FaceCamera = true, LightEmission = 1, TextureSpeed = 2, Color = ColorSequence.new(Color3.fromRGB(255, 240, 120), Color3.fromRGB(255, 120, 220)), Transparency = NumberSequence.new(0.2), Enabled = false, Parent = guideAnchor })
local hint = label({ Text = "", AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 150), Size = UDim2.fromOffset(760, 34), TextColor3 = Color3.fromRGB(255, 255, 255), Parent = gui })

local function myPlot(): Instance?
	local plots = workspace:FindFirstChild("Plots")
	if not plots then return nil end
	for _, f in plots:GetChildren() do
		local sign = f:FindFirstChild("Sign")
		local sg = sign and sign:FindFirstChildOfClass("SurfaceGui")
		local t = sg and sg:FindFirstChildOfClass("TextLabel")
		if t and string.find(t.Text, player.DisplayName .. "'s Island", 1, true) then return f end
	end
	return nil
end

local function updateGuide()
	local char = player.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not hrp then guideBeam.Enabled = false; return end
	guideA0.Parent = hrp
	local target: Vector3? = nil
	local text = ""
	if #S.carry > 0 and (#S.carry >= S.bag or S.tut < 2) then
		local plot = myPlot()
		local pad = plot and plot:FindFirstChild("CollectPad") :: BasePart?
		if pad then target = pad.Position; text = if #S.jars >= S.slots then "Your jars are full! Merge, sell or buy a jar" else "Bring your dreamling home to your island!" end
	elseif S.tut < 1 or (S.tut < 3 and #S.carry == 0 and S.unclaimed < 5) then
		local best, bd = nil, math.huge
		local folder = workspace:FindFirstChild("Dreamlings")
		if folder then
			for _, m in folder:GetChildren() do
				local root = (m :: Model).PrimaryPart
				if root then local d = (root.Position - hrp.Position).Magnitude; if d < bd then bd = d; best = root end end
			end
		end
		if best then target = best.Position; text = "Walk up to a dreamling and press E (or tap) to catch it!" end
	elseif S.unclaimed >= 5 and S.tut < 3 then
		local plot = myPlot()
		local pad = plot and plot:FindFirstChild("CollectPad") :: BasePart?
		if pad then target = pad.Position; text = "Step on your glowing pad to collect Sparkles!" end
	elseif S.tut < 4 then
		text = "Open the SHOP and buy your first upgrade!"
	end
	if target then guideAnchor.Position = target + Vector3.new(0, 3, 0) end
	guideBeam.Enabled = target ~= nil
	hint.Text = text
end

---------------------------------------------------------------- event banner and visuals
local disco: {PointLight} = {}
local cc = Lighting:WaitForChild("DreamColor", 10) :: ColorCorrectionEffect?
local function eventVisuals(dt: number)
	local id = workspace:GetAttribute("EventId") :: string?
	local now = workspace:GetServerTimeNow()
	if id and id ~= "" then
		local e = Config.EventById[id]
		local left = math.max(0, math.floor((workspace:GetAttribute("EventEnds") :: number? or now) - now))
		evTitle.Text = e.name
		evTitle.TextColor3 = if id == "secret" then Color3.fromRGB(200, 170, 255) else rgb(e.color)
		evDesc.Text = e.desc
		evTime.Text = "ends in " .. left .. "s"
	else
		local nextAt = workspace:GetAttribute("NextEvent") :: number?
		local left = if nextAt then math.max(0, math.floor(nextAt - now)) else 0
		evTitle.Text = "NEXT DREAM EVENT"
		evTitle.TextColor3 = Color3.new(1, 1, 1)
		evDesc.Text = "Something magical is coming..."
		evTime.Text = string.format("%d:%02d", left // 60, left % 60)
	end
	if cc then
		local t = os.clock()
		if id == "disco" then cc.TintColor = Color3.fromHSV((t * 0.5) % 1, 0.35, 1)
		elseif id == "rainbow" then cc.TintColor = Color3.fromHSV((t * 0.15) % 1, 0.2, 1)
		elseif id == "secret" then cc.TintColor = Color3.fromRGB(190, 170, 255)
		elseif id == "golden" then cc.TintColor = Color3.fromRGB(255, 225, 180)
		else cc.TintColor = cc.TintColor:Lerp(Color3.fromRGB(255, 245, 255), math.min(1, dt * 2)) end
	end
	-- disco lights around the player
	if id == "disco" then
		if #disco == 0 then
			local char = player.Character
			local hrp = char and char:FindFirstChild("HumanoidRootPart")
			if hrp then for i = 1, 3 do table.insert(disco, new("PointLight", { Range = 28, Brightness = 3, Parent = hrp })) end end
		end
		for i, l in disco do l.Color = Color3.fromHSV((os.clock() * 0.7 + i / 3) % 1, 1, 1) end
	elseif #disco > 0 then
		for _, l in disco do l:Destroy() end
		disco = {}
	end
end

-- rainbow and disco dreamlings shimmer (client-side, so it is smooth)
local function shimmer()
	local t = os.clock()
	local function paint(m: Instance)
		if not m:IsA("Model") then return end
		local rb, dc = m:GetAttribute("Rainbow"), m:GetAttribute("Disco")
		if not rb and not dc then return end
		local root = (m :: Model).PrimaryPart
		if not root then return end
		local h = (t * (if dc then 1.2 else 0.35)) % 1
		root.Color = Color3.fromHSV(h, if dc then 0.9 else 0.55, 1)
		for _, d in m:GetChildren() do
			if d:IsA("BasePart") and d ~= root and (d.Name == "Ear" or d.Name == "Wing" or d.Name == "Puff" or d.Name == "Drip" or d.Name == "Spike") then
				d.Color = Color3.fromHSV((h + 0.2) % 1, 0.6, 1)
			end
		end
	end
	local wildF = workspace:FindFirstChild("Dreamlings")
	if wildF then for _, m in wildF:GetChildren() do paint(m) end end
	local plots = workspace:FindFirstChild("Plots")
	if plots then
		for _, f in plots:GetChildren() do
			local jars = f:FindFirstChild("Jars")
			if jars then for _, m in jars:GetChildren() do paint(m) end end
		end
	end
	for _, p in Players:GetPlayers() do if p.Character then for _, m in p.Character:GetChildren() do paint(m) end end end
end

-- camera shake for starfall impacts
local shakeAmt = 0
RunService:BindToRenderStep("DreamShake", Enum.RenderPriority.Camera.Value + 1, function(dt)
	if shakeAmt > 0.01 then
		local cam = workspace.CurrentCamera
		cam.CFrame *= CFrame.Angles(math.rad(math.random(-10, 10) * shakeAmt * 0.1), math.rad(math.random(-10, 10) * shakeAmt * 0.1), 0)
		shakeAmt *= math.exp(-dt * 5)
	end
end)

---------------------------------------------------------------- server messages
local lastSpark = 0
ToClient.OnClientEvent:Connect(function(kind: string, a: any, b: any, c: any, d: any, e: any)
	if kind == "sync" then
		S = a
		refreshOpen()
	elseif kind == "stats" then
		S.sparkles, S.unclaimed, S.income, S.luck = a, b, c, d
	elseif kind == "toast" then
		toast(a, b)
	elseif kind == "announce" then
		showAnnounce(a, b)
		chord(1, 4)
	elseif kind == "catchStart" then
		startCatchBar(a, b)
	elseif kind == "catchEnd" then
		stopCatchBar()
		if not a and b then toast(b, {255, 160, 140}); sfx(0.5, 0.4) end
	elseif kind == "caught" then
		local id, mut, isNew, bonus, lucky = a, b, c, d, e
		local r = Config.RarityById[Config.SpeciesById[id].rarity]
		if isNew or mut or r.order >= 3 or lucky then showReveal(id, mut, isNew, bonus, lucky)
		else floatText("Caught " .. Config.SpeciesById[id].name .. "!", rgb(r.color)); chord(1.2, 2) end
		if S.tut < 1 then ToServer:FireServer("tut", 1) end
	elseif kind == "deposit" then
		floatText("+" .. a .. " in your jars!", Color3.fromRGB(150, 230, 255), true)
		chord(1, 3)
		if S.tut < 2 then ToServer:FireServer("tut", 2) end
	elseif kind == "collect" then
		floatText("+" .. Logic.fmt(a) .. " ✦", Color3.fromRGB(255, 230, 90), true)
		for i = 0, 5 do task.delay(i * 0.05, function() sfx(1.2 + i * 0.12, 0.3) end) end
		if S.tut < 3 then ToServer:FireServer("tut", 3) end
	elseif kind == "candy" then
		floatText("+" .. Logic.fmt(a) .. " ✦", Color3.fromRGB(255, 170, 220))
		sfx(1.6 + math.random() * 0.4, 0.3)
	elseif kind == "bought" then
		chord(1.3, 3)
		if S.tut < 4 then ToServer:FireServer("tut", 4) end
	elseif kind == "merged" then
		floatText("MERGED x" .. a .. "! ★", Color3.fromRGB(150, 255, 210), true)
		chord(0.9, 6)
	elseif kind == "reborn" then
		floatText("REBORN! x" .. string.format("%.1f", Logic.incomeMult(a, false)) .. " forever", Color3.fromRGB(255, 150, 240), true)
		chord(0.7, 7)
		closePanels()
	elseif kind == "reward" then
		floatText(a .. ": +" .. Logic.fmt(b) .. " ✦", Color3.fromRGB(255, 230, 90), true)
		chord(1, 5)
	elseif kind == "offline" then
		toast("Welcome back! Your jars made " .. Logic.fmt(a) .. " Sparkles while you were away. Collect them on your pad!", {255, 230, 120})
	elseif kind == "daily" then
		showAnnounce("DAY " .. a .. " LOGIN GIFT: +" .. Logic.fmt(b) .. " ✦" .. (if c > 0 then "  +" .. c .. " min x2 luck" else ""), {255, 220, 90})
		chord(1, 5)
	elseif kind == "event" then
		local ev = Config.EventById[a]
		showAnnounce("✨ " .. ev.name .. "! " .. ev.desc .. (if b then "  (summoned by " .. b .. ")" else ""), ev.color)
		chord(0.9, 6)
		pop(evBox)
	elseif kind == "eventEnd" then
		toast("The dream event is over", {215, 200, 255})
	elseif kind == "impact" then
		local char = player.Character
		local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
		if hrp and (hrp.Position - a).Magnitude < 160 then shakeAmt = 1.2 end
		sfx(0.4, 0.6)
	end
end)

---------------------------------------------------------------- per-frame UI
local shownSpark = 0
local acc, acc2 = 0, 0
RunService.Heartbeat:Connect(function(dt)
	shownSpark += (S.sparkles - shownSpark) * math.min(1, dt * 8)
	if math.abs(S.sparkles - shownSpark) < 1 then shownSpark = S.sparkles end
	sparkLbl.Text = Logic.fmt(shownSpark)
	incomeLbl.Text = "+" .. Logic.fmt(S.income) .. " /s   ·   " .. #S.carry .. "/" .. S.bag .. " carried"
	luckLbl.Text = if S.luck and S.luck > 1.01 then "🍀 luck x" .. string.format("%.1f", S.luck) else ""
	collectHint.Text = if S.unclaimed >= 1 then "✦ " .. Logic.fmt(S.unclaimed) .. " waiting on your collect pad" else ""
	acc += dt
	if acc > 0.1 then acc = 0; shimmer() end
	acc2 += dt
	if acc2 > 0.25 then
		acc2 = 0
		updateGuide()
		eventVisuals(0.25)
		if math.floor(S.sparkles) ~= lastSpark then lastSpark = math.floor(S.sparkles); refreshOpen(true) end
	end
end)

UserInputService.InputBegan:Connect(function(i, gp)
	if gp then return end
	if i.KeyCode == Enum.KeyCode.Q then buildShop(); openPanel("Shop") end
	if i.KeyCode == Enum.KeyCode.Escape then closePanels() end
end)

ToServer:FireServer("sync")

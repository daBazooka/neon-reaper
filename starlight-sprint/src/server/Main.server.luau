-- Starlight Sprint: server. Builds the world, runs orbs/combos/upgrades/ascension, saves data.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local DataStoreService = game:GetService("DataStoreService")
local Lighting = game:GetService("Lighting")
local Debris = game:GetService("Debris")
local CollectionService = game:GetService("CollectionService")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local Action = Instance.new("RemoteEvent")
Action.Name = "Action"
Action.Parent = ReplicatedStorage
local Popup = Instance.new("RemoteEvent")
Popup.Name = "Popup"
Popup.Parent = ReplicatedStorage

local upgradeById = {}
for _, def in Config.Upgrades do
	upgradeById[def.Id] = def
end

--------------------------------------------------------------------------------
-- World
--------------------------------------------------------------------------------
local HUB_RADIUS = 150
local ISLAND_COUNT = 6
local ISLAND_RADIUS = 20
local RING = 105
local STEP_HEIGHT = 32

local function newPart(props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in props do
		p[k] = v
	end
	return p
end

local function disk(parent, name, center, radius, thickness, color, material)
	-- A flat cylinder whose top face sits at center.Y.
	return newPart({
		Name = name,
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(thickness, radius * 2, radius * 2),
		CFrame = CFrame.new(center.X, center.Y - thickness / 2, center.Z) * CFrame.Angles(0, 0, math.pi / 2),
		Color = color,
		Material = material or Enum.Material.SmoothPlastic,
		Parent = parent,
	})
end

local function sparkles(parent, color, rate, size, speed)
	local e = Instance.new("ParticleEmitter")
	e.Color = ColorSequence.new(color)
	e.LightEmission = 1
	e.Rate = rate
	e.Lifetime = NumberRange.new(1.5, 3)
	e.Speed = NumberRange.new(speed * 0.5, speed)
	e.SpreadAngle = Vector2.new(180, 180)
	e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, size), NumberSequenceKeypoint.new(1, 0) })
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(1, 1) })
	e.Parent = parent
	return e
end

local function setupLighting()
	Lighting.ClockTime = 0
	Lighting.Brightness = 1.5
	Lighting.Ambient = Color3.fromRGB(60, 40, 110)
	Lighting.OutdoorAmbient = Color3.fromRGB(70, 50, 130)
	Lighting.GlobalShadows = true

	local atmo = Instance.new("Atmosphere")
	atmo.Density = 0.35
	atmo.Color = Color3.fromRGB(150, 110, 255)
	atmo.Decay = Color3.fromRGB(60, 30, 120)
	atmo.Haze = 1.5
	atmo.Parent = Lighting

	local bloom = Instance.new("BloomEffect")
	bloom.Intensity = 1.2
	bloom.Size = 28
	bloom.Threshold = 0.8
	bloom.Parent = Lighting

	local cc = Instance.new("ColorCorrectionEffect")
	cc.Saturation = 0.25
	cc.Contrast = 0.1
	cc.Parent = Lighting
end

local islandTops = {} -- Vector3 of each island's top centre
local hubPadPos, hubPadTarget

local function launchVelocity(from, to, t)
	-- Ballistic arc that lands exactly on `to` after t seconds.
	return (to - from) / t + Vector3.new(0, 0.5 * workspace.Gravity * t, 0)
end

local launchDebounce = {}
local function makePad(parent, pos, target, color)
	local pad = disk(parent, "LaunchPad", pos, 5, 0.6, color, Enum.Material.Neon)
	pad.CanCollide = true
	local ring = disk(parent, "LaunchRing", pos + Vector3.new(0, 0.05, 0), 3, 0.1, Color3.new(1, 1, 1), Enum.Material.Neon)
	ring.CanCollide = false
	sparkles(pad, color, 25, 0.6, 8).EmissionDirection = Enum.NormalId.Top

	local t = 1.8
	pad.Touched:Connect(function(hit)
		local char = hit.Parent
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		local root = char and char:FindFirstChild("HumanoidRootPart")
		if not hum or not root or hum.Health <= 0 then
			return
		end
		if launchDebounce[char] and os.clock() - launchDebounce[char] < 1.5 then
			return
		end
		launchDebounce[char] = os.clock()
		root.AssemblyLinearVelocity = launchVelocity(root.Position, target, t)
		hum:ChangeState(Enum.HumanoidStateType.Freefall)
	end)
end

local function buildWorld()
	for _, child in workspace:GetChildren() do
		if child.Name == "Baseplate" then
			child:Destroy()
		end
	end
	setupLighting()

	local world = Instance.new("Folder")
	world.Name = "World"
	world.Parent = workspace

	-- Hub: dark ground with a glowing rim.
	disk(world, "HubRim", Vector3.new(0, -0.4, 0), HUB_RADIUS + 3, 1.5, Color3.fromRGB(120, 80, 255), Enum.Material.Neon)
	disk(world, "Hub", Vector3.new(0, 0, 0), HUB_RADIUS, 4, Color3.fromRGB(25, 20, 50))
	disk(world, "HubGlow", Vector3.new(0, 0.05, 0), 18, 0.1, Color3.fromRGB(90, 210, 255), Enum.Material.Neon).CanCollide =
		false

	local spawn = Instance.new("SpawnLocation")
	spawn.Anchored = true
	spawn.Size = Vector3.new(12, 1, 12)
	spawn.Position = Vector3.new(0, 0.5, 0)
	spawn.Transparency = 1
	spawn.CanCollide = false
	spawn.Duration = 0
	spawn.Parent = world

	-- Floating fireflies over the hub.
	local fireflyVolume = newPart({
		Name = "Fireflies",
		Size = Vector3.new(HUB_RADIUS * 2, 40, HUB_RADIUS * 2),
		Position = Vector3.new(0, 22, 0),
		Transparency = 1,
		CanCollide = false,
		CanQuery = false,
		CanTouch = false,
		Parent = world,
	})
	sparkles(fireflyVolume, Color3.fromRGB(180, 160, 255), 60, 0.5, 2)

	-- Sky islands spiral upward.
	for i = 1, ISLAND_COUNT do
		local angle = math.rad(i * 60)
		local top = Vector3.new(math.cos(angle) * RING, i * STEP_HEIGHT, math.sin(angle) * RING)
		islandTops[i] = top
		local color = Config.Auras[(i - 1) % #Config.Auras + 1]
		disk(world, "IslandRim" .. i, top - Vector3.new(0, 0.3, 0), ISLAND_RADIUS + 1.5, 1.5, color, Enum.Material.Neon)
		disk(world, "Island" .. i, top, ISLAND_RADIUS, 5, Color3.fromRGB(35, 28, 70))
		local under = disk(world, "IslandUnder" .. i, top - Vector3.new(0, 5, 0), ISLAND_RADIUS * 0.55, 10, Color3.fromRGB(20, 15, 45))
		under.CanCollide = false
	end

	-- Launch pads chain hub -> island 1 -> ... -> island N -> back to the hub.
	local function inward(top, dist)
		local flat = Vector3.new(top.X, 0, top.Z).Unit
		return flat * dist
	end
	for i = 0, ISLAND_COUNT do
		local from, target
		if i == 0 then
			local flat = inward(islandTops[1], 70)
			from = Vector3.new(flat.X, 0.3, flat.Z)
			target = islandTops[1] + Vector3.new(0, 4, 0)
		else
			local nextTop = islandTops[i + 1] or Vector3.new(0, 0, 0)
			local toward = Vector3.new(nextTop.X - islandTops[i].X, 0, nextTop.Z - islandTops[i].Z).Unit
			from = islandTops[i] + toward * 13 + Vector3.new(0, 0.3, 0)
			target = nextTop + Vector3.new(0, 4, 0)
		end
		local color = Config.Auras[i % #Config.Auras + 1]
		makePad(world, from, target, color)
	end
end

--------------------------------------------------------------------------------
-- Orbs
--------------------------------------------------------------------------------
local orbFolder = Instance.new("Folder")
orbFolder.Name = "Orbs"
orbFolder.Parent = workspace

local orbSlots = {} -- { pos = Vector3, luck = number }
local liveOrbs = {} -- orb Part -> slot
local rng = Random.new()

local function pickOrbType(luck)
	local total = 0
	local weights = {}
	for i, t in Config.OrbTypes do
		local w = t.Weight * (i >= 3 and (1 + luck * 0.7) or 1)
		weights[i] = w
		total += w
	end
	local roll = rng:NextNumber() * total
	for i, t in Config.OrbTypes do
		roll -= weights[i]
		if roll <= 0 then
			return t
		end
	end
	return Config.OrbTypes[1]
end

local function spawnOrb(slot)
	local t = pickOrbType(slot.luck)
	local orb = Instance.new("Part")
	orb.Name = "Orb"
	orb.Shape = Enum.PartType.Ball
	orb.Size = Vector3.one * (1.4 + t.Scale)
	orb.Material = Enum.Material.Neon
	orb.Color = t.Color
	orb.Anchored = true
	orb.CanCollide = false
	orb.CanTouch = false
	orb.CanQuery = false
	orb.CastShadow = false
	orb.Position = slot.pos
	orb:SetAttribute("Value", t.Value)
	orb:SetAttribute("Tier", t.Name)

	local light = Instance.new("PointLight")
	light.Color = t.Color
	light.Range = 8 + t.Scale * 6
	light.Brightness = 1.5
	light.Parent = orb
	sparkles(orb, t.Color, 4 + t.Value ^ 0.5, 0.35, 2)

	CollectionService:AddTag(orb, "Orb")
	orb.Parent = orbFolder
	liveOrbs[orb] = slot
end

local function buildOrbs()
	-- Ground orbs scattered over the hub.
	for _ = 1, 90 do
		local a = rng:NextNumber() * math.pi * 2
		local r = math.sqrt(rng:NextNumber()) * (HUB_RADIUS - 8)
		table.insert(orbSlots, { pos = Vector3.new(math.cos(a) * r, 3.2, math.sin(a) * r), luck = 0 })
	end
	-- Island orbs are richer the higher you climb.
	for i, top in islandTops do
		for _ = 1, 12 do
			local a = rng:NextNumber() * math.pi * 2
			local r = math.sqrt(rng:NextNumber()) * (ISLAND_RADIUS - 3)
			table.insert(orbSlots, { pos = top + Vector3.new(math.cos(a) * r, 3.2, math.sin(a) * r), luck = i * 2 })
		end
	end
	for _, slot in orbSlots do
		spawnOrb(slot)
	end
end

--------------------------------------------------------------------------------
-- Player state
--------------------------------------------------------------------------------
local store = DataStoreService:GetDataStore("StarlightSprintV1")
local loaded = {}

local function getDust(p)
	return p:GetAttribute("Dust") or 0
end

local function setDust(p, v)
	v = math.max(0, math.floor(v))
	p:SetAttribute("Dust", v)
	local ls = p:FindFirstChild("leaderstats")
	if ls then
		ls.Stardust.Value = v
	end
end

local function applyAura(p)
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if not root then
		return
	end
	for _, c in root:GetChildren() do
		if c.Name == "Aura" or c.Name == "AuraA0" or c.Name == "AuraA1" then
			c:Destroy()
		end
	end
	local color = Config.AuraColor(p:GetAttribute("Ascensions") or 0)

	local a0 = Instance.new("Attachment")
	a0.Name = "AuraA0"
	a0.Position = Vector3.new(0, 1, 0)
	a0.Parent = root
	local a1 = Instance.new("Attachment")
	a1.Name = "AuraA1"
	a1.Position = Vector3.new(0, -1, 0)
	a1.Parent = root
	local trail = Instance.new("Trail")
	trail.Name = "Aura"
	trail.Attachment0 = a0
	trail.Attachment1 = a1
	trail.Lifetime = 0.7
	trail.LightEmission = 1
	trail.Color = ColorSequence.new(color, Color3.new(1, 1, 1))
	trail.Transparency = NumberSequence.new(0.1, 1)
	trail.Parent = root

	local e = sparkles(root, color, 14, 0.4, 3)
	e.Name = "Aura"
end

local function applyStats(p)
	p:SetAttribute("MagnetRadius", Config.MagnetRadius(p:GetAttribute("Lv_Magnet") or 0))
	local hum = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
	if not hum then
		return
	end
	hum.WalkSpeed = 16 + (p:GetAttribute("Lv_Speed") or 0) * 1.5
	hum.UseJumpPower = false
	hum.JumpHeight = 7.2 + (p:GetAttribute("Lv_Jump") or 0) * 0.9
end

local function loadPlayer(p)
	local ls = Instance.new("Folder")
	ls.Name = "leaderstats"
	local dustVal = Instance.new("IntValue")
	dustVal.Name = "Stardust"
	dustVal.Parent = ls
	local ascVal = Instance.new("IntValue")
	ascVal.Name = "Ascensions"
	ascVal.Parent = ls
	ls.Parent = p

	local data
	local ok, err = pcall(function()
		data = store:GetAsync("u" .. p.UserId)
	end)
	if not ok then
		warn("[Starlight] load failed (saving disabled for this session):", err)
	else
		loaded[p] = true
	end
	data = data or {}

	p:SetAttribute("Ascensions", data.Ascensions or 0)
	for _, def in Config.Upgrades do
		p:SetAttribute("Lv_" .. def.Id, (data.Levels and data.Levels[def.Id]) or 0)
	end
	p:SetAttribute("Combo", 0)
	p:SetAttribute("ComboExpire", 0)
	setDust(p, data.Dust or 0)
	ascVal.Value = p:GetAttribute("Ascensions")
	applyStats(p)
end

local function savePlayer(p)
	if not loaded[p] then
		return
	end
	local levels = {}
	for _, def in Config.Upgrades do
		levels[def.Id] = p:GetAttribute("Lv_" .. def.Id) or 0
	end
	local payload = { Dust = getDust(p), Ascensions = p:GetAttribute("Ascensions") or 0, Levels = levels }
	local ok, err = pcall(function()
		store:SetAsync("u" .. p.UserId, payload)
	end)
	if not ok then
		warn("[Starlight] save failed:", err)
	end
end

Players.PlayerAdded:Connect(function(p)
	loadPlayer(p)
	p.CharacterAdded:Connect(function(char)
		char:WaitForChild("HumanoidRootPart")
		char:WaitForChild("Humanoid")
		applyStats(p)
		applyAura(p)
	end)
	if p.Character then
		applyStats(p)
		applyAura(p)
	end
end)

Players.PlayerRemoving:Connect(function(p)
	savePlayer(p)
	loaded[p] = nil
end)

game:BindToClose(function()
	if RunService:IsStudio() then
		return
	end
	for _, p in Players:GetPlayers() do
		task.spawn(savePlayer, p)
	end
	task.wait(3)
end)

task.spawn(function()
	while true do
		task.wait(60)
		for _, p in Players:GetPlayers() do
			task.spawn(savePlayer, p)
		end
	end
end)

--------------------------------------------------------------------------------
-- Collecting
--------------------------------------------------------------------------------
local function collect(p, orb, root)
	local slot = liveOrbs[orb]
	if not slot then
		return
	end
	liveOrbs[orb] = nil
	orb:SetAttribute("Taken", true)

	local now = workspace:GetServerTimeNow()
	local combo = p:GetAttribute("Combo") or 0
	if now > (p:GetAttribute("ComboExpire") or 0) then
		combo = 0
	end
	combo = math.min(combo + 1, Config.ComboMax)
	p:SetAttribute("Combo", combo)
	p:SetAttribute("ComboExpire", now + Config.ComboWindow)

	local mult = Config.Multiplier(p:GetAttribute("Lv_Value") or 0, p:GetAttribute("Ascensions") or 0, combo)
	local gained = math.max(1, math.floor(orb:GetAttribute("Value") * mult))
	setDust(p, getDust(p) + gained)

	Popup:FireClient(p, "orb", orb.Position, gained, combo, orb:GetAttribute("Tier"), orb.Color)

	-- Fly into the player, then vanish.
	local tween = TweenService:Create(orb, TweenInfo.new(0.18, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
		Position = root.Position,
		Size = Vector3.one * 0.2,
	})
	tween:Play()
	Debris:AddItem(orb, 0.25)

	task.delay(Config.RespawnTime, function()
		spawnOrb(slot)
	end)
end

local accumulator = 0
RunService.Heartbeat:Connect(function(dt)
	accumulator += dt
	if accumulator < 0.1 then
		return
	end
	accumulator = 0

	for _, p in Players:GetPlayers() do
		local char = p.Character
		local root = char and char:FindFirstChild("HumanoidRootPart")
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		if root and hum and hum.Health > 0 then
			local radius = p:GetAttribute("MagnetRadius") or Config.StartingMagnet
			local pos = root.Position
			for orb in liveOrbs do
				if (orb.Position - pos).Magnitude <= radius then
					collect(p, orb, root)
				end
			end
		end
	end
end)

--------------------------------------------------------------------------------
-- Shop + ascension
--------------------------------------------------------------------------------
Action.OnServerEvent:Connect(function(p, action, id)
	if action == "Buy" and typeof(id) == "string" then
		local def = upgradeById[id]
		if not def then
			return
		end
		local level = p:GetAttribute("Lv_" .. id) or 0
		if level >= def.Max then
			return
		end
		local cost = Config.UpgradeCost(def, level)
		if getDust(p) < cost then
			return
		end
		setDust(p, getDust(p) - cost)
		p:SetAttribute("Lv_" .. id, level + 1)
		applyStats(p)
	elseif action == "Ascend" then
		local asc = p:GetAttribute("Ascensions") or 0
		if getDust(p) < Config.AscendCost(asc) then
			return
		end
		setDust(p, 0)
		for _, def in Config.Upgrades do
			p:SetAttribute("Lv_" .. def.Id, 0)
		end
		p:SetAttribute("Ascensions", asc + 1)
		p.leaderstats.Ascensions.Value = asc + 1
		applyStats(p)
		applyAura(p)

		local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
		if root then
			local burst = sparkles(root, Config.AuraColor(asc + 1), 0, 1.2, 30)
			burst:Emit(150)
			Debris:AddItem(burst, 4)
		end
		Popup:FireClient(p, "ascend", asc + 1)
	end
end)

--------------------------------------------------------------------------------
buildWorld()
buildOrbs()

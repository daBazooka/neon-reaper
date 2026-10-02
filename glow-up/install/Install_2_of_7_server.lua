-- GLOW UP installer 2 of 7 (server).
-- HOW TO USE: stop any running test, paste this WHOLE script into the Command Bar
-- (the bar at the bottom of Studio) and press Enter. Then run the next installer.
local RS = game:GetService("ReplicatedStorage")
local SSS = game:GetService("ServerScriptService")
local SPS = game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts")

local function remove(parent, name)
	for _, child in parent:GetChildren() do
		if child.Name == name then
			child:Destroy()
		end
	end
end

local function getOrMake(class, name, parent)
	local existing = parent:FindFirstChild(name)
	if existing and existing.ClassName == class then
		return existing
	end
	if existing then
		existing:Destroy()
	end
	local inst = Instance.new(class)
	inst.Name = name
	inst.Parent = parent
	return inst
end

local created = 0
local function put(class, name, parent, source)
	local inst = getOrMake(class, name, parent)
	inst.Source = source
	created += 1
	return inst
end

put("Script", "Main", SSS, [=====[
-- GLOW UP: server entry point. Creates the network channels, builds the world, wires every
-- system together, and routes client requests.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))

-- Network channels: Action = client asks the server, Notify = server tells the client.
local net = Instance.new("Folder")
net.Name = "Net"
net.Parent = ReplicatedStorage
local Action = Instance.new("RemoteEvent")
Action.Name = "Action"
Action.Parent = net
local Notify = Instance.new("RemoteEvent")
Notify.Name = "Notify"
Notify.Parent = net

local Modules = script:WaitForChild("Modules")
local Data = require(Modules.Data)
local Stats = require(Modules.Stats)
local Cosmetics = require(Modules.Cosmetics)
local Nameplate = require(Modules.Nameplate)
local Quests = require(Modules.Quests)
local Daily = require(Modules.Daily)
local Shards = require(Modules.Shards)
local Training = require(Modules.Training)
local Crates = require(Modules.Crates)
local Duels = require(Modules.Duels)
local Shop = require(Modules.Shop)
local Events = require(Modules.Events)
local Runway = require(Modules.Runway)
local Board = require(Modules.Board)
local World = require(Modules.World)

--------------------------------------------------------------------------------
-- World + systems
--------------------------------------------------------------------------------
print("[GlowUp] server starting")
local okWorld, info = pcall(World.build, {
	train = Training.start,
	crates = function(p)
		Stats.send(p, "openMenu", "Crates")
	end,
	duelQueue = Duels.joinQueue,
	duelBot = Duels.duelBot,
})
if okWorld then
	Duels.setArena(info.arena)
	Shards.build(info.slots)
	Board.init(info.board)
	print("[GlowUp] world built, shards:", #info.slots)
else
	warn("[GlowUp] World.build FAILED:", info)
end
Shards.init()
Training.init()
Runway.init()
Events.init()
Data.init()

--------------------------------------------------------------------------------
-- Player lifecycle
--------------------------------------------------------------------------------
local function onCharacter(p)
	local char = p.Character
	if not char then
		return
	end
	char:WaitForChild("HumanoidRootPart")
	char:WaitForChild("Humanoid")
	Stats.applyMovement(p)
	Cosmetics.onCharacter(p)
	Nameplate.onCharacter(p)
end

local function onPlayer(p)
	local profile = Data.load(p)
	Stats.init(p)
	Quests.init(p)
	Daily.refresh(p)
	Nameplate.init(p)
	Cosmetics.sync(p)

	-- Your look keeps earning while you're away.
	if profile.LastSeen then
		local away = math.clamp(os.time() - profile.LastSeen, 0, 2 * 3600)
		local gain = math.floor((p:GetAttribute("AuraRate") or 0) * away * 0.5)
		if gain > 0 then
			Stats.addAura(p, gain, { raw = true })
			p:SetAttribute("OfflineGain", gain)
		end
	end

	p.CharacterAdded:Connect(function()
		onCharacter(p)
	end)
	if p.Character then
		task.spawn(onCharacter, p)
	end
end

Players.PlayerAdded:Connect(onPlayer)
for _, p in Players:GetPlayers() do
	task.spawn(onPlayer, p)
end

Players.PlayerRemoving:Connect(function(p)
	Training.release(p)
	Duels.release(p)
	Stats.forget(p)
end)

--------------------------------------------------------------------------------
-- Idle income + daily refresh
--------------------------------------------------------------------------------
task.spawn(function()
	local tick = 0
	while true do
		task.wait(1)
		tick += 1
		for _, p in Players:GetPlayers() do
			if p:GetAttribute("Ready") then
				local rate = p:GetAttribute("AuraRate") or 0
				if rate > 0 then
					Stats.addAuraFractional(p, rate * Stats.eventMult("AuraMult"), { raw = true })
				end
				if tick % 30 == 0 then
					Daily.refresh(p)
				end
			end
		end
	end
end)

--------------------------------------------------------------------------------
-- Client requests (rate limited)
--------------------------------------------------------------------------------
local SETTING_KEYS = { Music = true, Sfx = true, Duels = true, Fx = true }
local budget = {}

Action.OnServerEvent:Connect(function(p, kind, a, b)
	if type(kind) ~= "string" or not p:GetAttribute("Ready") then
		return
	end
	local now = os.clock()
	local state = budget[p]
	if not state or now - state.t > 1 then
		state = { t = now, n = 0 }
		budget[p] = state
	end
	state.n += 1
	if state.n > 60 then
		return
	end

	if kind == "Equip" or kind == "Unequip" then
		Cosmetics.handle(p, kind, a)
	elseif kind == "Buy" or kind == "Rebirth" then
		Shop.handle(p, kind, a)
	elseif kind == "OpenCrate" and type(a) == "string" then
		Crates.open(p, a)
	elseif kind == "Claim" then
		Daily.claim(p)
	elseif kind == "TrainHit" or kind == "TrainCancel" then
		Training.handle(p, kind, a)
	elseif kind == "DuelTaps" then
		Duels.handle(p, kind, a)
	elseif kind == "Setting" and type(a) == "string" and SETTING_KEYS[a] then
		Stats.setSetting(p, a, b)
	end
end)

Players.PlayerRemoving:Connect(function(p)
	budget[p] = nil
end)

print("[GlowUp] ready")
]=====])
local modules = getOrMake("Folder", "Modules", SSS:WaitForChild("Main"))
put("ModuleScript", "Board", modules, [=====[
-- GLOW UP: the "Hall of Icons" screen: the highest Glow Scores on this server.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Util = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Util"))

local Board = {}

function Board.init(label)
	if not label then
		return
	end
	task.spawn(function()
		while true do
			local list = Players:GetPlayers()
			table.sort(list, function(x, y)
				return (x:GetAttribute("GlowScore") or 0) > (y:GetAttribute("GlowScore") or 0)
			end)
			local lines = {}
			for i = 1, math.min(8, #list) do
				local p = list[i]
				local rank = Config.Ranks[p:GetAttribute("Rank") or 1]
				table.insert(lines, string.format("%d.  %s   —   %s  (%s)", i, p.DisplayName, Util.fmt(p:GetAttribute("GlowScore") or 0), rank.Name))
			end
			label.Text = #lines > 0 and table.concat(lines, "\n") or "Be the first Icon."
			task.wait(8)
		end
	end)
end

return Board
]=====])
put("ModuleScript", "Cosmetics", modules, [=====[
-- GLOW UP: the wardrobe. Owns the inventory (with star levels) and builds the glowing
-- accessories players wear. Everything is made from parts and effects, so nothing needs uploading.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Cosmetics = {}

local FOLDER = "GlowCosmetics"

--------------------------------------------------------------------------------
-- Inventory
--------------------------------------------------------------------------------
local function writeInventory(p, profile)
	local parts = {}
	for id, stars in profile.Inv do
		table.insert(parts, id .. ":" .. stars)
	end
	table.sort(parts)
	p:SetAttribute("Inv", table.concat(parts, ","))
	for _, slot in Config.Slots do
		p:SetAttribute("Eq_" .. slot, profile.Eq[slot] or "")
	end
end

function Cosmetics.sync(p)
	local profile = Data.get(p)
	if profile then
		writeInventory(p, profile)
	end
end

-- Returns "new", "star" (duplicate levelled up) or "max" (duplicate of a max-star item), plus the stars.
function Cosmetics.grant(p, id)
	local profile = Data.get(p)
	local c = Config.CosmeticById[id]
	if not profile or not c then
		return nil
	end
	local stars = profile.Inv[id]
	local status
	if not stars then
		profile.Inv[id] = 1
		status = "new"
	elseif stars < Config.MaxStars then
		profile.Inv[id] = stars + 1
		status = "star"
	else
		status = "max"
	end
	writeInventory(p, profile)
	Stats.recompute(p)
	return status, profile.Inv[id]
end

function Cosmetics.equip(p, id)
	local profile = Data.get(p)
	local c = Config.CosmeticById[id]
	if not profile or not c or not profile.Inv[id] then
		return
	end
	profile.Eq[c.Slot] = id
	writeInventory(p, profile)
	Stats.recompute(p)
	Cosmetics.apply(p)
end

function Cosmetics.unequip(p, slot)
	local profile = Data.get(p)
	if not profile or not table.find(Config.Slots, slot) then
		return
	end
	profile.Eq[slot] = nil
	writeInventory(p, profile)
	Stats.recompute(p)
	Cosmetics.apply(p)
end

--------------------------------------------------------------------------------
-- Visuals
--------------------------------------------------------------------------------
local function accessoryPart(props)
	local part = Instance.new("Part")
	part.Anchored = false
	part.CanCollide = false
	part.CanTouch = false
	part.CanQuery = false
	part.Massless = true
	part.CastShadow = false
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in props do
		part[k] = v
	end
	return part
end

-- Positions `part` relative to `base` and welds it there.
local function attach(part, base, offset, folder)
	part.CFrame = base.CFrame * offset
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = base
	weld.Part1 = part
	weld.Parent = part
	part.Parent = folder
	return part
end

local function glowMaterial(spec)
	return spec.Glow and Enum.Material.Neon or Enum.Material.SmoothPlastic
end

local function sparkle(parent, color, rate)
	local e = Instance.new("ParticleEmitter")
	e.Color = ColorSequence.new(color)
	e.LightEmission = 1
	e.Rate = rate or 12
	e.Lifetime = NumberRange.new(0.6, 1.2)
	e.Speed = NumberRange.new(0.5, 2)
	e.SpreadAngle = Vector2.new(180, 180)
	e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 0) })
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(1, 1) })
	e.Parent = parent
	return e
end

local function rainbow()
	return ColorSequence.new({
		ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 90, 140)),
		ColorSequenceKeypoint.new(0.25, Color3.fromRGB(255, 220, 90)),
		ColorSequenceKeypoint.new(0.5, Color3.fromRGB(90, 255, 160)),
		ColorSequenceKeypoint.new(0.75, Color3.fromRGB(90, 190, 255)),
		ColorSequenceKeypoint.new(1, Color3.fromRGB(200, 120, 255)),
	})
end

local builders = {}

function builders.cap(spec, ctx)
	local band = accessoryPart({ Size = Vector3.new(2.15, 0.55, 2.15), Color = spec.Color, Material = Enum.Material.SmoothPlastic })
	attach(band, ctx.head, CFrame.new(0, 0.7, 0), ctx.folder)
	local brim = accessoryPart({ Size = Vector3.new(1.7, 0.15, 1.0), Color = spec.Color, Material = Enum.Material.SmoothPlastic })
	attach(brim, ctx.head, CFrame.new(0, 0.5, -1.2), ctx.folder)
end

function builders.halo(spec, ctx)
	local ring = accessoryPart({
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.14, 2.7, 2.7),
		Color = spec.Color,
		Material = Enum.Material.Neon,
	})
	attach(ring, ctx.head, CFrame.new(0, 1.5, 0) * CFrame.Angles(0, 0, math.pi / 2), ctx.folder)
	local light = Instance.new("PointLight")
	light.Color = spec.Color
	light.Range = 10
	light.Brightness = 1.5
	light.Parent = ring
end

function builders.crown(spec, ctx)
	local base = accessoryPart({ Size = Vector3.new(2.1, 0.45, 2.1), Color = spec.Color, Material = Enum.Material.Neon })
	attach(base, ctx.head, CFrame.new(0, 0.85, 0), ctx.folder)
	for i = 1, 5 do
		local angle = (i / 5) * math.pi * 2
		local spike = accessoryPart({
			Size = Vector3.new(0.38, 1.0, 0.38),
			Color = spec.Color,
			Material = Enum.Material.Neon,
		})
		attach(spike, ctx.head, CFrame.new(math.cos(angle) * 0.85, 1.4, math.sin(angle) * 0.85), ctx.folder)
		if spec.Sparkle and i == 1 then
			sparkle(spike, spec.Color, 14)
		end
	end
end

function builders.horns(spec, ctx)
	for side = -1, 1, 2 do
		local horn = accessoryPart({ Size = Vector3.new(0.4, 1.5, 0.4), Color = spec.Color, Material = Enum.Material.Neon })
		attach(horn, ctx.head, CFrame.new(side * 0.75, 1.15, 0) * CFrame.Angles(0, 0, -side * 0.45), ctx.folder)
		if spec.Sparkle then
			sparkle(horn, spec.Color, 16)
		end
	end
end

function builders.cape(spec, ctx)
	local body = accessoryPart({
		Size = Vector3.new(2.0, 3.1, 0.15),
		Color = spec.Color,
		Material = glowMaterial(spec),
	})
	attach(body, ctx.torso, CFrame.new(0, -0.35, 0.78) * CFrame.Angles(0.12, 0, 0), ctx.folder)
	if spec.Glow then
		local edge = accessoryPart({ Size = Vector3.new(2.1, 0.12, 0.2), Color = Color3.new(1, 1, 1), Material = Enum.Material.Neon })
		attach(edge, ctx.torso, CFrame.new(0, -1.9, 0.9) * CFrame.Angles(0.12, 0, 0), ctx.folder)
	end
end

function builders.wings(spec, ctx)
	for side = -1, 1, 2 do
		for i = 1, 3 do
			local feather = accessoryPart({
				Size = Vector3.new(0.18, 2.8 - i * 0.55, 1.1),
				Color = spec.Color,
				Material = Enum.Material.Neon,
				Transparency = 0.12 * i,
			})
			attach(
				feather,
				ctx.torso,
				CFrame.new(side * (0.9 + i * 0.7), 1.0 - i * 0.35, 0.8)
					* CFrame.Angles(0.15, side * 0.7, side * (0.35 + i * 0.12)),
				ctx.folder
			)
			if spec.Sparkle and i == 3 then
				sparkle(feather, spec.Color, 10)
			end
		end
	end
end

function builders.visor(spec, ctx)
	local bar = accessoryPart({
		Size = Vector3.new(2.05, 0.5, 0.25),
		Color = spec.Color,
		Material = glowMaterial(spec),
		Transparency = spec.Glow and 0.15 or 0,
	})
	attach(bar, ctx.head, CFrame.new(0, 0.15, -0.62), ctx.folder)
	if spec.Sparkle then
		sparkle(bar, spec.Color, 8)
	end
end

function builders.mask(spec, ctx)
	local plate = accessoryPart({ Size = Vector3.new(1.95, 1.1, 0.2), Color = spec.Color, Material = glowMaterial(spec) })
	attach(plate, ctx.head, CFrame.new(0, 0, -0.62), ctx.folder)
	local slit = accessoryPart({ Size = Vector3.new(1.5, 0.18, 0.22), Color = Color3.new(0.05, 0.05, 0.1), Material = Enum.Material.Neon })
	attach(slit, ctx.head, CFrame.new(0, 0.15, -0.72), ctx.folder)
end

function builders.aura(spec, ctx)
	local e = Instance.new("ParticleEmitter")
	e.Name = "GlowAura"
	e.Color = spec.Rainbow and rainbow() or ColorSequence.new(spec.Color)
	e.LightEmission = 1
	e.Rate = 28
	e.Lifetime = NumberRange.new(1.2, 2.2)
	e.Speed = NumberRange.new(1, 4)
	e.SpreadAngle = Vector2.new(180, 180)
	e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 0) })
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 1) })
	e.Parent = ctx.root
	local light = Instance.new("PointLight")
	light.Name = "GlowAuraLight"
	light.Color = spec.Rainbow and Color3.fromRGB(255, 200, 255) or spec.Color
	light.Range = 14
	light.Brightness = 1.2
	light.Parent = ctx.root
end

function builders.trail(spec, ctx)
	local a0 = Instance.new("Attachment")
	a0.Name = "GlowTrailA0"
	a0.Position = Vector3.new(0, 0.9, 0)
	a0.Parent = ctx.root
	local a1 = Instance.new("Attachment")
	a1.Name = "GlowTrailA1"
	a1.Position = Vector3.new(0, -0.9, 0)
	a1.Parent = ctx.root
	local trail = Instance.new("Trail")
	trail.Name = "GlowTrail"
	trail.Attachment0 = a0
	trail.Attachment1 = a1
	trail.Lifetime = 0.8
	trail.LightEmission = 1
	trail.Color = spec.Rainbow and rainbow() or ColorSequence.new(spec.Color, Color3.new(1, 1, 1))
	trail.Transparency = NumberSequence.new(0.1, 1)
	trail.Parent = ctx.root
end

local function clear(char)
	local old = char:FindFirstChild(FOLDER)
	if old then
		old:Destroy()
	end
	local root = char:FindFirstChild("HumanoidRootPart")
	if root then
		for _, child in root:GetChildren() do
			if string.sub(child.Name, 1, 4) == "Glow" then
				child:Destroy()
			end
		end
	end
end

-- Rebuilds everything the player is wearing.
function Cosmetics.apply(p)
	local char = p.Character
	local profile = Data.get(p)
	if not char or not profile then
		return
	end
	local head = char:FindFirstChild("Head")
	local root = char:FindFirstChild("HumanoidRootPart")
	local torso = char:FindFirstChild("UpperTorso") or char:FindFirstChild("Torso")
	if not head or not root or not torso then
		return
	end
	clear(char)
	local folder = Instance.new("Folder")
	folder.Name = FOLDER
	folder.Parent = char
	local ctx = { head = head, root = root, torso = torso, folder = folder }
	for _, slot in Config.Slots do
		local id = profile.Eq[slot]
		local c = id and Config.CosmeticById[id]
		if c then
			local build = builders[c.Build.Kind]
			if build then
				local ok, err = pcall(build, c.Build, ctx)
				if not ok then
					warn("[GlowUp] cosmetic failed:", id, err)
				end
			end
		end
	end
end

function Cosmetics.onCharacter(p)
	Cosmetics.sync(p)
	Cosmetics.apply(p)
end

function Cosmetics.handle(p, kind, a, b)
	if kind == "Equip" and type(a) == "string" then
		Cosmetics.equip(p, a)
	elseif kind == "Unequip" and type(a) == "string" then
		Cosmetics.unequip(p, a)
	end
end

return Cosmetics
]=====])
put("ModuleScript", "Crates", modules, [=====[
-- GLOW UP: crate opening. The server decides every roll; the client only plays the reveal.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)
local Cosmetics = require(script.Parent.Cosmetics)
local Quests = require(script.Parent.Quests)

local Crates = {}

local rng = Random.new()

local function rollRarity(crate, luck, onlyAtLeast)
	local minOrder = onlyAtLeast and Config.Rarities[onlyAtLeast].Order or 0
	local lowest = math.huge
	for name in crate.Odds do
		lowest = math.min(lowest, Config.Rarities[name].Order)
	end

	local total, weights = 0, {}
	for _, name in Config.RarityOrder do
		local base = crate.Odds[name]
		local order = Config.Rarities[name].Order
		if base and order >= minOrder then
			-- Luck boosts every drop above the crate's lowest tier.
			local w = order == lowest and base or base * luck
			weights[name] = w
			total += w
		end
	end

	local roll = rng:NextNumber() * total
	for _, name in Config.RarityOrder do
		local w = weights[name]
		if w then
			roll -= w
			if roll <= 0 then
				return name
			end
		end
	end
	return onlyAtLeast or Config.RarityOrder[1]
end

function Crates.open(p, crateId)
	local crate = Config.CrateById[crateId]
	local profile = Data.get(p)
	if not crate or not profile then
		return
	end

	if crateId == "street" and profile.FreeCrates > 0 then
		profile.FreeCrates -= 1
		p:SetAttribute("FreeCrates", profile.FreeCrates)
	elseif not Stats.spend(p, crate.Cost) then
		Stats.toast(p, "Not enough Aura for a " .. crate.Name, "bad")
		return
	end

	local luck = Config.LuckMult(profile.Levels.Luck or 0)
	local pity = profile.Pity[crateId] or 0
	local forced = crate.PityAfter and pity + 1 >= crate.PityAfter
	local rarity = rollRarity(crate, luck, forced and crate.PityMin or nil)

	if crate.PityMin then
		if Config.Rarities[rarity].Order >= Config.Rarities[crate.PityMin].Order then
			profile.Pity[crateId] = 0
		else
			profile.Pity[crateId] = pity + 1
		end
	end

	if crate.PityAfter then
		p:SetAttribute("Pity_" .. crateId, profile.Pity[crateId] or 0)
	end

	local pool = Config.CosmeticsByRarity[rarity]
	local pick = pool[rng:NextInteger(1, #pool)]
	local status, stars = Cosmetics.grant(p, pick.Id)

	local refund = 0
	if status == "max" then
		refund = math.floor(crate.Cost * 0.3)
		Stats.addAura(p, refund, { raw = true })
	end

	profile.CratesOpened += 1
	Quests.progress(p, "crate", 1)
	Stats.send(p, "crate", crateId, pick.Id, status, stars, refund)
end

return Crates
]=====])
put("ModuleScript", "Daily", modules, [=====[
-- GLOW UP: 7-day login streak. Missing a day restarts the cycle.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Daily = {}

local function today()
	return os.time() // 86400
end

local function nextDay(profile)
	local d = profile.Daily
	if d.Last >= today() - 1 then
		return d.Streak % #Config.Daily + 1
	end
	return 1
end

function Daily.refresh(p)
	local profile = Data.get(p)
	if not profile then
		return
	end
	p:SetAttribute("DailyReady", profile.Daily.Last < today())
	p:SetAttribute("DailyDay", nextDay(profile))
	p:SetAttribute("DailyStreak", profile.Daily.Streak)
end

function Daily.claim(p)
	local profile = Data.get(p)
	if not profile or profile.Daily.Last >= today() then
		return
	end
	local day = nextDay(profile)
	local reward = Config.Daily[day]
	local aura = reward.Aura * (1 + profile.Rebirths)
	profile.Daily.Streak = profile.Daily.Last == today() - 1 and profile.Daily.Streak + 1 or 1
	profile.Daily.Last = today()
	Stats.addAura(p, aura, { raw = true })
	if reward.Crates then
		Stats.addFreeCrates(p, reward.Crates)
	end
	Daily.refresh(p)
	Stats.send(p, "daily", day, aura, reward.Crates or 0)
end

return Daily
]=====])
put("ModuleScript", "Data", modules, [=====[
-- GLOW UP: player save data. Loads/saves with DataStores when available; the game also runs
-- fine in unpublished places (progress just isn't kept).
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")

local Data = {}

local profiles = {}
local savable = {}

local storeOk, store = pcall(function()
	return DataStoreService:GetDataStore("GlowUpV1")
end)
if not storeOk then
	warn("[GlowUp] Saving disabled (publish the place to enable it).")
	store = nil
end

local function defaults()
	return {
		Aura = 0,
		Power = 0,
		Style = 0,
		Charm = 0,
		Rebirths = 0,
		Levels = {},
		Inv = {}, -- cosmetic id -> stars
		Eq = {}, -- slot -> cosmetic id
		FreeCrates = 0,
		Wins = 0,
		Duels = 0,
		BestStreak = 0,
		Reps = 0,
		Perfects = 0,
		CratesOpened = 0,
		Pity = { neon = 0, icon = 0 },
		QuestsDone = 0,
		Quest = nil,
		Daily = { Last = 0, Streak = 0 },
		Settings = { Music = true, Sfx = true, Duels = true, Fx = true },
		LastSeen = nil,
	}
end

-- Fills in anything missing so old saves keep working after updates.
local function reconcile(target, template)
	for k, v in template do
		if target[k] == nil then
			target[k] = type(v) == "table" and table.clone(v) or v
		elseif type(v) == "table" and type(target[k]) == "table" then
			reconcile(target[k], v)
		end
	end
end

function Data.load(p)
	local data
	if store then
		local ok, result = pcall(function()
			return store:GetAsync("u" .. p.UserId)
		end)
		if ok then
			savable[p] = true
			data = result
		else
			warn("[GlowUp] load failed (saving off for this session):", result)
		end
	end
	data = type(data) == "table" and data or {}
	reconcile(data, defaults())
	profiles[p] = data
	return data
end

function Data.get(p)
	return profiles[p]
end

function Data.save(p)
	local profile = profiles[p]
	if not store or not profile or not savable[p] then
		return
	end
	profile.LastSeen = os.time()
	local ok, err = pcall(function()
		store:SetAsync("u" .. p.UserId, profile)
	end)
	if not ok then
		warn("[GlowUp] save failed:", err)
	end
end

function Data.release(p)
	Data.save(p)
	profiles[p] = nil
	savable[p] = nil
end

function Data.init()
	Players.PlayerRemoving:Connect(Data.release)
	game:BindToClose(function()
		if RunService:IsStudio() then
			return
		end
		for _, p in Players:GetPlayers() do
			task.spawn(Data.save, p)
		end
		task.wait(3)
	end)
	task.spawn(function()
		while true do
			task.wait(60)
			for _, p in Players:GetPlayers() do
				task.spawn(Data.save, p)
			end
		end
	end)
end

return Data
]=====])
put("ModuleScript", "Duels", modules, [=====[
-- GLOW UP: "mog" duels. Two players (or a player and a bot) face off in a 7-second tap battle.
-- Your Glow Score gives you an edge, but a fast tapper can upset a higher-ranked rival.
-- Losing never costs you anything: you still get a consolation reward.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)
local Quests = require(script.Parent.Quests)

local Duels = {}

local rng = Random.new()
local arena -- { padA = CFrame, padB = CFrame, center = Vector3 }
local queue = {} -- ordered list of waiting players
local duelOf = {} -- Player -> duel
local lastEnd = {} -- Player -> os.clock() of last duel end

function Duels.setArena(info)
	arena = info
end

local function removeFromQueue(p)
	local i = table.find(queue, p)
	if i then
		table.remove(queue, i)
	end
end

local function canDuel(p)
	local profile = Data.get(p)
	if not profile or not arena then
		return false, "Duels aren't ready yet"
	end
	if not profile.Settings.Duels then
		return false, "Turn Duels on in Settings first"
	end
	if duelOf[p] or p:GetAttribute("InDuel") then
		return false, "You're already in a duel"
	end
	if p:GetAttribute("Training") then
		return false, "Finish training first"
	end
	if lastEnd[p] and os.clock() - lastEnd[p] < Config.Duel.Cooldown then
		return false, "Catch your breath for a second"
	end
	return true
end

local function setFrozen(p, frozen)
	local hum = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
	if not hum then
		return
	end
	if frozen then
		hum.WalkSpeed = 0
		hum.JumpHeight = 0
	else
		Stats.applyMovement(p)
	end
end

local function place(p, cf)
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if root then
		root.AssemblyLinearVelocity = Vector3.zero
		root.CFrame = CFrame.lookAt(cf.Position + Vector3.new(0, 3, 0), arena.center + Vector3.new(0, 3, 0))
	end
end

local function effort(taps, myScore, oppScore)
	local maxTaps = Config.Duel.MaxTapsPerSecond * Config.Duel.Length
	local share = myScore / math.max(1, myScore + oppScore)
	return (math.min(taps, maxTaps) / maxTaps) * 50 + share * 50
end

local function finish(duel)
	if duel.over then
		return
	end
	duel.over = true
	local a, b = duel.a, duel.b
	local ta, tb = duel.tapsA, duel.tapsB

	local ea = effort(ta, duel.scoreA, duel.scoreB) * (0.94 + rng:NextNumber() * 0.12)
	local eb = effort(tb, duel.scoreB, duel.scoreA) * (0.94 + rng:NextNumber() * 0.12)
	local aWins = ea >= eb

	local function settle(p, wins, oppScore, myTaps, oppTaps, myEff, oppEff)
		if not p or p.Parent == nil then
			return
		end
		local profile = Data.get(p)
		if not profile then
			return
		end
		duelOf[p] = nil
		lastEnd[p] = os.clock()
		p:SetAttribute("InDuel", false)
		setFrozen(p, false)

		local reward = 60 + oppScore * 0.35
		if wins then
			local streak = (p:GetAttribute("DuelStreak") or 0) + 1
			p:SetAttribute("DuelStreak", streak)
			profile.Wins += 1
			profile.BestStreak = math.max(profile.BestStreak, streak)
			p:SetAttribute("Wins", profile.Wins)
			reward *= 1 + math.min(streak - 1, 10) * 0.1
			Quests.progress(p, "duel", 1)
		else
			p:SetAttribute("DuelStreak", 0)
			reward *= 0.25
		end
		profile.Duels += 1
		reward *= Stats.eventMult("DuelMult")
		local given = Stats.addAura(p, math.max(10, reward))
		Stats.send(p, "duelEnd", wins, given, myTaps, oppTaps, myEff, oppEff, p:GetAttribute("DuelStreak") or 0)
	end

	settle(a, aWins, duel.scoreB, ta, tb, ea, eb)
	settle(b, not aWins, duel.scoreA, tb, ta, eb, ea)
end

local function startDuel(a, b)
	removeFromQueue(a)
	if b then
		removeFromQueue(b)
	end
	local cfg = Config.Duel
	local now = workspace:GetServerTimeNow()
	local scoreA = Stats.score(a)
	local scoreB = b and Stats.score(b)
	if not scoreB then
		local streak = a:GetAttribute("DuelStreak") or 0
		scoreB = math.max(20, math.floor(scoreA * (0.75 + rng:NextNumber() * 0.5) * (1 + math.min(streak, 6) * 0.04)))
	end

	local duel = {
		a = a,
		b = b,
		scoreA = scoreA,
		scoreB = scoreB,
		tapsA = 0,
		tapsB = 0,
		tStart = now + cfg.Countdown,
		tEnd = now + cfg.Countdown + cfg.Length,
		botRate = 6 + rng:NextNumber() * 4,
		over = false,
	}
	duelOf[a] = duel
	a:SetAttribute("InDuel", true)
	place(a, arena.padA)
	setFrozen(a, true)
	if b then
		duelOf[b] = duel
		b:SetAttribute("InDuel", true)
		place(b, arena.padB)
		setFrozen(b, true)
	end

	local function info(p)
		return p and { p.DisplayName, p:GetAttribute("Rank") or 1 } or { "Mogger Bot", Config.RankFor(scoreB) }
	end
	local ia, ib = info(a), info(b)
	Stats.send(a, "duelStart", ib[1], ib[2], scoreB, scoreA, duel.tStart, cfg.Length)
	if b then
		Stats.send(b, "duelStart", ia[1], ia[2], scoreA, scoreB, duel.tStart, cfg.Length)
	end

	-- Live progress for both sides (and the bot's simulated taps).
	task.spawn(function()
		while not duel.over do
			task.wait(0.25)
			local t = workspace:GetServerTimeNow()
			if not b and t > duel.tStart then
				local elapsed = math.min(t, duel.tEnd) - duel.tStart
				duel.tapsB = math.floor(elapsed * duel.botRate)
			end
			if a.Parent then
				Stats.send(a, "duelProgress", duel.tapsB)
			end
			if b and b.Parent then
				Stats.send(b, "duelProgress", duel.tapsA)
			end
		end
	end)
	task.delay(cfg.Countdown + cfg.Length + 0.5, function()
		finish(duel)
	end)
end

function Duels.joinQueue(p)
	local ok, why = canDuel(p)
	if not ok then
		if table.find(queue, p) then
			removeFromQueue(p)
			Stats.toast(p, "Left the duel queue", "info")
		else
			Stats.toast(p, why, "bad")
		end
		return
	end
	if table.find(queue, p) then
		removeFromQueue(p)
		Stats.toast(p, "Left the duel queue", "info")
		return
	end
	for _, other in queue do
		if other ~= p and other.Parent and canDuel(other) then
			startDuel(other, p)
			return
		end
	end
	table.insert(queue, p)
	Stats.toast(p, "Searching for a rival... a bot steps in after " .. Config.Duel.QueueBotAfter .. "s", "info")
	task.delay(Config.Duel.QueueBotAfter, function()
		if table.find(queue, p) and p.Parent and canDuel(p) then
			startDuel(p, nil)
		end
	end)
end

function Duels.duelBot(p)
	local ok, why = canDuel(p)
	if not ok then
		Stats.toast(p, why, "bad")
		return
	end
	startDuel(p, nil)
end

function Duels.taps(p, n)
	local duel = duelOf[p]
	if not duel or duel.over or type(n) ~= "number" then
		return
	end
	local now = workspace:GetServerTimeNow()
	if now < duel.tStart - 0.1 or now > duel.tEnd + 0.2 then
		return
	end
	local elapsed = math.max(0, now - duel.tStart)
	local allowed = Config.Duel.MaxTapsPerSecond * elapsed + 4
	n = math.clamp(math.floor(n), 0, 20)
	if duel.a == p then
		duel.tapsA = math.min(duel.tapsA + n, allowed)
	else
		duel.tapsB = math.min(duel.tapsB + n, allowed)
	end
end

function Duels.release(p)
	removeFromQueue(p)
	local duel = duelOf[p]
	duelOf[p] = nil
	lastEnd[p] = nil
	if duel and not duel.over then
		-- A player who leaves forfeits; the other side is paid out immediately.
		if duel.a == p then
			duel.tapsA = 0
		else
			duel.tapsB = 0
		end
		finish(duel)
	end
end

function Duels.handle(p, kind, a)
	if kind == "DuelTaps" then
		Duels.taps(p, a)
	end
end

return Duels
]=====])
put("ModuleScript", "Events", modules, [=====[
-- GLOW UP: a server-wide event every few minutes. Clients read the "Event" attributes on workspace.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Shards = require(script.Parent.Shards)

local Events = {}

local rng = Random.new()

local function tint(color)
	local effect = Lighting:FindFirstChild("GlowTint")
	if effect then
		TweenService:Create(effect, TweenInfo.new(2), { TintColor = color }):Play()
	end
end

local function start(ev)
	workspace:SetAttribute("Event", ev.Id)
	workspace:SetAttribute("EventEnd", workspace:GetServerTimeNow() + ev.Duration)
	tint(ev.Tint)
	if ev.Id == "Storm" then
		Shards.storm(50)
	end
end

local function finish()
	workspace:SetAttribute("Event", "")
	tint(Color3.new(1, 1, 1))
	Shards.clearTemp()
end

function Events.init()
	workspace:SetAttribute("Event", "")
	task.spawn(function()
		task.wait(45)
		while true do
			local ev = Config.Events[rng:NextInteger(1, #Config.Events)]
			start(ev)
			task.wait(ev.Duration)
			finish()
			task.wait(rng:NextInteger(Config.EventGap[1], Config.EventGap[2]))
		end
	end)
end

return Events
]=====])
put("ModuleScript", "Nameplate", modules, [=====[
-- GLOW UP: the rank tag floating above every player. Looks matter, so it's always visible.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Util = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Util"))

local Nameplate = {}

local function build(p, head)
	local old = head:FindFirstChild("GlowPlate")
	if old then
		old:Destroy()
	end
	local gui = Instance.new("BillboardGui")
	gui.Name = "GlowPlate"
	gui.Size = UDim2.fromOffset(240, 62)
	gui.StudsOffset = Vector3.new(0, 3.1, 0)
	gui.AlwaysOnTop = false
	gui.MaxDistance = 90
	gui.LightInfluence = 0
	gui.Parent = head

	local rank = Instance.new("TextLabel")
	rank.Name = "Rank"
	rank.Size = UDim2.new(1, 0, 0, 30)
	rank.BackgroundTransparency = 1
	rank.Font = Enum.Font.GothamBlack
	rank.TextSize = 24
	rank.TextStrokeTransparency = 0.35
	rank.TextStrokeColor3 = Color3.fromRGB(12, 8, 30)
	rank.Parent = gui

	local name = Instance.new("TextLabel")
	name.Name = "Name"
	name.Position = UDim2.fromOffset(0, 30)
	name.Size = UDim2.new(1, 0, 0, 22)
	name.BackgroundTransparency = 1
	name.Font = Enum.Font.GothamBold
	name.TextSize = 16
	name.TextColor3 = Color3.new(1, 1, 1)
	name.TextStrokeTransparency = 0.5
	name.TextStrokeColor3 = Color3.fromRGB(12, 8, 30)
	name.Text = p.DisplayName
	name.Parent = gui
end

local function refresh(p)
	local head = p.Character and p.Character:FindFirstChild("Head")
	local gui = head and head:FindFirstChild("GlowPlate")
	if not gui then
		return
	end
	local rankIndex = p:GetAttribute("Rank") or 1
	local rank = Config.Ranks[rankIndex]
	local stars = p:GetAttribute("Rebirths") or 0
	gui.Rank.Text = (stars > 0 and ("★" .. stars .. " ") or "") .. rank.Name:upper() .. "  " .. Util.fmt(p:GetAttribute("GlowScore") or 0)
	gui.Rank.TextColor3 = rank.Color
end

function Nameplate.onCharacter(p)
	local char = p.Character
	local head = char and char:WaitForChild("Head", 5)
	if not head then
		return
	end
	local hum = char:FindFirstChildOfClass("Humanoid")
	if hum then
		hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	end
	build(p, head)
	refresh(p)
end

function Nameplate.init(p)
	for _, attr in { "Rank", "GlowScore", "Rebirths" } do
		p:GetAttributeChangedSignal(attr):Connect(function()
			refresh(p)
		end)
	end
end

return Nameplate
]=====])
put("ModuleScript", "Quests", modules, [=====[
-- GLOW UP: an endless chain of small goals. There is always exactly one active quest.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Quests = {}

local function writeQuest(p, quest)
	p:SetAttribute("QuestKind", quest.Kind)
	p:SetAttribute("QuestGoal", quest.Goal)
	p:SetAttribute("QuestReward", quest.Reward)
	p:SetAttribute("QuestProgress", quest.Progress or 0)
end

local function newQuest(p)
	local profile = Data.get(p)
	local q = Config.MakeQuest(profile.QuestsDone, profile.Rebirths)
	q.Progress = 0
	profile.Quest = q
	writeQuest(p, q)
end

function Quests.init(p)
	local profile = Data.get(p)
	local q = profile.Quest
	if type(q) == "table" and q.Kind and q.Goal and q.Reward then
		writeQuest(p, q)
	else
		newQuest(p)
	end
end

-- absolute = true means "progress is the max value reached" (not used by current quests, kept for flexibility).
function Quests.progress(p, kind, amount, absolute)
	local profile = Data.get(p)
	local q = profile and profile.Quest
	if not q or q.Kind ~= kind then
		return
	end
	q.Progress = absolute and math.max(q.Progress, amount) or q.Progress + amount
	if q.Progress < q.Goal then
		p:SetAttribute("QuestProgress", q.Progress)
		return
	end

	profile.QuestsDone += 1
	Stats.addAura(p, q.Reward, { raw = true })
	local bonus = ""
	if profile.QuestsDone % 5 == 0 then
		Stats.addFreeCrates(p, 1)
		bonus = " + free crate"
	end
	Stats.send(p, "quest", Config.QuestText(q.Kind, q.Goal), q.Reward, bonus)
	newQuest(p)
end

return Quests
]=====])
print("GLOW UP installer 2/7 done (" .. created .. " scripts). Now run installer 3.")

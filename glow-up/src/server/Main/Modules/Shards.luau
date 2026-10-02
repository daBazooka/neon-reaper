-- SUB 5 TO TRUE ADAM: the gym-and-health pickups scattered around the plaza: apples, protein shakes,
-- dumbbells and trophies. Walk near one to grab it. Chaining pickups quickly builds a multiplier.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local Debris = game:GetService("Debris")
local CollectionService = game:GetService("CollectionService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Stats = require(script.Parent.Stats)
local Quests = require(script.Parent.Quests)

local Shards = {}

local rng = Random.new()
local folder
local live = {} -- item Model -> slot
local slots = {}

local function pickType(luck)
	local total, weights = 0, {}
	for i, t in Config.ShardTypes do
		local w = t.Weight * (i >= 3 and (1 + luck * 0.5) or 1)
		weights[i] = w
		total += w
	end
	local roll = rng:NextNumber() * total
	for i, t in Config.ShardTypes do
		roll -= weights[i]
		if roll <= 0 then
			return t
		end
	end
	return Config.ShardTypes[1]
end

local function rollMutation()
	for _, m in Config.ShardMutations do
		if rng:NextNumber() < m.Chance then
			return m
		end
	end
	return nil
end

--------------------------------------------------------------------------------
-- Item models (simple parts, so they read as real objects)
--------------------------------------------------------------------------------
local UP = CFrame.Angles(0, 0, math.pi / 2) -- turns a (sideways) cylinder upright

local function piece(model, props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanTouch = false
	p.CanQuery = false
	p.CastShadow = false
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = Enum.Material.SmoothPlastic
	for k, v in props do
		p[k] = v
	end
	p.Parent = model
	return p
end

local function ballPiece(model, size, cf, color)
	return piece(model, { Shape = Enum.PartType.Ball, Size = Vector3.one * size, CFrame = cf, Color = color })
end

local function cyl(model, length, diameter, cf, color, material)
	return piece(model, {
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(length, diameter, diameter),
		CFrame = cf,
		Color = color,
		Material = material or Enum.Material.SmoothPlastic,
	})
end

local builders = {}

function builders.apple(model, cf, s, color)
	local body = ballPiece(model, 2.2 * s, cf, color)
	piece(model, { Size = Vector3.new(0.16, 0.6, 0.16) * s, CFrame = cf * CFrame.new(0, 1.15 * s, 0), Color = Color3.fromRGB(100, 70, 40) })
	piece(model, { Size = Vector3.new(0.8, 0.12, 0.45) * s, CFrame = cf * CFrame.new(0.4 * s, 1.3 * s, 0) * CFrame.Angles(0, 0, 0.4), Color = Color3.fromRGB(70, 180, 70) })
	return body
end

function builders.shake(model, cf, s, color)
	local body = cyl(model, 3 * s, 1.5 * s, cf * UP, color)
	cyl(model, 1.1 * s, 1.56 * s, cf * UP, Color3.fromRGB(250, 250, 252)) -- label band
	cyl(model, 0.5 * s, 1.6 * s, cf * CFrame.new(0, 1.75 * s, 0) * UP, Color3.fromRGB(40, 40, 48)) -- lid
	return body
end

function builders.dumbbell(model, cf, s, color)
	local bar = cyl(model, 3.4 * s, 0.5 * s, cf, Color3.fromRGB(200, 205, 215), Enum.Material.Metal)
	for side = -1, 1, 2 do
		cyl(model, 0.55 * s, 2.3 * s, cf * CFrame.new(side * 1.25 * s, 0, 0), color, Enum.Material.Metal)
		cyl(model, 0.45 * s, 1.5 * s, cf * CFrame.new(side * 1.7 * s, 0, 0), Color3.fromRGB(190, 195, 205), Enum.Material.Metal)
	end
	return bar
end

function builders.trophy(model, cf, s, color)
	local cup = cyl(model, 1.7 * s, 2 * s, cf * CFrame.new(0, 0.5 * s, 0) * UP, color, Enum.Material.Metal)
	cyl(model, 1.1 * s, 0.4 * s, cf * CFrame.new(0, -0.7 * s, 0) * UP, color, Enum.Material.Metal)
	piece(model, { Size = Vector3.new(1.8, 0.4, 1.8) * s, CFrame = cf * CFrame.new(0, -1.4 * s, 0), Color = Color3.fromRGB(60, 40, 30), Material = Enum.Material.Wood })
	for side = -1, 1, 2 do
		cyl(model, 0.25 * s, 0.9 * s, cf * CFrame.new(side * 1.15 * s, 0.6 * s, 0), color, Enum.Material.Metal)
	end
	return cup
end

local function spawn(slot)
	local t = pickType(slot.luck)
	local mut = rollMutation()
	local itemColor = mut and mut.Color or t.Color

	local model = Instance.new("Model")
	model.Name = "Shard"
	local scale = 1 + t.Scale * 0.5 + (mut and 0.2 or 0)
	local primary = builders[t.Kind](model, CFrame.new(slot.pos), scale, t.Color)
	model.PrimaryPart = primary

	model:SetAttribute("Value", t.Value * (mut and mut.Mult or 1))
	model:SetAttribute("Tier", t.Name)
	model:SetAttribute("Mut", mut and mut.Name or nil)
	model:SetAttribute("ItemColor", itemColor)
	model:SetAttribute("Pos", slot.pos)

	-- Only valuable or mutated ones twinkle, so the plaza stays clean.
	if mut or t.Value >= 60 then
		local e = Instance.new("ParticleEmitter")
		e.Color = ColorSequence.new(Color3.new(1, 1, 1), itemColor)
		e.LightEmission = 0.5
		e.Rate = mut and 14 or 5
		e.Lifetime = NumberRange.new(0.8, 1.5)
		e.Speed = NumberRange.new(0.5, 1.5)
		e.SpreadAngle = Vector2.new(180, 180)
		e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.3), NumberSequenceKeypoint.new(1, 0) })
		e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.1), NumberSequenceKeypoint.new(1, 1) })
		e.Parent = primary
	end

	CollectionService:AddTag(model, "Shard")
	model.Parent = folder
	live[model] = slot
end

function Shards.build(slotPositions)
	folder = Instance.new("Folder")
	folder.Name = "Pickups"
	folder.Parent = workspace
	for _, pos in slotPositions do
		local slot = { pos = pos, luck = 0 }
		table.insert(slots, slot)
		spawn(slot)
	end
end

-- A burst of rich temporary pickups (Pickup Storm event).
function Shards.storm(count)
	local r = Config.PlazaRadius - 10
	for _ = 1, count do
		local a = rng:NextNumber() * math.pi * 2
		local d = math.sqrt(rng:NextNumber()) * r
		spawn({ pos = Vector3.new(math.cos(a) * d, 3.4, math.sin(a) * d), luck = 6, temp = true })
	end
end

function Shards.clearTemp()
	for shard, slot in live do
		if slot.temp then
			live[shard] = nil
			shard:Destroy()
		end
	end
end

local function collect(p, shard, slot)
	if not live[shard] then
		return
	end
	live[shard] = nil
	shard:SetAttribute("Taken", true)

	local now = workspace:GetServerTimeNow()
	local chain = p:GetAttribute("Chain") or 0
	if now > (p:GetAttribute("ChainExpire") or 0) then
		chain = 0
	end
	chain = math.min(chain + 1, Config.ChainMax)
	p:SetAttribute("Chain", chain)
	p:SetAttribute("ChainExpire", now + Config.ChainWindow)

	local rank = p:GetAttribute("Rank") or 1
	local value = shard:GetAttribute("Value")
	local base = value * Config.RankScaling(rank) * Config.ChainMult(chain)
	local gained = Stats.addAura(p, base)
	Stats.addXP(p, value)
	Stats.send(p, "shard", slot.pos, gained, shard:GetAttribute("Tier"), shard:GetAttribute("ItemColor"), shard:GetAttribute("Mut"), chain)
	Quests.progress(p, "shards", 1)

	Debris:AddItem(shard, 0.3) -- the client flies it into the player first
	if not slot.temp then
		task.delay(Config.ShardRespawn, function()
			spawn(slot)
		end)
	end
end

function Shards.init()
	local acc = 0
	RunService.Heartbeat:Connect(function(dt)
		acc += dt
		if acc < 0.1 then
			return
		end
		acc = 0
		for _, p in Players:GetPlayers() do
			local char = p.Character
			local root = char and char:FindFirstChild("HumanoidRootPart")
			local hum = char and char:FindFirstChildOfClass("Humanoid")
			if root and hum and hum.Health > 0 then
				local radius = p:GetAttribute("MagnetRadius") or 9
				local pos = root.Position
				for shard, slot in live do
					if (slot.pos - pos).Magnitude <= radius then
						collect(p, shard, slot)
					end
				end
			end
		end
	end)
end

return Shards

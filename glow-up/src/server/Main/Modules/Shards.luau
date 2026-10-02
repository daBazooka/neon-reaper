-- GLOW UP: the Aura shards floating around the district. Walk near one to collect it.
-- Chaining pickups quickly builds a multiplier.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")
local CollectionService = game:GetService("CollectionService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Stats = require(script.Parent.Stats)
local Quests = require(script.Parent.Quests)

local Shards = {}

local rng = Random.new()
local folder
local live = {} -- shard Part -> slot
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

local function spawn(slot)
	local t = pickType(slot.luck)
	local mut = rollMutation()
	local color = mut and mut.Color or t.Color
	local shard = Instance.new("Part")
	shard.Name = "Shard"
	shard.Shape = Enum.PartType.Ball
	shard.Size = Vector3.one * (1.4 + t.Scale + (mut and 0.5 or 0))
	shard.Material = Enum.Material.Neon
	shard.Color = color
	shard.Anchored = true
	shard.CanCollide = false
	shard.CanTouch = false
	shard.CanQuery = false
	shard.CastShadow = false
	shard.Position = slot.pos
	shard:SetAttribute("Value", t.Value * (mut and mut.Mult or 1))
	shard:SetAttribute("Tier", t.Name)
	shard:SetAttribute("Mut", mut and mut.Name or nil)

	local light = Instance.new("PointLight")
	light.Color = color
	light.Range = 8 + t.Scale * 6
	light.Brightness = 1.4
	light.Parent = shard

	local e = Instance.new("ParticleEmitter")
	e.Color = ColorSequence.new(color)
	e.LightEmission = 1
	e.Rate = 4 + math.sqrt(t.Value) + (mut and 16 or 0)
	e.Lifetime = NumberRange.new(1.5, 3)
	e.Speed = NumberRange.new(1, 2)
	e.SpreadAngle = Vector2.new(180, 180)
	e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.35), NumberSequenceKeypoint.new(1, 0) })
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(1, 1) })
	e.Parent = shard

	CollectionService:AddTag(shard, "Shard")
	shard.Parent = folder
	live[shard] = slot
end

function Shards.build(slotPositions)
	folder = Instance.new("Folder")
	folder.Name = "Shards"
	folder.Parent = workspace
	for _, pos in slotPositions do
		local slot = { pos = pos, luck = 0 }
		table.insert(slots, slot)
		spawn(slot)
	end
end

-- A burst of rich temporary shards (Shard Storm event).
function Shards.storm(count)
	local r = Config.PlazaRadius - 10
	for _ = 1, count do
		local a = rng:NextNumber() * math.pi * 2
		local d = math.sqrt(rng:NextNumber()) * r
		spawn({ pos = Vector3.new(math.cos(a) * d, 3.2, math.sin(a) * d), luck = 6, temp = true })
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

local function collect(p, shard, root)
	local slot = live[shard]
	if not slot then
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
	local base = shard:GetAttribute("Value") * Config.RankScaling(rank) * Config.ChainMult(chain)
	local gained = Stats.addAura(p, base)
	Stats.send(p, "shard", shard.Position, gained, shard:GetAttribute("Tier"), shard.Color, shard:GetAttribute("Mut"), chain)
	Quests.progress(p, "shards", 1)

	TweenService:Create(shard, TweenInfo.new(0.18, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
		Position = root.Position,
		Size = Vector3.one * 0.2,
	}):Play()
	Debris:AddItem(shard, 0.25)

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
				for shard in live do
					if (shard.Position - pos).Magnitude <= radius then
						collect(p, shard, root)
					end
				end
			end
		end
	end)
end

return Shards

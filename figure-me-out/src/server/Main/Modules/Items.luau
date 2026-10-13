-- FIGURE ME OUT: the gadgets you carry. Flashbang, smoke grenade, distraction grenade, scanner, sprint boost and decoy
-- (binoculars and the camera live in Match.setScope and Photos). Every gadget has a charge count and a cooldown,
-- and everything is checked here on the server.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Vision = require(script.Parent.Vision)
local Combat = require(script.Parent.Combat)

local Items = {}

local rng = Random.new()
local clouds = {} -- { parts = {...}, expires = number, cloud = vision cloud }
Items.distractions = {} -- { pos = Vector3, expires = number, part = Part }

local function folder(name)
	local f = workspace:FindFirstChild(name)
	if not f then
		f = Instance.new("Folder")
		f.Name = name
		f.Parent = workspace
	end
	return f
end

--------------------------------------------------------------------------------
-- Carrying and cooldowns
--------------------------------------------------------------------------------
function Items.reset(e)
	e.items = {}
	for _, id in Config.CarriedItems do
		e.items[id] = Config.ItemById[id].Start or 0
	end
	e.cooldowns = {}
	e.sprintUntil = 0
	e.blindUntil = 0
	State.writeEntity(e)
end

-- Returns how many were actually added (0 when already at the maximum).
function Items.give(e, id, count)
	local def = Config.ItemById[id]
	if not def or def.Permanent then
		return 0
	end
	local have = e.items[id] or 0
	local added = math.max(0, math.min(count or 1, def.Max - have))
	e.items[id] = have + added
	State.writeEntity(e)
	return added
end

-- Seconds left on a gadget's cooldown (0 when it is ready).
function Items.cooldownLeft(e, id)
	return math.max(0, ((e.cooldowns or {})[id] or 0) - State.now())
end

function Items.startCooldown(e, id, seconds)
	e.cooldowns = e.cooldowns or {}
	e.cooldowns[id] = State.now() + seconds
	if e.player then
		Net.send(e.player, "cooldown", id, seconds)
	end
end

--------------------------------------------------------------------------------
-- Throwing
--------------------------------------------------------------------------------
local function ball(position, color)
	local p = Instance.new("Part")
	p.Shape = Enum.PartType.Ball
	p.Size = Vector3.new(1.4, 1.4, 1.4)
	p.Color = color
	p.Material = Enum.Material.Neon
	p.Position = position
	p.CanCollide = true
	p.CanQuery = false
	p.CanTouch = false
	p.Parent = folder("Effects")
	return p
end

local function throw(e, look, color, fuse, boom)
	local head = Vision.head(e)
	if not head then
		return false
	end
	local start = head.Position + look * 2.5
	local p = ball(start, color)
	p.AssemblyLinearVelocity = look * Config.Flash.ThrowSpeed + Vector3.new(0, Config.Flash.ThrowUp, 0)
	local light = Instance.new("PointLight")
	light.Color = color
	light.Range = 8
	light.Parent = p
	task.delay(fuse, function()
		local at = p.Position
		p:Destroy()
		boom(at)
	end)
	return true
end

-- A short sound at a point in the world (the sounds ship with Roblox; swap them in Config.Sounds).
local function bang(position, soundId, volume, speed)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.Transparency = 1
	p.Size = Vector3.new(1, 1, 1)
	p.Position = position
	p.Parent = folder("Effects")
	local sound = Instance.new("Sound")
	sound.SoundId = soundId
	sound.Volume = volume
	sound.PlaybackSpeed = speed
	sound.RollOffMaxDistance = 160
	sound.Parent = p
	sound:Play()
	Debris:AddItem(p, 3)
end

local function flashBoom(position)
	local now = State.now()
	bang(position, Config.Sounds.Flash, 2, 1)
	local fx = Instance.new("Part")
	fx.Anchored = true
	fx.CanCollide = false
	fx.CanQuery = false
	fx.Shape = Enum.PartType.Ball
	fx.Material = Enum.Material.Neon
	fx.Color = Color3.new(1, 1, 1)
	fx.Size = Vector3.new(3, 3, 3)
	fx.Position = position
	fx.Parent = folder("Effects")
	local light = Instance.new("PointLight")
	light.Brightness = 12
	light.Range = 60
	light.Parent = fx
	Debris:AddItem(fx, 0.5)
	for _, e in State.aliveList() do
		local head = Vision.head(e)
		if head then
			local offset = position - head.Position
			local distance = offset.Magnitude
			if distance < Config.Flash.Radius and not Vision.blocked(position, head.Position, true) then
				local facing = distance > 0.1 and head.CFrame.LookVector:Dot(offset.Unit) or 1
				local seconds = Rules.flashBlind(distance, facing)
				if seconds > 0 then
					e.blindUntil = math.max(e.blindUntil or 0, now + seconds)
					if e.player then
						Net.send(e.player, "flash", seconds)
					end
				end
			end
		end
	end
end

local function smokeBoom(position)
	bang(position, Config.Sounds.Bass, 1.5, 0.6)
	local radius = Config.Smoke.Radius
	local parts = {}
	local f = folder("Smoke")
	local offsets = {
		Vector3.new(0, 0, 0), Vector3.new(radius * 0.35, 0, 0), Vector3.new(-radius * 0.35, 0, 0),
		Vector3.new(0, 0, radius * 0.35), Vector3.new(0, 0, -radius * 0.35), Vector3.new(0, radius * 0.4, 0),
	}
	for _, o in offsets do
		local s = Instance.new("Part")
		s.Shape = Enum.PartType.Ball
		s.Anchored = true
		s.CanCollide = false
		s.CanQuery = false
		s.CastShadow = false
		s.Material = Enum.Material.SmoothPlastic
		s.Color = Color3.fromRGB(205, 208, 215)
		s.Transparency = 0.1
		s.Size = Vector3.new(radius * 1.3, radius * 1.3, radius * 1.3)
		s.Position = position + o + Vector3.new(0, radius * 0.4, 0)
		-- every puff knows the whole cloud, so clients agree with the server about where sight is blocked
		s:SetAttribute("CloudCenter", position + Vector3.new(0, radius * 0.4, 0))
		s:SetAttribute("CloudRadius", radius * 0.95)
		s.Parent = f
		table.insert(parts, s)
	end
	local expires = State.now() + Config.Smoke.Duration
	local cloud = Vision.addCloud(position + Vector3.new(0, radius * 0.4, 0), radius * 0.95, expires)
	table.insert(clouds, { parts = parts, expires = expires, cloud = cloud })
end

-- Fake footsteps for a few seconds: a quiet looping sound that people (and bots) go to check out.
local function distractionBoom(position)
	local part = Instance.new("Part")
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.Transparency = 1
	part.Size = Vector3.new(1, 1, 1)
	part.Position = position
	part.Parent = folder("Effects")
	local sound = Instance.new("Sound")
	sound.SoundId = Config.Sounds.Footsteps
	sound.Looped = true
	sound.Volume = 1.2
	sound.RollOffMaxDistance = 90
	sound.PlaybackSpeed = 1.2
	sound.Parent = part
	sound:Play()
	local tag = Instance.new("BillboardGui")
	tag.Size = UDim2.fromOffset(40, 40)
	tag.StudsOffset = Vector3.new(0, 3, 0)
	tag.MaxDistance = 60
	tag.Adornee = part
	tag.Parent = part
	local icon = Instance.new("TextLabel")
	icon.Size = UDim2.fromScale(1, 1)
	icon.BackgroundTransparency = 1
	icon.TextScaled = true
	icon.Text = "👣"
	icon.Parent = tag
	table.insert(Items.distractions, { pos = position, expires = State.now() + Config.Distraction.Duration, part = part })
end

-- The nearest active distraction to a point, or nil.
function Items.nearestDistraction(pos, within)
	local now = State.now()
	local best, bestD
	for _, d in Items.distractions do
		if d.expires > now then
			local dist = (d.pos - pos).Magnitude
			if dist <= within and (not bestD or dist < bestD) then
				best, bestD = d, dist
			end
		end
	end
	return best
end

--------------------------------------------------------------------------------
-- Using a gadget
--------------------------------------------------------------------------------
-- A copy of the player that stands where they dropped it, wearing a DIFFERENT number. Shooting it right is a trap.
local nextDecoy = 1000000
local function makeDecoy(e)
	local char = e.char
	if not char then
		return false
	end
	char.Archivable = true
	local model = char:Clone()
	for _, d in model:GetDescendants() do
		if d:IsA("Script") or d:IsA("LocalScript") then
			d:Destroy()
		elseif d:IsA("BasePart") then
			d.Anchored = true
			d.CanCollide = false
		end
	end
	for _, tag in { "RevealTag", "BountyTag", "EmoteBubble" } do
		local t = model:FindFirstChild(tag, true)
		if t then
			t:Destroy()
		end
	end
	local number = Rules.newNumber(function()
		return rng:NextNumber()
	end, State.takenNumbers())
	local label = model:FindFirstChild("Digits", true)
	if label then
		label.Text = number
	end
	local hum = model:FindFirstChildOfClass("Humanoid")
	if hum then
		hum.WalkSpeed = 0
	end
	model.Name = "Decoy"
	model:PivotTo(char:GetPivot() * CFrame.new(0, 0, -5))
	nextDecoy += 1
	model:SetAttribute("EntityId", nextDecoy)
	model:SetAttribute("Decoy", true)
	model:SetAttribute("Alive", true)
	model.Parent = folder("Decoys")
	State.decoys[nextDecoy] = {
		id = nextDecoy,
		owner = e.id,
		number = number,
		model = model,
		code = e.code,
		icon = e.icon,
		expires = State.now() + Config.Decoy.Duration,
	}
	return true
end

local function scan(e)
	local mine = Vision.head(e)
	if not mine then
		return false
	end
	local found = {}
	for _, other in State.aliveList() do
		local head = Vision.head(other)
		if other ~= e and head then
			local distance = (head.Position - mine.Position).Magnitude
			-- the ping goes through walls but not through smoke
			if distance <= Config.Scanner.Radius and not Vision.inSmoke(mine.Position, head.Position) then
				table.insert(found, { other.id, other.code, other.icon, head.Position, math.floor(distance + 0.5) })
			end
		end
	end
	if e.player then
		Net.send(e.player, "scan", found, Config.Scanner.Show)
	end
	return true
end

-- Returns true when the gadget was used.
function Items.use(e, id, look)
	if State.phase ~= "play" or not e or not e.alive then
		return false
	end
	local def = Config.ItemById[id]
	if not def or def.Permanent or (e.items[id] or 0) < 1 then
		return false
	end
	local now = State.now()
	if (e.stunUntil or 0) > now or Items.cooldownLeft(e, id) > 0 or now - (e.lastUse or -100) < 0.4 then
		return false
	end
	if typeof(look) ~= "Vector3" or look.Magnitude < 0.1 then
		local head = Vision.head(e)
		look = head and head.CFrame.LookVector or Vector3.new(0, 0, -1)
	end
	look = look.Unit
	local used = false
	if id == "flash" then
		used = throw(e, look, Color3.fromRGB(255, 255, 255), Config.Flash.Fuse, flashBoom)
	elseif id == "smoke" then
		used = throw(e, look, Color3.fromRGB(150, 155, 165), Config.Smoke.Fuse, smokeBoom)
	elseif id == "distraction" then
		used = throw(e, look, Color3.fromRGB(255, 200, 90), Config.Distraction.Fuse, distractionBoom)
	elseif id == "sprint" then
		e.sprintUntil = now + Config.Sprint.Duration
		Combat.applySpeed(e)
		used = true
	elseif id == "decoy" then
		used = makeDecoy(e)
	elseif id == "scanner" then
		used = scan(e)
	end
	if used then
		e.items[id] -= 1
		e.lastUse = now
		Items.startCooldown(e, id, def.Cooldown)
		State.writeEntity(e)
		if e.player then
			Net.send(e.player, "used", id)
		end
	end
	return used
end

--------------------------------------------------------------------------------
-- Upkeep (called every quarter second while a match runs)
--------------------------------------------------------------------------------
function Items.tick(now)
	for id, d in State.decoys do
		if d.expires <= now then
			State.decoys[id] = nil
			if d.model then
				d.model:Destroy()
			end
		end
	end
	for i = #Items.distractions, 1, -1 do
		local d = Items.distractions[i]
		if d.expires <= now then
			d.part:Destroy()
			table.remove(Items.distractions, i)
		end
	end
	for i = #clouds, 1, -1 do
		local c = clouds[i]
		local left = c.expires - now
		if left <= 0 then
			for _, part in c.parts do
				part:Destroy()
			end
			table.remove(clouds, i)
		elseif left < Config.Smoke.Fade then
			for _, part in c.parts do
				part.Transparency = 0.1 + 0.9 * (1 - left / Config.Smoke.Fade)
			end
		end
	end
	for i = #Vision.clouds, 1, -1 do
		if Vision.clouds[i].expires <= now then
			table.remove(Vision.clouds, i)
		end
	end
	for _, e in State.list() do
		if (e.sprintUntil or 0) > 0 and e.sprintUntil <= now then
			e.sprintUntil = 0
			Combat.applySpeed(e)
		end
	end
end

function Items.clearAll()
	for _, c in clouds do
		for _, part in c.parts do
			part:Destroy()
		end
	end
	clouds = {}
	Items.distractions = {}
	for _, d in State.decoys do
		if d.model then
			d.model:Destroy()
		end
	end
	State.decoys = {}
	Vision.clearClouds()
	for _, name in { "Effects", "Smoke", "Decoys" } do
		local f = workspace:FindFirstChild(name)
		if f then
			f:ClearAllChildren()
		end
	end
end

return Items

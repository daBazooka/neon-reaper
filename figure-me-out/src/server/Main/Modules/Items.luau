-- FIGURE ME OUT: the things you carry. Flashbangs, smoke grenades, decoys, scramblers, switcheroos and speed boots.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Vision = require(script.Parent.Vision)
local Combat = require(script.Parent.Combat)
local Plates = require(script.Parent.Plates)

local Items = {}

local rng = Random.new()
local nextDecoy = 1000000
local clouds = {} -- { parts = {...}, expires = number, cloud = vision cloud }

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
-- Carrying
--------------------------------------------------------------------------------
function Items.reset(e)
	e.items = {}
	for _, id in Config.CarriedItems do
		e.items[id] = Config.ItemById[id].Start or 0
	end
	e.scrambleUntil = 0
	e.bootsUntil = 0
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
		return
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
end

local function flashBoom(position, thrower)
	local now = State.now()
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

--------------------------------------------------------------------------------
-- Decoy
--------------------------------------------------------------------------------
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
	local reveal = model:FindFirstChild("RevealTag", true)
	if reveal then
		reveal:Destroy()
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
	local root = model:FindFirstChild("HumanoidRootPart")
	local from = char:GetPivot()
	model.Name = "Decoy"
	model:PivotTo(from * CFrame.new(0, 0, -5))
	nextDecoy += 1
	model:SetAttribute("EntityId", nextDecoy)
	model:SetAttribute("Decoy", true)
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
	return root ~= nil
end

--------------------------------------------------------------------------------
-- Using an item
--------------------------------------------------------------------------------
local function nearestOther(e, range)
	local mine = Vision.head(e)
	if not mine then
		return nil
	end
	local best, bestD
	for _, other in State.aliveList() do
		local head = Vision.head(other)
		if other ~= e and head then
			local d = (head.Position - mine.Position).Magnitude
			if d <= range and (not bestD or d < bestD) and not Vision.blocked(mine.Position, head.Position, false) then
				best, bestD = other, d
			end
		end
	end
	return best
end

-- Returns true when the item was used.
function Items.use(e, id, look)
	if State.phase ~= "play" or not e or not e.alive then
		return false
	end
	local def = Config.ItemById[id]
	if not def or def.Permanent or (e.items[id] or 0) < 1 then
		return false
	end
	local now = State.now()
	if (e.stunUntil or 0) > now or now - (e.lastUse or -100) < 0.6 then
		return false
	end
	if typeof(look) ~= "Vector3" or look.Magnitude < 0.1 then
		local head = Vision.head(e)
		look = head and head.CFrame.LookVector or Vector3.new(0, 0, -1)
	end
	look = look.Unit
	local used = false
	if id == "flash" then
		throw(e, look, Color3.fromRGB(255, 255, 255), Config.Flash.Fuse, function(at)
			flashBoom(at, e)
		end)
		used = true
	elseif id == "smoke" then
		throw(e, look, Color3.fromRGB(150, 155, 165), Config.Smoke.Fuse, smokeBoom)
		used = true
	elseif id == "decoy" then
		used = makeDecoy(e)
	elseif id == "scramble" then
		e.scrambleUntil = now + Config.Scramble.Duration
		used = true
	elseif id == "switch" then
		local other = nearestOther(e, Config.Switch.Range)
		if other then
			local a, b = e.number, other.number
			Combat.setNumber(e, b)
			Combat.setNumber(other, a)
			if other.player then
				Net.toast(other.player, "Someone swapped your number!", "gold")
			end
			used = true
		elseif e.player then
			Net.toast(e.player, "Nobody close enough to swap with", "bad")
		end
	elseif id == "boots" then
		e.bootsUntil = now + Config.Movement.BootsTime
		Combat.applySpeed(e)
		used = true
	end
	if used then
		e.items[id] -= 1
		e.lastUse = now
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
		if (e.scrambleUntil or 0) > now and e.alive then
			local fake = Rules.digitsOf(rng:NextInteger(Config.Number.Min, Config.Number.Max))
			if fake == e.number then
				fake = Rules.digitsOf(Config.Number.Min)
			end
			Plates.setText(e, fake)
		elseif e.scrambleUntil and e.scrambleUntil > 0 then
			e.scrambleUntil = 0
			Plates.setText(e, e.number)
		end
		if (e.bootsUntil or 0) > 0 and e.bootsUntil <= now then
			e.bootsUntil = 0
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
	Vision.clearClouds()
	for _, d in State.decoys do
		if d.model then
			d.model:Destroy()
		end
	end
	State.decoys = {}
	for _, name in { "Effects", "Smoke", "Decoys" } do
		local f = workspace:FindFirstChild(name)
		if f then
			f:ClearAllChildren()
		end
	end
end

return Items

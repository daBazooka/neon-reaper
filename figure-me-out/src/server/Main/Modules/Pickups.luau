-- FIGURE ME OUT: glowing item crates around the map. Walk into one to get a random item (never more than you can carry).
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Items = require(script.Parent.Items)

local Pickups = {}

local rng = Random.new()
local crates = {} -- { part, home = Vector3, readyAt = number }
local drops = {} -- supply drops: { part, expires }
local dropParent

local function setReady(c, on)
	c.part.Transparency = on and 0 or 1
	for _, extra in c.extras or {} do
		extra.Transparency = on and 0 or 1
	end
	local gui = c.part:FindFirstChildOfClass("BillboardGui")
	if gui then
		gui.Enabled = on
	end
	local light = c.part:FindFirstChildOfClass("PointLight")
	if light then
		light.Enabled = on
	end
end

function Pickups.build(parent)
	if not Config.Features.Gadgets then
		return
	end
	crates = {}
	drops = {}
	dropParent = parent
	for _, pos in Config.Map.Crates do
		-- a yellow wooden chest (like the ones in the original game's courtyards) with a darker lid, two bands and a latch
		local part = Instance.new("Part")
		part.Name = "ItemCrate"
		part.Size = Vector3.new(3.4, 2.2, 2.4)
		part.Position = pos + Vector3.new(0, 0.6, 0)
		part.Anchored = true
		part.CanCollide = false
		part.CanQuery = false
		part.Material = Enum.Material.Wood
		part.Color = Color3.fromRGB(226, 182, 62)
		part.Parent = parent
		local extras = {}
		local function trim(name, size, offset, color)
			local t = Instance.new("Part")
			t.Name = name
			t.Size = size
			t.Position = part.Position + offset
			t.Anchored = true
			t.CanCollide = false
			t.CanQuery = false
			t.Material = Enum.Material.Wood
			t.Color = color
			t.Parent = parent
			table.insert(extras, t)
		end
		local dark = Color3.fromRGB(150, 104, 36)
		trim("ChestLid", Vector3.new(3.6, 0.5, 2.6), Vector3.new(0, 1.35, 0), Color3.fromRGB(238, 196, 76))
		trim("ChestBand", Vector3.new(0.3, 2.3, 2.5), Vector3.new(-1.1, 0, 0), dark)
		trim("ChestBand", Vector3.new(0.3, 2.3, 2.5), Vector3.new(1.1, 0, 0), dark)
		trim("ChestLatch", Vector3.new(0.5, 0.6, 0.2), Vector3.new(0, 0.7, -1.25), Color3.fromRGB(40, 36, 30))
		local gui = Instance.new("BillboardGui")
		gui.Size = UDim2.fromOffset(44, 44)
		gui.StudsOffset = Vector3.new(0, 3, 0)
		gui.MaxDistance = 60
		gui.AlwaysOnTop = false
		gui.Parent = part
		local l = Instance.new("TextLabel")
		l.Size = UDim2.fromScale(1, 1)
		l.BackgroundTransparency = 1
		l.Text = "🎁"
		l.TextScaled = true
		l.Parent = gui
		local light = Instance.new("PointLight")
		light.Color = Color3.fromRGB(255, 220, 140)
		light.Range = 10
		light.Brightness = 1
		light.Parent = part
		table.insert(crates, { part = part, extras = extras, readyAt = 0 })
	end
end

function Pickups.reset()
	for _, c in crates do
		c.readyAt = 0
		setReady(c, true)
	end
	for _, d in drops do
		d.part:Destroy()
	end
	drops = {}
end

-- A supply drop lands at `position`: a big golden crate with a beam of light. First player to reach it takes two gadgets.
function Pickups.drop(position)
	local part = Instance.new("Part")
	part.Name = "SupplyDrop"
	part.Size = Vector3.new(4, 4, 4)
	part.Position = position + Vector3.new(0, 2.2, 0)
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.Material = Enum.Material.Neon
	part.Color = Color3.fromRGB(255, 214, 60)
	part.Parent = dropParent or workspace
	local beam = Instance.new("Part")
	beam.Size = Vector3.new(2, 120, 2)
	beam.Position = position + Vector3.new(0, 60, 0)
	beam.Anchored = true
	beam.CanCollide = false
	beam.CanQuery = false
	beam.Material = Enum.Material.Neon
	beam.Color = Color3.fromRGB(255, 226, 90)
	beam.Transparency = 0.6
	beam.Parent = part
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(110, 40)
	gui.StudsOffset = Vector3.new(0, 4, 0)
	gui.AlwaysOnTop = true
	gui.Adornee = part
	gui.Parent = part
	local text = Instance.new("TextLabel")
	text.Size = UDim2.fromScale(1, 1)
	text.BackgroundTransparency = 1
	text.Font = Enum.Font.GothamBlack
	text.TextSize = 18
	text.TextColor3 = Color3.fromRGB(255, 226, 90)
	text.Text = "📦 SUPPLY"
	text.Parent = gui
	table.insert(drops, { part = part, expires = State.now() + 60 })
	return part
end

-- Picks an item the entity can still carry, or nil when they are full of everything.
local function rollFor(e)
	for _ = 1, 12 do
		local id = Rules.pickItem(rng:NextNumber())
		if (e.items[id] or 0) < Config.ItemById[id].Max then
			return id
		end
	end
	for _, id in Config.CarriedItems do
		if (e.items[id] or 0) < Config.ItemById[id].Max then
			return id
		end
	end
	return nil
end

local function tickDrops(now)
	for i = #drops, 1, -1 do
		local d = drops[i]
		local taken = false
		if d.expires <= now then
			taken = true
		else
			for _, e in State.aliveList() do
				local root = e.char and e.char:FindFirstChild("HumanoidRootPart")
				if root and e.player and (root.Position - d.part.Position).Magnitude <= Config.Pickups.Radius + 2 then
					local got = {}
					for _ = 1, 2 do
						local id = rollFor(e)
						if id then
							Items.give(e, id, 1)
							table.insert(got, id)
						end
					end
					if #got > 0 then
						Net.send(e.player, "pickup", got[1])
						Net.toast(e.player, "Supply drop: " .. table.concat(got, " + "), "gold")
						taken = true
						break
					end
				end
			end
		end
		if taken then
			d.part:Destroy()
			table.remove(drops, i)
		end
	end
end

function Pickups.activeDrops()
	return drops
end

function Pickups.tick(now)
	if State.phase ~= "play" then
		return
	end
	tickDrops(now)
	for _, c in crates do
		if c.readyAt > 0 and now >= c.readyAt then
			c.readyAt = 0
			setReady(c, true)
		end
		if c.readyAt == 0 then
			for _, e in State.aliveList() do
				local root = e.char and e.char:FindFirstChild("HumanoidRootPart")
				if root and e.player and (root.Position - c.part.Position).Magnitude <= Config.Pickups.Radius then
					local id = rollFor(e)
					if id then
						Items.give(e, id, 1)
						c.readyAt = now + Config.Pickups.Respawn
						setReady(c, false)
						Net.send(e.player, "pickup", id)
						break
					end
				end
			end
		end
	end
end

return Pickups

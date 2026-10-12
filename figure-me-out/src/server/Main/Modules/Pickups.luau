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

local function setReady(c, on)
	c.part.Transparency = on and 0.1 or 1
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
	crates = {}
	for _, pos in Config.Map.Crates do
		local part = Instance.new("Part")
		part.Name = "ItemCrate"
		part.Size = Vector3.new(2.6, 2.6, 2.6)
		part.Position = pos + Vector3.new(0, 0.6, 0)
		part.Anchored = true
		part.CanCollide = false
		part.CanQuery = false
		part.Material = Enum.Material.Neon
		part.Color = Color3.fromRGB(60, 220, 255)
		part.Parent = parent
		local gui = Instance.new("BillboardGui")
		gui.Size = UDim2.fromOffset(60, 60)
		gui.StudsOffset = Vector3.new(0, 2.6, 0)
		gui.MaxDistance = 90
		gui.AlwaysOnTop = false
		gui.Parent = part
		local l = Instance.new("TextLabel")
		l.Size = UDim2.fromScale(1, 1)
		l.BackgroundTransparency = 1
		l.Text = "🎁"
		l.TextScaled = true
		l.Parent = gui
		local light = Instance.new("PointLight")
		light.Color = part.Color
		light.Range = 14
		light.Brightness = 2
		light.Parent = part
		table.insert(crates, { part = part, readyAt = 0 })
	end
end

function Pickups.reset()
	for _, c in crates do
		c.readyAt = 0
		setReady(c, true)
	end
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

function Pickups.tick(now)
	if State.phase ~= "play" then
		return
	end
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

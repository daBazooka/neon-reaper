-- FIGURE ME OUT: what can see what. A number can only be read, photographed or guessed when nothing solid is in the
-- way. The arena's walls and props and the smoke clouds block sight; people never do.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Rules = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Rules"))

local Vision = {}

Vision.clouds = {} -- { { pos = Vector3, radius = number, expires = number } } kept up to date by Items

local params = RaycastParams.new()
params.FilterType = Enum.RaycastFilterType.Include

local function arenaList()
	local arena = workspace:FindFirstChild("Arena")
	return arena and { arena } or {}
end

local function inSmoke(from, to)
	local now = workspace:GetServerTimeNow()
	for _, c in Vision.clouds do
		if c.expires > now and Rules.segmentHitsSphere(from, to, c.pos, c.radius) then
			return true
		end
	end
	return false
end

-- True when a wall, prop or (with includeSmoke) a smoke cloud is between the two points.
function Vision.blocked(from, to, includeSmoke)
	if includeSmoke ~= false and inSmoke(from, to) then
		return true
	end
	local list = arenaList()
	if #list == 0 then
		return false
	end
	params.FilterDescendantsInstances = list
	return workspace:Raycast(from, to - from, params) ~= nil
end

-- Distance to the first wall along a direction (arena only), or nil when nothing is that close.
function Vision.distanceAhead(from, direction, length)
	local list = arenaList()
	if #list == 0 then
		return nil
	end
	params.FilterDescendantsInstances = list
	local hit = workspace:Raycast(from, direction * length, params)
	if hit then
		return (hit.Position - from).Magnitude
	end
	return nil
end

function Vision.addCloud(pos, radius, expires)
	local c = { pos = pos, radius = radius, expires = expires }
	table.insert(Vision.clouds, c)
	return c
end

function Vision.clearClouds()
	Vision.clouds = {}
end

-- The head of an entity, or nil.
function Vision.head(e)
	local char = e.char
	return char and char:FindFirstChild("Head") or nil
end

return Vision

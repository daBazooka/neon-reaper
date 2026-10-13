-- FIGURE ME OUT: the client's picture of the match. Reads the attributes the server writes and finds the people in the
-- world, so every screen asks one place "who is there, is it my turn, what am I aiming at".
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))

local View = {}

local player = Players.LocalPlayer
local cache, cacheAt = {}, -1
local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Include

function View.now()
	return workspace:GetServerTimeNow()
end

function View.phase()
	return workspace:GetAttribute("Phase") or "lobby"
end

function View.timeLeft()
	return math.max(0, (workspace:GetAttribute("PhaseEnd") or 0) - View.now())
end

function View.aliveCount()
	return workspace:GetAttribute("Alive") or 0
end

function View.total()
	return workspace:GetAttribute("Total") or 0
end

function View.revealing()
	return workspace:GetAttribute("Reveal") == true
end

function View.camera()
	return workspace.CurrentCamera
end

function View.myHead()
	local char = player.Character
	return char and char:FindFirstChild("Head") or nil
end

function View.myId()
	return player:GetAttribute("EntityId") or player.UserId
end

-- True while I am a living player in the current match.
function View.amAlive()
	return player:GetAttribute("Alive") == true and (View.phase() == "play" or View.phase() == "countdown")
end

local function describe(model, source, alive, decoy)
	local id = source:GetAttribute("EntityId")
	if not id or not model then
		return nil
	end
	local head = model:FindFirstChild("Head")
	if not head then
		return nil
	end
	return {
		id = id,
		model = model,
		head = head,
		code = source:GetAttribute("Code") or "?",
		icon = source:GetAttribute("Icon") or "",
		alive = alive,
		decoy = decoy,
	}
end

-- Everyone in the match. Cached for a moment because several screens ask each frame.
function View.entities()
	local now = os.clock()
	if now - cacheAt < 0.12 then
		return cache
	end
	cacheAt = now
	local list = {}
	for _, p in Players:GetPlayers() do
		local e = describe(p.Character, p, p:GetAttribute("Alive") == true)
		if e then
			e.player = p
			e.me = p == player
			table.insert(list, e)
		end
	end
	local bots = workspace:FindFirstChild("Bots")
	if bots then
		for _, model in bots:GetChildren() do
			local e = describe(model, model, model:GetAttribute("Alive") == true)
			if e then
				table.insert(list, e)
			end
		end
	end
	local decoys = workspace:FindFirstChild("Decoys")
	if decoys then
		for _, model in decoys:GetChildren() do
			local e = describe(model, model, true, true)
			if e then
				table.insert(list, e)
			end
		end
	end
	cache = list
	return list
end

function View.byId(id)
	for _, e in View.entities() do
		if e.id == id then
			return e
		end
	end
	return nil
end

-- Everyone you could aim at: other living players, and decoys (which look exactly like players).
function View.targets()
	local list = {}
	for _, e in View.entities() do
		if (e.alive or e.decoy) and not e.me then
			table.insert(list, e)
		end
	end
	return list
end

function View.aliveOthers()
	local list = {}
	for _, e in View.entities() do
		if e.alive and not e.me then
			table.insert(list, e)
		end
	end
	return list
end

-- The centre and radius of the smoke cloud a puff belongs to.
function View.cloudOf(puff)
	local center = puff:GetAttribute("CloudCenter")
	local radius = puff:GetAttribute("CloudRadius")
	if center and radius then
		return center, radius
	end
	return puff.Position, puff.Size.X / 2
end

-- Is a wall or a smoke cloud in the way between two points?
function View.blocked(from, to)
	local arena = workspace:FindFirstChild("Arena")
	if arena then
		rayParams.FilterDescendantsInstances = { arena }
		if workspace:Raycast(from, to - from, rayParams) then
			return true
		end
	end
	local smoke = workspace:FindFirstChild("Smoke")
	if smoke then
		for _, s in smoke:GetChildren() do
			local center, radius = View.cloudOf(s)
			if Rules.segmentHitsSphere(from, to, center, radius) then
				return true
			end
		end
	end
	return false
end

-- Who is under the crosshair? Returns (entity, distance) for the closest-to-centre person I could shoot at, or nil.
function View.aimed()
	local head = View.myHead()
	local camera = View.camera()
	if not head or not camera then
		return nil
	end
	local origin, look = camera.CFrame.Position, camera.CFrame.LookVector
	local fov = camera.FieldOfView
	local limit = math.max(1.4, 5 * fov / 70) -- degrees; tighter when zoomed in
	local best, bestAngle, bestDistance
	for _, e in View.entities() do
		if not e.me and (e.alive or e.decoy) then
			local to = e.head.Position - origin
			local distance = to.Magnitude
			if distance > 1 and distance <= Config.Guess.MaxDistance then
				local angle = math.deg(math.acos(math.clamp(to.Unit:Dot(look), -1, 1)))
				-- the person nearest the middle wins; when two are lined up, the nearer one does
				local score = angle + distance * 0.002
				if angle <= limit and (not bestAngle or score < bestAngle) and not View.blocked(origin, e.head.Position) and not View.blocked(head.Position, e.head.Position) then
					best, bestAngle, bestDistance = e, score, distance
				end
			end
		end
	end
	return best, bestDistance
end

return View

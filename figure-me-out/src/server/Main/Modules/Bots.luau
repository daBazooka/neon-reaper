-- FIGURE ME OUT: simple computer players that walk the streets and sometimes guess. They keep a match lively when few
-- people are online, and they make sure "someone is always watching". They are clumsy on purpose.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local Canyon = require(Shared:WaitForChild("Canyon"))
local State = require(script.Parent.State)
local Vision = require(script.Parent.Vision)
local Guess = require(script.Parent.Guess)
local Items = require(script.Parent.Items)

local Bots = {}

local rng = Random.new()
local LEVEL = 3.5

local function skill()
	local c = Config.Bots
	return c.God and c or c.Normal
end

local function fallbackModel()
	local model = Instance.new("Model")
	local function part(name, size, pos)
		local p = Instance.new("Part")
		p.Name = name
		p.Size = size
		p.Position = pos
		p.Parent = model
		return p
	end
	local root = part("HumanoidRootPart", Vector3.new(2, 2, 1), Vector3.new(0, 3, 0))
	part("Head", Vector3.new(1.2, 1.2, 1.2), Vector3.new(0, 4.6, 0))
	part("Torso", Vector3.new(2, 2, 1), Vector3.new(0, 3, 0))
	model.PrimaryPart = root
	local hum = Instance.new("Humanoid")
	hum.Parent = model
	return model
end

local WALK_ANIMATION = "rbxassetid://507777826" -- Roblox's own R15 walk and idle animations
local IDLE_ANIMATION = "rbxassetid://507766666"

-- Makes a bot swing its arms and legs while it walks. Skipped silently when animations can't load.
function Bots.animate(model)
	pcall(function()
		local hum = model:FindFirstChildOfClass("Humanoid")
		if not hum then
			return
		end
		local animator = hum:FindFirstChildOfClass("Animator")
		if not animator then
			animator = Instance.new("Animator")
			animator.Parent = hum
		end
		local walk = Instance.new("Animation")
		walk.AnimationId = WALK_ANIMATION
		local idle = Instance.new("Animation")
		idle.AnimationId = IDLE_ANIMATION
		local walkTrack = animator:LoadAnimation(walk)
		local idleTrack = animator:LoadAnimation(idle)
		walkTrack.Looped = true
		idleTrack.Looped = true
		idleTrack:Play()
		hum.Running:Connect(function(speed)
			if speed > 0.5 then
				if not walkTrack.IsPlaying then
					walkTrack:Play()
				end
				walkTrack:AdjustSpeed(math.clamp(speed / 14, 0.4, 2))
			else
				walkTrack:Stop()
			end
		end)
	end)
end

-- A fresh blocky character with a Humanoid, parented under workspace.Bots.
function Bots.makeModel(name)
	local model
	local ok = pcall(function()
		model = Players:CreateHumanoidModelFromDescription(Instance.new("HumanoidDescription"), Enum.HumanoidRigType.R15)
	end)
	if not ok or not model then
		model = fallbackModel()
	end
	model.Name = name
	local folder = workspace:FindFirstChild("Bots")
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = "Bots"
		folder.Parent = workspace
	end
	model.Parent = folder
	Bots.animate(model)
	return model
end

function Bots.place(e, spawn)
	local pos = Vector3.new(spawn.X, LEVEL + 2, spawn.Z)
	e.char:PivotTo(CFrame.new(pos, Vector3.new(0, pos.Y, 0)))
	e.node = { X = spawn.X, Z = spawn.Z }
	e.route = {}
	e.nextGuessAt = State.now() + rng:NextNumber(6, 12)
end

local function pickDestination(e)
	if Config.Map.Theme == "canyon" then
		-- the canyon has no streets: walk from open spot to open spot, round the trees, rocks and the lake
		local nodes = Canyon.Nodes
		local s = nodes[rng:NextInteger(1, #nodes)]
		local root = e.char and e.char:FindFirstChild("HumanoidRootPart")
		local from = root and { X = root.Position.X, Z = root.Position.Z } or e.node or { X = s[1], Z = s[2] }
		local goal = { X = s[1], Z = s[2] }
		-- round the obstacles with room to spare; if the bot is already squeezed in somewhere, with less room; failing that,
		-- walk to the nearest open spot first (never straight through a tree)
		local route = Rules.route(from, goal, nodes, Canyon.Blockers, Canyon.WalkPad) or Rules.route(from, goal, nodes, Canyon.Blockers, 1.5)
		if not route then
			local nearest, best = nodes[1], math.huge
			for _, n in nodes do
				local d = (n[1] - from.X) ^ 2 + (n[2] - from.Z) ^ 2
				if d < best then
					nearest, best = n, d
				end
			end
			route = { { X = nearest[1], Z = nearest[2] } }
			s = nearest
		end
		e.route = route
		e.node = { X = s[1], Z = s[2] }
		e.routeIndex = 1
		return
	end
	local spawns = Config.Map.Spawns
	local s = spawns[rng:NextInteger(1, #spawns)]
	e.route = Rules.streetRoute(e.node, { X = s.X, Z = s.Z }, rng:NextNumber() < 0.5)
	e.node = { X = s.X, Z = s.Z }
	e.routeIndex = 1
end

local function walk(e, now)
	local hum = e.char:FindFirstChildOfClass("Humanoid")
	local root = e.char:FindFirstChild("HumanoidRootPart")
	if not hum or not root then
		return
	end
	-- fake footsteps nearby? go and check them out (this is what makes the distraction device a good bait)
	local lure = Items.nearestDistraction(root.Position, Config.Distraction.Radius)
	if lure and not Vision.blocked(root.Position + Vector3.new(0, 2, 0), lure.pos + Vector3.new(0, 2, 0), false) then
		hum:MoveTo(Vector3.new(lure.pos.X, root.Position.Y, lure.pos.Z))
		e.lastPos = root.Position
		e.route = {}
		return
	end
	if not e.route or #e.route == 0 or e.routeIndex > #e.route then
		pickDestination(e)
	end
	local goal = e.route[e.routeIndex]
	local target = Vector3.new(goal.X, root.Position.Y, goal.Z)
	local dx, dz = target.X - root.Position.X, target.Z - root.Position.Z
	-- (in the canyon a bot must get right to each waypoint, or it would cut corners through trees and rocks)
	if dx * dx + dz * dz < (Config.Map.Theme == "canyon" and 2.25 or 16) then
		e.routeIndex += 1
		e.stuckSince = nil
		return
	end
	hum:MoveTo(target)
	-- stuck? hop, and after a while pick somewhere else
	local last = e.lastPos
	if last and (last - root.Position).Magnitude < 0.5 and hum.WalkSpeed > 0 then
		e.stuckSince = e.stuckSince or now
		if now - e.stuckSince > 1.5 then
			hum.Jump = true
		end
		if now - e.stuckSince > 5 then
			e.route = {}
			e.stuckSince = nil
		end
	else
		e.stuckSince = nil
	end
	e.lastPos = root.Position
end

-- The living entities this bot can see well enough to read.
local function candidates(e)
	local list = {}
	local mine = Vision.head(e)
	if not mine then
		return list
	end
	for _, other in State.aliveList() do
		local head = Vision.head(other)
		if other ~= e and head and not (State.mode.Teams and other.team == e.team) then
			local offset = mine.Position - head.Position
			local d = offset.Magnitude
			if d <= skill().SightRange and d > 1 and head.CFrame.LookVector:Dot(offset.Unit) > 0.55 and not Vision.blocked(mine.Position, head.Position, true) then
				table.insert(list, other)
			end
		end
	end
	return list
end

local function think(e, now)
	if now < (e.nextGuessAt or 0) or (e.blindUntil or 0) > now or (e.stunUntil or 0) > now then
		return
	end
	local gap = skill().GuessEvery
	e.nextGuessAt = now + rng:NextNumber(gap[1], gap[2])
	local list = candidates(e)
	if #list == 0 then
		e.nextGuessAt = now + rng:NextNumber(2, 4)
		return
	end
	local target = list[rng:NextInteger(1, #list)]
	local text = target.number
	if rng:NextNumber() > skill().Accuracy then
		text = Rules.digitsOf(rng:NextInteger(Config.Number.Min, Config.Number.Max))
		if text == target.number then
			text = Rules.digitsOf(Config.Number.Min + (tonumber(text) - Config.Number.Min + 1) % 900)
		end
	end
	Guess.attempt(e, target.id, text)
end

function Bots.tick(now)
	if State.phase ~= "play" then
		return
	end
	for _, e in State.aliveList() do
		if e.dummy then
			-- a practice dummy never walks or guesses: it turns slowly on the spot, so its sign can be read from every side
			e.turn = (e.turn or 0) + 0.22
			local root = e.char and e.char:FindFirstChild("HumanoidRootPart")
			if root then
				e.char:PivotTo(CFrame.new(root.Position) * CFrame.Angles(0, e.turn, 0))
			end
		elseif e.bot then
			walk(e, now)
			think(e, now)
		end
	end
end

-- Called when the start whistle blows: bots wait a while before their first guess so people can look around.
function Bots.startPlay(now)
	for _, e in State.list() do
		if e.bot then
			local f = skill().FirstGuess
			e.nextGuessAt = now + rng:NextNumber(f[1], f[2])
		end
	end
end

function Bots.clear()
	local folder = workspace:FindFirstChild("Bots")
	if folder then
		folder:ClearAllChildren()
	end
end

return Bots

-- SUB 5 TO TRUE ADAM: draws every player's equipped pets on your own screen. They trot after their owner with real
-- animal animation (walk cycle, tail sway, wing flaps...), turn to face where they are going, and hover or swim for
-- the flying ones. Doing this on each client keeps it smooth and costs the server nothing.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Animals = require(Shared:WaitForChild("Animals"))

local PetsView = {}

local camera = workspace:WaitForChild("Camera")
local folder
local views = {} -- Player -> { eq = string, pets = { { rig, pos, yaw } } }

-- Where each pet walks, relative to its owner (x = right, z = behind).
local SLOTS = { Vector3.new(-4.2, 0, 5), Vector3.new(0, 0, 8.2), Vector3.new(4.2, 0, 5) }
local NEAR = 120 -- animate pets closer than this to the camera

local function destroyView(view)
	for _, pet in view.pets do
		pet.rig.model:Destroy()
	end
	view.pets = {}
end

local function rebuild(view, eq)
	destroyView(view)
	view.eq = eq
	for id in string.gmatch(eq, "%w+") do
		local def = Config.PetById[id]
		local rig = def and Animals.build(def.Species)
		if rig then
			rig.model.Parent = folder
			table.insert(view.pets, { rig = rig, pos = nil, yaw = 0, groundY = nil, lastRay = 0, shown = true })
		end
	end
end

local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Exclude

local function groundAt(x, y, z, fallback)
	local hit = workspace:Raycast(Vector3.new(x, y + 6, z), Vector3.new(0, -40, 0), rayParams)
	return hit and hit.Position.Y or fallback
end

local function step(player, view, dt, now)
	local char = player.Character
	local root = char and char:FindFirstChild("HumanoidRootPart")
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not root or not hum then
		return
	end
	local eq = player:GetAttribute("PetsEq") or ""
	if eq ~= view.eq then
		rebuild(view, eq)
	end
	local cf = root.CFrame
	local fallbackGround = root.Position.Y - (hum.HipHeight + root.Size.Y / 2) - (hum.RigType == Enum.HumanoidRigType.R6 and 2 or 0)
	local scaleUp = math.clamp(root.Size.Y / 2, 0.8, 1.6)
	for i, pet in view.pets do
		local rig = pet.rig
		local slot = SLOTS[i] or SLOTS[2]
		local want = cf:PointToWorldSpace(Vector3.new(slot.X * scaleUp, 0, slot.Z * scaleUp))
		if not pet.pos then
			pet.pos = Vector3.new(want.X, fallbackGround, want.Z)
			pet.groundY = fallbackGround
		end
		-- ground height (a ray a few times a second, not every frame)
		if now - pet.lastRay > 0.25 then
			pet.lastRay = now
			pet.groundY = groundAt(pet.pos.X, root.Position.Y, pet.pos.Z, fallbackGround)
		end
		local old = pet.pos
		local flat = Vector3.new(want.X - old.X, 0, want.Z - old.Z)
		local dist = flat.Magnitude
		-- follow: speed grows with the gap so pets keep up with a sprinting owner
		local move = flat * math.min(1, dt * (2 + dist * 0.6))
		local nx, nz = old.X + move.X, old.Z + move.Z
		if dist > 40 then
			nx, nz = want.X, want.Z -- fell far behind (teleport): snap
		end
		pet.pos = Vector3.new(nx, pet.groundY, nz)
		local speed = dt > 0 and math.sqrt((nx - old.X) ^ 2 + (nz - old.Z) ^ 2) / dt or 0
		-- face the way we are walking, or the way the owner faces when standing still
		local targetYaw
		if speed > 1 then
			targetYaw = math.atan2(-(nx - old.X), -(nz - old.Z))
		else
			local look = cf.LookVector
			targetYaw = math.atan2(-look.X, -look.Z)
		end
		local diff = (targetYaw - pet.yaw + math.pi) % (math.pi * 2) - math.pi
		pet.yaw += diff * math.min(1, dt * 8)
		local near = (camera.CFrame.Position - pet.pos).Magnitude < NEAR
		-- far-away pets are taken out of the world entirely (they have 100+ parts each)
		if near ~= pet.shown then
			pet.shown = near
			rig.model.Parent = near and folder or nil
		end
		local breath = near and Animals.animate(rig, dt, speed) or 0
		local bob = 0
		if rig.def.float and rig.def.float > 0 then
			bob = math.sin(now * 2 + i) * 0.35
		end
		rig.root.CFrame = CFrame.new(pet.pos.X, pet.pos.Y + rig.groundDrop + breath + bob, pet.pos.Z) * CFrame.Angles(0, pet.yaw, 0)
	end
end

function PetsView.init()
	folder = Instance.new("Folder")
	folder.Name = "GlowPetsLocal"
	folder.Parent = workspace
	rayParams.FilterDescendantsInstances = { folder }
	Players.PlayerRemoving:Connect(function(player)
		local view = views[player]
		if view then
			destroyView(view)
			views[player] = nil
		end
	end)
	RunService.RenderStepped:Connect(function(dt)
		local now = os.clock()
		dt = math.min(dt, 0.1)
		for _, player in Players:GetPlayers() do
			local view = views[player]
			if not view then
				view = { eq = "", pets = {} }
				views[player] = view
			end
			local ok, err = pcall(step, player, view, dt, now)
			if not ok then
				warn("[TrueAdam] pet update failed:", err)
				destroyView(view)
				view.eq = ""
				task.wait(1)
			end
		end
	end)
end

return PetsView

-- SUB 5 TO TRUE ADAM: every place has its own camera angle. Walk into the gym, the studio, the lounge,
-- the crate shop, the duel ring, the Mog Stage or the catwalk and the camera glides to that place's
-- cinematic view; walk out and it eases back to the normal follow camera. Can be switched off in Settings.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Fx = require(script.Parent.Fx)

local ZoneCamera = {}

local player = Players.LocalPlayer
local camera = workspace:WaitForChild("Camera")

local current -- the zone the player is in
local ownsCamera = false -- true while we have the camera set to Scriptable
local releaseTime = 0
local onEnter

function ZoneCamera.onEnter(fn)
	onEnter = fn
end

local function frontOf(zone)
	return zone.Front or Config.StationFront(zone.Station)
end

-- Is the point inside this zone? `pad` makes the exit slightly bigger than the entrance so the
-- camera doesn't flicker when you stand on the edge.
local function contains(zone, pos, pad)
	if zone.Kind == "station" then
		local c = Config.StationPos(zone.Station)
		return (Vector3.new(pos.X, 0, pos.Z) - c).Magnitude < zone.Radius + pad
	elseif zone.Kind == "circle" then
		return (Vector3.new(pos.X, 0, pos.Z) - zone.Center).Magnitude < zone.Radius + pad
	end
	return pos.X > zone.MinX - pad and pos.X < zone.MaxX + pad and pos.Z > zone.MinZ - pad and pos.Z < zone.MaxZ + pad
end

local function findZone(pos)
	if current and contains(current, pos, 4) then
		return current
	end
	for _, zone in Config.Zones do
		if contains(zone, pos, 0) then
			return zone
		end
	end
	return nil
end

local function zoneCFrame(zone, rootPos)
	local cam = zone.Cam
	local dir = CFrame.Angles(0, math.rad(cam.Yaw), 0):VectorToWorldSpace(frontOf(zone))
	local target = rootPos + Vector3.new(0, cam.Look, 0)
	local position = target + dir * cam.Dist + Vector3.new(0, cam.Height, 0)
	return CFrame.lookAt(position, target)
end

function ZoneCamera.init()
	RunService:BindToRenderStep("GlowZoneCamera", Enum.RenderPriority.Camera.Value + 1, function(dt)
		local char = player.Character
		local root = char and char:FindFirstChild("HumanoidRootPart")
		local enabled = player:GetAttribute("Set_Cam") ~= false
		local zone = (enabled and root) and findZone(root.Position) or nil

		if zone ~= current then
			current = zone
			Fx.setBaseFov(zone and zone.Cam.Fov or 70)
			if zone and onEnter then
				onEnter(zone)
			end
		end

		local alpha = 1 - math.exp(-dt * 3.2)
		if current and root then
			if not ownsCamera then
				ownsCamera = true
				camera.CameraType = Enum.CameraType.Scriptable
			end
			releaseTime = 0
			camera.CFrame = camera.CFrame:Lerp(zoneCFrame(current, root.Position), alpha)
		elseif ownsCamera then
			-- Ease back to a follow position behind the character, then hand control back.
			if root then
				local back = CFrame.lookAt(root.Position - root.CFrame.LookVector * 12 + Vector3.new(0, 6, 0), root.Position + Vector3.new(0, 2, 0))
				camera.CFrame = camera.CFrame:Lerp(back, alpha * 1.5)
			end
			releaseTime += dt
			if releaseTime > 0.7 or not root then
				ownsCamera = false
				camera.CameraType = Enum.CameraType.Custom
			end
		end
	end)
end

return ZoneCamera

-- FIGURE ME OUT: the camera. By default you play in third person with mouse-wheel zoom (0.5 to 30 studs) and wall-proof "Zoom" occlusion,
-- so the camera never clips and your own character never disappears. (With Config.Camera.FirstPerson = true you would play in first person: you see through your own eyes, your own
-- body and head are hidden from you, and the crosshair is always in the middle. In the lobby, while spectating and on the results
-- screen you get the normal third-person camera. Your own forehead number is hidden from you in every view (see OwnPlate).
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local View = require(script.Parent:WaitForChild("View"))

local Camera = {}

local player = Players.LocalPlayer
local mode = nil -- "first" or "third"
local scoped = false -- looking through the binoculars: the camera moves into your head, so you see the open ground and not the back of your own head

function Camera.mode()
	return mode
end

-- The mode we want right now.
function Camera.wanted()
	if scoped or (Config.Camera.FirstPerson and View.amAlive()) then
		return "first"
	end
	return "third"
end

-- Zoom range, occlusion and movement mode (the same values are also set on StarterPlayer in the project file).
local function setup()
	pcall(function()
		player.CameraMinZoomDistance = Config.Camera.MinZoom
		player.CameraMaxZoomDistance = Config.Camera.MaxZoom
		player.DevCameraOcclusionMode = Enum.DevCameraOcclusionMode[Config.Camera.Occlusion] or Enum.DevCameraOcclusionMode.Zoom
		player.DevComputerCameraMode = Enum.DevComputerCameraMovementMode.UserChoice
		player.DevTouchCameraMode = Enum.DevTouchCameraMovementMode.UserChoice
	end)
end

local function apply(want)
	if want == mode then
		return
	end
	mode = want
	pcall(function()
		if want == "first" then
			player.CameraMode = Enum.CameraMode.LockFirstPerson
		else
			player.CameraMode = Enum.CameraMode.Classic
			setup()
			-- pull back out of first person: ask for a minimum distance for a moment, then allow zooming in again
			player.CameraMinZoomDistance = 12
			task.delay(0.2, function()
				player.CameraMinZoomDistance = Config.Camera.MinZoom
			end)
		end
	end)
end

-- The binoculars call this: while they are up the view is first person (from your eyes), and it goes back when they come down.
function Camera.setScoped(on)
	scoped = on == true
	apply(Camera.wanted())
end

function Camera.init()
	setup()
	apply(Camera.wanted())
	player:GetAttributeChangedSignal("Alive"):Connect(function()
		apply(Camera.wanted())
	end)
	task.spawn(function()
		while true do
			task.wait(0.25)
			apply(Camera.wanted())
		end
	end)
end

-- For the tests: re-evaluate right now.
function Camera.refresh()
	apply(Camera.wanted())
end

return Camera

-- FIGURE ME OUT: the camera. During a match (while you are alive) you play in first person: you see through your own eyes, your own
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

function Camera.mode()
	return mode
end

-- The mode we want right now.
function Camera.wanted()
	if Config.Camera.FirstPerson and View.amAlive() then
		return "first"
	end
	return "third"
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
			player.CameraMaxZoomDistance = Config.Camera.MaxZoom
			-- pull back out of first person: ask for a minimum distance for a moment, then allow zooming in again
			player.CameraMinZoomDistance = 12
			task.delay(0.2, function()
				player.CameraMinZoomDistance = 0.5
			end)
		end
	end)
end

function Camera.init()
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

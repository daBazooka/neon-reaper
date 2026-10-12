-- FIGURE ME OUT: little markers drawn only on your screen: the green 🤝 over your ally, and the pings from your scanner.
-- A scanner ping shows WHERE someone is (through walls) and who they are by codename, never their number.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))
local View = require(script.Parent:WaitForChild("View"))

local Markers = {}

local player = Players.LocalPlayer
local C = UI.Colors
local folder
local allyGui

local function makeGui(parent, size, text, color, offset)
	local gui = Instance.new("BillboardGui")
	gui.Size = size
	gui.AlwaysOnTop = true
	gui.LightInfluence = 0
	gui.StudsOffset = offset or Vector3.new(0, 0, 0)
	gui.Adornee = parent
	gui.Parent = parent
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBold
	label.TextSize = 14
	label.TextColor3 = color
	label.TextStrokeTransparency = 0.2
	label.Text = text
	label.Parent = gui
	return gui, label
end

function Markers.init()
	folder = Instance.new("Folder")
	folder.Name = "ClientMarkers"
	folder.Parent = workspace
	task.spawn(function()
		while true do
			task.wait(0.4)
			Markers.updateAlly()
		end
	end)
end

-- The green marker over your ally's head (only you see it).
function Markers.updateAlly()
	local allyId = player:GetAttribute("Ally") or 0
	local entity = allyId ~= 0 and View.phase() == "play" and View.byId(allyId) or nil
	if allyGui and (not entity or allyGui.Adornee ~= entity.head) then
		allyGui:Destroy()
		allyGui = nil
	end
	if entity and entity.alive and not allyGui then
		allyGui = makeGui(entity.head, UDim2.fromOffset(110, 26), "🤝 ALLY", C.Good, Vector3.new(0, 3.2, 0))
	end
end

-- rows: { { id, code, icon, position, distance } } from the server's scanner.
function Markers.scan(rows, seconds)
	Audio.scan()
	for _, row in rows do
		local part = Instance.new("Part")
		part.Anchored = true
		part.CanCollide = false
		part.CanQuery = false
		part.Transparency = 1
		part.Size = Vector3.new(1, 1, 1)
		part.Position = row[4]
		part.Parent = folder
		makeGui(part, UDim2.fromOffset(150, 40), "📡 " .. row[3] .. " " .. row[2] .. "\n" .. row[5] .. " m", C.Accent, Vector3.new(0, 1.5, 0))
		task.delay(seconds, function()
			part:Destroy()
		end)
	end
	return #rows
end

return Markers

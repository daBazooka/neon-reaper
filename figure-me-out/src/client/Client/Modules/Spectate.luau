-- FIGURE ME OUT: once you are out, you watch the others. The camera follows a living player; press ◀ ▶ (or the arrow
-- keys) to switch to somebody else.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))
local View = require(script.Parent:WaitForChild("View"))

local Spectate = {}

local player = Players.LocalPlayer
local C = UI.Colors
local bar, nameLabel
local watching = nil -- entity id
local active = false
local optIn = false -- somebody waiting for the next match (never in this one) only watches when they ask to

function Spectate.isActive()
	return active
end

function Spectate.init(gui)
	bar = UI.panel(gui, {
		Name = "Spectate",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -16),
		Size = UDim2.fromOffset(400, 56),
		Visible = false,
		ZIndex = 35,
	})
	local function arrow(text, x, step)
		local b = UI.button(bar, {
			Position = UDim2.fromOffset(x, 8),
			Size = UDim2.fromOffset(44, 40),
			Text = text,
			TextSize = 20,
			BackgroundColor3 = C.Card,
			ZIndex = 36,
		}, "card")
		b.MouseButton1Click:Connect(function()
			Audio.click()
			Spectate.cycle(step)
		end)
	end
	arrow("◀", 8, -1)
	arrow("▶", 348, 1)
	nameLabel = UI.label(bar, {
		Position = UDim2.fromOffset(56, 4),
		Size = UDim2.new(1, -112, 1, -8),
		Font = UI.Fonts.Title,
		TextSize = 18,
		TextXAlignment = Enum.TextXAlignment.Center,
		Text = "",
		ZIndex = 36,
	})
	task.spawn(function()
		while true do
			task.wait(0.2)
			Spectate.update()
		end
	end)
end

local function living()
	local list = View.aliveOthers()
	table.sort(list, function(a, b)
		return a.id < b.id
	end)
	return list
end

-- The "watch the match" button on the waiting card: waiting players walk about the lobby until they choose to watch.
function Spectate.toggleWatch()
	optIn = not optIn
	Spectate.update()
	return optIn
end

function Spectate.wantsToWatch()
	return optIn
end

function Spectate.cycle(step)
	local list = living()
	if #list == 0 then
		return
	end
	local index = 0
	for i, e in list do
		if e.id == watching then
			index = i
		end
	end
	index = (index - 1 + step) % #list + 1
	watching = list[index].id
	Spectate.update()
end

local function restoreCamera()
	local camera = View.camera()
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if camera and hum then
		camera.CameraSubject = hum
	end
end

function Spectate.update()
	local phase = View.phase()
	local inMatchPhase = phase == "play" or phase == "countdown"
	if not inMatchPhase then
		optIn = false
	end
	local waiting = player:GetAttribute("Playing") == false -- (never in this match)
	local out = player:GetAttribute("Alive") ~= true and inMatchPhase and (not waiting or optIn)
	local list = out and living() or {}
	if #list == 0 then
		if active then
			active = false
			watching = nil
			bar.Visible = false
			restoreCamera()
		end
		return
	end
	local target
	for _, e in list do
		if e.id == watching then
			target = e
		end
	end
	if not target then
		target = list[1]
		watching = target.id
	end
	active = true
	bar.Visible = true
	nameLabel.Text = "👁 WATCHING  " .. target.icon .. " " .. target.code
	local camera = View.camera()
	local hum = target.model:FindFirstChildOfClass("Humanoid")
	if camera and hum and camera.CameraSubject ~= hum then
		camera.CameraSubject = hum
	end
end

return Spectate

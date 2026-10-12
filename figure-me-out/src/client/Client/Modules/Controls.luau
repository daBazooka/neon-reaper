-- FIGURE ME OUT: keyboard and mouse. G guess, hold right mouse (or Z) for binoculars, click or F for a photo, V for
-- the notebook, 1 to 8 for items, M for the menu, arrow keys to change who you watch.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Audio = require(Shared:WaitForChild("Audio"))
local View = require(script.Parent:WaitForChild("View"))

local Controls = {}

local player = Players.LocalPlayer
local deps
local lastSnap = -100

local HOTKEYS = {}
for i, name in { "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight" } do
	HOTKEYS[Enum.KeyCode[name]] = Config.Items[i].Id
end

local function canAct()
	return View.phase() == "play" and View.amAlive() and player:GetAttribute("Stunned") ~= true and not deps.Alerts.isStunned()
end

function Controls.guess()
	if deps.Keypad.isOpen() then
		deps.Keypad.close()
		return
	end
	if not canAct() then
		return
	end
	deps.Keypad.open()
end

function Controls.guessSent(target)
	deps.Fx.punch(2)
end

function Controls.snap()
	if not canAct() or deps.Alerts.isBlind() then
		return
	end
	local now = View.now()
	if now - lastSnap < Config.Photo.Cooldown then
		return
	end
	local camera = View.camera()
	if not camera then
		return
	end
	lastSnap = now
	deps.send("Snap", camera.CFrame.Position, camera.CFrame.LookVector)
	deps.Hud.snapCooldown(Config.Photo.Cooldown)
	deps.Fx.flash(Color3.new(1, 1, 1), 0.55, 0.25)
	Audio.snap()
end

function Controls.use(id)
	if not canAct() then
		return
	end
	if (player:GetAttribute("It_" .. id) or 0) < 1 then
		Audio.error()
		return
	end
	local camera = View.camera()
	deps.send("Use", id, camera and camera.CFrame.LookVector or nil)
end

function Controls.fireFromNotebook(id, digits, entry)
	if not canAct() then
		return
	end
	deps.send("Guess", id, digits)
	Controls.guessSent(entry)
end

function Controls.init(d)
	deps = d
	UserInputService.InputBegan:Connect(function(input, processed)
		if deps.Keypad.key(input) then
			return
		end
		if processed then
			return
		end
		local kc = input.KeyCode
		local kind = input.UserInputType
		if kc == Enum.KeyCode.G then
			Controls.guess()
		elseif kc == Enum.KeyCode.F then
			Controls.snap()
		elseif kc == Enum.KeyCode.V then
			deps.Album.toggle()
		elseif kc == Enum.KeyCode.M then
			deps.Menu.toggle()
		elseif kc == Enum.KeyCode.Z or kind == Enum.UserInputType.MouseButton2 then
			deps.Scope.set(true)
		elseif kc == Enum.KeyCode.Left then
			deps.Spectate.cycle(-1)
		elseif kc == Enum.KeyCode.Right then
			deps.Spectate.cycle(1)
		elseif HOTKEYS[kc] then
			deps.Hud.activate(HOTKEYS[kc])
		elseif kind == Enum.UserInputType.MouseButton1 and not deps.Menu.isOpen() and not deps.Album.isOpen() then
			Controls.snap()
		end
	end)
	UserInputService.InputEnded:Connect(function(input)
		if input.KeyCode == Enum.KeyCode.Z or input.UserInputType == Enum.UserInputType.MouseButton2 then
			deps.Scope.set(false)
		end
	end)
	UserInputService.InputChanged:Connect(function(input, processed)
		if input.UserInputType == Enum.UserInputType.MouseWheel and deps.Scope.isOn() then
			deps.Scope.zoom(input.Position.Z)
		end
	end)
end

return Controls

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
local padSelected = 3 -- the gadget a controller player has selected (hotbar slot)

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

-- Ask the player you are aiming at to team up, or end your alliance if you have one.
function Controls.ally()
	if not canAct() then
		return
	end
	if (player:GetAttribute("Ally") or 0) ~= 0 then
		deps.send("AllyEnd")
		return
	end
	local target = View.aimed()
	if not target or not target.player then
		deps.Toasts.push("Aim at another player to offer an alliance", "bad")
		Audio.error()
		return
	end
	deps.send("AllyAsk", target.id)
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
		local F = Config.Features
		if kc == Enum.KeyCode.G then
			Controls.guess()
		elseif kc == Enum.KeyCode.F then
			if F.Photos then
				Controls.snap()
			end
		elseif kc == Enum.KeyCode.V then
			if F.Photos then
				deps.Album.toggle()
			end
		elseif kc == Enum.KeyCode.T then
			if F.Alliances then
				Controls.ally()
			end
		elseif kc == Enum.KeyCode.I then
			if F.Gadgets then
				deps.Inventory.toggle()
			end
		elseif kc == Enum.KeyCode.B then
			deps.Emotes.toggle()
		-- game controller: X guess, R2 photo, L2 hold for binoculars, Y notebook, L1/R1 choose a gadget, A use it
		elseif kc == Enum.KeyCode.ButtonX then
			Controls.guess()
		elseif kc == Enum.KeyCode.ButtonR2 then
			if F.Photos then
				Controls.snap()
			end
		elseif kc == Enum.KeyCode.ButtonL2 then
			if F.Binoculars then
				deps.Scope.set(true)
			end
		elseif kc == Enum.KeyCode.ButtonY then
			if F.Photos then
				deps.Album.toggle()
			end
		elseif (kc == Enum.KeyCode.ButtonL1 or kc == Enum.KeyCode.ButtonR1) and F.Gadgets then
			local step = kc == Enum.KeyCode.ButtonR1 and 1 or -1
			padSelected = (padSelected - 3 + step) % #Config.CarriedItems + 3
			deps.Toasts.push(Config.Items[padSelected].Icon .. " " .. Config.Items[padSelected].Name .. " ready (press A)", "info")
		elseif kc == Enum.KeyCode.ButtonA and View.phase() == "play" and not deps.Keypad.isOpen() then
			if F.Gadgets then
				deps.Hud.activate(Config.Items[padSelected].Id)
			else
				Controls.guess()
			end
		elseif kc == Enum.KeyCode.ButtonStart then
			deps.Menu.toggle()
		elseif kc == Enum.KeyCode.M then
			deps.Menu.toggle()
		elseif kc == Enum.KeyCode.Z or kind == Enum.UserInputType.MouseButton2 then
			if F.Binoculars then
				deps.Scope.set(true)
			end
		elseif kc == Enum.KeyCode.Left then
			deps.Spectate.cycle(-1)
		elseif kc == Enum.KeyCode.Right then
			deps.Spectate.cycle(1)
		elseif HOTKEYS[kc] then
			if F.Gadgets or HOTKEYS[kc] == "binos" and F.Binoculars or HOTKEYS[kc] == "camera" and F.Photos then
				deps.Hud.activate(HOTKEYS[kc])
			end
		elseif kind == Enum.UserInputType.MouseButton1 and not deps.Menu.isOpen() and not deps.Album.isOpen() then
			if F.Photos then
				Controls.snap()
			elseif View.phase() == "play" and not deps.Keypad.isOpen() then
				Controls.guess() -- click or tap on somebody: the number pad opens
			end
		elseif kind == Enum.UserInputType.Touch and not deps.Menu.isOpen() and not deps.Album.isOpen() and View.phase() == "play" and not deps.Keypad.isOpen() then
			Controls.guess()
		end
	end)
	UserInputService.InputEnded:Connect(function(input)
		if input.KeyCode == Enum.KeyCode.Z or input.KeyCode == Enum.KeyCode.ButtonL2 or input.UserInputType == Enum.UserInputType.MouseButton2 then
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

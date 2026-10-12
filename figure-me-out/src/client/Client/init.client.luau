-- FIGURE ME OUT: client entry point. Builds the screen, wires every module together and routes the server's messages.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))

local Net = ReplicatedStorage:WaitForChild("Net")
local Action = Net:WaitForChild("Action")
local Notify = Net:WaitForChild("Notify")

local Modules = script:WaitForChild("Modules")
local Fx = require(Modules.Fx)
local Toasts = require(Modules.Toasts)
local Hud = require(Modules.Hud)
local Keypad = require(Modules.Keypad)
local Scope = require(Modules.Scope)
local Album = require(Modules.Album)
local Alerts = require(Modules.Alerts)
local Spectate = require(Modules.Spectate)
local Results = require(Modules.Results)
local Menu = require(Modules.Menu)
local Controls = require(Modules.Controls)
local OwnPlate = require(Modules.OwnPlate)

local gui = Instance.new("ScreenGui")
gui.Name = "FigureMeOut"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
gui.Parent = player:WaitForChild("PlayerGui")

local deps = {
	send = function(kind, ...)
		Action:FireServer(kind, ...)
	end,
	Fx = Fx,
	Toasts = Toasts,
	Hud = Hud,
	Keypad = Keypad,
	Scope = Scope,
	Album = Album,
	Alerts = Alerts,
	Spectate = Spectate,
	Menu = Menu,
	Controls = Controls,
}

pcall(function()
	player.CameraMaxZoomDistance = 14
end)
-- the player list, health bar and backpack would sit on top of the game's own screens
task.spawn(function()
	local StarterGui = game:GetService("StarterGui")
	for _ = 1, 10 do
		local ok = pcall(function()
			StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.PlayerList, false)
			StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false)
			StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.Health, false)
		end)
		if ok then
			break
		end
		task.wait(0.5)
	end
end)

Audio.Init()
Fx.init(gui)
Toasts.init(gui)
Alerts.init(gui, deps)
Scope.init(gui, deps)
Keypad.init(gui, deps)
Album.init(gui, deps)
Spectate.init(gui)
Results.init(gui, deps)
Menu.init(gui, deps)
Hud.init(gui, deps)
Controls.init(deps)
OwnPlate.init()
Audio.startMusic()

local C = UI.Colors

--------------------------------------------------------------------------------
-- Messages from the server
--------------------------------------------------------------------------------
local handlers = {}

function handlers.toast(text, kind)
	Toasts.push(text, kind)
end

function handlers.phase(phase)
	if phase == "countdown" then
		Album.reset()
		Fx.announce("GET READY", "Hide your number. Find theirs.", C.Accent, 0.22)
		Audio.reveal()
	elseif phase == "play" then
		Fx.announce("GO!", "Someone is always watching", C.Good, 0.22)
		Audio.countdown(0, true)
		Fx.flash(Color3.new(1, 1, 1), 0.3, 0.4)
	elseif phase == "lobby" then
		Album.reset()
		Keypad.close()
		Scope.set(false)
	end
end

function handlers.kill(victim, killer, how, number)
	if how == "left" then
		Hud.feed(victim .. " left the game", C.Muted)
	elseif how == "fell" or killer == "" then
		Hud.feed(victim .. " is out", C.Muted)
	else
		Hud.feed(killer .. "  ➜  " .. victim, C.Text)
	end
	Audio.kill()
end

function handlers.gotKill(code, icon, number)
	Fx.announce("ELIMINATED", icon .. " " .. code, C.Good, 0.24)
	Audio.hit()
	Fx.punch(6)
end

function handlers.eliminated(killer, how, alive, total)
	Scope.set(false)
	Keypad.close()
	Fx.announce("YOU'RE OUT", (killer ~= "" and ("guessed by " .. killer .. "  •  ") or "") .. "you placed #" .. (alive + 1), C.Danger, 0.24)
	Audio.lose()
	Fx.shake(1, 0.4)
	Fx.flash(C.Danger, 0.45, 0.6)
end

function handlers.guessResult(result)
	if result == "miss" then
		Audio.miss()
		Fx.flash(C.Danger, 0.35, 0.4)
		Toasts.push("Wrong number! -1 bullet, frozen", "bad")
	elseif result == "decoy" then
		Audio.miss()
		Fx.flash(C.Orange, 0.4, 0.5)
	elseif result == "invalid" then
		Audio.error()
	end
end

function handlers.snitch(pos, seconds)
	Alerts.snitch(pos, seconds)
end

function handlers.flash(seconds)
	Alerts.flash(seconds)
end

function handlers.stun(seconds)
	Alerts.stun(seconds)
end

function handlers.cover(stage, value)
	Alerts.cover(stage, value)
end

function handlers.exposed(label)
	Hud.feed(label .. " was EXPOSED!", C.Danger)
end

function handlers.photo(entries)
	Album.add(entries)
end

function handlers.used(id)
	Audio.use()
end

function handlers.pickup(id)
	local item = Config.ItemById[id]
	if item then
		Toasts.push(item.Icon .. " " .. item.Name .. "  +1", "good")
	end
	Audio.pickup()
end

function handlers.reveal()
	Fx.announce("THE REVEAL", "Every number is showing!", C.Gold, 0.2)
	Audio.reveal()
	Fx.flash(C.Gold, 0.35, 0.5)
end

function handlers.results(rows, winnerId)
	Results.show(rows, winnerId)
end

Notify.OnClientEvent:Connect(function(kind, ...)
	local handler = handlers[kind]
	if handler then
		local ok, err = pcall(handler, ...)
		if not ok then
			warn("[FigureMeOut] message '" .. tostring(kind) .. "' failed:", err)
		end
	end
end)

-- First visit: show the how-to-play card once the server has told us we have not seen it.
task.spawn(function()
	for _ = 1, 40 do
		if player:GetAttribute("Seen") ~= nil then
			break
		end
		task.wait(0.25)
	end
	if player:GetAttribute("Seen") == false then
		task.wait(1.5)
		Menu.open("How to play")
	end
end)

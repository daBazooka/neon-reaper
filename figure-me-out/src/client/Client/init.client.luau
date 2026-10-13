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
local Markers = require(Modules.Markers)
local Inventory = require(Modules.Inventory)
local Emotes = require(Modules.Emotes)
local Camera = require(Modules.Camera)

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
	Markers = Markers,
	Inventory = Inventory,
	Emotes = Emotes,
}

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
Inventory.init(gui, deps)
Emotes.init(gui, deps)
Markers.init()
Controls.init(deps)
OwnPlate.init()
Camera.init()
Audio.startMusic()

local C = UI.Colors

-- The loading screen: covers the game for a moment while the world and your profile arrive, then fades away.
local function loadingScreen()
	local cover = UI.new("Frame", { Name = "Loading", Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.Bg, BorderSizePixel = 0, ZIndex = 200 }, gui)
	UI.gradient(cover, Color3.fromRGB(90, 190, 240), Color3.fromRGB(10, 60, 120), 90)
	local title = UI.label(cover, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.42), Size = UDim2.fromOffset(640, 80), Font = UI.Fonts.Title, TextSize = 60, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "FIGURE ME OUT", ZIndex = 201 })
	local tip = UI.label(cover, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.52), Size = UDim2.fromOffset(640, 30), Font = UI.Fonts.Bold, TextSize = 18, TextColor3 = C.Muted, TextXAlignment = Enum.TextXAlignment.Center, Text = "Everyone can see your number. Except you.", ZIndex = 201 })
	local bar = UI.bar(cover, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.6), Size = UDim2.fromOffset(320, 12) }, C.Accent)
	bar.back.ZIndex = 201
	bar.fill.ZIndex = 202
	task.spawn(function()
		local tips = {
			"Everyone can see your number. Except you.",
			"Hold right mouse for binoculars.",
			"Smoke blocks sight. Flashbangs blind. Use them!",
			"Don't stare at walls: the game exposes campers.",
			"Someone is always watching.",
		}
		local waited = 0
		while waited < 8 do
			task.wait(0.25)
			waited += 0.25
			bar.set(math.min(1, waited / 2.5))
			tip.Text = tips[math.floor(waited / 1.5) % #tips + 1]
			local ready = workspace:GetAttribute("Phase") ~= nil and player:GetAttribute("Level") ~= nil
			if waited >= 2 and ready then
				break
			end
		end
		UI.tween(cover, 0.6, { BackgroundTransparency = 1 })
		UI.tween(title, 0.6, { TextTransparency = 1, TextStrokeTransparency = 1 })
		UI.tween(tip, 0.6, { TextTransparency = 1, TextStrokeTransparency = 1 })
		task.wait(0.7)
		cover:Destroy()
	end)
end
loadingScreen()

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
		Inventory.resetClues()
		Fx.announce("GET READY", "Hide your number. Find theirs.", C.Accent, 0.22)
		Audio.reveal()
	elseif phase == "play" then
		Fx.announce("GO!", "Someone is always watching", C.Good, 0.22)
		Audio.countdown(0, true)
		Fx.flash(Color3.new(1, 1, 1), 0.3, 0.4)
	elseif phase == "lobby" then
		Album.reset()
		Inventory.resetClues()
		Keypad.close()
		Scope.set(false)
	end
end

function handlers.kill(victim, killer, how)
	if how == "life" then
		Hud.feed(killer .. "  ➜  " .. victim .. "  (-1 ❤)", C.Gold)
	elseif how == "left" then
		Hud.feed(victim .. " left the game", C.Muted)
	elseif how == "fell" or killer == "" then
		Hud.feed(victim .. " is out", C.Muted)
	else
		Hud.feed(killer .. "  ➜  " .. victim, C.Text)
	end
	Audio.kill()
end

function handlers.gotKill(code, icon, lives, points)
	Fx.announce("HIT!  +" .. points, icon .. " " .. code .. " has " .. lives .. " " .. (lives == 1 and "life" or "lives") .. " left", C.Good, 0.24)
	Audio.hit()
	Fx.punch(6)
end

function handlers.lifeLost(killer, lives, delay)
	Alerts.lifeLost(killer, lives, delay)
end

function handlers.cooldown(id, seconds)
	Hud.setCooldown(id, seconds)
end

function handlers.scan(rows, seconds)
	if type(rows) == "table" then
		local n = Markers.scan(rows, seconds)
		Toasts.push("📡 Scanner: " .. n .. (n == 1 and " person" or " people") .. " nearby", "info")
	end
end

function handlers.noticed(pos)
	Alerts.noticed(pos)
end

function handlers.ally(kind, label)
	Hud.setAlly(label or "", kind == "on" and Config.Alliance.Duration or 0)
	if kind == "on" then
		Toasts.push("🤝 Allied with " .. label .. " for " .. Config.Alliance.Duration .. "s", "good")
		Audio.pickup()
	elseif kind == "betrayed" then
		Fx.announce("BETRAYED!", label .. " shot their ally", C.Danger, 0.26)
		Audio.lose()
	elseif kind == "broken" then
		Toasts.push("Alliance with " .. label .. " broken", "info")
	else
		Toasts.push("Alliance ended", "info")
	end
end

function handlers.allyOffer(label, fromId)
	Alerts.offer(label, fromId)
end

function handlers.shared(label, rows)
	if type(rows) == "table" then
		Album.add(rows)
		Toasts.push("🤝 " .. label .. " shared " .. #rows .. " note" .. (#rows == 1 and "" or "s") .. " (they might be bluffing!)", "info")
	end
end

function handlers.clue(text, index, total)
	Inventory.addClue(text)
	Toasts.push("🔐 Clue " .. index .. "/" .. total .. ": " .. text, "gold")
	Fx.announce("🔐 CLUE", text, C.Accent, 0.3)
	Audio.pickup()
end

function handlers.bounty(label, reward, id)
	Hud.setBounty(label, reward, id)
	Toasts.push("🎯 New bounty: " .. label .. "  +" .. reward, "gold")
	Audio.bounty()
end

function handlers.bountyWon(points, coins)
	Fx.announce("BOUNTY COLLECTED!", "+" .. points .. " points  +" .. coins .. " 🪙", C.Gold, 0.3)
	Audio.win()
end

function handlers.assist(points)
	Toasts.push("📷 Assist! +" .. points, "good")
	Audio.assist()
end

function handlers.event(stage, id, name, icon, text, seconds)
	Alerts.event(stage, id, name, icon, text, seconds)
end

function handlers.rewards(coins, xp, level, leveledUp)
	Results.setRewards(coins, xp, level, leveledUp)
	if leveledUp then
		Toasts.push("⬆ LEVEL UP! You are level " .. level, "gold")
	end
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

function handlers.cover(stage, value, violations)
	Alerts.cover(stage, value, violations)
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
	Fx.announce("THE REVEAL", "Every plate is glowing!", C.Gold, 0.2)
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

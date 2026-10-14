-- FIGURE ME OUT: client entry point. Builds the screen, wires every module together and routes the server's messages.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))
local Maps = require(Shared:WaitForChild("Maps"))

local Net = ReplicatedStorage:WaitForChild("Net")
local Action = Net:WaitForChild("Action")
local Notify = Net:WaitForChild("Notify")

local Modules = script:WaitForChild("Modules")
-- One broken module must never stop the whole game: each is loaded (and started) on its own, a failure is printed and shown on
-- screen in red, and a quiet stand-in takes its place so everything else keeps working.
local loadErrors = {}
local function problem(where, err)
	warn("[FigureMeOut] " .. where .. " failed: " .. tostring(err))
	table.insert(loadErrors, where .. ": " .. tostring(err))
end
local function load(name)
	local ok, mod = pcall(function()
		return require(Modules:WaitForChild(name, 15))
	end)
	if ok and mod then
		return mod
	end
	problem("module " .. name, mod)
	return setmetatable({}, { __index = function()
		return function() end
	end })
end
local function start(name, fn, ...)
	local ok, err = pcall(fn, ...)
	if not ok then
		problem(name .. ".init", err)
	end
end
local Fx = load("Fx")
local Toasts = load("Toasts")
local VIDEO = Config.Hud.Style == "video" -- the screen of the original game (Config.Hud.Style)
local Hud = require(VIDEO and Modules.HudVideo or Modules.Hud)
local Keypad = load("Keypad")
local Scope = load("Scope")
local Album = load("Album")
local Alerts = load("Alerts")
local Spectate = load("Spectate")
local Results = load("Results")
local Menu = load("Menu")
local Controls = load("Controls")
local OwnPlate = load("OwnPlate")
local Ambient = load("Ambient")
local Grade = load("Grade")
local Markers = load("Markers")
local Inventory = load("Inventory")
local Emotes = load("Emotes")
local Camera = load("Camera")
local MapVote = load("MapVote")

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

start("Audio", Audio.Init)
start("Fx", Fx.init, gui)
start("Toasts", Toasts.init, gui)
start("Alerts", Alerts.init, gui, deps)
start("Scope", Scope.init, gui, deps)
start("Keypad", Keypad.init, gui, deps)
start("Album", Album.init, gui, deps)
start("Spectate", Spectate.init, gui)
start("Results", Results.init, gui, deps)
start("Menu", Menu.init, gui, deps)
start("Hud", Hud.init, gui, deps)
start("Inventory", Inventory.init, gui, deps)
start("Emotes", Emotes.init, gui, deps)
start("MapVote", MapVote.init, gui, deps)
start("Markers", Markers.init)
start("Controls", Controls.init, deps)
start("OwnPlate", OwnPlate.init)
start("Ambient", Ambient.init)
start("Grade", Grade.init)
start("Camera", Camera.init)
start("Audio", Audio.startMusic)

-- anything that failed to start is shown in red, so it can be reported (and the rest of the game still runs)
if #loadErrors > 0 then
	local note = Instance.new("TextLabel")
	note.Name = "StartupProblems"
	note.Size = UDim2.fromOffset(560, 90)
	note.Position = UDim2.fromOffset(12, 60)
	note.BackgroundColor3 = Color3.fromRGB(40, 0, 0)
	note.BackgroundTransparency = 0.2
	note.TextColor3 = Color3.fromRGB(255, 130, 130)
	note.TextXAlignment = Enum.TextXAlignment.Left
	note.TextYAlignment = Enum.TextYAlignment.Top
	note.TextWrapped = true
	note.TextSize = 13
	note.Font = Enum.Font.GothamBold
	note.ZIndex = 400
	note.Text = "⚠ PART OF THE SCREEN FAILED TO START (please screenshot this):\n" .. string.sub(table.concat(loadErrors, "\n"), 1, 500)
	note.Parent = gui
end

local C = UI.Colors

-- The loading screen: covers the game for a moment while the world and your profile arrive, then fades away.
local function loadingScreen()
	local cover = UI.new("Frame", { Name = "Loading", Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.Bg, BorderSizePixel = 0, ZIndex = 200 }, gui)
	UI.gradient(cover, Color3.fromRGB(90, 190, 240), Color3.fromRGB(10, 60, 120), 90)
	local title = UI.label(cover, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.42), Size = UDim2.fromOffset(640, 80), Font = UI.Fonts.Title, TextSize = 60, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "FIGURE ME OUT", ZIndex = 201 })
	local tip = UI.label(cover, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.52), Size = UDim2.fromOffset(640, 30), Font = UI.Fonts.Bold, TextSize = 18, TextColor3 = C.Muted, TextXAlignment = Enum.TextXAlignment.Center, Text = "Hide your number. Read theirs.", ZIndex = 201 })
	local bar = UI.bar(cover, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.6), Size = UDim2.fromOffset(320, 12) }, C.Accent)
	bar.back.ZIndex = 201
	bar.fill.ZIndex = 202
	task.spawn(function()
		local tips = {
			"Your number is on your screen: keep it hidden.",
			"Look at someone and just type their number.",
			"Don't stare at walls or sit still: the game exposes campers.",
			"The river carries you. Waterfalls hide what is behind them.",
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

-- The vote is over: say which map won (and whether it was a tie).
function handlers.mapPicked(id, votes, tied)
	local m = Maps.List[id]
	if not m then
		return
	end
	local detail = (votes or 0) == 0 and "no votes: picked at random" or ((votes == 1 and "1 vote" or (votes .. " votes")) .. (tied and " (a tie: picked at random)" or ""))
	Toasts.push(m.Icon .. " Next map: " .. m.Name .. " (" .. detail .. ")", "gold")
end

function handlers.myNumber(text)
	if type(text) == "string" then
		Hud.setMyNumber(text)
	end
end

function handlers.phase(phase)
	if phase == "countdown" then
		if player:GetAttribute("Seen") == false then
			deps.send("Seen") -- (no tutorial pop-up: the one-line hint on screen is enough)
		end
		Album.reset()
		Inventory.resetClues()
		Fx.announce("GET READY", (workspace:GetAttribute("MapName") or "") .. "  •  Look at heads. Type their number.", C.Accent, 0.22)
		Audio.reveal()
	elseif phase == "play" then
		if VIDEO and Config.Features.Gadgets and player:GetAttribute("Playing") == true then
			Toasts.push("⚡ Yellow chests hold a stun grenade, a smoke bottle or a sound grenade", "info")
		end
		Fx.announce("GO!", "Someone is always watching", C.Good, 0.22)
		Audio.countdown(0, true)
		Audio.horn()
		Fx.flash(Color3.new(1, 1, 1), 0.3, 0.4)
	elseif phase == "lobby" then
		Hud.setMyNumber(nil)
		Album.reset()
		Inventory.resetClues()
		Keypad.close()
		Scope.set(false)
	end
end

function handlers.kill(victim, killer, how)
	if VIDEO then
		Audio.kill() -- (the original shows only your own hits: "You killed Michael")
		return
	end
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
	if VIDEO then
		Hud.youKilled(code)
		Audio.hit()
		Fx.punch(6)
		return
	end
	Fx.announce("HIT!  +" .. points, icon .. " " .. code .. " has " .. lives .. " " .. (lives == 1 and "life" or "lives") .. " left", C.Good, 0.24)
	Audio.hit()
	Fx.punch(6)
end

-- Hits in a row: a short popup with bonus points.
function handlers.streak(count, name, bonus)
	if type(name) == "string" then
		Fx.announce(name, (type(bonus) == "number" and bonus > 0) and ("+" .. bonus .. " bonus") or "", C.Gold, 0.22)
		Audio.hit()
	end
end

function handlers.lifeLost(killer, lives, delay)
	if VIDEO and type(killer) == "string" and killer ~= "" then
		Hud.say(killer .. " killed you")
	end
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
	elseif result == "hit" then
		Fx.flash(C.Good, 0.3, 0.3)
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

function handlers.camp(stage, value, violations)
	Alerts.camp(stage, value, violations)
end

function handlers.exposed(label)
	Hud.feed(label .. " was EXPOSED!", C.Danger)
end

function handlers.photo(entries)
	Album.add(entries)
end

-- Feedback when one of your gadgets goes off.
local USED = {
	flash = "💥 Flashbang thrown",
	smoke = "💨 Smoke thrown",
	distraction = "🔔 Distraction thrown",
	sprint = "👟 SPRINT!",
	decoy = "🎭 Decoy dropped",
}
function handlers.used(id)
	Audio.use()
	if USED[id] then
		Toasts.push(USED[id], "info")
	end
	if id == "sprint" then
		Fx.punch(16)
		Fx.flash(C.Accent, 0.25, 0.4)
	end
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

function handlers.flag(what, team, who)
	local t = Config.Teams[team]
	if not t then
		return
	end
	local mine = player:GetAttribute("Team")
	local ours = mine == team
	if what == "taken" then
		Hud.feed("🚩 " .. who .. " took the " .. t.Name .. " flag!", t.Color)
		Fx.announce(ours and "THEY HAVE OUR FLAG!" or "FLAG TAKEN!", who .. " has the " .. t.Name .. " flag", ours and C.Danger or C.Gold, 0.24)
		Audio.flagTaken()
	elseif what == "dropped" then
		Hud.feed("🚩 The " .. t.Name .. " flag was dropped", t.Color)
		Audio.flagDropped()
	elseif what == "returned" then
		Hud.feed("🚩 The " .. t.Name .. " flag is back at its base" .. (who ~= "" and (" (" .. who .. ")") or ""), t.Color)
	elseif what == "captured" then
		local other = Config.Teams[3 - team]
		Hud.feed("🏁 " .. who .. " captured the " .. (other and other.Name or "") .. " flag!", C.Gold)
		Fx.announce(ours and "CAPTURE!" or "THEY SCORED!", who .. " scored for " .. t.Name, ours and C.Good or C.Danger, 0.24)
		Audio.capture()
	end
end

function handlers.captured(points)
	Fx.announce("CAPTURE!  +" .. tostring(points), "You brought the flag home", C.Good, 0.24)
end

function handlers.results(rows, winnerId, winnerTeam, modeId, scores)
	Results.show(rows, winnerId, winnerTeam, modeId, scores)
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


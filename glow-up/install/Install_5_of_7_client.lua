-- GLOW UP installer 5 of 7 (client).
-- HOW TO USE: stop any running test, paste this WHOLE script into the Command Bar
-- (the bar at the bottom of Studio) and press Enter. Then run the next installer.
local RS = game:GetService("ReplicatedStorage")
local SSS = game:GetService("ServerScriptService")
local SPS = game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts")

local function remove(parent, name)
	for _, child in parent:GetChildren() do
		if child.Name == name then
			child:Destroy()
		end
	end
end

local function getOrMake(class, name, parent)
	local existing = parent:FindFirstChild(name)
	if existing and existing.ClassName == class then
		return existing
	end
	if existing then
		existing:Destroy()
	end
	local inst = Instance.new(class)
	inst.Name = name
	inst.Parent = parent
	return inst
end

local created = 0
local function put(class, name, parent, source)
	local inst = getOrMake(class, name, parent)
	inst.Source = source
	created += 1
	return inst
end

put("LocalScript", "Client", SPS, [=====[
-- GLOW UP: client entry point. Builds the interface, wires the menu tabs, and routes everything
-- the server tells us (pickups, rewards, training, duels) to the right place.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))

local Net = ReplicatedStorage:WaitForChild("Net")
local Action = Net:WaitForChild("Action")
local Notify = Net:WaitForChild("Notify")

local Modules = script:WaitForChild("Modules")
local Fx = require(Modules.Fx)
local Toasts = require(Modules.Toasts)
local Menu = require(Modules.Menu)
local Hud = require(Modules.Hud)
local TabWardrobe = require(Modules.TabWardrobe)
local TabCrates = require(Modules.TabCrates)
local TabUpgrades = require(Modules.TabUpgrades)
local TabProfile = require(Modules.TabProfile)
local TabRewards = require(Modules.TabRewards)
local TabSettings = require(Modules.TabSettings)
local TrainingUI = require(Modules.TrainingUI)
local DuelUI = require(Modules.DuelUI)
local Orbs = require(Modules.Orbs)

-- Wait for the server to finish setting this player up.
while not player:GetAttribute("Ready") do
	task.wait(0.1)
end

local gui = UI.new("ScreenGui", {
	Name = "GlowUI",
	ResetOnSpawn = false,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	IgnoreGuiInset = false,
}, player:WaitForChild("PlayerGui"))

--------------------------------------------------------------------------------
-- Build
--------------------------------------------------------------------------------
Audio.Init()
Fx.init(gui)
Orbs.init()
Menu.init(gui)
Menu.addTab("Wardrobe", "👗", function(page)
	return TabWardrobe.build(page, Action)
end)
Menu.addTab("Crates", "🎁", function(page)
	return TabCrates.build(page, Action)
end)
Menu.addTab("Upgrades", "⬆️", function(page)
	return TabUpgrades.build(page, Action)
end)
Menu.addTab("Profile", "📈", function(page)
	return TabProfile.build(page)
end)
Menu.addTab("Rewards", "📅", function(page)
	return TabRewards.build(page, Action)
end)
Menu.addTab("Settings", "⚙️", function(page)
	return TabSettings.build(page, Action)
end)
Hud.init(gui, Menu)
Toasts.init(gui)
TrainingUI.init(gui, Action)
DuelUI.init(gui, Action)

TabSettings.apply()
Audio.startMusic()
for _, key in { "Music", "Sfx" } do
	player:GetAttributeChangedSignal("Set_" .. key):Connect(TabSettings.apply)
end

Menu.onChanged(function(name)
	if name == "Wardrobe" then
		Hud.setNewItem(false)
	end
end)

task.spawn(function()
	while true do
		task.wait(0.25)
		Menu.refresh()
	end
end)

--------------------------------------------------------------------------------
-- Server messages
--------------------------------------------------------------------------------
local handlers = {}

function handlers.shard(pos, gained, tier, color, mut, chain)
	local tierIndex = Config.ShardTier(tier)
	Audio.pickup(chain, tierIndex + (mut and 2 or 0))
	Fx.burst(pos, color, 5 + tierIndex * 4 + (mut and 14 or 0))
	Fx.punch(1 + tierIndex * 0.8 + (mut and 3 or 0))
	-- Only notable pickups get a floating number; the Aura counter covers the rest.
	if mut or tierIndex >= 3 then
		local text = (mut and (mut:upper() .. "! ") or "") .. "+" .. Util.fmt(gained)
		Fx.floatText(pos, text, color, mut and 38 or 30)
	end
	if mut then
		Fx.shake(0.25, 0.3)
		Fx.flash(color, 0.22, 0.35)
	end
	if chain == 10 or chain == 20 or chain == Config.ChainMax then
		Audio.milestone(chain)
		Toasts.push("CHAIN x" .. chain .. "!", "gold")
		Hud.pulseChain()
	end
end

function handlers.toast(text, kind)
	if kind == "bad" then
		Audio.error()
	end
	Toasts.push(text, kind)
end

function handlers.rank(rankIndex)
	local rank = Config.Ranks[rankIndex]
	Audio.rank()
	Fx.shake(0.4, 0.5)
	Fx.flash(rank.Color, 0.35, 0.9)
	Fx.announce(rank.Name:upper(), "NEW RANK", rank.Color, 0.28)
end

function handlers.quest(text, reward, bonus)
	Audio.quest()
	Hud.pulseQuest()
	Toasts.push(string.format("Quest complete: %s  +✦%s%s", text, Util.fmt(reward), bonus or ""), "good")
end

function handlers.daily(day, aura, crates)
	Audio.daily()
	Toasts.push(string.format("Day %d claimed  +✦%s%s", day, Util.fmt(aura), crates > 0 and ("  +" .. crates .. " 🎁") or ""), "gold")
end

function handlers.crate(crateId, cosmeticId, status, stars, refund)
	Menu.open("Crates")
	TabCrates.reveal(crateId, cosmeticId, status, stars, refund)
	if status == "new" then
		Hud.setNewItem(true)
	end
end

function handlers.upgrade()
	Audio.purchase()
end

function handlers.rebirth(n)
	Audio.ascend()
	Fx.shake(0.7, 0.9)
	Fx.flash(Color3.new(1, 1, 1), 1, 1.4)
	Fx.announce("REBORN", "★" .. n .. "  ·  +25% Aura and Glow, forever", UI.Colors.Gold, 0.3)
end

function handlers.openMenu(tab)
	Menu.open(tab)
end

function handlers.trainStart(stat, cfg)
	Menu.close()
	TrainingUI.start(stat, cfg)
end

function handlers.trainRep(...)
	TrainingUI.rep(...)
end

function handlers.trainEnd(stat, total)
	TrainingUI.finish(stat, total)
end

function handlers.duelStart(...)
	Menu.close()
	DuelUI.start(...)
end

function handlers.duelProgress(oppTaps)
	DuelUI.progress(oppTaps)
end

function handlers.duelEnd(...)
	DuelUI.finish(...)
end

Notify.OnClientEvent:Connect(function(kind, ...)
	local handler = handlers[kind]
	if handler then
		local ok, err = pcall(handler, ...)
		if not ok then
			warn("[GlowUp] UI handler '" .. tostring(kind) .. "' failed:", err)
		end
	end
end)

--------------------------------------------------------------------------------
-- Welcome back
--------------------------------------------------------------------------------
task.spawn(function()
	task.wait(2)
	local gain = player:GetAttribute("OfflineGain")
	if gain and gain > 0 then
		Toasts.push("Welcome back! Your look earned ✦" .. Util.fmt(gain) .. " while you were away", "gold")
	elseif player:GetAttribute("DailyReady") then
		Toasts.push("Your daily reward is ready", "gold")
	end
end)
]=====])
local modules = getOrMake("Folder", "Modules", SPS:WaitForChild("Client"))
put("ModuleScript", "DuelUI", modules, [=====[
-- GLOW UP: duel overlay. Both sides tap as fast as they can for 7 seconds; Glow Score gives an
-- edge but speed can upset a higher rank. Win or lose, you always get rewarded.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local ContextActionService = game:GetService("ContextActionService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))
local Fx = require(script.Parent.Fx)

local DuelUI = {}

local player = Players.LocalPlayer
local C = UI.Colors
local Action
local root, myName, myInfo, oppName, oppInfo, myBar, oppBar, center, tapButton, tapScale, resultLabel
local duel -- { tStart, length, myTaps, oppTaps, sent, lastTickSecond }
local pendingSend = 0
local lastSend = 0

local function card(parent, anchorX, color)
	local c = UI.panel(parent, {
		AnchorPoint = Vector2.new(anchorX, 0),
		Position = UDim2.new(anchorX, anchorX == 0 and 20 or -20, 0, 10),
		Size = UDim2.fromOffset(250, 76),
		ZIndex = 31,
	})
	c:FindFirstChildOfClass("UIStroke").Color = color
	local name = UI.label(c, {
		Position = UDim2.fromOffset(16, 8),
		Size = UDim2.new(1, -32, 0, 28),
		Font = UI.Fonts.Title,
		TextSize = 20,
		TextXAlignment = anchorX == 0 and Enum.TextXAlignment.Left or Enum.TextXAlignment.Right,
		TextWrapped = false,
		ZIndex = 32,
	})
	local info = UI.label(c, {
		Position = UDim2.fromOffset(16, 40),
		Size = UDim2.new(1, -32, 0, 22),
		Font = UI.Fonts.Bold,
		TextSize = 13,
		TextColor3 = C.Muted,
		TextXAlignment = anchorX == 0 and Enum.TextXAlignment.Left or Enum.TextXAlignment.Right,
		TextWrapped = false,
		ZIndex = 32,
	})
	return name, info
end

local function tap()
	if not duel then
		return
	end
	local now = workspace:GetServerTimeNow()
	if now < duel.tStart or now > duel.tStart + duel.length then
		return
	end
	duel.myTaps += 1
	pendingSend += 1
	Audio.play("Tone", 0.9 + (duel.myTaps % 8) * 0.07, 0.35)
	UI.pop(tapScale, 0.93)
end

function DuelUI.init(gui, action)
	Action = action
	root = UI.new("Frame", {
		Name = "Duel",
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		Visible = false,
		ZIndex = 30,
	}, gui)
	myName, myInfo = card(root, 0, C.Cyan)
	oppName, oppInfo = card(root, 1, C.Accent2)

	local bars = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 104),
		Size = UDim2.fromOffset(520, 60),
		BackgroundTransparency = 1,
		ZIndex = 31,
	}, root)
	myBar = UI.bar(bars, { Position = UDim2.fromOffset(0, 8), Size = UDim2.new(1, 0, 0, 16) }, C.Cyan)
	oppBar = UI.bar(bars, { Position = UDim2.fromOffset(0, 34), Size = UDim2.new(1, 0, 0, 16) }, C.Accent2)

	center = UI.label(root, {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.4),
		Size = UDim2.fromOffset(600, 120),
		Font = UI.Fonts.Title,
		TextSize = 96,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0.2,
		TextStrokeColor3 = Color3.fromRGB(18, 10, 44),
		Text = "",
		ZIndex = 32,
	})
	resultLabel = UI.label(root, {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.56),
		Size = UDim2.fromOffset(640, 60),
		Font = UI.Fonts.Bold,
		TextSize = 22,
		TextXAlignment = Enum.TextXAlignment.Center,
		Text = "",
		ZIndex = 32,
	})

	tapButton = UI.button(root, {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -40),
		Size = UDim2.fromOffset(260, 96),
		Text = "TAP!",
		TextSize = 40,
		ZIndex = 33,
		Radius = 24,
	}, "primary")
	tapButton.Font = UI.Fonts.Title
	tapScale = UI.new("UIScale", {}, tapButton)
	tapButton.Activated:Connect(tap)

	ContextActionService:BindActionAtPriority("GlowDuelTap", function(_, state)
		if duel then
			if state == Enum.UserInputState.Begin then
				tap()
			end
			return Enum.ContextActionResult.Sink
		end
		return Enum.ContextActionResult.Pass
	end, false, Enum.ContextActionPriority.High.Value, Enum.KeyCode.Space)

	RunService.RenderStepped:Connect(function()
		if not duel then
			return
		end
		local now = workspace:GetServerTimeNow()
		local maxTaps = Config.Duel.MaxTapsPerSecond * duel.length
		myBar.set(duel.myTaps / maxTaps * 2.2)
		oppBar.set(duel.oppTaps / maxTaps * 2.2)

		if now < duel.tStart then
			local left = math.ceil(duel.tStart - now)
			center.Text = tostring(left)
			center.TextColor3 = C.Gold
			if left ~= duel.lastTick then
				duel.lastTick = left
				Audio.countdown(false)
			end
			tapButton.BackgroundTransparency = 0.5
		elseif now <= duel.tStart + duel.length then
			if not duel.started then
				duel.started = true
				Audio.countdown(true)
				Fx.punch(6)
			end
			center.Text = "TAP!"
			center.TextColor3 = C.Good
			tapButton.BackgroundTransparency = 0
			local remaining = duel.tStart + duel.length - now
			resultLabel.Text = string.format("%.1fs", remaining)
			resultLabel.TextColor3 = C.Text
		end

		if pendingSend > 0 and os.clock() - lastSend > 0.1 then
			Action:FireServer("DuelTaps", pendingSend)
			pendingSend = 0
			lastSend = os.clock()
		end
	end)
end

function DuelUI.start(oppNameText, oppRank, oppScore, myScore, tStart, length)
	local myRank = Config.Ranks[player:GetAttribute("Rank") or 1]
	local opp = Config.Ranks[oppRank] or Config.Ranks[1]
	myName.Text = player.DisplayName
	myName.TextColor3 = myRank.Color
	myInfo.Text = string.format("%s  ·  GLOW %s", myRank.Name:upper(), Util.fmt(myScore))
	oppName.Text = oppNameText
	oppName.TextColor3 = opp.Color
	oppInfo.Text = string.format("%s  ·  GLOW %s", opp.Name:upper(), Util.fmt(oppScore))
	duel = { tStart = tStart, length = length, myTaps = 0, oppTaps = 0, lastTick = 0 }
	pendingSend = 0
	resultLabel.Text = ""
	tapButton.Visible = true
	root.Visible = true
end

function DuelUI.progress(oppTaps)
	if duel then
		duel.oppTaps = oppTaps
	end
end

function DuelUI.finish(win, given, myTaps, oppTaps, myEff, oppEff, streak)
	if not duel then
		return
	end
	if pendingSend > 0 then
		Action:FireServer("DuelTaps", pendingSend)
		pendingSend = 0
	end
	duel.oppTaps = oppTaps
	tapButton.Visible = false
	if win then
		center.Text = "MOG!"
		center.TextColor3 = C.Gold
		Audio.win()
		Fx.flash(C.Gold, 0.4, 0.8)
		Fx.shake(0.5, 0.6)
		resultLabel.Text = string.format("You out-glowed %s   ·   +✦%s%s", oppName.Text, Util.fmt(given), streak > 1 and ("   ·   🔥 streak " .. streak) or "")
	else
		center.Text = "RESPECT"
		center.TextColor3 = C.Cyan
		Audio.lose()
		resultLabel.Text = string.format("%s took this one   ·   still earned +✦%s", oppName.Text, Util.fmt(given))
	end
	resultLabel.TextColor3 = C.Text
	local finished = duel
	duel = nil
	task.delay(3.6, function()
		if duel == nil then
			root.Visible = false
		end
	end)
	return finished
end

return DuelUI
]=====])
put("ModuleScript", "Fx", modules, [=====[
-- GLOW UP: game-feel effects. Camera punch/shake, floating text, particle bursts and the big
-- centred callouts. Everything respects the "Effects" setting so players can tone it down.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Debris = game:GetService("Debris")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local UI = require(Shared:WaitForChild("UI"))

local Fx = {}

local player = Players.LocalPlayer
local camera = workspace:WaitForChild("Camera")
local gui
local BASE_FOV = 70
local fovKick = 0
local shakeMag, shakeTime = 0, 0
local flashFrame

local function effectsOn()
	return player:GetAttribute("Set_Fx") ~= false
end

function Fx.init(screenGui)
	gui = screenGui
	flashFrame = UI.new("Frame", {
		Name = "Flash",
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = Color3.new(1, 1, 1),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ZIndex = 90,
		Active = false,
	}, gui)

	RunService.RenderStepped:Connect(function(dt)
		fovKick = fovKick * (1 - math.min(1, dt * 12))
		camera.FieldOfView = BASE_FOV + fovKick
		local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
		if hum then
			if shakeTime > 0 and effectsOn() then
				shakeTime -= dt
				local m = shakeMag * math.clamp(shakeTime / 0.3, 0, 1)
				hum.CameraOffset = Vector3.new((math.random() - 0.5) * m, (math.random() - 0.5) * m, 0)
			else
				shakeMag = 0
				shakeTime = 0
				hum.CameraOffset = Vector3.zero
			end
		end
	end)
end

function Fx.punch(amount)
	if effectsOn() then
		fovKick = math.max(fovKick, amount)
	end
end

function Fx.shake(mag, dur)
	if effectsOn() then
		shakeMag = math.max(shakeMag, mag)
		shakeTime = math.max(shakeTime, dur)
	end
end

function Fx.flash(color, strength, dur)
	if not effectsOn() or not flashFrame then
		return
	end
	flashFrame.BackgroundColor3 = color
	flashFrame.BackgroundTransparency = 1 - strength
	UI.tween(flashFrame, dur or 0.5, { BackgroundTransparency = 1 })
end

local function anchorAt(pos, lifetime)
	local anchor = UI.new("Part", {
		Anchored = true,
		CanCollide = false,
		CanTouch = false,
		CanQuery = false,
		Transparency = 1,
		Size = Vector3.one * 0.1,
		Position = pos,
	}, workspace)
	Debris:AddItem(anchor, lifetime)
	return anchor
end

-- Rising number in the world. Only used for notable pickups so the screen stays calm.
function Fx.floatText(pos, text, color, size)
	if not effectsOn() then
		return
	end
	local anchor = anchorAt(pos + Vector3.new((math.random() - 0.5) * 2, 0, (math.random() - 0.5) * 2), 1.3)
	local bb = UI.new("BillboardGui", {
		Adornee = anchor,
		AlwaysOnTop = true,
		Size = UDim2.fromOffset(300, size + 12),
	}, anchor)
	local label = UI.label(bb, {
		Size = UDim2.fromScale(1, 1),
		Font = UI.Fonts.Title,
		TextSize = size,
		TextColor3 = color,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextStrokeTransparency = 0.25,
		TextStrokeColor3 = Color3.fromRGB(18, 10, 44),
		Text = text,
		TextWrapped = false,
	})
	local grow = UI.new("UIScale", { Scale = 0.4 }, label)
	UI.tween(grow, 0.18, { Scale = 1 }, Enum.EasingStyle.Back)
	UI.tween(bb, 1.1, { StudsOffset = Vector3.new(0, 6, 0) })
	UI.tween(label, 1.1, { TextTransparency = 1, TextStrokeTransparency = 1 }, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
end

function Fx.burst(pos, color, count)
	if not effectsOn() then
		return
	end
	local anchor = anchorAt(pos, 1.5)
	local e = UI.new("ParticleEmitter", {
		Color = ColorSequence.new(color),
		LightEmission = 1,
		Rate = 0,
		Lifetime = NumberRange.new(0.4, 0.8),
		Speed = NumberRange.new(10, 22),
		SpreadAngle = Vector2.new(180, 180),
		Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.7), NumberSequenceKeypoint.new(1, 0) }),
		Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(1, 1) }),
	}, anchor)
	e:Emit(count)
end

-- Big centred callout. Reserved for moments that deserve it (rank ups, rebirths, combos).
function Fx.announce(title, sub, color, y)
	if not gui then
		return
	end
	local holder = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(0.5, 0, y or 0.28, 0),
		Size = UDim2.fromOffset(700, 120),
		BackgroundTransparency = 1,
		ZIndex = 60,
	}, gui)
	local scale = UI.new("UIScale", { Scale = 0.3 }, holder)
	local t = UI.label(holder, {
		Size = UDim2.new(1, 0, 0, 66),
		Font = UI.Fonts.Title,
		TextSize = 56,
		TextColor3 = color,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextStrokeTransparency = 0.1,
		TextStrokeColor3 = Color3.fromRGB(18, 10, 44),
		Text = title,
		ZIndex = 60,
	})
	local s = UI.label(holder, {
		Position = UDim2.fromOffset(0, 68),
		Size = UDim2.new(1, 0, 0, 36),
		Font = UI.Fonts.Bold,
		TextSize = 24,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextStrokeTransparency = 0.3,
		TextStrokeColor3 = Color3.fromRGB(18, 10, 44),
		Text = sub or "",
		ZIndex = 60,
	})
	UI.tween(scale, 0.32, { Scale = 1 }, Enum.EasingStyle.Back)
	task.delay(1.9, function()
		UI.tween(t, 0.5, { TextTransparency = 1, TextStrokeTransparency = 1 })
		UI.tween(s, 0.5, { TextTransparency = 1, TextStrokeTransparency = 1 })
		task.wait(0.6)
		holder:Destroy()
	end)
end

return Fx
]=====])
put("ModuleScript", "Hud", modules, [=====[
-- GLOW UP: the always-on screen. Deliberately minimal: your Aura (with rank progress), one
-- quest, a chain chip and an event banner only when relevant, and a dock that opens the menu.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))

local Hud = {}

local player = Players.LocalPlayer
local C = UI.Colors

local DOCK = {
	{ name = "Wardrobe", icon = "👗" },
	{ name = "Crates", icon = "🎁" },
	{ name = "Upgrades", icon = "⬆️" },
	{ name = "Profile", icon = "📈" },
	{ name = "Rewards", icon = "📅" },
	{ name = "Settings", icon = "⚙️" },
}

local refs = {}
local shownAura = 0
local pending, lastGain = 0, 0
local lastAura = 0

local function buildAuraCard(gui)
	local card = UI.panel(gui, {
		Name = "AuraCard",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 8),
		Size = UDim2.fromOffset(320, 94),
	})
	refs.cardScale = UI.new("UIScale", {}, card)

	refs.aura = UI.label(card, {
		Position = UDim2.fromOffset(18, 6),
		Size = UDim2.fromOffset(190, 42),
		Font = UI.Fonts.Title,
		TextSize = 34,
		TextColor3 = C.Gold,
		TextWrapped = false,
		Text = "✦ 0",
	})
	refs.ticker = UI.label(card, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -16, 0, 12),
		Size = UDim2.fromOffset(110, 26),
		Font = UI.Fonts.Title,
		TextSize = 20,
		TextColor3 = C.Good,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		TextTransparency = 1,
		Text = "",
	})
	refs.rate = UI.label(card, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -16, 0, 38),
		Size = UDim2.fromOffset(110, 16),
		Font = UI.Fonts.Bold,
		TextSize = 12,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		Text = "",
	})
	refs.rank = UI.label(card, {
		Position = UDim2.fromOffset(18, 48),
		Size = UDim2.fromOffset(240, 18),
		Font = UI.Fonts.Title,
		TextSize = 14,
		TextWrapped = false,
		Text = "",
	})
	refs.rankBar = UI.bar(card, {
		Position = UDim2.new(0, 18, 1, -16),
		Size = UDim2.new(1, -36, 0, 8),
	}, C.Accent)
	refs.rankNext = UI.label(card, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -18, 0, 48),
		Size = UDim2.fromOffset(150, 18),
		Font = UI.Fonts.Bold,
		TextSize = 12,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		Text = "",
	})
end

local function buildChips(gui)
	-- Chain chip
	refs.chain = UI.panel(gui, {
		Name = "ChainChip",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 110),
		Size = UDim2.fromOffset(220, 32),
		Visible = false,
		Radius = 16,
	})
	refs.chainScale = UI.new("UIScale", {}, refs.chain)
	refs.chainText = UI.label(refs.chain, {
		Size = UDim2.new(1, 0, 0, 26),
		Font = UI.Fonts.Title,
		TextSize = 15,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "",
	})
	refs.chainBar = UI.bar(refs.chain, { Position = UDim2.new(0, 14, 1, -8), Size = UDim2.new(1, -28, 0, 3) }, C.Cyan)

	-- Event banner
	refs.event = UI.panel(gui, {
		Name = "EventBanner",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 148),
		Size = UDim2.fromOffset(300, 46),
		Visible = false,
		Radius = 14,
	})
	refs.eventTitle = UI.label(refs.event, {
		Position = UDim2.fromOffset(14, 4),
		Size = UDim2.new(1, -28, 0, 22),
		Font = UI.Fonts.Title,
		TextSize = 16,
		TextWrapped = false,
		Text = "",
	})
	refs.eventDesc = UI.label(refs.event, {
		Position = UDim2.fromOffset(14, 24),
		Size = UDim2.new(1, -28, 0, 16),
		Font = UI.Fonts.Body,
		TextSize = 12,
		TextColor3 = C.Muted,
		TextWrapped = false,
		Text = "",
	})

	-- Quest chip (left edge, below the Roblox chat)
	refs.quest = UI.panel(gui, {
		Name = "QuestChip",
		AnchorPoint = Vector2.new(0, 0.5),
		Position = UDim2.new(0, 14, 0.5, -40),
		Size = UDim2.fromOffset(250, 62),
		Radius = 14,
	})
	refs.questScale = UI.new("UIScale", {}, refs.quest)
	refs.questText = UI.label(refs.quest, {
		Position = UDim2.fromOffset(14, 6),
		Size = UDim2.new(1, -28, 0, 20),
		Font = UI.Fonts.Bold,
		TextSize = 14,
		TextWrapped = false,
		Text = "",
	})
	refs.questBar = UI.bar(refs.quest, { Position = UDim2.new(0, 14, 1, -22), Size = UDim2.new(1, -28, 0, 10) }, C.Good)
	refs.questCount = UI.label(refs.quest, {
		Position = UDim2.fromOffset(14, 24),
		Size = UDim2.new(1, -28, 0, 12),
		Font = UI.Fonts.Bold,
		TextSize = 11,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		Text = "",
	})
end

local function buildDock(gui, Menu)
	local dock = UI.panel(gui, {
		Name = "Dock",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -14),
		Size = UDim2.fromOffset(#DOCK * 70 + 14, 76),
		Radius = 22,
	})
	UI.new("UIScale", {}, dock)
	UI.new("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		VerticalAlignment = Enum.VerticalAlignment.Center,
		Padding = UDim.new(0, 6),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, dock)
	refs.badges = {}
	for i, entry in DOCK do
		local button = UI.button(dock, {
			LayoutOrder = i,
			Size = UDim2.fromOffset(64, 62),
			Text = "",
		}, "card")
		UI.label(button, {
			Size = UDim2.new(1, 0, 0, 36),
			Position = UDim2.fromOffset(0, 4),
			Font = UI.Fonts.Bold,
			TextSize = 26,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = entry.icon,
		})
		UI.label(button, {
			Size = UDim2.new(1, 0, 0, 16),
			Position = UDim2.new(0, 0, 1, -20),
			Font = UI.Fonts.Bold,
			TextSize = 11,
			TextColor3 = C.Muted,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = entry.name,
		})
		local badge = UI.new("Frame", {
			AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, -4, 0, 4),
			Size = UDim2.fromOffset(12, 12),
			BackgroundColor3 = C.Accent2,
			Visible = false,
			ZIndex = 5,
		}, button)
		UI.corner(badge, 6)
		UI.stroke(badge, Color3.new(1, 1, 1), 1.5, 0.2)
		refs.badges[entry.name] = badge
		button.Activated:Connect(function()
			Audio.click()
			Menu.toggle(entry.name)
		end)
	end
end

function Hud.init(gui, Menu)
	buildAuraCard(gui)
	buildChips(gui)
	buildDock(gui, Menu)

	UserInputService.InputBegan:Connect(function(input, processed)
		if not processed and input.KeyCode == Enum.KeyCode.M then
			Menu.toggle()
		end
	end)

	player:GetAttributeChangedSignal("Aura"):Connect(function()
		local now = player:GetAttribute("Aura") or 0
		if now > lastAura then
			pending += now - lastAura
			lastGain = os.clock()
			UI.pop(refs.cardScale, 1.04)
		end
		lastAura = now
	end)

	local lastSlow = 0
	RunService.RenderStepped:Connect(function(dt)
		local t = os.clock()

		-- Aura counter rolls up smoothly.
		local aura = player:GetAttribute("Aura") or 0
		shownAura += (aura - shownAura) * math.min(1, dt * 9)
		if math.abs(aura - shownAura) < 0.5 then
			shownAura = aura
		end
		refs.aura.Text = "✦ " .. Util.fmt(shownAura)

		-- Gain ticker: merges rapid pickups into one number, then fades.
		if pending > 0 then
			refs.ticker.Text = "+" .. Util.fmt(pending)
			if t - lastGain < 1.1 then
				refs.ticker.TextTransparency = 0
			else
				refs.ticker.TextTransparency = math.min(1, (t - lastGain - 1.1) / 0.4)
				if refs.ticker.TextTransparency >= 1 then
					pending = 0
				end
			end
		end

		-- Chain chip
		local chain = player:GetAttribute("Chain") or 0
		local remaining = (player:GetAttribute("ChainExpire") or 0) - workspace:GetServerTimeNow()
		if chain >= 3 and remaining > 0 then
			refs.chain.Visible = true
			refs.chainText.Text = string.format("CHAIN x%d  ·  +%d%%", chain, math.floor((Config.ChainMult(chain) - 1) * 100 + 0.5))
			refs.chainBar.set(remaining / Config.ChainWindow)
			refs.chainText.TextColor3 = C.Cyan:Lerp(C.Accent2, math.clamp(chain / Config.ChainMax, 0, 1))
		else
			refs.chain.Visible = false
		end

		if t - lastSlow > 0.15 then
			lastSlow = t
			Hud.refresh(Menu)
		end
	end)
end

function Hud.pulseChain()
	UI.pop(refs.chainScale, 1.12)
end

function Hud.pulseQuest()
	UI.pop(refs.questScale, 1.15)
end

function Hud.refresh()
	-- Rank + progress to the next rank
	local rankIndex = player:GetAttribute("Rank") or 1
	local score = player:GetAttribute("GlowScore") or 0
	local rank = Config.Ranks[rankIndex]
	local nextRank = Config.Ranks[rankIndex + 1]
	refs.rank.Text = string.format("%s  ·  GLOW %s", rank.Name:upper(), Util.fmt(score))
	refs.rank.TextColor3 = rank.Color
	refs.rankBar.fill.BackgroundColor3 = rank.Color
	if nextRank then
		refs.rankBar.set((score - rank.Score) / (nextRank.Score - rank.Score))
		refs.rankNext.Text = string.format("→ %s %s", nextRank.Name, Util.fmt(nextRank.Score))
	else
		refs.rankBar.set(1)
		refs.rankNext.Text = "MAX RANK"
	end
	local rate = player:GetAttribute("AuraRate") or 0
	refs.rate.Text = rate > 0 and ("+" .. Util.fmt(rate) .. " /s") or ""

	-- Quest
	local kind = player:GetAttribute("QuestKind")
	refs.quest.Visible = kind ~= nil
	if kind then
		local goal = player:GetAttribute("QuestGoal") or 1
		local progress = player:GetAttribute("QuestProgress") or 0
		refs.questText.Text = "🎯 " .. Config.QuestText(kind, goal)
		refs.questCount.Text = progress .. " / " .. goal
		refs.questBar.set(progress / goal)
	end

	-- Event banner
	local id = workspace:GetAttribute("Event")
	local ev = id and id ~= "" and Config.EventById[id]
	local left = (workspace:GetAttribute("EventEnd") or 0) - workspace:GetServerTimeNow()
	if ev and left > 0 then
		refs.event.Visible = true
		refs.eventTitle.Text = string.format("%s %s  ·  %s", ev.Icon, ev.Name, Util.clock(left))
		refs.eventTitle.TextColor3 = ev.Tint
		refs.eventDesc.Text = ev.Desc
	else
		refs.event.Visible = false
	end

	-- Dock badges: a dot means "something is waiting for you"
	local aura = player:GetAttribute("Aura") or 0
	local affordable = false
	for _, def in Config.Upgrades do
		local lvl = player:GetAttribute("Lv_" .. def.Id) or 0
		if lvl < def.Max and aura >= Config.UpgradeCost(def, lvl) then
			affordable = true
		end
	end
	refs.badges.Rewards.Visible = player:GetAttribute("DailyReady") == true
	refs.badges.Crates.Visible = (player:GetAttribute("FreeCrates") or 0) > 0
	refs.badges.Upgrades.Visible = affordable
	refs.badges.Wardrobe.Visible = refs.newItem == true
end

function Hud.setNewItem(flag)
	refs.newItem = flag
end

return Hud
]=====])
put("ModuleScript", "Menu", modules, [=====[
-- GLOW UP: the one main menu. A single window with a tab list so the screen never fills up with
-- competing panels. Tabs register themselves with Menu.addTab(name, icon, builder).
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))

local Menu = {}

local camera = workspace:WaitForChild("Camera")
local backdrop, window, content, scale
local tabs = {} -- ordered { name, icon, builder, button, page, refresh }
local current
local open = false
local onChanged = {}

local WINDOW_W, WINDOW_H = 820, 500

function Menu.isOpen()
	return open
end

function Menu.current()
	return current
end

function Menu.onChanged(fn)
	table.insert(onChanged, fn)
end

local function fitScale()
	local v = camera.ViewportSize
	local s = math.min(v.X / (WINDOW_W + 40), v.Y / (WINDOW_H + 40), 1)
	return math.max(0.5, s)
end

local function select(name)
	for _, tab in tabs do
		local active = tab.name == name
		tab.page.Visible = active
		UI.tween(tab.button, 0.15, {
			BackgroundColor3 = active and UI.Colors.Accent or UI.Colors.Card,
			BackgroundTransparency = active and 0.1 or 0.35,
		})
		if active then
			current = name
			if tab.refresh then
				tab.refresh()
			end
		end
	end
	for _, fn in onChanged do
		fn(name)
	end
end

function Menu.init(gui)
	backdrop = UI.new("TextButton", {
		Name = "MenuBackdrop",
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = Color3.fromRGB(6, 4, 16),
		BackgroundTransparency = 1,
		AutoButtonColor = false,
		Text = "",
		Visible = false,
		ZIndex = 20,
	}, gui)
	backdrop.Activated:Connect(function()
		Menu.close()
	end)

	window = UI.panel(backdrop, {
		Name = "Window",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(WINDOW_W, WINDOW_H),
		BackgroundTransparency = 0.04,
		ZIndex = 21,
		Radius = 20,
	})
	scale = UI.new("UIScale", { Scale = fitScale() }, window)
	camera:GetPropertyChangedSignal("ViewportSize"):Connect(function()
		scale.Scale = fitScale()
	end)
	-- Clicks inside the window must not fall through to the backdrop.
	UI.new("TextButton", { Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Text = "", ZIndex = 21, AutoButtonColor = false }, window)

	local header = UI.label(window, {
		Position = UDim2.fromOffset(24, 14),
		Size = UDim2.fromOffset(200, 30),
		Font = UI.Fonts.Title,
		TextSize = 24,
		TextColor3 = UI.Colors.Text,
		Text = "GLOW UP",
		ZIndex = 22,
	})
	UI.gradient(header, UI.Colors.Cyan, UI.Colors.Accent2, 0)

	local closeButton = UI.button(window, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -16, 0, 14),
		Size = UDim2.fromOffset(34, 34),
		Text = "✕",
		TextSize = 16,
		ZIndex = 23,
		Radius = 17,
	}, "card")
	closeButton.Activated:Connect(function()
		Audio.click()
		Menu.close()
	end)

	local sidebar = UI.new("Frame", {
		Position = UDim2.fromOffset(16, 62),
		Size = UDim2.fromOffset(170, WINDOW_H - 78),
		BackgroundTransparency = 1,
		ZIndex = 22,
	}, window)
	UI.new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, sidebar)
	Menu.sidebar = sidebar

	content = UI.new("Frame", {
		Position = UDim2.fromOffset(200, 62),
		Size = UDim2.fromOffset(WINDOW_W - 216, WINDOW_H - 78),
		BackgroundTransparency = 1,
		ZIndex = 22,
		ClipsDescendants = true,
	}, window)
end

function Menu.addTab(name, icon, builder)
	local index = #tabs + 1
	local button = UI.button(Menu.sidebar, {
		LayoutOrder = index,
		Size = UDim2.new(1, 0, 0, 46),
		BackgroundTransparency = 0.35,
		Text = "",
		ZIndex = 23,
	}, "card")
	UI.label(button, {
		Position = UDim2.fromOffset(14, 0),
		Size = UDim2.new(1, -20, 1, 0),
		Font = UI.Fonts.Bold,
		TextSize = 16,
		Text = icon .. "   " .. name,
		TextWrapped = false,
		ZIndex = 24,
	})
	local badge = UI.new("Frame", {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -10, 0.5, 0),
		Size = UDim2.fromOffset(10, 10),
		BackgroundColor3 = UI.Colors.Accent2,
		Visible = false,
		ZIndex = 25,
	}, button)
	UI.corner(badge, 5)

	local page = UI.new("Frame", {
		Name = name,
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		Visible = false,
		ZIndex = 22,
	}, content)
	local api = builder(page) or {}
	local tab = { name = name, icon = icon, button = button, page = page, refresh = api.refresh, badge = badge }
	table.insert(tabs, tab)
	button.Activated:Connect(function()
		Audio.click()
		select(name)
	end)
	return tab
end

function Menu.setBadge(name, visible)
	for _, tab in tabs do
		if tab.name == name then
			tab.badge.Visible = visible
		end
	end
end

function Menu.open(name)
	if not backdrop then
		return
	end
	if not open then
		open = true
		backdrop.Visible = true
		backdrop.BackgroundTransparency = 1
		UI.tween(backdrop, 0.2, { BackgroundTransparency = 0.45 })
		local target = fitScale()
		scale.Scale = target * 0.9
		UI.tween(scale, 0.25, { Scale = target }, Enum.EasingStyle.Back)
	end
	select(name or current or (tabs[1] and tabs[1].name))
end

function Menu.close()
	if not open then
		return
	end
	open = false
	UI.tween(backdrop, 0.15, { BackgroundTransparency = 1 })
	UI.tween(scale, 0.15, { Scale = fitScale() * 0.92 })
	task.delay(0.16, function()
		if not open then
			backdrop.Visible = false
		end
	end)
	for _, fn in onChanged do
		fn(nil)
	end
end

function Menu.toggle(name)
	if open and (name == nil or current == name) then
		Menu.close()
	else
		Menu.open(name)
	end
end

-- Refresh the visible tab (called a few times a second while open).
function Menu.refresh()
	if not open then
		return
	end
	for _, tab in tabs do
		if tab.name == current and tab.refresh then
			tab.refresh()
		end
	end
end

return Menu
]=====])
put("ModuleScript", "Orbs", modules, [=====[
-- GLOW UP: shards bob and spin locally so the server never has to animate them.
local CollectionService = game:GetService("CollectionService")
local RunService = game:GetService("RunService")

local Orbs = {}

local tracked = {}

local function track(shard)
	if shard:IsA("BasePart") then
		tracked[shard] = shard.Position
	end
end

function Orbs.init()
	CollectionService:GetInstanceAddedSignal("Shard"):Connect(track)
	CollectionService:GetInstanceRemovedSignal("Shard"):Connect(function(shard)
		tracked[shard] = nil
	end)
	for _, shard in CollectionService:GetTagged("Shard") do
		track(shard)
	end
	RunService.RenderStepped:Connect(function()
		local t = os.clock()
		for shard, base in tracked do
			if shard.Parent and not shard:GetAttribute("Taken") then
				shard.CFrame = CFrame.new(base + Vector3.new(0, math.sin(t * 2 + base.X * 0.3) * 0.6, 0)) * CFrame.Angles(0, t, 0)
			end
		end
	end)
end

return Orbs
]=====])
print("GLOW UP installer 5/7 done (" .. created .. " scripts). Now run installer 6.")

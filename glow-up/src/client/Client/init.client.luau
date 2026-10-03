-- SUB 5 TO TRUE ADAM: client entry point. Builds the interface, wires the menu tabs, and routes everything
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
local TabPets = require(Modules.TabPets)
local TabProfile = require(Modules.TabProfile)
local TabRewards = require(Modules.TabRewards)
local TabSettings = require(Modules.TabSettings)
local TrainingUI = require(Modules.TrainingUI)
local DuelUI = require(Modules.DuelUI)
local CompetitionUI = require(Modules.CompetitionUI)
local Interact = require(Modules.Interact)
local HammerRow = require(Modules.HammerRow)
local Swing = require(Modules.Swing)
local Tutorial = require(Modules.Tutorial)
local PetsView = require(Modules.PetsView)
local Guide = require(Modules.Guide)
local WorldTags = require(Modules.WorldTags)
local Runner = require(Modules.Runner)
local TabStore = require(Modules.TabStore)

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
Menu.init(gui)
Menu.addTab("Wardrobe", "👗", function(page)
	return TabWardrobe.build(page, Action)
end)
Menu.addTab("Crates", "🎁", function(page)
	return TabCrates.build(page, Action)
end)
Menu.addTab("Pets", "🐾", function(page)
	return TabPets.build(page, Action)
end)
Menu.addTab("Store", "💎", function(page)
	return TabStore.build(page, Menu)
end, true)
Menu.addTab("Upgrades", "⬆️", function(page)
	return TabUpgrades.build(page, Action)
end)
Menu.addTab("Profile", "📈", function(page)
	return TabProfile.build(page)
end)
Menu.addTab("Rewards", "📅", function(page)
	return TabRewards.build(page, Action, Menu)
end, true)
Menu.addTab("Settings", "⚙️", function(page)
	return TabSettings.build(page, Action)
end)
Hud.init(gui, Menu, Action)
Toasts.init(gui)
TrainingUI.init(gui, Action)
DuelUI.init(gui, Action)
CompetitionUI.init(gui, Action)
Interact.init(gui, Action, Menu)
HammerRow.init()
Swing.init(gui, Action, Menu)
Tutorial.init(gui, Action)
Guide.init(gui, Action)
Hud.onHelp = Guide.open
WorldTags.init()
PetsView.init()
Runner.init(gui)

TabSettings.apply()
Audio.startMusic()
for _, key in { "Music", "Sfx", "Voice" } do
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
	Fx.announce(rank.Full:upper(), "NEW LOOKS TIER!", rank.Color, 0.2)
	local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if root then
		Fx.ring(root.Position, rank.Color, 50)
		Fx.pillar(root.Position, rank.Color, 110)
		Fx.burst(root.Position, rank.Color, 60)
	end
end

-- Plain level-ups stay small (a toast); every 10th level gets a proper moment.
function handlers.level(level, aura, crates)
	Audio.levelUp(level % 10 == 0)
	Audio.say("levelup")
	local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if root then
		Fx.ring(root.Position, UI.Colors.Gold, level % 10 == 0 and 40 or 18)
		Fx.pillar(root.Position, UI.Colors.Gold, level % 10 == 0 and 90 or 40)
		Fx.burst(root.Position, UI.Colors.Gold, level % 10 == 0 and 50 or 16)
	end
	if level % 10 == 0 then
		Fx.shake(0.3, 0.4)
		Fx.flash(UI.Colors.Gold, 0.25, 0.6)
		Fx.announce("LEVEL " .. level, "+" .. Util.fmt(aura) .. " Aura" .. (crates > 0 and "  +  free crate" or ""), UI.Colors.Gold, 0.3)
	else
		Toasts.push(string.format("Level %d!  +%s Aura", level, Util.fmt(aura)), "gold")
	end
end

function handlers.compStart(...)
	Menu.close()
	CompetitionUI.start(...)
end

function handlers.compProgress(list)
	CompetitionUI.progress(list)
end

function handlers.compEnd(...)
	CompetitionUI.finish(...)
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
	Fx.announce("REBORN", "★" .. n .. "  ·  +50% Aura and XP, forever", UI.Colors.Gold, 0.3)
end

function handlers.swing(gained, tag, frenzy)
	Swing.result(gained, tag, frenzy)
end

function handlers.frenzy(seconds)
	Audio.milestone(20)
	Fx.shake(0.4, 0.4)
	Fx.flash(UI.Colors.Orange, 0.3, 0.5)
	Fx.announce("MOG FRENZY!", "x2 Aura for " .. seconds .. " seconds, keep swinging", UI.Colors.Orange, 0.22)
end

function handlers.gift(aura, crates, index, total)
	Audio.daily()
	local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if root then
		Fx.ring(root.Position, UI.Colors.Mint, 26)
		Fx.burst(root.Position, UI.Colors.Mint, 30)
	end
	Toasts.push(string.format("🎁 Play-time gift %d/%d:  +%s Aura%s", index, total, Util.fmt(aura), crates > 0 and ("  +" .. crates .. " crate" .. (crates > 1 and "s" or "")) or ""), "gold")
end

function handlers.hammer(id, how)
	local hammer = Config.HammerById[id]
	Audio.purchase()
	local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if root then
		Fx.burst(root.Position, hammer.Head, 20)
	end
	Toasts.push(string.format("%s %s  ·  x%d Aura per swing", hammer.Name, how == "bought" and "bought and equipped" or "equipped", hammer.Mult), "gold")
end

function handlers.hatch(eggId, petId, copies)
	local pet = Config.PetById[petId]
	local rarity = Config.Rarities[pet.Rarity]
	Audio.reveal(Config.Rarities[pet.Rarity].Order)
	Fx.shake(0.15 + rarity.Order * 0.08, 0.3)
	Fx.flash(rarity.Color, 0.15 + rarity.Order * 0.05, 0.5)
	local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if root and rarity.Order >= 3 then
		Fx.ring(root.Position, rarity.Color, 14 + rarity.Order * 6)
		Fx.pillar(root.Position, rarity.Color, 30 + rarity.Order * 14)
		Fx.burst(root.Position, rarity.Color, 20 + rarity.Order * 10)
	end
	Fx.announce(pet.Name:upper(), string.format("%s pet  ·  +%d%% Aura%s", pet.Rarity, math.floor(Config.PetMult(pet, copies) * 100 + 0.5), copies > 1 and ("  ·  " .. string.rep("★", Config.PetStars(copies))) or "  ·  NEW!"), rarity.Color, 0.25)
end

function handlers.stageResult(stage, won, first, cleared)
	local def = Config.Battle.Stages[stage]
	if won then
		Audio.say(first and "stage" or "win")
		if first then
			Fx.announce("STAGE " .. stage .. " CLEARED!", stage < Config.Battle.Count and ("Next: " .. Config.Battle.Stages[stage + 1].Name) or "You beat every opponent!", def.Color, 0.25)
		end
	else
		Toasts.push("Stage " .. stage .. " (" .. def.Name .. ") beat you. Level up and try again!", "bad")
	end
end

function handlers.tutorialStep()
	local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
	if root then
		Fx.burst(root.Position, UI.Colors.Good, 20)
	end
end

function handlers.tutorialDone(aura, crates)
	Audio.say("done")
	Audio.levelUp(true)
	Fx.flash(UI.Colors.Gold, 0.3, 0.6)
	Fx.announce("TUTORIAL COMPLETE", string.format("+%s Aura  +%d crates. Now go mog them all!", Util.fmt(aura), crates), UI.Colors.Gold, 0.22)
end

function handlers.building(id)
	local def = Config.Buildings[id]
	Audio.say("unlock")
	Audio.levelUp(true)
	Fx.shake(0.35, 0.4)
	Fx.flash(def.Glow, 0.3, 0.6)
	local pos = Config.BuildingPos[id]()
	Fx.ring(pos, def.Glow, 45)
	Fx.pillar(pos, def.Glow, 120)
	Fx.burst(pos + Vector3.new(0, 4, 0), def.Glow, 70)
	Fx.announce(def.Name:upper() .. " UNLOCKED", "Aura: " .. def.Aura, def.Glow, 0.22)
end

function handlers.treadBought(id)
	local t = Config.Treadmills[id]
	Audio.purchase()
	Fx.burst(Config.TreadPos(id) + Vector3.new(0, 4, 0), t.Color, 40)
	Fx.ring(Config.TreadPos(id), t.Color, 14)
	Toasts.push(string.format("%s unlocked  ·  +%s Aura per second", t.Name, Util.fmt(t.Rate)), "gold")
end

function handlers.run(id)
	Runner.start(id)
	Toasts.push("Running! Aura every second. Press the red button to stop.", "info")
end

function handlers.runTick(gained, heat, id)
	Runner.tick(gained, heat, id)
end

function handlers.runStop()
	Runner.stop()
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
			warn("[TrueAdam] UI handler '" .. tostring(kind) .. "' failed:", err)
		end
	end
end)

--------------------------------------------------------------------------------
-- Welcome back
--------------------------------------------------------------------------------
task.spawn(function()
	task.wait(2.5)
	if (player:GetAttribute("Level") or 1) <= 1 and (player:GetAttribute("XP") or 0) < 5 then
		Fx.announce("SUB 5", "That's you. Level up to evolve!", Config.Ranks[1].Color, 0.22)
		task.wait(3)
	end
	local gain = player:GetAttribute("OfflineGain")
	if gain and gain > 0 then
		Toasts.push("Welcome back! Your look earned ✦" .. Util.fmt(gain) .. " while you were away", "gold")
	elseif player:GetAttribute("DailyReady") then
		Toasts.push("Your daily reward is ready", "gold")
	end
end)

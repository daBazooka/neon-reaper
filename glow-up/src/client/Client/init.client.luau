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
local Orbs = require(Modules.Orbs)
local Interact = require(Modules.Interact)
local HammerRow = require(Modules.HammerRow)
local Swing = require(Modules.Swing)

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
Menu.addTab("Pets", "🐾", function(page)
	return TabPets.build(page, Action)
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
Hud.init(gui, Menu, Action)
Toasts.init(gui)
TrainingUI.init(gui, Action)
DuelUI.init(gui, Action)
CompetitionUI.init(gui, Action)
Interact.init(gui, Action, Menu)
HammerRow.init()
Swing.init(gui, Action, Menu)

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
		Fx.floatText(pos, text, color, mut and 26 or 22)
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
	Fx.announce(rank.Full:upper(), "NEW LOOKS TIER!", rank.Color, 0.2)
end

-- Plain level-ups stay small (a toast); every 10th level gets a proper moment.
function handlers.level(level, aura, crates)
	Audio.quest()
	if level % 10 == 0 then
		Audio.levelUp()
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

function handlers.swing(gained)
	Swing.result(gained)
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
	Fx.announce(pet.Name:upper(), string.format("%s pet  ·  +%d%% Aura%s", pet.Rarity, math.floor(Config.PetMult(pet, copies) * 100 + 0.5), copies > 1 and ("  ·  " .. string.rep("★", Config.PetStars(copies))) or "  ·  NEW!"), rarity.Color, 0.25)
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

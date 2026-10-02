-- Shared tuning for Starlight Sprint. Tweak numbers here to rebalance the whole game.
local Config = {}

Config.ComboWindow = 3 -- seconds to grab the next orb before the combo breaks
Config.ComboMax = 50
Config.RespawnTime = 4
Config.StartingMagnet = 8

-- Audio. These point at sounds that ship inside the Roblox client, so nothing needs uploading.
-- Want richer sound? Paste any audio asset id from the Creator Store, e.g. "rbxassetid://1234567".
Config.Sounds = {
	Tone = "rbxasset://sounds/electronicpingshort.wav", -- short bell-like blip: pickups + generative music
	Bass = "rbxasset://sounds/bass.wav",
	Click = "rbxasset://sounds/button.wav",
	Flash = "rbxasset://sounds/flashbulb.wav",
}
Config.MusicTrackId = "" -- optional: a looping song id. Leave empty for the generative ambient music.
Config.MusicVolume = 0.3
Config.SfxVolume = 0.8

-- Progression
Config.MaxLevel = 100
Config.LuckyChance = 0.04 -- chance that any orb pays out x5
Config.LuckyMult = 5
Config.ComboMilestones = {
	[5] = "GOOD!",
	[10] = "NICE!",
	[15] = "GREAT!",
	[25] = "AMAZING!",
	[35] = "INSANE!",
	[50] = "GODLIKE!",
}

Config.OrbTypes = {
	{ Name = "Spark", Value = 1, Weight = 70, Scale = 0, Color = Color3.fromRGB(90, 210, 255) },
	{ Name = "Bloom", Value = 6, Weight = 22, Scale = 0.4, Color = Color3.fromRGB(200, 110, 255) },
	{ Name = "Nova", Value = 30, Weight = 7, Scale = 0.8, Color = Color3.fromRGB(255, 200, 70) },
	{ Name = "Mythic", Value = 150, Weight = 1, Scale = 1.3, Color = Color3.fromRGB(255, 90, 160) },
}

Config.Upgrades = {
	{ Id = "Magnet", Name = "Star Magnet", Desc = "Grab orbs from farther away", Base = 25, Growth = 1.5, Max = 25 },
	{ Id = "Speed", Name = "Comet Boots", Desc = "Run faster", Base = 40, Growth = 1.55, Max = 20 },
	{ Id = "Jump", Name = "Moon Jump", Desc = "Jump higher", Base = 30, Growth = 1.5, Max = 20 },
	{ Id = "Value", Name = "Orb Alchemy", Desc = "+50% dust from every orb", Base = 60, Growth = 1.75, Max = 30 },
}

-- Aura colors, one per ascension (cycles after the last).
Config.Auras = {
	Color3.fromRGB(90, 210, 255),
	Color3.fromRGB(255, 90, 220),
	Color3.fromRGB(255, 210, 80),
	Color3.fromRGB(110, 255, 150),
	Color3.fromRGB(255, 110, 90),
	Color3.fromRGB(235, 235, 255),
}

-- Wisps: pets that orbit you and earn Stardust per second, even while you're offline.
Config.MaxWisps = 8
Config.OfflineCapSeconds = 2 * 3600
Config.OfflineEfficiency = 0.5
Config.Wisps = {
	{ Id = "Pip", Name = "Pip", Rarity = "Common", Weight = 60, Rate = 1, Color = Color3.fromRGB(130, 220, 255) },
	{ Id = "Lumi", Name = "Lumi", Rarity = "Uncommon", Weight = 25, Rate = 4, Color = Color3.fromRGB(120, 255, 170) },
	{ Id = "Aurora", Name = "Aurora", Rarity = "Rare", Weight = 10, Rate = 15, Color = Color3.fromRGB(190, 120, 255) },
	{ Id = "Nebula", Name = "Nebula", Rarity = "Epic", Weight = 4, Rate = 60, Color = Color3.fromRGB(255, 110, 200) },
	{ Id = "Cosmo", Name = "Cosmo", Rarity = "Legendary", Weight = 0.9, Rate = 300, Color = Color3.fromRGB(255, 205, 70) },
	{ Id = "Genesis", Name = "Genesis", Rarity = "MYTHIC", Weight = 0.1, Rate = 2000, Color = Color3.fromRGB(255, 255, 255) },
}

-- Orb mutations (checked in order, first hit wins).
Config.Mutations = {
	{ Name = "Prismatic", Chance = 0.005, Mult = 10, Color = Color3.fromRGB(255, 255, 255) },
	{ Name = "Golden", Chance = 0.04, Mult = 3, Color = Color3.fromRGB(255, 205, 60) },
}

-- Server-wide cosmic events.
Config.EventGap = { 150, 300 } -- seconds between events (random)
Config.Events = {
	{ Id = "Golden", Name = "🌟 GOLDEN HOUR", Desc = "All dust x2!", Duration = 90, Mult = 2, Tint = Color3.fromRGB(255, 232, 170) },
	{ Id = "Starfall", Name = "☄️ STARFALL", Desc = "A shower of rich orbs lands across the hub!", Duration = 60, Tint = Color3.fromRGB(190, 215, 255) },
	{ Id = "Aurora", Name = "🌌 AURORA", Desc = "Golden & Prismatic orbs are 8x likelier!", Duration = 90, MutBoost = 8, Tint = Color3.fromRGB(180, 255, 215) },
}

-- Daily login streak (7-day cycle). Dust is multiplied by (1 + ascensions).
Config.Daily = {
	{ Dust = 100 },
	{ Dust = 200 },
	{ Dust = 300, Eggs = 1 },
	{ Dust = 500 },
	{ Dust = 800 },
	{ Dust = 1200 },
	{ Dust = 2000, Eggs = 2 },
}

function Config.EggCost(ascensions)
	return math.floor(250 * 1.5 ^ ascensions)
end

function Config.WispById(id)
	for _, w in Config.Wisps do
		if w.Id == id then
			return w
		end
	end
	return nil
end

function Config.WispRate(ids, ascensions)
	local sum = 0
	for _, id in ids do
		local w = Config.WispById(id)
		if w then
			sum += w.Rate
		end
	end
	return sum * (1 + 0.5 * ascensions)
end

function Config.XPForLevel(level)
	return math.floor(40 * 1.28 ^ (level - 1))
end

function Config.LevelBonus(level)
	return 1 + 0.03 * ((level or 1) - 1)
end

function Config.TierIndex(name)
	for i, t in Config.OrbTypes do
		if t.Name == name then
			return i
		end
	end
	return 1
end

-- Endless chain of small goals. n = quests completed so far.
local QUEST_KINDS = { "orbs", "combo", "rare" }
function Config.MakeQuest(n, ascensions)
	local kind = QUEST_KINDS[n % #QUEST_KINDS + 1]
	local step = n // #QUEST_KINDS
	local goal, per
	if kind == "orbs" then
		goal, per = math.min(25 + step * 10, 200), 4
	elseif kind == "combo" then
		goal, per = math.min(8 + step * 2, 45), 20
	else
		goal, per = math.min(4 + step * 2, 40), 25
	end
	return { Kind = kind, Goal = goal, Reward = math.floor(goal * per * (1 + ascensions)) }
end

function Config.QuestText(kind, goal)
	if kind == "orbs" then
		return string.format("Collect %d orbs", goal)
	elseif kind == "combo" then
		return string.format("Reach a x%d combo", goal)
	end
	return string.format("Collect %d Bloom orbs or better", goal)
end

function Config.UpgradeCost(def, level)
	return math.floor(def.Base * def.Growth ^ level)
end

function Config.AscendCost(ascensions)
	return math.floor(1500 * 3 ^ ascensions)
end

function Config.ComboMult(combo)
	return 1 + math.min(combo, Config.ComboMax) * 0.1
end

function Config.Multiplier(valueLevel, ascensions, combo, playerLevel)
	return (1 + 0.5 * valueLevel) * (1 + 0.5 * ascensions) * Config.ComboMult(combo) * Config.LevelBonus(playerLevel)
end

function Config.MagnetRadius(level)
	return Config.StartingMagnet + level * 1.5
end

function Config.AuraColor(ascensions)
	return Config.Auras[ascensions % #Config.Auras + 1]
end

return Config

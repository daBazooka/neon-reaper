-- Shared tuning for Starlight Sprint. Tweak numbers here to rebalance the whole game.
local Config = {}

Config.ComboWindow = 3 -- seconds to grab the next orb before the combo breaks
Config.ComboMax = 50
Config.RespawnTime = 4
Config.StartingMagnet = 8
Config.PickupSoundId = "" -- optional: "rbxassetid://<id>" of a chime; pitch rises with combo

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

function Config.UpgradeCost(def, level)
	return math.floor(def.Base * def.Growth ^ level)
end

function Config.AscendCost(ascensions)
	return math.floor(1500 * 3 ^ ascensions)
end

function Config.ComboMult(combo)
	return 1 + math.min(combo, Config.ComboMax) * 0.1
end

function Config.Multiplier(valueLevel, ascensions, combo)
	return (1 + 0.5 * valueLevel) * (1 + 0.5 * ascensions) * Config.ComboMult(combo)
end

function Config.MagnetRadius(level)
	return Config.StartingMagnet + level * 1.5
end

function Config.AuraColor(ascensions)
	return Config.Auras[ascensions % #Config.Auras + 1]
end

return Config

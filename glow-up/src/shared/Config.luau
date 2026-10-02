-- SUB 5 TO TRUE ADAM: every number, name and table the game balances on lives here.
local Config = {}

Config.GameName = "Sub 5 to True Adam"
Config.PlazaRadius = 150

--------------------------------------------------------------------------------
-- Levels (1 to 1000) and the looks tiers they unlock
--------------------------------------------------------------------------------
Config.MaxLevel = 1000

Config.Ranks = {
	{ Name = "Sub 5", Full = "Sub 5", Level = 1, Color = Color3.fromRGB(196, 168, 140) },
	{ Name = "LTN", Full = "Low-Tier Normie", Level = 10, Color = Color3.fromRGB(150, 205, 120) },
	{ Name = "MTN", Full = "Mid-Tier Normie", Level = 25, Color = Color3.fromRGB(90, 200, 235) },
	{ Name = "HTN", Full = "High-Tier Normie", Level = 50, Color = Color3.fromRGB(100, 150, 255) },
	{ Name = "Chadlite", Full = "Chadlite", Level = 100, Color = Color3.fromRGB(190, 125, 255) },
	{ Name = "Chad", Full = "Chad", Level = 200, Color = Color3.fromRGB(255, 170, 60) },
	{ Name = "Gigachad", Full = "Gigachad", Level = 450, Color = Color3.fromRGB(255, 110, 70) },
	{ Name = "True Adam", Full = "TRUE ADAM", Level = 1000, Color = Color3.fromRGB(255, 214, 70) },
}

function Config.RankFor(level)
	local index = 1
	for i, rank in Config.Ranks do
		if level >= rank.Level then
			index = i
		end
	end
	return index
end

-- XP needed to go from `level` to `level + 1`.
-- Levels 1-50 are quick (a few minutes each at most); after 50 the cost climbs steeply.
function Config.XPForLevel(level)
	if level <= 50 then
		return math.floor(20 + 8 * level)
	end
	return math.floor(420 * (level / 50) ^ 3.2)
end

-- Body shape by level. Level 1 is a short, wide, big-headed "Sub 5" gag character; it changes
-- fastest early on and settles into a tall, athletic look at level 1000.
local APPEARANCE_START = { BodyHeightScale = 0.8, BodyWidthScale = 1.55, BodyDepthScale = 1.45, HeadScale = 1.3, BodyTypeScale = 0, BodyProportionScale = 0 }
local APPEARANCE_END = { BodyHeightScale = 1.12, BodyWidthScale = 0.92, BodyDepthScale = 0.95, HeadScale = 0.95, BodyTypeScale = 0.3, BodyProportionScale = 0.3 }
function Config.AppearanceScales(level)
	local t = math.clamp((level - 1) / (Config.MaxLevel - 1), 0, 1) ^ 0.55
	local out = {}
	for key, from in APPEARANCE_START do
		out[key] = from + (APPEARANCE_END[key] - from) * t
	end
	return out
end

--------------------------------------------------------------------------------
-- Training stats
--------------------------------------------------------------------------------
Config.StatOrder = { "Power", "Style", "Charm" }
Config.Stats = {
	Power = { Name = "Power", Icon = "💪", Station = "GYM", Color = Color3.fromRGB(255, 120, 80) },
	Style = { Name = "Style", Icon = "💅", Station = "STYLE STUDIO", Color = Color3.fromRGB(255, 110, 200) },
	Charm = { Name = "Charm", Icon = "✨", Station = "CHARM LOUNGE", Color = Color3.fromRGB(90, 214, 255) },
}
Config.TrainReps = 5
Config.StatScore = 5 -- Glow Score per stat point

--------------------------------------------------------------------------------
-- Upgrades (bought with Aura)
--------------------------------------------------------------------------------
Config.Upgrades = {
	{ Id = "Magnet", Name = "Aura Magnet", Icon = "🧲", Desc = "Grab shards from farther away", Base = 40, Growth = 1.5, Max = 25 },
	{ Id = "Boots", Name = "Glide Sneakers", Icon = "👟", Desc = "Run faster around the district", Base = 60, Growth = 1.55, Max = 20 },
	{ Id = "Training", Name = "Pro Coach", Icon = "🏋️", Desc = "+25% stat gain from training", Base = 120, Growth = 1.7, Max = 30 },
	{ Id = "Luck", Name = "Lucky Charm", Icon = "🍀", Desc = "Better odds for rare crate drops", Base = 150, Growth = 1.75, Max = 30 },
	{ Id = "Boost", Name = "Aura Boost", Icon = "🔥", Desc = "+15% Aura from everything", Base = 200, Growth = 1.8, Max = 30 },
}

function Config.UpgradeCost(def, level)
	return math.floor(def.Base * def.Growth ^ level)
end
function Config.MagnetRadius(level)
	return 9 + level * 1.6
end
function Config.WalkSpeed(level)
	return 18 + level * 1.2
end
function Config.TrainMult(level)
	return 1 + level * 0.25
end
function Config.LuckMult(level)
	return 1 + level * 0.08
end
function Config.BoostMult(level)
	return 1 + level * 0.15
end
function Config.RebirthMult(rebirths)
	return 1 + rebirths * 0.25
end
-- Level needed to rebirth (rebirth keeps your level, resets Aura/stats/upgrades).
function Config.RebirthRequirement(rebirths)
	return 40 + 30 * rebirths
end

--------------------------------------------------------------------------------
-- Cosmetics: what you wear. Power adds to Glow Score, Aps = Aura per second.
--------------------------------------------------------------------------------
Config.Rarities = {
	Common = { Order = 1, Color = Color3.fromRGB(166, 176, 198), Power = 10, Aps = 1 },
	Rare = { Order = 2, Color = Color3.fromRGB(82, 172, 255), Power = 30, Aps = 4 },
	Epic = { Order = 3, Color = Color3.fromRGB(192, 106, 255), Power = 90, Aps = 15 },
	Legendary = { Order = 4, Color = Color3.fromRGB(255, 192, 62), Power = 300, Aps = 60 },
	Mythic = { Order = 5, Color = Color3.fromRGB(255, 84, 172), Power = 1000, Aps = 250 },
}
Config.RarityOrder = { "Common", "Rare", "Epic", "Legendary", "Mythic" }
Config.MaxStars = 5
Config.StarBonus = 0.25 -- each extra star adds this much to Power and Aps

Config.Slots = { "Head", "Back", "Face", "Aura", "Trail" }
Config.SlotIcons = { Head = "👑", Back = "🦋", Face = "🕶️", Aura = "✨", Trail = "💨" }

local C = Color3.fromRGB
Config.Cosmetics = {
	-- Head
	{ Id = "head_cap", Name = "Street Cap", Slot = "Head", Rarity = "Common", Icon = "🧢", Build = { Kind = "cap", Color = C(70, 80, 120) } },
	{ Id = "head_halo", Name = "Halo", Slot = "Head", Rarity = "Rare", Icon = "😇", Build = { Kind = "halo", Color = C(110, 230, 255) } },
	{ Id = "head_crown", Name = "Neon Crown", Slot = "Head", Rarity = "Epic", Icon = "👑", Build = { Kind = "crown", Color = C(255, 110, 205) } },
	{ Id = "head_solar", Name = "Solar Crown", Slot = "Head", Rarity = "Legendary", Icon = "☀️", Build = { Kind = "crown", Color = C(255, 205, 80), Sparkle = true } },
	{ Id = "head_horns", Name = "Void Horns", Slot = "Head", Rarity = "Mythic", Icon = "😈", Build = { Kind = "horns", Color = C(255, 70, 170), Sparkle = true } },
	-- Back
	{ Id = "back_cape", Name = "Street Cape", Slot = "Back", Rarity = "Common", Icon = "🧥", Build = { Kind = "cape", Color = C(150, 50, 80) } },
	{ Id = "back_neon", Name = "Neon Cape", Slot = "Back", Rarity = "Rare", Icon = "🦸", Build = { Kind = "cape", Color = C(60, 190, 255), Glow = true } },
	{ Id = "back_angel", Name = "Angel Wings", Slot = "Back", Rarity = "Epic", Icon = "🕊️", Build = { Kind = "wings", Color = C(255, 244, 220) } },
	{ Id = "back_phoenix", Name = "Phoenix Wings", Slot = "Back", Rarity = "Legendary", Icon = "🔥", Build = { Kind = "wings", Color = C(255, 130, 50), Sparkle = true } },
	{ Id = "back_galaxy", Name = "Galaxy Wings", Slot = "Back", Rarity = "Mythic", Icon = "🌌", Build = { Kind = "wings", Color = C(150, 100, 255), Sparkle = true } },
	-- Face
	{ Id = "face_shades", Name = "Midnight Shades", Slot = "Face", Rarity = "Common", Icon = "🕶️", Build = { Kind = "visor", Color = C(25, 25, 35) } },
	{ Id = "face_visor", Name = "Neon Visor", Slot = "Face", Rarity = "Rare", Icon = "🥽", Build = { Kind = "visor", Color = C(80, 230, 255), Glow = true } },
	{ Id = "face_gold", Name = "Gold Mask", Slot = "Face", Rarity = "Epic", Icon = "🎭", Build = { Kind = "mask", Color = C(255, 205, 90) } },
	{ Id = "face_cyber", Name = "Cyber Mask", Slot = "Face", Rarity = "Legendary", Icon = "🤖", Build = { Kind = "mask", Color = C(90, 255, 160), Glow = true } },
	{ Id = "face_void", Name = "Void Gaze", Slot = "Face", Rarity = "Mythic", Icon = "👁️", Build = { Kind = "visor", Color = C(255, 70, 180), Glow = true, Sparkle = true } },
	-- Aura
	{ Id = "aura_spark", Name = "Cyan Sparks", Slot = "Aura", Rarity = "Common", Icon = "✨", Build = { Kind = "aura", Color = C(100, 220, 255) } },
	{ Id = "aura_haze", Name = "Pink Haze", Slot = "Aura", Rarity = "Rare", Icon = "🌸", Build = { Kind = "aura", Color = C(255, 120, 200) } },
	{ Id = "aura_flare", Name = "Gold Flare", Slot = "Aura", Rarity = "Epic", Icon = "🔆", Build = { Kind = "aura", Color = C(255, 205, 80) } },
	{ Id = "aura_storm", Name = "Emerald Storm", Slot = "Aura", Rarity = "Legendary", Icon = "🌪️", Build = { Kind = "aura", Color = C(90, 255, 160) } },
	{ Id = "aura_nova", Name = "Prismatic Nova", Slot = "Aura", Rarity = "Mythic", Icon = "🌈", Build = { Kind = "aura", Color = C(255, 255, 255), Rainbow = true } },
	-- Trail
	{ Id = "trail_spark", Name = "Spark Trail", Slot = "Trail", Rarity = "Common", Icon = "💨", Build = { Kind = "trail", Color = C(100, 220, 255) } },
	{ Id = "trail_pink", Name = "Rose Trail", Slot = "Trail", Rarity = "Rare", Icon = "💗", Build = { Kind = "trail", Color = C(255, 120, 200) } },
	{ Id = "trail_gold", Name = "Gold Trail", Slot = "Trail", Rarity = "Epic", Icon = "🟡", Build = { Kind = "trail", Color = C(255, 205, 80) } },
	{ Id = "trail_emerald", Name = "Emerald Trail", Slot = "Trail", Rarity = "Legendary", Icon = "💚", Build = { Kind = "trail", Color = C(90, 255, 160) } },
	{ Id = "trail_prism", Name = "Prism Trail", Slot = "Trail", Rarity = "Mythic", Icon = "🌈", Build = { Kind = "trail", Color = C(255, 255, 255), Rainbow = true } },
}

Config.CosmeticById = {}
Config.CosmeticsByRarity = {}
for _, rarity in Config.RarityOrder do
	Config.CosmeticsByRarity[rarity] = {}
end
for _, c in Config.Cosmetics do
	Config.CosmeticById[c.Id] = c
	table.insert(Config.CosmeticsByRarity[c.Rarity], c)
end

function Config.CosmeticPower(c, stars)
	return Config.Rarities[c.Rarity].Power * (1 + Config.StarBonus * (stars - 1))
end
function Config.CosmeticAps(c, stars)
	return Config.Rarities[c.Rarity].Aps * (1 + Config.StarBonus * (stars - 1))
end

--------------------------------------------------------------------------------
-- Crates
--------------------------------------------------------------------------------
Config.Crates = {
	{ Id = "street", Name = "Street Crate", Icon = "📦", Cost = 300, Color = C(110, 160, 255), Odds = { Common = 70, Rare = 26, Epic = 4 } },
	{
		Id = "neon",
		Name = "Neon Crate",
		Icon = "🎁",
		Cost = 4000,
		Color = C(255, 110, 205),
		Odds = { Rare = 60, Epic = 34, Legendary = 6 },
		PityAfter = 10,
		PityMin = "Epic",
	},
	{
		Id = "icon",
		Name = "Icon Crate",
		Icon = "💎",
		Cost = 60000,
		Color = C(255, 204, 84),
		Odds = { Epic = 62, Legendary = 34, Mythic = 4 },
		PityAfter = 8,
		PityMin = "Legendary",
	},
}
Config.CrateById = {}
for _, crate in Config.Crates do
	Config.CrateById[crate.Id] = crate
end

--------------------------------------------------------------------------------
-- Aura shards scattered around the district
--------------------------------------------------------------------------------
Config.ShardTypes = {
	{ Name = "Copper", Value = 2, Weight = 70, Scale = 0, Color = C(205, 127, 70), Shape = "Coin", Material = "Metal" },
	{ Name = "Silver", Value = 12, Weight = 22, Scale = 0.4, Color = C(205, 212, 225), Shape = "Coin", Material = "Metal" },
	{ Name = "Gold", Value = 60, Weight = 7, Scale = 0.8, Color = C(255, 202, 50), Shape = "Coin", Material = "Metal" },
	{ Name = "Diamond", Value = 300, Weight = 1, Scale = 1.1, Color = C(130, 225, 255), Shape = "Gem", Material = "Glass" },
}
Config.ShardMutations = {
	{ Name = "Rainbow", Chance = 0.005, Mult = 10, Color = C(255, 120, 200) },
	{ Name = "Shiny", Chance = 0.04, Mult = 3, Color = C(255, 245, 160) },
}
Config.ShardRespawn = 4
Config.ChainWindow = 2.5
Config.ChainMax = 30
function Config.ChainMult(chain)
	return 1 + math.min(chain, Config.ChainMax) * 0.05
end
function Config.ShardTier(name)
	for i, t in Config.ShardTypes do
		if t.Name == name then
			return i
		end
	end
	return 1
end
-- Shards pay more as you rank up, so early crates stay exciting without trivialising late ones.
function Config.RankScaling(rankIndex)
	return 1 + (rankIndex - 1) * 0.6
end

--------------------------------------------------------------------------------
-- Duels
--------------------------------------------------------------------------------
Config.Duel = {
	Countdown = 3,
	Length = 7,
	MaxTapsPerSecond = 14,
	QueueBotAfter = 6,
	Cooldown = 4,
}

--------------------------------------------------------------------------------
-- Mog Competition: a group flex-off on the central stage every few minutes
--------------------------------------------------------------------------------
Config.Competition = {
	Gap = 150, -- seconds between competitions
	EntryTime = 30,
	Countdown = 3,
	Length = 8,
	MinFieldSize = 6, -- bots fill empty spots so it always feels like a crowd
	BotNames = { "Mogger Mike", "Sigma Sam", "Chad Chris", "Aura Alex", "Rizz Ron", "Gigachad Gus" },
}

--------------------------------------------------------------------------------
-- Runway: walking it earns a steady trickle scaled by your Glow Score
--------------------------------------------------------------------------------
Config.Runway = { MinZ = 26, MaxZ = 96, HalfWidth = 7, AuraPerScore = 0.04 }

--------------------------------------------------------------------------------
-- Quests (an endless chain of small goals)
--------------------------------------------------------------------------------
local QUEST_KINDS = { "shards", "train", "duel", "crate", "perfect" }
function Config.MakeQuest(done, rebirths)
	local kind = QUEST_KINDS[done % #QUEST_KINDS + 1]
	local step = done // #QUEST_KINDS
	local goal, per
	if kind == "shards" then
		goal, per = math.min(25 + step * 8, 150), 6
	elseif kind == "train" then
		goal, per = math.min(5 + step, 20), 40
	elseif kind == "duel" then
		goal, per = math.min(1 + step // 2, 6), 180
	elseif kind == "crate" then
		goal, per = math.min(1 + step // 3, 4), 250
	else
		goal, per = math.min(3 + step, 15), 70
	end
	return { Kind = kind, Goal = goal, Reward = math.floor(goal * per * (1 + rebirths)) }
end
function Config.QuestText(kind, goal)
	if kind == "shards" then
		return string.format("Collect %d Aura shards", goal)
	elseif kind == "train" then
		return string.format("Land %d training reps", goal)
	elseif kind == "duel" then
		return string.format("Win %d duel%s", goal, goal == 1 and "" or "s")
	elseif kind == "crate" then
		return string.format("Open %d crate%s", goal, goal == 1 and "" or "s")
	end
	return string.format("Hit %d PERFECT reps", goal)
end

--------------------------------------------------------------------------------
-- Daily rewards (7-day cycle). Aura is multiplied by (1 + rebirths).
--------------------------------------------------------------------------------
Config.Daily = {
	{ Aura = 150 },
	{ Aura = 300 },
	{ Aura = 500, Crates = 1 },
	{ Aura = 800 },
	{ Aura = 1500, Crates = 2 },
	{ Aura = 2500 },
	{ Aura = 5000, Crates = 3 },
}

--------------------------------------------------------------------------------
-- Server events
--------------------------------------------------------------------------------
Config.EventGap = { 150, 280 }
Config.Events = {
	{ Id = "Golden", Name = "GOLDEN HOUR", Icon = "🌟", Desc = "All Aura x2", Duration = 90, AuraMult = 2, Tint = C(255, 240, 200) },
	{ Id = "Storm", Name = "SHARD STORM", Icon = "☄️", Desc = "Rare shards are raining down", Duration = 60, Tint = C(215, 230, 255) },
	{ Id = "Frenzy", Name = "DUEL FRENZY", Icon = "⚔️", Desc = "Duel rewards x3", Duration = 90, DuelMult = 3, Tint = C(255, 215, 220) },
	{ Id = "Runway", Name = "RUNWAY NIGHT", Icon = "💃", Desc = "Runway Aura x4", Duration = 90, RunwayMult = 4, Tint = C(235, 215, 255) },
}
Config.EventById = {}
for _, e in Config.Events do
	Config.EventById[e.Id] = e
end

--------------------------------------------------------------------------------
-- Audio (sounds that ship with Roblox; swap any for an asset id from the Creator Store)
--------------------------------------------------------------------------------
Config.Sounds = {
	Tone = "rbxasset://sounds/electronicpingshort.wav",
	Bass = "rbxasset://sounds/bass.wav",
	Click = "rbxasset://sounds/button.wav",
	Flash = "rbxasset://sounds/flashbulb.wav",
}
Config.MusicTrackId = "" -- optional looping song id; empty = generative ambient music
Config.MusicVolume = 0.28
Config.SfxVolume = 0.8

return Config

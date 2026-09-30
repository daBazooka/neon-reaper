--!strict
-- CATCH A DREAMLING! game data. Pure data only (no Roblox types) so it can be unit tested.
-- Colours are {r, g, b} 0-255.

local Config = {}

-- Put your Roblox IDs here after creating them on the Creator Hub.
-- Anything left at 0 is hidden from the in-game store.
Config.GamePasses = {
	DoubleSparkles = 0, -- 2x Sparkles forever
	VIP = 0,            -- +1 bag slot, golden name tag, +10% luck
	AutoCollect = 0,    -- Sparkles go straight to your balance
	SuperLuck = 0,      -- +50% mutation luck
}
Config.Products = {
	LuckPotion = 0,     -- 10 minutes of x2 luck
	SparklePack = 0,    -- 30 minutes of income, instantly
	SummonStarfall = 0, -- starts a Starfall event for the whole server
}

export type Rarity = { id: string, name: string, color: {number}, weight: number, catchTime: number, income: number, order: number }
Config.Rarities = {
	{ id = "C", name = "Common",    color = {190, 210, 230}, weight = 60,    catchTime = 0.6, income = 1,     order = 1 },
	{ id = "U", name = "Uncommon",  color = {110, 235, 130}, weight = 26,    catchTime = 1.0, income = 5,     order = 2 },
	{ id = "R", name = "Rare",      color = {80, 170, 255},  weight = 10,    catchTime = 1.6, income = 18,    order = 3 },
	{ id = "E", name = "Epic",      color = {190, 110, 255}, weight = 3.2,   catchTime = 2.4, income = 70,    order = 4 },
	{ id = "L", name = "Legendary", color = {255, 205, 60},  weight = 0.7,   catchTime = 3.5, income = 320,   order = 5 },
	{ id = "M", name = "Mythic",    color = {255, 70, 120},  weight = 0.09,  catchTime = 5.0, income = 1800,  order = 6 },
	{ id = "S", name = "Secret",    color = {255, 255, 255}, weight = 0.012, catchTime = 7.0, income = 12000, order = 7 },
} :: {Rarity}
Config.RarityById = {} :: {[string]: Rarity}
for _, r in Config.Rarities do Config.RarityById[r.id] = r end

-- feature: extra body parts the builder adds. size: body diameter in studs.
export type Species = { id: string, name: string, rarity: string, col: {number}, col2: {number}, feat: string, size: number, mult: number, lore: string }
Config.Species = {
	{ id = "puffle",   name = "Puffle",       rarity = "C", col = {120, 200, 255}, col2 = {60, 120, 230},  feat = "none",    size = 3,   mult = 1,   lore = "Just a happy little puff." },
	{ id = "mossy",    name = "Mossy",        rarity = "C", col = {130, 220, 120}, col2 = {60, 150, 70},   feat = "leaf",    size = 3,   mult = 1.2, lore = "Grows a leaf when it's proud." },
	{ id = "pebble",   name = "Pebble",       rarity = "C", col = {190, 185, 200}, col2 = {120, 115, 140}, feat = "square",  size = 2.8, mult = 1.4, lore = "Pretends to be a rock. Badly." },
	{ id = "blip",     name = "Blip",         rarity = "C", col = {110, 245, 235}, col2 = {40, 170, 190},  feat = "antenna", size = 2.6, mult = 1.6, lore = "Receives radio from the Moon." },
	{ id = "bunbun",   name = "Bunbun",       rarity = "U", col = {255, 180, 225}, col2 = {240, 100, 170}, feat = "bunny",   size = 3.2, mult = 1,   lore = "Hops in its sleep." },
	{ id = "zappy",    name = "Zappy",        rarity = "U", col = {255, 230, 90},  col2 = {255, 150, 40},  feat = "antenna", size = 3,   mult = 1.2, lore = "Tastes like lemonade lightning." },
	{ id = "leafy",    name = "Leafy",        rarity = "U", col = {170, 255, 120}, col2 = {70, 190, 80},   feat = "sprout",  size = 3.2, mult = 1.4, lore = "Photosynthesises dreams." },
	{ id = "bubbles",  name = "Bubbles",      rarity = "U", col = {150, 235, 255}, col2 = {70, 170, 230},  feat = "drip",    size = 3.4, mult = 1.6, lore = "Pops when surprised. Unpops later." },
	{ id = "frostbite",name = "Frostbite",    rarity = "R", col = {200, 245, 255}, col2 = {110, 190, 255}, feat = "spikes",  size = 3.4, mult = 1,   lore = "Cold hands, warm heart." },
	{ id = "emberkit", name = "Emberkit",     rarity = "R", col = {255, 150, 80},  col2 = {230, 60, 40},   feat = "horns",   size = 3.4, mult = 1.2, lore = "Toasts marshmallows by blinking." },
	{ id = "moonpaw",  name = "Moonpaw",      rarity = "R", col = {180, 140, 255}, col2 = {110, 70, 230},  feat = "cat",     size = 3.4, mult = 1.4, lore = "Only comes out when you blink." },
	{ id = "jellyfizz",name = "Jellyfizz",    rarity = "R", col = {255, 130, 200}, col2 = {200, 60, 160},  feat = "drip",    size = 3.6, mult = 1.6, lore = "Fizzy. Wobbly. Proud of it." },
	{ id = "cloudwhal",name = "Cloud Whale",  rarity = "E", col = {245, 248, 255}, col2 = {170, 185, 230}, feat = "cloud",   size = 4.2, mult = 1,   lore = "Sings to thunderstorms." },
	{ id = "prismo",   name = "Prismo",       rarity = "E", col = {140, 255, 240}, col2 = {90, 140, 255},  feat = "square",  size = 3.8, mult = 1.2, lore = "Made of solid rainbows." },
	{ id = "sirhoot",  name = "Sir Hoot",     rarity = "E", col = {210, 160, 110}, col2 = {140, 90, 60},   feat = "horns",   size = 3.8, mult = 1.4, lore = "Knows every answer. Tells none." },
	{ id = "neonbat",  name = "Neon Bat",     rarity = "E", col = {120, 90, 255},  col2 = {255, 60, 200},  feat = "wings",   size = 3.4, mult = 1.6, lore = "Upside down is its right side up." },
	{ id = "starwhale",name = "Starwhale",    rarity = "L", col = {60, 80, 200},   col2 = {20, 30, 90},    feat = "halo",    size = 5,   mult = 1,   lore = "Swims through the night sky." },
	{ id = "sunking",  name = "Sun King",     rarity = "L", col = {255, 220, 90},  col2 = {255, 140, 40},  feat = "crown",   size = 4.6, mult = 1.2, lore = "Rules the morning. Naps at noon." },
	{ id = "aurorafox",name = "Aurora Fox",   rarity = "L", col = {110, 255, 190}, col2 = {160, 90, 255},  feat = "cat",     size = 4.4, mult = 1.4, lore = "Its tail paints the northern lights." },
	{ id = "dreamdrake",name = "Dream Drake", rarity = "L", col = {255, 120, 150}, col2 = {140, 40, 120},  feat = "wings",   size = 4.8, mult = 1.6, lore = "Breathes bedtime stories." },
	{ id = "voidling", name = "Voidling",     rarity = "M", col = {40, 20, 70},    col2 = {170, 60, 255},  feat = "spikes",  size = 4.6, mult = 1,   lore = "Lives in the space between dreams." },
	{ id = "cosmojelly",name = "Cosmo Jelly", rarity = "M", col = {255, 90, 220},  col2 = {60, 200, 255},  feat = "drip",    size = 5,   mult = 1.3, lore = "Contains a small galaxy. Do not squeeze." },
	{ id = "kaleido",  name = "KALEIDO",      rarity = "S", col = {255, 255, 255}, col2 = {255, 90, 200},  feat = "crown",   size = 5.4, mult = 1,   lore = "Every second, it changes." },
	{ id = "dreamer",  name = "The Dreamer",  rarity = "S", col = {255, 250, 235}, col2 = {255, 210, 120}, feat = "halo",    size = 5.6, mult = 1.4, lore = "Some say it is dreaming all of us." },
} :: {Species}
Config.SpeciesById = {} :: {[string]: Species}
for _, s in Config.Species do Config.SpeciesById[s.id] = s end

export type Mutation = { id: string, name: string, mult: number, chance: number, color: {number}? }
-- chance: per spawn (before events and luck). Giant and Tiny also change size.
Config.Mutations = {
	{ id = "golden",  name = "Golden",  mult = 3,   chance = 0.03,  color = {255, 200, 50} },
	{ id = "rainbow", name = "Rainbow", mult = 6,   chance = 0.01 },
	{ id = "disco",   name = "Disco",   mult = 4,   chance = 0.0 },
	{ id = "galaxy",  name = "Galaxy",  mult = 10,  chance = 0.003, color = {30, 20, 70} },
	{ id = "giant",   name = "Giant",   mult = 2,   chance = 0.02 },
	{ id = "tiny",    name = "Tiny",    mult = 1.5, chance = 0.02 },
} :: {Mutation}
Config.MutationById = {} :: {[string]: Mutation}
for _, m in Config.Mutations do Config.MutationById[m.id] = m end

-- Upgrades bought with Sparkles: cost = base * k ^ level
export type Upgrade = { id: string, name: string, desc: string, base: number, k: number, max: number }
Config.Upgrades = {
	{ id = "netSpeed", name = "Faster Net",   desc = "Catch 13% faster per level",     base = 60,   k = 2.35, max = 12 },
	{ id = "reach",    name = "Longer Net",   desc = "+3 studs catch reach",           base = 90,   k = 2.3, max = 8 },
	{ id = "speed",    name = "Dream Boots",  desc = "+2 walk speed",                  base = 80,   k = 2.2, max = 8 },
	{ id = "bag",      name = "Bigger Bag",   desc = "Carry +1 dreamling at once",     base = 900,  k = 9,   max = 4 },
	{ id = "luck",     name = "Lucky Charm",  desc = "+20% mutation luck when you catch", base = 400, k = 2.5, max = 10 },
} :: {Upgrade}
Config.UpgradeById = {} :: {[string]: Upgrade}
for _, u in Config.Upgrades do Config.UpgradeById[u.id] = u end

Config.StartSlots = 4
Config.MaxSlots = 16
Config.SlotBase = 150
Config.SlotK = 2.6
Config.MaxStar = 5
Config.StarMult = 3            -- each merge star multiplies income by 3
Config.RebirthBase = 1500000
Config.RebirthK = 7
Config.RebirthBonus = 0.5      -- +50% income per rebirth
Config.OfflineRate = 0.5       -- offline earnings at half speed
Config.OfflineCapHours = 8
Config.SellSeconds = 45        -- selling a dreamling pays 45 seconds of its income

-- World and pacing
Config.MaxDreamlings = 22
Config.SpawnEvery = 2.4
Config.DreamlingLife = 95
Config.MeadowRadius = 115
Config.PlotRadius = 205
Config.PlotCount = 8
Config.BaseReach = 12
Config.BaseWalk = 18
Config.EventInterval = 200
Config.EventDuration = 60

-- Server-wide dream events. Effects are applied by the server (world) and the client (visuals).
export type DreamEvent = { id: string, name: string, desc: string, weight: number, color: {number} }
Config.Events = {
	{ id = "disco",   name = "DISCO NIGHT",      desc = "Half of all dreamlings spawn Disco (x4)!", weight = 10, color = {255, 90, 220} },
	{ id = "lowgrav", name = "LOW GRAVITY",      desc = "Jump to the moon!",                        weight = 10, color = {140, 200, 255} },
	{ id = "starfall",name = "STARFALL",         desc = "Legendaries fall from the sky!",           weight = 7,  color = {255, 220, 90} },
	{ id = "golden",  name = "GOLDEN HOUR",      desc = "Golden mutations x8 more likely!",         weight = 10, color = {255, 180, 60} },
	{ id = "candy",   name = "CANDY RAIN",       desc = "Grab the falling candy for Sparkles!",     weight = 10, color = {255, 150, 200} },
	{ id = "giant",   name = "GIANT DREAMLINGS", desc = "Every dreamling spawns Giant (x2)!",       weight = 8,  color = {120, 255, 160} },
	{ id = "speed",   name = "SPEED SURGE",      desc = "Everyone runs twice as fast!",             weight = 9,  color = {255, 110, 90} },
	{ id = "rainbow", name = "RAINBOW STORM",    desc = "Rainbow mutations x15 more likely!",       weight = 7,  color = {190, 120, 255} },
	{ id = "secret",  name = "SECRET HOUR",      desc = "Something strange is watching...",         weight = 2,  color = {30, 20, 60} },
} :: {DreamEvent}
Config.EventById = {} :: {[string]: DreamEvent}
for _, e in Config.Events do Config.EventById[e.id] = e end

-- Daily login rewards: multiples of your income per second (so they stay useful), plus potions.
Config.Daily = {
	{ incomeSecs = 120, min = 100 }, { incomeSecs = 180, min = 200 }, { incomeSecs = 240, min = 400, luckMin = 5 },
	{ incomeSecs = 300, min = 800 }, { incomeSecs = 420, min = 1500 }, { incomeSecs = 600, min = 3000, luckMin = 10 },
	{ incomeSecs = 1200, min = 10000, luckMin = 30 },
}

export type QuestType = { t: string, text: string, n: {number} }
Config.QuestTypes = {
	{ t = "catch",   text = "Catch %d dreamlings",             n = {8, 15, 25} },
	{ t = "rare",    text = "Catch %d Rare or better",         n = {1, 3, 5} },
	{ t = "mutated", text = "Catch %d mutated dreamlings",     n = {1, 2, 3} },
	{ t = "collect", text = "Collect Sparkles %d times",       n = {5, 10, 20} },
	{ t = "merge",   text = "Merge dreamlings %d times",       n = {1, 2, 3} },
	{ t = "event",   text = "Catch %d during a Dream Event",   n = {3, 6, 10} },
	{ t = "upgrade", text = "Buy %d upgrades",                 n = {2, 4, 6} },
} :: {QuestType}

return Config

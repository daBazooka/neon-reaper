-- SUB 5 TO TRUE ADAM: every number, name and table the game balances on lives here.
local Config = {}
local C3 = Color3.fromRGB
local C = C3

Config.GameName = "Sub 5 to True Adam"
Config.HammerRowZ = 118 -- the pedestal row you see when you spawn
Config.PlazaRadius = 150

-- Where the buildings stand (angle in degrees around the plaza, at StationRadius from the centre).
Config.StationRadius = 95
Config.Stations = { Gym = 40, Studio = 112, Lounge = 184, Crates = 256, Ring = 328 }
function Config.StationPos(name)
	local a = math.rad(Config.Stations[name])
	return Vector3.new(math.cos(a) * Config.StationRadius, 0, math.sin(a) * Config.StationRadius)
end
-- Unit vector from the station toward the plaza centre (the open side, where the camera sits).
function Config.StationFront(name)
	local a = math.rad(Config.Stations[name])
	return Vector3.new(-math.cos(a), 0, -math.sin(a))
end

--------------------------------------------------------------------------------
-- Levels (1 to 1250) and the looks tiers they unlock
--------------------------------------------------------------------------------
Config.MaxLevel = 1250

-- The looks ladder, in order. Each entry: display name, level it starts at, colour.
local TIERS = {
	{ "Sub 5", 1, C3(214, 170, 130) },
	{ "Sub 3", 5, C3(196, 140, 108) },
	{ "Sub Human", 10, C3(170, 122, 100) },
	{ "LTN", 16, C3(132, 196, 110) },
	{ "L-LTN", 24, C3(118, 204, 120) },
	{ "M-LTN", 33, C3(104, 212, 134) },
	{ "MTN", 43, C3(80, 200, 210) },
	{ "L-MTN", 55, C3(70, 186, 230) },
	{ "M-MTN", 70, C3(64, 170, 245) },
	{ "H-MTN", 88, C3(70, 150, 255) },
	{ "L-HTN", 110, C3(100, 130, 255) },
	{ "M-HTN", 135, C3(120, 112, 255) },
	{ "H-HTN", 165, C3(140, 96, 255) },
	{ "L-Chadlite", 200, C3(170, 100, 255) },
	{ "M-Chadlite", 240, C3(190, 96, 245) },
	{ "H-Chadlite", 285, C3(210, 92, 230) },
	{ "L-Chad", 335, C3(255, 170, 70) },
	{ "M-Chad", 390, C3(255, 150, 60) },
	{ "H-Chad", 450, C3(255, 130, 50) },
	{ "Chad", 520, C3(255, 110, 40) },
	{ "L-Adamlite", 600, C3(255, 110, 150) },
	{ "M-Adamlite", 680, C3(255, 90, 140) },
	{ "H-Adamlite", 760, C3(255, 70, 130) },
	{ "L-Adam", 830, C3(255, 200, 70) },
	{ "M-Adam", 890, C3(255, 214, 80) },
	{ "H-Adam", 945, C3(255, 228, 100) },
	{ "True Adam", 1000, C3(255, 240, 150) },
	{ "True Adam+", 1100, C3(190, 250, 255) },
}

Config.Ranks = {}
for _, t in TIERS do
	table.insert(Config.Ranks, { Name = t[1], Full = t[1], Level = t[2], Color = t[3] })
end

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

-- Body shape by level. Level 1 is a short, very wide, big-headed gag character; it changes
-- fastest early on and settles into a tall, athletic look around level 1000.
local APPEARANCE_START = { BodyHeightScale = 0.78, BodyWidthScale = 1.9, BodyDepthScale = 1.75, HeadScale = 1.35, BodyTypeScale = 0, BodyProportionScale = 0 }
local APPEARANCE_END = { BodyHeightScale = 1.12, BodyWidthScale = 0.92, BodyDepthScale = 0.95, HeadScale = 0.95, BodyTypeScale = 0.3, BodyProportionScale = 0.3 }
function Config.AppearanceScales(level)
	-- Half of the whole transformation happens in the first 50 levels (a visible step every level).
	local L = math.clamp(level, 1, 1000)
	local t
	if L <= 50 then
		t = 0.5 * ((L - 1) / 49) ^ 0.85
	else
		t = 0.5 + 0.5 * ((L - 50) / 950) ^ 0.6
	end
	local out = {}
	for key, from in APPEARANCE_START do
		out[key] = from + (APPEARANCE_END[key] - from) * t
	end
	return out
end

-- How "weird" a character is (goofy face, hairy, big belly): 1 at level 1, gone by level ~600.
-- 1 = full gag (hair everywhere, goofy face), 0 = gone. Drops fast early so every level looks different.
function Config.Weirdness(level)
	if level <= 100 then
		return 1 - (level - 1) * 0.0075
	end
	return math.clamp(0.2575 * (1 - (level - 100) / 300), 0, 1)
end

-- Skin goes from a sickly pale tone to a healthy glowing tan as you level.
local SKIN_START, SKIN_END = C3(196, 204, 168), C3(236, 186, 140)
function Config.SkinTone(level)
	local t = math.clamp((level - 1) / 400, 0, 1) ^ 0.7
	return SKIN_START:Lerp(SKIN_END, t)
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
	return 1 + rebirths * 0.5
end
-- Level needed to rebirth (rebirth keeps your level and hammers, resets Aura/stats/upgrades).
function Config.RebirthRequirement(rebirths)
	return 20 + 15 * rebirths
end

--------------------------------------------------------------------------------
-- Hammers: click / tap to swing one at your own face. Better hammer = bigger multiplier.
--------------------------------------------------------------------------------
Config.Hammers = {
	{ Id = 1, Name = "Basic Hammer", Mult = 1, Price = 0, Handle = C(150, 105, 62), Head = C(120, 120, 128), Style = "block", Material = "Metal" },
	{ Id = 2, Name = "Stone Hammer", Mult = 2, Price = 50, Handle = C(150, 105, 62), Head = C(140, 140, 146), Style = "block", Material = "Slate" },
	{ Id = 3, Name = "Iron Hammer", Mult = 4, Price = 400, Handle = C(120, 85, 55), Head = C(80, 84, 96), Style = "block", Material = "Metal" },
	{ Id = 4, Name = "Golden Hammer", Mult = 8, Price = 3500, Handle = C(120, 85, 55), Head = C(255, 202, 50), Style = "block", Material = "Metal" },
	{ Id = 5, Name = "Diamond Hammer", Mult = 16, Price = 30000, Handle = C(70, 90, 120), Head = C(130, 225, 255), Style = "block", Material = "Glass" },
	{ Id = 6, Name = "Mewing Mallet", Mult = 32, Price = 250000, Handle = C(60, 60, 70), Head = C(255, 130, 70), Style = "mallet", Material = "SmoothPlastic" },
	{ Id = 7, Name = "Chad Chisel", Mult = 64, Price = 2000000, Handle = C(60, 60, 70), Head = C(200, 210, 230), Style = "chisel", Material = "Metal" },
	{ Id = 8, Name = "Jawline Hammer", Mult = 128, Price = 16000000, Handle = C(50, 40, 50), Head = C(235, 70, 130), Style = "spiked", Material = "Metal" },
	{ Id = 9, Name = "Sculptor Hammer", Mult = 256, Price = 120000000, Handle = C(240, 240, 245), Head = C(120, 150, 255), Style = "mallet", Material = "Marble" },
	{ Id = 10, Name = "True Adam Hammer", Mult = 512, Price = 1000000000, Handle = C(255, 235, 150), Head = C(255, 244, 190), Style = "spiked", Material = "Metal" },
}
Config.HammerById = {}
for _, h in Config.Hammers do
	Config.HammerById[h.Id] = h
end
function Config.HammerPos(id)
	return Vector3.new((id - 5.5) * 10.5, 0, Config.HammerRowZ)
end
Config.SwingInterval = 0.13 -- fastest allowed swing rate (seconds)

-- Base Aura per swing before the hammer, rebirth and event multipliers.
function Config.SwingBase(level)
	return 1 + (level or 1) * 0.04
end

--------------------------------------------------------------------------------
-- Pets: hatch eggs, equip up to 3. Each pet adds to your Aura multiplier and earns Aura per second.
--------------------------------------------------------------------------------
Config.PetSlots = 3
Config.Pets = {
	{ Id = "cat", Name = "Tabby Cat", Species = "cat", Icon = "🐱", Rarity = "Common", Mult = 0.2, Aps = 1, Color = C(240, 190, 120) },
	{ Id = "pup", Name = "Golden Retriever", Species = "pup", Icon = "🐶", Rarity = "Common", Mult = 0.25, Aps = 1, Color = C(200, 160, 110) },
	{ Id = "mouse", Name = "Field Mouse", Species = "mouse", Icon = "🐭", Rarity = "Common", Mult = 0.3, Aps = 2, Color = C(200, 205, 215) },
	{ Id = "gorilla", Name = "Silverback Gorilla", Species = "gorilla", Icon = "🦍", Rarity = "Rare", Mult = 0.6, Aps = 5, Color = C(80, 80, 95) },
	{ Id = "owl", Name = "Horned Owl", Species = "owl", Icon = "🦉", Rarity = "Rare", Mult = 0.7, Aps = 6, Color = C(150, 110, 80) },
	{ Id = "shark", Name = "Great White Shark", Species = "shark", Icon = "🦈", Rarity = "Rare", Mult = 0.8, Aps = 8, Color = C(90, 150, 220) },
	{ Id = "wolf", Name = "Timber Wolf", Species = "wolf", Icon = "🐺", Rarity = "Epic", Mult = 1.5, Aps = 20, Color = C(120, 130, 160) },
	{ Id = "fox", Name = "Red Fox", Species = "fox", Icon = "🦊", Rarity = "Epic", Mult = 1.8, Aps = 25, Color = C(255, 140, 60) },
	{ Id = "bull", Name = "Raging Bull", Species = "bull", Icon = "🐂", Rarity = "Epic", Mult = 2.0, Aps = 30, Color = C(170, 60, 60) },
	{ Id = "lion", Name = "African Lion", Species = "lion", Icon = "🦁", Rarity = "Legendary", Mult = 4, Aps = 80, Color = C(255, 190, 60) },
	{ Id = "dragon", Name = "Emerald Dragon", Species = "dragon", Icon = "🐉", Rarity = "Legendary", Mult = 5, Aps = 100, Color = C(120, 220, 140) },
	{ Id = "angel", Name = "True Adam Pegasus", Species = "pegasus", Icon = "🦄", Rarity = "Mythic", Mult = 10, Aps = 300, Color = C(255, 244, 200) },
	{ Id = "phoenix", Name = "Fire Phoenix", Species = "phoenix", Icon = "🔥", Rarity = "Mythic", Mult = 12, Aps = 400, Color = C(255, 90, 170) },
}
Config.PetById = {}
for _, pet in Config.Pets do
	Config.PetById[pet.Id] = pet
end
Config.Eggs = {
	{ Id = "basic", Name = "Basic Egg", Cost = 500, Color = C(240, 230, 210), Odds = { Common = 70, Rare = 25, Epic = 5 } },
	{ Id = "gold", Name = "Golden Egg", Cost = 20000, Color = C(255, 205, 60), Odds = { Rare = 50, Epic = 35, Legendary = 14, Mythic = 1 } },
	{ Id = "mog", Name = "Mog Egg", Cost = 600000, Color = C(255, 90, 170), Odds = { Epic = 50, Legendary = 40, Mythic = 10 } },
}
Config.EggById = {}
for _, egg in Config.Eggs do
	Config.EggById[egg.Id] = egg
end
-- Each extra copy of a pet (up to 5 stars) makes it 25% stronger.
function Config.PetStars(copies)
	return math.clamp(copies or 1, 1, 5)
end
function Config.PetMult(pet, copies)
	return pet.Mult * (1 + 0.25 * (Config.PetStars(copies) - 1))
end
function Config.PetAps(pet, copies)
	return pet.Aps * (1 + 0.25 * (Config.PetStars(copies) - 1))
end

--------------------------------------------------------------------------------
-- Retention mechanics: crits, the Mog Streak (frenzy) and play-time gifts
--------------------------------------------------------------------------------
Config.Crit = { Chance = 0.07, Mult = 5, JackpotChance = 0.005, JackpotMult = 25 }
-- Swing again within `Window` seconds to keep the streak alive. Reach `Combo` swings for FRENZY.
Config.Frenzy = { Combo = 30, Window = 0.7, Duration = 8, Mult = 2 }
-- Gifts that arrive automatically while you stay in the server (seconds online, size, crates).
Config.Gifts = {
	{ Time = 60, Size = 1, Crates = 0 },
	{ Time = 180, Size = 3, Crates = 0 },
	{ Time = 300, Size = 6, Crates = 1 },
	{ Time = 600, Size = 12, Crates = 0 },
	{ Time = 900, Size = 20, Crates = 1 },
	{ Time = 1500, Size = 40, Crates = 2 },
	{ Time = 2400, Size = 80, Crates = 3 },
}
function Config.GiftAura(level, size)
	return math.floor(size * 40 * (1 + level * 0.3))
end

--------------------------------------------------------------------------------
-- Stage battles: beat 15 opponents in a row, each tougher than the last (a tap battle like the duel ring)
--------------------------------------------------------------------------------
Config.BattleAngle, Config.BattleRadius = 4, 108
function Config.BattlePos()
	local a = math.rad(Config.BattleAngle)
	return Vector3.new(math.cos(a) * Config.BattleRadius, 0, math.sin(a) * Config.BattleRadius)
end
function Config.BattleFront()
	local p = Config.BattlePos()
	return Vector3.new(-p.X, 0, -p.Z).Unit
end
local STAGE_NAMES = {
	"Sub 5 Steve", "Bacon Hair Ben", "Gym Bro Greg", "Mewing Mike", "Sigma Sam",
	"Rizz Ron", "Jawline Jack", "Chad Chris", "Hunter Eyes Hank", "Mogger Max",
	"Chadlite Carl", "Alpha Alex", "Adamlite Andy", "Adam Anthony", "True Adam",
}
Config.Battle = { Stages = {}, Count = #STAGE_NAMES }
for i, name in STAGE_NAMES do
	Config.Battle.Stages[i] = {
		Index = i,
		Name = name,
		Power = math.floor(25 * 1.55 ^ (i - 1)), -- compared with your Mog Power
		Rate = 4 + i * 0.45, -- taps per second the opponent manages
		Rank = math.min(#Config.Ranks, 1 + math.floor((i - 1) * 1.9)),
		Reward = math.floor(150 * 1.85 ^ (i - 1)),
		Color = Color3.fromHSV((i * 0.067) % 1, 0.45, 0.85),
	}
end

--------------------------------------------------------------------------------
-- Voice lines. Plays with Roblox's text-to-speech (deep and slow). To use your own recorded voice,
-- upload audio you own and paste the ids into VoiceSoundIds (e.g. VoiceSoundIds.levelup = 1234567890).
--------------------------------------------------------------------------------
-- Shifter < 1 drops the voice an octave-ish; Bass boosts the low end (dB); Volume is loudness.
Config.Voice = { VoiceId = "3", Pitch = 0.8, Speed = 0.8, Shifter = 0.7, Bass = 12, Treble = -12, Volume = 2.2 }
Config.VoiceSoundIds = { ["3"] = 0, ["2"] = 0, ["1"] = 0, go = 0, levelup = 0, rebirth = 0, stage = 0, win = 0, welcome = 0, unlock = 0, nice = 0, done = 0 }
Config.VoiceText = {
	["3"] = "Three!", ["2"] = "Two!", ["1"] = "One!", go = "Go!",
	levelup = "Level up!", rebirth = "Rebirth ready!", stage = "Stage cleared!", win = "Mogged!",
	welcome = "Welcome! Let us make you a Chad.", unlock = "Unlocked!", nice = "Nice!", done = "Training complete. Now go mog them all!",
}

--------------------------------------------------------------------------------
-- First-time tutorial (5 short steps, skippable)
--------------------------------------------------------------------------------
Config.Tutorial = {
	{ Title = "Swing your hammer", Text = "Click or tap anywhere to hit yourself. Every hit earns Aura.", Goal = 10 },
	{ Title = "Buy the Stone Hammer", Text = "Walk to the glowing Stone Hammer and press the big button at the bottom. Bigger hammer, more Aura per swing.", Gift = 60 },
	{ Title = "Train on a platform", Text = "Walk onto the Gym platform, press the big button, then hit SPACE (or tap) when the marker is in the green.", Goal = 3 },
	{ Title = "Hatch a pet", Text = "Press the 🐾 Pets button on the right and hatch a Basic Egg. Pets boost your Aura.", Gift = 500 },
	{ Title = "Fight Stage 1", Text = "Press the ⚔️ Battle button. Press the big button to unlock the arena (free gift), press it again to fight, and tap fast!", Gift = 2600 },
}
Config.TutorialReward = { Aura = 1000, Crates = 2 }

--------------------------------------------------------------------------------
-- Buildings: each one must be unlocked with Aura. Every building has its own colours, smoke and aura.
--------------------------------------------------------------------------------
Config.Buildings = {
	gym = { Name = "Gym", Cost = 0, Main = C(210, 55, 50), Glow = C(255, 130, 40), Aura = "Raw power" },
	battle = { Name = "Stage Battle Arena", Cost = 2500, Main = C(70, 110, 230), Glow = C(120, 170, 255), Aura = "Fight 15 stages" },
	studio = { Name = "Style Studio", Cost = 4000, Main = C(235, 90, 185), Glow = C(255, 140, 225), Aura = "Style" },
	stage = { Name = "Mog Stage", Cost = 15000, Main = C(140, 80, 230), Glow = C(195, 140, 255), Aura = "Competitions" },
	lounge = { Name = "Charm Lounge", Cost = 30000, Main = C(40, 185, 200), Glow = C(100, 245, 235), Aura = "Charm" },
	ring = { Name = "Duel Ring", Cost = 75000, Main = C(230, 50, 70), Glow = C(255, 90, 90), Aura = "PvP duels" },
	crates = { Name = "Crate Shop", Cost = 120000, Main = C(245, 185, 40), Glow = C(255, 215, 100), Aura = "Loot" },
	treadmills = { Name = "Treadmill Hall", Cost = 0, Main = C(90, 215, 95), Glow = C(160, 255, 130), Aura = "Passive Aura" },
}
Config.BuildingOrder = { "gym", "battle", "studio", "stage", "lounge", "ring", "crates", "treadmills" }
function Config.BuildingOwned(profileBuildings, id)
	local b = Config.Buildings[id]
	return b ~= nil and (b.Cost == 0 or (profileBuildings ~= nil and profileBuildings[id] == true))
end
-- Which building each interactable belongs to.
Config.BuildingPos = {
	gym = function() return Config.StationPos("Gym") end,
	studio = function() return Config.StationPos("Studio") end,
	lounge = function() return Config.StationPos("Lounge") end,
	crates = function() return Config.StationPos("Crates") end,
	ring = function() return Config.StationPos("Ring") end,
	battle = function() return Config.BattlePos() end,
	stage = function() return Vector3.new(0, 0, 0) end,
	treadmills = function() return Config.TreadHallPos() end,
}

--------------------------------------------------------------------------------
-- Treadmills: stand on one and run to earn Aura every second. Better ones cost more Aura to unlock.
--------------------------------------------------------------------------------
-- The hall stands on the grass just outside the plaza (there is no room for it between the other buildings).
Config.TreadHallAngle, Config.TreadHallRadius = 150, 215
function Config.TreadHallPos()
	local a = math.rad(Config.TreadHallAngle)
	return Vector3.new(math.cos(a) * Config.TreadHallRadius, 0, math.sin(a) * Config.TreadHallRadius)
end
function Config.TreadHallCF()
	local pos = Config.TreadHallPos()
	return CFrame.lookAt(pos, Vector3.new(0, 0, 0))
end
Config.Treadmills = {}
do
	local names = {
		"Starter", "Jogger", "Sprinter", "Athlete", "Champion", "Titan", "Legend", "Mythic", "Divine", "True Adam",
		"Chad", "Alpha", "Sigma", "Giga", "Ultra", "Cosmic", "Galactic", "Eternal", "Omega", "Infinity",
	}
	local prices = { 0, 400, 4000, 35000, 300000, 2500000, 22000000, 190000000, 1600000000, 14000000000 }
	local rates = { 2, 8, 30, 110, 400, 1500, 6000, 24000, 100000, 450000 }
	for i = 11, 20 do
		prices[i] = prices[i - 1] * 8.5
		rates[i] = rates[i - 1] * 4
	end
	local colors = {
		C(150, 160, 175), C(80, 200, 120), C(70, 150, 240), C(170, 90, 240), C(255, 90, 170),
		C(255, 150, 50), C(255, 220, 60), C(60, 235, 220), C(255, 80, 80), C(255, 244, 190),
		C(120, 255, 90), C(255, 60, 120), C(90, 90, 255), C(255, 190, 255), C(40, 255, 190),
		C(150, 60, 255), C(255, 120, 20), C(255, 255, 255), C(255, 60, 60), C(255, 255, 255),
	}
	for i = 1, #names do
		Config.Treadmills[i] = {
			Id = i,
			Name = names[i] .. " Treadmill",
			Price = math.floor(prices[i]),
			Rate = math.floor(rates[i]),
			Color = colors[i],
			Rainbow = i >= 18, -- the last three cycle through every colour
			Effect = i <= 3 and "dust" or (i <= 6 and "sparks" or (i <= 10 and "flames" or "storm")),
		}
	end
end
Config.TreadRadius = 4.5
Config.TreadSpacing = 5.6
Config.TreadRows = { -9, 15 } -- local Z of the two rows of 10
-- Local position of treadmill i inside the hall (x, z).
function Config.TreadLocal(i)
	local row = i <= 10 and 1 or 2
	local col = ((i - 1) % 10) + 1
	return (col - 5.5) * Config.TreadSpacing, Config.TreadRows[row]
end
function Config.TreadCF(i)
	local x, z = Config.TreadLocal(i)
	return Config.TreadHallCF() * CFrame.new(x, 0.8, z)
end
function Config.TreadPos(i)
	return Config.TreadCF(i).Position
end
-- Running builds "heat": +5% Aura per second of running, up to this many seconds.
Config.RunHeatMax = 20
function Config.RunHeatMult(heat)
	return 1 + math.min(heat, Config.RunHeatMax) * 0.05
end

--------------------------------------------------------------------------------
-- Store (real Robux). Create the passes / products on create.roblox.com and paste their ids here.
-- An id of 0 means "not set up yet" and the offer is shown as coming soon.
--------------------------------------------------------------------------------
Config.Store = {
	Passes = {
		{ Id = "x2aura", Name = "2x Aura", Desc = "Doubles all Aura you earn, forever.", PassId = 0 },
		{ Id = "x2xp", Name = "2x XP", Desc = "Level up twice as fast, forever.", PassId = 0 },
		{ Id = "vip", Name = "VIP", Desc = "Gold VIP tag, +25% Aura and a free crate every day.", PassId = 0 },
	},
	Products = {
		{ Id = "aura_s", Name = "Aura Pack S", Size = 20, ProductId = 0 },
		{ Id = "aura_m", Name = "Aura Pack M", Size = 120, ProductId = 0 },
		{ Id = "aura_l", Name = "Aura Pack L", Size = 800, ProductId = 0 },
	},
}
function Config.ProductAura(level, size)
	return math.floor(size * 40 * (1 + level * 0.3))
end

--------------------------------------------------------------------------------
-- Things you can interact with (press E, or tap the on-screen button). These work from any camera
-- angle because they use the character's position, not the camera.
--------------------------------------------------------------------------------
Config.HammerRadius = 8
Config.Interactables = {
	{ Id = "Gym", Object = "Gym", Action = "Train Power", Pos = "station:Gym", Radius = 17, Building = "gym" },
	{ Id = "Studio", Object = "Style Studio", Action = "Train Style", Pos = "station:Studio", Radius = 17, Building = "studio" },
	{ Id = "Lounge", Object = "Charm Lounge", Action = "Train Charm", Pos = "station:Lounge", Radius = 17, Building = "lounge" },
	{ Id = "Crates", Object = "Crate Shop", Action = "Open crates", Pos = "station:Crates", Radius = 16, Building = "crates" },
	{ Id = "Ring", Object = "Duel Ring", Action = "Find a duel", Pos = "station:Ring", Radius = 24, Building = "ring" },
	{ Id = "Bot", Object = "Mogger Bot", Action = "Duel the bot", Pos = "bot", Radius = 9, Building = "ring" },
	{ Id = "Battle", Object = "Stage Battle", Action = "Stage battle", Pos = "battle", Radius = 34, Building = "battle" },
	{ Id = "Stage", Object = "Mog Stage", Action = "Enter competition", Pos = "stage", Radius = 24, Building = "stage" },
}
-- Resolves an interactable's world position (shared by the client and the server).
function Config.InteractPos(entry)
	local kind, arg = string.match(entry.Pos, "^(%w+):(.*)$")
	if kind == "station" then
		return Config.StationPos(arg)
	elseif entry.Pos == "battle" then
		return Config.BattlePos()
	elseif entry.Pos == "bot" then
		-- the training dummy stands beside the duel ring
		local ring = Config.StationPos("Ring")
		return (CFrame.lookAt(ring, ring + Config.StationFront("Ring")) * CFrame.new(-26, 0.4, -8)).Position
	end
	return Vector3.new(0, 0, 0)
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
	{ Name = "Apple", Kind = "apple", Value = 2, Weight = 70, Scale = 0, Color = C(220, 50, 50) },
	{ Name = "Protein Shake", Kind = "shake", Value = 12, Weight = 22, Scale = 0.2, Color = C(120, 190, 255) },
	{ Name = "Dumbbell", Kind = "dumbbell", Value = 60, Weight = 7, Scale = 0.4, Color = C(90, 95, 110) },
	{ Name = "Trophy", Kind = "trophy", Value = 300, Weight = 1, Scale = 0.6, Color = C(255, 205, 60) },
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
local QUEST_KINDS = { "swings", "shards", "train", "duel", "crate", "perfect" }
function Config.MakeQuest(done, rebirths)
	local kind = QUEST_KINDS[done % #QUEST_KINDS + 1]
	local step = done // #QUEST_KINDS
	local goal, per
	if kind == "swings" then
		goal, per = math.min(40 + step * 15, 400), 2
	elseif kind == "shards" then
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
	if kind == "swings" then
		return string.format("Swing your hammer %d times", goal)
	elseif kind == "shards" then
		return string.format("Collect %d pickups", goal)
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
	{ Id = "Storm", Name = "PICKUP STORM", Icon = "☄️", Desc = "Gym goodies are raining down", Duration = 60, Tint = C(215, 230, 255) },
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

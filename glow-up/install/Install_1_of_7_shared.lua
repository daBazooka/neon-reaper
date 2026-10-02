-- GLOW UP installer 1 of 7 (shared files).
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


-- Clear anything from earlier versions of the game (including Starlight Sprint).
remove(RS, "Shared")
remove(RS, "Net")
remove(RS, "Action")
remove(RS, "Popup")
remove(SSS, "Main")
remove(SPS, "Client")
remove(SPS, "Hud")
remove(SPS, "Extras")

local shared = getOrMake("Folder", "Shared", RS)
put("ModuleScript", "Config", shared, [=====[
-- GLOW UP: every number, name and table the game balances on lives here.
local Config = {}

Config.GameName = "GLOW UP"
Config.PlazaRadius = 160

--------------------------------------------------------------------------------
-- Ranks (decided by Glow Score = your stats + the look you're wearing)
--------------------------------------------------------------------------------
Config.Ranks = {
	{ Name = "Rookie", Score = 0, Color = Color3.fromRGB(170, 178, 196) },
	{ Name = "Rising", Score = 100, Color = Color3.fromRGB(110, 224, 150) },
	{ Name = "Smooth", Score = 400, Color = Color3.fromRGB(90, 214, 255) },
	{ Name = "Sharp", Score = 1200, Color = Color3.fromRGB(110, 150, 255) },
	{ Name = "Radiant", Score = 3500, Color = Color3.fromRGB(192, 124, 255) },
	{ Name = "Certified", Score = 9000, Color = Color3.fromRGB(255, 120, 205) },
	{ Name = "Icon", Score = 24000, Color = Color3.fromRGB(255, 204, 84) },
	{ Name = "Legend", Score = 65000, Color = Color3.fromRGB(255, 146, 66) },
	{ Name = "Mythic", Score = 170000, Color = Color3.fromRGB(255, 86, 128) },
	{ Name = "Eternal", Score = 450000, Color = Color3.fromRGB(236, 246, 255) },
}

function Config.RankFor(score)
	local index = 1
	for i, rank in Config.Ranks do
		if score >= rank.Score then
			index = i
		end
	end
	return index
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
function Config.RebirthRequirement(rebirths)
	return 4000 * 3 ^ rebirths
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
	{ Name = "Spark", Value = 2, Weight = 70, Scale = 0, Color = C(100, 220, 255) },
	{ Name = "Bloom", Value = 12, Weight = 22, Scale = 0.4, Color = C(200, 120, 255) },
	{ Name = "Nova", Value = 60, Weight = 7, Scale = 0.8, Color = C(255, 205, 80) },
	{ Name = "Mythic", Value = 300, Weight = 1, Scale = 1.3, Color = C(255, 90, 170) },
}
Config.ShardMutations = {
	{ Name = "Prismatic", Chance = 0.005, Mult = 10, Color = C(255, 255, 255) },
	{ Name = "Golden", Chance = 0.04, Mult = 3, Color = C(255, 205, 60) },
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
-- Runway: walking it earns a steady trickle scaled by your Glow Score
--------------------------------------------------------------------------------
Config.Runway = { Length = 80, Width = 16, AuraPerScore = 0.04 }

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
	{ Id = "Golden", Name = "GOLDEN HOUR", Icon = "🌟", Desc = "All Aura x2", Duration = 90, AuraMult = 2, Tint = C(255, 232, 175) },
	{ Id = "Storm", Name = "SHARD STORM", Icon = "☄️", Desc = "Rare shards are raining down", Duration = 60, Tint = C(190, 215, 255) },
	{ Id = "Frenzy", Name = "DUEL FRENZY", Icon = "⚔️", Desc = "Duel rewards x3", Duration = 90, DuelMult = 3, Tint = C(255, 190, 200) },
	{ Id = "Runway", Name = "RUNWAY NIGHT", Icon = "💃", Desc = "Runway Aura x4", Duration = 90, RunwayMult = 4, Tint = C(225, 190, 255) },
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
]=====])
put("ModuleScript", "Util", shared, [=====[
-- GLOW UP: small shared helpers.
local Util = {}

-- 1234 -> "1,234", 15300 -> "15.3K", 4.2e6 -> "4.20M" ...
function Util.fmt(n)
	n = math.floor(n + 0.5)
	if n >= 1e15 then
		return string.format("%.2fQ", n / 1e15)
	elseif n >= 1e12 then
		return string.format("%.2fT", n / 1e12)
	elseif n >= 1e9 then
		return string.format("%.2fB", n / 1e9)
	elseif n >= 1e6 then
		return string.format("%.2fM", n / 1e6)
	elseif n >= 1e4 then
		return string.format("%.1fK", n / 1e3)
	elseif n >= 1000 then
		local s = tostring(n)
		return s:sub(1, #s - 3) .. "," .. s:sub(-3)
	end
	return tostring(n)
end

-- Triangle wave 0..1..0 with period 2 (used for the training bar so client and server agree).
function Util.tri(x)
	return 1 - math.abs(x % 2 - 1)
end

function Util.lerp(a, b, t)
	return a + (b - a) * t
end

-- Seconds -> "1:05"
function Util.clock(seconds)
	seconds = math.max(0, math.floor(seconds))
	return string.format("%d:%02d", seconds // 60, seconds % 60)
end

-- Parses "id:stars,id:stars" (the replicated inventory string).
function Util.parseInventory(text)
	local inv = {}
	for id, stars in string.gmatch(text or "", "([%w_]+):(%d+)") do
		inv[id] = tonumber(stars)
	end
	return inv
end

return Util
]=====])
put("ModuleScript", "Audio", shared, [=====[
-- GLOW UP: client audio. Pitched pickup notes, fanfares and generative ambient music.
-- Everything is built from a few short sounds, so it works without uploading anything.
-- If a sound can't be loaded it is skipped silently (see the Output window for a note).
local SoundService = game:GetService("SoundService")
local ContentProvider = game:GetService("ContentProvider")
local Debris = game:GetService("Debris")

local Config = require(script.Parent:WaitForChild("Config"))

local Audio = {}

local PENTATONIC = { 0, 2, 4, 7, 9 }
local templates = {} -- name -> loaded Sound, or false when it failed to load
local sfxGroup, musicGroup
local musicEnabled = true
local customMusic
local started = false

local function makeGroup(name, volume)
	local g = Instance.new("SoundGroup")
	g.Name = name
	g.Volume = volume
	g.Parent = SoundService
	return g
end

function Audio.Init()
	if started then
		return
	end
	started = true
	sfxGroup = makeGroup("StarlightSfx", Config.SfxVolume)
	musicGroup = makeGroup("StarlightMusic", Config.MusicVolume)

	local reverb = Instance.new("ReverbSoundEffect")
	reverb.DecayTime = 3
	reverb.Density = 1
	reverb.Diffusion = 1
	reverb.DryLevel = -4
	reverb.WetLevel = 0
	reverb.Parent = musicGroup

	local folder = Instance.new("Folder")
	folder.Name = "StarlightAudioTemplates"
	folder.Parent = SoundService

	for name, id in Config.Sounds do
		if id ~= "" then
			local s = Instance.new("Sound")
			s.Name = name
			s.SoundId = id
			s.Parent = folder
			task.spawn(function()
				pcall(function()
					ContentProvider:PreloadAsync({ s })
				end)
				if s.TimeLength > 0 then
					templates[name] = s
				else
					templates[name] = false
					warn("[GlowUp Audio] Could not load '" .. name .. "' (" .. id .. "). Paste a working sound id in Config.Sounds.")
				end
			end)
		end
	end
end

local function playOn(group, name, speed, volume)
	local t = templates[name]
	if not t or not group then
		return
	end
	local s = t:Clone()
	s.PlaybackSpeed = speed or 1
	s.Volume = volume or 0.5
	s.SoundGroup = group
	s.Parent = SoundService
	s:Play()
	Debris:AddItem(s, math.max(0.6, t.TimeLength / s.PlaybackSpeed + 0.4))
end

function Audio.play(name, speed, volume)
	playOn(sfxGroup, name, speed, volume)
end

-- Step n of a rising major-pentatonic scale (so a long combo literally plays a melody).
local function noteSpeed(step)
	local i = (step - 1) % 5 + 1
	local octave = math.floor((step - 1) / 5) % 2
	return 0.7 * 2 ^ ((PENTATONIC[i] + octave * 12) / 12)
end
Audio.noteSpeed = noteSpeed

local function arpeggio(steps, gap, volume)
	task.spawn(function()
		for _, step in steps do
			Audio.play("Tone", noteSpeed(step), volume or 0.6)
			task.wait(gap)
		end
	end)
end

function Audio.pickup(combo, rank)
	local speed = noteSpeed(math.max(1, combo))
	Audio.play("Tone", speed, 0.5 + math.min(rank, 4) * 0.08)
	if rank >= 2 then
		Audio.play("Tone", speed * 1.5, 0.35) -- a fifth above for richer orbs
	end
	if rank >= 3 then
		Audio.play("Bass", 1.1, 0.5)
	end
end

function Audio.click()
	Audio.play("Click", 1.1, 0.5)
end

function Audio.purchase()
	arpeggio({ 3, 5, 8 }, 0.06, 0.55)
end

function Audio.levelUp()
	arpeggio({ 1, 3, 5, 8, 10, 13 }, 0.07, 0.7)
	Audio.play("Flash", 1, 0.4)
end

function Audio.quest()
	arpeggio({ 2, 4, 6, 9 }, 0.08, 0.65)
end

function Audio.milestone(combo)
	local base = math.max(1, combo // 5)
	arpeggio({ base, base + 2, base + 4 }, 0.05, 0.6)
end

function Audio.event()
	arpeggio({ 10, 8, 6, 4, 1 }, 0.1, 0.6)
end

function Audio.ascend()
	arpeggio({ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 }, 0.06, 0.7)
	Audio.play("Flash", 0.8, 0.6)
end

function Audio.daily()
	arpeggio({ 5, 8, 10 }, 0.09, 0.6)
end

function Audio.hatchTick(i)
	Audio.play("Tone", 0.8 + i * 0.1, 0.5)
end

function Audio.equip()
	arpeggio({ 4, 8 }, 0.05, 0.5)
end

function Audio.error()
	Audio.play("Bass", 0.7, 0.5)
end

function Audio.rank()
	arpeggio({ 1, 3, 5, 8, 10, 13, 15 }, 0.08, 0.75)
	Audio.play("Flash", 1, 0.5)
end

function Audio.win()
	arpeggio({ 3, 5, 8, 10, 13 }, 0.07, 0.7)
	Audio.play("Flash", 1, 0.5)
end

function Audio.lose()
	arpeggio({ 8, 6, 4 }, 0.12, 0.5)
end

function Audio.crateTick(i)
	Audio.play("Tone", 0.9 + (i % 6) * 0.08, 0.35)
end

function Audio.countdown(final)
	Audio.play("Tone", final and 2.2 or 1.2, 0.6)
end

function Audio.setSfx(on)
	if sfxGroup then
		sfxGroup.Volume = on and Config.SfxVolume or 0
	end
end

-- rank: 1 Common .. 6 Mythic
function Audio.reveal(rank)
	local steps = {}
	for i = 1, 2 + rank do
		steps[i] = i * 2 - 1
	end
	arpeggio(steps, 0.08, 0.7)
	if rank >= 4 then
		Audio.play("Flash", 1, 0.7)
		Audio.play("Bass", 0.8, 0.7)
	end
end

--------------------------------------------------------------------------------
-- Music
--------------------------------------------------------------------------------
function Audio.setMusic(on)
	musicEnabled = on
	if musicGroup then
		musicGroup.Volume = on and Config.MusicVolume or 0
	end
	if customMusic then
		customMusic.Volume = on and 1 or 0
	end
end

function Audio.musicOn()
	return musicEnabled
end

function Audio.startMusic()
	if Config.MusicTrackId ~= "" then
		customMusic = Instance.new("Sound")
		customMusic.Name = "StarlightMusic"
		customMusic.SoundId = Config.MusicTrackId
		customMusic.Looped = true
		customMusic.Volume = 1
		customMusic.SoundGroup = musicGroup
		customMusic.Parent = SoundService
		customMusic:Play()
		return
	end

	-- Generative ambient: a slow minor progression with a soft bass pulse and random arpeggio notes.
	local ROOTS = { 0, 5, 3, 7 }
	local ARP = { 0, 3, 7, 10, 12, 15, 19 }
	local rng = Random.new()
	task.spawn(function()
		local tick, bar = 0, 0
		while true do
			task.wait(0.28)
			if musicEnabled and templates.Tone then
				local root = ROOTS[bar % #ROOTS + 1]
				if tick % 8 == 0 then
					playOn(musicGroup, templates.Bass and "Bass" or "Tone", 2 ^ ((root - 12) / 12), 0.5)
				end
				if rng:NextNumber() < 0.65 then
					local semis = root + ARP[rng:NextInteger(1, #ARP)]
					playOn(musicGroup, "Tone", 0.5 * 2 ^ (semis / 12), 0.12 + rng:NextNumber() * 0.12)
				end
			end
			tick += 1
			if tick % 16 == 0 then
				bar += 1
			end
		end
	end)
end

return Audio
]=====])
put("ModuleScript", "UI", shared, [=====[
-- GLOW UP: the client design system. One place for colours, fonts and reusable components
-- so every screen looks like it belongs to the same game.
local TweenService = game:GetService("TweenService")

local Config = require(script.Parent:WaitForChild("Config"))
local Util = require(script.Parent:WaitForChild("Util"))

local UI = {}

UI.Colors = {
	Bg = Color3.fromRGB(13, 10, 28),
	Panel = Color3.fromRGB(22, 17, 46),
	Card = Color3.fromRGB(34, 27, 68),
	CardHover = Color3.fromRGB(46, 37, 90),
	Stroke = Color3.fromRGB(120, 96, 220),
	Text = Color3.fromRGB(244, 240, 255),
	Muted = Color3.fromRGB(167, 158, 206),
	Accent = Color3.fromRGB(150, 92, 255),
	Accent2 = Color3.fromRGB(255, 92, 190),
	Good = Color3.fromRGB(64, 214, 128),
	Gold = Color3.fromRGB(255, 204, 84),
	Cyan = Color3.fromRGB(90, 214, 255),
	Danger = Color3.fromRGB(255, 92, 110),
	Disabled = Color3.fromRGB(70, 64, 104),
}

UI.Fonts = {
	Title = Enum.Font.GothamBlack,
	Bold = Enum.Font.GothamBold,
	Body = Enum.Font.GothamMedium,
}

UI.fmt = Util.fmt

function UI.new(class, props, parent)
	local inst = Instance.new(class)
	for k, v in props do
		inst[k] = v
	end
	inst.Parent = parent
	return inst
end

function UI.corner(inst, radius)
	return UI.new("UICorner", { CornerRadius = UDim.new(0, radius or 12) }, inst)
end

function UI.stroke(inst, color, thickness, transparency)
	return UI.new("UIStroke", {
		Color = color or UI.Colors.Stroke,
		Thickness = thickness or 1.5,
		Transparency = transparency or 0.55,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
	}, inst)
end

function UI.gradient(inst, c1, c2, rotation)
	return UI.new("UIGradient", {
		Color = ColorSequence.new(c1, c2),
		Rotation = rotation or 90,
	}, inst)
end

function UI.padding(inst, all)
	return UI.new("UIPadding", {
		PaddingTop = UDim.new(0, all),
		PaddingBottom = UDim.new(0, all),
		PaddingLeft = UDim.new(0, all),
		PaddingRight = UDim.new(0, all),
	}, inst)
end

function UI.tween(inst, seconds, props, style, direction)
	local t = TweenService:Create(
		inst,
		TweenInfo.new(seconds, style or Enum.EasingStyle.Quad, direction or Enum.EasingDirection.Out),
		props
	)
	t:Play()
	return t
end

-- Squash-and-stretch on a UIScale.
function UI.pop(scaleObj, amount)
	scaleObj.Scale = amount or 1.12
	UI.tween(scaleObj, 0.28, { Scale = 1 }, Enum.EasingStyle.Back)
end

function UI.label(parent, props)
	local base = {
		BackgroundTransparency = 1,
		Font = UI.Fonts.Body,
		TextSize = 16,
		TextColor3 = UI.Colors.Text,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextWrapped = true,
		RichText = false,
	}
	for k, v in props do
		base[k] = v
	end
	return UI.new("TextLabel", base, parent)
end

-- A rounded glass panel.
function UI.panel(parent, props)
	local base = {
		BackgroundColor3 = UI.Colors.Panel,
		BackgroundTransparency = 0.08,
		BorderSizePixel = 0,
	}
	local radius = props.Radius or 16
	for k, v in props do
		if k ~= "Radius" then
			base[k] = v
		end
	end
	local frame = UI.new("Frame", base, parent)
	UI.corner(frame, radius)
	UI.stroke(frame)
	return frame
end

-- Button with hover/press feedback. style: "primary" (gradient) | "card" | "ghost".
function UI.button(parent, props, style)
	style = style or "primary"
	local base = {
		AutoButtonColor = false,
		BorderSizePixel = 0,
		Font = UI.Fonts.Bold,
		TextSize = 16,
		TextColor3 = UI.Colors.Text,
		Text = "",
		BackgroundColor3 = style == "card" and UI.Colors.Card or UI.Colors.Accent,
	}
	local radius = props.Radius or 12
	for k, v in props do
		if k ~= "Radius" then
			base[k] = v
		end
	end
	local btn = UI.new("TextButton", base, parent)
	UI.corner(btn, radius)
	local scale = UI.new("UIScale", {}, btn)
	local grad
	if style == "primary" then
		grad = UI.gradient(btn, UI.Colors.Accent, UI.Colors.Accent2, 35)
	end
	local baseColor = base.BackgroundColor3
	btn.MouseEnter:Connect(function()
		UI.tween(scale, 0.12, { Scale = 1.04 })
		if style == "card" then
			UI.tween(btn, 0.12, { BackgroundColor3 = UI.Colors.CardHover })
		end
	end)
	btn.MouseLeave:Connect(function()
		UI.tween(scale, 0.12, { Scale = 1 })
		if style == "card" then
			UI.tween(btn, 0.12, { BackgroundColor3 = baseColor })
		end
	end)
	btn.MouseButton1Down:Connect(function()
		UI.tween(scale, 0.06, { Scale = 0.95 })
	end)
	btn.MouseButton1Up:Connect(function()
		UI.tween(scale, 0.1, { Scale = 1.04 })
	end)
	return btn, scale, grad
end

-- Horizontal progress bar. Returns an object with :set(alpha) and .fill / .back.
function UI.bar(parent, props, fillColor)
	local back = UI.new("Frame", {
		BackgroundColor3 = Color3.fromRGB(14, 11, 32),
		BorderSizePixel = 0,
		Size = props.Size or UDim2.new(1, 0, 0, 10),
		Position = props.Position or UDim2.new(),
		AnchorPoint = props.AnchorPoint or Vector2.zero,
	}, parent)
	UI.corner(back, 99)
	local fill = UI.new("Frame", {
		BackgroundColor3 = fillColor or UI.Colors.Accent,
		BorderSizePixel = 0,
		Size = UDim2.fromScale(0, 1),
	}, back)
	UI.corner(fill, 99)
	local self = { back = back, fill = fill }
	function self.set(alpha)
		fill.Size = UDim2.fromScale(math.clamp(alpha, 0, 1), 1)
	end
	return self
end

function UI.rarityColor(rarity)
	return Config.Rarities[rarity].Color
end

return UI
]=====])
print("GLOW UP installer 1/7 done (" .. created .. " scripts). Now run installer 2.")

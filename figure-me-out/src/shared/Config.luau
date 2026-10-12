-- FIGURE ME OUT: every number and every piece of content in the game. Change a value here and the whole game follows.
local Config = {}
local C = Color3.fromRGB

Config.GameName = "Figure Me Out"

--------------------------------------------------------------------------------
-- The idea: everybody wears a secret 3-digit number on their forehead that they cannot see.
-- Type someone else's number correctly and they are out. Read numbers, hide yours, last one standing wins.
--------------------------------------------------------------------------------
Config.Match = {
	MaxPlayers = 20,
	MinTotal = 10, -- bots fill the match up to this many players, so there is always a game (and 2 "players" is the minimum)
	Intermission = 14, -- lobby wait between matches (seconds)
	Countdown = 8, -- before the start whistle
	Length = 240, -- the match: four minutes
	RevealAt = 30, -- the final stretch: every plate glows, the timer turns red, the music speeds up
	ResultsTime = 12,
}

Config.Number = { Digits = 3, Min = 1, Max = 999 } -- shown with leading zeros: 007, 042, 512

-- Lives: a correct guess takes one life. You come back after a moment, protected, until your lives run out.
Config.Lives = {
	Start = 3,
	RespawnDelay = 2.0, -- you are frozen and glitching for this long, then you pop up somewhere else
	Protect = 5, -- seconds nobody can guess you after coming back
	AntiFarm = 25, -- you can't score on the same person again for this long
}

-- Points: used for the tiebreak and shown on the results screen.
Config.Score = {
	Hit = 100,
	Bounty = 150,
	Assist = 40, -- you photographed their whole number in the last minute and somebody else got them
	AssistWindow = 60,
	Intel = 10, -- a photo that captured a complete number
	SurviveEvery = 20, -- seconds
	Survive = 5,
	Win = 200,
}

-- Guessing: aim at someone, press G, type their 3 digits, press Confirm. Wrong guesses cost a bullet and freeze you.
Config.Guess = {
	Cooldown = 1.0,
	MaxDistance = 170, -- you must be able to see them, and be this close
	Stun = 3,
	Bullets = 5,
	BulletRegen = 25, -- seconds to get one bullet back
	KillBullets = 2, -- bullets back for a successful guess
	WarnTime = 4, -- how long the guessed player sees "someone guessed you" with an arrow
	AutoSubmit = false, -- true = fires on the third digit; false = you press CONFIRM (or Enter)
}

-- Covering your number: facing a wall or dead end for too long. You are warned, then exposed. Repeat offenders are
-- exposed for longer. Smoke and flashbangs never count.
Config.Cover = {
	Distance = 5, -- a wall this close in front of your forehead covers it
	Angles = { 0, 25, -25 }, -- degrees from straight ahead (2 of these 3 must be blocked)
	NeedBlocked = 2,
	WarnAfter = 1.0, -- seconds covered before the warning appears
	Limit = 6.0, -- seconds covered before you are exposed
	Expose = 20, -- seconds your plate glows red and a marker shows over your head
	RepeatBonus = 0.5, -- each earlier violation makes the exposure this much longer (x1.5, x2, ...)
	Tick = 0.25,
}

Config.Movement = { Walk = 16, Jump = 50, ScopeWalk = 8 }

--------------------------------------------------------------------------------
-- Gadgets (hotbar keys 1 to 8). Binoculars and the camera never run out (they have cooldowns); the others
-- are carried in limited numbers and found in glowing crates and supply drops.
--------------------------------------------------------------------------------
Config.Items = {
	{ Id = "binos", Name = "Binoculars", Icon = "🔭", Key = 1, Permanent = true, Cooldown = 0.6, Tip = "Hold to zoom in and read far-away plates. Can't see through walls." },
	{ Id = "camera", Name = "Snapshot Camera", Icon = "📷", Key = 2, Permanent = true, Cooldown = 1.4, Tip = "Photograph everyone in frame. Clear numbers go into your notebook." },
	{ Id = "flash", Name = "Flashbang", Icon = "💥", Key = 3, Start = 2, Max = 3, Weight = 22, Cooldown = 4, Tip = "Throw it: blinds whoever sees it go off. Turn away to blink less." },
	{ Id = "smoke", Name = "Smoke Grenade", Icon = "💨", Key = 4, Start = 2, Max = 3, Weight = 22, Cooldown = 4, Tip = "Throw it: a thick cloud nobody can see through for 15s." },
	{ Id = "mask", Name = "Decoy Mask", Icon = "🎭", Key = 5, Start = 1, Max = 2, Weight = 14, Cooldown = 10, Tip = "Others see a fake number for 12s (your plate turns purple)." },
	{ Id = "scanner", Name = "Scanner", Icon = "📡", Key = 6, Start = 1, Max = 3, Weight = 16, Cooldown = 8, Tip = "Pings people nearby: you see where they are, never their number." },
	{ Id = "distraction", Name = "Distraction Device", Icon = "🔔", Key = 7, Start = 1, Max = 2, Weight = 14, Cooldown = 6, Tip = "Throw it: fake footsteps for 8s. Bots (and people) go to check." },
	{ Id = "scramble", Name = "Number Scrambler", Icon = "📺", Key = 8, Start = 1, Max = 2, Weight = 14, Cooldown = 10, Tip = "Your plate flickers with random digits for 9s." },
}
Config.ItemById = {}
Config.ItemOrder = {}
for _, item in Config.Items do
	Config.ItemById[item.Id] = item
	table.insert(Config.ItemOrder, item.Id)
end
Config.CarriedItems = { "flash", "smoke", "mask", "scanner", "distraction", "scramble" }

Config.Flash = { Radius = 80, Fuse = 1.6, MaxBlind = 6.5, MinBlind = 1.2, ThrowSpeed = 55, ThrowUp = 22 }
Config.Smoke = { Radius = 9, Duration = 15, Fuse = 1.3, Fade = 3 }
Config.Mask = { Duration = 12 }
Config.Scramble = { Duration = 9 }
Config.Scanner = { Radius = 45, Show = 4 }
Config.Distraction = { Duration = 8, Fuse = 1.2, Radius = 70 }

-- Photos are worked out by the server from where the camera points.
Config.Photo = {
	MaxDistance = 95,
	HalfAngle = 32, -- degrees either side of the middle of the picture
	ClearDistance = 32, -- every digit is readable up to here (if they face you)
	FuzzyDistance = 62, -- each digit is readable with some luck up to here
	FuzzyChance = 0.45,
	FaceAngle = 55, -- their forehead must be turned this close to the camera
	Cooldown = 1.4,
	Album = 12,
	NoticeDistance = 24, -- closer than this, the person photographed may notice the flash
	NoticeChance = 0.6,
}

Config.Scope = { Fov = 14, MinFov = 6, MaxFov = 24, NormalFov = 70 }

-- Crates that hand out gadgets. Positions are on the map (see Config.Map).
Config.Pickups = { Respawn = 30, Radius = 4.5 }

--------------------------------------------------------------------------------
-- Bounty, alliances, information terminals and bonus events
--------------------------------------------------------------------------------
Config.Bounty = { Reward = 150, Coins = 25, Every = 70, Lasts = 90 } -- a new target every so many seconds

Config.Alliance = { Duration = 90, Range = 60, Cooldown = 40, MaxShare = 12, ReAllyAfterBetrayal = 60 }

Config.Terminal = { Uses = 3, Cooldown = 20, Range = 10, Reveal = 5 } -- uses per player per match; seconds between uses; using one shows your position for Reveal seconds

Config.Events = {
	First = 50, -- no event before this many seconds into the match
	Gap = { 55, 90 }, -- random seconds between events
	Warn = 5, -- announced this many seconds before it starts
	List = {
		{ Id = "double", Name = "DOUBLE POINTS", Icon = "✨", Seconds = 25, Text = "Every successful guess is worth double!" },
		{ Id = "gravity", Name = "LOW GRAVITY", Icon = "🌙", Seconds = 20, Text = "Jump higher! Everybody floats." },
		{ Id = "blackout", Name = "BLACKOUT", Icon = "🌑", Seconds = 12, Text = "The lights go out. Plates still glow faintly." },
		{ Id = "bounty", Name = "BOUNTY BONUS", Icon = "🎯", Seconds = 30, Text = "Bounties pay triple!" },
		{ Id = "drop", Name = "SUPPLY DROP", Icon = "📦", Seconds = 1, Text = "A supply drop lands in the plaza. First come, first served!" },
	},
	LowGravity = 70,
}

--------------------------------------------------------------------------------
-- Progression: coins and XP after every match, levels, and cosmetics. Nothing here changes how strong you are.
--------------------------------------------------------------------------------
Config.Rewards = { Coins = { Play = 15, PerPoint = 0.1, Win = 60 }, XP = { Play = 20, PerPoint = 0.15, Win = 50 } }
Config.Levels = { First = 100, Step = 40, Max = 99 } -- XP needed for level n = First + Step * (n - 1)

-- Trail left behind you, elimination effect (the cartoon burst when you lose a life) and quick emotes.
-- Cost = coins. Level = needed level. Both 0 = you own it from the start.
Config.Trails = {
	{ Id = "none", Name = "No trail", Icon = "⚪", Cost = 0, Level = 0, Color = C(255, 255, 255) },
	{ Id = "sparkle", Name = "Sparkle", Icon = "✨", Cost = 150, Level = 2, Color = C(255, 236, 140) },
	{ Id = "aqua", Name = "Aqua Wave", Icon = "🌊", Cost = 300, Level = 4, Color = C(90, 215, 255) },
	{ Id = "bubble", Name = "Bubblegum", Icon = "🫧", Cost = 450, Level = 6, Color = C(255, 150, 205) },
	{ Id = "flame", Name = "Flame", Icon = "🔥", Cost = 700, Level = 8, Color = C(255, 140, 50) },
}
Config.Effects = {
	{ Id = "pixels", Name = "Pixel Pop", Icon = "🟦", Cost = 0, Level = 0, Colors = { C(90, 215, 255), C(255, 255, 255) } },
	{ Id = "confetti", Name = "Confetti", Icon = "🎉", Cost = 120, Level = 2, Colors = { C(255, 90, 140), C(255, 226, 90), C(90, 214, 96) } },
	{ Id = "hearts", Name = "Hearts", Icon = "💖", Cost = 300, Level = 5, Colors = { C(255, 110, 170), C(255, 190, 220) } },
	{ Id = "glitch", Name = "Glitch", Icon = "👾", Cost = 500, Level = 7, Colors = { C(60, 255, 120), C(255, 60, 200), C(60, 200, 255) } },
}
Config.Emotes = {
	{ Id = "wave", Name = "Wave", Icon = "👋", Cost = 0, Level = 0 },
	{ Id = "laugh", Name = "Laugh", Icon = "😂", Cost = 0, Level = 0 },
	{ Id = "cool", Name = "Cool", Icon = "😎", Cost = 0, Level = 0 },
	{ Id = "think", Name = "Thinking", Icon = "🤔", Cost = 0, Level = 0 },
	{ Id = "eyes", Name = "Watching", Icon = "👀", Cost = 0, Level = 0 },
	{ Id = "scared", Name = "Scared", Icon = "😱", Cost = 120, Level = 2 },
	{ Id = "party", Name = "Party", Icon = "🎉", Cost = 200, Level = 3 },
	{ Id = "skull", Name = "Oops", Icon = "💀", Cost = 250, Level = 5 },
}
Config.TrailById, Config.EffectById, Config.EmoteById = {}, {}, {}
for _, t in Config.Trails do Config.TrailById[t.Id] = t end
for _, t in Config.Effects do Config.EffectById[t.Id] = t end
for _, t in Config.Emotes do Config.EmoteById[t.Id] = t end
Config.EmoteCooldown = 2.5

--------------------------------------------------------------------------------
-- Everyone gets a unique colour and animal (their codename) so you can tell people apart.
--------------------------------------------------------------------------------
Config.Colors = {
	{ Name = "Red", Color = C(235, 60, 60) }, { Name = "Blue", Color = C(60, 110, 240) },
	{ Name = "Green", Color = C(60, 190, 90) }, { Name = "Yellow", Color = C(250, 220, 50) },
	{ Name = "Orange", Color = C(250, 140, 40) }, { Name = "Purple", Color = C(150, 80, 220) },
	{ Name = "Pink", Color = C(255, 120, 190) }, { Name = "Teal", Color = C(40, 190, 190) },
	{ Name = "Lime", Color = C(170, 230, 50) }, { Name = "Brown", Color = C(140, 90, 50) },
	{ Name = "Navy", Color = C(30, 50, 130) }, { Name = "Gold", Color = C(210, 170, 40) },
	{ Name = "Silver", Color = C(190, 195, 205) }, { Name = "Maroon", Color = C(130, 30, 50) },
	{ Name = "Cyan", Color = C(80, 220, 250) }, { Name = "Coral", Color = C(255, 110, 100) },
	{ Name = "Olive", Color = C(120, 130, 50) }, { Name = "Violet", Color = C(200, 120, 255) },
	{ Name = "Mint", Color = C(130, 240, 190) }, { Name = "Peach", Color = C(255, 190, 150) },
}
Config.Animals = {
	{ Name = "Fox", Icon = "🦊" }, { Name = "Owl", Icon = "🦉" }, { Name = "Wolf", Icon = "🐺" }, { Name = "Bear", Icon = "🐻" },
	{ Name = "Cat", Icon = "🐱" }, { Name = "Dog", Icon = "🐶" }, { Name = "Frog", Icon = "🐸" }, { Name = "Tiger", Icon = "🐯" },
	{ Name = "Panda", Icon = "🐼" }, { Name = "Koala", Icon = "🐨" }, { Name = "Eagle", Icon = "🦅" }, { Name = "Shark", Icon = "🦈" },
	{ Name = "Lion", Icon = "🦁" }, { Name = "Pig", Icon = "🐷" }, { Name = "Horse", Icon = "🐴" }, { Name = "Bunny", Icon = "🐰" },
	{ Name = "Duck", Icon = "🦆" }, { Name = "Snake", Icon = "🐍" }, { Name = "Crab", Icon = "🦀" }, { Name = "Whale", Icon = "🐳" },
}

-- Forehead plates you unlock by winning. Wins = how many wins unlock it.
Config.PlateStyles = {
	{ Id = "classic", Name = "Classic", Wins = 0, Back = C(20, 22, 30), Text = C(255, 255, 255), Rim = C(255, 255, 255) },
	{ Id = "gold", Name = "Gold", Wins = 1, Back = C(40, 30, 6), Text = C(255, 214, 60), Rim = C(255, 214, 60) },
	{ Id = "neon", Name = "Neon", Wins = 3, Back = C(8, 20, 28), Text = C(60, 255, 220), Rim = C(60, 255, 220) },
	{ Id = "hot", Name = "Hot Pink", Wins = 6, Back = C(36, 8, 24), Text = C(255, 90, 190), Rim = C(255, 90, 190) },
	{ Id = "ice", Name = "Ice", Wins = 10, Back = C(220, 240, 255), Text = C(20, 60, 120), Rim = C(100, 180, 255) },
	{ Id = "royal", Name = "Royal", Wins = 20, Back = C(60, 10, 90), Text = C(255, 240, 150), Rim = C(255, 214, 60) },
}
Config.PlateStyleById = {}
for _, s in Config.PlateStyles do
	Config.PlateStyleById[s.Id] = s
end

--------------------------------------------------------------------------------
-- The map: "Plaza Park", a 3x3 grid of city blocks with streets between them and a park in the middle.
-- The centre block (0, 0) is the plaza; the 8 outer blocks hold a building each. Streets run at x or z = +-43.
--------------------------------------------------------------------------------
Config.Map = {
	Half = 134, -- the arena is this big in each direction from the middle
	Block = 60,
	Street = 26,
	BuildingHeight = 16,
	BlockCenters = { -86, 0, 86 },
	Lobby = Vector3.new(0, 0, 420), -- the lobby island is far away from the arena
}
-- The 8 outer blocks: { x, z } of the block's middle. Each holds a 44x44 building in the middle of the block.
Config.Map.Buildings = {}
for _, bx in Config.Map.BlockCenters do
	for _, bz in Config.Map.BlockCenters do
		if not (bx == 0 and bz == 0) then
			table.insert(Config.Map.Buildings, { X = bx, Z = bz, Size = 44 })
		end
	end
end
-- 20 spawn points along the streets (never inside a building).
Config.Map.Spawns = {}
for _, z in { -100, -70, -20, 20, 70, 100 } do
	table.insert(Config.Map.Spawns, Vector3.new(-43, 3.5, z))
	table.insert(Config.Map.Spawns, Vector3.new(43, 3.5, z))
end
for _, x in { -70, -20, 20, 70 } do
	table.insert(Config.Map.Spawns, Vector3.new(x, 3.5, -43))
	table.insert(Config.Map.Spawns, Vector3.new(x, 3.5, 43))
end
-- 4 information terminals in the corners of the plaza
Config.Map.Terminals = { Vector3.new(-24, 2, -24), Vector3.new(24, 2, -24), Vector3.new(-24, 2, 24), Vector3.new(24, 2, 24) }
-- where supply drops land: open ground in the plaza
Config.Map.DropSpots = { Vector3.new(18, 0, 6), Vector3.new(-18, 0, -6), Vector3.new(6, 0, -18), Vector3.new(-6, 0, 18) }
-- 16 crate spots: the four crossroads, the plaza, and along the streets.
Config.Map.Crates = {}
for _, sx in { -1, 1 } do
	for _, sz in { -1, 1 } do
		table.insert(Config.Map.Crates, Vector3.new(43 * sx, 1.5, 43 * sz))
		table.insert(Config.Map.Crates, Vector3.new(14 * sx, 1.5, 14 * sz))
		table.insert(Config.Map.Crates, Vector3.new(43 * sx, 1.5, 88 * sz))
		table.insert(Config.Map.Crates, Vector3.new(88 * sx, 1.5, 43 * sz))
	end
end

--------------------------------------------------------------------------------
-- Audio (sounds that ship with Roblox; swap any for an asset id from the Creator Store)
--------------------------------------------------------------------------------
Config.Sounds = {
	Tone = "rbxasset://sounds/electronicpingshort.wav",
	Bass = "rbxasset://sounds/bass.wav",
	Click = "rbxasset://sounds/button.wav",
	Flash = "rbxasset://sounds/flashbulb.wav",
	Footsteps = "rbxasset://sounds/action_footsteps_plastic.mp3",
}
Config.MusicTrackId = "" -- optional looping song id; empty = generated music
Config.MusicVolume = 0.2
Config.SfxVolume = 0.85

return Config

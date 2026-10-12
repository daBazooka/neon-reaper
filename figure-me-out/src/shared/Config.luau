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
	MinTotal = 10, -- bots fill the match up to this many players, so there is always a game
	Intermission = 14, -- lobby wait between matches (seconds)
	Countdown = 8, -- before the start whistle
	Length = 300, -- the match (seconds)
	RevealAt = 30, -- seconds left when THE REVEAL begins and every plate glows
	ResultsTime = 12,
}

Config.Number = { Digits = 3, Min = 100, Max = 999 }

-- Guessing: aim at someone, press G, type their 3 digits. Wrong guesses cost a bullet and stun you.
Config.Guess = {
	Cooldown = 1.0,
	MaxDistance = 170, -- you must be able to see them, and be this close
	Stun = 3,
	DecoyStun = 6,
	Bullets = 5,
	BulletRegen = 25, -- seconds to get one bullet back
	KillBullets = 2, -- bullets back for an elimination
	WarnTime = 4, -- how long the guessed player sees "someone guessed you" with an arrow
}

-- Covering your number: facing a wall or dead end for too long. You are warned, then exposed.
Config.Cover = {
	Distance = 5, -- a wall this close in front of your forehead covers it
	Angles = { 0, 25, -25 }, -- degrees from straight ahead (2 of these 3 must be blocked)
	NeedBlocked = 2,
	WarnAfter = 1.0, -- seconds covered before the warning appears
	Limit = 6.0, -- seconds covered before you are exposed
	Expose = 20, -- seconds your plate glows red and a marker shows over your head
	Tick = 0.25,
}

Config.Movement = { Walk = 16, Jump = 50, Boots = 28, BootsTime = 6, ScopeWalk = 8 }

--------------------------------------------------------------------------------
-- Items. Binoculars and the camera are always with you; the rest are carried in limited numbers and
-- found in glowing crates around the map. Hotbar keys 1 to 8.
--------------------------------------------------------------------------------
Config.Items = {
	{ Id = "binos", Name = "Binoculars", Icon = "🔭", Key = 1, Permanent = true, Tip = "Hold to zoom in. Read digits from far away." },
	{ Id = "camera", Name = "Camera", Icon = "📷", Key = 2, Permanent = true, Tip = "Click to take a photo of everyone you can see." },
	{ Id = "flash", Name = "Flashbang", Icon = "💥", Key = 3, Start = 2, Max = 3, Weight = 22, Tip = "Throw it. Blinds everybody who sees it go off." },
	{ Id = "smoke", Name = "Smoke Grenade", Icon = "💨", Key = 4, Start = 2, Max = 3, Weight = 22, Tip = "Throw it. A thick cloud nobody can see through." },
	{ Id = "decoy", Name = "Decoy", Icon = "🎭", Key = 5, Start = 0, Max = 2, Weight = 14, Tip = "Drops a copy of you wearing a fake number." },
	{ Id = "scramble", Name = "Scrambler", Icon = "📺", Key = 6, Start = 0, Max = 2, Weight = 14, Tip = "Your number flickers with fake digits for a while." },
	{ Id = "switch", Name = "Switcheroo", Icon = "🔄", Key = 7, Start = 0, Max = 2, Weight = 10, Tip = "Swap numbers with someone close by." },
	{ Id = "boots", Name = "Speed Boots", Icon = "👟", Key = 8, Start = 0, Max = 2, Weight = 18, Tip = "Run much faster for a few seconds." },
}
Config.ItemById = {}
Config.ItemOrder = {}
for _, item in Config.Items do
	Config.ItemById[item.Id] = item
	table.insert(Config.ItemOrder, item.Id)
end
Config.CarriedItems = { "flash", "smoke", "decoy", "scramble", "switch", "boots" }

Config.Flash = { Radius = 80, Fuse = 1.6, MaxBlind = 6.5, MinBlind = 1.2, ThrowSpeed = 55, ThrowUp = 22 }
Config.Smoke = { Radius = 9, Duration = 15, Fuse = 1.3, Fade = 3 }
Config.Decoy = { Duration = 45 }
Config.Scramble = { Duration = 9 }
Config.Switch = { Range = 45 }

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
}

Config.Scope = { Fov = 14, MinFov = 6, MaxFov = 24, NormalFov = 70 }

-- Crates that hand out items. Positions are on the map (see Config.Map).
Config.Pickups = { Respawn = 30, Radius = 4.5 }

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
}
Config.MusicTrackId = "" -- optional looping song id; empty = generated music
Config.MusicVolume = 0.2
Config.SfxVolume = 0.85

return Config

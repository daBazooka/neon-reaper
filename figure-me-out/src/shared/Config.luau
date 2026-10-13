-- FIGURE ME OUT: every number and every piece of content in the game. Change a value here and the whole game follows.
local Config = {}
local C = Color3.fromRGB

Config.GameName = "Figure Me Out"

--------------------------------------------------------------------------------
-- The idea: everybody wears a secret 3-digit number on their forehead that they cannot see.
-- Type someone else's number correctly and they are out. Read numbers, hide yours, last one standing wins.
--------------------------------------------------------------------------------
-- QUICK-AND-SIMPLE MODE. The core game is: look at a head, type the number, win. Everything else is an optional extra
-- that is switched OFF by default so the game stays easy to read and play. Set any of these to true to bring it back.
Config.Features = {
	Gadgets = false, -- the hotbar: flashbang, smoke, distraction, scanner, sprint, decoy (and the crates / supply drops that refill them)
	Photos = false, -- the camera and the notebook
	Binoculars = false, -- hold to zoom
	Terminals = false, -- hack a terminal for a clue
	Bounty = false, -- a gold-tagged target with a prize
	Alliances = false, -- ask somebody to team up
	Events = false, -- double points, low gravity, blackout...
}

Config.Match = {
	MaxPlayers = 20,
	MinHumans = 2, -- real players needed before a match starts (the lobby waits until this many are here)
	MinTotal = 0, -- 0 = real players only. (A number here would add bots up to that many players: handy for testing alone in Studio.)
	Intermission = 10, -- lobby wait between matches (seconds)
	Countdown = 5, -- before the start whistle
	Length = 90, -- the match: a minute and a half
	RevealAt = 20, -- the final stretch: every plate glows, the timer turns red, the music speeds up
	ResultsTime = 8,
}

-- Game modes. Matches rotate through them (or set Mode to one id to always play that mode).
--   deathmatch: everybody for themselves, 3 lives, last one standing (or most lives/points when time runs out)
--   team:       two teams, unlimited respawns, a point for every hit on the other team, first to ScoreLimit
--   ctf:        two teams, unlimited respawns, steal the other team's flag and bring it home, first to CaptureLimit
Config.Modes = {
	Rotation = { "deathmatch", "team", "ctf" },
	Mode = "rotate", -- "rotate" or one of the ids above
	List = {
		deathmatch = { Id = "deathmatch", Name = "DEATHMATCH", Icon = "💀", Teams = false, Respawn = false, Tip = "Everybody for themselves. 3 lives." },
		team = { Id = "team", Name = "TEAM DEATHMATCH", Icon = "⚔️", Teams = true, Respawn = true, ScoreLimit = 15, Tip = "Two teams. Every hit on the other team scores. First to 15." },
		ctf = { Id = "ctf", Name = "CAPTURE THE FLAG", Icon = "🚩", Teams = true, Respawn = true, CaptureLimit = 2, Tip = "Grab the enemy flag and bring it home. First to 2 captures." },
	},
}
Config.Teams = {
	{ Id = 1, Name = "RED", Icon = "🔴", Color = C(235, 70, 70) },
	{ Id = 2, Name = "BLUE", Icon = "🔵", Color = C(70, 130, 245) },
}
Config.Team = { FriendlyFire = false } -- true = you can guess your own teammates (it costs them a life like anybody else)

-- Capture the flag. The bases are the two MARKET courtyards (red west, blue east).
Config.Flag = {
	PickupRadius = 5, -- walk this close to a flag to take it (or to return your own dropped flag)
	CaptureRadius = 9, -- bring the flag this close to your own base to score
	ReturnTime = 20, -- a dropped flag goes home by itself after this long
	NeedOwnFlagHome = true, -- you can only score while your own flag is safe at your base
	CapturePoints = 150, -- individual points for a capture
	ReturnPoints = 30, -- ... and for returning your own dropped flag
	TakePoints = 20, -- ... and for taking the enemy flag
}

Config.Number = { Digits = 3, Min = 1, Max = 999, TagRange = 110, ShowOwn = true } -- ShowOwn: you can see your own number (HUD, and your own plate and floating tag), so you know what to hide -- shown with leading zeros: 007, 042, 512

-- Lives: a correct guess takes one life. You come back after a moment, protected, until your lives run out.
Config.Lives = {
	Start = 3,
	RespawnDelay = 3.0, -- you are frozen and glitching for this long, then you pop up somewhere else
	EliminatedDelay = 3, -- out of lives: after this long you are sent back to the lobby (and spectate from there)
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
	Stun = 1.5, -- a wrong guess freezes you for this long
	Bullets = 5,
	BulletRegen = 25, -- seconds to get one bullet back
	KillBullets = 2, -- bullets back for a successful guess
	WarnTime = 4, -- how long the guessed player sees "someone guessed you" with an arrow
	AutoSubmit = true, -- true = the guess is sent the moment you type the third digit; false = you press CONFIRM (or Enter)
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

-- Idle camping: staying inside a small circle for too long. Walking out of the circle (even just a few steps) resets it,
-- so this only catches people who really sit still. Capture-the-flag defenders next to their own flag are never counted.
Config.Camp = {
	Radius = 7, -- studs: you count as "in the same spot" while you stay this close to where you started waiting
	WarnAfter = 25, -- seconds in one spot before the warning appears
	Limit = 40, -- seconds in one spot before you are exposed
	Expose = 15, -- seconds your plate glows red and a marker shows over your head
	RepeatBonus = 0.5, -- each earlier violation makes the exposure this much longer
	BaseExempt = 30, -- capture the flag: staying this close to your own flag is allowed
}

-- Server-side movement check: the server compares where a player is now with where it saw them last. Anybody who
-- moves much further than their speed allows (teleport / speed hacks) is put back where they were.
Config.Sanity = {
	Enabled = true,
	SpeedSlack = 1.5, -- allowed distance = speed x time x this (lag makes players "catch up")
	Slack = 8, -- ... plus this many studs, so small jolts and pushes are never punished
	MaxDt = 1.5, -- at most this many seconds of movement are credited at once (after a lag spike)
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
	{ Id = "distraction", Name = "Distraction Grenade", Icon = "🔔", Key = 5, Start = 1, Max = 2, Weight = 16, Cooldown = 6, Tip = "Throw it: fake footsteps for 8s. Bots (and people) go to check." },
	{ Id = "scanner", Name = "Scanner", Icon = "📡", Key = 6, Start = 1, Max = 3, Weight = 16, Cooldown = 8, Tip = "Pings people nearby: you see where they are, never their number." },
	{ Id = "sprint", Name = "Sprint Boost", Icon = "👟", Key = 7, Start = 1, Max = 2, Weight = 16, Cooldown = 12, Tip = "Run much faster for 5 seconds." },
	{ Id = "decoy", Name = "Decoy", Icon = "🎭", Key = 8, Start = 1, Max = 2, Weight = 14, Cooldown = 10, Tip = "Drops a copy of you wearing a fake number for 30s. Your real number never changes." },
}
Config.ItemById = {}
Config.ItemOrder = {}
for _, item in Config.Items do
	Config.ItemById[item.Id] = item
	table.insert(Config.ItemOrder, item.Id)
end
Config.CarriedItems = { "flash", "smoke", "distraction", "scanner", "sprint", "decoy" }

Config.Flash = { Radius = 80, Fuse = 1.6, MaxBlind = 6.5, MinBlind = 1.2, ThrowSpeed = 55, ThrowUp = 22 }
Config.Smoke = { Radius = 9, Duration = 15, Fuse = 1.3, Fade = 3 }
Config.Sprint = { Speed = 28, Duration = 5 }
Config.Decoy = { Duration = 30, Stun = 4 } -- how long the copy stays; how long someone who shoots it is frozen
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

-- Third person with mouse-wheel zoom (0.5 = first person, 30 = far away). Occlusion "Zoom" pulls the camera in when a wall is in
-- the way (so it never clips); "Invisicam" instead makes walls see-through. Set FirstPerson = true to lock first person in matches.
Config.Camera = { FirstPerson = false, MinZoom = 0.5, MaxZoom = 30, Occlusion = "Zoom" }

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
Config.Rewards = { Coins = { Play = 15, PerPoint = 0.1, Win = 60 }, XP = { Play = 20, PerPoint = 0.15, Win = 50 }, Streak = { Step = 0.25, Max = 4 } } -- win streak: each extra win in a row adds Step to the reward multiplier (up to Max extra)
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
	BlockCenters = { -86, 0, 86 },
	Lobby = Vector3.new(0, 0, 420), -- the lobby island is far away from the arena
}
-- The 4 corner blocks each hold a hollow 44x44 building you can walk into (doors, a staircase up to a balcony, a ladder to the roof).
-- The 4 middle-edge blocks are open courtyards with container cover and an elevated walkway.
Config.Map.Plan = {
	Height = 18, -- walls and roof of the buildings
	Wall = 2,
	Door = 10, -- doorway width and height (a character is about 2 wide and 5 tall)
	DoorHeight = 10,
	Mezz = 9, -- height of the balcony floor
	MezzDepth = 12, -- how far the balcony reaches into the room, and how long the staircase is
	Steps = 9, -- the staircase has this many steps, each Rise high (so Steps * Rise = Mezz)
	Rise = 1,
	StairWidth = 6,
	DeckHeight = 9, -- the courtyards' elevated walkway
	DeckLength = 32,
	DeckWidth = 6,
}
Config.Map.Buildings = {
	{ X = -86, Z = -86, Size = 44, Name = "ARCADE", Color = C(255, 70, 150), Trim = C(90, 230, 255) },
	{ X = -86, Z = 86, Size = 44, Name = "PIZZA", Color = C(255, 150, 40), Trim = C(255, 245, 120) },
	{ X = 86, Z = -86, Size = 44, Name = "BOWL", Color = C(40, 180, 230), Trim = C(255, 120, 200) },
	{ X = 86, Z = 86, Size = 44, Name = "SYNTH", Color = C(140, 90, 255), Trim = C(120, 255, 190) },
}
Config.Map.Courtyards = {
	{ X = -86, Z = 0, Name = "MARKET WEST" },
	{ X = 86, Z = 0, Name = "MARKET EAST" },
	{ X = 0, Z = -86, Name = "DOCKS NORTH" },
	{ X = 0, Z = 86, Name = "DOCKS SOUTH" },
}
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
-- the CTF bases (the flag stands in the middle of each courtyard, under the walkway)
Config.Map.Bases = { [1] = Vector3.new(-86, 0, 0), [2] = Vector3.new(86, 0, 0) }
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
-- Map themes. The game ships on "canyon" (Waterfall Canyon, see Canyon.luau); "city" is the old Plaza Park. Config.Map.use(theme)
-- switches the positions that depend on the map (spawns, bases, terminals, drop spots, crates) and the world builder follows.
--------------------------------------------------------------------------------
do
	local Canyon = require(script.Parent:WaitForChild("Canyon"))
	local function toVectors(list, y)
		local out = {}
		for _, p in list do
			table.insert(out, Vector3.new(p[1], y, p[2]))
		end
		return out
	end
	Config.Map.Themes = {
		city = {
			Spawns = Config.Map.Spawns,
			Bases = Config.Map.Bases,
			Terminals = Config.Map.Terminals,
			DropSpots = Config.Map.DropSpots,
			Crates = Config.Map.Crates,
		},
		canyon = {
			Spawns = toVectors(Canyon.Spawns, 3.5),
			Bases = { [1] = Vector3.new(Canyon.Bases[1][1], 0, Canyon.Bases[1][2]), [2] = Vector3.new(Canyon.Bases[2][1], 0, Canyon.Bases[2][2]) },
			Terminals = toVectors(Canyon.Terminals, 2),
			DropSpots = toVectors(Canyon.DropSpots, 0),
			Crates = toVectors(Canyon.Crates, 1.5),
		},
	}
	function Config.Map.use(theme)
		local t = Config.Map.Themes[theme]
		assert(t, "unknown map theme " .. tostring(theme))
		Config.Map.Theme = theme
		for k, v in t do
			Config.Map[k] = v
		end
	end
	Config.Map.use("canyon")
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
-- Colour grading. The screen's look changes with the moment, to keep it lively and the eyes interested:
--   lobby   warm golden afternoon (calm, inviting)      play    bright and vivid (clear to read, rich colours)
--   final   the last seconds: punchier, warmer, pulsing  results celebratory (extra colour, extra glow)
-- Clock = time of day, Brightness = sun strength, Saturation/Contrast/Shift = colour correction (Shift is a small brightness
-- nudge), Tint = overall colour cast, Bloom = glow on bright things. The client blends smoothly from one look to the next.
Config.Look = {
	Speed = 1.4, -- how fast it blends (bigger = quicker)
	lobby = { Clock = 16.2, Brightness = 2.2, Saturation = 0.24, Contrast = 0.10, Shift = 0.0, Tint = C(255, 238, 216), Bloom = 0.34 },
	play = { Clock = 14.0, Brightness = 2.4, Saturation = 0.20, Contrast = 0.14, Shift = 0.0, Tint = C(247, 252, 255), Bloom = 0.22 },
	final = { Clock = 13.2, Brightness = 2.35, Saturation = 0.30, Contrast = 0.22, Shift = -0.02, Tint = C(255, 232, 222), Bloom = 0.30, Pulse = 0.035 },
	results = { Clock = 15.4, Brightness = 2.3, Saturation = 0.34, Contrast = 0.12, Shift = 0.02, Tint = C(255, 244, 226), Bloom = 0.42 },
}

-- Waterfall Canyon: how fast the ripple patterns slide (screens per second; flip the sign if they run the wrong way).
Config.Water = { FallSpeed = 0.9, RiverSpeed = -0.25, PushScale = 1, HighAbove = 9 } -- PushScale: how strong the current is (1 = normal, 0 = off). HighAbove: above this height you are on a bridge or rock, not in the water.
Config.Sounds.Waterfall = "" -- optional looping waterfall sound: put an asset id from the Creator Store here
Config.MusicTrackId = "" -- optional looping song id; empty = generated music
Config.MusicVolume = 0.2
Config.SfxVolume = 0.85

return Config

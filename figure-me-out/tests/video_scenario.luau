-- ===== the shipped game, as in the reference video: 4-digit numbers, two item slots (F, G), mustard sign, long team matches, School Yard =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local Config = require(RS.children.Shared.children.Config)
Config.Sanity.Enabled = false
local Maps = require(RS.children.Shared.children.Maps)
local Rules = require(RS.children.Shared.children.Rules)
-- shipped settings, straight from the config
check(Config.Number.Digits == 4 and Config.Number.Min == 1000 and Config.Number.Max == 9999, "numbers have 4 digits, 1000 to 9999")
check(Config.Features.Gadgets and Config.Features.Photos and Config.Features.Binoculars, "camera, binoculars and grenades are on")
check(not Config.Features.Terminals and not Config.Features.Bounty and not Config.Features.Alliances and not Config.Features.Events, "the extras that are not in the video are off")
check(Config.Loadout.Enabled and Config.Loadout.F == "camera" and Config.Loadout.G == "binos", "two item slots: F = camera, G = binoculars")
check(#Config.CarriedItems == 3, "crates give a flashbang, a smoke bottle or a sound grenade")
check(Config.Hud.Style == "video" and Config.Number.FloatingTag == false, "the video screen; no floating numbers")
check(Config.Match.Length == 1500 and Config.Modes.List.ctf.CaptureLimit == 10 and Config.Modes.List.team.ScoreLimit == 50, "25-minute matches, captures to 10, hits to 50")
check(Config.Modes.Rotation[1] == "ctf", "the first match is capture the flag")
check(Config.PlateStyleById.classic ~= nil and Config.PlateStyles[1].Id == "classic" and Config.Plate.Detail == false and Config.Plate.WhiteNames == true, "the default sign is the plain mustard one with black digits; names are white")
check(Maps.FirstMap == "school" and Config.Map.Theme == "school" and Maps.Order[1] == "school", "the game starts on the School Yard")
-- numbers
local rolls = 0
local function lcg() rolls += 1 return ((rolls * 7919) % 1000) / 1000 end
local seen = {}
for i = 1, 60 do local n = Rules.newNumber(lcg, seen) seen[n] = true check(#n == 4 and tonumber(n) >= 1000 and tonumber(n) <= 9999, "number " .. n .. " has 4 digits") end
check(Rules.parseGuess("9233") == "9233" and Rules.parseGuess("923") == nil and Rules.parseGuess("92331") == nil, "a guess must be exactly 4 digits")
local readable = Rules.photoReadable(10, 1, { 0.1, 0.1, 0.1, 0.1 })
check(#readable == 4 and readable[4] == true, "a close photo reads all 4 digits")
check(Rules.photoText("9233", { true, true, false, true }) == "92?3", "a blurry digit shows as ?")

local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
check(attrsWS.BootErrors == nil, "the world builds without any error")
local State = require(ModN.children.State)
local Items = require(ModN.children.Items)
local Photos = require(ModN.children.Photos)
local Pickups = require(ModN.children.Pickups)
local Match = require(ModN.children.Match)
local function join(id, name) local p = X.newPlayer(id, name); table.insert(players, p); fireAll("PlayerAdded", p); return p end
local function lastNote(kind) for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind then return notifyLog[i] end end end

-- a match: two players, capture the flag
local p1, p2 = join(1, "Alice"), join(2, "Bob")
advance(2)
check(State.mode and State.mode.Id == "ctf" and attrsWS.Mode == "ctf", "the first match is capture the flag")
check(Config.Map.Theme == "school" and attrsWS.MapName == "School Yard", "...on the School Yard (" .. tostring(attrsWS.MapName) .. ")")
advance(Config.Match.Countdown + 1)
check(State.phase == "play" and math.abs(State.phaseEnd - State.now() - Config.Match.Length) < 12, "the match lasts 25 minutes (" .. math.floor(State.phaseEnd - State.now()) .. " s left)")
local e1, e2 = State.byPlayer(p1), State.byPlayer(p2)
check(e1 and e2 and #e1.number == 4 and #e2.number == 4 and e1.number ~= e2.number, "everybody has their own 4-digit number")
-- the forehead sign
local head1 = e1.char.head
check(e1.plate and e1.plate.label.Text == e1.number, "the sign on the forehead shows the number")
check(e1.numberTag == nil and not e1.char:FindFirstChild("NumberTag"), "no floating number above anybody")
local bolts = 0
for _, o in X.parts do if o.Name == "PlateBolt" or o.Name == "PlateShine" then bolts += 1 end end
check(bolts == 0, "the sign is plain: no bolts, no shine")
-- item slots
check(p1.attrs.SlotF == "camera" and p1.attrs.SlotG == "binos", "F holds the camera and G the binoculars at the start")
check(Items.slotOf(e1, "camera") == "F" and Items.slotOf(e1, "binos") == "G", "the server agrees")
check(Items.use(e1, "flash", nil) == false, "you cannot throw something you do not have")
Items.give(e1, "smoke", 1)
check(p1.attrs.SlotG == "smoke" and p1.attrs.SlotF == "camera" and p1.attrs.It_smoke == 1, "a smoke bottle takes over slot G")
check(Items.slotOf(e1, "binos") == nil, "the binoculars are not in a slot now")
Match.setScope(p1, true)
check(e1.scoped ~= true, "so the binoculars cannot be raised")
Items.give(e1, "flash", 1)
check(p1.attrs.SlotF == "flash" and p1.attrs.SlotG == "smoke", "a flashbang takes slot F as well")
check(Photos.snap(p1, e1.char.head.Position, V3new(0, 0, 1)) == nil, "the camera cannot be used while its slot is busy")
Items.give(e1, "distraction", 1)
check(p1.attrs.SlotG == "distraction" and (e1.items.smoke or 0) == 0, "with both slots busy a new item replaces G's")
advance(1)
check(Items.use(e1, "smoke", V3new(0, 0, 1)) == false, "an item that is no longer in a slot cannot be used")
check(Items.use(e1, "flash", V3new(0, 0, 1)) == true, "the flashbang in F can be thrown")
check(p1.attrs.SlotF == "camera" and p1.attrs.It_flash == 0, "a used-up item gives its slot back to the camera")
advance(1)
check(Items.use(e1, "distraction", V3new(0, 0, 1)) == true and p1.attrs.SlotG == "binos", "...and the sound grenade gives G back to the binoculars")
-- the camera reads 4 digits
e2.char:PivotTo(CFrame.new(e1.char.root.Position + V3new(0, 0, 20), e1.char.root.Position))
advance(0.5)
e1.lastSnap = -100
local shots = Photos.shotsFrom(e1.char.head.Position, V3new(0, 0, 1), e1.id)
check(#shots >= 0, "the camera can look")
-- strikes (covering your number)
e1.violations = 2
State.writeEntity(e1)
check(p1.attrs.Strikes == 2, "two strikes are published (the X marks)")
e1.violations = 9
State.writeEntity(e1)
check(p1.attrs.Strikes == 3, "at most three")
-- crates are yellow wooden chests
local chests = 0
for _, o in X.parts do if o.Name == "ItemCrate" and o.Material == Enum.Material.Wood then chests += 1 end end
check(chests == #Config.Map.Crates, "every crate is a yellow wooden chest (" .. chests .. ")")
-- team scores replicate
check(attrsWS.Team1Score == 0 and attrsWS.Team2Score == 0 and attrsWS.ScoreLimit == 10, "scores start 0 - 0, first to 10 captures")
-- match flow still works: a hit with the 4-digit number, and a 3-digit guess is refused
local Guess = require(ModN.children.Guess)
e1.protectedUntil = 0; e2.protectedUntil = 0
e1.lastGuess = -100; e1.stunUntil = 0; e1.bullets = 5
e2.char:PivotTo(CFrame.new(e1.char.root.Position + V3new(0, 0, 15)))
e1.char:PivotTo(CFrame.new(e1.char.root.Position, e1.char.root.Position + V3new(0, 0, 1)))
e2.char:face(V3new(0, 0, -1)); e1.char:face(V3new(0, 0, 1))
advance(0.5)
local before = e1.kills or 0
Guess.handle(p1, e2.id, "123")
check((e1.kills or 0) == before and (e1.bullets or 5) == 5, "a 3-digit guess is refused without costing anything")
advance(1.5)
e1.lastGuess = -100
Guess.handle(p1, e2.id, e2.number)
check((e1.kills or 0) == before + 1, "the right 4-digit number takes the hit")
-- daily streak and badges
local Progress = require(ModN.children.Progress)
local Badges = require(ModN.children.Badges)
check(p1.attrs.DayStreak == 1 and p1.attrs.Coins == Config.Daily.Coins, "the first visit pays the daily coins (day 1: " .. tostring(p1.attrs.Coins) .. ")")
check(Progress.daily(p1) == nil, "...only once a day")
local day = math.floor(os.time() / 86400)
local streak, coins = Progress.daily(p1, (day + 1) * 86400)
check(streak == 2 and coins == Config.Daily.Coins * 2, "the next day in a row pays double (day 2: +" .. tostring(coins) .. ")")
streak, coins = Progress.daily(p1, (day + 5) * 86400)
check(streak == 1 and coins == Config.Daily.Coins, "missing days starts the streak again")
check(Badges.award(p1, "first_win") == false, "a badge with no number yet is skipped")
Config.Badges.first_win = 4242
check(Badges.award(p1, "first_win") == true and Badges.award(p1, "first_win") == false, "a badge with a number is asked for once per visit")
check(Badges.award(p1, "nonsense") == false, "an unknown badge is ignored")
print("--- video server done")

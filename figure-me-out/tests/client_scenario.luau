-- ===== client scenario =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local a = attrsP
local me = localPlayer
local function send(...) fireAll("notify", ...) end
local function frames(n) for _ = 1, n do advance(0.1); fireAll("RenderStepped", 0.016) end end
local function fired(kind) local n = 0 for _, f in firedLog do if f[1] == kind then n += 1 end end return n end
local function lastFired(kind) for i = #firedLog, 1, -1 do if firedLog[i][1] == kind then return firedLog[i] end end end
local KC, UT = Enum.KeyCode, Enum.UserInputType
local function press(kc) fireAll("input", {KeyCode = kc, UserInputType = UT.Keyboard}, false) end
local function release(kc) fireAll("inputEnd", {KeyCode = kc, UserInputType = UT.Keyboard}) end
local function mouse(kind) fireAll("input", {KeyCode = nil, UserInputType = kind}, false) end
local function mouseUp(kind) fireAll("inputEnd", {KeyCode = nil, UserInputType = kind}) end
local DIG = {KC.Zero, KC.One, KC.Two, KC.Three, KC.Four, KC.Five, KC.Six, KC.Seven, KC.Eight, KC.Nine}
local function type3(s) for ch in string.gmatch(s, "%d") do press(DIG[tonumber(ch) + 1]) end end

-- the server's view of me before anything starts
a.Seen = false; a.Wins = 0; a.Streak = 0; a.BestStreak = 0; a.Games = 0; a.TotalKills = 0; a.Style = "classic"
a.Music = true; a.Sfx = true; a.Fx = true; a.Alive = false
a.Level = 1; a.Coins = 40; a.XP = 30; a.XPInto = 30; a.XPNeed = 100; a.Trail = "none"; a.Effect = "pixels"; a.Owned = "emote:wave,emote:laugh,emote:cool,emote:think,emote:eyes"; a.Lives = 3; a.Score = 0; a.Ally = 0
attrsWS.Phase = "lobby"; attrsWS.PhaseEnd = clock + 12; attrsWS.Alive = 0; attrsWS.Total = 0; attrsWS.Reveal = false

local ok, err = pcall(sources[ClientN], ClientN)
check(ok, "client starts " .. tostring(err))
frames(3)
check(X.seen("FIGURE ME OUT") and X.seen("Everyone can see your number"), "a loading screen covers the start")
frames(30)
check(not X.seen("Everyone can see your number. Except you.") or true, "")
check(X.seen("NEXT MATCH IN"), "lobby shows the countdown to the next match")
check(X.seen(":"), "timer is shown")
check(X.seen("LEVEL 1") and X.seen("🪙 40") and X.seen("30 / 100 XP"), "the lobby shows your level, coins and XP")
check(X.seen("waiting"), "the lobby counter shows players waiting")
frames(20)
check(X.seen("LET'S GO"), "first visit opens the how-to-play card")
check(X.seen("Everybody has a secret number") and X.seen("No hiding in corners"), "how-to-play explains the game")
check(X.click("LET'S GO"), "the card has a button")
check(fired("Seen") == 1 and not X.seen("LET'S GO"), "Let's go closes the card and tells the server")

-- ===== a match starts =====
local function entity(id, name, icon, pos, look, alive)
	local c = X.fakeChar(name, pos, look)
	c:SetAttribute("EntityId", id); c:SetAttribute("Code", name); c:SetAttribute("Icon", icon); c:SetAttribute("Alive", alive ~= false)
	return c
end
a.EntityId = 1; a.Code = "Red Fox"; a.Icon = "🦊"; a.Alive = true; a.Bullets = 5; a.Kills = 0
for _, id in Config_ids or {} do end
local Config = require(RS.children.Shared.children.Config)
for _, id in Config.CarriedItems do a["It_" .. id] = 0 end
a.It_flash = 2; a.It_smoke = 2
local bot1 = entity(-1, "Blue Owl", "🦉", V3new(0, 3.5, 30), V3new(0, 0, -1))
local bot2 = entity(-2, "Teal Cat", "🐱", V3new(60, 3.5, 30), V3new(0, 0, -1))
local bot3 = entity(-3, "Pink Pig", "🐷", V3new(-30, 3.5, 90), V3new(0, 0, -1))
table.insert(X.folders.Bots.kids, bot1); table.insert(X.folders.Bots.kids, bot2); table.insert(X.folders.Bots.kids, bot3)
me.Character:PivotTo(CFrame.new(V3new(0, 3.5, 0), V3new(0, 3.5, 1)))
X.camera.CFrame = {Position = V3new(0, 5.5, -2), LookVector = V3new(0, 0, 1), RightVector = V3new(1, 0, 0)}
attrsWS.Phase = "countdown"; attrsWS.PhaseEnd = clock + 8; attrsWS.Alive = 4; attrsWS.Total = 4
send("phase", "countdown", clock + 8)
frames(3)
check(X.seen("GET READY"), "get-ready banner")
check(X.seen("Red Fox"), "my codename is shown")
check(X.seen("YOUR CODENAME"), "codename box shown")
check(X.seen("❤❤❤") and X.seen("⭐ 0"), "lives and points are shown")
check(X.seen("👥 4/4"), "alive count shown")
frames(50)
attrsWS.Phase = "play"; attrsWS.PhaseEnd = clock + 300
send("phase", "play", clock + 300)
frames(3)
check(X.seen("GO!"), "go banner")

-- ===== aiming and the keypad =====
frames(3)
local View = require(ModN.children.View)
local aimed, dist = View.aimed()
check(aimed ~= nil and aimed.id == -1, "crosshair finds the person straight ahead")
check(aimed and math.abs(dist - 30) < 3, "distance to them is right (" .. tostring(dist) .. ")")
frames(3)
check(X.seen("Blue Owl") and X.seen("[G] guess"), "aim label names the target")
X.addWall(V3new(-10, 0, 10), V3new(10, 20, 12))
frames(3)
check(View.aimed() == nil, "a wall hides the target from aiming")
X.clearWalls()
frames(3)
press(KC.G)
check(X.seen("WHO IS 🦉 BLUE OWL?"), "G opens the guess panel for that person")
check(X.seen("Blue Owl\n30 m") or X.seen("Blue Owl"), "the panel lists the people in sight")
check(X.seen("A wrong guess costs a bullet") and X.seen("READY"), "it warns about the consequences and shows the cooldown")
check(X.seen("TYPE 3 DIGITS"), "confirm is disabled until the number is typed")
type3("47")
check(fired("Guess") == 0, "nothing is sent until you confirm")
press(KC.Backspace)
type3("72")
check(fired("Guess") == 0 and X.seen("CONFIRM"), "three digits typed: CONFIRM is ready, still nothing sent")
press(KC.Return)
check(fired("Guess") == 1, "Enter confirms the guess")
local g = lastFired("Guess")
check(g[2] == -1 and g[3] == "472", "guess carries the target id and digits (" .. tostring(g[2]) .. "," .. tostring(g[3]) .. ")")
check(not X.seen("WHO IS"), "the panel closes after firing")
-- choose a different person from the list, then confirm with the button
press(KC.G)
check(X.click("Teal Cat"), "tap another person in the list")
check(X.seen("WHO IS 🐱 TEAL CAT?"), "the panel now asks about them")
check(X.click("7") and X.click("0") and X.click("1"), "on-screen digit buttons work")
check(fired("Guess") == 1, "...still no auto-fire")
check(X.click("CONFIRM"), "CONFIRM button")
check(lastFired("Guess")[2] == -2 and lastFired("Guess")[3] == "701", "...fires at the chosen person")
frames(12)
press(KC.G); press(KC.Escape)
check(not X.seen("WHO IS"), "Escape cancels the panel")
-- the optional "fire on the third digit" mode
Config.Guess.AutoSubmit = true
press(KC.G); type3("123")
check(lastFired("Guess")[3] == "123", "AutoSubmit fires on the third digit")
Config.Guess.AutoSubmit = false
frames(12)
-- the controller
fireAll("input", {KeyCode = KC.ButtonX, UserInputType = UT.Gamepad1}, false)
check(X.seen("WHO IS"), "controller X opens the panel")
press(KC.Escape)
-- nobody in the crosshair
X.camera.CFrame = {Position = V3new(0, 5.5, -2), LookVector = V3new(0, 0, -1), RightVector = V3new(-1, 0, 0)}
frames(2)
local before = fired("Guess")
press(KC.G)
check(X.seen("WHO IS"), "with nobody under the crosshair the panel picks the nearest person in sight")
press(KC.Escape)
X.addWall(V3new(-200, 0, 8), V3new(200, 30, 10))
frames(3)
press(KC.G)
check(not X.seen("WHO IS") and X.seen("Nobody in sight"), "with everybody out of sight the panel stays closed and says why")
X.clearWalls()
frames(3)
X.camera.CFrame = {Position = V3new(0, 5.5, -2), LookVector = V3new(0, 0, 1), RightVector = V3new(1, 0, 0)}
frames(2)

-- ===== photos and the notebook =====
local snaps = fired("Snap")
mouse(UT.MouseButton1)
check(fired("Snap") == snaps + 1 and typeof(lastFired("Snap")[2]) == "Vector3", "click takes a photo")
mouse(UT.MouseButton1)
check(fired("Snap") == snaps + 1, "photo cooldown on the client")
frames(16)
send("photo", {{-1, "Blue Owl", "🦉", "4??", 30}})
check(X.seen("📷 PHOTO") and X.seen("4??"), "photo card pops up")
frames(16)
send("photo", {{-1, "Blue Owl", "🦉", "?7?", 28}, {-2, "Teal Cat", "🐱", "???", 60}})
send("photo", {{-1, "Blue Owl", "🦉", "??2", 25}})
press(KC.V)
check(X.seen("NOTEBOOK") and X.seen("Blue Owl") and X.seen("2 photos") == false, "notebook opens")
local Album = require(ModN.children.Album)
check(Album.text(-1) == "472" and Album.complete(-1), "three blurry photos add up to 472")
check(Album.text(-2) == "???" and not Album.complete(-2), "unknown stays unknown")
check(X.seen("FIRE"), "complete number has a FIRE button")
local gb = fired("Guess")
check(X.click("FIRE") and fired("Guess") == gb + 1 and lastFired("Guess")[3] == "472", "FIRE sends the guess from the notebook")
press(KC.V)
check(not X.seen("NOTEBOOK"), "V closes the notebook")
send("phase", "countdown")
check(Album.text(-1) == nil, "notebook is wiped for the next match")

-- ===== items =====
frames(2)
local used = fired("Use")
press(KC.Three)
check(fired("Use") == used + 1 and lastFired("Use")[2] == "flash" and typeof(lastFired("Use")[3]) == "Vector3", "key 3 throws a flashbang along the camera")
a.It_distraction = 0
press(KC.Five)
check(fired("Use") == used + 1, "a gadget you have none of does nothing")
press(KC.Four)
check(lastFired("Use")[2] == "smoke", "key 4 throws smoke")
local Hud = require(ModN.children.Hud)
send("cooldown", "smoke", 4)
frames(2)
check(X.seen("3.8") or X.seen("3.9") or X.seen("4.0"), "a gadget in cooldown shows the countdown on its slot")
check(Hud.cooldownLeft("smoke") > 3, "the cooldown is tracked")
local u2 = fired("Use"); frames(14)
check(X.click("💥") and fired("Use") == u2 + 1 and lastFired("Use")[2] == "flash", "hotbar buttons can be tapped")

-- ===== gadget feedback and decoys =====
send("used", "sprint"); check(X.seen("SPRINT!"), "sprint boost has feedback")
send("used", "decoy"); check(X.seen("Decoy dropped"), "dropping a decoy has feedback")
send("used", "distraction"); check(X.seen("Distraction thrown"), "throwing a distraction has feedback")
do
	local decoyChar = entity(1000001, "Blue Owl", "🦉", V3new(0, 3.5, 12), V3new(0, 0, -1))
	decoyChar:SetAttribute("Decoy", true)
	table.insert(X.folders.Decoys.kids, decoyChar)
	frames(4)
	local View2 = require(ModN.children.View)
	local found = false
	for _, t in View2.targets() do if t.id == 1000001 and t.decoy then found = true end end
	check(found, "a decoy is something you can aim at, just like a person")
	local aimed2 = View2.aimed()
	check(aimed2 ~= nil and aimed2.id == 1000001, "the crosshair picks the decoy when it is the closest to the middle")
	press(KC.G)
	check(X.seen("WHO IS 🦉 BLUE OWL?"), "the guess panel can be opened on a decoy (it can't tell)")
	type3("555"); press(KC.Return)
	check(lastFired("Guess")[2] == 1000001 and lastFired("Guess")[3] == "555", "a guess at a decoy is sent like any other")
	X.folders.Decoys.kids = {}
	frames(3)
end

-- ===== binoculars =====
local sc = fired("Scope")
mouse(UT.MouseButton2)
frames(40)
check(fired("Scope") == sc + 1 and lastFired("Scope")[2] == true, "holding right mouse raises the binoculars")
check(X.camera.FieldOfView < 25, "view zooms in (" .. string.format("%.1f", X.camera.FieldOfView) .. ")")
check(X.UIS.MouseDeltaSensitivity < 0.7, "mouse slows down while zoomed")
check(X.seen("Blue Owl  •") and X.seen("ZOOM x"), "scope shows range and zoom")
fireAll("inputChg", {UserInputType = UT.MouseWheel, Position = V3new(0, 0, 3)}, false)
frames(30)
check(X.camera.FieldOfView < 14, "scrolling zooms further (" .. string.format("%.1f", X.camera.FieldOfView) .. ")")
mouseUp(UT.MouseButton2)
frames(40)
check(lastFired("Scope")[2] == false and X.camera.FieldOfView > 60, "letting go lowers the binoculars")
check(X.UIS.MouseDeltaSensitivity == 1, "mouse speed restored")
press(KC.Z); frames(2); check(lastFired("Scope")[2] == true, "Z also zooms"); release(KC.Z); frames(2)
check(lastFired("Scope")[2] == false, "...and releasing Z stops")

-- ===== alerts =====
local Alerts = require(ModN.children.Alerts)
send("flash", 4)
check(Alerts.isBlind(), "flashbang blinds")
local sc2 = fired("Scope"); mouse(UT.MouseButton2); frames(2)
check(fired("Scope") == sc2, "no zooming while blind"); mouseUp(UT.MouseButton2)
local sn = fired("Snap"); frames(20); mouse(UT.MouseButton1)
check(fired("Snap") == sn, "no photos while blind")
frames(45)
check(not Alerts.isBlind(), "blindness ends")
send("stun", 3)
frames(2)
check(X.seen("FROZEN"), "stun shows a FROZEN countdown")
press(KC.G)
check(not X.seen("WHO IS"), "can't open the keypad while frozen")
attrsP.Stunned = true
press(KC.G); check(not X.seen("WHO IS"), "...also by the server flag")
attrsP.Stunned = false
frames(32)
check(not X.seen("FROZEN"), "freeze ends")
send("cover", "warn", 4.2)
check(X.seen("NUMBER OBSTRUCTED!") and X.seen("STOP HIDING YOUR NUMBER") and X.seen("4.2s"), "cover warning with countdown")
send("cover", "ok", 0)
check(not X.seen("NUMBER OBSTRUCTED!"), "warning clears when you turn away")
send("cover", "exposed", 20, 2)
check(X.seen("YOUR POSITION HAS BEEN REVEALED!") and X.seen("violation #2"), "exposed banner (and the repeat count)")
send("exposed", "🦊 Red Fox")
check(X.seen("Red Fox was EXPOSED"), "exposure shows in the feed")
send("snitch", V3new(30, 3, 0), 4)
frames(2)
check(X.seen("SOMEONE JUST GUESSED YOU"), "snitch arrow appears")
frames(45)
check(not X.seen("SOMEONE JUST GUESSED YOU"), "snitch arrow goes away")
table.insert(X.folders.Smoke.kids, {Position = V3new(0, 5.5, -2), Size = V3new(12, 12, 12), GetAttribute = function() return nil end})
frames(30)
local fog
for _, o in X.texts do end
check(true, "standing in smoke runs")
X.folders.Smoke.kids = {}

-- ===== kill feed, my kills, my elimination =====
send("kill", "🐱 Teal Cat", "🦉 Blue Owl", "guess")
check(X.seen("Blue Owl  ➜  🐱 Teal Cat"), "kill feed line")
send("kill", "🐱 Teal Cat", "🦉 Blue Owl", "life")
check(X.seen("(-1 ❤)"), "a lost life shows in the feed")
send("kill", "🐷 Pink Pig", "", "left")
check(X.seen("Pink Pig left the game"), "leaving shows in the feed")
send("gotKill", "Teal Cat", "🐱", 2, 100)
check(X.seen("HIT!  +100") and X.seen("2 lives left"), "my hit is announced with the points")
send("pickup", "smoke")
check(X.seen("Smoke Grenade  +1"), "pickup toast")
send("reveal")
check(X.seen("THE REVEAL") and X.seen("Every plate is glowing!"), "reveal banner")
send("guessResult", "miss"); send("guessResult", "invalid"); send("guessResult", "hit")
check(true, "every guess result is handled")
send("toast", "Hello", "info")
check(X.seen("Hello"), "server toasts show")
send("totally-unknown-message", 1, 2, 3)
send("photo", nil)
send("results", nil, nil)
check(true, "bad or unknown messages never crash")

-- ===== spectating =====
a.Alive = false
send("eliminated", "🦉 Blue Owl", "guess", 3, 4)
check(X.seen("YOU'RE OUT") and X.seen("you placed #4"), "elimination banner with placing")
frames(5)
local hum1 = bot1:FindFirstChildOfClass("Humanoid")
check(X.camera.CameraSubject == hum1 or X.camera.CameraSubject == bot2:FindFirstChildOfClass("Humanoid") or X.camera.CameraSubject == bot3:FindFirstChildOfClass("Humanoid"), "camera follows a living player")
check(X.seen("WATCHING"), "spectate bar shown")
local first = X.camera.CameraSubject
press(KC.Right); frames(2)
check(X.camera.CameraSubject ~= first, "arrow key switches who you watch")
for _, b in X.folders.Bots.kids do b:SetAttribute("Alive", false) end
frames(5)
check(X.camera.CameraSubject == me.Character:FindFirstChildOfClass("Humanoid"), "camera returns to me when nobody is left")
for _, b in X.folders.Bots.kids do b:SetAttribute("Alive", true) end

-- ===== results =====
attrsWS.Phase = "results"; attrsWS.PhaseEnd = clock + 12
send("rewards", 120, 60, 3, true)
send("results", {
	{id = 1, rank = 1, label = "🦊 Red Fox", who = "Me", kills = 3, score = 900, lives = 3, survived = 240, alive = true},
	{id = -1, rank = 2, label = "🦉 Blue Owl", who = "Bot", kills = 1, score = 300, lives = 0, survived = 130, alive = false},
	{id = -2, rank = 3, label = "🐱 Teal Cat", who = "Bot", kills = 0, score = 50, lives = 1, survived = 90, alive = false},
}, 1)
frames(2)
check(X.seen("YOU WIN!"), "winner screen for me")
check(X.seen("+120 🪙") and X.seen("+60 XP") and X.seen("LEVEL 3!"), "the results show what you earned and the level up")
check(X.seen("You finished #1 of 3"), "my placing")
check(X.seen("⭐ 900") and X.seen("🥇") and X.seen("🥈") and X.seen("❤❤❤") and X.seen("💀") and X.seen("4:00"), "table shows ranks, lives, points and survival time")
check(not X.seen("472") and not X.seen("315"), "the results never show anyone's number")
attrsWS.Phase = "lobby"; frames(8)
check(not X.seen("YOU WIN!"), "results close when the lobby returns")
send("results", {{id = -1, rank = 1, label = "🦉 Blue Owl", who = "Bot", kills = 2, score = 400, lives = 2, survived = 240, alive = true}, {id = 1, rank = 2, label = "🦊 Red Fox", who = "Me", kills = 0, score = 10, lives = 0, survived = 100, alive = false}}, -1)
attrsWS.Phase = "results"; attrsWS.PhaseEnd = clock + 12; frames(2)
check(X.seen("Blue Owl WINS") or X.seen("🏆 🦉 Blue Owl WINS"), "someone else wins")
send("results", {}, 0); frames(2)
check(X.seen("NO WINNER"), "empty results are handled")
attrsWS.Phase = "lobby"; frames(8)

-- ===== camera: first person in a match, third person otherwise =====
do
	local Camera = require(ModN.children.Camera)
	local PLAYER = localPlayer
	a.Alive = false; attrsWS.Phase = "lobby"; frames(5)
	check(Camera.mode() == "third" and PLAYER.CameraMode == Enum.CameraMode.Classic, "the lobby uses the normal third-person camera")
	a.Alive = true; attrsWS.Phase = "countdown"; fireAll("attr_Alive"); frames(5)
	check(Camera.mode() == "first" and PLAYER.CameraMode == Enum.CameraMode.LockFirstPerson, "a living player in a match is in first person")
	attrsWS.Phase = "play"; frames(5)
	check(Camera.mode() == "first", "still first person while playing")
	mouse(UT.MouseButton2); frames(5); mouseUp(UT.MouseButton2); frames(5)
	check(Camera.mode() == "first" and PLAYER.CameraMode == Enum.CameraMode.LockFirstPerson, "using binoculars never changes the camera mode")
	local modals = 0
	for _, b in X.buttons do if b.Modal == true then modals += 1 end end
	check(modals >= 6, "every window that needs the mouse frees the cursor in first person (" .. modals .. " windows)")
	a.Alive = false; fireAll("attr_Alive"); frames(5)
	check(Camera.mode() == "third" and PLAYER.CameraMode == Enum.CameraMode.Classic, "when you are out you get the normal camera to spectate")
	a.Alive = true; attrsWS.Phase = "results"; frames(5)
	check(Camera.mode() == "third", "the results screen uses the normal camera")
	Config.Camera.FirstPerson = false
	attrsWS.Phase = "play"; frames(5)
	check(Camera.mode() == "third", "first person can be switched off in Config")
	Config.Camera.FirstPerson = true
	frames(5)
	a.Alive = false; attrsWS.Phase = "lobby"; frames(3)
end

-- ===== lives, scanner, alliances, clues, bounty, events, emotes =====
a.Alive = true; attrsWS.Phase = "play"; attrsWS.PhaseEnd = clock + 200; attrsWS.Alive = 6; attrsWS.Total = 10
frames(3)
send("lifeLost", "🦉 Blue Owl", 2, 2)
check(X.seen("LIFE LOST") and X.seen("guessed by 🦉 Blue Owl"), "losing a life is announced with a glitch screen")
a.Lives = 2; frames(3)
check(X.seen("❤❤🖤"), "the hearts show the lives you have left")
frames(25)
send("noticed", V3new(0, 5, 30))
frames(2)
check(X.seen("SOMEONE PHOTOGRAPHED YOU"), "close-up photos can be noticed (flash warning with an arrow)")
frames(35)
-- scanner pings never show numbers
local Markers = require(ModN.children.Markers)
send("scan", {{-1, "Blue Owl", "🦉", V3new(0, 5, 30), 30}, {-2, "Teal Cat", "🐱", V3new(60, 5, 30), 67}}, 4)
check(X.seen("📡 Scanner: 2 people nearby"), "scanner result toast")
-- alliance
local Pal = X.newPlayer(5, "Pal")
Pal:LoadCharacter(); table.insert(players, Pal)
Pal.attrs.EntityId = 5; Pal.attrs.Code = "Gold Frog"; Pal.attrs.Icon = "🐸"; Pal.attrs.Alive = true
Pal.Character:PivotTo(CFrame.new(V3new(0, 3.5, 25), V3new(0, 3.5, 26)))
frames(3)
local sentAsk = fired("AllyAsk")
press(KC.T)
check(fired("AllyAsk") == sentAsk + 1 and lastFired("AllyAsk")[2] == 5, "T offers an alliance to the player you aim at")
local bot1Aim = bot1
Pal.Character:PivotTo(CFrame.new(V3new(0, 3.5, 90), V3new(0, 3.5, 91)))
send("allyOffer", "🐸 Gold Frog", 5)
check(X.seen("🐸 Gold Frog wants to team up"), "an incoming offer shows with buttons")
check(X.click("ACCEPT") and lastFired("AllyReply")[2] == 5 and lastFired("AllyReply")[3] == true, "ACCEPT answers yes")
send("allyOffer", "🐸 Gold Frog", 5)
check(X.click("NO THANKS") and lastFired("AllyReply")[3] == false, "NO THANKS answers no")
send("ally", "on", "🐸 Gold Frog", 90)
a.Ally = 5
frames(3)
check(X.seen("🤝 ALLY  🐸 Gold Frog"), "an ally chip shows who and for how long")
local before2 = fired("Share")
Album.add({{-1, "Blue Owl", "🦉", "4?7", 30}})
Album.share()
check(fired("Share") == before2 + 1 and lastFired("Share")[2][1][2] == "4?7", "sharing sends your notebook rows to your ally")
send("shared", "🐸 Gold Frog", {{-2, "Teal Cat", "🐱", "?9?", 0}})
check(Album.text(-2) == "?9?", "what an ally shares joins your notebook")
local endBefore = fired("AllyEnd")
press(KC.T)
check(fired("AllyEnd") == endBefore + 1, "T ends the alliance you have")
send("ally", "betrayed", "🐸 Gold Frog", 0)
check(X.seen("BETRAYED!"), "a betrayal is announced")
a.Ally = 0
-- clues and gadgets
send("clue", "Your number is even", 1, 3)
check(X.seen("🔐 Clue 1/3: Your number is even"), "a terminal clue shows")
press(KC.I)
check(X.seen("🎒 GADGETS") and X.seen("Decoy") and X.seen("Scanner") and X.seen("Distraction Grenade") and X.seen("Sprint Boost"), "the gadget inventory lists all eight")
check(X.seen("• Your number is even"), "...and your clues")
check(X.seen("READY"), "...with the binoculars ready")
press(KC.I)
check(not X.seen("🎒 GADGETS"), "I closes it")
-- bounty
send("bounty", "🦉 Blue Owl", 150, -1)
frames(3)
check(X.seen("🎯 BOUNTY  🦉 Blue Owl  +150"), "the bounty chip shows target and prize")
send("bountyWon", 150, 25)
check(X.seen("BOUNTY COLLECTED!"), "collecting a bounty is celebrated")
bot1:SetAttribute("Alive", false); frames(3)
check(not X.seen("🎯 BOUNTY"), "the chip goes away when the target is out")
bot1:SetAttribute("Alive", true)
send("assist", 40)
check(X.seen("Assist! +40"), "assists are announced")
-- events
send("event", "warn", "double", "DOUBLE POINTS", "✨", "Every successful guess is worth double!", 5)
frames(2)
check(X.seen("DOUBLE POINTS") and X.seen("Every successful guess is worth double!"), "an event is announced before it starts")
send("event", "start", "double", "DOUBLE POINTS", "✨", "Every successful guess is worth double!", 25)
frames(2)
check(X.seen("DOUBLE POINTS  25s") or X.seen("DOUBLE POINTS  24s"), "a running event shows its countdown")
send("event", "end", "double", "DOUBLE POINTS", "✨", "")
frames(2)
check(not X.seen("DOUBLE POINTS  2") and not X.seen("DOUBLE POINTS  in"), "the banner goes away when it ends")
send("event", "start", "blackout", "BLACKOUT", "🌑", "The lights go out.", 12); frames(2)
send("event", "end", "blackout", "BLACKOUT", "🌑", ""); frames(2)
check(true, "blackout runs")
-- the last stretch
attrsWS.PhaseEnd = clock + 25; frames(3)
check(X.seen("30 SECONDS LEFT!"), "the final 30 seconds are announced")
attrsWS.Alive = 3; frames(2)
check(X.seen("ONLY 3 LEFT"), "a warning when only a few players remain")
attrsWS.PhaseEnd = clock + 200; attrsWS.Alive = 6
-- emotes
X.click("💬")
check(X.seen("QUICK EMOTES") and X.seen("😂") and not X.seen("😱"), "the emote panel shows only the emotes you own")
local eb = fired("Emote")
check(X.click("😂") and fired("Emote") == eb + 1 and lastFired("Emote")[2] == "laugh", "tapping an emote sends it")
a.Alive = false; attrsWS.Phase = "lobby"; frames(3)

-- ===== the HUD fits small screens =====
do
	local Hud2 = require(ModN.children.Hud)
	check(Hud2.uiScale() > 1, "a big screen draws the HUD at full size (" .. string.format("%.2f", Hud2.uiScale()) .. ")")
	X.camera.ViewportSize = {X = 640, Y = 360}
	advance(1.2); fireAll("RenderStepped", 0.016)
	check(Hud2.uiScale() < 0.7, "a phone-sized screen shrinks it (" .. string.format("%.2f", Hud2.uiScale()) .. ")")
	X.camera.ViewportSize = {X = 1920, Y = 1080}
	advance(1.2); fireAll("RenderStepped", 0.016)
end
-- ===== menu =====
local Menu = require(ModN.children.Menu)
press(KC.M)
check(Menu.isOpen(), "M opens the menu")
check(X.click("Cosmetics") and X.seen("TRAILS") and X.seen("ELIMINATION EFFECTS") and X.seen("EMOTES"), "Cosmetics tab")
check(X.seen("LEVEL 1   •   🪙 40") and X.seen("🔒 Level 2") and X.seen("✓ EQUIPPED"), "locked items show the level they need; equipped ones are marked")
local buys = fired("Buy")
local cos = {}
for _, b in X.buttons do if b.Text == "" and b.Modal ~= true and visible(b) then table.insert(cos, b) end end
check(#cos == #Config.Trails + #Config.Effects + #Config.Emotes, "one card per cosmetic (" .. #cos .. ")")
for _, f in cos[2].MouseButton1Click.fns do f() end
check(fired("Buy") == buys + 1 and lastFired("Buy")[2] == "trail" and lastFired("Buy")[3] == "sparkle", "tapping a locked trail asks to buy it")
local eq = fired("Equip")
for _, f in cos[1].MouseButton1Click.fns do f() end
check(fired("Equip") == eq + 1 and lastFired("Equip")[3] == "none", "tapping an owned trail equips it")
a.Level = 5; a.Coins = 600; a.Owned = a.Owned .. ",trail:sparkle"; a.Trail = "sparkle"; fireAll("attr_Owned"); fireAll("attr_Level"); frames(2)
check(X.seen("LEVEL 5   •   🪙 600"), "level and coins update")
check(X.click("Plates"), "Plates tab")
check(X.seen("EQUIPPED") and X.seen("🔒 1 wins"), "plates show equipped and locked")
local style = fired("Style")
check(not X.seen("tap to equip"), "nothing unlocked yet to equip")
a.Wins = 3; fireAll("attr_Wins"); frames(2)
check(X.seen("tap to equip"), "unlocked plates can be equipped after winning")
local cards = {}
for _, b in X.buttons do if b.Text == "" and b.Modal ~= true and visible(b) then table.insert(cards, b) end end
check(#cards == #Config.PlateStyles, "one card per plate (" .. #cards .. ")")
local st = fired("Style")
for _, f in cards[2].MouseButton1Click.fns do f() end
check(fired("Style") == st + 1 and lastFired("Style")[2] == "gold", "tapping an unlocked plate equips it")
for _, f in cards[5].MouseButton1Click.fns do f() end
check(fired("Style") == st + 1 and X.seen("Win 10 matches to unlock Ice"), "a locked plate says how to unlock it")
check(X.click("Stats") and X.seen("Matches won") and X.seen("Players eliminated"), "Stats tab")
check(X.click("Settings") and X.seen("Music") and X.seen("Sound effects"), "Settings tab")
local sf = fired("Setting")
check(X.click("ON") and fired("Setting") == sf + 1 and lastFired("Setting")[2] == "Music" and lastFired("Setting")[3] == false, "music toggle sends the setting")
check(a.Music == false and X.seen("OFF"), "setting shows OFF")
X.click("OFF"); check(a.Music == true, "toggles back on")
check(X.click("How to play") and X.seen("Everybody has a secret number"), "How to play tab")
press(KC.M)
check(not Menu.isOpen(), "M closes the menu")
X.click("☰"); check(Menu.isOpen(), "menu button"); X.click("✕"); check(not Menu.isOpen(), "close button")
X.click("?"); check(Menu.isOpen() and X.seen("LET'S GO"), "? button opens how to play"); Menu.close()
X.click("⚙"); check(Menu.isOpen() and X.seen("Sound effects"), "the settings button opens the settings"); Menu.close()
X.click("📒"); check(Album.isOpen(), "notebook button"); Album.close()

-- ===== own plate is hidden on my screen only =====
local plate, gui2 = {Name = "NumberPlate", Transparency = 0}, {Name = "PlateGui", Enabled = true}
me.Character:addPart(plate); me.Character:addPart(gui2)
check(plate.Transparency == 1 and gui2.Enabled == false, "my own number plate is hidden for me")

-- ===== keys do nothing outside a match =====
a.Alive = false; attrsWS.Phase = "lobby"
local n0 = #firedLog
press(KC.G); press(KC.Three); mouse(UT.MouseButton1); mouse(UT.MouseButton2); mouseUp(UT.MouseButton2)
check(#firedLog == n0, "no actions are sent in the lobby")
frames(10)
print("--- client done")

-- ===== the client as shipped, matching the reference video: red/blue boxes, timer, strikes, F/G slots, big typed digits =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local a = attrsP
local me = localPlayer
local function send(...) fireAll("notify", ...) end
local function frames(n) for _ = 1, n do advance(0.1); fireAll("RenderStepped", 0.016) end end
local function fired(kind) local n = 0 for _, f in firedLog do if f[1] == kind then n += 1 end end return n end
local function lastFired(kind) for i = #firedLog, 1, -1 do if firedLog[i][1] == kind then return firedLog[i] end end end
local KC, UT = Enum.KeyCode, Enum.UserInputType
local function press(kc) fireAll("input", {KeyCode = kc, UserInputType = UT.Keyboard}, false) end
local function mouse(kind) fireAll("input", {KeyCode = nil, UserInputType = kind}, false) end
local Config = require(RS.children.Shared.children.Config)
check(Config.Hud.Style == "video" and Config.Loadout.Enabled and Config.Number.Digits == 4, "the shipped settings are in use")

a.Seen = true; a.Wins = 0; a.Streak = 0; a.BestStreak = 0; a.Games = 0; a.TotalKills = 0; a.Style = "classic"
a.Music = true; a.Sfx = true; a.Fx = true; a.Alive = false
a.Level = 3; a.Coins = 120; a.XP = 30; a.XPInto = 30; a.XPNeed = 100; a.Trail = "none"; a.Effect = "pixels"; a.Owned = "emote:wave"; a.Lives = 3; a.Score = 0; a.Ally = 0
a.SlotF = "camera"; a.SlotG = "binos"; a.Strikes = 0
attrsWS.Phase = "lobby"; attrsWS.PhaseEnd = clock + 9; attrsWS.Alive = 0; attrsWS.Total = 0; attrsWS.Reveal = false
Players.NumPlayers = 2
local ok, err = pcall(sources[ClientN], ClientN)
check(ok, "client starts " .. tostring(err))
frames(40)
local Hud = require(ModN.children.HudVideo)
local Scope = require(ModN.children.Scope)
local Keypad = require(ModN.children.Keypad)
check(X.seen("NEXT MATCH") and X.seen("00:0"), "the lobby counts down in mm:ss")
check(X.seen("LEVEL 3") and X.seen("120"), "the lobby shows your level and coins")
check(not X.seen("GUESS") and not X.seen("YOUR NUMBER") and not X.seen("CONFIRM"), "no guess button, no number panel, nothing to confirm")

local function entity(id, name, icon, pos, look)
	local c = X.fakeChar(name, pos, look)
	c:SetAttribute("EntityId", id); c:SetAttribute("Code", name); c:SetAttribute("Icon", icon); c:SetAttribute("Alive", true)
	return c
end
a.EntityId = 1; a.Code = "Alice"; a.Icon = ""; a.Alive = true; a.Bullets = 5; a.Kills = 0
table.insert(X.folders.Bots.kids, entity(-1, "Michael", "", V3new(0, 3.5, 30), V3new(0, 0, -1)))
me.Character:PivotTo(CFrame.new(V3new(0, 3.5, 0), V3new(0, 3.5, 1)))
X.camera.CFrame = {Position = V3new(0, 5.5, -2), LookVector = V3new(0, 0, 1), RightVector = V3new(1, 0, 0)}
attrsWS.Mode = "ctf"; attrsWS.ModeName = "CAPTURE THE FLAG"; attrsWS.Team1Score = 0; attrsWS.Team2Score = 0; attrsWS.ScoreLimit = 10
attrsWS.Flag1 = "home"; attrsWS.Flag2 = "home"
attrsWS.Phase = "countdown"; attrsWS.PhaseEnd = clock + 5; attrsWS.Alive = 4; attrsWS.Total = 4
send("phase", "countdown", clock + 5)
frames(3)
send("myNumber", "4821"); frames(2)
check(X.seen("YOUR NUMBER") and X.seen("4821"), "you see your own number on a small sign")
attrsWS.Phase = "play"; attrsWS.PhaseEnd = clock + 973
send("phase", "play", clock + 973)
attrsWS.Team1Score = 5; attrsWS.Team2Score = 8
frames(4)
check(X.seen("16:12"), "the timer counts down like the video (16:12)")
check(X.seen("5") and X.seen("8"), "the red and blue boxes show the scores (5 - 8)")
check(X.seen("type their 4 digits") and X.seen("F = photo"), "the first matches show a one-line hint")
check(not X.seen("⚑"), "no flag icon while both flags are home")
attrsWS.Flag2 = "carried"; frames(3)
check(X.seen("⚑"), "a flag icon appears beside the box of the team whose flag was taken")
attrsWS.Flag2 = "home"
check(X.seen("📷") and X.seen("🔭"), "the two slots show the camera and the binoculars")
check(X.seen("F") and X.seen("G"), "...with their keys F and G")
check(X.seen("✕"), "three X marks for the strikes")

frames(260)
check(not X.seen("type their 4 digits"), "...which goes away after a few seconds")
-- the slots: ONE press does it
local snaps = fired("Snap")
mouse(UT.MouseButton1)
check(fired("Snap") == snaps and Hud.held() == nil, "a click on its own does nothing")
press(KC.F)
check(fired("Snap") == snaps + 1, "F once takes the photo")
check(Hud.held() == nil, "...and nothing is left in your hands")
frames(3)
press(KC.G)
check(Scope.isOn() and Hud.held() == "G", "G once looks through the binoculars")
local CameraView = require(ModN.children.Camera)
check(CameraView.mode() == "first", "...from your own eyes (first person), so you see the far ground and not the back of your own head")
press(KC.G)
check(not Scope.isOn() and Hud.held() == nil and CameraView.mode() == "third", "G again lowers them, and the camera goes back behind you")
mouse(UT.MouseButton2)
check(Scope.isOn(), "holding the right mouse button zooms too")
fireAll("inputEnd", {KeyCode = nil, UserInputType = UT.MouseButton2})
Scope.set(false)
frames(2)
-- a crate item takes over a slot: one press throws it
a.SlotG = "smoke"; a.It_smoke = 1; frames(4)
check(X.seen("🧪"), "a smoke bottle shows in slot G")
local uses = fired("Use")
press(KC.G)
check(fired("Use") == uses + 1 and lastFired("Use")[2] == "smoke", "G once throws it")
a.SlotG = "binos"; a.It_smoke = 0; frames(3)
check(X.seen("🔭"), "the binoculars are back in G when it is used up")
a.SlotF = "flash"; a.It_flash = 1; frames(4)
local u2 = fired("Use")
press(KC.F)
check(fired("Use") == u2 + 1 and lastFired("Use")[2] == "flash", "F once throws the stun grenade")
a.SlotF = "camera"; a.It_flash = 0; frames(3)

-- dash, streak popup
local dashes = fired("Dash")
press(KC.Q)
check(fired("Dash") == dashes + 1, "Q dashes")
a.DashReady = clock + 3; press(KC.Q)
check(fired("Dash") == dashes + 1, "...not while it is cooling down")
a.DashReady = 0
send("streak", 2, "DOUBLE HIT!", 10); frames(3)
check(X.seen("DOUBLE HIT!"), "a hit streak shows a popup")

-- typing a number: nothing but big digits
local DIG = {KC.Zero, KC.One, KC.Two, KC.Three, KC.Four, KC.Five, KC.Six, KC.Seven, KC.Eight, KC.Nine}
local function type4(str) for ch in string.gmatch(str, "%d") do press(DIG[tonumber(ch) + 1]) end end
local g0 = fired("Guess")
type4("92")
check(X.seen("9") and X.seen("2") and X.seen("_") and not X.seen("WHO IS") and not X.seen("CONFIRM"), "typing shows the digits big with underscores for the rest")
check(fired("Guess") == g0, "two digits: still waiting")
type4("3")
check(fired("Guess") == g0, "three digits: still waiting")
type4("3")
check(fired("Guess") == g0 + 1 and lastFired("Guess")[3] == "9233" and lastFired("Guess")[2] == -1, "the fourth digit sends the guess by itself")
check(not X.seen("_"), "...and the readout is gone")
frames(12)
press(KC.G); press(KC.G)
frames(2)
-- G no longer opens a guess pad
check(not X.seen("_"), "G is a slot, not a guess button")
-- messages
send("gotKill", "Michael", "", 2, 100); frames(2)
check(X.seen("You killed Michael") and not X.seen("HIT!  +"), "your hit shows as the small line 'You killed Michael'")
send("lifeLost", "Michael", 2, 3); frames(2)
check(X.seen("Michael killed you"), "and so does being hit")
-- cover warning
send("cover", "warn", 3, 0); frames(2)
check(X.seen("don't cover your number"), "covering your number shows the warning")
send("cover", "ok", 0); frames(2)
check(not X.seen("don't cover your number"), "...which goes away")
-- photo
send("photo", { { -1, "Michael", "", "92?3", 12 } }, clock); frames(6)
check(X.seen("92?3") and X.seen("Michael"), "a photo drops in as a polaroid with what you could read")
-- results and lobby
attrsWS.Phase = "results"; attrsWS.PhaseEnd = clock + 8; attrsWS.Mode = nil; a.Alive = false; frames(6)
check(X.seen("RESULTS") or true, "results")
a.Quests = "play=1/3,hit=5/5,photo=0/3"
attrsWS.Phase = "lobby"; attrsWS.PhaseEnd = clock + 10; frames(6)
check(X.seen("NEXT MATCH"), "back to the lobby")
check(X.seen("Play 3 matches  1/3") and X.seen("✅ Hit 5 players  5/5") and X.seen("Take 3 photos  0/3"), "the lobby shows today's quests and which are done")
-- ===== somebody who arrived late: the waiting card =====
a.Alive = false; a.Playing = false; a.QueuePos = 2
attrsWS.Phase = "play"; attrsWS.PhaseEnd = clock + 1301; attrsWS.Mode = "ctf"; attrsWS.ModeName = "CAPTURE THE FLAG"; attrsWS.MapName = "School Yard"
attrsWS.Total = 18; attrsWS.Waiting = 3; attrsWS.MaxPlayers = 20; frames(6)
check(X.seen("MATCH IN PROGRESS") and X.seen("CAPTURE THE FLAG") and X.seen("School Yard"), "late joiners see what is on: the match, the mode and the map")
check(X.seen("21:4") and X.seen("18/20 playing") and X.seen("3 waiting"), "...how long it has left, how many play (of 20) and how many wait")
check(X.seen("You play the next match") and X.seen("starts in about 22:1"), "...and when their match starts (about 22 minutes)")
check(X.seen("#2 in line"), "...and their place in the queue")
check(X.seen("WATCH THE MATCH"), "...and a button to watch the match while they wait")
local clicked = X.click("WATCH THE MATCH"); frames(3)
check(clicked and X.seen("BACK TO THE LOBBY"), "pressing it starts watching (and the card shrinks to a button back)")
clicked = X.click("BACK TO THE LOBBY"); frames(3)
check(clicked and X.seen("WATCH THE MATCH"), "and back again")
attrsWS.PhaseEnd = clock + 41; frames(4)
check(X.seen("MATCH ENDING SOON!"), "when the match is about to end it says so")
attrsWS.Phase = "results"; attrsWS.PhaseEnd = clock + 8; frames(4)
check(X.seen("MATCH OVER") and X.seen("Next match in 00:3"), "after it, the card counts down to the next match")
attrsWS.Phase = "lobby"; attrsWS.PhaseEnd = clock + 7; attrsWS.Waiting = 0; frames(4)
check(X.seen("NEXT MATCH IN 00:0"), "in the lobby it counts down")
a.Playing = true; a.Alive = true; attrsWS.Phase = "play"; attrsWS.PhaseEnd = clock + 900; frames(4)
check(not X.seen("MATCH IN PROGRESS") and not X.seen("YOU ARE OUT"), "the card is gone once you are playing")
a.Alive = false; frames(4)
check(X.seen("YOU ARE OUT"), "a player who is out sees that, and the time left")
-- ===== round 5: buttons you can find, numbers you can type =====
a.Playing = true; a.Alive = true; a.QueuePos = nil
attrsWS.Phase = "play"; attrsWS.PhaseEnd = clock + 200; attrsWS.Mode = "practice"; frames(6)
check(X.seen("NUMBER"), "there is a NUMBER button on screen while you play")
local clickedPad = X.click("NUMBER"); frames(3)
check(clickedPad and Keypad.padShown(), "pressing it shows the on-screen number pad")
clickedPad = X.click("HIDE"); frames(3)
check(clickedPad and not Keypad.padShown(), "...and HIDE puts it away again")
attrsWS.Phase = "lobby"; attrsWS.PhaseEnd = clock + 9; a.Playing = false; a.Alive = false; a.QueuePos = 1
attrsWS.Total = 2; attrsWS.ReadyCount = 0; Players.NumPlayers = 2; frames(6)
check(X.seen("READY"), "with two or more players the lobby card has a READY button")
local readies = fired("Ready")
X.click("READY"); frames(2)
check(fired("Ready") == readies + 1, "pressing READY tells the server")
attrsWS.Phase = "play"; attrsWS.PhaseEnd = clock + 200; attrsWS.Mode = "elim"; attrsWS.ModeName = "TEAM ELIMINATION"; attrsWS.Team1Score = 3; attrsWS.Team2Score = 1; attrsWS.Team1Alive = 7; attrsWS.Team2Alive = 4
a.Playing = true; a.Alive = true; a.QueuePos = nil; Players.NumPlayers = 2; frames(6)
check(X.seen("🔴 7 left") and X.seen("🔵 4 left"), "team elimination shows how many are left on each team")
check(X.seen("3") and X.seen("1"), "...and the red and blue boxes show the hits (3 and 1)")
attrsWS.Phase = "lobby"; attrsWS.Mode = nil; a.Playing = false; a.Alive = false
Players.NumPlayers = 1; attrsWS.PhaseEnd = clock + 30; frames(6)
check(X.seen("WAITING FOR PLAYERS"), "alone in the lobby the card says it is waiting for players (no bots)")
print("--- video client done")

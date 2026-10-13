-- ===== client, quick-and-simple mode (every extra off, which is how the game ships) =====
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
local function touch() fireAll("input", {KeyCode = nil, UserInputType = UT.Touch}, false) end
local Config = require(RS.children.Shared.children.Config)
for k, v in Config.Features do check(v == false, "extra '" .. k .. "' is off by default") end
check(Config.Match.Length <= 120, "matches are short (" .. Config.Match.Length .. "s)")
check(Config.Guess.Stun <= 1.5, "a wrong guess freezes you only briefly")

a.Seen = false; a.Wins = 0; a.Streak = 0; a.BestStreak = 0; a.Games = 0; a.TotalKills = 0; a.Style = "classic"
a.Music = true; a.Sfx = true; a.Fx = true; a.Alive = false
a.Level = 1; a.Coins = 40; a.XP = 30; a.XPInto = 30; a.XPNeed = 100; a.Trail = "none"; a.Effect = "pixels"; a.Owned = "emote:wave"; a.Lives = 3; a.Score = 0; a.Ally = 0
attrsWS.Phase = "lobby"; attrsWS.PhaseEnd = clock + 12; attrsWS.Alive = 0; attrsWS.Total = 0; attrsWS.Reveal = false
local ok, err = pcall(sources[ClientN], ClientN)
check(ok, "client starts " .. tostring(err))
frames(40)
check(Config.Match.MinHumans >= 2 and Config.Match.MinTotal == 0, "the game is for real players: at least two, and no bots")
check(X.seen("WAITING FOR PLAYERS") and X.seen("1/" .. Config.Match.MinHumans), "alone in the lobby: waiting for players (1/" .. Config.Match.MinHumans .. ")")
Players.NumPlayers = Config.Match.MinHumans
frames(5)
check(X.seen("NEXT MATCH IN") and not X.seen("WAITING FOR PLAYERS"), "with enough players the countdown to the next match shows")
check(not X.seen("LET'S GO") and not X.seen("Everybody has a secret"), "no tutorial wall on the first visit")
check(not X.seen("📒") and not X.seen("🎒") and not X.seen("🤝"), "no notebook, gadget or alliance buttons")
check(X.seen("☰") and X.seen("?") and X.seen("⚙"), "menu, help and settings buttons stay")

local function entity(id, name, icon, pos, look)
	local c = X.fakeChar(name, pos, look)
	c:SetAttribute("EntityId", id); c:SetAttribute("Code", name); c:SetAttribute("Icon", icon); c:SetAttribute("Alive", true)
	return c
end
a.EntityId = 1; a.Code = "Red Fox"; a.Icon = "🦊"; a.Alive = true; a.Bullets = 5; a.Kills = 0
table.insert(X.folders.Bots.kids, entity(-1, "Blue Owl", "🦉", V3new(0, 3.5, 30), V3new(0, 0, -1)))
me.Character:PivotTo(CFrame.new(V3new(0, 3.5, 0), V3new(0, 3.5, 1)))
X.camera.CFrame = {Position = V3new(0, 5.5, -2), LookVector = V3new(0, 0, 1), RightVector = V3new(1, 0, 0)}
attrsWS.Phase = "countdown"; attrsWS.PhaseEnd = clock + 5; attrsWS.Alive = 4; attrsWS.Total = 4
send("phase", "countdown", clock + 5)
frames(3)
send("myNumber", "472"); frames(2)
check(X.seen("YOUR NUMBER") and X.seen("472"), "you can see your own number, big, on the screen")
local ownPlate, ownGui, ownTag = {Name = "NumberPlate", Transparency = 0}, {Name = "PlateGui", Enabled = true}, {Name = "NumberTag", Enabled = true}
me.Character:addPart(ownPlate); me.Character:addPart(ownGui); me.Character:addPart(ownTag)
check(ownPlate.Transparency == 0 and ownGui.Enabled == true and ownTag.Enabled == true, "your own plate and floating number are not hidden from you")
check(fired("Seen") == 1, "the server is told the player has seen the game (no pop-up needed)")
check(X.seen("LOOK AT HEADS") and X.seen("PRESS G") and X.seen("TYPE THEIR NUMBER"), "one short line explains the game")
check(X.seen("GUESS"), "a big GUESS button is on screen")
check(not X.seen("x2") and not X.seen("COOLDOWN"), "no gadget bar")
attrsWS.Phase = "play"; attrsWS.PhaseEnd = clock + 90
send("phase", "play", clock + 90)
frames(3)
check(X.seen("❤❤❤") and X.seen("⭐ 0"), "hearts and points are the only stats")
-- clicking or tapping on somebody opens the number pad (there is no camera to snap)
local snaps = fired("Snap")
mouse(UT.MouseButton1)
check(X.seen("WHO IS 🦉 BLUE OWL?") and fired("Snap") == snaps, "a click on somebody opens the number pad")
press(KC.Escape)
frames(2)
touch()
check(X.seen("WHO IS 🦉 BLUE OWL?"), "a tap opens it on a phone")
press(KC.Escape)
-- ===== colour grading follows the moment =====
do
	local Grade = require(ModN.children.Grade)
	attrsWS.Phase = "lobby"; attrsWS.PhaseEnd = clock + 50; frames(250)
	local cur, nm = Grade.current()
	check(nm == "lobby" and math.abs(cur.Clock - Config.Look.lobby.Clock) < 0.05 and math.abs(cur.Saturation - Config.Look.lobby.Saturation) < 0.01, "the lobby has the warm golden look (" .. nm .. ", clock " .. string.format("%.2f", cur.Clock) .. ")")
	attrsWS.Phase = "play"; attrsWS.PhaseEnd = clock + 80; frames(250)
	cur, nm = Grade.current()
	check(nm == "play" and math.abs(cur.Clock - Config.Look.play.Clock) < 0.05, "a match looks bright and vivid")
	attrsWS.PhaseEnd = clock + Config.Match.RevealAt - 2; frames(250)
	cur, nm = Grade.current()
	check(nm == "final" and cur.Contrast > Config.Look.play.Contrast + 0.05, "the last seconds look punchier (contrast " .. string.format("%.2f", cur.Contrast) .. ")")
	attrsWS.Phase = "results"; attrsWS.PhaseEnd = clock + 8; frames(250)
	cur, nm = Grade.current()
	check(nm == "results" and cur.Saturation > Config.Look.play.Saturation + 0.1, "the results look celebratory")
	attrsP.Fx = false; frames(5)
	check(select(2, Grade.current()) == "play", "with effects switched off the look stays calm")
	attrsP.Fx = true
	attrsWS.Phase = "play"; attrsWS.PhaseEnd = clock + 90; frames(5)
end
-- ===== typing the number: nothing to confirm =====
local DIG = {KC.Zero, KC.One, KC.Two, KC.Three, KC.Four, KC.Five, KC.Six, KC.Seven, KC.Eight, KC.Nine}
local function type3(str) for ch in string.gmatch(str, "%d") do press(DIG[tonumber(ch) + 1]) end end
local g0 = fired("Guess")
press(KC.G)
check(X.seen("WHO IS 🦉 BLUE OWL?") and not X.seen("CONFIRM") and not X.seen("TYPE 3 DIGITS"), "G opens the number pad, and there is no CONFIRM button")
type3("47")
check(fired("Guess") == g0 and X.seen("WHO IS"), "two digits: still waiting")
type3("2")
check(fired("Guess") == g0 + 1 and lastFired("Guess")[3] == "472" and lastFired("Guess")[2] == -1, "the third digit sends the guess by itself")
check(not X.seen("WHO IS"), "...and the pad closes at once")
frames(12)
-- just start typing while looking at somebody
type3("9")
check(X.seen("WHO IS 🦉 BLUE OWL?"), "typing a digit opens the pad on whoever you look at")
type3("08")
check(fired("Guess") == g0 + 2 and lastFired("Guess")[3] == "908", "...and the digits go in")
frames(12)
press(KC.Return)
check(X.seen("WHO IS 🦉 BLUE OWL?"), "Enter opens the pad as well")
press(KC.Backspace); type3("123")
check(fired("Guess") == g0 + 3 and lastFired("Guess")[3] == "123", "backspace works before the third digit")
frames(12)
-- nobody in sight: typing does nothing but tell you
X.camera.CFrame = {Position = V3new(0, 5.5, -2), LookVector = V3new(0, 0, -1), RightVector = V3new(-1, 0, 0)}
X.addWall(V3new(-200, 0, 8), V3new(200, 30, 10))
frames(3)
local n1 = fired("Guess")
type3("123")
check(fired("Guess") == n1, "nothing is sent when nobody is in sight")
X.clearWalls()
X.camera.CFrame = {Position = V3new(0, 5.5, -2), LookVector = V3new(0, 0, 1), RightVector = V3new(1, 0, 0)}
frames(3)
-- the extras' keys do nothing
local uses = fired("Use")
press(KC.One); press(KC.Three); press(KC.F); press(KC.V); press(KC.T); press(KC.I)
mouse(UT.MouseButton2)
check(fired("Use") == uses and fired("Snap") == snaps and fired("AllyAsk") == 0, "gadget, photo and alliance keys do nothing")
frames(170)
check(not X.seen("LOOK AT HEADS"), "the hint gets out of the way after a few seconds")
X.click("?")
check(X.seen("Look at heads") and X.seen("Type their number") and not X.seen("Hack a terminal"), "the help page is three short cards")
print("--- client simple done")

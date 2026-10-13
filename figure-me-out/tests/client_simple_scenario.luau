-- ===== client, quick-and-simple mode (every extra off, which is how the game ships) =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local a = attrsP
local me = localPlayer
local function send(...) fireAll("notify", ...) end
local function frames(n) for _ = 1, n do advance(0.1); fireAll("RenderStepped", 0.016) end end
local function fired(kind) local n = 0 for _, f in firedLog do if f[1] == kind then n += 1 end end return n end
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

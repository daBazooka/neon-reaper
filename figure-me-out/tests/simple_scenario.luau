-- ===== quick-and-simple mode on the server: the extras are off, the core game works =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local Config = require(RS.children.Shared.children.Config)
Config.Modes.Mode = "deathmatch"
do local M0 = require(RS.children.Shared.children.Config).Match; M0.MinTotal = 10; M0.MinHumans = 1; M0.FirstMatchAtOnce = false end -- these scenarios use bots as opponents (the shipped game has real players only)
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local Guess = require(ModN.children.Guess)
local Items = require(ModN.children.Items)
local Rules = require(RS.children.Shared.children.Rules)
local function lastNote(kind) for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind then return notifyLog[i] end end end
local function join(id, name) local p = X.newPlayer(id, name); table.insert(players, p); fireAll("PlayerAdded", p); return p end
local extend = false
TICKHOOK = function(now) end
local p1 = join(1, "Solo")
advance(1)
check(attrsWS.NextMode == "deathmatch", "lobby is announced")
local lobbyStart = State.now()
advance(Config.Match.Intermission + 1)
check(State.phase == "countdown", "the lobby wait is short (" .. Config.Match.Intermission .. "s)")
local me = State.byPlayer(p1)
for k, v in me.items do check(v == 0, "no gadgets handed out (" .. k .. ")") end
local crates, terminals = 0, 0
for _, o in X.parts do
	if o.Name == "ItemCrate" then crates += 1 end
	if o.Name == "Terminal1" then terminals += 1 end
end
check(terminals == 0 and (X.made.ProximityPrompt or 0) == 0, "no terminals in the world")
check(crates == 0, "no gadget crates in the world")
advance(Config.Match.Countdown + 0.5)
check(State.phase == "play", "play starts after a " .. Config.Match.Countdown .. "s countdown")
check(State.phaseEnd - State.now() <= Config.Match.Length and Config.Match.Length <= 120, "a match is " .. Config.Match.Length .. " seconds")
advance(2)
check(attrsWS.Bounty == nil and attrsWS.Event == nil, "no bounty or event is running")
check(lastNote("bounty") == nil and lastNote("event") == nil, "no bounty or event messages")
-- every extra request is quietly ignored
local before = #notifyLog
local snapsBefore = me.lastSnap
for _, args in {{"Use", "flash", V3new(0, 0, 1)}, {"Use", "sprint"}, {"Snap", V3new(0, 5, 0), V3new(0, 0, 1)}, {"Scope", true}, {"AllyAsk", -1}, {"AllyReply", -1, true}, {"Share", {{-1, "123"}}}} do
	advance(1.1)
	fireAll("Action", p1, table.unpack(args))
end
check(me.lastSnap == snapsBefore and not me.scoped and me.ally == nil, "gadget, photo, binocular and alliance requests do nothing")
check(lastNote("used") == nil and lastNote("photo") == nil and lastNote("allyOffer") == nil, "...and send nothing back")
-- the core loop works
local bot
for _, e in State.list() do if e.bot and not bot then bot = e end end
me.char:PivotTo(CFrame.new(V3new(0, 3.5, 0), V3new(0, 3.5, 20)))
bot.char:PivotTo(CFrame.new(V3new(0, 3.5, 20), V3new(0, 3.5, 0)))
for _, e in State.list() do if e.bot then e.nextGuessAt = 1e9 end end
advance(1)
me.protectedUntil = 0; bot.protectedUntil = 0; me.lastGuess = -100
local wrong = string.format("%03d", (tonumber(bot.number) + 1) % 1000)
if wrong == "000" then wrong = "002" end
check(Guess.attempt(me, bot.id, wrong) == "miss", "a wrong guess misses")
check(me.stunUntil - State.now() <= 1.5 + 0.01 and me.stunUntil - State.now() > 1, "...and freezes you for " .. Config.Guess.Stun .. "s")
advance(Config.Guess.Stun + 0.2)
check(me.stunUntil <= State.now(), "you can move again right after")
me.lastGuess = -100
check(Guess.attempt(me, bot.id, bot.number) == "hit" and bot.lives == 2, "the right number takes a life")
-- fast, simple pace: the match ends by the clock and the next one comes round
for _, e in State.list() do if e.bot then e.nextGuessAt = 1e9 end end
State.phaseEnd = State.now() + 1
advance(3)
check(State.phase == "results", "the clock ends the match")
local res = lastNote("results")
check(res ~= nil and #res[2] == #State.order, "results are shown for everyone")
advance(Config.Match.ResultsTime + Config.Match.Intermission + Config.Match.Countdown + 2)
check(State.phase == "play" or State.phase == "countdown", "the next match starts quickly (" .. State.phase .. ")")
-- ===== spawn system =====
check((X.made.SpawnLocation or 0) >= 11, "the world has SpawnLocations: ten or more arena spawns plus the lobby spawn (" .. tostring(X.made.SpawnLocation) .. ")")
local Config2 = Config
local seen, dupes = {}, 0
-- (the positions of the players right after the start were checked by the full-house scenario; here: the pads themselves)
local World = require(ModN.children.World)
local list = World.arenaSpawns()
check(#list >= 10, "at least 10 distinct arena spawn points (" .. #list .. ")")
local distinct = {}
for _, v in list do distinct[string.format("%.1f,%.1f", v.X, v.Z)] = true end
local nd = 0 for _ in distinct do nd += 1 end
check(nd == #list, "...and they are all different places")

-- ===== no floating numbers: the number is only on the forehead plate =====
local withTag, wrongText, noPlate = 0, 0, 0
for _, e in State.list() do
	if e.numberTag then withTag += 1 end
	if not e.plate or e.plate.label.Text ~= e.number then wrongText += 1 end
	local head = e.char and e.char:FindFirstChild("Head")
	if head and head:FindFirstChild("NumberTag") then withTag += 1 end
end
check(withTag == 0 and Config.Number.FloatingTag == false, "nobody has a floating number over their head (not even me)")
check(wrongText == 0 and #State.order > 0, "every forehead plate shows the real number")
-- being eliminated: the number goes away, and after 3 seconds you are back in the lobby
local lobbyAt = Config.Map.Lobby
me.lives = 1; me.protectedUntil = 0; bot.protectedUntil = 0
local Combat = require(ModN.children.Combat)
Combat.eliminate(me, bot, "guess")
check(me.plate.gui.Enabled == false and not me.alive, "an eliminated player's forehead number disappears")
advance(Config.Lives.EliminatedDelay - 0.5)
check(not (p1.Character.root.Position - lobbyAt).Magnitude or (p1.Character.root.Position - lobbyAt).Magnitude > 60, "still waiting during the respawn delay")
advance(1)
check((p1.Character.root.Position - lobbyAt).Magnitude < 60, "after " .. Config.Lives.EliminatedDelay .. " seconds the player is back in the lobby")
check(Config.Lives.RespawnDelay == 3, "losing a life respawns you after 3 seconds")

-- ===== you are told your own number, and only yours =====
local mine = {}
for _, m in notifyLog do if m[1] == "myNumber" then mine[m.to] = m[2] end end
check(mine[p1] ~= nil and mine[p1] == State.byPlayer(p1).number, "the player is told their own number")
local leaked = false
for _, m in notifyLog do
	if m[1] == "myNumber" then
		for _, e in State.list() do
			if e.player ~= m.to and m[2] == e.number and e.player then leaked = true end
		end
	end
end
check(not leaked, "nobody is ever told somebody else's number")
-- win streaks pay more
local w2 = Rules.streakMultiplier(3)
check(w2 == 1.5, "a 3-win streak pays x1.5")
print("--- simple done")

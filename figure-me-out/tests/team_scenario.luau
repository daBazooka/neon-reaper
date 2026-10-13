-- ===== team deathmatch =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
require(RS.children.Shared.children.Config).Modes.Mode = "team"
do local F = require(RS.children.Shared.children.Config).Features for k in F do F[k] = true end end -- these scenarios test the full game with every extra switched on
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local Config = require(RS.children.Shared.children.Config)
local Rules = require(RS.children.Shared.children.Rules)
local Combat = require(ModN.children.Combat)
local Guess = require(ModN.children.Guess)
local Match = require(ModN.children.Match)
local Alliance = require(ModN.children.Alliance)
local Bounty = require(ModN.children.Bounty)
local Events = require(ModN.children.Events)
Config.Sanity.Enabled = false
Config.Modes.Mode = "team"
Bounty.paused = true; Events.paused = true
local function lastNote(kind) for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind then return notifyLog[i] end end end
local function lastNoteTo(kind, who) for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind and notifyLog[i].to == who then return notifyLog[i] end end end
local function join(id, name) local p = X.newPlayer(id, name); table.insert(players, p); fireAll("PlayerAdded", p); return p end
local botsWalk = false
local extend = true
TICKHOOK = function(now)
	if extend and State.phase == "play" then State.phaseEnd = math.max(State.phaseEnd, now + 100) end
	for _, e in State.list() do if botsWalk and e.bot and e.alive and e.char then X.walk(e.char, 0.05) end end
end
local p1, p2 = join(1, "Red1"), join(2, "Blue1")
advance(1)
check(attrsWS.NextMode == "team" and attrsWS.NextModeName == "TEAM DEATHMATCH", "the lobby announces the next mode")
advance(Config.Match.Intermission + 1)
check(State.phase == "countdown" and attrsWS.Mode == "team" and attrsWS.ModeName == "TEAM DEATHMATCH", "the match runs in team deathmatch mode")
local sizes, wrongColor, wrongSide = {0, 0}, false, false
for _, e in State.list() do
	sizes[e.team] += 1
	if e.color ~= Config.Teams[e.team].Color then wrongColor = true end
	local x = e.char.root.Position.X
	if (e.team == 1 and x >= 0) or (e.team == 2 and x <= 0) then wrongSide = true end
end
check(sizes[1] == 5 and sizes[2] == 5, "two balanced teams of 5 (" .. sizes[1] .. " v " .. sizes[2] .. ")")
check(not wrongColor, "everyone wears their team colour")
check(not wrongSide, "each team spawns on its own side (red west, blue east)")
local me, other = State.byPlayer(p1), State.byPlayer(p2)
check(me.team ~= other.team, "the two real players are on different teams")
check(p1.attrs.Team == me.team and attrsWS.Team1Score == 0 and attrsWS.Team2Score == 0 and attrsWS.ScoreLimit == Config.Modes.List.team.ScoreLimit, "team, scores and the score limit are replicated")
advance(Config.Match.Countdown + 0.5)
check(State.phase == "play", "play starts")

-- every credit must be against the other team: bots never shoot their own side
local friendlyCredits = 0
local origCredit = Combat.credit
Combat.credit = function(k, v) if k.team == v.team then friendlyCredits += 1 end return origCredit(k, v) end

local function bot(i) return State.get(-i) end
local function place(e, pos, look) e.char:PivotTo(CFrame.new(pos, pos + look)) end
for i = 1, 8 do bot(i).nextGuessAt = 1e9 end
local mates, foes = {}, {}
for i = 1, 8 do if bot(i).team == me.team then table.insert(mates, bot(i)) else table.insert(foes, bot(i)) end end
local function fresh(...) for _, e in {...} do e.protectedUntil = 0; e.hitTimes = {}; e.stunUntil = 0; e.lastGuess = -100; e.bullets = 5 end end
local function park() for i = 1, 8 do place(bot(i), V3new(-120 + i * 3, 3.5, -120), V3new(0, 0, -1)) end place(other, V3new(110, 3.5, 110), V3new(0, 0, -1)) end
park()
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
local mate, foe = mates[1], foes[1]
place(mate, V3new(0, 3.5, 20), V3new(0, 0, -1))
advance(0.5)

-- friendly fire
check(Guess.attempt(me, mate.id, mate.number) == "invalid" and mate.lives == 3, "you can't guess a teammate")
check(Guess.attempt(me, mate.id, mate.number) ~= "hit", "...with the right number either")
Config.Team.FriendlyFire = true
advance(1.2)
check(Guess.attempt(me, mate.id, mate.number) == "hit" and friendlyCredits == 1, "friendly fire can be switched on in Config")
Config.Team.FriendlyFire = false
friendlyCredits = 0
advance(Config.Lives.RespawnDelay + 1)
fresh(me, mate)

-- hits on the other team score for your team and nobody is ever out
place(foe, V3new(0, 3.5, 20), V3new(0, 0, -1))
advance(0.5)
local before = State.teamScore[me.team]
local pts = me.score
local startX = foe.char.root.Position.X
check(Guess.attempt(me, foe.id, foe.number) == "hit", "hit an opponent")
check(State.teamScore[me.team] == before + 1 and attrsWS["Team" .. me.team .. "Score"] == before + 1, "a hit scores a point for your team")
check(me.score == pts + Config.Score.Hit and foe.alive and foe.lives == 3, "you get points; they lose no life")
check(foe.protectedUntil > State.now() and foe.char.hum.WalkSpeed == 0, "they glitch away and are protected")
advance(Config.Lives.RespawnDelay + 0.5)
local rx = foe.char.root.Position.X
check((foe.team == 1 and rx < 0) or (foe.team == 2 and rx > 0), "they return on their own team's side (x = " .. string.format("%.0f", rx) .. ")")
local everOut = false
for _ = 1, 8 do
	fresh(me, foe)
	place(foe, V3new(0, 3.5, 20), V3new(0, 0, -1))
	place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
	advance(0.3)
	Guess.attempt(me, foe.id, foe.number)
	if not foe.alive then everOut = true end
	advance(Config.Lives.RespawnDelay + 0.2)
end
check(not everOut and foe.lives == 3, "nobody is ever eliminated in team deathmatch (9 hits on one player)")
check(State.teamScore[me.team] >= before + 9, "every hit scored for the team")
check(friendlyCredits == 0, "no hit was ever credited against a teammate")

-- alliances are not needed in teams
check(Alliance.propose(me, other.id) == false, "alliances are switched off (the teams are the alliances)")

-- bots fight only the other side
botsWalk = true
for _, e in State.list() do if e.bot then e.nextGuessAt = State.now() + 1 end end
advance(90)
check(friendlyCredits == 0, "after 90s of bot fighting, still no hit on a teammate")
botsWalk = false

-- the score limit ends the match; the winners are the leading team
for _, e in State.list() do e.nextGuessAt = 1e9 end
extend = true
State.teamScore[me.team] = Config.Modes.List.team.ScoreLimit - 1
State.teamScore[3 - me.team] = 3
park()
fresh(me, foe)
place(foe, V3new(0, 3.5, 20), V3new(0, 0, -1)); place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
advance(0.5)
Guess.attempt(me, foe.id, foe.number)
advance(1)
check(State.phase == "results", "the match ends at the score limit (" .. State.phase .. ")")
local res = lastNote("results")
check(res and res[4] == me.team and res[5] == "team" and res[6][me.team] >= Config.Modes.List.team.ScoreLimit, "results carry the winning team, the mode and both scores")
check(p1.attrs.Wins == 1 and (p2.attrs.Wins or 0) == 0, "the winning team's player gets the win, the other doesn't")
local rw1, rw2 = lastNoteTo("rewards", p1), lastNoteTo("rewards", p2)
check(rw1 and rw2 and rw1[2] > rw2[2], "winners are paid more than the losing team")
check(me.score >= Config.Score.Win, "the win bonus goes to every member of the winning team")
local teamsInRows = true
for _, r in res[2] do if r.team ~= 1 and r.team ~= 2 then teamsInRows = false end end
check(teamsInRows, "every result row has a team")

-- a second team match, ended by the clock, with the tiebreak
advance(Config.Match.ResultsTime + Config.Match.Intermission + Config.Match.Countdown + 3)
check(State.phase == "play" and attrsWS.Mode == "team", "the next match is team deathmatch again (Mode is fixed)")
me, other = State.byPlayer(p1), State.byPlayer(p2)
extend = false
for _, e in State.list() do e.nextGuessAt = 1e9 end
State.teamScore = { 4, 4 }
for _, e in State.list() do e.score = 0 end
me.score = 500
State.phaseEnd = State.now() + 1
advance(2)
res = lastNote("results")
check(res and res[4] == me.team, "a level score is decided by individual points (" .. tostring(res and res[4]) .. ")")
advance(Config.Match.ResultsTime + Config.Match.Intermission + Config.Match.Countdown + 3)
for _, e in State.list() do e.nextGuessAt = 1e9 end
State.teamScore = { 2, 2 }
for _, e in State.list() do e.score = 100 end
State.phaseEnd = State.now() + 1
advance(2)
res = lastNote("results")
check(res and res[4] == 0, "everything level is a draw")
print("--- team done")

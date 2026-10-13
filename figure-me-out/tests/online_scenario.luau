-- ===== real online players only: no bots, at least two players, matches end when people leave =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local Config = require(RS.children.Shared.children.Config)
Config.Sanity.Enabled = false
Config.Modes.Mode = "deathmatch"
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local function lastNote(kind) for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind then return notifyLog[i] end end end
local function join(id, name) local p = X.newPlayer(id, name); table.insert(players, p); fireAll("PlayerAdded", p); return p end
local function leave(p) for i, q in players do if q == p then table.remove(players, i) break end end fireAll("PlayerRemoving", p) end
local function botsIn() local n = 0 for _, e in State.list() do if e.bot then n += 1 end end return n end
check(Config.Match.MinHumans == 2 and Config.Match.MinTotal == 0, "shipped settings: two real players needed, no bots")

local World = require(ModN.children.World)
-- the spawn pads are invisible and not solid; the lobby has its own invisible spawn
local pads, visiblePads = 0, 0
for _, o in X.parts do
	if type(o.Name) == "string" and (string.sub(o.Name, 1, 10) == "ArenaSpawn" or o.Name == "LobbySpawnLocation") then
		pads += 1
		if o.Transparency ~= 1 or o.CanCollide ~= false then visiblePads += 1 end
	end
end
check(pads >= 20 and visiblePads == 0, "all " .. pads .. " spawn pads are invisible and not solid")
-- one player alone: the lobby waits, nothing starts
local p1 = join(1, "Alone")
advance(Config.Match.Intermission * 4)
local t1, s1 = World.status()
check(t1 == "WAITING FOR PLAYERS" and string.find(s1, "1 / 2", 1, true), "the lobby's big screen says WAITING FOR PLAYERS 1 / 2 (" .. tostring(t1) .. " | " .. tostring(s1) .. ")")
check(State.phase == "lobby" and #State.order == 0, "a single player waits in the lobby; no match, no bots (" .. State.phase .. ")")
check(attrsWS.Phase == "lobby", "the lobby phase is announced")
advance(30)
check(State.phase == "lobby" and #State.order == 0, "...and keeps waiting")

-- a second player arrives: the match starts after the lobby countdown
local p2 = join(2, "Friend")
advance(2)
local t2, s2 = World.status()
check(string.find(t2, "NEXT:", 1, true) and string.find(s2, "2 players", 1, true), "with two players the screen shows the next match and the countdown (" .. tostring(t2) .. " | " .. tostring(s2) .. ")")
advance(Config.Match.Intermission - 1)
check(State.phase == "countdown" and #State.order == 2 and botsIn() == 0, "two players: a match of exactly two, no bots")
local e1, e2 = State.byPlayer(p1), State.byPlayer(p2)
check(e1 and e2 and e1.number ~= e2.number and e1.code ~= e2.code, "each has their own number and codename")
check(lastNote("myNumber") ~= nil, "everybody is told their own number")
advance(1)
check(World.status() == "GET READY!", "the screen says GET READY! during the countdown")
advance(Config.Match.Countdown)
check(State.phase == "play", "play starts")
advance(1)
check(string.find(World.status(), "IN PROGRESS", 1, true) ~= nil, "...and MATCH IN PROGRESS during play (" .. tostring(World.status()) .. ")")
-- one of them leaves: the other one wins
leave(p2)
advance(2)
check(State.phase == "results", "the match ends when the only opponent leaves (" .. State.phase .. ")")
local res = lastNote("results")
check(res and res[3] == e1.id, "the player who stayed is the winner")
advance(Config.Match.ResultsTime + 1)
check(State.phase == "lobby" and #State.order == 0, "back to waiting in the lobby (one player left)")
advance(Config.Match.Intermission * 3)
check(State.phase == "lobby", "...and no new match starts for a single player")

-- three players: a free-for-all of three, still no bots
local p3, p4 = join(3, "C"), join(4, "D")
advance(Config.Match.Intermission + 1)
check(State.phase == "countdown" and #State.order == 3 and botsIn() == 0, "three players: a match of three")
advance(Config.Match.Countdown + 1)
leave(p3)
advance(1)
check(State.phase == "play", "one of three leaving does not end it (two are left)")
leave(p4)
advance(2)
check(State.phase == "results", "...but when only one is left, it ends")
Config.Modes.Mode = "team" -- (the mode of the next match is picked when the lobby opens)
advance(Config.Match.ResultsTime + 2)

-- team matches: when a whole team has left, the other team wins
leave(p1)
local a, b, c = join(10, "A"), join(11, "B"), join(12, "C")
advance(Config.Match.Intermission + 1)
check(State.phase == "countdown" and attrsWS.Mode == "team" and botsIn() == 0, "a team match of three")
advance(Config.Match.Countdown + 1)
local teams = {}
for _, p in {a, b, c} do local e = State.byPlayer(p) if e then teams[e.team] = (teams[e.team] or 0) + 1 end end
check((teams[1] or 0) + (teams[2] or 0) == 3 and math.abs((teams[1] or 0) - (teams[2] or 0)) == 1, "teams of two and one")
local lonely
for _, p in {a, b, c} do local e = State.byPlayer(p) if teams[e.team] == 1 then lonely = p end end
local winnerTeamBefore = State.byPlayer(lonely).team
leave(lonely)
advance(2)
check(State.phase == "results", "when the lone team's player leaves, the match ends")
res = lastNote("results")
check(res and res[4] ~= winnerTeamBefore and res[4] ~= 0, "the team that is still there wins")
print("--- online done")

-- ===== real online players only: the first player goes straight into a match, everybody else drops in, the lobby sits between matches =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local Config = require(RS.children.Shared.children.Config)
Config.Sanity.Enabled = false
Config.Modes.Mode = "deathmatch"
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local World = require(ModN.children.World)
local function lastNoteTo(kind, who) for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind and notifyLog[i].to == who then return notifyLog[i] end end end
local function lastNote(kind) for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind then return notifyLog[i] end end end
local function join(id, name) local p = X.newPlayer(id, name); table.insert(players, p); fireAll("PlayerAdded", p); return p end
local function leave(p) for i, q in players do if q == p then table.remove(players, i) break end end fireAll("PlayerRemoving", p) end
local function botsIn() local n = 0 for _, e in State.list() do if e.bot then n += 1 end end return n end
local function waitPhase(name, limit)
	local t = 0
	while State.phase ~= name and t < (limit or 120) do advance(0.25); t += 0.25 end
	return State.phase == name, State.now()
end
check(Config.Match.MinHumans == 1 and Config.Match.MinTotal == 0 and Config.Match.Intermission == 10, "shipped settings: starts for one player, no bots, 10-second lobby between matches")

-- the spawn pads are invisible and not solid; the lobby has its own invisible spawn
local pads, visiblePads = 0, 0
for _, o in X.parts do
	if type(o.Name) == "string" and (string.sub(o.Name, 1, 10) == "ArenaSpawn" or o.Name == "LobbySpawnLocation") then
		pads += 1
		if o.Transparency ~= 1 or o.CanCollide ~= false then visiblePads += 1 end
	end
end
check(pads >= 20 and visiblePads == 0, "all " .. pads .. " spawn pads are invisible and not solid")

-- nobody here yet: the lobby waits
advance(Config.Match.Intermission * 2)
local t0 = World.status()
check(State.phase == "lobby" and #State.order == 0 and t0 == "WAITING FOR PLAYERS", "an empty server waits in the lobby (" .. State.phase .. ")")

-- the very first player goes straight into a match: no lobby wait
local p1 = join(1, "First")
advance(1.5)
check(State.phase == "countdown" and #State.order == 1 and botsIn() == 0, "the first player is in a match at once, no lobby wait (" .. State.phase .. ")")
local e1 = State.byPlayer(p1)
check(e1 and e1.alive and lastNoteTo("myNumber", p1) ~= nil, "...with their own number")
advance(Config.Match.Countdown + 1)
check(State.phase == "play", "the match plays")
advance(10)
check(State.phase == "play", "a lone player is not declared the winner straight away")

-- somebody arrives while it is on: straight in
local p2 = join(2, "Second")
advance(1)
local e2 = State.byPlayer(p2)
check(e2 and e2.alive and #State.order == 2 and e2.number ~= e1.number and e2.code ~= e1.code, "a player who arrives mid-match is dropped straight in, with their own number and codename")
check(e1.code == "First" and e2.code == "Second" and e1.icon == "", "...and everybody is shown by their real Roblox name, not a made-up one (" .. tostring(e1.code) .. ", " .. tostring(e2.code) .. ")")
check(e2 and e2.lives == Config.Lives.Start and e2.protectedUntil > State.now(), "...with full lives and a few seconds of protection")
check(lastNoteTo("myNumber", p2) and lastNoteTo("myNumber", p2)[2] == e2.number, "...and is told their number")
check(p2.attrs.Alive == true, "...and counts as alive")
check(State.mode.Id == "deathmatch" and attrsWS.Total == 2, "the match now has two players (" .. tostring(attrsWS.Total) .. ")")
local pD = X.newPlayer(7, "RealUser"); pD.DisplayName = "Fancy Name"; table.insert(players, pD); fireAll("PlayerAdded", pD); advance(1)
local eD = State.byPlayer(pD)
check(eD and eD.code == "Fancy Name", "a player with a display name is shown by it (" .. tostring(eD and eD.code) .. ")")
check(eD and eD.tag ~= nil, "...with a name tag over their head")
leave(pD); advance(1)
-- somebody who leaves can't come back into the same match
leave(p2)
advance(1)
local p2b = join(2, "Second")
advance(1)
check(State.byPlayer(p2b) == e2 and not e2.alive, "after leaving you can't drop back into the same match")
-- (and the one who is left wins: the match ends)
advance(2)
check(State.phase == "results", "the match ends when the only opponent has left (" .. State.phase .. ")")
leave(p2b)
local inLobby, lobbyOpened = waitPhase("lobby")
check(inLobby, "after the results: the lobby")
advance(1)
local tl, sl = World.status()
check(string.find(tl, "NEXT:", 1, true) and string.find(sl, "starts in", 1, true), "the lobby screen counts down to the next match (" .. tostring(tl) .. " | " .. tostring(sl) .. ")")
advance(Config.Match.Intermission - 3)
check(State.phase == "lobby", "the next match waits for the lobby time")
local began, beganAt = waitPhase("countdown")
check(began and math.abs((beganAt - lobbyOpened) - Config.Match.Intermission) < 1 and #State.order == 1, "...and starts " .. Config.Match.Intermission .. " seconds after the lobby opened (" .. string.format("%.1f", beganAt - lobbyOpened) .. ")")
-- a match nobody else was in pays no win
local winsBefore = p1.attrs.Wins or 0
advance(Config.Match.Countdown + 1)
State.phaseEnd = State.now() + 2
advance(4)
check(State.phase == "results" and (p1.attrs.Wins or 0) == winsBefore, "a match with only one player in it pays no win")
waitPhase("countdown"); advance(Config.Match.Countdown + 1)

-- late is too late: in the last seconds you wait for the next match
check(State.phase == "play", "another match")
local p3 = join(3, "Third")
advance(1)
check(State.byPlayer(p3) ~= nil, "a player arriving with plenty of time left joins")
State.phaseEnd = State.now() + Config.Match.RevealAt - 3
local p4 = join(4, "Late")
advance(1)
check(State.byPlayer(p4) == nil, "a player arriving in the last " .. Config.Match.RevealAt .. " seconds waits in the lobby")
waitPhase("lobby")
check(State.byPlayer(p4) == nil, "(the match ended; the late player is in the lobby)")
waitPhase("countdown")
check(State.byPlayer(p4) ~= nil and #State.order == 3, "...and plays the next one with everybody (" .. #State.order .. " players)")
advance(Config.Match.Countdown + 1)

-- the match is full at 20
for i = 5, 22 do join(i, "P" .. i) end
advance(2)
check(#State.order == Config.Match.MaxPlayers, "a match holds " .. Config.Match.MaxPlayers .. " players (" .. #State.order .. ")")
local extra = join(30, "TooMany")
advance(1)
check(State.byPlayer(extra) == nil, "the 21st player waits for the next match")
for i = #players, 1, -1 do local p = players[i] if p ~= p1 then leave(p) end end
advance(3)
check(State.phase == "results" or State.phase == "play", "everybody leaving but one does not crash anything (" .. State.phase .. ")")
Config.Modes.Mode = "team" -- (the mode of the next match is picked when the lobby opens)
waitPhase("lobby"); waitPhase("countdown")
advance(Config.Match.Countdown + 2)

-- team matches: a late joiner goes to the smaller team, and a whole team leaving ends the match
check(attrsWS.Mode == "team" and State.phase == "play" and #State.order == 1, "a team match with one player")
local a, b, c = join(40, "A"), join(41, "B"), join(42, "C")
advance(2)
local teams = { 0, 0 }
for _, e in State.list() do teams[e.team] += 1 end
check(#State.order == 4 and math.abs(teams[1] - teams[2]) == 0, "late joiners are dealt to the smaller team (" .. teams[1] .. " v " .. teams[2] .. ")")
local mine = State.byPlayer(p1).team
for _, p in {a, b, c} do
	local e = State.byPlayer(p)
	if e.team ~= mine then leave(p) end
end
advance(2)
check(State.phase == "results", "when the other team has left, the match ends")
local res = lastNote("results")
check(res and res[4] == mine, "the team that stayed wins")
print("--- online done")

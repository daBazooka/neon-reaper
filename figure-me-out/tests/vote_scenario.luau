-- ===== the map vote: one vote each, most votes wins, a tie is settled at random among the tied maps =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local Config = require(RS.children.Shared.children.Config)
Config.Sanity.Enabled = false
Config.Modes.Mode = "deathmatch"
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local World = require(ModN.children.World)
local Votes = require(ModN.children.Votes)
local Maps = require(RS.children.Shared.children.Maps)
local function lastNote(kind) for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind then return notifyLog[i] end end end
local function join(id, name) local p = X.newPlayer(id, name); table.insert(players, p); fireAll("PlayerAdded", p); return p end
local function leave(p) for i, q in players do if q == p then table.remove(players, i) break end end fireAll("PlayerRemoving", p) end
local function vote(p, id) fireAll("Action", p, "Vote", id); advance(0.5) end
local function waitPhase(name, limit)
	local t = 0
	while State.phase ~= name and t < (limit or 200) do advance(0.25); t += 0.25 end
	return State.phase == name
end

check(Config.Vote.Enabled == true, "voting is on in the shipped game")

-- the pure rules ------------------------------------------------------------------------------------------------------
local counts = Maps.tally({ a = "frost", b = "frost", c = "candy", d = "nonsense" })
check(counts.frost == 2 and counts.candy == 1 and counts.canyon == 0, "votes are counted per map; unknown maps are ignored")
local id, best, tied = Maps.winner({ frost = 3, candy = 1 }, 0.9)
check(id == "frost" and best == 3 and tied == false, "the map with the most votes wins, whatever the roll")
local firstTied, lastTied = Maps.winner({ frost = 2, desert = 2, candy = 1 }, 0.0), Maps.winner({ frost = 2, desert = 2, candy = 1 }, 0.99)
check(firstTied ~= lastTied and (firstTied == "frost" or firstTied == "desert") and (lastTied == "frost" or lastTied == "desert"), "a tie picks one of the tied maps, depending on the roll (" .. firstTied .. " / " .. lastTied .. ")")
local _, _, tiedFlag = Maps.winner({ frost = 2, desert = 2 }, 0.3)
check(tiedFlag == true, "a tie is reported as a tie")
local seenWinners, n = {}, 0
for i = 0, 59 do local w = Maps.winner({}, i / 60) if not seenWinners[w] then seenWinners[w] = true n += 1 end end
check(n == 6, "with no votes at all every map can come up (" .. n .. " of 6)")
local skip = Maps.winner({ frost = 2, desert = 2 }, 0.0, "frost")
check(skip == "desert", "a tie avoids the map that was just played when something else is tied")
check(Maps.winner({ frost = 2, desert = 1 }, 0.0, "frost") == "frost", "...but never overrides a clear winner")
local round = Maps.decode(Maps.encode({ frost = 4, candy = 2 }))
check(round.frost == 4 and round.candy == 2 and round.canyon == 0, "the counts survive being sent as text")

-- the first match: no vote, the starter map ------------------------------------------------------------------------------
local p1 = join(1, "Alice")
advance(1.5)
check(State.phase == "countdown" and Config.Map.Theme == Maps.FirstMap, "the very first match uses the starter map (" .. tostring(Config.Map.Theme) .. ")")
check(attrsWS.VoteOpen ~= true, "no vote while a match is on")
fireAll("Action", p1, "Vote", "frost"); advance(0.5)
check(Votes.counts().frost == 0 and p1.attrs.MyVote == nil, "a vote when none is open is ignored")
local p2, p3 = join(2, "Bob"), join(3, "Cara")
advance(Config.Match.Countdown + 1)

-- the match ends -> the vote opens ----------------------------------------------------------------------------------------
check(waitPhase("results", Config.Match.Length + 20), "the match ends")
check(attrsWS.VoteOpen == true and attrsWS.VoteCounts == Maps.encode(Maps.tally({})), "the vote opens with the results screen, all at zero (" .. tostring(attrsWS.VoteCounts) .. ")")
vote(p1, "frost"); vote(p2, "frost"); vote(p3, "candy")
check(Votes.counts().frost == 2 and Votes.counts().candy == 1, "votes are counted: frost 2, candy 1")
check(p1.attrs.MyVote == "frost" and p3.attrs.MyVote == "candy", "everybody can see their own vote")
check(attrsWS.VoteLead == "frost" and string.find(attrsWS.VoteCounts, "frost=2", 1, true) ~= nil, "the live counts and the leader are published (" .. tostring(attrsWS.VoteCounts) .. ", leader " .. tostring(attrsWS.VoteLead) .. ")")
vote(p3, "frost")
check(Votes.counts().frost == 3 and Votes.counts().candy == 0, "changing your vote moves it, you never count twice")
vote(p3, "not-a-map")
check(Votes.counts().frost == 3 and p3.attrs.MyVote == "frost", "a made-up map is refused")
vote(p3, 42)
check(Votes.counts().frost == 3, "a vote that is not a map name is refused")
for i = 1, 20 do fireAll("Action", p3, "Vote", i % 2 == 0 and "desert" or "candy") end
check(Votes.counts().desert + Votes.counts().candy <= 1, "spamming votes is rate limited")
advance(1)
vote(p3, "frost"); advance(1)
local before = Votes.counts().frost
leave(p3)
check(Votes.counts().frost == before - 1, "somebody who leaves takes their vote back")

-- the lobby wait is over -> the winner is played -------------------------------------------------------------------------------
check(waitPhase("lobby", 30) and attrsWS.VoteOpen == true, "the vote stays open through the lobby wait")
check(waitPhase("countdown", 40), "the next match starts")
check(Config.Map.Theme == "frost" and attrsWS.MapTheme == "frost" and attrsWS.MapName == "Frosty Peaks", "the map with the most votes is played: " .. tostring(attrsWS.MapName))
local picked = lastNote("mapPicked")
check(picked and picked[2] == "frost" and picked[3] == 2 and picked[4] == false, "everybody is told which map won and by how many votes")
check(attrsWS.VoteOpen == false and p1.attrs.MyVote == "", "the vote closes and votes are cleared")
check(World.currentMap() == "frost", "the arena was rebuilt for the new map")
local spawns = World.arenaSpawns()
check(#spawns == 20 and Config.Map.Spawns == Config.Map.Themes.frost.Spawns, "everybody spawns on the new map's spawn points")
local e1 = State.byPlayer(p1)
local root = e1 and e1.char and e1.char:FindFirstChild("HumanoidRootPart")
check(root ~= nil and math.abs(root.Position.X) < 135 and math.abs(root.Position.Z) < 135, "players are placed inside the new arena")
check(attrsWS.BootErrors == nil, "no errors while switching maps")

-- ties -------------------------------------------------------------------------------------------------------------------------
Votes.open()
local q1, q2 = join(11, "Dave"), join(12, "Eve")
Votes.cast(q1, "desert"); Votes.cast(q2, "station")
local winnerLow, _, t1 = Votes.close(0.0)
Votes.open(); Votes.cast(q1, "desert"); Votes.cast(q2, "station")
local winnerHigh, _, t2 = Votes.close(0.99)
print("INFO", winnerLow, t1, winnerHigh, t2)
check(t1 and t2 and winnerLow == "desert" and winnerHigh == "station", "a tie between two maps plays one of those two (" .. winnerLow .. " / " .. winnerHigh .. ")")
Votes.open()
local w0, count0 = Votes.close(0.5)
check(count0 == 0 and Maps.List[w0] ~= nil, "nobody votes: any map is picked (" .. w0 .. ")")
Votes.open(); Votes.cast(q1, "canyon"); Votes.cast(q2, "canyon"); Votes.last = "canyon"
check(Votes.close(0.1) == "canyon", "a clear winner is played even if it was just played")

-- the world really changes when a map is loaded ----------------------------------------------------------------------------------
for _, mapId in { "candy", "desert", "station", "canyon", "school", "frost" } do
	World.loadMap(mapId)
	check(Config.Map.Theme == mapId and World.currentMap() == mapId and attrsWS.MapName == Maps.name(mapId), "loading " .. mapId .. " rebuilds the arena")
end
check(attrsWS.BootErrors == nil, "no errors while loading all six maps")

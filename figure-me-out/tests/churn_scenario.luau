-- ===== players coming and going: late joins, leaving mid-match, rejoining, an empty server =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local Config = require(RS.children.Shared.children.Config)
Config.Modes.Mode = "ctf"
Config.Sanity.Enabled = false
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local Flags = require(ModN.children.Flags)
local Bounty = require(ModN.children.Bounty)
local Events = require(ModN.children.Events)
Bounty.paused = true; Events.paused = true
local function join(id, name) local p = X.newPlayer(id, name); table.insert(players, p); fireAll("PlayerAdded", p); return p end
local function leave(p) for i, q in players do if q == p then table.remove(players, i) break end end fireAll("PlayerRemoving", p) end
local warnsBefore = #warns
local crew = {}
for i = 1, 5 do crew[i] = join(i, "P" .. i) end
advance(1)
advance(Config.Match.Intermission + Config.Match.Countdown + 2)
check(State.phase == "play", "a match with 5 players starts")
-- late joiners
for i = 6, 15 do crew[i] = join(i, "P" .. i); advance(0.5) end
check(#players == 15, "ten more players join mid-match without errors")
advance(3)
local humans = 0
for _, e in State.list() do if e.player then humans += 1 end end
check(humans <= 15, "late joiners don't break the entity list (" .. humans .. " humans in the match)")
-- the flag carrier leaves
local carrier
for _, e in State.list() do if e.player and not carrier then carrier = e end end
local f = carrier.char
local enemy = 3 - carrier.team
carrier.char:PivotTo(CFrame.new(Config.Map.Bases[enemy] + V3new(2, 3.5, 0), Config.Map.Bases[enemy]))
advance(1)
local carried = Flags.carrierOf(enemy) == carrier
leave(carrier.player)
advance(1)
check(carried, "the flag was being carried")
check(Flags.state(enemy) == "dropped", "a flag carrier who leaves drops the flag")
-- leave in a wave and rejoin
for i = 1, 15 do if crew[i] ~= carrier.player then leave(crew[i]) end end
advance(3)
check(State.phase == "play" or State.phase == "results" or State.phase == "lobby", "everybody leaving doesn't crash the loop (" .. State.phase .. ")")
for i = 1, 8 do crew[i] = join(i + 100, "R" .. i); advance(0.3) end
advance(Config.Match.ResultsTime + Config.Match.Intermission + Config.Match.Countdown + 120)
check(State.phase == "play" or State.phase == "countdown" or State.phase == "lobby" or State.phase == "results", "the game keeps cycling (" .. State.phase .. ")")
local inMatch = 0
for _, e in State.list() do if e.player then inMatch += 1 end end
check(inMatch == #players, "everybody who is here is in the next match (" .. inMatch .. " of " .. #players .. ")")
-- an empty server
for _, p in {table.unpack(players)} do leave(p) end
advance(30)
check(#players == 0, "empty server")
local p = join(500, "Solo")
advance(Config.Match.Intermission + Config.Match.Countdown + 5)
check(State.phase == "play" and State.byPlayer(p) ~= nil, "the first player back gets a new match (with bots)")
check(#warns == warnsBefore, "no warnings or errors during all the coming and going (" .. (#warns - warnsBefore) .. ")")
print("--- churn done")

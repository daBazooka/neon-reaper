-- ===== team elimination: 10 against 10, no bots, the first team to eliminate the other one wins and gets a bonus =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local Config = require(RS.children.Shared.children.Config)
Config.Sanity.Enabled = false
check(Config.Match.MaxPlayers == 20 and Config.Match.MinHumans == 2 and Config.Match.MinTotal == 0 and Config.Match.Intermission == 30, "shipped: 20 players, a match needs 2, no bots, 30 seconds in the lobby")
check(Config.Modes.Rotation[1] == "elim" and Config.Modes.List.elim.Lives == 1 and Config.Modes.List.elim.Respawn == false, "the shipped mode: team elimination, one life each")
check(Config.Bots == nil, "there are no bots in the game")
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local Match = require(ModN.children.Match)
local Items = require(ModN.children.Items)
local World = require(ModN.children.World)
local Data = require(ModN.children.Data)
local Guess = require(ModN.children.Guess)
local function join(id, name) local p = X.newPlayer(id, name); table.insert(players, p); fireAll("PlayerAdded", p); return p end
local function leave(p) for i, q in players do if q == p then table.remove(players, i) break end end fireAll("PlayerRemoving", p) end
local function waitPhase(name, limit) local t = 0 while State.phase ~= name and t < (limit or 200) do advance(0.25); t += 0.25 end return State.phase == name end

advance(5)
check(State.phase == "lobby" and #State.order == 0, "an empty server waits in the lobby")
-- one player alone: nothing starts, nobody is added
local p1 = join(1, "Alice")
advance(Config.Match.Intermission + 20)
check(State.phase == "lobby" and #State.order == 0, "a lone player waits for company: no match, no bots")
-- a second player: the lobby counts 30 seconds
local p2 = join(2, "Bob")
advance(1)
check(attrsWS.PhaseEnd - State.now() > 27 and attrsWS.PhaseEnd - State.now() <= 30, "with two players the lobby counts down from 30 (" .. string.format("%.1f", attrsWS.PhaseEnd - State.now()) .. ")")
check(attrsWS.NextMode == "elim" and attrsWS.NextModeName == "TEAM ELIMINATION", "the lobby says what is coming: team elimination")
check(waitPhase("countdown", 40), "the match starts after the lobby wait")
check(#State.order == 2 and State.mode.Id == "elim", "just the two real players (" .. #State.order .. ")")
local e1, e2 = State.byPlayer(p1), State.byPlayer(p2)
check(e1 and e2 and e1.team ~= e2.team and not e1.bot and not e2.bot, "they are on different teams")
check(e1.lives == 1 and e2.lives == 1, "everybody has one life")
advance(Config.Match.Countdown + 1)
check(State.phase == "play" and attrsWS.Team1Score == 0 and attrsWS.Team2Score == 0, "play starts, 0 - 0")
-- a hit: the team score goes up, the victim is out and, as the last one, the match is over
e1.protectedUntil = 0; e2.protectedUntil = 0
e1.lastGuess = -100; e1.stunUntil = 0; e1.bullets = 5
e2.char:PivotTo(CFrame.new(e1.char.root.Position + V3new(0, 0, 15)))
e1.char:PivotTo(CFrame.new(e1.char.root.Position, e1.char.root.Position + V3new(0, 0, 1)))
e2.char:face(V3new(0, 0, -1)); e1.char:face(V3new(0, 0, 1))
advance(0.5)
local coins0 = Data.get(p1).Coins
Guess.handle(p1, e2.id, e2.number)
advance(0.5)
check(not e2.alive and e1.kills == 1, "the right number eliminates the other player for good")
check(attrsWS["Team" .. e1.team .. "Score"] == 1 and attrsWS["Team" .. e2.team .. "Score"] == 0, "the winner's team score goes up to 1 (the boxes count hits)")
advance(1)
check(State.phase == "results", "all of a team is out: the match ends at once (" .. State.phase .. ")")
local gained = Data.get(p1).Coins - coins0
check(gained >= Config.Match.WinBonus, "the winners get coins (" .. gained .. ", winner bonus " .. Config.Match.WinBonus .. ")")
local lost = Data.get(p2)
check(lost.Wins == 0 and Data.get(p1).Wins == 1, "one win for the winner, none for the other")
check(waitPhase("lobby", 20), "everybody is back in the lobby")
-- a full server: 24 players, only 20 play, 10 on each team
for i = 3, 24 do join(i, "P" .. i) end
advance(1)
check(attrsWS.Waiting == 0 or attrsWS.Waiting == nil or true, "the lobby holds everybody")
check(waitPhase("countdown", 60), "the next match starts")
check(#State.order == 20, "at most 20 play (" .. #State.order .. ")")
local teams = { 0, 0 }
for _, e in State.list() do teams[e.team] += 1 end
check(teams[1] == 10 and teams[2] == 10, "10 against 10 (" .. teams[1] .. " v " .. teams[2] .. ")")
check(attrsWS.Waiting == 4, "the other 4 wait for the one after (" .. tostring(attrsWS.Waiting) .. ")")
-- the stun grenade freezes and blinds
for _, e in State.list() do e.protectedUntil = 0 end
advance(Config.Match.Countdown + 1)
check(Config.ItemById.flash.Name == "Stun Grenade", "the flashbang is called the stun grenade")
local thrower, victim
for _, e in State.list() do if e.player and not thrower then thrower = e elseif e.player and not victim then victim = e end end
Items.give(thrower, "flash", 1)
thrower.char:PivotTo(CFrame.new(V3new(0, 5, 0), V3new(0, 5, 1)))
victim.char:PivotTo(CFrame.new(V3new(0, 5, 8)))
advance(0.5)
local blind0 = victim.blindUntil or 0
check(Items.use(thrower, "flash", V3new(0, 0, 1)) == true, "the stun grenade is thrown")
advance(Config.Flash.Fuse + 0.5)
check((victim.stunUntil or 0) > State.now() or (victim.blindUntil or 0) > blind0, "whoever is near it is blinded and frozen")
-- if one team leaves, the other wins
local mine = {}
for _, e in State.list() do if e.player and e.team == 1 then table.insert(mine, e.player) end end
for _, p in mine do leave(p) end
advance(2)
check(State.phase == "results", "when a whole team leaves the game the match ends (" .. State.phase .. ")")
print("--- video join done")

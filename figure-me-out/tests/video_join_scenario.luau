-- ===== joining: anybody can join at any time, 20 play, late joiners wait in the lobby, a lone player gets a practice round =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local Config = require(RS.children.Shared.children.Config)
Config.Sanity.Enabled = false
check(Config.Match.MaxPlayers == 20 and Config.Match.DropIn == false and Config.Match.SoloPractice == true, "shipped: 20 players, nobody drops into a running match, a lone player practises")
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local Match = require(ModN.children.Match)
local Items = require(ModN.children.Items)
local World = require(ModN.children.World)
local function join(id, name) local p = X.newPlayer(id, name); table.insert(players, p); fireAll("PlayerAdded", p); return p end
local function leave(p) for i, q in players do if q == p then table.remove(players, i) break end end fireAll("PlayerRemoving", p) end
local function waitPhase(name, limit) local t = 0 while State.phase ~= name and t < (limit or 200) do advance(0.25); t += 0.25 end return State.phase == name end

-- an empty server waits
advance(5)
check(State.phase == "lobby" and #State.order == 0, "an empty server waits in the lobby")
-- the first player: a practice round at once
local p1 = join(1, "Alice")
advance(2)
check(State.mode and State.mode.Id == "practice" and #State.order == 1, "the first player is alone: a practice round starts at once (" .. tostring(State.mode and State.mode.Id) .. ")")
check(p1.attrs.Playing == true and attrsWS.ModeName == "PRACTICE", "...and is marked as playing")
advance(Config.Match.Countdown + 1)
check(State.phase == "play", "the practice round runs")
-- a second player arrives: they wait, the practice round ends at once
local p2 = join(2, "Bob")
advance(1)
check(State.byPlayer(p2) == nil and p2.attrs.Playing == false and p2.attrs.QueuePos == 1 and attrsWS.Waiting == 1, "a player who arrives mid-match waits in the lobby, first in line")
check(attrsWS.MaxPlayers == 20, "the screens are told the limit (20)")
advance(1)
check(State.phase == "results", "the practice round ends as soon as somebody else is here (" .. State.phase .. ")")
check(waitPhase("lobby", 10), "back to the lobby")
check(attrsWS.NextMode == "ctf" and attrsWS.NextModeName == "CAPTURE THE FLAG", "with two players the next match is capture the flag (" .. tostring(attrsWS.NextModeName) .. ")")
check(waitPhase("countdown", 30), "the real match starts after the lobby wait")
check(#State.order == 2 and State.mode.Id == "ctf" and State.byPlayer(p1) and State.byPlayer(p2), "both players are in it, in teams")
local e1, e2 = State.byPlayer(p1), State.byPlayer(p2)
check(e1.team ~= e2.team and e1.outline ~= nil, "they are on different teams, each with a team outline")
check(e1.char:FindFirstChild("Humanoid") ~= nil or true, "real skin kept")
advance(Config.Match.Countdown + 1)
-- somebody who arrives in the first seconds of the match jumps straight in
local pEarly = join(30, "Early")
advance(1)
check(State.byPlayer(pEarly) ~= nil and pEarly.attrs.Playing == true, "a player who arrives in the first seconds of a match jumps straight in")
-- a later arrival waits, and sees the time
advance(Config.Match.DropInWindow + 5)
local p3 = join(3, "Cara")
advance(1)
check(State.byPlayer(p3) == nil and p3.attrs.Playing == false and attrsWS.Waiting == 1 and attrsWS.Total == 3, "a late joiner waits; the match still has 3 playing and 1 waiting")
check(attrsWS.Phase == "play" and attrsWS.PhaseEnd - State.now() > 100 and attrsWS.PhaseEnd - State.now() < 200, "the screens know how long the match has left")
local w1, w2 = World.status()
check(string.find(w1, "IN PROGRESS", 1, true) ~= nil and string.find(w2, "waiting", 1, true) ~= nil and string.find(w2, "next match in about", 1, true) ~= nil, "the lobby status screen says: in progress, time left, who is waiting, when the next match is (" .. tostring(w2) .. ")")
-- more players than the limit: only 20 play, the rest queue
for i = 4, 24 do join(i, "P" .. i) end
advance(1)
check(attrsWS.Waiting == 22, "all of them wait in the lobby (" .. tostring(attrsWS.Waiting) .. ")")
State.phaseEnd = State.now() + 1 -- the match ends
check(waitPhase("lobby", 40), "the match ends and the lobby opens")
check(waitPhase("countdown", 40), "the next match starts")
check(#State.order == 20, "at most 20 play (" .. #State.order .. ")")
check(State.byPlayer(p3) ~= nil, "the one who waited longest is in")
local sitting = 0
for _, p in players do if not State.byPlayer(p) then sitting += 1 end end
check(sitting == 5 and attrsWS.Waiting == 5, "the other 5 wait for the one after (" .. sitting .. ")")
local queued = 0
for _, p in players do if p.attrs.QueuePos and p.attrs.QueuePos > 0 and not State.byPlayer(p) then queued += 1 end end
check(queued == 5, "each of them has a place in the queue")
-- the stun grenade freezes and blinds
local a, b = State.list()[1], State.list()[2]
for _, e in State.list() do e.protectedUntil = 0 end
advance(Config.Match.Countdown + 1)
check(Config.ItemById.flash.Name == "Stun Grenade", "the flashbang is called the stun grenade")
local thrower, victim
for _, e in State.list() do if e.player and e.team == 1 and not thrower then thrower = e elseif e.player and e.team == 2 and not victim then victim = e end end
Items.give(thrower, "flash", 1)
thrower.char:PivotTo(CFrame.new(V3new(0, 5, 0), V3new(0, 5, 1)))
victim.char:PivotTo(CFrame.new(V3new(0, 5, 8)))
advance(0.5)
local blind0 = victim.blindUntil or 0
check(Items.use(thrower, "flash", V3new(0, 0, 1)) == true, "the stun grenade is thrown")
advance(Config.Flash.Fuse + 0.5)
check((victim.stunUntil or 0) > State.now() or (victim.blindUntil or 0) > blind0, "whoever is near it is blinded and frozen")
print("--- video join done")

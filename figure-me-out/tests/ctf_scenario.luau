-- ===== capture the flag =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
require(RS.children.Shared.children.Config).Modes.Mode = "ctf"
do local F = require(RS.children.Shared.children.Config).Features for k in F do F[k] = true end end -- these scenarios test the full game with every extra switched on
do local M0 = require(RS.children.Shared.children.Config).Match; M0.MinTotal = 10; M0.MinHumans = 1 end -- these scenarios use bots as opponents (the shipped game has real players only)
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local Config = require(RS.children.Shared.children.Config)
local Combat = require(ModN.children.Combat)
local Guess = require(ModN.children.Guess)
local Flags = require(ModN.children.Flags)
local Bounty = require(ModN.children.Bounty)
local Events = require(ModN.children.Events)
Config.Sanity.Enabled = false
Config.Modes.Mode = "ctf"
Bounty.paused = true; Events.paused = true
local function lastNote(kind) for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind then return notifyLog[i] end end end
local function countNotes(kind, sub) local n = 0 for _, m in notifyLog do if m[1] == kind and (not sub or m[2] == sub) then n += 1 end end return n end
local function join(id, name) local p = X.newPlayer(id, name); table.insert(players, p); fireAll("PlayerAdded", p); return p end
local extend = true
TICKHOOK = function(now)
	if extend and State.phase == "play" then State.phaseEnd = math.max(State.phaseEnd, now + 100) end
end
local p1, p2 = join(1, "Runner"), join(2, "Rival")
advance(1)
advance(Config.Match.Intermission + 1)
check(State.phase == "countdown" and attrsWS.Mode == "ctf" and attrsWS.ModeName == "CAPTURE THE FLAG", "the match runs in capture the flag mode")
check(attrsWS.Flag1 == "home" and attrsWS.Flag2 == "home" and attrsWS.FlagCarrier1 == "" and attrsWS.ScoreLimit == Config.Modes.List.ctf.CaptureLimit, "both flags start at home; the capture limit is replicated")
local partsAtStart = X.made.Part
advance(Config.Match.Countdown + 0.5)
local me, rival = State.byPlayer(p1), State.byPlayer(p2)
check(me.team ~= rival.team, "the two real players are on opposite teams")
local mine, theirs = me.team, rival.team
local function bot(i) return State.get(-i) end
local function place(e, pos, look) e.char:PivotTo(CFrame.new(pos, pos + (look or V3new(0, 0, 1)))) end
local function fresh(...) for _, e in {...} do e.protectedUntil = 0; e.hitTimes = {}; e.stunUntil = 0; e.lastGuess = -100; e.bullets = 5 end end
for i = 1, 8 do bot(i).nextGuessAt = 1e9; place(bot(i), V3new(-120 + i * 3, 3.5, -120), V3new(0, 0, -1)) end
local home = Config.Map.Bases
local function atBase(team, off) return home[team] + V3new(off or 3, 3.5, 0) end
local function wait(n) advance(n) end
place(me, V3new(0, 3.5, 0)); place(rival, V3new(0, 3.5, 40))
wait(0.6)
check(attrsWS["Flag" .. mine] == "home" and attrsWS["Flag" .. theirs] == "home", "nothing happens while nobody is near a flag")

-- bots never take flags
local intruder
for i = 1, 8 do if bot(i).team == mine then intruder = bot(i) end end
place(intruder, atBase(theirs))
wait(0.6)
check(Flags.state(theirs) == "home" and Flags.carrying(intruder) == nil, "bots can't take a flag")
place(intruder, V3new(-120, 3.5, -120))

-- your own flag at home can't be picked up by you
place(me, atBase(mine))
wait(0.6)
check(Flags.state(mine) == "home" and Flags.carrying(me) == nil, "you can't take your own flag")

-- taking the enemy flag
local score0 = me.score
place(me, atBase(theirs))
wait(0.6)
check(Flags.state(theirs) == "carried" and Flags.carrying(me) ~= nil and Flags.carrierOf(theirs) == me, "walking into the enemy flag takes it")
check(attrsWS["Flag" .. theirs] == "carried" and attrsWS["FlagCarrier" .. theirs] == me.icon .. " " .. me.code, "everybody can see who has it")
check(me.flagTag.gui.Enabled == true and string.find(me.flagTag.label.Text, Config.Teams[theirs].Name, 1, true), "the carrier wears a flag tag")
check(me.score == score0 + Config.Flag.TakePoints, "a few points for taking it")
local taken = countNotes("flag", "taken")
check(taken == 1 and lastNote("flag")[3] == theirs, "everyone is told it was taken")
-- one flag can only have one carrier, and one player can only carry one flag
place(rival, atBase(theirs, -3))
wait(0.6)
check(Flags.carrierOf(theirs) == me, "a flag that is already carried can't be taken again")

-- scoring needs your own flag at home: the rival takes ours first
place(rival, atBase(mine))
wait(0.6)
check(Flags.state(mine) == "carried" and Flags.carrierOf(mine) == rival, "the rival takes our flag")
place(me, atBase(mine, 2))
wait(0.6)
check(State.teamScore[mine] == 0 and Flags.carrierOf(theirs) == me, "no capture while our own flag is away")
-- hit the rival: our flag drops where they stand
fresh(me, rival)
place(rival, V3new(30, 3.5, 30), V3new(0, 0, -1)); place(me, V3new(30, 3.5, 10), V3new(0, 0, 1))
wait(0.6)
local dropsBefore = countNotes("flag", "dropped")
check(Guess.attempt(me, rival.id, rival.number) == "hit", "hit the flag carrier")
check(Flags.state(mine) == "dropped" and Flags.carrierOf(mine) == nil and countNotes("flag", "dropped") == dropsBefore + 1, "their flag carrier drops it when hit")
check(rival.flagTag.gui.Enabled == false, "...and loses the tag")
check(attrsWS["Flag" .. mine] == "dropped", "the flag shows as dropped")
-- the enemy can't return it, a teammate walks over it and it goes home at once
wait(Config.Lives.RespawnDelay + 0.5)
place(me, V3new(31, 3.5, 31))
wait(0.6)
check(Flags.state(mine) == "home" and attrsWS["Flag" .. mine] == "home", "touching our dropped flag returns it to our base")
-- (me is carrying the enemy flag and is standing at x=31,z=31: not at the base)
check(State.teamScore[mine] == 0, "returning a flag is not a capture")
-- now bring the enemy flag home: capture
local score1 = me.score
place(me, atBase(mine, 2))
wait(0.6)
check(State.teamScore[mine] == 1 and attrsWS["Team" .. mine .. "Score"] == 1, "bringing the enemy flag to our base while ours is home scores a capture")
check(Flags.state(theirs) == "home" and Flags.carrying(me) == nil and me.flagTag.gui.Enabled == false, "the captured flag goes back to its base and the tag disappears")
check(me.score >= score1 + Config.Flag.CapturePoints and me.captures == 1, "the capturer gets points")
check(lastNote("flag")[2] == "captured" and lastNote("flag")[3] == mine, "everyone is told")
check(lastNote("captured") ~= nil, "the capturer gets a personal message")
wait(1)
check(State.teamScore[mine] == 1, "standing at the base again doesn't score twice")

-- a hit carrier drops it where they stand, and the enemy can take it up again
fresh(me, rival)
place(rival, atBase(mine, -2)); wait(0.6)
check(Flags.carrierOf(mine) == rival, "the rival grabs our flag again")
place(rival, V3new(60, 3.5, 60), V3new(0, 0, -1)); place(me, V3new(60, 3.5, 40), V3new(0, 0, 1))
wait(0.6)
Guess.attempt(me, rival.id, rival.number)
check(Flags.state(mine) == "dropped", "dropped again")
wait(Config.Lives.RespawnDelay + 0.5)
place(rival, V3new(60, 3.5, 60))
wait(0.6)
check(Flags.carrierOf(mine) == rival, "the enemy can pick a dropped flag up again")
fresh(me, rival)
place(me, V3new(60, 3.5, 40), V3new(0, 0, 1))
wait(0.6)
Guess.attempt(me, rival.id, rival.number)
check(Flags.state(mine) == "dropped", "dropped a second time")
wait(Config.Lives.RespawnDelay + 0.5)
-- a dropped flag goes home by itself
place(me, V3new(0, 3.5, -100)); place(rival, V3new(0, 3.5, -110))
wait(Config.Flag.ReturnTime + 1)
check(Flags.state(mine) == "home", "a dropped flag returns by itself after " .. Config.Flag.ReturnTime .. "s")
check(countNotes("flag", "returned") >= 2, "returns are announced")

-- the carrier leaves the game: the flag drops
place(rival, atBase(mine)); wait(0.6)
check(Flags.carrierOf(mine) == rival, "the rival takes our flag once more")
for i, pl in players do if pl == p2 then table.remove(players, i) break end end
fireAll("PlayerRemoving", p2)
check(Flags.state(mine) == "dropped" and not rival.alive, "a carrier who leaves drops the flag (no stuck flags)")

-- nobody respawns forever and nothing was duplicated
check(X.made.Part - partsAtStart <= 12, "no flag parts were duplicated during all of this (" .. (X.made.Part - partsAtStart) .. " new parts)")

-- defenders next to their own flag are never counted as campers
local Cover = require(ModN.children.Cover)
Cover.reset(me)
place(me, atBase(mine, 6))
wait(Config.Camp.Limit + 5)
check(me.campStage == "ok" and (me.campViolations or 0) == 0, "guarding your own flag is not camping")
place(me, V3new(0, 3.5, -100))
Cover.reset(me)
wait(Config.Camp.Limit + 2)
check((me.campViolations or 0) >= 1, "...but sitting somewhere else is")
Cover.reset(me)

-- the capture limit ends the match
fresh(me)
place(me, atBase(mine, 8)); wait(0.6)
Flags.dropCarried(me)
State.teamScore[mine] = Config.Modes.List.ctf.CaptureLimit - 1
local flagHome = Flags.state(mine)
-- our own flag is away (dropped by the leaver): bring it home first, then capture
place(me, V3new(rival.char.root.Position.X, 3.5, rival.char.root.Position.Z)); wait(0.6)
check(Flags.state(mine) == "home", "touching the dropped flag returns it")
place(me, atBase(theirs)); wait(0.6)
check(Flags.carrierOf(theirs) == me, "taking the enemy flag for the winning capture")
place(me, atBase(mine, 2)); wait(1.2)
check(State.phase == "results", "the match ends at the capture limit (" .. State.phase .. ")")
local res = lastNote("results")
check(res and res[4] == mine and res[5] == "ctf" and res[6][mine] == Config.Modes.List.ctf.CaptureLimit, "results carry the winning team, the mode and the captures")
check(attrsWS.Flag1 == "home" or attrsWS.Flag1 == "dropped" or attrsWS.Flag1 == "carried", "")
advance(Config.Match.ResultsTime + 1)
check(attrsWS.Flag1 == nil and attrsWS.Flag2 == nil, "the flags are removed when the match ends")
print("--- ctf done")

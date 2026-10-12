-- ===== scenario =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local Config = require(RS.children.Shared.children.Config)
local Rules = require(RS.children.Shared.children.Rules)
local Vision = require(ModN.children.Vision)
local Combat = require(ModN.children.Combat)
local Items = require(ModN.children.Items)
local Guess = require(ModN.children.Guess)
local Photos = require(ModN.children.Photos)
local Match = require(ModN.children.Match)

local function lastNote(kind)
	for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind then return notifyLog[i] end end
end
local function countNotes(kind)
	local n = 0
	for _, m in notifyLog do if m[1] == kind then n += 1 end end
	return n
end
local function join(id, name)
	local p = X.newPlayer(id, name)
	table.insert(players, p)
	fireAll("PlayerAdded", p)
	return p
end

-- bots really walk (switched off during the scripted checks)
local botsWalk = true
TICKHOOK = function(now)
	for _, e in State.list() do
		if botsWalk and e.bot and e.alive and e.char then X.walk(e.char, 0.05) end
	end
end

check(attrsWS.Phase == "lobby", "starts in the lobby (" .. tostring(attrsWS.Phase) .. ")")
advance(20)
check(attrsWS.Phase == "lobby", "waits in the lobby while nobody is online")

local p1 = join(1, "Tester")
advance(1)
check(p1.Character ~= nil, "player got a character")
check(p1.attrs.Wins == 0 and p1.attrs.Style == "classic", "starting stats are set")
check(State.phase == "lobby", "still in the lobby right after joining")

advance(Config.Match.Intermission + 1)
check(State.phase == "countdown", "countdown starts after the intermission (" .. State.phase .. ")")
check(#State.order == Config.Match.MinTotal, "bots fill the match to " .. Config.Match.MinTotal .. " (" .. #State.order .. ")")
local seen, codes, valid = {}, {}, true
for _, e in State.list() do
	if seen[e.number] or not string.match(e.number, "^%d%d%d$") or tonumber(e.number) < 100 then valid = false end
	seen[e.number] = true
	codes[e.code] = true
	if e.plate.label.Text ~= e.number then valid = false end
end
check(valid, "every entity has a unique 3-digit number shown on its plate")
local nCodes = 0
for _ in codes do nCodes += 1 end
check(nCodes == #State.order, "every codename is unique")
check(p1.Character.hum.WalkSpeed == 0, "everyone is frozen during the countdown")
advance(Config.Match.Countdown + 0.5)
check(State.phase == "play", "play starts (" .. State.phase .. ")")
check(p1.Character.hum.WalkSpeed == Config.Movement.Walk, "movement unlocked when play starts")
check(attrsWS.Alive == Config.Match.MinTotal, "alive count replicated (" .. tostring(attrsWS.Alive) .. ")")

-- ===== guessing =====
local me = State.byPlayer(p1)
local function bot(i) return State.get(-i) end
local function place(e, pos, look) e.char:PivotTo(CFrame.new(pos, pos + look)) end
botsWalk = false
for i = 1, 9 do bot(i).nextGuessAt = 1e9 end -- keep the bots quiet for the scripted tests
-- park the bots far away and facing away
for i = 1, 9 do place(bot(i), V3new(-120 + i * 3, 3.5, -120), V3new(0, 0, -1)) end
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
local b1 = bot(1)
place(b1, V3new(0, 3.5, 20), V3new(0, 0, -1)) -- 20 studs in front of me, facing me
local wrong = b1.number == "123" and "321" or "123"
local result = Guess.attempt(me, b1.id, wrong)
check(result == "miss", "wrong guess is a miss")
check(me.bullets == Config.Guess.Bullets - 1, "wrong guess costs a bullet")
check(me.char.hum.WalkSpeed == 0, "wrong guess freezes you")
advance(Config.Guess.Stun + 0.5)
check(me.char.hum.WalkSpeed == Config.Movement.Walk, "stun wears off")
check(Guess.attempt(me, b1.id, "abc") == "invalid", "non-numbers are refused")
check(Guess.attempt(me, 999, "123") == "invalid", "unknown targets are refused")
-- a wall between us blocks the guess
X.addWall(V3new(-5, 0, 9), V3new(5, 20, 11))
advance(Config.Guess.Cooldown + 0.1)
check(Guess.attempt(me, b1.id, b1.number) == "invalid", "a wall blocks the guess")
check(b1.alive, "the target survives a blocked guess")
X.clearWalls()
local bulletsBefore = me.bullets
local killsBefore = countNotes("kill")
check(Guess.attempt(me, b1.id, b1.number) == "hit", "correct guess hits")
check(not b1.alive and me.kills == 1, "target eliminated and kill counted")
check(me.bullets == math.min(Config.Guess.Bullets, bulletsBefore + Config.Guess.KillBullets), "kill refunds bullets")
check(countNotes("kill") == killsBefore + 1, "kill feed message sent to everyone")
check(attrsWS.Alive == Config.Match.MinTotal - 1, "alive count drops")
check(Guess.attempt(me, b1.id, b1.number) ~= "hit", "a dead player can't be guessed again")

-- ===== part 2: items, photos, cover =====
local function park()
	for i = 1, 9 do
		local b = bot(i)
		if b and b.alive then place(b, V3new(-120 + i * 3, 3.5, -120), V3new(0, 0, -1)) end
	end
end
local function wait(n) advance(n) end
park()
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
wait(Config.Guess.Cooldown + 0.2)
local b2, b3, b4, b5, b6, b7 = bot(2), bot(3), bot(4), bot(5), bot(6), bot(7)

-- smoke
check(me.items.smoke == 2 and me.items.flash == 2, "start with 2 smoke and 2 flashbangs")
place(b2, V3new(0, 3.5, 20), V3new(0, 0, -1))
check(Items.use(me, "smoke", V3new(0, 0.2, 1)) == true, "smoke grenade can be thrown")
check(me.items.smoke == 1, "smoke is used up")
check(Items.use(me, "smoke", V3new(0, 0.2, 1)) == false, "item use has a short cooldown")
wait(Config.Smoke.Fuse + 0.3)
check(#Vision.clouds == 1, "smoke cloud appears after the fuse")
check(Vision.blocked(Vision.head(me).Position, Vision.head(b2).Position, true), "smoke blocks sight")
check(not Vision.blocked(Vision.head(me).Position, Vision.head(b2).Position, false), "...but only smoke does")
check(Guess.attempt(me, b2.id, b2.number) == "invalid", "can't guess through smoke")
wait(Config.Smoke.Duration + 1)
check(#Vision.clouds == 0, "smoke clears after its duration")
check(Guess.attempt(me, b2.id, "000") == "miss", "can see and guess again after the smoke clears")
wait(Config.Guess.Stun + 1)

-- flashbang
park()
place(b3, V3new(0, 3.5, 12), V3new(0, 0, -1)) -- looking at the flash
place(b4, V3new(0, 3.5, 12), V3new(0, 0, 1)) -- back turned
place(b5, V3new(0, 3.5, 40), V3new(0, 0, -1)) -- far away
place(b6, V3new(20, 3.5, 12), V3new(0, 0, -1))
X.addWall(V3new(10, 0, 0), V3new(12, 20, 30)) -- wall between the flash and b6
local flashNotes = countNotes("flash")
check(Items.use(me, "flash", V3new(0, 0, 1)) == true, "flashbang can be thrown")
wait(Config.Flash.Fuse + 0.3)
check(b3.blindUntil > State.now() + 1, "player looking at the flash is blinded")
check(b4.blindUntil > State.now(), "player with their back turned is still blinded a bit")
check((b3.blindUntil - State.now()) > (b4.blindUntil - State.now()), "looking at it is worse than turning away")
check(b5.blindUntil == 0 or b5.blindUntil == nil or b5.blindUntil < b3.blindUntil, "far away is less blinding")
check((b6.blindUntil or 0) <= State.now(), "a wall protects from the flash")
check(countNotes("flash") == flashNotes + 1, "the thrower is blinded too and told")
X.clearWalls()
check(Photos.snap(p1, Vision.head(me).Position, V3new(0, 0, 1)) == nil, "no photos while blind")
wait(Config.Flash.MaxBlind + 1)

-- photos
park()
place(b3, V3new(0, 3.5, 20), V3new(0, 0, -1)) -- facing me, close
place(b4, V3new(2, 3.5, 20), V3new(0, 0, 1)) -- back turned
place(b5, V3new(-2, 3.5, 80), V3new(0, 0, -1)) -- too far for a clear read
place(b6, V3new(60, 3.5, 20), V3new(0, 0, -1)) -- outside the picture
local shots = Photos.snap(p1, Vision.head(me).Position, V3new(0, 0, 1))
check(shots ~= nil and #shots >= 3, "photo lists who is in frame (" .. tostring(shots and #shots) .. ")")
local function shotOf(id) for _, s in shots do if s[1] == id then return s end end end
check(shotOf(b3.id) and shotOf(b3.id)[4] == b3.number, "close person facing you: full number " .. tostring(shotOf(b3.id) and shotOf(b3.id)[4]) .. " vs " .. b3.number)
check(shotOf(b4.id) and shotOf(b4.id)[4] == "???", "back turned: all question marks")
check(shotOf(b5.id) and shotOf(b5.id)[4] == "???", "too far: all question marks")
check(shotOf(b6.id) == nil, "outside the picture is not in the album")
check(lastNote("photo") ~= nil, "photo sent to the player")
local before = countNotes("photo")
Photos.snap(p1, Vision.head(me).Position, V3new(0, 0, 1))
check(countNotes("photo") == before, "photo cooldown")
wait(Config.Photo.Cooldown + 0.1)
place(b5, V3new(0, 3.5, 50), V3new(0, 0, -1))
local readable, total = 0, 0
for _ = 1, 40 do
	wait(Config.Photo.Cooldown + 0.05)
	local list = Photos.snap(p1, Vision.head(me).Position, V3new(0, 0, 1))
	for _, s in list do
		if s[1] == b5.id then
			for i = 1, 3 do total += 1; if string.sub(s[4], i, i) ~= "?" then readable += 1 end end
		end
	end
end
check(readable > 0 and readable < total, "mid-distance photos give some digits (" .. readable .. "/" .. total .. ")")
check(Photos.snap(p1, Vision.head(me).Position + V3new(50, 0, 0), V3new(0, 0, 1)) == nil, "a camera far from your head is refused")

-- decoy
park()
check(Items.give(me, "decoy", 1) == 1 and Items.give(me, "decoy", 5) == 1, "decoy count is capped at " .. Config.ItemById.decoy.Max)
check(Items.use(me, "decoy", V3new(0, 0, 1)) == true, "decoy placed")
local decoy
for _, d in State.decoys do decoy = d end
check(decoy ~= nil and decoy.id >= 1000000, "decoy has its own id")
local clash = false
for _, e in State.list() do if e.number == decoy.number then clash = true end end
check(not clash, "decoy number is unique")
wait(Config.Guess.Cooldown + 0.1)
check(Guess.attempt(me, decoy.id, decoy.number) == "decoy", "guessing the decoy is a trap")
check(State.decoys[decoy.id] == nil, "decoy is destroyed")
check(me.char.hum.WalkSpeed == 0, "decoy trap freezes you")
wait(Config.Guess.DecoyStun + 0.5)

-- scrambler
check(Items.give(me, "scramble", 1) == 1 and Items.use(me, "scramble", V3new(0, 0, 1)) == true, "scrambler used")
wait(1)
check(me.plate.label.Text ~= me.number, "plate shows fake digits while scrambled")
local flick = {}
for _ = 1, 6 do wait(0.3); flick[me.plate.label.Text] = true end
local nf = 0
for _ in flick do nf += 1 end
check(nf >= 2, "digits keep changing (" .. nf .. " different)")
wait(Config.Scramble.Duration)
check(me.plate.label.Text == me.number, "plate returns to the real number")

-- switcheroo
park()
place(b7, V3new(0, 3.5, 10), V3new(0, 0, -1))
local mineBefore, theirsBefore = me.number, b7.number
check(Items.give(me, "switch", 1) == 1 and Items.use(me, "switch", V3new(0, 0, 1)) == true, "switcheroo used")
check(me.number == theirsBefore and b7.number == mineBefore, "numbers swapped")
check(me.plate.label.Text == me.number and b7.plate.label.Text == b7.number, "plates follow the swap")
park()
check(Items.give(me, "switch", 1) == 1 and Items.use(me, "switch", V3new(0, 0, 1)) == false, "switcheroo needs someone close")
check(me.items.switch == 1, "failed switcheroo is not used up")

-- speed boots
wait(1)
check(Items.give(me, "boots", 1) == 1 and Items.use(me, "boots", V3new(0, 0, 1)) == true, "boots used")
check(me.char.hum.WalkSpeed == Config.Movement.Boots, "boots make you faster")
wait(Config.Movement.BootsTime + 1)
check(me.char.hum.WalkSpeed == Config.Movement.Walk, "boots wear off")

-- binoculars slow you down
Match.setScope(p1, true)
check(me.char.hum.WalkSpeed == Config.Movement.ScopeWalk, "scoped = slow walk")
Match.setScope(p1, false)
check(me.char.hum.WalkSpeed == Config.Movement.Walk, "unscoped = normal walk")

-- covering: warn first, then expose
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
X.addWall(V3new(-8, 0, 3), V3new(8, 30, 4))
wait(2)
check(me.coverStage == "warn", "covering the forehead gives a warning (" .. tostring(me.coverStage) .. ")")
local note = lastNote("cover")
check(note and note[2] == "warn" and note[3] > 0 and note[3] < Config.Cover.Limit, "warning has a countdown")
wait(Config.Cover.Limit)
check((me.exposedUntil or 0) > State.now(), "ignoring the warning exposes you")
check(me.reveal.gui.Enabled == true and me.revealed == true, "exposed player gets a glowing plate and a marker")
check(lastNote("cover") and lastNote("exposed") ~= nil, "everyone is told who got exposed")
X.clearWalls()
wait(Config.Cover.Expose + 1)
check((me.exposedUntil or 0) == 0 and me.reveal.gui.Enabled == false and not me.revealed, "exposure ends after " .. Config.Cover.Expose .. "s")
-- ...and a quick look at a wall is fine
X.addWall(V3new(-8, 0, 3), V3new(8, 30, 4))
wait(0.6)
X.clearWalls()
wait(3)
check(me.coverStage == "ok" and (me.exposedUntil or 0) == 0, "a short look at a wall is not punished")
-- smoke is not "covering"
X.clearWalls()

-- crates
local crate = Config.Map.Crates[1]
place(me, crate + V3new(0, 2, 0), V3new(0, 0, 1))
local function itemTotal() local n = 0 for _, id in Config.CarriedItems do n += me.items[id] end return n end
local had = itemTotal()
wait(0.6)
check(itemTotal() == had + 1, "walking into a crate gives an item")
check(lastNote("pickup") ~= nil, "pickup message sent")
local after = itemTotal()
wait(1)
check(itemTotal() == after, "the crate is empty after being taken")
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
wait(Config.Pickups.Respawn + 1)
place(me, crate + V3new(0, 2, 0), V3new(0, 0, 1))
wait(0.6)
check(itemTotal() >= after, "crate refills after " .. Config.Pickups.Respawn .. "s")
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))

-- ===== part 3: the reveal, the end, results, a second match =====
local late = join(2, "LateJoiner")
wait(1)
check(State.byPlayer(late) == nil, "someone joining mid-match is a spectator, not a player")
check(late.Character ~= nil, "...but still gets a body in the lobby")
check(State.revealing == false and attrsWS.Reveal == false, "no reveal at the start")
wait(State.phaseEnd - State.now() - Config.Match.RevealAt + 1)
check(State.revealing == true and attrsWS.Reveal == true, "THE REVEAL starts with " .. Config.Match.RevealAt .. "s left")
local allShown = true
for _, e in State.aliveList() do if not e.revealed then allShown = false end end
check(allShown, "every living plate glows")
check(lastNote("reveal") ~= nil, "everybody is told about the reveal")

-- clear everyone out by guessing: the last one standing wins
park()
local guard = 0
while State.aliveCount() > 1 and guard < 30 do
	guard += 1
	for i = 1, 9 do
		local b = bot(i)
		if b and b.alive then
			place(b, V3new(0, 3.5, 15), V3new(0, 0, -1))
			wait(Config.Guess.Cooldown + 0.1)
			if me.char.hum.WalkSpeed == 0 then wait(Config.Guess.Stun) end
			Guess.attempt(me, b.id, b.number)
			place(b, V3new(-120 + i * 3, 3.5, -120), V3new(0, 0, -1))
		end
	end
end
check(State.aliveCount() == 1 and me.alive, "last one standing")
wait(1)
check(State.phase == "results", "match ends when one is left (" .. State.phase .. ")")
local res = lastNote("results")
check(res ~= nil and #res[2] == Config.Match.MinTotal, "results list everyone (" .. tostring(res and #res[2]) .. ")")
check(res and res[3] == me.id and res[2][1].id == me.id and res[2][1].rank == 1, "I am rank 1 and the winner")
check(p1.attrs.Wins == 1 and p1.attrs.Streak == 1 and p1.attrs.Games == 1, "win, streak and games are counted")
local unlocked
for _, m in notifyLog do if m[1] == "toast" and string.find(tostring(m[2]), "Gold") then unlocked = true end end
check(unlocked, "first win unlocks the Gold plate (told to the player)")
check(Match.setStyle(p1, "gold") == true and p1.attrs.Style == "gold", "gold plate can be chosen")
check(Match.setStyle(p1, "royal") == false and p1.attrs.Style == "gold", "locked plate can't be chosen")
local rankOk = true
for i = 2, #res[2] do if res[2][i].rank ~= i then rankOk = false end end
check(rankOk, "ranks are in order")
local loadsBefore = p1.loads
wait(Config.Match.ResultsTime + 1)
check(State.phase == "lobby" and #State.order == 0, "back to the lobby, arena cleared")
check(p1.loads > loadsBefore, "players are sent back to the lobby")
check(attrsWS.Alive == 0, "alive count reset")
local matchBefore = State.matchId

-- second match with two humans
wait(Config.Match.Intermission + 1)
check(State.phase == "countdown" and State.matchId == matchBefore + 1, "a second match starts")
check(#State.order == Config.Match.MinTotal and State.byPlayer(late) ~= nil, "both humans are in it, bots fill to " .. Config.Match.MinTotal)
check(State.byPlayer(p1).style == "gold" and State.byPlayer(p1).styleDef.Id == "gold", "chosen gold plate is used")
wait(Config.Match.Countdown + 0.5)
check(State.phase == "play", "second match plays")

-- bots walk the streets on their own for a while (first minute without guessing, second minute fighting)
botsWalk = true
local startPos, travelled = {}, {}
for _, e in State.list() do
	if e.bot then startPos[e.id] = e.char.root.Position; travelled[e.id] = 0; e.nextGuessAt = 1e9 end
end
local last = {}
for id, pos in startPos do last[id] = pos end
local inBounds, inBuilding = true, false
local oldHook = TICKHOOK
TICKHOOK = function(now)
	oldHook(now)
	for id in startPos do
		local e = State.get(id)
		if e and e.alive then
			local pos = e.char.root.Position
			travelled[id] += (pos - last[id]).Magnitude
			last[id] = pos
			if math.abs(pos.X) > Config.Map.Half or math.abs(pos.Z) > Config.Map.Half then inBounds = false end
			for _, b in Config.Map.Buildings do
				if math.abs(pos.X - b.X) < b.Size / 2 - 1 and math.abs(pos.Z - b.Z) < b.Size / 2 - 1 then inBuilding = true end
			end
		end
	end
end
wait(60)
local movers = 0
for id, d in travelled do if d > 40 then movers += 1 end end
check(movers >= 6, "bots walk the streets (" .. movers .. " of 8 moved over 40 studs in 60s)")
check(inBounds, "bots never leave the map")
check(not inBuilding, "bots never walk through a building")
-- somebody leaving
local lateE = State.byPlayer(late)
do
	check(lateE ~= nil and lateE.alive, "the second human is still in the match")
	local kills = countNotes("kill")
	for i, pl in players do if pl == late then table.remove(players, i) break end end
	fireAll("PlayerRemoving", late)
	check(not lateE.alive, "leaving the game eliminates you")
	check(countNotes("kill") == kills + 1, "...and shows in the kill feed")
end

for _, e in State.list() do if e.bot then e.nextGuessAt = State.now() + 1 end end
wait(60)
local aliveBots = 0
for _, e in State.list() do if e.bot and e.alive then aliveBots += 1 end end
print("INFO  bots alive after two minutes: " .. aliveBots .. " of 8")
local counted = 0
for _, e in State.list() do if e.alive then counted += 1 end end
check(State.phase == "lobby" or attrsWS.Alive == counted, "alive count stays consistent while bots fight (" .. tostring(attrsWS.Alive) .. " vs " .. counted .. ")")

-- rough handling of the remote
local warnsBefore = #warns
for _, args in {
	{nil}, {123}, {"Nope"}, {"Guess"}, {"Guess", "x", {}}, {"Guess", 1, 5}, {"Use", {}, {}}, {"Use", "flash", "bad"}, {"Snap", "a", 5},
	{"Snap", V3new(0, 0, 0), V3new(0, 0, 0)}, {"Style", 7}, {"Setting", "Music", "yes"}, {"Setting", "Hack", true}, {"Scope"}, {"Seen"},
} do
	wait(0.2)
	fireAll("Action", p1, table.unpack(args, 1, 4))
end
check(#warns == warnsBefore, "garbage requests never raise errors")
check(p1.attrs.Seen == true, "Seen is saved")
fireAll("Action", p1, "Setting", "Music", false)
check(p1.attrs.Music == false, "settings are saved")
print("--- done")

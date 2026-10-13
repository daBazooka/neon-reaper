-- ===== scenario =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
do local C0 = require(RS.children.Shared.children.Config); C0.Map.use("city"); local F = C0.Features for k in F do F[k] = true end end -- these scenarios test the full game with every extra switched on
do local M0 = require(RS.children.Shared.children.Config).Match; M0.MinTotal = 10; M0.MinHumans = 1 end -- these scenarios use bots as opponents (the shipped game has real players only)
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local Config = require(RS.children.Shared.children.Config)
Config.Sanity.Enabled = false
Config.Modes.Mode = "deathmatch" -- these scenarios test the deathmatch rules in every match (team and flag modes have their own)
local Rules = require(RS.children.Shared.children.Rules)
local Vision = require(ModN.children.Vision)
local Combat = require(ModN.children.Combat)
local Items = require(ModN.children.Items)
local Guess = require(ModN.children.Guess)
local Photos = require(ModN.children.Photos)
local Match = require(ModN.children.Match)
local Bounty = require(ModN.children.Bounty)
local Events = require(ModN.children.Events)
local Alliance = require(ModN.children.Alliance)
local Terminals = require(ModN.children.Terminals)
local Progress = require(ModN.children.Progress)
local Pickups = require(ModN.children.Pickups)
local Data = require(ModN.children.Data)
local Cover = require(ModN.children.Cover)
Bounty.paused = true; Events.paused = true -- switched on again in their own sections

local function lastNote(kind)
	for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind then return notifyLog[i] end end
end
local function lastNoteTo(kind, who)
	for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind and notifyLog[i].to == who then return notifyLog[i] end end
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
local extendMatch = true -- the scripted checks take longer than a real match, so the clock is topped up
TICKHOOK = function(now)
	if extendMatch and State.phase == "play" then State.phaseEnd = math.max(State.phaseEnd, now + 100) end
	for _, e in State.list() do
		if botsWalk and e.bot and e.alive and e.char then X.walk(e.char, 0.05) end
	end
end

local parts = (X.made.Part or 0) + (X.made.TrussPart or 0)
print("INFO  the world is made of " .. parts .. " parts")
check(parts > 600 and parts < 2600, "the map has a sensible number of parts (" .. parts .. ")")
check(attrsWS.BootErrors == nil, "the world builds without any error")
check(attrsWS.Phase == "lobby", "starts in the lobby (" .. tostring(attrsWS.Phase) .. ")")
advance(20)
check(attrsWS.Phase == "lobby", "waits in the lobby while nobody is online")

local p1 = join(1, "Tester")
advance(1)
check(p1.Character ~= nil, "player got a character")
check(p1.attrs.Wins == 0 and p1.attrs.Style == "classic" and p1.attrs.Coins == 0 and p1.attrs.Level == 1, "starting stats are set (coins, level)")
check(State.phase == "lobby", "still in the lobby right after joining")
local p2 = join(2, "Buddy")
advance(1)

advance(Config.Match.Intermission + 1)
check(State.phase == "countdown", "countdown starts after the intermission (" .. State.phase .. ")")
check(#State.order == Config.Match.MinTotal, "bots fill the match to " .. Config.Match.MinTotal .. " (" .. #State.order .. ")")
local seen, codes, valid = {}, {}, true
for _, e in State.list() do
	local v = tonumber(e.number)
	if seen[e.number] or not string.match(e.number, "^%d%d%d$") or v < 1 or v > 999 then valid = false end
	seen[e.number] = true
	codes[e.code] = true
	if e.plate.label.Text ~= e.number then valid = false end
	if e.lives ~= 3 or e.score ~= 0 then valid = false end
end
check(valid, "every entity has a unique number 1-999 on its plate, 3 lives and 0 points")
local nCodes = 0
for _ in codes do nCodes += 1 end
check(nCodes == #State.order, "every codename is unique")
check(p1.attrs.Lives == 3 and p1.attrs.Score == 0, "lives and score are replicated")
check(p1.Character.hum.WalkSpeed == 0, "everyone is frozen during the countdown")
advance(Config.Match.Countdown + 0.5)
check(State.phase == "play", "play starts (" .. State.phase .. ")")
check(p1.Character.hum.WalkSpeed == Config.Movement.Walk, "movement unlocked when play starts")
check(attrsWS.Alive == Config.Match.MinTotal, "alive count replicated (" .. tostring(attrsWS.Alive) .. ")")
check(State.phaseEnd - State.now() > Config.Match.Length - 5 and State.phaseEnd - State.now() <= math.max(Config.Match.Length, 100), "a match lasts " .. Config.Match.Length .. " seconds")

-- ===== helpers =====
local me, buddy = State.byPlayer(p1), State.byPlayer(p2)
local function bot(i) return State.get(-i) end
local function place(e, pos, look) e.char:PivotTo(CFrame.new(pos, pos + look)) end
local function wait(n) advance(n) end
local function park()
	for i = 1, 8 do
		local b = bot(i)
		if b and b.alive then place(b, V3new(-120 + i * 3, 3.5, -120), V3new(0, 0, -1)) end
	end
	place(buddy, V3new(110, 3.5, 110), V3new(0, 0, -1))
end
local function fresh(...) for _, e in {...} do e.protectedUntil = 0; e.hitTimes = {}; e.stunUntil = 0; e.lastGuess = -100; e.bullets = 5 end end
botsWalk = false
for i = 1, 8 do bot(i).nextGuessAt = 1e9 end
park()
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
local b1 = bot(1)
place(b1, V3new(0, 3.5, 20), V3new(0, 0, -1))
wait(0.5)

-- ===== guessing, lives, protection =====
local wrong = b1.number == "123" and "321" or "123"
check(Guess.attempt(me, b1.id, wrong) == "miss", "wrong guess is a miss")
check(me.bullets == Config.Guess.Bullets - 1, "wrong guess costs a bullet")
check(me.char.hum.WalkSpeed == 0, "wrong guess freezes you")
wait(Config.Guess.Stun + 0.5)
check(me.char.hum.WalkSpeed == Config.Movement.Walk, "stun wears off")
check(Guess.attempt(me, b1.id, "abc") == "invalid", "non-numbers are refused")
check(Guess.attempt(me, 999, "123") == "invalid", "unknown targets are refused")
check(Guess.attempt(me, me.id, "123") == "invalid", "you can't guess yourself")
X.addWall(V3new(-5, 0, 9), V3new(5, 20, 11))
wait(Config.Guess.Cooldown + 0.1)
check(Guess.attempt(me, b1.id, b1.number) == "invalid" and b1.lives == 3, "a wall blocks the guess")
X.clearWalls()
local bulletsBefore = me.bullets
local feedBefore = countNotes("kill")
local startPos = b1.char.root.Position
check(Guess.attempt(me, b1.id, b1.number) == "hit", "correct guess hits")
check(b1.alive and b1.lives == 2, "the target loses ONE life and is still in the game")
check(me.kills == 1 and me.score == Config.Score.Hit, "points for the hit (" .. me.score .. ")")
check(me.bullets == math.min(Config.Guess.Bullets, bulletsBefore + Config.Guess.KillBullets), "a hit refunds bullets")
check(b1.char.hum.WalkSpeed == 0 and b1.protectedUntil > State.now(), "the victim glitches (frozen) and is protected")
check(countNotes("kill") == feedBefore + 1 and lastNote("kill")[4] == "life", "feed says they lost a life")
wait(Config.Lives.RespawnDelay + 0.3)
check((b1.char.root.Position - startPos).Magnitude > 5, "they come back somewhere else on the map")
check(b1.char.hum.WalkSpeed == Config.Movement.Walk, "...and can move again")
place(b1, V3new(0, 3.5, 20), V3new(0, 0, -1))
wait(1)
check(b1.protectedUntil > State.now(), "still protected after coming back")
check(Guess.attempt(me, b1.id, b1.number) == "invalid" and b1.lives == 2, "a protected player can't be guessed")
wait(Config.Lives.Protect + 1)
check(Guess.attempt(me, b1.id, b1.number) == "invalid" and b1.lives == 2, "anti-farm: you can't score on the same target again so soon")
wait(Config.Lives.AntiFarm)
check(Guess.attempt(me, b1.id, b1.number) == "hit" and b1.lives == 1, "after the pause it works again")
wait(Config.Lives.RespawnDelay + Config.Lives.Protect + Config.Lives.AntiFarm + 1)
place(b1, V3new(0, 3.5, 20), V3new(0, 0, -1))
local feed2 = countNotes("kill")
check(Guess.attempt(me, b1.id, b1.number) == "hit", "third hit")
check(not b1.alive and b1.lives == 0, "no lives left = out of the match")
check(b1.plate.part.Transparency == 1, "an eliminated player's number is hidden")
check(lastNote("kill")[4] == "guess" and countNotes("kill") == feed2 + 1, "feed says they are out")
check(attrsWS.Alive == Config.Match.MinTotal - 1, "alive count drops only when someone is out")
check(Guess.attempt(me, b1.id, b1.number) ~= "hit", "a dead player can't be guessed")
check(me.score >= Config.Score.Hit * 3 and me.kills == 3, "three hits = at least 300 points (" .. me.score .. ")")

-- ===== smoke and flash =====
park()
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
wait(Config.Guess.Cooldown + 0.2)
local b2, b3, b4, b5, b6 = bot(2), bot(3), bot(4), bot(5), bot(6)
check(me.items.smoke == 2 and me.items.flash == 2, "start with 2 smoke and 2 flashbangs")
check(me.items.distraction == 1 and me.items.scanner == 1 and me.items.sprint == 1 and me.items.decoy == 1, "...and one each of the other gadgets")
place(b2, V3new(0, 3.5, 20), V3new(0, 0, -1))
check(Items.use(me, "smoke", V3new(0, 0.2, 1)) == true, "smoke grenade can be thrown")
check(me.items.smoke == 1, "smoke is used up")
check(Items.use(me, "smoke", V3new(0, 0.2, 1)) == false, "a gadget has a cooldown")
check(lastNote("cooldown") ~= nil and lastNote("cooldown")[2] == "smoke", "the screen is told about the cooldown")
wait(Config.Smoke.Fuse + 0.3)
check(#Vision.clouds == 1, "smoke cloud appears after the fuse")
check(Vision.blocked(Vision.head(me).Position, Vision.head(b2).Position, true), "smoke blocks sight")
check(not Vision.blocked(Vision.head(me).Position, Vision.head(b2).Position, false), "...but only smoke does")
check(Guess.attempt(me, b2.id, b2.number) == "invalid", "can't guess through smoke")
wait(Config.Smoke.Duration + 1)
check(#Vision.clouds == 0, "smoke clears after its duration")
fresh(me, b2)
check(Guess.attempt(me, b2.id, "000") == "miss", "can see and guess again after the smoke clears")
wait(Config.Guess.Stun + 1)

park()
place(b3, V3new(0, 3.5, 12), V3new(0, 0, -1))
place(b4, V3new(0, 3.5, 12), V3new(0, 0, 1))
place(b5, V3new(0, 3.5, 40), V3new(0, 0, -1))
place(b6, V3new(20, 3.5, 12), V3new(0, 0, -1))
X.addWall(V3new(10, 0, 0), V3new(12, 20, 30))
local flashNotes = countNotes("flash")
wait(Items.cooldownLeft(me, "flash") + 0.1)
check(Items.use(me, "flash", V3new(0, 0, 1)) == true, "flashbang can be thrown")
wait(Config.Flash.Fuse + 0.3)
check(b3.blindUntil > State.now() + 1, "player looking at the flash is blinded")
check(b4.blindUntil > State.now(), "player with their back turned is still blinded a bit")
check((b3.blindUntil - State.now()) > (b4.blindUntil - State.now()), "looking at it is worse than turning away")
check((b6.blindUntil or 0) <= State.now(), "a wall protects from the flash")
check(countNotes("flash") == flashNotes + 1, "the thrower is blinded too and told")
X.clearWalls()
check(Photos.snap(p1, Vision.head(me).Position, V3new(0, 0, 1)) == nil, "no photos while blind")
Match.setScope(p1, true)
check(me.scoped == false, "no binoculars while blind")
wait(Config.Flash.MaxBlind + 1)

-- ===== binoculars =====
Match.setScope(p1, true)
check(me.scoped and me.char.hum.WalkSpeed == Config.Movement.ScopeWalk, "binoculars slow you down")
Match.setScope(p1, false)
check(not me.scoped and me.char.hum.WalkSpeed == Config.Movement.Walk, "lowering them restores speed")
Match.setScope(p1, true)
check(not me.scoped, "binoculars have a short cooldown")
wait(Config.ItemById.binos.Cooldown + 0.1)
Match.setScope(p1, true)
check(me.scoped, "...then work again")
Match.setScope(p1, false)
wait(1)

-- ===== photos, intel points, assists, the flash notice =====
park()
place(b3, V3new(0, 3.5, 20), V3new(0, 0, -1))
place(b4, V3new(2, 3.5, 20), V3new(0, 0, 1))
place(b5, V3new(-2, 3.5, 80), V3new(0, 0, -1))
place(b6, V3new(60, 3.5, 20), V3new(0, 0, -1))
local scoreBefore = me.score
local shots = Photos.snap(p1, Vision.head(me).Position, V3new(0, 0, 1))
check(shots ~= nil and #shots >= 3, "photo lists who is in frame (" .. tostring(shots and #shots) .. ")")
local function shotOf(id) for _, s in shots do if s[1] == id then return s end end end
check(shotOf(b3.id) and shotOf(b3.id)[4] == b3.number, "close person facing you: full number")
check(shotOf(b4.id) and shotOf(b4.id)[4] == "???", "back turned: all question marks")
check(shotOf(b5.id) and shotOf(b5.id)[4] == "???", "too far: all question marks")
check(shotOf(b6.id) == nil, "outside the picture is not in the album")
check(me.score == scoreBefore + Config.Score.Intel, "a clear photo of a whole number earns intel points")
check(b3.seenBy[me.id] ~= nil, "the photo is remembered for assists")
wait(Config.Photo.Cooldown + 0.1)
local scoreAgain = me.score
Photos.snap(p1, Vision.head(me).Position, V3new(0, 0, 1))
check(me.score == scoreAgain, "no farming intel points from the same person")
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
-- the flash notice: a human standing close and facing the camera is told
park()
place(buddy, V3new(0, 3.5, 10), V3new(0, 0, -1))
local notices = 0
for _ = 1, 30 do
	wait(Config.Photo.Cooldown + 0.05)
	Photos.snap(p1, Vision.head(me).Position, V3new(0, 0, 1))
end
for _, m in notifyLog do if m[1] == "noticed" then notices += 1 end end
check(notices > 3 and notices < 30, "someone close by sometimes notices the camera flash (" .. notices .. "/30)")
-- assists: I photographed b3's number; buddy now gets b3 and I earn an assist
park()
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
place(b3, V3new(0, 3.5, 20), V3new(0, 0, -1))
wait(Config.Photo.Cooldown + 0.1)
Photos.snap(p1, Vision.head(me).Position, V3new(0, 0, 1))
fresh(b3, buddy)
place(buddy, V3new(0, 3.5, 40), V3new(0, 0, -1))
b3.seenBy = {[me.id] = State.now()}
local s2 = me.score
local assists = countNotes("assist")
check(Guess.attempt(buddy, b3.id, b3.number) == "hit", "buddy gets b3")
check(me.score == s2 + Config.Score.Assist and countNotes("assist") == assists + 1, "I earn an assist for photographing them")
park()

-- ===== decoy and sprint boost, then scanner, distraction grenade =====
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
wait(10)
fresh(me, buddy)
local real = me.number
check(Items.use(me, "decoy", V3new(0, 0, 1)) == true and me.items.decoy == 0, "decoy dropped")
local decoy
local count = 0
for _, d in State.decoys do decoy = d; count += 1 end
check(count == 1 and decoy.id >= 1000000, "one decoy with its own id")
check(decoy.number ~= real and me.number == real and me.plate.label.Text == real, "the decoy wears a different number; mine is untouched")
local clash = false
for _, e in State.list() do if e.number == decoy.number then clash = true end end
check(not clash, "the decoy's number is unique")
check(decoy.code == me.code, "it carries my codename, so two of me show up")
-- a photo of the decoy looks just like a photo of a person, but it is never real intel
place(b3, V3new(0, 3.5, 40), V3new(0, 0, -1))
local snap = Photos.shotsFrom(V3new(0, 5.5, 15), V3new(0, 0, -1), nil)
local seenDecoy
for _, sh in snap do if sh.id == decoy.id then seenDecoy = sh end end
check(seenDecoy ~= nil and seenDecoy.text == decoy.number, "a photo shows the decoy's fake number")
check(seenDecoy ~= nil and not seenDecoy.complete, "...and it never counts as intel")
-- guessing the decoy
local bulletsBuddy = buddy.bullets
check(Guess.attempt(buddy, decoy.id, decoy.number == "123" and "321" or "123") == "miss", "a wrong guess at the decoy is just a miss")
wait(Config.Guess.Stun + 0.5)
buddy.lastGuess = -100
check(Guess.attempt(buddy, decoy.id, decoy.number) == "decoy", "typing the decoy's number is a trap")
check(State.decoys[decoy.id] == nil and decoy.model.destroyed, "the decoy pops")
check(buddy.char.hum.WalkSpeed == 0 and buddy.bullets <= bulletsBuddy - 1, "the shooter is frozen and loses a bullet")
wait(Config.Decoy.Stun + 0.5)
-- a decoy expires by itself, and stays harmless to my real number
Items.give(me, "decoy", 1)
wait(Items.cooldownLeft(me, "decoy") + 0.1)
check(Items.use(me, "decoy", V3new(0, 0, 1)) == true, "a second decoy")
wait(Config.Decoy.Duration + 1)
local left = 0
for _ in State.decoys do left += 1 end
check(left == 0, "a decoy disappears after " .. Config.Decoy.Duration .. "s")
check(me.number == real, "my real number never changed")
check(Items.give(me, "decoy", 9) == Config.ItemById.decoy.Max, "decoy charges are capped at " .. Config.ItemById.decoy.Max)

-- sprint boost
wait(5)
fresh(me)
check(me.items.sprint == 1 and Items.use(me, "sprint", V3new(0, 0, 1)) == true, "sprint boost used")
check(me.char.hum.WalkSpeed == Config.Sprint.Speed, "faster during the boost (" .. me.char.hum.WalkSpeed .. ")")
check(Items.use(me, "sprint", V3new(0, 0, 1)) == false, "no second boost while it runs (charges and cooldown)")
check(lastNote("cooldown") ~= nil and lastNote("cooldown")[2] == "sprint" and lastNote("cooldown")[3] == Config.ItemById.sprint.Cooldown, "its cooldown is sent to the screen")
Match.setScope(p1, true)
check(me.char.hum.WalkSpeed == Config.Movement.ScopeWalk, "looking through binoculars still slows you down")
Match.setScope(p1, false)
check(me.char.hum.WalkSpeed == Config.Sprint.Speed, "...and the boost comes back")
Combat.stun(me, 1)
check(me.char.hum.WalkSpeed == 0, "being frozen beats the boost")
wait(1.3)
check(me.char.hum.WalkSpeed == Config.Sprint.Speed, "after the freeze the boost continues")
wait(Config.Sprint.Duration)
check(me.char.hum.WalkSpeed == Config.Movement.Walk and me.sprintUntil == 0, "the boost ends after " .. Config.Sprint.Duration .. "s")
check(Items.give(me, "sprint", 9) == 2, "sprint charges are capped at " .. Config.ItemById.sprint.Max)
wait(Config.ItemById.sprint.Cooldown)
check(Items.use(me, "sprint", V3new(0, 0, 1)) == true, "a refilled charge can be used once the cooldown is over")
wait(Config.Sprint.Duration + 0.5)

park()
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
place(b2, V3new(30, 3.5, 0), V3new(0, 0, -1))
place(b3, V3new(-30, 3.5, 20), V3new(0, 0, -1))
place(b4, V3new(80, 3.5, 0), V3new(0, 0, -1))
X.addWall(V3new(25, 0, -5), V3new(26, 20, 5)) -- a wall between me and b2: the scanner goes through it
local scans = countNotes("scan")
check(Items.use(me, "scanner", V3new(0, 0, 1)) == true, "scanner used")
local sc = lastNote("scan")
check(countNotes("scan") == scans + 1 and sc ~= nil, "scan result sent")
local ids = {}
for _, row in sc[2] do ids[row[1]] = row end
check(ids[b2.id] and ids[b3.id] and not ids[b4.id], "the scanner finds people nearby (even behind walls) and not far away ones")
local leaked = false
for _, row in sc[2] do for _, v in row do if v == b2.number or v == b3.number then leaked = true end end end
check(not leaked, "the scanner never reveals a number")
X.clearWalls()
check(Items.use(me, "scanner", V3new(0, 0, 1)) == false, "scanner has a cooldown (and no charges left)")
check(Items.give(me, "scanner", 5) == Config.ItemById.scanner.Max, "scanner charges are capped at " .. Config.ItemById.scanner.Max)
wait(Config.ItemById.scanner.Cooldown + 0.1)
-- smoke hides people from the scanner
Items.use(me, "smoke", V3new(1, 0, 0))
wait(Config.Smoke.Fuse + 0.3)
local sc2
Items.use(me, "scanner", V3new(0, 0, 1))
sc2 = lastNote("scan")
local inSmoke = false
for _, row in sc2[2] do if row[1] == b2.id then inSmoke = true end end
check(not inSmoke, "scanning from inside a smoke cloud finds nobody through it")
wait(Config.Smoke.Duration + 1)

-- distraction device: bots go and look
park()
place(me, V3new(0, 3.5, 0), V3new(1, 0, 0))
place(b2, V3new(-30, 3.5, 30), V3new(0, 0, -1))
wait(Items.cooldownLeft(me, "distraction") + 0.1)
local startB2 = b2.char.root.Position
check(Items.use(me, "distraction", V3new(1, 0.1, 0)) == true, "distraction device thrown")
wait(Config.Distraction.Fuse + 0.3)
check(#Items.distractions == 1, "fake footsteps start")
botsWalk = true
for i = 1, 8 do local b = bot(i); if b.alive then b.nextGuessAt = 1e9 end end
wait(3)
local after = b2.char.root.Position
local lure = Items.distractions[1] and Items.distractions[1].pos or V3new(0, 0, 0)
check((after - lure).Magnitude < (startB2 - lure).Magnitude - 5, "a bot walks toward the noise")
botsWalk = false
wait(Config.Distraction.Duration)
check(#Items.distractions == 0, "the noise stops")

-- ===== covering: warn, expose, and it gets longer each time =====
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
Cover.reset(me)
X.addWall(V3new(-8, 0, 3), V3new(8, 30, 4))
wait(2)
check(me.coverStage == "warn", "covering the forehead gives a warning (" .. tostring(me.coverStage) .. ")")
local note = lastNote("cover")
check(note and note[2] == "warn" and note[3] > 0 and note[3] < Config.Cover.Limit, "warning has a countdown")
wait(Config.Cover.Limit)
local first = me.exposedUntil - State.now()
check(first > 0 and first <= Config.Cover.Expose and me.violations == 1, "ignoring the warning exposes you (violation 1)")
check(me.reveal.gui.Enabled == true and me.revealed == true, "exposed player gets a glowing plate and a marker")
X.clearWalls()
wait(Config.Cover.Expose + 1)
check((me.exposedUntil or 0) <= State.now() and me.reveal.gui.Enabled == false and not me.revealed, "exposure ends")
X.addWall(V3new(-8, 0, 3), V3new(8, 30, 4))
wait(Config.Cover.Limit + 1)
local second = me.exposedUntil - State.now()
check(me.violations == 2 and second > first + 3, "a second violation exposes you for longer (" .. string.format("%.0f", second) .. "s vs " .. string.format("%.0f", first) .. "s)")
X.clearWalls()
wait(Config.Cover.Expose * 2)
X.addWall(V3new(-8, 0, 3), V3new(8, 30, 4))
wait(0.6)
X.clearWalls()
wait(3)
check(me.coverStage == "ok", "a short look at a wall is not punished")
-- smoke does not count as covering
Cover.reset(me)

-- ===== idle camping: sit in one small area too long =====
Cover.reset(me)
X.clearWalls()
place(me, V3new(0, 3.5, 60), V3new(0, 0, 1))
wait(Config.Camp.WarnAfter - 3)
check(me.campStage == "ok" and (me.exposedUntil or 0) <= State.now(), "standing still for a while is fine")
wait(5)
check(me.campStage == "warn" and lastNote("camp") and lastNote("camp")[2] == "warn" and lastNote("camp")[3] > 0, "after " .. Config.Camp.WarnAfter .. "s in one spot you get a KEEP MOVING warning with a countdown")
-- shuffling a few steps inside the circle doesn't help
place(me, V3new(3, 3.5, 62), V3new(0, 0, 1))
wait(2)
check(me.campStage == "warn", "small movements inside the same spot don't reset the timer")
-- walking out of the circle clears the warning at once
place(me, V3new(0, 3.5, 60 + Config.Camp.Radius + 3), V3new(0, 0, 1))
wait(0.6)
check(me.campStage == "ok" and lastNote("camp")[2] == "ok", "walking to a new spot clears the warning")
-- ignoring it exposes you
wait(Config.Camp.Limit + 1)
local c1 = me.exposedUntil - State.now()
check(me.campViolations == 1 and c1 > 0 and c1 <= Config.Camp.Expose and me.reveal.gui.Enabled == true, "ignoring the warning reveals your position (violation 1)")
check(lastNote("camp")[2] == "exposed", "...and tells you")
wait(Config.Camp.Expose + 1)
check(not me.revealed, "the reveal ends")
local guard = 0
while (me.campViolations or 0) < 2 and guard < 400 do wait(0.25); guard += 1 end
local c2 = me.exposedUntil - State.now()
check(me.campViolations == 2 and c2 > c1 + 3, "the second time lasts longer")
-- being frozen by a hit is never camping
Cover.reset(me)
me.stunUntil = State.now() + 100
wait(Config.Camp.Limit + 5)
check(me.campStage == "ok" and (me.campViolations or 0) == 0, "a frozen player is not a camper")
me.stunUntil = 0
Cover.reset(me)
-- bots are never judged (only real players are)
check(State.get(-1).campTimer == nil or State.get(-1).campTimer == 0, "bots aren't judged for camping")

-- ===== information terminals =====
place(me, Config.Map.Terminals[1] + V3new(3, 1.5, 0), V3new(0, 0, 1))
fresh(me)
local used = 0
local text1 = Terminals.use(me, 1)
check(text1 ~= nil and lastNote("clue") ~= nil and lastNote("clue")[2] == text1, "a terminal gives a clue (" .. tostring(text1) .. ")")
check(me.exposedUntil > State.now(), "...but your position is revealed for a moment (risky)")
local again, why = Terminals.use(me, 1)
check(again == nil and why == "cooldown", "the same terminal needs a pause")
place(me, Config.Map.Terminals[2] + V3new(3, 1.5, 0), V3new(0, 0, 1))
local text2 = Terminals.use(me, 2)
place(me, Config.Map.Terminals[3] + V3new(3, 1.5, 0), V3new(0, 0, 1))
local text3 = Terminals.use(me, 3)
check(text2 ~= nil and text3 ~= nil and text1 ~= text2 and text2 ~= text3, "three different clues")
for _, c in me.clues do check(c.ok(tonumber(me.number)), "clue is true: " .. c.text) end
place(me, Config.Map.Terminals[4] + V3new(3, 1.5, 0), V3new(0, 0, 1))
local fourth, why4 = Terminals.use(me, 4)
check(fourth == nil and why4 == "empty", "only " .. Config.Terminal.Uses .. " uses per match")
place(me, V3new(100, 3.5, 100), V3new(0, 0, 1))
local farText, farWhy = Terminals.use(buddy, 1)
check(farText == nil and farWhy == "far", "too far from the terminal")
fresh(me)
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))

-- ===== crates =====
park()
local crate = Config.Map.Crates[1]
place(me, crate + V3new(0, 2, 0), V3new(0, 0, 1))
local function itemTotal() local n = 0 for _, id in Config.CarriedItems do n += me.items[id] end return n end
local had = itemTotal()
wait(0.6)
check(itemTotal() == had + 1, "walking into a crate gives a gadget")
check(lastNote("pickup") ~= nil, "pickup message sent")
local after2 = itemTotal()
wait(1)
check(itemTotal() == after2, "the crate is empty after being taken")
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
wait(Config.Pickups.Respawn + 1)
place(me, crate + V3new(0, 2, 0), V3new(0, 0, 1))
wait(0.6)
check(itemTotal() >= after2, "crate refills after " .. Config.Pickups.Respawn .. "s")
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))

-- ===== bounty =====
fresh(me, buddy)
Bounty.paused = false
Bounty.reset()
wait(21)
local target = Bounty.current()
check(target ~= nil and target.bounty == true, "a bounty target is picked")
check(lastNote("bounty") ~= nil and lastNote("bounty")[3] == Config.Bounty.Reward, "everyone is told the prize")
check(target.bountyTag.gui.Enabled == true and target.bountyTag.label.Text == "🎯 BOUNTY +" .. Config.Bounty.Reward, "the tag shows the prize, never the number")
-- the target must be somebody I can shoot: not me, not my buddy
local guard = 0
while (target == me or target == buddy) and guard < 50 do
	guard += 1
	Bounty.assign(State.now())
	target = Bounty.current()
end
local before2 = me.score
local coins = me.bonusCoins or 0
fresh(me, target)
park()
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
place(target.char and target or target, V3new(0, 3.5, 20), V3new(0, 0, -1))
check(Guess.attempt(me, target.id, target.number) == "hit", "hit the bounty target")
check(me.score == before2 + Config.Score.Hit + Config.Bounty.Reward and me.bonusCoins == coins + Config.Bounty.Coins, "bounty paid: points and coins")
check(lastNote("bountyWon") ~= nil, "the winner is told")
check(Bounty.current() == nil or Bounty.current() ~= target, "the bounty moves on")
wait(8)
check(Bounty.current() ~= nil, "a new target is picked soon after")
Bounty.paused = true
Bounty.clear()

-- ===== alliances =====
fresh(me, buddy)
Alliance.reset()
place(me, V3new(0, 3.5, 0), V3new(1, 0, 0))
place(buddy, V3new(20, 3.5, 0), V3new(-1, 0, 0))
check(Alliance.propose(me, bot(2).id) == false, "you can only ally with real players")
check(Alliance.propose(me, buddy.id) == true and lastNote("allyOffer") ~= nil, "alliance offer sent")
check(Alliance.respond(buddy, me.id, true) == true, "accepted")
check(me.ally == buddy.id and buddy.ally == me.id and p1.attrs.Ally == buddy.id and p2.attrs.Ally == me.id, "both are allies and the screens know")
check(Alliance.areAllies(me, buddy), "allies")
check(Alliance.share(me, {{b3.id, "4?7"}, {b3.id, "bad"}, {123456, "123"}, {me.id, "123"}}) == true and lastNote("shared") ~= nil, "sharing sends only well-formed rows about real, other people")
check(#lastNote("shared")[3] == 1 and lastNote("shared")[3][1][4] == "4?7", "the ally receives what was shared (they decide whether to believe it)")
check(Alliance.share(buddy, {{b3.id, "?9?"}}) == true, "sharing works both ways")
check(Alliance.propose(me, buddy.id) == false, "already allies")
-- betrayal
wait(Config.Guess.Cooldown + 0.1)
local ok1 = Guess.attempt(me, buddy.id, buddy.number)
check(ok1 == "hit", "you CAN shoot your ally")
check(me.ally == nil and buddy.ally == nil and lastNote("ally") ~= nil, "...and that ends the alliance")
check(buddy.lives == 2, "betrayal costs them a life")
check(Alliance.propose(me, buddy.id) == false, "no new alliance right after a betrayal")
-- expiry and the button
wait(Config.Alliance.ReAllyAfterBetrayal + 1)
place(buddy, V3new(20, 3.5, 0), V3new(-1, 0, 0))
fresh(me, buddy)
check(Alliance.propose(me, buddy.id) and Alliance.respond(buddy, me.id, true), "allied again")
wait(Config.Alliance.Duration + 1)
check(me.ally == nil and buddy.ally == nil, "alliances end by themselves after " .. Config.Alliance.Duration .. "s")
check(Alliance.propose(me, buddy.id) and Alliance.respond(buddy, me.id, false) == false and me.ally == nil, "declining works")
wait(4)
check(Alliance.propose(me, buddy.id) and Alliance.respond(buddy, me.id, true), "allied once more")
Alliance.leave(me)
check(me.ally == nil and buddy.ally == nil, "leaving the alliance works")
place(buddy, V3new(110, 3.5, 110), V3new(0, 0, -1))
fresh(me, buddy)

-- ===== bonus events =====
local original = Config.Events.List
local function runEvent(id)
	for _, def in original do if def.Id == id then Config.Events.List = {def} end end
	Config.Events.List[2] = nil
	Events.paused = false
	Events.reset(State.now() - Config.Events.First)
	wait(0.5)
	local warn = lastNote("event")
	local ok1 = warn ~= nil and warn[2] == "warn" and warn[3] == id
	wait(Config.Events.Warn + 0.5)
	local start = lastNote("event")
	return ok1, start ~= nil and start[2] == "start" and start[3] == id
end
local w, st = runEvent("double")
check(w and st and Events.active == "double", "double points: announced, then started")
check(Combat.multiplier() == 2, "...scores double")
fresh(me, b5)
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1)); place(b5, V3new(0, 3.5, 20), V3new(0, 0, -1))
local sd = me.score
Guess.attempt(me, b5.id, b5.number)
check(me.score == sd + Config.Score.Hit * 2, "a hit is worth 200 during double points")
wait(Config.Events.List[1].Seconds)
check(Events.active == nil and Combat.multiplier() == 1 and lastNote("event")[2] == "end", "the event ends and scores go back to normal")
local g0 = workspace.Gravity
w, st = runEvent("gravity")
check(w and st and workspace.Gravity == Config.Events.LowGravity, "low gravity applies")
wait(Config.Events.List[1].Seconds)
check(workspace.Gravity == g0, "...and is restored")
w, st = runEvent("blackout")
check(w and st and Events.active == "blackout", "blackout runs")
wait(Config.Events.List[1].Seconds)
check(Events.active == nil, "blackout ends")
w, st = runEvent("bounty")
check(w and st, "bounty bonus runs")
check(Bounty.multiplier() == 3, "bounties pay triple")
wait(Config.Events.List[1].Seconds)
check(Bounty.multiplier() == 1, "bounty bonus ends")
w, st = runEvent("drop")
check(w and st and #Pickups.activeDrops() == 1, "a supply drop lands")
local drop = Pickups.activeDrops()[1]
place(me, drop.part.Position + V3new(1, 1, 0), V3new(0, 0, 1))
local totalBefore = itemTotal()
fresh(me)
for _, id in Config.CarriedItems do me.items[id] = 0 end
wait(0.6)
check(itemTotal() == 2 and #Pickups.activeDrops() == 0, "the first to reach the drop gets two gadgets")
Config.Events.List = original
Events.stop()
Events.paused = true
place(me, V3new(0, 3.5, 0), V3new(0, 0, 1))
Items.reset(me)

-- ===== progression (before the match ends: coins and XP are paid at the end) =====
local data = Data.get(p1)
local coinsBefore = data.Coins
check(Progress.buy(p1, "trail", "sparkle") == false, "you can't buy what you can't afford")
check(Progress.buy(p1, "trail", "nope") == false, "unknown items are refused")
data.Coins = 1000; data.XP = 10000; Progress.publish(p1)
check(p1.attrs.Level > 5 and p1.attrs.Coins == 1000, "level and coins are shown")
check(Progress.buy(p1, "trail", "sparkle") == true and data.Coins == 850, "buying costs coins")
check(Progress.buy(p1, "trail", "sparkle") == false and data.Coins == 850, "you can't buy it twice")
check(Progress.owns(p1, "trail", "sparkle") and Progress.owns(p1, "trail", "none") and not Progress.owns(p1, "trail", "flame"), "ownership is tracked")
check(Progress.equip(p1, "trail", "sparkle") and p1.attrs.Trail == "sparkle", "equipping works")
check(Progress.equip(p1, "trail", "flame") == false and p1.attrs.Trail == "sparkle", "you can't equip what you don't own")
check(string.find(p1.attrs.Owned, "trail:sparkle", 1, true) and string.find(p1.attrs.Owned, "emote:wave", 1, true), "the owned list is published")
data.Coins = coinsBefore; data.XP = 0; Progress.publish(p1)
check(Progress.emote(p1, "wave") == true, "free emotes work")
check(Progress.emote(p1, "wave") == false, "emotes have a cooldown")
wait(Config.EmoteCooldown + 0.1)
check(Progress.emote(p1, "skull") == false, "locked emotes are refused")

-- ===== the reveal, the end, results, rewards, a second match =====
local late = join(999, "TooLate")
wait(1)
check(State.byPlayer(late) == nil, "someone joining mid-match is a spectator, not a player")
check(late.Character ~= nil, "...but still gets a body in the lobby")
check(State.revealing == false and attrsWS.Reveal == false, "no reveal before the final stretch")
extendMatch = false
State.phaseEnd = State.now() + 120
wait(120 - Config.Match.RevealAt + 1)
check(State.revealing == true and attrsWS.Reveal == true, "THE REVEAL starts with " .. Config.Match.RevealAt .. "s left")
local allShown = true
for _, e in State.aliveList() do if not e.revealed then allShown = false end end
check(allShown, "every living plate glows")
check(lastNote("reveal") ~= nil, "everybody is told about the reveal")

-- everybody else is out: take lives away directly, then the last one standing wins
for _, e in State.list() do
	if e ~= me and e.alive then
		Combat.eliminate(e, me, "guess")
	end
end
check(State.aliveCount() == 1 and me.alive, "last one standing")
wait(1)
check(State.phase == "results", "match ends when one is left (" .. State.phase .. ")")
local res = lastNote("results")
check(res ~= nil and #res[2] == Config.Match.MinTotal, "results list everyone (" .. tostring(res and #res[2]) .. ")")
check(res and res[3] == me.id and res[2][1].id == me.id and res[2][1].rank == 1, "I am rank 1 and the winner")
check(res[2][1].score == me.score and res[2][1].lives == me.lives and res[2][1].survived >= 0, "results carry points, lives and survival time")
check(me.score >= Config.Score.Win, "the winner gets the win bonus")
check(p1.attrs.Wins == 1 and p1.attrs.Streak == 1 and p1.attrs.Games == 1, "win, streak and games are counted")
local rw = lastNoteTo("rewards", p1)
check(rw ~= nil and rw[2] > Config.Rewards.Coins.Play and rw[3] > Config.Rewards.XP.Play, "coins and XP are paid (" .. tostring(rw and rw[2]) .. " coins, " .. tostring(rw and rw[3]) .. " XP)")
check(p1.attrs.Coins == coinsBefore + rw[2] and p1.attrs.XP == rw[3], "...and added to the profile")
check(Progress.award(p1, 999, true, State.matchId) == nil, "the same match can never pay twice")
check(p1.attrs.Coins == coinsBefore + rw[2], "no double reward")
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

wait(Config.Match.Intermission + 1)
check(State.phase == "countdown" and State.matchId == matchBefore + 1, "a second match starts")
check(State.byPlayer(p1) ~= nil and State.byPlayer(p2) ~= nil and State.byPlayer(late) ~= nil, "everyone online is in it now")
local me2 = State.byPlayer(p1)
check(me2.styleDef.Id == "gold" and me2.lives == 3 and me2.score == 0, "chosen plate used; lives and points reset")
check(me2.trailDef ~= nil and me2.trailDef.Id == "sparkle", "chosen trail is used")
wait(Config.Match.Countdown + 0.5)
check(State.phase == "play", "second match plays")

-- bots walk the streets on their own for a while
botsWalk = true
local startPos2, travelled = {}, {}
for _, e in State.list() do
	if e.bot then startPos2[e.id] = e.char.root.Position; travelled[e.id] = 0; e.nextGuessAt = 1e9 end
end
local last = {}
for id, pos in startPos2 do last[id] = pos end
local inBounds, inBuilding = true, false
local oldHook = TICKHOOK
TICKHOOK = function(now)
	oldHook(now)
	for id in startPos2 do
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
check(movers >= 6, "bots walk the streets (" .. movers .. " of 7 moved over 40 studs in 60s)")
check(inBounds, "bots never leave the map")
check(not inBuilding, "bots never walk through a building")

-- somebody leaving, even while allied
local lateE = State.byPlayer(late)
local buddyE = State.byPlayer(p2)
place(buddyE, V3new(0, 3.5, 0), V3new(1, 0, 0)); place(lateE, V3new(15, 3.5, 0), V3new(-1, 0, 0))
Alliance.reset()
check(Alliance.propose(buddyE, lateE.id) and Alliance.respond(lateE, buddyE.id, true), "two players ally")
do
	check(lateE ~= nil and lateE.alive, "the third human is still in the match")
	local kills = countNotes("kill")
	for i, pl in players do if pl == late then table.remove(players, i) break end end
	fireAll("PlayerRemoving", late)
	check(not lateE.alive, "leaving the game eliminates you")
	check(countNotes("kill") == kills + 1, "...and shows in the kill feed")
	check(buddyE.ally == nil, "their ally is released")
end
for _, e in State.list() do if e.bot then e.nextGuessAt = State.now() + 1 end end
wait(60)
local counted = 0
for _, e in State.list() do if e.alive then counted += 1 end end
check(State.phase == "lobby" or attrsWS.Alive == counted, "alive count stays consistent while bots fight (" .. tostring(attrsWS.Alive) .. " vs " .. counted .. ")")

-- time runs out: the tiebreak is lives, then points
do
	if State.phase ~= "play" then
		wait(Config.Match.ResultsTime + Config.Match.Intermission + Config.Match.Countdown + 2)
	end
	botsWalk = false
	local list = State.aliveList()
	for _, e in list do e.nextGuessAt = 1e9 end
	local keep = {}
	for _, e in list do if #keep < 3 then table.insert(keep, e) end end
	for _, e in list do
		local isKept = false
		for _, k in keep do if k == e then isKept = true end end
		if not isKept then Combat.eliminate(e, nil, "fell") end
	end
	if #keep == 3 then
		keep[1].lives, keep[1].score = 2, 900
		keep[2].lives, keep[2].score = 3, 100
		keep[3].lives, keep[3].score = 3, 400
		State.phaseEnd = State.now() + 1
		wait(2)
		local r = lastNote("results")
		check(r and r[3] == keep[3].id, "time ran out: most lives wins, then most points")
	end
end

-- rough handling of the remote
local warnsBefore = #warns
for _, args in {
	{nil}, {123}, {"Nope"}, {"Guess"}, {"Guess", "x", {}}, {"Guess", 1, 5}, {"Use", {}, {}}, {"Use", "flash", "bad"}, {"Snap", "a", 5},
	{"Snap", V3new(0, 0, 0), V3new(0, 0, 0)}, {"Style", 7}, {"Setting", "Music", "yes"}, {"Setting", "Hack", true}, {"Scope"}, {"Seen"},
	{"Emote", 5}, {"Emote", "wave"}, {"Buy", "trail"}, {"Buy", "hax", "x"}, {"Buy", {}, {}}, {"Equip", 5, 5}, {"AllyAsk", "x"}, {"AllyReply", {}, 1},
	{"AllyEnd"}, {"Share", 5}, {"Share", {{1, 2}, "x", {}}},
} do
	wait(1.1)
	fireAll("Action", p1, table.unpack(args, 1, 4))
end
check(#warns == warnsBefore, "garbage requests never raise errors")
check(p1.attrs.Seen == true, "Seen is saved")
fireAll("Action", p1, "Setting", "Music", false)
check(p1.attrs.Music == false, "settings are saved")
-- rate limit: two guesses in the same instant only count once
local gs = 0
local oldAttempt = Guess.attempt
print("--- done")

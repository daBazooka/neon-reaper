-- ===== full house: 20 real players, no bots, a whole match played out by guesses =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local Config = require(RS.children.Shared.children.Config)
local Rules = require(RS.children.Shared.children.Rules)
local Guess = require(ModN.children.Guess)
local Combat = require(ModN.children.Combat)
local Items = require(ModN.children.Items)
local Photos = require(ModN.children.Photos)
local Vision = require(ModN.children.Vision)
local function lastNote(kind) for i = #notifyLog, 1, -1 do if notifyLog[i][1] == kind then return notifyLog[i] end end end
local function join(id, name)
	local p = X.newPlayer(id, name)
	table.insert(players, p)
	fireAll("PlayerAdded", p)
	return p
end
math.randomseed(os.time())

local humans = {}
for i = 1, 20 do humans[i] = join(100 + i, "P" .. i) end
advance(1)
advance(Config.Match.Intermission + 1)
check(State.phase == "countdown", "countdown with a full lobby")
check(#State.order == 20, "20 entities (" .. #State.order .. ")")
local function count(t) local n = 0 for _ in t do n += 1 end return n end
local bots, nums, codes, spawns = 0, {}, {}, {}
for _, e in State.list() do
	if e.bot then bots += 1 end
	nums[e.number] = true; codes[e.code] = true
	local key = string.format("%.0f,%.0f", e.char.root.Position.X, e.char.root.Position.Z)
	spawns[key] = true
end
local function count(t) local n = 0 for _ in t do n += 1 end return n end
check(bots == 0, "no bots when 20 people are here")
check(count(nums) == 20 and count(codes) == 20, "20 unique numbers and 20 unique codenames")
check(count(spawns) == 20, "20 different spawn points")
advance(Config.Match.Countdown + 0.5)
check(State.phase == "play", "play starts")
local late = join(999, "TooLate")
advance(1)
check(State.byPlayer(late) == nil, "a 21st player is a spectator")

-- everybody guesses everybody: random pairs, walls ignored (open field). Protection and the anti-farm pause are cleared
-- before each guess so the whole match (20 players x 3 lives) plays out quickly.
local function invariants(tag)
	local alive, kills, lost = 0, 0, 0
	for _, e in State.list() do
		if e.alive then alive += 1 end
		kills += e.kills
		lost += Config.Lives.Start - e.lives
		if e.bullets < 0 or e.bullets > Config.Guess.Bullets then return false, tag .. ": bullets out of range " .. e.bullets end
		if e.lives < 0 or e.lives > Config.Lives.Start then return false, tag .. ": lives out of range" end
		if (e.lives == 0) == e.alive then return false, tag .. ": lives and alive disagree" end
	end
	if alive ~= State.aliveCount() then return false, tag .. ": alive mismatch" end
	if kills ~= lost then return false, tag .. ": hits " .. kills .. " vs lives lost " .. lost end
	return true
end
local rounds, bad, why = 0, false, nil
local hits, misses, refused = 0, 0, 0
while State.aliveCount() > 1 and rounds < 3000 do
	rounds += 1
	local list = State.aliveList()
	local a = list[math.random(#list)]
	local b = list[math.random(#list)]
	if a ~= b then
		local pos = a.char.root.Position
		b.char:PivotTo(CFrame.new(pos + V3new(0, 0, 12), pos))
		a.char:PivotTo(CFrame.new(pos, pos + V3new(0, 0, 1)))
		a.stunUntil = 0
		a.lastGuess = -100
		a.bullets = math.max(a.bullets, 1)
		a.hitTimes = {}
		if math.random() < 0.9 then b.protectedUntil = 0 end -- sometimes leave the protection on: those guesses must be refused
		local protected = b.protectedUntil > State.now()
		local text = (math.random() < 0.6) and b.number or Rules.digitsOf(math.random(1, 999))
		local result = Guess.attempt(a, b.id, text)
		if result == "hit" then hits += 1 elseif result == "miss" then misses += 1 else refused += 1 end
		if protected and result == "hit" then bad, why = true, "a protected player was hit" break end
		local good, msg = invariants("round " .. rounds)
		if not good then bad, why = true, msg break end
	end
	if rounds % 5 == 0 then advance(0.3) end
end
check(not bad, "invariants hold through " .. rounds .. " rounds (" .. tostring(why) .. ")")
check(State.aliveCount() == 1, "one player left standing (" .. State.aliveCount() .. ")")
advance(1)
check(State.phase == "results", "match ends with results (" .. State.phase .. ")")
local res = lastNote("results")
check(res and #res[2] == 20, "results list all 20")
local ranks, ids = {}, {}
for _, r in res[2] do ranks[r.rank] = true; ids[r.id] = true end
check(count(ranks) == 20 and count(ids) == 20, "ranks 1..20 are unique")
local winner = res[3]
check(State.get(winner) and State.get(winner).alive and res[2][1].id == winner, "the survivor is rank 1")
local winners, sumGames = 0, 0
for _, p in humans do
	if p.attrs.Wins == 1 then winners += 1 end
	sumGames += p.attrs.Games or 0
end
check(winners == 1 and sumGames == 20, "exactly one winner and 20 games counted")
local paid = 0
for _, m in notifyLog do if m[1] == "rewards" then paid += 1 end end
check(paid == 20, "all 20 players were paid exactly once (" .. paid .. ")")
local totalHits = 0
for _, r in res[2] do totalHits += r.kills end
check(totalHits >= 57, "at least 57 hits to take 19 players x 3 lives (" .. totalHits .. ")")
print(string.format("INFO  %d hits, %d misses, %d refused over %d rounds", hits, misses, refused, rounds))

-- the next match: 21 people online, only 20 can play
State.phaseEnd = State.phaseEnd
advance(Config.Match.ResultsTime + Config.Match.Intermission + 2)
check(State.phase == "countdown" and #State.order == 20, "next match has 20 players again even with 21 online (" .. #State.order .. ")")
local spectators = 0
for _, p in players do if not State.byPlayer(p) then spectators += 1 end end
check(spectators == 1, "one spectator")
-- half the lobby leaves during the countdown
for i = 1, 10 do
	local p = humans[i]
	for k, pl in players do if pl == p then table.remove(players, k) break end end
	fireAll("PlayerRemoving", p)
end
advance(Config.Match.Countdown + 0.5)
check(State.phase == "play", "play starts after players left the countdown")
local still = 0
for _, e in State.list() do if e.alive then still += 1 end end
check(still == 10 or still == 11, "only the people who stayed are alive (" .. still .. ")")
-- everybody leaves: the match ends by itself
for _, p in table.clone(players) do
	for k, pl in players do if pl == p then table.remove(players, k) break end end
	fireAll("PlayerRemoving", p)
end
advance(2)
check(State.phase == "results" or State.phase == "lobby", "match ends when nobody is left (" .. State.phase .. ")")
advance(Config.Match.ResultsTime + 1)
advance(30)
check(State.phase == "lobby", "waits in the lobby for the next player")
local again = join(500, "Returning")
advance(Config.Match.Intermission + 1)
check(State.phase == "countdown" and State.byPlayer(again) ~= nil and #State.order == Config.Match.MinTotal, "a new player gets a match with bots")
print("--- full done")

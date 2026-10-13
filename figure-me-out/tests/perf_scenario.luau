-- ===== performance: 20 real players for a few minutes; message traffic, leftovers, and how the work grows =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local Config0 = require(RS.children.Shared.children.Config)
Config0.Modes.Mode = "ctf"
do local F = require(RS.children.Shared.children.Config).Features for k in F do F[k] = true end end -- these scenarios test the full game with every extra switched on
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local State = require(ModN.children.State)
local Config = Config0
Config.Sanity.Enabled = false
local Bounty = require(ModN.children.Bounty)
local Match = require(ModN.children.Match)
local function join(id, name) local p = X.newPlayer(id, name); table.insert(players, p); fireAll("PlayerAdded", p); return p end
local humans = {}
for i = 1, 20 do humans[i] = join(100 + i, "P" .. i) end
advance(1)
advance(Config.Match.Intermission + Config.Match.Countdown + 2)
check(State.phase == "play" and #State.order == 20, "20 players in play")
local function live()
	local n = 0
	for _, o in X.parts do
		local up, dead = o, false
		for _ = 1, 8 do
			if up.__destroyed == true then dead = true break end
			up = up.Parent
			if type(up) ~= "table" and typeof(up) ~= "Instance" and type(up) ~= "userdata" then break end
		end
		if not dead and o.Parent ~= nil then n += 1 end
	end
	return n
end
-- everybody wanders and everybody keeps guessing wrong numbers, so the whole system is busy
local Guess = require(ModN.children.Guess)
local t = 0
TICKHOOK = function(now)
	t += 1
	if State.phase == "play" then State.phaseEnd = math.max(State.phaseEnd, now + 100) end
	for i, e in State.list() do
		if e.char and e.alive then
			local a = now * 0.2 + i
			e.char:PivotTo(CFrame.new(V3new(math.cos(a) * 100, 3.5, math.sin(a) * 100), V3new(0, 3.5, 0)))
		end
	end
end
local items = {"flash", "smoke", "distraction", "scanner", "sprint", "decoy"}
local lastBusy = 0
local busyHook = TICKHOOK
TICKHOOK = function(now)
	busyHook(now)
	if now - lastBusy >= 1 and State.phase == "play" then
		lastBusy = now
		local list = State.list()
		for i, e in list do
			if e.player and e.alive then
				local other = list[(i * 7 + math.floor(now)) % #list + 1]
				fireAll("Action", e.player, "Guess", other.id, other.number)
				fireAll("Action", e.player, "Use", items[(i + math.floor(now)) % #items + 1], V3new(0, 0, 1))
				fireAll("Action", e.player, "Snap", e.char.root.Position + V3new(0, 2, 0), V3new(1, 0, 0))
				for _, it in items do e.items[it] = math.max(e.items[it] or 0, 1) end
			end
		end
	end
end
local start = #notifyLog
local sentStart = {}
advance(30)
local base = live()
local baseIdx = #X.parts
local mid = #notifyLog
advance(120)
local final = #notifyLog
local perSecond = (final - mid) / 120
local kinds = {}
for i = mid + 1, final do kinds[notifyLog[i][1]] = (kinds[notifyLog[i][1]] or 0) + 1 end
local top = {}
for k, v in kinds do table.insert(top, {k, v}) end
table.sort(top, function(a, b) return a[2] > b[2] end)
local line = {}
for i = 1, math.min(5, #top) do table.insert(line, top[i][1] .. "=" .. top[i][2]) end
print("INFO  messages from the server: " .. string.format("%.1f", perSecond) .. " per second for 20 players; busiest: " .. table.concat(line, ", "))
check(perSecond / 20 < 12, "less than 12 messages per second per player (" .. string.format("%.1f", perSecond / 20) .. ")")
local after = live()
local hist = {}
for i = baseIdx + 1, #X.parts do local o = X.parts[i]; if o.__destroyed ~= true and o.Parent ~= nil then local par = o.Parent; local key = tostring(X.where[o]); hist[key] = (hist[key] or 0) + 1 end end
if after - base > 40 then for k, v in hist do print("LEFT", k, v) end end
check(after - base <= 40, "the number of parts in the world stays level over 2 minutes (" .. base .. " -> " .. after .. ")")
-- CPU time of one server tick: 20 players against 4, to make sure nothing blows up
local function timeTicks(n)
	local c = realClock()
	for _ = 1, n do Match.tick(0.25) end
	return (realClock() - c) / n * 1000
end
local ms20 = timeTicks(200)
print("INFO  one server tick with 20 players takes " .. string.format("%.2f", ms20) .. " ms in the test engine")
check(ms20 < 50, "a tick is quick (" .. string.format("%.2f", ms20) .. " ms in the test engine; the real limit is 250 ms)")
print("--- perf done")

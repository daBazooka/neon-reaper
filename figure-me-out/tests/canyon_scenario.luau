-- ===== Waterfall Canyon on the server: the world, the river current, the bots, the spawns =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local Config = require(RS.children.Shared.children.Config)
Config.Modes.Mode = "deathmatch"
Config.Sanity.Enabled = false
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
check(Config.Map.Theme == "canyon", "the game ships on Waterfall Canyon")
local State = require(ModN.children.State)
local Rules = require(RS.children.Shared.children.Rules)
local Canyon = require(RS.children.Shared.children.Canyon)
local Water = require(ModN.children.Water)
local World = require(ModN.children.World)
local Bounty = require(ModN.children.Bounty)
local Events = require(ModN.children.Events)
Bounty.paused = true; Events.paused = true
local function join(id, name) local p = X.newPlayer(id, name); table.insert(players, p); fireAll("PlayerAdded", p); return p end

-- ---- the world ----
check(attrsWS.BootErrors == nil, "the canyon builds without any error")
local parts = (X.made.Part or 0) + (X.made.TrussPart or 0) + (X.made.SpawnLocation or 0)
print("INFO  the canyon world is made of " .. parts .. " parts")
check(parts > 300 and parts < 2200, "a sensible number of parts (" .. parts .. ")")
check((X.made.ParticleEmitter or 0) >= 6, "spray and mist at the foot of every waterfall (" .. tostring(X.made.ParticleEmitter) .. " emitters)")
check((X.made.SurfaceGui or 0) >= 12, "ripple patterns on the waterfalls and the river (" .. tostring(X.made.SurfaceGui) .. " surface guis)")
check((X.made.SpawnLocation or 0) >= 21, "arena spawn pads plus the lobby spawn (" .. tostring(X.made.SpawnLocation) .. ")")
local named = {}
for _, o in X.parts do
	if o.Name == "Waterfall1" or o.Name == "Waterfall2" or o.Name == "Waterfall3" then named[o.Name] = o end
end
check(named.Waterfall1 and named.Waterfall2 and named.Waterfall3, "three waterfalls")
check(named.Waterfall2 and named.Waterfall2.CanCollide == false and named.Waterfall2.CanQuery ~= false, "you walk straight through a waterfall, but it blocks sight")
local list = World.arenaSpawns()
check(#list == 20, "20 arena spawns are in use (" .. #list .. ")")

-- ---- the river current ----
local p1, p2 = join(1, "Swimmer"), join(2, "Dry")
advance(1)
advance(Config.Match.Intermission + Config.Match.Countdown + 2)
check(State.phase == "play", "play starts")
local me, other = State.byPlayer(p1), State.byPlayer(p2)
for _, e in State.list() do if e.bot then e.nextGuessAt = 1e9 end end
local function place(e, x, y, z) e.char:PivotTo(CFrame.new(V3new(x, y, z), V3new(x, y, z + 1))) end
place(me, 0, 4, 40); place(other, -100, 4, 30)
advance(0.6)
check(me.waterForce ~= nil, "standing in the river puts a current on you")
local f = me.waterForce and me.waterForce.Force
check(f and f.Z < 0 and f.X == 0 and f.Y == 0, "...pushing you south, along the river")
check(f and math.abs(f.Z) == 22 * Config.Water.PushScale * 20, "...with the strength set in the layout (" .. tostring(f and f.Z) .. ")")
check(other.waterForce == nil, "somebody on dry ground feels nothing")
place(me, 0, 4, 111.5); advance(0.6)
check(me.waterForce and math.abs(me.waterForce.Force.Z) == 70 * 20, "under a waterfall the push is much stronger")
place(me, -40, 4, 44); advance(0.6)
check(me.waterForce and me.waterForce.Force.X > 0, "the side stream carries you towards the river")
place(me, 0, 14, 70); advance(0.6)
check(me.waterForce == nil, "standing on a bridge you are not in the water")
place(me, 0, 4, 40); advance(0.6)
check(me.waterForce ~= nil, "back in the river: pushed again")
Config.Water.PushScale = 0
advance(0.6)
check(me.waterForce == nil, "the current can be switched off in Config")
Config.Water.PushScale = 1
place(me, -100, 4, 30); advance(0.6)
check(me.waterForce == nil, "out of the water the current is gone")
-- a bot in the river is carried too (it is an entity like any other)
local bot
for _, e in State.list() do if e.bot and not bot then bot = e end end
place(bot, 0, 4, 30); advance(0.6)
check(bot.waterForce ~= nil, "bots feel the current too")
place(bot, -100, 4, 30); bot.route = {}

-- ---- spawns: ten different dry places, each team on its own half ----
check(#State.order == 10, "10 in the match")
local spots, wet = {}, 0
-- (the match started a while ago; look at the spawn list itself)
for _, sp in World.arenaSpawns() do
	spots[string.format("%.0f,%.0f", sp.X, sp.Z)] = true
	if Rules.flowAt(sp.X, sp.Z, Canyon.Water) then wet += 1 end
end
local n = 0 for _ in spots do n += 1 end
check(n == 20 and wet == 0, "all 20 spawn points are different and dry")

-- ---- the bots walk round the trees, rocks and the lake ----
local botsWalk = true
TICKHOOK = function(now)
	if State.phase == "play" then State.phaseEnd = math.max(State.phaseEnd, now + 100) end
	for _, e in State.list() do if botsWalk and e.bot and e.alive and e.char then X.walk(e.char, 0.05) end end
end
local inside, worst = 0, math.huge
local samples = 0
for step = 1, 240 do
	advance(1)
	for _, e in State.list() do
		if e.bot and e.alive and e.char then
			local p = e.char.root.Position
			samples += 1
			if math.abs(p.X) > 130 or p.Z > 100 or p.Z < -130 then inside += 1 end
			for _, o in Canyon.Blockers do
				local d = math.sqrt((p.X - o[1]) ^ 2 + (p.Z - o[2]) ^ 2) - o[3]
				worst = math.min(worst, d)
			end
		end
	end
end
check(inside == 0, "bots stay inside the arena over 4 minutes (" .. samples .. " samples)")
check(worst > 0, "bots never walk into a tree, a rock, an arch or the lake (closest approach " .. string.format("%.1f", worst) .. " studs from an edge)")
local moved = 0
for _, e in State.list() do if e.bot and e.route and #e.route > 0 then moved += 1 end end
check(moved >= 5, "the bots really are on the move (" .. moved .. " have a route)")
print("--- canyon done")

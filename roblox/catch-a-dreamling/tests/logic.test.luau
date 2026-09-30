-- Run with: lune run tests/logic.test.luau
local Config = require("../src/shared/Config")
local Logic = require("../src/shared/Logic")
Logic.setConfig(Config)

local fails = 0
local function check(name, cond) if not cond then fails += 1; print("FAIL", name) else print("ok  ", name) end end

check("fmt small", Logic.fmt(999) == "999")
check("fmt K", Logic.fmt(1500) == "1.5K")
check("fmt M", Logic.fmt(2340000) == "2.3M")
check("fmt big", Logic.fmt(123e12) == "123T")
check("income common", Logic.jarIncome({ id = "puffle", star = 1 }) == 1)
check("income golden x3", Logic.jarIncome({ id = "puffle", mut = "golden", star = 1 }) == 3)
check("income star 2 x3", Logic.jarIncome({ id = "puffle", star = 2 }) == 3)
local jars, m = Logic.mergeJars({ { id = "puffle", star = 1 }, { id = "puffle", mut = "golden", star = 1 }, { id = "puffle", star = 1 }, { id = "blip", star = 1 } })
check("merge count", m == 1 and #jars == 2)
local merged = nil
for _, j in jars do if j.id == "puffle" then merged = j end end
check("merge keeps best mutation", merged and merged.star == 2 and merged.mut == "golden")
local j9 = {}
for _ = 1, 9 do table.insert(j9, { id = "mossy", star = 1 }) end
local out9, m9 = Logic.mergeJars(j9)
check("9 → one ★3 (4 merges)", m9 == 4 and #out9 == 1 and out9[1].star == 3)
check("offline cap", Logic.offlineEarnings(10, 99 * 3600) == 10 * 8 * 3600 * 0.5)
check("offline short", Logic.offlineEarnings(10, 30) == 0)

-- rarity distribution over many rolls
math.randomseed(1)
local rng = { NextNumber = function(_) return math.random() end }
local counts = {}
local N = 200000
for _ = 1, N do local id = Logic.rollSpecies(function() return rng.NextNumber(rng) end, nil); local r = Config.SpeciesById[id].rarity; counts[r] = (counts[r] or 0) + 1 end
for _, r in Config.Rarities do print(string.format("  %-10s %6.3f%%", r.name, (counts[r.id] or 0) / N * 100)) end
check("secret is very rare", (counts.S or 0) / N < 0.0005)
local sec = 0
for _ = 1, 50000 do if Config.SpeciesById[Logic.rollSpecies(function() return rng.NextNumber(rng) end, "secret")].rarity == "S" then sec += 1 end end
check("secret hour boosts secrets", sec / 50000 > 0.003)
local mutated = 0
for _ = 1, 100000 do if Logic.rollMutation(function() return rng.NextNumber(rng) end, nil, 1) then mutated += 1 end end
print(string.format("  mutation rate %.2f%%", mutated / 1000))
check("min order forces legendary+", Config.RarityById[Config.SpeciesById[Logic.rollSpecies(function() return rng.NextNumber(rng) end, nil, 5)].rarity].order >= 5)
check("quests", #Logic.makeQuests(function() return rng.NextNumber(rng) end, 1) == 3)

-- pacing simulation: a player who catches one dreamling every ~14 s (walk, catch, carry home),
-- collects often, buys the cheapest useful thing, merges, and rebirths when possible.
local function sim(minutes)
	local d = { sparkles = 0, up = { netSpeed = 0, reach = 0, speed = 0, bag = 0, luck = 0 }, slots = 4, jars = {}, rebirths = 0 }
	local t, catchT = 0, 0
	local log = {}
	while t < minutes * 60 do
		t += 1
		d.sparkles += Logic.totalIncome(d.jars, d.rebirths, false)
		catchT += 1
		local every = 14 / (1 + d.up.speed * 0.08) / (1 + d.up.bag * 0.6)
		if catchT >= every then
			catchT = 0
			local id = Logic.rollSpecies(function() return rng.NextNumber(rng) end, nil)
			local mut = Logic.rollMutation(function() return rng.NextNumber(rng) end, nil, 1 + d.up.luck * 0.2)
			if #d.jars < d.slots then table.insert(d.jars, { id = id, mut = mut, star = 1 })
			else
				-- replace the weakest jar if the new one is better, selling the old one
				local wi, wv = 1, math.huge
				for i, j in d.jars do local v = Logic.jarIncome(j); if v < wv then wv = v; wi = i end end
				local nj = { id = id, mut = mut, star = 1 }
				if Logic.jarIncome(nj) > wv then d.sparkles += Logic.sellValue(d.jars[wi]); d.jars[wi] = nj end
			end
			d.jars = Logic.mergeJars(d.jars)
		end
		-- spend
		local bought = true
		while bought do
			bought = false
			local best, cost = nil, math.huge
			for _, u in Config.Upgrades do
				local l = d.up[u.id]
				if l < u.max then local c = Logic.upgradeCost(u.id, l); if c < cost then best, cost = u.id, c end end
			end
			local sc = if d.slots < Config.MaxSlots then Logic.slotCost(d.slots) else math.huge
			if sc < cost and d.sparkles >= sc then d.sparkles -= sc; d.slots += 1; bought = true
			elseif best and d.sparkles >= cost then d.sparkles -= cost; d.up[best] += 1; bought = true end
		end
		if d.sparkles >= Logic.rebirthCost(d.rebirths) and d.slots >= 10 then
			table.insert(log, string.format("rebirth %d at %.0f min", d.rebirths + 1, t / 60))
			d.rebirths += 1; d.sparkles = 0; d.jars = {}; d.slots = 4; d.up = { netSpeed = 0, reach = 0, speed = 0, bag = 0, luck = 0 }
		end
		if t % 600 == 0 then table.insert(log, string.format("%3d min: income %s/s  jars %d/%d  upgrades %d/%d/%d/%d/%d  rebirths %d", t / 60, Logic.fmt(Logic.totalIncome(d.jars, d.rebirths, false)), #d.jars, d.slots, d.up.netSpeed, d.up.reach, d.up.speed, d.up.bag, d.up.luck, d.rebirths)) end
	end
	return log
end
for _, l in sim(240) do print("  " .. l) end
print(if fails == 0 then "ALL TESTS PASSED" else fails .. " FAILED")

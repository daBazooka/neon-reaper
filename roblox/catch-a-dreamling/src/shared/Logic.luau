-- CATCH A DREAMLING! game rules as pure functions (no Roblox APIs), shared by server and client
-- and unit tested outside Roblox with Lune.

local Logic = {}
local Config = if script then require(script.Parent:WaitForChild("Config")) else nil

function Logic.setConfig(c) Config = c end

export type Jar = { id: string, mut: string?, star: number }

local SUFFIX = { "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc" }
function Logic.fmt(n: number): string
	if n ~= n then return "0" end
	if n < 1000 then return tostring(math.floor(n)) end
	local i = 1
	while n >= 1000 and i < #SUFFIX do n /= 1000; i += 1 end
	if n >= 100 then return string.format("%d%s", math.floor(n), SUFFIX[i]) end
	return string.format("%.1f%s", math.floor(n * 10) / 10, SUFFIX[i])
end

function Logic.species(id: string) return Config.SpeciesById[id] end
function Logic.rarity(id: string) return Config.RarityById[Config.SpeciesById[id].rarity] end

-- income per second of one jar
function Logic.jarIncome(jar: Jar): number
	local sp = Config.SpeciesById[jar.id]
	if not sp then return 0 end
	local r = Config.RarityById[sp.rarity]
	local m = if jar.mut then (Config.MutationById[jar.mut] and Config.MutationById[jar.mut].mult or 1) else 1
	return r.income * sp.mult * m * Config.StarMult ^ ((jar.star or 1) - 1)
end

function Logic.incomeMult(rebirths: number, double: boolean): number
	return (1 + rebirths * Config.RebirthBonus) * (if double then 2 else 1)
end

function Logic.totalIncome(jars: {Jar}, rebirths: number, double: boolean): number
	local s = 0
	for _, j in jars do s += Logic.jarIncome(j) end
	return s * Logic.incomeMult(rebirths, double)
end

function Logic.upgradeCost(id: string, lvl: number): number
	local u = Config.UpgradeById[id]
	return math.floor(u.base * u.k ^ lvl)
end
function Logic.slotCost(slots: number): number
	return math.floor(Config.SlotBase * Config.SlotK ^ (slots - Config.StartSlots))
end
function Logic.rebirthCost(rebirths: number): number
	return math.floor(Config.RebirthBase * Config.RebirthK ^ rebirths)
end

function Logic.catchTime(speciesId: string, netLvl: number): number
	return Logic.rarity(speciesId).catchTime * 0.87 ^ netLvl
end
function Logic.reach(lvl: number): number return Config.BaseReach + 3 * lvl end
function Logic.walk(lvl: number): number return Config.BaseWalk + 2 * lvl end
function Logic.bagSize(lvl: number, vip: boolean): number return 1 + lvl + (if vip then 1 else 0) end

-- pick a species for a new spawn. rng() returns [0,1)
function Logic.rollSpecies(rng: () -> number, eventId: string?, minOrder: number?): string
	local total = 0
	local w = {}
	for _, sp in Config.Species do
		local r = Config.RarityById[sp.rarity]
		local weight = r.weight / 1 -- per species share of its rarity is split below
		local n = 0
		for _, other in Config.Species do if other.rarity == sp.rarity then n += 1 end end
		weight /= n
		if eventId == "secret" and r.id == "S" then weight *= 60 end
		if eventId == "secret" and r.id == "M" then weight *= 8 end
		if minOrder and r.order < minOrder then weight = 0 end
		w[#w + 1] = { id = sp.id, w = weight }
		total += weight
	end
	local x = rng() * total
	for _, e in w do
		x -= e.w
		if x <= 0 then return e.id end
	end
	return w[#w].id
end

-- pick a mutation (or nil). luck multiplies every chance.
function Logic.rollMutation(rng: () -> number, eventId: string?, luck: number): string?
	if eventId == "giant" then return "giant" end
	if eventId == "disco" and rng() < 0.5 then return "disco" end
	for _, m in Config.Mutations do
		local c = m.chance * luck
		if eventId == "golden" and m.id == "golden" then c *= 8 end
		if eventId == "rainbow" and m.id == "rainbow" then c *= 15 end
		if rng() < c then return m.id end
	end
	return nil
end

-- merge every group of three identical dreamlings (same species and star) into one with star + 1.
-- the best mutation of the three is kept. Returns the new jar list and how many merges happened.
function Logic.mergeJars(jars: {Jar}): ({Jar}, number)
	local out: {Jar} = {}
	for _, j in jars do table.insert(out, { id = j.id, mut = j.mut, star = j.star or 1 }) end
	local merges = 0
	local changed = true
	while changed do
		changed = false
		local groups: {[string]: {number}} = {}
		for i, j in out do
			if j.star < Config.MaxStar then
				local k = j.id .. "#" .. j.star
				groups[k] = groups[k] or {}
				table.insert(groups[k], i)
			end
		end
		for _, idx in groups do
			if #idx >= 3 then
				local a, b, c = out[idx[1]], out[idx[2]], out[idx[3]]
				local best = a.mut
				for _, x in {a, b, c} do
					local mb = best and Config.MutationById[best] and Config.MutationById[best].mult or 1
					local mx = x.mut and Config.MutationById[x.mut] and Config.MutationById[x.mut].mult or 1
					if mx > mb then best = x.mut end
				end
				local merged: Jar = { id = a.id, mut = best, star = a.star + 1 }
				-- remove the three (highest index first) and put the merged one where the first was
				local rm = { idx[1], idx[2], idx[3] }
				table.sort(rm, function(p, q) return p > q end)
				for _, i in rm do table.remove(out, i) end
				table.insert(out, math.min(idx[1], #out + 1), merged)
				merges += 1
				changed = true
				break
			end
		end
	end
	return out, merges
end

function Logic.offlineEarnings(incomePerSec: number, secondsAway: number): number
	local s = math.clamp(secondsAway, 0, Config.OfflineCapHours * 3600)
	if s < 60 then return 0 end
	return math.floor(incomePerSec * s * Config.OfflineRate)
end

function Logic.sellValue(jar: Jar): number
	return math.floor(Logic.jarIncome(jar) * Config.SellSeconds)
end

function Logic.makeQuests(rng: () -> number, level: number)
	local pool = table.clone(Config.QuestTypes)
	local qs = {}
	local tier = math.clamp(level, 1, 3)
	for _ = 1, 3 do
		local i = math.floor(rng() * #pool) + 1
		local q = table.remove(pool, i)
		if q then
			table.insert(qs, { t = q.t, n = q.n[tier], p = 0, done = false, claimed = false, text = string.format(q.text, q.n[tier]) })
		end
	end
	return qs
end

function Logic.questReward(incomePerSec: number, n: number): number
	return math.max(150, math.floor(incomePerSec * 90 + 50 * n))
end

function Logic.dailyReward(day: number, incomePerSec: number)
	local d = Config.Daily[((day - 1) % #Config.Daily) + 1]
	return math.max(d.min, math.floor(incomePerSec * d.incomeSecs)), d.luckMin or 0
end

return Logic

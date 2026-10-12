-- SUB 5 TO TRUE ADAM: the systems that make you come back tomorrow.
--   Daily quests  - three new ones every day (a bonus crate for finishing all three)
--   Mog Pass      - a 28-day season of 30 tiers with a free and a premium reward track
--   Trophies      - long-term achievements that pay out the moment you reach them (and award Roblox badges once set up)
--   Codes         - redeem codes for Aura, crates and pass XP
--   Ranked rating - Elo rating from duels against other players, with a tier ladder and a soft reset every season
--   Friend bonus  - more Aura for every friend in the same server
-- The server owns all of it; the client only reads attributes and asks to claim.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Goals = {}

local dirty = {} -- player -> true when attributes need re-writing
local codeTries = {} -- player -> { count, since }
local friendCache = {} -- "a:b" -> boolean

local function today()
	return os.time() // 86400
end

local function season()
	return os.time() // (Config.Pass.SeasonDays * 86400)
end

-- Seconds until the next day / season starts (the client shows the countdown).
function Goals.secondsToTomorrow()
	return 86400 - os.time() % 86400
end
function Goals.secondsToSeasonEnd()
	local length = Config.Pass.SeasonDays * 86400
	return length - os.time() % length
end

local function grantAura(p, profile, size)
	local aura = Config.GiftAura(profile.Level, size)
	Stats.addAura(p, aura, { raw = true })
	return aura
end

-- Awards the real Roblox badge for a trophy if you created one and pasted its id into Config.BadgeIds.
local function awardBadge(p, id)
	local badgeId = Config.BadgeIds[id]
	if type(badgeId) == "number" and badgeId > 0 then
		task.spawn(function()
			pcall(function()
				game:GetService("BadgeService"):AwardBadge(p.UserId, badgeId)
			end)
		end)
	end
end

local function owns(p)
	local profile = Data.get(p)
	return profile ~= nil and (profile.Passes.mogpass == true or p:GetAttribute("Pass_mogpass") == true)
end

--------------------------------------------------------------------------------
-- Writing attributes (what the Goals window reads)
--------------------------------------------------------------------------------
local function keysOf(set)
	local list = {}
	for k in set do
		table.insert(list, k)
	end
	table.sort(list, function(a, b)
		return (tonumber(a) or 0) < (tonumber(b) or 0)
	end)
	return table.concat(list, ",")
end

local function statValue(profile, stat)
	if stat == "Rating" then
		return profile.BestRating or profile.Rating or 0
	end
	return profile[stat] or 0
end

local function claimable(p, profile)
	local tier = Config.PassTierFor(profile.Pass.XP)
	local ownsPass = owns(p)
	for t = 1, tier do
		if not profile.Pass.Free[tostring(t)] then
			return true
		end
		if ownsPass and not profile.Pass.Prem[tostring(t)] then
			return true
		end
	end
	return false
end

local function write(p)
	local profile = Data.get(p)
	if not profile then
		return
	end
	local parts = {}
	for _, q in profile.DQ.Q do
		table.insert(parts, string.format("%s|%d|%d|%d|%d", q.Kind, q.Goal, math.min(q.Prog, q.Goal), q.Done and 1 or 0, q.Reward))
	end
	p:SetAttribute("DQ", table.concat(parts, ";"))
	p:SetAttribute("DQAll", profile.DQ.All == true)
	p:SetAttribute("PassXP", math.floor(profile.Pass.XP * 10) / 10)
	p:SetAttribute("PassFree", keysOf(profile.Pass.Free))
	p:SetAttribute("PassPrem", keysOf(profile.Pass.Prem))
	p:SetAttribute("Rating", profile.Rating)
	p:SetAttribute("RatingTier", (Config.RatingTier(profile.Rating)))
	local stats = {}
	for _, stat in Config.AchStats do
		table.insert(stats, stat .. "=" .. math.floor(statValue(profile, stat)))
	end
	p:SetAttribute("AchStats", table.concat(stats, ";"))
	p:SetAttribute("Ach", keysOf(profile.Ach))
	local ready = claimable(p, profile)
	p:SetAttribute("GoalsReady", ready)
	dirty[p] = nil
end

--------------------------------------------------------------------------------
-- Mog Pass
--------------------------------------------------------------------------------
local function addPassXP(p, profile, amount)
	if amount <= 0 then
		return
	end
	local before = Config.PassTierFor(profile.Pass.XP)
	local cap = Config.PassTotal(Config.Pass.Tiers)
	profile.Pass.XP = math.min(cap, profile.Pass.XP + amount)
	local after = Config.PassTierFor(profile.Pass.XP)
	if after > before then
		Stats.send(p, "passTier", after)
	end
	dirty[p] = true
end

local function payTier(p, profile, track, tier)
	local reward = Config.PassReward(track, tier)
	local aura = grantAura(p, profile, reward.Size)
	if reward.Crates > 0 then
		Stats.addFreeCrates(p, reward.Crates)
	end
	return aura, reward.Crates
end

-- Season change: pay out everything unclaimed, reset the pass, and soft-reset the ranked rating with its season reward.
local function rollSeason(p, profile)
	local now = season()
	if profile.Pass.Season == now then
		return
	end
	if profile.Pass.Season ~= 0 then
		local tier = Config.PassTierFor(profile.Pass.XP)
		local ownsPass = owns(p)
		local aura, crates = 0, 0
		for t = 1, tier do
			if not profile.Pass.Free[tostring(t)] then
				local a, c = payTier(p, profile, "free", t)
				aura, crates = aura + a, crates + c
			end
			if ownsPass and not profile.Pass.Prem[tostring(t)] then
				local a, c = payTier(p, profile, "prem", t)
				aura, crates = aura + a, crates + c
			end
		end
		local tierIndex = Config.RatingTier(profile.Rating)
		local seasonReward = Config.RatingSeasonReward(tierIndex)
		aura += grantAura(p, profile, seasonReward.Size)
		if seasonReward.Crates > 0 then
			Stats.addFreeCrates(p, seasonReward.Crates)
			crates += seasonReward.Crates
		end
		profile.Rating = math.floor(Config.RatingStart + (profile.Rating - Config.RatingStart) * 0.5)
		Stats.send(p, "seasonEnd", aura, crates, tierIndex)
	end
	profile.Pass = { Season = now, XP = 0, Free = {}, Prem = {} }
	profile.RatingSeason = now
	dirty[p] = true
end

-- Claim one tier of one track ("free" or "prem").
function Goals.claimTier(p, track, tier)
	local profile = Data.get(p)
	if not profile or (track ~= "free" and track ~= "prem") or type(tier) ~= "number" or tier % 1 ~= 0 then
		return false
	end
	if tier < 1 or tier > Config.Pass.Tiers then
		return false
	end
	local reached = Config.PassTierFor(profile.Pass.XP)
	local set = track == "free" and profile.Pass.Free or profile.Pass.Prem
	if tier > reached or set[tostring(tier)] then
		return false
	end
	if track == "prem" and not owns(p) then
		Stats.toast(p, "The premium track needs the Mog Pass", "bad")
		return false
	end
	set[tostring(tier)] = true
	local aura, crates = payTier(p, profile, track, tier)
	Stats.toast(p, string.format("Tier %d  +✦%d%s", tier, aura, crates > 0 and ("  +" .. crates .. " 🎁") or ""), "gold")
	dirty[p] = true
	return true
end

function Goals.claimAll(p)
	local profile = Data.get(p)
	if not profile then
		return 0
	end
	local n = 0
	local reached = Config.PassTierFor(profile.Pass.XP)
	for t = 1, reached do
		if Goals.claimTier(p, "free", t) then
			n += 1
		end
		if owns(p) and Goals.claimTier(p, "prem", t) then
			n += 1
		end
	end
	return n
end

--------------------------------------------------------------------------------
-- Daily quests
--------------------------------------------------------------------------------
local function rollDaily(p, profile)
	if profile.DQ.Day == today() and #profile.DQ.Q == Config.DailyQuestCount then
		return
	end
	local rng = Random.new(today() * 7919 + p.UserId)
	local pool = table.clone(Config.DailyQuestPool)
	local quests = {}
	for _ = 1, Config.DailyQuestCount do
		local i = rng:NextInteger(1, #pool)
		local q = Config.MakeDailyQuest(table.remove(pool, i), profile.Level, profile.Rebirths)
		q.Prog, q.Done = 0, false
		table.insert(quests, q)
	end
	profile.DQ = { Day = today(), Q = quests, All = false }
	dirty[p] = true
end

local function checkDailyQuests(p, profile, kind, amount)
	local changed = false
	for _, q in profile.DQ.Q do
		if q.Kind == kind and not q.Done then
			q.Prog += amount
			changed = true
			if q.Prog >= q.Goal then
				q.Done = true
				Stats.addAura(p, q.Reward, { raw = true })
				addPassXP(p, profile, Config.DailyQuestPassXP)
				Stats.send(p, "dailyQuest", Config.DailyQuestByKind[q.Kind].Text:format(q.Goal), q.Reward)
			end
		end
	end
	if changed then
		local all = true
		for _, q in profile.DQ.Q do
			all = all and q.Done
		end
		if all and not profile.DQ.All then
			profile.DQ.All = true
			Stats.addFreeCrates(p, 1)
			addPassXP(p, profile, Config.DailyQuestAllXP)
			Stats.send(p, "dailyAll")
		end
		dirty[p] = true
	end
end

--------------------------------------------------------------------------------
-- Trophies
--------------------------------------------------------------------------------
local function checkTrophies(p, profile)
	for _, a in Config.Achievements do
		if not profile.Ach[a.Id] and statValue(profile, a.Stat) >= a.Goal then
			profile.Ach[a.Id] = true
			local aura = grantAura(p, profile, a.Reward.Size)
			if a.Reward.Crates > 0 then
				Stats.addFreeCrates(p, a.Reward.Crates)
			end
			awardBadge(p, a.Id)
			Stats.send(p, "trophy", a.Icon .. " " .. a.Name, a.Text:format(tostring(a.Goal)), aura, a.Reward.Crates)
			dirty[p] = true
		end
	end
end

--------------------------------------------------------------------------------
-- Codes
--------------------------------------------------------------------------------
function Goals.redeem(p, text)
	local profile = Data.get(p)
	if not profile or type(text) ~= "string" then
		return false
	end
	local now = os.clock()
	local tries = codeTries[p]
	if not tries or now - tries.since > 60 then
		tries = { count = 0, since = now }
		codeTries[p] = tries
	end
	tries.count += 1
	if tries.count > 6 then
		Stats.toast(p, "Too many tries. Wait a minute.", "bad")
		return false
	end
	local code = string.upper(string.gsub(text, "[%s%-_]", ""))
	if #code < 2 or #code > 24 or string.find(code, "[^A-Z0-9]") then
		Stats.toast(p, "That code is not valid", "bad")
		return false
	end
	local def = Config.Codes[code]
	if not def then
		Stats.toast(p, "That code is not valid", "bad")
		return false
	end
	if profile.Codes[code] then
		Stats.toast(p, "You already used that code", "bad")
		return false
	end
	profile.Codes[code] = true
	local aura = def.Aura and def.Aura > 0 and grantAura(p, profile, def.Aura) or 0
	if (def.Crates or 0) > 0 then
		Stats.addFreeCrates(p, def.Crates)
	end
	addPassXP(p, profile, def.PassXP or 0)
	Stats.send(p, "codeOk", code, aura, def.Crates or 0, def.PassXP or 0)
	dirty[p] = true
	return true
end

--------------------------------------------------------------------------------
-- Ranked rating
--------------------------------------------------------------------------------
-- Call once per player after a duel against another player. Returns the change (or nil if there is no profile).
function Goals.rating(p, won, opponentRating)
	local profile = Data.get(p)
	if not profile then
		return nil
	end
	local before = profile.Rating
	local change = Config.RatingChange(before, opponentRating or Config.RatingStart, won)
	profile.Rating = math.max(100, before + change)
	profile.BestRating = math.max(profile.BestRating or 0, profile.Rating)
	dirty[p] = true
	local oldTier = Config.RatingTier(before)
	local newTier = Config.RatingTier(profile.Rating)
	return profile.Rating - before, profile.Rating, newTier, newTier ~= oldTier
end

function Goals.ratingOf(p)
	local profile = Data.get(p)
	return profile and profile.Rating or Config.RatingStart
end

--------------------------------------------------------------------------------
-- Friends in the same server
--------------------------------------------------------------------------------
local function areFriends(a, b)
	local key = math.min(a.UserId, b.UserId) .. ":" .. math.max(a.UserId, b.UserId)
	local cached = friendCache[key]
	if cached ~= nil then
		return cached
	end
	local ok, result = pcall(function()
		return a:IsFriendsWith(b.UserId)
	end)
	if ok then
		friendCache[key] = result == true
		return result == true
	end
	return false
end

local function refreshFriends(p)
	local count = 0
	for _, other in Players:GetPlayers() do
		if other ~= p and areFriends(p, other) then
			count += 1
		end
	end
	p:SetAttribute("FriendCount", count)
	p:SetAttribute("FriendBonus", math.min(count, Config.FriendBonusMax) * Config.FriendBonusEach)
end

--------------------------------------------------------------------------------
-- Entry points
--------------------------------------------------------------------------------
function Goals.init(p)
	local profile = Data.get(p)
	if not profile then
		return
	end
	rollSeason(p, profile)
	rollDaily(p, profile)
	checkTrophies(p, profile)
	write(p)
	task.spawn(refreshFriends, p)
end

-- Something happened (kind is a Config.PassXP key: swings, train, perfect, duel, crate, hatch, runsec, stage, quest, daily, rebirth).
function Goals.event(p, kind, amount)
	local profile = Data.get(p)
	if not profile or type(amount) ~= "number" then
		return
	end
	addPassXP(p, profile, (Config.PassXP[kind] or 0) * amount)
	checkDailyQuests(p, profile, kind, amount)
end

-- Called once a second for every player.
local ticks = {}
function Goals.tick(p)
	local profile = Data.get(p)
	if not profile then
		return
	end
	ticks[p] = (ticks[p] or 0) + 1
	local t = ticks[p]
	if t % 5 == 0 then
		checkTrophies(p, profile)
	end
	if t % 15 == 0 then
		rollSeason(p, profile)
		rollDaily(p, profile)
		task.spawn(refreshFriends, p)
	end
	if dirty[p] or t % 10 == 0 then
		write(p)
	end
end

function Goals.release(p)
	dirty[p] = nil
	codeTries[p] = nil
	ticks[p] = nil
end

function Goals.handle(p, kind, a)
	if kind == "PassClaim" and type(a) == "table" then
		Goals.claimTier(p, a[1], a[2])
	elseif kind == "PassClaim" and type(a) == "string" then
		local track, tier = string.match(a, "^(%a+):(%d+)$")
		if track then
			Goals.claimTier(p, track, tonumber(tier))
		end
	elseif kind == "PassAll" then
		local n = Goals.claimAll(p)
		if n == 0 then
			Stats.toast(p, "Nothing to claim yet", "info")
		end
	elseif kind == "Code" then
		Goals.redeem(p, a)
	end
end

return Goals

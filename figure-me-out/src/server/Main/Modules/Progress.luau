-- FIGURE ME OUT: what you keep between matches: coins, XP, levels and cosmetics (number plates, trails, elimination
-- effects, emotes). Nothing here changes how strong you are in a match. Rewards are paid once per match.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local Data = require(script.Parent.Data)
local Net = require(script.Parent.Net)
local Plates = require(script.Parent.Plates)

local Progress = {}

local LISTS = { trail = "Trails", effect = "Effects", emote = "Emotes" }
local DEFS = { trail = Config.TrailById, effect = Config.EffectById, emote = Config.EmoteById }
local emoteAt = {} -- userId -> time of the last emote

-- Everything the profile and shop screens read.
function Progress.publish(p)
	local data = Data.get(p)
	if not data then
		return
	end
	local level, into, need = Rules.levelFor(data.XP)
	p:SetAttribute("Coins", data.Coins)
	p:SetAttribute("XP", data.XP)
	p:SetAttribute("Level", level)
	p:SetAttribute("XPInto", into)
	p:SetAttribute("XPNeed", need)
	p:SetAttribute("Trail", data.Trail)
	p:SetAttribute("Effect", data.Effect)
	local owned = {}
	for kind, listName in LISTS do
		for id in data.Owned[listName] do
			table.insert(owned, kind .. ":" .. id)
		end
	end
	for _, e in Config.Emotes do
		if e.Cost == 0 and e.Level == 0 then
			table.insert(owned, "emote:" .. e.Id)
		end
	end
	table.sort(owned)
	p:SetAttribute("Owned", table.concat(owned, ","))
end

function Progress.owns(p, kind, id)
	local def = DEFS[kind] and DEFS[kind][id]
	local data = Data.get(p)
	if not def or not data then
		return false
	end
	if def.Cost == 0 and def.Level == 0 then
		return true
	end
	return data.Owned[LISTS[kind]][id] == true
end

-- Pays out one match. Returns (coins, xp, newLevel, leveledUp) or nil when this match already paid.
function Progress.award(p, score, won, matchId, extraCoins)
	local data = Data.get(p)
	if not data or data.LastRewardMatch == matchId then
		return nil
	end
	data.LastRewardMatch = matchId
	local before = Rules.levelFor(data.XP)
	local coins, xp = Rules.matchRewards(score, won)
	coins += extraCoins or 0
	data.Coins += coins
	data.XP += xp
	local after = Rules.levelFor(data.XP)
	Progress.publish(p)
	Net.send(p, "rewards", coins, xp, after, after > before)
	task.spawn(Data.save, p)
	return coins, xp, after, after > before
end

function Progress.buy(p, kind, id)
	local list, def = LISTS[kind], DEFS[kind] and DEFS[kind][id]
	local data = Data.get(p)
	if not list or not def or not data then
		return false
	end
	if Progress.owns(p, kind, id) then
		Net.toast(p, "You already own " .. def.Name, "info")
		return false
	end
	local level = Rules.levelFor(data.XP)
	local ok, why = Rules.canBuy(def, level, data.Coins)
	if not ok then
		Net.toast(p, why, "bad")
		return false
	end
	data.Coins -= def.Cost
	data.Owned[list][id] = true
	Progress.publish(p)
	Net.toast(p, "Unlocked " .. def.Icon .. " " .. def.Name, "gold")
	task.spawn(Data.save, p)
	return true
end

function Progress.equip(p, kind, id)
	local data = Data.get(p)
	if not data or (kind ~= "trail" and kind ~= "effect") or not Progress.owns(p, kind, id) then
		return false
	end
	if kind == "trail" then
		data.Trail = id
	else
		data.Effect = id
	end
	Progress.publish(p)
	return true
end

-- A quick emoji bubble over your head. Works in the lobby and in matches.
function Progress.emote(p, id)
	local char = p.Character
	local def = Config.EmoteById[id]
	if not char or not def or not Progress.owns(p, "emote", id) then
		return false
	end
	local now = os.clock()
	if now - (emoteAt[p.UserId] or -100) < Config.EmoteCooldown then
		return false
	end
	emoteAt[p.UserId] = now
	Plates.bubble(char, def.Icon, 3)
	return true
end

function Progress.release(p)
	emoteAt[p.UserId] = nil
end

return Progress

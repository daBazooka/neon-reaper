-- FIGURE ME OUT: daily quests. Three small goals a day (play 3 matches, hit 5 players, take 3 photos). Each pays coins when it is done,
-- and finishing all three pays a bonus. They start again every day, which is a gentle reason to come back tomorrow.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Net = require(script.Parent.Net)
local Progress = require(script.Parent.Progress)

local Quests = {}

local function today(now)
	return math.floor((now or os.time()) / 86400)
end

-- Today's quest record (a new day clears it).
local function record(p, now)
	local data = Data.get(p)
	if not data then
		return nil
	end
	local q = data.Quests
	if q.Day ~= today(now) then
		q.Day = today(now)
		q.Progress = {}
		q.Done = {}
	end
	return q
end

-- "play=1/3,hit=0/5,photo=0/3" for the screens.
function Quests.publish(p, now)
	local q = record(p, now)
	if not q then
		return
	end
	local parts = {}
	for _, def in Config.Quests.List do
		table.insert(parts, def.Id .. "=" .. math.min(def.Goal, q.Progress[def.Id] or 0) .. "/" .. def.Goal)
	end
	p:SetAttribute("Quests", table.concat(parts, ","))
end

-- Adds `n` to a quest. Pays and tells the player when it is completed. Returns true when it was completed by this call.
function Quests.bump(p, id, n, now)
	local q = record(p, now)
	local data = Data.get(p)
	if not q or not data then
		return false
	end
	local def
	for _, d in Config.Quests.List do
		if d.Id == id then
			def = d
		end
	end
	if not def or q.Done[id] then
		return false
	end
	q.Progress[id] = (q.Progress[id] or 0) + (n or 1)
	local finished = false
	if q.Progress[id] >= def.Goal then
		q.Done[id] = true
		finished = true
		data.Coins += def.Coins
		Net.toast(p, "✅ Daily quest done: " .. def.Name .. "  +" .. def.Coins .. " 🪙", "gold")
		local all = true
		for _, d in Config.Quests.List do
			all = all and q.Done[d.Id] == true
		end
		if all then
			data.Coins += Config.Quests.AllBonus
			Net.toast(p, "🎉 All daily quests done! +" .. Config.Quests.AllBonus .. " 🪙 Come back tomorrow for new ones.", "gold")
		end
		Progress.publish(p)
	end
	Quests.publish(p, now)
	return finished
end

return Quests

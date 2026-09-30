-- Player saves in a DataStore. Every call is wrapped so the game still runs in Studio when API access
-- is off (progress just won't persist).

local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")

local Data = {}
local STORE_NAME = "CatchADreamling_v1"
local store: DataStore? = nil
do
	local ok, s = pcall(function() return DataStoreService:GetDataStore(STORE_NAME) end)
	if ok then store = s else warn("[Dreamling] DataStore unavailable, progress will not save:", s) end
end

export type Save = {
	v: number, sparkles: number, unclaimed: number, total: number, rebirths: number,
	up: {[string]: number}, slots: number, jars: {any}, dex: {[string]: number},
	stats: {[string]: number}, quests: {any}, questDay: number, daily: { last: number, streak: number },
	lastSeen: number, luckUntil: number, tut: number, dexClaimed: {[string]: boolean}, receipts: {string},
}

function Data.default(): Save
	return {
		v = 1, sparkles = 0, unclaimed = 0, total = 0, rebirths = 0,
		up = { netSpeed = 0, reach = 0, speed = 0, bag = 0, luck = 0 },
		slots = 4, jars = {}, dex = {},
		stats = { caught = 0, rares = 0, legends = 0, mutated = 0, merges = 0, collects = 0, events = 0 },
		quests = {}, questDay = 0, daily = { last = 0, streak = 0 },
		lastSeen = 0, luckUntil = 0, tut = 0, dexClaimed = {}, receipts = {},
	}
end

-- copy saved values over the defaults so new fields added in updates always exist
local function merge(base: any, src: any): any
	if type(src) ~= "table" then return base end
	for k, v in src do
		local b = base[k]
		if type(b) == "table" and type(v) == "table" and next(b) ~= nil and #b == 0 then
			merge(b, v)
		elseif b == nil or type(b) == type(v) then
			base[k] = v
		end
	end
	return base
end

Data.profiles = {} :: {[Player]: Save}
Data.loaded = {} :: {[Player]: boolean}

local function key(p: Player): string return "p_" .. p.UserId end

function Data.load(p: Player): Save
	local d = Data.default()
	if store then
		for attempt = 1, 3 do
			local ok, res = pcall(function() return (store :: DataStore):GetAsync(key(p)) end)
			if ok then
				if res then d = merge(d, res) end
				Data.loaded[p] = true
				break
			end
			warn("[Dreamling] load failed (attempt " .. attempt .. "):", res)
			local msg = tostring(res)
			if string.find(msg, "Studio", 1, true) or string.find(msg, "publish", 1, true) or string.find(msg, "403", 1, true) then
				-- API access is off (usually Studio): play without saving instead of waiting
				store = nil
				break
			end
			task.wait(1.5 * attempt)
		end
	end
	Data.profiles[p] = d
	return d
end

function Data.save(p: Player, leaving: boolean?)
	local d = Data.profiles[p]
	if not d or not store then return end
	-- never overwrite a save we failed to read
	if not Data.loaded[p] then return end
	d.lastSeen = os.time()
	local ok, err = pcall(function()
		(store :: DataStore):UpdateAsync(key(p), function() return d end)
	end)
	if not ok then warn("[Dreamling] save failed:", err) end
	if leaving then Data.profiles[p] = nil; Data.loaded[p] = nil end
end

function Data.saveAll()
	for p in Data.profiles do task.spawn(Data.save, p) end
end

function Data.startAutosave()
	task.spawn(function()
		while true do
			task.wait(90)
			Data.saveAll()
		end
	end)
	game:BindToClose(function()
		if RunService:IsStudio() and not store then return end
		local left = 0
		for p in Data.profiles do
			left += 1
			task.spawn(function() Data.save(p, true); left -= 1 end)
		end
		local t0 = os.clock()
		while left > 0 and os.clock() - t0 < 25 do task.wait(0.2) end
	end)
end

-- ordered store for the global "most caught" board
local ordered: OrderedDataStore? = nil
pcall(function() ordered = DataStoreService:GetOrderedDataStore("CatchADreamling_Caught_v1") end)
function Data.pushLeaderboard(p: Player, caught: number)
	if not ordered then return end
	pcall(function() (ordered :: OrderedDataStore):SetAsync(key(p), math.floor(caught)) end)
end
function Data.topCaught(n: number): {{name: string, value: number}}
	local out = {}
	if not ordered then return out end
	local ok, pages = pcall(function() return (ordered :: OrderedDataStore):GetSortedAsync(false, n) end)
	if not ok or not pages then return out end
	for _, entry in (pages :: DataStorePages):GetCurrentPage() do
		local id = tonumber(string.sub(entry.key, 3)) or 0
		local name = "?"
		pcall(function() name = game:GetService("Players"):GetNameFromUserIdAsync(id) end)
		table.insert(out, { name = name, value = entry.value })
	end
	return out
end

return Data

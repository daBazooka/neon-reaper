-- FIGURE ME OUT: player save data (wins, kills, plate style). Loads/saves with DataStores when available; the game
-- also runs fine in unpublished places (progress just isn't kept).
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")

local Data = {}

local profiles = {}
local savable = {}

local storeOk, store = pcall(function()
	return DataStoreService:GetDataStore("FigureMeOutV1")
end)
if not storeOk then
	warn("[FigureMeOut] Saving disabled (publish the place to enable it).")
	store = nil
end

local function defaults()
	return {
		Wins = 0,
		Kills = 0,
		Games = 0,
		Streak = 0,
		BestStreak = 0,
		BestKills = 0,
		Style = "classic",
		Coins = 0,
		XP = 0,
		Trail = "none",
		Effect = "pixels",
		Owned = { Trails = { none = true }, Effects = { pixels = true }, Emotes = {} },
		Quests = { Day = 0, Progress = {}, Done = {} }, -- today's quests: progress per id and which are paid
		LastDay = 0, -- the last day (UTC) they visited, and how many days in a row
		DayStreak = 0,
		LastRewardMatch = 0, -- the last match that paid out (so one match never pays twice)
		Seen = false, -- the how-to-play card has been shown
		Settings = { Music = true, Sfx = true, Fx = true },
		LastSeen = nil,
	}
end
Data.defaults = defaults

local function reconcile(target, template)
	for k, v in template do
		if target[k] == nil then
			target[k] = type(v) == "table" and table.clone(v) or v
		elseif type(v) == "table" and type(target[k]) == "table" then
			reconcile(target[k], v)
		end
	end
end

function Data.load(p)
	local data
	if store then
		local ok, result = pcall(function()
			return store:GetAsync("u" .. p.UserId)
		end)
		if ok then
			savable[p] = true
			data = result
		else
			warn("[FigureMeOut] load failed (saving off for this session):", result)
		end
	end
	data = type(data) == "table" and data or {}
	reconcile(data, defaults())
	profiles[p] = data
	return data
end

function Data.get(p)
	return profiles[p]
end

function Data.save(p)
	local profile = profiles[p]
	if not store or not profile or not savable[p] then
		return
	end
	profile.LastSeen = os.time()
	local ok, err = pcall(function()
		store:SetAsync("u" .. p.UserId, profile)
	end)
	if not ok then
		warn("[FigureMeOut] save failed:", err)
	end
end

function Data.release(p)
	Data.save(p)
	profiles[p] = nil
	savable[p] = nil
end

function Data.init()
	Players.PlayerRemoving:Connect(Data.release)
	game:BindToClose(function()
		if RunService:IsStudio() then
			return
		end
		for _, p in Players:GetPlayers() do
			task.spawn(Data.save, p)
		end
		task.wait(3)
	end)
	task.spawn(function()
		while true do
			task.wait(60)
			for _, p in Players:GetPlayers() do
				task.spawn(Data.save, p)
			end
		end
	end)
end

--------------------------------------------------------------------------------
-- All-time top winners (shared by every server; only works in a published place)
--------------------------------------------------------------------------------
local winsStore
do
	local ok, result = pcall(function()
		return DataStoreService:GetOrderedDataStore("FigureMeOutWins")
	end)
	if ok then
		winsStore = result
	end
end
local names = {}

function Data.recordWin(p)
	local profile = profiles[p]
	if not winsStore or not profile or not savable[p] then
		return
	end
	pcall(function()
		winsStore:SetAsync(tostring(p.UserId), profile.Wins)
	end)
end

-- A list of text lines for the lobby board ("1. Name  -  12 wins"), or nil when unavailable.
function Data.topLines()
	if not winsStore then
		return nil
	end
	local ok, pages = pcall(function()
		return winsStore:GetSortedAsync(false, 8)
	end)
	if not ok or not pages then
		return nil
	end
	local lines = {}
	local okPage, entries = pcall(function()
		return pages:GetCurrentPage()
	end)
	if not okPage then
		return nil
	end
	for i, entry in entries do
		local id = tonumber(entry.key)
		if id and not names[id] then
			local okName, name = pcall(function()
				return Players:GetNameFromUserIdAsync(id)
			end)
			names[id] = okName and name or "Player"
		end
		lines[i] = string.format("%d. %s  -  %d", i, names[id] or "Player", entry.value)
	end
	return lines
end

return Data

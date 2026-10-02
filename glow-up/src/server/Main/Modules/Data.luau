-- GLOW UP: player save data. Loads/saves with DataStores when available; the game also runs
-- fine in unpublished places (progress just isn't kept).
local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")

local Data = {}

local profiles = {}
local savable = {}

local storeOk, store = pcall(function()
	return DataStoreService:GetDataStore("GlowUpV1")
end)
if not storeOk then
	warn("[GlowUp] Saving disabled (publish the place to enable it).")
	store = nil
end

local function defaults()
	return {
		Aura = 0,
		Power = 0,
		Style = 0,
		Charm = 0,
		Rebirths = 0,
		Levels = {},
		Inv = {}, -- cosmetic id -> stars
		Eq = {}, -- slot -> cosmetic id
		FreeCrates = 0,
		Wins = 0,
		Duels = 0,
		BestStreak = 0,
		Reps = 0,
		Perfects = 0,
		CratesOpened = 0,
		Pity = { neon = 0, icon = 0 },
		QuestsDone = 0,
		Quest = nil,
		Daily = { Last = 0, Streak = 0 },
		Settings = { Music = true, Sfx = true, Duels = true, Fx = true },
		LastSeen = nil,
	}
end

-- Fills in anything missing so old saves keep working after updates.
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
			warn("[GlowUp] load failed (saving off for this session):", result)
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
		warn("[GlowUp] save failed:", err)
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

return Data

-- SUB 5 TO TRUE ADAM: server entry point. Creates the network channels, builds the world, wires every
-- system together, and routes client requests.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")

-- Network channels: Action = client asks the server, Notify = server tells the client.
local net = Instance.new("Folder")
net.Name = "Net"
net.Parent = ReplicatedStorage
local Action = Instance.new("RemoteEvent")
Action.Name = "Action"
Action.Parent = net
local Notify = Instance.new("RemoteEvent")
Notify.Name = "Notify"
Notify.Parent = net

local Modules = script:WaitForChild("Modules")
local Data = require(Modules.Data)
local Stats = require(Modules.Stats)
local Appearance = require(Modules.Appearance)
local Cosmetics = require(Modules.Cosmetics)
local Nameplate = require(Modules.Nameplate)
local Quests = require(Modules.Quests)
local Daily = require(Modules.Daily)
local Shards = require(Modules.Shards)
local Training = require(Modules.Training)
local Crates = require(Modules.Crates)
local Duels = require(Modules.Duels)
local Competition = require(Modules.Competition)
local Shop = require(Modules.Shop)
local Events = require(Modules.Events)
local Runway = require(Modules.Runway)
local Board = require(Modules.Board)
local World = require(Modules.World)

--------------------------------------------------------------------------------
-- World + systems
--------------------------------------------------------------------------------
print("[TrueAdam] server starting")
local okWorld, info = pcall(World.build, {
	train = Training.start,
	crates = function(p)
		Stats.send(p, "openMenu", "Crates")
	end,
	duelQueue = Duels.joinQueue,
	duelBot = Duels.duelBot,
	comp = Competition.enter,
})
if okWorld then
	Duels.setArena(info.arena)
	Competition.setStage(info.stage, info.compBoard)
	Shards.build(info.slots)
	Board.init(info.board)
	print("[TrueAdam] world built, shards:", #info.slots)
else
	warn("[TrueAdam] World.build FAILED:", info)
end
Appearance.setHook(Cosmetics.apply) -- rebuild accessories whenever the body size changes
Shards.init()
Competition.init()
Training.init()
Runway.init()
Events.init()
Data.init()

--------------------------------------------------------------------------------
-- Player lifecycle
--------------------------------------------------------------------------------
local function onCharacter(p)
	local char = p.Character
	if not char then
		return
	end
	char:WaitForChild("HumanoidRootPart")
	char:WaitForChild("Humanoid")
	Stats.applyMovement(p)
	Appearance.onCharacter(p)
	Cosmetics.onCharacter(p)
	Nameplate.onCharacter(p)
end

local function onPlayer(p)
	local profile = Data.load(p)
	Stats.init(p)
	Quests.init(p)
	Daily.refresh(p)
	Nameplate.init(p)
	Cosmetics.sync(p)

	-- Your look keeps earning while you're away.
	if profile.LastSeen then
		local away = math.clamp(os.time() - profile.LastSeen, 0, 2 * 3600)
		local gain = math.floor((p:GetAttribute("AuraRate") or 0) * away * 0.5)
		if gain > 0 then
			Stats.addAura(p, gain, { raw = true })
			p:SetAttribute("OfflineGain", gain)
		end
	end

	p.CharacterAdded:Connect(function()
		onCharacter(p)
	end)
	if p.Character then
		task.spawn(onCharacter, p)
	end
end

Players.PlayerAdded:Connect(onPlayer)
for _, p in Players:GetPlayers() do
	task.spawn(onPlayer, p)
end

Players.PlayerRemoving:Connect(function(p)
	Training.release(p)
	Duels.release(p)
	Competition.release(p)
	Stats.forget(p)
end)

--------------------------------------------------------------------------------
-- Idle income + daily refresh
--------------------------------------------------------------------------------
task.spawn(function()
	local tick = 0
	while true do
		task.wait(1)
		tick += 1
		for _, p in Players:GetPlayers() do
			if p:GetAttribute("Ready") then
				local rate = p:GetAttribute("AuraRate") or 0
				if rate > 0 then
					Stats.addAuraFractional(p, rate * Stats.eventMult("AuraMult"), { raw = true })
				end
				if tick % 30 == 0 then
					Daily.refresh(p)
				end
			end
		end
	end
end)

--------------------------------------------------------------------------------
-- Client requests (rate limited)
--------------------------------------------------------------------------------
local SETTING_KEYS = { Music = true, Sfx = true, Duels = true, Fx = true }
local budget = {}

Action.OnServerEvent:Connect(function(p, kind, a, b)
	if type(kind) ~= "string" or not p:GetAttribute("Ready") then
		return
	end
	local now = os.clock()
	local state = budget[p]
	if not state or now - state.t > 1 then
		state = { t = now, n = 0 }
		budget[p] = state
	end
	state.n += 1
	if state.n > 60 then
		return
	end

	if kind == "Equip" or kind == "Unequip" then
		Cosmetics.handle(p, kind, a)
	elseif kind == "Buy" or kind == "Rebirth" then
		Shop.handle(p, kind, a)
	elseif kind == "OpenCrate" and type(a) == "string" then
		Crates.open(p, a)
	elseif kind == "Claim" then
		Daily.claim(p)
	elseif kind == "TrainHit" or kind == "TrainCancel" then
		Training.handle(p, kind, a)
	elseif kind == "DuelTaps" then
		Duels.handle(p, kind, a)
	elseif kind == "CompTaps" then
		Competition.handle(p, kind, a)
	elseif kind == "Setting" and type(a) == "string" and SETTING_KEYS[a] then
		Stats.setSetting(p, a, b)
	end
end)

Players.PlayerRemoving:Connect(function(p)
	budget[p] = nil
end)

print("[TrueAdam] ready")

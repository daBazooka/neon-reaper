-- SUB 5 TO TRUE ADAM: server entry point. Creates the network channels, builds the world, wires every
-- system together, and routes client requests.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))

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
local Quirks = require(Modules.Quirks)
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
local Hammers = require(Modules.Hammers)
local Pets = require(Modules.Pets)
local Aura = require(Modules.Aura)
local Playtime = require(Modules.Playtime)
local Tutorial = require(Modules.Tutorial)
local Buildings = require(Modules.Buildings)
local Treadmill = require(Modules.Treadmill)
local Store = require(Modules.Store)
local World = require(Modules.World)

--------------------------------------------------------------------------------
-- World + systems
--------------------------------------------------------------------------------
print("[TrueAdam] server starting")
local okWorld, info = pcall(World.build)
if okWorld then
	Duels.setArena(info.arena, info.battle)
	Competition.setStage(info.stage, info.compBoard)
	Shards.build(info.slots)
	Board.init(info.board)
	print("[TrueAdam] world built, shards:", #info.slots)
else
	warn("[TrueAdam] World.build FAILED:", info)
end
-- Rebuild the face/hair/belly and any worn items whenever the body changes.
Appearance.setHook(function(p)
	Quirks.apply(p)
	Cosmetics.apply(p)
	Aura.apply(p)
end)
Shards.init()
Competition.init()
Training.init()
Pets.init()
Store.start()
Treadmill.init()
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
	Hammers.attach(p)
	Pets.refresh(p)
end

local function onPlayer(p)
	local profile = Data.load(p)
	Stats.init(p)
	Quests.init(p)
	Daily.refresh(p)
	Playtime.init(p)
	Tutorial.init(p)
	Store.init(p)
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
	Hammers.release(p)
	Pets.release(p)
	Playtime.release(p)
	Tutorial.release(p)
	Treadmill.release(p)
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
				Playtime.tick(p)
				Tutorial.tick(p)
				Treadmill.tick(p)
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
-- Everything you can use is activated by a button on screen (or E). The server checks how close your
-- character is, so it works the same from any camera angle.
local INTERACT_SLACK = 8
local interactions = {
	Gym = function(p)
		Training.start(p, "Power")
	end,
	Studio = function(p)
		Training.start(p, "Style")
	end,
	Lounge = function(p)
		Training.start(p, "Charm")
	end,
	Crates = function(p)
		Stats.send(p, "openMenu", "Crates")
	end,
	Ring = Duels.joinQueue,
	Battle = Duels.stageFight,
	Bot = Duels.duelBot,
	Stage = Competition.enter,
}

local function nearTo(p, pos, radius)
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if not root then
		return false
	end
	local d = root.Position - pos
	return Vector3.new(d.X, 0, d.Z).Magnitude <= radius + INTERACT_SLACK
end

local function interact(p, id)
	local treadId = string.match(id, "^Tread:(%d+)$")
	if treadId then
		local n = tonumber(treadId)
		if Config.Treadmills[n] and nearTo(p, Config.TreadPos(n), Config.TreadRadius) then
			Treadmill.use(p, n)
		end
		return
	end
	local hammerId = string.match(id, "^Hammer:(%d+)$")
	if hammerId then
		local n = tonumber(hammerId)
		if Config.HammerById[n] and nearTo(p, Config.HammerPos(n), Config.HammerRadius) then
			Hammers.use(p, n)
		end
		return
	end
	local handler = interactions[id]
	for _, entry in Config.Interactables do
		if entry.Id == id and handler and nearTo(p, Config.InteractPos(entry), entry.Radius) then
			-- Buildings must be unlocked first; the press that buys it does not also use it.
			if entry.Building and not Buildings.owned(p, entry.Building) then
				Buildings.unlock(p, entry.Building)
				return
			end
			if Treadmill.isRunning(p) then
				return
			end
			handler(p)
			return
		end
	end
end

local SETTING_KEYS = { Music = true, Sfx = true, Duels = true, Fx = true, Voice = true }
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
	elseif kind == "Hatch" or kind == "PetEquip" or kind == "PetUnequip" then
		Pets.handle(p, kind, a)
	elseif kind == "TreadStop" then
		Treadmill.stop(p)
	elseif kind == "TutorialSkip" then
		Tutorial.skip(p)
	elseif kind == "Swing" then
		Hammers.swing(p)
	elseif kind == "Interact" and type(a) == "string" then
		interact(p, a)
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

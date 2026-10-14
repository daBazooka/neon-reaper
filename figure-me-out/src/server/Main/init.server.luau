-- FIGURE ME OUT: server entry point. Creates the remotes, builds the world and starts the match loop.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Modules = script:WaitForChild("Modules")
local Data = require(Modules.Data)
local World = require(Modules.World)
local Match = require(Modules.Match)
local Guess = require(Modules.Guess)
local Photos = require(Modules.Photos)
local Items = require(Modules.Items)
local Progress = require(Modules.Progress)
local Alliance = require(Modules.Alliance)
local State = require(Modules.State)
local Votes = require(Modules.Votes)
local Combat = require(Modules.Combat)
local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

Players.CharacterAutoLoads = false

-- The two remotes (created first so clients can wait for them): Action = client asks, Notify = server tells.
local net = Instance.new("Folder")
net.Name = "Net"
net.Parent = ReplicatedStorage
local action = Instance.new("RemoteEvent")
action.Name = "Action"
action.Parent = net
local notify = Instance.new("RemoteEvent")
notify.Name = "Notify"
notify.Parent = net

-- Anything that goes wrong while starting up is printed AND shown on every player's screen, so it can be fixed fast.
local bootErrors = {}
local function report(where, err)
	warn("[FigureMeOut] " .. where .. " failed: " .. tostring(err))
	table.insert(bootErrors, where .. ": " .. tostring(err))
	workspace:SetAttribute("BootErrors", string.sub(table.concat(bootErrors, "\n"), 1, 600))
end

local okData, errData = pcall(Data.init)
if not okData then
	report("Data.init", errData)
end
local okWorld, worldErrors = pcall(World.build)
pcall(World.watchStatus)
if not okWorld then
	report("World.build", worldErrors)
else
	for _, e in worldErrors do
		report("World", e)
	end
end

-- Every request is checked and rate limited, and a bad one can never crash the server.
-- the shortest time allowed between two requests of the same kind from one player
local MIN_GAP = { Guess = 0.25, Use = 0.3, Snap = 0.5, Emote = 1, Buy = 0.5, Equip = 0.3, AllyAsk = 1, AllyReply = 0.3, Share = 1, Vote = Config.Vote.MinGap, Dash = 0.3 }
local lastCall = {} -- userId -> { kind -> time of the last call }
local function allowed(p, kind)
	local now = os.clock()
	local mine = lastCall[p.UserId]
	if not mine then
		mine = {}
		lastCall[p.UserId] = mine
	end
	if now - (mine[kind] or 0) < (MIN_GAP[kind] or 0.08) then
		return false
	end
	mine[kind] = now
	return true
end

local handlers = {}
function handlers.Guess(p, targetId, text)
	Guess.handle(p, targetId, text)
end
function handlers.Snap(p, origin, look)
	if Config.Features.Photos then
		Photos.snap(p, origin, look)
	end
end
function handlers.Use(p, id, look)
	local e = State.byPlayer(p)
	if e and Config.Features.Gadgets and type(id) == "string" then
		Items.use(e, id, look)
	end
end
function handlers.Scope(p, on)
	if Config.Features.Binoculars then
		Match.setScope(p, on == true)
	end
end
function handlers.Style(p, id)
	if type(id) == "string" then
		Match.setStyle(p, id)
	end
end
function handlers.Emote(p, id)
	if type(id) == "string" then
		Progress.emote(p, id)
	end
end
local KINDS = { trail = true, effect = true, emote = true }
function handlers.Buy(p, kind, id)
	if KINDS[kind] and type(id) == "string" then
		Progress.buy(p, kind, id)
	end
end
function handlers.Equip(p, kind, id)
	if type(id) == "string" then
		Progress.equip(p, kind, id)
	end
end
function handlers.AllyAsk(p, targetId)
	local e = State.byPlayer(p)
	if e and Config.Features.Alliances and type(targetId) == "number" then
		Alliance.propose(e, targetId)
	end
end
function handlers.AllyReply(p, fromId, yes)
	local e = State.byPlayer(p)
	if e and Config.Features.Alliances and type(fromId) == "number" then
		Alliance.respond(e, fromId, yes == true)
	end
end
function handlers.AllyEnd(p)
	local e = State.byPlayer(p)
	if e then
		Alliance.leave(e)
	end
end
function handlers.Share(p, entries)
	local e = State.byPlayer(p)
	if e and Config.Features.Alliances then
		Alliance.share(e, entries)
	end
end
function handlers.Vote(p, id)
	Votes.cast(p, id)
end
function handlers.Dash(p, look)
	local e = State.byPlayer(p)
	if e then
		Combat.dash(e, look)
	end
end
function handlers.Ready(p, on)
	Match.setReady(p, on == true)
end
function handlers.Seen(p)
	local data = Data.get(p)
	if data then
		data.Seen = true
		p:SetAttribute("Seen", true)
	end
end
function handlers.Setting(p, key, value)
	local data = Data.get(p)
	if data and (key == "Music" or key == "Sfx" or key == "Fx") and type(value) == "boolean" then
		data.Settings[key] = value
		p:SetAttribute(key, value)
	end
end

action.OnServerEvent:Connect(function(p, kind, ...)
	local handler = type(kind) == "string" and handlers[kind]
	if not handler or not allowed(p, kind) then
		return
	end
	local ok, err = pcall(handler, p, ...)
	if not ok then
		warn("[FigureMeOut] " .. kind .. " failed:", err)
	end
end)

local function join(p)
	local ok, err = pcall(Match.onJoin, p)
	if not ok then
		report("join " .. p.Name, err)
		-- still give them a body so they are never stuck staring at the sky
		pcall(function()
			p:LoadCharacter()
		end)
	end
end
Players.PlayerAdded:Connect(function(p)
	task.spawn(join, p)
end)
for _, p in Players:GetPlayers() do
	task.spawn(join, p)
end
Players.PlayerRemoving:Connect(function(p)
	Match.onLeave(p)
	lastCall[p.UserId] = nil
end)

-- The top winners board in the lobby refreshes every minute.
task.spawn(function()
	while true do
		local lines = Data.topLines()
		if lines and #lines > 0 then
			World.setBoard(lines)
		end
		task.wait(60)
	end
end)

-- The match loop restarts itself if anything in it ever fails, instead of leaving everybody stuck.
task.spawn(function()
	while true do
		local ok, err = pcall(Match.run)
		report("match loop", err)
		pcall(Match.cleanup)
		task.wait(3)
	end
end)
print("[" .. Config.GameName .. "] ready")

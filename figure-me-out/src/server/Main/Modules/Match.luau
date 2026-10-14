-- FIGURE ME OUT: the match from start to finish: lobby wait, countdown, play, THE REVEAL, results, back to the lobby.
-- It also looks after players joining and leaving and keeps their wins and stats.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Data = require(script.Parent.Data)
local Plates = require(script.Parent.Plates)
local Combat = require(script.Parent.Combat)
local Items = require(script.Parent.Items)
local Cover = require(script.Parent.Cover)
local Pickups = require(script.Parent.Pickups)
local Bots = require(script.Parent.Bots)
local World = require(script.Parent.World)
local Progress = require(script.Parent.Progress)
local Alliance = require(script.Parent.Alliance)
local Bounty = require(script.Parent.Bounty)
local Terminals = require(script.Parent.Terminals)
local Events = require(script.Parent.Events)
local Modes = require(script.Parent.Modes)
local Flags = require(script.Parent.Flags)
local Water = require(script.Parent.Water)
local Votes = require(script.Parent.Votes)
local Badges = require(script.Parent.Badges)
local Quests = require(script.Parent.Quests)
local Maps = require(Shared:WaitForChild("Maps"))

local Match = {}

local rng = Random.new()
local function roll()
	return rng:NextNumber()
end

local function toLobby(p)
	local char = p.Character
	if char then
		char:PivotTo(CFrame.new(World.lobbySpawn(p.UserId % Config.Match.MaxPlayers + 1)))
	end
end

Match.ready = {} -- userId -> true: pressed READY in the lobby (when everybody has, the match starts at once)

function Match.setReady(p, on)
	if State.phase ~= "lobby" or not p or not p.Parent then
		return false
	end
	Match.ready[p.UserId] = on ~= false or nil
	local n = 0
	for _, q in Players:GetPlayers() do
		if Match.ready[q.UserId] then
			n += 1
		end
	end
	workspace:SetAttribute("ReadyCount", n)
	p:SetAttribute("Ready", Match.ready[p.UserId] == true)
	return true
end

-- Has every player here pressed READY? (Never true with nobody here.)
function Match.allReady()
	local any = false
	for _, q in Players:GetPlayers() do
		any = true
		if not Match.ready[q.UserId] then
			return false
		end
	end
	return any
end

Match.played = {} -- userId -> the last match they played in (the queue for a full server goes by this)

-- Who is waiting in the lobby for the next match (not in the one that is running), and how many are playing. Also tells every
-- waiting player their place in the queue. Published as attributes the screens read.
function Match.publishQueue()
	local waiting = 0
	for _, p in Players:GetPlayers() do
		local e = State.byPlayer(p)
		if e then
			p:SetAttribute("Playing", true)
			p:SetAttribute("QueuePos", 0)
		else
			waiting += 1
			p:SetAttribute("Playing", false)
			p:SetAttribute("QueuePos", waiting)
		end
	end
	workspace:SetAttribute("Waiting", waiting)
	workspace:SetAttribute("MaxPlayers", Config.Match.MaxPlayers)
	return waiting
end

-- Gives the player a fresh character standing in the lobby.
function Match.respawnLobby(p)
	if not p.Parent then
		return
	end
	p:LoadCharacter()
	toLobby(p)
end

local function ensureCharacter(p)
	local char = p.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not char or not hum or hum.Health <= 0 or not char:FindFirstChild("Head") then
		p:LoadCharacter()
	end
	return p.Character
end

--------------------------------------------------------------------------------
-- Starting a match
--------------------------------------------------------------------------------
local function shuffled(n)
	local list = {}
	for i = 1, n do
		list[i] = i
	end
	for i = n, 2, -1 do
		local j = 1 + math.floor(roll() * i)
		list[i], list[j] = list[j], list[i]
	end
	return list
end

local function styleFor(p)
	local data = Data.get(p)
	local id = data and data.Style or "classic"
	local def = Config.PlateStyleById[id]
	if not def or (data and data.Wins < def.Wins) then
		return "classic"
	end
	return id
end

local function hookDeath(e)
	local hum = e.char and e.char:FindFirstChildOfClass("Humanoid")
	if hum then
		hum.Died:Connect(function()
			if e.alive and State.entities[e.id] == e then
				Combat.eliminate(e, nil, "fell")
			end
		end)
	end
end

-- Makes an entity a living member of the match: name, number, lives, plate. (Used when a match starts and when somebody joins late.)
function Match.activate(e, color, animal, now)
	if e.player then
		-- real players are shown by their own Roblox name; only bots (off by default) get a colour and animal codename
		local shown = e.player.DisplayName
		if type(shown) ~= "string" or shown == "" then
			shown = e.player.Name
		end
		e.code = shown
		e.icon = ""
	else
		e.code = color.Name .. " " .. animal.Name
		e.icon = animal.Icon
	end
	if not e.team then
		e.color = color.Color
	end
	if e.dummy then
		e.code = "Dummy " .. e.dummyIndex
		e.icon = "🎯"
	end
	e.number = Rules.newNumber(roll, State.takenNumbers())
	e.alive = true
	e.kills = 0
	e.bullets = Config.Guess.Bullets
	e.chargeSince = now
	e.stunUntil = 0
	e.scoped = false
	e.lastGuess = -100
	e.lives = e.dummy and 99 or Config.Lives.Start -- (a dummy loses a life when you get its number, and comes back)
	e.score = 0
	e.hitTimes = {}
	e.seenBy = {}
	e.bonusCoins = 0
	e.startedAt = now
	e.protectedUntil = 0
	e.ally = nil
	State.add(e)
	Items.reset(e)
	Cover.reset(e)
	Terminals.reset(e)
	Plates.setup(e)
	State.writeEntity(e)
	Combat.applySpeed(e)
	hookDeath(e)
end

-- Builds the list of players and bots for a new match and puts everyone on the street. Returns the number of entities.
function Match.setup()
	Items.clearAll()
	Bots.clear()
	State.clear()
	State.revealing = false
	State.matchId += 1

	local players = Players:GetPlayers()
	-- at most 20 play. If more are here, the ones who sat out the last match go first, then whoever has waited longest
	local order = {}
	for i, p in players do
		table.insert(order, { p = p, last = Match.played[p.UserId] or 0, i = i })
	end
	table.sort(order, function(a, b)
		if a.last ~= b.last then
			return a.last < b.last
		end
		return a.i < b.i
	end)
	local humans = {}
	for _, o in order do
		if #humans < Config.Match.MaxPlayers then
			table.insert(humans, o.p)
			Match.played[o.p.UserId] = State.matchId
		end
	end
	local botCount = math.max(0, math.min(Config.Match.MinTotal, Config.Match.MaxPlayers) - #humans)
	-- a practice round gives the lone player dummies to type numbers at (nothing else to do alone)
	local practice = Modes.next == "practice"
	if practice then
		botCount = Config.Match.PracticeDummies
	end
	local total = #humans + botCount
	local names = Rules.codenames(roll, total)
	local arena = World.arenaSpawns()
	local spawnOrder = shuffled(#arena)
	local now = State.now()

	local function finish(e, index)
		local nameInfo = names[index]
		Match.activate(e, Config.Colors[nameInfo.color], Config.Animals[nameInfo.animal], now)
	end

	-- first make everybody (so teams can be dealt), then place them
	Modes.begin()
	local list = {}
	for _, p in humans do
		local char = ensureCharacter(p)
		local e = { id = p.UserId, player = p, char = char, style = styleFor(p) }
		local data = Data.get(p)
		if data then
			if Progress.owns(p, "trail", data.Trail) then
				e.trailDef = Config.TrailById[data.Trail]
			end
			if Progress.owns(p, "effect", data.Effect) then
				e.effectDef = Config.EffectById[data.Effect]
			end
		end
		table.insert(list, e)
	end
	for b = 1, botCount do
		table.insert(list, { id = -b, bot = true, dummy = practice or nil, dummyIndex = b, char = Bots.makeModel(practice and ("Dummy " .. b) or ("Bot" .. b)), style = "classic" })
	end
	Modes.assignTeams(list)
	-- team modes: each team spawns on its own side of the map (red west, blue east)
	local pools, taken = {}, { 0, 0 }
	for team = 1, 2 do
		local side = {}
		for _, sp in arena do
			if (team == 1 and sp.X < 0) or (team == 2 and sp.X > 0) then
				table.insert(side, sp)
			end
		end
		for i = #side, 2, -1 do
			local j = 1 + math.floor(roll() * i)
			side[i], side[j] = side[j], side[i]
		end
		pools[team] = side
	end
	for index, e in list do
		local spawn
		if e.team then
			taken[e.team] += 1
			spawn = pools[e.team][(taken[e.team] - 1) % #pools[e.team] + 1]
		else
			spawn = arena[spawnOrder[(index - 1) % #spawnOrder + 1]]
		end
		if e.dummy then
			-- dummies stand in the open ground near the middle of the map, where the terminals are
			local spots = Config.Map.Terminals
			Bots.place(e, spots[(e.dummyIndex - 1) % #spots + 1])
		elseif e.bot then
			Bots.place(e, spawn)
		elseif e.char then
			e.char:PivotTo(CFrame.new(spawn + Vector3.new(0, 2, 0), Vector3.new(0, spawn.Y + 2, 0)))
			e.sanePos = nil; e.saneAt = nil
		end
		finish(e, index)
	end
	Pickups.reset()
	Alliance.reset()
	State.writeWorld()
	return total
end

--------------------------------------------------------------------------------
-- During a match
--------------------------------------------------------------------------------
-- A spawn point with nobody close, for somebody who lost a life and is coming back.
function Match.safeSpawn(team)
	local best, bestScore = nil, -1
	local arena = World.arenaSpawns()
	for _, spawn in arena do
		if team and ((team == 1 and spawn.X > 0) or (team == 2 and spawn.X < 0)) then
			continue
		end
		local nearest = math.huge
		for _, other in State.aliveList() do
			local root = other.char and other.char:FindFirstChild("HumanoidRootPart")
			if root then
				nearest = math.min(nearest, (root.Position - spawn).Magnitude)
			end
		end
		local score = nearest + roll() * 15
		if score > bestScore then
			best, bestScore = spawn, score
		end
	end
	return best or arena[1]
end

-- Can somebody who just arrived still join the match that is running? Yes, unless it is nearly over, full, or they already played in it.
function Match.canDropIn(p)
	if State.byPlayer(p) or not p.Parent then
		return false
	end
	if State.mode and State.mode.Practice then
		return false -- (a practice round ends when somebody arrives)
	end
	if State.phase == "countdown" then
		return #State.order < Config.Match.MaxPlayers
	end
	return State.phase == "play" and #State.order < Config.Match.MaxPlayers and State.phaseEnd - State.now() > Config.Match.RevealAt
end

-- A player arrives while a match is on: they go straight into it (their own number, three lives, a few seconds
-- of protection, on their team's side in team modes). Returns true when they joined.
function Match.dropIn(p)
	if not Match.canDropIn(p) then
		return false
	end
	local char = ensureCharacter(p)
	if not char or not Match.canDropIn(p) then
		return false
	end
	local color, animal = Config.Colors[1 + math.floor(roll() * #Config.Colors)], Config.Animals[1 + math.floor(roll() * #Config.Animals)]
	local e: any = { id = p.UserId, player = p, char = char, style = styleFor(p) }
	local data = Data.get(p)
	if data then
		if Progress.owns(p, "trail", data.Trail) then
			e.trailDef = Config.TrailById[data.Trail]
		end
		if Progress.owns(p, "effect", data.Effect) then
			e.effectDef = Config.EffectById[data.Effect]
		end
	end
	if State.mode.Teams then
		e.team = Modes.teamFor()
		e.color = Config.Teams[e.team].Color
	end
	local spawn = Match.safeSpawn(e.team)
	char:PivotTo(CFrame.new(spawn + Vector3.new(0, 2, 0), Vector3.new(0, spawn.Y + 2, 0)))
	Match.activate(e, color, animal, State.now())
	Combat.protect(e, Config.Lives.Protect)
	State.writeEntity(e)
	State.writeWorld()
	Net.send(p, "phase", State.phase, State.phaseEnd)
	if Config.Number.ShowOwn then
		Net.send(p, "myNumber", e.number)
	end
	return true
end

-- Tells every real player their own number (and nobody else's), so they know what to hide.
function Match.tellNumbers()
	if not Config.Number.ShowOwn then
		return
	end
	for _, e in State.list() do
		if e.player then
			Net.send(e.player, "myNumber", e.number)
		end
	end
end

function Match.reveal()
	if State.revealing then
		return
	end
	State.revealing = true
	for _, e in State.aliveList() do
		Plates.showReveal(e, true, false)
	end
	State.writeWorld()
	Net.sendAll("reveal")
end

local function humansAlive()
	for _, e in State.aliveList() do
		if e.player then
			return true
		end
	end
	return false
end

-- One quarter-second of play. Returns true when the match is over.
function Match.tick(dt)
	local now = State.now()
	for _, e in State.aliveList() do
		e.bullets, e.chargeSince = Rules.regenBullets(e.bullets, e.chargeSince, now)
		-- a few points for every stretch you stay alive
		if now - (e.surviveAt or e.startedAt or now) >= Config.Score.SurviveEvery then
			e.surviveAt = now
			e.score = (e.score or 0) + Config.Score.Survive
		end
		Combat.applySpeed(e)
		if e.player then
			Cover.step(e, dt)
		end
		State.writeEntity(e)
	end
	Water.tick()
	Items.tick(now)
	if Config.Features.Gadgets then
		Pickups.tick(now)
	end
	Bots.tick(now)
	Alliance.tick(now)
	if Config.Features.Bounty then
		Bounty.tick(now)
	end
	if Config.Features.Events then
		Events.tick(now)
	end
	Flags.tick(now)
	if not State.revealing and State.phaseEnd - now <= Config.Match.RevealAt then
		Match.reveal()
	end
	State.writeWorld()
	local waiting = Match.publishQueue()
	-- a practice round ends the moment somebody else is here, so they do not wait for it
	if State.mode.Practice and waiting > 0 then
		return true
	end
	return Modes.over() or now >= State.phaseEnd or not humansAlive()
end

--------------------------------------------------------------------------------
-- Results
--------------------------------------------------------------------------------
local function award(e, won)
	local p = e.player
	local data = p and Data.get(p)
	if not data then
		return
	end
	data.Games += 1
	data.Kills += e.kills
	data.BestKills = math.max(data.BestKills, e.kills)
	if won then
		local before = data.Wins
		data.Wins += 1
		data.Streak += 1
		data.BestStreak = math.max(data.BestStreak, data.Streak)
		Data.recordWin(p)
		Badges.award(p, "first_win")
		if data.Wins >= 10 then
			Badges.award(p, "ten_wins")
		end
		if data.Streak >= 3 then
			Badges.award(p, "streak")
		end
		for _, style in Config.PlateStyles do
			if before < style.Wins and data.Wins >= style.Wins then
				Net.toast(p, "New plate unlocked: " .. style.Name .. "!", "gold")
			end
		end
	else
		data.Streak = 0
	end
	p:SetAttribute("Wins", data.Wins)
	p:SetAttribute("Streak", data.Streak)
	p:SetAttribute("BestStreak", data.BestStreak)
	p:SetAttribute("Games", data.Games)
	p:SetAttribute("TotalKills", data.Kills)
	local stats = p:FindFirstChild("leaderstats")
	if stats and stats:FindFirstChild("Wins") then
		stats.Wins.Value = data.Wins
	end
end

-- Works out the winner, saves stats and tells everybody. Returns (winner entity id or nil, winning team or 0).
function Match.finish()
	local mode = State.mode
	local entries = {}
	for _, e in State.list() do
		table.insert(entries, { id = e.id, alive = e.alive, lives = e.lives, score = e.score, kills = e.kills, diedAt = e.diedAt })
	end
	local order = Rules.standings(entries)
	local winnerId, winnerTeam = nil, 0
	if mode.Teams then
		winnerTeam = Modes.winningTeam()
		for _, e in State.list() do
			if winnerTeam ~= 0 and e.team == winnerTeam then
				e.score = (e.score or 0) + Config.Score.Win
			end
		end
	else
		winnerId = order[1]
		local winner = winnerId and State.entities[winnerId]
		if winner and not winner.alive then
			winnerId = nil
		elseif winner then
			winner.score = (winner.score or 0) + Config.Score.Win
		end
	end
	local now = State.now()
	local rows = {}
	for rank, id in order do
		local e = State.entities[id]
		rows[rank] = {
			id = e.id,
			rank = rank,
			team = e.team or 0,
			lives = e.lives,
			score = e.score,
			captures = e.captures or 0,
			survived = math.floor((e.diedAt or now) - (e.startedAt or now)),
			label = (e.icon ~= "" and (e.icon .. " ") or "") .. e.code,
			who = e.player and e.player.Name or "Bot",
			kills = e.kills,
			alive = e.alive,
		}
	end
	for _, e in State.list() do
		local won = (mode.Teams and winnerTeam ~= 0 and e.team == winnerTeam) or (not mode.Teams and e.id == winnerId)
		won = won and State.peak >= 2 -- (winning a match nobody else was in is not a win)
		if not mode.Practice then
			award(e, won)
		end
		if e.player and not mode.Practice and State.peak >= 2 then
			Quests.bump(e.player, "play", 1)
		end
		if e.player and not mode.Practice then
			Progress.award(e.player, e.score or 0, won, State.matchId, e.bonusCoins)
		end
	end
	Events.stop()
	Bounty.clear()
	if not State.revealing then
		State.revealing = true
		for _, e in State.aliveList() do
			Plates.showReveal(e, true, false)
		end
	end
	State.setPhase("results", State.now() + (mode.Practice and 3 or Config.Match.ResultsTime))
	Votes.open() -- the vote for the next map is open from here until the lobby wait is over
	Net.sendAll("results", rows, winnerId or 0, winnerTeam, mode.Id, { State.teamScore[1], State.teamScore[2] })
	return winnerId, winnerTeam
end

-- Clears the arena and brings everybody back to the lobby.
function Match.cleanup()
	Items.clearAll()
	Bots.clear()
	Flags.clear()
	Events.stop()
	Bounty.clear()
	Alliance.reset()
	World.lobbyAtmosphere()
	local list = Players:GetPlayers()
	State.clear()
	State.revealing = false
	State.writeWorld()
	for _, p in list do
		task.spawn(Match.respawnLobby, p)
	end
end

--------------------------------------------------------------------------------
-- Players coming and going
--------------------------------------------------------------------------------
function Match.onJoin(p)
	local data = Data.load(p)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	stats.Parent = p
	for _, name in { "Wins", "Kills" } do
		local v = Instance.new("IntValue")
		v.Name = name
		v.Value = name == "Wins" and data.Wins or 0
		v.Parent = stats
	end
	p:SetAttribute("Wins", data.Wins)
	p:SetAttribute("Streak", data.Streak)
	p:SetAttribute("BestStreak", data.BestStreak)
	p:SetAttribute("Games", data.Games)
	p:SetAttribute("TotalKills", data.Kills)
	p:SetAttribute("Style", data.Style)
	Progress.publish(p)
	local streak, coins = Progress.daily(p)
	if streak and coins > 0 then
		Net.toast(p, "🔥 Day " .. streak .. " in a row! +" .. coins .. " 🪙" .. (streak < Config.Daily.MaxDays and "  Come back tomorrow for more." or ""), "gold")
	end
	Badges.award(p, "welcome")
	Quests.publish(p)
	p:SetAttribute("Seen", data.Seen)
	p:SetAttribute("Music", data.Settings.Music)
	p:SetAttribute("Sfx", data.Settings.Sfx)
	p:SetAttribute("Fx", data.Settings.Fx)
	p:SetAttribute("Alive", false)
	p.CharacterAdded:Connect(function(char)
		local e = State.byPlayer(p)
		if not e or not e.alive then
			task.defer(toLobby, p)
		end
		char:WaitForChild("Humanoid", 5)
		local hum = char:FindFirstChildOfClass("Humanoid")
		if hum and not (e and e.alive) then
			hum.Died:Connect(function()
				if not State.byPlayer(p) or not State.byPlayer(p).alive then
					task.delay(2.5, function()
						Match.respawnLobby(p)
					end)
				end
			end)
		end
	end)
	task.spawn(function()
		Match.respawnLobby(p)
		-- a match is on: straight into it when always allowed, or while it is only just under way (the countdown and its first seconds)
		local early = State.phase == "countdown" or (State.phase == "play" and State.now() - (State.playStart or -1e9) <= Config.Match.DropInWindow)
		if Config.Match.DropIn or early then
			Match.dropIn(p)
		end
		Match.publishQueue()
	end)
end

function Match.onLeave(p)
	Progress.release(p)
	Votes.leave(p)
	local e = State.byPlayer(p)
	if e then
		Alliance.leave(e)
		Flags.dropCarried(e, "left")
		e.player = nil
		if e.alive and State.phase ~= "lobby" then
			Combat.eliminate(e, nil, "left")
		end
	end
end

function Match.setStyle(p, id)
	local data = Data.get(p)
	local def = Config.PlateStyleById[id]
	if not data or not def or data.Wins < def.Wins then
		return false
	end
	data.Style = id
	p:SetAttribute("Style", id)
	return true
end

-- Binoculars: raising them is refused during their short cooldown, and lowering them starts it.
function Match.setScope(p, on)
	local e = State.byPlayer(p)
	if not e or not e.alive then
		return
	end
	on = on == true
	if on and Config.Loadout.Enabled and not Items.slotOf(e, "binos") then
		return -- (a crate item is in the binoculars' slot right now)
	end
	if on and (Items.cooldownLeft(e, "binos") > 0 or State.phase ~= "play" or (e.blindUntil or 0) > State.now()) then
		return
	end
	if e.scoped and not on then
		Items.startCooldown(e, "binos", Config.ItemById.binos.Cooldown)
	end
	e.scoped = on
	Combat.applySpeed(e)
end

--------------------------------------------------------------------------------
-- The loop that runs forever
--------------------------------------------------------------------------------
local function waitUntil(deadlineFn)
	while not deadlineFn() do
		task.wait(0.25)
	end
end

function Match.run()
	Combat.onRespawn = function(victim)
		local spawn = Match.safeSpawn(victim.team)
		if victim.char then
			victim.char:PivotTo(CFrame.new(spawn + Vector3.new(0, 2, 0), Vector3.new(0, spawn.Y + 2, 0)))
			victim.sanePos = nil
			victim.route = {} -- (a bot that was moved plans its walk again from where it now stands)
		end
	end
	Combat.onCredit = function(killer, victim)
		local now = State.now()
		-- assists: anybody who photographed the victim's whole number in the last minute (and isn't the killer)
		for id, at in victim.seenBy or {} do
			local helper = State.entities[id]
			if helper and helper ~= killer and helper.alive and now - at <= Config.Score.AssistWindow then
				helper.score = (helper.score or 0) + Config.Score.Assist
				victim.seenBy[id] = nil
				if helper.player then
					Net.send(helper.player, "assist", Config.Score.Assist)
				end
			end
		end
		Bounty.claim(killer, victim)
		Modes.onHit(killer, victim)
		if killer.player then
			Badges.award(killer.player, "first_hit")
			Quests.bump(killer.player, "hit", 1)
		end
	end
	Combat.onEliminated = function(victim)
		Flags.dropCarried(victim, "out")
		local p = victim.player
		if p then
			task.delay(Config.Lives.EliminatedDelay, function()
				if State.phase == "play" or State.phase == "countdown" then
					Match.respawnLobby(p)
				end
			end)
		end
	end
	local first = Config.Match.FirstMatchAtOnce
	while true do
		State.setPhase("lobby", State.now() + Config.Match.Intermission)
		Match.ready = {}
		workspace:SetAttribute("ReadyCount", 0)
		for _, q in Players:GetPlayers() do
			q:SetAttribute("Ready", false)
		end
		Modes.settle(#Players:GetPlayers())
		Net.sendAll("phase", "lobby", State.phaseEnd)
		Match.publishQueue()
		waitUntil(function()
			Modes.settle(#Players:GetPlayers())
			Match.publishQueue()
			if #Players:GetPlayers() < Config.Match.MinHumans then
				State.phaseEnd = State.now() + Config.Match.Intermission
				return false
			end
			-- the very first match starts the moment somebody is here (no lobby wait); after that the lobby counts down, or ends
			-- early when everybody has pressed READY
			return first or State.now() >= State.phaseEnd or (Match.allReady() and #Players:GetPlayers() >= 2)
		end)
		-- the map: the first match uses the starter map; after that the one with the most votes (a tie: one of the tied maps)
		if Config.Vote.Enabled then
			local mapId
			if first then
				mapId = Maps.FirstMap
				Votes.last = mapId
			else
				mapId = Votes.close()
			end
			World.loadMap(mapId)
		end
		first = false

		Modes.settle(math.min(#Players:GetPlayers(), Config.Match.MaxPlayers))
		Match.setup()
		Match.publishQueue()
		if Config.Map.Theme == "canyon" then
			for _, e in State.list() do
				if e.player then
					Badges.award(e.player, "explorer")
				end
			end
		end
		State.setPhase("countdown", State.now() + Config.Match.Countdown)
		Net.sendAll("phase", "countdown", State.phaseEnd)
		Match.tellNumbers()
		waitUntil(function()
			return State.now() >= State.phaseEnd
		end)

		State.setPhase("play", State.now() + (State.mode.Length or Config.Match.Length))
		State.playStart = State.now()
		Match.tellNumbers()
		for _, e in State.list() do
			Combat.applySpeed(e)
		end
		Bots.startPlay(State.now())
		if Config.Features.Bounty then
			Bounty.reset()
		end
		if Config.Features.Events then
			Events.reset(State.now())
		end
		Net.sendAll("phase", "play", State.phaseEnd)
		local over = false
		while not over do
			task.wait(Config.Cover.Tick)
			over = Match.tick(Config.Cover.Tick)
		end

		Match.finish()
		Net.sendAll("phase", "results", State.phaseEnd)
		waitUntil(function()
			return State.now() >= State.phaseEnd
		end)
		Match.cleanup()
	end
end

return Match

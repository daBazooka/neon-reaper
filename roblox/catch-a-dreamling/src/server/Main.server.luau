-- CATCH A DREAMLING! server entry: builds the world, handles players, remotes, purchases and loops.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Logic = require(Shared:WaitForChild("Logic"))
local World = require(script.Parent:WaitForChild("World"))
local Data = require(script.Parent:WaitForChild("Data"))
local Game = require(script.Parent:WaitForChild("Game"))

-- remotes
local remotes = Instance.new("Folder"); remotes.Name = "Remotes"; remotes.Parent = ReplicatedStorage
local toClient = Instance.new("RemoteEvent"); toClient.Name = "ToClient"; toClient.Parent = remotes
local toServer = Instance.new("RemoteEvent"); toServer.Name = "ToServer"; toServer.Parent = remotes
Game.remote = toClient

Game.plots = World.build()
Data.startAutosave()

---------------------------------------------------------------- players
local function ownsPass(p: Player, id: number): boolean
	if id == 0 then return false end
	local ok, res = pcall(function() return MarketplaceService:UserOwnsGamePassAsync(p.UserId, id) end)
	return ok and res == true
end

local function onCharacter(p: Player, char: Model)
	local hum = char:WaitForChild("Humanoid", 10) :: Humanoid?
	if not hum then return end
	task.wait(0.2)
	Game.applyCharacter(p)
	Game.reattachCarry(p)
	-- start at home
	local s = Game.sessions[p]
	if s and s.plot then
		local hrp = char:WaitForChild("HumanoidRootPart", 5) :: BasePart?
		if hrp then char:PivotTo((s.plot :: World.Plot).cf * CFrame.new(0, 5, -12)) end
	end
	if s and s.passes.VIP then
		local head = char:FindFirstChild("Head")
		if head then
			local bb = Instance.new("BillboardGui"); bb.Size = UDim2.fromOffset(120, 30); bb.StudsOffset = Vector3.new(0, 2.6, 0); bb.MaxDistance = 80; bb.Parent = head
			local t = Instance.new("TextLabel"); t.Size = UDim2.fromScale(1, 1); t.BackgroundTransparency = 1; t.Font = Enum.Font.FredokaOne; t.TextScaled = true
			t.Text = "★ VIP ★"; t.TextColor3 = Color3.fromRGB(255, 215, 80); t.TextStrokeTransparency = 0; t.Parent = bb
		end
	end
end

local function onJoin(p: Player)
	local d = Data.load(p)
	if not p.Parent then Data.profiles[p] = nil; Data.loaded[p] = nil; return end
	local s: Game.Session = { plot = nil, carry = {}, catching = nil, passes = {}, lastToast = {}, income = 0 }
	for name, id in Config.GamePasses do s.passes[name] = ownsPass(p, id) end
	Game.sessions[p] = s
	Game.assignPlot(p)
	if not s.plot then task.delay(3, function() Game.toast(p, "All 8 islands are taken on this server! Set Max Players to 8 in Game Settings.", {255, 140, 120}) end) end
	Game.refreshQuests(p)

	local ls = Instance.new("Folder"); ls.Name = "leaderstats"; ls.Parent = p
	local caught = Instance.new("IntValue"); caught.Name = "Caught"; caught.Value = d.stats.caught; caught.Parent = ls
	local sp = Instance.new("StringValue"); sp.Name = "Sparkles"; sp.Value = Logic.fmt(d.sparkles); sp.Parent = ls
	local rb = Instance.new("IntValue"); rb.Name = "Rebirths"; rb.Value = d.rebirths; rb.Parent = ls

	Game.renderPlot(p)
	p.CharacterAdded:Connect(function(c) onCharacter(p, c) end)
	if p.Character then task.spawn(onCharacter, p, p.Character) end
	Game.sync(p)

	-- welcome back: offline earnings and the daily gift
	local income = Game.income(p)
	if d.lastSeen > 0 then
		local away = os.time() - d.lastSeen
		local amt = Logic.offlineEarnings(income, away)
		if amt > 0 then
			d.unclaimed += amt
			Game.send(p, "offline", amt, away)
		end
	end
	local day = math.floor(os.time() / 86400)
	if d.daily.last ~= day then
		d.daily.streak = if d.daily.last == day - 1 then d.daily.streak + 1 else 1
		d.daily.last = day
		local amt, luckMin = Logic.dailyReward(d.daily.streak, income)
		d.sparkles += amt; d.total += amt
		if luckMin > 0 then d.luckUntil = math.max(d.luckUntil, os.time()) + luckMin * 60 end
		Game.send(p, "daily", d.daily.streak, amt, luckMin)
	end
	Game.sync(p)
end

local function onLeave(p: Player)
	local s, d = Game.sessions[p], Data.profiles[p]
	if s and d then
		-- anything still carried goes into free jars, the rest is sold
		for _, c in s.carry do
			if #d.jars < d.slots then table.insert(d.jars, { id = c.id, mut = c.mut, star = 1 })
			else local v = Logic.sellValue({ id = c.id, mut = c.mut, star = 1 }); d.sparkles += v end
		end
		s.carry = {}
		Data.pushLeaderboard(p, d.stats.caught)
	end
	Game.freePlot(p)
	Game.sessions[p] = nil
	Data.save(p, true)
end

Players.PlayerAdded:Connect(onJoin)
Players.PlayerRemoving:Connect(onLeave)
for _, p in Players:GetPlayers() do task.spawn(onJoin, p) end

---------------------------------------------------------------- collect pads
for _, plot in Game.plots do
	plot.pad.CanTouch = true
	plot.pad.Touched:Connect(function(hit)
		local p = Players:GetPlayerFromCharacter(hit.Parent)
		if not p then return end
		local s = Game.sessions[p]
		if s and s.plot == plot then Game.collect(p) end
	end)
end

---------------------------------------------------------------- remotes from clients
local lastCall: {[Player]: number} = {}
toServer.OnServerEvent:Connect(function(p: Player, kind: any, arg: any)
	if typeof(kind) ~= "string" then return end
	local now = os.clock()
	if now - (lastCall[p] or 0) < 0.12 then return end
	lastCall[p] = now
	if not Data.profiles[p] or not Game.sessions[p] then return end
	if kind == "buy" and typeof(arg) == "string" then Game.buyUpgrade(p, arg)
	elseif kind == "slot" then Game.buySlot(p)
	elseif kind == "merge" then Game.merge(p)
	elseif kind == "rebirth" then Game.rebirth(p)
	elseif kind == "sell" and typeof(arg) == "number" then Game.sell(p, math.floor(arg))
	elseif kind == "claimQuest" and typeof(arg) == "number" then Game.claimQuest(p, math.floor(arg))
	elseif kind == "collect" then Game.collect(p)
	elseif kind == "home" then
		local s = Game.sessions[p]
		local char = p.Character
		if s.plot and char then char:PivotTo((s.plot :: World.Plot).cf * CFrame.new(0, 5, -12)) end
	elseif kind == "tut" and typeof(arg) == "number" then
		Data.profiles[p].tut = math.max(Data.profiles[p].tut, math.clamp(math.floor(arg), 0, 10))
	elseif kind == "sync" then Game.sync(p)
	end
end)
Players.PlayerRemoving:Connect(function(p) lastCall[p] = nil end)

---------------------------------------------------------------- purchases
MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(p, passId, bought)
	if not bought then return end
	local s = Game.sessions[p]
	if not s then return end
	for name, id in Config.GamePasses do if id == passId then s.passes[name] = true end end
	Game.toast(p, "Thank you! Your pass is active", {255, 215, 80})
	Game.renderPlot(p); Game.sync(p)
end)

MarketplaceService.ProcessReceipt = function(info)
	local p = Players:GetPlayerByUserId(info.PlayerId)
	local d = p and Data.profiles[p]
	if not p or not d then return Enum.ProductPurchaseDecision.NotProcessedYet end
	d.receipts = d.receipts or {}
	if table.find(d.receipts, info.PurchaseId) then return Enum.ProductPurchaseDecision.PurchaseGranted end
	local id = info.ProductId
	if id == Config.Products.LuckPotion and id ~= 0 then
		d.luckUntil = math.max(d.luckUntil, os.time()) + 600
		Game.toast(p, "Luck Potion active: x2 luck for 10 minutes!", {150, 255, 150})
	elseif id == Config.Products.SparklePack and id ~= 0 then
		local v = math.max(2000, math.floor(Game.income(p) * 1800))
		d.sparkles += v; d.total += v
		Game.send(p, "reward", "Sparkle Pack", v)
	elseif id == Config.Products.SummonStarfall and id ~= 0 then
		if Game.eventId() then Game.endEvent() end
		Game.startEvent("starfall", p.DisplayName)
	else
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
	table.insert(d.receipts, info.PurchaseId)
	while #d.receipts > 50 do table.remove(d.receipts, 1) end
	Game.sync(p)
	task.spawn(Data.save, p)
	return Enum.ProductPurchaseDecision.PurchaseGranted
end

---------------------------------------------------------------- loops
-- income: every second each island earns into its collect pad (or straight in with Auto Collect)
task.spawn(function()
	while true do
		task.wait(1)
		for p, s in Game.sessions do
			local d = Data.profiles[p]
			if d then
				local inc = Game.income(p)
				s.income = inc
				if s.passes.AutoCollect then d.sparkles += inc else d.unclaimed += inc end
				d.total += inc
				if s.plot then (s.plot :: World.Plot).income.Text = "COLLECT\n+" .. Logic.fmt(d.unclaimed) end
				local ls = p:FindFirstChild("leaderstats")
				local sv = ls and ls:FindFirstChild("Sparkles") :: StringValue?
				if sv then sv.Value = Logic.fmt(d.sparkles) end
				local rv = ls and ls:FindFirstChild("Rebirths") :: IntValue?
				if rv then rv.Value = d.rebirths end
				Game.send(p, "stats", d.sparkles, d.unclaimed, inc, Game.luck(p))
			end
		end
	end
end)

-- catching and deposits
task.spawn(function()
	local k = 0
	while true do
		task.wait(0.1)
		Game.catchTick()
		k += 1
		if k % 3 == 0 then for p in Game.sessions do Game.tryDeposit(p) end end
	end
end)

-- spawning
task.spawn(function()
	for _ = 1, 12 do Game.spawnDreamling() end
	while true do
		task.wait(Config.SpawnEvery)
		if not Game.eventId() then Game.spawnTick() end
	end
end)

task.spawn(Game.eventLoop)

-- the meadow leaderboard (most dreamlings caught, all time)
task.spawn(function()
	local board: BasePart? = nil
	for _, d in workspace:WaitForChild("DreamWorld"):GetChildren() do if d:GetAttribute("IsLeaderboard") then board = d :: BasePart end end
	if not board then return end
	local sg = Instance.new("SurfaceGui"); sg.Face = Enum.NormalId.Front; sg.CanvasSize = Vector2.new(360, 440); sg.LightInfluence = 0; sg.Parent = board
	local list = Instance.new("TextLabel"); list.Size = UDim2.fromScale(1, 1); list.BackgroundTransparency = 1; list.Font = Enum.Font.FredokaOne
	list.TextColor3 = Color3.new(1, 1, 1); list.TextSize = 24; list.TextYAlignment = Enum.TextYAlignment.Top; list.TextStrokeTransparency = 0.3; list.Parent = sg
	list.Text = "TOP DREAMLING CATCHERS\n\nloading..."
	while true do
		for p, d in Data.profiles do Data.pushLeaderboard(p, d.stats.caught) end
		local top = Data.topCaught(10)
		local lines = { "TOP DREAMLING CATCHERS", "" }
		for i, e in top do table.insert(lines, i .. ".  " .. e.name .. "  —  " .. Logic.fmt(e.value)) end
		if #top == 0 then table.insert(lines, if RunService:IsStudio() then "(needs API access in Studio)" else "Be the first!") end
		list.Text = table.concat(lines, "\n")
		task.wait(120)
	end
end)

print("[Dreamling] Catch a Dreamling! server ready")

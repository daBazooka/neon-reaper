-- Server game mechanics: dreamling spawning and wandering, the catching race, carrying catches home,
-- jars and income, merging, rebirths, quests, and the server-wide Dream Events.

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local Lighting = game:GetService("Lighting")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Logic = require(Shared:WaitForChild("Logic"))
local Builder = require(Shared:WaitForChild("Builder"))
local World = require(script.Parent:WaitForChild("World"))
local Data = require(script.Parent:WaitForChild("Data"))

local Game = {}
local rng = Random.new()
local function roll(): number return rng:NextNumber() end

export type Carry = { id: string, mut: string?, visual: Model? }
export type Session = {
	plot: World.Plot?, carry: {Carry}, catching: { model: Model, t0: number, dur: number }?,
	passes: {[string]: boolean}, lastToast: {[string]: number}, income: number,
}
Game.sessions = {} :: {[Player]: Session}
Game.plots = {} :: {World.Plot}
Game.remote = nil :: RemoteEvent?

-- dreamlings in the meadow
type Wild = { model: Model, id: string, mut: string?, born: number, caught: boolean, catchers: {[Player]: boolean}, tween: Tween? }
local wild: {[Model]: Wild} = {}
local wildFolder = Instance.new("Folder"); wildFolder.Name = "Dreamlings"; wildFolder.Parent = workspace

---------------------------------------------------------------- messaging
function Game.send(p: Player, kind: string, ...: any)
	if Game.remote then (Game.remote :: RemoteEvent):FireClient(p, kind, ...) end
end
function Game.sendAll(kind: string, ...: any)
	if Game.remote then (Game.remote :: RemoteEvent):FireAllClients(kind, ...) end
end
function Game.toast(p: Player, text: string, color: {number}?, key: string?, gap: number?)
	local s = Game.sessions[p]
	if key and s then
		local now = os.clock()
		if now - (s.lastToast[key] or -99) < (gap or 3) then return end
		s.lastToast[key] = now
	end
	Game.send(p, "toast", text, color)
end

---------------------------------------------------------------- derived player values
function Game.luck(p: Player): number
	local d, s = Data.profiles[p], Game.sessions[p]
	if not d or not s then return 1 end
	local l = 1 + d.up.luck * 0.2
	if s.passes.SuperLuck then l += 0.5 end
	if s.passes.VIP then l += 0.1 end
	if d.luckUntil > os.time() then l *= 2 end
	return l
end
function Game.bag(p: Player): number
	local d, s = Data.profiles[p], Game.sessions[p]
	return Logic.bagSize(d.up.bag, s ~= nil and s.passes.VIP == true)
end
function Game.income(p: Player): number
	local d, s = Data.profiles[p], Game.sessions[p]
	if not d or not s then return 0 end
	return Logic.totalIncome(d.jars, d.rebirths, s.passes.DoubleSparkles == true)
end

-- full state for the client UI
function Game.sync(p: Player)
	local d, s = Data.profiles[p], Game.sessions[p]
	if not d or not s then return end
	local carry = {}
	for _, c in s.carry do table.insert(carry, { id = c.id, mut = c.mut }) end
	Game.send(p, "sync", {
		sparkles = d.sparkles, unclaimed = d.unclaimed, income = Game.income(p), rebirths = d.rebirths,
		up = d.up, slots = d.slots, jars = d.jars, dex = d.dex, stats = d.stats, quests = d.quests,
		luckUntil = d.luckUntil, luck = Game.luck(p), bag = Game.bag(p), carry = carry, passes = s.passes,
		daily = d.daily, tut = d.tut, dexClaimed = d.dexClaimed,
	})
end

---------------------------------------------------------------- quests
function Game.quest(p: Player, t: string, amount: number?)
	local d = Data.profiles[p]
	if not d then return end
	for _, q in d.quests do
		if q.t == t and not q.done then
			q.p = math.min(q.n, q.p + (amount or 1))
			if q.p >= q.n then q.done = true; Game.toast(p, "Quest complete! Claim it in Quests", {255, 230, 90}) end
		end
	end
end
function Game.refreshQuests(p: Player)
	local d = Data.profiles[p]
	local day = math.floor(os.time() / 86400)
	if d.questDay ~= day or #d.quests == 0 then
		d.questDay = day
		d.quests = Logic.makeQuests(roll, math.clamp(1 + d.rebirths, 1, 3))
	end
end

---------------------------------------------------------------- plots and jars
function Game.assignPlot(p: Player)
	local s = Game.sessions[p]
	for _, plot in Game.plots do
		local taken = false
		for _, other in Game.sessions do if other.plot == plot then taken = true end end
		if not taken then
			s.plot = plot
			plot.sign.Text = p.DisplayName .. "'s Island"
			break
		end
	end
end

function Game.renderPlot(p: Player)
	local d, s = Data.profiles[p], Game.sessions[p]
	if not d or not s or not s.plot then return end
	local plot = s.plot :: World.Plot
	plot.jarFolder:ClearAllChildren()
	for i, ped in plot.slotParts do
		local unlocked = i <= d.slots
		ped.Color = if unlocked then Color3.fromRGB(255, 255, 255) else Color3.fromRGB(120, 110, 140)
		ped.Transparency = if unlocked then 0 else 0.3
		local slotCF = plot.slots[i]
		local jar = d.jars[i]
		if unlocked then
			local glass = World.part(plot.jarFolder, { Name = "Jar", Shape = Enum.PartType.Cylinder, Size = Vector3.new(7, 6.4, 6.4), CFrame = CFrame.new(slotCF.Position + Vector3.new(0, 3.2, 0)) * CFrame.Angles(0, 0, math.pi / 2), Color = Color3.fromRGB(210, 235, 255), Material = Enum.Material.Glass, Transparency = 0.72, CanCollide = false, CastShadow = false })
			World.part(plot.jarFolder, { Name = "Lid", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.8, 6.8, 6.8), CFrame = CFrame.new(slotCF.Position + Vector3.new(0, 7, 0)) * CFrame.Angles(0, 0, math.pi / 2), Color = plot.color, Material = Enum.Material.SmoothPlastic, CanCollide = false })
			if jar then
				local m = Builder.build(jar.id, jar.mut, { anchored = true, scale = 0.7 })
				local h = m:GetExtentsSize().Y
				local fit = math.min(1, 5.2 / math.max(h, m:GetExtentsSize().X))
				if fit < 1 then m:ScaleTo(m:GetScale() * fit) end
				m:PivotTo(slotCF * CFrame.new(0, 3.2, 0))
				m.Parent = plot.jarFolder
				local bb = Instance.new("BillboardGui"); bb.Size = UDim2.fromOffset(160, 40); bb.StudsOffsetWorldSpace = Vector3.new(0, 8.6, 0); bb.MaxDistance = 70; bb.LightInfluence = 0; bb.Adornee = glass; bb.Parent = glass
				local t = Instance.new("TextLabel"); t.Size = UDim2.fromScale(1, 1); t.BackgroundTransparency = 1; t.Font = Enum.Font.FredokaOne; t.TextScaled = true
				t.TextColor3 = Color3.fromRGB(255, 240, 150); t.TextStrokeTransparency = 0
				t.Text = string.rep("★", jar.star) .. "  +" .. Logic.fmt(Logic.jarIncome(jar) * Logic.incomeMult(d.rebirths, s.passes.DoubleSparkles == true)) .. "/s"
				t.Parent = bb
				local prompt = Instance.new("ProximityPrompt")
				prompt.ActionText = "Sell for " .. Logic.fmt(Logic.sellValue(jar))
				prompt.ObjectText = (if jar.mut then Config.MutationById[jar.mut].name .. " " else "") .. Config.SpeciesById[jar.id].name
				prompt.HoldDuration = 1.2
				prompt.MaxActivationDistance = 9
				prompt.RequiresLineOfSight = false
				prompt.Parent = glass
				local index = i
				prompt.Triggered:Connect(function(who) if who == p then Game.sell(p, index) end end)
			end
		else
			local bb = Instance.new("BillboardGui"); bb.Size = UDim2.fromOffset(120, 34); bb.StudsOffsetWorldSpace = Vector3.new(0, 3, 0); bb.MaxDistance = 60; bb.LightInfluence = 0; bb.Adornee = ped; bb.Parent = plot.jarFolder
			local t = Instance.new("TextLabel"); t.Size = UDim2.fromScale(1, 1); t.BackgroundTransparency = 1; t.Font = Enum.Font.FredokaOne; t.TextScaled = true
			t.TextColor3 = Color3.fromRGB(230, 220, 255); t.TextStrokeTransparency = 0.2; t.Text = "LOCKED"; t.Parent = bb
		end
	end
	plot.sign.Text = p.DisplayName .. "'s Island" .. (if d.rebirths > 0 then "  ✦" .. d.rebirths else "")
end

function Game.freePlot(p: Player)
	local s = Game.sessions[p]
	if s and s.plot then
		(s.plot :: World.Plot).jarFolder:ClearAllChildren()
		;(s.plot :: World.Plot).sign.Text = "Empty island"
		;(s.plot :: World.Plot).income.Text = "COLLECT"
		s.plot = nil
	end
end

function Game.sell(p: Player, index: number)
	local d = Data.profiles[p]
	local jar = d and d.jars[index]
	if not jar then return end
	local v = Logic.sellValue(jar)
	table.remove(d.jars, index)
	d.sparkles += v; d.total += v
	Game.toast(p, "Sold for " .. Logic.fmt(v) .. " Sparkles", {255, 230, 90})
	Game.renderPlot(p); Game.sync(p)
end

function Game.collect(p: Player)
	local d = Data.profiles[p]
	if not d or d.unclaimed < 1 then return end
	local v = math.floor(d.unclaimed)
	d.unclaimed -= v
	d.sparkles += v
	d.stats.collects += 1
	Game.quest(p, "collect")
	Game.send(p, "collect", v)
	Game.sync(p)
end

---------------------------------------------------------------- carrying
local function attachCarry(p: Player, c: Carry, slot: number)
	local char = p.Character
	local head = char and char:FindFirstChild("Head") :: BasePart?
	if not head then return end
	if c.visual then c.visual:Destroy() end
	local m = Builder.build(c.id, c.mut, { scale = 0.42 })
	for _, bp in m:GetDescendants() do if bp:IsA("BasePart") then bp.Massless = true; bp.CanCollide = false; bp.Anchored = false end end
	local root = m.PrimaryPart :: BasePart
	local offsets = { Vector3.new(0, 3.4, 0), Vector3.new(-2.6, 3, 0.4), Vector3.new(2.6, 3, 0.4), Vector3.new(0, 5.6, 0.4), Vector3.new(0, 7.6, 0.4) }
	m:PivotTo(head.CFrame * CFrame.new(offsets[math.clamp(slot, 1, #offsets)]))
	local w = Instance.new("WeldConstraint"); w.Part0 = head; w.Part1 = root; w.Parent = root
	m.Parent = char
	c.visual = m
end
function Game.reattachCarry(p: Player)
	local s = Game.sessions[p]
	if not s then return end
	for i, c in s.carry do attachCarry(p, c, i) end
end

-- drop carried dreamlings into free jars when the player reaches their island
function Game.tryDeposit(p: Player)
	local s, d = Game.sessions[p], Data.profiles[p]
	if not s or not d or #s.carry == 0 or not s.plot then return end
	local char = p.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not hrp then return end
	local c = (s.plot :: World.Plot).center
	local flat = Vector3.new(hrp.Position.X - c.X, 0, hrp.Position.Z - c.Z)
	if flat.Magnitude > 31 or math.abs(hrp.Position.Y - c.Y) > 25 then return end
	local placed = 0
	while #s.carry > 0 and #d.jars < d.slots do
		local item = table.remove(s.carry, 1) :: Carry
		if item.visual then item.visual:Destroy() end
		table.insert(d.jars, { id = item.id, mut = item.mut, star = 1 })
		placed += 1
	end
	if placed > 0 then
		Game.send(p, "deposit", placed)
		Game.renderPlot(p)
		Game.reattachCarry(p)
		Game.sync(p)
		-- a merge hint when three match
		local _, merges = Logic.mergeJars(d.jars)
		if merges > 0 then Game.toast(p, "You have 3 of a kind! Press MERGE to evolve them", {150, 255, 200}, "mergehint", 20) end
	end
	if #s.carry > 0 then
		Game.toast(p, "Your jars are full! Buy more jars, merge, or sell one", {255, 140, 120}, "full", 6)
	end
end

---------------------------------------------------------------- wild dreamlings
local function poof(pos: Vector3, color: Color3, n: number?)
	local a = Instance.new("Part")
	a.Anchored = true; a.CanCollide = false; a.CanQuery = false; a.Transparency = 1; a.Size = Vector3.one; a.CFrame = CFrame.new(pos); a.Parent = workspace
	local pe = Instance.new("ParticleEmitter")
	pe.Color = ColorSequence.new(color, Color3.new(1, 1, 1)); pe.LightEmission = 1
	pe.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.2), NumberSequenceKeypoint.new(1, 0) })
	pe.Speed = NumberRange.new(10, 22); pe.SpreadAngle = Vector2.new(180, 180); pe.Lifetime = NumberRange.new(0.5, 1); pe.Rate = 0
	pe.Parent = a
	pe:Emit(n or 40)
	Debris:AddItem(a, 2)
end
Game.poof = poof

local function hoverHeight(m: Model): number return m:GetExtentsSize().Y / 2 + 1.2 end

local function wander(w: Wild)
	local m = w.model
	local root = m.PrimaryPart :: BasePart
	local r = Config.RarityById[Config.SpeciesById[w.id].rarity]
	local speed = 7 - r.order * 0.5
	local base: CFrame? = nil
	while m.Parent and not w.caught do
		if next(w.catchers) then
			-- being caught: wiggle in place
			if w.tween then (w.tween :: Tween):Cancel(); w.tween = nil end
			base = base or root.CFrame
			root.CFrame = (base :: CFrame) * CFrame.Angles(0, 0, math.rad(rng:NextNumber(-14, 14)))
			task.wait(0.1)
		else
			if base then root.CFrame = base; base = nil end
			local here = root.Position
			local a = rng:NextNumber(0, math.pi * 2)
			local target = here + Vector3.new(math.cos(a), 0, math.sin(a)) * rng:NextNumber(8, 22)
			local flat = Vector3.new(target.X, 0, target.Z)
			if flat.Magnitude > Config.MeadowRadius - 4 then flat = flat.Unit * (Config.MeadowRadius - 10) end
			if flat.Magnitude < 16 then flat = flat.Unit * 18 end
			local dest = flat + Vector3.new(0, hoverHeight(m) + rng:NextNumber(0, 2), 0)
			local dist = (dest - here).Magnitude
			local dir = (dest - here) * Vector3.new(1, 0, 1)
			local goal = if dir.Magnitude > 0.1 then CFrame.lookAt(dest, dest + dir) else root.CFrame.Rotation + dest
			local t = TweenService:Create(root, TweenInfo.new(math.max(0.5, dist / speed), Enum.EasingStyle.Sine, Enum.EasingDirection.InOut), { CFrame = goal })
			w.tween = t
			t:Play()
			local done = false
			local conn = t.Completed:Connect(function() done = true end)
			local t0 = os.clock()
			while not done and not next(w.catchers) and not w.caught and m.Parent and os.clock() - t0 < 12 do task.wait(0.1) end
			conn:Disconnect()
			if not next(w.catchers) then task.wait(rng:NextNumber(0.3, 1.8)) end
		end
	end
end

function Game.spawnDreamling(minOrder: number?): Model
	local ev = Game.eventId()
	local id = Logic.rollSpecies(roll, ev, minOrder)
	local mut = Logic.rollMutation(roll, ev, 1)
	local sp = Config.SpeciesById[id]
	local r = Config.RarityById[sp.rarity]
	local m = Builder.build(id, mut, { anchored = true, label = true })
	local pos = World.randomMeadowPoint()
	m:PivotTo(CFrame.new(pos + Vector3.new(0, hoverHeight(m), 0)) * CFrame.Angles(0, rng:NextNumber(0, math.pi * 2), 0))
	local root = m.PrimaryPart :: BasePart
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "Catch!"
	prompt.ObjectText = (if mut then Config.MutationById[mut].name .. " " else "") .. sp.name .. " · " .. r.name
	prompt.HoldDuration = 0
	prompt.MaxActivationDistance = Logic.reach(Config.UpgradeById.reach.max) + m:GetExtentsSize().X / 2
	prompt.RequiresLineOfSight = false
	prompt.Parent = root
	prompt.Triggered:Connect(function(p) Game.startCatch(p, m) end)
	-- rare ones get a beam of light the whole server can see
	if r.order >= 5 then
		local a0 = Instance.new("Attachment"); a0.Parent = root
		local a1 = Instance.new("Attachment"); a1.Position = Vector3.new(0, 220, 0); a1.Parent = root
		local beam = Instance.new("Beam"); beam.Attachment0 = a0; beam.Attachment1 = a1; beam.Width0 = 4; beam.Width1 = 10
		beam.Color = ColorSequence.new(Builder.rgb(r.color)); beam.LightEmission = 1; beam.FaceCamera = true
		beam.Transparency = NumberSequence.new(0.2, 1); beam.Parent = root
		Game.sendAll("announce", "✨ A " .. string.upper(r.name) .. " " .. (if mut then string.upper(Config.MutationById[mut].name) .. " " else "") .. string.upper(sp.name) .. " appeared in the Meadow!", r.color)
	end
	m.Parent = wildFolder
	local w: Wild = { model = m, id = id, mut = mut, born = os.clock(), caught = false, catchers = {} }
	wild[m] = w
	task.spawn(wander, w)
	return m
end

local function despawn(w: Wild)
	wild[w.model] = nil
	if w.model.Parent then
		local r = Config.RarityById[Config.SpeciesById[w.id].rarity]
		poof((w.model.PrimaryPart :: BasePart).Position, Builder.rgb(r.color), 20)
		w.model:Destroy()
	end
end

function Game.startCatch(p: Player, m: Model)
	local w = wild[m]
	local s, d = Game.sessions[p], Data.profiles[p]
	if not w or w.caught or not s or not d then return end
	if s.catching then return end
	if #s.carry >= Game.bag(p) then
		Game.toast(p, "Your bag is full! Take your dreamlings home first", {255, 140, 120}, "bag", 2)
		return
	end
	local char = p.Character
	local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not hrp then return end
	local reach = Logic.reach(d.up.reach) + m:GetExtentsSize().X / 2
	if (hrp.Position - (m.PrimaryPart :: BasePart).Position).Magnitude > reach + 1 then
		Game.toast(p, "Too far! Get closer or buy a Longer Net", {255, 200, 120}, "far", 2)
		return
	end
	local dur = Logic.catchTime(w.id, d.up.netSpeed)
	s.catching = { model = m, t0 = os.clock(), dur = dur }
	w.catchers[p] = true
	Game.send(p, "catchStart", m, dur)
end

local function endCatch(p: Player, ok: boolean, why: string?)
	local s = Game.sessions[p]
	if not s or not s.catching then return end
	local w = wild[(s.catching :: any).model]
	if w then w.catchers[p] = nil end
	s.catching = nil
	Game.send(p, "catchEnd", ok, why)
end

local function caught(p: Player, w: Wild)
	local s, d = Game.sessions[p], Data.profiles[p]
	w.caught = true
	for other in w.catchers do if other ~= p then endCatch(other, false, p.DisplayName .. " caught it first!") end end
	endCatch(p, true)
	local sp = Config.SpeciesById[w.id]
	local r = Config.RarityById[sp.rarity]
	local pos = (w.model.PrimaryPart :: BasePart).Position
	wild[w.model] = nil
	w.model:Destroy()
	poof(pos, Builder.rgb(r.color), 30 + r.order * 10)
	-- your Lucky Charm can mutate it as you catch it
	local mut = w.mut
	local lucky = false
	if not mut then
		local l = Game.luck(p) - 1
		if l > 0 then
			local m2 = Logic.rollMutation(roll, nil, l)
			if m2 and m2 ~= "giant" and m2 ~= "tiny" then mut = m2; lucky = true end
		end
	end
	local c: Carry = { id = w.id, mut = mut }
	table.insert(s.carry, c)
	attachCarry(p, c, #s.carry)
	d.stats.caught += 1
	if r.order >= 3 then d.stats.rares += 1; Game.quest(p, "rare") end
	if r.order >= 5 then d.stats.legends += 1 end
	if mut then d.stats.mutated += 1; Game.quest(p, "mutated") end
	Game.quest(p, "catch")
	if Game.eventId() then d.stats.events += 1; Game.quest(p, "event") end
	local isNew = d.dex[w.id] == nil
	d.dex[w.id] = (d.dex[w.id] or 0) + 1
	local bonus = 0
	if isNew then
		bonus = math.max(40, math.floor(r.income * 25 + Game.income(p) * 20))
		d.sparkles += bonus; d.total += bonus
	end
	Game.send(p, "caught", w.id, mut, isNew, bonus, lucky)
	if r.order >= 6 or (mut == "galaxy") then
		Game.sendAll("announce", "🌟 " .. p.DisplayName .. " caught a " .. string.upper(r.name) .. " " .. (if mut then string.upper(Config.MutationById[mut].name) .. " " else "") .. string.upper(sp.name) .. "!", r.color)
	end
	local ls = p:FindFirstChild("leaderstats")
	local cv = ls and ls:FindFirstChild("Caught") :: IntValue?
	if cv then cv.Value = d.stats.caught end
	if #s.carry >= Game.bag(p) then Game.toast(p, "Bag full! Take them home to your island", {150, 220, 255}, "bagfull", 8) end
	Game.sync(p)
end

-- runs ten times a second: catch progress, despawns
function Game.catchTick()
	for p, s in Game.sessions do
		local c = s.catching
		if c then
			local w = wild[c.model]
			local char = p.Character
			local hrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
			if not w or w.caught or not c.model.Parent then
				endCatch(p, false, "It got away!")
			elseif not hrp or (hrp.Position - (c.model.PrimaryPart :: BasePart).Position).Magnitude > Logic.reach(Data.profiles[p].up.reach) + c.model:GetExtentsSize().X / 2 + 7 then
				endCatch(p, false, "Too far away!")
			elseif os.clock() - c.t0 >= c.dur then
				caught(p, w)
			end
		end
	end
	local now = os.clock()
	for _, w in wild do
		if not w.caught and not next(w.catchers) and now - w.born > Config.DreamlingLife then despawn(w) end
	end
end

function Game.spawnTick()
	local n = 0
	for _ in wild do n += 1 end
	if n < Config.MaxDreamlings then Game.spawnDreamling() end
end

---------------------------------------------------------------- merge, upgrades, rebirth
function Game.merge(p: Player)
	local d = Data.profiles[p]
	local jars, merges = Logic.mergeJars(d.jars)
	if merges == 0 then Game.toast(p, "You need 3 of the same dreamling (same stars) to merge", {255, 200, 120}); return end
	d.jars = jars
	d.stats.merges += merges
	Game.quest(p, "merge", merges)
	Game.send(p, "merged", merges)
	Game.renderPlot(p); Game.sync(p)
end

function Game.buyUpgrade(p: Player, id: string)
	local d = Data.profiles[p]
	local u = Config.UpgradeById[id]
	if not d or not u then return end
	local lvl = d.up[id] or 0
	if lvl >= u.max then return end
	local cost = Logic.upgradeCost(id, lvl)
	if d.sparkles < cost then Game.toast(p, "Not enough Sparkles", {255, 140, 120}, "poor", 1); return end
	d.sparkles -= cost
	d.up[id] = lvl + 1
	Game.quest(p, "upgrade")
	Game.send(p, "bought", id)
	Game.applyCharacter(p)
	Game.sync(p)
end

function Game.buySlot(p: Player)
	local d = Data.profiles[p]
	if d.slots >= Config.MaxSlots then return end
	local cost = Logic.slotCost(d.slots)
	if d.sparkles < cost then Game.toast(p, "Not enough Sparkles", {255, 140, 120}, "poor", 1); return end
	d.sparkles -= cost
	d.slots += 1
	Game.quest(p, "upgrade")
	Game.send(p, "bought", "slot")
	Game.renderPlot(p); Game.sync(p)
end

function Game.rebirth(p: Player)
	local d = Data.profiles[p]
	local cost = Logic.rebirthCost(d.rebirths)
	if d.sparkles < cost then Game.toast(p, "Rebirth needs " .. Logic.fmt(cost) .. " Sparkles", {255, 140, 120}); return end
	d.rebirths += 1
	d.sparkles = 0; d.unclaimed = 0
	d.jars = {}; d.slots = Config.StartSlots
	d.up = { netSpeed = 0, reach = 0, speed = 0, bag = 0, luck = 0 }
	local s = Game.sessions[p]
	for _, c in s.carry do if c.visual then c.visual:Destroy() end end
	s.carry = {}
	Game.sendAll("announce", "🔁 " .. p.DisplayName .. " was REBORN! (x" .. string.format("%.1f", Logic.incomeMult(d.rebirths, false)) .. " Sparkles forever)", {200, 150, 255})
	Game.send(p, "reborn", d.rebirths)
	Game.applyCharacter(p)
	Game.renderPlot(p); Game.sync(p)
end

function Game.claimQuest(p: Player, i: number)
	local d = Data.profiles[p]
	local q = d.quests[i]
	if not q or not q.done or q.claimed then return end
	q.claimed = true
	local v = Logic.questReward(Game.income(p), q.n)
	d.sparkles += v; d.total += v
	Game.send(p, "reward", "Quest reward", v)
	Game.sync(p)
end

---------------------------------------------------------------- character
function Game.applyCharacter(p: Player)
	local d = Data.profiles[p]
	local char = p.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not d or not hum then return end
	local ws = Logic.walk(d.up.speed)
	if Game.eventId() == "speed" then ws *= 2 end
	hum.WalkSpeed = ws
	hum.UseJumpPower = true
	hum.JumpPower = 55
end

---------------------------------------------------------------- dream events
local currentEvent: string? = nil
local defaultGravity = workspace.Gravity
function Game.eventId(): string? return currentEvent end

local function tweenLight(props: {[string]: any}, t: number?)
	TweenService:Create(Lighting, TweenInfo.new(t or 2.5), props):Play()
end

local function startEvent(id: string, by: string?)
	if currentEvent then return end
	currentEvent = id
	local e = Config.EventById[id]
	workspace:SetAttribute("EventId", id)
	workspace:SetAttribute("EventEnds", workspace:GetServerTimeNow() + Config.EventDuration)
	Game.sendAll("event", id, by)
	if id == "lowgrav" then workspace.Gravity = 55 end
	if id == "disco" then tweenLight({ ClockTime = 0.5 }) end
	if id == "golden" then tweenLight({ ClockTime = 17.7 }) end
	if id == "secret" then
		tweenLight({ ClockTime = 22.5 })
		local atm = Lighting:FindFirstChildOfClass("Atmosphere")
		if atm then TweenService:Create(atm, TweenInfo.new(3), { Density = 0.5, Color = Color3.fromRGB(80, 40, 120) }):Play() end
	end
	for p in Game.sessions do Game.applyCharacter(p) end
	task.spawn(function()
		local t0 = os.clock()
		local stars = 0
		while currentEvent == id and os.clock() - t0 < Config.EventDuration do
			if id == "candy" then
				for _ = 1, 3 do Game.dropCandy() end
			end
			if id == "starfall" and stars < 3 and os.clock() - t0 > stars * 18 + 2 then
				stars += 1
				task.spawn(Game.starfall)
			end
			if id ~= "candy" then Game.spawnTick() end
			task.wait(if id == "candy" then 0.35 else 0.8)
		end
		Game.endEvent()
	end)
	print("[Dreamling] Dream event:", e.name)
end
Game.startEvent = startEvent

function Game.endEvent()
	local id = currentEvent
	if not id then return end
	currentEvent = nil
	workspace:SetAttribute("EventId", "")
	workspace:SetAttribute("NextEvent", workspace:GetServerTimeNow() + Config.EventInterval)
	workspace.Gravity = defaultGravity
	tweenLight({ ClockTime = 14.5 })
	local atm = Lighting:FindFirstChildOfClass("Atmosphere")
	if atm then TweenService:Create(atm, TweenInfo.new(3), { Density = 0.28, Color = Color3.fromRGB(255, 205, 240) }):Play() end
	for p in Game.sessions do Game.applyCharacter(p) end
	Game.sendAll("eventEnd", id)
end

function Game.eventLoop()
	workspace:SetAttribute("NextEvent", workspace:GetServerTimeNow() + 75)
	while true do
		task.wait(1)
		local nextAt = workspace:GetAttribute("NextEvent") :: number?
		if not currentEvent and nextAt and workspace:GetServerTimeNow() >= nextAt then
			local total = 0
			for _, e in Config.Events do total += e.weight end
			local x = rng:NextNumber() * total
			local pickId = Config.Events[1].id
			for _, e in Config.Events do x -= e.weight; if x <= 0 then pickId = e.id; break end end
			startEvent(pickId)
		end
	end
end

-- a falling star crashes into the meadow and a Legendary (or better) climbs out
function Game.starfall()
	local target = World.randomMeadowPoint()
	local star = World.part(workspace, { Name = "FallingStar", Shape = Enum.PartType.Ball, Size = Vector3.one * 5, CFrame = CFrame.new(target + Vector3.new(80, 260, 40)), Color = Color3.fromRGB(255, 240, 150), Material = Enum.Material.Neon, CanCollide = false })
	local fire = Instance.new("Fire"); fire.Heat = 20; fire.Size = 14; fire.Color = Color3.fromRGB(255, 210, 90); fire.SecondaryColor = Color3.fromRGB(255, 100, 200); fire.Parent = star
	local tw = TweenService:Create(star, TweenInfo.new(2.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { CFrame = CFrame.new(target + Vector3.new(0, 2, 0)) })
	tw:Play()
	tw.Completed:Wait()
	poof(target, Color3.fromRGB(255, 230, 120), 90)
	star:Destroy()
	Game.sendAll("impact", target)
	local m = Game.spawnDreamling(5)
	m:PivotTo(CFrame.new(target + Vector3.new(0, hoverHeight(m), 0)))
end

-- candy falls anywhere on the meadow; touching one pays out a slice of your income
function Game.dropCandy()
	local pos = World.randomMeadowPoint() + Vector3.new(0, 90, 0)
	local c = World.part(workspace, { Name = "Candy", Shape = Enum.PartType.Ball, Size = Vector3.one * 2.4, CFrame = CFrame.new(pos), Color = Color3.fromHSV(rng:NextNumber(), 0.5, 1), Material = Enum.Material.Neon, Anchored = false, CanCollide = true })
	c.CanTouch = true
	local got = false
	c.Touched:Connect(function(hit)
		if got then return end
		local p = Players:GetPlayerFromCharacter(hit.Parent)
		if not p or not Data.profiles[p] then return end
		got = true
		local v = math.max(15, math.floor(Game.income(p) * 6))
		local d = Data.profiles[p]
		d.sparkles += v; d.total += v
		Game.send(p, "candy", v)
		poof(c.Position, c.Color, 14)
		c:Destroy()
	end)
	Debris:AddItem(c, 14)
end

return Game

-- FIGURE ME OUT: capture the flag. Each team has one flag standing in the middle of its base (the MARKET courtyards: red west,
-- blue east). Walk into the enemy flag to take it (real players only), carry it to your own base to score, and your own flag
-- must be home for a capture to count. Whoever carries a flag is shown to everybody; if the carrier is hit or leaves, the flag
-- drops where they were. A dropped flag goes home by itself after a while, or at once if a teammate touches it. Everything is
-- decided here on the server: there is no request a client could send to take, move or capture a flag.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Plates = require(script.Parent.Plates)
local Combat = require(script.Parent.Combat)

local Flags = {}

local flags = {} -- team id -> flag
local folder

local function label(e)
	return e.icon .. " " .. e.code
end


-- Where the flag is right now.
local function position(f)
	if f.carrier and f.carrier.char then
		local root = f.carrier.char:FindFirstChild("HumanoidRootPart")
		if root then
			return root.Position
		end
	end
	return f.pos
end

local function publish(f)
	workspace:SetAttribute("Flag" .. f.team, f.state)
	workspace:SetAttribute("FlagCarrier" .. f.team, f.carrier and label(f.carrier) or "")
end

local function makeParts(f)
	local def = Config.Teams[f.team]
	local pole = Instance.new("Part")
	pole.Name = "FlagPole" .. f.team
	pole.Size = Vector3.new(0.6, 9, 0.6)
	pole.Color = Color3.fromRGB(235, 240, 250)
	pole.Material = Enum.Material.Metal
	pole.CanQuery = false
	pole.CanTouch = false
	pole.Parent = folder
	local cloth = Instance.new("Part")
	cloth.Name = "FlagCloth" .. f.team
	cloth.Size = Vector3.new(4, 2.6, 0.25)
	cloth.Color = def.Color
	cloth.Material = Enum.Material.Neon
	cloth.CanQuery = false
	cloth.CanTouch = false
	cloth.Parent = folder
	local light = Instance.new("PointLight")
	light.Color = def.Color
	light.Range = 16
	light.Brightness = 2
	light.Parent = cloth
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = pole
	weld.Part1 = cloth
	weld.Parent = cloth
	f.pole, f.cloth = pole, cloth
end

-- Puts a flag on the ground (anchored) at `where`.
local function planted(f, where)
	if f.carryWeld then
		f.carryWeld:Destroy()
		f.carryWeld = nil
	end
	f.pole.Anchored = true
	f.cloth.Anchored = true
	f.pole.CanCollide = false
	f.cloth.CanCollide = false
	f.pole.Position = where + Vector3.new(0, 4.5, 0)
	f.cloth.Position = where + Vector3.new(2.3, 7.4, 0)
	f.pos = where
end

local function goHome(f)
	f.carrier = nil
	f.state = "home"
	f.returnAt = nil
	planted(f, f.home)
	publish(f)
end

function Flags.clear()
	for _, f in flags do
		if f.carrier then
			Plates.showFlag(f.carrier, false, Config.Teams[f.team])
		end
	end
	flags = {}
	if folder then
		folder:Destroy()
		folder = nil
	end
	for team = 1, 2 do
		workspace:SetAttribute("Flag" .. team, nil)
		workspace:SetAttribute("FlagCarrier" .. team, nil)
	end
end

-- Builds both flags at their bases for a new capture-the-flag match.
function Flags.reset()
	Flags.clear()
	folder = Instance.new("Folder")
	folder.Name = "Flags"
	folder.Parent = workspace
	for team = 1, 2 do
		local f = { team = team, home = Config.Map.Bases[team], state = "home", captures = 0 }
		flags[team] = f
		makeParts(f)
		goHome(f)
	end
end

function Flags.state(team)
	return flags[team] and flags[team].state
end

function Flags.carrierOf(team)
	return flags[team] and flags[team].carrier
end

-- The flag this entity is carrying, or nil.
function Flags.carrying(e)
	for _, f in flags do
		if f.carrier == e then
			return f
		end
	end
	return nil
end

-- The carrier lost the flag (was hit, left, or the match ended): it falls where they were.
function Flags.dropCarried(e, why)
	local f = Flags.carrying(e)
	if not f then
		return false
	end
	local where = position(f)
	Plates.showFlag(e, false, Config.Teams[f.team])
	f.carrier = nil
	f.state = "dropped"
	f.returnAt = State.now() + Config.Flag.ReturnTime
	planted(f, Vector3.new(where.X, 0.2, where.Z))
	publish(f)
	Net.sendAll("flag", "dropped", f.team, label(e))
	return true
end

local function take(f, e)
	f.carrier = e
	f.state = "carried"
	f.returnAt = nil
	local root = e.char and e.char:FindFirstChild("HumanoidRootPart")
	if root then
		f.pole.Anchored = false
		f.cloth.Anchored = false
		f.pole.Massless = true
		f.cloth.Massless = true
		f.pole.CFrame = root.CFrame * CFrame.new(0, 3, 1.8)
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = root
		weld.Part1 = f.pole
		weld.Parent = f.pole
		f.carryWeld = weld
	end
	Plates.showFlag(e, true, Config.Teams[f.team])
	e.score = (e.score or 0) + Config.Flag.TakePoints
	State.writeEntity(e)
	publish(f)
	Net.sendAll("flag", "taken", f.team, label(e))
end

local function near(a, b, radius)
	local dx, dz = a.X - b.X, a.Z - b.Z
	return dx * dx + dz * dz <= radius * radius and math.abs(a.Y - b.Y) < 12
end

local function capture(f, e)
	local team = e.team
	e.score = (e.score or 0) + Config.Flag.CapturePoints * Combat.multiplier()
	e.captures = (e.captures or 0) + 1
	State.teamScore[team] += 1
	Plates.showFlag(e, false, Config.Teams[f.team])
	State.writeEntity(e)
	goHome(f)
	State.writeWorld()
	Net.sendAll("flag", "captured", team, label(e))
	if e.player then
		Net.send(e.player, "captured", Config.Flag.CapturePoints)
	end
end

-- Every quarter second during a capture-the-flag match.
function Flags.tick(now)
	for _, f in flags do
		if f.carrier then
			local e = f.carrier
			if not e.alive or State.entities[e.id] ~= e then
				Flags.dropCarried(e, "out")
			else
				local own = flags[e.team]
				local root = e.char and e.char:FindFirstChild("HumanoidRootPart")
				if root and near(root.Position, Config.Map.Bases[e.team], Config.Flag.CaptureRadius) and (not Config.Flag.NeedOwnFlagHome or own.state == "home") then
					capture(f, e)
				end
			end
		else
			if f.state == "dropped" and f.returnAt and now >= f.returnAt then
				goHome(f)
				Net.sendAll("flag", "returned", f.team, "")
			else
				for _, e in State.aliveList() do
					local root = e.char and e.char:FindFirstChild("HumanoidRootPart")
					if e.player and root and e.team and (e.stunUntil or 0) <= now and near(root.Position, f.pos, Config.Flag.PickupRadius) then
						if e.team ~= f.team then
							if not Flags.carrying(e) then
								take(f, e)
								break
							end
						elseif f.state == "dropped" then
							goHome(f)
							e.score = (e.score or 0) + Config.Flag.ReturnPoints
							State.writeEntity(e)
							Net.sendAll("flag", "returned", f.team, label(e))
							break
						end
					end
				end
			end
		end
	end
end

return Flags

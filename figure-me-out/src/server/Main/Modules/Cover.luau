-- FIGURE ME OUT: the anti-camping rule. If a wall is right in front of your forehead for too long you get a warning,
-- and if you ignore it your number is shown above your head to everybody for a while. Smoke does not count: that is
-- the clever way to hide.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Vision = require(script.Parent.Vision)
local Plates = require(script.Parent.Plates)

local Cover = {}

function Cover.reset(e)
	e.coverTimer = 0
	e.coverStage = "ok"
	e.exposedUntil = 0
end

-- Is something solid right in front of this entity's forehead?
function Cover.isCovered(e)
	local head = Vision.head(e)
	if not head then
		return false
	end
	local look = head.CFrame.LookVector
	local origin = head.Position
	local blocked = {}
	for i, angle in Config.Cover.Angles do
		local x, z = Rules.turn(look.X, look.Z, angle)
		local dir = Vector3.new(x, look.Y, z)
		blocked[i] = Vision.distanceAhead(origin, dir, Config.Cover.Distance) ~= nil
	end
	return Rules.isCovered(blocked)
end

function Cover.expose(e, seconds)
	e.exposedUntil = State.now() + seconds
	Plates.showReveal(e, true)
	State.writeEntity(e)
	Net.sendAll("exposed", e.icon .. " " .. e.code)
end

-- Called every Cover.Tick seconds for every living entity that is a real player.
function Cover.step(e, dt)
	local now = State.now()
	if (e.exposedUntil or 0) > 0 and now >= e.exposedUntil then
		e.exposedUntil = 0
		if not State.revealing then
			Plates.showReveal(e, false)
		end
		State.writeEntity(e)
	end
	if not e.alive or not e.player then
		return
	end
	local covered = Cover.isCovered(e)
	e.coverTimer = Rules.coverStep(e.coverTimer or 0, covered, dt)
	local stage = Rules.coverStage(e.coverTimer)
	if stage == "expose" then
		e.coverTimer = 0
		stage = "ok"
		Cover.expose(e, Config.Cover.Expose)
		Net.send(e.player, "cover", "exposed", Config.Cover.Expose)
		e.coverStage = "ok"
		return
	end
	if stage == "warn" then
		Net.send(e.player, "cover", "warn", math.max(0, Config.Cover.Limit - e.coverTimer))
	elseif e.coverStage == "warn" then
		Net.send(e.player, "cover", "ok", 0)
	end
	e.coverStage = stage
end

return Cover

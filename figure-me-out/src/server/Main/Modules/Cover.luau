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
	e.violations = 0
	e.coverLast = nil
	e.campAnchor = nil
	e.sanePos = nil; e.saneAt = nil
	e.campLast = nil
	e.campTimer = 0
	e.campStage = "ok"
	e.campViolations = 0
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

-- Shows the eye marker and red plate for a while. Also used by the information terminals.
function Cover.expose(e, seconds)
	e.exposedUntil = math.max(e.exposedUntil or 0, State.now() + seconds)
	Plates.showReveal(e, true, true)
	State.writeEntity(e)
	Net.sendAll("exposed", e.icon .. " " .. e.code)
end

-- Is this player allowed to stay put? (Waiting for the match to start, being frozen, or defending your own flag.)
local function mayRest(e)
	if State.phase ~= "play" or (e.stunUntil or 0) > State.now() then
		return true
	end
	if State.mode and State.mode.Id == "ctf" and e.team then
		local base = Config.Map.Bases[e.team]
		local root = e.char and e.char:FindFirstChild("HumanoidRootPart")
		if base and root then
			local dx, dz = root.Position.X - base.X, root.Position.Z - base.Z
			if dx * dx + dz * dz <= Config.Camp.BaseExempt * Config.Camp.BaseExempt then
				return true
			end
		end
	end
	return false
end

-- The second anti-camping rule: sitting in one small area for too long.
local function campStep(e)
	-- real time since the last check (the tick loop runs a little slower than its nominal rate)
	local now = State.now()
	local dt = math.clamp(now - (e.campLast or now), 0, 1)
	e.campLast = now
	local root = e.char and e.char:FindFirstChild("HumanoidRootPart")
	if not root then
		return
	end
	if mayRest(e) then
		e.campAnchor, e.campTimer = root.Position, 0
	else
		e.campAnchor, e.campTimer = Rules.campStep(e.campAnchor, e.campTimer or 0, root.Position, dt)
	end
	local stage = Rules.campStage(e.campTimer)
	if stage == "expose" then
		local seconds = Config.Camp.Expose * (1 + Config.Camp.RepeatBonus * (e.campViolations or 0))
		e.campViolations = (e.campViolations or 0) + 1
		e.campTimer = 0
		e.campAnchor = root.Position
		Cover.expose(e, seconds)
		Net.send(e.player, "camp", "exposed", math.floor(seconds), e.campViolations)
		e.campStage = "ok"
		return
	end
	if stage == "warn" then
		Net.send(e.player, "camp", "warn", math.max(0, Config.Camp.Limit - e.campTimer))
	elseif e.campStage == "warn" then
		Net.send(e.player, "camp", "ok", 0)
	end
	e.campStage = stage
end

-- Movement check (teleport / speed hacks): if the player is further from where we last saw them than their speed allows,
-- they are put back. Server-made teleports clear `sanePos` first (spawning, respawning).
function Cover.sanity(e)
	if not Config.Sanity.Enabled then
		return
	end
	local root = e.char and e.char:FindFirstChild("HumanoidRootPart")
	if not root then
		return
	end
	local now = State.now()
	local pos = root.Position
	local last = e.sanePos
	if State.phase ~= "play" or not last then
		e.sanePos, e.saneAt = pos, now
		return
	end
	local dx, dz = pos.X - last.X, pos.Z - last.Z
	local dist = math.sqrt(dx * dx + dz * dz)
	if dist < 0.5 then
		return -- standing still: the clock keeps running, so a lag spike followed by a jump is not mistaken for a teleport
	end
	local top = math.max(Config.Movement.Walk, Config.Sprint.Speed)
	if (e.stunUntil or 0) > now then
		top = 0
	end
	if Rules.moveAllowed(dist, top, now - (e.saneAt or now)) then
		e.sanePos, e.saneAt = pos, now
		return
	end
	e.sanityHits = (e.sanityHits or 0) + 1
	e.char:PivotTo(CFrame.new(last.X, pos.Y, last.Z) * CFrame.Angles(0, 0, 0))
end

-- Called every Cover.Tick seconds for every living entity that is a real player.
function Cover.step(e, dt)
	local now = State.now()
	if (e.exposedUntil or 0) > 0 and now >= e.exposedUntil then
		e.exposedUntil = 0
		Plates.showReveal(e, State.revealing, false)
		State.writeEntity(e)
	end
	if not e.alive or not e.player then
		return
	end
	Cover.sanity(e)
	campStep(e)
	local covered = Cover.isCovered(e)
	-- real time since the last check (the tick loop runs a little slower than its nominal rate)
	dt = math.clamp(now - (e.coverLast or now), 0, 1)
	e.coverLast = now
	e.coverTimer = Rules.coverStep(e.coverTimer or 0, covered, dt)
	local stage = Rules.coverStage(e.coverTimer)
	if stage == "expose" then
		e.coverTimer = 0
		stage = "ok"
		-- every earlier violation makes the exposure longer, so permanent hiding never pays
		local seconds = Config.Cover.Expose * (1 + Config.Cover.RepeatBonus * (e.violations or 0))
		e.violations = (e.violations or 0) + 1
		Cover.expose(e, seconds)
		Net.send(e.player, "cover", "exposed", math.floor(seconds), e.violations)
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

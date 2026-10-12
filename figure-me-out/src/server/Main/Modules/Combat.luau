-- FIGURE ME OUT: stunning, speed and eliminations. Everything that changes whether an entity can move or is still in
-- the match goes through here, so the rules stay in one place.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Plates = require(script.Parent.Plates)

local Combat = {}

Combat.onEliminated = nil -- set by Match: called after someone is out

local function humanoid(e)
	local char = e.char
	return char and char:FindFirstChildOfClass("Humanoid") or nil
end

-- The speed this entity should have right now.
function Combat.speedOf(e)
	local now = State.now()
	if State.phase ~= "play" or (e.stunUntil or 0) > now then
		return 0
	end
	if e.scoped then
		return Config.Movement.ScopeWalk
	end
	if (e.bootsUntil or 0) > now then
		return Config.Movement.Boots
	end
	return Config.Movement.Walk
end

function Combat.applySpeed(e)
	local hum = humanoid(e)
	if not hum then
		return
	end
	local speed = Combat.speedOf(e)
	hum.WalkSpeed = speed
	hum.JumpPower = speed > 0 and Config.Movement.Jump or 0
	hum.UseJumpPower = true
end

function Combat.stun(e, seconds)
	e.stunUntil = math.max(e.stunUntil or 0, State.now() + seconds)
	Combat.applySpeed(e)
	State.writeEntity(e)
	if e.player then
		Net.send(e.player, "stun", seconds)
	end
end

function Combat.setNumber(e, digits)
	e.number = digits
	Plates.setText(e, digits)
	if e.reveal and e.reveal.gui.Enabled then
		e.reveal.label.Text = digits
	end
end

local function burst(e)
	local head = e.char and e.char:FindFirstChild("Head")
	if not head then
		return
	end
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.Transparency = 1
	p.Size = Vector3.new(1, 1, 1)
	p.CFrame = head.CFrame
	p.Parent = workspace
	local em = Instance.new("ParticleEmitter")
	em.Color = ColorSequence.new(e.color or Color3.new(1, 1, 1))
	em.Size = NumberSequence.new(1.2, 0)
	em.Lifetime = NumberRange.new(0.6, 1.1)
	em.Speed = NumberRange.new(18, 34)
	em.SpreadAngle = Vector2.new(180, 180)
	em.Rate = 0
	em.LightEmission = 1
	em.Parent = p
	em:Emit(40)
	task.delay(2, function()
		p:Destroy()
	end)
end

-- Takes `victim` out of the match. `killer` is an entity or nil (fell off the map, left the game...).
-- how: "guess" | "left" | "fell"
function Combat.eliminate(victim, killer, how)
	if not victim or not victim.alive then
		return false
	end
	victim.alive = false
	victim.diedAt = State.now()
	victim.killer = killer and killer.id or nil
	victim.scoped = false
	if killer and killer ~= victim then
		killer.kills = (killer.kills or 0) + 1
		killer.bullets = math.min(Config.Guess.Bullets, (killer.bullets or 0) + Config.Guess.KillBullets)
		State.writeEntity(killer)
		if killer.player then
			Net.send(killer.player, "gotKill", victim.code, victim.icon, victim.number)
		end
	end
	if victim.reveal and victim.reveal.gui then
		-- the fallen player's number shows briefly, then goes away so the arena doesn't fill with red numbers
		Plates.showReveal(victim, true)
		task.delay(6, function()
			if not State.revealing and (victim.exposedUntil or 0) <= State.now() then
				Plates.showReveal(victim, false)
			end
		end)
	end
	burst(victim)
	local hum = humanoid(victim)
	if hum then
		hum.WalkSpeed = 0
		hum.Health = 0
	end
	State.writeEntity(victim)
	State.writeWorld()
	Net.sendAll(
		"kill",
		victim.icon .. " " .. victim.code,
		killer and (killer.icon .. " " .. killer.code) or "",
		how or "guess",
		victim.number
	)
	if victim.player then
		Net.send(
			victim.player,
			"eliminated",
			killer and (killer.icon .. " " .. killer.code) or "",
			how or "guess",
			State.aliveCount(),
			#State.order
		)
	end
	if Combat.onEliminated then
		Combat.onEliminated(victim, killer, how)
	end
	if State.onChange then
		State.onChange()
	end
	return true
end

return Combat

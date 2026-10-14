-- FIGURE ME OUT: lives, stuns, speed and eliminations. Everything that changes whether an entity can move, how many
-- lives it has or whether it is still in the match goes through here, so the rules stay in one place.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Plates = require(script.Parent.Plates)

local Combat = {}

Combat.onEliminated = nil -- Match: called after somebody is out of the match for good
Combat.onCredit = nil -- Match: called after somebody scored a hit (bounty, assists)
Combat.onRespawn = nil -- Match: puts a player who lost a life somewhere else on the map
Combat.multiplier = function() -- Events: double points
	return 1
end

local function humanoid(e)
	local char = e.char
	return char and char:FindFirstChildOfClass("Humanoid") or nil
end

local function label(e)
	return e.icon .. " " .. e.code
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
	if (e.sprintUntil or 0) > now then
		return Config.Sprint.Speed
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

-- The dash: a quick burst of speed in the direction you look (flat on the ground), with a short cooldown. Works out everything on the
-- server. Returns true when it happened.
function Combat.dash(e, look)
	local now = State.now()
	if State.phase ~= "play" or not e or not e.alive or (e.stunUntil or 0) > now or now < (e.dashReadyAt or 0) then
		return false
	end
	local root = e.char and e.char:FindFirstChild("HumanoidRootPart")
	if not root then
		return false
	end
	look = Rules.cleanVector(look)
	if not look or look.Magnitude < 0.1 then
		look = root.CFrame.LookVector
	end
	local flat = Vector3.new(look.X, 0, look.Z)
	if flat.Magnitude < 0.1 then
		flat = root.CFrame.LookVector
	end
	flat = flat.Unit
	root.AssemblyLinearVelocity = Vector3.new(flat.X * Config.Dash.Speed, Config.Dash.Lift, flat.Z * Config.Dash.Speed)
	e.dashReadyAt = now + Config.Dash.Cooldown
	if e.player then
		e.player:SetAttribute("DashReady", workspace:GetServerTimeNow() + Config.Dash.Cooldown)
	end
	return true
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
end

-- The cartoon pixel burst (its colours come from the elimination effect the player picked).
local function burst(e)
	local head = e.char and e.char:FindFirstChild("Head")
	if not head then
		return
	end
	local effect = e.effectDef or Config.EffectById.pixels
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CanQuery = false
	p.Transparency = 1
	p.Size = Vector3.new(1, 1, 1)
	p.CFrame = head.CFrame
	p.Parent = workspace
	local em = Instance.new("ParticleEmitter")
	local keys = {}
	for i, color in effect.Colors do
		keys[i] = ColorSequenceKeypoint.new((i - 1) / math.max(1, #effect.Colors - 1), color)
	end
	em.Color = #keys >= 2 and ColorSequence.new(keys) or ColorSequence.new(effect.Colors[1])
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

-- Nobody can guess you for a while: after coming back, and while you are down. A glowing shield shows it.
function Combat.protect(e, seconds)
	e.protectedUntil = math.max(e.protectedUntil or 0, State.now() + seconds)
	local char = e.char
	if char then
		pcall(function()
			local old = char:FindFirstChildOfClass("ForceField")
			if old then
				old:Destroy()
			end
			local ff = Instance.new("ForceField")
			ff.Visible = true
			ff.Parent = char
			task.delay(seconds, function()
				ff:Destroy()
			end)
		end)
	end
	State.writeEntity(e)
end

-- Points and credit for a successful guess.
function Combat.credit(killer, victim)
	local now = State.now()
	killer.kills = (killer.kills or 0) + 1
	killer.bullets = math.min(Config.Guess.Bullets, (killer.bullets or 0) + Config.Guess.KillBullets)
	local points = Config.Score.Hit * Combat.multiplier()
	killer.score = (killer.score or 0) + points
	killer.hitTimes = killer.hitTimes or {}
	killer.hitTimes[victim.id] = now
	-- hit again and again without being hit yourself: a popup and bonus points
	killer.streak = (killer.streak or 0) + 1
	victim.streak = 0
	if killer.streak >= 2 then
		local bonus = Config.Streaks.Bonus * (killer.streak - 1)
		killer.score = (killer.score or 0) + bonus
		if killer.player then
			Net.send(killer.player, "streak", killer.streak, Config.Streaks.Names[math.min(killer.streak - 1, #Config.Streaks.Names)], bonus)
		end
	end
	State.writeEntity(killer)
	if killer.player then
		Net.send(killer.player, "gotKill", victim.code, victim.icon, victim.lives or 0, points)
	end
	if Combat.onCredit then
		Combat.onCredit(killer, victim)
	end
	return points
end

-- Takes `victim` out of the match for good. `killer` is an entity or nil (left the game, fell off the map...).
-- how: "guess" | "left" | "fell"
function Combat.eliminate(victim, killer, how)
	if not victim or not victim.alive then
		return false
	end
	victim.alive = false
	victim.lives = 0
	victim.diedAt = State.now()
	victim.killer = killer and killer.id or nil
	victim.scoped = false
	Plates.hide(victim)
	burst(victim)
	local hum = humanoid(victim)
	if hum then
		hum.WalkSpeed = 0
		hum.Health = 0
	end
	State.writeEntity(victim)
	State.writeWorld()
	Net.sendAll("kill", label(victim), killer and label(killer) or "", how or "guess")
	if victim.player then
		Net.send(victim.player, "eliminated", killer and label(killer) or "", how or "guess", State.aliveCount(), #State.order)
	end
	if Combat.onEliminated then
		Combat.onEliminated(victim, killer, how)
	end
	if State.onChange then
		State.onChange()
	end
	return true
end

-- A correct guess: the victim loses a life (never, in team modes). They glitch away and come back, protected, somewhere else.
function Combat.strike(victim, killer, how)
	if not victim or not victim.alive then
		return false
	end
	Combat.credit(killer, victim)
	if State.mode.Respawn then
		-- team modes: nobody is ever out, you just come back
	elseif (victim.lives or 1) <= 1 then
		return Combat.eliminate(victim, killer, how)
	else
		victim.lives -= 1
	end
	local delay = Config.Lives.RespawnDelay
	-- (frozen a moment longer than the delay: the respawn below ends the freeze, so nothing can happen in between)
	victim.stunUntil = State.now() + delay + 0.5
	victim.scoped = false
	Combat.protect(victim, delay + Config.Lives.Protect)
	Combat.applySpeed(victim)
	burst(victim)
	State.writeEntity(victim)
	Net.sendAll("kill", label(victim), label(killer), "life")
	if victim.player then
		Net.send(victim.player, "lifeLost", label(killer), victim.lives, delay)
	end
	task.delay(delay, function()
		if victim.alive and State.entities[victim.id] == victim then
			if Combat.onRespawn then
				Combat.onRespawn(victim)
			end
			victim.stunUntil = 0
			Combat.applySpeed(victim)
			State.writeEntity(victim)
		end
	end)
	return true
end

return Combat

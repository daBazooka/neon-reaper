-- SUB 5 TO TRUE ADAM: treadmills. Buy one with Aura, press the use button to hop on and run. You earn Aura (and a little
-- XP) every second for as long as you keep running; press the button again to step off.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Util = require(ReplicatedStorage.Shared.Util)
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Treadmill = {}

local running = {} -- player -> treadmill id
local heat = {} -- player -> seconds run in a row
local FX = "TreadFx"
local SMOKE = "rbxasset://textures/particles/smoke_main.dds"
local SPARKS = "rbxasset://textures/particles/sparkles_main.dds"
local FIRE = "rbxasset://textures/particles/fire_main.dds"

local function rainbow()
	local keys = {}
	for i = 0, 6 do
		table.insert(keys, ColorSequenceKeypoint.new(i / 6, Color3.fromHSV(i / 6, 0.75, 1)))
	end
	return ColorSequence.new(keys)
end

-- Effects on the runner that everyone can see; they get wilder with the treadmill's tier.
local function attachFx(p, def)
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if not root then
		return
	end
	local feet = Instance.new("Attachment")
	feet.Name = FX
	feet.Position = Vector3.new(0, -2.8, 0)
	feet.Parent = root
	local color = def.Color
	local seq = def.Rainbow and rainbow() or ColorSequence.new(color:Lerp(Color3.new(1, 1, 1), 0.3), color)
	local function emitter(props)
		local e = Instance.new("ParticleEmitter")
		e.Name = FX
		e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.1), NumberSequenceKeypoint.new(1, 1) })
		e.SpreadAngle = Vector2.new(30, 30)
		for k, v in props do
			e[k] = v
		end
		e.Parent = feet
	end
	emitter({ Texture = SMOKE, Color = seq, Rate = 18, Lifetime = NumberRange.new(0.8, 1.4), Speed = NumberRange.new(4, 8), Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.2), NumberSequenceKeypoint.new(1, 4) }), LightEmission = 0.3 })
	if def.Effect ~= "dust" then
		emitter({ Texture = SPARKS, Color = seq, Rate = 40, Lifetime = NumberRange.new(0.5, 1), Speed = NumberRange.new(10, 20), SpreadAngle = Vector2.new(60, 60), Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.9), NumberSequenceKeypoint.new(1, 0) }), LightEmission = 0.8 })
	end
	if def.Effect == "flames" or def.Effect == "storm" then
		emitter({ Texture = FIRE, Color = seq, Rate = 36, Lifetime = NumberRange.new(0.5, 0.9), Speed = NumberRange.new(3, 7), SpreadAngle = Vector2.new(20, 20), Acceleration = Vector3.new(0, 14, 0), Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 2.2), NumberSequenceKeypoint.new(1, 0) }), LightEmission = 0.9 })
	end
	if def.Effect == "storm" then
		-- lightning-like streaks shooting out sideways + a bright light
		emitter({ Texture = SPARKS, Color = seq, Rate = 70, Lifetime = NumberRange.new(0.25, 0.5), Speed = NumberRange.new(30, 50), SpreadAngle = Vector2.new(180, 180), Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.4), NumberSequenceKeypoint.new(1, 0) }), LightEmission = 1 })
		local light = Instance.new("PointLight")
		light.Name = FX
		light.Color = color
		light.Range = 28
		light.Brightness = 2
		light.Parent = root
	end
end

local function clearFx(p)
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if not root then
		return
	end
	for _, child in root:GetChildren() do
		if child.Name == FX then
			child:Destroy()
		end
	end
end

-- Slides the stripes along the belt of every treadmill someone is running on.
local function animateBelts(now)
	local hall = workspace:FindFirstChild("GlowWorld") and workspace.GlowWorld:FindFirstChild("TreadHall")
	if not hall then
		return
	end
	local seen = {}
	for _, id in running do
		if not seen[id] then
			seen[id] = true
			local model = hall:FindFirstChild("Tread_" .. id)
			if model then
				local at = Config.TreadCF(id)
				local speed = 7 + id * 1.2
				for _, stripe in model:GetChildren() do
					local z0 = stripe.Name == "BeltStripe" and stripe:GetAttribute("Z0")
					if z0 then
						local z = ((z0 + 5.2 - now * speed) % 10.4) - 5.2
						stripe.CFrame = at * CFrame.new(0, 1.22, z)
					end
				end
			end
		end
	end
end

function Treadmill.init()
	local last = 0
	game:GetService("RunService").Heartbeat:Connect(function()
		local now = os.clock()
		if now - last >= 0.05 then
			last = now
			animateBelts(now)
		end
	end)
end

function Treadmill.isRunning(p)
	return running[p]
end

local function freeze(p, frozen)
	local hum = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
	if not hum then
		return
	end
	if frozen then
		hum.WalkSpeed = 0
		hum.JumpHeight = 0
	else
		Stats.applyMovement(p)
	end
end

function Treadmill.stop(p)
	local id = running[p]
	if not id then
		return
	end
	running[p] = nil
	heat[p] = nil
	p:SetAttribute("Running", 0)
	p:SetAttribute("RunHeat", 0)
	clearFx(p)
	freeze(p, false)
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if root then
		-- step off onto the aisle in front of the treadmill
		local front = Config.TreadCF(id) * CFrame.new(0, 2.7, -8.5)
		root.CFrame = CFrame.lookAt(front.Position, front.Position + front.LookVector * 20)
	end
	Stats.send(p, "runStop")
end

function Treadmill.start(p, id)
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if not root or p:GetAttribute("Training") or p:GetAttribute("InDuel") then
		return
	end
	local belt = Config.TreadCF(id) * CFrame.new(0, 0.8, 0)
	root.AssemblyLinearVelocity = Vector3.zero
	-- the runner faces the back wall of the hall
	root.CFrame = CFrame.lookAt(belt.Position + Vector3.new(0, 3, 0), belt.Position - belt.LookVector * 20 + Vector3.new(0, 3, 0))
	freeze(p, true)
	running[p] = id
	heat[p] = 0
	p:SetAttribute("Running", id)
	p:SetAttribute("RunHeat", 0)
	attachFx(p, Config.Treadmills[id])
	Stats.send(p, "run", id)
end

-- Use: buy it if locked, hop on if owned, step off if you are already on it.
function Treadmill.use(p, id)
	local profile = Data.get(p)
	local def = Config.Treadmills[id]
	if not profile or not def then
		return
	end
	if running[p] == id then
		Treadmill.stop(p)
		return
	end
	local key = tostring(id)
	if not profile.Treads[key] then
		if not Stats.spend(p, def.Price) then
			Stats.toast(p, string.format("%s needs %s Aura", def.Name, Util.fmt(def.Price)), "bad")
			return
		end
		profile.Treads[key] = true
		Stats.recompute(p)
		Stats.send(p, "treadBought", id)
	end
	if running[p] then
		Treadmill.stop(p)
	end
	Treadmill.start(p, id)
end

-- Called once a second for every player.
function Treadmill.tick(p)
	local id = running[p]
	if not id then
		return
	end
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	local hum = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
	if not root or not hum or hum.Health <= 0 then
		running[p] = nil
		heat[p] = nil
		p:SetAttribute("Running", 0)
		return
	end
	local def = Config.Treadmills[id]
	heat[p] = (heat[p] or 0) + 1
	p:SetAttribute("RunHeat", heat[p])
	local gained = Stats.addAura(p, def.Rate * Config.RunHeatMult(heat[p]))
	Stats.addXP(p, 0.4 + id * 0.25)
	Stats.send(p, "runTick", gained, heat[p], id)
end

function Treadmill.release(p)
	running[p] = nil
	heat[p] = nil
end

return Treadmill

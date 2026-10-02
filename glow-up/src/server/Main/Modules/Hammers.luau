-- SUB 5 TO TRUE ADAM: click / tap to swing a hammer, plus buying and equipping hammers.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)
local Quests = require(script.Parent.Quests)
local HammerModel = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("HammerModel"))

local Hammers = {}

local lastSwing = {}
local combo = {} -- player -> swings in a row
local frenzyUntil = {} -- player -> os.clock when frenzy ends
local rng = Random.new()

local function setFrenzyEffect(p, on)
	local head = p.Character and p.Character:FindFirstChild("Head")
	if not head then
		return
	end
	local old = head:FindFirstChild("FrenzyFx")
	if old then
		old:Destroy()
	end
	if on then
		local e = Instance.new("ParticleEmitter")
		e.Name = "FrenzyFx"
		e.Texture = "rbxasset://textures/particles/sparkles_main.dds"
		e.Color = ColorSequence.new(Color3.fromRGB(255, 190, 40), Color3.fromRGB(255, 80, 60))
		e.LightEmission = 0.6
		e.Rate = 40
		e.Lifetime = NumberRange.new(0.6, 1.1)
		e.Speed = NumberRange.new(3, 8)
		e.SpreadAngle = Vector2.new(180, 180)
		e.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.2), NumberSequenceKeypoint.new(1, 0) })
		e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(1, 1) })
		e.Parent = head
	end
end

function Hammers.current(p)
	local profile = Data.get(p)
	return profile and Config.HammerById[profile.Hammer] or Config.Hammers[1]
end

function Hammers.swing(p)
	local profile = Data.get(p)
	if not profile or p:GetAttribute("Training") or p:GetAttribute("InDuel") then
		return
	end
	local now = os.clock()
	if now - (lastSwing[p] or 0) < Config.SwingInterval * 0.8 then
		return
	end
	local hammer = Hammers.current(p)
	-- Mog Streak: keep swinging without pausing to build up to FRENZY (double Aura).
	local f = Config.Frenzy
	if now - (lastSwing[p] or 0) <= f.Window + Config.SwingInterval then
		combo[p] = (combo[p] or 0) + 1
	else
		combo[p] = 1
	end
	lastSwing[p] = now
	local frenzy = (frenzyUntil[p] or 0) > now
	if not frenzy and combo[p] >= f.Combo then
		frenzy = true
		combo[p] = 0
		frenzyUntil[p] = now + f.Duration
		p:SetAttribute("FrenzyEnd", workspace:GetServerTimeNow() + f.Duration)
		setFrenzyEffect(p, true)
		Stats.send(p, "frenzy", f.Duration)
		task.delay(f.Duration + 0.1, function()
			if (frenzyUntil[p] or 0) <= os.clock() then
				setFrenzyEffect(p, false)
			end
		end)
	end
	p:SetAttribute("SwingCombo", combo[p] or 0)

	-- Variable reward: any swing can crit.
	local c = Config.Crit
	local roll = rng:NextNumber()
	local tag, critMult = nil, 1
	if roll < c.JackpotChance then
		tag, critMult = "jackpot", c.JackpotMult
	elseif roll < c.JackpotChance + c.Chance then
		tag, critMult = "crit", c.Mult
	end
	local gained = Stats.addAura(p, Config.SwingBase(profile.Level) * hammer.Mult * critMult * (frenzy and f.Mult or 1))
	profile.Swings += 1
	p:SetAttribute("Swings", profile.Swings)
	Stats.addXP(p, 0.6)
	Quests.progress(p, "swings", 1)
	Stats.send(p, "swing", gained, tag, frenzy)
end

-- Step on a pedestal and press the button: buys the hammer, or equips it if you own it.
function Hammers.use(p, id)
	local profile = Data.get(p)
	local hammer = Config.HammerById[id]
	if not profile or not hammer then
		return
	end
	local key = tostring(id)
	if not profile.HammersOwned[key] then
		if not Stats.spend(p, hammer.Price) then
			Stats.toast(p, "Not enough Aura for the " .. hammer.Name, "bad")
			return
		end
		profile.HammersOwned[key] = true
		Stats.send(p, "hammer", id, "bought")
	else
		if profile.Hammer == id then
			return
		end
		Stats.send(p, "hammer", id, "equipped")
	end
	profile.Hammer = id
	Stats.recompute(p)
	Hammers.attach(p)
end

-- Puts the equipped hammer in your right hand so everyone can see it.
function Hammers.attach(p)
	local char = p.Character
	local hand = char and (char:FindFirstChild("RightHand") or char:FindFirstChild("Right Arm") or char:WaitForChild("RightHand", 3))
	if not hand then
		return
	end
	local old = char:FindFirstChild("GlowHammer")
	if old then
		old:Destroy()
	end
	local hammer = Hammers.current(p)
	local model = HammerModel.build(hammer, hand.CFrame, char, { scale = 0.6 })
	model.Name = "GlowHammer"
	local weld = Instance.new("Weld")
	weld.Part0 = hand
	weld.Part1 = model.PrimaryPart
	weld.C0 = CFrame.new(0, -0.35, -0.2) * CFrame.Angles(math.rad(-80), 0, 0)
	weld.Parent = model.PrimaryPart
	for _, child in model:GetChildren() do
		if child ~= model.PrimaryPart and child:IsA("BasePart") then
			local w = Instance.new("WeldConstraint")
			w.Part0 = model.PrimaryPart
			w.Part1 = child
			w.Parent = child
		end
	end
end

function Hammers.release(p)
	lastSwing[p] = nil
	combo[p] = nil
	frenzyUntil[p] = nil
end

return Hammers

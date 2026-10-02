-- SUB 5 TO TRUE ADAM: treadmills. Buy one with Aura, press the use button to hop on and run. You earn Aura (and a little
-- XP) every second for as long as you keep running; press the button again to step off.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Util = require(ReplicatedStorage.Shared.Util)
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Treadmill = {}

local running = {} -- player -> treadmill id

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
	p:SetAttribute("Running", 0)
	freeze(p, false)
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if root then
		local front = Config.TreadHallCF() * CFrame.new((id - 5.5) * Config.TreadSpacing, 3.5, -9)
		root.CFrame = CFrame.lookAt(front.Position, front.Position + front.LookVector * 20)
	end
	Stats.send(p, "runStop")
end

function Treadmill.start(p, id)
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if not root or p:GetAttribute("Training") or p:GetAttribute("InDuel") then
		return
	end
	local belt = Config.TreadHallCF() * CFrame.new((id - 5.5) * Config.TreadSpacing, 1.6, 2)
	root.AssemblyLinearVelocity = Vector3.zero
	-- the runner faces the back wall of the hall
	root.CFrame = CFrame.lookAt(belt.Position + Vector3.new(0, 3, 0), belt.Position - belt.LookVector * 20 + Vector3.new(0, 3, 0))
	freeze(p, true)
	running[p] = id
	p:SetAttribute("Running", id)
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
		p:SetAttribute("Running", 0)
		return
	end
	local def = Config.Treadmills[id]
	Stats.addAura(p, def.Rate)
	Stats.addXP(p, 0.4 + id * 0.25)
end

function Treadmill.release(p)
	running[p] = nil
end

return Treadmill

-- FIGURE ME OUT: the moving scenery of Waterfall Canyon, animated on your own screen (no network traffic): the ripples on the
-- waterfalls and the river slide along, and the planes fly their circuits high over the arena. Everything is worked out from
-- the server's clock, so every player sees the planes in the same place.
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Canyon = require(Shared:WaitForChild("Canyon"))
local Rules = require(Shared:WaitForChild("Rules"))

local Ambient = {}

local flows = {} -- { scroll = Frame, speed = number }
local planes = {} -- { model, prop, offset }
local lastScan = -100

local function serverTime()
	local ok, t = pcall(function()
		return workspace:GetServerTimeNow()
	end)
	if ok and type(t) == "number" then
		return t
	end
	return os.clock()
end

-- Finds the water ripples and the planes (the world may arrive a little after the script starts, so this repeats now and then).
local function scan(now)
	lastScan = now
	flows = {}
	for _, name in { "Arena", "Water" } do
		local root = workspace:FindFirstChild(name)
		if root then
			for _, d in root:GetDescendants() do
				if d.Name == "FlowGui" then
					local scroll = d:FindFirstChild("Scroll")
					local speed = d:GetAttribute("FlowSpeed")
					if scroll and type(speed) == "number" then
						table.insert(flows, { scroll = scroll, speed = speed })
					end
				end
			end
		end
	end
	local known = {}
	for _, p in planes do
		known[p.model] = true
	end
	local folder = workspace:FindFirstChild("Planes")
	if folder then
		for _, m in folder:GetChildren() do
			if not known[m] then
				local prop = m:FindFirstChild("Prop")
				local offset
				if prop then
					offset = m:GetPivot():ToObjectSpace(prop.CFrame)
				end
				table.insert(planes, { model = m, prop = prop, offset = offset, index = m:GetAttribute("PlaneIndex") or 1 })
			end
		end
	end
end

-- One frame. `t` = seconds on the server's clock.
function Ambient.step(t)
	if t - lastScan > 5 then
		scan(t)
	end
	for _, f in flows do
		f.scroll.Position = UDim2.fromScale(0, -1 + (t * f.speed) % 1)
	end
	for _, p in planes do
		local x, y, z, yaw = Rules.planePose(t, Canyon.Planes, p.index)
		local bank = p.index == 1 and -0.25 or -0.25
		p.model:PivotTo(CFrame.new(x, y, z) * CFrame.Angles(0, yaw, bank))
		if p.prop and p.offset then
			p.prop.CFrame = p.model:GetPivot() * p.offset * CFrame.Angles(0, 0, t * 40)
		end
	end
end

function Ambient.init()
	RunService.RenderStepped:Connect(function()
		Ambient.step(serverTime())
	end)
end

return Ambient

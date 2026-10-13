-- ===== extras for Figure Me Out: real vector math, walls that block rays, fake characters =====
local X = {walls = {}}
Notify.FireAllClients = function(_, ...) table.insert(notifyLog, {...}) end
do
	local oldIndex = V3mt.__index
	V3mt.__index = function(t, k)
		if k == "Dot" then return function(a, b) return a.X * b.X + a.Y * b.Y + a.Z * b.Z end end
		if k == "Cross" then return function(a, b) return V3new(a.Y * b.Z - a.Z * b.Y, a.Z * b.X - a.X * b.Z, a.X * b.Y - a.Y * b.X) end end
		if k == "Lerp" then return function(a, b, f) return a + (b - a) * f end end
		return oldIndex(t, k)
	end
	V3mt.__eq = function(a, b) return a.X == b.X and a.Y == b.Y and a.Z == b.Z end
	V3mt.__tostring = function(a) return string.format("(%.1f, %.1f, %.1f)", a.X, a.Y, a.Z) end
end
local typeof = function(v)
	if getmetatable(v) == V3mt then return "Vector3" end
	return type(v)
end

local CFmt = {}
local function cfNew(pos, look) return setmetatable({Position = pos, LookVector = look or V3new(0, 0, -1)}, CFmt) end
CFmt.__mul = function(a, b)
	if getmetatable(b) == CFmt then return cfNew(a.Position + b.Position, a.LookVector) end
	return a.Position + b
end
local CFrame = {
	new = function(x, y, z)
		if type(x) == "number" then return cfNew(V3new(x, y, z)) end
		local look = V3new(0, 0, -1)
		if y then
			local d = y - x
			if d.Magnitude > 0.001 then look = d.Unit end
		end
		return cfNew(x, look)
	end,
	Angles = function() return cfNew(V3new(0, 0, 0)) end,
}

-- walls: axis aligned boxes { min = V3, max = V3 }; a ray from `o` along `d` hits one when the segment crosses it
function X.addWall(minV, maxV) local w = {min = minV, max = maxV}; table.insert(X.walls, w); return w end
function X.clearWalls() X.walls = {} end
local function segmentBox(o, d, w)
	local t0, t1 = 0, 1
	for _, ax in {"X", "Y", "Z"} do
		local oo, dd = o[ax], d[ax]
		if math.abs(dd) < 1e-9 then
			if oo < w.min[ax] or oo > w.max[ax] then return nil end
		else
			local a, b = (w.min[ax] - oo) / dd, (w.max[ax] - oo) / dd
			if a > b then a, b = b, a end
			t0 = math.max(t0, a); t1 = math.min(t1, b)
			if t0 > t1 then return nil end
		end
	end
	return t0
end
rawset(workspace, "Raycast", function(_, o, d, params)
	local best
	for _, w in X.walls do
		local t = segmentBox(o, d, w)
		if t and (not best or t < best) then best = t end
	end
	if best then return {Position = o + d * best} end
	return nil
end)
local RaycastParams = {new = function() return {} end}

function X.fakeChar(name, pos, look)
	local char = {Name = name, attrs = {}}
	local head = {Name = "Head", Size = V3new(1.2, 1.2, 1.2), Position = pos + V3new(0, 2, 0)}
	head.CFrame = cfNew(head.Position, look or V3new(0, 0, -1))
	head.FindFirstChild = function() return nil end
	local root = {Name = "HumanoidRootPart", Position = pos, FindFirstChild = function() return nil end}
	local hum = {ClassName = "Humanoid", _h = 100, WalkSpeed = 16, JumpPower = 50, UseJumpPower = true, Jump = false}
	local died = {}
	hum.Died = {Connect = function(_, f) table.insert(died, f); return {} end}
	setmetatable(hum, {
		__index = function(t, k) if k == "Health" then return rawget(t, "_h") end end,
		__newindex = function(t, k, v)
			if k == "Health" then
				local was = rawget(t, "_h")
				rawset(t, "_h", v)
				if v <= 0 and was > 0 then for _, f in died do task.spawn(f) end end
			else rawset(t, k, v) end
		end,
	})
	hum.RemoveAccessories = function() end
	hum.MoveTo = function(self, target) rawset(self, "moveTarget", target) end
	char.hum, char.head, char.root = hum, head, root
	function char:FindFirstChild(n)
		if n == "Head" then return head elseif n == "HumanoidRootPart" then return root end
		return nil
	end
	function char:FindFirstChildOfClass(c) if c == "Humanoid" then return hum end return nil end
	function char:WaitForChild(n) return self:FindFirstChild(n) or hum end
	function char:GetDescendants() return {} end
	function char:GetPivot() return cfNew(root.Position, head.CFrame.LookVector) end
	function char:PivotTo(cf)
		root.Position = cf.Position
		head.Position = cf.Position + V3new(0, 2, 0)
		head.CFrame = cfNew(head.Position, cf.LookVector)
	end
	function char:Clone() return X.fakeChar(name, root.Position, head.CFrame.LookVector) end
	function char:SetAttribute(k, v) self.attrs[k] = v end
	function char:GetAttribute(k) return self.attrs[k] end
	function char:Destroy() self.destroyed = true end
	function char:face(look) head.CFrame = cfNew(head.Position, look) end
	return char
end
function Players:CreateHumanoidModelFromDescription() return X.fakeChar("Bot", V3new(0, 5, 0)) end

function X.newPlayer(id, name)
	local p = {UserId = id, Name = name, attrs = {}, Parent = {}, onChar = {}, loads = 0}
	p.CharacterAdded = {Connect = function(_, f) table.insert(p.onChar, f); return {} end}
	function p:SetAttribute(k, v) self.attrs[k] = v end
	function p:GetAttribute(k) return self.attrs[k] end
	function p:FindFirstChild() return nil end
	function p:LoadCharacter()
		self.loads += 1
		local c = X.fakeChar(name, V3new(0, 5, 0))
		self.Character = c
		for _, f in self.onChar do task.spawn(f, c) end
	end
	return p
end

-- walks every bot toward its MoveTo target at its WalkSpeed (so the bots' street routes are really followed)
X.moveAll = true
X.chars = {}
function X.walk(char, dt)
	local hum, root = char.hum, char.root
	local t = rawget(hum, "moveTarget")
	if not t or hum.WalkSpeed <= 0 then return end
	local d = V3new(t.X - root.Position.X, 0, t.Z - root.Position.Z)
	local dist = d.Magnitude
	if dist < 0.1 then return end
	local step = math.min(dist, hum.WalkSpeed * dt)
	local dir = d.Unit
	char:PivotTo(cfNew(root.Position + dir * step, dir))
end

-- characters can be watched for new parts (the client hides your own number plate this way)
do
	local baseFake = X.fakeChar
	function X.fakeChar(name, pos, look)
		local c = baseFake(name, pos, look)
		local fns = {}
		c.DescendantAdded = {Connect = function(_, f) table.insert(fns, f); return {Disconnect = function() end} end}
		function c:addPart(part) for _, f in fns do f(part) end end
		return c
	end
end

-- Lighting and Terrain start with no effects, exactly like a fresh place: the code must create them, which checks the class names
do
	local lighting = U("Lighting")
	lighting.FindFirstChildOfClass = function() return nil end
	local terrain = U("Terrain")
	terrain.FindFirstChildOfClass = function() return nil end
	local old = game.GetService
	local gameBase = game
	game = {GetService = function(self, n)
		if n == "Lighting" then return lighting end
		return old(self, n)
	end, BindToClose = function() end}
	rawset(workspace, "Terrain", terrain)
end

-- counts every instance the code creates (to keep the map within a part budget)
X.made = {}
do
	local made = Instance.new
	X.parts = {}
	Instance.new = function(c) X.made[c] = (X.made[c] or 0) + 1; local o = made(c); if c == "Part" or c == "TrussPart" then table.insert(X.parts, o) end return o end
end

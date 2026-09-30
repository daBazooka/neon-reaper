local fs = require("@lune/fs")
local luau = require("@lune/luau")
local roblox = require("@lune/roblox")
local Instance, Enum = roblox.Instance, roblox.Enum
-- engine methods the reflection DOM does not simulate
local function extents(m)
	local mn, mx = nil, nil
	for _, d in m:GetDescendants() do
		if d:IsA("BasePart") then
			local p, s = d.CFrame.Position, d.Size
			local lo, hi = p - s / 2, p + s / 2
			mn = if mn then roblox.Vector3.new(math.min(mn.X, lo.X), math.min(mn.Y, lo.Y), math.min(mn.Z, lo.Z)) else lo
			mx = if mx then roblox.Vector3.new(math.max(mx.X, hi.X), math.max(mx.Y, hi.Y), math.max(mx.Z, hi.Z)) else hi
		end
	end
	return mn and (mx - mn) or roblox.Vector3.zero
end
roblox.implementMethod("Model", "GetExtentsSize", function(self) return extents(self) end)
roblox.implementMethod("Model", "ScaleTo", function(self, s) self:SetAttribute("__scale", s) end)
roblox.implementMethod("Model", "GetScale", function(self) return self:GetAttribute("__scale") or 1 end)
roblox.implementMethod("Model", "PivotTo", function(self, cf)
	local root = self.PrimaryPart
	if not root then return end
	local delta = cf * root.CFrame:Inverse()
	for _, d in self:GetDescendants() do if d:IsA("BasePart") then d.CFrame = delta * d.CFrame end end
end)
roblox.implementMethod("Instance", "WaitForChild", function(self, name) return self:FindFirstChild(name) end)
local dm = roblox.Instance.new("DataModel")
local ws = dm:GetService("Workspace")
local terrain = Instance.new("Terrain"); terrain.Parent = ws
roblox.implementProperty("Workspace", "Terrain", function(self) return terrain end)

local ROOT = "src/"
local cache = {}
local env
local function load(path, scriptInst)
	if cache[path] then return cache[path] end
	local src = fs.readFile(ROOT .. path)
	local e = setmetatable({ script = scriptInst }, { __index = env })
	local fn = luau.load(src, { debugName = path, environment = e, injectGlobals = false })
	cache[path] = fn()
	return cache[path]
end
-- fake script tree mirroring the Rojo layout
local rs = dm:GetService("ReplicatedStorage")
local shared = Instance.new("Folder"); shared.Name = "Shared"; shared.Parent = rs
local sss = dm:GetService("ServerScriptService")
local server = Instance.new("Folder"); server.Name = "Server"; server.Parent = sss
local files = {}
for _, n in { "Config", "Logic", "Builder" } do local m = Instance.new("ModuleScript"); m.Name = n; m.Parent = shared; files[m] = "shared/" .. n .. ".luau" end
for _, n in { "World", "Data", "Game" } do local m = Instance.new("ModuleScript"); m.Name = n; m.Parent = server; files[m] = "server/" .. n .. ".luau" end
local mkSignal = function() local sg = { cbs = {} }; function sg:Connect(f) table.insert(self.cbs, f); return { Disconnect = function() end } end; function sg:Wait() end; function sg:Fire(...) for _, f in self.cbs do f(...) end end; return sg end
local fakeServices = {
	Players = { GetPlayerFromCharacter = function() return nil end, GetPlayers = function() return {} end },
	TweenService = { Create = function(_, inst, info, props) return { Play = function() for k, v in props do inst[k] = v end end, Cancel = function() end, Completed = mkSignal() } end },
	Debris = { AddItem = function() end },
	DataStoreService = { GetDataStore = function() error("no api") end, GetOrderedDataStore = function() error("no api") end },
	RunService = { IsStudio = function() return true end },
}
local game = setmetatable({}, { __index = function(_, k)
	if k == "GetService" then return function(_, name) return fakeServices[name] or dm:GetService(name) end end
	if k == "BindToClose" then return function() end end
	return dm[k]
end })
env = setmetatable({
	game = game, TweenInfo = { new = function(...) return { ... } end }, workspace = ws, Instance = Instance, Enum = Enum,
	require = function(m) local f = (if m.Parent.Name == "Shared" then "shared/" else "server/") .. m.Name .. ".luau"; return load(f, m) end,
	task = { wait = function() end, spawn = function() end, delay = function() end },
}, { __index = function(_, k) return roblox[k] or _G[k] or ({ math = math, string = string, table = table, print = print, warn = print, pairs = pairs, ipairs = ipairs, next = next, type = type, typeof = typeof, tostring = tostring, tonumber = tonumber, setmetatable = setmetatable, assert = assert, error = error, pcall = pcall, select = select, unpack = unpack, os = os })[k] end })
for k, v in pairs(roblox) do if type(v) == "table" and k ~= "Instance" then env[k] = v end end
env.Random = { new = function() return { NextNumber = function(_, a, b) a = a or 0; b = b or 1; return a + math.random() * (b - a) end, NextInteger = function(_, a, b) return math.random(a, b) end } end }

local Config = load("shared/Config.luau", shared:FindFirstChild("Config"))
local shM = shared:FindFirstChild("Builder")
local Builder = load("shared/Builder.luau", shM)
local n = 0
for _, sp in Config.Species do
	for _, mut in { false, "golden", "rainbow", "disco", "galaxy", "giant", "tiny" } do
		local m = Builder.build(sp.id, if mut then mut else nil, { anchored = true, label = true })
		assert(m.PrimaryPart and m.PrimaryPart.Name == "Root", "no root for " .. sp.id)
		n += 1
	end
end
print("built", n, "dreamling variants OK")
local wM = server:FindFirstChild("World")
local World = load("server/World.luau", wM)
local plots = World.build()
local parts = 0
for _, d in ws:GetDescendants() do if d:IsA("BasePart") then parts += 1 end end
print("world built:", #plots, "plots,", #plots[1].slots, "jar slots each,", parts, "parts")
for i = 1, 200 do local p = World.randomMeadowPoint(); assert(p.Magnitude <= Config.MeadowRadius + 1 and p.Magnitude >= 17, "bad spawn point") end
print("spawn points OK; lighting children:", #dm:GetService("Lighting"):GetChildren())

roblox.implementProperty("ProximityPrompt", "Triggered", function() return mkSignal() end)
roblox.implementProperty("BasePart", "Touched", function() return mkSignal() end)
roblox.implementMethod("Workspace", "GetServerTimeNow", function() return os.clock() end)
roblox.implementMethod("Instance", "ClearAllChildren", function(self) for _, c in self:GetChildren() do c.Parent = nil end end)
roblox.implementMethod("Instance", "Destroy", function(self) self.Parent = nil end)
roblox.implementMethod("ParticleEmitter", "Emit", function() end)
local Game = load("server/Game.luau", server:FindFirstChild("Game"))
local Data = load("server/Data.luau", server:FindFirstChild("Data"))
Game.plots = plots
Game.remote = nil
for _ = 1, 30 do Game.spawnDreamling() end
for _ = 1, 3 do Game.spawnDreamling(5) end
print("spawned", #ws:FindFirstChild("Dreamlings"):GetChildren(), "wild dreamlings")
local p = { Name = "Tester", DisplayName = "Tester", Character = nil, FindFirstChild = function() return nil end }
local d = Data.default()
d.jars = { { id = "puffle", star = 1 }, { id = "puffle", star = 1 }, { id = "puffle", mut = "golden", star = 1 }, { id = "starwhale", mut = "rainbow", star = 2 }, { id = "kaleido", mut = "galaxy", star = 5 } }
d.sparkles = 1e12
Data.profiles[p] = d
Game.sessions[p] = { plot = nil, carry = {}, catching = nil, passes = {}, lastToast = {}, income = 0 }
Game.assignPlot(p)
Game.renderPlot(p)
print("rendered plot jars:", #Game.sessions[p].plot.jarFolder:GetChildren(), "objects; income", Game.income(p))
Game.merge(p); print("after merge:", #d.jars, "jars")
Game.sell(p, 1)
for _, u in Config.Upgrades do Game.buyUpgrade(p, u.id) end
Game.buySlot(p)
Game.refreshQuests(p); Game.quest(p, "catch", 99)
Game.claimQuest(p, 1)
Game.collect(p)
Game.dropCandy()
Game.starfall()
Game.startEvent("secret"); Game.endEvent()
Game.rebirth(p)
print("rebirths", d.rebirths, "slots", d.slots)
Game.catchTick(); Game.spawnTick()
Game.freePlot(p)
print("SERVER RUNTIME OK")

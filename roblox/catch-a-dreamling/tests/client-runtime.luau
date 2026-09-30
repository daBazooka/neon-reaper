local fs = require("@lune/fs")
local luau = require("@lune/luau")
local roblox = require("@lune/roblox")
local Instance, Enum = roblox.Instance, roblox.Enum
local V3 = roblox.Vector3

-- signals stored per instance via a unique attribute
local SIG = {}
local sidN = 0
local function sidOf(inst)
	local id = inst:GetAttribute("__sid")
	if not id then sidN += 1; id = sidN; inst:SetAttribute("__sid", id) end
	return id
end
local function mkSignal()
	local s = { cbs = {} }
	function s:Connect(fn) table.insert(self.cbs, fn); return { Disconnect = function() local i = table.find(self.cbs, fn); if i then table.remove(self.cbs, i) end end } end
	function s:Once(fn) return self:Connect(fn) end
	function s:Wait() end
	function s:Fire(...) for _, f in table.clone(self.cbs) do f(...) end end
	return s
end
local function sig(inst, name)
	local k = sidOf(inst) .. name
	SIG[k] = SIG[k] or mkSignal()
	return SIG[k]
end
for _, pair in { {"GuiButton", "Activated"}, {"GuiObject", "MouseEnter"}, {"GuiObject", "MouseLeave"}, {"GuiObject", "InputBegan"}, {"Sound", "Ended"}, {"RemoteEvent", "OnClientEvent"}, {"Instance", "ChildAdded"} } do
	roblox.implementProperty(pair[1], pair[2], function(self) return sig(self, pair[2]) end)
end
roblox.implementMethod("Instance", "GetPropertyChangedSignal", function(self, p) return sig(self, "chg" .. p) end)
roblox.implementMethod("Instance", "WaitForChild", function(self, name) local c = self:FindFirstChild(name); if not c then error("WaitForChild missing: " .. name) end; return c end)
roblox.implementMethod("Sound", "Play", function() end)
roblox.implementMethod("RemoteEvent", "FireServer", function(self, ...) end)
roblox.implementMethod("Workspace", "GetServerTimeNow", function() return os.clock() + 1000 end)
roblox.implementMethod("Model", "GetExtentsSize", function(self) return V3.new(4, 4, 4) end)
roblox.implementMethod("Model", "ScaleTo", function() end)
roblox.implementMethod("Model", "PivotTo", function() end)
roblox.implementMethod("Instance", "Destroy", function(self) self.Parent = nil end)

local dm = Instance.new("DataModel")
local ws = dm:GetService("Workspace")
local cam = Instance.new("Camera"); cam.Parent = ws
local fakeCam = { ViewportSize = roblox.Vector2.new(1280, 720), CFrame = roblox.CFrame.new(), GetPropertyChangedSignal = function() return mkSignal() end }
local wsProxy = setmetatable({}, { __index = function(_, k)
	if k == "CurrentCamera" then return fakeCam end
	local v = ws[k]
	if type(v) == "function" then return function(_, ...) return v(ws, ...) end end
	return v
end })
roblox.implementProperty("GuiObject", "AbsoluteSize", function() return roblox.Vector2.new(100, 100) end)
local lighting = dm:GetService("Lighting")
local ccE = Instance.new("ColorCorrectionEffect"); ccE.Name = "DreamColor"; ccE.Parent = lighting
local rs = dm:GetService("ReplicatedStorage")
local shared = Instance.new("Folder"); shared.Name = "Shared"; shared.Parent = rs
for _, n in { "Config", "Logic", "Builder" } do local m = Instance.new("ModuleScript"); m.Name = n; m.Parent = shared end
local remotes = Instance.new("Folder"); remotes.Name = "Remotes"; remotes.Parent = rs
local toClient = Instance.new("RemoteEvent"); toClient.Name = "ToClient"; toClient.Parent = remotes
local toServer = Instance.new("RemoteEvent"); toServer.Name = "ToServer"; toServer.Parent = remotes
local wild = Instance.new("Folder"); wild.Name = "Dreamlings"; wild.Parent = ws

local player = Instance.new("Player"); player.Name = "Tester"
local pg = Instance.new("PlayerGui"); pg.Parent = player
roblox.implementProperty("Player", "DisplayName", function() return "Tester" end)
roblox.implementProperty("Player", "Character", function() return nil end)

local heartbeat, render = mkSignal(), mkSignal()
local fakeServices = {
	Players = { LocalPlayer = player, GetPlayers = function() return { player } end },
	RunService = { Heartbeat = heartbeat, RenderStepped = render, BindToRenderStep = function(_, _, _, fn) render:Connect(fn) end, IsStudio = function() return true end },
	TweenService = { Create = function(_, inst, info, props) return { Play = function() for k, v in props do inst[k] = v end end, Cancel = function() end, Completed = mkSignal() } end },
	MarketplaceService = { PromptGamePassPurchase = function() end, PromptProductPurchase = function() end },
	UserInputService = { InputBegan = mkSignal() },
}
local game = setmetatable({}, { __index = function(_, k)
	if k == "GetService" then return function(_, name) return fakeServices[name] or dm:GetService(name) end end
	return dm[k]
end })

local ROOT = "src/"
local cache = {}
local env
local function load(path, scriptInst)
	if cache[path] then return cache[path] end
	local e = setmetatable({ script = scriptInst }, { __index = env })
	cache[path] = luau.load((string.gsub(fs.readFile(ROOT .. path), "workspace%.CurrentCamera", "__CAM")), { debugName = path, environment = e, injectGlobals = false })()
	return cache[path]
end
local base = { math = math, string = string, table = table, print = print, warn = print, pairs = pairs, ipairs = ipairs, next = next, type = type, typeof = typeof, tostring = tostring, tonumber = tonumber, setmetatable = setmetatable, assert = assert, error = error, pcall = pcall, select = select, unpack = unpack, os = os }
env = setmetatable({ game = game, workspace = ws, __CAM = fakeCam, TweenInfo = { new = function(...) return { ... } end }, Instance = Instance, Enum = Enum,
	require = function(m) return load("shared/" .. m.Name .. ".luau", m) end,
	task = { wait = function() end, spawn = function(f, ...) f(...) end, delay = function() end },
}, { __index = function(_, k) return roblox[k] or base[k] end })

-- run the client
load("client/Client.client.luau", nil)
print("client script ran; gui children:", #pg:FindFirstChild("DreamUI"):GetChildren())
local fire = sig(toClient, "OnClientEvent")
fire:Fire("sync", { sparkles = 5e6, unclaimed = 1234, income = 999, rebirths = 1, luck = 2,
	up = { netSpeed = 3, reach = 1, speed = 2, bag = 1, luck = 4 }, slots = 6,
	jars = { { id = "puffle", star = 1 }, { id = "puffle", mut = "golden", star = 1 }, { id = "puffle", star = 1 }, { id = "starwhale", mut = "rainbow", star = 2 } },
	dex = { puffle = 3, starwhale = 1, kaleido = 1 }, stats = { caught = 10, rares = 2, legends = 1, mutated = 2, merges = 0 },
	quests = { { t = "catch", n = 8, p = 8, done = true, claimed = false, text = "Catch 8 dreamlings" }, { t = "rare", n = 1, p = 0, done = false, claimed = false, text = "Catch 1 Rare or better" } },
	carry = { { id = "blip" } }, bag = 2, passes = {}, daily = { streak = 3 }, tut = 0, luckUntil = 0 })
-- press every button (opens and builds every panel)
local pressed = 0
for _, d in pg:GetDescendants() do if d:IsA("TextButton") then sig(d, "Activated"):Fire(); pressed += 1 end end
-- replay server messages
local m = Instance.new("Model"); local root = Instance.new("Part"); root.Parent = m; m.PrimaryPart = root; m.Parent = wild
for _, msg in {
	{ "toast", "hello", {255, 0, 0} }, { "announce", "A LEGENDARY appeared", {255, 205, 60} }, { "catchStart", m, 2 }, { "catchEnd", false, "Too far!" },
	{ "caught", "kaleido", "galaxy", true, 500, false }, { "caught", "puffle", nil, false, 0, false }, { "caught", "moonpaw", nil, false, 0, true },
	{ "deposit", 2 }, { "collect", 1234 }, { "candy", 55 }, { "bought", "reach" }, { "merged", 1 }, { "reborn", 2 }, { "reward", "Quest reward", 999 },
	{ "offline", 50000, 7200 }, { "daily", 3, 800, 5 }, { "event", "disco", "Someone" }, { "eventEnd", "disco" }, { "impact", V3.new(0, 0, 0) },
} do fire:Fire(table.unpack(msg)) end
ws:SetAttribute("EventId", "rainbow"); ws:SetAttribute("EventEnds", os.clock() + 1030)
for _ = 1, 30 do heartbeat:Fire(0.05); render:Fire(0.016) end
ws:SetAttribute("EventId", ""); ws:SetAttribute("NextEvent", os.clock() + 1100)
for _ = 1, 10 do heartbeat:Fire(0.05) end
local n = 0
for _ in pg:GetDescendants() do n += 1 end
print("pressed", pressed, "buttons, replayed all messages; UI instances:", n)
print("CLIENT RUNTIME OK")

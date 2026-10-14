-- ===== client mocks: a local player, a camera, clickable buttons, keyboard and mouse =====
local origNew = Instance.new
X.buttons, X.texts = {}, {}
Instance.new = function(c)
	local o = origNew(c)
	if c == "TextButton" or c == "ImageButton" then
		for _, ev in {"MouseButton1Click", "MouseButton1Down", "MouseButton1Up", "MouseEnter", "MouseLeave"} do
			local fns = {}
			o[ev] = {Connect = function(_, f) table.insert(fns, f); return {Disconnect = function() end} end, fns = fns}
		end
		table.insert(X.buttons, o)
	end
	if c == "TextLabel" or c == "TextButton" then table.insert(X.texts, o) end
	if c == "ScreenGui" then X.gui = o end
	return o
end
-- a gui object is visible when it and every ancestor that is also a gui object has Visible ~= false
local function visible(o)
	local guard = 0
	while type(o) == "table" or type(o) == "userdata" do
		guard += 1; if guard > 40 then break end
		if rawequal(o, X.gui) then return true end
		local v = o.Visible
		if v == false then return false end
		o = o.Parent
	end
	return true
end
local function textOf(o) local t = o.Text; if type(t) == "string" then return t end return "" end
function X.seen(sub)
	for _, o in X.texts do
		if string.find(textOf(o), sub, 1, true) and visible(o) then return true end
	end
	return false
end
local function labelled(b, sub)
	if string.find(textOf(b), sub, 1, true) then return true end
	for _, c in X.texts do
		if rawequal(c.Parent, b) and string.find(textOf(c), sub, 1, true) then return true end
	end
	return false
end
function X.click(sub, nth)
	local n = 0
	for _, b in X.buttons do
		if labelled(b, sub) and visible(b) then
			n += 1
			if n == (nth or 1) then
				for _, f in b.MouseButton1Click.fns do f() end
				return true
			end
		end
	end
	return false
end

local attrsP = {}
local pgui = U("PlayerGui")
local localPlayer = X.newPlayer(1, "Me")
localPlayer.attrs = attrsP
function localPlayer:GetAttributeChangedSignal(k) return signal("attr_" .. k) end
function localPlayer:SetAttribute(k, v) attrsP[k] = v; fireAll("attr_" .. k) end
localPlayer.WaitForChild = function() return pgui end
localPlayer:LoadCharacter()
Players.LocalPlayer = localPlayer
Players.NumPlayers = 1
table.insert(players, localPlayer)

X.camera = {FieldOfView = 70, ViewportSize = {X = 1920, Y = 1080}, CFrame = {Position = V3new(0, 8, -20), LookVector = V3new(0, 0, 1), RightVector = V3new(1, 0, 0)}}
rawset(workspace, "CurrentCamera", X.camera)
rawset(workspace, "WaitForChild", function(_, n) if n == "Camera" then return X.camera end return U(n) end)
X.folders = {}
local function folder(n) local f = {Name = n, kids = {}}; function f:GetChildren() return self.kids end; function f:GetDescendants() local out = {} local function walk(n) for _, k in (n.kids or n.children or {}) do table.insert(out, k); if type(k) == "table" and (k.kids or k.children) then walk(k) end end end walk(self) return out end; X.folders[n] = f; return f end
folder("Bots"); folder("Decoys"); folder("Smoke"); folder("Arena"); folder("Water"); folder("Planes")
rawset(workspace, "FindFirstChild", function(_, n) return X.folders[n] end)

local UIS = {InputBegan = signal("input"), InputEnded = signal("inputEnd"), InputChanged = signal("inputChg"), MouseDeltaSensitivity = 1, TouchEnabled = false, KeyboardEnabled = true}
local game_old = game
game = {GetService = function(self, n)
	if n == "UserInputService" then return UIS end
	return game_old.GetService(self, n)
end, BindToClose = function() end}
X.UIS = UIS

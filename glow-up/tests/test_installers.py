import os, glob
root = os.path.join(os.path.dirname(__file__), "..")
inst = sorted(glob.glob(os.path.join(root, "install", "Install_*.lua")), key=lambda p: int(os.path.basename(p).split("_")[1]))
mock = r'''
local function node(class, name)
	local n = {ClassName = class, Name = name or class, Children = {}, Source = nil}
	local mt = {}
	mt.__index = function(t, k)
		if k == "Parent" then return rawget(t, "_parent") end
		if k == "GetChildren" then return function(self) local r = {} for _, c in rawget(t, "Children") do table.insert(r, c) end return r end end
		if k == "FindFirstChild" or k == "WaitForChild" then return function(self, name) for _, c in rawget(t, "Children") do if c.Name == name then return c end end end end
		if k == "Destroy" then return function(self) local p = rawget(t, "_parent"); if p then for i, c in rawget(p, "Children") do if c == t then table.remove(rawget(p, "Children"), i) break end end end rawset(t, "_parent", nil) end end
	end
	mt.__newindex = function(t, k, v)
		if k == "Parent" then
			local old = rawget(t, "_parent")
			if old then for i, c in rawget(old, "Children") do if c == t then table.remove(rawget(old, "Children"), i) break end end end
			rawset(t, "_parent", v)
			if v then table.insert(rawget(v, "Children"), t) end
		else rawset(t, k, v) end
	end
	return setmetatable(n, mt)
end
local RSn = node("ReplicatedStorage"); local SSSn = node("ServerScriptService")
local SPn = node("StarterPlayer"); local SPSn = node("StarterPlayerScripts"); SPSn.Parent = SPn
-- leftovers from the old game must be cleaned up
local oldMain = node("Script", "Main"); oldMain.Parent = SSSn
local oldHud = node("LocalScript", "Hud"); oldHud.Parent = SPSn
local oldShared = node("Folder", "Shared"); oldShared.Parent = RSn
local game = {GetService = function(_, n) if n == "ReplicatedStorage" then return RSn elseif n == "ServerScriptService" then return SSSn elseif n == "StarterPlayer" then return SPn end end}
local Instance = {new = function(c) return node(c) end}
local print = print
'''
body = []
for p in inst:
    body.append("do\n" + open(p, encoding="utf-8").read() + "\nend")
# expected tree
checks = []
def add(group, target, rel):
    src = open(os.path.join(root, "src", rel), encoding="utf-8").read()
    checks.append((target, os.path.basename(rel)[:-5].replace(".server","").replace(".client",""), src))
verify = ["local function path(n, ...) for _, name in {...} do n = n:FindFirstChild(name); if not n then return nil end end return n end", "local fails = 0"]
def expect(base, names, rel):
    src = open(os.path.join(root, "src", rel), encoding="utf-8").read()
    lua_names = ", ".join('"%s"' % n for n in names)
    verify.append(f'do local n = path({base}, {lua_names}); if not n then print("MISSING", "{"/".join(names)}"); fails += 1 elseif n.Source ~= {{}} then end end'.replace("{}","[=====[\n"+src+"]=====]"))
for n in ["Config", "Util", "Audio", "UI"]:
    expect("RSn", ["Shared", n], f"shared/{n}.luau")
expect("SSSn", ["Main"], "server/Main/init.server.luau")
for f in sorted(os.listdir(os.path.join(root, "src/server/Main/Modules"))):
    expect("SSSn", ["Main", "Modules", f[:-5]], f"server/Main/Modules/{f}")
expect("SPSn", ["Client"], "client/Client/init.client.luau")
for f in sorted(os.listdir(os.path.join(root, "src/client/Client/Modules"))):
    expect("SPSn", ["Client", "Modules", f[:-5]], f"client/Client/Modules/{f}")
verify.append('print(fails == 0 and "INSTALLER TEST PASS: every script present with identical source" or ("INSTALLER TEST FAIL " .. fails))')
verify.append('print("old Hud gone:", path(SPSn, "Hud") == nil, "scripts under SPS:", #SPSn:GetChildren(), "under SSS:", #SSSn:GetChildren())')
open("/tmp/claude-0/lu/installer_test.luau", "w", encoding="utf-8").write(mock + "\n".join(body) + "\n" + "\n".join(verify))

"""Builds the Studio Command Bar installers from the source files.

Each installer is a self-contained Lua script: paste it into Studio's Command Bar and press
Enter, and it creates Script/ModuleScript/LocalScript objects with the right code in the right
place. The files are split into small installers so every paste stays a comfortable size.
"""
import os, glob

root = os.path.join(os.path.dirname(__file__), "..")
src = os.path.join(root, "src")
out_dir = os.path.join(root, "install")
os.makedirs(out_dir, exist_ok=True)
for old in glob.glob(os.path.join(out_dir, "*.lua")):
    os.remove(old)

MAX_CHUNK = 36 * 1024

def read(rel):
    return open(os.path.join(src, rel), encoding="utf-8").read()

def long_string(text):
    level = 5
    while f"]{'=' * level}]" in text or f"[{'=' * level}[" in text:
        level += 1
    eq = "=" * level
    return f"[{eq}[\n{text}]{eq}]"

HEADER = """-- GLOW UP installer {n} of {total} ({title}).
-- HOW TO USE: stop any running test, paste this WHOLE script into the Command Bar
-- (the bar at the bottom of Studio) and press Enter. Then run the next installer.
local RS = game:GetService("ReplicatedStorage")
local SSS = game:GetService("ServerScriptService")
local SPS = game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts")

local function remove(parent, name)
	for _, child in parent:GetChildren() do
		if child.Name == name then
			child:Destroy()
		end
	end
end

local function getOrMake(class, name, parent)
	local existing = parent:FindFirstChild(name)
	if existing and existing.ClassName == class then
		return existing
	end
	if existing then
		existing:Destroy()
	end
	local inst = Instance.new(class)
	inst.Name = name
	inst.Parent = parent
	return inst
end

local created = 0
local function put(class, name, parent, source)
	local inst = getOrMake(class, name, parent)
	inst.Source = source
	created += 1
	return inst
end
"""

CLEAN = """
-- Clear anything from earlier versions of the game (including Starlight Sprint).
remove(RS, "Shared")
remove(RS, "Net")
remove(RS, "Action")
remove(RS, "Popup")
remove(SSS, "Main")
remove(SPS, "Client")
remove(SPS, "Hud")
remove(SPS, "Extras")
"""

def chunked(items):
    """items: list of (code_line, size). Greedy split by size."""
    chunks, cur, size = [], [], 0
    for code, sz in items:
        if cur and size + sz > MAX_CHUNK:
            chunks.append(cur)
            cur, size = [], 0
        cur.append(code)
        size += sz
    if cur:
        chunks.append(cur)
    return chunks

# ---- gather every item with its target ----
shared = []
for n in ["Config", "Util", "Audio", "UI"]:
    text = read(f"shared/{n}.luau")
    shared.append((f'put("ModuleScript", "{n}", shared, {long_string(text)})', len(text)))

server = []
text = read("server/Main/init.server.luau")
server.append((f'put("Script", "Main", SSS, {long_string(text)})', len(text)))
for f in sorted(os.listdir(os.path.join(src, "server/Main/Modules"))):
    n = f[:-5]
    text = read(f"server/Main/Modules/{f}")
    server.append((f'put("ModuleScript", "{n}", modules, {long_string(text)})', len(text)))

client = []
text = read("client/Client/init.client.luau")
client.append((f'put("LocalScript", "Client", SPS, {long_string(text)})', len(text)))
for f in sorted(os.listdir(os.path.join(src, "client/Client/Modules"))):
    n = f[:-5]
    text = read(f"client/Client/Modules/{f}")
    client.append((f'put("ModuleScript", "{n}", modules, {long_string(text)})', len(text)))

# ---- assemble ----
jobs = []  # (group, chunk)
for group, items in (("shared", shared), ("server", server), ("client", client)):
    for chunk in chunked(items):
        jobs.append((group, chunk))
total = len(jobs)
names = {"shared": "shared files", "server": "server", "client": "client"}
written = []
first_of = {}
for i, (group, chunk) in enumerate(jobs, start=1):
    first = group not in first_of
    first_of[group] = True
    parts = [HEADER.format(n=i, total=total, title=names[group])]
    if i == 1:
        parts.append(CLEAN)
    if group == "shared":
        parts.append('local shared = getOrMake("Folder", "Shared", RS)')
    elif group == "server":
        # Main must exist before its Modules folder can be created.
        if first:
            parts.append("\n".join(chunk[:1]))
            chunk = chunk[1:]
        parts.append('local modules = getOrMake("Folder", "Modules", SSS:WaitForChild("Main"))')
    else:
        if first:
            parts.append("\n".join(chunk[:1]))
            chunk = chunk[1:]
        parts.append('local modules = getOrMake("Folder", "Modules", SPS:WaitForChild("Client"))')
    parts.append("\n".join(chunk))
    last = i == total
    parts.append(
        f'print("GLOW UP installer {i}/{total} done (" .. created .. " scripts). '
        + ("All installed. Press Play!" if last else "Now run installer " + str(i + 1) + '.')
        + '")'
    )
    text = "\n".join(parts) + "\n"
    name = f"Install_{i}_of_{total}_{group}.lua"
    with open(os.path.join(out_dir, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    written.append(name)
    print(name, len(text) // 1024, "KB")

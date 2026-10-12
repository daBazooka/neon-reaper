"""Static checks that run without Roblox: analyzer on every file, module wiring, and that the client and server agree on
every message and attribute.   usage: python3 tests/static_checks.py   (from the figure-me-out folder)"""
import os, re, subprocess, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "src")
ANALYZE = os.environ.get("LUAU_ANALYZE", "/tmp/claude-0/lu/luau-analyze")
problems = []

def files():
    for d, _, fs in os.walk(SRC):
        for f in fs:
            if f.endswith(".luau"):
                yield os.path.join(d, f)

def read(rel):
    return open(os.path.join(SRC, rel)).read()

def text_of(kind):
    out = ""
    base = os.path.join(SRC, kind)
    for d, _, fs in os.walk(base):
        for f in fs:
            if f.endswith(".luau"):
                out += open(os.path.join(d, f)).read() + "\n"
    return out

# 1. analyzer: everything except the Roblox globals it cannot know about
ROBLOX = {"UDim2", "UDim", "Enum", "Vector2", "Vector3", "Color3", "CFrame", "Instance", "workspace", "game", "script", "task",
          "TweenInfo", "ColorSequence", "ColorSequenceKeypoint", "NumberSequence", "NumberSequenceKeypoint", "NumberRange", "Random",
          "Rect", "Ray", "RaycastParams", "OverlapParams", "BrickColor", "Font", "warn", "typeof", "shared", "tick", "time", "wait",
          "spawn", "delay", "require", "PhysicalProperties", "Region3", "Axes", "Faces", "Vector3int16", "Vector2int16", "DateTime"}
if os.path.exists(ANALYZE):
    for path in files():
        out = subprocess.run([ANALYZE, path], capture_output=True, text=True).stdout
        for line in out.splitlines():
            m = re.search(r"Unknown global '(\w+)'", line)
            if m and m.group(1) in ROBLOX:
                continue
            if any(k in line for k in ("LocalUnused", "ImportUnused", "FunctionUnused", "Type inference failed", "UnknownType")):
                continue
            if "Rules.luau" in line and "math.abs" in line:  # analyzer cannot follow table fields through a refinement
                continue
            if "init.server.luau" in line and "string.sub" in line:
                continue
            if line.strip():
                problems.append(line.replace(ROOT, ""))
else:
    print("(luau-analyze not found, skipping analyzer)")

# 2. every module that is required exists, and every module file is required by something
mods = {}
for kind in ("server/Main/Modules", "client/Client/Modules", "shared"):
    for f in os.listdir(os.path.join(SRC, kind)):
        if f.endswith(".luau"):
            mods.setdefault(kind, set()).add(f[:-5])
alltext = {p: open(p).read() for p in files()}
joined = "\n".join(alltext.values())
for kind, names in mods.items():
    for name in names:
        if not re.search(r"require\(.*\b" + name + r"\b", joined):
            problems.append(f"module {kind}/{name} is never required")
for p, text in alltext.items():
    for m in re.finditer(r"require\((?:script\.Parent|Modules|Shared)(?::WaitForChild\(\"(\w+)\"\)|\.(\w+))\)", text):
        n = m.group(1) or m.group(2)
        if not any(n in names for names in mods.values()):
            problems.append(f"{os.path.relpath(p, SRC)} requires missing module {n}")

server = text_of("server")
client = text_of("client")
shared = text_of("shared")

# 3. every message the server sends has a client handler, and every request the client sends has a server handler
sent = set(re.findall(r"Net\.(?:send|sendAll)\((?:[a-zA-Z_.]+, )?\"(\w+)\"", server))
sent |= set(re.findall(r"Net\.(?:send|sendAll)\(\s*\n\s*(?:[a-zA-Z_.]+,\s*\n\s*)?\"(\w+)\"", server))
sent |= {"toast"}  # Net.toast
handled = set(re.findall(r"function handlers\.(\w+)\(", read("client/Client/init.client.luau")))
for kind in sorted(sent - handled):
    problems.append(f"the server sends '{kind}' but the client has no handler for it")
for kind in sorted(handled - sent):
    problems.append(f"the client handles '{kind}' but the server never sends it")
asked = set(re.findall(r"(?:deps\.)?send\(\"(\w+)\"", client))
serving = set(re.findall(r"function handlers\.(\w+)\(", read("server/Main/init.server.luau")))
for kind in sorted(asked - serving):
    problems.append(f"the client asks for '{kind}' but the server has no handler")
for kind in sorted(serving - asked):
    problems.append(f"the server handles '{kind}' but the client never asks for it")

# 4. every attribute the client reads is written by the server
written = set(re.findall(r"SetAttribute\(\"(\w+)\"", server)) | {"It_"}
written |= {"EntityId", "Code", "Icon", "Alive", "Decoy"}
for name in sorted(set(re.findall(r"(?:player|p|source)?:?GetAttribute\(\"(\w+)\"\)", client))):
    if name not in written:
        problems.append(f"the client reads attribute '{name}' that the server never sets")
for name in sorted(set(re.findall(r"workspace:GetAttribute\(\"(\w+)\"\)", client))):
    if f'workspace:SetAttribute("{name}"' not in server:
        problems.append(f"the client reads workspace attribute '{name}' that the server never sets")

# 5. the two remotes exist in the right order (the test mocks and the client both rely on Action first)
s = read("server/Main/init.server.luau")
if not (0 <= s.find('action.Name = "Action"') < s.find('notify.Name = "Notify"')):
    problems.append("RemoteEvents must be created Action first, then Notify")

# 6. every Config item has a handler in Items.use or is permanent; hotkeys 1..8 are unique
cfg = read("shared/Config.luau")
keys = re.findall(r'Key = (\d)', cfg)
if sorted(keys) != [str(i) for i in range(1, 9)]:
    problems.append("item hotkeys must be 1 to 8, each used once")
items = read("server/Main/Modules/Items.luau")
for item_id in re.findall(r'Id = "(\w+)", Name = "[^"]+", Icon = "[^"]+", Key', cfg):
    if item_id in ("binos", "camera"):
        continue
    if f'id == "{item_id}"' not in items:
        problems.append(f"item '{item_id}' cannot be used (no branch in Items.use)")

# 7. things that must stay true
if "legacy" in joined.lower():
    problems.append("leftover 'legacy' code")
for pat in (r"(?<![\w.])wait\(", r"(?<![\w.:])spawn\(", r"(?<![\w.:])delay\("):
    if re.search(pat, joined):
        problems.append(f"deprecated global scheduler used: {pat}")
for word in ("claude", "anthropic", "sonnet", "opus"):
    if re.search(word, joined, re.I):
        problems.append(f"'{word}' appears in the source")
if "CharacterAutoLoads = false" not in s:
    problems.append("CharacterAutoLoads must be off (the match loop spawns characters)")
for d in ("README.md", "docs/GAME_CONCEPT.md"):
    if not os.path.exists(os.path.join(ROOT, d)):
        problems.append(f"{d} is missing")
# no remote message ever carries a player's number (it must be read off a forehead): look inside every Net.send(...) call
for m in re.finditer(r"Net\.(?:send|sendAll|toast)\(", server):
    depth, i = 1, m.end()
    while i < len(server) and depth:
        depth += {"(": 1, ")": -1}.get(server[i], 0)
        i += 1
    call = server[m.start():i]
    if re.search(r"\.number\b|maskNumber|\.shown\b", call):
        problems.append("a message sends a number to a client: " + call.replace("\n", " ")[:90])
# the results screen and the feed never show numbers either
for name in ("Results.luau", "Hud.luau"):
    if "number" in read("client/Client/Modules/" + name).replace("Number.Digits", ""):
        problems.append(name + " mentions 'number' (numbers must never be shown there)")

if "--verbose" in sys.argv:
    print("server sends:", sorted(sent), "\nclient handles:", sorted(handled), "\nclient asks:", sorted(asked), "\nserver serves:", sorted(serving))
print("static checks:", "OK" if not problems else f"{len(problems)} problems")
for p in problems:
    print("  -", p)
sys.exit(1 if problems else 0)

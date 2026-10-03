"""Static checks that run without Roblox: analyzer on every file, module wiring, and the "silent first entry" rules.
usage: python3 tests/static_checks.py   (from the glow-up folder)"""
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
            if "LocalUnused" in line or "ImportUnused" in line or "FunctionUnused" in line:
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
    for m in re.finditer(r"require\((?:script\.Parent|Modules|Shared)\.(\w+)\)", text):
        n = m.group(1)
        if not any(n in names for names in mods.values()):
            problems.append(f"{os.path.relpath(p, SRC)} requires missing module {n}")

# 3. a brand-new player sees nothing but arrows
guide = read("client/Client/Modules/Guide.luau")
if re.search(r"task\.spawn\(function\(\)\s*task\.wait\(1\.2\)", guide) or "First visit" in guide:
    problems.append("Guide opens by itself on the first visit")
init = read("client/Client/init.client.luau")
if 'Fx.announce("SUB 5"' in init:
    problems.append("a welcome banner is shown on first entry")
tut = read("client/Client/Modules/Tutorial.luau")
for bad in ("Audio.say", "Toasts.push", "Fx.announce", "TextLabel", "TutorialCard"):
    if bad in tut:
        problems.append(f"Tutorial.luau must stay silent (found {bad})")
if "DailyReady" in init and "TutStep" not in init:
    problems.append("daily-reward toast is not hidden from first-time players")

# 4. things that were removed must stay removed
for word in ("Shards", "Orbs", "StageRoof", "StagePillar", "shardSlots"):
    if re.search(r"\b" + word + r"\b", joined):
        problems.append(f"'{word}' is back in the code")

print("static checks:", "OK" if not problems else f"{len(problems)} problems")
for p in problems:
    print("  -", p)
sys.exit(1 if problems else 0)

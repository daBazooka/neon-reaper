import os
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, "..", "src")
def read(p): return open(os.path.join(root, p)).read()
out = [open(os.path.join(here, "mock_prelude.luau")).read(), open(os.path.join(here, "fmo_extra.luau")).read()]
out.append('local SharedN = node("Shared", RS)')
out.append('local function addSrc(parentNode, name, fn) local n = node(name, parentNode); sources[n] = fn; return n end')
for name in sorted(f[:-5] for f in os.listdir(os.path.join(root, "shared")) if f not in ("UI.luau",)):
    out.append(f'addSrc(SharedN, "{name}", function(script)\n{read("shared/"+name+".luau")}\nend)')
out.append('local MainN = node("Main", nil); local ModN = node("Modules", MainN)')
for m in sorted(f[:-5] for f in os.listdir(os.path.join(root, "server/Main/Modules"))):
    out.append(f'addSrc(ModN, "{m}", function(script)\n{read("server/Main/Modules/"+m+".luau")}\nend)')
out.append(f'sources[MainN] = function(script)\n{read("server/Main/init.server.luau")}\nend')
out.append(open(os.path.join(here, "server_scenario.luau")).read())
open("/tmp/claude-0/lu/fmo_server_test.luau", "w").write("\n".join(out))

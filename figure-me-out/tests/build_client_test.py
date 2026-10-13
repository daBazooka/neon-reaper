import os, sys
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, "..", "src")
def read(p): return open(os.path.join(root, p)).read()
out = [open(os.path.join(here, "mock_prelude.luau")).read(), open(os.path.join(here, "fmo_extra.luau")).read(), open(os.path.join(here, "fmo_client_extra.luau")).read()]
out.append('local SharedN = node("Shared", RS)')
out.append('local function addSrc(parentNode, name, fn) local n = node(name, parentNode); sources[n] = fn; return n end')
for name in sorted(f[:-5] for f in os.listdir(os.path.join(root, "shared"))):
    out.append(f'addSrc(SharedN, "{name}", function(script)\n{read("shared/"+name+".luau")}\nend)')
out.append('local ClientN = node("Client", nil); local ModN = node("Modules", ClientN)')
for m in sorted(f[:-5] for f in os.listdir(os.path.join(root, "client/Client/Modules"))):
    out.append(f'addSrc(ModN, "{m}", function(script)\n{read("client/Client/Modules/"+m+".luau")}\nend)')
out.append(f'sources[ClientN] = function(script)\n{read("client/Client/init.client.luau")}\nend')
scenario = sys.argv[1] if len(sys.argv) > 1 else "client_scenario.luau"
if not scenario.startswith("video"):
    out.append("do " + open(os.path.join(here, "legacy_pins.luau")).read().replace("LEGACY_CONFIG", "require(RS.children.Shared.children.Config)") + " end")
out.append(open(os.path.join(here, sys.argv[1] if len(sys.argv) > 1 else "client_scenario.luau")).read())
open("/tmp/claude-0/lu/" + (sys.argv[2] if len(sys.argv) > 2 else "fmo_client_test.luau"), "w").write("\n".join(out))

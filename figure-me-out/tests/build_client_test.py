import os
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
out.append(open(os.path.join(here, "client_scenario.luau")).read())
open("/tmp/claude-0/lu/fmo_client_test.luau", "w").write("\n".join(out))

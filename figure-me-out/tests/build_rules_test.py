import os
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, "..", "src", "shared")
out = ["MODULE_SOURCES = {}"]
for m in ["Util", "Config", "Rules"]:
    out.append(f'MODULE_SOURCES["{m}"] = [==[\n{open(os.path.join(root, m + ".luau")).read()}\n]==]')
out.append(open(os.path.join(here, "rules_test.luau")).read())
os.makedirs("/tmp/claude-0/lu", exist_ok=True)
open("/tmp/claude-0/lu/fmo_rules_test.luau", "w").write("\n".join(out))

import os
here = os.path.dirname(__file__)
src = open(os.path.join(here, "..", "src/server/Main/Modules/Lift.luau")).read()
test = open(os.path.join(here, "lift_test.luau")).read()
out = "LIFT_SOURCE = [==[\n" + src + "\n]==]\n" + test
open("/tmp/claude-0/lu/lift_test.luau", "w").write(out)

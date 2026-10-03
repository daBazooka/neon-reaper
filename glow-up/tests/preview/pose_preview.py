"""Draws side-view stick figures of every gym machine pose using the REAL Lift.pose() maths.
usage: python3 tests/preview/pose_preview.py out.png   (from the glow-up folder; needs the luau CLI and matplotlib)"""
import json, math, os, re, subprocess, sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

here = os.path.dirname(os.path.abspath(__file__))
lift = open(os.path.join(here, "../../src/server/Main/Modules/Lift.luau")).read()
# only the pure maths part of Lift is needed
start = lift.index("local function clamp")
end = lift.index("--------------------------------------------------------------------------------\n-- Finding the body parts")
lua = lift[start:end].replace("local Lift = {}", "") 
script = "local Lift = {}\n" + lua + """
local d = { u = 1.2, f = 1.1, thigh = 1.5, calf = 1.5 }
local out = {}
for _, kind in { "bench", "squat", "pullup", "cable", "bag" } do
	for _, level in { 0, 0.5, 1 } do
		local p = Lift.pose(kind, level, d)
		table.insert(out, string.format('{"k":"%s","l":%.2f,"sh":%.4f,"el":%.4f,"hip":%.4f,"knee":%.4f,"ankle":%.4f,"drop":%.4f,"rise":%.4f,"back":%.4f}', kind, level, p.shoulder or 0, p.elbow or 0, p.hip or 0, p.knee or 0, p.ankle or 0, p.drop or 0, p.rise or 0, p.back or 0))
	end
end
print("[" .. table.concat(out, ",") .. "]")
"""
open("/tmp/claude-0/preview/pose.luau", "w").write(script)
res = subprocess.run([os.environ.get("LUAU", "/tmp/claude-0/lu/luau"), "/tmp/claude-0/preview/pose.luau"], capture_output=True, text=True)
if res.returncode != 0:
    print(res.stderr[:1500]); sys.exit(1)
poses = json.loads(res.stdout)

U, F, TH, CA = 1.2, 1.1, 1.5, 1.5
HIP_Y, SHOULDER_Y, NECK_Y = 0.0, 1.5, 1.7

def rot(angle, length):
    # a limb hanging down (-Y) turned by +angle about X swings forward (-Z): returns (dy, dz)
    return -math.cos(angle) * length, -math.sin(angle) * length

def figure(p, kind):
    """points in the character's own (y up, z back) plane, root at the hips"""
    sh = (SHOULDER_Y, 0.0)
    ua = rot(p["sh"], U); elb = (sh[0] + ua[0], sh[1] + ua[1])
    fa = rot(p["sh"] + p["el"], F); hand = (elb[0] + fa[0], elb[1] + fa[1])
    hip = (HIP_Y, 0.0)
    th = rot(p["hip"], TH); knee = (hip[0] + th[0], hip[1] + th[1])
    ca = rot(p["hip"] - p["knee"], CA); foot = (knee[0] + ca[0], knee[1] + ca[1])
    pts = {"hip": hip, "shoulder": sh, "head": (2.3, 0.0), "elbow": elb, "hand": hand, "knee": knee, "foot": foot}
    return pts

def to_world(pts, root, lying):
    out = {}
    for k, (ly, lz) in pts.items():
        if lying:   # rotate +90 degrees about X: the head points toward +Z and the face points up
            wy, wz = -lz, ly
        else:
            wy, wz = ly, lz
        out[k] = (wz + root[1], wy + root[0])   # plot x = z (back), plot y = up
    return out

fig, axes = plt.subplots(1, 5, figsize=(25, 6), facecolor="#dfe9f3")
by_kind = {}
for p in poses:
    by_kind.setdefault(p["k"], []).append(p)
for ax, kind in zip(axes, ["bench", "squat", "pullup", "cable", "bag"]):
    ax.set_aspect("equal"); ax.set_facecolor("#f4f7fb")
    lying = kind == "bench"
    colors = ["#1f77b4", "#ff7f0e", "#d62728"]
    for p, col in zip(by_kind[kind], colors):
        pts = figure(p, kind)
        if kind == "bench":
            root = (3.7 - 0.0, 0.0)           # lying on the pad (pad top is ~0.6 below the root)
        elif kind == "squat":
            root = (3.0 - p["drop"], p["back"])
        elif kind == "pullup":
            above = SHOULDER_Y + U + F
            root = (8.5 - above + p["rise"], 0.0)
        else:
            root = (3.0, 0.0)
        w = to_world(pts, root, lying)
        lines = [("hip", "shoulder"), ("shoulder", "head"), ("shoulder", "elbow"), ("elbow", "hand"), ("hip", "knee"), ("knee", "foot")]
        for a, b in lines:
            ax.plot([w[a][0], w[b][0]], [w[a][1], w[b][1]], color=col, lw=3, alpha=0.9)
        ax.plot(*w["head"], "o", color=col, ms=14)
        ax.plot(*w["hand"], "s", color="black", ms=6)
    if kind == "bench":
        ax.plot([-3.5, 3.5], [3.1, 3.1], color="#555", lw=6)
    if kind == "pullup":
        ax.plot([-1.5, 1.5], [8.5, 8.5], color="#555", lw=4)
    ax.axhline(0.9, color="#8a6d3b", lw=2)
    ax.set_title(kind + "  (blue = level 0, orange = 0.5, red = 1)")
    ax.set_xlim(-5, 5); ax.set_ylim(0, 10)
plt.tight_layout()
plt.savefig(sys.argv[1], dpi=60)
print("ok")

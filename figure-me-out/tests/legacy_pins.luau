-- The older scenarios were written for the game before it was matched to the reference trailer: 3-digit numbers, 90-second matches,
-- the glass HUD, the six gadgets on keys 1 to 8, every extra off. They pin those settings here; the scenarios whose file name starts
-- with "video" test the shipped settings instead.
local C0 = LEGACY_CONFIG
C0.Number.Digits = 3; C0.Number.Min = 1; C0.Number.Max = 999
C0.Loadout.Enabled = false
C0.CarriedItems = { "flash", "smoke", "distraction", "scanner", "sprint", "decoy" }
C0.Hud.Style = "classic"
C0.Match.Length = 90
C0.Modes.Rotation = { "deathmatch", "team", "ctf" }
for _, m in C0.Modes.List do m.Length = nil end
C0.Modes.List.team.ScoreLimit = 15
C0.Modes.List.ctf.CaptureLimit = 2
for k in C0.Features do C0.Features[k] = false end
C0.Map.use("canyon") -- (the older scenarios were written for Waterfall Canyon; the shipped game starts on the School Yard)

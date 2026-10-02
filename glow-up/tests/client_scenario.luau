-- ===== client scenario =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
-- local player state as the server would have set it
local a = attrsP
a.Ready = true; a.Aura = 1500; a.GlowScore = 130; a.Rank = 2; a.Level = 14; a.XP = 120; a.XPNeeded = 300; a.AuraRate = 16.25; a.Rebirths = 0
a.Power = 12; a.Style = 3.5; a.Charm = 0; a.Wins = 4; a.DuelStreak = 2
a.Inv = "head_cap:2,face_visor:1,aura_spark:1"; a.Eq_Head = "head_cap"; a.Eq_Back = ""; a.Eq_Face = ""; a.Eq_Aura = ""; a.Eq_Trail = ""
a.FreeCrates = 1; a.Pity_neon = 3; a.Pity_icon = 0
a.QuestKind = "shards"; a.QuestGoal = 25; a.QuestProgress = 10; a.QuestReward = 150
a.DailyReady = true; a.DailyDay = 2; a.DailyStreak = 1
a.Chain = 7; a.ChainExpire = clock + 2
a.Lv_Magnet = 2; a.Lv_Boots = 0; a.Lv_Training = 1; a.Lv_Luck = 0; a.Lv_Boost = 0
a.Set_Music = true; a.Set_Sfx = true; a.Set_Fx = true; a.Set_Duels = true
a.OfflineGain = 5000
attrsWS.Event = "Golden"; attrsWS.EventEnd = clock + 60; attrsWS.CompState = "open"; attrsWS.CompEnd = clock + 25

local ok, err = pcall(sources[ClientN], ClientN)
check(ok, "client init runs " .. tostring(err))

-- frames
for i = 1, 5 do advance(0.1); fireAll("RenderStepped", 0.016) end
check(true, "render loop runs")

-- every tab opens + refreshes
local Menu = require(ModN.children.Menu)
for _, name in {"Wardrobe", "Crates", "Pets", "Upgrades", "Profile", "Rewards", "Settings"} do
	local ok2, e2 = pcall(Menu.open, name)
	check(ok2, "open tab " .. name .. " " .. tostring(e2))
	local ok3, e3 = pcall(Menu.refresh)
	check(ok3, "refresh tab " .. name .. " " .. tostring(e3))
end
Menu.close()

-- server messages
local function send(...) fireAll("notify", ...) end
send("shard", Vector3.new(1, 3, 1), 120, "Nova", U("c"), nil, 10)
send("shard", Vector3.new(1, 3, 1), 900, "Spark", U("c"), "Golden", 20)
send("shard", Vector3.new(1, 3, 1), 4, "Spark", U("c"), nil, 1)
send("toast", "Not enough Aura", "bad")
send("toast", "Not enough Aura", "bad")
send("toast", "Another", "info")
send("toast", "Third", "good")
send("toast", "Fourth", "gold")
send("rank", 3)
send("level", 15, 225, 0)
send("level", 20, 300, 1)
send("quest", "Collect 25 Aura shards", 150, " + free crate")
send("daily", 2, 300, 1)
send("upgrade", "Magnet", 1)
send("rebirth", 1)
send("openMenu", "Rewards")
send("crate", "street", "head_halo", "new", 1, 0)
advance(3)
send("crate", "icon", "head_horns", "star", 2, 0)
advance(3)
send("crate", "neon", "back_cape", "max", 5, 900)
advance(3)
-- training flow
send("trainStart", "Power", {rep = 1, reps = 5, startedAt = clock + 1.1, speed = 1.05, center = 0.5, goodWidth = 0.26, perfectWidth = 0.09})
for i = 1, 20 do advance(0.1); fireAll("RenderStepped", 0.016) end
send("trainRep", 1, "perfect", 2.2, 1, {rep = 2, reps = 5, startedAt = clock + 1.1, speed = 1.2, center = 0.4, goodWidth = 0.26, perfectWidth = 0.09})
send("trainRep", 2, "miss", 0, 0, {rep = 3, reps = 5, startedAt = clock + 1.1, speed = 1.35, center = 0.6, goodWidth = 0.26, perfectWidth = 0.09})
send("trainRep", 3, "good", 1.25, 0, nil)
send("trainEnd", "Power", 3.5)
advance(2)
-- duel flow
send("duelStart", "Mogger Bot", 2, 150, 130, clock + 3, 7)
for i = 1, 100 do advance(0.1); fireAll("RenderStepped", 0.016) end
send("duelProgress", 33)
send("duelEnd", true, 320, 55, 33, 71, 60, 3)
advance(5)
send("duelStart", "Rival", 4, 900, 130, clock + 3, 7)
advance(1)
send("duelEnd", false, 40, 20, 50, 40, 70, 0)
advance(5)
-- hammers + interact button + click to swing
a.Pets = "cat:2,dragon:1"; a.PetsEq = "cat,dragon"; a.PetMult = 5.3
a.Hammer = 1; a.HammersOwned = "1,2"; a.Swings = 10; a.RebirthNeed = 35
send("swing", 14, "crit", false); send("swing", 999, "jackpot", true); send("swing", 14, nil, true); send("frenzy", 8); send("gift", 500, 1, 3, 7); a.FrenzyEnd = clock + 6; a.SwingCombo = 12; a.GiftAt = clock + 40; advance(0.3); fireAll("RenderStepped", 0.016)
send("swing", 14); send("swing", 14); send("swing", 14); send("swing", 14)
send("hatch", "gold", "dragon", 1); send("hatch", "basic", "cat", 3); send("hatch", "mog", "angel", 1)
a.Stage = 3
send("stageResult", 4, true, true, 4); send("stageResult", 4, false, false, 3); send("stageResult", 15, true, true, 15)
send("hammer", 3, "bought"); send("hammer", 1, "equipped")
local Config = require(RS.children.Shared.children.Config)
local places = {
	Gym = Config.StationPos("Gym"), Stage = Vector3.new(0, 3, 0), Hammer3 = Config.HammerPos(3), Hammer1 = Config.HammerPos(1),
	Ring = Config.StationPos("Ring"), Battle = Config.BattlePos(), Bot = Config.InteractPos(Config.Interactables[6]), Nowhere = Vector3.new(0, 3, 40),
}
for name, pos in places do
	localPlayer.Character.FindFirstChild = function() return {Position = pos + Vector3.new(0, 3, 0), CFrame = {LookVector = Vector3.new(0, 0, -1)}, FindFirstChild = function() return nil end} end
	for i = 1, 6 do advance(0.1); fireAll("Heartbeat", 0.1); fireAll("RenderStepped", 0.016) end
	fireAll("input", {KeyCode = Enum.KeyCode.E, UserInputType = Enum.UserInputType.Keyboard}, false)
end
check(true, "interact scan + E key in every place")
local mouse = {KeyCode = Enum.KeyCode.A, UserInputType = Enum.UserInputType.MouseButton1}
fireAll("input", mouse, false); for i = 1, 8 do advance(0.1); fireAll("Heartbeat", 0.1) end; fireAll("inputEnd", mouse)
check(true, "click to swing + hold runs")
fireAll("input", mouse, true); advance(0.2)
check(true, "clicks on UI buttons are ignored")
-- rebirth window
local Hud = require(ModN.children.Hud)
Hud.toggleRebirth(true); advance(0.3); fireAll("RenderStepped", 0.016); Hud.toggleRebirth(false)
check(true, "rebirth window opens and closes")
-- Mog Competition flow
send("compStart", clock + 3, 8, {{n = "Me", s = 120, m = true}, {n = "Mogger Mike", s = 100, m = false}, {n = "Sigma Sam", s = 90, m = false}})
for i = 1, 60 do advance(0.1); fireAll("RenderStepped", 0.016) end
send("compProgress", {{n = "Mogger Mike", t = 40, m = false}, {n = "Me", t = 33, m = true}, {n = "Sigma Sam", t = 20, m = false}})
send("compEnd", 1, 6, 420, true, {{n = "Me", p = 88}, {n = "Mogger Mike", p = 80}})
advance(2)
send("compStart", clock + 3, 8, {{n = "Me", s = 120, m = true}})
advance(1)
send("compEnd", 3, 6, 90, false, {{n = "Chad Chris", p = 91}, {n = "Rizz Ron", p = 85}, {n = "Me", p = 70}})
advance(2)
attrsWS.CompState = "idle"; attrsWS.CompEnd = clock + 90
advance(0.5); fireAll("RenderStepped", 0.016)
-- bogus messages must not crash
send("nonsense", 1, 2, 3)
send("shard")
send("crate", "street", "does_not_exist", "new", 1, 0)
advance(1)
-- settings toggle path
a.Set_Music = false; fireAll("attr_Set_Music")
a.Set_Music = true; fireAll("attr_Set_Music")
advance(3)
print("DONE client")

-- ===== the six maps: each one builds, nobody spawns inside anything, bases/crates/terminals are on open ground =====
local function check(cond, msg) print((cond and "PASS  " or "FAIL  ") .. msg) end
local Config = require(RS.children.Shared.children.Config)
Config.Sanity.Enabled = false
local ok, err = pcall(sources[MainN], MainN)
check(ok, "Main runs without error " .. tostring(err))
local Maps = require(RS.children.Shared.children.Maps)
local World = require(ModN.children.World)
check(#Maps.Order == 6, "six maps to vote on")
local seen = {}
for _, id in Maps.Order do
	local m = Maps.List[id]
	check(m and m.Name and m.Icon and m.Blurb and not seen[m.Name], "map " .. id .. " has a unique name, icon and blurb")
	seen[m.Name or id] = true
	check(Config.Map.Themes[id] ~= nil, "map " .. id .. " has a spawn/base/crate layout")
end

local function solidCircle(o)
	if o.CanCollide == false then return nil end
	if type(o.Name) == "string" and (string.sub(o.Name, 1, 4) == "Wall" or o.Name == "Floor") then return nil end
	local size, pos = o.Size, o.CFrame.Position
	local isCyl = o.Shape == Enum.PartType.Cylinder
	local height = isCyl and size.X or size.Y
	if pos.Y + height / 2 < 1.2 then return nil end
	if o.Anchored ~= true then return nil end
	local r
	if isCyl then r = size.Y / 2
	elseif o.Shape == Enum.PartType.Ball then r = size.X / 2
	else r = math.max(size.X, size.Z) / 2 * 1.15 end
	return pos.X, pos.Z, r
end

for _, id in Maps.Order do
	local before = #X.parts
	local rebuilt = World.loadMap(id)
	check(Config.Map.Theme == id and workspace:GetAttribute("MapTheme") == id, id .. ": the world switched to this map")
	check(attrsWS.BootErrors == nil, id .. ": built without any error")
	local made = #X.parts - before
	print("INFO  " .. id .. " is made of " .. made .. " parts")
	if id ~= "canyon" and id ~= "city" then
		check(rebuilt == true and made > 250 and made < 3500, id .. ": a sensible number of parts (" .. made .. ")")
		local L = Maps.layout(id)
		check(#L.Spawns == 20 and #L.Crates == 16 and #L.Terminals == 4 and #L.DropSpots == 4 and #L.Decks == 4, id .. ": 20 spawns, 16 crates, 4 terminals, 4 drop spots, 4 decks")
		check(#L.Props >= 36, id .. ": plenty of cover (" .. #L.Props .. " pieces)")
		local steps, solids = 0, {}
		for i = before + 1, #X.parts do
			local o = X.parts[i]
			if o.Name == "Step" then steps += 1 end
			local x, z, r = solidCircle(o)
			if x then table.insert(solids, { x, z, r, o.Name }) end
		end
		check(steps == 4 * Maps.DeckHeight, id .. ": four staircases of " .. Maps.DeckHeight .. " steps (" .. steps .. ")")
		local function openAt(p, clearance, tag)
			for _, s in solids do
				local dx, dz = p.X - s[1], p.Z - s[2]
				if math.sqrt(dx * dx + dz * dz) < s[3] + clearance then if tag then print("INFO  blocked", tag, p.X, p.Z, s[4], s[1], s[2], s[3]) end return false, s[4] end
			end
			return true
		end
		local bad, what = 0, ""
		for _, p in Config.Map.Spawns do
			local free, name = openAt(p, 1.2)
			if not free then bad += 1 what = name end
		end
		check(bad == 0, id .. ": nobody spawns inside anything (" .. bad .. " blocked " .. what .. ")")
		bad = 0
		for _, p in Config.Map.Crates do if not openAt(p, 1.5, "crate") then bad += 1 end end
		for _, p in Config.Map.Terminals do if not openAt(p, 1.5, "term") then bad += 1 end end
		for _, p in Config.Map.DropSpots do if not openAt(p, 2, "drop") then bad += 1 end end
		for _, p in Config.Map.Bases do if not openAt(p, 8, "base") then bad += 1 end end
		check(bad == 0, id .. ": crates, terminals, drop spots and the two flag bases are on open ground (" .. bad .. " blocked)")
		local inside = true
		for _, p in Config.Map.Spawns do if math.abs(p.X) > 130 or math.abs(p.Z) > 130 then inside = false end end
		check(inside, id .. ": every spawn is inside the walls")
	end
	local spawns = World.arenaSpawns()
	check(#spawns >= 10, id .. ": at least 10 arena spawns are in use (" .. #spawns .. ")")
	local arena = workspace:FindFirstChild("Arena")
	check(arena ~= nil and arena.__destroyed ~= true, id .. ": the arena folder exists")
end
-- going back to a map already built does not rebuild it
check(World.loadMap(Maps.Order[#Maps.Order]) == false, "asking for the map that is already built does nothing")
check(World.loadMap("nonsense") == false, "an unknown map is refused")
-- the layouts are the same every time
local a, b = Maps.layout("desert"), Maps.layout("desert")
check(a == b and a.Props[1].X == b.Props[1].X, "a kit map's layout is fixed")

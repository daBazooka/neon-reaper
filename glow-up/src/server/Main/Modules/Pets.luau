-- SUB 5 TO TRUE ADAM: pets. Hatch eggs, equip up to 3; they follow you around (everyone sees them),
-- add to your Aura multiplier and earn Aura per second. The server decides every roll.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Pets = {}

local rng = Random.new()
local followers = {} -- player -> { { model, id } }
local folder

local SIZE = { Common = 1, Rare = 1.15, Epic = 1.3, Legendary = 1.5, Mythic = 1.75 }
local OFFSETS = { Vector3.new(-4, -1.4, 4.5), Vector3.new(0, -1.4, 7), Vector3.new(4, -1.4, 4.5) }

--------------------------------------------------------------------------------
-- Rolling
--------------------------------------------------------------------------------
local function rollPet(egg, luck)
	local lowest = math.huge
	for name in egg.Odds do
		lowest = math.min(lowest, Config.Rarities[name].Order)
	end
	local total, weights = 0, {}
	for _, name in Config.RarityOrder do
		local base = egg.Odds[name]
		if base then
			local w = Config.Rarities[name].Order == lowest and base or base * luck
			weights[name] = w
			total += w
		end
	end
	local roll = rng:NextNumber() * total
	local rarity = Config.RarityOrder[1]
	for _, name in Config.RarityOrder do
		local w = weights[name]
		if w then
			roll -= w
			rarity = name
			if roll <= 0 then
				break
			end
		end
	end
	local pool = {}
	for _, pet in Config.Pets do
		if pet.Rarity == rarity then
			table.insert(pool, pet)
		end
	end
	return pool[rng:NextInteger(1, #pool)]
end

function Pets.hatch(p, eggId)
	local egg = Config.EggById[eggId]
	local profile = Data.get(p)
	if not egg or not profile then
		return
	end
	if not Stats.spend(p, egg.Cost) then
		Stats.toast(p, "Not enough Aura for a " .. egg.Name, "bad")
		return
	end
	local pet = rollPet(egg, Config.LuckMult(profile.Levels.Luck or 0))
	local copies = (profile.Pets[pet.Id] or 0) + 1
	profile.Pets[pet.Id] = copies
	profile.Hatched += 1
	-- A new pet goes straight into an empty slot.
	if #profile.PetsEq < Config.PetSlots and not table.find(profile.PetsEq, pet.Id) then
		table.insert(profile.PetsEq, pet.Id)
	end
	Stats.recompute(p)
	Stats.addXP(p, 5)
	Pets.refresh(p)
	Stats.send(p, "hatch", egg.Id, pet.Id, copies)
end

function Pets.equip(p, id)
	local profile = Data.get(p)
	if not profile or not profile.Pets[id] or not Config.PetById[id] then
		return
	end
	if table.find(profile.PetsEq, id) then
		return
	end
	if #profile.PetsEq >= Config.PetSlots then
		Stats.toast(p, "All " .. Config.PetSlots .. " pet slots are full. Unequip one first.", "bad")
		return
	end
	table.insert(profile.PetsEq, id)
	Stats.recompute(p)
	Pets.refresh(p)
end

function Pets.unequip(p, id)
	local profile = Data.get(p)
	local at = profile and table.find(profile.PetsEq, id)
	if not at then
		return
	end
	table.remove(profile.PetsEq, at)
	Stats.recompute(p)
	Pets.refresh(p)
end

function Pets.handle(p, kind, id)
	if kind == "Hatch" and type(id) == "string" then
		Pets.hatch(p, id)
	elseif kind == "PetEquip" and type(id) == "string" then
		Pets.equip(p, id)
	elseif kind == "PetUnequip" and type(id) == "string" then
		Pets.unequip(p, id)
	end
end

--------------------------------------------------------------------------------
-- Followers (simple models made of balls)
--------------------------------------------------------------------------------
local function ball(model, name, size, color, material)
	local part = Instance.new("Part")
	part.Name = name
	part.Shape = Enum.PartType.Ball
	part.Size = Vector3.one * size
	part.Color = color
	part.Material = material or Enum.Material.SmoothPlastic
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Massless = true
	part.Parent = model
	return part
end

local function buildPet(pet)
	local s = SIZE[pet.Rarity] or 1
	local model = Instance.new("Model")
	model.Name = "Pet_" .. pet.Id
	local body = ball(model, "Body", 2.4 * s, pet.Color)
	model.PrimaryPart = body
	local offsets = { [body] = CFrame.new() }
	local function add(part, cf)
		offsets[part] = cf
	end
	add(ball(model, "Head", 1.9 * s, pet.Color), CFrame.new(0, 1.7 * s, -0.3 * s))
	for side = -1, 1, 2 do
		add(ball(model, "Eye", 0.5 * s, Color3.new(1, 1, 1)), CFrame.new(side * 0.45 * s, 1.95 * s, -1.05 * s))
		add(ball(model, "Pupil", 0.25 * s, Color3.new(0, 0, 0)), CFrame.new(side * 0.45 * s, 1.95 * s, -1.25 * s))
		if pet.Style == "ears" or pet.Style == "mane" then
			add(ball(model, "Ear", 0.7 * s, pet.Color), CFrame.new(side * 0.8 * s, 2.7 * s, -0.2 * s))
		elseif pet.Style == "floppy" then
			add(ball(model, "Ear", 0.8 * s, pet.Color:Lerp(Color3.new(0, 0, 0), 0.25)), CFrame.new(side * 1.05 * s, 1.9 * s, -0.2 * s))
		elseif pet.Style == "horns" then
			add(ball(model, "Horn", 0.55 * s, Color3.fromRGB(250, 240, 220)), CFrame.new(side * 0.7 * s, 2.8 * s, -0.2 * s))
		elseif pet.Style == "fin" then
			add(ball(model, "Fin", 0.6 * s, pet.Color:Lerp(Color3.new(1, 1, 1), 0.3)), CFrame.new(side * 1.3 * s, 0.3 * s, 0))
		end
	end
	if pet.Style == "mane" then
		add(ball(model, "Mane", 2.8 * s, Color3.fromRGB(190, 110, 30)), CFrame.new(0, 1.7 * s, 0.4 * s))
	elseif pet.Style == "fin" then
		add(ball(model, "Fin", 0.7 * s, pet.Color:Lerp(Color3.new(1, 1, 1), 0.3)), CFrame.new(0, 3 * s, 0))
	elseif pet.Style == "halo" then
		local halo = Instance.new("Part")
		halo.Name = "Halo"
		halo.Shape = Enum.PartType.Cylinder
		halo.Size = Vector3.new(0.2, 1.8 * s, 1.8 * s)
		halo.Color = Color3.fromRGB(255, 232, 120)
		halo.Material = Enum.Material.SmoothPlastic
		halo.Anchored, halo.CanCollide, halo.CanQuery, halo.CanTouch, halo.Massless = true, false, false, false, true
		halo.Parent = model
		add(halo, CFrame.new(0, 3.1 * s, -0.3 * s) * CFrame.Angles(0, 0, math.pi / 2))
		local light = Instance.new("PointLight")
		light.Color = pet.Color
		light.Range = 12
		light.Brightness = 1
		light.Parent = body
	end
	add(ball(model, "Tail", 0.9 * s, pet.Color), CFrame.new(0, 0.2 * s, 1.4 * s))
	return model, offsets
end

local function clearFollowers(p)
	local list = followers[p]
	if list then
		for _, f in list do
			f.model:Destroy()
		end
	end
	followers[p] = nil
end

-- Rebuilds the visible pets so they match the equipped list.
function Pets.refresh(p)
	clearFollowers(p)
	local profile = Data.get(p)
	local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
	if not profile or not root or not folder then
		return
	end
	local list = {}
	for i, id in profile.PetsEq do
		local pet = Config.PetById[id]
		if pet then
			local model, offsets = buildPet(pet)
			model.Parent = folder
			local cf = root.CFrame * CFrame.new(OFFSETS[i] or OFFSETS[2])
			table.insert(list, { model = model, offsets = offsets, slot = i, cf = cf })
		end
	end
	followers[p] = list
end

function Pets.release(p)
	clearFollowers(p)
end

function Pets.init()
	folder = Instance.new("Folder")
	folder.Name = "GlowPets"
	folder.Parent = workspace
	local last = 0
	RunService.Heartbeat:Connect(function(dt)
		local now = os.clock()
		if now - last < 0.05 then
			return
		end
		last = now
		for p, list in followers do
			local root = p.Character and p.Character:FindFirstChild("HumanoidRootPart")
			if root then
				for _, f in list do
					local target = root.CFrame * CFrame.new(OFFSETS[f.slot] or OFFSETS[2]) * CFrame.new(0, math.sin(now * 3 + f.slot) * 0.4, 0)
					f.cf = f.cf:Lerp(target, 0.3)
					-- face the same way as the owner
					local flat = CFrame.new(f.cf.Position) * (root.CFrame - root.CFrame.Position)
					for part, off in f.offsets do
						part.CFrame = flat * off
					end
				end
			end
		end
	end)
end

return Pets

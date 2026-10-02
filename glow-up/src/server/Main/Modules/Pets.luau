-- SUB 5 TO TRUE ADAM: pets. Hatch eggs, equip up to 3; they follow you around (everyone sees them),
-- add to your Aura multiplier and earn Aura per second. The server decides every roll.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Pets = {}

local rng = Random.new()

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
-- Followers are drawn on every player's own screen (see PetsView on the client), so the server has nothing to build.
--------------------------------------------------------------------------------
function Pets.refresh() end
function Pets.release() end
function Pets.init() end

return Pets

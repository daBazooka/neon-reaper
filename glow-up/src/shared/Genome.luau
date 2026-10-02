-- SUB 5 TO TRUE ADAM: every player gets their own face and body, decided by their user id (so it is always the same
-- for the same person, and different from everyone else). Level then decides how goofy or chiselled it looks.
local Genome = {}

local EYE_COLORS = {
	Color3.fromRGB(88, 56, 32), Color3.fromRGB(52, 34, 22), Color3.fromRGB(128, 100, 52), Color3.fromRGB(70, 130, 84),
	Color3.fromRGB(70, 120, 190), Color3.fromRGB(130, 144, 156), Color3.fromRGB(176, 120, 40), Color3.fromRGB(120, 180, 220),
}
local HAIR_COLORS = {
	Color3.fromRGB(24, 20, 18), Color3.fromRGB(48, 32, 22), Color3.fromRGB(88, 58, 34), Color3.fromRGB(150, 110, 60),
	Color3.fromRGB(200, 160, 80), Color3.fromRGB(150, 60, 34), Color3.fromRGB(110, 110, 112),
}
local HAIRSTYLES = { "swept", "quiff", "slick", "buzz", "long", "swept", "quiff" }
local BEARDS = { "none", "none", "none", "none", "stubble", "stubble", "stubble", "goatee", "goatee", "full", "full" }

local cache = {}

-- Returns the same table for the same user id every time.
function Genome.get(userId)
	if cache[userId] then
		return cache[userId]
	end
	local rng = Random.new((userId % 2147483647) * 7919 + 13)
	local function range(a, b)
		return a + (b - a) * rng:NextNumber()
	end
	local g = {
		eyeColor = EYE_COLORS[rng:NextInteger(1, #EYE_COLORS)],
		eyeSize = range(0.85, 1.2),
		eyeSpacing = range(0.88, 1.18),
		eyeTilt = range(-0.12, 0.14),
		browThick = range(0.8, 1.35),
		browAngle = range(-0.12, 0.28),
		noseSize = range(0.8, 1.25),
		noseWidth = range(0.85, 1.25),
		mouthWidth = range(0.85, 1.2),
		lip = range(0.6, 1.4),
		jaw = range(0.8, 1.3),
		cheek = range(0.8, 1.25),
		ear = range(0.85, 1.25),
		hairColor = HAIR_COLORS[rng:NextInteger(1, #HAIR_COLORS)],
		beard = BEARDS[rng:NextInteger(1, #BEARDS)],
		mole = rng:NextNumber() < 0.3 and (rng:NextNumber() < 0.5 and -1 or 1) or 0,
		scar = rng:NextNumber() < 0.12 and (rng:NextNumber() < 0.5 and -1 or 1) or 0,
		freckles = rng:NextNumber() < 0.25,
		hairStyle = HAIRSTYLES[rng:NextInteger(1, #HAIRSTYLES)],
		chadStubble = rng:NextNumber() < 0.55, -- a light stubble once the face is fully chiselled
		skinShift = range(-0.3, 0.5), -- negative = lighter, positive = darker
		height = range(0.95, 1.06),
		width = range(0.94, 1.07),
		depth = range(0.95, 1.06),
		head = range(0.94, 1.07),
	}
	cache[userId] = g
	return g
end

-- Skin colour for a level, adjusted for this person.
function Genome.skin(base, g)
	if g.skinShift >= 0 then
		return base:Lerp(Color3.fromRGB(86, 56, 38), g.skinShift)
	end
	return base:Lerp(Color3.fromRGB(246, 224, 206), -g.skinShift * 0.8)
end

return Genome

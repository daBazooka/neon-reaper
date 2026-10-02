-- SUB 5 TO TRUE ADAM: the first-time tutorial. Five short steps that teach the core loop (swing, hammer, train, pet,
-- battle), each with a small gift so the next step is possible. The step number is saved; players can skip it.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Tutorial = {}

local DONE = #Config.Tutorial + 1
local base = {} -- player -> { step, value } counter value when the step began
local gifted = {} -- player -> highest step already gifted

local function counter(profile, step)
	if step == 1 then
		return profile.Swings
	elseif step == 3 then
		return profile.Reps
	elseif step == 4 then
		return profile.Hatched or 0
	elseif step == 5 then
		return profile.Duels
	end
	return 0
end

local function enter(p, profile, step)
	base[p] = { step = step, value = counter(profile, step) }
	p:SetAttribute("TutStep", step)
	p:SetAttribute("TutGoal", Config.Tutorial[step] and Config.Tutorial[step].Goal or 0)
	p:SetAttribute("TutProgress", 0)
	local def = Config.Tutorial[step]
	if def and def.Gift and (gifted[p] or 0) < step then
		gifted[p] = step
		if profile.Aura < def.Gift then
			Stats.addAura(p, def.Gift - math.floor(profile.Aura), { raw = true })
		end
	end
end

function Tutorial.init(p)
	local profile = Data.get(p)
	local step = math.clamp(profile.Tut or 1, 1, DONE)
	profile.Tut = step
	enter(p, profile, step)
end

function Tutorial.skip(p)
	local profile = Data.get(p)
	if profile and profile.Tut < DONE then
		profile.Tut = DONE
		p:SetAttribute("TutStep", DONE)
	end
end

local function advance(p, profile)
	local step = profile.Tut + 1
	profile.Tut = step
	if step >= DONE then
		p:SetAttribute("TutStep", DONE)
		Stats.addAura(p, Config.TutorialReward.Aura, { raw = true })
		Stats.addFreeCrates(p, Config.TutorialReward.Crates)
		Stats.send(p, "tutorialDone", Config.TutorialReward.Aura, Config.TutorialReward.Crates)
	else
		Stats.send(p, "tutorialStep", step)
		enter(p, profile, step)
	end
end

-- Called once a second.
function Tutorial.tick(p)
	local profile = Data.get(p)
	if not profile or profile.Tut >= DONE then
		return
	end
	local step = profile.Tut
	if not base[p] or base[p].step ~= step then
		enter(p, profile, step)
	end
	local def = Config.Tutorial[step]
	local done
	if step == 2 then
		done = profile.HammersOwned["2"] ~= nil
	else
		local progress = counter(profile, step) - base[p].value
		local goal = def.Goal or 1
		p:SetAttribute("TutProgress", math.min(progress, goal))
		done = progress >= goal
	end
	if done then
		advance(p, profile)
	end
end

function Tutorial.release(p)
	base[p] = nil
	gifted[p] = nil
end

return Tutorial

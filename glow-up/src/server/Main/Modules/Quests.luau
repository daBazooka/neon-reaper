-- SUB 5 TO TRUE ADAM: an endless chain of small goals. There is always exactly one active quest.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Quests = {}

local function writeQuest(p, quest)
	p:SetAttribute("QuestKind", quest.Kind)
	p:SetAttribute("QuestGoal", quest.Goal)
	p:SetAttribute("QuestReward", quest.Reward)
	p:SetAttribute("QuestProgress", quest.Progress or 0)
end

local function newQuest(p)
	local profile = Data.get(p)
	local q = Config.MakeQuest(profile.QuestsDone, profile.Rebirths)
	q.Progress = 0
	profile.Quest = q
	writeQuest(p, q)
end

function Quests.init(p)
	local profile = Data.get(p)
	local q = profile.Quest
	if type(q) == "table" and q.Kind and q.Goal and q.Reward then
		writeQuest(p, q)
	else
		newQuest(p)
	end
end

-- absolute = true means "progress is the max value reached" (not used by current quests, kept for flexibility).
function Quests.progress(p, kind, amount, absolute)
	local profile = Data.get(p)
	local q = profile and profile.Quest
	if not q or q.Kind ~= kind then
		return
	end
	q.Progress = absolute and math.max(q.Progress, amount) or q.Progress + amount
	if q.Progress < q.Goal then
		p:SetAttribute("QuestProgress", q.Progress)
		return
	end

	profile.QuestsDone += 1
	Stats.addAura(p, q.Reward, { raw = true })
	Stats.addXP(p, 25 + profile.QuestsDone * 5)
	local bonus = ""
	if profile.QuestsDone % 5 == 0 then
		Stats.addFreeCrates(p, 1)
		bonus = " + free crate"
	end
	Stats.send(p, "quest", Config.QuestText(q.Kind, q.Goal), q.Reward, bonus)
	newQuest(p)
end

return Quests

-- SUB 5 TO TRUE ADAM: client audio. Pitched pickup notes, fanfares and generative ambient music.
-- Everything is built from a few short sounds, so it works without uploading anything.
-- If a sound can't be loaded it is skipped silently (see the Output window for a note).
local SoundService = game:GetService("SoundService")
local ContentProvider = game:GetService("ContentProvider")
local Debris = game:GetService("Debris")

local Config = require(script.Parent:WaitForChild("Config"))

local Audio = {}

local PENTATONIC = { 0, 2, 4, 7, 9 }
local templates = {} -- name -> loaded Sound, or false when it failed to load
local sfxGroup, musicGroup
local musicEnabled = true
local customMusic
local started = false

local function makeGroup(name, volume)
	local g = Instance.new("SoundGroup")
	g.Name = name
	g.Volume = volume
	g.Parent = SoundService
	return g
end

function Audio.Init()
	if started then
		return
	end
	started = true
	sfxGroup = makeGroup("StarlightSfx", Config.SfxVolume)
	musicGroup = makeGroup("StarlightMusic", Config.MusicVolume)

	local reverb = Instance.new("ReverbSoundEffect")
	reverb.DecayTime = 3
	reverb.Density = 1
	reverb.Diffusion = 1
	reverb.DryLevel = -4
	reverb.WetLevel = 0
	reverb.Parent = musicGroup

	local folder = Instance.new("Folder")
	folder.Name = "StarlightAudioTemplates"
	folder.Parent = SoundService

	for name, id in Config.Sounds do
		if id ~= "" then
			local s = Instance.new("Sound")
			s.Name = name
			s.SoundId = id
			s.Parent = folder
			task.spawn(function()
				pcall(function()
					ContentProvider:PreloadAsync({ s })
				end)
				if s.TimeLength > 0 then
					templates[name] = s
				else
					templates[name] = false
					warn("[TrueAdam Audio] Could not load '" .. name .. "' (" .. id .. "). Paste a working sound id in Config.Sounds.")
				end
			end)
		end
	end
end

local function playOn(group, name, speed, volume)
	local t = templates[name]
	if not t or not group then
		return
	end
	local s = t:Clone()
	s.PlaybackSpeed = speed or 1
	s.Volume = volume or 0.5
	s.SoundGroup = group
	s.Parent = SoundService
	s:Play()
	Debris:AddItem(s, math.max(0.6, t.TimeLength / s.PlaybackSpeed + 0.4))
end

function Audio.play(name, speed, volume)
	playOn(sfxGroup, name, speed, volume)
end

-- Step n of a rising major-pentatonic scale (so a long combo literally plays a melody).
local function noteSpeed(step)
	local i = (step - 1) % 5 + 1
	local octave = math.floor((step - 1) / 5) % 2
	return 0.7 * 2 ^ ((PENTATONIC[i] + octave * 12) / 12)
end
Audio.noteSpeed = noteSpeed

local function arpeggio(steps, gap, volume)
	task.spawn(function()
		for _, step in steps do
			Audio.play("Tone", noteSpeed(step), volume or 0.6)
			task.wait(gap)
		end
	end)
end

function Audio.pickup(combo, rank)
	local speed = noteSpeed(math.max(1, combo))
	Audio.play("Tone", speed, 0.5 + math.min(rank, 4) * 0.08)
	if rank >= 2 then
		Audio.play("Tone", speed * 1.5, 0.35) -- a fifth above for richer orbs
	end
	if rank >= 3 then
		Audio.play("Bass", 1.1, 0.5)
	end
end

function Audio.click()
	Audio.play("Click", 1.1, 0.5)
end

function Audio.purchase()
	arpeggio({ 3, 5, 8 }, 0.06, 0.55)
end

function Audio.levelUp()
	arpeggio({ 1, 3, 5, 8, 10, 13 }, 0.07, 0.7)
	Audio.play("Flash", 1, 0.4)
end

function Audio.quest()
	arpeggio({ 2, 4, 6, 9 }, 0.08, 0.65)
end

function Audio.milestone(combo)
	local base = math.max(1, combo // 5)
	arpeggio({ base, base + 2, base + 4 }, 0.05, 0.6)
end

function Audio.event()
	arpeggio({ 10, 8, 6, 4, 1 }, 0.1, 0.6)
end

function Audio.ascend()
	arpeggio({ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 }, 0.06, 0.7)
	Audio.play("Flash", 0.8, 0.6)
end

function Audio.daily()
	arpeggio({ 5, 8, 10 }, 0.09, 0.6)
end

function Audio.hatchTick(i)
	Audio.play("Tone", 0.8 + i * 0.1, 0.5)
end

function Audio.equip()
	arpeggio({ 4, 8 }, 0.05, 0.5)
end

function Audio.error()
	Audio.play("Bass", 0.7, 0.5)
end

function Audio.rank()
	arpeggio({ 1, 3, 5, 8, 10, 13, 15 }, 0.08, 0.75)
	Audio.play("Flash", 1, 0.5)
end

function Audio.win()
	arpeggio({ 3, 5, 8, 10, 13 }, 0.07, 0.7)
	Audio.play("Flash", 1, 0.5)
end

function Audio.lose()
	arpeggio({ 8, 6, 4 }, 0.12, 0.5)
end

function Audio.crateTick(i)
	Audio.play("Tone", 0.9 + (i % 6) * 0.08, 0.35)
end

function Audio.countdown(final)
	Audio.play("Tone", final and 2.2 or 1.2, 0.6)
end

function Audio.setSfx(on)
	if sfxGroup then
		sfxGroup.Volume = on and Config.SfxVolume or 0
	end
end

-- rank: 1 Common .. 6 Mythic
function Audio.reveal(rank)
	local steps = {}
	for i = 1, 2 + rank do
		steps[i] = i * 2 - 1
	end
	arpeggio(steps, 0.08, 0.7)
	if rank >= 4 then
		Audio.play("Flash", 1, 0.7)
		Audio.play("Bass", 0.8, 0.7)
	end
end

--------------------------------------------------------------------------------
-- Music
--------------------------------------------------------------------------------
function Audio.setMusic(on)
	musicEnabled = on
	if musicGroup then
		musicGroup.Volume = on and Config.MusicVolume or 0
	end
	if customMusic then
		customMusic.Volume = on and 1 or 0
	end
end

function Audio.musicOn()
	return musicEnabled
end

function Audio.startMusic()
	if Config.MusicTrackId ~= "" then
		customMusic = Instance.new("Sound")
		customMusic.Name = "StarlightMusic"
		customMusic.SoundId = Config.MusicTrackId
		customMusic.Looped = true
		customMusic.Volume = 1
		customMusic.SoundGroup = musicGroup
		customMusic.Parent = SoundService
		customMusic:Play()
		return
	end

	-- Generative ambient: a slow minor progression with a soft bass pulse and random arpeggio notes.
	local ROOTS = { 0, 5, 3, 7 }
	local ARP = { 0, 3, 7, 10, 12, 15, 19 }
	local rng = Random.new()
	task.spawn(function()
		local tick, bar = 0, 0
		while true do
			task.wait(0.28)
			if musicEnabled and templates.Tone then
				local root = ROOTS[bar % #ROOTS + 1]
				if tick % 8 == 0 then
					playOn(musicGroup, templates.Bass and "Bass" or "Tone", 2 ^ ((root - 12) / 12), 0.5)
				end
				if rng:NextNumber() < 0.65 then
					local semis = root + ARP[rng:NextInteger(1, #ARP)]
					playOn(musicGroup, "Tone", 0.5 * 2 ^ (semis / 12), 0.12 + rng:NextNumber() * 0.12)
				end
			end
			tick += 1
			if tick % 16 == 0 then
				bar += 1
			end
		end
	end)
end

return Audio

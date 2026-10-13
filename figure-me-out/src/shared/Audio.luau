-- FIGURE ME OUT: client audio. Short effects and a tense generated spy-thriller loop, all built from a few sounds that
-- ship with Roblox, so nothing has to be uploaded. If a sound can't be loaded it is skipped silently.
local SoundService = game:GetService("SoundService")
local ContentProvider = game:GetService("ContentProvider")
local Debris = game:GetService("Debris")

local Config = require(script.Parent:WaitForChild("Config"))

local Audio = {}

local MINOR = { 0, 3, 5, 7, 10 } -- minor pentatonic
local templates = {} -- name -> loaded Sound, or false when it failed to load
local sfxGroup, musicGroup
local musicEnabled, sfxEnabled = true, true
local customMusic
local started = false
local intense = false -- the last 30 seconds: faster, louder

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
	sfxGroup = makeGroup("FmoSfx", Config.SfxVolume)
	musicGroup = makeGroup("FmoMusic", Config.MusicVolume)
	local reverb = Instance.new("ReverbSoundEffect")
	reverb.DecayTime = 1.8
	reverb.Density = 1
	reverb.Diffusion = 1
	reverb.DryLevel = -3
	reverb.WetLevel = -9
	reverb.Parent = musicGroup
	local folder = Instance.new("Folder")
	folder.Name = "FmoAudioTemplates"
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
					warn("[FigureMeOut Audio] Could not load '" .. name .. "' (" .. id .. "). Paste a working sound id in Config.Sounds.")
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

-- Step n of a rising minor-pentatonic scale.
local function noteSpeed(step)
	local i = (step - 1) % 5 + 1
	local octave = math.floor((step - 1) / 5) % 2
	return 0.7 * 2 ^ ((MINOR[i] + octave * 12) / 12)
end
Audio.noteSpeed = noteSpeed

local function run(steps, gap, volume, name)
	task.spawn(function()
		for _, step in steps do
			Audio.play(name or "Tone", noteSpeed(step), volume or 0.6)
			task.wait(gap)
		end
	end)
end

function Audio.click()
	Audio.play("Click", 1.1, 0.5)
end

function Audio.snap()
	Audio.play("Flash", 1.4, 0.55)
	Audio.play("Click", 0.7, 0.6)
end

function Audio.hit() -- you guessed right
	run({ 3, 5, 8, 10 }, 0.06, 0.65)
	Audio.play("Bass", 0.9, 0.7)
end

function Audio.miss() -- you guessed wrong
	Audio.play("Bass", 0.5, 0.9)
	run({ 8, 5, 2 }, 0.1, 0.45)
end

function Audio.kill() -- somebody else went out
	Audio.play("Tone", noteSpeed(2), 0.3)
	Audio.play("Bass", 0.7, 0.35)
end

function Audio.lose() -- you went out
	run({ 6, 4, 2, 1 }, 0.16, 0.6)
	Audio.play("Bass", 0.4, 1)
end

function Audio.win()
	run({ 1, 3, 5, 8, 10, 13, 15 }, 0.08, 0.7)
	Audio.play("Bass", 0.9, 0.7)
end

function Audio.stun()
	Audio.play("Bass", 0.6, 0.8)
	Audio.play("Click", 0.5, 0.6)
end

-- the ringing in your ears after a flashbang
function Audio.ring()
	task.spawn(function()
		for i = 1, 8 do
			Audio.play("Tone", 3.2 - i * 0.12, 0.55 / (1 + i * 0.25))
			task.wait(0.12)
		end
	end)
end

function Audio.warn() -- covering your number
	Audio.play("Tone", 1.9, 0.5)
	Audio.play("Bass", 1.2, 0.35)
end

function Audio.siren()
	task.spawn(function()
		for i = 1, 6 do
			Audio.play("Tone", i % 2 == 0 and 2.2 or 1.5, 0.55)
			task.wait(0.14)
		end
	end)
end

function Audio.snitch() -- someone tried to guess you
	Audio.play("Tone", 2.4, 0.55)
	Audio.play("Click", 1.6, 0.6)
end

function Audio.pickup()
	run({ 5, 8, 10 }, 0.05, 0.55)
end

function Audio.use()
	Audio.play("Click", 0.8, 0.6)
end

function Audio.reveal()
	task.spawn(function()
		for i = 1, 6 do
			Audio.play("Bass", 0.5 + i * 0.1, 0.8)
			task.wait(0.18)
		end
		Audio.play("Flash", 0.8, 0.8)
	end)
end

function Audio.countdown(n, final)
	Audio.play("Tone", final and 1.6 or 1.0, 0.7)
end

function Audio.tick()
	Audio.play("Click", 1.8, 0.25)
end

function Audio.error()
	Audio.play("Bass", 0.6, 0.6)
end

function Audio.lifeLost()
	run({ 8, 5, 3, 1 }, 0.09, 0.6)
	Audio.play("Bass", 0.55, 0.9)
end

function Audio.scan()
	run({ 1, 3, 5, 8 }, 0.07, 0.4)
end

function Audio.bounty()
	run({ 5, 5, 8 }, 0.1, 0.55)
	Audio.play("Bass", 0.8, 0.6)
end

function Audio.flagTaken() -- somebody picked up a flag
	run({ 5, 8, 5 }, 0.09, 0.55)
	Audio.play("Bass", 0.7, 0.6)
end

function Audio.flagDropped()
	run({ 8, 5, 3 }, 0.08, 0.4)
end

function Audio.capture() -- a flag was brought home
	run({ 1, 3, 5, 8, 10 }, 0.07, 0.65)
	Audio.play("Bass", 0.9, 0.7)
end

function Audio.event()
	run({ 8, 6, 8, 10 }, 0.12, 0.55)
end

function Audio.assist()
	run({ 3, 6 }, 0.07, 0.45)
end

function Audio.setSfx(on)
	sfxEnabled = on
	if sfxGroup then
		sfxGroup.Volume = on and Config.SfxVolume or 0
	end
end

function Audio.setMusic(on)
	musicEnabled = on
	if musicGroup then
		musicGroup.Volume = on and Config.MusicVolume or 0
	end
	if customMusic then
		customMusic.Volume = on and 1 or 0
	end
end

-- The final stretch of a match: the music speeds up.
function Audio.setIntensity(on)
	intense = on == true
end

function Audio.musicOn()
	return musicEnabled
end

function Audio.sfxOn()
	return sfxEnabled
end

-- A looping song id from the Creator Store can be pasted into Config.MusicTrackId. Without one, a tense 118 BPM
-- spy-thriller loop plays: a heartbeat kick, a creeping bass line and a sparse lead.
function Audio.startMusic()
	if Config.MusicTrackId ~= "" then
		customMusic = Instance.new("Sound")
		customMusic.Name = "FmoMusic"
		customMusic.SoundId = Config.MusicTrackId
		customMusic.Looped = true
		customMusic.Volume = 1
		customMusic.SoundGroup = musicGroup
		customMusic.Parent = SoundService
		customMusic:Play()
		return
	end
	local STEP = 60 / 118 / 4
	local KICK = { 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0 }
	local TICK = { 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0 }
	local BASS = { [1] = true, [4] = true, [8] = true, [11] = true, [14] = true }
	local ROOTS = { 0, 0, -2, -5 }
	local LEADS = {
		{ [1] = 12, [7] = 10, [13] = 7 },
		{ [1] = 12, [5] = 15, [9] = 12, [13] = 10 },
		{ [1] = 10, [7] = 8, [13] = 7 },
		{ [1] = 7, [5] = 8, [9] = 10, [15] = 12 },
	}
	task.spawn(function()
		local step, bar = 0, 0
		while true do
			task.wait(intense and STEP * 0.78 or STEP)
			local s = step % 16 + 1
			if s == 1 then
				bar += 1
			end
			if musicEnabled and templates.Tone then
				local pattern = (bar - 1) % 4 + 1
				if KICK[s] == 1 or (intense and s % 4 == 1) then
					playOn(musicGroup, templates.Bass and "Bass" or "Tone", 0.5, 0.9)
				end
				if TICK[s] == 1 and templates.Click then
					playOn(musicGroup, "Click", 2.2, s % 8 == 3 and 0.2 or 0.12)
				end
				if BASS[s] then
					playOn(musicGroup, templates.Bass and "Bass" or "Tone", 0.6 * 2 ^ (ROOTS[pattern] / 12), 0.5)
				end
				local lead = LEADS[pattern][s]
				if lead then
					playOn(musicGroup, "Tone", 0.5 * 2 ^ (lead / 12), 0.17)
				end
			end
			step += 1
		end
	end)
end

return Audio

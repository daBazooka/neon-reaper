-- FIGURE ME OUT: the camera. The server works out who is in the picture and which digits you could actually read, so
-- the album can't be cheated and smoke, walls and turned backs all matter.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Vision = require(script.Parent.Vision)

local Photos = {}

local rng = Random.new()

-- Everything the camera at `origin` pointing along `look` can see. Returns a list of
-- { id, code, icon, text, distance, decoy } sorted nearest first.
function Photos.shotsFrom(origin, look, exceptId)
	local out = {}
	local function consider(id, head, code, icon, shown, decoy)
		local inside, distance = Rules.inCone(origin, look, head.Position, Config.Photo.HalfAngle, Config.Photo.MaxDistance)
		if not inside or Vision.blocked(origin, head.Position, true) then
			return
		end
		local toCamera = (origin - head.Position).Unit
		local facing = head.CFrame.LookVector:Dot(toCamera)
		local readable = Rules.photoReadable(distance, facing, { rng:NextNumber(), rng:NextNumber(), rng:NextNumber() })
		table.insert(out, {
			id = id,
			code = code,
			icon = icon,
			text = Rules.photoText(shown, readable),
			distance = distance,
			decoy = decoy,
		})
	end
	for _, other in State.aliveList() do
		if other.id ~= exceptId then
			local head = Vision.head(other)
			if head then
				consider(other.id, head, other.code, other.icon, other.shown or other.number, false)
			end
		end
	end
	for _, d in State.decoys do
		local head = d.model and d.model:FindFirstChild("Head")
		if head then
			consider(d.id, head, d.code, d.icon, d.number, true)
		end
	end
	table.sort(out, function(a, b)
		return a.distance < b.distance
	end)
	return out
end

function Photos.snap(p, origin, look)
	local e = State.byPlayer(p)
	if not e or State.phase ~= "play" or not e.alive then
		return
	end
	if typeof(origin) ~= "Vector3" or typeof(look) ~= "Vector3" or look.Magnitude < 0.1 then
		return
	end
	local now = State.now()
	if (e.blindUntil or 0) > now or now - (e.lastSnap or -100) < Config.Photo.Cooldown then
		return
	end
	local head = Vision.head(e)
	if not head or (origin - head.Position).Magnitude > 20 then
		return
	end
	e.lastSnap = now
	local shots = Photos.shotsFrom(origin, look.Unit, e.id)
	local list = {}
	for i, s in shots do
		if i > 8 then
			break
		end
		list[i] = { s.id, s.code, s.icon, s.text, math.floor(s.distance + 0.5) }
	end
	Net.send(p, "photo", list, now)
	return list
end

return Photos

-- FIGURE ME OUT: small shared helpers.
local Util = {}

-- 75 -> "1:15"
function Util.clock(seconds)
	seconds = math.max(0, math.floor(seconds))
	return string.format("%d:%02d", seconds // 60, seconds % 60)
end

function Util.lerp(a, b, t)
	return a + (b - a) * t
end

-- 1234 -> "1,234"
function Util.fmt(n)
	n = math.floor(n + 0.5)
	if n >= 1e6 then
		return string.format("%.1fM", n / 1e6)
	elseif n >= 1000 then
		local s = tostring(n)
		return s:sub(1, #s - 3) .. "," .. s:sub(-3)
	end
	return tostring(n)
end

-- "a:1,b:2" <-> { a = 1, b = 2 } (how item counts travel to the client)
function Util.encodeCounts(counts, order)
	local parts = {}
	for _, key in order do
		table.insert(parts, key .. ":" .. (counts[key] or 0))
	end
	return table.concat(parts, ",")
end

function Util.decodeCounts(text)
	local counts = {}
	for key, n in string.gmatch(text or "", "(%a+):(%d+)") do
		counts[key] = tonumber(n)
	end
	return counts
end

return Util

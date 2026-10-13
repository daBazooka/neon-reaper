-- prints every part the world builder made (used to draw pictures of the map)
local ok, err = pcall(sources[MainN], MainN)
for _, p in X.parts do
	local pos, size = p.Position, p.Size
	if type(pos) == "table" and type(size) == "table" and pos.X then
		print(string.format("PART|%s|%.2f|%.2f|%.2f|%.2f|%.2f|%.2f|%s|%s", tostring(p.Name), pos.X, pos.Y, pos.Z, size.X, size.Y, size.Z, tostring(p.CanCollide), tostring(p.Transparency)))
	end
end

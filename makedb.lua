#!/usr/bin/lua
local entries = {}

function string:split(pat)
	pat = pat or "%s+";
	local ret = {}
	
	local st, en = 0, 0;
	
	while true do
		local matchstart = en
		
		st, en = self:find(pat, en)
		
		if not st then 
			if matchstart > #self then
				table.insert(ret, '')
			else
				table.insert(ret, self:sub(matchstart))
			end
			break
		end
		
		if st <= matchstart then
			table.insert(ret, '')
		else		
			table.insert(ret, self:sub(matchstart, st-1))
		end
		
		en = en + 1
	end
	
	return ret;
end

local function entriescmp(a, b)
	if a[1] ~= b[1] then
		return a[1] < b[1]
	end
	
	if a[2] ~= b[2] then
		return a[2] > b[2]
	end
	
	for i=3,#a do
		if a[i] ~= b[i] then
			return a[i] < b[i]
		end
	end
	
	return true
end

local db = io.open("db.json", "w");

if not db then io.stderr:write("Erro ao abrir db.json para escrita") os.exit(-1) end

for l in io.lines() do
	if not string.match(l, "^%s*$") then
		local t = l:split(",");
		for i,v in ipairs(t) do
			if tonumber(v) == nil then
				t[i] = '"' .. v .. '"'
			end
		end
		table.insert(entries, t);
		print("Incluindo " .. t[#t] .. "...");
	end
end

table.sort(entries, entriescmp);

db:write("[\n")

for i,v in ipairs(entries) do
	db:write("\t[" .. table.concat(v, ",") .. "]");
	if i ~= #entries then
		db:write(",");
	end
	db:write("\n");
end

db:write("]\n")

db:close();
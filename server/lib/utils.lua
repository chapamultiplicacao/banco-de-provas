local setfenv = setfenv
local genv = _G
module(...)
setfenv(1, genv)

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

table.map = function(t, f)
	for i,v in pairs(t) do
		t[i] = f(v)
	end
	return t
end

table.mapi = function(t, f)
	for i,v in ipairs(t) do
		t[i] = f(v)
	end
	return t
end
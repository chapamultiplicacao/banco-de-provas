#!/usr/bin/lua
require 'utils'

local _G = _G

local
string, table, io, require, pairs, ipairs, tonumber, tostring, print
 = 
string, table, io, require, pairs, ipairs, tonumber, tostring, print

module(...)

local local_entriescmp = function(a, b)
	if a[1] ~= b[1] then
		return a[1] < b[1]
	end
	
	local a2, b2 = tonumber(a[2]) or 0, tonumber(b[2]) or 0
	
	if a2 ~= b2 then
		return a2 > b2
	end
	
	for i=3,#a do
		if a[i] ~= b[i] then
			return a[i] < b[i]
		end
	end
	
	return true
end

function insertionsort(t, cmp)
	for i=2,#t do
		for j=i,2,-1 do
			if cmp(t[j], t[j-1]) then
				t[j], t[j-1] = t[j-1], t[j]
			else
				break
			end
		end
	end
end

function updatedb(input, entries, set)
	input = input or io.stdin
	output = output or io.stdout
	entries = entries or {}
	entriesset = entriesset or {}
	
	local verb = VERBOSE
	local entriescmp = entriescmp or local_entriescmp
	local sorter = sorter or table.sort
	
	local updated = false
	
	for l in input:lines() do
		if not string.match(l, "^%s*$") then
			local t = l:split(",");
			
			if not set[t[#t]] then
				table.insert(entries, t);
				if verb then
					print("Incluindo " .. t[#t] .. "...");
				end
				set[t[#t]] = true
				updated = true
			end
		end
	end
	
	if not updated then
		return false
	end
	
	sorter(entries, entriescmp)
	
	return true
end

local function printtable(output, db, delim, indent)
	local nentries = #db
	
	if nentries == 0 then return end

	if delim then
		output:write(delim[1])
		output:write("\n")
	end
	
	local nfields = #db[1]

	for i,v in ipairs(db) do
		if indent then
			output:write("\t")
		end
		
		if delim then
			output:write(delim[1])
		end
		for _,w in ipairs(v) do
			if tonumber(w) == nil then
				output:write('"' .. w .. '"')
			else
				output:write(w)
			end
			
			if _ ~= nfields then
				output:write(',')
			end
		end
		if delim then
			output:write(delim[2])
		end
		
		if i ~= nentries then
			output:write(",")
		end
		
		output:write("\n")
	end

	if delim then
		output:write(delim[2])
		output:write("\n")
	end
end

print_master = function(output, db, set)
	output:write("local entries = ")
	printtable(output, db, {'{', '}'}, true)
	
	output:write("\n")
	
	output:write("local set = {}\n")
	for i in pairs(set) do
		output:write("set[\"" .. i .. "\"] = true\n")
	end
	
	output:write("\nreturn entries, set")
end

printdb = {}

printdb.lua = function(output, db, set)
	output:write("return ")
	printtable(output, db, {'{', '}'}, true)
end

printdb.json = function(output, db)
	printtable(output, db, {'[', ']'}, true)
end

printdb.csv = function(output, db)
	printtable(output, db, nil, false)
end
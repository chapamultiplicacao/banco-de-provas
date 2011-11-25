#!/usr/bin/lua
require 'dblib'

local optset = {}
optset['force'] = true
optset['isort'] = true

local outf = os.getenv("OUTFOLDER")

local opts = {}
local targets = {}
local hasmaster = false
local argv = {...}

for i,v in ipairs(argv) do
	local optend = false
	
	if v:sub(1,1) == "-" then
		if v:find("-", 2, true) == 2 then
			if optend or #v == 2 then
				optend = true
			else
				v = v:sub(3)
				local key, val = v:match("(%w+)=(.+)")
				if key == nil then
					key, val = v, true
				end
				
				if not optset[key] then
					io.stderr:write("Opção `" .. shopt .. "' não reconhecida.\n")
				else
					opts[key] = val
				end
			end
		else
			io.stderr:write("Parâmetro `" .. v .. "' inválido.\n")
		end
	else
		if v == "master" then
			hasmaster = true
		else
			targets[v] = true
		end
	end
end

local entries;
local set;

if hasmaster then
	if not opts.force then
		local olddb = loadfile("masterdb.lua")
		if olddb ~= nil then
			entries, set = olddb()
		end
	end
	
	if opts.isort then
		dblib.sorter = dblib.insertionsort
	end

	entries = entries or {}
	set = set or {}


	dblib.VERBOSE = true

	if dblib.updatedb(io.stdin, entries, set) then
		local db = io.open("masterdb.lua", "w")

		if not db then
			error("Impossível abrir `" .. "masterdb.lua" .. "'.\n")
			os.exit(-1)
		end
		
		dblib.print_master(db, entries, set)
		
		db:close()
	end
else
	local olddb = loadfile("masterdb.lua")
	if olddb ~= nil then
		entries, set = olddb()
	end
	
	entries = entries or {}
	set = set or {}
end

for fmt in pairs(targets) do
	if not dblib.printdb[fmt] then
		io.stderr:write("Formato `" .. fmt .. "' não reconhecido.\n")
	else
		local db = io.open(outf .. "/db." .. fmt, "w")
		
		if not db then
			error("Impossível abrir `" .. outf .. "/db." .. fmt .. "'.\n")
			os.exit(-1)
		end
		
		dblib.printdb[fmt](db, entries)
		
		db:close()
	end
end
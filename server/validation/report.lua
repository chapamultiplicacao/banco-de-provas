require 'utils'

local filename = ...

local sucfreq = io.read("*n")
io.read()
local sucs = io.read():split(",")
local fails = io.read():split(",")

local function quote(v) return '"' .. tostring(v) .. '"' end

print(filename)
print("Índice de sucesso: " .. sucfreq)
print("Sucessos: " .. table.concat(table.mapi(sucs, quote), " "))
print("Fracassos: " .. table.concat(table.mapi(fails, quote), " "))
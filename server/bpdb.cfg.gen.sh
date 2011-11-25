# Recebe:
# $1: Diretório de base para as operações de bpdb

if (which luajit2 >/dev/null 2>&1); then
	LUA=\'`which luajit2`\'
elif (which luajit >/dev/null 2>&1); then
	LUA=\'`which luajit`\'
elif (which lua >/dev/null 2>&1); then
	LUA=\'`which lua`\'
else
	echo "Erro: não há um interpretador de Lua instalado." 1>&2
	exit -1
fi


echo BASEFOLDER=\'$1\'
echo LUA=$LUA
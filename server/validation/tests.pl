# Variáveis definidas:
#
# $prof: Professor da disciplina
# $mat: Sigla da disciplina, em 7 caracteres alfanuméricos (e.g. mac0110)
# $ano: Ano da prova
# $desc: Descrição da prova (tal como "p1")
#
# $professor == $prof
# $materia == $mat
# $descricao == $desc
#
# Todas as variáveis contém estritamente letras minúsculas.

%tests = (
'professor' => qr/${prof}/oi,
'matéria' => qr/${mat}/oi,
'ano' => qr/${ano}/oi,
'descrição' => qr/${desc}/oi,
);

# formato: matéria ano professor descrição
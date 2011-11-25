#!/bin/bash

# Cada script .sh determina uma interface para uma etapa da validação.
# Todos os scripts recebem como único argumento o nome do arquivo pdf, e
# seguem uma cadeia de piping.
# 
# As interfaces são:
# 
# translatepdf.sh:
# Deve imprimir em stdout o conteúdo textual do arquivo pdf. Não recebe entrada.
# 
# preprocess.sh:
# Deve preprocessar o texto (recebido em stdin), necessariamente o convertendo para lower case e removendo acentos e outros símbolos diacríticos.
# Deve imprimir o texto preprocessado em stdout.
# 
# process.sh:
# Deve processar o texto (preprocessado, recebido em stdin), realizando os testes para verificar a sua validade.
# Deve impimir 3 linhas em stdout, na forma:
# FREQÜÊNCIA DE TESTES BEM SUCEDIDOS
# TESTES BEM SUCEDIDOS
# TESTES FRACASSADOS
# A primeira linha é um número real em [0, 1]. As duas linhas seguintes são listas de termos arbitrários separados por vírgulas.
# 
# reportvalidation.sh:
# Recebe o resultado dos testesDeve fazer algo com o resultado dos testes.

settmp;

cd validation

for i in mac0110_Fabio_P1_2003.pdf; do
	bash translatepdf.sh $i | bash preprocess.sh $i | bash process.sh $i | bash reportvalidation.sh $i
done

cd ..

cleartmp;
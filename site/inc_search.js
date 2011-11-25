// Armazena todos os campos/métodos associados à busca incremental
var inc = {};

/*
 * Opções internas. Não são configuráveis pelo usuário, apenas por edição do código-fonte.
 */
inc.internal_options = {
	// Forma em que o link para os arquivos das provas é apresentado. Pode ser 'button' ou 'text'.
	link_type: 'button',
	debug_info: false,
	errorbg: '#ff4444',
	regexbg: '#ffff55',
	completeregexbg: '#4ec0ff',
};

inc.default_options = {
	caseSensitive: false,
	nilIsntWildcard: false,
	regexEnabled: true,
};

inc.options = (function(){
	var ret = {};
	for(var i in inc.default_options) {
		ret[i] = inc.default_options[i];
	}
	
	return ret;
});

inc.nbsp = "\u00A0"

inc.nilstr = inc.nbsp;

/*
 * Associa os campos do formulário de busca aos seus identificadores numéricos.
 * Note que inc_desc corresponde à concatenação de inc_descpre e inc_descsuf.
 */
inc.fieldmap = {
	'inc_disciplina': 0,
	'inc_ano': 1,
	'inc_professor': 2,
	'inc_desc': 3,
};

inc.inversefieldmap = (
	function() {
		var ret = [];
		for(var i in inc.fieldmap) {
			ret[inc.fieldmap[i]] = i;
		}
		return ret;
	}
)();

/*
 * Armazena os valores associados aos campos de busca até a última atualização.
 */
inc.fieldstate = {
	'inc_disciplina': '',
	'inc_ano': '',
	'inc_professor': '',
	'inc_desc': '',
};

/*
 * Número de campos de busca.
 * É contabilizado como o número de chaves de inc.fieldmap.
 * __count__ é um método fornecido como extensão por alguns browsers, sendo uma
 * solução mais eficiente se presente.
 */
inc.nfields = (
	inc.fieldmap.__count__ !== undefined ?
		inc.fieldmap.__count__()
	:
		(
			function() { 
				var nfields = 0;
				
				for(var i in inc.fieldmap) {
					nfields++;
				}
				
				return nfields;
			}
		)()
);

/* Flags de erro */
inc.fielderrorf = new Array(inc.nfields);

/* Flags indicando modo regex */
inc.fieldregexf = new Array(inc.nfields);

/*
 * Assume inc.nfields < 32
 */
inc.visibilitymask = (1 << (inc.nfields)) - 1;

/*
 * Armazena uma lista ligada com as linhas escondidas
 * a cada alteração nos campos de busca.
 */
inc.stateList = (
	function() {
		var ret = [];
		
		for(var i = 0; i < inc.nfields; i++) {
			ret.push(new LinkedList());
		}
		
		return ret;
	}
)();

inc.visibleList = new LinkedList();
inc.invisibleList = new LinkedList();
inc.pendingList = new LinkedList();

/*
 * Resolve pendências
 */
inc.applyPending = function(whichfield) {	
	for(var iter = inc.pendingList.begin(); iter !== inc.pendingList.end(); iter = iter.next) {
		if(iter.value[1] == true)
			iter.value[0].show();
		else {
			iter.value[0].hide();
		}
		inc.pendingList.erase(iter);
		iter.value[0].pendingNode = null;
	}
}

/*
 * Normaliza s, em que 'normalizar' tem significado amplo.
 * Atualmente, apenas torna s lowercase se a busca for case insensitive.
 * Pode ser implementada de modo a remover acentos (caracteres diacríticos).
 */
inc.normalizeString = function(s) {
	if(inc.options.caseSensitive) {
		return s;
	} else {
		return s.toLowerCase();
	}
}

/*
 * Atualiza a busca para quando algum campo de busca é decrementado (i.e. reduzido).
 */
inc.decrementSearch = function(whichfield, newstring) {
	newstring = inc.normalizeString(newstring);
	var newlen = newstring.length;
	
	for(var iter = inc.invisibleList.begin(); iter !== inc.invisibleList.end(); iter = iter.next) {
		var matches = false;
		var candidate = iter.value.value(whichfield);
		
		if(!inc.options.nilIsntWildcard && candidate.length === 0) {
			matches = true;
		}
		else if(candidate.length >= newlen) {
			matches = (inc.normalizeString(candidate.substr(0, newlen)) == newstring);
		}
		
		if(matches) {
			iter.value.ref(whichfield);
		}
		else {
			iter.value.unref(whichfield);
		}
	}
	
	/*
	 * Necessário verificar as linhas que já tinham sido removidas anteriormente.
	 * Se o mecanismo de funcionamento da busca for alterado para só permitir a modificação de um caractere
	 * por vez, isto pode ser removido (utilizando ao invés uma lista ligada de estados de execução, a la programação funcional)
	 */
	for(var iter = inc.invisibleList.begin(); iter !== inc.invisibleList.end(); iter = iter.next) {
		for(var i = 0; i < inc.nfields; i++) {
			if(i == whichfield)
				continue;
			
			newstring = inc.fieldstate[inc.inversefieldmap[i]];
			newlen = newstring.length;
			
			var matches = false;
			var candidate = iter.value.value(i);
			
			if(!inc.options.nilIsntWildcard && candidate.length === 0) {
				matches = true;
			}
			else if(candidate.length >= newlen) {
				matches = (inc.normalizeString(candidate.substr(0, newlen)) == newstring);
			}
			
			if(matches) {
				iter.value.ref(i);
			}
			else {
				iter.value.unref(i);
			}
		}
	}
}

/*
 * Atualiza a busca para quando algum campo de busca é incrementado (i.e. aumentado).
 * oldstring é necessariamente um prefixo de newstring.
 */
inc.incrementSearch = function(whichfield, oldstring, newstring) {
	var oldlen = oldstring.length;
	var newlen = newstring.length;
	var suffix = inc.normalizeString(newstring.substr(oldlen, newlen - oldlen));
	for(var iter = inc.visibleList.begin(); iter !== inc.visibleList.end(); iter = iter.next) {
		var matches = true;
		var candidate = iter.value.value(whichfield);
		
		if(!inc.options.nilIsntWildcard && candidate.length === 0) {
			matches = true;
		}
		else if(candidate.length < newlen) {
			matches = false;
		}
		else {
			matches = (inc.normalizeString(candidate.substr(oldlen, newlen - oldlen)) == suffix);
		}
		
		if(!matches) {
			iter.value.unref(whichfield);
		}
	}
}

inc.REGEXmatch = function(whichfield, value) {
	var r;
	
	inc.regexmode(whichfield);
	
	if(value.length <= 1)
		return;
	
	var inner = value.substring(1, value.length-1)
	
	if(inner == '/' || (/[^\\]\//.test(inner))) {
		inc.seterror(whichfield);
		return;
	}
	
	if(value.substring(value.length-1, value.length) != '/' || inner.substring(inner.length-1, inner.length) == '\\') {
		return;
	}
	
	try {
		r = new RegExp(inner, (inc.options.caseSensitive ? "" : "i"));
		inc.clearerror(whichfield);
		inc.setbg(whichfield, inc.internal_options.completeregexbg);
	}
	catch(e) {
		inc.seterror(whichfield);
		console.log(e);
		return;
	}
	
	for(var iter = inc.invisibleList.begin(); iter !== inc.invisibleList.end(); iter = iter.next) {
		var matches;
		var candidate = iter.value.value(whichfield);
		
		if(!inc.options.nilIsntWildcard && candidate.length === 0) {
			matches = true;
		}
		else {
			matches = r.test(candidate);
		}
		
		if(matches) {
			iter.value.ref(whichfield);
		}
		else {
			iter.value.unref(whichfield);
		}
	}
	
	for(var iter = inc.visibleList.begin(); iter !== inc.visibleList.end(); iter = iter.next) {
		var matches;
		var candidate = iter.value.value(whichfield);
		
		if(!inc.options.nilIsntWildcard && candidate.length === 0) {
			matches = true;
		}
		else {
			matches = r.test(candidate);
		}
		
		if(matches) {
			iter.value.ref(whichfield);
		}
		else {
			iter.value.unref(whichfield);
		}
	}
}

/*
 * Atualiza a busca sem modificação de campos.
 * Serve para quando alguma opção de busca é alterada.
 */
inc.touch = function(whichfield) {
	if(whichfield == undefined) {
		for(var i = 0; i < inc.nfields; i++)
			inc.touch(i);
		return;
	}
	
	var newstring = inc.fieldstate[inc.inversefieldmap[whichfield]];
	
	if(inc.options.regexEnabled && newstring.substring(0,1) == "/") {
		inc.REGEXmatch(whichfield, newstring);
	}
	else {
		inc.clearflags(whichfield);
		
		var newlen = newstring.length;
		
		for(var iter = inc.invisibleList.begin(); iter !== inc.invisibleList.end(); iter = iter.next) {
			var matches = false;
			var candidate = iter.value.value(whichfield);
			
			if(!inc.options.nilIsntWildcard && candidate.length === 0) {
				matches = true;
			}
			else if(candidate.length >= newlen) {
				matches = (inc.normalizeString(candidate.substr(0, newlen)) == newstring);
			}
			
			if(matches) {
				iter.value.ref(whichfield);
			}
			else {
				iter.value.unref(whichfield);
			}
		}
		
		for(var iter = inc.visibleList.begin(); iter !== inc.visibleList.end(); iter = iter.next) {
			var matches = true;
			var candidate = iter.value.value(whichfield);
			
			if(!inc.options.nilIsntWildcard && candidate.length === 0) {
				matches = true;
			}
			else if(candidate.length < newlen) {
				matches = false;
			}
			else {
				matches = (inc.normalizeString(candidate.substr(0, newlen)) == newstring);
			}
			
			if(matches) {
				iter.value.ref(whichfield);
			}
			else {
				iter.value.unref(whichfield);
			}
		}
	}
	
	inc.applyPending(whichfield);
	
	if(inc.internal_options.debug_info) {
		console.log("---------------");
		console.log("# visible: " + inc.visibleList.size());
		console.log("# invisible: " + inc.invisibleList.size());
		console.log("---------------");
	}
}

/*
 * Classe para as linhas da tabela.
 */
inc.Entry = function(ind, position, DOMnode, DOMfieldnodes) {
	// Índice em entries[]
	this.index = ind;
	
	// Posição na tabela (contando de cima para baixo a partir de 0). Índice em entriesAt[].
	this.pos = position;
	
	// Nó HTML correspondente à linha.
	this.node = DOMnode;
	
	// Array com os nós (filhos de this.node) correspondentes aos campos de texto da linha, i.e. ao conteúdo de texto de suas colunas.
	this.fieldnodes = DOMfieldnodes;
	
	/*
	 * Bitfield que indica correspondência parciais. (this.mask & (1 << whichfield)) == true indica que this é match parcial para o campo whichfield.
	 * this deve ser visível sse this.mask == inc.visibilitymask, i.e. se for um match parcial para cada campo de busca.
	 */
	this.mask = inc.visibilitymask;
	
	// Indica se this está atualmente visível.
	this.visible = true;
	
	// Nó colocado em inc.visibleList ou inc.invisibleList, dependendo do estado de this.visible.
	this.visibilityNode = inc.visibleList.push_back(this);
	
	// Se a visibilidade de this precisa ser alterada, this.pendingNode !== null e é um nó de inc.pendingList.
	this.pendingNode = null;
	
	// Retorna o valor textual para a coluna whichfield da linha.
	this.value = function(whichfield) {
		var ret = this.fieldnodes[whichfield].nodeValue;
		
		if(ret === inc.nilstr)
			return "";
		else
			return ret;
	}
	
	this.hide = function() {
		this.node.style.display = "none";
		if(this.visible) {
			inc.visibleList.erase(this.visibilityNode);
			inc.invisibleList.push_back_node(this.visibilityNode);
		}
		this.visible = false;
	}
	
	this.show = function() {
		this.node.style.display = "";
		if(!this.visible) {
			inc.invisibleList.erase(this.visibilityNode);
			inc.visibleList.push_back_node(this.visibilityNode);
		}
		this.visible = true;
	}
	
	// Marca this como match parcial para o campo whichfield.
	this.ref = function(whichfield) {
		this.mask |= (1 << whichfield);
		
		if(this.mask === inc.visibilitymask) {
			if(!this.visible) {
				if(this.pendingNode === null)
					this.pendingNode = inc.pendingList.push_back([this, true]);
				else
					this.pendingNode.value[1] = true;
			}
			else {
				if(this.pendingNode !== null) {
					inc.pendingList.erase(this.pendingNode);
					this.pendingNode = null;
				}
			}
		}
	}
	
	// Desmarca this como match parcial para o campo whichfield.
	this.unref = function(whichfield) {
		this.mask &= ~(1 << whichfield);
		
		if(this.mask !== inc.visibilitymask) {
			if(this.visible) {
				if(this.pendingNode === null)
					this.pendingNode = inc.pendingList.push_back([this, false]);
				else
					this.pendingNode.value[1] = false;
			}
			else {
				if(this.pendingNode !== null) {
					inc.pendingList.erase(this.pendingNode);
					this.pendingNode = null;
				}
			}
		}
	}
}

/*
 * Armazena os nós html que caracterizam as linhas da tabela com as provas
 * Os índices associados a cada nó são uma convenção de representação invariante,
 * marcadas no campo index de Entry.
 */
inc.entries = [];

/*
 * Associa uma posição vertical (de cima para baixo) na tabela à Entry correspondente.
 */
inc.entriesAt = [];

(function() {
	var descfield = inc.fieldmap['inc_desc'];
	var defbg = document.getElementById(inc.inversefieldmap[0]).style.background;
	
	inc.setbg = function(whichfield, bg) {
		bg = (bg ? bg : defbg);
		
		var f;
		if(whichfield == descfield) {
			f = document.getElementById('inc_descsuf');
		}
		else {
			f = document.getElementById(inc.inversefieldmap[whichfield]);
		}
		
		f.style.background = bg;
	}
	
	inc.seterror = function(whichfield) {
		if(inc.fielderrorf[whichfield])
			return;
		
		inc.setbg(whichfield, inc.internal_options.errorbg);
		
		inc.fielderrorf[whichfield] = true;
	}
	
	inc.regexmode = function(whichfield) {
		inc.setbg(whichfield, inc.internal_options.regexbg);
		
		inc.fieldregexf[whichfield] = true;
	}
	
	inc.clearerror = function(whichfield) {
		if(!inc.fielderrorf[whichfield])
			return;
		
		if(inc.fieldregexf[whichfield])
			inc.setbg(whichfield, inc.internal_options.regexbg);
		else
			inc.setbg(whichfield);
		
		inc.fielderrorf[whichfield] = false;
		
	}
	
	inc.clearflags = function(whichfield) {
		inc.fielderrorf[whichfield] = false;
		inc.fieldregexf[whichfield] = false;
		
		inc.setbg(whichfield);
	}
	
})();

/*
 * OBSERVAÇÃO:
 * Atualmente os arrays inc.entries[] e inc.entriesAt[] não são utilizados.
 * Eles foram implementados para caso em atualizações futuras se deseje reordenar a tabela dinamicamente.
 * Nesta caso, o índice de inc.entries[] é uma invariante que caracteriza uma linha, enquanto o índice de
 * inc.entriesAt[] é um valor alterado dinamicamente que indica a sua posição na tabela.
 */

// Insere uma linha na tabela de resultados
inc.putline = function(ind, mat, ano, prof, desc, link) {
	var line = document.createElement('tr');
	var col;
	var fieldnodes = [];
	var tmp;
	
	col = document.createElement('td');
	tmp = document.createTextNode(mat);
	fieldnodes.push(tmp);
	col.appendChild(tmp);
	line.appendChild(col);
	
	col = document.createElement('td');
	tmp = document.createTextNode(ano);
	fieldnodes.push(tmp);
	col.appendChild(tmp);
	line.appendChild(col);
	
	col = document.createElement('td');
	tmp = document.createTextNode(prof);
	fieldnodes.push(tmp);
	col.appendChild(tmp);
	line.appendChild(col);
	
	col = document.createElement('td');
	tmp = document.createTextNode(desc);
	fieldnodes.push(tmp);
	col.appendChild(tmp);
	line.appendChild(col);
	
	if(inc.internal_options.link_type == 'text') {
		col = document.createElement('a');
		col.style.textDecoration = 'none';
		col.setAttribute("href", link);
		var hyperlink = document.createTextNode('Download');
		col.appendChild(hyperlink);
	}
	else if(inc.internal_options.link_type == 'button')
	{
		col = document.createElement('a');
		col.style.textDecoration = 'none';
		col.setAttribute("href", link);
		var prefix = document.createTextNode(inc.nbsp);
		var suffix = document.createTextNode(inc.nbsp);
		var linkbut = document.createElement('input');
		linkbut.setAttribute("type", 'button');
		linkbut.setAttribute("value", 'Download');
		col.appendChild(prefix);
		col.appendChild(linkbut);
		col.appendChild(suffix);
	}
	line.appendChild(col);
	
	inc.table.appendChild(line);
	
	var lineEntry = new inc.Entry(ind, ind, line, fieldnodes);
	inc.entries[ind] = lineEntry;
	inc.entriesAt[ind] = lineEntry;
}

// inc.table passa a armazenar a tabela com os resultados da busca.
inc.init = function(t) {
	inc.table = t;
	
	/*
	 * Para evitar race conditions, desabilita o formulário de busca
	 * até que o banco de dados tenha sido carregado.
	 */
	document.getElementById("incsearchform").style.display = 'none';
	
	inc.reset();
	
	/*
	 * Carrega o banco de dados do servidor.
	 * Em versões futuras isto pode ser substituído por um pedido
	 * CGI que gera o banco de dados dinamicamente, garantindo que
	 * este estará sempre atualizado.
	 */
	console.log('Fazendo requisição http...');
	$.ajax({
		url: "db/db.json",
		processData: true, // Já faz o parsing do arquivo através de jQuery.parseJSON();
		data: null,
		dataType: "json",
		error: function(x) {
			alert("Impossível ler o banco de dados.");
			console.log("Impossível ler o banco de dados.");
			console.log("responseText: " + x.responseText);
		},
		success: function(data){  
			var l = data.length;
			for(var i = 0; i < l; i++) {
				for(var j = 0; j < inc.nfields; j++) {
					if(data[i][j] == "") {
						data[i][j] = inc.nilstr;
					}
				}
				
				data[i].unshift(i);
				
				inc.putline.apply(this, data[i]);
			}
			
			console.log('Banco de dados carregado.')
			document.getElementById("incsearchform").style.display = '';
		},
	});
}

/*
 * Reseta a busca.
 * Por enquanto não é usado, e perdeu compatibilidade com as
 * últimas versões do código.
 */
inc.reset = function() {
	for(var i in inc.fieldstate) {
		inc.fieldstate[i] = '';
	}
	
	for(var i in inc.fieldmap) {
		if(i != 'inc_desc') {
			document.getElementById(i).value = "";
		}
	}
	
	for(var i in inc.default_options) {
		inc.options[i] = inc.default_options[i];
		document.getElementById(i).checked = inc.default_options[i];
	}
	
	document.getElementById("inc_descpre").selectedIndex = 0;
	document.getElementById("inc_descsuf").value = "";
	
	for(var iter = inc.invisibleList.begin(); iter !== inc.invisibleList.end(); iter = iter.next) {
		for(var i = 0; i < inc.nfields; i++)
			iter.value.ref(i);
	}
	
	for(var i = 0; i < inc.nfields; i++) {
		inc.clearflags(i);
		inc.applyPending(i);
	}
	
	
	if(!inc.invisibleList.empty()) {
		alert("Erro de lógica no script! inc.invisibleList deveria estar vazia.");
	}
}

/*
 * Retorna o maior prefixo comum às strings a e b.
 */
var commonsubstr = function(a, b) {
	var l = Math.min(a.length, b.length);
	var i = 0;
	
	for(i = 0; i < l; i++) {
		if(a.charAt(i) != b.charAt(i))
			break;
	}
	
	return a.substring(0, i);
}

/*
 * Consolida na tabela de resultados a alteração em algum campo de busca.
 * 
 * Como modificações extensas na estrutura html do documento são lentas,
 * este programa usa uma forma de lazy evaluation para apenas consolidar as modificações
 * necessárias. A alteração dos filtros de busca é feita parte a parte,
 * e os nós vão dinamicamente se inserindo na ou se removendo da fila inc.pendingList.
 * Após a seqüência de transformações, inc.pendingList é processada, efetuando
 * as alterações necessárias na estrutura do documento.
 */
inc.applychange = function(id, value) {
	var whichfield = inc.fieldmap[id];
	
	if(inc.options.regexEnabled && value.substring(0,1) == "/") {
		if(value == inc.fieldstate[id])
			return true;
		
		inc.REGEXmatch(whichfield, value);
	}
	else {
		if(inc.fieldregexf[whichfield]) {
			inc.clearflags(whichfield);
			
			inc.fieldstate[id] = value;
			
			inc.touch(whichfield);
			
			return true;
		}
		
		inc.clearerror(whichfield);		
		
		value = inc.normalizeString(value);
		
		if(value == inc.fieldstate[id])
			return true;
		
		//console.log('applychange (id: ' + id + ' ; value: ' + value + ')');
		
		var common = commonsubstr(value, inc.fieldstate[id]);
		var lenchange = common.length - inc.fieldstate[id].length;
		
		/*
		* Reduz o campo de busca à maior substring comum ao valor anterior e o novo valor.
		*/
		if(lenchange < 0) {
			inc.decrementSearch(whichfield, common);
			inc.applyPending(whichfield);
		}
		
		/*
		* Adiciona um sufixo ao campo de busca, a finalizando.
		*/
		if(value.length > common.length) {
			inc.incrementSearch(whichfield, common, value);
		}
	}
	
	inc.fieldstate[id] = value;
	
	/*
	 * Aplica as mudanças pendentes.
	 */
	inc.applyPending(whichfield);
	
	if(inc.internal_options.debug_info) {
		console.log("---------------");
		console.log("# visible: " + inc.visibleList.size());
		console.log("# invisible: " + inc.invisibleList.size());
		console.log("---------------");
	}
}

/*
 * Event handler para a modificação de algum campo de busca.
 */
inc.fieldchange = function(e) {	
	inc.applychange(e.id, e.value);
	
	return true;
}

/*
 * Event handler para a modificação da descrição da provas
 * (i.e. Prova/Lista/Provinha junto com um opcional número)
 * 
 * Não valida o campo numérico.
 * Isto é proposital, para permitir que provas com sufixos (tal como P1(2))
 * sejam buscadas. Como isto não é aparente no uso, provavalmente só quem
 * saberá deste 'hack' é quem ler o código fonte :P
 */
inc.descchange = (function() {
	var tipo = document.getElementById("inc_descpre");
	var num = document.getElementById("inc_descsuf");
	
	num.disabled = "1";
	
	// closure
	return function() {
		if(tipo.value.length == 0) {
			num.value = "";
			num.disabled = "1";
		} else {
			num.disabled = "";
		}
		
		return inc.fieldchange({id: "inc_desc", value: tipo[tipo.selectedIndex].value + num.value});
	};
})();

/*
 * Event handler para alterações nas opções de busca.
 * Assume que as opções são definidas por checkboxes.
 */
inc.optionchange = (function() {
	
	/*
	 * Define os valores padrão.
	 */
	for(var i in inc.options) {
		document.getElementById(i).checked = inc.options[i];
	}
	
	// closure
	return function(e) {
		if(inc.options[e.id] == e.checked)
			return true;
		
		inc.options[e.id] = e.checked;
		inc.touch();
		
		return true;
	};
})();
// Armazena todos os campos/métodos associados à busca incremental
var inc = {};

inc.options = {
	caseSensitive: false,
	nilIsWildcard: true,
};

inc.nilstr = "\u00A0";

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

inc.normalizeString = function(s) {
	if(inc.options.caseSensitive) {
		return s;
	} else {
		return s.toLowerCase();
	}
}

inc.decrementSearch = function(whichfield, newstring) {
	newstring = inc.normalizeString(newstring);
	var newlen = newstring.length;
	
	for(var iter = inc.invisibleList.begin(); iter !== inc.invisibleList.end(); iter = iter.next) {
		var matches = false;
		var candidate = iter.value.value(whichfield);
		
		if(inc.options.nilIsWildcard && candidate == inc.nilstr) {
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
	
	for(var iter = inc.invisibleList.begin(); iter !== inc.invisibleList.end(); iter = iter.next) {
		for(var i = 0; i < inc.nfields; i++) {
			if(i == whichfield)
				continue;
			
			newstring = inc.fieldstate[inc.inversefieldmap[i]];
			newlen = newstring.length;
			
			var matches = false;
			var candidate = iter.value.value(i);
			
			if(inc.options.nilIsWildcard && candidate == inc.nilstr) {
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

inc.incrementSearch = function(whichfield, oldstring, newstring) {
	var oldlen = oldstring.length;
	var newlen = newstring.length;
	var suffix = inc.normalizeString(newstring.substr(oldlen, newlen - oldlen));
	for(var iter = inc.visibleList.begin(); iter !== inc.visibleList.end(); iter = iter.next) {
		var matches = true;
		var candidate = iter.value.value(whichfield);
		
		if(inc.options.nilIsWildcard && candidate == inc.nilstr) {
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

inc.touch = function(whichfield) {
	if(whichfield == undefined) {
		for(var i = 0; i < inc.nfields; i++)
			touch(i);
		return;
	}
	
	var laststr = inc.fieldstate[inc.inversefieldmap[whichfield]];
	
	inc.decrementSearch(whichfield, laststr);
	inc.incrementSearch(whichfield, laststr, laststr);
}

/*
 * Classe para as linhas da tabela.
 * O campo node corresponde ao nó html associado à linha
 */
inc.Entry = function(ind, position, DOMnode, DOMfieldnodes) {
	this.index = ind;
	this.pos = position;
	this.node = DOMnode;
	this.fieldnodes = DOMfieldnodes;
	this.mask = inc.visibilitymask;
	this.visible = true;
	this.visibilityNode = inc.visibleList.push_back(this);
	this.pendingNode = null;
	
	this.value = function(whichfield) {
		return this.fieldnodes[whichfield].nodeValue;
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
 * marcadas no campo index de Entry
 */
inc.entries = [];

/*
 * Associa uma posição vertical (de cima para baixo) na tabela à Entry correspondente.
 */
inc.entriesAt = [];

/*
 * inc.busy e inc.pending são usados para contornar (na medida do possível)
 * os problemas que ocorrem por a JVM rodar em um processo distinto, ao mesmo
 * tempo em que o código de Javascript é necessariamente single-threaded.
 */
inc.busy = false;
inc.pending = null;

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
	
	col = document.createElement('a');
	col.style.textDecoration = 'none';
	col.setAttribute("href", link);
	/* 1 (hyperlink)
	var hyperlink = document.createTextNode('Download');
	col.appendChild(hyperlink);
	*/
	/* 2 (botão) */
	var prefix = document.createTextNode('\u00A0');
	var suffix = document.createTextNode('\u00A0');
	var linkbut = document.createElement('input');
	linkbut.setAttribute("type", 'button');
	linkbut.setAttribute("value", 'Download');
	col.appendChild(prefix);
	col.appendChild(linkbut);
	col.appendChild(suffix);
	
	line.appendChild(col);
	
	
	
	inc.table.appendChild(line);
	
	var lineEntry = new inc.Entry(ind, ind, line, fieldnodes);
	inc.entries[ind] = lineEntry;
	inc.entriesAt[ind] = lineEntry;
}

// inc.table passa a armazenar a tabela com os resultados da busca.
inc.init = function(t) {
	inc.table = t;
	
	console.log('Fazendo pedido http...');
	$.ajax({
		url: "db.json",
		processData: true,
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
	
	//inc.applet.resetAllStates();
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
 */
inc.applychange = function(name, value) {
	value = inc.normalizeString(value);
	
	if(value == inc.fieldstate[name])
		return true;
	
	//console.log('applychange (name: ' + name + ' ; value: ' + value + ')');
	
	var common = commonsubstr(value, inc.fieldstate[name]);
	var lenchange = common.length - inc.fieldstate[name].length;
	
	var whichfield = inc.fieldmap[name];
	
	if(lenchange < 0) {
		inc.decrementSearch(whichfield, common);
	}
	
	if(value.length > common.length) {
		inc.incrementSearch(whichfield, common, value);
	}
	
	inc.fieldstate[name] = value;
	
	inc.applyPending(whichfield);
	
	// DEBUG
	console.log("# visible: " + inc.visibleList.size());
	console.log("# invisible: " + inc.invisibleList.size());
	console.log("---------------");
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
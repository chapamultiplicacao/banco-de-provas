// Armazena todos os campos/métodos associados à busca incremental
var inc = {};

/*
 * Armazena os nós html que caracterizam as linhas da tabela com as provas
 * Os índices associados a cada nó são uma convenção de representação entre Java e Javascript
 */
inc.entries = [];

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
 * inc.busy e inc.pending são usados para contornar (na medida do possível)
 * os problemas que ocorrem por a JVM rodar em um processo distinto, ao mesmo
 * tempo em que o código de Javascript é necessariamente single-threaded.
 */
inc.busy = false;
inc.pending = null;

// inc.table passa a armazenar a tabela com os resultados da busca.
inc.init = function(t) {
	inc.table = t;
}

// Registra o objeto do applet de Java no campo inc.applet
inc.registerApplet = function(app) {
	inc.applet = app;
	console.log("Applet registrado em Javascript");
	document.getElementById("incsearchform").style.display = '';
}

// Insere uma linha na tabela de resultados
inc.putline = function(ind, mat, ano, prof, desc, link) {
	var line = document.createElement('tr');
	var col;
	
	col = document.createElement('td');
	col.appendChild(document.createTextNode(mat));
	line.appendChild(col);
	
	col = document.createElement('td');
	col.appendChild(document.createTextNode(ano));
	line.appendChild(col);
	
	col = document.createElement('td');
	col.appendChild(document.createTextNode(prof));
	line.appendChild(col);
	
	col = document.createElement('td');
	col.appendChild(document.createTextNode(desc));
	line.appendChild(col);
	
	col = document.createElement('a');
	col.setAttribute("href", link);
	/* 1 (hyperlink) */
	var hyperlink = document.createTextNode('Download');
	col.appendChild(hyperlink);
	/* 2 (botão)
	var linkbut = document.createElement('input');
	linkbut.setAttribute("type", 'button');
	linkbut.setAttribute("value", 'Download');
	col.appendChild(linkbut);
	*/
	
	line.appendChild(col);
	
	inc.table.appendChild(line);
	
	inc.entries[ind] = line;
}

// Esconde uma linha da tabela de resultados
inc.hide = function(ind) {
	inc.entries[ind].style.display = "none";
}

// Mostra uma linha da tabela de resultados
inc.show = function(ind) {
	inc.entries[ind].style.display = "";
}

/*
 * Reseta a busca.
 * Por enquanto não é usado, e acho provável que tenha se tornado
 * incompatível com as últimas versões do código Java.
 */
inc.reset = function() {
	for(var i in inc.fieldstate) {
		inc.fieldstate[i] = '';
	}
	
	inc.applet.resetAllStates();
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
	console.log('applychange (name: ' + name + ' ; value: ' + value + ')');
	
	if(value.length == 0) {
		if(inc.fieldstate[name].length > 0) {
			console.log('js: resetting state: ' + name);
			inc.applet.resetState(inc.fieldmap[name]);
			inc.fieldstate[name] = '';
		}
		return;
	}
	
	var common = commonsubstr(value, inc.fieldstate[name]);
	var lenchange = common.length - inc.fieldstate[name].length;
	
	var whichfield = inc.fieldmap[name];
	
	while(lenchange < 0) {
		inc.applet.ascend(whichfield);
		lenchange++;
	}
	
	for(var i = common.length; i < value.length; i++) {
		inc.applet.descend(value.charCodeAt(i), whichfield);
	}
	
	inc.fieldstate[name] = value;
	
	inc.applet.apply();
}

/*
 * Event handler para a modificação de algum campo de busca.
 */
inc.fieldchange = function(e) {
	if(inc.busy) {
		console.log("enqueued");
		inc.pending = {name: e.name, value: e.value};
		return true;
	}
	inc.busy = true;
	
	inc.applychange(e.name, e.value);
	
	if(inc.pending != null) {
		var oldpending;
		do {
			console.log("dequeued");
			oldpending = inc.pending;
			inc.applychange(oldpending.name, oldpending.value);
		} while(oldpending !== inc.pending);
	}
	
	inc.pending = null;
	inc.busy = false;
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
		
		return inc.fieldchange({name: "inc_desc", value: tipo[tipo.selectedIndex].value + num.value});
	};
})();
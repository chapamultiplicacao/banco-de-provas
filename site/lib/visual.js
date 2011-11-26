var visual = {};

visual.arrows = {down: "\u25BC", up: "\u25B2"};

visual.toggle = function(linkNode, dropId) {
	$(document.getElementById(dropId)).toggle('slow');
	
	var ar = linkNode.lastChild;
	
	if(ar.nodeValue == visual.arrows.down) {
		ar.nodeValue = visual.arrows.up;
	}
	else {
		ar.nodeValue = visual.arrows.down;
	}
}

visual.dropdown = function(ref, text, dropId) {
	var node = document.createElement('a');
	
	node.setAttribute('href', 'javascript:void(0)');
	node.setAttribute('onclick', 'visual.toggle(this, \'' + dropId + '\');');
	
	node.appendChild(document.createTextNode(text + "\u00A0"));
	node.appendChild(document.createTextNode(visual.arrows.down));
	
	document.getElementById(dropId).style.display = 'none';
	
	ref.parentNode.replaceChild(node, ref);
}
LinkedList = function() {
	this.Node = function(p, n, v) {
		this.prev = (p ? p : this);
		this.next = (n ? n : this);
		this.value = (v ? v : null);
	}
	
	this.internal_size = 0;
	
	this.head = new this.Node();
	
	this.push_back = function(v) {
		var newnode = new this.Node(this.head.prev, this.head, v);
		this.head.prev = newnode;
		newnode.prev.next = newnode;
		
		this.internal_size++;
		
		return newnode;
	}
	
	this.erase = function(N) {
		N.prev.next = N.next;
		N.next.prev = N.prev;
		
		this.internal_size--;
		
		return N.value;
	}
	
	this.pop_back = function() {
		var ret = this.head.prev;
		this.head.prev = ret.prev;
		ret.prev.next = this.head;
		
		this.internal_size--;
		
		return ret;
	}
	
	this.pop_front = function() {
		var ret = this.head.next;
		
		this.erase(ret);
		
		return ret;
	}
	
	this.push_back_node = function(N) {
		N.prev = this.head.prev;
		N.next = this.head;
		this.head.prev = N;
		N.prev.next = N;
		
		this.internal_size++;
		
		return N;
	}
	
	this.begin = function() {
		return this.head.next;
	}
	
	this.end = function() {
		return this.head;
	}
	
	this.front = function() {
		return this.head.next.value;
	}
	
	this.back = function() {
		return this.head.prev.value;
	}
	
	this.empty = function() {
		return this.internal_size == 0;
	}
	
	this.size = function() {
		return this.internal_size;
	}
}
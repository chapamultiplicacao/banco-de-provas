.PHONY: all install uninstall

all: bpdb.cfg.sh

bpdb.cfg.sh: bpdb.cfg.gen.sh
	bash $< $(CURDIR) > $@
	

install: /usr/bin/bpdb

/usr/bin/bpdb: bpdb
	ln -s $(CURDIR)/bpdb $@

uninstall:
	rm -f /usr/bin/bpdb
	
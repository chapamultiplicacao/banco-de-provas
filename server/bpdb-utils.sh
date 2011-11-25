#!/bin/bash

function appendluapath() {
	if [ "$#" == "1" ]; then
		echo "${BASEFOLDER}/lib/?.${1};;"
	else
		echo "${BASEFOLDER}/lib/?.${2};${1}"
	fi
}

function initlua() {
	export LUA_PATH=$(appendluapath $LUA_PATH "lua")
	export LUA_CPATH=$(appendluapath $LUA_CPATH "so")
}

function initenv() {
	export WD

	BPTMP=$TMPDIR
	
	if [ -z $BPTMP ]; then
		BPTMP="/tmp"
	fi
	
	BPTMP=$BPTMP"/bpdb/$$"
	
	export BPTMP;

	export OUTFOLDER="../site/db"
	
	initlua;
}

function settmp() {
	if [ ! -d $BPTMP ]; then
		mkdir -p $BPTMP
	fi
}

function cleartmp() {
	rm -rf $BPTMP
}
#!/bin/bash

ls -1 arquivos | perl parseinfo.pl | $LUA makedb.lua master --force $*
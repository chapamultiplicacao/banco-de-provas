#!/bin/bash

ls -1 arquivos | perl parseinfo.pl | lua makedb.lua
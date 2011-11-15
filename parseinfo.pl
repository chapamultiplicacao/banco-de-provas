#!/usr/bin/perl -w

# formato: matéria ano professor descrição

use strict;
use URI::Escape;

sub getinfo {
    my $res = qr/([pl]\d+)|(provinha\d*)|(p?sub)|(rec)|(avalia(c|(ç))ao)/i;
    
    my @parts = (split(/_/, $_[0]));
    my $i = 0;
    my $l = scalar @parts;
    
    my @fields = ('', '', '', '');
    
    if($i == $l) {
        return @fields;
    }
    
    if($parts[$i] =~ m/^\w{3}\d{4}$/) {
        $fields[0] = $parts[$i];
        $i++;
    } else {
        $fields[0] = '';
    }
    
    if($i == $l) {
        return @fields;
    }
    
    if($parts[$i] =~ m/$res/i) {
        $fields[3] = $parts[$i];
    } else {
        $fields[2] = $parts[$i];
        $i++;
        
        if($i == $l) {
            return @fields;
        }
        
        if($parts[$i] =~ m/$res/i) {
            $fields[3] = $parts[$i];
        }
    }
    $i++;
    
    if($i == $l) {
        return @fields;
    }
    
    if($parts[$i] =~ m/\d{4}/) {
        $fields[1] = $parts[$i];
    }
    $i++;
    
    die if $i != $l;
    
    return @fields;
}

sub putcsv {
    print join(",", @_), "\n";
}

while(<>) {
	chomp;
	my $fn = $_;
	my $original_fn = $fn;

    my $dot = rindex($fn, '.');
    if($dot != -1) {
        $fn = substr($fn, 0, $dot);
    }
    
    my @fields = &getinfo(uri_unescape($fn));
    
    $fields[0] = uc $fields[0];
    
    if($fields[3]) {
        substr($fields[3], 0, 1) = uc substr($fields[3], 0, 1);
    }
    
    &putcsv(@fields, "http://camatimeusp.org/arquivos/" . $original_fn);
}
#!/usr/bin/perl

require Encode;
use Unicode::Normalize;

sub nodiacritics {
	$_ = Encode::decode( 'utf-8', $_ );
	$_ = NFD( $_ );
	s/\pM//g;
	s/[^\0-\x80]//g;
	
	$_;
}

sub wanttext {
	s/[^\n\w\.\,\;\:]+/\ /g;
	
	$_;
}

while(<STDIN>) {
	nodiacritics;
	wanttext;
	print lc;
}
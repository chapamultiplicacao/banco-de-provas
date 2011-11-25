#!/usr/bin/perl

$_ = `echo $ARGV[0] | perl ../parseinfo.pl`;
chomp;

my ($materia, $ano, $professor, $descricao) = map($_ = lc, split ',');

my ($mat, $prof, $desc) = ($materia, $professor, $descricao);

$/ = undef;

my $input = <STDIN>;

my %tests = ();

open TESTF, "tests.pl" or die "Couldn't open file: $!";

eval <TESTF>;
die $@ if $@;

close TESTF;

my @suc = ();
my @fail = ();

foreach my $i (keys %tests) {
	if($input =~ $tests{$i}) {
		push @suc, $i;
	}
	else {
		push @fail, $i;
	}
}

print ((scalar @suc)/(scalar @suc + scalar @fail), "\n");
print join(',', @suc), "\n";
print join(',', @fail), "\n";


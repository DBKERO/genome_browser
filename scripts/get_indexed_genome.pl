#!/usr/bin/perl

use strict;


my ($INPUT, $OUT_PREFIX) = @ARGV;
if(!$INPUT || !$OUT_PREFIX) {
	print STDERR "perl get_indexed_genome.pl InputFasta OutPutPrefix\n";
	exit 1;
}

my $magic = "01A58BE8";
my $version = 1;
my $compression_format = 0;

my $chr_num = 0;
my @chr_size_list = ();
my $chr_size = 0;
my @seq_list = ();
my $chr_seq = "";
my @chr_list = ();
open(OUT, "> $OUT_PREFIX.err");
open(IN, $INPUT) || die $!;
while(chomp(my $line = <IN>)) {
	if($line =~ /^>/) {
		if($chr_size != 0) {
			push(@chr_size_list, $chr_size);
			push(@seq_list, $chr_seq);
		}
		
		my $chr = substr($line, 1);
		$chr =~ s/^\s+//;
		$chr =~ s/\s+$//;
		if($chr =~ /\s/) {
			print OUT "WARNING: chromosome name change $chr to ";
			($chr) = (split(/\s/, $chr, 2))[0];
			print OUT "$chr\n";
		}
		
		print substr($line, 1) . "\n";
		$chr_size = 0;
		$chr_seq = "";
		
		push(@chr_list, $chr);
		$chr_num ++;
	} else {
		my $seq = $line;
		$seq =~ s/\s//g;
		$chr_size += length($seq);
		$chr_seq .= $seq;
	}
}
if($chr_size != 0) {
	push(@chr_size_list, $chr_size);
	push(@seq_list, $chr_seq);
}
close(IN) || die $!;
close(OUT);

my $index_size = 4 + 4 * $chr_num + 8 * $chr_num;
foreach my $chr_char (@chr_list) {
	$index_size += length($chr_char);
}
foreach my $chr_size (@chr_size_list) {
	my $chunk_num = int(($chr_size - 1) / 10000) + 1;
	$index_size += $chunk_num * 2;
}



open(SIZE, "> $OUT_PREFIX.chrom.sizes");
open(OUT, "> $OUT_PREFIX.dat");
binmode(OUT);

print OUT pack("H*", substr($magic, 6, 2) . substr($magic, 4, 2) . substr($magic, 2, 2) . substr($magic, 0, 2));
print OUT pack("S", $version);
print OUT pack("S", $compression_format);

my $up = $index_size % 65536;
my $down = int($index_size / 65536);
print OUT pack("S2", $up, $down);
print OUT pack("S2", 0, 0);

die "Error: chr num over" if($chr_num >= 65536);
print OUT pack("S2", $chr_num, 0);
if($index_size >= 65536 * 65536) {
	die "Error: index_size over";
}
foreach my $chr_char (@chr_list) {
	my $chr_char_size = length($chr_char);
	if($chr_char_size >= 65536 * 65536) {
		die "Error: chr_char_size over";
	}
	my $up = $chr_char_size % 65536;
	my $down = int($chr_char_size / 65536);
	print OUT pack("S2", $up, $down);
}

for(my $i = 0; $i < $chr_num; $i ++) {
	
	my $chr = $chr_list[$i];
	print OUT $chr;
	
	my $chr_id = $i + 1;
	if($chr_id >= 65536 * 65536) {
		die "Error: chr_id over";
	}
	my $up = $chr_id % 65536;
	my $down = int($chr_id / 65536);
	print OUT pack("S2", $up, $down);
	
	my $chr_size = $chr_size_list[$i];
	if($chr_size >= 65536 * 65536) {
		die "Error: chr_size over";
	}
	$up = $chr_size % 65536;
	$down = int($chr_size / 65536);
	print OUT pack("S2", $up, $down);
	
	print SIZE "$chr\t$chr_size\n";
}


#size index
foreach my $chr_size (@chr_size_list) {
	my $chunk_num = int(($chr_size - 1) / 10000) + 1;
	if($chr_size <= 0) {
		die "Error: Chromosome size is too small";
	}
	for(my $i = 0; $i < $chunk_num - 1; $i ++) {
		my $chunk_size = 10000;
		print OUT pack("S", $chunk_size);
	}
	my $chunk_size = $chr_size % 10000 || 10000;
	print OUT pack("S", $chunk_size);
}


foreach (@seq_list) {
	print OUT $_;
}

close(OUT);
close(SIZE);



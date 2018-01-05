#!/usr/bin/perl

use strict;


my ($INPUT, $CHR_SIZE) = @ARGV;
if(!$INPUT) {
	print STDERR "USAGE: perl gtf2bed.pl InputFile [ChromSizesFile]\n";
	exit 1;
}

my %exist_chr;
if($CHR_SIZE) {
	open(IN, "$CHR_SIZE") || die $!;
	while(my $line = <IN>) {
		chomp($line);
		my ($chr, $size) = split(/\t/, $line);
		$exist_chr{"$chr"} = 1;
	}
	close(IN) || die $!;
}


my %data;
open(IN, "$INPUT") || die $!;
while(my $line = <IN>) {
	chomp($line);
	if($line =~ /^#/) {
		print STDERR "INFO: Ignore: $line\n";
		next;
	}
	my ($chr, $source, $feature, $start, $end, $score, $strand, $frame, $attribute) = 
		split(/\t/, $line);
	
	if($feature ne "exon" && $feature ne "transcript" && $feature ne "CDS") {
		next;
	}
	
	if(defined($CHR_SIZE) && !$exist_chr{"$chr"}) {
		next;
	}
	
	my %att;
	foreach (split(/;/, $attribute)) {
		s/^\s+//; s/\s+$//;
		my ($key, $val) = split(/ +/, $_, 2);
		$key =~ s/\s//g;
		$val =~ s/^"//; $val =~ s/"$//;
		push(@{$att{"$key"}}, $val);
	}
	if(!defined($att{"transcript_id"})) {
		die "Error: no transcript_id: $line";
	}
	
	if($start > $end) {
		die "Error: start > end: $line";
	}
	
	if(@{$att{"transcript_id"}} != 1) {
		die "Error: transcript_id too many: $line";
	}
	my $transcript_id = $att{"transcript_id"}->[0];
	my $gene_str = $att{"gene_name"}->[0] || $att{"gene_id"}->[0];
	#my $name = ($feature eq "transcript")? $att{"transcript_id"}->[0] . "|" . $gene_str: "";
	my $name = $att{"transcript_id"}->[0] . "|" . $gene_str;
	#for ucsc/bedToBigBed
	$name =~ s/ /_/g;
	
	push(@{$data{"$transcript_id"}->{"$feature"}}, [$chr, $start - 1, $end, $strand, $name]);
}
close(IN) || die $!;


my %sort_all;
while(my ($transcript_id, $rdata) = each(%data)) {
	my ($chr, $start, $end, $strand, $name);
	if(!defined($rdata->{"transcript"})) {
		foreach (@{$rdata->{"exon"}}) {
			my ($chr_, $tmp_start, $tmp_end, $strand_, $name_) = @$_;
			if(!defined($start)) {
				$chr = $chr_;
				$start = $tmp_start;
				$end = $tmp_end;
				$strand = $strand_;
				$name = $name_
			} else {
				$start = $tmp_start if($start > $tmp_start);
				$end = $tmp_end if($end < $tmp_end);
			}
		}
		#die "Error: no trancript data: $transcript_id";
	} elsif(@{$rdata->{"transcript"}} != 1) {
		die "Error: too many transcript data: $transcript_id transcript";
	} else {
		($chr, $start, $end, $strand, $name) = @{$rdata->{"transcript"}->[0]};
	}
	
	my ($cds_start, $cds_end);
	if(defined($rdata->{"CDS"})) {
		foreach (@{$rdata->{"CDS"}}) {
			my ($chr_, $tmp_start, $tmp_end, $strand_) = @$_;
			if($chr ne $chr_ || $strand ne $strand_) {
				die "Error: CDS invalid: $transcript_id";
			}
			if(!defined($cds_start)) {
				$cds_start = $tmp_start;
				$cds_end = $tmp_end;
			} else {
				if($cds_start > $tmp_start) {
					$cds_start = $tmp_start;
				}
				if($cds_end < $tmp_end) {
					$cds_end = $tmp_end;
				}
			}
		}
	}
	if(!defined($cds_start)) {
		$cds_start = $start;
		$cds_end = $start;
	}
	
	if(!defined($rdata->{"exon"})) {
		die "Error: no exon data: $transcript_id";
	}
	
	my %sorter;
	foreach (@{$rdata->{"exon"}}) {
		my ($chr_, $tmp_start, $tmp_end, $strand_) = @$_;
		if($chr ne $chr_ || $strand ne $strand_) {
			die "Error: CDS invalid: $transcript_id";
		}
		
		$sorter{"$tmp_start"} = $tmp_end;
	}
	my $exn_cnt = 0;
	my (@block_sizes, @block_starts);
	foreach my $tmp_start (sort {$a <=> $b} keys(%sorter)) {
		my $tmp_end = $sorter{"$tmp_start"};
		$exn_cnt ++;
		push(@block_sizes, $tmp_end - $tmp_start);
		push(@block_starts, $tmp_start - $start);
	}
	
	push(@{$sort_all{"$chr"}->{"$start"}}, [
		$chr, $start, $end, $name, 0, $strand, $cds_start, $cds_end, "255,0,0", 
		$exn_cnt, join(",", @block_sizes), join(",", @block_starts)
	]);
}

foreach my $chr (sort {$a <=> $b} keys(%sort_all)) {
	my $rsort = $sort_all{"$chr"};
	my @for_step = ();
	foreach my $start (sort {$a <=> $b} keys(%$rsort)) {
		foreach (@{$rsort->{"$start"}}) {
			my $step = 1;
			my $end = $_->[2];
			foreach my $bend (@for_step) {
				if($bend + 100 < $start) {
					last;
				}
				$step ++;
			}
			$for_step[$step - 1] = $end;
			$_->[3] = "$step|$_->[3]";
			print join("\t", @$_) . "\n";
		}
	}
}



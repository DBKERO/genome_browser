
$(function() {
	
	//Preparation of track object
	//var oseq = new WgSeqF("http://kero.hgc.jp/data/hg38/data.dat");
	//var orefseq = new WgRefseqF("http://kero.hgc.jp/data/hg38/genes.sorted.bb");
	var oseq = new WgSeqF("test_data/data.dat");
	var orefseq = new WgRefseqF("test_data/genes.sorted.bb", "reference_gene", "Reference gene");
	var obigwig = new WgBigWig2("obigwig", "#5555ff", "only chr22 ENCODE demo data", "test_data/ENCFF437TPA_chr22_cut.sorted.bw");
	
	var urlSet = {
		key2position: "https://dbtss.hgc.jp/cgi-bin/dbtss_autocomplete.cgi",
		searchKey: "https://dbtss.hgc.jp/cgi-bin/keyword_search.cgi",
		additionalParam: "SEE=1&UID=2&taxid=9606"
	};
	
	//Preparation of genome browser object
	var gvObj = new GenomeViewerObject("#viewer", {
		"chr1": [1, 248956422], 
		"chr2": [2, 242193529], 
		"chr3": [3, 198295559], 
		"chr4": [4, 190214555], 
		"chr5": [5, 181538259], 
		"chr6": [6, 170805979], 
		"chr7": [7, 159345973], 
		"chr8": [8, 145138636], 
		"chr9": [9, 138394717], 
		"chr10": [10, 133797422], 
		"chr11": [11, 135086622], 
		"chr12": [12, 133275309], 
		"chr13": [13, 114364328], 
		"chr14": [14, 107043718], 
		"chr15": [15, 101991189], 
		"chr16": [16, 90338345], 
		"chr17": [17, 83257441], 
		"chr18": [18, 80373285], 
		"chr19": [19, 58617616], 
		"chr20": [20, 64444167], 
		"chr21": [21, 46709983], 
		"chr22": [22, 50818468], 
		"chrX": [23, 156040895], 
		"chrY": [24, 57227415], 
		"chrM": [25, 16569], 
	}, urlSet);
	
	//initial position
	var loc = location.href.split("#");
	var posStr = (loc[1])? loc[1]: "chr22:20900000-21000000";
	
	//Show genome browser
	gvObj.setupGenomeViewer(posStr, 1000, 300, [
		"<hr /><div>Category buttons</div>", 
		"<div><input type=\"button\" id=\"show_item\" value=\"Show public data\" name=\"Sequence|Reference gene\" /></div>",
		"<hr /><div>Public data</div>", 
		oseq, orefseq, 
		"<hr /><div>Your data</div>", 
		obigwig
	]);
	
	//Preparation of default display tracks
	gvObj.gvFunc.changeTrack("sequence");
	gvObj.gvFunc.changeTrack("reference_gene");
	
});


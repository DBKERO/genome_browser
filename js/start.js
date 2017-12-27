$(function() {
	var gvObj;
	$("#viewer").html("Loading genome browser...");
	
	$("#add_bam").click(function() {
		var files = $("#files")[0].files;
		if (files.length != 1 && files.length != 2) {
			alert('Please select a BigWig(.bw) file or BAM(.bam and .bai) files!');
			return;
		}
		
		var fileBai = files[0];
		var fileBam = files[1];
		
		var type = "bam";
		if(fileBai.name.substr(-4) == ".bam" && fileBam.name.substr(-4) == ".bai") {
			var temp = fileBai; fileBai = fileBam; fileBam = temp;
		} else if(fileBai.name.substr(-4) == ".bai" && fileBam.name.substr(-4) == ".bam") {
		} else if(fileBai.name.substr(-3) == ".bw") {
			type = "bw";
		} else {
			alert('Please select a BigWig(.bw) file or BAM(.bam and .bai) files!');
			return;
		}
		
		if(gvObj !== undefined) {
			var addPartsSccFlg = false;
			num = 1;
			while(!addPartsSccFlg) {
				var id = "test_" + type;
				if(num != 1) {
					id += "_" + num;
				}
				var bam = (type == "bam")? 
					new WgBam2(id, id, [fileBam, fileBai], {"localFlg": true}): 
					new WgBigWig2(id, "#0000ff", id, fileBai, {"localFlg": true});
				
				try {
					gvObj.gvFunc.addCreateParts(bam);
					gvObj.gvFunc.changeTrack(id);
					addPartsSccFlg = true;
				} catch(e) {
					num ++;
					addPartsSccFlg = false;
				}
			}
		}
	});
	
	
	var loc = location.href.split("#");
	var posStr = (loc[1])? loc[1]: "chr22:21645000-21715000";
	
	var chrData = initJsons["chrom"]["all.json"];
	
	var option = {
		initShow: [
			["refGene", true]
		], 
		uriDirFlg: true, 
		chrUriDirFlg: true,
		itemSwitchFlg: true,
		showPositionFlg: true,
		bgVlineFlg: true,
		withCredentials: true,
		chrData: initJsons["chrom"]
	};
	
	gvObj = new GenomeViewerObject("#viewer", chrData, {}, option);
	
	var orefseq = new WgRefseq("refGene", "NCBI RefSeq", {initJson: refGene});
	var viewerPartsData = [
		"<hr />", 
		orefseq
	];
	gvObj.setupGenomeViewer(posStr, 750, 300, viewerPartsData);
});


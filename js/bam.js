/**
 * @author Hiroyuki Wakaguri: hwakagur@bits.cc
 * bam.js v1.3.20171218
 */

var BamData = function(fil, option) {
	this.file = fil;
	this.option = (option !== undefined)? option: {};
	this.chrData;
	this.baiData;
	this.minBegCoffset;	//ヘッダ情報のバイト推定値をbaiファイルから得る
	this.bamChunk = {};
	//読み込み済みもしくは、読み込みリクエスト中データ
	this.loadData = {};
	//読み込み済みもしくは、読み込みリクエスト中Chunkデータ
	this.loadData.chunk = {};
};

BamData.prototype.accRequest = function(callback, reject, option) {
	if(option === undefined) option = {};
	
	if(this.option.localFlg) {
		var accFile = (option.file !== undefined)? option.file: this.file[0];
		var blob = accFile;
		if(option.byteStart !== undefined && option.byteEnd !== undefined) {
			if (window.File && window.FileReader && window.FileList && window.Blob) {
				blob = accFile.slice(option.byteStart, option.byteEnd + 1);
			} else {
				alert('The File APIs are not fully supported in this browser.');
				return false;
			}
		}
		var reader = new FileReader();
		reader.onloadend = function(evt) {
			if (evt.target.readyState == FileReader.DONE) { // DONE == 2
				callback(evt.target.result);
			} else {
				reject("file access failed", evt.target);
				return false;
			}
		};
		reader.readAsArrayBuffer(blob);
	} else {
		var accFile = (option.file !== undefined)? option.file: this.file;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', accFile, true);
		if(option.byteStart !== undefined && option.byteEnd !== undefined) {
			xhr.setRequestHeader("Range", "bytes=" + option.byteStart + "-" + option.byteEnd);
		}
		xhr.addEventListener('loadend', function(ev) {
			if(xhr.status !== 200 && xhr.status !== 206){
				console.error('web status: ' + xhr.status + ', ' + xhr.statusText);
				reject("web access failed", xhr);
				return xhr.status;
			}
			callback(xhr.response);
		}, false);
		xhr.responseType = 'arraybuffer';
		xhr.send();
	}
};

BamData.prototype.chromosome = function(callback, reject) {
	if(this.chrData !== undefined) {
		callback();
		return true;
	}
	
	var m = this;
	var option = {};
	option.byteStart = 0;
	option.byteEnd = this.minBegCoffset - 1;
	
	this.accRequest(function(response) {
		var chrData = {};
		
		var plain = new Zlib.Gunzip(new Uint8Array(response)).decompress();
		let dataview = new DataView(plain.buffer);
		
		var poi = 0;
		chrData.magic = String.fromCharCode(plain[poi]) 
			+ String.fromCharCode(plain[poi + 1]) 
			+ String.fromCharCode(plain[poi + 2]) 
			+ String.fromCharCode(plain[poi + 3]);
		poi += 4;
		
		var l_text = dataview.getUint32(poi, true);
		chrData.l_text = l_text;
		var text = "";
		poi += 4;
		
		for(; poi < 8 + l_text; poi ++) {
			text += String.fromCharCode(plain[poi]);
		}
		chrData.text = text;
		
		var n_ref = dataview.getUint32(poi, true);
		chrData.n_ref = n_ref;
		poi += 4;
		
		chrData.chr2no = {};
		for(var i = 1; i <= n_ref; i ++) {
			var l_name = dataview.getUint32(poi, true);
			poi += 4;
			
			var name = "";
			for(var j = 1; j < l_name; j ++) {
				name += String.fromCharCode(plain[poi]);
				poi ++;
			}
			poi ++;
			
			var l_ref = dataview.getUint32(poi, true);
			poi += 4;
			
			chrData.chr2no[name] = {
				no: i - 1, 
				l_name: l_name, 
				l_ref: l_ref
			};
		}
		m.chrData = chrData;
		callback();
	}, reject, option);
};

BamData.prototype.chromIndex = function(callback, reject) {
	if(this.loadData.chromIndex) {
		callback();
		return;
	}
	this.loadData.chromIndex = true;
	
	var m = this;
	
	var func = function() {
		m.chromosome(callback, reject);
	};
	this.accIndex(func, reject);
};

BamData.prototype.accIndex = function(callback, reject) {
	if(this.baiData !== undefined) {
		callback();
		return true;
	}
	
	var m = this;
	
	var option = {};
	option.file = (this.option.localFlg)? this.file[1]: this.file + ".bai";
	
	this.accRequest(function(response) {
		var plain = new Uint8Array(response);
		let dataview = new DataView(plain.buffer);
		
		var data = {};
		var poi = 0;
		
		var magic = String.fromCharCode(plain[poi]) 
			+ String.fromCharCode(plain[poi + 1]) 
			+ String.fromCharCode(plain[poi + 2]) 
			+ String.fromCharCode(plain[poi + 3]);
		data.magic = magic;
		poi += 4;
		
		var n_ref = dataview.getUint32(poi, true);
		data.n_ref = n_ref;
		poi += 4;
		
		data.chr = [];
		for(var i = 0; i < n_ref; i ++) {
			data.chr[i] = {};
			
			var n_bin = dataview.getUint32(poi, true);
			data.chr[i].n_bin = n_bin;
			poi += 4;
			
			data.chr[i].bin_data = {};
			for(var j = 1; j <= n_bin; j ++) {
				var bin = dataview.getUint32(poi, true);
				data.chr[i].bin_data[bin] = {};
				poi += 4;
				
				var n_chunk = dataview.getUint32(poi, true);
				data.chr[i].bin_data[bin].n_chunk = n_chunk;
				poi += 4;
				
				data.chr[i].bin_data[bin].chunk = [];
				for(var k = 1; k <= n_chunk; k ++) {
					var chunk_beg = 
						dataview.getUint32(poi + 4, true) * Math.pow(256, 4) + 
						dataview.getUint32(poi, true);
					var begUoffset = dataview.getUint16(poi, true);
					var begCoffset = 
						dataview.getUint16(poi + 6, true) * Math.pow(256, 4) + 
						dataview.getUint32(poi + 2, true);
					poi += 8;
					
					var chunk_end = 
						dataview.getUint32(poi + 4, true) * Math.pow(256, 4) + 
						dataview.getUint32(poi, true);
					var endUoffset = dataview.getUint16(poi, true);
					var endCoffset = 
						dataview.getUint16(poi + 6, true) * Math.pow(256, 4) + 
						dataview.getUint32(poi + 2, true);
					poi += 8;
					if(endCoffset != 0 && (m.minBegCoffset === undefined || m.minBegCoffset > begCoffset)) {
						m.minBegCoffset = begCoffset;
					}
					
					data.chr[i].bin_data[bin].chunk[k - 1] = [begCoffset, begUoffset, 
						endCoffset, endUoffset, false, false];
				}
				
			}
			
			var n_intv = dataview.getUint32(poi, true);
			data.chr[i].n_intv = n_intv;
			poi += 4;
			
			data.chr[i].linearIndex = [];
			for(var j = 1; j <= n_intv; j ++) {
				var ioffset = 
					dataview.getUint32(poi + 4, true) * Math.pow(256, 4) + 
					dataview.getUint32(poi, true);
				var linUoffset = dataview.getUint16(poi, true);
				var linCoffset = 
					dataview.getUint16(poi + 6, true) * Math.pow(256, 4) + 
					dataview.getUint32(poi + 2, true);
				data.chr[i].linearIndex[j - 1] = [linCoffset, linUoffset];
				poi += 8;
			}
		}
		
		m.baiData = data;
		
		callback();
		
	}, reject, option);
};

BamData.prototype.getTargetChunks = function(chr, start, end) {
	var targetChunks = [];
	//以下条件にあったデータを出力
	var baiData = this.baiData;
	var chrId = this.chrData.chr2no[chr].no;
	if(baiData.chr[chrId] === undefined) return [];
	//不要なファイルアクセスを防ぐlinearIndex
	var indexNo = Math.floor((start - 1) / 16384);
	var linearIndex = [0, 0];
	if(indexNo >= 0) linearIndex = baiData.chr[chrId].linearIndex[indexNo];
	var bins = this.reg2bins(start, end);
	var sorter = {};
	var sorter2 = [];
	for(var i = 0; i < bins.length; i ++) {
		if(baiData.chr[chrId] !== undefined && baiData.chr[chrId].bin_data[bins[i]] !== undefined) {
			var chunk = baiData.chr[chrId].bin_data[bins[i]].chunk;
			for(var j = 0; j < chunk.length; j ++) {
				var binReg = chunk[j];
				if(
					linearIndex[0] < binReg[2] || 
					(linearIndex[0] == binReg[2] && linearIndex[1] <= binReg[3])
				) {
					var binRegSall = binReg[0] * 256 * 256 + binReg[1];
					var binRegEall = binReg[2] * 256 * 256 + binReg[3];
					if(sorter[binRegSall] === undefined) {
						sorter2.push(binRegSall);
						sorter[binRegSall] = binRegEall;
					} else if(sorter[binRegSall] < binRegEall) {
						sorter[binRegSall] = binRegEall;
					}
				}
			}
		}
	}
	
	var bend;
	var sorted2 = sorter2.sort(function(a,b){return a-b;});
	for(var i = 0; i < sorted2.length; i ++) {
		var binRegSall = sorted2[i];
		var overlapFlg = false;
		if(bend !== undefined && binRegSall < bend) {
			overlapFlg = true;
		}
		var binRegEall = sorter[binRegSall];
		
		if(overlapFlg && bend < binRegEall) {
			targetChunks[targetChunks.length - 1][1] = binRegEall;
			bend = binRegEall;
		} else if(!overlapFlg) {
			targetChunks.push([binRegSall, binRegEall]);
			bend = binRegEall;
		}
	}
	
	return targetChunks;
};

BamData.prototype.isLoaded = function(binSE) {
	var isLoaded = true;
	
	var binRegS = Math.floor(binSE[0] / (256 * 256));
	var binRegE = Math.floor(binSE[1] / (256 * 256));
	var j = binRegS;
	while(j <= binRegE) {
		var bamChunk = this.bamChunk[j];
		if(bamChunk === undefined) {
			isLoaded = false;
			break;
		}
		var nextJ = bamChunk[0];
		j = nextJ;
	}
	
	return isLoaded;
};

BamData.prototype.isAllLoaded = function(chr, start, end) {
	if(this.chrData === undefined) {
		return false;
	}
	
	var flg = true;
	
	var targetChunks = this.getTargetChunks(chr, start, end);
	for(var i = 0; i < targetChunks.length; i ++) {
		if(!this.isLoaded(targetChunks[i])) {
			flg = false;
			break;
		}
	}
	
	return flg;
};

BamData.prototype.readWaitReader = function(chr, start, end, callback, reject, option) {
	if(option === undefined) option = {};
	if(option.timeout === undefined) option.timeout = 300;
	var m = this;
	
	var func = function* () {
		var targetChunks = m.getTargetChunks(chr, start, end);
		for(var i = 0; i < targetChunks.length; i ++) {
			for(var alnEach of m.getParsedData(targetChunks[i])) {
				var alnStart = alnEach[0];
				var alnEnd = alnEach[5];
				if(alnStart <= end && start <= alnEnd) {
					yield alnEach;
				}
			}
		}
	};
	
	this.addRegionData(chr, start, end, function() {
		if(m.isAllLoaded(chr, start, end)) {
			callback(func);
		} else {
			var counter = 0;
			var intervalID = setInterval(function() {
				m.addRegionData(chr, start, end, function() {
					if(m.isAllLoaded(chr, start, end)) {
						clearInterval(intervalID);
						callback(func);
					} else {
						if(++ counter >= option.timeout) {
							clearInterval(intervalID);
							reject("timeout bam.js");
						}
						//console.log("counter:" + counter);
					}
				}, reject);
			}, 1000);
		}
	}, reject);
};

BamData.prototype.readReader = function(chr, start, end, callback, reject) {
	var m = this;
	this.addRegionData(chr, start, end, function(){
		var func = function* () {
			var targetChunks = m.getTargetChunks(chr, start, end);
			for(var i = 0; i < targetChunks.length; i ++) {
				if(m.isLoaded(targetChunks[i])) {
					for(var alnEach of m.getParsedData(targetChunks[i])) {
						var alnStart = alnEach[0];
						var alnEnd = alnEach[5];
						if(alnStart <= end && start <= alnEnd) {
							yield [true, alnEach];
						}
					}
				} else {
					yield [false, targetChunks[i]];
				}
			}
		};
		callback(func);
	}, reject);
};
//binSEのデータが取得済みであることが前提
BamData.prototype.getParsedData = function* (binSE) {
	var binRegS = Math.floor(binSE[0] / (256 * 256));
	var binRegE = Math.floor(binSE[1] / (256 * 256));
	var startPoi = binSE[0] % (256 * 256);
	var endPoi = binSE[1] % (256 * 256);
	
	var restArray;
	var j = binRegS;
	while(j <= binRegE) {
		var bamChunk = this.bamChunk[j];
		var nextJ = bamChunk[0];
		var plain = bamChunk[1];
		var poi = (j == binRegS)? startPoi: 0;
		var poiEnd = (j == binRegE)? endPoi: plain.length;
		if(restArray !== undefined) {
			poiEnd += restArray.length;
			var tmpArray = new Uint8Array(restArray.length + plain.length);
			tmpArray.set(restArray, 0);
			tmpArray.set(plain, restArray.length);
			plain = tmpArray;
			restArray = undefined;
		}
		let dataview = new DataView(plain.buffer);
		
		while(poi < poiEnd) {
			var hit = [];
			hit[11] = poi + j * 256 * 256;
			
			if(dataview.byteLength - poi < 4) {
				restArray = plain.slice(poi);
				break;
			}
			
			var block_size = dataview.getUint32(poi, true);
			poi += 4;
			var nextBlock = poi + block_size;
			if(poiEnd < nextBlock) {
				restArray = plain.slice(poi - 4);
				break;
			}
			
			var refID = dataview.getUint32(poi, true);
			poi += 4;
			
			var pos = dataview.getUint32(poi, true);
			hit[0] = pos + 1;
			poi += 4;
			
			var l_read_name = dataview.getUint8(poi, true);
			var mapq = dataview.getUint8(poi + 1, true);
			var bin_ = dataview.getUint16(poi + 2, true);
			hit[1] = mapq;
			poi += 4;
			
			var n_cigar_op = dataview.getUint16(poi, true);
			var flag = dataview.getUint16(poi + 2, true);
			hit[2] = flag;
			poi += 4;
			
			var l_seq = dataview.getUint32(poi, true);
			poi += 4;
			
			var next_refID = dataview.getUint32(poi, true);
			hit[8] = (next_refID == 4294967295)? "*": next_refID;
			poi += 4;
			
			var next_pos = dataview.getUint32(poi, true);
			hit[9] = (next_pos == 4294967295)? "*": next_pos;
			poi += 4;
			
			var tlen = dataview.getUint32(poi, true);
			hit[10] = tlen;
			poi += 4;
			
			var read_name = "";
			for(var i = 1; i < l_read_name; i ++) {
				read_name += String.fromCharCode(plain[poi]);
				poi ++;
			}
			poi ++;
			hit[3] = read_name;
			
			var ln = 0;
			var cigar = "";
			var cigarLn = [];
			var cigarOp = [""];
			for(var i = 1; i <= n_cigar_op; i ++) {
				var opAll = dataview.getUint32(poi, true);
				var op_len = Math.floor(opAll / 16);
				var op = "MIDNSHP=X".substr(opAll & 15, 1);
				cigar += op_len + op;
				cigarLn.push(op_len);
				cigarOp.push(op);
				if(op == "M" || op == "D" || op == "N" || op == "P" || 
					op == "=" || op == "X") ln += op_len;
				
				poi += 4;
			}
			hit[4] = cigar;
			hit[12] = cigarLn;
			hit[13] = cigarOp;
			hit[5] = pos + ln;
			
			var seq = "";
			var iMax = Math.floor((l_seq + 1) / 2);
			for(var i = 1; i <= iMax; i ++) {
				var base2 = plain[poi];
				var b1 = "=ACMGRSVTWYHKDBN".substr(Math.floor(base2 / 16), 1);
				var b2 = "=ACMGRSVTWYHKDBN".substr(base2 & 15, 1);
				if(l_seq % 2 == 1 && i == iMax) b2 = "";
				
				seq += b1 + b2;
				poi ++;
			}
			hit[6] = seq;
			
			var qual = "";
			for(var i = 1; i <= l_seq; i ++) {
				qual += String.fromCharCode(plain[poi] + 33);
				poi ++;
			}
			hit[7] = qual;
			
			yield hit;
			
			poi = nextBlock;
		}
		
		j = nextJ;
	}
	if(restArray !== undefined) {
		//ここにはこないはず
		alert("Error: restArray was found.");
	}
};
//bam fileにアクセスしてバイナリデータを取得
BamData.prototype.addRegionData = function(chr, start, end, callback, reject) {
	var m = this;
	var func = function() {
		if(m.chrData === undefined) {
			callback();
			return;
		}
		
		var targetChunks = m.getTargetChunks(chr, start, end);
		var unloadedChunks = m.getUnloadedChunks(targetChunks);
		
		var promises = [];
		var num = unloadedChunks.length;
		for(var i = 0; i < num; i ++) {
			promises.push(m.accBamPartial(unloadedChunks));
		}
		//Promise.all(promises).then(callback).catch(reject);
		Promise.all(promises).then(callback);
	};
	this.chromIndex(func, reject);
};

//このmethodはつぎはぎなので作り直したほうが良いかも
BamData.prototype.getUnloadedChunks = function(targetChunks) {
	var sorter = [];
	for(var poi in this.loadData.chunk) {
		sorter.push(poi);
	}
	sorter = sorter.sort(function(a,b){return a-b;});
	
	var unloadedChunks = [];
	var j = 0;
	for(var i = 0; i < targetChunks.length; i ++) {
		var binSE = targetChunks[i];
		var binRegS = Math.floor(binSE[0] / (256 * 256));
		var binRegE = Math.floor(binSE[1] / (256 * 256));
		
		var skipFlg = false;
		while(sorter[j] !== undefined) {
			var binLoadedS = sorter[j];
			//binLoadedEは読まれているとは限らない
			//this.loadData.chunk[binLoadedE]が存在すれば読まれていることになる
			var binLoadedE = this.loadData.chunk[binLoadedS];
			//
			if(binLoadedE < binRegS) {
				j ++;
				continue;
			}
			if(binLoadedE == binRegS) {
				if(this.loadData.chunk[binLoadedE] !== undefined && binRegS == binRegE) {
					skipFlg = true;
					break;
				}
				j ++;
				continue;
			}
			//
			if(binRegE < binLoadedS) {
				break;
			}
			if(binRegE == binLoadedS) {
				if(binRegS == binRegE) {
					skipFlg = true;
				}
				break;
			}
			//pattern A
			if(binLoadedS <= binRegS && binRegE <= binLoadedE) {
				if(this.loadData.chunk[binLoadedE] !== undefined) {
					skipFlg = true;
				} else {
					//トリッキーだが、最後のchunkのみ読み込みリクエストのため
					binRegS = binRegE;
				}
				break;
			}
			//pattern B
			if(binLoadedS <= binRegS && binRegS < binLoadedE && binLoadedE < binRegE) {
				binRegS = binLoadedE;
				j++;
				continue;
			}
			//pattern C
			if(binRegS < binLoadedS && binLoadedS < binRegE && binRegE <= binLoadedE) {
				binRegE = binLoadedS;
				break;
			}
			//pattern D
			if(binRegS < binLoadedS && binLoadedE < binRegE) {
				this.loadData.chunk[binRegS] = binLoadedS;
				unloadedChunks.push([binRegS, binLoadedS]);
				j++;
				continue;
			}
			//ここには来ないはず
			alert("Error");
		}
		if(!skipFlg) {
			//console.log("binSE:" + binSE[0] + ", " + binSE[1]);
			//console.log("load region:" + binRegS + ", " + binRegE);
			this.loadData.chunk[binRegS] = binRegE;
			unloadedChunks.push([binRegS, binRegE]);
		}
	}
	
	var bbinRegE;
	var returnChunks = [];
	for(var i = 0; i < unloadedChunks.length; i ++) {
		var chunkReg = unloadedChunks[i];
		if(bbinRegE !== undefined && bbinRegE == chunkReg[0]) {
			returnChunks[returnChunks.length - 1][1] = chunkReg[1];
		} else {
			returnChunks.push(chunkReg);
		}
		bbinRegE = chunkReg[1];
	}
	
	
	return returnChunks;
};

BamData.prototype.accBamPartial = function(unloadedChunks) {
	var m = this;

	var chunkData = unloadedChunks.pop();
	
	var option = {};
	option.byteStart = chunkData[0];
	option.byteEnd = chunkData[1] - 1 + 65536;
	
	return new Promise(function(resolve, reject){
		m.accRequest(function(response) {
			var origin = new Uint8Array(response);
			var nowPoi = 0;
			var lastPoi = chunkData[1] - chunkData[0];
			while(nowPoi <= lastPoi) {
				var blockLng = origin[nowPoi + 16] + origin[nowPoi + 16 + 1] * 256 + 1;
				var nowOrigin = origin.subarray(nowPoi, nowPoi + blockLng);
				var nowPlain = new Zlib.Gunzip(nowOrigin).decompress();
				m.bamChunk[chunkData[0] + nowPoi] = [chunkData[0] + nowPoi + blockLng, nowPlain];
				if(
					m.loadData.chunk[chunkData[0] + nowPoi] !== undefined && 
					m.loadData.chunk[chunkData[0] + nowPoi] == chunkData[0] + nowPoi
				) {
					m.loadData.chunk[chunkData[0] + nowPoi] = chunkData[0] + nowPoi + blockLng;
				}
				nowPoi += blockLng;
			}
			
			resolve();
		}, reject, option);
	});
};
// calculate the list of bins that may overlap with region [beg,end] (1-based) //
BamData.prototype.reg2bins = function(beg, end) {
	var list = [];
	var i = 0, k;
	
	--beg;
	list[i++] = 0;
	for (k =    1 + (beg>>26); k <=    1 + (end>>26); ++k) list[i++] = k;
	for (k =    9 + (beg>>23); k <=    9 + (end>>23); ++k) list[i++] = k;
	for (k =   73 + (beg>>20); k <=   73 + (end>>20); ++k) list[i++] = k;
	for (k =  585 + (beg>>17); k <=  585 + (end>>17); ++k) list[i++] = k;
	for (k = 4681 + (beg>>14); k <= 4681 + (end>>14); ++k) list[i++] = k;
	
	return list;
};

BamData.prototype.onError = function(err) {
	alert("Error:" + err);
};


/** @license zlib.js 2012 - imaya [ https://github.com/imaya/zlib.js ] The MIT License */
(function() {'use strict';function n(e){throw e;}var q=void 0,aa=this;function r(e,c){var d=e.split("."),b=aa;!(d[0]in b)&&b.execScript&&b.execScript("var "+d[0]);for(var a;d.length&&(a=d.shift());)!d.length&&c!==q?b[a]=c:b=b[a]?b[a]:b[a]={}};var u="undefined"!==typeof Uint8Array&&"undefined"!==typeof Uint16Array&&"undefined"!==typeof Uint32Array&&"undefined"!==typeof DataView;new (u?Uint8Array:Array)(256);var v;for(v=0;256>v;++v)for(var w=v,ba=7,w=w>>>1;w;w>>>=1)--ba;function x(e,c,d){var b,a="number"===typeof c?c:c=0,f="number"===typeof d?d:e.length;b=-1;for(a=f&7;a--;++c)b=b>>>8^z[(b^e[c])&255];for(a=f>>3;a--;c+=8)b=b>>>8^z[(b^e[c])&255],b=b>>>8^z[(b^e[c+1])&255],b=b>>>8^z[(b^e[c+2])&255],b=b>>>8^z[(b^e[c+3])&255],b=b>>>8^z[(b^e[c+4])&255],b=b>>>8^z[(b^e[c+5])&255],b=b>>>8^z[(b^e[c+6])&255],b=b>>>8^z[(b^e[c+7])&255];return(b^4294967295)>>>0}
var A=[0,1996959894,3993919788,2567524794,124634137,1886057615,3915621685,2657392035,249268274,2044508324,3772115230,2547177864,162941995,2125561021,3887607047,2428444049,498536548,1789927666,4089016648,2227061214,450548861,1843258603,4107580753,2211677639,325883990,1684777152,4251122042,2321926636,335633487,1661365465,4195302755,2366115317,997073096,1281953886,3579855332,2724688242,1006888145,1258607687,3524101629,2768942443,901097722,1119000684,3686517206,2898065728,853044451,1172266101,3705015759,
2882616665,651767980,1373503546,3369554304,3218104598,565507253,1454621731,3485111705,3099436303,671266974,1594198024,3322730930,2970347812,795835527,1483230225,3244367275,3060149565,1994146192,31158534,2563907772,4023717930,1907459465,112637215,2680153253,3904427059,2013776290,251722036,2517215374,3775830040,2137656763,141376813,2439277719,3865271297,1802195444,476864866,2238001368,4066508878,1812370925,453092731,2181625025,4111451223,1706088902,314042704,2344532202,4240017532,1658658271,366619977,
2362670323,4224994405,1303535960,984961486,2747007092,3569037538,1256170817,1037604311,2765210733,3554079995,1131014506,879679996,2909243462,3663771856,1141124467,855842277,2852801631,3708648649,1342533948,654459306,3188396048,3373015174,1466479909,544179635,3110523913,3462522015,1591671054,702138776,2966460450,3352799412,1504918807,783551873,3082640443,3233442989,3988292384,2596254646,62317068,1957810842,3939845945,2647816111,81470997,1943803523,3814918930,2489596804,225274430,2053790376,3826175755,
2466906013,167816743,2097651377,4027552580,2265490386,503444072,1762050814,4150417245,2154129355,426522225,1852507879,4275313526,2312317920,282753626,1742555852,4189708143,2394877945,397917763,1622183637,3604390888,2714866558,953729732,1340076626,3518719985,2797360999,1068828381,1219638859,3624741850,2936675148,906185462,1090812512,3747672003,2825379669,829329135,1181335161,3412177804,3160834842,628085408,1382605366,3423369109,3138078467,570562233,1426400815,3317316542,2998733608,733239954,1555261956,
3268935591,3050360625,752459403,1541320221,2607071920,3965973030,1969922972,40735498,2617837225,3943577151,1913087877,83908371,2512341634,3803740692,2075208622,213261112,2463272603,3855990285,2094854071,198958881,2262029012,4057260610,1759359992,534414190,2176718541,4139329115,1873836001,414664567,2282248934,4279200368,1711684554,285281116,2405801727,4167216745,1634467795,376229701,2685067896,3608007406,1308918612,956543938,2808555105,3495958263,1231636301,1047427035,2932959818,3654703836,1088359270,
936918E3,2847714899,3736837829,1202900863,817233897,3183342108,3401237130,1404277552,615818150,3134207493,3453421203,1423857449,601450431,3009837614,3294710456,1567103746,711928724,3020668471,3272380065,1510334235,755167117],z=u?new Uint32Array(A):A;function B(){}B.prototype.getName=function(){return this.name};B.prototype.getData=function(){return this.data};B.prototype.H=function(){return this.I};r("Zlib.GunzipMember",B);r("Zlib.GunzipMember.prototype.getName",B.prototype.getName);r("Zlib.GunzipMember.prototype.getData",B.prototype.getData);r("Zlib.GunzipMember.prototype.getMtime",B.prototype.H);function D(e){var c=e.length,d=0,b=Number.POSITIVE_INFINITY,a,f,g,k,m,p,t,h,l,y;for(h=0;h<c;++h)e[h]>d&&(d=e[h]),e[h]<b&&(b=e[h]);a=1<<d;f=new (u?Uint32Array:Array)(a);g=1;k=0;for(m=2;g<=d;){for(h=0;h<c;++h)if(e[h]===g){p=0;t=k;for(l=0;l<g;++l)p=p<<1|t&1,t>>=1;y=g<<16|h;for(l=p;l<a;l+=m)f[l]=y;++k}++g;k<<=1;m<<=1}return[f,d,b]};var E=[],F;for(F=0;288>F;F++)switch(!0){case 143>=F:E.push([F+48,8]);break;case 255>=F:E.push([F-144+400,9]);break;case 279>=F:E.push([F-256+0,7]);break;case 287>=F:E.push([F-280+192,8]);break;default:n("invalid literal: "+F)}
var ca=function(){function e(a){switch(!0){case 3===a:return[257,a-3,0];case 4===a:return[258,a-4,0];case 5===a:return[259,a-5,0];case 6===a:return[260,a-6,0];case 7===a:return[261,a-7,0];case 8===a:return[262,a-8,0];case 9===a:return[263,a-9,0];case 10===a:return[264,a-10,0];case 12>=a:return[265,a-11,1];case 14>=a:return[266,a-13,1];case 16>=a:return[267,a-15,1];case 18>=a:return[268,a-17,1];case 22>=a:return[269,a-19,2];case 26>=a:return[270,a-23,2];case 30>=a:return[271,a-27,2];case 34>=a:return[272,
a-31,2];case 42>=a:return[273,a-35,3];case 50>=a:return[274,a-43,3];case 58>=a:return[275,a-51,3];case 66>=a:return[276,a-59,3];case 82>=a:return[277,a-67,4];case 98>=a:return[278,a-83,4];case 114>=a:return[279,a-99,4];case 130>=a:return[280,a-115,4];case 162>=a:return[281,a-131,5];case 194>=a:return[282,a-163,5];case 226>=a:return[283,a-195,5];case 257>=a:return[284,a-227,5];case 258===a:return[285,a-258,0];default:n("invalid length: "+a)}}var c=[],d,b;for(d=3;258>=d;d++)b=e(d),c[d]=b[2]<<24|b[1]<<
16|b[0];return c}();u&&new Uint32Array(ca);function G(e,c){this.i=[];this.j=32768;this.d=this.f=this.c=this.n=0;this.input=u?new Uint8Array(e):e;this.o=!1;this.k=H;this.z=!1;if(c||!(c={}))c.index&&(this.c=c.index),c.bufferSize&&(this.j=c.bufferSize),c.bufferType&&(this.k=c.bufferType),c.resize&&(this.z=c.resize);switch(this.k){case I:this.a=32768;this.b=new (u?Uint8Array:Array)(32768+this.j+258);break;case H:this.a=0;this.b=new (u?Uint8Array:Array)(this.j);this.e=this.F;this.q=this.B;this.l=this.D;break;default:n(Error("invalid inflate mode"))}}
var I=0,H=1;
G.prototype.g=function(){for(;!this.o;){var e=J(this,3);e&1&&(this.o=!0);e>>>=1;switch(e){case 0:var c=this.input,d=this.c,b=this.b,a=this.a,f=c.length,g=q,k=q,m=b.length,p=q;this.d=this.f=0;d+1>=f&&n(Error("invalid uncompressed block header: LEN"));g=c[d++]|c[d++]<<8;d+1>=f&&n(Error("invalid uncompressed block header: NLEN"));k=c[d++]|c[d++]<<8;g===~k&&n(Error("invalid uncompressed block header: length verify"));d+g>c.length&&n(Error("input buffer is broken"));switch(this.k){case I:for(;a+g>b.length;){p=
m-a;g-=p;if(u)b.set(c.subarray(d,d+p),a),a+=p,d+=p;else for(;p--;)b[a++]=c[d++];this.a=a;b=this.e();a=this.a}break;case H:for(;a+g>b.length;)b=this.e({t:2});break;default:n(Error("invalid inflate mode"))}if(u)b.set(c.subarray(d,d+g),a),a+=g,d+=g;else for(;g--;)b[a++]=c[d++];this.c=d;this.a=a;this.b=b;break;case 1:this.l(da,ea);break;case 2:fa(this);break;default:n(Error("unknown BTYPE: "+e))}}return this.q()};
var K=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],L=u?new Uint16Array(K):K,N=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,258,258],O=u?new Uint16Array(N):N,P=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0],Q=u?new Uint8Array(P):P,R=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],ga=u?new Uint16Array(R):R,ha=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,
13,13],U=u?new Uint8Array(ha):ha,V=new (u?Uint8Array:Array)(288),W,ia;W=0;for(ia=V.length;W<ia;++W)V[W]=143>=W?8:255>=W?9:279>=W?7:8;var da=D(V),X=new (u?Uint8Array:Array)(30),Y,ja;Y=0;for(ja=X.length;Y<ja;++Y)X[Y]=5;var ea=D(X);function J(e,c){for(var d=e.f,b=e.d,a=e.input,f=e.c,g=a.length,k;b<c;)f>=g&&n(Error("input buffer is broken")),d|=a[f++]<<b,b+=8;k=d&(1<<c)-1;e.f=d>>>c;e.d=b-c;e.c=f;return k}
function Z(e,c){for(var d=e.f,b=e.d,a=e.input,f=e.c,g=a.length,k=c[0],m=c[1],p,t;b<m&&!(f>=g);)d|=a[f++]<<b,b+=8;p=k[d&(1<<m)-1];t=p>>>16;e.f=d>>t;e.d=b-t;e.c=f;return p&65535}
function fa(e){function c(a,c,b){var d,e=this.w,f,g;for(g=0;g<a;)switch(d=Z(this,c),d){case 16:for(f=3+J(this,2);f--;)b[g++]=e;break;case 17:for(f=3+J(this,3);f--;)b[g++]=0;e=0;break;case 18:for(f=11+J(this,7);f--;)b[g++]=0;e=0;break;default:e=b[g++]=d}this.w=e;return b}var d=J(e,5)+257,b=J(e,5)+1,a=J(e,4)+4,f=new (u?Uint8Array:Array)(L.length),g,k,m,p;for(p=0;p<a;++p)f[L[p]]=J(e,3);if(!u){p=a;for(a=f.length;p<a;++p)f[L[p]]=0}g=D(f);k=new (u?Uint8Array:Array)(d);m=new (u?Uint8Array:Array)(b);e.w=
0;e.l(D(c.call(e,d,g,k)),D(c.call(e,b,g,m)))}G.prototype.l=function(e,c){var d=this.b,b=this.a;this.r=e;for(var a=d.length-258,f,g,k,m;256!==(f=Z(this,e));)if(256>f)b>=a&&(this.a=b,d=this.e(),b=this.a),d[b++]=f;else{g=f-257;m=O[g];0<Q[g]&&(m+=J(this,Q[g]));f=Z(this,c);k=ga[f];0<U[f]&&(k+=J(this,U[f]));b>=a&&(this.a=b,d=this.e(),b=this.a);for(;m--;)d[b]=d[b++-k]}for(;8<=this.d;)this.d-=8,this.c--;this.a=b};
G.prototype.D=function(e,c){var d=this.b,b=this.a;this.r=e;for(var a=d.length,f,g,k,m;256!==(f=Z(this,e));)if(256>f)b>=a&&(d=this.e(),a=d.length),d[b++]=f;else{g=f-257;m=O[g];0<Q[g]&&(m+=J(this,Q[g]));f=Z(this,c);k=ga[f];0<U[f]&&(k+=J(this,U[f]));b+m>a&&(d=this.e(),a=d.length);for(;m--;)d[b]=d[b++-k]}for(;8<=this.d;)this.d-=8,this.c--;this.a=b};
G.prototype.e=function(){var e=new (u?Uint8Array:Array)(this.a-32768),c=this.a-32768,d,b,a=this.b;if(u)e.set(a.subarray(32768,e.length));else{d=0;for(b=e.length;d<b;++d)e[d]=a[d+32768]}this.i.push(e);this.n+=e.length;if(u)a.set(a.subarray(c,c+32768));else for(d=0;32768>d;++d)a[d]=a[c+d];this.a=32768;return a};
G.prototype.F=function(e){var c,d=this.input.length/this.c+1|0,b,a,f,g=this.input,k=this.b;e&&("number"===typeof e.t&&(d=e.t),"number"===typeof e.A&&(d+=e.A));2>d?(b=(g.length-this.c)/this.r[2],f=258*(b/2)|0,a=f<k.length?k.length+f:k.length<<1):a=k.length*d;u?(c=new Uint8Array(a),c.set(k)):c=k;return this.b=c};
G.prototype.q=function(){var e=0,c=this.b,d=this.i,b,a=new (u?Uint8Array:Array)(this.n+(this.a-32768)),f,g,k,m;if(0===d.length)return u?this.b.subarray(32768,this.a):this.b.slice(32768,this.a);f=0;for(g=d.length;f<g;++f){b=d[f];k=0;for(m=b.length;k<m;++k)a[e++]=b[k]}f=32768;for(g=this.a;f<g;++f)a[e++]=c[f];this.i=[];return this.buffer=a};
G.prototype.B=function(){var e,c=this.a;u?this.z?(e=new Uint8Array(c),e.set(this.b.subarray(0,c))):e=this.b.subarray(0,c):(this.b.length>c&&(this.b.length=c),e=this.b);return this.buffer=e};function $(e){this.input=e;this.c=0;this.m=[];this.s=!1}$.prototype.G=function(){this.s||this.g();return this.m.slice()};
$.prototype.g=function(){for(var e=this.input.length;this.c<e;){var c=new B,d=q,b=q,a=q,f=q,g=q,k=q,m=q,p=q,t=q,h=this.input,l=this.c;c.u=h[l++];c.v=h[l++];(31!==c.u||139!==c.v)&&n(Error("invalid file signature:"+c.u+","+c.v));c.p=h[l++];switch(c.p){case 8:break;default:n(Error("unknown compression method: "+c.p))}c.h=h[l++];p=h[l++]|h[l++]<<8|h[l++]<<16|h[l++]<<24;c.I=new Date(1E3*p);c.O=h[l++];c.N=h[l++];0<(c.h&4)&&(c.J=h[l++]|h[l++]<<8,l+=c.J);if(0<(c.h&8)){m=[];for(k=0;0<(g=h[l++]);)m[k++]=String.fromCharCode(g);
c.name=m.join("")}if(0<(c.h&16)){m=[];for(k=0;0<(g=h[l++]);)m[k++]=String.fromCharCode(g);c.K=m.join("")}0<(c.h&2)&&(c.C=x(h,0,l)&65535,c.C!==(h[l++]|h[l++]<<8)&&n(Error("invalid header crc16")));d=h[h.length-4]|h[h.length-3]<<8|h[h.length-2]<<16|h[h.length-1]<<24;h.length-l-4-4<512*d&&(f=d);b=new G(h,{index:l,bufferSize:f});c.data=a=b.g();l=b.c;c.L=t=(h[l++]|h[l++]<<8|h[l++]<<16|h[l++]<<24)>>>0;x(a,q,q)!==t&&n(Error("invalid CRC-32 checksum: 0x"+x(a,q,q).toString(16)+" / 0x"+t.toString(16)));c.M=
d=(h[l++]|h[l++]<<8|h[l++]<<16|h[l++]<<24)>>>0;(a.length&4294967295)!==d&&n(Error("invalid input size: "+(a.length&4294967295)+" / "+d));this.m.push(c);this.c=l}this.s=!0;var y=this.m,s,M,S=0,T=0,C;s=0;for(M=y.length;s<M;++s)T+=y[s].data.length;if(u){C=new Uint8Array(T);for(s=0;s<M;++s)C.set(y[s].data,S),S+=y[s].data.length}else{C=[];for(s=0;s<M;++s)C[s]=y[s].data;C=Array.prototype.concat.apply([],C)}return C};r("Zlib.Gunzip",$);r("Zlib.Gunzip.prototype.decompress",$.prototype.g);r("Zlib.Gunzip.prototype.getMembers",$.prototype.G);}).call(this); //@ sourceMappingURL=gunzip.min.js.map


/**
 * @author Hiroyuki Wakaguri: hwakagur@bits.cc
 * bigbed.js v1.1.20170420
 */
 

var BigbedData = function(fil, option) {
	this.file = fil;
	this.option = (option !== undefined)? option: {};
	
	this.fileType = "None";
	
	this.indexBuff = 512000;
	//読み込み済みもしくは、読み込みリクエスト中データ
	this.loadData = {};
	this.loadData.zoom = {};
	this.loadData.zoom.indexData = {};
	
	this.indexData = {};
	this.chromData = {};
	this.zoomData = {};
	this.rawData = {};
};

BigbedData.prototype.accRequest = function(callback, reject, option) {
	if(option === undefined) option = {};
	
	if(this.option.localFlg) {
		var accFile = (option.file !== undefined)? option.file: this.file;
		var blob = accFile;
		if(option.byteStart !== undefined && option.byteEnd !== undefined) {
			blob = accFile.slice(option.byteStart, option.byteEnd + 1);
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
		this.accWebRequest(callback, reject, option);
	}
};

BigbedData.prototype.accWebRequest = function(callback, reject, option) {
	let accFile = (option.file !== undefined)? option.file: this.file;
	let xhr = new XMLHttpRequest();
	xhr.open('GET', accFile, true);
	if(option.byteStart !== undefined && option.byteEnd !== undefined) {
		//ChromeのRangeが通らないバグ対策
		xhr.setRequestHeader("X-Test", "bytes=" + option.byteStart + "-" + option.byteEnd);
		xhr.setRequestHeader("Range", "bytes=" + option.byteStart + "-" + option.byteEnd);
	}
	xhr.addEventListener('loadend', function(ev) {
		if(xhr.status !== 200 && xhr.status !== 206 && xhr.status !== 0){
			console.error(
				'web status: ' + xhr.status + ', ' + xhr.statusText + 
					", bytes=" + option.byteStart + "-" + option.byteEnd
			);
			reject("web access failed", xhr);
			return xhr.status;
		} else if(xhr.status === 0) {
		//以下chromeのバグ対策
			console.log(
				'Retry: web status: (0), ' + xhr.statusText + 
					", bytes=" + option.byteStart + "-" + option.byteEnd
			);
			let xhr2 = new XMLHttpRequest();
			xhr2.open('GET', accFile, true);
			if(option.byteStart !== undefined && option.byteEnd !== undefined) {
				xhr2.setRequestHeader("Range", "bytes=" + option.byteStart + "-" + option.byteEnd);
			}
			xhr2.addEventListener('loadend', function(ev2) {
				if(xhr2.status !== 200 && xhr2.status !== 206) {
					console.error(
						'web status: ' + xhr2.status + ', ' + xhr2.statusText + 
							", bytes=" + option.byteStart + "-" + option.byteEnd
					);
					reject("web access failed", xhr2);
					return xhr2.status;
				}
				callback(xhr2.response);
			}, false);
			xhr2.responseType = 'arraybuffer';
			xhr2.send();
			
			return;
		}
		callback(xhr.response);
	}, false);
	xhr.responseType = 'arraybuffer';
	xhr.send();
};

BigbedData.prototype.header = function(reductionLevel) {
	let m = this;
	
	let option = {};
	option.byteStart = 0;
	option.byteEnd = 63;
	
	return new Promise(function(resolve, reject){
		if(m.loadData.header) {
			resolve([m, reductionLevel]);
			return;
		}
		
		m.loadData.header = true;
		m.accRequest(function(response) {
			let plain = new Uint8Array(response);
			let dataview = new DataView(plain.buffer);
			
			let magic = dataview.getUint32(0, true);
			if(magic == 2273964779) {
				m.fileType = "BigBed";
			} else if(magic == 2291137574) {
				m.fileType = "BigWig";
			} else {
				alert("unsupported file: " + magic);
				return false;
			}
			
			let zoomLevels = dataview.getUint16(6, true);
			
			let chrPos = 
				dataview.getUint32(8 + 4, true) * Math.pow(256, 4) + 
				dataview.getUint32(8, true);
			
			let dataPos = 
				dataview.getUint32(16 + 4, true) * Math.pow(256, 4) + 
				dataview.getUint32(16, true);
			
			let indexPos = 
				dataview.getUint32(24 + 4, true) * Math.pow(256, 4) + 
				dataview.getUint32(24, true);
			
			let fieldCount = dataview.getUint16(32, true);
			let definedFieldCount = dataview.getUint16(34, true);
			
			let byteStart = indexPos;
			//let byteEnd = indexPos + m.indexBuff - 1;
			
			m.indexData.byteStart = byteStart;
			//m.indexData.byteEnd = byteEnd;
			m.chromData.byteStart = chrPos;
			m.chromData.byteEnd = dataPos;
			m.zoomData.zoomLevels = zoomLevels;
			resolve([m, reductionLevel]);
			
		}, reject, option);
	});
};


BigbedData.prototype.accChromData = function(self) {
	return new Promise(function(resolve, reject){
		if(self.chromData.byteEnd === undefined || self.loadData.chromData) {
			resolve(self);
			return;
		}
		
		let option = {};
		option.byteStart = self.chromData.byteStart;
		option.byteEnd = self.chromData.byteEnd;
		
		self.loadData.chromData = true;
		self.accRequest(function(response) {
			let plain = new Uint8Array(response);
			let dataview = new DataView(plain.buffer);
			
			
			let magic = dataview.getUint32(0, true);
			let blockSize = dataview.getUint32(4, true);
			let keySize = dataview.getUint32(8, true);
			let valSize = dataview.getUint32(12, true);
			let itemCount = 
				dataview.getUint32(16 + 4, true) * Math.pow(256, 4) + 
				dataview.getUint32(16, true);

			self.chromData.plain = plain;
			
			let name2id = {};
			self.addName2id(name2id, plain, self.chromData.byteStart + 32, keySize);
			self.chromData.name2id = name2id;
			
			resolve(self);
			
		}, reject, option);
	});
};

BigbedData.prototype.addName2id = function(name2id, plain, childOffset, keySize) {
	let dataview = new DataView(plain.buffer);
	let byteStart = this.chromData.byteStart;
	let poi = childOffset - byteStart;
	
	let isLeaf = dataview.getUint8(poi, true);
	poi += 2;
	
	let count = dataview.getUint16(poi, true);
	poi += 2;
	
	if(isLeaf == 1) {
		for(let i = 1; i <= count; i ++) {
			let chrName = "";
			for(let j = 1; j <= keySize; j ++) {
				if(plain[poi] != 0) chrName += String.fromCharCode(plain[poi]);
				poi ++;
			}
			
			let chromId = dataview.getUint32(poi, true);
			poi += 4;
			
			let chromSize = dataview.getUint32(poi, true);
			poi += 4;
			
			name2id[chrName] = chromId;
		}
	} else if(isLeaf == 0) {
		for(let i = 1; i <= count; i ++) {
			poi += keySize;
			
			let childOffset = 
				dataview.getUint32(poi + 4, true) * Math.pow(256, 4) + 
				dataview.getUint32(poi, true);
			poi += 8;
			this.addName2id(name2id, plain, childOffset, keySize);
		}
	} else {
		alert("error: not supported isLeaf = " + isLeaf);
		return false;
	}
};


BigbedData.prototype.accZoomData = function(param) {
	let self = param[0];
	let reductionLevel = param[1];
	return new Promise(function(resolve, reject){
		if(self.zoomData.zoomLevels === undefined || self.loadData.zoom.base) {
			resolve(param);
			return;
		}
		
		
		let option = {};
		option.byteStart = 64;
		option.byteEnd = 64 + self.zoomData.zoomLevels * 24 - 1;
		
		self.loadData.zoom.base = true;
		self.accRequest(function(response) {
			let plain = new Uint8Array(response);
			let dataview = new DataView(plain.buffer);
			
			let zoomData = {};
			let poi = 0;
			for(let i = 0; i < self.zoomData.zoomLevels; i ++) {
				let reductionLevel = dataview.getUint32(poi, true);
				poi += 8;
				let dataOffset = 
					dataview.getUint32(poi + 4, true) * Math.pow(256, 4) + 
					dataview.getUint32(poi, true);
				poi += 8;
				let indexOffset = 
					dataview.getUint32(poi + 4, true) * Math.pow(256, 4) + 
					dataview.getUint32(poi, true);
				poi += 8;
				
				zoomData[reductionLevel] = {};
				zoomData[reductionLevel].dataOffset = dataOffset;
				zoomData[reductionLevel].indexOffset = indexOffset;
				
				if(self.zoomData.minDataOffset === undefined) self.zoomData.minDataOffset = dataOffset;
				
			}
			//zoom情報なし
			if(self.zoomData.zoomLevels == 0) self.zoomData.minDataOffset = 0;
			
			//self.zoomData.plain = plain;
			self.zoomData.indexData = zoomData;
			
			resolve(param);
			
		}, reject, option);
	});
};

BigbedData.prototype.accIndexData = function(param) {
	let self = param[0];
	
	return new Promise(function(resolve, reject){
		if(self.zoomData.minDataOffset === undefined || self.loadData.indexData) {
			resolve(self);
			return;
		}
		
		let option = {};
		option.byteStart = self.indexData.byteStart;
		option.byteEnd = 
			(self.zoomData.minDataOffset == 0)? "": self.zoomData.minDataOffset - 1;
		
		self.loadData.indexData = true;
		self.accRequest(function(response) {
			let plain = new Uint8Array(response);
			self.indexData.plain = plain;
			
			resolve(self);
			
		}, reject, option);
	});
};

BigbedData.prototype.accZoomIndexData = function(param) {
	let self = param[0];
	let reductionLevel = param[1];
	return new Promise(function(resolve, reject){
		if(
			self.zoomData.minDataOffset === undefined || 
			self.loadData.zoom.indexData[reductionLevel]
		) {
			resolve(self);
			return;
		}
		
		let nextReductionLevel;
		for (let key in self.zoomData.indexData) {
			if(reductionLevel < parseInt(key)) {
				if(nextReductionLevel === undefined) {
					nextReductionLevel = parseInt(key);
				} else if(nextReductionLevel > parseInt(key)) {
					nextReductionLevel = parseInt(key);
				}
			}
		}
		
		let option = {};
		option.byteStart = self.zoomData.indexData[reductionLevel].indexOffset;
		option.byteEnd = (nextReductionLevel === undefined)? "":
			self.zoomData.indexData[nextReductionLevel].dataOffset - 4 - 1;
		
		self.loadData.zoom.indexData[reductionLevel] = true;
		self.accRequest(function(response) {
			let plain = new Uint8Array(response);
			self.zoomData.indexData[reductionLevel].plain = plain;
			
			resolve(self);
			
		}, reject, option);
	});
};

BigbedData.prototype.loadRegionData = function(chr, start, end, reductionLevel, callback, reject) {
	if(reductionLevel == 0) {
		this.loadBaseRegionData(chr, start, end, callback, reject);
	} else {
		this.loadZoomRegionData(chr, start, end, reductionLevel, callback, reject);
	}
};

BigbedData.prototype.loadBaseRegionData = function(chr, start, end, callback, reject) {
	let m = this;
	
	this.header().then(m.accZoomData).then(m.accIndexData).then(m.accChromData).then(function() {
		if(m.indexData.plain === undefined || m.chromData.name2id === undefined) {
			//染色体情報：load中・・・
			callback([]);
			return;
		}
		
		let chromIx = m.chromData.name2id[chr];
		if(chromIx === undefined) {
			callback([]);
		} else {
			let resultDataPos = [];
			let byteStart = m.indexData.byteStart;
			let plainData = [byteStart, m.indexData.plain];
			m.checkIndex(resultDataPos, [byteStart + 48], [chromIx, start, end], plainData);
			let accDataPos = m.getAccDataPos(chromIx, resultDataPos);
			
			let promises = [];
			let num = accDataPos.length;
			for(let i = 0; i < num; i ++) {
				promises.push(m.accBigbedPartial(chromIx, accDataPos));
			}
			Promise.all(promises).then(callback).catch(reject);
		}
		
	});
};

BigbedData.prototype.loadZoomRegionData = function(chr, start, end, reductionLevel, callback, reject) {
	let m = this;
	
	this.header(reductionLevel).then(m.accZoomData).then(m.accZoomIndexData).then(m.accChromData).then(function() {
		if(
			m.zoomData.indexData === undefined || 
			m.zoomData.indexData[reductionLevel] === undefined || 
			m.zoomData.indexData[reductionLevel].plain === undefined || 
			m.chromData.name2id === undefined
		) {
			//染色体情報：load中・・・
			callback([]);
			return;
		}
		
		let chromIx = m.chromData.name2id[chr];
		if(chromIx === undefined) {
			callback([]);
		} else {
			let resultDataPos = [];
			let byteStart = m.zoomData.indexData[reductionLevel].indexOffset;
			let plainData = [byteStart, m.zoomData.indexData[reductionLevel].plain];
			m.checkIndex(resultDataPos, [byteStart + 48], [chromIx, start, end], plainData);
			
			let accDataPos = m.getAccDataPos(chromIx, resultDataPos, reductionLevel);
			let promises = [];
			let num = accDataPos.length;
			for(let i = 0; i < num; i ++) {
				promises.push(m.accZoomBigbedPartial(chromIx, accDataPos, reductionLevel));
			}
			Promise.all(promises).then(callback).catch(reject);
		}
		
	});
};


//dataを読み込んだ後呼ばれることが前提
BigbedData.prototype.getData = function(chr, start, end, reductionLevel) {
	let resData;
	if(reductionLevel == 0) {
		resData = this.getBaseData(chr, start, end);
	} else {
		resData = this.getZoomData(chr, start, end, reductionLevel);
	}
	
	return resData;
};

BigbedData.prototype.getBaseData = function(chr, start, end) {
	let m = this;
	let resData = [];
	
	let chromIx = m.chromData.name2id[chr];
	if(chromIx === undefined) return resData;
	let dataChr = m.loadData.data[chromIx];
	
	if(chromIx === undefined) {
	} else {
		let resultDataPos = [];
		let byteStart = m.indexData.byteStart;
		let plainData = [byteStart, m.indexData.plain];
		m.checkIndex(resultDataPos, [byteStart + 48], [chromIx, start, end], plainData);
		for(let i = 0; i < resultDataPos.length; i ++) {
			let dataPos = resultDataPos[i];
			let dataOffset = dataPos[0];
			let byteEnd = dataOffset + dataPos[1] - 1;
			while (dataOffset < byteEnd) {
				if(m.fileType == "BigWig") {
					let dataChunk = m.rawData[chromIx][dataOffset];
					let pos = dataChunk.chromStart;
					let step = dataChunk.itemStep;
					for(let j = 0; j < dataChunk.itemCount; j ++) {
						let seVal = dataChunk.items[j];
						if(start <= seVal.chromEnd && seVal.chromStart <= end) {
							resData.push(seVal);
						}
					}
				} else {
					let dataSet = m.rawData[chromIx][dataOffset];
					for(let j = 0; j < dataSet.length; j ++) {
						let seVal = dataSet[j];
						if(start <= seVal.chromEnd && seVal.chromStart <= end) {
							resData.push(seVal);
						}
					}
				}
				
				let dataSize = dataChr[dataOffset];
				dataOffset += dataSize;
			}
		}
	}
	
	return resData;
};


BigbedData.prototype.getZoomData = function(chr, start, end, reductionLevel) {
	let m = this;
	let resData = [];
	
	let chromIx = m.chromData.name2id[chr];
	if(chromIx === undefined) return resData;
	let dataChr = m.loadData.zoom.data[reductionLevel][chromIx];
	
	if(chromIx === undefined) {
	} else {
		let resultDataPos = [];
		let byteStart = m.zoomData.indexData[reductionLevel].indexOffset;
		let plainData = [byteStart, m.zoomData.indexData[reductionLevel].plain];
		m.checkIndex(resultDataPos, [byteStart + 48], [chromIx, start, end], plainData);
		for(let i = 0; i < resultDataPos.length; i ++) {
			let dataPos = resultDataPos[i];
			let dataOffset = dataPos[0];
			let byteEnd = dataOffset + dataPos[1] - 1;
			while (dataOffset < byteEnd) {
				let dataChunkList = m.zoomData.rawData[reductionLevel][chromIx][dataOffset];
				for(let j = 0; j < dataChunkList.length; j ++) {
					let dataChunk = dataChunkList[j];
					if(start <= dataChunk.chromEnd && dataChunk.chromStart <= end) {
						resData.push(dataChunk);
					}
				}
				
				let dataSize = dataChr[dataOffset];
				dataOffset += dataSize;
			}
		}
	}
	
	return resData;
};

BigbedData.prototype.isAllLoaded = function(chr, start, end, reductionLevel) {
	let m = this;
	
	if(
		(reductionLevel == 0 && m.indexData.plain === undefined) || 
		(
			reductionLevel != 0 && 
			(
				m.zoomData.indexData === undefined || 
				m.zoomData.indexData[reductionLevel] === undefined || 
				m.zoomData.indexData[reductionLevel].plain === undefined
			)
		) || 
		m.chromData.name2id === undefined
	) {
		return false;
	}
	
	let chromIx = m.chromData.name2id[chr];
	
	//ファイルにない染色体はデータなしでOK
	if(chromIx === undefined) return true;
	
	let dataChr = (reductionLevel == 0)? m.loadData.data[chromIx]: 
		m.loadData.zoom.data[reductionLevel][chromIx];
	
	let resData = [];
	if(chromIx === undefined) {
	} else {
		let resultDataPos = [];
		let byteStart = (reductionLevel == 0)? m.indexData.byteStart: 
			m.zoomData.indexData[reductionLevel].indexOffset;
		let indexData = (reductionLevel == 0)? m.indexData.plain: 
			m.zoomData.indexData[reductionLevel].plain;
		let plainData = [byteStart, indexData];
		m.checkIndex(resultDataPos, [byteStart + 48], [chromIx, start, end], plainData);
		for(let i = 0; i < resultDataPos.length; i ++) {
			let dataPos = resultDataPos[i];
			let dataOffset = dataPos[0];
			let byteEnd = dataOffset + dataPos[1] - 1;
			while (dataOffset < byteEnd) {
				if(
					(
						reductionLevel == 0 && (
							m.rawData[chromIx] === undefined || 
							m.rawData[chromIx][dataOffset] === undefined
						)
					) || (
						reductionLevel != 0 && (
							m.zoomData.rawData === undefined || 
							m.zoomData.rawData[reductionLevel] === undefined || 
							m.zoomData.rawData[reductionLevel][chromIx] === undefined || 
							m.zoomData.rawData[reductionLevel][chromIx][dataOffset] === undefined
						)
					)
				) {
					return false;
				}
				let dataSize = dataChr[dataOffset];
				dataOffset += dataSize;
			}
		}
	}
	
	return true;
};

BigbedData.prototype.readWaitReader = function(
	chr, start, end, queryReductionLevel, callback, reject, option
) {
	
	if(option === undefined) option = {};
	if(option.timeout === undefined) option.timeout = 300;
	
	let m = this;
	
	this.header().then(m.accZoomData).then(function() {
		let reductionLevel = 0;
		for (let key in m.zoomData.indexData) {
			if(reductionLevel < parseInt(key) && parseInt(key) <= queryReductionLevel) {
				reductionLevel = parseInt(key);
			}
		}
		
		//dataを読み込んだ後呼ばれる
		let func = function* () {
			let resData = m.getData(chr, start, end, reductionLevel);
			for(let i = 0; i < resData.length; i ++) {
				yield resData[i];
			}
		};
		
		m.loadRegionData(chr, start, end, reductionLevel, function() {
			if(!m.isAllLoaded(chr, start, end, reductionLevel)) {
				let counter = 0;
				let loopFunc = function() {
					m.loadRegionData(chr, start, end, reductionLevel, function() {
						if(m.isAllLoaded(chr, start, end, reductionLevel)) {
							callback(reductionLevel, func);
						} else {
							if(++ counter >= option.timeout) {
								reject("timeout bigbed.js");
							} else {
								setTimeout(loopFunc, 1000);
							}
						}
					}, reject);
					
				};
				loopFunc();
			} else {
				callback(reductionLevel, func);
			}
		}, reject);
	}, reject);
};

BigbedData.prototype.checkIndex = function(resultDataPos, indPosList, queryRegion, plainData) {
	let plainIndex = plainData[1];
	let dataview = new DataView(plainIndex.buffer);
	let byteBase = plainData[0];
	
	let chromIx = queryRegion[0];
	let start = queryRegion[1];
	let end = queryRegion[2];
	
	let inIndPosList = [];
	for(let i = 0; i < indPosList.length; i ++) {
		let indPos = indPosList[i];
		let poi = indPos - byteBase;
		
		let isLeaf = dataview.getUint8(poi, true);
		poi += 2;
		let count = dataview.getUint16(poi, true);
		poi += 2;
		
		for(let j = 1; j <= count; j ++) {
			if(isLeaf == 0) {
				let startChromIx = dataview.getUint32(poi, true);
				poi += 4;
				
				let startBase = dataview.getUint32(poi, true) + 1;
				poi += 4;
				
				let endChromIx = dataview.getUint32(poi, true);
				poi += 4;
				
				let endBase = dataview.getUint32(poi, true);
				poi += 4;
				
				let dataOffset = 
					dataview.getUint32(poi + 4, true) * Math.pow(256, 4) + 
					dataview.getUint32(poi, true);
				poi += 8;
				
				if(
					(startChromIx < chromIx || (startChromIx == chromIx && startBase <= end)) && 
					(chromIx < endChromIx || (endChromIx == chromIx && start <= endBase))
				) {
					inIndPosList.push(dataOffset);
				}
			} else if(isLeaf == 1) {
				let startChromIx = dataview.getUint32(poi, true);
				poi += 4;
				
				let startBase = dataview.getUint32(poi, true) + 1;
				poi += 4;
				
				let endChromIx = dataview.getUint32(poi, true);
				poi += 4;
				
				let endBase = dataview.getUint32(poi, true);
				poi += 4;
				
				let dataOffset = 
					dataview.getUint32(poi + 4, true) * Math.pow(256, 4) + 
					dataview.getUint32(poi, true);
				poi += 8;
				
				let dataSize = 
					dataview.getUint32(poi + 4, true) * Math.pow(256, 4) + 
					dataview.getUint32(poi, true);
				poi += 8;
				
				if(
					(startChromIx < chromIx || (startChromIx == chromIx && startBase <= end)) && 
					(chromIx < endChromIx || (endChromIx == chromIx && start <= endBase))
				) {
					resultDataPos.push([dataOffset, dataSize]);
				}
			} else {
				alert("Error: Invalid file format");
			}
		}
		
		
		this.checkIndex(resultDataPos, inIndPosList, queryRegion, plainData);
	}
};

BigbedData.prototype.getAccDataPos = function(chromIx, resultDataPos, reductionLevel) {
	let sorter2 = [];
	let sorter = {};


	if(reductionLevel === undefined || reductionLevel == 0) {
		if(this.loadData.data === undefined) 
			this.loadData.data = {};
		if(this.loadData.data[chromIx] === undefined) 
			this.loadData.data[chromIx] = {};
	} else {
		if(this.loadData.zoom.data === undefined) 
			this.loadData.zoom.data = {};
		if(this.loadData.zoom.data[reductionLevel] === undefined) 
			this.loadData.zoom.data[reductionLevel] = {};
		if(this.loadData.zoom.data[reductionLevel][chromIx] === undefined) 
			this.loadData.zoom.data[reductionLevel][chromIx] = {};
	}


	for(let i = 0; i < resultDataPos.length; i ++) {
		let dataPos = resultDataPos[i];
		let dataOffset = dataPos[0];
		let dataSize = dataPos[1];
		if(reductionLevel === undefined || reductionLevel == 0) {
			if(this.loadData.data[chromIx][dataOffset] === undefined) {
				this.loadData.data[chromIx][dataOffset] = dataSize;
				sorter2.push(dataOffset);
				sorter[dataOffset] = dataOffset + dataSize;
			}
		} else {
			if(this.loadData.zoom.data[reductionLevel][chromIx][dataOffset] === undefined) {
				this.loadData.zoom.data[reductionLevel][chromIx][dataOffset] = dataSize;
				sorter2.push(dataOffset);
				sorter[dataOffset] = dataOffset + dataSize;
			}
		}
	}
	
	let accDataPos = [];
	let sorted2 = sorter2.sort(function(a,b){return a-b;});
	let dataOffsetNext;
	for(let i = 0; i < sorted2.length; i ++) {
		let dataOffset = sorted2[i];
		if(dataOffsetNext === undefined || dataOffsetNext != dataOffset) {
			accDataPos.push([dataOffset, sorter[dataOffset]]);
		} else {
			accDataPos[accDataPos.length - 1][1] = sorter[dataOffset];
		}
		dataOffsetNext = sorter[dataOffset];
	}
	
	return accDataPos;
};

BigbedData.prototype.accBigbedPartial = function(chromIx, accDataPos) {
	let m = this;

	let accData = accDataPos.pop();
	
	let option = {};
	option.byteStart = accData[0];
	option.byteEnd = accData[1] - 1;
	
	let byteEnd = accData[1];
	let dataChr = this.loadData.data[chromIx];
	
	return new Promise(function(resolve, reject){
		m.accRequest(function(response) {
			let totalArray = new Uint8Array(response);
			
			let str = "";
			let dataPoi = 0;
			let dataOffset = accData[0];
			while (dataOffset < byteEnd) {
				let dataSize = dataChr[dataOffset];
				let subArray = totalArray.slice(dataPoi, dataPoi + dataSize);
				let plain = subArray;
				if((plain[0] & 15) == 8) plain = new Zlib.Inflate(subArray).decompress();
				let dataview = new DataView(plain.buffer);
				
				if(m.fileType == "BigWig") {
					let dataChunk = {};
					
					let poi = 4;
					dataChunk.chromStart = dataview.getUint32(poi, true) + 1;
					poi += 4;
					
					dataChunk.chromEnd = dataview.getUint32(poi, true);
					poi += 4;
					
					dataChunk.itemStep = dataview.getUint32(poi, true);
					poi += 4;
					
					dataChunk.itemSpan = dataview.getUint32(poi, true);
					poi += 4;
					
					dataChunk.type = dataview.getUint8(poi, true);
					poi += 2;
					
					dataChunk.itemCount = dataview.getUint16(poi, true);
					poi += 2;
					
					//dataChunk.items = dataview.getFloat32(poi);
					
					dataChunk.items = [];
					let chromStart = dataChunk.chromStart;
					let chromEnd = dataChunk.chromStart + dataChunk.itemSpan - 1;
					for(let i = 0; i < dataChunk.itemCount; i ++) {
						if(dataChunk.itemStep == 0) {
							chromStart = dataview.getUint32(poi, true) + 1;
							poi += 4;
							
							if(dataChunk.itemSpan == 0) {
								chromEnd = dataview.getUint32(poi, true);
								poi += 4;
							} else {
								chromEnd = chromStart + dataChunk.itemSpan - 1;
							}
						} else {
							chromEnd = chromStart + dataChunk.itemSpan - 1;
						}
						
						
						let val = dataview.getFloat32(poi, true);
						poi += 4;
						
						let seVal = {
							chromStart: chromStart,
							chromEnd: chromEnd,
							value: val
						};
						dataChunk.items.push(seVal);
						
						if(dataChunk.itemStep != 0) {
							chromStart += dataChunk.itemStep;
						}
					}
					
					if(m.rawData[chromIx] === undefined) 
						m.rawData[chromIx] = {};
					
					m.rawData[chromIx][dataOffset] = dataChunk;
					
				} else {
					let poi = 0;
					let dataSet = [];
					while(poi < plain.length) {
						let lineData = {};
						//let chromIx = dataview.getUint32(poi, true) + 1;
						poi += 4;
						
						lineData.chromStart = dataview.getUint32(poi, true) + 1;
						poi += 4;
						
						lineData.chromEnd = dataview.getUint32(poi, true);
						poi += 4;
						
						let clmVal = "";
						while(true) {
							if(plain[poi] == 0) {
								poi ++;
								break;
							} else {
								clmVal += String.fromCharCode(plain[poi]);
							}
							poi ++;
						}
						lineData.otherClm = clmVal;
						
						dataSet.push(lineData);
					}
					
					if(m.rawData[chromIx] === undefined) 
						m.rawData[chromIx] = {};
					
					m.rawData[chromIx][dataOffset] = dataSet;
					
				}
				dataOffset += dataSize;
				dataPoi += dataSize;
			}
			resolve(m);
		}, reject, option);
	});
};

BigbedData.prototype.accZoomBigbedPartial = function(chromIx, accDataPos, reductionLevel) {
	let m = this;

	let accData = accDataPos.pop();
	
	let option = {};
	option.byteStart = accData[0];
	option.byteEnd = accData[1] - 1;
	
	let byteEnd = accData[1];
	let dataChr = this.loadData.zoom.data[reductionLevel][chromIx];
	
	return new Promise(function(resolve, reject){
		m.accRequest(function(response) {
			let totalArray = new Uint8Array(response);
			
			let str = "";
			let dataPoi = 0;
			let dataOffset = accData[0];
			while (dataOffset < byteEnd) {
				
				let dataSize = dataChr[dataOffset];
				let subArray = totalArray.slice(dataPoi, dataPoi + dataSize);
				
				let plain = subArray;
				if((plain[0] & 15) == 8) plain = new Zlib.Inflate(subArray).decompress();
				let dataview = new DataView(plain.buffer);
				
				let dataChunkList = [];
				let poi = 0;
				while(poi < plain.length) {
					let dataChunk = {};
					
					dataChunk.chromId = dataview.getUint32(poi, true);
					poi += 4;
					
					dataChunk.chromStart = dataview.getUint32(poi, true) + 1;
					poi += 4;
					
					dataChunk.chromEnd = dataview.getUint32(poi, true);
					poi += 4;
					
					dataChunk.validCount = dataview.getUint32(poi, true);
					poi += 4;
					
					dataChunk.minVal = dataview.getFloat32(poi, true);
					poi += 4;
					
					dataChunk.maxVal = dataview.getFloat32(poi, true);
					poi += 4;
					
					dataChunk.sumData = dataview.getFloat32(poi, true);
					poi += 4;
					
					dataChunk.sumSquares = dataview.getFloat32(poi, true);
					poi += 4;
					
					dataChunkList.push(dataChunk);
				}
				
				if(m.zoomData.rawData === undefined) 
					m.zoomData.rawData = {};
				if(m.zoomData.rawData[reductionLevel] === undefined) 
					m.zoomData.rawData[reductionLevel] = {};
				if(m.zoomData.rawData[reductionLevel][chromIx] === undefined) 
					m.zoomData.rawData[reductionLevel][chromIx] = {};
				
				m.zoomData.rawData[reductionLevel][chromIx][dataOffset] = dataChunkList;
				
				dataOffset += dataSize;
				dataPoi += dataSize;
			}
			
			resolve(m);
		}, reject, option);
	});
};


BigbedData.prototype.onError = function(err) {
	alert("Error:" + err);
};




/** @license zlib.js 2012 - imaya [ https://github.com/imaya/zlib.js ] The MIT License */
(function() {'use strict';var m=this;function q(c,d){var a=c.split("."),b=m;!(a[0]in b)&&b.execScript&&b.execScript("var "+a[0]);for(var e;a.length&&(e=a.shift());)!a.length&&void 0!==d?b[e]=d:b=b[e]?b[e]:b[e]={}};var s="undefined"!==typeof Uint8Array&&"undefined"!==typeof Uint16Array&&"undefined"!==typeof Uint32Array&&"undefined"!==typeof DataView;function t(c){var d=c.length,a=0,b=Number.POSITIVE_INFINITY,e,f,g,h,k,l,p,n,r,K;for(n=0;n<d;++n)c[n]>a&&(a=c[n]),c[n]<b&&(b=c[n]);e=1<<a;f=new (s?Uint32Array:Array)(e);g=1;h=0;for(k=2;g<=a;){for(n=0;n<d;++n)if(c[n]===g){l=0;p=h;for(r=0;r<g;++r)l=l<<1|p&1,p>>=1;K=g<<16|n;for(r=l;r<e;r+=k)f[r]=K;++h}++g;h<<=1;k<<=1}return[f,a,b]};function u(c,d){this.g=[];this.h=32768;this.d=this.f=this.a=this.l=0;this.input=s?new Uint8Array(c):c;this.m=!1;this.i=v;this.s=!1;if(d||!(d={}))d.index&&(this.a=d.index),d.bufferSize&&(this.h=d.bufferSize),d.bufferType&&(this.i=d.bufferType),d.resize&&(this.s=d.resize);switch(this.i){case w:this.b=32768;this.c=new (s?Uint8Array:Array)(32768+this.h+258);break;case v:this.b=0;this.c=new (s?Uint8Array:Array)(this.h);this.e=this.A;this.n=this.w;this.j=this.z;break;default:throw Error("invalid inflate mode");
}}var w=0,v=1,x={u:w,t:v};
u.prototype.k=function(){for(;!this.m;){var c=y(this,3);c&1&&(this.m=!0);c>>>=1;switch(c){case 0:var d=this.input,a=this.a,b=this.c,e=this.b,f=d.length,g=void 0,h=void 0,k=b.length,l=void 0;this.d=this.f=0;if(a+1>=f)throw Error("invalid uncompressed block header: LEN");g=d[a++]|d[a++]<<8;if(a+1>=f)throw Error("invalid uncompressed block header: NLEN");h=d[a++]|d[a++]<<8;if(g===~h)throw Error("invalid uncompressed block header: length verify");if(a+g>d.length)throw Error("input buffer is broken");switch(this.i){case w:for(;e+
g>b.length;){l=k-e;g-=l;if(s)b.set(d.subarray(a,a+l),e),e+=l,a+=l;else for(;l--;)b[e++]=d[a++];this.b=e;b=this.e();e=this.b}break;case v:for(;e+g>b.length;)b=this.e({p:2});break;default:throw Error("invalid inflate mode");}if(s)b.set(d.subarray(a,a+g),e),e+=g,a+=g;else for(;g--;)b[e++]=d[a++];this.a=a;this.b=e;this.c=b;break;case 1:this.j(z,A);break;case 2:B(this);break;default:throw Error("unknown BTYPE: "+c);}}return this.n()};
var C=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],D=s?new Uint16Array(C):C,E=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,258,258],F=s?new Uint16Array(E):E,G=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0],H=s?new Uint8Array(G):G,I=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],J=s?new Uint16Array(I):I,L=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,
13],M=s?new Uint8Array(L):L,N=new (s?Uint8Array:Array)(288),O,P;O=0;for(P=N.length;O<P;++O)N[O]=143>=O?8:255>=O?9:279>=O?7:8;var z=t(N),Q=new (s?Uint8Array:Array)(30),R,S;R=0;for(S=Q.length;R<S;++R)Q[R]=5;var A=t(Q);function y(c,d){for(var a=c.f,b=c.d,e=c.input,f=c.a,g=e.length,h;b<d;){if(f>=g)throw Error("input buffer is broken");a|=e[f++]<<b;b+=8}h=a&(1<<d)-1;c.f=a>>>d;c.d=b-d;c.a=f;return h}
function T(c,d){for(var a=c.f,b=c.d,e=c.input,f=c.a,g=e.length,h=d[0],k=d[1],l,p;b<k&&!(f>=g);)a|=e[f++]<<b,b+=8;l=h[a&(1<<k)-1];p=l>>>16;c.f=a>>p;c.d=b-p;c.a=f;return l&65535}
function B(c){function d(a,c,b){var d,e=this.q,f,g;for(g=0;g<a;)switch(d=T(this,c),d){case 16:for(f=3+y(this,2);f--;)b[g++]=e;break;case 17:for(f=3+y(this,3);f--;)b[g++]=0;e=0;break;case 18:for(f=11+y(this,7);f--;)b[g++]=0;e=0;break;default:e=b[g++]=d}this.q=e;return b}var a=y(c,5)+257,b=y(c,5)+1,e=y(c,4)+4,f=new (s?Uint8Array:Array)(D.length),g,h,k,l;for(l=0;l<e;++l)f[D[l]]=y(c,3);if(!s){l=e;for(e=f.length;l<e;++l)f[D[l]]=0}g=t(f);h=new (s?Uint8Array:Array)(a);k=new (s?Uint8Array:Array)(b);c.q=0;
c.j(t(d.call(c,a,g,h)),t(d.call(c,b,g,k)))}u.prototype.j=function(c,d){var a=this.c,b=this.b;this.o=c;for(var e=a.length-258,f,g,h,k;256!==(f=T(this,c));)if(256>f)b>=e&&(this.b=b,a=this.e(),b=this.b),a[b++]=f;else{g=f-257;k=F[g];0<H[g]&&(k+=y(this,H[g]));f=T(this,d);h=J[f];0<M[f]&&(h+=y(this,M[f]));b>=e&&(this.b=b,a=this.e(),b=this.b);for(;k--;)a[b]=a[b++-h]}for(;8<=this.d;)this.d-=8,this.a--;this.b=b};
u.prototype.z=function(c,d){var a=this.c,b=this.b;this.o=c;for(var e=a.length,f,g,h,k;256!==(f=T(this,c));)if(256>f)b>=e&&(a=this.e(),e=a.length),a[b++]=f;else{g=f-257;k=F[g];0<H[g]&&(k+=y(this,H[g]));f=T(this,d);h=J[f];0<M[f]&&(h+=y(this,M[f]));b+k>e&&(a=this.e(),e=a.length);for(;k--;)a[b]=a[b++-h]}for(;8<=this.d;)this.d-=8,this.a--;this.b=b};
u.prototype.e=function(){var c=new (s?Uint8Array:Array)(this.b-32768),d=this.b-32768,a,b,e=this.c;if(s)c.set(e.subarray(32768,c.length));else{a=0;for(b=c.length;a<b;++a)c[a]=e[a+32768]}this.g.push(c);this.l+=c.length;if(s)e.set(e.subarray(d,d+32768));else for(a=0;32768>a;++a)e[a]=e[d+a];this.b=32768;return e};
u.prototype.A=function(c){var d,a=this.input.length/this.a+1|0,b,e,f,g=this.input,h=this.c;c&&("number"===typeof c.p&&(a=c.p),"number"===typeof c.v&&(a+=c.v));2>a?(b=(g.length-this.a)/this.o[2],f=258*(b/2)|0,e=f<h.length?h.length+f:h.length<<1):e=h.length*a;s?(d=new Uint8Array(e),d.set(h)):d=h;return this.c=d};
u.prototype.n=function(){var c=0,d=this.c,a=this.g,b,e=new (s?Uint8Array:Array)(this.l+(this.b-32768)),f,g,h,k;if(0===a.length)return s?this.c.subarray(32768,this.b):this.c.slice(32768,this.b);f=0;for(g=a.length;f<g;++f){b=a[f];h=0;for(k=b.length;h<k;++h)e[c++]=b[h]}f=32768;for(g=this.b;f<g;++f)e[c++]=d[f];this.g=[];return this.buffer=e};
u.prototype.w=function(){var c,d=this.b;s?this.s?(c=new Uint8Array(d),c.set(this.c.subarray(0,d))):c=this.c.subarray(0,d):(this.c.length>d&&(this.c.length=d),c=this.c);return this.buffer=c};function U(c,d){var a,b;this.input=c;this.a=0;if(d||!(d={}))d.index&&(this.a=d.index),d.verify&&(this.B=d.verify);a=c[this.a++];b=c[this.a++];switch(a&15){case V:this.method=V;break;default:throw Error("unsupported compression method");}if(0!==((a<<8)+b)%31)throw Error("invalid fcheck flag:"+((a<<8)+b)%31);if(b&32)throw Error("fdict flag is not supported");this.r=new u(c,{index:this.a,bufferSize:d.bufferSize,bufferType:d.bufferType,resize:d.resize})}
U.prototype.k=function(){var c=this.input,d,a;d=this.r.k();this.a=this.r.a;if(this.B){a=(c[this.a++]<<24|c[this.a++]<<16|c[this.a++]<<8|c[this.a++])>>>0;var b=d;if("string"===typeof b){var e=b.split(""),f,g;f=0;for(g=e.length;f<g;f++)e[f]=(e[f].charCodeAt(0)&255)>>>0;b=e}for(var h=1,k=0,l=b.length,p,n=0;0<l;){p=1024<l?1024:l;l-=p;do h+=b[n++],k+=h;while(--p);h%=65521;k%=65521}if(a!==(k<<16|h)>>>0)throw Error("invalid adler-32 checksum");}return d};var V=8;q("Zlib.Inflate",U);q("Zlib.Inflate.prototype.decompress",U.prototype.k);var W={ADAPTIVE:x.t,BLOCK:x.u},X,Y,Z,$;if(Object.keys)X=Object.keys(W);else for(Y in X=[],Z=0,W)X[Z++]=Y;Z=0;for($=X.length;Z<$;++Z)Y=X[Z],q("Zlib.Inflate.BufferType."+Y,W[Y]);}).call(this); //@ sourceMappingURL=inflate.min.js.map


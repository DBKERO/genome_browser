/**
 * @author Hiroyuki Wakaguri: hwakagur@bits.cc (Tokyo-Univ. Yutaka Suzuki's lab.)
 * kero_browse_track.js v1.7.20171227
 */


var WgBigWig2 = function(name, color, dispName, bwUrl, option) {
	this.option = (option !== undefined)? option: {};
	this.option.buttonOnOffFlg = 
		(this.option.buttonOnOffFlg === undefined)? false: option.buttonOnOffFlg;
	this.option.middle0Flg = 
		(this.option.middle0Flg === undefined)? false: option.middle0Flg;
	this.name = name;
	this.color = (color === undefined)? "#55AA55": color;
	this.defalutColor = this.color;
	this.dispName = dispName;
	
	//this.url = "http://kero.hgc.jp/test/test.bigwig";
	
	
	this.imgObj, this.ojson;
	
	//for bigbed file
	this.id2step = {};
	this.oneBedStep = 20;
	
	this.baseHeight = 20;
	this.height = this.baseHeight;
	this.y;
	
	this.autoHeight = 50;
	this.min = (this.option.middle0Flg)? -2: 0;
	this.max = (this.option.middle0Flg)? 2: 500;
	this.maxNum = 50;
	
	this.showType = (this.option.showType !== undefined)? this.option.showType: 
		(this.option.middle0Flg)? "auto": "auto";
	
	this.bw = new BigbedData(bwUrl, {localFlg: this.option.localFlg});
	
	var m = this;
	this.imgCaching = {
		//cachingNum: 1
		//cachingNum: 5,
		cachingNum: 10,
		getSettingType: function() {
			return m.color + "|" + m.autoHeight + "|" + m.min + "|" + 
				m.max + "|" + m.maxNum + "|" + m.showType;
		}
	};
	
};
WgBigWig2.prototype = new WgRoot();
WgBigWig2.prototype.paint2 = function(dt, y, width, chr, start, end, strand) {
	//再描画回避用
	var finView = {};
	var id2step = this.id2step;
	
	var y2 = y + this.height - 1;
	
	if(this.option.middle0Flg) {
		this.imgObj.fillStyle = "#000000";
		this.imgObj.fillRect(0, y + (this.height - 1) / 2, width, 1);
	}
	
	var stepForBed = [];
	var stepForBedStr = [];
	for(var i = 0; i < dt.length; i++) {
		var chip = (this.name.substr(0, 4) == "peak")? dt[i]["wig"]: dt[i];
		if(chip[0] !== undefined && chip[0].error !== undefined) {
			this.paintError(y, width, start, end, strand, i, chip[0].error);
			continue;
		}
		
		var peak = (this.name.substr(0, 4) == "peak")? dt[i]["peak"]: [];
		var peak_poi = 0;
		for(var j = 0; j < chip.length; j ++) {
			if(chip[j].type == "bed") {
				var name = chip[j].bedClm[0].split(/;/)[1].split(/=/)[1];
				if(!name.match(/Liver/)) {
					//continue;
				}
				
				var id = chip[j].id;
				if(finView[id]) continue;
				finView[id] = true;
				var bedStart = chip[j].start;
				var bedEnd = chip[j].end;
				
				var step = undefined;
				var tmpStep = (id2step[id])? id2step[id]: 1;
				if(stepForBed[tmpStep - 1] === undefined) {
					stepForBed[tmpStep - 1] = [[bedStart, bedEnd]];
					step = tmpStep;
					id2step[id] = step;
				} else {
					if(tmpStep != 1) {
						var targetStep = stepForBed[tmpStep - 1];
						for(var k = 0; k < targetStep.length; k ++) {
							var tmpStart = targetStep[k][0];
							var tmpEnd = targetStep[k][1];
							if(tmpStart - 11 <= bedEnd && bedStart <= tmpEnd + 11) {
								break;
							} else if(bedEnd + 11 < tmpStart) {
								step = tmpStep;
								stepForBed[tmpStep - 1].splice(k, 0, [bedStart, bedEnd]);
								break;
							}
						}
					}
					if(step === undefined) {
						for(var k = 0; k < stepForBed.length; k ++) {
							var targetStep = stepForBed[k];
							if(targetStep === undefined) {
								stepForBed[k] = [[bedStart, bedEnd]];
								step = k + 1;
								id2step[id] = step;
							} else {
								var ovFlg = false;
								for(var l = 0; l < targetStep.length; l ++) {
									var tmpStart = targetStep[l][0];
									var tmpEnd = targetStep[l][1];
									if(tmpStart - 11 <= bedEnd && bedStart <= tmpEnd + 11) {
										ovFlg = true;
										break;
									} else if(bedEnd + 11 < tmpStart) {
										step = k + 1;
										id2step[id] = step;
										stepForBed[k].splice(l, 0, [bedStart, bedEnd]);
										break;
									}
								}
								if(!ovFlg && step === undefined) {
									step = k + 1;
									id2step[id] = step;
									stepForBed[k].push([bedStart, bedEnd]);
								}
							}
							if(step !== undefined) break;
						}
						if(step === undefined) {
							if(stepForBed.length < Math.floor(this.height / this.oneBedStep) + 1) {
								stepForBed.push([[bedStart, bedEnd]]);
								step = stepForBed.length;
								id2step[id] = step;
							}
						}
					}
				}
				if(step !== undefined) {
					var y1 = y + (step - 1) * this.oneBedStep;
					var y3 = y1 + 5;
					var x3 = (bedStart - start) * (width - 1) / (end - start + 1);
					var x4 = (bedEnd - start + 1) * (width - 1) / (end - start + 1);
					var x5 = (x3 + x4) / 2 - strWidth / 2;
					if(strand == "-") {
						var tmp = width - 1 - x3; x3 = width - 1 - x4; x4 = tmp;
					}
					
					
					this.imgObj.font = "10px 'Helvetica'";
					var strWidth = this.imgObj.measureText(name).width;
					if(stepForBedStr[step - 1] === undefined) {
						stepForBedStr[step - 1] = [[x5, x5 + strWidth]];
						this.imgObj.fillStyle = "#000000";
						this.imgObj.fillText(name, x5, y3 + 10);
					} else {
						var ngFlg = false;
						for(var k = 0; k < stepForBedStr[step - 1].length; k ++) {
							var se = stepForBedStr[step - 1][k];
							if(se[0] - 11 <= x5 + strWidth && x5 <= se[1] + 11) {
								ngFlg = true;
								break;
							}
						}
						if(!ngFlg) {
							this.imgObj.fillStyle = "#000000";
							this.imgObj.fillText(name, x5, y3 + 10);
							stepForBedStr[step - 1].push([x5, x5 + strWidth]);
						}
					}
					this.imgObj.fillStyle = "rgb(" + chip[j].bedClm[5] + ")";
					this.imgObj.fillRect(x3, y1, x4 - x3 + 1, y3 - y1);
					this.imgObj.strokeStyle = "#AAAAff";
					this.imgObj.strokeRect(x3, y1, x4 - x3 + 1, y3 - y1);
				}
				
				continue;
			}
			var posStart = chip[j].start;
			var posEnd = chip[j].end;
			var peak_poi_cp = peak_poi;
			for(var k = peak_poi_cp; k < peak.length; k ++) {
				//現状ちょっとでも重なれば色付けする
				peak_poi = k;
				if(posStart <= peak[k].end) break;
			}
			if(start <= posEnd && posStart <= end) {
				var num;
				if(this.showType == "normal") {
					var cnum = chip[j].num;
					if(this.option.middle0Flg) {
						num = (cnum > this.max)? this.autoHeight / 2: 
							(cnum < this.min)? -this.autoHeight / 2: 
							cnum * this.autoHeight / 2 / this.max;
					} else {
						num = (cnum > this.max)? this.autoHeight: 
							(cnum < this.min)? 0: 
							(cnum - this.min) * this.autoHeight / (this.max - this.min);
					}
				} else if(this.showType == "log") {
					var cnum = chip[j].num;
					var min_log = (this.min <= 1)? 0: Math.log(this.min);
					var max_log = Math.log(this.max);
					var num_log = Math.log(chip[j].num);
					num = (cnum > this.max)? this.autoHeight: (cnum < this.min)? 0: 
						(num_log - min_log) * this.autoHeight / (max_log - min_log);
				} else {
					num = chip[j].num / this.maxNum * this.autoHeight;
					if(this.option.middle0Flg) {
						num /= 2;
					}
				}
				
				var y1 = y2 - num + 1;
				var x1 = (posStart - start) * (width - 1) / (end - start + 1);
				var x2 = (posEnd - start + 1) * (width - 1) / (end - start + 1);
				if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
				this.imgObj.fillStyle = (
					peak[peak_poi] !== undefined && 
					posStart <= peak[peak_poi].end && peak[peak_poi].start <= posEnd
				)? "red": this.color;
				if(this.option.middle0Flg) {
					this.imgObj.fillRect(x1, y1 - this.height / 2, x2 - x1 + 1, y2 - y1 + 1);
				} else {
					this.imgObj.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
				}
			}
		}
	}
	
};
WgBigWig2.prototype.paintVScale = function(img, width) {
	var x1 = width - 3;
	img.strokeStyle = "#555555";
	img.fillStyle = "#555555";
	img.beginPath();
	img.moveTo(x1, this.y);
	img.lineTo(x1, this.y + this.height);
	if(this.showType == "normal") {
		//var baseVal = -Math.floor(-(this.max - this.min) / this.autoHeight * 10) / 10;
		var baseVal = (this.max - this.min) / this.autoHeight;
		var inc;
		if(baseVal <= 0.5) {
			inc = 1;
		} else {
			inc = Math.pow(10, (Math.floor(Math.log(baseVal * 2) / Math.log(10)) + 1));
		}
		
		var mStart = (Math.floor((this.min - 1) / inc) + 1) * inc;
		var yPich = inc * this.autoHeight / (this.max - this.min);
		for(var m = mStart; m <= this.max; m += inc) {
			var absM = Math.abs(m);
			var y1 = this.y + this.height - 
				(m - this.min) * this.autoHeight / (this.max - this.min);
			var xM = 5;
			if((absM / inc) % 10 == 5) xM = 8;
			if((absM / inc) % 10 == 0) xM = 10;
			if((absM / inc) % 10 == 0 || (absM / inc) % 10 == 5 || yPich >= 10) {
				if(y1 + 5 < this.y + this.height && y1 > this.y + 5) {
					img.font = "10px 'Helvetica'";
					var strWidth = img.measureText(m).width;
					//img.fillText(m, x1 - xM - strWidth, y1 + 5);
					img.fillText(m, x1 - 10 - strWidth, y1 + 5);
				}
			}
			img.moveTo(x1 - xM, y1);
			img.lineTo(x1, y1);
		}
	} else if(this.showType == "log") {
		var min_log = (this.min <= 1)? 0: Math.log(this.min);
		var max_log = Math.log(this.max);
		var mStart;
		if(this.min < 10) {
			mStart = 10;
		} else {
			mStart = Math.pow(10, Math.floor(Math.log(this.min - 1) / Math.log(10)) + 1);
		}
		
		//**10づつ増やすときのy間のpix距離
		var y_pich10 = this.autoHeight / (max_log - min_log) * Math.log(10);
		var m_times = 10;
		if(y_pich10 < 10) {
			m_times = Math.floor(Math.pow(Math.E, 10 * (max_log - min_log) / this.autoHeight));
		}
		for(var m = mStart; m <= this.max; m *= m_times) {
			var m_log = Math.log(m);
			var y1 = this.y + this.height - 
				(m_log - min_log) * this.autoHeight / (max_log - min_log);
			
			var xM = 5;
			img.moveTo(x1 - xM, y1);
			img.lineTo(x1, y1);
			
			img.font = "10px 'Helvetica'";
			var strWidth = img.measureText(m).width;
			img.fillText(m, x1 - xM - strWidth, y1 + 5);
		}
	} else {
		var y1 = this.y;
		var y2 = y1 + this.height - 1;
		var xM = 5;
		var str = Math.floor(this.maxNum * 1000) / 1000;
		img.font = "10px 'Helvetica'";
		var strWidth = img.measureText("-" + str).width;
		img.fillText(str, x1 - xM - strWidth, y1 + 10);
		img.moveTo(x1 - xM, y1);
		img.lineTo(x1, y1);
		if(this.option.middle0Flg) {
			img.fillText("0", x1 - xM - strWidth + 20, (y1 + y2) / 2 + 2);
			img.moveTo(x1 - xM, (y1 + y2) / 2);
			img.lineTo(x1, (y1 + y2) / 2);
			img.fillText("-" + str, x1 - xM - strWidth, y2 - 5);
			img.moveTo(x1 - xM, y2);
			img.lineTo(x1, y2);
		}
	}
	img.stroke();
};
WgBigWig2.prototype.setHeight2 = function(dt, width, chr, start, end) {
	//auto height用
	if(this.showType == "auto") {
		this.maxNum = 1;
		var tempHeight = 0;
		for(var i = 0; i < dt.length; i++) {
			var chip = (this.name.substr(0, 4) == "peak")? dt[i]["wig"]: dt[i];
			
			for(var j = 0; j < chip.length; j ++) {
				var posStart = chip[j].start;
				var posEnd = chip[j].end;
				if(start <= posEnd && posStart <= end) {
					var num = Math.abs(parseFloat(chip[j].num));
					if(this.maxNum < num) this.maxNum = num;
					var setHeightVal = (this.showType == "normal")? parseFloat(chip[j].num): 
						(this.showType == "log")? Math.log(chip[j].num) / Math.log(2) * 10: this.autoHeight;
					if(tempHeight < setHeightVal) tempHeight = setHeightVal;
				}
			}
		}
	}
	this.height = this.autoHeight;
};
WgBigWig2.prototype.getMenuPopup = function() {
	var checked = new Array("", "", "");
	if(this.showType == "normal") checked[0] = "checked=\"checked\"";
	if(this.showType == "log") checked[1] = "checked=\"checked\"";
	if(this.showType == "auto") checked[2] = "checked=\"checked\"";
	
	
	var htmlStr = "";
	htmlStr += "<div style=\"border:1px solid\"><table border=\"0\" width=\"100%\"><tr><th align=\"left\" bgcolor=\"#aaaaaa\" colspan=\"2\">Setting:</th></tr><tr>";
	htmlStr += "<td bgcolor=\"#aaaaaa\">&nbsp;</td><td><form>";
	htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"normal\" id=\"normal\" ";
	htmlStr += checked[0] + " /><label for=\"normal\">Normal</label></div>";
	if(!this.option.middle0Flg) {
		htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"log\" id=\"log\" ";
		htmlStr += checked[1] + " /><label for=\"log\">Log</label></div>";
	}
	htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"auto\" id=\"auto\" ";
	htmlStr += checked[2] + " /><label for=\"auto\">Auto</label></div>";
	htmlStr += "</form>";
	htmlStr += "<hr /><a href=\"#\" class=\"det\">Detail...</a>";
	htmlStr += "</td></tr></table></div>";
	return htmlStr;
};
WgBigWig2.prototype.showTypeChangeAction = function() {
	if(this.option.middle0Flg && this.showType == "log") this.showType = "auto";
};
WgBigWig2.prototype.getMenuDetail = function() {
	var checked = (this.defalutColor.toLowerCase() == this.color.toLowerCase())? "checked=\"checked\"": "";
	var disabled = (checked == "")? "": "disabled=\"disabled\"";
	var htmlStr = "";
	htmlStr += "<form><div><strong>Detailed settings</strong></div>";
	htmlStr += "<div class=\"modal_inbox\">";
	htmlStr += "<table border=\"0\" width=\"100%\"><tr><td align=\"center\">";
	htmlStr += "<div>Track height: <input type=\"text\" id=\"height\" size=\"3\" maxlength=\"3\" value=\"" + this.autoHeight + "\"/></div>";
	htmlStr += "<div><hr /></div>";
	htmlStr += "<table border=\"1\">";
	htmlStr += "<tr><th colspan=\"2\">Data rage (when not Auto mode):</th></tr>";
	if(!this.option.middle0Flg) {
		htmlStr += "<tr><td>Min: </td><td><input type=\"text\" id=\"min\" size=\"5\" maxlength=\"10\" value=\"" + this.min + "\"/></td></tr>";
	}
	htmlStr += "<tr><td>Max: </td><td><input type=\"text\" id=\"max\" size=\"5\" maxlength=\"10\" value=\"" + this.max + "\"/></td></tr>";
	htmlStr += "</table>";
	htmlStr += "<div><hr /></div>";
	htmlStr += "<table border=\"1\">";
	htmlStr += "<tr><th align=\"left\" colspan=\"3\"><a target=\"_blank\" href=\"http://www.theodora.com/gif4/html_colors.gif\">Coloring: </a></td></tr>";
	htmlStr += "<tr><td nowrap>Defalut <input type=\"checkbox\" name=\"def_color\" value=\"def_color\" id=\"def_color\" ";
	htmlStr += checked + " /></td><td nowrap>Color: #<input type=\"text\" id=\"col\" size=\"6\" maxlength=\"6\" value=\"" + this.color.substr(1) + "\" " + disabled + " /></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"col_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</tr>";
	htmlStr += "</table>";
	htmlStr += "<div>&nbsp;</div>";
	htmlStr += "</td></tr></table></div>";
	htmlStr += "<div class=\"modal_btn\"><input type=\"button\" id=\"apply_button\" value=\"Apply\" /><input type=\"button\" id=\"cancel_button\" value=\"Cancel\" /></div>";
	htmlStr += "</form>";
	
	return [htmlStr, [300, 270]];
};
WgBigWig2.prototype.menuDetailAction = function(parent) {
	var m = this;
	var id = "col";
	var col = this.color;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", col);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + "_td").css("background-color", "#" + $(this).val());
	});
	$("div" + parent.divId + " div#modal div.container #def_color").change(function() {
		if($("div" + parent.divId + " div#modal div.container #def_color").is(":checked")) {
			$("div" + parent.divId + " div#modal div.container #col").attr('disabled', true);
			$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", m.defalutColor);
		} else {
			$("div" + parent.divId + " div#modal div.container #col").attr('disabled', false);
			$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", 
				"#" + $("div" + parent.divId + " div#modal div.container #" + id).val());
		}
	});
};
WgBigWig2.prototype.setViewDetail = function(divId) {
	var height = parseInt($("div" + divId + " div#modal div.container #height").val());
	if(height < 10) height = 10;
	if(height > 500) height = 500;
	if(isNaN(height)) height = 50;
	this.autoHeight = height;
	
	if(!this.option.middle0Flg) {
		var min = parseInt($("div" + divId + " div#modal div.container #min").val());
		if(min < 0) min = 0;
		if(isNaN(min)) min = 0;
		this.min = min;
	}
	
	var max = parseInt($("div" + divId + " div#modal div.container #max").val());
	if(max < min) max = min * 10;
	if(max == min) max = min + 1;
	if(max < 1) max = 1;
	if(isNaN(max)) max = 1000;
	this.max = max;
	
	if(this.option.middle0Flg) this.min = -max;
	
	this.color = ( $("div" + divId + " div#modal div.container #def_color").is(":checked"))? 
		this.defalutColor: "#" + $("div" + divId + " div#modal div.container #col").val();
	
	return true;
};
WgBigWig2.prototype.getName = function() {
	return this.name;
};
WgBigWig2.prototype.getPannelBgcolor = function() {
	return (this.option.pannelBgcolor)? this.option.pannelBgcolor: "#EEEEEE";
};
WgBigWig2.prototype.getItemDispName = function() {
	var dispName = (this.dispName)? this.dispName: this.name;
	return dispName;
};
WgBigWig2.prototype.getItemDetailName = function() {
	return (this.option.itemDetailName)? this.option.itemDetailName: this.getItemDispName();
};
WgBigWig2.prototype.getButtonInfo = function() {
	var buttonColor = (this.option.buttonColor === undefined)? 
		{"color": ["eeeeee", "ffcccc"], "onOff": this.option.buttonOnOffFlg}: 
		{"color": this.option.buttonColor, "onOff": this.option.buttonOnOffFlg};
	
	return buttonColor;
};
WgBigWig2.prototype.accessObj = function(chr, binStart, binEnd, powP, accDefault) {
	var m = this;
	var bpPerPixel = Math.pow(10, powP);
	
	var bpStart = binStart * bpPerPixel * POW_REG + 1;
	var bpEnd = (parseInt(binStart) + 1) * bpPerPixel * POW_REG;
	
	this.bw.readWaitReader(chr, bpStart, bpEnd, bpPerPixel, function(reductionLevel, fetcher) {
		var data = {};
		var tmp = [];
		for(var alnEach of fetcher()) {
			var num = (reductionLevel)? alnEach.maxVal: alnEach.value;
			if(num === undefined) {
				var bedClm = alnEach.otherClm.split(/\t/);
				tmp.push({
					type: "bed", id: bedClm[0], start: alnEach.chromStart, 
					end: alnEach.chromEnd, bedClm: bedClm 
				});
			} else {
				tmp.push({
					type: "wig", id: alnEach.chromStart, start: alnEach.chromStart, 
					end: alnEach.chromEnd, num: num 
				});
			}
		}
		data[m.name] = tmp;
		accDefault.success(data);
		accDefault.complete();
	}, function(err) {
		accDefault.error(err, err, err);
		accDefault.complete();
	});
};


//nameは自分のID(オブジェクトごとユニークにする)
var WgBam2 = function(name, dispName, bamUrl, option) {
	this.option = (option !== undefined)? option: {};
	if(this.option.uriDirFlg === undefined) this.option.uriDirFlg = true;
	
	this.name = name;
	this.dispName = dispName;
	
	this.charPx = 10;
	
	//this.bamUrl = bamUrl;
	
	this.minHeight = 30;
	this.y;
	
	//配列データのデータ取得先
	this.getSeqData = (this.option.seqUrl === undefined)? {
		"url": "https://dbtss.hgc.jp/cgi-bin/dbtss_db_json.cgi/9606", 
		"param": "SEE=1&UID=2"
	}: this.option.seqUrl;
	
	this.powMax = 1;
	this.margin = 1;
	//this.eachStep = 15;
	this.eachStep = 10;
	//readの表示はここまでですの表示を入れるためのスペース(mexHeightに含まれる)
	this.limitShowHeight = 5;
	this.maxHeight = this.eachStep * 30 + this.limitShowHeight;
	//readが積み重なりすぎていて全部表示できない領域
	this.overReg = {};
	this.overRegList = [];
	this.bam = new BamData(bamUrl, {localFlg: this.option.localFlg});
};
WgBam2.prototype = new WgRoot();
//描画する(Y位置, 裏画面の幅, chr, 裏画面のstart, 裏画面のend)
//実際には裏画面を横に3つに区切ったうちの真ん中が表示される
WgBam2.prototype.paint = function(y, width, chr, start, end, strand) {
	//複数回カウントを避ける
	var existId = {};
	var status = [];
	
	var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
	if(pow < 0) pow = 0;
	var reg = Math.pow(10, pow) * POW_REG;
	
	var binStart = Math.floor((start - 1) / reg);
	var binEnd = Math.floor((end - 1) / reg);
	
	this.imgObj.font = this.charPx + "px 'Helvetica'";
	
	if(pow > this.powMax) {
		var y1 = y;
		var y2 = y1 + this.height - 1;
		var y3 = (y1 + y2) / 2 + 3;

		this.imgObj.fillStyle = "#EEEEEE";
		this.imgObj.fillRect(0, y1, width, y2 - y1 + 1);
		
		var tooLargeStr = "Too large region for showing alignment";
		var strWidth = this.imgObj.measureText(tooLargeStr).width;
		this.imgObj.fillStyle = "#888888";
		x3 = (width - strWidth) / 2;
		this.imgObj.fillText(tooLargeStr, x3, y3);
		
		return [];
	}
	
	let pileup = {};
	
	for(var i = binStart; i <= binEnd; i ++) {
		if(
			this.ojson[pow] && this.ojson[pow][chr + "|" + i] && 
			this.ojson[pow][chr + "|" + i][this.name] 
		) {
			var each = this.ojson[pow][chr + "|" + i][this.name];
			var read = each.reads;
			
			if(!read) continue;
			
			for(var j = 0; j < read.length; j ++) {
				var readS = read[j].pos;
				var readE = read[j].posEnd;
				var flag = read[j].flag;
				var stepNo = read[j].step;
				var cigar = read[j].cigar;
				var cigarOp = read[j].cigarOp;
				var cigarLn = read[j].cigarLn;
				var seq = read[j].seq;
				var seqPoi = 0;
				
				//stepNoがundefinedもしくは0未満のデータは表示しない
				if(start <= readE && readS <= end) {
					if(existId[read[j].id]) {
						
						continue;
					} else {
						existId[read[j].id] = true;
					}
					var x1 = (readS - start) * (width - 1) / (end - start + 1);
					var x2 = (readE - start + 1) * (width - 1) / (end - start + 1);
					if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
					
					var y1 = y + this.eachStep * stepNo;
					var y2 = y1 + this.eachStep - 3;
					if(stepNo >= 0 && false) {
					//簡易表示
						this.imgObj.fillStyle = (flag & 16)? "#BBBBFF": "#FFBBBB";
						this.imgObj.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
					} else {
						let inPosList = [];
						let nowPos = readS;
						//let ops = cigar.split(/\d+/); 
						//let lns = cigar.split(/\D/);
						let ops = cigarOp; 
						let lns = cigarLn;
						for(let k = 1; k < ops.length; k ++) {
							let op = ops[k];
							let ln = parseInt(lns[k - 1]);
							if(stepNo >= 0 && op == "I") {
								if(pow == 0) {
									let x3 = (nowPos - start) * (width - 1) / (end - start + 1);
									inPosList.push(x3);
								}
								seqPoi += ln;
							} else if(stepNo >= 0 && op == "N") {
								let x3 = (nowPos - start) * (width - 1) / (end - start + 1);
								let x4 = (nowPos + ln - start) * (width - 1) / (end - start + 1);
								if(strand == "-") {var tmp = width - 1 - x3; x3 = width - 1 - x4; x4 = tmp;}
								let y3 = (y1 + y2) / 2 - 1;
								this.imgObj.fillStyle = (flag & 16)? "#BBBBFF": "#FFBBBB";
								this.imgObj.fillRect(x3, y3, x4 - x3 + 1, 2);
								nowPos += ln;
							} else if(stepNo >= 0 && op == "H") {
							} else if(stepNo >= 0 && op == "S") {
								seqPoi += ln;
							} else if(stepNo >= 0 && op == "P") {
								alert("not supported cigar P");
							} else if(op == "M" || op == "X" || op == "=" || op == "D") {
								if(stepNo >= 0) {
									let x3 = (nowPos - start) * (width - 1) / (end - start + 1);
									let x4 = (nowPos + ln - start) * (width - 1) / (end - start + 1);
									if(strand == "-") {var tmp = width - 1 - x3; x3 = width - 1 - x4; x4 = tmp;}
									this.imgObj.fillStyle = (flag & 16)? "#BBBBFF": "#FFBBBB";
									if(op == "D") {
										this.imgObj.fillRect(x3, (y1 + y2) / 2 - 1, x4 - x3 + 1, 2);
										nowPos += ln;
										continue;
									} else {
										this.imgObj.fillRect(x3, y1, x4 - x3 + 1, y2 - y1 + 1);
									}
								}
								
								//mutationの表示
								var sSeq = "";
								var binAlnS = Math.floor((nowPos - 1) / reg);
								var strStart = (nowPos - 1) % reg;
								var nowLn = ln;
								while(sSeq.length < ln) {
									var rest = reg - strStart;
									var kn = (rest < nowLn)? rest: nowLn;
									if(
										this.ojson[pow][chr + "|" + binAlnS] && this.ojson[pow][chr + "|" + binAlnS][this.name] && 
										this.ojson[pow][chr + "|" + binAlnS][this.name].sequence
									) {
										var gSeq = this.ojson[pow][chr + "|" + binAlnS][this.name].sequence;
										sSeq += gSeq.substr(strStart, kn).toUpperCase();
									} else {
										sSeq += "*".repeat(kn);
									}
									binAlnS ++;
									strStart = 0;
									nowLn -= kn;
								}
								
								var qSeq = seq.substr(seqPoi, ln);
								
								var cpPos = nowPos;
								for(let l = 0; l < sSeq.length; l ++) {
									if(cpPos < start || end < cpPos) {
										cpPos ++;
										continue;
									}
									let sBase = sSeq.charAt(l);
									let qBase = qSeq.charAt(l);
									let char = qBase;
									if(strand == "-") {
										var tmp = char;
										if(char == "A") tmp = "T"; if(char == "a") tmp = "t";
										if(char == "C") tmp = "G"; if(char == "c") tmp = "g";
										if(char == "G") tmp = "C"; if(char == "g") tmp = "c";
										if(char == "T") tmp = "A"; if(char == "t") tmp = "a";
										char = tmp;
									}
									
									//if(pileup[cpPos] === undefined) pileup[cpPos] = {ref:sBase, pile:{}};
									//pileup[cpPos][char] ++;
									
									if(stepNo >= 0 && sBase != qBase && sBase != "*" && qBase != "-") {
										let x5 = (cpPos - start) * (width - 1) / (end - start + 1);
										let x6 = (cpPos - start + 1) * (width - 1) / (end - start + 1);
										if(strand == "-") {var tmp = width - 1 - x5; x5 = width - 1 - x6; x6 = tmp;}
										this.imgObj.fillStyle = 
											(char == "A" || char == "a")? "#88FF88": 
											(char == "C" || char == "c")? "#8888FF": 
											(char == "G" || char == "g")? "#FF8800": 
											(char == "T" || char == "t")? "#FF4488": "#AAAAAA";
										this.imgObj.fillRect(x5, y1, x6 - x5 + 1, y2 - y1 + 1);
										if(x6 - x5 > this.charPx && this.eachStep >= 10) {
											this.imgObj.fillStyle = "#000000";
											this.imgObj.fillText(char, (x5 + x6) / 2 - 2, (y1 + y2) / 2 + 4);
										}
									}
									
									cpPos ++;
								}
								//mutationの表示（ここまで）
								nowPos += ln;
								seqPoi += ln;
							}
						}
						this.imgObj.fillStyle = "#333333";
						for(let k = 0; k < inPosList.length; k ++) {
							var x3 = inPosList[k];
							if(strand == "-") {var x3 = width - 1 - x3;}
							this.imgObj.fillRect(x3 - 1, y1, 2, y2 - y1 + 1);
						}
					}
				}
			}
		} else {
			if(i >= 0) status.push(i);
			this.paintLoading(y, width, start, end, strand, i);
		}
	}
	
	//積み重なりが大きくて表示できない領域
	this.imgObj.fillStyle = "#AAAAAA";
	for(let regS in this.overReg) {
		var regE = this.overReg[regS];
		var x1 = (regS - start) * (width - 1) / (end - start + 1);
		var x2 = (regE - start + 1) * (width - 1) / (end - start + 1);
		if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
		var y1 = y + this.maxHeight - this.limitShowHeight;
		var y2 = y1 + 3;
		this.imgObj.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
	}
	
	return status;
};
//step情報が毎回付加更新されます！
WgBam2.prototype.setHeight = function(width, chr, start, end) {
	//複数回表示を避ける
	var existId = {};
	
	var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
	if(pow < 0) pow = 0;
	var reg = Math.pow(10, pow) * POW_REG;
	
	if(pow > this.powMax) {
		this.height = this.minHeight;
		return;
	}
	
	var binStart = Math.floor((start - 1) / reg);
	var binEnd = Math.floor((end - 1) / reg);
	
	var step = [];
	var overReg = this.overReg;
	var overRegList = this.overRegList;
	var stepMax = 0;
	for(var i = binStart; i <= binEnd; i ++) {
		if(
			this.ojson[pow] && this.ojson[pow][chr + "|" + i] && 
			this.ojson[pow][chr + "|" + i][this.name] && this.ojson[pow][chr + "|" + i][this.name].reads
		) {
			var read = this.ojson[pow][chr + "|" + i][this.name].reads;
			for(var j = 0; j < read.length; j ++) {
				let stepNo;
				var readS = read[j].pos;
				var readE = read[j].posEnd;
				var flag = read[j].flag;
				var cigar = read[j].cigar;
				//cigarないデータはスキップ
				if(cigar == "") continue;
				
				if(start <= readE && readS <= end) {
					if(existId[read[j].id]) {
						read[j].step = undefined;	//stepNo = undefined
						continue;
					} else {
						existId[read[j].id] = true;
					}
					
					if(read[j].step !== undefined) {
					//file:///E:/Documents/work/tokyo_univ/2017/js_test/local_file_access/index.html#chr1:24822488-24887847:- "hg38.illumina.adrenal.1.bam"
					//高速化のため
						var k = read[j].step;
						if(k != -1) {
							if(step[k] === undefined) step[k] = [];
							if(stepMax < k) stepMax = k;
							
							var ovFlg = false;
							for(var l = 0; l < step[k].length; l ++) {
								var checkS = step[k][l][0];
								var checkE = step[k][l][1];
								if(readS - this.margin <= checkE && checkS <= readE + this.margin) {
									ovFlg = true;
									break;
								}
							}
							
							if(!ovFlg) {
								step[k].push([readS, readE]);
								stepNo = k;
							} else {
								for(k = 0; k < step.length; k ++) {
									ovFlg = false;
									if(step[k] === undefined) step[k] = [];
									for(var l = 0; l < step[k].length; l ++) {
										var checkS = step[k][l][0];
										var checkE = step[k][l][1];
										if(readS - this.margin <= checkE && checkS <= readE + this.margin) {
											ovFlg = true;
											break;
										}
									}
									if(!ovFlg) {
										step[k].push([readS, readE]);
										stepNo = k;
										read[j].step = stepNo;
										break;
									}
								}
							}
						}
					} else {
						for(var k = 0; k < step.length; k ++) {
							if(step[k] === undefined) step[k] = [];
							var ovFlg = false;
							for(var l = 0; l < step[k].length; l ++) {
								var checkS = step[k][l][0];
								var checkE = step[k][l][1];
								if(readS - this.margin <= checkE && checkS <= readE + this.margin) {
									ovFlg = true;
									break;
								}
							}
							if(!ovFlg) {
								step[k].push([readS, readE]);
								stepNo = k;
								break;
							}
						}
						read[j].step = stepNo;
					}
					
					if(stepNo === undefined || stepNo == -1) {
						if(
							(step.length + 1) * this.eachStep <= this.maxHeight - this.limitShowHeight &&
							stepNo != -1
						) {
							stepNo = step.length;
							step[stepNo] = [[readS, readE]];
							stepMax = stepNo;
						} else {
						//stepが上限を超えている場合
							if(overRegList.length == 0) {
								overRegList[0] = readS;
								overReg[readS] = readE;
							} else {
								var findFlg = false;
								var targetK = overRegList.length - 1;
								for(var k = 0; k < overRegList.length; k ++) {
									var checkS = overRegList[k];
									var checkE = overReg[checkS];
									
									if(checkS <= readS && readE <= checkE) {
									//領域に含まれている
										findFlg = true;
										break;
									} else if(readS <= checkE && checkS <= readE) {
									//重なっている(かつリードが領域を飛び出ている)
										if(checkS <= readE && readE <= checkE) {
										//リードが左に出てて、右には出てない
											overRegList.splice(k, 1, readS);
											delete overReg[checkS];
											overReg[readS] = readE;
										} else {
										//リードが右に出てる(左は出てる出てない両方)
											var newS = (checkS < readS)? checkS: readS;
											var newE = readE;
											var delCnt = 1;
											delete overReg[checkS];
											for(var l = k + 1; l < overRegList.length; l ++) {
												var checkS2 = overRegList[l];
												var checkE2 = overReg[checkS2];
												if(readE < checkS2) break;
												delCnt ++;
												delete overReg[checkS2];
												if(readE < checkE2) {
													newE = checkE2;
													break;
												}
											}
											overRegList.splice(k, delCnt, newS);
											overReg[newS] = newE;
										}
										findFlg = true;
										break;
									} else if(readE < checkS) {
									//リードは領域間に含まれる領域である
										overRegList.splice(k, 0, readS);
										overReg[readS] = readE;
										findFlg = true;
										break;
									}
								}
								
								if(!findFlg) {
									overRegList.push(readS);
									overReg[readS] = readE;
								}
							}
							
							read[j].step = -1; //stepNo = -1
							continue;
						}
						read[j].step = stepNo;
					}
				}
			}
		} else {
			//データのロードが終わってない
		}
	}
	
	var height = this.eachStep * (stepMax + 1);
	if(this.overRegList.length) height += this.limitShowHeight;
	this.height = (height > this.minHeight)? height: this.minHeight;
	
};
//ポップアップ用データを返す
WgBam2.prototype.getPopupData = function() {
	return;
};
//自分のID
WgBam2.prototype.getName = function() {
	return this.name;
};
WgBam2.prototype.getItemDispName = function() {
	var dispName = (this.dispName)? this.dispName: this.name;
	return dispName;
};
WgBam2.prototype.getPannelBgcolor = function() {
	return (this.option.pannelBgcolor)? this.option.pannelBgcolor: "#EEEEEE";
};
WgBam2.prototype.accessObj = function(chr, binStart, binEnd, powP, accDefault) {
	var m = this;
	var bpPerPixel = Math.pow(10, powP);
	
	var bpStart = binStart * bpPerPixel * POW_REG + 1;
	var bpEnd = (parseInt(binStart) + 1) * bpPerPixel * POW_REG;
	
	if(powP > this.powMax) {
		return;
	}
	
	var magic = [];
	var data = {};
	if(this.option.uriDirFlg) {
		data[this.name] = {};
		data[this.name].reads = magic;
	} else {
		data[powP] = {};
		data[powP][chr + "|" + binStart] = {};
		data[powP][chr + "|" + binStart][this.name] = {};
		data[powP][chr + "|" + binStart][this.name].reads = magic;
	}
	
	if(binStart == binEnd && this.getSeqData) {
	//配列を取得する場合
		var jsonUrl = this.getSeqData.url + '/' + powP + '/' + chr + '/' + binStart + '/sequence/?' + this.getSeqData.param;
		//var jsonUrl = "https://dbtss.hgc.jp/cgi-bin/dbtss_db_json.cgi";
		//jsonUrl += '/9606/' + powP + '/' + chr + '/' + binStart + '/sequence/?SEE=1&UID=2';
		//var jsonUrl = "http://fullmal.hgc.jp/cgi-bin/fullmal_db_json.cgi";
		//jsonUrl += '?bin_region=' + chr + ':' + binStart + '-' + binStart + '&pow=' + powP + '&kinds=sequence&SPID=0301&UID=7&SEE=1';
		
		
		var ajaxParam = {
			success: function(seqData) {
				if(seqData.sequence !== undefined) data[m.name].sequence = seqData.sequence;
				//if(seqData[powP][chr + "|" + binStart] !== undefined) 
				//	data[powP][chr + "|" + binStart][m.name].sequence = seqData[powP][chr + "|" + binStart].sequence;
				m.accessBamFile(chr, bpStart, bpEnd, accDefault, [data, magic]);
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				m.accessBamFile(chr, bpStart, bpEnd, accDefault, [data, magic]);
			},
			complete: function() {
			}
		};
		ajaxParam.url = jsonUrl;
		ajaxParam.xhrFields = {withCredentials: true};
		ajaxParam.dataType = 'json';
		$.ajax(ajaxParam);
	} else {
		this.accessBamFile(chr, bpStart, bpEnd, accDefault, [data, magic]);
	}
	
	
};
WgBam2.prototype.accessBamFile = function(chr, bpStart, bpEnd, accDefault, dataMagic) {
	var m = this;
	this.bam.readWaitReader(chr, bpStart, bpEnd, function(fetcher) {
		var counter = 0;
		var reads = dataMagic[1];
		for(var alnEach of fetcher()) {
			reads.push({
				qname: alnEach[3], flag: alnEach[2], pos: alnEach[0], mapq: alnEach[1], 
				cigar: alnEach[4], seq: alnEach[6], posEnd: alnEach[5], id: alnEach[11], 
				cigarLn: alnEach[12], cigarOp: alnEach[13]
			});
			counter ++;
			if(counter % 100000 == 0) {
				alert("Too many read (>= 100000) and some reads truncated. " + chr + ":" + bpStart + "-" + bpEnd + " will be incomplete display.");
				break;
			}
		}
		accDefault.success(dataMagic[0]);
		accDefault.complete();
	}, function(err) {
		accDefault.error(err, err, err);
		accDefault.complete();
	});
};


var WgRnaJnkF = function(fil, name, dispName, option) {
	this.option = (option !== undefined)? option: {};
	this.option.buttonOnOffFlg = 
		(this.option.buttonOnOffFlg === undefined)? false: option.buttonOnOffFlg;
	
	this.name = name;
	this.dispName = dispName;

	this.imgObj, this.ojson;
	
	this.showType = "arc_height";
	this.maxDepth = 0;
	//文字が重なるのを防ぐ
	this.aboidingSpace = 0;
	
	this.height = 20;
	this.y;
	
	this.bb = new BigbedData(fil);
};
WgRnaJnkF.prototype = new WgRoot();
WgRnaJnkF.prototype.paint = function(y, width, chr, start, end, strand) {
	//描写状況:存在しないデータのbin情報を入れる
	var status = [];
	
	var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
	if(pow < 0) pow = 0;
	var reg = Math.pow(10, pow) * POW_REG;
	
	var binStart = Math.floor((start - 1) / reg);
	var binEnd = Math.floor((end - 1) / reg);
	var nameXs = [];
	
	var maxDepth = 0;
	for(var i = binStart; i <= binEnd; i ++) {
		if(this.ojson[pow] && this.ojson[pow][chr + "|" + i] && this.ojson[pow][chr + "|" + i][this.name]) {
			var jnk = this.ojson[pow][chr + "|" + i][this.name];
			for(var j = 0; j < jnk.length; j ++) {
				if(jnk[j].up_start <= end && start <= jnk[j].dwn_end) {
					if(maxDepth < jnk[j].depth) maxDepth = parseFloat(jnk[j].depth);
				}
			}
		}
	}
	this.maxDepth = maxDepth;
	
	this.aboidingSpace = 0;
	if(this.showType == "arc_height") {
		this.imgObj.font = "10px 'Helvetica'";
		var strWidth = this.imgObj.measureText(maxDepth).width;
		this.aboidingSpace = 3 + 5 + strWidth;
	}
	
	for(var i = binStart; i <= binEnd; i ++) {
		if(this.ojson[pow] && this.ojson[pow][chr + "|" + i] && this.ojson[pow][chr + "|" + i][this.name]) {
			var jnk = this.ojson[pow][chr + "|" + i][this.name];
			var y2 = y + this.height - 1;
			var y1 = y2 - 5;
			//縦線の頂上
			var y3 = y1 - 10;
			//矢印の頂上
			var y4 = y3 - 5;
			var y5 = y1 - ((this.height - 5) - 1) * 4 / 3;
			for(var j = 0; j < jnk.length; j ++) {
				var str = parseInt(jnk[j].strand);
				if(jnk[j].up_start <= end && start <= jnk[j].up_end) {
					var x1 = (jnk[j].up_start - start) * (width - 1) / (end - start + 1);
					var x2 = (jnk[j].up_end - start + 1) * (width - 1) / (end - start + 1);
					if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
					var x3 = (jnk[j].up_end - start + 0.5) * (width - 1) / (end - start + 1);
					if(strand == "-") x3 = width - 1 - x3;
					
					if(x1 < 0) x1 = 0;
					if(x2 > width - 1) x2 = width - 1;
					this.imgObj.fillStyle   = (str)? "#EE0000": "#888888";
					this.imgObj.strokeStyle = (str)? "#EE0000": "#888888";
					this.imgObj.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
				}
				if(jnk[j].dwn_start <= end && start <= jnk[j].dwn_end) {
					var x1 = (jnk[j].dwn_start - start) * (width - 1) / (end - start + 1);
					var x2 = (jnk[j].dwn_end - start + 1) * (width - 1) / (end - start + 1);
					if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
					var x3 = (jnk[j].dwn_start - start + 0.5) * (width - 1) / (end - start + 1);
					if(strand == "-") x3 = width - 1 - x3;
					
					if(x1 < 0) x1 = 0;
					if(x2 > width - 1) x2 = width - 1;
					this.imgObj.fillStyle   = (str)? "#888888": "#EE0000";
					this.imgObj.strokeStyle = (str)? "#888888": "#EE0000";
					this.imgObj.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
				}
				var ppm_col = 255 - (Math.floor(jnk[j].depth) + 15);
				var hex = (this.showType == "arc_height")? "00": this.cov16(ppm_col);
				this.imgObj.strokeStyle = (str)? "#" + hex + hex + "FF": "#FF" + hex + hex;
				if(jnk[j].up_start <= end && start <= jnk[j].dwn_end) {
					var x1 = (jnk[j].up_end - start + 1) * (width - 1) / (end - start + 1);
					var x2 = (jnk[j].dwn_start - start) * (width - 1) / (end - start + 1);
					if(this.showType == "arc_height") {
						y5 = y1 - (((this.height - 5) - 1) * 4 / 3) * jnk[j].depth / maxDepth;
					}
					if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
					this.imgObj.beginPath();
					this.imgObj.moveTo(x1, y1);
					if(Math.abs(Math.floor(x1) - Math.floor(x2)) <= 1) {
						var y6 = (this.showType == "arc_height")? 
							((this.height - 5) - 1) * jnk[j].depth / maxDepth: 
							(this.height - 5) - 1;
						
						this.imgObj.lineTo(x1, y1 - y6);
					} else {
						this.imgObj.bezierCurveTo(x1, y5, x2, y5, x2, y1);
					}
					this.imgObj.stroke();
				}
			}
		} else {
			if(i >= 0) status.push(i);
			this.paintLoading(y, width, start, end, strand, i);
		}
	}
	
	return status;
};
WgRnaJnkF.prototype.paintVScale = function(img, width) {
	var x1 = width - 3;
	var y1 = this.y;
	if(this.showType == "arc_height") {
		var maxDepth = this.maxDepth;
		img.strokeStyle = "#555555";
		img.fillStyle = "#555555";
		img.beginPath();
		img.moveTo(x1, this.y);
		img.lineTo(x1, this.y + this.height);
		var xM = 5;
		img.moveTo(x1 - xM, y1);
		img.lineTo(x1, y1);
		img.stroke();
		
		img.font = "10px 'Helvetica'";
		var strWidth = img.measureText(maxDepth).width;
		img.fillText(maxDepth, x1 - xM - strWidth, y1 + 10);
	}
};
WgRnaJnkF.prototype.getAboidingLeftPanelSpace = function() {
	return this.aboidingSpace;
};
WgRnaJnkF.prototype.getMenuPopup = function() {
	var checked = [];
	if(this.showType == "arc_height") checked[0] = "checked=\"checked\"";
	if(this.showType == "light_shade") checked[1] = "checked=\"checked\"";
	
	var htmlStr = "";
	htmlStr += "<div style=\"border:1px solid\"><table border=\"0\" width=\"100%\"><tr><th align=\"left\" bgcolor=\"#aaaaaa\" colspan=\"2\">Setting:</th></tr><tr>";
	htmlStr += "<td bgcolor=\"#aaaaaa\">&nbsp;</td><td><form>";
	htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"arc_height\" id=\"arc_height\" ";
	htmlStr += checked[0] + " /><label for=\"arc_height\">Height mode</label></div>";
	if(!this.option.middle0Flg) {
		htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"light_shade\" id=\"light_shade\" ";
		htmlStr += checked[1] + " /><label for=\"light_shade\">Gradation mode</label></div>";
	}
	htmlStr += "</form>";
	htmlStr += "<hr /><a href=\"#\" class=\"det\">Detail...</a>";
	htmlStr += "</td></tr></table></div>";
	return htmlStr;
};
WgRnaJnkF.prototype.getMenuDetail = function() {
	var htmlStr = "";
	htmlStr += "<form><div><strong>Detailed settings</strong></div>";
	htmlStr += "<div class=\"modal_inbox\">";
	htmlStr += "<table border=\"0\" width=\"100%\"><tr><td align=\"center\">";
	htmlStr += "<div>Track height: <input type=\"text\" id=\"height\" size=\"3\" maxlength=\"3\" value=\"" + this.height + "\"/></div>";
	htmlStr += "</td></tr></table></div>";
	htmlStr += "<div class=\"modal_btn\"><input type=\"button\" id=\"apply_button\" value=\"Apply\" /><input type=\"button\" id=\"cancel_button\" value=\"Cancel\" /></div>";
	htmlStr += "</form>";
	
	return [htmlStr, [300, 100]];
};
WgRnaJnkF.prototype.setViewDetail = function(divId) {
	var height = parseInt($("div" + divId + " div#modal div.container #height").val());
	if(height < 10) height = 10;
	if(height > 500) height = 500;
	if(isNaN(height)) height = 20;
	this.height = height;
	
	return true;
};
WgRnaJnkF.prototype.getName = function() {
	return this.name;
};
WgRnaJnkF.prototype.getItemDispName = function() {
	var dispName = (this.dispName)? this.dispName: this.name;
	return dispName;
};
WgRnaJnkF.prototype.getItemDetailName = function() {
	return (this.option.itemDetailName)? this.option.itemDetailName: this.getItemDispName();
};
WgRnaJnkF.prototype.getPannelBgcolor = function() {
	return (this.option.pannelBgcolor)? this.option.pannelBgcolor: "#EEEEEE";
};
WgRnaJnkF.prototype.getButtonInfo = function() {
	var buttonColor = (this.option.buttonColor === undefined)? 
		{"color": ["eeeeee", "ffcccc"], "onOff": this.option.buttonOnOffFlg}: 
		{"color": this.option.buttonColor, "onOff": this.option.buttonOnOffFlg};
	
	return buttonColor;
};
WgRnaJnkF.prototype.accessObj = function(chr, binStart, binEnd, powP, accDefault) {
	var m = this;
	var bpPerPixel = Math.pow(10, powP);
	
	var bpStart = binStart * bpPerPixel * POW_REG + 1;
	var bpEnd = (parseInt(binStart) + 1) * bpPerPixel * POW_REG;
	
	this.bb.readWaitReader(chr, bpStart, bpEnd, bpPerPixel, function(reductionLevel, fetcher) {
		var data = {};
		var tmp = [];
		var sorter = [];
		for(var alnEach of fetcher()) {
			var num = (reductionLevel)? alnEach.maxVal: alnEach.value;
			if(num === undefined) {
				var bedClm = alnEach.otherClm.split(/\t/);
				var scoreName = bedClm[0].split(/\|/);
				var blockStarts = bedClm[8].split(/,/);
				var blockSizes = bedClm[7].split(/,/);
				var chromStart = parseInt(alnEach.chromStart);
				var chromEnd = parseInt(alnEach.chromEnd);
				var upStart = chromStart + parseInt(blockStarts[0]);
				var upEnd = upStart + parseInt(blockSizes[0]) - 1;
				var dwnStart = chromStart + parseInt(blockStarts[1]);
				var dwnEnd = dwnStart + parseInt(blockSizes[1]) - 1;
				tmp.push({
					type: "bed", id: scoreName[0], 
					up_start: upStart, up_end: upEnd, 
					dwn_start: dwnStart, dwn_end: dwnEnd, 
					strand: (bedClm[2] == "+")? "1": "0", 
					depth: scoreName[1], name: scoreName[0]
				});
			} else {
				tmp.push({
					type: "wig", id: alnEach.chromStart, start: alnEach.chromStart, 
					end: alnEach.chromEnd, num: num 
				});
			}
		}
		data[m.name] = tmp;
		accDefault.success(data);
		accDefault.complete();
	}, function(err) {
		accDefault.error(err, err, err);
		accDefault.complete();
	});
};


var WgSeqF = function(fil, option) {
	this.imgObj, this.ojson;
	
	this.option = (option !== undefined)? option: {};
	this.option.frameFlg = 
		(this.option.frameFlg === undefined)? true: this.option.frameFlg;
	this.option.inColorFlg = 
		(this.option.inColorFlg === undefined)? true: this.option.inColorFlg;
	this.option.buttonOnOffFlg = 
		(this.option.buttonOnOffFlg === undefined)? false: option.buttonOnOffFlg;
	
	this.charPx = (this.option.charPx === undefined)? 10: this.option.charPx;
	this.height = 12;
	this.y;
	
	this.wg = new WgenomeData(fil);
};
WgSeqF.prototype = new WgRoot();
WgSeqF.prototype.paint = function(y, width, chr, start, end, strand) {
	//描写状況:存在しないデータのbin情報を入れる
	var status = [];
	
	var statusFor = {};
	//1px未満になったら表示しない
	if(end - start + 1 < width) {
		var reg = 1 * POW_REG;
		var y1 = y;
		var y2 = y1 + 10;
		this.imgObj.font = this.charPx + "px 'Helvetica'";
		for(var i = parseInt(start); i <= parseInt(end + 1); i ++) {
			var bin = Math.floor((i - 1) / reg);
			//以下はもっと効率よくできるかも
			if(this.ojson["0"] && this.ojson["0"][chr + "|" + bin] && this.ojson["0"][chr + "|" + bin]["sequence"]) {
				var char = this.ojson["0"][chr + "|" + bin]["sequence"].charAt(i - 1 - bin * reg);
				if(strand == "-") {
					var tmp = char;
					if(char == "A") tmp = "T"; if(char == "a") tmp = "t";
					if(char == "C") tmp = "G"; if(char == "c") tmp = "g";
					if(char == "G") tmp = "C"; if(char == "g") tmp = "c";
					if(char == "T") tmp = "A"; if(char == "t") tmp = "a";
					char = tmp;
				}
				var x1 = (i - start) * (width - 1) / (end - start + 1);
				var x2 = (i - start + 1) * (width - 1) / (end - start + 1);
				if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
				if(this.option.inColorFlg) {
					this.imgObj.fillStyle = 
						(char == "A" || char == "a")? "#88FF88": 
						(char == "C" || char == "c")? "#8888FF": 
						(char == "G" || char == "g")? "#FF8800": 
						(char == "T" || char == "t")? "#FF4488": "#AAAAAA";
					this.imgObj.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
				}
				if(x2 - x1 > this.charPx) {
					this.imgObj.fillStyle = "#000000";
					this.imgObj.fillText(char, (x1 + x2) / 2 - 2, y2 - 1);
					if(this.option.frameFlg) 
						this.imgObj.strokeRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
				}
			} else {
				statusFor[bin] = 1;
			}
		}
	}
	for(var bin in statusFor) if(bin >= 0) status.push(bin);
	
	return status;
};
WgSeqF.prototype.getMenuPopup = function() {
	var htmlStr = "";
	return htmlStr;
};
WgSeqF.prototype.getName = function() {
	return "sequence";
};
WgSeqF.prototype.getItemDispName = function() {
	return "Sequence";
};
WgSeqF.prototype.getButtonInfo = function() {
	var buttonColor = (this.option.buttonColor === undefined)? 
		{"color": ["eeeeee", "ffcccc"], "onOff": this.option.buttonOnOffFlg}: 
		{"color": this.option.buttonColor, "onOff": this.option.buttonOnOffFlg};
	
	return buttonColor;
};
WgSeqF.prototype.accessObj = function(chr, binStart, binEnd, powP, accDefault) {
	var m = this;
	var bpPerPixel = Math.pow(10, powP);
	
	var bpStart = binStart * bpPerPixel * POW_REG + 1;
	var bpEnd = (parseInt(binStart) + 1) * bpPerPixel * POW_REG;
	
	this.wg.readWaitReader(chr, bpStart, bpEnd, function(fetcher) {
		var seq = "";
		for(var seqEach of fetcher()) {
			seq += seqEach;
		}
		var data = {};
		data[m.getName()] = seq;
		accDefault.success(data);
		accDefault.complete();
	}, function(err) {
		throw new Error("data not found.");
	});
};
var WgenomeData = function(fil, option) {
	this.file = fil;
	this.option = (option !== undefined)? option: {};
	
	this.fileType = "None";
	
	this.seqBuff = 10000;
	//読み込み済みもしくは、読み込みリクエスト中データ
	this.loadData = {};
	this.loadData.header = false;
	this.loadData.indexData = false;
	this.loadData.seqData = {};
	
	this.indexData = {};
	this.seqData = {};
};
WgenomeData.prototype.accRequest = function(callback, reject, option) {
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
WgenomeData.prototype.accWebRequest = function(callback, reject, option) {
	let accFile = (option.file !== undefined)? option.file: this.file;
	let xhr = new XMLHttpRequest();
	xhr.open('GET', accFile, true);
	if(option.byteStart !== undefined && option.byteEnd !== undefined) {
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
WgenomeData.prototype.header = function() {
	let m = this;
	
	let option = {};
	option.byteStart = 0;
	option.byteEnd = 15;
	
	return new Promise(function(resolve, reject){
		if(m.loadData.header) {
			resolve(m);
			return;
		}
		
		m.loadData.header = true;
		m.accRequest(function(response) {
			let plain = new Uint8Array(response);
			let dataview = new DataView(plain.buffer);
			
			let magic = dataview.getUint32(0, true);
			if(magic == 27626472) {
				m.fileType = "Wgenome";
			} else {
				alert("unsupported file: " + magic);
				return false;
			}
			
			let compressionFormat = dataview.getUint16(6, true);
			
			let indexSize = dataview.getUint32(8, true);
			
			m.indexData.indexSize = indexSize;
			resolve(m);
			
		}, reject, option);
	});
};
WgenomeData.prototype.accIndexData = function(self) {
	
	return new Promise(function(resolve, reject){
		if(self.loadData.indexData) {
			resolve(self);
			return;
		}
		//読み込めてないけど流す
		if(self.indexData.indexSize === undefined) {
			resolve(self);
			return;
		}
		
		let option = {};
		option.byteStart = 16;
		option.byteEnd = 16 + self.indexData.indexSize - 1;
		
		self.loadData.indexData = true;
		self.accRequest(function(response) {
			let plain = new Uint8Array(response);
			let dataview = new DataView(plain.buffer);
			let chrNum = dataview.getUint32(0, true);
			let poi = 4;
			let keySizeList = [];
			for(let i = 0; i < chrNum; i ++) {
				let keySize = dataview.getUint32(poi, true);
				keySizeList.push(keySize);
				poi += 4;
			}
			let chrData = {};
			let chrNameList = [];
			for(let i = 0; i < chrNum; i ++) {
				let keySize = keySizeList[i];
				let chrName = "";
				for(let j = 1; j <= keySize; j ++) {
					if(plain[poi] != 0) chrName += String.fromCharCode(plain[poi]);
					poi ++;
				}
				let chrId = dataview.getUint32(poi, true);
				poi += 4;
				
				let chrSize = dataview.getUint32(poi, true);
				poi += 4;
				chrData[chrName] = [chrSize, []];
				chrNameList.push(chrName);
			}
			
			let dataPoi = 0;
			for(let i = 0; i < chrNum; i ++) {
				let chrName = chrNameList[i];
				let inChrData = chrData[chrName];
				let chrSize = inChrData[0];
				let chunkNum = Math.floor((chrSize - 1) / self.seqBuff) + 1;
				let dataSizeList = [];
				for(let j = 0; j < chunkNum; j ++) {
					let dataSize = dataview.getUint16(poi, true);
					poi += 2;
					dataSizeList.push(dataPoi);
					dataPoi += dataSize;
				}
				if(chunkNum >= 1) {
					dataSizeList.push(dataPoi);
				}
				chrData[chrName][1] = dataSizeList;
			}
			
			self.indexData.chrData = chrData;
			
			resolve(self);
			
		}, reject, option);
	});
};
WgenomeData.prototype.accSeqData = function(m, chr, chunkStart, chunkEnd) {
	
	return new Promise(function(resolve, reject){
		if(m.loadData.seqData[chr] === undefined) {
			m.loadData.seqData[chr] = {};
		}
		
		let cStart, cEnd;
		for(let i = chunkStart; i <= chunkEnd; i ++) {
			if(cStart === undefined) {
				if(!m.loadData.seqData[chr][i]) {
					cStart = i;
					cEnd = i;
					m.loadData.seqData[chr][i] = true;
				}
			} else {
				if(!m.loadData.seqData[chr][i]) {
					cEnd = i;
					m.loadData.seqData[chr][i] = true;
				}
			}
		}
		
		if(cStart === undefined) {
			resolve(self);
			return;
		}
		
		let chrIndexData = m.indexData.chrData[chr];
		let poiStart = chrIndexData[1][cStart];
		let poiEnd = chrIndexData[1][cEnd + 1] - 1;
		
		let option = {};
		option.byteStart = m.indexData.indexSize + 16 + poiStart;
		option.byteEnd = m.indexData.indexSize + 16 + poiEnd;
		
		if(m.seqData[chr] === undefined) m.seqData[chr] = {};
		let seq = "";
		m.accRequest(function(response) {
			let plain = new Uint8Array(response);
			for(let i = 0; i < plain.length; i ++) {
				seq += String.fromCharCode(plain[i]);
			}
			for(let i = cStart; i <= cEnd; i ++) {
				m.seqData[chr][i] = seq.substr((i - cStart) * m.seqBuff, m.seqBuff);
			}
			
			resolve(self);
			
		}, reject, option);
	});
};

WgenomeData.prototype.loadRegionData = function(chr, start, end, callback, reject) {
	let m = this;
	
	this.header().then(m.accIndexData).then(function() {
		if(m.indexData.chrData === undefined) {
			//染色体情報：load中・・・
			callback();
			return;
		}
		
		if(m.indexData.chrData[chr] === undefined) {
			throw new Error("chromosome: '" + chr + "' data not found.");
		} else {
			let chrIndexData = m.indexData.chrData[chr];
			let chunkMax = Math.floor((chrIndexData[0] - 1) / m.seqBuff);
			let chunkStart = Math.floor((start - 1) / m.seqBuff);
			let chunkEnd = Math.floor((end - 1) / m.seqBuff);
			if(chunkStart < 0) chunkStart = 0;
			if(chunkEnd > chunkMax) chunkEnd = chunkMax;
			if(chunkEnd < chunkStart) {
				throw new Error("Region: " + chunkEnd + " < " + chunkStart);
			}
			
			m.accSeqData(m, chr, chunkStart, chunkEnd).then(callback).catch(reject);
			
		}
		
	}).catch(reject);
};
//dataを読み込んだ後呼ばれることが前提
WgenomeData.prototype.getData = function(chr, start, end) {
	let m = this;
	
	let resData = [];
	
	if(this.seqData[chr] === undefined) {
		//染色体不明
		return [Array(end - start + 1 + 1).join("*")];
	}
	
	let seq = "";
	if(start <= 0) {
		seq += Array(1 + 1 - start).join(" ");
	}
	
	let chrIndexData = m.indexData.chrData[chr];
	let chunkMax = Math.floor((chrIndexData[0] - 1) / m.seqBuff);
	let chunkStart = Math.floor((start - 1) / m.seqBuff);
	let chunkEnd = Math.floor((end - 1) / m.seqBuff);
	if(chunkStart < 0) chunkStart = 0;
	if(chunkEnd > chunkMax) chunkEnd = chunkMax;
	
	let chrSeqData = this.seqData[chr];
	for(let i = chunkStart; i <= chunkEnd; i ++) {
		let tmpStart = i * m.seqBuff + 1;
		let tmpSeq = chrSeqData[i];
		let tmpEnd = tmpStart + tmpSeq.length - 1;
		
		if(tmpStart < start) {
			tmpSeq = tmpSeq.substr(start - tmpStart);
		}
		if(end < tmpEnd) {
			tmpSeq = tmpSeq.substr(0, tmpSeq.length - (tmpEnd - end));
		}
		seq += tmpSeq;
	}
	
	if(seq.length < end - start + 1) {
		seq += Array(1 + (end - start + 1 - seq.length)).join(" ");
	}
	
	return [seq];
};
WgenomeData.prototype.isAllLoaded = function(chr, start, end) {
	let m = this;
	
	if(m.indexData.chrData === undefined) {
		return false;
	}
	
	if(m.loadData.seqData[chr] === undefined) {
		//存在しない染色体
		return true;
	}
	
	let chrIndexData = m.indexData.chrData[chr];
	let chunkMax = Math.floor((chrIndexData[0] - 1) / m.seqBuff);
	let chunkStart = Math.floor((start - 1) / m.seqBuff);
	let chunkEnd = Math.floor((end - 1) / m.seqBuff);
	if(chunkStart < 0) chunkStart = 0;
	if(chunkEnd > chunkMax) chunkEnd = chunkMax;
	
	let seqChrData = m.seqData[chr]
	for(let i = chunkStart; i <= chunkEnd; i ++) {
		if(seqChrData[i] === undefined) {
			return false;
		}
	}
	
	return true;
};
WgenomeData.prototype.readWaitReader = function(
	chr, start, end, callback, reject, option
) {
	
	if(option === undefined) option = {};
	if(option.timeout === undefined) option.timeout = 300;
	
	let m = this;
	
	this.header().then(m.accIndexData).then(function() {
		
		//dataを読み込んだ後呼ばれる
		let func = function* () {
			let resData = m.getData(chr, start, end);
			for(let i = 0; i < resData.length; i ++) {
				yield resData[i];
			}
		};
		
		m.loadRegionData(chr, start, end, function() {
			if(!m.isAllLoaded(chr, start, end)) {
				let counter = 0;
				let loopFunc = function() {
					m.loadRegionData(chr, start, end, function() {
						if(m.isAllLoaded(chr, start, end)) {
							callback(func);
						} else {
							if(++ counter >= option.timeout) {
								reject("Timeout: Genome data could not get");
							} else {
								setTimeout(loopFunc, 1000);
							}
						}
					}, reject);
					
				};
				loopFunc();
			} else {
				callback(func);
			}
		}, reject);
	}, reject);
};
WgenomeData.prototype.onError = function(err) {
	alert("Error:" + err);
};



var WgRefseqF = function(fil, name, dispName, option) {
	this.name = (name !== undefined)? name: "refGene";
	this.dispName = (dispName !== undefined)? dispName: "NCBI RefSeq";
	
	this.imgObj, this.ojson;
	
	this.option = (option !== undefined)? option: {};
	this.option.spid = (this.option.spid === undefined)? 9606: this.option.spid;
	
	if(this.option.jsonUrl !== undefined) {
		this.jsonUrl = this.option.jsonUrl;
	}
	
	//各geneの表示縦幅
	this.fontSize = 10;
	this.eachSqwHeight = 10;
	this.eachHeight = 25;
	this.height;
	this.y;
	
	//色
	this.colUtrP = (this.option.colUtr)? this.option.colUtr: "#99CCFF";
	this.colCdsP = (this.option.colCds)? this.option.colCds: "#44AAFF";
	this.colBoxP = (this.option.colBox)? this.option.colBox: "#0000FF";
	this.colUtrM = (this.option.colUtr)? this.option.colUtr: "#FFCC99";
	this.colCdsM = (this.option.colCds)? this.option.colCds: "#FFAA44";
	this.colBoxM = (this.option.colBox)? this.option.colBox: "#FF0000";
	
	//表示タイプ
	this.showType = (this.option.showType)? this.option.showType: "expanded";
	
	
	var m = this;
	this.imgCaching = {
		//cachingNum: 1, 
		//cachingNum: 5,
		cachingNum: 10,
		applyMinPow: 3, 
		getSettingType: function() {
			return m.fontSize + "|" + m.eachSqwHeight + "|" + m.eachHeight + "|" + 
				m.colUtrP + "|" + m.colCdsP + "|" + m.colBoxP + "|" + 
				m.colUtrM + "|" + m.colCdsM + "|" + m.colBoxM + "|" + m.showType;
		}
	};
	
	this.bb = new BigbedData(fil);
};
WgRefseqF.prototype = new WgRoot();
WgRefseqF.prototype.paint2 = function(dt, y, width, chr, start, end, strand) {
	
	//再描画回避用
	var finView = {};
	
	var eachHeight = (this.showType == "squished")? this.eachSqwHeight: this.eachHeight;
	var nameY = (this.showType == "squished")? 0: this.fontSize + 5;
	
	var nameXs = [];
	for(var i = 0; i < dt.length; i++) {
		var refGene = dt[i];
		for(var j = 0; j < refGene.length; j ++) {
			if(refGene[j].tx_start <= end && start <= refGene[j].tx_end) {
				var step = (this.showType == "collapsed")? 1: parseInt(refGene[j].step);
				
				//intron (center)
				var y2 = y + eachHeight * (step - 1) + ((eachHeight - nameY) / 2);
				//UTR
				var y1 = y2 - 3;
				var y3 = y2 + 3;
				//CDS
				var y4 = y + eachHeight * (step - 1);
				//高速化のため
				//if(y4 > height) break;
				var y5 = y4 + eachHeight - nameY;
				//Symbol
				var y6 = y5 + this.fontSize / 1.4 + 3;
				
				var x1 = (refGene[j].tx_start - start) * (width - 1) / (end - start + 1);
				var x2 = (refGene[j].tx_end - start + 1) * (width - 1) / (end - start + 1);
				if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
				
				if(x1 < 0) x1 = 0;
				if(x2 > width - 1) x2 = width - 1;
				var strandFlg = (refGene[j].strand == "+");
				this.imgObj.fillStyle = (strandFlg)? this.colBoxP: this.colBoxM;
				this.imgObj.fillRect(x1, y2, x2 - x1 + 1, 1);
				
				//gene名
				var name = refGene[j].name2 + " (" + refGene[j].name + ")";
				var id = refGene[j].refgene_id;
				if(!(id in finView)) {
					this.imgObj.font = this.fontSize + "px 'Helvetica'";
					var strWidth = this.imgObj.measureText(name).width;
					var xMin = x1;
					var xMax = x2;
					var x7;
					if(xMin > width / 3 * 2) {
						x7 = x1 - strWidth / 2;
					} else if(xMax < width / 3) {
						x7 = x2 - strWidth / 2;
					} else {
						if(xMin < width / 3) xMin = width / 3;
						if(xMax > width / 3 * 2) xMax = width / 3 * 2;
						x7 = (xMin + xMax) / 2 - strWidth / 2;
					}
					if(x7 < 0) x7 = 0;
					if(x7 > width - strWidth) x7 = width - strWidth;
					if(this.showType != "squished") {
						if(
							nameXs[step - 1] === undefined || 
							(strand != "-" && nameXs[step - 1] + 10 < x7) ||
							(strand == "-" && x7 + strWidth + 10 < nameXs[step - 1])
						) {
							nameXs[step - 1] = (strand == "-")? x7: x7 + strWidth;
							this.imgObj.fillStyle = (strandFlg)? this.colBoxP: this.colBoxM;
							this.imgObj.fillText(name, x7, y6);
							finView[id] = 1;
						}
					}
				}
				
				var starts = refGene[j].exon_starts.split(",");
				for(var k = 0; k < starts.length; k ++) {
					if(starts[k] != "") starts[k] = parseInt(starts[k]);
				}
				var ends = refGene[j].exon_ends.split(",");
				for(var k = 0; k < ends.length; k ++) {
					if(ends[k] != "") ends[k] = parseInt(ends[k]);
				}
				var cdsStart = refGene[j].cds_start;
				var cdsEnd = refGene[j].cds_end;
				if(refGene[j].tx_start == cdsStart && cdsEnd + 1 == cdsStart) {
					cdsStart --;
				}
				
				for(var k = 0; k < starts.length; k ++) {
					if(starts[k] == "" || end < starts[k]) break;
					if(ends[k] < start) continue;
					
					if(cdsStart <= starts[k] && ends[k] <= cdsEnd) {
						var x5 = (starts[k] - start) * (width - 1) / (end - start + 1);
						var x6 = (ends[k] - start + 1) * (width - 1) / (end - start + 1);
						if(strand == "-") {
							var tmp = width - 1 - x5; x5 = width - 1 - x6; x6 = tmp;
						}
						
						this.imgObj.fillStyle = (strandFlg)? this.colCdsP: this.colCdsM;
						this.imgObj.fillRect(x5, y4, x6 - x5 + 1, y5 - y4);
						this.imgObj.strokeStyle = (strandFlg)? this.colBoxP: this.colBoxM;
						this.imgObj.strokeRect(x5, y4, x6 - x5 + 1, y5 - y4);
					} else {
						var x3 = (starts[k] - start) * (width - 1) / (end - start + 1);
						var x4 = (ends[k] - start + 1) * (width - 1) / (end - start + 1);
						if(strand == "-") {
							var tmp = width - 1 - x3; x3 = width - 1 - x4; x4 = tmp;
						}
						this.imgObj.fillStyle = (strandFlg)? this.colUtrP: this.colUtrM;
						this.imgObj.fillRect(x3, y1, x4 - x3 + 1, y3 - y1);
						this.imgObj.strokeStyle = (strandFlg)? this.colBoxP: this.colBoxM;
						this.imgObj.strokeRect(x3, y1, x4 - x3 + 1, y3 - y1);
						
						if((starts[k] <= cdsStart && cdsStart <= ends[k]) || 
							(starts[k] <= cdsEnd && cdsEnd <= ends[k])) {
							
							var cdsSPoi = (starts[k] <= cdsStart && cdsStart <= ends[k])? cdsStart: starts[k];
							var cdsEPoi = (starts[k] <= cdsEnd && cdsEnd <= ends[k])? cdsEnd: ends[k];
							
							var x5 = (cdsSPoi - start) * (width - 1) / (end - start + 1);
							var x6 = (cdsEPoi - start + 1) * (width - 1) / (end - start + 1);
							if(strand == "-") {
								var tmp = width - 1 - x5; x5 = width - 1 - x6; x6 = tmp;
							}
							
							this.imgObj.fillStyle = (strandFlg)? this.colCdsP: this.colCdsM;
							this.imgObj.fillRect(x5, y4, x6 - x5 + 1, y5 - y4);
							this.imgObj.strokeStyle = (strandFlg)? this.colBoxP: this.colBoxM;
							this.imgObj.strokeRect(x5, y4, x6 - x5 + 1, y5 - y4);
						}
						
					}
					
				}
				this.imgObj.strokeStyle = (strandFlg)? this.colBoxP: this.colBoxM;
				this.imgObj.beginPath();
				for(var k = x1; k < x2 - 5; k += 50) {
					if((strandFlg && strand != "-") || (!strandFlg && strand == "-")) {
						this.imgObj.moveTo(k, y2 - 2);
						this.imgObj.lineTo(k + 5, y2);
						this.imgObj.lineTo(k, y2 + 2);
					} else {
						this.imgObj.moveTo(k + 5, y2 - 2);
						this.imgObj.lineTo(k, y2);
						this.imgObj.lineTo(k + 5, y2 + 2);
					}
				}
				this.imgObj.stroke();
			}
		}
	}
};
WgRefseqF.prototype.setHeight2 = function(dt, width, chr, start, end) {
	var eachHeight = (this.showType == "squished")? this.eachSqwHeight: this.eachHeight;
	var maxStep = 1;
	if(this.showType != "collapsed") {
		for(var i = 0; i < dt.length; i++) {
			var refGene = dt[i];
			for(var j = 0; j < refGene.length; j ++) {
				if(refGene[j].tx_start <= end && start <= refGene[j].tx_end) {
					var step = parseInt(refGene[j].step);
					if(maxStep < step) maxStep = step;
				}
			}
		}
	}
	this.height = eachHeight * maxStep;
};
WgRefseqF.prototype.getMenuPopup = function() {
	var checked = new Array("", "", "");
	if(this.showType == "collapsed") checked[0] = "checked=\"checked\"";
	if(this.showType == "expanded") checked[1] = "checked=\"checked\"";
	if(this.showType == "squished") checked[2] = "checked=\"checked\"";
	var htmlStr = "";
	htmlStr += "<div style=\"border:1px solid\"><table border=\"0\" width=\"100%\"><tr><th align=\"left\" bgcolor=\"#aaaaaa\" colspan=\"2\">Setting:</th></tr><tr>";
	htmlStr += "<td bgcolor=\"#aaaaaa\">&nbsp;</td><td><form>";
	htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"collapsed\" id=\"collapsed\" ";
	htmlStr += checked[0] + " /><label for=\"collapsed\">Collapsed</label></div>";
	htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"expanded\" id=\"expanded\" ";
	htmlStr += checked[1] + " /><label for=\"expanded\">Expanded</label></div>";
	htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"squished\" id=\"squished\" ";
	htmlStr += checked[2] + " /><label for=\"squished\">Squished</label></div>";
	htmlStr += "</form>";
	htmlStr += "<hr /><a href=\"#\" class=\"det\">Detail...</a>";
	htmlStr += "</td></tr></table></div>";
	htmlStr += "<hr /><a href=\"#\" class=\"help\">Help</a>";
	
	return htmlStr;
};
WgRefseqF.prototype.getMenuDetail = function() {
	var htmlStr = "";
	htmlStr += "<form><div><strong>Detailed settings</strong></div>";
	htmlStr += "<div class=\"modal_inbox\">";
	htmlStr += "<table border=\"0\" width=\"100%\"><tr><td align=\"center\">";
	htmlStr += "<div>Font size: <input type=\"text\" id=\"font_size\" size=\"2\" maxlength=\"2\" value=\"" + this.fontSize + "\" />px</div>";
	htmlStr += "</td></tr></table><hr />";
	htmlStr += "<table border=\"0\" width=\"100%\"><tr><td align=\"center\">";
	htmlStr += "<table border=\"1\">";
	htmlStr += "<tr><th align=\"left\" colspan=\"3\"><a target=\"_blank\" href=\"http://www.theodora.com/gif4/html_colors.gif\">Coloring: </a></td></tr>";
	htmlStr += "<tr><td rowspan=\"3\">Plus strand</td><td nowrap>Base color: #<input type=\"text\" id=\"colbox_p\" size=\"6\" maxlength=\"6\" value=\"" + this.colBoxP.substr(1) + "\"/></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"colbox_p_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</tr>";
	htmlStr += "<tr><td nowrap>CDS color: #<input type=\"text\" id=\"colcds_p\" size=\"6\" maxlength=\"6\" value=\"" + this.colCdsP.substr(1) + "\"/></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"colcds_p_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</tr>";
	htmlStr += "<tr><td nowrap>UTR color: #<input type=\"text\" id=\"colutr_p\" size=\"6\" maxlength=\"6\" value=\"" + this.colUtrP.substr(1) + "\"/></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"colutr_p_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</tr>";
	htmlStr += "<tr><td rowspan=\"3\">Minus strand</td><td nowrap>Base color: #<input type=\"text\" id=\"colbox_m\" size=\"6\" maxlength=\"6\" value=\"" + this.colBoxM.substr(1) + "\"/></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"colbox_m_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</tr>";
	htmlStr += "<tr><td nowrap>CDS color: #<input type=\"text\" id=\"colcds_m\" size=\"6\" maxlength=\"6\" value=\"" + this.colCdsM.substr(1) + "\"/></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"colcds_m_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</tr>";
	htmlStr += "<tr><td nowrap>UTR color: #<input type=\"text\" id=\"colutr_m\" size=\"6\" maxlength=\"6\" value=\"" + this.colUtrM.substr(1) + "\"/></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"colutr_m_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</table>";
	htmlStr += "<div>&nbsp;</div>";
	htmlStr += "</td></tr></table></div>";
	htmlStr += "<div class=\"modal_btn\"><input type=\"button\" id=\"apply_button\" value=\"Apply\" /><input type=\"button\" id=\"cancel_button\" value=\"Cancel\" /></div>";
	htmlStr += "</form>";
	
	return [htmlStr, [300, 320]];
};
WgRefseqF.prototype.getHelpData = function() {
	var htmlStr = "";
	htmlStr += "<form><table border=\"0\" width=\"100%\"><tr><td align=\"center\">";
	htmlStr += "NCBI RefSeq track";
	htmlStr += "<div>&nbsp;</div>";
	htmlStr += "<div><input type=\"button\" id=\"ok_button\" value=\"OK\" /></div>";
	htmlStr += "</td></tr></table></form>";
	
	return [htmlStr, [200, 80]];
};
WgRefseqF.prototype.menuDetailAction = function(parent) {
	var id, bgcol;
	
	id = "colbox_p";
	bgcol = this.colBoxP;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", bgcol);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + 
			"_td").css("background-color", "#" + $(this).val());
	});
	
	id = "colcds_p";
	bgcol = this.colCdsP;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", bgcol);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + 
			"_td").css("background-color", "#" + $(this).val());
	});
	
	id = "colutr_p";
	bgcol = this.colUtrP;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", bgcol);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + 
			"_td").css("background-color", "#" + $(this).val());
	});
	
	id = "colbox_m";
	bgcol = this.colBoxM;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", bgcol);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + 
			"_td").css("background-color", "#" + $(this).val());
	});
	
	id = "colcds_m";
	bgcol = this.colCdsM;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", bgcol);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + 
			"_td").css("background-color", "#" + $(this).val());
	});
	
	id = "colutr_m";
	bgcol = this.colUtrM;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", bgcol);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + 
			"_td").css("background-color", "#" + $(this).val());
	});
};
WgRefseqF.prototype.setViewDetail = function(divId) {
	this.colBoxP = "#" + $("div" + divId + " div#modal div.container #colbox_p").val();
	this.colCdsP = "#" + $("div" + divId + " div#modal div.container #colcds_p").val();
	this.colUtrP = "#" + $("div" + divId + " div#modal div.container #colutr_p").val();
	this.colBoxM = "#" + $("div" + divId + " div#modal div.container #colbox_m").val();
	this.colCdsM = "#" + $("div" + divId + " div#modal div.container #colcds_m").val();
	this.colUtrM = "#" + $("div" + divId + " div#modal div.container #colutr_m").val();
	
	var fontSize = parseInt($("div" + divId + " div#modal div.container #font_size").val());
	if(fontSize < 5) fontSize = 5;
	if(fontSize > 50) fontSize = 50;
	if(isNaN(fontSize)) fontSize = 10;
	this.fontSize = fontSize;
	
	this.eachHeight = this.eachSqwHeight + this.fontSize + 5;
	
	return true;
};
WgRefseqF.prototype.getPopupData = function(y, width, chr, start, end, strand) {
	var popup = {};
	
	if(this.name == "refGene") {
		var eachHeight = (this.showType == "squished")? this.eachSqwHeight: this.eachHeight;
		var nameY = (this.showType == "squished")? 0: this.fontSize + 5;
		
		var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
		if(pow < 0) pow = 0;
		var reg = Math.pow(10, pow) * POW_REG;
		
		var binStart = Math.floor((start - 1) / reg);
		var binEnd = Math.floor((end - 1) / reg);
		var nameXs = [];
		for(var i = binStart; i <= binEnd; i ++) {
			if(this.ojson[pow] && this.ojson[pow][chr + "|" + i] && this.ojson[pow][chr + "|" + i][this.name]) {
				var refGene = this.ojson[pow][chr + "|" + i][this.name];
				for(var j = 0; j < refGene.length; j ++) {
					if(refGene[j].tx_start <= end && start <= refGene[j].tx_end) {
						var step = (this.showType == "collapsed")? 1: parseInt(refGene[j].step);
						var y1 = y + eachHeight * (step - 1);
						var y2 = y1 + eachHeight - nameY;
						var x1 = (refGene[j].tx_start - start) * (width - 1) / (end - start + 1);
						var x2 = (refGene[j].tx_end - start + 1) * (width - 1) / (end - start + 1);
						if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
						if(x1 < 0) x1 = 0;
						if(x2 > width - 1) x2 = width - 1;
						var yStr = y1 + "," + y2;
						if(!(yStr in popup)) popup[yStr] = {};
						var xStr = x1 + "," + x2;
						var htmlStr = "<table border=\"1\">";
						htmlStr += "<tr>";
						htmlStr += "<th>Gene ID</th>";
						htmlStr += "<td>" + refGene[j].name2 + "</td>";
						htmlStr += "</tr>";
						htmlStr += "<tr>";
						htmlStr += "<th>Transcript ID</th>";
						htmlStr += "<td>" + refGene[j].name + "</td>";
						htmlStr += "</tr>";
						htmlStr += "<tr>";
						htmlStr += "<th>Go to</th>";
						htmlStr += "<td>";
						//htmlStr += "<a href=\"#\" onclick=\"dbtssLink('";
						//htmlStr += chr + ":" + refGene[j].tx_start + "-" + refGene[j].tx_end + ":" + refGene[j].strand;
						//htmlStr += "', '" + refGene[j].name2 + "');return false;\" id=\"dbtss_link\">DBTSS</a>, ";
						htmlStr += "<a href=\"#\" id=\"dbtss_link\">DBTSS</a>, ";
						htmlStr += "<a href=\"#\" onclick=\"window.open('http://www.ncbi.nlm.nih.gov/gene/?term=" + refGene[j].name + "', '_blank')\">NCBI</a>";
						htmlStr += "</td>";
						htmlStr += "</tr>";
						htmlStr += "</table>";
						popup[yStr][xStr] = {
							"html": htmlStr,
							"actionParam": [chr + ":" + refGene[j].tx_start + "-" + refGene[j].tx_end + ":" + refGene[j].strand, refGene[j].name2, this.option.spid],
							"action": function(d, p) {
								(function() {
									var pCp = p;
									$("#right_pop #dbtss_link").click(function(){
										var region = pCp[0];
										var name = pCp[1];
										var regList = region.split(":");
										var se = regList[1].split("-");
										
										var nameStr = (name !== undefined)? "&name=" + name: "";
										
										var lng = se[1] - se[0] + 1;
										var modS = (regList[2] == "+")? 4: 10;
										var start = Math.floor(parseInt(se[0]) - lng / modS);
										var modE = (regList[2] == "+")? 10: 4;
										var end = Math.floor(parseInt(se[1]) + lng / modE);
										var topParam = "SEE=1&UID=2" + nameStr + "&taxid=" + pCp[2] + "&region=" + regList[0] + ":" + start + "-" + 
											end + ":" + regList[2];
										
										var bottomStart, bottomEnd;
										if(regList[2] == "+") {
											bottomStart = parseInt(se[0]) - 250;
											bottomEnd = parseInt(se[0]) + 250 - 1;
										} else {
											bottomStart = parseInt(se[1]) - 250 + 1;
											bottomEnd = parseInt(se[1]) + 250;
										}
										
										
										var bottomParam = "SEE=1&UID=2&taxid=" + pCp[2] + "&region=" + regList[0] + ":" + bottomStart + "-" + 
											bottomEnd + ":" + regList[2];
										
										
										$("#err").html("");
										$("#result").html("<div id='result_top'></div><div id='result_bottom'></div>");
										$("#result_top").html("<img src='icons/loading.gif' /> waiting...");
										$("#result_bottom").html("<img src='icons/loading.gif' /> waiting...");
										
										$.ajax({
											url: "https://dbtss.hgc.jp/cgi-bin/dbtss_view_top.cgi?" + topParam,
											data: "",
											dataType: 'html',
											success: function(htmlStr) {
												$("#result_top").html(htmlStr);
											},
											error : function(data) {
												$("#err").html("<h3><font color='red'>Error: Cannot access to " + this.url + "</font></h3>");
												$("#result_top").html("");
											},
											complete: function(data) {
											}
										});
										
										$.ajax({
											url: "https://dbtss.hgc.jp/cgi-bin/dbtss_view_detail.cgi?" + bottomParam,
											data: "",
											dataType: 'html',
											success: function(htmlStr) {
												$("#result_bottom").html(htmlStr);
											},
											error : function(data) {
												$("#err").html("<h3><font color='red'>Error: Cannot access to " + this.url + "</font></h3>");
												$("#result_bottom").html("");
											},
											complete: function(data) {
											}
										});
										
										return false;
									});
								})();
							}
						};
					}
				}
			}
		}
	}
	
	return popup;
};
//イメージオブジェクト,Jsonオブジェクトの設定をオーバーライド
WgRefseqF.prototype.setImgJson = function(imgObj, ojson, genome) {
	this.imgObj = imgObj;
	this.ojson = ojson;
	this.chrSize = genome;
	
	if(this.option.initJson !== undefined && !this.importedFlg) {
		this.importedFlg = true;
		for(var chr in this.chrSize) {
			var size = this.chrSize[chr][1];
			for(var pow = 0; pow <= 5; pow ++) {
				if(this.ojson[pow] === undefined) this.ojson[pow] = {};
				var binEnd = Math.floor((size - 1) / (Math.pow(10, pow) * POW_REG));
				for(var bin = 0; bin <= binEnd; bin ++) {
					var chrBin = chr + "|" + bin;
					if(this.ojson[pow][chrBin] === undefined) this.ojson[pow][chrBin] = {};
					if(this.ojson[pow][chrBin][this.name] === undefined) 
						this.ojson[pow][chrBin][this.name] = [];
				}
			}
		}
		var initJson = this.option.initJson;
		for(var chr in initJson) {
			var tmpDt = {};
			var sorter = {};
			var initJsonChr = initJson[chr];
			var geneHash = [];
			for(var i = 0; i < initJsonChr.length; i ++) {
				var gene = initJsonChr[i];
				var inp = {
					"name": gene[0],
					"strand": gene[1],
					"tx_start": gene[2],
					"tx_end": gene[3],
					"exon_starts": gene[6],
					"exon_ends": gene[7], 
					"name2": gene[8],
					"refgene_id": gene[9],
					"step": gene[10]
				};
				if(gene[4] != "") {
					inp.cds_start = gene[4];
					inp.cds_end = gene[5];
				}
				geneHash.push(inp);
				
				var txStart = gene[2];
				var txEnd = gene[3];
				for(var pow = 0; pow <= 5; pow ++) {
					var binStart = Math.floor((txStart - 1) / (Math.pow(10, pow) * POW_REG));
					var binEnd = Math.floor((txEnd - 1) / (Math.pow(10, pow) * POW_REG));
					for(var bin = binStart; bin <= binEnd; bin ++) {
						if(tmpDt[pow] === undefined) {
							tmpDt[pow] = {};
							sorter[pow] = {};
						}
						if(tmpDt[pow][bin] === undefined) {
							tmpDt[pow][bin] = {};
							sorter[pow][bin] = [];
						}
						if(tmpDt[pow][bin][txStart] === undefined) {
							tmpDt[pow][bin][txStart] = [];
							sorter[pow][bin].push(txStart);
						}
						tmpDt[pow][bin][txStart].push(i);
					}
				}
			}
			for(var pow in tmpDt) {
				for(var bin in tmpDt[pow]) {
					var chrBin = chr + "|" + bin;
					sorter[pow][bin].sort(function(a, b) {
						if(a > b) return 1;
						if(a < b) return -1;
						return 0;
					});
					for(var j = 0; j < sorter[pow][bin].length; j ++) {
						var txStart = sorter[pow][bin][j];
						var iList = tmpDt[pow][bin][txStart];
						for(var i = 0; i < iList.length; i ++) {
							this.ojson[pow][chrBin][this.name].push(geneHash[iList[i]]);
						}
					}
					
				}
			}
		}
		
		//for(var pow = 0; pow < initJson.length; pow ++) {
		//	if(this.ojson[pow] === undefined) this.ojson[pow] = {};
		//	for(var chrBin in initJson[pow]) {
		//		if(this.ojson[pow][chrBin] === undefined) this.ojson[pow][chrBin] = {};
		//		this.ojson[pow][chrBin][this.name] = initJson[pow][chrBin];
		//	}
		//}
	}
};
WgRefseqF.prototype.getName = function() {
	return this.name;
};
WgRefseqF.prototype.getItemDispName = function() {
	return this.dispName;
};
WgRefseqF.prototype.accessObj = function(chr, binStart, binEnd, powP, accDefault) {
	var m = this;
	var bpPerPixel = Math.pow(10, powP);
	
	var bpStart = binStart * bpPerPixel * POW_REG + 1;
	var bpEnd = (parseInt(binStart) + 1) * bpPerPixel * POW_REG;
	
	this.bb.readWaitReader(chr, bpStart, bpEnd, 1, function(reductionLevel, fetcher) {
		var data = {};
		//var tmp = {};
		var tmp = [];
		var sorter = [];
		for(var alnEach of fetcher()) {
			var num = (reductionLevel)? alnEach.maxVal: alnEach.value;
			if(num === undefined) {
				var bedClm = alnEach.otherClm.split(/\t/);
				var stepName = bedClm[0].split(/\|/, 3);
				var blockStarts = bedClm[8].split(/,/);
				var blockSizes = bedClm[7].split(/,/);
				var chromStart = parseInt(alnEach.chromStart);
				var chromEnd = parseInt(alnEach.chromEnd);
				var cdsStart = parseInt(bedClm[3]) + 1;
				var cdsEnd = parseInt(bedClm[4]);
				var exonStarts = "";
				var exonEnds = "";
				for(var i = 0; i < blockStarts.length; i ++) {
					var blockStart = chromStart + parseInt(blockStarts[i]);
					var blockEnd = blockStart + parseInt(blockSizes[i]) - 1;
					if(exonStarts != "") exonStarts += ",";
					exonStarts += blockStart;
					if(exonEnds != "") exonEnds += ",";
					exonEnds += blockEnd;
				}
				//if(tmp[chromStart] === undefined) {
				//	tmp[chromStart] = [];
				//	sorter.push(chromStart);
				//}
				//tmp[chromStart].push({
				//	type: "bed", refgene_id: bedClm[0], name: stepName[1], name2: stepName[2], 
				//	strand: bedClm[2], tx_start: chromStart, tx_end: chromEnd, 
				//	cds_start: cdsStart, cds_end: cdsEnd, 
				//	exon_starts: exonStarts, exon_ends: exonEnds, 
				//	step: stepName[0]
				//});
				tmp.push({
					type: "bed", refgene_id: bedClm[0], name: stepName[1], name2: stepName[2], 
					strand: bedClm[2], tx_start: chromStart, tx_end: chromEnd, 
					cds_start: cdsStart, cds_end: cdsEnd, 
					exon_starts: exonStarts, exon_ends: exonEnds, 
					step: stepName[0]
				});
			} else {
				tmp.push({
					type: "wig", id: alnEach.chromStart, start: alnEach.chromStart, 
					end: alnEach.chromEnd, num: num 
				});
			}
		}
		//sorter.sort(function(a, b) {
		//	if(a > b) return 1;
		//	if(a < b) return -1;
		//	return 0;
		//});
		//
		//var tmp2 = [];
		//for(var i = 0; i < sorter.length; i ++) {
		//	var chromStart = sorter[i];
		//	for(var j = 0; j < tmp[chromStart].length; j ++) {
		//		tmp2.push(tmp[chromStart][j]);
		//	}
		//}
		//
		//data[m.name] = tmp2;
		data[m.name] = tmp;
		accDefault.success(data);
		accDefault.complete();
	}, function(err) {
		accDefault.error(err, err, err);
		accDefault.complete();
	});
};


var WgRefseq = function(name, dispName, option) {
	this.name = (name !== undefined)? name: "refGene";
	this.dispName = (dispName !== undefined)? dispName: "NCBI RefSeq";
	
	this.imgObj, this.ojson;
	
	this.option = (option !== undefined)? option: {};
	this.option.spid = (this.option.spid === undefined)? 9606: this.option.spid;
	
	if(this.option.jsonUrl !== undefined) {
		this.jsonUrl = this.option.jsonUrl;
	}
	
	//各geneの表示縦幅
	this.fontSize = 10;
	this.eachSqwHeight = 10;
	this.eachHeight = 25;
	this.height;
	this.y;
	
	//色
	this.colUtrP = (this.option.colUtr)? this.option.colUtr: "#99CCFF";
	this.colCdsP = (this.option.colCds)? this.option.colCds: "#44AAFF";
	this.colBoxP = (this.option.colBox)? this.option.colBox: "#0000FF";
	this.colUtrM = (this.option.colUtr)? this.option.colUtr: "#FFCC99";
	this.colCdsM = (this.option.colCds)? this.option.colCds: "#FFAA44";
	this.colBoxM = (this.option.colBox)? this.option.colBox: "#FF0000";
	
	//表示タイプ
	this.showType = (this.option.showType)? this.option.showType: "expanded";
	
	
	var m = this;
	this.imgCaching = {
		//cachingNum: 1, 
		//cachingNum: 5,
		cachingNum: 10,
		applyMinPow: 3, 
		getSettingType: function() {
			return m.fontSize + "|" + m.eachSqwHeight + "|" + m.eachHeight + "|" + 
				m.colUtrP + "|" + m.colCdsP + "|" + m.colBoxP + "|" + 
				m.colUtrM + "|" + m.colCdsM + "|" + m.colBoxM + "|" + m.showType;
		}
	};
	
};
WgRefseq.prototype = new WgRoot();
WgRefseq.prototype.paint2 = function(dt, y, width, chr, start, end, strand) {
	
	//再描画回避用
	var finView = {};
	
	var eachHeight = (this.showType == "squished")? this.eachSqwHeight: this.eachHeight;
	var nameY = (this.showType == "squished")? 0: this.fontSize + 5;
	
	var nameXs = [];
	for(var i = 0; i < dt.length; i++) {
		var refGene = dt[i];
		for(var j = 0; j < refGene.length; j ++) {
			if(refGene[j].tx_start <= end && start <= refGene[j].tx_end) {
				var step = (this.showType == "collapsed")? 1: parseInt(refGene[j].step);
				
				//intron (center)
				var y2 = y + eachHeight * (step - 1) + ((eachHeight - nameY) / 2);
				//UTR
				var y1 = y2 - 3;
				var y3 = y2 + 3;
				//CDS
				var y4 = y + eachHeight * (step - 1);
				//高速化のため
				//if(y4 > height) break;
				var y5 = y4 + eachHeight - nameY;
				//Symbol
				var y6 = y5 + this.fontSize / 1.4 + 3;
				
				var x1 = (refGene[j].tx_start - start) * (width - 1) / (end - start + 1);
				var x2 = (refGene[j].tx_end - start + 1) * (width - 1) / (end - start + 1);
				if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
				
				if(x1 < 0) x1 = 0;
				if(x2 > width - 1) x2 = width - 1;
				var strandFlg = (refGene[j].strand == "+");
				this.imgObj.fillStyle = (strandFlg)? this.colBoxP: this.colBoxM;
				this.imgObj.fillRect(x1, y2, x2 - x1 + 1, 1);
				
				//gene名
				var name = refGene[j].name2 + " (" + refGene[j].name + ")";
				var id = refGene[j].refgene_id;
				if(!(id in finView)) {
					this.imgObj.font = this.fontSize + "px 'Helvetica'";
					var strWidth = this.imgObj.measureText(name).width;
					var xMin = x1;
					var xMax = x2;
					var x7;
					if(xMin > width / 3 * 2) {
						x7 = x1 - strWidth / 2;
					} else if(xMax < width / 3) {
						x7 = x2 - strWidth / 2;
					} else {
						if(xMin < width / 3) xMin = width / 3;
						if(xMax > width / 3 * 2) xMax = width / 3 * 2;
						x7 = (xMin + xMax) / 2 - strWidth / 2;
					}
					if(x7 < 0) x7 = 0;
					if(x7 > width - strWidth) x7 = width - strWidth;
					if(this.showType != "squished") {
						if(
							nameXs[step - 1] === undefined || 
							(strand != "-" && nameXs[step - 1] + 10 < x7) ||
							(strand == "-" && x7 + strWidth + 10 < nameXs[step - 1])
						) {
							nameXs[step - 1] = (strand == "-")? x7: x7 + strWidth;
							this.imgObj.fillStyle = (strandFlg)? this.colBoxP: this.colBoxM;
							this.imgObj.fillText(name, x7, y6);
							finView[id] = 1;
						}
					}
				}
				
				var starts = refGene[j].exon_starts.split(",");
				for(var k = 0; k < starts.length; k ++) {
					if(starts[k] != "") starts[k] = parseInt(starts[k]);
				}
				var ends = refGene[j].exon_ends.split(",");
				for(var k = 0; k < ends.length; k ++) {
					if(ends[k] != "") ends[k] = parseInt(ends[k]);
				}
				var cdsStart = refGene[j].cds_start;
				var cdsEnd = refGene[j].cds_end;
				for(var k = 0; k < starts.length; k ++) {
					if(starts[k] == "" || end < starts[k]) break;
					if(ends[k] < start) continue;
					
					if(cdsStart <= starts[k] && ends[k] <= cdsEnd) {
						var x5 = (starts[k] - start) * (width - 1) / (end - start + 1);
						var x6 = (ends[k] - start + 1) * (width - 1) / (end - start + 1);
						if(strand == "-") {
							var tmp = width - 1 - x5; x5 = width - 1 - x6; x6 = tmp;
						}
						
						this.imgObj.fillStyle = (strandFlg)? this.colCdsP: this.colCdsM;
						this.imgObj.fillRect(x5, y4, x6 - x5 + 1, y5 - y4);
						this.imgObj.strokeStyle = (strandFlg)? this.colBoxP: this.colBoxM;
						this.imgObj.strokeRect(x5, y4, x6 - x5 + 1, y5 - y4);
					} else {
						var x3 = (starts[k] - start) * (width - 1) / (end - start + 1);
						var x4 = (ends[k] - start + 1) * (width - 1) / (end - start + 1);
						if(strand == "-") {
							var tmp = width - 1 - x3; x3 = width - 1 - x4; x4 = tmp;
						}
						this.imgObj.fillStyle = (strandFlg)? this.colUtrP: this.colUtrM;
						this.imgObj.fillRect(x3, y1, x4 - x3 + 1, y3 - y1);
						this.imgObj.strokeStyle = (strandFlg)? this.colBoxP: this.colBoxM;
						this.imgObj.strokeRect(x3, y1, x4 - x3 + 1, y3 - y1);
						
						if((starts[k] <= cdsStart && cdsStart <= ends[k]) || 
							(starts[k] <= cdsEnd && cdsEnd <= ends[k])) {
							
							var cdsSPoi = (starts[k] <= cdsStart && cdsStart <= ends[k])? cdsStart: starts[k];
							var cdsEPoi = (starts[k] <= cdsEnd && cdsEnd <= ends[k])? cdsEnd: ends[k];
							
							var x5 = (cdsSPoi - start) * (width - 1) / (end - start + 1);
							var x6 = (cdsEPoi - start + 1) * (width - 1) / (end - start + 1);
							if(strand == "-") {
								var tmp = width - 1 - x5; x5 = width - 1 - x6; x6 = tmp;
							}
							
							this.imgObj.fillStyle = (strandFlg)? this.colCdsP: this.colCdsM;
							this.imgObj.fillRect(x5, y4, x6 - x5 + 1, y5 - y4);
							this.imgObj.strokeStyle = (strandFlg)? this.colBoxP: this.colBoxM;
							this.imgObj.strokeRect(x5, y4, x6 - x5 + 1, y5 - y4);
						}
						
					}
					
				}
				this.imgObj.strokeStyle = (strandFlg)? this.colBoxP: this.colBoxM;
				this.imgObj.beginPath();
				for(var k = x1; k < x2 - 5; k += 50) {
					if((strandFlg && strand != "-") || (!strandFlg && strand == "-")) {
						this.imgObj.moveTo(k, y2 - 2);
						this.imgObj.lineTo(k + 5, y2);
						this.imgObj.lineTo(k, y2 + 2);
					} else {
						this.imgObj.moveTo(k + 5, y2 - 2);
						this.imgObj.lineTo(k, y2);
						this.imgObj.lineTo(k + 5, y2 + 2);
					}
				}
				this.imgObj.stroke();
			}
		}
	}
};
WgRefseq.prototype.setHeight2 = function(dt, width, chr, start, end) {
	var eachHeight = (this.showType == "squished")? this.eachSqwHeight: this.eachHeight;
	var maxStep = 1;
	if(this.showType != "collapsed") {
		for(var i = 0; i < dt.length; i++) {
			var refGene = dt[i];
			for(var j = 0; j < refGene.length; j ++) {
				if(refGene[j].tx_start <= end && start <= refGene[j].tx_end) {
					var step = parseInt(refGene[j].step);
					if(maxStep < step) maxStep = step;
				}
			}
		}
	}
	this.height = eachHeight * maxStep;
};
WgRefseq.prototype.getMenuPopup = function() {
	var checked = new Array("", "", "");
	if(this.showType == "collapsed") checked[0] = "checked=\"checked\"";
	if(this.showType == "expanded") checked[1] = "checked=\"checked\"";
	if(this.showType == "squished") checked[2] = "checked=\"checked\"";
	var htmlStr = "";
	htmlStr += "<div style=\"border:1px solid\"><table border=\"0\" width=\"100%\"><tr><th align=\"left\" bgcolor=\"#aaaaaa\" colspan=\"2\">Setting:</th></tr><tr>";
	htmlStr += "<td bgcolor=\"#aaaaaa\">&nbsp;</td><td><form>";
	htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"collapsed\" id=\"collapsed\" ";
	htmlStr += checked[0] + " /><label for=\"collapsed\">Collapsed</label></div>";
	htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"expanded\" id=\"expanded\" ";
	htmlStr += checked[1] + " /><label for=\"expanded\">Expanded</label></div>";
	htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"squished\" id=\"squished\" ";
	htmlStr += checked[2] + " /><label for=\"squished\">Squished</label></div>";
	htmlStr += "</form>";
	htmlStr += "<hr /><a href=\"#\" class=\"det\">Detail...</a>";
	htmlStr += "</td></tr></table></div>";
	htmlStr += "<hr /><a href=\"#\" class=\"help\">Help</a>";
	
	return htmlStr;
};
WgRefseq.prototype.getMenuDetail = function() {
	var htmlStr = "";
	htmlStr += "<form><div><strong>Detailed settings</strong></div>";
	htmlStr += "<div class=\"modal_inbox\">";
	htmlStr += "<table border=\"0\" width=\"100%\"><tr><td align=\"center\">";
	htmlStr += "<div>Font size: <input type=\"text\" id=\"font_size\" size=\"2\" maxlength=\"2\" value=\"" + this.fontSize + "\" />px</div>";
	htmlStr += "</td></tr></table><hr />";
	htmlStr += "<table border=\"0\" width=\"100%\"><tr><td align=\"center\">";
	htmlStr += "<table border=\"1\">";
	htmlStr += "<tr><th align=\"left\" colspan=\"3\"><a target=\"_blank\" href=\"http://www.theodora.com/gif4/html_colors.gif\">Coloring: </a></td></tr>";
	htmlStr += "<tr><td rowspan=\"3\">Plus strand</td><td nowrap>Base color: #<input type=\"text\" id=\"colbox_p\" size=\"6\" maxlength=\"6\" value=\"" + this.colBoxP.substr(1) + "\"/></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"colbox_p_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</tr>";
	htmlStr += "<tr><td nowrap>CDS color: #<input type=\"text\" id=\"colcds_p\" size=\"6\" maxlength=\"6\" value=\"" + this.colCdsP.substr(1) + "\"/></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"colcds_p_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</tr>";
	htmlStr += "<tr><td nowrap>UTR color: #<input type=\"text\" id=\"colutr_p\" size=\"6\" maxlength=\"6\" value=\"" + this.colUtrP.substr(1) + "\"/></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"colutr_p_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</tr>";
	htmlStr += "<tr><td rowspan=\"3\">Minus strand</td><td nowrap>Base color: #<input type=\"text\" id=\"colbox_m\" size=\"6\" maxlength=\"6\" value=\"" + this.colBoxM.substr(1) + "\"/></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"colbox_m_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</tr>";
	htmlStr += "<tr><td nowrap>CDS color: #<input type=\"text\" id=\"colcds_m\" size=\"6\" maxlength=\"6\" value=\"" + this.colCdsM.substr(1) + "\"/></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"colcds_m_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</tr>";
	htmlStr += "<tr><td nowrap>UTR color: #<input type=\"text\" id=\"colutr_m\" size=\"6\" maxlength=\"6\" value=\"" + this.colUtrM.substr(1) + "\"/></td>";
	htmlStr += "<td align=\"center\"><table><tr><td bgcolor=\"white\" id=\"colutr_m_td\">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr></table></td>";
	htmlStr += "</table>";
	htmlStr += "<div>&nbsp;</div>";
	htmlStr += "</td></tr></table></div>";
	htmlStr += "<div class=\"modal_btn\"><input type=\"button\" id=\"apply_button\" value=\"Apply\" /><input type=\"button\" id=\"cancel_button\" value=\"Cancel\" /></div>";
	htmlStr += "</form>";
	
	return [htmlStr, [300, 320]];
};
WgRefseq.prototype.getHelpData = function() {
	var htmlStr = "";
	htmlStr += "<form><table border=\"0\" width=\"100%\"><tr><td align=\"center\">";
	htmlStr += "NCBI RefSeq track";
	htmlStr += "<div>&nbsp;</div>";
	htmlStr += "<div><input type=\"button\" id=\"ok_button\" value=\"OK\" /></div>";
	htmlStr += "</td></tr></table></form>";
	
	return [htmlStr, [200, 80]];
};
WgRefseq.prototype.menuDetailAction = function(parent) {
	var id, bgcol;
	
	id = "colbox_p";
	bgcol = this.colBoxP;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", bgcol);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + 
			"_td").css("background-color", "#" + $(this).val());
	});
	
	id = "colcds_p";
	bgcol = this.colCdsP;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", bgcol);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + 
			"_td").css("background-color", "#" + $(this).val());
	});
	
	id = "colutr_p";
	bgcol = this.colUtrP;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", bgcol);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + 
			"_td").css("background-color", "#" + $(this).val());
	});
	
	id = "colbox_m";
	bgcol = this.colBoxM;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", bgcol);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + 
			"_td").css("background-color", "#" + $(this).val());
	});
	
	id = "colcds_m";
	bgcol = this.colCdsM;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", bgcol);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + 
			"_td").css("background-color", "#" + $(this).val());
	});
	
	id = "colutr_m";
	bgcol = this.colUtrM;
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("background-color", bgcol);
	$("div" + parent.divId + " div#modal div.container #" + id + "_td").css("border", "solid 1px");
	$("div" + parent.divId + " div#modal div.container #" + id).change(function() {
		$("div" + parent.divId + " div#modal div.container #" + $(this).attr("id") + 
			"_td").css("background-color", "#" + $(this).val());
	});
};
WgRefseq.prototype.setViewDetail = function(divId) {
	this.colBoxP = "#" + $("div" + divId + " div#modal div.container #colbox_p").val();
	this.colCdsP = "#" + $("div" + divId + " div#modal div.container #colcds_p").val();
	this.colUtrP = "#" + $("div" + divId + " div#modal div.container #colutr_p").val();
	this.colBoxM = "#" + $("div" + divId + " div#modal div.container #colbox_m").val();
	this.colCdsM = "#" + $("div" + divId + " div#modal div.container #colcds_m").val();
	this.colUtrM = "#" + $("div" + divId + " div#modal div.container #colutr_m").val();
	
	var fontSize = parseInt($("div" + divId + " div#modal div.container #font_size").val());
	if(fontSize < 5) fontSize = 5;
	if(fontSize > 50) fontSize = 50;
	if(isNaN(fontSize)) fontSize = 10;
	this.fontSize = fontSize;
	
	this.eachHeight = this.eachSqwHeight + this.fontSize + 5;
	
	return true;
};
WgRefseq.prototype.getPopupData = function(y, width, chr, start, end, strand) {
	var popup = {};
	
	if(this.name == "refGene") {
		var eachHeight = (this.showType == "squished")? this.eachSqwHeight: this.eachHeight;
		var nameY = (this.showType == "squished")? 0: this.fontSize + 5;
		
		var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
		if(pow < 0) pow = 0;
		var reg = Math.pow(10, pow) * POW_REG;
		
		var binStart = Math.floor((start - 1) / reg);
		var binEnd = Math.floor((end - 1) / reg);
		var nameXs = [];
		for(var i = binStart; i <= binEnd; i ++) {
			if(this.ojson[pow] && this.ojson[pow][chr + "|" + i] && this.ojson[pow][chr + "|" + i][this.name]) {
				var refGene = this.ojson[pow][chr + "|" + i][this.name];
				for(var j = 0; j < refGene.length; j ++) {
					if(refGene[j].tx_start <= end && start <= refGene[j].tx_end) {
						var step = (this.showType == "collapsed")? 1: parseInt(refGene[j].step);
						var y1 = y + eachHeight * (step - 1);
						var y2 = y1 + eachHeight - nameY;
						var x1 = (refGene[j].tx_start - start) * (width - 1) / (end - start + 1);
						var x2 = (refGene[j].tx_end - start + 1) * (width - 1) / (end - start + 1);
						if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
						if(x1 < 0) x1 = 0;
						if(x2 > width - 1) x2 = width - 1;
						var yStr = y1 + "," + y2;
						if(!(yStr in popup)) popup[yStr] = {};
						var xStr = x1 + "," + x2;
						var htmlStr = "<table border=\"1\">";
						htmlStr += "<tr>";
						htmlStr += "<th>Gene ID</th>";
						htmlStr += "<td>" + refGene[j].name2 + "</td>";
						htmlStr += "</tr>";
						htmlStr += "<tr>";
						htmlStr += "<th>Transcript ID</th>";
						htmlStr += "<td>" + refGene[j].name + "</td>";
						htmlStr += "</tr>";
						htmlStr += "<tr>";
						htmlStr += "<th>Go to</th>";
						htmlStr += "<td>";
						//htmlStr += "<a href=\"#\" onclick=\"dbtssLink('";
						//htmlStr += chr + ":" + refGene[j].tx_start + "-" + refGene[j].tx_end + ":" + refGene[j].strand;
						//htmlStr += "', '" + refGene[j].name2 + "');return false;\" id=\"dbtss_link\">DBTSS</a>, ";
						htmlStr += "<a href=\"#\" id=\"dbtss_link\">DBTSS</a>, ";
						htmlStr += "<a href=\"#\" onclick=\"window.open('http://www.ncbi.nlm.nih.gov/gene/?term=" + refGene[j].name + "', '_blank')\">NCBI</a>";
						htmlStr += "</td>";
						htmlStr += "</tr>";
						htmlStr += "</table>";
						popup[yStr][xStr] = {
							"html": htmlStr,
							"actionParam": [chr + ":" + refGene[j].tx_start + "-" + refGene[j].tx_end + ":" + refGene[j].strand, refGene[j].name2, this.option.spid],
							"action": function(d, p) {
								(function() {
									var pCp = p;
									$("#right_pop #dbtss_link").click(function(){
										var region = pCp[0];
										var name = pCp[1];
										var regList = region.split(":");
										var se = regList[1].split("-");
										
										var nameStr = (name !== undefined)? "&name=" + name: "";
										
										var lng = se[1] - se[0] + 1;
										var modS = (regList[2] == "+")? 4: 10;
										var start = Math.floor(parseInt(se[0]) - lng / modS);
										var modE = (regList[2] == "+")? 10: 4;
										var end = Math.floor(parseInt(se[1]) + lng / modE);
										var topParam = "SEE=1&UID=2" + nameStr + "&taxid=" + pCp[2] + "&region=" + regList[0] + ":" + start + "-" + 
											end + ":" + regList[2];
										
										var bottomStart, bottomEnd;
										if(regList[2] == "+") {
											bottomStart = parseInt(se[0]) - 250;
											bottomEnd = parseInt(se[0]) + 250 - 1;
										} else {
											bottomStart = parseInt(se[1]) - 250 + 1;
											bottomEnd = parseInt(se[1]) + 250;
										}
										
										
										var bottomParam = "SEE=1&UID=2&taxid=" + pCp[2] + "&region=" + regList[0] + ":" + bottomStart + "-" + 
											bottomEnd + ":" + regList[2];
										
										
										$("#err").html("");
										$("#result").html("<div id='result_top'></div><div id='result_bottom'></div>");
										$("#result_top").html("<img src='icons/loading.gif' /> waiting...");
										$("#result_bottom").html("<img src='icons/loading.gif' /> waiting...");
										
										$.ajax({
											url: "https://dbtss.hgc.jp/cgi-bin/dbtss_view_top.cgi?" + topParam,
											data: "",
											dataType: 'html',
											success: function(htmlStr) {
												$("#result_top").html(htmlStr);
											},
											error : function(data) {
												$("#err").html("<h3><font color='red'>Error: Cannot access to " + this.url + "</font></h3>");
												$("#result_top").html("");
											},
											complete: function(data) {
											}
										});
										
										$.ajax({
											url: "https://dbtss.hgc.jp/cgi-bin/dbtss_view_detail.cgi?" + bottomParam,
											data: "",
											dataType: 'html',
											success: function(htmlStr) {
												$("#result_bottom").html(htmlStr);
											},
											error : function(data) {
												$("#err").html("<h3><font color='red'>Error: Cannot access to " + this.url + "</font></h3>");
												$("#result_bottom").html("");
											},
											complete: function(data) {
											}
										});
										
										return false;
									});
								})();
							}
						};
					}
				}
			}
		}
	}
	
	return popup;
};
//イメージオブジェクト,Jsonオブジェクトの設定をオーバーライド
WgRefseq.prototype.setImgJson = function(imgObj, ojson, genome) {
	this.imgObj = imgObj;
	this.ojson = ojson;
	this.chrSize = genome;
	
	if(this.option.initJson !== undefined && !this.importedFlg) {
		this.importedFlg = true;
		for(var chr in this.chrSize) {
			var size = this.chrSize[chr][1];
			for(var pow = 0; pow <= 5; pow ++) {
				if(this.ojson[pow] === undefined) this.ojson[pow] = {};
				var binEnd = Math.floor((size - 1) / (Math.pow(10, pow) * POW_REG));
				for(var bin = 0; bin <= binEnd; bin ++) {
					var chrBin = chr + "|" + bin;
					if(this.ojson[pow][chrBin] === undefined) this.ojson[pow][chrBin] = {};
					if(this.ojson[pow][chrBin][this.name] === undefined) 
						this.ojson[pow][chrBin][this.name] = [];
				}
			}
		}
		var initJson = this.option.initJson;
		for(var chr in initJson) {
			var tmpDt = {};
			var sorter = {};
			var initJsonChr = initJson[chr];
			var geneHash = [];
			for(var i = 0; i < initJsonChr.length; i ++) {
				var gene = initJsonChr[i];
				var inp = {
					"name": gene[0],
					"strand": gene[1],
					"tx_start": gene[2],
					"tx_end": gene[3],
					"exon_starts": gene[6],
					"exon_ends": gene[7], 
					"name2": gene[8],
					"refgene_id": gene[9],
					"step": gene[10]
				};
				if(gene[4] != "") {
					inp.cds_start = gene[4];
					inp.cds_end = gene[5];
				}
				geneHash.push(inp);
				
				var txStart = gene[2];
				var txEnd = gene[3];
				for(var pow = 0; pow <= 5; pow ++) {
					var binStart = Math.floor((txStart - 1) / (Math.pow(10, pow) * POW_REG));
					var binEnd = Math.floor((txEnd - 1) / (Math.pow(10, pow) * POW_REG));
					for(var bin = binStart; bin <= binEnd; bin ++) {
						if(tmpDt[pow] === undefined) {
							tmpDt[pow] = {};
							sorter[pow] = {};
						}
						if(tmpDt[pow][bin] === undefined) {
							tmpDt[pow][bin] = {};
							sorter[pow][bin] = [];
						}
						if(tmpDt[pow][bin][txStart] === undefined) {
							tmpDt[pow][bin][txStart] = [];
							sorter[pow][bin].push(txStart);
						}
						tmpDt[pow][bin][txStart].push(i);
					}
				}
			}
			for(var pow in tmpDt) {
				for(var bin in tmpDt[pow]) {
					var chrBin = chr + "|" + bin;
					sorter[pow][bin].sort(function(a, b) {
						if(a > b) return 1;
						if(a < b) return -1;
						return 0;
					});
					for(var j = 0; j < sorter[pow][bin].length; j ++) {
						var txStart = sorter[pow][bin][j];
						var iList = tmpDt[pow][bin][txStart];
						for(var i = 0; i < iList.length; i ++) {
							this.ojson[pow][chrBin][this.name].push(geneHash[iList[i]]);
						}
					}
					
				}
			}
		}
		
		//for(var pow = 0; pow < initJson.length; pow ++) {
		//	if(this.ojson[pow] === undefined) this.ojson[pow] = {};
		//	for(var chrBin in initJson[pow]) {
		//		if(this.ojson[pow][chrBin] === undefined) this.ojson[pow][chrBin] = {};
		//		this.ojson[pow][chrBin][this.name] = initJson[pow][chrBin];
		//	}
		//}
	}
};
WgRefseq.prototype.getName = function() {
	return this.name;
};
WgRefseq.prototype.getItemDispName = function() {
	return this.dispName;
};


var WgRnaseqF = function(name, dispName, bbUrl, option) {
	this.option = (option !== undefined)? option: {};
	this.option.buttonOnOffFlg = 
		(this.option.buttonOnOffFlg === undefined)? false: option.buttonOnOffFlg;
	
	this.name = name;
	this.dispName = dispName;

	this.imgObj, this.ojson;
	
	//各geneの表示縦幅
	this.eachHeight = 25;
	this.eachSqwHeight = 10;
	this.height;
	this.y;
	
	//表示タイプ
	this.showType = "expanded";
	
	this.bb = new BigbedData(bbUrl);
	
	var m = this;
	this.imgCaching = {
		cachingNum: 10,
		applyMinPow: 3, 
		getSettingType: function() {
			return m.eachSqwHeight + "|" + m.eachHeight + "|" + m.showType;
		}
	};
};
WgRnaseqF.prototype = new WgRoot();
WgRnaseqF.prototype.paint2 = function(dt, y, width, chr, start, end, strand) {
	
	//再描画回避用
	var finView = {};
	
	var eachHeight = (this.showType == "squished")? this.eachSqwHeight: this.eachHeight;
	var nameY = (this.showType == "squished")? 0: 15;
	
	var nameXs = [];
	for(var i = 0; i < dt.length; i++) {
		var rpkm = dt[i];
		for(var j = 0; j < rpkm.length; j ++) {
			if(rpkm[j].utr_start <= end && start <= rpkm[j].utr_end) {
				var step = (this.showType == "collapsed")? 1: parseInt(rpkm[j].step);
				
				var rpkm_col, rpkm_col2;
				var rpkm_org = rpkm[j].rpkm;
				
				//仮に
				if(rpkm_org == 0) {
					rpkm_org = "0";
				}
				
				if(rpkm_org == "") {
					rpkm_org = "ND";
					rpkm_col = "#BBBBBB";
					rpkm_col2 = "#666666";
				} else {
					var rpkm_val = parseInt(rpkm_org * 2);
					if(rpkm_val > 255) rpkm_val = 255;
					var rpkm_brd = (rpkm_val < 255 - 50)? rpkm_val + 50: 120;
					var hex = this.cov16(255 - Math.floor(rpkm_val));
					rpkm_col = (rpkm[j].strand == "-")? "#FF" + hex + hex: "#" + hex + hex + "FF";
					hex = this.cov16(255 - Math.floor(rpkm_brd));
					rpkm_col2 = (rpkm[j].strand == "-")? "#FF" + hex + hex: "#" + hex + hex + "FF";
				}
				
				//intron (center)
				var y2 = y + eachHeight * (step - 1) + ((eachHeight - nameY) / 2);
				//UTR
				var y1 = y2 - 3;
				var y3 = y2 + 3;
				//CDS
				var y4 = y + eachHeight * (step - 1);
				//高速化のため
				//if(y4 > height) break;
				var y5 = y4 + eachHeight - nameY;
				//Symbol
				var y6 = y5 + 10;
				
				var x1 = (rpkm[j].utr_start - start) * (width - 1) / (end - start + 1);
				var x2 = (rpkm[j].utr_end - start + 1) * (width - 1) / (end - start + 1);
				if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
				
				if(x1 < 0) x1 = 0;
				if(x2 > width - 1) x2 = width - 1;
				this.imgObj.fillStyle = rpkm_col2;
				this.imgObj.fillRect(x1, y2, x2 - x1 + 1, 1);
				var strandFlg = (rpkm[j].strand == "+");
				
				//gene名
				var name = rpkm[j].symbol;
				if(name == "-" || name == "") name = rpkm[j].name;
				name += " (" + rpkm_org + ")";
				var id = rpkm[j].id;
				if(!(id in finView)) {
					this.imgObj.font = "10px 'Helvetica'";
					var strWidth = this.imgObj.measureText(name).width;
					var xMin = x1;
					var xMax = x2;
					var x7;
					if(xMin > width / 3 * 2) {
						x7 = x1 - strWidth / 2;
					} else if(xMax < width / 3) {
						x7 = x2 - strWidth / 2;
					} else {
						if(xMin < width / 3) xMin = width / 3;
						if(xMax > width / 3 * 2) xMax = width / 3 * 2;
						x7 = (xMin + xMax) / 2 - strWidth / 2;
					}
					if(x7 < 0) x7 = 0;
					if(x7 > width - strWidth) x7 = width - strWidth;
					if(this.showType != "squished") {
						if(
							nameXs[step - 1] === undefined || 
							(strand != "-" && nameXs[step - 1] + 10 < x7) ||
							(strand == "-" && x7 + strWidth + 10 < nameXs[step - 1])
						) {
							nameXs[step - 1] = (strand == "-")? x7: x7 + strWidth;
							this.imgObj.fillStyle = "#444444";
							this.imgObj.fillText(name, x7, y6);
							finView[id] = 1;
						}
					}
				}
				
				var starts = rpkm[j].exn_starts.split(",");
				for(var k = 0; k < starts.length; k ++) {
					if(starts[k] != "") starts[k] = parseInt(starts[k]);
				}
				var ends = rpkm[j].exn_ends.split(",");
				for(var k = 0; k < ends.length; k ++) {
					if(ends[k] != "") ends[k] = parseInt(ends[k]);
				}
				var cdsStart = rpkm[j].cds_start;
				var cdsEnd = rpkm[j].cds_end;
				for(var k = 0; k < starts.length; k ++) {
					if(starts[k] == "" || end < starts[k]) break;
					if(ends[k] < start) continue;
					
					if(cdsStart != "" && cdsStart <= starts[k] && ends[k] <= cdsEnd) {
						var x5 = (starts[k] - start) * (width - 1) / (end - start + 1);
						var x6 = (ends[k] - start + 1) * (width - 1) / (end - start + 1);
						if(strand == "-") {
							var tmp = width - 1 - x5; x5 = width - 1 - x6; x6 = tmp;
						}
						
						this.imgObj.fillStyle = rpkm_col;
						this.imgObj.fillRect(x5, y4, x6 - x5 + 1, y5 - y4);
						this.imgObj.strokeStyle = rpkm_col2;
						this.imgObj.strokeRect(x5, y4, x6 - x5 + 1, y5 - y4);
					} else {
						var x3 = (starts[k] - start) * (width - 1) / (end - start + 1);
						var x4 = (ends[k] - start + 1) * (width - 1) / (end - start + 1);
						if(strand == "-") {
							var tmp = width - 1 - x3; x3 = width - 1 - x4; x4 = tmp;
						}
						this.imgObj.fillStyle = rpkm_col;
						this.imgObj.fillRect(x3, y1, x4 - x3 + 1, y3 - y1);
						this.imgObj.strokeStyle = rpkm_col2;
						this.imgObj.strokeRect(x3, y1, x4 - x3 + 1, y3 - y1);
						
						if((starts[k] <= cdsStart && cdsStart <= ends[k]) || 
							(starts[k] <= cdsEnd && cdsEnd <= ends[k])) {
							
							var cdsSPoi = (starts[k] <= cdsStart && cdsStart <= ends[k])? cdsStart: starts[k];
							var cdsEPoi = (starts[k] <= cdsEnd && cdsEnd <= ends[k])? cdsEnd: ends[k];
							
							var x5 = (cdsSPoi - start) * (width - 1) / (end - start + 1);
							var x6 = (cdsEPoi - start + 1) * (width - 1) / (end - start + 1);
							if(strand == "-") {
								var tmp = width - 1 - x5; x5 = width - 1 - x6; x6 = tmp;
							}
							
							this.imgObj.fillStyle = rpkm_col;
							this.imgObj.fillRect(x5, y4, x6 - x5 + 1, y5 - y4);
							this.imgObj.strokeStyle = rpkm_col2;
							this.imgObj.strokeRect(x5, y4, x6 - x5 + 1, y5 - y4);
						}
						
					}
					
				}
				this.imgObj.strokeStyle = rpkm_col2;
				//this.imgObj.strokeStyle = "#ffffff";
				this.imgObj.beginPath();
				for(var k = x1; k < x2 - 5; k += 50) {
					if((strandFlg && strand != "-") || (!strandFlg && strand == "-")) {
						this.imgObj.moveTo(k, y2 - 2);
						this.imgObj.lineTo(k + 5, y2);
						this.imgObj.lineTo(k, y2 + 2);
					} else {
						this.imgObj.moveTo(k + 5, y2 - 2);
						this.imgObj.lineTo(k, y2);
						this.imgObj.lineTo(k + 5, y2 + 2);
					}
				}
				this.imgObj.stroke();
			}
		}
	}
	
};
WgRnaseqF.prototype.setHeight2 = function(dt, width, chr, start, end) {
	var eachHeight = (this.showType == "squished")? this.eachSqwHeight: this.eachHeight;
	var maxStep = 1;
	if(this.showType != "collapsed") {
		for(var i = 0; i < dt.length; i++) {
			var rpkm = dt[i];
			for(var j = 0; j < rpkm.length; j ++) {
				if(rpkm[j].utr_start <= end && start <= rpkm[j].utr_end) {
					var step = parseInt(rpkm[j].step);
					if(maxStep < step) maxStep = step;
				}
			}
		}
	}
	this.height = eachHeight * maxStep;
};
WgRnaseqF.prototype.getMenuPopup = function() {
	var checked = new Array("", "", "");
	if(this.showType == "collapsed") checked[0] = "checked=\"checked\"";
	if(this.showType == "expanded") checked[1] = "checked=\"checked\"";
	if(this.showType == "squished") checked[2] = "checked=\"checked\"";
	var htmlStr = "";
	htmlStr += "<form>";
	htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"collapsed\" id=\"collapsed\" ";
	htmlStr += checked[0] + " /><label for=\"collapsed\">Collapsed</label></div>";
	htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"expanded\" id=\"expanded\" ";
	htmlStr += checked[1] + " /><label for=\"expanded\">Expanded</label></div>";
	htmlStr += "<div><input type=\"radio\" name=\"show_type\" value=\"squished\" id=\"squished\" ";
	htmlStr += checked[2] + " /><label for=\"squished\">Squished</label></div>";
	htmlStr += "</form>";
	return htmlStr;
};
WgRnaseqF.prototype.getPopupData = function(y, width, chr, start, end) {
	var popup = {};
	
	var eachHeight = (this.showType == "squished")? this.eachSqwHeight: this.eachHeight;
	var nameY = (this.showType == "squished")? 0: 15;
	
	var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
	if(pow < 0) pow = 0;
	var reg = Math.pow(10, pow) * POW_REG;
	
	var binStart = Math.floor((start - 1) / reg);
	var binEnd = Math.floor((end - 1) / reg);
	var nameXs = [];
	for(var i = binStart; i <= binEnd; i ++) {
		if(this.ojson[pow] && this.ojson[pow][chr + "|" + i] && this.ojson[pow][chr + "|" + i][this.name]) {
			var rpkm = this.ojson[pow][chr + "|" + i][this.name];
			for(var j = 0; j < rpkm.length; j ++) {
				if(rpkm[j].utr_start <= end && start <= rpkm[j].utr_end) {
					var step = (this.showType == "collapsed")? 1: parseInt(rpkm[j].step);
					var y1 = y + eachHeight * (step - 1);
					var y2 = y1 + eachHeight - nameY;
					var x1 = (rpkm[j].utr_start - start) * (width - 1) / (end - start + 1);
					var x2 = (rpkm[j].utr_end - start + 1) * (width - 1) / (end - start + 1);
					if(x1 < 0) x1 = 0;
					if(x2 > width - 1) x2 = width - 1;
					var yStr = y1 + "," + y2;
					if(!(yStr in popup)) popup[yStr] = {};
					var xStr = x1 + "," + x2;
					var htmlStr = "<table border=\"1\">";
					htmlStr += "<tr>";
					htmlStr += "<th>Gene Symbol</th>";
					htmlStr += "<td>" + rpkm[j].symbol + "</td>";
					htmlStr += "</tr>";
					htmlStr += "<tr>";
					htmlStr += "<th>RefSeq ID</th>";
					htmlStr += "<td>" + rpkm[j].name + "</td>";
					htmlStr += "</tr>";
					htmlStr += "<tr>";
					htmlStr += "<th>Go to</th>";
					htmlStr += "<td><a href=\"https://dbtss.hgc.jp/cgi-bin/prom_start_es.cgi?SEE=1&UID=2&MSK=3&IDS=" + rpkm[j].name + "&SPI=00\">DBTSS</a>, ";
					htmlStr += "<a href=\"#\" onclick=\"window.open('http://www.ncbi.nlm.nih.gov/gene/?term=" + rpkm[j].name + "', '_blank')\">NCBI</a></td>";
					htmlStr += "</tr>";
					htmlStr += "</table>";
					popup[yStr][xStr] = {"html": htmlStr};
				}
			}
		}
	}
	
	return popup;
};
WgRnaseqF.prototype.getName = function() {
	return this.name;
};
WgRnaseqF.prototype.getPannelBgcolor = function() {
	return (this.option.pannelBgcolor)? this.option.pannelBgcolor: "#EEEEEE";
};
WgRnaseqF.prototype.getItemDispName = function() {
	return this.dispName;
};
WgRnaseqF.prototype.getButtonInfo = function() {
	var buttonColor = (this.option.buttonColor === undefined)? 
		{"color": ["eeeeee", "ffcccc"], "onOff": this.option.buttonOnOffFlg}: 
		{"color": this.option.buttonColor, "onOff": this.option.buttonOnOffFlg};
	
	return buttonColor;
};
WgRnaseqF.prototype.accessObj = function(chr, binStart, binEnd, powP, accDefault) {
	var m = this;
	var bpPerPixel = Math.pow(10, powP);
	
	var bpStart = binStart * bpPerPixel * POW_REG + 1;
	var bpEnd = (parseInt(binStart) + 1) * bpPerPixel * POW_REG;
	
	this.bb.readWaitReader(chr, bpStart, bpEnd, 1, function(reductionLevel, fetcher) {
		var data = {};
		var tmp = [];
		var sorter = [];
		for(var alnEach of fetcher()) {
			var num = (reductionLevel)? alnEach.maxVal: alnEach.value;
			if(num === undefined) {
				var bedClm = alnEach.otherClm.split(/\t/);
				var stepName = bedClm[0].split(/\|/, 4);
				var blockStarts = bedClm[8].split(/,/);
				var blockSizes = bedClm[7].split(/,/);
				var chromStart = parseInt(alnEach.chromStart);
				var chromEnd = parseInt(alnEach.chromEnd);
				var cdsStart = parseInt(bedClm[3]) + 1;
				var cdsEnd = parseInt(bedClm[4]);
				var exonStarts = "";
				var exonEnds = "";
				for(var i = 0; i < blockStarts.length; i ++) {
					var blockStart = chromStart + parseInt(blockStarts[i]);
					var blockEnd = blockStart + parseInt(blockSizes[i]) - 1;
					if(exonStarts != "") exonStarts += ",";
					exonStarts += blockStart;
					if(exonEnds != "") exonEnds += ",";
					exonEnds += blockEnd;
				}
				tmp.push({
					type: "bed", id: stepName[1], name: stepName[1], symbol: stepName[2], 
					strand: bedClm[2], utr_start: chromStart, utr_end: chromEnd, 
					cds_start: cdsStart, cds_end: cdsEnd, 
					exn_starts: exonStarts, exn_ends: exonEnds, 
					step: stepName[0], rpkm: parseFloat(stepName[3])
				});
			} else {
				tmp.push({
					type: "wig", id: alnEach.chromStart, start: alnEach.chromStart, 
					end: alnEach.chromEnd, num: num 
				});
			}
		}
		data[m.name] = tmp;
		accDefault.success(data);
		accDefault.complete();
	}, function(err) {
		accDefault.error(err, err, err);
		accDefault.complete();
	});
};


var WgComparaF = function(
	addDiv, dispName, comparaName, dispComparaName, urlSetCmp, 
	viewerPartsData, gvVector, option
) {
	this.comparaFlg = true;
	this.divId;
	this.urlSet;
	this.addDiv = addDiv;
	this.height = 0;
	this.width;
	this.nowWidth;
	this.y;
	this.option = (option === undefined)? {}: option;
	this.option.buttonOnOffFlg = 
		(this.option.buttonOnOffFlg === undefined)? false: option.buttonOnOffFlg;
	this.option.gvItemSwitchFlg = 
		(this.option.gvItemSwitchFlg === undefined)? false: option.gvItemSwitchFlg;
	this.option.gvInitShow = 
		(this.option.gvInitShow === undefined)? []: option.gvInitShow;
	//this.option.uriDirFlg = (this.option.uriDirFlg === undefined)? false: option.uriDirFlg;
	this.option.uriDirFlg = true;
	
	this.gvc;
	this.gv;
	this.gvVector = gvVector;
	this.chrData1 = urlSetCmp.chrData1;
	this.chrData2 = urlSetCmp.chrData2;
	
	this.dispName = dispName;
	
	this.dispComparaName = dispComparaName;
	this.comparaName = comparaName;
	this.urlSetCmp = urlSetCmp;
	this.viewerPartsData = viewerPartsData;
	
	this.name = comparaName;
	
	this.dataForCmp = new GenomeViewerCommonData();
	this.dataForPartner = new GenomeViewerCommonData();

	
	
	//paintのとき一度だけ初期化するためのフラグ
	this.initFlg = true;
};
WgComparaF.prototype = new WgRoot();
WgComparaF.prototype.paint = function(y, width, chr, start, end, strand) {
	if(this.nowWidth === undefined) {
		this.nowWidth = width;
	} else if (this.nowWidth != width) {
		this.nowWidth = width;
		this.initFlg = true;
	}
	if(this.initFlg) {
		this.initFlg = false;
		
		var gv = this.gvVector.gv;
		this.width = gv.width;
		this.urlSet = gv.urlSet;
		this.chrData1 = gv.genome;
		this.callingData = [gv.viewerParts, gv.option.ibuttonId, this];
		var divId = gv.divId;
		
		var urlSet = this.urlSet;
		var addDiv = this.addDiv;
		$("div" + divId + " #" + addDiv + "_compara").remove();
		$("div" + divId + " #" + addDiv + "_newview").remove();
		if($("div" + divId + " #items_button")[0]) {
			$("div" + divId + " #items_button").before("<div id=\"" + addDiv + "_compara" + "\"></div>\n");
			$("div" + divId + " #items_button").before("<div id=\"" + addDiv + "_newview" + "\"></div>\n");
		} else {
			$("div" + divId).append("<div id=\"" + addDiv + "_compara" + "\"></div>\n");
			$("div" + divId).append("<div id=\"" + addDiv + "_newview" + "\"></div>\n");
		}
		
		var myOption = {
			toolbarId: addDiv + "_toolcmp",
			viewerId:  addDiv + "_compara",
			ibuttonId: addDiv + "_bttncmp",
			commonData: this.dataForCmp, 
			
			uriDirFlg: this.option.uriDirFlg,
			scaleSizingFlg: false,
			showPanelFlg: true,
			autoSizingFlg: true,
			defaultMode: "info",
			//defaultMode: "nav",
			itemSwitchFlg: false,
			showChromFlg: false,
			showScaleFlg: true,
			showPositionFlg: true,
			locationBarFlg: false
		};
		
		var oalign;
		var m = this;
		var myOptionGv = {
			toolbarId: addDiv + "_toolbar",
			viewerId:  addDiv + "_newview",
			ibuttonId: addDiv + "_buttons",
			btnSpaceId: addDiv + "_bs",
			commonData: this.dataForPartner, 
			chrBoxCol: this.option.chrBoxCol,
			onTrackAction: this.option.onTrackAction, 
			trackBtnHideFlg: this.gvVector.gv.option.trackBtnHideFlg,
			
			uriDirFlg: this.option.uriDirFlg,
			initShow: this.option.gvInitShow,
			bgVlineFlg: gv.option.bgVlineFlg,
			scaleSizingFlg: false,
			showPanelFlg: true,
			autoSizingFlg: true,
			//defaultMode: "info",
			defaultMode: "nav",
			itemSwitchFlg: this.option.gvItemSwitchFlg,
			defBtnHideFlg: true,
			//showChromFlg: false,
			showChromFlg: true,
			showScaleFlg: true,
			showPositionFlg: true,
			chromSizingFlg: false,
			dblclickSizingFlg: false,
			locationBarFlg: false, 
			moveCallback: function(pos, mvFlg) {
				if(oalign !== undefined && mvFlg) {
					oalign.setPos2(pos);
					m.gvc.paint();
				}
			}
		};
		
		var urlSetCmp = this.urlSetCmp;
		
		var gv = new GenomeViewer(this.width, 50, this.chrData2, "", divId, 
			this.viewerPartsData, {}, myOptionGv);
		
		this.gv = gv;
		
		var oalign = new WgComparaAlignF(
			this.comparaName, this.dispComparaName, this.callingData, 
			this.gv, urlSetCmp, divId, addDiv, {linkto: this.option.linkto}
		);
		var gvc = new GenomeViewer(this.width, 50, this.chrData1, "", divId, 
			[[oalign, true]], urlSet, myOption);
		oalign.setCallingObject(gvc);
		this.gvc = gvc;
	}
	
	if(this.gvc !== undefined) {
		var showStart = start + (end - start + 1) / 3;
		var showEnd = end - (end - start + 1) / 3;
		this.gvc.setGenomePosition(chr, showStart, showEnd, strand);
	}
	
	var status = [];
	return status;
};
WgComparaF.prototype.setInitFlg = function(flag) {
	this.initFlg = flag;
};
WgComparaF.prototype.setHeight = function(width, chr, start, end) {
};
//ポップアップ用データを返す
WgComparaF.prototype.getPopupData = function() {
	return;
};
//自分のID
WgComparaF.prototype.getName = function() {
	return this.name;
};
WgComparaF.prototype.getItemDispName = function() {
	var dispName = (this.dispName)? this.dispName: this.name;
	return dispName;
};
WgComparaF.prototype.getButtonInfo = function() {
	var buttonColor = (this.option.buttonColor === undefined)? 
		{"color": ["eeeeee", "ffcccc"], "onOff": this.option.buttonOnOffFlg}: 
		{"color": this.option.buttonColor, "onOff": this.option.buttonOnOffFlg};
	
	return buttonColor;
};


var WgComparaAlignF = function(name, dispName, callingData, gv, urlSet, divId, addDiv, option) {
	this.ojson = [];
	this.baseHeight = 30;
	this.height = this.baseHeight;
	//アラインメントの表示の高さ
	this.alnHeight = 50;
	this.option = (option === undefined)? {}: option;
	this.option.baseShowFlg = (this.option.baseShowFlg === undefined)? 
		true: this.option.baseShowFlg;
	
	this.dispName = dispName;
	this.name = name;
	this.cmpDt;
	this.gv = gv;
	//呼び出したObject（強制再描写用）
	this.callingObj;
	
	//bigBedオブジェクトの初期化
	this.bb = new BigbedData(urlSet.bigBed, {localFlg: this.option.localFlg});
	//染色体情報
	this.chrData1 = urlSet.chrData1;
	this.chrData2 = urlSet.chrData2;
	this.wg1 = new WgenomeData(urlSet.sequenceFile1);
	this.wg2 = new WgenomeData(urlSet.sequenceFile2);
	
	//相手側の表示対象の位置情報
	this.alnTarget = [];
	//下側の位置を強制移動表示する場合true
	this.forcePos2 = {};
	
	//配列の読み込み状況
	//this.sp1LoadSeqBin = {};
	this.sp2LoadSeqBin = {};
	this.sp2Seq = {};
	
	//前後余分に取るベース数
	//this.extraSpace = 1000;
	
	//表示モード
	this.showMode = "default";
	//this.showMode = "oneline";
	
	//アラインメントのflipをするか
	this.flipFlg = false;
	
	//popup用アクション
	var m = this;
	this.menuPopAction = function() {
		$("input[name='show_mode']").change(function() {
			m.showMode = $("input[name='show_mode']:checked").val();
			$("div" + divId + " #right_pop").css("visibility", "hidden");
			m.callingObj.paint();
		});
		$("input[name='flip_aln']").change(function() {
			m.flipFlg = !m.flipFlg;
			$("div" + divId + " #right_pop").css("visibility", "hidden");
			m.callingObj.paint();
		});
		$("div" + divId + " a.cmpaln").click(function() {
			$("div" + divId + " #" + addDiv + "_compara").remove();
			$("div" + divId + " #" + addDiv + "_newview").remove();
			if($("div" + divId + " #" + addDiv + "_bs")[0]) {
				$("div" + divId + " #" + addDiv + "_bs").html("");
			}
			
			var targetI;
			var targetName = callingData[2].getName();
			for(var i = 0; i < callingData[0].length; i ++) {
				var targetObj = callingData[0][i];
				var partsId = targetObj.getName();
				if(partsId == targetName) {
					targetI = i;
					break;
				}
			}
			if(targetI !== undefined) {
				callingData[0].splice(targetI, 1);
				var buttonInfo = m.getButtonInfo();
				var col = buttonInfo.color[0];
				$("div" + divId + " #" + callingData[1] + 
					" #" + targetName).css("background-color", "#" + col);
				//$("div" + divId + " #" + callingData[1] + " #" + targetName).attr('disabled', false);
				//comparative 描写の初期化Flagをセット
				callingData[2].setInitFlg(true);
			}
			
			if(m.option.pushDelete) {
				m.option.pushDelete();
			}
			
			$("div" + divId + " #right_pop").css("visibility", "hidden");
			
			return false;
		});
	};
	
	this.chrBar = 10;
	this.height = 20;
	this.y;
};
WgComparaAlignF.prototype = new WgRoot();
WgComparaAlignF.prototype.paint = function(y, width, chr, start, end, strand) {
	//描写状況:存在しないデータのbin情報を入れる
	var status = [];
	
	var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
	if(pow < 0) pow = 0;
	var reg = Math.pow(10, pow) * POW_REG;
	
	var dist = end - start + 1;
	
	var binStart = Math.floor((start - 1) / reg);
	var binEnd = Math.floor((end - 1) / reg);
	for(var i = binStart; i <= binEnd; i ++) {
		if(this.ojson[pow] && this.ojson[pow][chr + "|" + i] && this.ojson[pow][chr + "|" + i][this.name]) {
			//必要なデータはWgComparaAlignF.prototype.setHeightでセットされます
		} else {
			if(i >= 0) status.push(i);
			this.paintLoading(y, width, start, end, strand, i);
		}
	}
	
	var chr2step = {};
	var maxStep = 0;
	var corChrom, corStart, corEnd, orient, corStrand;
	var minPStart1, maxPEnd1, minPStart2, maxPEnd2;
	
	if(this.cmpDt[0] !== undefined && this.cmpDt[0] == "err") {
		var y1 = y;
		var y2 = y1 + this.height - 1;
		this.imgObj.fillStyle = "#DDDDDD";
		this.imgObj.fillRect(0, y1, width, y2 - y1 + 1);
		var errStr = this.cmpDt[1];
		this.imgObj.font = "10px 'Helvetica'";
		var strWidth = this.imgObj.measureText(errStr).width;
		this.imgObj.fillStyle = "#888888";
		var y3 = (y1 + y2) / 2;
		var x3 = (width - strWidth) / 2;
		this.imgObj.fillText(errStr, x3, y3);
		return status;
	}
	
	var vReg;
	var inFlg = false;
	for(var j = 0; j < this.cmpDt.length; j ++) {
		var reg1 = this.cmpDt[j]["region1"];
		var start1 = parseInt(reg1[1]);
		var end1 = parseInt(reg1[2]);
		var reg2 = this.cmpDt[j]["region2"];
		var chromId2 = reg2[0];
		if(chr2step[chromId2] === undefined) {
			chr2step[chromId2] = maxStep;
			maxStep ++;
		}
		var step = (this.showMode == "oneline")? 0: chr2step[chromId2];
		//var step = j;
		if(start1 <= end && start <= end1) {
			var y1 = y + this.chrBar * step;
			var y2 = y1 + this.chrBar - 1;
			var x1 = (start1 - start) * (width - 1) / (end - start + 1);
			var x2 = (end1 - start + 1) * (width - 1) / (end - start + 1);
			if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
			
			if(x1 < 0) x1 = 0;
			if(x2 > width - 1) x2 = width - 1;
			this.imgObj.fillStyle = "#0000FF";
			this.imgObj.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
		}
		
		if(j == 0) {
			//一番ホモロジーの強い相手
			vReg = [j, reg1, reg2];
		}
		if(
			this.alnTarget !== undefined && 
			this.alnTarget[0] == reg2[0] && 
			this.alnTarget[1] <= reg2[2] && 
			this.alnTarget[2] >= reg2[1]
		) {
			//inFlgは含まれる位置に小さい近くの領域がある場合それが必ず選ばれてしまう不具合を回避するため
			//ただし小さい領域が選べない（表示もされない）不具合は残る(hg38:chr5:115,168,367-115,179,351:human vs mouse)
			if(j == 0) inFlg = true;
			if(!inFlg) vReg = [j, reg1, reg2];
		}
	}
	
	if(vReg !== undefined) {
		var start1 = parseInt(vReg[1][1]);
		var end1 = parseInt(vReg[1][2]);
		var step = (this.showMode == "oneline")? 0: chr2step[vReg[2][0]];
		if(start1 <= end && start <= end1) {
			var y1 = y + this.chrBar * step;
			var y2 = y1 + this.chrBar - 1;
			var x1 = (start1 - start) * (width - 1) / (end - start + 1);
			var x2 = (end1 - start + 1) * (width - 1) / (end - start + 1);
			if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
			
			if(x1 < 0) x1 = 0;
			if(x2 > width - 1) x2 = width - 1;
			this.imgObj.fillStyle = "#FF8888";
			this.imgObj.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
		}
		orient = vReg[2][3];
		
		var mid1 = (start + end) / 2;
		var nearestDist;
		var mid2;
		var parts = this.cmpDt[vReg[0]]["parts"];
		for(var k = 0; k < parts.length; k ++) {
			var pStart1 = parts[k][0];
			var pEnd1 = parts[k][1];
			var pStart2 = parts[k][2];
			var pEnd2 = parts[k][3];
			var pMid1 = (pStart1 + pEnd1) / 2;
			var pDist = Math.abs(mid1 - pMid1);
			if(pStart1 <= mid1 && mid1 <= pEnd1) {
				nearestDist = 0;
				mid2 = (orient)? pStart2 + mid1 - pStart1: 
					pEnd2 - (mid1 - pStart1);
				
			} else if(nearestDist === undefined || nearestDist > pDist) {
				nearestDist = pDist;
				mid2 = (pStart2 + pEnd2) / 2;
			}
			
			if(minPStart1 === undefined) {
				minPStart1 = pStart1;
				maxPEnd1 = pEnd1;
				minPStart2 = pStart2;
				maxPEnd2 = pEnd2;
			} else {
				if(minPStart1 > pStart1) minPStart1 = pStart1;
				if(maxPEnd1 < pEnd1) maxPEnd1 = pEnd1;
				if(minPStart2 > pStart2) minPStart2 = pStart2;
				if(maxPEnd2 < pEnd2) maxPEnd2 = pEnd2;
			}
		}
		corChrom = vReg[2][4];
		if(this.forcePos2.start !== undefined) {
			var allLng = (this.forcePos2.end - this.forcePos2.start + 1) * 3;
			var midPos = (this.forcePos2.start + this.forcePos2.end) / 2;
			corStart = midPos - allLng / 2 + 0.5;
			this.forcePos2 = {};
		} else {
			corStart = mid2 - dist / 2 + 0.5;
		}
		corEnd = corStart + dist - 1;
		
		corStrand = (((strand == "+" || strand === undefined) && orient) || 
			(strand == "-" && !orient))? "+": "-";
		
		if(pow == 0) this.accSp2Seq(corChrom, minPStart2, maxPEnd2, corStrand);
		//comparaのsetGenomePositionを行う
		var showStart = corStart + (corEnd - corStart + 1) / 3;
		var showEnd = corEnd - (corEnd - corStart + 1) / 3;
		this.gv.setGenomePosition(corChrom, showStart, showEnd, corStrand);
	}
	
	if(vReg !== undefined && this.cmpDt[vReg[0]] !== undefined) {
		var y3 = y + this.chrBar;
		if(this.showMode != "oneline") y3 += this.chrBar * (maxStep - 1);
		var baseSpaceFlg = ((width - 1) / (end - start + 1) > 10)? true: false;
		if(this.option.baseShowFlg && baseSpaceFlg) {
			y3 += 10;
		}
		var y4 = y3 + this.alnHeight;
		
		this.imgObj.fillStyle = "#000000";
		this.imgObj.fillRect(0, y3, width, 1);
		this.imgObj.fillRect(0, y4, width, 1);
		
		var parts = this.cmpDt[vReg[0]]["parts"];
		for(var i = 0; i < parts.length; i ++) {
			var pStart1 = parts[i][0];
			var pEnd1 = parts[i][1];
			var pStart2 = parts[i][2];
			var pEnd2 = parts[i][3];
			//partsの方向性(orientは表示全体の方向性)
			var pOrient = parts[i][4];

			var alnShowFlg = false;
			if(pow == 0) {
				var seqPair = this.getSeqPair(
					chr, minPStart1, pEnd1, corChrom, minPStart2, pEnd2
				);
				var seq1 = seqPair[0].toUpperCase();
				var seq2 = seqPair[1].toUpperCase();
				
				alnShowFlg = true;
				var s1 = seq1.substr(pStart1 - minPStart1, pEnd1 - pStart1 + 1);
				var s2 = seq2.substr(pStart2 - minPStart2, pEnd2 - pStart2 + 1);
				//console.log("seq1:" + seq1);
				//console.log(pStart1 +  "-" + start + ", " + pEnd1 + "-" + pStart1);
				if(!orient) s2 = this.revComp(s2);
				
				for(var j = 0; j < s1.length; j ++) {
					var base1 = s1.charAt(j);
					var base2 = (orient == pOrient)? s2.charAt(j): s2.charAt(s1.length - j - 1);
					
					var x5 = ((pStart1 + j) - start + 0.5) * (width - 1) / (end - start + 1);
					if(strand == "-") {x5 = width - 1 - x5;}
					var basePos = (pOrient)? pStart2 + j: pEnd2 - j;
					var x7 = (basePos - corStart + 0.5) * (width - 1) / (corEnd - corStart + 1);
					if(!orient) {x7 = width - 1 - x7;}
					if(strand == "-") {x7 = width - 1 - x7;}
					
					var aln_base2 = (orient == pOrient)? base2: this.revComp(base2);
					if(
						(base1 == "A" || base1 == "C" || base1 =="G" || base1 == "T") &&
						base1 == aln_base2
					) {
						this.imgObj.strokeStyle = (orient == pOrient)? "#000000": "#FF0000";
						this.imgObj.beginPath();
						this.imgObj.moveTo(x5, y3);
						this.imgObj.lineTo(x7, y4);
						this.imgObj.stroke();
					} else if(base1 == "." || base2 == "." || base2 == "") {
//console.log("data:" + base1 + ", " + base2);
						this.imgObj.strokeStyle = (orient == pOrient)? "#AAAAAA": "#FFAAAA";
						this.imgObj.beginPath();
						this.imgObj.moveTo(x5, y3);
						this.imgObj.lineTo(x7, y4);
						this.imgObj.stroke();
					}
					if(this.option.baseShowFlg && baseSpaceFlg) {
						if(strand == "-") {
							var tmp = base1;
							if(base1 == "A") tmp = "T"; if(base1 == "a") tmp = "t";
							if(base1 == "C") tmp = "G"; if(base1 == "c") tmp = "g";
							if(base1 == "G") tmp = "C"; if(base1 == "g") tmp = "c";
							if(base1 == "T") tmp = "A"; if(base1 == "t") tmp = "a";
							base1 = tmp;
							tmp = base2;
							if(base2 == "A") tmp = "T"; if(base2 == "a") tmp = "t";
							if(base2 == "C") tmp = "G"; if(base2 == "c") tmp = "g";
							if(base2 == "G") tmp = "C"; if(base2 == "g") tmp = "c";
							if(base2 == "T") tmp = "A"; if(base2 == "t") tmp = "a";
							base2 = tmp;
						}

						this.imgObj.font = "10px 'Helvetica'";
						this.imgObj.fillText(base1, x5 - 4, y3 - 2);
						this.imgObj.fillText(base2, x7 - 4, y4 + 10);
					}
				}
				//console.log(chr + ":" + pStart1 + "-" + pEnd1);
				//console.log(corChrom + ":" + pStart2 + "-" + pEnd2);
				//console.log(s1 + ", " + s2);
			}


			if(!alnShowFlg) {
				var x5 = (pStart1 - start) * (width - 1) / (end - start + 1);
				var x6 = (pEnd1 - start + 1) * (width - 1) / (end - start + 1);
				var x7 = (pStart2 - corStart) * (width - 1) / (corEnd - corStart + 1);
				var x8 = (pEnd2 - corStart + 1) * (width - 1) / (corEnd - corStart + 1);
				if(!orient) {var tmp = width - 1 - x7; x7 = width - 1 - x8; x8 = tmp;}
				if(strand == "-") {var tmp = width - 1 - x7; x7 = width - 1 - x8; x8 = tmp;}
				if(strand == "-") {var tmp = width - 1 - x5; x5 = width - 1 - x6; x6 = tmp;}
				this.imgObj.beginPath();
				this.imgObj.moveTo(x5, y3);
				this.imgObj.lineTo(x7, y4);
				if(x8 - x7 > 1) {
					this.imgObj.lineTo(x8, y4);
					this.imgObj.lineTo(x6, y3);
					this.imgObj.closePath();
					this.imgObj.fillStyle = (orient == pOrient)? "#000033": "#FF0033";
					this.imgObj.fill();
				} else {
					this.imgObj.strokeStyle = (orient == pOrient)? "#000033": "#FF0033";
					this.imgObj.stroke();
				}
			}
		}
	}
	
	return status;
};
WgComparaAlignF.prototype.revComp = function(seq) {
	var newSeq = "";
	for(var i = seq.length - 1; i >= 0; i --) {
		var char = seq.charAt(i);
		var tmp = char;
		if(char == "A") tmp = "T"; if(char == "a") tmp = "t"; 
		if(char == "C") tmp = "G"; if(char == "c") tmp = "g"; 
		if(char == "G") tmp = "C"; if(char == "g") tmp = "c"; 
		if(char == "T") tmp = "A"; if(char == "t") tmp = "a"; 
		newSeq += tmp;
	}
	return newSeq;
};
WgComparaAlignF.prototype.setCallingObject = function(callingObj) {
	this.callingObj = callingObj;
};
WgComparaAlignF.prototype.accSp2Seq = function(chr, start, end, strand) {
	var reg = POW_REG;
	
	var binStart = Math.floor((start - 1) / reg);
	var binEnd = Math.floor((end - 1) / reg);
	
	var loadBinStart, loadBinEnd;
	for(var bin = binStart; bin <= binEnd; bin ++) {
		if(this.sp2Seq[chr + "|" + bin] === undefined && !this.sp2LoadSeqBin[chr + "|" + bin]) {
			this.sp2LoadSeqBin[chr + "|" + bin] = true;
			if(loadBinStart === undefined) loadBinStart = bin;
			loadBinEnd = bin;
		}
	}
	
	if(loadBinStart !== undefined) {
		var m = this;


		var bpStart = binStart * reg + 1;
		var bpEnd = (binEnd + 1) * reg;
		
		m.wg2.readWaitReader(chr, bpStart, bpEnd, function(fetcher) {
			var seq = "";
			for(var seqEach of fetcher()) {
				seq += seqEach;
			}
			
			for(var bin = binStart; bin <= binEnd; bin ++) {
				m.sp2Seq[chr + "|" + bin] = seq.substr((bin - binStart) * POW_REG, POW_REG);
			}
			
			
			//強制再描画
			if(m.callingObj !== undefined) {
				//console.log("repaint");
				m.callingObj.paint();
			}
		}, function(err) {
			alert("Error! " + this.url + "," + err);
		});
	}
};
WgComparaAlignF.prototype.getSeqPair = function(
	chr1, start1, end1, chr2, start2, end2
) {
	var reg = POW_REG;
	var binStart, binEnd;
	
	var seq1 = "";
	binStart = Math.floor((start1 - 1) / reg);
	binEnd = Math.floor((end1 - 1) / reg);
	for(var bin = binStart; bin <= binEnd; bin ++) {
		
		var nowSeq1;
		if(this.ojson[0] && this.ojson[0][chr1 + "|" + bin] && this.ojson[0][chr1 + "|" + bin][this.name]) {
			nowSeq1 = this.ojson[0][chr1 + "|" + bin][this.name][1];
		}
		if(nowSeq1 === undefined) {
			nowSeq1 = "";
			for(var j = 1; j <= reg; j ++) {
				nowSeq1 += ".";
			}
		}
		
		var nowBinStart = bin * reg + 1;
		var nowBinEnd = (bin + 1) * reg;
		if(end1 < nowBinEnd) {
			if(nowBinStart <= end1) nowSeq1 = nowSeq1.substr(0, reg - (nowBinEnd - end1));
			else nowSeq1 = "";
		}
		if(nowBinStart < start1) {
			if(start1 <= nowBinEnd) nowSeq1 = nowSeq1.substr(start1 - nowBinStart);
			else nowSeq1 = "";
		}
		seq1 += nowSeq1;
	}
	//console.log(chr1 + ":" + start1 + "-" + end1);
	//console.log("seq1: " + seq1);
	
	var seq2 = "";
	binStart = Math.floor((start2 - 1) / reg);
	binEnd = Math.floor((end2 - 1) / reg);
	for(var bin = binStart; bin <= binEnd; bin ++) {
		var nowSeq2;
		if(this.sp2Seq[chr2 + "|" + bin]) {
			nowSeq2 = this.sp2Seq[chr2 + "|" + bin];
		}
		if(nowSeq2 === undefined) {
			nowSeq2 = "";
			for(var j = 1; j <= reg; j ++) {
				nowSeq2 += ".";
			}
		}
		
		var nowBinStart = bin * reg + 1;
		var nowBinEnd = (bin + 1) * reg;
		if(end2 < nowBinEnd) {
			nowSeq2 = nowSeq2.substr(0, reg - (nowBinEnd - end2));
		}
		if(nowBinStart < start2) {
			nowSeq2 = nowSeq2.substr(start2 - nowBinStart);
		}
		seq2 += nowSeq2;
	}
	//console.log(chr2 + ":" + start2 + "-" + end2);
	//console.log("seq2: " + seq2);
	
	return [seq1, seq2];
};
WgComparaAlignF.prototype.setCmpDt = function(temp, orienter) {
	var sorter = {};
	var sorterArr = [];
	
	for(var key in temp) {
		var lng = temp[key]["region1"][5];
		if(sorter[lng] === undefined) {
			sorterArr.push(lng);
			//alert("lng" + lng);
			sorter[lng] = [];
		}
		sorter[lng].push(key);
	}
	
	sorterArr.sort(function(a, b){if(a > b) return -1; if(a < b) return 1; return 0;});
	
	var result = [];
	for (var i = 0; i < sorterArr.length; i ++) {
		var lng = sorterArr[i];
		var keyList = sorter[lng];
		for(var j = 0; j < keyList.length; j ++) {
			var key = keyList[j];
			var rs = temp[key];
			
			var chromId2 = rs["region2"][0];
			var orient2 = (orienter[chromId2][0] > orienter[chromId2][1])? 0: 1;
			rs["region2"][3] = (this.flipFlg)? 1 - orient2: orient2;
			result.push(rs);
		}
	}
	
	this.cmpDt = result;
};
WgComparaAlignF.prototype.paintVScale = function(img, width) {
	var chr2step = {};
	var maxStep = 0;
	
	if(this.cmpDt[0] !== undefined && this.cmpDt[0] == "err") {
	} else if(this.showMode == "oneline") {
		var str = "switch alignment";
		var y1 = this.y + 9;
		img.font = "10px 'Helvetica'";
		var strWidth = img.measureText(str).width;
		var x1 = width - strWidth - 8;
		img.fillText(str, x1, y1);
	} else {
		for(var j = 0; j < this.cmpDt.length; j ++) {
			var reg1 = this.cmpDt[j]["region1"];
			var reg2 = this.cmpDt[j]["region2"];
			var start1 = parseInt(reg1[1]);
			var end1 = parseInt(reg1[2]);
			var chromId2 = reg2[0];
			if(chr2step[chromId2] === undefined) {
				chr2step[chromId2] = maxStep;
				var chr = reg2[4];
				var y1 = this.y + this.chrBar * maxStep + 9;
				img.font = "10px 'Helvetica'";
				var strWidth = img.measureText(chr).width;
				var x1 = width - strWidth - 8;
				img.fillText(chr, x1, y1);
				maxStep ++;
			}
		}
	}
};
WgComparaAlignF.prototype.setHeight = function(width, chr, start, end) {
	var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
	if(pow < 0) pow = 0;
	var reg = Math.pow(10, pow) * POW_REG;
	
	var temp = {};
	var dist = end - start + 1;
	var checker = {};
	var orienter = {};
	
	var binStart = Math.floor((start - 1) / reg);
	var binEnd = Math.floor((end - 1) / reg);
	for(var i = binStart; i <= binEnd; i ++) {
		if(this.ojson[pow] && this.ojson[pow][chr + "|" + i] && this.ojson[pow][chr + "|" + i][this.name]) {
			var cmp = this.ojson[pow][chr + "|" + i][this.name];
			
			if(cmp[0] == "err") {
				this.height = this.baseHeight;
				this.cmpDt = cmp;
				return ;
			}
	
			var chromId1 = this.chrData1[chr][0];
			var chrom1 = chr;
			var lng1 = this.chrData1[chr][1];
			
			for(var j = 0; j < cmp[0].length; j ++) {
				var chrom2 = cmp[0][j][2];
				var chromId2 = this.chrData2[chrom2][0];
				var lng2 = this.chrData2[chrom2][1];
				var start2 = cmp[0][j][3];
				var end2 = cmp[0][j][4];
				var orient = cmp[0][j][1];
				var start1 = cmp[0][j][5];
				var end1 = cmp[0][j][6];
				
				if(end1 < start || end < start1) continue;
				
				//二度入れ防止
				if(checker[start1]) continue;
				checker[start1] = true;
				
				var no = 1;
				var findFlg = false;
				while(temp[chromId2 + "|" + no] !== undefined) {
					var rtmp = temp[chromId2 + "|" + no];
					
					var startReg2 = rtmp["region2"][1];
					var endReg2   = rtmp["region2"][2];
					if(
						(endReg2 < start2 && start2 - endReg2 + 1 > dist / 5) ||
						(end2 < startReg2 && startReg2 - end2 + 1 > dist / 5)
					) {
						no ++;
					} else {
						findFlg = true;
						if(rtmp["region1"][1] > start1) rtmp["region1"][1] = start1;
						if(rtmp["region1"][2] < end1)   rtmp["region1"][2] = end1;
						if(rtmp["region2"][1] > start2) rtmp["region2"][1] = start2;
						if(rtmp["region2"][2] < end2)   rtmp["region2"][2] = end2;
						rtmp["region1"][5] += end1 - start1 + 1;
						rtmp["region2"][5] += end2 - start2 + 1;
						rtmp["parts"].push([start1, end1, start2, end2, orient]);
						break;
					}
				}
				if(!findFlg) {
					temp[chromId2 + "|" + no] = {
						"region1": [chromId1, start1, end1, 1,  chrom1, end1 - start1 + 1, lng1],
						"region2": [chromId2, start2, end2, "", chrom2, end2 - start2 + 1, lng2],
						"parts":   [[start1, end1, start2, end2, orient]],
					}
				}
				if(orienter[chromId2] === undefined) orienter[chromId2] = [0, 0];
				orienter[chromId2][orient] += end1 - start1 + 1;
			}
		}
	}
	
	this.setCmpDt(temp, orienter);
	
	var chr2step = {};
	var maxStep = 0;

	for(var j = 0; j < this.cmpDt.length; j ++) {
		var reg2 = this.cmpDt[j]["region2"];
		var chromId2 = reg2[0];
		if(chr2step[chromId2] === undefined) {
			chr2step[chromId2] = maxStep;
			maxStep ++;
		}
	}
	
	var baseSpace = (this.option.baseShowFlg && (width - 1) / (end - start + 1) > 10)? 20: 0;
	
	this.height = this.alnHeight + baseSpace + this.chrBar;
	if(this.showMode != "oneline") this.height += this.chrBar * (maxStep - 1);
};
WgComparaAlignF.prototype.getMenuPopup = function() {
	var htmlStr = "";

	var checked = [];
	if(this.showMode == "default") checked[0] = "checked=\"checked\"";
	if(this.showMode == "oneline") checked[1] = "checked=\"checked\"";
	if(this.flipFlg) checked[2] = "checked=\"checked\"";
	var htmlStr = "";
	htmlStr += "<div style=\"border:1px solid\"><table border=\"0\" width=\"100%\"><tr><th align=\"left\" bgcolor=\"#aaaaaa\" colspan=\"2\">Setting:</th></tr><tr>";
	htmlStr += "<td bgcolor=\"#aaaaaa\">&nbsp;</td><td><form>";
	htmlStr += "<div><input type=\"radio\" name=\"show_mode\" value=\"default\" id=\"default\" ";
	htmlStr += checked[0] + " /><label for=\"default\">All chromosome</label></div>";
	htmlStr += "<div><input type=\"radio\" name=\"show_mode\" value=\"oneline\" id=\"oneline\" ";
	htmlStr += checked[1] + " /><label for=\"oneline\">One line</label></div>";
	htmlStr += "<hr />";
	htmlStr += "<div><input type=\"checkbox\" name=\"flip_aln\" value=\"flip_aln\" id=\"flip_aln\" ";
	htmlStr += checked[2] + " /><label for=\"flip_aln\">Flip alignment</label></div>";
	htmlStr += "</form>";
	htmlStr += "<hr /><a href=\"#\" class=\"det\">Detail...</a>";
	htmlStr += "</td></tr></table></div>";
	htmlStr += "<hr /><a href=\"#\" class=\"cmpaln\">Delete comparative view</a>";
	
	return htmlStr;
};
WgComparaAlignF.prototype.getMenuDetail = function() {
	var htmlStr = "";
	htmlStr += "<form><div><strong>Detailed settings</strong></div>";
	htmlStr += "<div class=\"modal_inbox\">";
	htmlStr += "<table border=\"0\" width=\"100%\" ><tr><td align=\"center\" height=\"30\">";
	htmlStr += "<div>Alignment height: <input type=\"text\" id=\"aln_height\" size=\"3\" maxlength=\"3\" value=\"" + this.alnHeight + "\" />px</div>";
	htmlStr += "</td></tr></table>";
	htmlStr += "</div>";
	htmlStr += "<div class=\"modal_btn\"><input type=\"button\" id=\"apply_button\" value=\"Apply\" /><input type=\"button\" id=\"cancel_button\" value=\"Cancel\" /></div>";
	htmlStr += "</form>";
	
	return [htmlStr, [200, 100]];
};
WgComparaAlignF.prototype.setViewDetail = function(divId) {
	var aln_height = parseInt($("div" + divId + " div#modal div.container #aln_height").val());
	if(aln_height < 5) aln_height = 5;
	if(aln_height > 500) aln_height = 500;
	if(isNaN(aln_height)) aln_height = 50;
	this.alnHeight = aln_height;
	
	return true;
};
//ポップアップ用データを返す
WgComparaAlignF.prototype.getPopupData = function(y, width, chr, start, end, strand) {
	var popup = {};
	
	var chr2step = {};
	var maxStep = 0;
	
	if(this.cmpDt !== undefined) {
		for(var j = 0; j < this.cmpDt.length; j ++) {
			var reg1 = this.cmpDt[j]["region1"];
			
			//continue when region too large
			if(reg1 === undefined) continue;
			
			var start1 = parseInt(reg1[1]);
			var end1 = parseInt(reg1[2]);
			var reg2 = this.cmpDt[j]["region2"];
			var chromId2 = reg2[0];
			if(chr2step[chromId2] === undefined) {
				chr2step[chromId2] = maxStep;
				maxStep ++;
			}
			var step = (this.showMode == "oneline")? 0: chr2step[chromId2];
			if(start1 <= end && start <= end1) {
				var y1 = y + this.chrBar * step;
				var y2 = y1 + this.chrBar - 1;
				var x1 = (start1 - start) * (width - 1) / (end - start + 1);
				var x2 = (end1 - start + 1) * (width - 1) / (end - start + 1);
				if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
				
				if(x1 < 0) x1 = 0;
				if(x2 > width - 1) x2 = width - 1;
				//this.imgObj.fillStyle = (j == 0)? "#FF8888": "#0000FF";
				//this.imgObj.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
				var yStr = y1 + ", " + y2;
				var xStr = x1 + ", " + x2;
				if(popup[yStr] === undefined) popup[yStr] = {};
				popup[yStr][xStr] = {
					"actionParam": [this, reg2], 
					"action": function(d, p) {
						var m = p[0];
						if(m.callingObj !== undefined) {
							//console.log("repaint");
							m.alnTarget = p[1];
							m.callingObj.paint();
						}
					}
				}
			}
		}
	}
	
	if(this.option.linkto !== undefined) {
		
		var xStr = "0, " + (width - 1);
		var y1 = (y + this.chrBar * maxStep);
		var yStr = y1 + ", " + (y + this.height - 1);
		//var m = this;
		var location = chr + ":" + start + "-" + end;
		
		htmlStr = "<a href=\"" + this.option.linkto.urlParam + location + "\" target=\"_blank\">" + this.option.linkto.term + "</a>";
		
		popup[yStr] = {};
		popup[yStr][xStr] = {
			"html": htmlStr
		};
	}
	
	return popup;
};
//自分のID
WgComparaAlignF.prototype.getName = function() {
	return this.name;
};
WgComparaAlignF.prototype.getItemDispName = function() {
	var dispName = (this.dispName)? this.dispName: this.name;
	return dispName;
};
WgComparaAlignF.prototype.setPos2 = function(pos) {
	this.forcePos2 = pos;
};
WgComparaAlignF.prototype.accessObj = function(chr, binStart, binEnd, powP, accDefault) {
	var m = this;
	var bpPerPixel = Math.pow(10, powP);
	
	var bpStart = binStart * bpPerPixel * POW_REG + 1;
	var bpEnd = (parseInt(binStart) + 1) * bpPerPixel * POW_REG;
	
	var data = {};
	if(bpEnd - bpStart + 1 > 10000000) {
		data[m.name] = ["err", "Region is too large"];
		accDefault.success(data);
		accDefault.complete();
	} else {
		this.bb.readWaitReader(chr, bpStart, bpEnd, 1, function(reductionLevel, fetcher) {
			var tmp = [];
			for(var alnEach of fetcher()) {
				var bedClm = alnEach.otherClm.split(/\t/);
				var dt = bedClm[0].split("|");
				dt.push(parseInt(alnEach.chromStart));
				dt.push(parseInt(alnEach.chromEnd));
				dt[1] = parseInt(dt[1]);
				dt[3] = parseInt(dt[3]) + 1;
				dt[4] = parseInt(dt[4]);
				tmp.push(dt);
			}
			data[m.name] = [tmp];
			if(powP == 0) {
				m.wg1.readWaitReader(chr, bpStart, bpEnd, function(fetcher) {
					var seq = "";
					for(var seqEach of fetcher()) {
						seq += seqEach;
					}
					data[m.name][1] = seq;
					accDefault.success(data);
					accDefault.complete();
				}, function(err) {
					accDefault.error(err, err, err);
					accDefault.complete();
				});
			} else {
				accDefault.success(data);
				accDefault.complete();
			}
		}, function(err) {
			accDefault.error(err, err, err);
			accDefault.complete();
		});
	}
};


////////////////////////////////////////////////////////////////////////////////////////////////////
var WgSeparator = function(height, bgcolor) {
	this.imgObj, this.ojson;
	
	if(!bgcolor) {
		bgcolor = this.getRndColor();
	}
	this.bgcolor = bgcolor;
	
	this.height = height;
	this.y;
};
WgSeparator.prototype = new WgRoot();
WgSeparator.prototype.paint = function(y, width, chr, start, end) {
	
	this.imgObj.fillStyle = this.bgcolor;
	this.imgObj.fillRect(0, y, width, this.height);
	
	return [];
};
WgSeparator.prototype.getName = function() {
	return "separator";
};
WgSeparator.prototype.getRndColor = function() {
	var c1 = this.cov16(Math.random() * 200);
	var c2 = this.cov16(Math.random() * 200);
	var c3 = this.cov16(Math.random() * 200);
	return "#" + c1 + c2 + c3;
};
WgSeparator.prototype.getPannelBgcolor = function() {
	return "#CCCCCC";
};


var WgScale = function(height, genome) {
	this.imgObj, this.ojson;
	
	this.height = height;
	this.genome = genome;
	this.y;
};
WgScale.prototype = new WgRoot();
WgScale.prototype.paint = function(y, width, chr, start, end, strand) {
	
	this.imgObj.fillStyle = "#000000";
	var y1 = y + 0;
	var y3 = y + this.height - 1;
	//var flog = Math.floor(2 * 10 * (end - start + 1) / width);
	var flog = Math.floor(10 * 10 * (end - start + 1) / width);
	if(flog <= 0) flog = 1;
	var pow = Math.pow(10, Math.floor(Math.LOG10E * Math.log(flog)));
	var pos = Math.floor(start / pow) * pow;
	var xc;
	var x2_edge;
	var mvX = pow * (width - 1) / (end - start + 1);
	var hfMvX = 1 + 0.5 * (width - 1) / (end - start + 1);
	var maxPos = this.genome[chr][1];
	
	while((xc = (pos - start + 0.5) * (width - 1) / (end - start + 1)) < width) {
		var x1 = (strand == "-")? width - 1 - xc: xc;
		
		var y2 = y1 + 5;
		var checkPos = Math.floor(pos / pow);
		if(checkPos % 10 == 5) y2 += 5;
		if(checkPos % 10 == 0) {
			this.imgObj.font = "10px 'Helvetica'";
			var posStr = Number(pos).toLocaleString();
			var strWidth = this.imgObj.measureText(posStr).width;
			var x2 = x1 - strWidth / 2;
			if(x2 > 0 && x2 + strWidth < width) {
				if(x2_edge === undefined || (strand != "-" && x2_edge + 20 < x2) || 
					(strand == "-" && x2 + strWidth + 20 < x2_edge)) {
					
					this.imgObj.fillText(posStr, x2, y2 + 18);
					x2_edge = (strand == "-")? x2: x2 + strWidth;
				}
			}
			y2 += 8;
		}
		if(pos <= 1 || pos >= maxPos) {
			this.imgObj.strokeStyle = "#ff0000";
			this.imgObj.beginPath();
			if((strand == "-" && pos <= 1) || (strand != "-" && pos >= maxPos)) {
				if(strand != "-" && pos - pow < maxPos) {
					var fewMvX = (pos - maxPos) * (width - 1) / (end - start + 1);
					this.imgObj.moveTo(x1 + hfMvX, y1);
					this.imgObj.lineTo(x1 + hfMvX - fewMvX, y3);
					this.imgObj.lineTo(x1 + hfMvX - fewMvX, y1);
					this.imgObj.lineTo(x1 + hfMvX, y3);
				}
				this.imgObj.moveTo(x1 + hfMvX + mvX, y1);
				this.imgObj.lineTo(x1 + hfMvX, y3);
				this.imgObj.lineTo(x1 + hfMvX, y1);
				this.imgObj.lineTo(x1 + hfMvX + mvX, y3);
			} else {
				if(strand == "-" && pos - pow < maxPos) {
					var fewMvX = (pos - maxPos) * (width - 1) / (end - start + 1);
					this.imgObj.moveTo(x1 - hfMvX, y1);
					this.imgObj.lineTo(x1 - hfMvX + fewMvX, y3);
					this.imgObj.lineTo(x1 - hfMvX + fewMvX, y1);
					this.imgObj.lineTo(x1 - hfMvX, y3);
				}
				this.imgObj.moveTo(x1 - hfMvX - mvX, y1);
				this.imgObj.lineTo(x1 - hfMvX, y3);
				this.imgObj.lineTo(x1 - hfMvX, y1);
				this.imgObj.lineTo(x1 - hfMvX - mvX, y3);
			}
			this.imgObj.stroke();
		}
		this.imgObj.fillRect(x1, y1, 1, y2 - y1);
		
		pos += pow;
	}
	this.imgObj.fillRect(0, y1 + this.height - 1, width, 1);
	
	return [];
};


//option.wholeGenome (whole genome表示用オプション)
var WgChr = function(callObj, addParamStr, baseY, relYSpace, genome, option) {
	this.option = (option !== undefined)? option: {};
	
	this.option.chrBoxCol = (this.option.chrBoxCol === undefined)? 
		"#ffee88": this.option.chrBoxCol;
	if(this.option.chrData === undefined) this.option.chrData = {};
	
	this.cCc;
	this.height;
	this.width;
	this.chrData = this.option.chrData;
	this.showChr = "";
	this.loading = "";
	//initDataが呼ばれたらtrueになり、その後paintされたらfalseになる
	this.initFlg = false;
	
	if(addParamStr === undefined) addParamStr = "";
	this.addParamStr = addParamStr;
	this.callObj = callObj;
	
	this.baseY = baseY;
	this.genome = genome;
	this.chrHeight = (this.option.chrHeight)? this.option.chrHeight: 10;
	this.relYSpace = relYSpace;
};
WgChr.prototype = {
	initData: function(cCc, width, height) {
		this.cCc = cCc;
		this.height = height;
		this.width = width;
		this.initFlg = true;
	},
	
	paint: function(chr, start, end, strand) {
		var m = this;
		var imgObj = this.imgObj;
		var cCc = this.cCc;
		var showWidth = this.width;
		if(this.callObj.urlSet.chromosome !== undefined || this.chrData[chr] !== undefined) {
			if(this.loading != chr) {
				if(this.chrData[chr] === undefined) {
					this.loading = chr;
					var paramStr = (this.addParamStr == "")? "": '&' + this.addParamStr;
					var urlStr = this.callObj.urlSet.chromosome;
					urlStr += (this.option.chrUriDirFlg)? "/" + chr: '?chr=' + chr;
					if(paramStr) urlStr += (this.option.chrUriDirFlg)? "/?" + paramStr: paramStr;
					$.ajax({
						url: urlStr,
						xhrFields: {withCredentials: this.option.withCredentials},
						dataType: 'json',
						success: function(data) {
							m.chrData[chr] = data;
							m.bufferPaint(chr);
							m.loading = "";
						},
						error: function(data) {
							this.loading = "";
							alert("Error! " + this.url);
						},
						complete: function(data) {
						}
					});
				} else if(this.showChr != chr || this.initFlg) {
					this.bufferPaint(chr);
				}
			} else if(this.chrData[chr] === undefined) {
				this.chrBoxPaint(chr);
			}
		} else {
			this.chrBoxPaint(chr);
		}
		
		if(this.baseY >= 10) {
			if(strand != "-") strand = "+";
			var str = chr + ":" + Number(Math.floor(start)).toLocaleString() + 
				"-" + Number(Math.floor(end)).toLocaleString() + ":" + strand;
			cCc.font = "10px 'Helvetica'";
			var strWidth = cCc.measureText(str).width;
			cCc.fillStyle = "#000000";
			cCc.clearRect(0, 0, showWidth, this.baseY);
			cCc.fillText(str, 10, this.baseY / 2 + 4);
		}
		
		var wg = this.option.wholeGenome;
		if(wg === undefined || !wg.additionEraseFlg) {
			var y2 = this.height - this.relYSpace + 5;
			var x2 = this.width;
			
			cCc.clearRect(0, y2 - 12 + 5, x2, 15);
			cCc.fillStyle = "#000000";
			cCc.fillRect(0, y2, x2, 1);
			cCc.beginPath();
			cCc.moveTo(0, y2);
			cCc.lineTo(10, y2 - 5);
			cCc.lineTo(10, y2 + 5);
			cCc.closePath();
			cCc.fill();
			cCc.beginPath();
			cCc.moveTo(x2, y2);
			cCc.lineTo(x2 - 10, y2 - 5);
			cCc.lineTo(x2 - 10, y2 + 5);
			cCc.closePath();
			cCc.fill();
			var lngStr = Math.floor(end) - Math.floor(start) + 1;
			if(lngStr >= 10000000) {
				lngStr = Number(Math.floor((lngStr + 500000) / 1000000)).toLocaleString() + " mb";
			} else if(lngStr >= 10000) {
				lngStr = Number(Math.floor((lngStr + 500) / 1000)).toLocaleString() + " kb";
			} else {
				lngStr = Number(Math.floor(lngStr)).toLocaleString() + " b";
			}
			cCc.font = "15px 'Helvetica'";
			var strWidth = cCc.measureText(lngStr).width;
			var x3 = (x2 - strWidth) / 2;
			
			cCc.clearRect(x3 - 5, y2 - 12 + 5, strWidth + 5 * 2, 15);
			cCc.fillText(lngStr, x3, y2 + 5);
		} else {
			var y3 = 13;
			var lngStr = chr;
			cCc.fillStyle = "#000000";
			cCc.font = "10px 'Helvetica'";
			var strWidth = cCc.measureText(lngStr).width;
			cCc.clearRect(0, y3, strWidth, 10);
			cCc.fillText(lngStr, 0, y3 + 7);
		}
		
		
		//this.imgObj.drawImage(this.cCanvas, width / 3, 0);
		//this.imgObj.fillRect(0, y, width, this.height);
		
		return [];
	},
	
	chrBoxPaint: function(chr) {
		var wg = this.option.wholeGenome;
		var leftSpace = 0;
		if(wg && wg.leftSpace) leftSpace = wg.leftSpace;
		
		this.showChr = chr;
		this.initFlg = false;
		
		var cCc = this.cCc;
		var showWidth = this.width;
		var showWidthChr = showWidth - leftSpace;
		var showHeight = this.height;
		var chrHeight = this.chrHeight;
		var callObj = this.callObj;
		var chrLng = this.genome[chr][1];
		cCc.clearRect(0, 0, showWidth, showHeight);
		if(!wg) this.paintScale(cCc, chrLng);
		var y1 = ((showHeight - this.baseY - this.relYSpace) - chrHeight) / 2 + this.baseY;
		var y2 = y1 + chrHeight - 1;
		var dirFlg = true;
		var nameX = 0;
		cCc.font = "10px 'Helvetica'";
		cCc.fillStyle = "#000000";
		cCc.fillRect(leftSpace, 0, showWidthChr, 1);
		cCc.fillRect(leftSpace, showHeight - 1, showWidthChr, 1);
		
		var y1 = (showHeight - this.baseY - this.relYSpace) / 2 + this.baseY - 6;
		var y2 = (showHeight - this.baseY - this.relYSpace) / 2 + this.baseY + 6;
		
		cCc.fillStyle = this.option.chrBoxCol;
		cCc.fillRect(leftSpace, y1, showWidthChr, y2 - y1 + 1);
		cCc.strokeRect(leftSpace, y1, showWidthChr, y2 - y1 + 1);
		//cCc.strokeStyle = "#000000";
		//callObj.paint();
	},
	
	bufferPaint: function(chr) {
		var wg = this.option.wholeGenome;
		var leftSpace = 0;
		if(wg && wg.leftSpace) leftSpace = wg.leftSpace;
		
		this.showChr = chr;
		this.initFlg = false;
		
		var data = this.chrData[chr];
		
		if(!data.length) {
			this.chrBoxPaint(chr);
			return ;
		}
		
		var cCc = this.cCc;
		var showWidth = this.width;
		var showWidthChr = showWidth - leftSpace;
		var showHeight = this.height;
		var chrHeight = this.chrHeight;
		var callObj = this.callObj;
		var chrLng = 0;
		for(var i = 0; i < data.length; i ++) {
			var end = data[i][1];
			if(chrLng < end) chrLng = end;
		}
		cCc.clearRect(0, 0, showWidth + 2, showHeight);
		if(!wg) this.paintScale(cCc, chrLng);
		var y1 = (wg === undefined) ?
			((showHeight - this.baseY - this.relYSpace) - chrHeight) / 2 + this.baseY:
			showHeight - chrHeight;
		var y2 = y1 + chrHeight - 1;
		var dirFlg = true;
		var nameX = 0;
		cCc.font = "10px 'Helvetica'";
		for(var i = 0; i < data.length; i ++) {
			var cytoStart = data[i][0];
			var cytoEnd = data[i][1];
			var cytoName = data[i][2];
			cytoName = cytoName.replace(/^\d+/, "");
			
			var cytoScore;
			var score = data[i][3];
			if(isNaN(score)) {
				if(score.substr(0, 4) == "gpos") {
					cytoScore = parseInt((100 - score.substr(4)) * 2.55);
				} else if(score == "gneg") {
					cytoScore = 255;
				} else if(score == "acen") {
					cytoScore = 256;
				} else {
					console.log("Error: invalid score: " + score);
				}
			} else {
				cytoScore = parseInt((1 - data[i][3]) * 255);
			}
			var x1 = leftSpace + (showWidthChr - 1) * (cytoStart - 1) / (chrLng - 1);
			var x2 = leftSpace + (showWidthChr - 1) * (cytoEnd - 1) / (chrLng - 1);
			
			var strWidth = cCc.measureText(cytoName).width;
			var x3 = (x1 + x2 - strWidth) / 2;
			if(nameX + 10 < x3) {
				cCc.fillStyle = "#000000";
				var y3 = (wg === undefined)? y2 + 10: y2 - 12;
				cCc.fillText(cytoName, x3, y3);
				nameX = x3 + strWidth;
			}
			if(cytoScore > 255) {
				cCc.strokeStyle = "#000000";
				cCc.fillStyle = "#AA0000";
				cCc.beginPath();
				if(dirFlg) {
					cCc.moveTo(x1, y1);
					cCc.lineTo(x2, (y1 + y2) / 2);
					cCc.lineTo(x1, y2);
				} else {
					cCc.moveTo(x1, (y1 + y2) / 2);
					cCc.lineTo(x2, y2);
					cCc.lineTo(x2, y1);
				}
				cCc.closePath();
				cCc.fill();
				cCc.stroke();
				dirFlg = !dirFlg;
			} else {
				var col = cytoScore.toString(16);
				cCc.fillStyle = "#" + col + col + col;
				cCc.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
				cCc.strokeStyle = "#000000";
				cCc.strokeRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
			}
		}
		cCc.fillStyle = "#000000";
		cCc.fillRect(leftSpace, 0, showWidthChr, 1);
		cCc.fillRect(leftSpace, showHeight - 1, showWidthChr, 1);
		callObj.paint();
	},
	
	paintScale: function(cCc, chrLng) {
		var width = this.width;
		var wg = this.option.wholeGenome;
		var leftSpace = 0;
		if(wg && wg.leftSpace) leftSpace = wg.leftSpace;
		var mWidth = width - leftSpace;
		
		var flog = Math.floor(10 * 10 * chrLng / mWidth);
		if(flog <= 0) flog = 1;
		var pow = Math.pow(10, Math.floor(Math.LOG10E * Math.log(flog)));
		var pos = pow;
		var x1;
		var x2_edge;
		var y1 = this.baseY + 1;
		cCc.fillStyle = "#000000";
		cCc.fillRect(leftSpace, y1, mWidth, 1);
		while((x1 = leftSpace + (pos - 1) * (mWidth - 1) / chrLng) <= width) {
			var y2 = this.baseY + 5;
			var checkPos = Math.floor(pos / pow);
			if(checkPos % 10 == 5) y2 += 3;
			if(checkPos % 10 == 0) {
				cCc.font = "10px 'Helvetica'";
				var posStr = Number(pos).toLocaleString();
				var strWidth = cCc.measureText(posStr).width;
				var x2 = x1 - strWidth / 2;
				if(x2 > 0 && x2 + strWidth < width && 
					(x2_edge === undefined || x2_edge + 20 < x2)) {
					
					cCc.fillText(posStr, x2, y2 + 13);
					x2_edge = x2 + strWidth;
				}
				y2 += 5;
			}
			cCc.fillRect(x1, y1, 1, y2 - y1);
			pos += pow;
		}
	},
	
	setHeight: function(width, chr, start, end) {
	},
	
	getPopupData: function() {
		return;
	},
	
	getHeight: function() {
		return this.height;
	}
};

//nameは自分のID(オブジェクトごとユニークにする)
var WgSkeleton = function(name) {
	this.name = name;
	
	this.height = 50;
	this.y;
};
WgSkeleton.prototype = new WgRoot();
//描画する(Y位置, 裏画面の幅, chr, 裏画面のstart, 裏画面のend)
//実際には裏画面を横に3つに区切ったうちの真ん中が表示される
WgSkeleton.prototype.paint = function(y, width, chr, start, end, strand) {
	var status = [];
	
	var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
	if(pow < 0) pow = 0;
	var reg = Math.pow(10, pow) * POW_REG;
	
	var binStart = Math.floor((start - 1) / reg);
	var binEnd = Math.floor((end - 1) / reg);
	
	for(var i = binStart; i <= binEnd; i ++) {
		if(this.ojson[pow] && this.ojson[pow][chr + "|" + i] && this.ojson[pow][chr + "|" + i][this.name]) {
			var data = this.ojson[pow][chr + "|" + i][this.name];
		} else {
			if(i >= 0) status.push(i);
			this.paintLoading(y, width, start, end, strand, i);
		}
	}
	
	return status;
};
//paintの前に呼ばれる。現状のデータから自分自身の描画の高さをセットする
WgSkeleton.prototype.setHeight = function(width, chr, start, end) {
};
//ポップアップ用データを返す
WgSkeleton.prototype.getPopupData = function() {
	return;
};
//自分のID
WgSkeleton.prototype.getName = function() {
	return this.name;
};


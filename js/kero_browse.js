/**
 * @author Hiroyuki Wakaguri: hwakagur(α)bits.cc (Tokyo-Univ. Yutaka Suzuki's lab.)
 */
 var VERSION = "kero_browse.js v1.6.20180105";
 
/**
 * for GenomeViewerObject
 * option.showChromFlg
 * option.showScaleFlg
 * option.toolBar: HTML string for toolbar (defalut: default toolbar (see program))
 * option.browserId: ID of this browser for cookie saving (default: "")
 * option.backValidFlg: backボタンを押したとき場所がバックする機能を有効にする(正常に動作するか不明)
 *
 * for GenomeViewer
 * option.itemSwitchFlg: trackの表示非表示を切り替え不可にする場合false
 * option.defaultMode: "nav" or "info": default "nav"
 * option.autoSizingFlg
 * option.toolbarId
 * option.viewerId
 * option.ibuttonId
 * option.scaleSizingFlg
 * option.chromSizingFlg: マウスでの染色体の領域選択を許す場合true (default: true)
 * option.dblclickSizingFlg: マウスでのダブルクリックでの領域選択を許す場合true (default: true)
 * option.boderCss
 * option.itemTrans
 * option.edgePreventFlg: genomeの端から先をbrowseできないようにするときtrue (default: false)
 * option.linkAdd
 * option.showPositionFlg
 * option.showPanelFlg
 * option.commonData
 * option.initShow
 * option.showScaleFlg
 * option.bgVlineFlg: trueのとき背景にスケールの縦線が入る
 * option.moveCallback: paintの際、コールバックされる関数。引数に表示positionが設定される
 * option.uriDirFlg: trueのときURIをdirectory構造にする (default: false)
 * option.chrUriDirFlg: trueのときchromosome情報のURIをdirectory構造にする (default: false)
 * option.linkAdd
 * option.defBtnHideFlg: trueのときAdd separatorボタンとClear all tracksボタンを非表示にする
 * option.trackBtnHideFlg: trueのときtrack追加ボタンを非表示にする(↑のボタン(Add separator等)とは無関係)
 * option.withCredentials: ajax accessの際、PC上など別ドメインからもcookieを渡す場合true
 * option.chrBoxCol: 染色体を表示する部分のボックスの色(band情報がない場合有効)
 * option.locationBarFlg: Locationバーに#位置の表示を付ける場合true (default: true)
 * option.jsonMax: 設定すると古いjsonデータは削除される(メモリ使用節約用: 1以上の値を設定)
 * option.onresizeSetWidth: Webブラウザをリサイズしたときに呼ばれ、ゲノムブラウザに設定したい横幅を返す関数として設定する(return width)
 * option.onTrackAction(e, GenomeViewer): trackの表示・非表示の変化が起こった時に呼ばれる(e.statusはdel/addのどれかe.targetObj=変化の起こったオブジェクト)
 * option.toolBarCss: toolbar用CSS
 
 jsonUrl: trackオブジェクトに指定しておくと、そこからデータを取りに行きます
 
 getPopupData() はinfo.モードのときクリックでポップアップする情報を入れる
 以下の書式でボックス単位の範囲でポップアップ表示を指定することができる。
 popup[yの範囲][xの範囲] = {
 	"html": htmlStr // このhtmlStrがポップアップ表示される
	"action": htmlを表示せずにクリックアクションを起こさせたい場合はこちらを指定する
	"actionParam": actionに渡したい引数を指定することができ、actionの第二パラメーターに代入されます
 }; 
 
 
 showTypeChangeAction()は、showTypeがchangeしたときに呼ばれます
 
 menuPopAction() は、popupの際自動的に呼ばれます。
 
 menuDetailAction() は、popupの際、getMenuDetail()が起動した(モーダルが出力された)ときに呼ばれます。
 getMenuDetail()はdetail表示の際に出力するhtmlを返すようにしますが、そのhtmlの内容に対応する
 actionを指定することができます。
  
 画像キャッシュ機能を使用すると初回に画像を作った後はキャッシュ画像を利用するようになる。
 画像キャッシュを使いたい場合、トラックオブジェクトのコンストラクタにthis.imgCachingを以下のようにセットする
 画像は３画面ごとでなく、binごとに作成されるようになる（このため初回は逆に遅いかも）。
 画像キャッシュを使う場合、paintメソッドでbin間のつなぎ目に画像のずれが生じないように注意が必要
 またpaint(paint2)でインスタンス変数を設定していた場合、最後の値になる(呼ばれるのが一度とは限らない)ことに注意

	var m = this;
	this.imgCaching = {
		//cachingの数1以上の整数を入れる。10倍する間に何段階で画像をCachするかの数（大きいほうが画像が歪まないが、cach数が多くなる）
		cachingNum: 10,
		//cachingを適用する最小Pow番号
		applyMinPow: 3,
		getSettingType: function() {
			//プロパティーごとにキャッシュを保存する（例えば色を変更したら新しいキャッシュが必要なので）ためのIDを返す
			return m.fontSize + "|" + m.eachSqwHeight + "|" + m.eachHeight + "|" + 
				m.colUtr + "|" + m.colCds + "|" + m.colBox + "|" + m.showType;
		}
	};
 
 */
 
var MAX_HEIGHT = 32766;
var GenomeViewerObject = function(divId, chrData, urlSet, option) {
	this.divId = divId;
	if(!$(this.divId)[0]) {alert(divId + " factor not found"); return false;}
	this.chrData = chrData;
	this.urlSet = (urlSet === undefined)? {}: urlSet;
	if(option === undefined) {
		this.option = (urlSet === undefined)? {uriDirFlg: true}: urlSet;
		this.option.uriDirFlg = true;
	} else {
		this.option = option;
	}
	if(this.option.showChromFlg === undefined) this.option.showChromFlg = true;
	if(this.option.showScaleFlg === undefined) this.option.showScaleFlg = true;
	if(this.option.browserId === undefined) this.option.browserId = "";
	if(this.option.defBtnHideFlg === undefined) this.option.defBtnHideFlg = false;
	
	this.gv = null;
	//gvを関連付けるためのobject(WgCompara用)
	this.gvVector = {};
	var m = this;
	
	//外向けgv function集
	this.gvFunc = (function() {
		this.gvVector = m.gvVector;
		return {
			getGvOption: function() {
				return gvVector.gv.option;
			},
			getWidth: function() {
				return gvVector.gv.width;
			},
			getUrlSet: function() {
				return gvVector.gv.urlSet;
			},
			getGenome: function() {
				return gvVector.gv.genome;
			},
			getViewerParts: function() {
				return gvVector.gv.viewerParts;
			},
			getDivId: function() {
				return gvVector.gv.divId;
			},
			addCreateParts: function(parts, showFlg) {
				gvVector.gv.addCreateParts(parts, showFlg);
			},
			changeTrack: function(targetId, noSeparatorFlg) {
				gvVector.gv.changeTrack(targetId, noSeparatorFlg);
			},
			showItemFromButtonClick: function(items) {
				gvVector.gv.showItemFromButtonClick(items);
			},
			hideItemFromButtonClick: function(items) {
				gvVector.gv.hideItemFromButtonClick(items);
			},
			setGenomePosition: function(chr, start, end, strand) {
				gvVector.gv.setGenomePosition(chr, start, end, strand);
			},
			paint: function() {
				gvVector.gv.paint();
			},
			alert: function() {
				alert(this.gvVector + ", " + gvVector.gv);
			}
		};
	})();
	
	$(divId).css("text-align", "left").css("line-height", "normal").css("border", "none");
	var htmlStr = "";
	
	if(this.option.toolBar === undefined) {
		htmlStr += "<div id=\"tool_bar\">";
		htmlStr += "<div>";
		var inputHeight = 15;
		var inputFont = inputHeight - 5;
		htmlStr += "<button style=\"padding: 0px; border: none; background:none;\" class=\"tools_btn\" id=\"menu_button\"><img src=\"icons/tools_btn.png\" alt=\"Menu\" id=\"btn1\" /></button>";
		htmlStr += "<input style=\"height: " + inputHeight + "px; font-size: " + inputFont + "px; width: 200px; position: absolute;\" id=\"genome_position\" class=\"ui-autocomplete-input\" autocomplete=\"off\" type=\"text\">";
		htmlStr += "<button style=\"padding: 0px; border: none; background:none; position: absolute; left: 232px;\" class=\"tools_btn\" id=\"go_button\"><img src=\"icons/tools_btn.png\" alt=\"Menu\" id=\"btn2\" /></button>";
		htmlStr += "<button style=\"padding: 0px; border: none; background:none; position: absolute; left: 260px;\" class=\"tools_btn\" id=\"big5\"><img src=\"icons/tools_btn.png\" alt=\"Menu\" id=\"btn3\" /></button>";
		htmlStr += "<button style=\"padding: 0px; border: none; background:none; position: absolute; left: 280px;\" class=\"tools_btn\" id=\"big\"><img src=\"icons/tools_btn.png\" alt=\"Menu\" id=\"btn4\" /></button>";
		htmlStr += "<button style=\"padding: 0px; border: none; background:none; position: absolute; left: 300px;\" class=\"tools_btn\" id=\"bigm\"><img src=\"icons/tools_btn.png\" alt=\"Menu\" id=\"btn5\" /></button>";
		htmlStr += "<button style=\"padding: 0px; border: none; background:none; position: absolute; left: 320px;\" class=\"tools_btn\" id=\"smallm\"><img src=\"icons/tools_btn.png\" alt=\"Menu\" id=\"btn6\" /></button>";
		htmlStr += "<button style=\"padding: 0px; border: none; background:none; position: absolute; left: 340px;\" class=\"tools_btn\" id=\"small\"><img src=\"icons/tools_btn.png\" alt=\"Menu\" id=\"btn7\" /></button>";
		htmlStr += "<button style=\"padding: 0px; border: none; background:none; position: absolute; left: 360px;\" class=\"tools_btn\" id=\"small5\"><img src=\"icons/tools_btn.png\" alt=\"Menu\" id=\"btn8\" /></button>";
		htmlStr += "<button style=\"padding: 0px; border: none; background:none; position: absolute; left: 390px;\" class=\"tools_btn\" id=\"info_button\"><img src=\"icons/tools_btn.png\" alt=\"Info mode\" id=\"btn9\" /></button>";
		htmlStr += "<button style=\"padding: 0px; border: none; background:none; position: absolute; left: 410px;\" class=\"tools_btn\" id=\"nav_button\"><img src=\"icons/tools_btn.png\" alt=\"Browse mode\" id=\"btn10\" /></button>";
		htmlStr += "<button style=\"padding: 0px; border: none; background:none; position: absolute; left: 440px;\" class=\"tools_btn\" id=\"panel_button\"><img src=\"icons/tools_btn.png\" alt=\" Synchronize track settings on/off\" id=\"btn11\" /></button>";
		htmlStr += "<button style=\"padding: 0px; border: none; background:none; position: absolute; left: 470px;\" class=\"tools_btn\" id=\"sync_button\"><img src=\"icons/tools_btn.png\" alt=\"\" id=\"btn12\" /></button>";
		htmlStr += "</div>";
		htmlStr += "<div id=\"down_menu\" style=\"position: absolute; visibility: hidden\"></div>";
		htmlStr += "<div id=\"movable_menu\" style=\"position: absolute; border: 1px solid #aaaaaa; background-color: #dddddd; margin: 5px; display: none\">";
		htmlStr += "\t<div id=\"movable_close\" style=\"cursor: pointer; float: right\">X</div>";
		htmlStr += "\t<div id=\"movable_title\" style=\"cursor: move; background-color: gray; font-color: #ffffff\"></div>";
		htmlStr += "<div id=\"content\" style=\"font-size: 12px\">";
		htmlStr += "</div>"; //End of content
		htmlStr += "</div>"; //End of movable_menu
		htmlStr += "</div>"; //End of tool_bar
		
		if(this.option.onTrackAction === undefined) {
			this.option.onTrackAction = function(e, ogv) {
				var targetId = e.targetObj.getName();
				var checked;
				if(e.status == "add") {
					checked = true;
				} else {
					checked = false;
				}
				$("div" + divId + " #" + m.option.toolbarId + " #chkw_" + targetId).prop('checked', checked);
			};
		}
	} else if(this.option.toolBar == "") {
		htmlStr += "";
	} else {
		htmlStr += "<div id=\"tool_bar\">";
		htmlStr += this.option.toolBar;
		htmlStr += "</div>";
	}
	
	htmlStr += "<div id=\"modal\" style=\"display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;\">";
	htmlStr += "<div class=\"background\" style=\"position: fixed; width: 100%; height: 100%; ";
	htmlStr += "background-color: #000000; opacity: 0.75; filter: alpha(opacity=75); ";
	htmlStr += "-ms-filter: 'alpha(opacity=75)';\"></div>";
	htmlStr += "<div class=\"container\" style=\"position: relative; width: 500px; ";
	htmlStr += "background-color: #ffffff; overflow: auto; border-radius: 3px; padding: 5px;\">";
	htmlStr += "<div class=\"container_in\"></div></div></div>";
	htmlStr += "<div id=\"right_pop\" style=\"position: absolute; visibility: hidden\"></div>";
	htmlStr += "<div id=\"viewer_body\"></div>";
	
	$(divId).html(htmlStr);
	
	this.adjustCenter();
	$(window).resize(function() {
		m.adjustCenter();
	});
	$("div" + divId + " div#modal div.background").click(function() {
		m.displayModal(false);
		return false;
	});
	$("div" + divId + " #genome_position").keypress(function(e){
		if(e.which == 13) {
			m.goGoButton();
			return false;
		}
	});
	if(this.option.backValidFlg) {
		window.addEventListener("popstate", function() {
			var chr = m.gv.chr;
			var start = parseInt(m.gv.start);
			var end = parseInt(m.gv.end);
			var strand = (m.gv.strand == "-" || m.gv.strand == "-1")? "-": "+";
			
			var locPos = m.getParsePosition(location.hash.substr(1));
			if(!locPos) return false;
			if(start < 1 || end > m.chrData[chr][1]) return false;
			
			if(locPos[3] != "-") locPos[3] = "+";
			
			if(
				chr != locPos[0] || start != locPos[1] || 
				end != locPos[2] || strand != locPos[3]
			) {
				m.goSetGenomePosition(locPos, true);
				console.log("back button pushed");
				//alert(window.location.href + ": " + chr + ":" + start + "-" + end + ":" + strand);
			}
		});
	}
	
	
	if(this.option.toolBar === undefined) {
		$("div" + divId + " .tools_btn").css("width", "20px").css("height", "20px").css("overflow", "hidden");
		for(var i = 1; i <= 12; i ++) {
			var px = (1 - i) * 20; if(i == 12) px = -240;
			$("div" + divId + " .tools_btn #btn" + i).css("position", "relative").css("left", px + "px");
			if(i == 11) {
				$("div" + divId + " .tools_btn #btn" + i).css("top", "-20px");
			}
		}
	}
	
	if(this.urlSet.key2position !== undefined) {
		var source = (this.urlSet.additionalParam === undefined)? 
			this.urlSet.key2position: this.urlSet.key2position + "?" + this.urlSet.additionalParam;
		$("div" + divId + " #genome_position").autocomplete({
			source: source,
			open: function(ev, ui)  {
				var widget = $(this).autocomplete('widget');
				var items = widget.children( 'li' ).length;
				//jQuery('<li>', {className: 'results', text: items + 'items found',
				//	css: {fontSize: '8pt', textAlign: 'right'}}).appendTo(widget);
				if(items >= 30) {
					jQuery('<li>', {className: 'results', text: "..."}).appendTo(widget);
				}
			},
			//source: function(req, resp){
			//	$.ajax({
			//		url: this.urlSet.key2position,
			//		type: "GET",
			//		cache: false,
			//		dataType: "json",
			//		data: {
			//			term: req.term
			//		},
			//		success: function(o){
			//			resp(o);
			//		},
			//		error: function(xhr, ts, err){
			//			resp(['']);
			//		}
			//	});
			//},
			minLength: 2,
			max: 10,
			scroll: true
		});
	}
};
GenomeViewerObject.prototype = {
	getParsePosition: function(str) {
		if(str === undefined) return false;
		var chrPos = str.split(":");
		try {
			chrPos[1] = chrPos[1].replace(/^\-+/, "");
			var se = chrPos[1].split(/\-|\.\./);
			se[0] = se[0].replace(/ |,/g, "");
			if(se[1] === undefined) {
				se[1] = se[0];
			} else {
				se[1] = se[1].replace(/ |,/g, "");
			}
			var start = parseInt(se[0]);
			var end = parseInt(se[1]);
			if(start < 0) start = 1;
			if(end < 0) end = 1;
			if(!start || !end) {
				return false;
			}
		} catch(err) {
			return false;
		}
		if(chrPos[2] !== undefined && chrPos[2] == "-1") chrPos[2] = "-";
		
		return [chrPos[0], start, end, chrPos[2]];
	},
	
	setupGenomeViewer: function(posStr, width, height, viewerPartsData) {
		//var posSE = posStr.split(":");
		//var se = posSE[1].split("-");
		//if(se[1] === undefined) posStr += "-" + se[0];
		
		if(viewerPartsData === undefined) viewerPartsData = [];
		
		this.posStr = posStr;
		var getParsePosition = this.getParsePosition;
		var chrData = this.chrData;
		var divId = this.divId;
		
		var tmpWidth = this.getCookie("viewerWidth");
		if(tmpWidth != "") width = parseInt(tmpWidth);
		var tmpHeight = this.getCookie("viewerHeight");
		if(tmpHeight != "") height = parseInt(tmpHeight);
		width *= 1; height *= 1;
		if(!isFinite(width)) width = 500;
		if(!isFinite(height)) height = 300;
		
		var gv = new GenomeViewer(width, height, chrData, posStr, divId, 
			viewerPartsData, this.urlSet, this.option);
		this.gvVector.gv = gv;
		
		this.gv = gv;
		this.goGoButton();
		
		var m = this;
		
		$("div" + divId + " #go_button").click(function() {
			m.goGoButton();
			return false;
		});
		$("div" + divId + " #small").click(function() {
			m.changeSize(0.5);
			return false;
		});
		$("div" + divId + " #big").click(function() {
			m.changeSize(2);
			return false;
		});
		$("div" + divId + " #small5").click(function() {
			m.changeSize(0.2);
			return false;
		});
		$("div" + divId + " #big5").click(function() {
			m.changeSize(5);
			return false;
		});
		$("div" + divId + " #smallm").click(function() {
			m.changeSize(2/3);
			return false;
		});
		$("div" + divId + " #bigm").click(function() {
			m.changeSize(1.5);
			return false;
		});
		$("div" + divId + " #change_size").click(function() {
			var vwidth = Math.floor($("div" + divId + " #viewer_width").val());
			var height = Math.floor($("div" + divId + " #viewer_height").val());
			if(isNaN(height)) height = 200;
			if(vwidth < 200) vwidth = 200;
			if(height < 200) height = 200;
			if(vwidth > 2000) vwidth = 2000;
			if(height > 2000) height = 2000;
			m.setCookie("viewerWidth", vwidth);
			m.setCookie("viewerHeight", height);
			m.gv.setViewerSize(vwidth, height);
			return false;
		});
		$("div" + divId + " #track_set").click(function() {
			m.allTruckSetting();
			return false;
		});

		return this.gv;
	},
	
	changeSize: function(rate) {
		var newPos;
		if(!$("div" + this.divId + " #genome_position").size()) {
			newPos = this.getParsePosition(location.hash.substr(1));
		} else {
			newPos = this.getParsePosition($("div" + this.divId + " #genome_position").val());
		}
		if(newPos) {
			var chr = newPos[0];
			var lng = newPos[2] - newPos[1] + 1;
			var center = (newPos[2] + newPos[1]) / 2;
			newPos[1] = Math.floor(center - lng / rate / 2);
			newPos[2] = Math.floor(center + lng / rate / 2);
			this.goSetGenomePosition(newPos);
		} else {
			alert("check format.");
		}
	},
	
	searchFromTerm: function(term) {
		var m = this;
		var term_ = term;
		var getParsePosition = this.getParsePosition;
		if(this.urlSet.searchKey === undefined) {return false;}
		
		var url = (this.urlSet.additionalParam === undefined)? 
			this.urlSet.searchKey + "?term=" + term + "&condition=list": 
			this.urlSet.searchKey + "?term=" + term + "&condition=list&" + 
				this.urlSet.additionalParam;
		
		$.ajax({
			url: url,
			xhrFields: {withCredentials: this.option.withCredentials},
			dataType: 'json',
			success: function(data) {
				if(data.hit_num== 0) {
					alert("No hit found. (" + term_ + ")");
				} else if(data.hit_num == 1) {
					var newPos = getParsePosition(data.source[0].location);
					var lng = newPos[2] - newPos[1] + 1;
					var start = newPos[1] - lng / 5;
					var end = newPos[2] + lng / 5;
					var strand = (newPos[3] === undefined)? "": newPos[3];
					m.gv.setGenomePosition(newPos[0], start, end, strand);
				} else {
					var htmlStr = "<div>First 20 candidates were shown.</div><div>&nbsp;</div>";
					htmlStr += "<table border=\"1\">";
					for(var i = 0; i < data.source.length; i ++) {
						var each = data.source[i];
						var term = each.term;
						//if(term.length > 20) {
						//	term = term.substr(0, 20) + "...";
						//}
						
						//htmlStr += "<tr><td>" + term + "</td><td><a href=\"" + 
						//	each.location + "\" class=\"modal\">" + each.location + 
						//	"</a></td><td>" + each.info + "</td></tr>";
						htmlStr += "<tr><td>" + term + "</td><td><a href=\"" + 
							each.location + ":" + each.strand + "\" class=\"modal\">" + 
							each.location + ":" + each.strand + "</a></td></tr>";
						if(i == 19) {break;}
					}
					htmlStr += "</table>";
					$("div" + m.divId + " div#modal div.container").html(htmlStr);
					m.displayModal(true);
					$("div" + m.divId + " div#modal div.container a.close").click(function() {
						m.displayModal(false);
						return false;
					});
					$("div" + m.divId + " a.modal").click(function() {
						var newPos = getParsePosition($(this).attr("href"));
						var lng = newPos[2] - newPos[1] + 1;
						var start = newPos[1] - lng / 5;
						var end = newPos[2] + lng / 5;
						var strand = (newPos[3] === undefined)? "": newPos[3];
						m.gv.setGenomePosition(newPos[0], start, end, strand);
						m.displayModal(false);
						return false;
					});
					//alert("Many hits.");
				}
			},
			error : function(data) {
				alert("Error: Cannot access to " + this.url);
			},
			complete: function(data) {
			}
		});
	},
	
	adjustCenter: function() {
		var target = "div" + this.divId + " div#modal div.container";
		var width = window.innerWidth? window.innerWidth: $(window).width();
		var height = window.innerHeight? window.innerHeight: $(window).height();
		var margin_top = (height-$(target).height())/2;
		var margin_left = (width-$(target).width())/2;
		if(margin_top < 0) margin_top = 0;
		
		$(target).css({top:margin_top+"px", left:margin_left+"px"});
	},
	
	displayModal: function(sign, xy) {
		if(sign) {
			if(xy === undefined) xy = [500, 600];
			$("div" + this.divId + " div#modal div.container").css("width", xy[0]).css("height", xy[1]);
			$("div" + this.divId + " div#modal").fadeIn(250);
		} else {
			$("div" + this.divId + " div#modal").fadeOut(250);
		}
		this.adjustCenter();
	},
	
	goGoButton: function() {
		var searchTerm = $("div" + this.divId + " #genome_position").val();
		var newPos = this.getParsePosition(searchTerm);
		if(newPos) {
			this.goSetGenomePosition(newPos);
		} else if(searchTerm) {
			//console.log(this.gv.cc);
			//this.gv.cc.fillStyle = "#000000";
			//this.gv.cc.fillText("Wait...", 10, 10);
			this.searchFromTerm($("div" + this.divId + " #genome_position").val());
		} else if(!$("div" + this.divId + " #genome_position").size()) {
			//var pos = this.getParsePosition(location.hash.substr(1));
			var pos = this.getParsePosition(this.posStr);
			this.goSetGenomePosition(pos);
		} else {
			alert("Please input genomic position where you want to see.");
		}
	},
	
	goSetGenomePosition: function(posData, nolocFlg) {
		var chr = posData[0];
		var start = posData[1];
		var end = posData[2];
		var strand = posData[3];
		if(start < 1) start = 1;
		if(!(chr in this.chrData)) {
			alert("Error: chromosome: " + chr + " not found.");
			return false;
		}
		if(end > this.chrData[chr][1]) end = this.chrData[chr][1];
		this.gv.setGenomePosition(chr, start, end, strand, nolocFlg);
	},
	
	getAddSeparatorButton: function() {
		return "<span><input type=\"button\" id=\"sep\" value=\"Add separator\" />";
	}, 
	
	getClearAllTracksButton: function() {
		return "<input type=\"button\" id=\"del_item\" value=\"Clear all tracks\" name=\"\.\" /></span>";
	}, 
	
	allTruckSetting: function() {
		var m = this;
		$("div" + this.divId + " #right_pop").css("visibility", "hidden");
		
		var allHtmData = {};
		for(var i = 0; i < m.gv.viewerPartsAll.length; i ++) {
			if(m.gv.viewerPartsAll[i].getName() == "separator") continue;
			if(m.gv.viewerPartsAll[i].getAllSettingsData !== undefined) {
				var allSettingsData = m.gv.viewerPartsAll[i].getAllSettingsData(m.divId);
				for(var j = 0; j < allSettingsData.length; j ++) {
					if(allHtmData[allSettingsData[j]["id"]] === undefined) {
						allHtmData[allSettingsData[j]["id"]] = {
							title: allSettingsData[j]["title"],
							html: allSettingsData[j]["html"],
							functionList: []
						};
					}
					allHtmData[allSettingsData[j]["id"]]["functionList"].push(allSettingsData[j]["onChange"]);
				}
			}
		}
		
		var htmlStr = "";
		htmlStr += "<form><div><strong>Configure all tracks</strong></div>";
		htmlStr += "<div class=\"modal_inbox\">";
		htmlStr += "<table border=\"0\" width=\"100%\"><tr><td align=\"center\">";
		htmlStr += "<table border=\"1\">";
		for(var id in allHtmData) {
			htmlStr += "<tr><td>" + allHtmData[id]["title"] + "</td>";
			htmlStr += "<td>" + allHtmData[id]["html"] + "</td>";
			htmlStr += "<td><input type=\"button\" id=\"change_" + id + "\" value=\"Change\" /></td>";
			htmlStr += "</tr>\n";
		}
		htmlStr += "</table>";
		htmlStr += "</td></tr></table></div>";
		htmlStr += "<div class=\"modal_btn\"><input type=\"button\" id=\"cancel_alltrack\" value=\"Cancel\" /></div>";
		htmlStr += "</form>";
		
		$("div" + this.divId + " div#modal div.container").html(htmlStr);
		
		for(var id in allHtmData) {
			$("div" + this.divId + " div#modal div.container #change_" + id).click(function() {
				var functionList = allHtmData[this.id.substr(7)]["functionList"];
				for(var i = 0; i < functionList.length; i ++) {
					functionList[i]();
				}
				m.displayModal(false);
				m.gv.paint();
				return false;
			});
		}
		$("div" + this.divId + " div#modal div.container #cancel_alltrack").click(function() {
			m.displayModal(false);
			return false;
		});
		this.displayModal(true, [400, 300]);
	},
	
	getCookie: function(key) {
		var cook  = document.cookie + ";";
		var place = cook.indexOf(key + "=", 0);
		if(place != -1) {
			var subCook = cook.substring(place, cook.length);
			var start = subCook.indexOf("=", 0) + 1;
			var end   = subCook.indexOf(";", start);
			
			return unescape(subCook.substring(start, end));
		}
		
		return "";
	}, 
	
	//"key" should not have "=" or ";" charactor.
	setCookie: function (key, val) {
		val = String(val);
		if(val.indexOf(";", 0) != -1 || val.indexOf("=", 0) != -1) {
			return false;
		}
		var nowDate = new Date();
		nowDate.setTime(nowDate.getTime() + 10000000000);
		var oneCook = key + "=" + escape(val) + "; ";
		oneCook += "expires=" + nowDate.toGMTString() + ";";
		document.cookie = oneCook;
		
		return true;
	}





};

////////////////////////////////////////////////////////////////////////////////////////////////////
var GenomeViewerCommonData = function() {
	this.loadingData = {};
	this.json = {};
	this.callBackObj = [];
	this.chrData = null;
};
GenomeViewerCommonData.prototype = {
	getLoadingData: function() {
		return this.loadingData;
	},
	getJson: function() {
		return this.json;
	},
	getCallBackObj: function() {
		return this.callBackObj;
	},
	getChrData: function() {
		return this.chrData;
	}
};
////////////////////////////////////////////////////////////////////////////////////////////////////
var POW_REG = 10000;

var GenomeViewer = function(width, height, genome, posStr, divId, viewerPartsData, urlSet, option) {
	this.ochr = null;
	this.divId = divId;
	this.urlSet = urlSet;
	this.option = (option === undefined)? {}: option;
	this.option.itemSwitchFlg = (option.itemSwitchFlg === undefined)? true: option.itemSwitchFlg;
	this.option.autoSizingFlg = (option.autoSizingFlg === undefined)? false: option.autoSizingFlg;
	this.option.toolbarId = (option.toolbarId !== undefined)? option.toolbarId: "tool_bar";
	this.option.viewerId = (option.viewerId !== undefined)? option.viewerId: "viewer_body";
	this.option.ibuttonId = (option.ibuttonId !== undefined)? option.ibuttonId: "items_button";
	this.option.scaleSizingFlg = 
		(option.scaleSizingFlg === undefined)? true: option.scaleSizingFlg;
	this.option.chromSizingFlg = 
		(option.chromSizingFlg === undefined)? true: option.chromSizingFlg;
	this.option.dblclickSizingFlg = 
		(option.dblclickSizingFlg === undefined)? true: option.dblclickSizingFlg;
	if(this.option.boderCss === undefined) this.option.boderCss = 1;
	this.option.itemTrans = (option.itemTrans === undefined)? false: option.itemTrans;
	this.option.edgePreventFlg = (option.edgePreventFlg === undefined)? false: option.edgePreventFlg;
	this.option.linkAdd = (option.linkAdd === undefined)? "": option.linkAdd;
	this.option.locationBarFlg = (option.locationBarFlg === undefined)? true: option.locationBarFlg;
	this.option.uriDirFlg = (option.uriDirFlg === undefined)? false: option.uriDirFlg;
	this.option.chrUriDirFlg = (option.chrUriDirFlg === undefined)? false: option.chrUriDirFlg;
	//this.option.chrBoxCol;
	//option.withCredentials
	//option.showPositionFlg
	//option.showPanelFlg
	//option.commonData
	//option.defaultMode
	//option.initShow
	//option.moveCallback
	
	//for left panel pop-up
	this.panelPopup = {};
	
	//stack number of DB access
	this.accNo = 0;
	
	//All of viewerParts list including non-displaying track (including 'separator')
	this.viewerPartsAll = [];
	for(var i = 0; i < viewerPartsData.length; i ++) {
		if(Array.isArray(viewerPartsData[i])) {
			if(typeof viewerPartsData[i][0] == 'string') continue;
			this.viewerPartsAll.push(viewerPartsData[i][0]);
		} else {
			if(typeof viewerPartsData[i] == 'string') continue;
			this.viewerPartsAll.push(viewerPartsData[i]);
		}
	}
	
	//Y space for display of genome position
	//this.chrBaseY = 10;
	this.chrBaseY = (option.showPositionFlg !== undefined && option.showPositionFlg)? 10: 0;
	this.relYSpace = 15;
	
	//Value of scroll Y
	this.scrollY = 0;
	
	this.width = width;
	this.height = height;
	this.genome = genome;
	
	this.chr = null;
	this.start = null;
	this.end = null;
	this.strand = null;
	
	this.toolBarCss = 
		(this.option.toolBar === undefined)? {padding: 1, height: 20}: 
		(this.option.toolBarCss === undefined)? {padding: 5}: this.option.toolBarCss;
	
	var toolbarSelector = "div" + divId + " #" + this.option.toolbarId;
	
	//apply setting to all same category tracks when setting was changed if settingSyncFlg is true
	var setSyncObj = $(toolbarSelector + " #setting_sync");
	this.settingSyncFlg = (setSyncObj[0])? 
		$(toolbarSelector + " #setting_sync").is(":checked"): false;
	
	if(this.settingSyncFlg) {
		$(toolbarSelector + ' .tools_btn #btn12').css("top", "-20px");
	} else {
		$(toolbarSelector + ' .tools_btn #btn12').css("top", "0px");
	}
	
	
	//With or without display of left pannel
	var itemViewObj = $(toolbarSelector + " #item_view");
	this.itemShowFlg = 
		(itemViewObj[0])? $(toolbarSelector + " #item_view").is(":checked"):
		(option.showPanelFlg !== undefined)? option.showPanelFlg: true;
	
	if(this.itemShowFlg) {
		$(toolbarSelector + ' .tools_btn #btn11').css("left", "-200px");
	} else {
		$(toolbarSelector + ' .tools_btn #btn11').css("left", "-220px");
	}
	
	if(option.commonData === undefined) {
		this.json = {};
		//bin of already loaded data from DB (including on accessing);
		this.loadingData = {};
	} else {
		this.json = option.commonData.getJson();
		this.loadingData = option.commonData.getLoadingData();
		option.commonData.getCallBackObj().push(this);
	}
	
	//mode: nav/info
	this.mode = (option.defaultMode)? option.defaultMode: "nav";
	
	$(toolbarSelector + " input[name='viewer_mode']").val([this.mode]);
	if(this.mode == "info") {
		$(toolbarSelector + ' .tools_btn #btn9').css("top", "-20px");
		$(toolbarSelector + ' .tools_btn #btn10').css("top", "0px");
	 } else {
		$(toolbarSelector + ' .tools_btn #btn9').css("top", "0px");
		$(toolbarSelector + ' .tools_btn #btn10').css("top", "-20px");
	 }
	
	//Popup data for info-mode
	this.infoData = {};
	
	//preparation of HTML
	$(toolbarSelector)
		.css("white-space", "nowrap")
		.css("padding", this.toolBarCss.padding)
		.css("width", this.width + this.option.boderCss * 2 - this.toolBarCss.padding * 2)
		.css("background-color", "gray");
	if(this.toolBarCss.height !== undefined) {
		$(toolbarSelector).css("height", this.toolBarCss.height);
	}
	$(toolbarSelector + " #db_name").css("height", "30");
	//$(toolbarSelector + " #genome_position")
	//	.css("height", "25");
	//	.val(chr + ":" + start + "-" + end);
	$(toolbarSelector + " #genome_position").val(posStr);
	//$(toolbarSelector + " #go_button")
	//	.css("width", "30")
	//	.css("height", "40");
	$("div" + divId + " #" + this.option.viewerId).append("<canvas id=\"main_viewer\" width=\"" 
		+ this.width + "\" height=\"" + this.height + "\">Sorry. Unsupported browser</canvas>");
	$("div" + divId + " #" + this.option.viewerId + " #main_viewer").css("border", this.option.boderCss + "px solid");
	
	//var newDiv = document.createElement('div');
	
	//Object for chromosome display
	if(this.option.showChromFlg) 
		this.ochr = new WgChr(this, this.urlSet.additionalParam, 
			this.chrBaseY, this.relYSpace, genome, 
			{
				withCredentials: this.option.withCredentials, 
				chrBoxCol: this.option.chrBoxCol,
				chrUriDirFlg: this.option.chrUriDirFlg,
				chrData: this.option.chrData
			}
		);
	
	//Object list of displaying track
	this.viewerParts = [];
	
	this.initViewer();
	
	var m = this;
	
	//For Error viewer parts
	//Because automatic error canceller is none, You need set "this.errorParts = {};" if you want to cancel.
	this.errorParts = {};
	
	if(this.option.itemSwitchFlg) {
		var setCols = [];
		var htmlStr = "";
		
		htmlStr += "<div id=\"" + this.option.ibuttonId + "\">";
		if(!this.option.defBtnHideFlg) {
			htmlStr += "<span><input type=\"button\" id=\"sep\" value=\"Add separator\" />";
			htmlStr += "<input type=\"button\" id=\"del_item\" value=\"Clear all tracks\" name=\"\.\" /></span>";
		}
		//htmlStr += "<input type=\"button\" id=\"show_item\" value=\"Show all items\" name=\"Gap|CpG\" />";
		for(var i = 0; i < viewerPartsData.length; i ++) {
			var targetData = [];
			if(Array.isArray(viewerPartsData[i])) {
				targetData = viewerPartsData[i];
			} else {
				targetData = [viewerPartsData[i], false];
			}
			if(typeof targetData[0] == 'string') {
				if(!this.option.trackBtnHideFlg) htmlStr += targetData[0];
				continue;
			}
			var partsId = targetData[0].getName();
			var dispName = targetData[0].getItemDispName();
			var buttonInfo = targetData[0].getButtonInfo();
			
			if(partsId != "separator" && !this.option.trackBtnHideFlg) {
				if(buttonInfo.onOff) {
					var onOff = (targetData[1])? "on": "off";
					htmlStr += "<input class=\"track_button\" type=\"button\" id=\"" + partsId + "\" value=\"" + onOff + "\" />";
				} else {
					htmlStr += "<input class=\"track_button\" type=\"button\" id=\"" + partsId + "\" value=\"" + dispName + "\" />";
				}
			}
			if(targetData[1]) {
				this.viewerParts.push(targetData[0]);
				//if(partsId != "separator") htmlStr += "<input type=\"button\" id=\"" + partsId + "\" value=\"" + dispName + "\" disabled=\"disabled\" />";
				var col = buttonInfo.color[1];
				if(partsId != "separator") setCols.push([partsId, col]);
			} else {
				//if(partsId != "separator") htmlStr += "<input type=\"button\" id=\"" + partsId + "\" value=\"" + dispName + "\" />";
				var col = buttonInfo.color[0];
				if(partsId != "separator") setCols.push([partsId, col]);
			}
		}
		htmlStr += "</div>";
		
		if($("div" + divId + " #" + this.option.btnSpaceId)[0]) {
			if($("div" + divId + " #" + this.option.viewerId)[0]) {
				//comparative表示の場合のボタン表示
				//(viewerIdの存在もチェックするのはcomparative表示前に
				//表示を切った場合にボタンの表示が残ってしまうのを避けるため)
				$("div" + divId + " #" + this.option.btnSpaceId).html(htmlStr);
			}
		} else {
			$("div" + divId).append(htmlStr);
		}
		
		for(var i = 0; i < setCols.length; i ++) {
			$("div" + divId + " #" + this.option.ibuttonId + 
				" #" + setCols[i][0]).css("background-color", "#" + setCols[i][1]);
		}
		
	} else {
		for(var i = 0; i < viewerPartsData.length; i ++) {
			if(Array.isArray(viewerPartsData[i]) && viewerPartsData[i][1]) {
				this.viewerParts.push(viewerPartsData[i][0]);
			}
		}
	}
	
	if(this.option.onresizeSetWidth) {
		window.onresize = function () {
			var setWidth = m.option.onresizeSetWidth();
			m.setViewerSize(setWidth, m.height);
		};
	}
	
	$("div" + divId + " #" + this.option.ibuttonId + " #sep").click(function() {
		//var Math.random() * 128;
		var oseparator = new WgSeparator(3, "#777777");
		oseparator.setImgJson(m.mCc);
		m.viewerPartsAll.push(oseparator);
		//m.viewerParts.unshift(oseparator);
		m.viewerParts.push(oseparator);
		m.paint();
		return false;
	});
	$("div" + divId + " #" + this.option.ibuttonId + " #del_item").click(function() {
		var re = new RegExp(this.name);
		for(var i = 0; i < m.viewerPartsAll.length; i ++) {
			
			var partsId = m.viewerPartsAll[i].getName();
			var dispName = m.viewerPartsAll[i].getItemDispName();
			if(dispName.match(re)) {
				for(var j = 0; j < m.viewerParts.length; j ++) {
					if(partsId == m.viewerParts[j].getName()) {
						m.deleteViwerParts(j);
						break;
					}
				}
			}
		}
		if("separator".match(re)) {
			var newViewerPartsAll = [];
			for(var i = 0; i < m.viewerPartsAll.length; i ++) {
				if(m.viewerPartsAll[i].getName() != "separator") {
					newViewerPartsAll.push(m.viewerPartsAll[i]);
					//alert(i);
				}
			}
			m.viewerPartsAll = newViewerPartsAll;
		}
		
		m.paint();
		return false;
	});
	$("div" + divId + " #" + this.option.ibuttonId + " #show_itemid").click(function() {
		var itemidList = this.name.split("|");
		var itemidHash = [];
		for(var i = 0; i < itemidList.length; i ++) {
			itemidHash[itemidList[i]] = true;
		}
		var addPartsI = [];
		for(var i = 0; i < m.viewerPartsAll.length; i ++) {
			
			var partsId = m.viewerPartsAll[i].getName();
			if(itemidHash[partsId] && partsId != "separator") {
				var findFlg = false;
				for(var j = 0; j < m.viewerParts.length; j ++) {
					if(partsId == m.viewerParts[j].getName()) {
						findFlg = true;
						break;
					}
				}
				if(!findFlg) addPartsI.push(i);
			}
		}
		
		for(var i = 0; i < addPartsI.length; i ++) {
			m.addViwerParts(addPartsI[i], true);
		}
		
		m.paint();
		return false;
	});
	$("div" + divId + " #" + this.option.ibuttonId + " #hide_itemid").click(function() {
		var itemidList = this.name.split("|");
		var itemidHash = [];
		for(var i = 0; i < itemidList.length; i ++) {
			itemidHash[itemidList[i]] = true;
		}
		
		var delFlg = true;
		while(delFlg) {
			delFlg = false;
			var i = 0;
			for(; i < m.viewerParts.length; i ++) {
				var partsId = m.viewerParts[i].getName();
				if(itemidHash[partsId] && dispName != "separator") {
					delFlg = true;
					break;
				}
			}
			if(delFlg) {
				m.deleteViwerParts(i);
			}
		}
		m.paint();
		return false;
	});
	
	$("div" + divId + " #" + this.option.ibuttonId + " #show_item").click(function() {
		m.showItemFromButtonClick(this.name);
		return false;
	});
	$("div" + divId + " #" + this.option.ibuttonId + " #hide_item").click(function() {
		m.hideItemFromButtonClick(this.name);
		return false;
	});
	
	for(var i = 0; i < viewerPartsData.length; i ++) {
		var targetData;
		if(Array.isArray(viewerPartsData[i])) {
			targetData = viewerPartsData[i][0];
		} else {
			targetData = viewerPartsData[i];
		}
		if(typeof targetData == 'string') continue;
		
		var partsId = targetData.getName();
		$("div" + divId + " #" + this.option.ibuttonId + " #" + partsId).click(function() {
			//this.attr(id);
			var nowId = $(this).attr("id");
			//$("div" + divId + " #" + this.option.ibuttonId + " #" + nowId).attr('disabled', true);
			for(var j = 0; j < m.viewerPartsAll.length; j ++) {
				if(m.viewerPartsAll[j].getName() == nowId) {
					var separatorFlg = (m.viewerPartsAll[j].comparaFlg)? false: true;
					m.addViwerParts(j, separatorFlg);
					
					break;
				}
			}
			m.paint();
			return false;
		});
	}
	
	//this.paint();
	
	this.startX;
	//For moving time
	this.renderStartX;
	
	$(toolbarSelector + " #setting_sync").on("change", function() {
		if($(this).is(":checked")) {
			m.settingSyncFlg = true;
		} else {
			m.settingSyncFlg = false;
		}
	});
	
	$(toolbarSelector + " #sync_button").click(function() {
		if(m.settingSyncFlg) {
			m.settingSyncFlg = false;
			$(toolbarSelector + ' .tools_btn #btn12').css("top", "0px");
		} else {
			m.settingSyncFlg = true;
			$(toolbarSelector + ' .tools_btn #btn12').css("top", "-20px");
		}
		return false;
	});
	
	$(toolbarSelector + " #item_view").on("change", function() {
		if($(this).is(":checked")) {
			m.itemShowFlg = true;
			m.paint();
		} else {
			m.itemShowFlg = false;
			m.paintRender(0);
		}
	});
	
	$(toolbarSelector + " #panel_button").click(function() {
		if(m.itemShowFlg) {
			m.itemShowFlg = false;
			$(toolbarSelector + ' .tools_btn #btn11').css("left", "-220px");
			m.paintRender(0);
		} else {
			m.itemShowFlg = true;
			$(toolbarSelector + ' .tools_btn #btn11').css("left", "-200px");
			m.paint();
		}
		return false;
	});
	
	$(toolbarSelector + " input[name='viewer_mode']").change(function() {
		m.mode = $("div" + divId + " input[name='viewer_mode']:checked").val();
		if(m.mode == "info") {
			m.infoData = m.getPopupInfoData();
		}
		//切り替えのとき背景色を塗り替えるためpaint
		m.paint();
	});
	
	$(toolbarSelector + " #info_button").click(function() {
		if(m.mode != "info") {
			m.mode = "info";
			$(toolbarSelector + ' .tools_btn #btn9').css("top", "-20px");
			$(toolbarSelector + ' .tools_btn #btn10').css("top", "0px");
			m.infoData = m.getPopupInfoData();
			m.paint();
		}
		return false;
	});
	
	$(toolbarSelector + " #nav_button").click(function() {
		if(m.mode == "info") {
			m.mode = "nav";
			$(toolbarSelector + ' .tools_btn #btn9').css("top", "0px");
			$(toolbarSelector + ' .tools_btn #btn10').css("top", "-20px");
			m.paint();
		}
		return false;
	});
	
	var name2i = {};
	for(var i = 0; i < this.viewerPartsAll.length; i ++) {
		var name = this.viewerPartsAll[i].getName();
		name2i[name] = i;
	}
	if(this.option.browserId != "" && this.getCookie(this.option.browserId + "|")) {
		var showData = this.getCookie(this.option.browserId + "|").split("|");
		//addViewerPartsで再設定されるのでCookieの消去を行う
		this.setCookie(this.option.browserId + "|", "");
		for(var i = 0; i < showData.length; i++) {
			var partsName = showData[i];
			if(partsName == "separator") continue;
			if(name2i[partsName] === undefined) continue;
			
			var target = name2i[partsName];
			var separatorFlg = 
				(showData[i + 1] !== undefined && showData[i + 1] == "separator")? true: false;
			
			this.addViwerParts(target, separatorFlg);
		}
	} else if(option.initShow !== undefined) {
		for(var i = 0; i < option.initShow.length; i++) {
			var separatorFlg = true;
			var target = option.initShow[i];
			if(isNaN(target)) {
				if(name2i[target[0]] === undefined) continue;
				
				separatorFlg = target[1];
				target = name2i[target[0]];
				
			}
			//var separatorFlg = (this.viewerPartsAll[target].comparaFlg)? false: true;
			this.addViwerParts(target, separatorFlg);
		}
	}
	
	
	if(this.option.toolBar === undefined) {
		//tool barのボタンのマウスオーバーアクションの設定
		$(toolbarSelector).css("position", "relative");
		var toolActDataList = [
			["menu_button", -3, "btn1", "Menu"], 
			["go_button", 215, "btn2", "Search"], 
			["big5", 230, "btn3", "x5 Zoom in"], 
			["big", 250, "btn4", "x2 Zoom in"], 
			["bigm", 270, "btn5", "x1.5 Zoom in"], 
			["smallm", 280, "btn6", "x2/3 Zoom out"], 
			["small", 300, "btn7", "x1/2 Zoom out"], 
			["small5", 320, "btn8", "x1/5 Zoom out"], 
			["info_button", 370, "btn9", "Info mode"], 
			["nav_button", 380, "btn10", "Browse mode"], 
			["panel_button", 390, "btn11", "Left panel (on/off)"], 
			["sync_button", 370, "btn12", "Synchronize track settings (on/off)"], 
		];
		for(var i = 0; i < toolActDataList.length; i ++) {
			(function() {
				var toolActData = toolActDataList[i];
				$(toolbarSelector + " #" + toolActData[0]).hover(function(){
					if(toolActData[2] == "btn11") {
						var px = (m.itemShowFlg)? -220: -200;
						$(toolbarSelector + ' .tools_btn #btn11').css("left", px + "px");
					} else {
						var px = (toolActData[2] == "btn12" && m.settingSyncFlg)? 0: -20;
						$(toolbarSelector + " .tools_btn #" + toolActData[2]).css("top", px + "px");
					}
					
					$(toolbarSelector).append("<span id=\"pop\">" + toolActData[3] + "</span>");
					$(toolbarSelector + " #pop")
						.css("position", "absolute")
						.css("left", toolActData[1] + "px")
						.css("top", "-25px")
						.css("background", "#666666")
						.css("color", "#ffffff")
						.css("font-size", "15px")
						.css("padding", "3px");
					
					return false;
				}, function(){
					if(toolActData[2] == "btn11") {
						var px = (m.itemShowFlg)? -200: -220;
						$(toolbarSelector + ' .tools_btn #btn11').css("left", px + "px");
					} else {
						var px;
						if(
							(toolActData[2] != "btn9" && toolActData[2] != "btn10" && toolActData[2] != "btn12") || 
							(toolActData[2] == "btn9" && m.mode != "info") || 
							(toolActData[2] == "btn10" && m.mode == "info") || 
							(toolActData[2] == "btn12" && !m.settingSyncFlg)
						) {
							px = 0;
						} else if(toolActData[2] == "btn12" && m.settingSyncFlg) {
							px = -20;
						}
						if(px !== undefined) $(toolbarSelector + " .tools_btn #" + toolActData[2]).css("top", px + "px");
					}
					$(toolbarSelector + " #pop").remove();
					return false;
				});
			})();
		}
		
		//menuボタンをクリックしたとき
		$(toolbarSelector + ' #menu_button').click(function(e){
			var wx = 100;
			var wy = 100;
			//var off = $(toolbarSelector + ' #menu_button').offset();
			var btnHeight = $(toolbarSelector + ' #menu_button').outerHeight(true);
			if($(toolbarSelector + " #down_menu").css("visibility") == "hidden") {
				var downMenuStr = "";
				downMenuStr += "<div id=\"track\">Track...</div>";
				downMenuStr += "<div id=\"save_img\">Save image</div><hr />";
				downMenuStr += "<div id=\"setting\">Settings...</div><hr />";
				downMenuStr += "<div id=\"help\"><a href=\"https://dbtss.hgc.jp/demo/genome_browser_docs/help/\" target=\"_blank\">Help</a></div>";
				downMenuStr += "<div id=\"about\">About</div>";
				downMenuStr += "<form action=\"https://dbtss.hgc.jp/cgi-bin/return_img.cgi\" method=\"POST\" name=\"post_img\" id=\"post_img\">";
				downMenuStr += "<input type=\"hidden\" name=\"imagedata\" value=\"\">";
				downMenuStr += "<input type=\"hidden\" name=\"filename\" value=\"kero_viewer.png\">";
				downMenuStr += "</form>";
				$(toolbarSelector + " #down_menu").html(downMenuStr);
				$(toolbarSelector + " #down_menu")
					.css("top", btnHeight + 2)
					.css("border", "solid 1px")
					.css("background-color", "#FFFFFF")
					.css("color", "#000000")
					.css("border-radius", "1px")
					.css("padding", "5px")
					.css("box-shadow", "5px 5px 5px 0px rgba(200,200,200,0.8)")
					.css("visibility", "visible");
				
				var menuItems = ["track", "save_img", "setting", "help", "about"];
				for(var i = 0; i < menuItems.length; i ++) {
					(function() {
						var menuItem = menuItems[i];
						$(toolbarSelector + " #down_menu #" + menuItem).hover(function(){
							$(toolbarSelector + " #down_menu #" + menuItem).css("background-color", "gray");
						}, function(){
							$(toolbarSelector + " #down_menu #" + menuItem).css("background-color", "white");
						});
					})();
				}
				$(toolbarSelector + ' #down_menu #save_img').click(function(){
					var canvas = $("div" + divId + " #" + m.option.viewerId + " #main_viewer")[0];
					var image_data = canvas.toDataURL("image/png");
					image_data = image_data.replace(/^.*,/, '');
					var form = $(toolbarSelector + " #down_menu #post_img")[0];;
					form.imagedata.value = image_data;
					form.submit();
					return false;
				});
				$(toolbarSelector + ' #down_menu #about').click(function(){
					$(toolbarSelector + ' #movable_title').html("About kero_browse.js");
					$(toolbarSelector + ' #content').html(VERSION);
					$(toolbarSelector + ' #movable_menu').css({top: wx, left: wy}).fadeIn(100);
					$(toolbarSelector + " #down_menu").css("visibility", "hidden");
					return false;
				});
				$(toolbarSelector + ' #down_menu #track').click(function(){
					$(toolbarSelector + ' #movable_title').html("Tracks");
					var trackStr = "";
					trackStr += "<div id=\"list_line\"><table><tr><td width=\"10\"><span id=\"list\">+</span></td><td>List</td></tr></table></div>";
					trackStr += "<div id=\"list_content\" style=\"display: none; padding: 10px\">";
					trackStr += "loading...";
					trackStr += "</div><hr />";
					trackStr += "<div id=\"localfile_line\"><table><tr><td width=\"10\"><span id=\"localfile\">+</span></td><td>Local files (bigWig or bam,bai)</td></tr></table></div>";
					trackStr += "<div id=\"localfile_content\" style=\"display: none; padding: 10px\">";
					trackStr += "<div>Using your local PC files (without uploading)</div>";
					trackStr += "<div><input type=\"file\" id=\"files\" name=\"file\" multiple /> ";
					trackStr += "<input type=\"button\" value=\"Add local BAM(.bam and .bai) or bigWig(.bw) track\" id=\"add_bam\" /></div>";
					trackStr += "</div>";
					
					$(toolbarSelector + ' #content').html(trackStr);
					$(toolbarSelector + ' #movable_menu').css({top: wx, left: wy}).fadeIn(100);
					$(toolbarSelector + " #down_menu").css("visibility", "hidden");
					$(toolbarSelector + ' #localfile_line').off("click");
					$(toolbarSelector + ' #localfile_line').on("click", function(){
						var mp = ($(toolbarSelector + " #localfile").html() == "+")? "-": "+";
						$(toolbarSelector + " #localfile").html(mp);
						$(toolbarSelector + " #localfile_content").slideToggle("normal", function() {});
						return false;
					});
					$(toolbarSelector + ' #localfile_line').hover(function(){
						$(toolbarSelector + ' #localfile_line').css("background-color", "#BBBBBB");
					}, function(){
						$(toolbarSelector + ' #localfile_line').css("background-color", "#DDDDDD");
					});
					
					$(toolbarSelector + ' #list_line').off("click");
					$(toolbarSelector + ' #list_line').on("click", function(){
						var mp = ($(toolbarSelector + " #list").html() == "+")? "-": "+";
						$(toolbarSelector + " #list").html(mp);
						$(toolbarSelector + " #list_content").slideToggle("normal", function() {
							if($(toolbarSelector + " #list_content").html() == "loading...") {
								var checkListStr = "";
								for(var i = 0; i < m.viewerPartsAll.length; i ++) {
									var partsId = m.viewerPartsAll[i].getName();
									var dispName = m.viewerPartsAll[i].getItemDispName();
									if(partsId != "separator") {
										checkListStr += "<div><input type=\"checkbox\" id=\"chkw_" + partsId + "\" /><label for=\"" + partsId + "\">" + dispName + "</label></div>";
									}
								}
								$(toolbarSelector + " #list_content").html(checkListStr);
								for(var i = 0; i < m.viewerParts.length; i ++) {
									var partsId = m.viewerParts[i].getName();
									$(toolbarSelector + " #chkw_" + partsId).prop('checked', "checked");
								}
								for(var i = 0; i < m.viewerPartsAll.length; i ++) {
									var partsId = m.viewerPartsAll[i].getName();
									$(toolbarSelector + " #chkw_" + partsId).change(function() {
										var nowId = $(this).attr("id").substr(5);
										var noSeparatorFlg = (nowId.substr(0, 12) == "comparative_")? true: false;
										//trackが追加or削除され、なおかつonTrackAction()が呼ばれる
										m.changeTrack(nowId, noSeparatorFlg);
									});
								}
							}
						});
						return false;
					});
					$(toolbarSelector + ' #list_line').hover(function(){
						$(toolbarSelector + ' #list_line').css("background-color", "#BBBBBB");
					}, function(){
						$(toolbarSelector + ' #list_line').css("background-color", "#DDDDDD");
					});
					
					$(toolbarSelector + " #add_bam").off("click");
					$(toolbarSelector + " #add_bam").on("click", function() {
						var files = $("#files")[0].files;
						if (files.length != 1 && files.length != 2) {
							alert('Please select a ".bw" file OR ".bam" and ".bai" files!');
							return;
						}
						
						var fileBai = files[0];
						var fileBam = files[1];
						var type;
						
						if(fileBai.name.substr(-4) == ".bam" && fileBam.name.substr(-4) == ".bai") {
							type = "bam";
							var temp = fileBai; fileBai = fileBam; fileBam = temp;
						} else if(fileBai.name.substr(-4) == ".bai" && fileBam.name.substr(-4) == ".bam") {
							type = "bam";
						} else if(fileBai.name.substr(-3) == ".bw") {
							type = "bw";
						} else {
							alert('Please select a ".bw" file OR ".bam" and ".bai" files!');
							return;
						}
						
						var addPartsSccFlg = false;
						var num = 1;
						while(!addPartsSccFlg) {
							var id = "your_" + type;
							if(num != 1) {
								id += "_" + num;
							}
							var bam = (type == "bam")? 
								new WgBam2(id, id, [fileBam, fileBai], {"localFlg": true, "seqUrl": null}):
								new WgBigWig2(id, "#008844", id, fileBai, {"localFlg": true});
							try {
								m.addCreateParts(bam);
								m.changeTrack(id);
								addPartsSccFlg = true;
							} catch(e) {
								num ++;
								addPartsSccFlg = false;
							}
						}
					});
					return false;
				});
				$(toolbarSelector + ' #down_menu #setting').click(function(){
					$(toolbarSelector + ' #movable_title').html("Browser settings");
					var contentStr = "";
					contentStr += "<div style=\"white-space: nowrap\">";
					contentStr += "W<input id=\"viewer_width\" size=\"4\" maxlength=\"4\" type=\"text\">";
					contentStr += "x H<input id=\"viewer_height\" size=\"4\" maxlength=\"4\" type=\"text\">";
					contentStr += "<input id=\"change_size\" class=\"tool_button\" value=\"Change size\" type=\"button\">";
					contentStr += "</div>";
					$(toolbarSelector + ' #content').html(contentStr);
					$(toolbarSelector + " #viewer_width").val(m.width);
					$(toolbarSelector + " #viewer_height").val(m.height);
					$(toolbarSelector + ' #movable_menu').css({top: wx, left: wy}).fadeIn(100);
					$(toolbarSelector + " #down_menu").css("visibility", "hidden");
					$(toolbarSelector + " #change_size").off("click");
					$(toolbarSelector + " #change_size").on("click", function() {
						var vwidth = Math.floor($("div" + divId + " #viewer_width").val());
						var height = Math.floor($("div" + divId + " #viewer_height").val());
						if(isNaN(height)) height = 200;
						if(vwidth < 200) vwidth = 200;
						if(height < 200) height = 200;
						if(vwidth > 2000) vwidth = 2000;
						if(height > 2000) height = 2000;
						m.setCookie("viewerWidth", vwidth);
						m.setCookie("viewerHeight", height);
						m.setViewerSize(vwidth, height);
						return false;
					});
					return false;
				});
				$(toolbarSelector + ' #movable_close').click(function() {
					$(toolbarSelector + ' #movable_menu').fadeOut(100);
					return false;
				});
				$(toolbarSelector + ' #movable_title').mousedown(function(e) {
					var mx = e.pageX;
					var my = e.pageY;
					$(document).on('mousemove.movable_menu', function(e) {
						wx += e.pageX - mx;
						wy += e.pageY - my;
						$(toolbarSelector + ' #movable_menu').css({top: wy, left: wx});
						mx = e.pageX;
						my = e.pageY;
						return false;
					}).one('mouseup', function(e) {
						$(document).off('mousemove.movable_menu');
					});
					return false;
				});
				$(document).on({
					click: function(e){
						$(toolbarSelector + " #down_menu").css("visibility", "hidden");
						$(document).unbind("click");
						//return false;
					}
				});
			} else {
				$(toolbarSelector + " #down_menu").css("visibility", "hidden");
			}
			return false;
		});
	}
};

GenomeViewer.prototype = {
	//mvFlgはマウスを動かしたときのFlagに使用
	paint: function(err, mvFlg) {
		if(this.start > this.end) {
			throw Error("invalid genome position.");
		}
		if(this.genome[this.chr] === undefined) return;
		
		//Display for buffer screen of chromosome
		if(this.option.showChromFlg) this.ochr.paint(this.chr, this.start, this.end, this.strand);
		
		//Display for buffer screen of mainView
		this.setMHeight();
		
		if(this.mHeight > MAX_HEIGHT) {
			console.log("too large");
			this.mHeight = MAX_HEIGHT;
		}
		
		if(this.mCanvas === undefined) {return;}
		var width3 = this.width * 3;
		this.mCanvas.height = this.mHeight;
		this.mCc.clearRect(0, 0, width3, this.mHeight);
		var chrScaHeight = this.cCanvas.height + this.lCanvas.height;
		if(this.scrollY + this.height - chrScaHeight > this.mCanvas.height) 
			this.scrollY = this.mCanvas.height - this.height + chrScaHeight;
		if(this.scrollY < 0) this.scrollY = 0;
		
		if(this.mode == "info") this.infoData = this.getPopupInfoData();
		
		var margin = this.end - this.start + 1;
		var start3 = this.start - margin;
		var end3 = this.end + margin;
		
		//Display for scale
		if(this.option.showScaleFlg) {
			this.lCc.clearRect(0, 0, width3, this.lCanvas.height);
			this.oscale.paint(0, width3, 
				this.chr, start3, end3, this.strand);
		}
		
		if(this.option.jsonMax !== undefined) {
			//for garbage collection
			this.attachNowtime(width3, this.chr, start3, end3);
			this.cutOldJson();
		}
		
		var paintStatus = {};
		var name2obj = {};
		
		var nowY = 0;
		for(var i = 0; i < this.viewerParts.length; i ++) {
			//status will be set when data is not loaded yet.
			var status = this.viewerParts[i].repaint(nowY, width3, this.chr, 
				start3, end3, this.strand, this.option.bgVlineFlg, this.mode);
			
			var partsName = this.viewerParts[i].getKindName();
			if(status.length && this.errorParts[partsName] === undefined) {
				paintStatus[partsName] = status;
				name2obj[partsName] = this.viewerParts[i];
			}
			if(err !== undefined && partsName in err[1]) this.errorParts[partsName] = err[0];
			if(this.errorParts[partsName] !== undefined) {
				this.mCc.font = "10px 'Helvetica'";
				var strWidth = this.mCc.measureText(this.errorParts[partsName]).width;
				this.mCc.fillStyle = "#FF0000";
				this.mCc.fillText(this.errorParts[partsName], 
					this.width * 1.5 - strWidth / 2, nowY + 10);
			}
			
			nowY += this.viewerParts[i].getHeight();
		}
		if(this.mHeight == MAX_HEIGHT) {
			this.mCc.fillStyle = "#CCCCCC";
			this.mCc.fillRect(0, this.mHeight - 30, width3, 30);
			var str = "Some of data could not show because of the too large image height.";
			this.mCc.font = "10px 'Helvetica'";
			this.mCc.fillStyle = "#FF0000";
			var strWidth = this.mCc.measureText(str).width;
			this.mCc.fillText(str, this.width * 1.5 - strWidth / 2, this.mHeight - 10);
		}
		
		
		//Display for left pannel.
		if(this.itemShowFlg) {
			var itemWidth = this.iCanvas.width;
			this.iCanvas.height = this.mHeight;
			this.iCc.clearRect(0, 0, itemWidth, this.mHeight);
			
			if(!this.option.itemTrans) {
				this.iCc.fillStyle = "#AAAAAA";
				this.iCc.fillRect(itemWidth - 3, 0, 3, this.mHeight);
				this.iCc.fillRect(0, 0, 3, this.mHeight);
			}
			var nowPY = 0;
			for(var i = 0; i < this.viewerParts.length; i ++) {
				var partsHeight = this.viewerParts[i].getHeight();
				if(partsHeight == 0) continue;
				
				var type = this.viewerParts[i].getName();
				var dispName = this.viewerParts[i].getItemDispName();
				var aboidingSpace = this.viewerParts[i].getAboidingLeftPanelSpace();
				
				this.iCc.fillStyle = this.viewerParts[i].getPannelBgcolor();
				if(!this.option.itemTrans) {
					//this.iCc.globalAlpha = 0.8;
					this.iCc.globalAlpha = 0.95;
					this.iCc.fillRect(3, nowPY, itemWidth - 6, partsHeight);
					this.iCc.globalAlpha = 1;
					
					this.iCc.font = "12px 'NSimSun'";
					//Charactor number of a line
					//var lineNum = 15;
					var lineNum = Math.floor((this.iCanvas.width - 10 - aboidingSpace) / 6);
					if(lineNum > 1) {
						var stepNum = Math.floor((dispName.length + (lineNum - 1)) / lineNum);
						//var strWidth = this.iCc.measureText(dispName).width;
						//var strHeight = this.iCc.offsetHeight;
						
						if(type != "separator") {
							this.iCc.fillStyle = this.viewerParts[i].getLabelCol();
							
							for(var j = 0; j < stepNum; j ++) {
								var y1 = nowPY + partsHeight / 2 + 3 + (j - (stepNum - 1) / 2) * 10;
								this.iCc.fillText(dispName.substr(j * lineNum, lineNum), 5, y1);
							}
						}
					}
				}
				
				if(this.viewerParts[i].paintVScale !== undefined) {
					this.viewerParts[i].paintVScale(this.iCc, this.iCanvas.width);
				}
				
				nowPY += partsHeight;
			}
		}
		
		//Reset mouse moving status for avoiding screen unbalance
		//(When comment out, mouse moving will be smooth.)
		//this.mousedownType = "";
		//Display to front
		this.paintRender(0);
		
		//Addition of lack data
		var binStart, binEnd;
		var kindList = [];
		for(var kind in paintStatus) {
			if(paintStatus[kind] == "err") continue;
			for(var j = 0; j < paintStatus[kind].length; j ++) {
				var bin = paintStatus[kind][j];
				var pow = Math.floor(Math.LOG10E * Math.log((this.end - this.start + 1) / this.width));
				if(pow < 0) pow = 0;
				
				var reg = Math.pow(10, pow) * POW_REG;
				var genomeEndBin = Math.floor((this.genome[this.chr][1] - 1) / reg);
				//染色体の範囲を超える場合nullデータを入れてスキップ
				if(bin > genomeEndBin) {
					if(!(pow in this.json)) this.json[pow] = {};
					var binStr = this.chr + "|" + bin;
					if(!(binStr in this.json[pow])) this.json[pow][binStr] = {};
					this.json[pow][binStr][kind] = [];
					continue;
				}
				
				//既にロードしようとしているデータの場合スキップ
				if(this.loadingData[pow + "|" + this.chr + "|" + bin + "|" + kind]) continue;
				if(binStart === undefined) {
					binStart = bin;
					binEnd = bin;
				} else {
					if(binStart > bin) binStart = bin;
					if(binEnd < bin) binEnd = bin;
				}
				kindList.push(kind);
			}
		}
		if(binStart !== undefined) {
			var name2accObj = {};
			var existKind = {};
			for(var i = 0; i < kindList.length; i ++) {
				var kind = kindList[i];
				if(kind == "sequence") {
					if(this.end - this.start + 1 < this.width) {
						name2accObj[kind] = name2obj[kind];
					}
				} else {
					if(!(kind in existKind)) {
						name2accObj[kind] = name2obj[kind];
						existKind[kind] = 1;
					}
				}
			}
			var pow = Math.floor(Math.LOG10E * Math.log((this.end - this.start + 1) / this.width));
			if(pow < 0) pow = 0;
			this.accessData(this.chr, binStart, binEnd, pow, name2accObj);
		}
		
		if(this.option.moveCallback !== undefined) {
			var strand = (this.strand == "-" || this.strand == "-1")? "-": "+";
			var param = {
				chr: this.chr,
				start: this.start,
				end: this.end, 
				strand: strand
			};
			this.option.moveCallback(param, mvFlg);
		}
	},
	
	paintRender: function(mv, type, prm1, prm2) {
		if(this.genome[this.chr] === undefined) return;
		
		this.cc.clearRect(0, 0, this.width, this.height);
		//染色体画面
		if(this.option.showChromFlg) {
			this.cc.drawImage(this.cCanvas, 0, 0);
			var x1 = (this.width - 1) * (this.start - 1) / (this.genome[this.chr][1] - 1);
			var x2 = (this.width - 1) * (this.end - 1) / (this.genome[this.chr][1] - 1);
			var y1 = (this.cCanvas.height - this.chrBaseY - this.relYSpace) / 2 + 
				this.chrBaseY - 6;
			var y2 = (this.cCanvas.height - this.chrBaseY - this.relYSpace) / 2 + 
				this.chrBaseY + 6;
			this.cc.strokeStyle = "#FF0000";
			this.cc.strokeRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
		}
		
		//スケール画面
		if(this.option.showScaleFlg) 
			this.cc.drawImage(this.lCanvas, mv - this.width, this.cCanvas.height);
		
		var chrScaHeight = this.cCanvas.height + this.lCanvas.height;
		
		//ボディー画面
		//this.cc.drawImage(this.mCanvas, mv - this.width, chrScaHeight);
		//描写画像がある場合(this.mCanvas.height - this.scrollY > 0)
		if(this.mCanvas.height - this.scrollY > 0) {
			this.cc.drawImage(this.mCanvas, 0, this.scrollY, this.mCanvas.width, this.mCanvas.height - this.scrollY, 
				mv - this.width, chrScaHeight, this.mCanvas.width, this.mCanvas.height - this.scrollY);
			
			//左項目
			if(this.itemShowFlg) {
				if(type == "pedge") {
					this.cc.fillStyle = "#EEEEEE";
					this.cc.globalAlpha = 0.8;
					var y1 = this.height - chrScaHeight;
					if(this.mHeight < y1) y1 = this.mHeight;
					this.cc.fillRect(0, chrScaHeight, prm1, y1);
					this.cc.globalAlpha = 1;
					this.cc.strokeStyle = "#880000";
					this.cc.strokeRect(prm1 - 2, chrScaHeight, 1, y1);
				} else {
					this.cc.drawImage(this.iCanvas, 0, this.scrollY, this.iCanvas.width, this.iCanvas.height - this.scrollY, 
						0, chrScaHeight, this.iCanvas.width, this.iCanvas.height - this.scrollY);
				}
			}
		}
		
		//バー・項目セパレーター等
		if(type == "scale") {
			this.cc.strokeStyle = "#880000";
			if(prm2 !== undefined) {
				if(prm1 > prm2) {
					var tmp = prm2; prm2 = prm1; prm1 = tmp;
				}
				this.cc.strokeRect(prm1, this.cCanvas.height, prm2 - prm1, this.height - this.cCanvas.height);
			} else {
				this.cc.strokeRect(prm1, this.cCanvas.height, 1, this.height - this.cCanvas.height);
			}
		} else if(type == "chromosome") {
			this.cc.strokeStyle = "#880000";
			if(prm2 !== undefined) {
				if(prm1 > prm2) {
					var tmp = prm2; prm2 = prm1; prm1 = tmp;
				}
				var tmpX = (this.cCanvas.height - this.chrBaseY) / 2 + this.chrBaseY - 15;
				this.cc.strokeRect(prm1, tmpX, prm2 - prm1, 30);
			}
		} else if(type == "panel") {
			this.cc.strokeStyle = "#880000";
			var fromObjList = this.getTargetObjListToSeparator(prm1, true);
			if(fromObjList.length != 0) {
				var y5 = chrScaHeight + fromObjList[0].y - this.scrollY;
				var totalY = 0;
				for(var i = 0; i < fromObjList.length; i ++) {
					totalY += fromObjList[i].getHeight();
				}
				var y6 = y5 + totalY - 1;
				if(y5 < chrScaHeight) {
					//y6 -= (chrScaHeight - y5);
					y5 = chrScaHeight;
				}
				if(y5 <= y6) this.cc.strokeRect(0, y5, this.iCanvas.width, y6 - y5 + 1);
				if(prm2 !== undefined) {
					if(fromObjList[0].getName() == "separator") {
						var toObj = this.getTargetObj(prm2);
						if(toObj !== undefined) {
							var y7 = chrScaHeight + toObj.y - this.scrollY;
							if(y7 != y5) {
								this.cc.strokeRect(0, y7, this.width, 1);
							}
						}
					} else {
						var toObjList = this.getTargetObjListToSeparator(prm2);
						if(toObjList.length != 0) {
							var totalY = 0;
							if(fromObjList[0].y < toObjList[0].y) {
								for(var i = 0; i < toObjList.length; i ++) {
									totalY += toObjList[i].getHeight();
								}
							}
							var y7 = chrScaHeight + toObjList[0].y + totalY - this.scrollY - 1;
							if(y7 != y6 && y7 + 1 != y5) {
								this.cc.strokeRect(0, y7, this.width, 1);
							}
						}
					}
				}
			}
		}
		
		//スクロール画面
		if(this.height - chrScaHeight < this.mCanvas.height) {
			if(this.option.autoSizingFlg) {
				this.setViewerSize(this.width, this.mCanvas.height + chrScaHeight + 1);
			} else {
				this.cc.drawImage(this.sCanvas, this.width - this.sCanvas.width, chrScaHeight);
				
				var x3 = (this.width - this.sCanvas.width / 2) - 5;
				var x4 = x3 + 10;
				var scrOcupyHeight = this.scrollHeight;
				if(this.height - chrScaHeight < this.mCanvas.height) {
					scrOcupyHeight = this.scrollHeight * 
						(this.height - chrScaHeight) / this.mCanvas.height; 
				}
				var scrTopHeight = this.scrollHeight * this.scrollY / this.mCanvas.height;
				var y3 = scrTopHeight + chrScaHeight + 20;
				var y4 = y3 + scrOcupyHeight;
				//this.cc.fillStyle = "#FFFFFF";
				this.cc.fillStyle = "#888899";
				this.cc.fillRect(x3, y3, x4 - x3 + 1, y4 - y3 + 1);
			}
		} else if(this.option.autoSizingFlg && 
			this.height - chrScaHeight > this.mCanvas.height + 10) {
			
			this.setViewerSize(this.width, this.mCanvas.height + chrScaHeight + 1);
		}
	},
	
	setMHeight: function() {
		var nowY = 0;
		for(var i = 0; i < this.viewerParts.length; i ++) {
			var margin = this.end - this.start + 1;
			var strand = (this.strand == "")? "+": this.strand;
			var width3 = this.width * 3;
			var start3 = this.start - margin;
			var end3 = this.end + margin;
			var pow = Math.floor(Math.LOG10E * Math.log((end3 - start3 + 1) / width3));
			var vParts = this.viewerParts[i];
			if(
				vParts.imgCaching !== undefined && 
				(vParts.imgCaching.applyMinPow === undefined || 
				vParts.imgCaching.applyMinPow <= pow)
			) {
				vParts.setHeightForCaching(width3, this.chr, start3, end3, strand);
			} else if(vParts.setHeight2 !== undefined) {
				var jpData = vParts.getJsonParsedDataStatus(width3, 
					this.chr, start3, end3);
				vParts.setHeight2(jpData[0], width3, this.chr, 
					start3, end3, strand);
			} else {
				vParts.setHeight(width3, this.chr, start3, end3, strand);
			}
			nowY += vParts.getHeight();
		}
		this.mHeight = nowY;
	},
	
	setGenomePosition: function(chr, start, end, strand, nolocFlg) {
		if(this.chr == chr && this.start == start && 
			this.end == end && this.strand == strand) return;
		
		if(start > end) {
			var temp = start; start = end; end = temp;
			strand = (strand == "-")? "+": "-";
		}
		
		this.chr = chr;
		this.start = start;
		this.end = end;
		this.strand = strand;
		
		var posStr = chr + ":" + Number(Math.floor(start)).toLocaleString() + 
			"-" + Number(Math.floor(end)).toLocaleString();
		if(strand == "-" || strand == "+") posStr += ":" + strand;
		if(this.option.locationBarFlg && !nolocFlg) {
			window.location.href = "#" + this.option.linkAdd + posStr;
		}
		$("div" + this.divId + " #" + this.option.toolbarId + " #genome_position").val(posStr);
		
		
		this.paint();
	},
	
	setPosition: function(start, end) {
		if(start > end) {var temp = start; start = end; end = temp;}
		
		this.start = start;
		this.end = end;
	},
	
	accessData: function(chr, binStart, binEnd, pow, name2obj) {
		if(binStart < 0) binStart = 0;
		if(binEnd < 0) binEnd = 0;
		
		for(var bin = binStart; bin <= binEnd; bin ++) {
			for(var kind in name2obj) {
				this.loadingData[pow + "|" + chr + "|" + bin + "|" + kind] = true;
			}
		}
		
		//一度に読み込む場合
		//this.accessDataEach(chr, binStart, binEnd, pow, name2obj);
		//別々に読み込み
		for(var kind in name2obj) {
			var eachDt = {};
			eachDt[kind] = name2obj[kind];
			if(this.option.uriDirFlg) {
				for(var j = binStart; j <= binEnd; j ++) {
					this.accessDataEach(chr, j, j, pow, eachDt);
				}
			} else {
				this.accessDataEach(chr, binStart, binEnd, pow, eachDt);
			}
		}
	}, 
	
	accessDataEach: function(chr, binStart, binEnd, powP, name2obj) {
		var m = this;
		this.accNo ++;
		
		var accDefault = {
			success: function(data) {
				var noPaintFlg = false;
				if(m.option.uriDirFlg) {
					if(!(powP in m.json)) m.json[powP] = {};
					var bin = chr + "|" + binStart;
					if(!(bin in m.json[powP])) m.json[powP][bin] = {};
					for(var type in data) {
						if(!(type in m.json[powP][bin])) {
							m.json[powP][bin][type] = data[type];
							if(data[type][0] && data[type][0]["base64_img"] !== undefined) {
								(function() {
									var vec = data[type][0];
									var tmpImg = new Image();
									tmpImg.onload = function() {
										vec["_img"] = this;
										if(m.mousedownType != "body") {
											m.paint();
										}
									};
									tmpImg.src = "data:image/png;base64," + 
										data[type][0]["base64_img"];
								})();
								noPaintFlg = true;
							}
						} else {
							console.log("Warning: data exists.")
						}
					}
				} else {
					for(var pow in data) {
						if(!(pow in m.json)) {
							m.json[pow] = [];
						}
						for(var bin in data[pow]) {
							if(!(bin in m.json[pow])) {
								m.json[pow][bin] = {};
							}
							for(var type in data[pow][bin]) {
								if(!(type in m.json[pow][bin])) {
									m.json[pow][bin][type] = data[pow][bin][type];
									if(data[pow][bin][type][0] && 
										data[pow][bin][type][0]["base64_img"] !== undefined) {
										
										(function() {
											var vec = data[pow][bin][type][0];
											var tmpImg = new Image();
											tmpImg.onload = function() {
												vec["_img"] = this;
												if(m.mousedownType != "body") {
													m.paint();
												}
											};
											tmpImg.src = "data:image/png;base64," + 
												data[pow][bin][type][0]["base64_img"];
										})();
										noPaintFlg = true;
									}
								} else {
									console.log("Warning: data exists.");
								}
							}
						}
					}
				}
				
				if(m.mousedownType != "body" && 
					(m.accNo - 1) % (Math.floor((m.viewerParts.length + 9) / 10)) == 0
				) {
					if(m.option.commonData === undefined) {
						//画像読み込む必要がある場合はpaint後表示
						if(!noPaintFlg) m.paint();
					} else {
						var objList = m.option.commonData.getCallBackObj();
						for(var i = 0; i < objList.length; i ++) {
							objList[i].paint();
						}
					}
				}
				
				for(var bin = binStart; bin <= binEnd; bin ++) {
					for(var kind in name2obj) {
						if(m.option.uriDirFlg && data[kind] === undefined) {
							alert("Error: Json format is invalid (" + kind + ") ");
						} else {
							m.loadingData[powP + "|" + chr + "|" + bin + "|" + kind] = false;
						}
					}
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				var err1 = (typeof XMLHttpRequest == "object" && XMLHttpRequest.status)? 
					XMLHttpRequest.status: "Unknown error";
				var err3 = (typeof errorThrown == "object" && errorThrown.message)? 
					errorThrown.message: "no message";
				console.log("Error occur:" + err1 + "," + textStatus + "," + err3);
				
				var kindHash = {};
				for(var kind in name2obj) {
					kindHash[kind] = 1;
				}
				var err = new Array(2);
				err[0] = "Error: Data access failed";
				err[1] = kindHash;
				m.paint(err);
				
				//for(var bin = binStart; bin <= binEnd; bin ++) {
				//	for(var kind in name2obj) {
				//		m.loadingData[pow + "|" + chr + "|" + bin + "|" + kind] = false;
				//	}
				//}
				//alert("Error! " + this.url);
			},
			complete: function(data) {
				m.accNo --;
				//console.log("Acc: " + m.accNo);
			}
		};
		
		for(var kind in name2obj) {
			if(name2obj[kind].accessObj !== undefined) {
				//for binary data
				name2obj[kind].accessObj(chr, 
					parseInt(binStart), parseInt(binEnd), parseInt(powP), accDefault);
				//accObj.ajax(accDefault);
			} else {
				var addParam = 
					(this.urlSet.additionalParam === undefined)? "": "&" + this.urlSet.additionalParam;
				var jsonUrl = (name2obj[kind].jsonUrl !== undefined)? 
					name2obj[kind].jsonUrl: this.urlSet.json;
				if(this.option.uriDirFlg) {
					jsonUrl += '/' + powP + '/' + chr + '/' + binStart + '/' + kind + '/?' + addParam;
				} else {
					jsonUrl += '?bin_region=' + chr + ':' + binStart + '-' + binEnd + 
						'&pow=' + powP + '&kinds=' + kind + addParam;
				}
				
				var ajaxParam = accDefault;
				ajaxParam.url = jsonUrl;
				ajaxParam.xhrFields = {withCredentials: this.option.withCredentials};
				ajaxParam.dataType = 'json';
				
				$.ajax(ajaxParam);
			}
		}
	},
	
	initViewer: function() {
		var m = this;
		var divId = this.divId;
		
		this.canvas = $("div" + divId + " #" + this.option.viewerId + " #main_viewer")[0];
		//comparative表示を削除したときアクセスが残っていた場合のため
		if(this.canvas === undefined) {return false;}
		
		this.cc = this.canvas.getContext('2d');
		
		var bounds = $("div" + divId + " #" + this.option.viewerId + " #main_viewer")[0].getBoundingClientRect();
		//this.x = bounds.left + $("html, body").scrollLeft();
		//this.y = bounds.top + $("html, body").scrollTop();
		this.x = bounds.left + $(window).scrollLeft();
		this.y = bounds.top + $(window).scrollTop();
		
		//染色体裏画面
		this.cCanvas = document.createElement('canvas');
		if(this.option.showChromFlg) {
			this.cCanvas.width = this.width;
			this.cCanvas.height = 75;
			//this.cCanvas.height = 180;
			this.cCc = this.cCanvas.getContext('2d');
			this.ochr.initData(this.cCc, this.width, this.cCanvas.height);
		} else {
			this.cCanvas.height = 0;
		}
		
		//スケール画面
		this.lCanvas = document.createElement('canvas');
		if(this.option.showScaleFlg) {
			this.lCanvas.width = this.width * 3;
			this.lCanvas.height = 25;
			this.lCc = this.lCanvas.getContext('2d');
			this.oscale = new WgScale(this.lCanvas.height, this.genome);
			this.oscale.setImgJson(this.lCc);
		} else {
			this.lCanvas.height = 0;
		}
		
		//スクロール画面
		this.sCanvas = document.createElement('canvas');
		this.sCanvas.width = 20;
		var cCanvasHeight = (this.option.showChromFlg)? this.cCanvas.height: 0;
		this.sCanvas.height = this.height - cCanvasHeight - this.lCanvas.height;
		this.sCc = this.sCanvas.getContext('2d');
		//this.sCc.fillStyle = "#999999";
		this.sCc.globalAlpha = 0.5;
		this.sCc.fillStyle = "#ffffff";
		this.sCc.fillRect(0, 0, this.sCanvas.width, this.sCanvas.height);
		this.sCc.fillStyle = "#9999ff";
		this.sCc.fillRect(1, 1, this.sCanvas.width - 2, this.sCanvas.height - 2);
		this.sCc.globalAlpha = 0.5;
		this.sCc.fillStyle = "#ffffff";
		this.scrollHeight = this.sCanvas.height - 10 - 20;
		this.sCc.fillRect(this.sCanvas.width / 2 - 3, 20, 6, this.scrollHeight + 1);
		this.sCc.globalAlpha = 1;
		this.sCc.fillRect(this.sCanvas.width / 2 - 6, 18, 12, 2);
		this.sCc.fillRect(this.sCanvas.width / 2 - 6, 21 + this.scrollHeight, 12, 2);
		
		
		//裏画面
		this.mCanvas = document.createElement('canvas');
		this.mCanvas.width = this.width * 3;
		this.mCanvas.height = this.height; //仮置き(可変長)
		this.mCc = this.mCanvas.getContext('2d');
		//Height of all of the items
		this.mHeight = null; //描写時に決まる
		
		//左側項目
		this.iCanvas = document.createElement('canvas');
		this.iCanvas.width = 100;
		//this.iCanvas.width = 500;
		this.iCanvas.height = this.height; //仮置き(可変長)
		this.iCc = this.iCanvas.getContext('2d');
		
		//全描写オブジェクトの初期化
		for(var i = 0; i < this.viewerPartsAll.length; i ++) {
			this.viewerPartsAll[i].setImgJson(this.mCc, this.json, this.genome);
		}
		
		this.mousedownType = "";
		
		$("div" + divId + " #" + this.option.toolbarId + " #viewer_width").val(this.width);
		$("div" + divId + " #" + this.option.toolbarId + " #viewer_height").val(this.height);
		
		$("div" + divId + " #" + this.option.viewerId + " #main_viewer").bind("contextmenu", function(e) {
			if(m.mode == "nav" || m.mode == "info") {
				var targetObj = m.getTargetObj(this.startY);
				if(targetObj !== undefined) {
					var clickY = this.startY;
					
					$("div" + divId + " #right_pop").css("visibility", "hidden");
					var rightPopStr = targetObj.getMenuPopup();
					if(m.option.itemSwitchFlg) {
						if(targetObj.getName() == "separator") {
							rightPopStr += "<a href=\"#\" class=\"del\">Delete separator</a>";
						} else {
							rightPopStr += "<hr><a href=\"#\" class=\"del\">Delete this track</a>";
						}
					}
					if(rightPopStr != "") {
						//track表示の変更ポップアップが出ているときのflag
						m.panelPopup.poppedFlg = true;
						$("div" + divId + " #right_pop").html(rightPopStr);
					} else {
						return false;
					}
					if(targetObj.menuPopAction !== undefined) {
						if(m.settingSyncFlg) {
							//var targetParts = m.viewerPartsAll;
							var targetParts = m.viewerParts;
							for(var i = 0; i < targetParts.length; i ++) {
								if(targetParts[i].getName() == "separator") continue;
								if(targetParts[i].__proto__ === targetObj.__proto__) {
									targetParts[i].menuPopAction(m);
								}
							}
						} else {
							targetObj.menuPopAction(m);
						}
					}
					$("div" + divId + " #right_pop")
						.css("left", e.pageX + 2)
						.css("top", e.pageY + 2)
						.css("border", "solid 1px")
						.css("background-color", "#FFFFFF")
						.css("color", "#000000")
						.css("border-radius", "5px")
						.css("padding", "5px")
						.css("box-shadow", "5px 5px 5px 0px rgba(200,200,200,0.8)")
						.css("visibility", "visible");
					
					$("input[name='show_model']").change(function() {
						//後でsetterにすること
						targetObj.showModelFlg = $("input[name='show_model']:checked").val();
						$("div" + divId + " #right_pop").css("visibility", "hidden");
						m.paint();
					});
					$("input[name='const_width']").change(function() {
						//後でsetterにすること
						targetObj.constWidthFlg = $("input[name='const_width']:checked").val();
						$("div" + divId + " #right_pop").css("visibility", "hidden");
						m.paint();
					});
					$("input[name='show_type']").change(function() {
						if(m.settingSyncFlg) {
							//var targetParts = m.viewerPartsAll;
							var targetParts = m.viewerParts;
							for(var i = 0; i < targetParts.length; i ++) {
								if(targetParts[i].getName() == "separator") continue;
								if(targetParts[i].__proto__ === targetObj.__proto__) {
									targetParts[i].showType = $("input[name='show_type']:checked").val();
									if(targetParts[i].showTypeChangeAction !== undefined) 
										targetParts[i].showTypeChangeAction();
								}
							}
						} else {
							targetObj.showType = $("input[name='show_type']:checked").val();
							if(targetObj.showTypeChangeAction !== undefined) 
								targetObj.showTypeChangeAction();
						}
						$("div" + divId + " #right_pop").css("visibility", "hidden");
						m.paint();
					});
					$("div" + divId + " a.del").click(function() {
						m.deleteTargetObj(clickY);
						$("div" + divId + " #right_pop").css("visibility", "hidden");
						m.paint();
						return false;
					});
					$("div" + divId + " a.det").click(function() {
						$("div" + divId + " #right_pop").css("visibility", "hidden");
						var xSize, ySize;
						if(targetObj.getMenuDetail() != "") {
							var detailHtml = "";
							var detailData = targetObj.getMenuDetail();
							if(typeof detailData == 'string') {
								xSize = 500;
								ySize = 600;
								detailHtml = detailData;
							} else {
								xSize = detailData[1][0];
								ySize = detailData[1][1];
								detailHtml = detailData[0];
							}
							
							$("div" + m.divId + 
								" div#modal div.container").html(detailHtml);
							$("div" + m.divId + 
								" div#modal div.container #apply_button").click(function() {
								
								if(m.settingSyncFlg) {
									//var targetParts = m.viewerPartsAll;
									var targetParts = m.viewerParts;
									for(var i = 0; i < targetParts.length; i ++) {
										if(targetParts[i].getName() == "separator") continue;
										if(targetParts[i].__proto__ === targetObj.__proto__) {
											targetParts[i].setViewDetail(m.divId);
										}
									}
								} else {
									targetObj.setViewDetail(m.divId);
								}
								//targetObj.setViewDetail(m.divId);
								m.displayModal(false);
								m.paint();
								return false;
							});
							$("div" + m.divId + 
								" div#modal div.container #cancel_button").click(function() {
								
								m.displayModal(false);
								return false;
							});
							if(targetObj.menuDetailAction !== undefined) {
								targetObj.menuDetailAction(m);
							}
						}
						m.displayModal(true, [xSize, ySize]);
						return false;
					});
					$("div" + divId + " a.help").click(function() {
						$("div" + divId + " #right_pop").css("visibility", "hidden");
						var xSize, ySize;
						if(targetObj.getHelpData() != "") {
							var helpData = targetObj.getHelpData();
							xSize = helpData[1][0];
							ySize = helpData[1][1];
							$("div" + m.divId + 
								" div#modal div.container").html(helpData[0]);
							$("div" + m.divId + 
								" div#modal div.container #ok_button").click(function() {
								
								m.displayModal(false);
								return false;
							});
						}
						m.displayModal(true, [xSize, ySize]);
						return false;
					});
					
					
				}
			}
			return false;
		});
		
		$("div" + divId + " #" + this.option.viewerId + " #main_viewer").on("mouseover", function(e) {
			e.preventDefault();
			
			var bounds = $("div" + divId + " #" + m.option.viewerId + " #main_viewer")[0].getBoundingClientRect();
			//m.x = bounds.left + $("html, body").scrollLeft();
			m.x = bounds.left + $(window).scrollLeft();
			m.y = bounds.top + $(window).scrollTop();
			
			this.scaleBarFlg = false;
			if(m.mousedownType == "body") m.paint();
			if(m.mousedownType == "pedge") m.paint();
			m.mousedownType = "";
			//$(this).css("cursor", "-moz-grab").css("cursor", "-webkit-grab");
		});
		
		$("div" + divId + " #" + this.option.viewerId + " #main_viewer").on("dblclick", function(e) {
			if(m.genome[m.chr] === undefined) return;
			e.preventDefault();
			if(m.mode == "nav" && m.option.dblclickSizingFlg) {
				//クリック位置を中心に拡大
				//var t = (m.width + e.pageX) / (3 * m.width);
				//var mid = 3 * t * (m.end - m.start) + 2 * m.start - m.end;
				var t = (e.pageX - m.x) / m.width;
				var mid = (m.strand == "-")? 
					t * m.start + (1 - t) * m.end:
					t * m.end + (1 - t) * m.start;
				var start = Math.floor((m.start + mid + 1) / 2);
				var end = Math.floor((m.end + mid + 1) / 2);
				
				//センターを中心に拡大
				//var lng = m.end - m.start + 1;
				//var center = (m.start + m.end) / 2;
				//var start = Math.floor(center - lng / 4);
				//var end = Math.floor(center + lng / 4);
				
				if(start < 1) start = 1;
				if(end > m.genome[m.chr][1]) end = m.genome[m.chr][1];
				m.setGenomePosition(m.chr, start, end, m.strand);
			}
		});
		
		$("div" + divId + " #" + this.option.viewerId + " #main_viewer").on("mousedown", function(e) {
			e.preventDefault();
			$("div" + divId + " #right_pop").css("visibility", "hidden");
			
			this.startX = e.pageX;
			this.startY = e.pageY;
			var yPos = this.startY - m.y;
			var xPos = this.startX - m.x;
			var chrScaHeight = m.cCanvas.height + m.lCanvas.height;
			if(m.mode == "nav") {
				if(m.itemShowFlg && m.iCanvas.width - 5 <= xPos && xPos <= m.iCanvas.width && chrScaHeight < yPos) {
					$(this).css("cursor", "-moz-grabbing").css("cursor", "-webkit-grabbing");
					console.log("pedge");
					m.mousedownType = "pedge";
					m.paintRender(0, "pedge", m.iCanvas.width);
				} else if(m.itemShowFlg && xPos <= m.iCanvas.width && chrScaHeight < yPos) {
					$(this).css("cursor", "-moz-grabbing").css("cursor", "-webkit-grabbing");
					console.log("panel");
					m.mousedownType = "panel";
					var targetObj = m.getTargetObj(this.startY);
					if(targetObj !== undefined) {
						m.paintRender(0, "panel", this.startY);
					}
					
				} else if(
					m.width - m.sCanvas.width < xPos && 
					chrScaHeight < yPos && 
					m.height - chrScaHeight < m.mCanvas.height
				) {
					$(this).css("cursor", "-moz-grabbing").css("cursor", "-webkit-grabbing");
					
					//var scrolY = document.documentElement.scrollTop || document.body.scrollTop;
					
					//e.layerXはfirefoxでは無効
			   		//console.log("scroll:" + 
					//	e.pageY + "," + 
					//	e.clientY + "," + 
					//	m.y + "," + 
					//	scrolY
					//);
					m.mousedownType = "scroll";
				} else if(yPos < m.cCanvas.height && m.option.chromSizingFlg) {
					console.log("chromosome");
					m.mousedownType = "chromosome";
					this.xPosStart = xPos;
				} else if(yPos < chrScaHeight && m.option.scaleSizingFlg) {
					console.log("scale");
					m.mousedownType = "scale";
					this.xPosStart = xPos;
				} else {
					$(this).css("cursor", "-moz-grabbing").css("cursor", "-webkit-grabbing");
					m.mousedownType = "body";
				}
				this.renderStartX = e.pageX;
			}
		});
		
		$("div" + divId + " #" + this.option.viewerId + " #main_viewer").on("mouseup", function(e) {
			if(m.genome[m.chr] === undefined) return;
			e.preventDefault();
			var xPos = e.pageX - m.x;
			var yPos = e.pageY - m.y;
			//console.log("(x, y) = " + xPos + ", " + e.pageY + "-" + m.y);
			if(m.mode == "nav") {
				$(this).css("cursor", "pointer").css("cursor", "-moz-grab").css("cursor", "-webkit-grab");
				//if(m.itemShowFlg && m.mousedownType == "panel" && m.cCanvas.height + m.lCanvas.height < this.startY - m.y) {
				if(m.itemShowFlg && m.mousedownType == "panel") {
						var fromObjList = m.getTargetObjListToSeparator(this.startY, true);
						var toObjList = m.getTargetObjListToSeparator(e.pageY);
						var toObj = m.getTargetObj(e.pageY); //separator用
						var fromObjFirstY, toObjLastY;
						if(fromObjList.length != 0) {
							fromObjFirstY = fromObjList[0].y;
						}
						if(toObjList.length != 0) {
							toObjFirstY = toObjList[0].y;
							toObjLastY = toObjList[toObjList.length - 1].y;
						}
						if(fromObjList.length != 0 && toObjList.length != 0) {
							var separatorFlg = (fromObjList[0].getName() == "separator")? true: false;
							
							if(
								(
									separatorFlg && fromObjFirstY != toObj.y && fromObjFirstY + fromObjList[0].getHeight() != toObj.y
								) || (
									!separatorFlg && fromObjFirstY != toObjList[0].y
								)
							) {
								var fromI, toI;
								if(separatorFlg) {
									for(var i = 0; i < m.viewerParts.length; i ++) {
										var objYS = m.viewerParts[i].y;
										if(objYS == fromObjFirstY) fromI = i;
										if(objYS == toObj.y) toI = i - 1;
									}
								} else {
									for(var i = 0; i < m.viewerParts.length; i ++) {
										var objYS = m.viewerParts[i].y;
										if(objYS == fromObjFirstY) fromI = i;
										if(fromI === undefined && objYS == toObjFirstY) toI = i - 1;
										if(fromI !== undefined && objYS == toObjLastY) toI = i;
									}
								}
								
								var newViewerParts = new Array();
								if(fromI < toI) {
									for(var i = 0; i < fromI; i ++) {
										newViewerParts.push(m.viewerParts[i]);
									}
									for(var i = fromI + fromObjList.length; i < toI + 1; i ++) {
										newViewerParts.push(m.viewerParts[i]);
									}
									for(var i = fromI; i < fromI + fromObjList.length; i ++) {
										newViewerParts.push(m.viewerParts[i]);
									}
									for(var i = toI + 1; i <  m.viewerParts.length; i ++) {
										newViewerParts.push(m.viewerParts[i]);
									}
								} else {
									for(var i = 0; i < toI + 1; i ++) {
										newViewerParts.push(m.viewerParts[i]);
									}
									for(var i = fromI; i < fromI + fromObjList.length; i ++) {
										newViewerParts.push(m.viewerParts[i]);
									}
									for(var i = toI + 1; i < fromI; i ++) {
										newViewerParts.push(m.viewerParts[i]);
									}
									for(var i = fromI + fromObjList.length; i < m.viewerParts.length; i ++) {
										newViewerParts.push(m.viewerParts[i]);
									}
								}
								m.viewerParts = newViewerParts;
								m.paint();
								m.mousedownType = "";
							} else {
								m.mousedownType = "";
								m.paintRender(0);
							}
						} else {
							m.mousedownType = "";
							m.paintRender(0);
						}
				} else if(m.mousedownType == "chromosome" && xPos != this.xPosStart && yPos < m.cCanvas.height) {
					var posStart = (xPos < this.xPosStart)? xPos: this.xPosStart;
					var posEnd = (xPos > this.xPosStart)? xPos: this.xPosStart;
					var chrLng = m.genome[m.chr][1];
					var start = (chrLng - 1) / (m.width - 1) * posStart + 1;
					var end = (chrLng - 1) / (m.width - 1) * posEnd + 1;
					m.mousedownType = "";
					m.setGenomePosition(m.chr, start, end, m.strand);
				} else if(m.mousedownType == "scale" && this.scaleBarFlg && xPos != this.xPosStart) {
					var posStart = (xPos < this.xPosStart)? xPos: this.xPosStart;
					var posEnd = (xPos > this.xPosStart)? xPos: this.xPosStart;
					var start = (m.strand == "-")? 
						(m.start - m.end - 1) / (m.width - 1) * posEnd + m.end + 0.5: 
						(m.end - m.start + 1) / (m.width - 1) * posStart + m.start - 0.5;
					var end = (m.strand == "-")? 
						(m.start - m.end - 1) / (m.width - 1) * posStart + m.end + 0.5: 
						(m.end - m.start + 1) / (m.width - 1) * posEnd + m.start - 0.5;
					this.scaleBarFlg = false;
					m.mousedownType = "";
					m.setGenomePosition(m.chr, start, end, m.strand);
				} else {
					this.scaleBarFlg = false;
					//マウスを上げ下げしただけのときは、repaintなし
					if(m.mousedownType != "scroll" && this.renderStartX != e.pageX) {
						if(m.mousedownType == "pedge") {
							var newWidth = Math.floor(xPos);
							if(newWidth < 20) newWidth = 20;
							if(newWidth > m.width - 50) newWidth = m.width - 50;
							m.iCanvas.width = newWidth + 3;
						}
						//$(this).css("cursor", "wait");
						m.paint(undefined, true);
						//$(this).css("cursor", "-moz-grab").css("cursor", "-webkit-grab");
					} else if(m.mousedownType == "pedge") {
						m.paintRender(0);
					}
					m.mousedownType = "";
					
					var start = m.start;
					var end = m.end;
					if(start < 1) {
						end = end - start + 1;
						start = 1;
					}
					if(end > m.genome[m.chr][1]) {
						start = m.genome[m.chr][1] - (end - start);
						if(start < 1) start = 1;
						end = m.genome[m.chr][1];
					}
					var posStr = m.chr + ":" + Math.floor(start) + "-" + Math.floor(end);
					var posStr2 = m.chr + ":" + Number(Math.floor(start)).toLocaleString() + "-" + 
						Number(Math.floor(end)).toLocaleString();
					if(m.strand == "-" || m.strand == "+") {
						posStr += ":" + m.strand;
						posStr2 += ":" + m.strand;
					}
					if(m.option.locationBarFlg) {
						window.location.href = "#" + m.option.linkAdd + posStr;
					}
					$("div" + divId + " #" + m.option.toolbarId + " #genome_position").val(posStr2);
				}
			} else {
				var yInImg = yPos - m.cCanvas.height - m.lCanvas.height + m.scrollY;
				//var xInImg = xPos + m.width;
				var xInImg = xPos;
				if(yInImg >= m.scrollY) {
					var hitTargetList = [];
					for(yParts in m.infoData) {
						var ySE = yParts.split(",");
						if(ySE[0] <= yInImg && yInImg <= ySE[1]) {
							for(yPartsIn in m.infoData[yParts]) {
								var yInSE = yPartsIn.split(",");
								if(yInSE[0] <= yInImg && yInImg <= yInSE[1]) {
									for(xParts in m.infoData[yParts][yPartsIn]) {
										var xSE = xParts.split(",");
										if(xSE[0] <= xInImg && xInImg <= xSE[1]) {
											hitTargetList.push([yParts, yPartsIn, xParts]);
										}
									}
								}
							}
						}
					}
					var hitCnt = hitTargetList.length;
					if(hitCnt) {
						this.targetNo = (this.targetNo === undefined)? 0: this.targetNo + 1;
						if(this.targetNo >= hitCnt) this.targetNo = 0;
						
						var hitTarget = hitTargetList[this.targetNo];
						var dataTarget = m.infoData[hitTarget[0]][hitTarget[1]][hitTarget[2]];
						if(dataTarget.html !== undefined) {
							var hitData = dataTarget.html;
							$("div" + divId + " #right_pop").css("visibility", "hidden");
							$("div" + divId + " #right_pop").html(hitData);
							$("div" + divId + " #right_pop")
								.css("left", e.pageX + 2)
								.css("top", e.pageY + 2)
								.css("border", "solid 1px")
								.css("background-color", "#FFFFFF")
								.css("color", "#000000")
								.css("visibility", "visible");
							$(this).css("cursor", "pointer");
						}
						if(dataTarget.action !== undefined) {
							var start = (m.strand == "-")? 
								(m.start - m.end - 1) / (m.width - 1) * (xPos + 0.5) + m.end + 1: 
								(m.end - m.start + 1) / (m.width - 1) * (xPos - 0.5) + m.start;
							var end = (m.strand == "-")? 
								(m.start - m.end - 1) / (m.width - 1) * (xPos - 0.5) + m.end + 1: 
								(m.end - m.start + 1) / (m.width - 1) * (xPos + 0.5) + m.start;
							var d = {chr: m.chr, start: start, end: end, strand: m.strand};
							dataTarget.action(d, dataTarget.actionParam);
						}
					}
				}
			}
		});
		
		$("div" + divId + " #" + this.option.viewerId + " #main_viewer").on("mousemove", function(e) {
			e.preventDefault();
			var yPos = e.pageY - m.y;
			var xPos = e.pageX - m.x;
			var chrScaHeight = m.cCanvas.height + m.lCanvas.height;
			if(m.itemShowFlg && m.mousedownType != "panel" && xPos <= m.iCanvas.width && chrScaHeight < yPos) {
				var targetObj = m.getTargetObj(e.pageY);
				if(targetObj !== undefined) {
					var partsId = targetObj.getName();
					if(partsId != "separator" && !m.panelPopup.poppedFlg) {
						if(!m.panelPopup.targetObj) {
							m.panelPopup.targetObj = targetObj;
							m.panelPopup.firedFlg = false;
							m.panelPopup.timerId = 
								setTimeout(function(){m.showLabelPopup()}, 500);
						} else if(m.panelPopup.targetObj.getName() != targetObj.getName()) {
							m.panelPopup.targetObj = targetObj;
							if(m.panelPopup.firedFlg) {
								m.showLabelPopup();
							}
						}
					} else if(
						m.panelPopup.poppedFlg && 
						$("div" + divId + " #right_pop").css("visibility") == "hidden"
					) {
						m.panelPopup.poppedFlg = false;
					}
				}
			} else {
				if(m.panelPopup.targetObj) {
					m.panelPopup.targetObj = null;
					m.panelPopup.firedFlg = false;
					clearTimeout(m.panelPopup.timerId);
					if(!m.panelPopup.poppedFlg) {
						$("div" + divId + " #right_pop").css("visibility", "hidden");
					} else {
						m.panelPopup.poppedFlg = false;
					}
				}
			}
			if(m.mode == "nav") {
				if(m.itemShowFlg && m.mousedownType == "pedge") {
					if(chrScaHeight >= yPos) {
						m.mousedownType = "";
						m.paint();
						//m.paintRender(0);
					} else if(20 <= xPos && xPos <= m.width - 50) {
						m.paintRender(0, "pedge", Math.floor(xPos + 3));
					}
				} else if(m.itemShowFlg && m.mousedownType == "panel" && chrScaHeight < yPos) {
					if(m.viewerParts.length > 15) {
						$(this).css("cursor", "wait");
					} else {
						$(this).css("cursor", "-moz-grabbing").css("cursor", "-webkit-grabbing");
					}
					m.paintRender(0, "panel", this.startY, e.pageY);
				} else if(yPos < m.cCanvas.height) {
					if(m.option.chromSizingFlg) {
						$(this).css("cursor", "crosshair");
						if(m.mousedownType == "chromosome") {
							m.paintRender(0, "chromosome", xPos, this.xPosStart);
						}
					}
				} else if(yPos < m.cCanvas.height + m.lCanvas.height && m.option.scaleSizingFlg) {
					$(this).css("cursor", "crosshair");
					this.scaleBarFlg = true;
					if(m.mousedownType == "scale") {
						m.paintRender(0, "scale", xPos, this.xPosStart);
					} else {
						m.paintRender(0, "scale", xPos);
					}
				} else if(m.mousedownType == "body") {
					if(m.viewerParts.length > 15) {
						$(this).css("cursor", "wait");
					} else {
						$(this).css("cursor", "-moz-grabbing").css("cursor", "-webkit-grabbing");
					}
					var mv = (this.startX - e.pageX) * (m.end - m.start + 1) / m.width;
					//start, endの再設定
					var mvDir = (m.strand == "-")? -1: 1;
					if(m.option.edgePreventFlg) {
						if(m.start < 1) {
							m.end -= m.start - 1;
							m.start = 1;
						}
						var maxPos = m.genome[m.chr][1];
						if(m.end > maxPos) {
							m.start -= m.end - maxPos;
							m.end = maxPos;
						}
					}
					m.setPosition(parseFloat(m.start) + mvDir * mv, 
						parseFloat(m.end) + mvDir * mv);
					m.paintRender(e.pageX - this.renderStartX);
					this.startX = e.pageX;
				} else if(m.mousedownType == "scroll") {
					$(this).css("cursor", "-moz-grabbing").css("cursor", "-webkit-grabbing");
					var chrScaHeight = m.cCanvas.height + m.lCanvas.height;
					//var scrOcupyHeight = m.scrollHeight * (m.height - chrScaHeight) / m.mCanvas.height; 
					m.scrollY += (e.pageY - this.startY) * m.mCanvas.height / m.scrollHeight;
					this.startY = e.pageY;
					if(m.scrollY + m.height - chrScaHeight > m.mCanvas.height) 
						m.scrollY = m.mCanvas.height - m.height + chrScaHeight;
					
					if(m.scrollY < 0) m.scrollY = 0;
					m.paintRender(0);
				} else {
					$(this).css("cursor", "pointer").css("cursor", "-moz-grab").css("cursor", "-webkit-grab");
				}
				
				if(this.scaleBarFlg) {
					if(yPos < m.cCanvas.height || yPos >= m.cCanvas.height + m.lCanvas.height) {
						this.scaleBarFlg = false;
						m.paintRender(0);
					}
				}
			} else {
				var yInImg = yPos - m.cCanvas.height - m.lCanvas.height + m.scrollY;
				//var xInImg = xPos + m.width;
				var xInImg = xPos;
				var popFlg = false;
				if(yInImg >= m.scrollY) {
					for(yParts in m.infoData) {
						var ySE = yParts.split(",");
						if(ySE[0] <= yInImg && yInImg <= ySE[1]) {
							for(yPartsIn in m.infoData[yParts]) {
								var yInSE = yPartsIn.split(",");
								if(yInSE[0] <= yInImg && yInImg <= yInSE[1]) {
									for(xParts in m.infoData[yParts][yPartsIn]) {
										var xSE = xParts.split(",");
										if(xSE[0] <= xInImg && xInImg <= xSE[1]) {
											popFlg = true;
											$(this).css("cursor", "pointer");
											
											var dataTarget = m.infoData[yParts][yPartsIn][xParts];
											if(dataTarget.autoPopHtml !== undefined) {
												var hitData = dataTarget.autoPopHtml;
												$("div" + divId + " #right_pop").css("visibility", "hidden");
												$("div" + divId + " #right_pop").html(hitData);
												$("div" + divId + " #right_pop")
													.css("left", e.pageX + 15)
													.css("top", e.pageY + 5)
													.css("border", "solid 1px")
													.css("background-color", "#FFFFFF")
													.css("color", "#000000")
													.css("visibility", "visible");
											}
										}
									}
								}
							}
						}
					}
				}
				if(!popFlg) {
					$(this).css("cursor", "auto");
					//以下条件付きで消したほうがいい？
					//$("div" + divId + " #right_pop").css("visibility", "hidden");
				}
			}
		});
		
		var mousewheelevent = ('onwheel' in document)? 'wheel': 
			('onmousewheel' in document)? 'mousewheel': 'DOMMouseScroll';
		$("div" + divId + " #" + this.option.viewerId + " #main_viewer").on(mousewheelevent, function(e){
			var chrScaHeight = m.cCanvas.height + m.lCanvas.height;
			var delta = (e.originalEvent.wheelDelta)? -e.originalEvent.wheelDelta / 40: 
				(e.originalEvent.deltaY)? e.originalEvent.deltaY: 
				e.originalEvent.detail;
			
			if(
				(m.mCanvas.height - m.height + chrScaHeight > 0) && 
				!m.option.autoSizingFlg && 
				(m.scrollY != 0 || delta > 0) &&
				(m.scrollY != m.mCanvas.height - m.height + chrScaHeight || delta < 0) &&
				m.mousedownType != "pedge"
			) {
				e.preventDefault();
				//console.log(e.pageY + "," + delta);
				//m.scrollY += delta * 10 * m.mCanvas.height / m.scrollHeight;
				var startScrollY = m.scrollY;
				m.scrollY += delta * 15;
				if(m.scrollY + m.height - chrScaHeight > m.mCanvas.height) 
					m.scrollY = m.mCanvas.height - m.height + chrScaHeight;
				
				if(m.scrollY < 0) m.scrollY = 0;
				
				var deltaY = m.scrollY - startScrollY;
				this.startY -= deltaY;
				
				m.paintRender(0);
			}
		});
		
		//$("div" + divId + " #" + this.option.viewerId + " #main_viewer").on("wheel", function(e, delta) {
		//	e.preventDefault();
		//	//for(ts in e.handleObj) {
		//	//	console.log(ts + ": " + e.handleObj[ts]);
		//	//}
		//	for(ts in e) {
		//		console.log(ts + ": " + e[ts]);
		//	}
		//	console.log("scroll:++++++++++++++++++++" + delta);
		//});
	},
	
	showLabelPopup: function() {
		if(this.panelPopup.targetObj === undefined || this.panelPopup.poppedFlg) return false;
		
		var divId = this.divId;
		var chrScaHeight = this.cCanvas.height + this.lCanvas.height;
		var popY = this.panelPopup.targetObj.y + this.y + chrScaHeight - this.scrollY;
		if(popY < this.y + chrScaHeight) popY = this.y + chrScaHeight;
		$("div" + divId + " #right_pop").css("visibility", "hidden");
		$("div" + divId + " #right_pop").html(this.panelPopup.targetObj.getItemDetailName());
		$("div" + divId + " #right_pop")
			.css("left", this.iCanvas.width + this.x)
			.css("top", popY)
			.css("border", "solid 1px")
			.css("background-color", "rgba(40,75,90,0.8)")
			.css("color", "#FFFFFF")
			.css("border-radius", "0px")
			.css("padding", "5px")
			.css("box-shadow", "5px 5px 5px 0px rgba(200,200,200,0.8)")
			.css("visibility", "visible");
		this.panelPopup.firedFlg = true;
	},
	
	attachNowtime: function(width, chr, start, end) {
		this.json;
		var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
		if(pow < 0) pow = 0;
		var reg = Math.pow(10, pow) * POW_REG;
		
		var binStart = Math.floor((start - 1) / reg);
		var binEnd = Math.floor((end - 1) / reg);
		var genomeEndBin = Math.floor((this.genome[chr][1] - 1) / reg);
		
		for(var i = binStart; i <= binEnd; i ++) {
			if(0 <= i && i <= genomeEndBin) {
				if(this.json[pow] && this.json[pow][chr + "|" + i]) {
					this.json[pow][chr + "|" + i]["_now"] = Date.now();
				}
			}
		}
	},
	
	cutOldJson: function() {
		var allTime = [];
		for(var pow in this.json) {
			for(var chrBin in this.json[pow]) {
				if(this.json[pow][chrBin]["_now"] !== undefined) {
					allTime.push(this.json[pow][chrBin]["_now"]);
				}
			}
		}
		
		var cutNum = this.option.jsonMax;
		if(allTime.length > cutNum) {
			allTime.sort(function(a, b) {
				if(a > b) return -1;
				if(a < b) return 1;
				return 0;
			});
			var delTime = allTime[cutNum];
			
			for(var pow in this.json) {
				for(var chrBin in this.json[pow]) {
					if(this.json[pow][chrBin]["_now"] !== undefined) {
						if(this.json[pow][chrBin]["_now"] < delTime) {
							delete this.json[pow][chrBin];
							console.log("deleted:" + pow + ", " + chrBin);
						}
					}
				}
			}
		}
	},
	
	setViewerSize: function(width, height) {
		this.width = width;
		this.height = height;
		
		$("div" + this.divId + " #" + this.option.toolbarId)
			.css("width", this.width + this.option.boderCss * 2 - this.toolBarCss.padding * 2);
		
		//$("div" + this.divId + " #" + this.option.viewerId + " #main_viewer").width(this.width);
		//$("div" + this.divId + " #" + this.option.viewerId + " #main_viewer").height(this.height);
		
		$("div" + this.divId + " #" + this.option.viewerId + " #main_viewer").remove();
		$("div" + this.divId + " #" + this.option.viewerId).append("<canvas id=\"main_viewer\" width=\"" 
			+ this.width + "\" height=\"" + this.height + "\">Sorry. Unsupported browser</canvas>");
		$("div" + this.divId + " #" + this.option.viewerId + " #main_viewer").css("border", 
			this.option.boderCss + "px solid");
		
		this.initViewer();
		this.paint();
	},
	
	getTargetObj: function(y) {
		var yPos = y - this.y;
		var yBodyPos = yPos - this.cCanvas.height - this.lCanvas.height;
		var targetObj;
		for(var i = 0; i < this.viewerParts.length; i ++) {
			var objYS = this.viewerParts[i].y;
			var objYE = objYS + this.viewerParts[i].getHeight() - 1;
			if(objYS <= yBodyPos + this.scrollY && yBodyPos + this.scrollY <= objYE) {
				targetObj = this.viewerParts[i];
				break;
			}
		}
		
		return targetObj;
	},
	
	//yの位置より上のセパレータより後のトラックから次のセパレータトラックまでのビューワオブジェクトを返す
	//sepFreeFlg=trueのとき、yがセパレータ上ならセパレータ単独のビューワオブジェクトを返す
	getTargetObjListToSeparator: function(y, sepFreeFlg) {
		var yPos = y - this.y;
		var yBodyPos = yPos - this.cCanvas.height - this.lCanvas.height;
		var targetObjList = [];
		var findFlg = false;
		OUT: for(var i = 0; i < this.viewerParts.length; i ++) {
			if(findFlg) {
				targetObjList.push(this.viewerParts[i]);
				if(this.viewerParts[i].getName() == "separator") {
					break;
				}
			} else {
				targetObjList.push(this.viewerParts[i]);
				var objYS = this.viewerParts[i].y;
				var objYE = objYS + this.viewerParts[i].getHeight() - 1;
				if(objYS <= yBodyPos + this.scrollY && yBodyPos + this.scrollY <= objYE) {
					if(this.viewerParts[i].getName() == "separator") {
						if(sepFreeFlg) {
							targetObjList = [this.viewerParts[i]];
							break;
						}
						break OUT;
					}
					findFlg = true;
				} else {
					if(this.viewerParts[i].getName() == "separator") {
						targetObjList = [];
					}
				}
			}
		}
		
		return targetObjList;
	},
	
	deleteTargetObj: function(y) {
		var yPos = y - this.y;
		var yBodyPos = yPos - this.cCanvas.height - this.lCanvas.height;
		var targetI;
		for(var i = 0; i < this.viewerParts.length; i ++) {
			var objYS = this.viewerParts[i].y;
			var objYE = objYS + this.viewerParts[i].getHeight() - 1;
			if(objYS <= yBodyPos + this.scrollY && yBodyPos + this.scrollY <= objYE) {
				targetI = i;
				break;
			}
		}
		if(targetI !== undefined) {
			this.deleteViwerParts(targetI);
		}
		
		return true;
	},
	
	getPopupInfoData: function() {
		var infoData = {};
		//var margin = this.end - this.start + 1;
		var nowY = 0;
		for(var i = 0; i < this.viewerParts.length; i ++) {
			var partsHeight = this.viewerParts[i].getHeight();
			var yEnd = nowY + partsHeight - 1;
			var eachPopup = this.viewerParts[i].getPopupData(nowY, this.width, 
				this.chr, this.start, this.end, this.strand);
			if(eachPopup !== undefined) {
				infoData[nowY + "," + yEnd] = eachPopup;
			}
			nowY += partsHeight;
		}
		return infoData;
	},
	
	deleteViwerParts: function(no) {
		var targetObj = this.viewerParts[no];
		var partsId = targetObj.getName();
		this.viewerParts.splice(no, 1);
		if(partsId != "separator") {
			var buttonInfo = targetObj.getButtonInfo();
			var col = buttonInfo.color[0];
			//$("div" + this.divId + " #" + this.option.ibuttonId + " #" + partsId).attr('disabled', false);
			$("div" + this.divId + " #" + this.option.ibuttonId + 
				" #" + partsId).css("background-color", "#" + col);
			if(buttonInfo.onOff) {
				$("div" + this.divId + " #" + this.option.ibuttonId + 
					" #" + partsId).val("off");
			}
			
			//次のpartsがseparatorだった場合separatorも消す
			if(
				this.viewerParts[no] !== undefined &&
				this.viewerParts[no].getName() == "separator"
			) {
				this.viewerParts.splice(no, 1);
			}
			
			if(this.option.browserId != "" && this.getCookie(this.option.browserId + "|")) {
				var cookieStr = "";
				var showData = this.getCookie(this.option.browserId + "|").split("|");
				var skipFlg = false;
				for(var i = 0; i < showData.length; i++) {
					if(skipFlg) {
						skipFlg = false;
						continue;
					}
					if(showData[i] == partsId) {
						if(showData[i + 1] !== undefined && showData[i + 1] == "separator") {
							skipFlg = true;
						}
						continue;
					}
					if(cookieStr != "") cookieStr += "|";
					cookieStr += showData[i];
				}
				this.setCookie(this.option.browserId + "|", cookieStr);
			}
		}
		if(targetObj.comparaFlg) {
			$("div" + this.divId + " #" + targetObj.addDiv + "_compara").remove();
			$("div" + this.divId + " #" + targetObj.addDiv + "_newview").remove();
			if($("div" + this.divId + " #" + targetObj.addDiv + "_bs")[0]) {
				$("div" + this.divId + " #" + targetObj.addDiv + "_bs").html("");
			}
			targetObj.setInitFlg(true);
		}
		if(this.option.onTrackAction && partsId != "separator") {
			var ev = {"status": "del", "targetObj": targetObj};
			this.option.onTrackAction(ev, this);
		}
	},
	
	addViwerParts: function(no, addSeparatorFlg) {
		var targetObj = this.viewerPartsAll[no];
		var partsId = targetObj.getName();
		var targetI;
		for(var i = 0; i < this.viewerParts.length; i ++) {
			if(this.viewerParts[i].getName() == partsId) {
				targetI = i;
				break;
			}
		}
		if(targetI === undefined) {
			this.viewerParts.push(targetObj);
			
			if(partsId != "separator") {
				var buttonInfo = targetObj.getButtonInfo();
				//$("div" + this.divId + " #" + this.option.ibuttonId + " #" + partsId).attr('disabled', true);
				var col = buttonInfo.color[1];
				$("div" + this.divId + " #" + this.option.ibuttonId + 
					" #" + partsId).css("background-color", "#" + col);
				if(buttonInfo.onOff) {
					$("div" + this.divId + " #" + this.option.ibuttonId + 
						" #" + partsId).val("on");
				}
			}
			
			if(addSeparatorFlg) {
				//separatorの追加
				var oseparator = new WgSeparator(3, "#777777");
				oseparator.setImgJson(this.mCc);
				this.viewerPartsAll.push(oseparator);
				this.viewerParts.push(oseparator);
			}
			
			if(this.option.browserId != "") {
				var cookieStr = this.getCookie(this.option.browserId + "|");
				if(cookieStr != "") cookieStr += "|";
				cookieStr += partsId;
				if(addSeparatorFlg) cookieStr += "|separator";
				
				this.setCookie(this.option.browserId + "|", cookieStr);
			}
			
			if(this.option.onTrackAction && partsId != "separator") {
				var ev = {"status": "add", "targetObj": targetObj};
				this.option.onTrackAction(ev, this);
			}
		} else {
			this.deleteViwerParts(targetI);
		}
	},
	
	showItemFromButtonClick: function(items) {
		var re = new RegExp(items);
		var addPartsI = [];
		for(var i = 0; i < this.viewerPartsAll.length; i ++) {
			
			var partsId = this.viewerPartsAll[i].getName();
			var dispName = this.viewerPartsAll[i].getItemDispName();
			if(dispName.match(re) && dispName != "separator") {
				var findFlg = false;
				for(var j = 0; j < this.viewerParts.length; j ++) {
					if(partsId == this.viewerParts[j].getName()) {
						findFlg = true;
						break;
					}
				}
				if(!findFlg) addPartsI.push(i);
			}
		}
		
		for(var i = 0; i < addPartsI.length; i ++) {
			this.addViwerParts(addPartsI[i], true);
		}
		
		this.paint();
		return false;
	},
	
	hideItemFromButtonClick: function(items) {
		var re = new RegExp(items);
		
		var delFlg = true;
		while(delFlg) {
			delFlg = false;
			var i = 0;
			for(; i < this.viewerParts.length; i ++) {
				var partsId = this.viewerParts[i].getName();
				var dispName = this.viewerParts[i].getItemDispName();
				if(dispName.match(re) && dispName != "separator") {
					delFlg = true;
					break;
				}
			}
			if(delFlg) {
				this.deleteViwerParts(i);
			}
		}
		this.paint();
		return false;
	},
	
	//外向けfunction
	changeTrack: function(targetId, noSeparatorFlg) {
		var no;
		for(var i = 0; i < this.viewerPartsAll.length; i ++) {
			if(targetId == this.viewerPartsAll[i].getName()) {
				no = i;
				break;
			}
		}
		var sepFlg = (noSeparatorFlg)? false: true;
		if(no !== undefined) this.addViwerParts(no, sepFlg);
		this.paint();
	},
	
	adjustCenter: function() {
		var target = "div" + this.divId + " div#modal div.container";
		var width = window.innerWidth? window.innerWidth: $(window).width();
		var height = window.innerHeight? window.innerHeight: $(window).height();
		var margin_top = (height-$(target).height())/2;
		var margin_left = (width-$(target).width())/2;
		if(margin_top < 0) margin_top = 0;
		
		$(target).css({top:margin_top+"px", left:margin_left+"px"});
	},
	
	displayModal: function(sign, xy) {
		if(sign) {
			if(xy === undefined) xy = [500, 600];
			$("div" + this.divId + " div#modal div.container").css("width", xy[0]).css("height", xy[1]);
			$("div" + this.divId + " div#modal").fadeIn(250);
		} else {
			$("div" + this.divId + " div#modal").fadeOut(250);
		}
		this.adjustCenter();
	}, 
	
	addCreateParts: function(parts, showFlg) {
		var partsId = parts.getName();
		if(this.isExistPartsId(partsId)) {
			throw new Error("Already existed PartsID: " + partsId);
		}
		var m = this;
		
		parts.setImgJson(this.mCc, this.json, this.genome);
		
		this.viewerPartsAll.push(parts);
		if(showFlg) this.addViwerParts(this.viewerPartsAll.length - 1, true);
		
		if(!this.option.trackBtnHideFlg) {
			var htmlStr = "";
			var dispName = parts.getItemDispName();
			var buttonInfo = parts.getButtonInfo();
			if(buttonInfo.onOff) {
				var onOff = (showFlg)? "on": "off";
				htmlStr += "<input class=\"track_button\" type=\"button\" id=\"" + partsId + "\" value=\"" + onOff + "\" />";
			} else {
				htmlStr += "<input class=\"track_button\" type=\"button\" id=\"" + partsId + "\" value=\"" + dispName + "\" />";
			}
			
			var col = (showFlg)? buttonInfo.color[1]: buttonInfo.color[0];
			$("div" + this.divId + " #" + this.option.ibuttonId).append(htmlStr);
			$("div" + this.divId + " #" + this.option.ibuttonId + 
				" #" + partsId).css("background-color", "#" + col);
			$("div" + this.divId + " #" + this.option.ibuttonId + " #" + partsId).click(function() {
				var nowId = $(this).attr("id");
				for(var j = 0; j < m.viewerPartsAll.length; j ++) {
					if(m.viewerPartsAll[j].getName() == nowId) {
						var separatorFlg = (m.viewerPartsAll[j].comparaFlg)? false: true;
						m.addViwerParts(j, separatorFlg);
						
						break;
					}
				}
				m.paint();
				return false;
			});
		}
		if(showFlg) this.paint();
	},
	
	isExistPartsId: function(partsId) {
		for(var i = 0; i < this.viewerPartsAll.length; i ++) {
			if(partsId == this.viewerPartsAll[i].getName()) {
				return true;
			}
		}
		
		return false;
	},
	
	coCov16: function(ss){
		var num = 0;
		for(var i = 0; i < ss.length; i ++) {
			var char = ss.charAt(i);
			if(char == "A" || char == "a") char = 10;
			else if(char == "B" || char == "b") char = 11;
			else if(char == "C" || char == "c") char = 12;
			else if(char == "D" || char == "d") char = 13;
			else if(char == "E" || char == "e") char = 14;
			else if(char == "F" || char == "f") char = 15;
			num += char * (i * Math.pow(16, ss.length - (i + 1)));
		}
		
		return num;
	},
	
	getCookie: function(key) {
		var cook  = document.cookie + ";";
		var place = cook.indexOf(key + "=", 0);
		if(place != -1) {
			var subCook = cook.substring(place, cook.length);
			var start = subCook.indexOf("=", 0) + 1;
			var end   = subCook.indexOf(";", start);
			
			return unescape(subCook.substring(start, end));
		}
		
		return "";
	}, 
	
	//"key" should not have "=" or ";" charactor.
	setCookie: function (key, val) {
		val = String(val);
		if(val.indexOf(";", 0) != -1 || val.indexOf("=", 0) != -1) {
			return false;
		}
		var nowDate = new Date();
		nowDate.setTime(nowDate.getTime() + 10000000000);
		var oneCook = key + "=" + escape(val) + "; ";
		oneCook += "expires=" + nowDate.toGMTString() + ";";
		document.cookie = oneCook;
		
		return true;
	}
};

////////////////////////////////////////////////////////////////////////////////////////////////////
var WgRoot = function() {
	this.imgObj = this.ojson = this.y = this.height = this.chrSize = undefined;
};
WgRoot.prototype = {
	//描画する(Y位置, 裏画面の幅, chr, 裏画面のstart, 裏画面のend)
	//実際には裏画面を横に3つに区切ったうちの真ん中が表示される
	repaint: function(y, width, chr, start, end, strand, bgVlineFlg, mode) {
		if(mode == "info") {
			this.imgObj.fillStyle = "#F5F5F5";
			this.imgObj.fillRect(0, y, width - 1, y + this.height - 1);
		}
		if(strand == "") strand = "+";
		if(bgVlineFlg) {
			var y1 = y;
			var y2 = y1 + this.height - 1;
			var flog = Math.floor(10 * 10 * (end - start + 1) / width);
			if(flog <= 0) flog = 1;
			var tPow = Math.pow(10, Math.floor(Math.LOG10E * Math.log(flog)));
			var pos = Math.floor(start / tPow) * tPow;
			while((xc = (pos - start + 0.5) * (width - 1) / (end - start + 1)) < width) {
				var checkPos = Math.floor(pos / tPow);
				this.imgObj.fillStyle = (checkPos % 10 == 0)? "#CCCCCC": "#EEEEEE";
				var x1 = (strand == "-")? width - 1 - xc: xc;
				this.imgObj.fillRect(x1, y1, 1, y2 - y1 + 1);
				pos += tPow;
			}
		}
		
		var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
		var status = [];
		this.y = y;
		if(
			this.imgCaching !== undefined && 
			(this.imgCaching.applyMinPow === undefined || 
			this.imgCaching.applyMinPow <= pow)
		) {
			status = this.paintForCaching(y, width, chr, start, end, strand);
		} else if(this.paint2 !== undefined) {
			var jpData = this.getJsonParsedData(y, width, chr, start, end, strand);
			this.paint2(jpData[0], y, width, chr, start, end, strand);
			status = jpData[1];
		} else {
			status = this.paint(y, width, chr, start, end, strand);
		}
		return status;
	},
	
	//横幅をはみ出す場合の表示の切れに注意(x < 0やx >= widthの位置は描画しても表示されません)
	paint: function(y, width, chr, start, end, strand) {
		var status = [];
		
		return status;
	},
	
	paintForCaching: function(y, width, chr, start, end, strand) {
		var id = this.getName();
		var cachingData = this.getForCachingData(width, chr, start, end, strand);
		var settingType = cachingData[0];
		var binWidth = cachingData[1];
		var status = [];
		
		var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
		if(pow < 0) pow = 0;
		var reg = Math.pow(10, pow) * POW_REG;
		
		var binStart = Math.floor((start - 1) / reg);
		var binEnd = Math.floor((end - 1) / reg);
		var genomeEndBin = Math.floor((this.chrSize[chr][1] - 1) / reg);
		
		for(var i = binStart; i <= binEnd; i ++) {
			if(this.ojson[pow] && this.ojson[pow][chr + "|" + i] && this.ojson[pow][chr + "|" + i][id]) {
				var dt = this.ojson[pow][chr + "|" + i][id];
				var regStart = i * reg + 1;
				var regEnd = (i + 1) * reg;
				//var tmpWidth = Math.floor(POW_REG / 3);
				var tmpWidth = binWidth;
				var str = (strand == "-")? 0: 1;
				if(dt["_img"] === undefined) dt["_img"] = [];
				if(dt["_img"][str] === undefined) dt["_img"][str] = {};
				if(dt["_img"][str]["w" + tmpWidth] === undefined)
					dt["_img"][str]["w" + tmpWidth] ={};
				if(dt["_img"][str]["w" + tmpWidth][settingType] === undefined) {
					var tmpCanvas = document.createElement('canvas');
					tmpCanvas.width = tmpWidth;
					tmpCanvas.height = this.height;
					var tmpCc = tmpCanvas.getContext('2d');
					
					var tmpCc2 = this.imgObj;
					this.imgObj = tmpCc;
					if(this.paint2 !== undefined) {
						this.paint2([dt], 0, tmpCanvas.width, chr, regStart, regEnd, strand);
					} else {
						this.paint(0, tmpCanvas.width, chr, regStart, regEnd, strand);
					}
					this.imgObj = tmpCc2;
					dt["_img"][str]["w" + tmpWidth][settingType] = tmpCanvas;
				} else {
//console.log("cached image");
				}
				var regStartX = (regStart - start) * (width - 1) / (end - start + 1);
				var regEndX = (regEnd - start + 1) * (width - 1) / (end - start + 1);
				if(0 <= regEndX && regStartX <= width - 1) {
					var x1, x2, imgInX1, imgInX2;
					if (0 <= regStartX) {
						imgInX1 = 0;
						x1 = regStartX;
					} else {
						imgInX1 = tmpWidth * (0 - regStartX) / (regEndX - regStartX + 1);
						x1 = 0;
					}
					if(regEndX <= width - 1) {
						imgInX2 = tmpWidth - 1;
						x2 = regEndX;
					} else {
						imgInX2 = tmpWidth * ((width - 1) - regStartX) / (regEndX - regStartX + 1);
						x2 = width - 1;
					}
					if(strand == "-") {
						var tmp;
						imgInX1 = tmpWidth - imgInX1 - 1;
						imgInX2 = tmpWidth - imgInX2 - 1;
						tmp = imgInX1; imgInX1 = imgInX2; imgInX2 = tmp;
						x1 = width - x1 - 1;
						x2 = width - x2 - 1;
						tmp = x1; x1 = x2; x2 = tmp;
					}
					
//console.log(tmpWidth + ", " + this.height);
//console.log("(" + imgInX1 + ", 0, " + (imgInX2 - imgInX1 + 1) + ", " + dt["_img"][str]["w" + tmpWidth][settingType].height + ")(" + x1 + ", " + y +", " + (x2 - x1 + 1) + ", " + dt["_img"][str]["w" + tmpWidth][settingType].height + ")");
					
					this.imgObj.drawImage(
						dt["_img"][str]["w" + tmpWidth][settingType], 
						imgInX1, 0, imgInX2 - imgInX1 + 1, 
						dt["_img"][str]["w" + tmpWidth][settingType].height, 
						x1, y, x2 - x1 + 1, 
						dt["_img"][str]["w" + tmpWidth][settingType].height
					);
				}
			} else {
				if(0 <= i && i <= genomeEndBin) {
					status.push(i);
					this.paintLoading(y, width, start, end, strand, i);
				}
			}
		}
		
		return status;
	},
	
	getForCachingData: function(width, chr, start, end, strand) {
		var settingType = (this.imgCaching.getSettingType)? this.imgCaching.getSettingType(): "default";
		var cachingNum = (this.imgCaching.cachingNum)? this.imgCaching.cachingNum: 1;
		
		var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
		if(pow < 0) pow = 0;
		var reg = Math.pow(10, pow) * POW_REG;
		
		//nはPOW_REG ~ POW_REG * 10の範囲でのcaching番号(0~cachingNum - 1)
		var n = Math.floor(Math.LOG10E * Math.log(Math.pow((((end - start + 1) / width) / reg * POW_REG), cachingNum)));
		//最大拡大時に画像の幅が2^15を超えないようにnを設定
		//var minN = Math.floor(cachingNum * Math.LOG10E * Math.log(POW_REG / 32768) + 1);
		//最大拡大時に画像の幅が10000を超えないようにnを設定
		var minN = Math.floor(cachingNum * Math.LOG10E * Math.log(POW_REG / 10000) + 1);
		if(n < minN) n = minN;
//console.log("n=" + n);
		var binWidth = Math.floor(POW_REG / Math.pow(10, (n / cachingNum)));
//console.log("binWidth = " + binWidth);
//console.log("minN = " + minN);
		
		return [settingType, binWidth];
	},
	
	getJsonParsedData: function(y, width, chr, start, end, strand) {
		var jsonStat = this.getJsonParsedDataStatus(width, chr, start, end);
		this.showLoading(y, width, start, end, strand, jsonStat[1]);
		return jsonStat;
	}, 
	
	getJsonParsedDataStatus: function(width, chr, start, end) {
		var id = this.getName();
		var status = [];
		var parsedData = [];
		
		var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
		if(pow < 0) pow = 0;
		var reg = Math.pow(10, pow) * POW_REG;
		
		var binStart = Math.floor((start - 1) / reg);
		var binEnd = Math.floor((end - 1) / reg);
		var genomeEndBin = Math.floor((this.chrSize[chr][1] - 1) / reg);
		
		for(var i = binStart; i <= binEnd; i ++) {
			if(i <= genomeEndBin) {
				if(this.ojson[pow] && this.ojson[pow][chr + "|" + i] && this.ojson[pow][chr + "|" + i][id]) {
					//this.ojson[pow][chr + "|" + i][id][0]["_now"] = Date.now();
					parsedData.push(this.ojson[pow][chr + "|" + i][id]);
				} else {
					if(i >= 0) status.push(i);
				}
			}
		}
		
		return [parsedData, status];
	},
	
	showLoading: function(y, width, start, end, strand, status) {
		for(var i = 0; i < status.length; i ++) {
			this.paintLoading(y, width, start, end, strand, status[i]);
		}
	},
	
	//読み込み中表示
	paintLoading: function(y, width, start, end, strand, bin) {
		if(bin < 0) return;
		
		var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
		if(pow < 0) pow = 0;
		var reg = Math.pow(10, pow) * POW_REG;
		var regStart = bin * reg + 1;
		var regEnd = (bin + 1) * reg;
		var x1 = (regStart - start) * (width - 1) / (end - start + 1);
		
		if(x1 > width) return;
		
		if(x1 < 0) x1 = 0;
		var x2 = (regEnd - start + 1) * (width - 1) / (end - start + 1);
		
		if(x2 < 0) return;
		
		if(x2 > width - 1) x2 = width - 1;
		var y1 = y;
		var y2 = y1 + this.height - 1;
		if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
		this.imgObj.fillStyle = "#DDDDDD";
		this.imgObj.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
		var loading = "Loading...";
		this.imgObj.font = "10px 'Helvetica'";
		var strWidth = this.imgObj.measureText(loading).width;
		this.imgObj.fillStyle = "#888888";
		var y3 = (y1 + y2) / 2 + 3;
		var x3;
		if(x1 <= width / 3 && 2 * width / 3 <= x2) {
			x3 = (width - strWidth) / 2;
		} else if(width / 3 <= x1 && 2 * width / 3 <= x2) {
			x3 = (x1 + 2 * width / 3 - strWidth) / 2;
		} else if(width / 3 <= x1 && x2 <= 2 * width / 3) {
			x3 = (x1 + x2 - strWidth) / 2;
		} else if(x1 <= width / 3 && x2 <= 2 * width / 3) {
			x3 = (width / 3 + x2 - strWidth) / 2;
		}
		if(x3 !== undefined) this.imgObj.fillText(loading, x3, y3);
	},
	
	//Error表示用
	paintError: function(y, width, start, end, strand, bin, str) {
		if(bin < 0) return;
		
		var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
		if(pow < 0) pow = 0;
		var reg = Math.pow(10, pow) * POW_REG;
		var regStart = bin * reg + 1;
		var regEnd = (bin + 1) * reg;
		
		var x1 = (regStart - start) * (width - 1) / (end - start + 1);
		if(x1 > width) return;
		if(x1 < 0) x1 = 0;
		var x2 = (regEnd - start + 1) * (width - 1) / (end - start + 1);
		if(x2 < 0) return;
		if(x2 > width - 1) x2 = width - 1;
		var y1 = y;
		var y2 = y + this.height - 1;
		if(strand == "-") {var tmp = width - 1 - x1; x1 = width - 1 - x2; x2 = tmp;}
		
		this.imgObj.fillStyle = "#EEEEEE";
		this.imgObj.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
		
		var errorStr = " Error: " + str;
		this.imgObj.font = "10px 'Helvetica'";
		var strWidth = this.imgObj.measureText(errorStr).width;
		this.imgObj.fillStyle = "#BB0000";
		var y3 = (y1 + y2) / 2;
		var x3 = (width - 1 - strWidth) / 2;
		if(x3 < x1) x3 = x1;
		if(x2 < x3 + strWidth) x3 = x2 - strWidth;
		//飛び出るの覚悟
		if(x3 < x1) x3 = (x1 + x2 - strWidth) / 2;
		this.imgObj.fillText(errorStr, x3, y3);
	},
	
	//paintの前に呼ばれる。現状のデータから自分自身の描画の高さをセットする
	setHeight: function(width, chr, start, end, strand) {
		//this.height = 50;
	},
	
	setHeightForCaching: function(width, chr, start, end, strand) {
		var cachingData = this.getForCachingData(width, chr, start, end, strand);
		var settingType = cachingData[0];
		var binWidth = cachingData[1];
		
		var pow = Math.floor(Math.LOG10E * Math.log((end - start + 1) / width));
		if(pow < 0) pow = 0;
		var reg = Math.pow(10, pow) * POW_REG;
		
		var binStart = Math.floor((start - 1) / reg);
		var binEnd = Math.floor((end - 1) / reg);
		
		var regStart = binStart * reg + 1;
		var regEnd = (binEnd + 1) * reg;
		var regWidth = (regEnd - regStart + 1) / Math.pow(10, pow);
		
		if(this.setHeight2 !== undefined) {
			var jpData = this.getJsonParsedDataStatus(width, chr, start, end);
			this.setHeight2(jpData[0], regWidth, chr, regStart, regEnd, strand);
		} else {
			this.setHeight(regWidth, chr, regStart, regEnd, strand);
		}
	},
	
	//自分のID
	getName: function() {
		return "";
	},
	
	//Webアクセスの際のDBテーブルの種類IDを返すdefalutはgetName()
	getKindName: function() {
		return this.getName();
	},
	
	//buttonColor
	getButtonInfo: function() {
		return {
			"color": ["eeeeee", "ffcccc"], 
			"onOff": false
		};
	},
	
	//pannelBgcolor
	getPannelBgcolor: function() {
		return "#EEEEEE";
	},
	
	//左パネルに表示される名前
	getItemDispName: function() {
		return this.getName();
	},
	
	//左パネルにポップアップ表示される名前
	getItemDetailName: function() {
		return this.getItemDispName();
	},
	
	//右クリックの際に現れるポップアップメニュー
	getMenuPopup: function() {
		return "";
	},
	
	//右クリックの際に現れるポップアップメニュー(詳細用)
	getMenuDetail: function() {
		var htmlStr = "";
		return htmlStr;
	},
	
	//表示の詳細設定の変更用
	setViewDetail: function(divId) {
		return true;
	},
	
	//ポップアップ用データを返す
	getPopupData: function(y, width, chr, start, end, strand) {
		return;
	},
	
	//自分自身の描画の高さを返す
	getHeight: function() {
		return this.height;
	},
	
	//左パネルのスケールとの重なりを防ぐため
	getAboidingLeftPanelSpace: function() {
		return 0;
	},
	
	//イメージオブジェクト,Jsonオブジェクトの設定
	setImgJson: function(imgObj, ojson, genome) {
		this.imgObj = imgObj;
		this.ojson = ojson;
		this.chrSize = genome;
	},
	
	getLabelCol: function() {
		return "#000000";
	},
	
	//
	cov16: function(n){
		var sin = "0123456789ABCDEF";
		if(n>255) return 'FF';
		if(n<0) return '00';
		return sin.charAt(Math.floor(n / 16)) + sin.charAt(n % 16); //16進数2桁を返す
	}
	
};



CAN.media.loader = {
	"newcount": 4,
	"zerototen": [0,1,2,3,4,5,6,7,8,9,10],
	"vars": ["category", "mtype", "number", "offset", "recommendations", "random", "approved", "critiqued", "authid", "noblurb", "allrefs", "ordered", "uid", "gtype", "withsummary", "esort", "filter_voted", "shared", "list_only", "nlgroup", "wiki", "referendum"],
	"names": {
		"news": "article",
		"book": "recommendation",
		"sustainableaction": "action",
		"referenda": "referendum",
		"rules": "search rule",
		"featured": "featured result"
	},
	"testprops": {
		"referenda": "summary",
		"news": "body",
		"event": "description",
		"featured": "title",
		"rules": "name",
		"group": "blurb",
		"newsletter": "body",
		"opinion": "body",
		"paper": "body",
		"conversation": "comments"
	},
	"args": {},
	"tiles": {},
	"cache": {},
	"builders": {},
	"registerBuilder": function(mtype, cb) {
		CAN.media.loader.builders[mtype] = cb;
	},
	"varsToKey": function(vars) {
		var s = '';
		for (var i = 0; i < CAN.media.loader.vars.length; i++)
			s += CAN.media.loader.vars[i]
				+ vars[CAN.media.loader.vars[i]];
		return s;
	},
	"varsToKeyVars": function(vars) {
		var o = {};
		for (var k in vars) {
			if (CAN.media.loader.vars.indexOf(k) != -1)
				o[k] = vars[k];
		}
		return o;
	},
	"save": function(mdata, vars) {
		if (mdata != "noresults") {
			if (vars.number && vars.number > 1)
				CT.data.addSet(mdata);
			else
				CT.data.add(mdata);
			if (vars.random || vars.rating)
				return;
		}
		CAN.media.loader.cache[CAN.media.loader.varsToKey(vars)] = mdata;
		if (mdata == false)
			vars.lastoffset = vars.offset - vars.number;
	},
	// vars.paging = bidirectional|rotation
	// vars.rating = likehate
	// vars.layout = tiled|fluid
	// if vars.layout == tiled, vars.width is necessary
	"dNode": function(vars, rawdata, i, newMediaSelect) {
		return (vars.newMedia || CAN.media.loader.builders[newMediaSelect
			|| vars.newMediaDefault])(rawdata, i, vars);
	},
	"addRating": function(vars, rawdata, targetnode) {
		if (!vars.uid || vars.uid == "nouid")
			return;
		var vnode = CT.dom.node(null, "div", "centered inlineimg");
		if (rawdata.vote != null)
			vnode.appendChild(CT.dom.node("Your rating: "+rawdata.vote));
		else if (vars.rating == "likehate") {
			vnode.appendChild(CT.dom.link("(like)", function() {
				CT.net.post("/vote", {"uid": vars.uid, "key": rawdata.key,
					"opinion": 20}, "error casting vote",
					function() { CAN.media.loader.load(vars); });
			}));
			vnode.appendChild(CT.dom.node(" ", "span"));
			vnode.appendChild(CT.dom.link("(hate)", function() {
				CT.net.post("/vote", {"uid": vars.uid, "key": rawdata.key,
					"opinion": -20}, "error casting vote",
					function() { CAN.media.loader.load(vars); });
			}));
		} else if (vars.rating == "likepass") {
			vnode.appendChild(CT.dom.link("(like)", function() {
				CT.net.post("/vote", {"uid": vars.uid, "key": rawdata.key,
					"opinion": 10}, "error casting vote",
					function() { CAN.media.loader.load(vars); });
			}));
			vnode.appendChild(CT.dom.node(" ", "span"));
			vnode.appendChild(CT.dom.link("(pass)", function() {
				CT.net.post("/vote", {"uid": vars.uid, "key": rawdata.key,
					"opinion": 0}, "error casting vote",
					function() { CAN.media.loader.load(vars); });
			}));
		} else if (vars.rating == "0to10") {
			CT.dom.radioStrip(vnode, CAN.media.loader.zerototen, function(i) {
				CT.net.post("/vote", {"uid": vars.uid, "key": rawdata.key,
					"opinion": i}, "error casting vote", function() {
						if (vars.showrating) {
							rawdata.vote = i;
							vnode.innerHTML = "";
							vnode.appendChild(CT.dom.node("Your rating: "+i));
						}
						else
							CAN.media.loader.load(vars);
					});
			});
		} else if (vars.rating == "5star") {
			for (var i = 1; i < 6; i++) {
				CAN.media.loader.addRatingStar(vnode, i, function(num) {
					CT.net.post("/vote", {"uid": vars.uid, "key": rawdata.key,
						"opinion": num}, "error casting vote", function() {
						CAN.media.loader.load(vars); });
				});
			}
		} else
			return;
		targetnode.appendChild(vnode);
	},
	"addRatingStar": function(vnode, i, cb) {
		vnode.appendChild(CT.dom.img("/img/star.png", null,
			function() { cb(i); }, null, null, "Rate "+i+" Stars!"));
	},
	"show": function(mdata, vars) {
		vars.node.innerHTML = "";
		if (vars.layout == "tiled") {
			vars.width = vars.width || 4;
			var t = CT.dom.node("", "table",
				(vars.buttonCb || vars.buttonCbDefault)
				&& "vbottom" || "vtop", "tiledmediatable");
			var r = t.insertRow(-1);
			CAN.media.loader.tiles[vars.mkey] = [];
			for (var i = 0; i < vars.number; i++) {
				if (i % vars.width == 0)
					r = t.insertRow(-1);
				CAN.media.loader.tiles[vars.mkey].push(r.insertCell(-1));
			}
			vars.node.appendChild(t);
		}
		if (!vars.number)
			mdata = [mdata];
		else if (vars.number > mdata.length)
			vars.lastoffset = vars.offset;
		for (var i = 0; i < mdata.length; i++) {
			var rawdata = mdata[i];
			var datanode = CAN.media.loader.dNode(vars, rawdata, i);
			if (vars.layout == "fluid")
				var targetnode = vars.nodeCb && vars.nodeCb(rawdata) || vars.node;
			else { // tiled
				var targetnode = CAN.media.loader.tiles[vars.mkey][i];
				if (targetnode) targetnode.innerHTML = "";
			}
			targetnode.appendChild(datanode);
			if (vars.newMediaDefault != "lister")
				CAN.media.loader.addRating(vars, rawdata, datanode);
			if (vars.buttonCb)
				datanode.appendChild(vars.buttonCb(rawdata));
			else if (vars.buttonCbDefault) {
				datanode.appendChild(CAN.media.moderation[vars.buttonCbDefault.name](rawdata, vars));
			}
		}
		if (vars.paging) {
			var arrownode = CT.dom.node("", "div", "noborder");
			var justFloat = false;
			if (CAN.media.loader.shouldPageNext(vars, mdata)) {
				arrownode.appendChild(CT.dom.img("/img/buttons/" + vars.nextimg,
					"right relative", function() {
						if (vars.offset == vars.lastoffset)
							vars.offset = 0;
						else
							vars.offset += vars.number;
						CAN.media.loader.load(vars);
					}));
				justFloat = true;
			}
			if (vars.paging == "bidirectional" && vars.offset != 0) {
				arrownode.appendChild(CT.dom.button("previous", function() {
					vars.offset -= vars.number;
					CAN.media.loader.load(vars);
				}, "smaller bold topmargined"));
				justFloat = false;
			}
			if (justFloat)
				arrownode.appendChild(CT.dom.node("", "div", "clearnode"));
			vars.node.appendChild(arrownode);
		}
		if (vars.cb) vars.cb(mdata);
	},
	"shouldPageNext": function(vars, mdata) {
		if (vars.number && (mdata.length < vars.number))
			vars.lastoffset = vars.offset;
		if (vars.lastoffset == 0)
			return false;
		if (vars.paging == "rotation")
			return true;
		if (vars.lastoffset == vars.offset)
			return false;
		return true;
	},
	"checkAndShow": function(d, vars, cb) {
		var c = vars.newMediaChecks;
		if (c) {
			c.single = c.single || [];
			c.list = c.list || [];
			c.justFirst = c.justFirst || [];
			var needed = [];
			for (var i = 0; i < d.length; i++) {
				for (var j = 0; j < c.single.length; j++)
					needed.push(d[i][c.single[j]]);
				for (var j = 0; j < c.list.length; j++)
					needed = needed.concat(d[i][c.list[j]]);
				for (var j = 0; j < c.justFirst.length; j++) {
					var item = d[i][c.justFirst[j]];
					if (item && item.length > 0)
						needed.push(item[0]);
				}
			}
			return CT.data.checkAndDo(needed, function() { cb(d, vars); });
		}
		cb(d, vars);
	},
	"load": function(vars, mdata) {
		vars.gtype = "media";
		if ((! vars.node) && vars.nodeCb)
			vars.node = vars.nodeCb(); // default node
		vars.mkey = vars.mkey || vars.mtype;
		CAN.media.loader.args[vars.mkey] = vars;
		vars.uid = vars.uid || "nouid";
		vars.layout = vars.layout || "fluid";
		vars.nextimg = vars.nextimg || "VIEW_MORE_BUTTON";
		if (vars.nextimg.indexOf('.') == -1)
			vars.nextimg += ".gif";
		vars.newMediaDefault = vars.newMediaDefault || vars.mtype;
	//    if (vars.paging && vars.offset == null) vars.offset = 0;
		vars.offset = vars.offset || 0;
		var mdata = mdata || CAN.media.loader.cache[CAN.media.loader.varsToKey(vars)];
		if (mdata == "noresults") {
			if (vars.offset == 0)
				return (vars.eb || alert)("no " + vars.mtype + " results!");
			vars.offset = 0;
			CAN.media.loader.load(vars);
		}
		else if (mdata)
			CAN.media.loader.show(mdata, vars);
		else {
			CT.net.post("/get", CAN.media.loader.varsToKeyVars(vars),
				"error retrieving " + vars.mtype,
				function(d) {
					CAN.media.loader.save(d, vars);
					CAN.media.loader.checkAndShow(d, vars, CAN.media.loader.show);
				}, function(msg) {
					if (!CT.net._encode) {
						if (window.console)
							console.log(msg);
						else
							alert(msg);
	//                    (window.console && console.log || alert)(msg);
					}
					CAN.media.loader.save("noresults", vars);
					vars.offset = 0;
					CAN.media.loader.load(vars);
				});
		}
	},
	"link": function(mtype, showMedia, hasChanged, blankData) {
		return CT.dom.node(CT.dom.link("<b>new " +
			(CAN.media.loader.names[mtype] || mtype) + "</b>",
			function() { CAN.media.loader.change(null, mtype, showMedia,
			hasChanged, blankData); }), "div", "", "ll"+mtype);
	},
	"list": function(uid, mtype, node, showMedia, hasChanged, blankData, nodeCb, cb, extras, eb) {
		node = node || nodeCb();
		var pdata = {"number": 1000, "hasChanged": hasChanged, "cb": cb,
			"newMediaDefault": "lister", "authid": uid, "node": node,
			"nodeCb": nodeCb, "showMedia": showMedia, "mtype": mtype,
			"approved": "both",
			"blankData": blankData, "list_only": 1, "eb": function() {
				node.appendChild(CAN.media.loader.link(mtype, showMedia, hasChanged,
				blankData)); node.firstChild.firstChild.onclick(); eb && eb();}};
		if (extras) {
			for (var k in extras)
				pdata[k] = extras[k];
		}
		CAN.media.loader.load(pdata);
	},
	"change": function(d, mtype, showMedia, hasChanged, blankData, uid) {
		if (hasChanged() && ! confirm("You have unsaved changes! You will lose them if you switch to a different "+mtype+"! Continue?"))
			return;
		if (d)
			d = CT.data.get(d.key);
		else {
			d = blankData;
			d.key = mtype;
			d.is_new = true;
		}
		if (d.is_new || d[(CAN.media.loader.testprops[mtype] || "content")])
			showMedia(d);
		else {
			pdata = {"gtype": "data", "key": d.key};
			if (mtype == "conversation")
				pdata.uid = uid;
			else
				pdata.critiques = 1;
			CT.net.post("/get", pdata,
				"error retrieving " + mtype, function(result) {
				CT.data.add(result);
				showMedia(CT.data.get(result.key));
			});
		}
	},
	"newLister": function(lister, node, mtype, showMedia, hasChanged, oldkey) {
		CT.data.add(lister);
		var d = CT.dom.node(CT.dom.link(lister.title || lister.author
			|| lister.name || lister.topic, function() {
				CAN.media.loader.change(lister, mtype,
					showMedia, hasChanged); }), "div", "", "ll" + lister.key);
		if (node.childNodes.length < 2)
			node.appendChild(d);
		else
			node.insertBefore(d, node.firstChild.nextSibling);
		CT.dom.id("ll" + (oldkey || mtype)).className = "";
		d.className = "activetab";
	},
	"newMediaLink": function(mtype, showMedia, hasChanged, blankData) {
		return CT.dom.node(CT.dom.link("<b>new " + (CAN.media.loader.names[mtype] || mtype) + "</b>",
			function() { CAN.media.loader.change(null, mtype, showMedia,
			hasChanged, blankData); }), "div", "", "ll" + mtype);
	},
	"listOne": function(d, i, v) {
		if (v.node.innerHTML == "") {
			v.node.appendChild(CAN.media.loader.newMediaLink(v.mtype,
				v.showMedia, v.hasChanged, v.blankData));
			v.node.firstChild.firstChild.onclick();
		}
		var ltitle = d.title || d.author || d.name || d.topic;
		if (d.unseencount)
			ltitle += " (" + d.unseencount + ")";
		return CT.dom.node(CT.dom.link(ltitle, function() {
			CAN.media.loader.change(d, v.mtype, v.showMedia, v.hasChanged, null, v.authid); }),
			"div", d.unseencount && "bold" || "", "ll"+d.key);
	},
	"contentNode": function(key, recent_comments, titleclass) {
		var img, entity = typeof key == "string" && CT.data.get(key) || key,
			blurb = entity.thought || entity.blurb || entity.body || entity.description || entity.idea || entity.question,
			title = entity.title || (entity.content ? (entity.content + "<br>- <b>" + entity.author + "</b>")
					: (blurb && CT.parse.shortened(blurb, 50, 10, true) || "")),
			cnode = CT.dom.div((entity.conversation && typeof recent_comments == "object") ?
				(recent_comments[entity.conversation].length + " ") : "",
				"smaller bold right"),
			n = CT.dom.div([
				CT.dom.div("(" + (entity.mtype || (entity.question && "question") || (entity.author
					? ((entity.buylink || entity.readlink) ? "book" : "quote")
					: (entity.graphic ? "photo" : "thought"))) + ")", "smaller bold right"),
				CT.dom.div(title, titleclass), cnode
			], null, null, {
				onclick: function() {
					entity.conversation && CAN.widget.stream.jumpTo(entity.conversation);
				}
			});
		entity.conversation && CT.db.get("comment", function(comcount) {
			cnode.innerHTML += "(" + comcount + ")";
		}, null, null, null, {
			conversation: entity.conversation
		}, null, true);
		setTimeout(function() {
			img = entity.thumbnail || entity.image;
			if (!img) {
				if (entity.photo)
					img = entity.photo.photo || ((typeof entity.photo == "string")
						? entity.photo : "/get?gtype=graphic&key=" + entity.photo[0]);
				else if (blurb)
					img = CT.parse.extractImage(blurb);
			}
			if (img) {
				n.appendChild(CT.dom.panImg({
					img: img
				}));
			} else {
				CT.log("NEEDS IMAGE");
				CT.log(entity);
			}
		});
		return n;
	},
	"_unthumb": function(key, e, u) {
		var n = CT.dom.id(key);
		n.style.height = n.firstChild.clientHeight + "px";
		n.classList.remove("vidthumb");
		n.innerHTML = CT.video.full(CT.video.videoData(u));
		e && e.stopPropagation();
	},
	"ytUnthumb": function(key, e) {
		CAN.media.loader._unthumb(key, e,
			"https://youtube.com?v=" + key.slice(0, -4));
	},
	"tlUnthumb": function(key, e) {
		var name, token;
		[name, token] = key.split("_");
		CAN.media.loader._unthumb(token, e,
			"https://tl.fzn.party/v/" + name + ".mp4");
	},
	"_linkFlags": {
		"thought": "community.html#!Stream",
		"event": "community.html#!Events",
		"meme": "community.html#!Memes",
		"opinion": "recommendations.html#!OpinionsAndIdeas",
		"paper": "recommendations.html#!PositionPapers"
	},
	"_linkTypes": ["thought", "event", "cases", "meme", "opinion", "paper"],
	"linkProcessor": function (url, novid) {
		// photos
		url = url.replace("gtype=graphic&amp;key=", "gtype=graphic&key=");
		var photoSplit = url.split("gtype=graphic&key=");
		if (photoSplit.length > 1)
			return '<img src="' + url + '">';
		if (url.includes("youtube.com")) {
			url = url.replace("/shorts/", "/watch?v=");
			var key = url.split("v=")[1].split("&")[0],
				keyran = key + Math.floor(1000 + Math.random() * 1000);
			return '<div class="vidthumb" id="' + keyran + '"><img class="pointer" src="https://img.youtube.com/vi/' + key + '/0.jpg" onclick="__me.loader.ytUnthumb(\'' + keyran + '\', arguments[0])"></div>';
		} else if (url.includes("tl.fzn.party/v/")) {
			var token = CT.data.token(), name = url.split("/v/").pop().split(".").shift();
			return '<div class="vidthumb" id="' + token + '"><img class="pointer" src="https://tl.fzn.party/img/v/' + name + '.jpg" onclick="__me.loader.tlUnthumb(\'' + name + "_" + token + '\', arguments[0])"></div>';
		}
		// thoughts, events, cases, memes, opinions, papers
		for (var i = 0; i < CAN.media.loader._linkTypes.length; i++) {
			var ltype = CAN.media.loader._linkTypes[i],
				lflag = CAN.media.loader._linkFlags[ltype], skey;
			if (lflag)
				skey = url.split(lflag + "|")[1] || url.split(lflag + "%7C")[1];
			else
				skey = url.split(ltype + ".html#!")[1];
			if (skey) {
				var key = CAN.cookie.flipReverse(skey);
				return '<div class="pointer" onclick="__me.' + ltype + '.jump(\'' + key + '\')">'
					+ CT.dom.node(CAN.media[ltype].htmlSafe(key)).innerHTML + "</div>";
			}
		}
		// news
		var nsplit = url.split("news.html#!");
		if (nsplit.length > 1)
			return CT.dom.node(CAN.media.news.getAndShow(CAN.cookie.flipReverse(nsplit[1]))).innerHTML;
		// videos
		var embedder = CT.video.embed;
		if (["fit", "full"].indexOf(novid) != -1) {
			embedder = CT.video[novid];
			novid = false;
		}
		if (!novid) {
			var vidSplit = url.split("video.html#!");
			if (vidSplit.length > 1)
				return CT.dom.node(CAN.media.video.getAndShow(CAN.cookie.flipReverse(vidSplit[1]))).innerHTML;
			var vdata = CT.video.videoData(url);
			if (vdata)
				return embedder(vdata);
		}
	}
};
window.__me = CAN.media;

CT.parse.setLinkProcessor(CAN.media.loader.linkProcessor);
CAN.media.loader.registerBuilder("lister", CAN.media.loader.listOne);
var w = CAN.widget;
if (w && w.slider) {
	var genericBuilder = function(item) {
		return CAN.media.loader.contentNode(item,
			undefined, "bigslide hoverglow");
	};
	["thought", "meme"].forEach(function(variety) {
		w.slider.registerBuilder(variety, genericBuilder);
	});
}

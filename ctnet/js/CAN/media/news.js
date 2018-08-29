CAN.media.news = {
	"inviteButton": null,
	"current": null,
	"build": function(d, vindex, howmuch, nocat, v) {
		v = v || CAN.media.loader.args.news;
		var n = howmuch == "slider" && CT.dom.node() || CT.dom.div("",
			howmuch == "teaser" && "smallbottompadded" || "bottompadded");
		howmuch = howmuch || "full";

		if (howmuch == "embedded") {
			n.appendChild(CT.dom.link([
				CT.dom.div(d.title, "big bold"),
				CT.dom.img("/get?gtype=graphic&key=" + d.photo[0], "w1"),
				CT.dom.div(CT.parse.shortened(d.body, 400), "gray italic")
			], null, "/news.html#!" + CAN.cookie.flipReverse(d.key),
				"blue pointer nodecoration"));
			return n;
		}

		if (howmuch == "full" || howmuch == "intro") {
			if (howmuch == "intro")
				n.appendChild(CT.dom.div(CT.dom.link(d.title, function() {
					v.newMediaViewMoreCb(d); }), "newstitletext"));
			else
				n.appendChild(CT.dom.div(d.title, "big bold red"));
			var cclass = " categoriedbox";
			if (!nocat) {
				for (var i = 0; i < d.category.length; i++)
					cclass += " " + d.category[i];
			}
			if ((vindex || 0) < CAN.media.loader.newcount)
				cclass += " Latest";
			if (howmuch == "full")
				cclass += " bigpic w420";
			else if (howmuch == "intro")
				cclass += " mediumgraphic lmargimg";
			n.className += cclass;
			var a = CT.data.get(d.user);
			var byline = CT.dom.div("", "newstitle small italic");
			byline.appendChild(CT.dom.span("posted " + (d.date
				|| "(now)") + ", by ", "gray"));
			byline.appendChild(CT.dom.link(a.firstName + " " + a.lastName,
				null, "/feed.html#!" + CAN.cookie.flipReverse(a.key), "gray"));
			n.appendChild(byline);
		}

		// photo 1
		if (d.photo.length > 0) {
			if (howmuch == "full") {
				var topphoto = CAN.media.photo.viewSingle(CT.data.get(d.photo[0]), true);
				topphoto.firstChild.id = "toppic";
				n.appendChild(topphoto);
			}
			else {
				n.appendChild(CAN.media.photo.viewSingle(CT.data.get(d.photo[0]),
					true, "div", (howmuch == "result") ? "lfloat rpadded"
					: (howmuch == "intro") ? "right newsimg" : "right lmargimg",
					function() { v.newMediaViewMoreCb(d); }));
			}
		}

		if (howmuch == "teaser" || howmuch == "result" || howmuch == "slider") {
			var tnode = CT.dom.div(d.title,
				(howmuch=="teaser")&&"cutoff64"||"big bold bottompadded");
			n.appendChild(tnode);
			if (howmuch == "slider") {
				n.appendChild(CT.dom.node(CT.parse.shortened(d.body, 1200)));
				return n;
			}
			tnode.onclick = function() { v.newMediaViewMoreCb(d); };
			if (howmuch == "result")
				n.appendChild(CT.dom.node(CT.parse.shortened(d.body)));
			n.appendChild(CT.dom.node(CT.dom.link("FULL STORY",
				function() { v.newMediaViewMoreCb(d); })));
			n.appendChild(CT.dom.div("", "clearnode"));
			return n;
		}

	//    var b = processTemplate(d.body);
		var b = CT.parse.process(d.body);

		if (howmuch == "full") {
			CAN.media.news.current = d;
			!nocat && CT.dom.showHide(CAN.media.news.inviteButton.parentNode, true);
			// body
			n.appendChild(CT.dom.div(b, "newsbodytext"));
			//categories
			if (!nocat)
				n.appendChild(CAN.categories.listing(d.category));
			// other photos
			for (var i = 1; i < d.photo.length; i++)
				n.appendChild(CAN.media.photo.build(CT.data.get(d.photo[i]), true));
			// videos
			for (var i = 0; i < d.video.length; i++)
				n.appendChild(CAN.media.video.build(CT.data.get(d.video[i]),
					null, true));
			if (!nocat) {
				var convonode = CT.dom.div("loading conversation...", "red bordertop");
				n.appendChild(convonode);
				CAN.widget.conversation.load(v.uid, d.conversation, convonode, d.key);
			}
		}
		else if (howmuch == "intro") {
			var itxt = b.slice(0, b.indexOf("<br>", 100));
			if (itxt.length > 800)
				itxt = itxt.slice(0, 800) + "...";
			var nbt = CT.dom.div(itxt, "newsbodytext");
			if (nbt.firstChild.nodeName == "TABLE")
				nbt.firstChild.style.maxWidth = "200px";
			n.appendChild(nbt);
			if (!nocat)
				n.appendChild(CAN.categories.listing(d.category));
			var rfs = CT.dom.node(CT.dom.link("READ FULL STORY", function() {
				v.newMediaViewMoreCb(d); }));
			rfs.style.marginTop = "5px";
			n.appendChild(rfs);
			n.appendChild(CT.dom.node("", "div", "clearnode"));
		}
		else
			alert("invalid 'howmuch' passed into 'viewNews': " + howmuch);
		return n;
	},
	"slider": function(d) {
		var n = CAN.media.news.build(d, null, "slider", true);
		n.onclick = function() {
			CAN.media.loader.args.news.newMediaViewMoreCb(d);
		};
		return n;
	},
	"evidence": function(d) {
		var n = CT.dom.node();
		n.appendChild(CT.dom.div(CT.dom.link(d.title, function() {
			document.location = "/news.html#!" + CAN.cookie.flipReverse(d.key); }),
			"newstitletext"));
		n.appendChild(CT.dom.node(CT.parse.shortened(d.body, 900)));
		return n;
	},
	"intro": function(d, vindex) {
		return CAN.media.news.build(d, vindex, "intro");
	},
	"intronocat": function(d, vindex) {
		return CAN.media.news.build(d, vindex, "intro", true);
	},
	"teaser": function(d, vindex, vars) {
		return CAN.media.news.build(d, vindex, "teaser", null, vars);
	},
	"embedded": function(d) {
		return CAN.media.news.build(d, null, "embedded");
	},
	"getAndShow": function(nkey) {
		var notNewsPage = location.pathname.slice(1, 5) != "news",
			randid = "convonews" + nkey + CT.data.random(1000),
			n = CT.dom.div(null, "bordered padded round", randid),
			ndata = CT.data.get(nkey);
		if (ndata && ndata.title)
			n.innerHTML = CAN.media.news.embedded(ndata).innerHTML;
		else {
			CT.net.post("/get", {"gtype": "data", "key": nkey},
				"error retrieving news item", function(result) {
					ndata = result;
					CT.data.add(result);
					(CT.dom.id(n.id) || n).innerHTML = CAN.media.news.embedded(result).innerHTML;
			});
		}
		if (!notNewsPage) {
			setTimeout(function() {
				CT.dom.doWhenNodeExists(randid, function() {
					CT.dom.id(randid).onclick = function() {
						CAN.media.loader.args.news.newMediaViewMoreCb(ndata);
					};
				});
			}, 5000);
		}
		return n;
	}
};

CAN.media.cases.registerEvidence("news", CAN.media.news.evidence);
CAN.media.loader.registerBuilder("news", CAN.media.news.build);
CAN.media.loader.registerBuilder("newsintro", CAN.media.news.intro);
CAN.media.loader.registerBuilder("newsintronocat", CAN.media.news.intronocat);
CAN.media.loader.registerBuilder("newsteaser", CAN.media.news.teaser);
CAN.widget.slider.registerBuilder("news", CAN.media.news.slider);
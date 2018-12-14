CAN.media.meme = {
	build: function(d, vindex, v, htmlSafe) {
		var n = CT.dom.node();
		n.appendChild(CT.dom.img(d.image));
		var cclass = "bordered padded round bottommargined";
		if (!htmlSafe)
			cclass += " categoriedbox";
		for (var i = 0; i < d.category.length; i++)
			cclass += " " + d.category[i];
		if ((vindex || 0) < CAN.media.loader.newcount)
			cclass += " Latest";
		if (htmlSafe)
			cclass += " fwimg";
		n.className = cclass;
		if (d.uid) {
			n.appendChild(CAN.session.firstLastLink({
				"firstName": d.user, "key": d.uid
			}, false, true, "thoughtstream", true));
		}
		n.appendChild(CT.dom.node(CT.parse.process(d.title, false, true)));
		return n;
	},
	result: function(d) {
		return CT.dom.link(CAN.media.meme.build(d), null,
			CAN.media.meme.link(d.key), "nodecoration");
	},
	link: function(key) {
		return "/community.html#!Memes|" + CAN.cookie.flipReverse(key);
	},
	jump: function(key) {
		if (location.pathname.startsWith("/community.html"))
			viewSingleItem(CT.data.get(key), "meme");
		else
			window.location = CAN.media.meme.link(key);
	},
	htmlSafe: function(key) {
		var n = CT.dom.div(null, null, "convomeme" + key + CT.data.random(1000)),
			tdata = CT.data.get(key);
		if (tdata) {
			n.appendChild(CAN.media.meme.build(tdata, null, null, true));
		} else {
			CT.net.post("/get", {"gtype": "data", "key": key},
				"error retrieving meme", function(result) {
				CT.data.add(result);
				CT.dom.doWhenNodeExists(n.id, function() {
					CT.dom.id(n.id).appendChild(CAN.media.meme.build(result,
						null, null, true));
				});
			});
		}
		return n;
	}
};

CAN.media.loader.registerBuilder("meme", CAN.media.meme.build);
CAN.media.loader.registerBuilder("memeresult", CAN.media.meme.result);
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
		if (location.pathname.startsWith("/community.html")) {
			CAN.widget.conversation.jump(key, "meme", function(item) {
				viewSingleItem(item, "meme");
			});
		} else
			window.location = CAN.media.meme.link(key);
	},
	htmlSafe: function(key) {
		var n = CT.dom.div(null, null, "convomeme" + key + CT.data.random(1000)),
			tdata = CT.data.get(key);
		if (tdata && tdata.image) {
			n.appendChild(CAN.media.meme.build(tdata, null, null, true));
		} else {
			CAN.widget.conversation.jump(key, "meme", function(res, comm) {
				var cno = CT.dom.id(n.id);
				if (comm) {
					cno.appendChild(CAN.widget.conversation.bare(comm));
					cno.appendChild(CT.dom.link("from thread", null,
						CAN.media.meme.link(comm.key),
						"bigger block bold italic padded righted hoverglow nodecoration"));
				}
				cno.appendChild(CAN.media.meme.build(res,
					null, null, true));
				cno.className = "bordered padded";
			}, "data", true);
		}
		return n;
	}
};

CAN.media.loader.registerBuilder("meme", CAN.media.meme.build);
CAN.media.loader.registerBuilder("memeresult", CAN.media.meme.result);
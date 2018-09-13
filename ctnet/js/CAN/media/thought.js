CAN.media.thought = {
	build: function(d, vindex, v, htmlSafe) {
		var n = CT.dom.node();
		var cclass = "bordered padded round bottommargined categoriedbox";
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
		n.appendChild(CT.dom.node(d.date, "span", "gray"));
		n.appendChild(CT.dom.node(": ", "b"));
		n.appendChild(CT.dom.node(CT.parse.process(d.thought, false, true), "span"));
		return n;
	},
	result: function(d) {
		return CT.dom.link(CAN.media.thought.build(d), null,
			CAN.media.thought.link(d.key), "nodecoration");
	},
	link: function(key) {
		return "/community.html#!Stream|" + CAN.cookie.flipReverse(key);
	},
	jump: function(key) {
		if (location.pathname.startsWith("/community.html"))
			viewSingleItem(CT.data.get(key), "thought");
		else
			window.location = CAN.media.thought.link(key);
	},
	htmlSafe: function(key) {
		var n = CT.dom.div(null, null, "convothought" + key + CT.data.random(1000)),
			tdata = CT.data.get(key);
		if (tdata) {
			n.appendChild(CAN.media.thought.build(tdata, null, null, true));
		} else {
			CT.net.post("/get", {"gtype": "data", "key": key},
				"error retrieving thought", function(result) {
				CT.data.add(result);
				CT.dom.doWhenNodeExists(n.id, function() {
					CT.dom.id(n.id).appendChild(CAN.media.thought.build(result,
						null, null, true));
				});
			});
		}
		return n;
	}
};

CAN.media.loader.registerBuilder("thought", CAN.media.thought.build);
CAN.media.loader.registerBuilder("thoughtresult", CAN.media.thought.result);
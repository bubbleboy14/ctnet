CAN.media.thought = {
	build: function(d, vindex, v, htmlSafe) {
		var n = CT.dom.node();
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
		if (location.pathname.startsWith("/community.html")) {
			CAN.widget.conversation.jump(key, "thought", function(item) {
				viewSingleItem(item, "thought");
			});
		} else
			window.location = CAN.media.thought.link(key);
	},
	htmlSafe: function(key) {
		var n = CT.dom.div(null, null, "convothought" + key + CT.data.random(1000)),
			tdata = CT.data.get(key);
		if (tdata && tdata.title) {
			n.appendChild(CAN.media.thought.build(tdata, null, null, true));
		} else {
			CAN.widget.conversation.jump(key, "thought", function(res, comm) {
				var eno = CT.dom.id(n.id) || n;
				if (comm) {
					eno.appendChild(CAN.widget.conversation.bare(comm));
					eno.appendChild(CT.dom.link("from thread", null,
						CAN.media.thought.link(comm.key),
						"bigger block bold italic padded righted hoverglow nodecoration"));
					eno.className = "bordered padded";
				}
				eno.appendChild(CAN.media.thought.build(res, null, null, true));
			}, "data", true);
		}
		return n;
	}
};

CAN.media.loader.registerBuilder("thought", CAN.media.thought.build);
CAN.media.loader.registerBuilder("thoughtresult", CAN.media.thought.result);
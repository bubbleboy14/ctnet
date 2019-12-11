CAN.media.paper = {
	build: function(d, i, v, notit, single) {
		var n = CT.dom.node("", "div", "bordered padded round bottommargined"),
			viewIt = function() { CAN.media.paper.jump(d.key); };
		if (v) {
			if (!notit) {
				n.appendChild(CT.dom.node(CAN.widget.invite.button(d,
					"paper", "read", CAN.cookie.getUid()), "div", "right"));
				n.appendChild(CT.dom.node(CT.dom.link(d.title,
					viewIt), "div", "big blue nodecoration"));
			}
			n.appendChild(CT.dom.node(d.body));
			if (d.conversation) {
				if (!single) {
					n.appendChild(CT.dom.button("View Conversation",
						viewIt, "w1"));
				} else {
					var convonode = CT.dom.node("loading conversation...", "div", "bordertop");
					n.appendChild(convonode);
					CAN.widget.conversation.load(v.uid,
						d.conversation, convonode, d.key);
				}
			}
		}
		else {
			n.appendChild(CT.dom.node(CT.dom.link(d.title, null,
				CAN.media.paper.link(d.key)), "div", "big"));
			n.appendChild(CT.dom.node(CT.parse.shortened(d.body)));
		}
		return n;
	},
	link: function(key) {
		return "/recommendations.html#!PositionPapers|"
			+ CAN.cookie.flipReverse(key);
	},
	jump: function(key) {
		if (location.pathname.slice(1, -5) == "recommendations") {
			CAN.widget.conversation.jump(key, "positionpaper", function(d) {
				CAN.media.paper.viewSingle(d);
			});
		} else
			location = CAN.media.paper.link(key);
	},
	htmlSafe: function(key) {
		var n = CT.dom.div(null, null, "convopaper" + key + CT.data.random(1000)),
			tdata = CT.data.get(key);
		if (tdata && tdata.title)
			n.appendChild(CAN.media.paper.result(tdata));
		else {
			CAN.widget.conversation.jump(key, "positionpaper", function(res, comm) {
				var cno = CT.dom.id(n.id);
				if (comm) {
					cno.appendChild(CAN.widget.conversation.bare(comm));
					cno.appendChild(CT.dom.link("from thread", null,
						CAN.media.paper.link(comm.key),
						"bigger block bold italic padded righted hoverglow nodecoration"));
				}
				cno.appendChild(CAN.media.paper.result(res));
				cno.className = "bordered padded";
			}, "data", true);
		}
		return n;
	},
	viewSingle: function(paper) {
		if (!paper.viewed) {
			CT.panel.add(paper.title, null, null,
				CT.dom.id("sppl"),
				null, paper.key, null, function() {
					CAN.widget.share.updateShareItem("recommendations",
						paper.key, "PositionPapers");
				});
			var cnode = CT.dom.id("sbcontent" + paper.key);
			cnode.parentNode.insertBefore(CT.dom.node(CAN.widget.invite.button(paper,
				"paper", "read", CAN.cookie.getUid()), "div", "right"),
				cnode.parentNode.firstChild);
			cnode.appendChild(CAN.media.paper.build(paper,
				null, { uid: CAN.cookie.getUid() }, true, true));
			CT.dom.id("spp").style.display = "block";
			paper.viewed = true;
		}
		CT.panel.swap(paper.key);
		CAN.widget.share.updateShareItem("recommendations",
			paper.key, "PositionPapers");
	},
	result: function(d, lastPaper) {
		return CT.dom.node(CAN.media.paper.build(d));
	}
};

CAN.media.loader.registerBuilder("paper", CAN.media.paper.build);
CAN.media.loader.registerBuilder("paperresult", CAN.media.paper.result);
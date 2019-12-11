CAN.media.opinion = {
	build: function(d, i, v, notit, single) {
		var n = CT.dom.node("", "div", "bordered padded round bottommargined"),
			viewIt = function() { CAN.media.opinion.jump(d.key); };
		if (v) {
			if (!notit) {
				n.appendChild(CT.dom.node(CAN.widget.invite.button(d,
					"opinion", "consider", CAN.cookie.getUid()), "div", "right"));
				n.appendChild(CT.dom.node(CT.dom.link(d.title,
					viewIt), "div", "big blue nodecoration"));
			}
			n.appendChild(CT.dom.node(CT.parse.process(d.body)));
			if (d.conversation_active) {
				if (!single) {
					n.appendChild(CT.dom.button("View Conversation",
						viewIt, "w1"));
				} else {
					var convonode = CT.dom.node("loading conversation...", "div", "bordertop");
					n.appendChild(convonode);
					CAN.widget.conversation.load(v.uid, d.conversation, convonode, d.key);
				}
			}
		}
		else {
			n.appendChild(CT.dom.div(CT.dom.link(d.title, null,
				CAN.media.opinion.link(d.key)), "big"));
			n.appendChild(CT.dom.node(CT.parse.process(CT.parse.shortened(d.body))));
		}
		return n;
	},
	link: function(key) {
		return "/recommendations.html#!OpinionsAndIdeas|"
			+ CAN.cookie.flipReverse(key);
	},
	jump: function(key) {
		if (location.pathname.slice(1, -5) == "recommendations") {
			CAN.widget.conversation.jump(key, "opinionidea", function(d) {
				CAN.media.opinion.viewSingle(d);
			});
		} else
			location = CAN.media.opinion.link(key);
	},
	htmlSafe: function(key) {
		var n = CT.dom.div(null, null, "convoopinion" + key + CT.data.random(1000)),
			tdata = CT.data.get(key);
		if (tdata && tdata.title)
			n.appendChild(CAN.media.opinion.result(tdata));
		else {
			CAN.widget.conversation.jump(key, "opinionidea", function(res, comm) {
				var cno = CT.dom.id(n.id);
				if (comm) {
					cno.appendChild(CAN.widget.conversation.bare(comm));
					cno.appendChild(CT.dom.link("from thread", null,
						CAN.media.opinion.link(comm.key),
						"bigger block bold italic padded righted hoverglow nodecoration"));
				}
				cno.appendChild(CAN.media.opinion.result(res));
				cno.className = "bordered padded";
			}, "data", true);
		}
		return n;
	},
	viewSingle: function(opinion) {
		if (!opinion.viewed) {
			CT.panel.add(opinion.title, null, null,
				CT.dom.id("soil"),
				null, opinion.key, null, function() {
					CAN.widget.share.updateShareItem("recommendations",
						opinion.key, "OpinionsAndIdeas");
				});
			var cnode = CT.dom.id("sbcontent" + opinion.key);
			cnode.parentNode.insertBefore(CT.dom.node(CAN.widget.invite.button(opinion,
				"opinion", "consider", CAN.cookie.getUid()), "div", "right"),
				cnode.parentNode.firstChild);
			cnode.appendChild(CAN.media.opinion.build(opinion,
				null, { uid: CAN.cookie.getUid() }, true, true));
			CT.dom.id("soi").style.display = "block";
			opinion.viewed = true;
		}
		CT.panel.swap(opinion.key);
		CAN.widget.share.updateShareItem("recommendations",
			opinion.key, "OpinionsAndIdeas");
	},
	result: function(d, lastIdea) {
		return CT.dom.node(CAN.media.opinion.build(d));
	}
};

CAN.media.loader.registerBuilder("opinion", CAN.media.opinion.build);
CAN.media.loader.registerBuilder("idearesult", CAN.media.opinion.result);
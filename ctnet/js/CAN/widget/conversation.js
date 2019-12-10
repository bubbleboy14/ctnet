CAN.widget.conversation = {
	_: {},
	"setCommentPrefix": function(cp) {
		core.config.ctnet.conversation.comment_prefix = cp ? "<b>[" + cp + "]</b> " : "";
	},
	"hash": function(mtype, loader, exporter) {
		var _hash = CAN.cookie.flipReverse(document.location.hash.slice(2));
		if (_hash) {
			CAN.widget.conversation.jump(_hash, mtype, loader, exporter);
			document.location.hash = "";
		};
	},
	"jump": function(key, mtype, loader, exporter) {
		CT.data.checkAndDo([key], function() {
			var med = CT.data.get(key);
			loader = loader || CAN.media[mtype].viewSingle;
			if (med && med.mtype == mtype) // else it's a comment
				return loader(med);
			CT.db.one(key, function(comm) {
				CT.db.get(mtype, function(meds) {
					loader(meds[0]);
					CAN.widget.conversation.select(key, 1200);
				}, null, null, null, {
					conversation: comm.conversation
				}, null, null, exporter);
			});
		});
	},
	"select": function(id, delay) {
		CT.dom.doWhenNodeExists("com_" + id, function(n) {
			n.onclick();
			setTimeout(function() {
				n.scrollIntoView({
					behavior: "smooth",
					block: "end"
				});
			}, delay);
		});
	},
	"comment": function(c, commentsnode, uid, noflagging) {
		var u = CT.data.get(c.user), _ = CAN.widget.conversation._,
			righty = CT.dom.div(CT.dom.img("/img/buttons/clipboard.png",
			"clip", function() {
				var shr = CAN.widget.share;
				CT.data.copy(shr.pageAddr(location.pathname.slice(1,
					-5), CAN.cookie.flipReverse(c.key), shr.currentSharePrefix));
			}), "right clearnode"),
			commentnode = CT.dom.div(righty, "comment", "com_" + c.key);
		if (!noflagging) {
			righty.appendChild(CT.dom.button("Flag", function() {
				var prob = prompt("What's the problem?");
				if (!prob) return;
				CT.net.post("/edit", {"eid": uid, "data": {"key": c.key,
					"flag": prob}}, "error flagging comment",
					function() { alert("flagged!"); });
			}));
		}
		commentnode.appendChild(CAN.session.firstLastLink(u, null, null, null, !uid));
		commentnode.appendChild(CT.dom.node(" says: ", "b"));
		commentnode.appendChild(CT.dom.span(CT.parse.process(c.body)));
		if (commentsnode.innerHTML == "no comments yet!")
			commentsnode.innerHTML = "";
		commentnode.onclick = function() {
			if (_.selected) {
				_.selected._selected = false;
				_.selected.className = "comment";
			}
			if (_.selected == commentnode)
				delete _.selected;
			else {
				_.selected = commentnode;
				var sel = commentnode._selected = !commentnode._selected;
				commentnode.classList[sel ? "add" : "remove"]("active");
			}
		};
		commentsnode.appendChild(commentnode);
	},
	"input": function(uid, ckey, convonode, contentkey, taid, noflagging, commentsnode, charlimit, blurs) {
		taid = taid || CT.dom._get_ta_id();
		charlimit = charlimit || 500;
		var linkMod = new CT.modal.Prompt({
			clear: true,
			transition: "slide",
			prompt: "what's the link?",
			cb: function(url) {
				CT.net.post({
					path: "/get",
					spinner: true,
					params: {
						gtype: "og",
						url: url
					},
					cb: function(data) {
						rinput.value = data;
						rinput.onkeyup();
					}
				});
			}
		});
		var rinput = CT.dom.richInput(convonode, taid,
			ckey != "conversation" && CT.dom.div([
				CT.dom.button("Add Comment", function() {
					var cbody = CT.dom.id(taid);
					var charcount = CT.dom.id(taid+"cc");
					var b = CT.parse.sanitize(cbody.value);
					if (b == "")
						return alert("say what?");
					b = core.config.ctnet.conversation.comment_prefix + b;
					CT.net.post("/say", {"uid": uid, "conversation": ckey,
						"body": b, "contentkey": contentkey},
						"error posting comment", function() {
							CAN.widget.conversation.comment({"user": uid, "body": b},
								commentsnode, uid, noflagging);
							cbody.value = "";
							cbody.focus();
							charcount.innerHTML = "(" + charlimit + " chars left)"; });
				}),
				CT.dom.button("Embed Link", linkMod.show)
			]) || null, null, charlimit, blurs, ckey == "conversation");
	},
	"load": function(uid, ckey, convonode, contentkey, taid, noflagging, charlimit, blurs) {
		if (uid == "nouid") uid = null;
		uid = uid || core.config.ctnet.conversation.anon_uid;
		if (uid && !CT.data.get(uid)) {
			CT.data.add({
				"key": uid,
				"firstName": CAN.cookie.checkFirstName(),
				"lastName": CAN.cookie.checkLastName()
			});
		}
		if (ckey == "conversation")
			return CAN.widget.conversation.input(uid, ckey, convonode, contentkey, taid);
		CT.data.checkAndDo([ckey], function() {
			var convo = CT.data.get(ckey);
			var uids = [];
			for (var i = 0; i < convo.comments.length; i++)
				uids.push(convo.comments[i].user);
			CT.data.checkAndDo(uids, function() {
				convonode.innerHTML = "";
				var commentsnode = CT.dom.node("no comments yet!");
				convonode.appendChild(commentsnode);
				for (var i = 0; i < convo.comments.length; i++)
					CAN.widget.conversation.comment(convo.comments[i],
						commentsnode, uid, noflagging);
				if (uid)
					CAN.widget.conversation.input(uid, ckey, convonode, contentkey,
						taid, noflagging, commentsnode, charlimit, blurs);
				else if (core.config.ctnet.conversation.allow_anonymous_comments) {
					var rsubnode = CT.dom.node();
					var tryrecap = function() {
						CT.recaptcha.submit(function() {
							convonode.removeChild(rnode);
							var anonnamefield = CT.dom.field();
							CT.dom.blurField(anonnamefield, ["What's Your Name?",
								"What Should We Call You?", "Who Are You?",
								"Who Goes There?", "Please Enter A Nickname"]);
							convonode.appendChild(anonnamefield);
							CT.dom.inputEnterCallback(anonnamefield, function() {
								var anonname = anonnamefield.value.trim();
								if (!anonname)
									return anonnamefield.blur();
								CT.net.post("/reganon", {"name": anonname},
									"error registering anonymous user name",
									function(anonuser) {
										CT.data.add(anonuser);
										uid = anonuser.key;
										convonode.removeChild(anonnamefield);
										convonode.appendChild(CT.dom.node("Hello " + anonname));
										CAN.widget.conversation.input(uid, ckey,
											convonode, contentkey, taid, noflagging,
											commentsnode, charlimit, blurs);
									});
							});
						});
					};
					var rnode = CT.dom.node([rsubnode,
						CT.dom.button("Submit", tryrecap)]);
					CT.recaptcha.build(CAN.config.RECAPTCHA_KEY, rsubnode, null, tryrecap);
					convonode.appendChild(rnode);
				} else {
					convonode.appendChild(CT.dom.node(CT.dom.link("Join the conversation!",
						null, "login.html"), "div", "topmargined"));
				}
			});
		}, null, null, "comments");
	}
};
CAN.widget.stream = {
	// thought stream widget
	"load": function(streamnode, filternode, cb, number) {
		var tsvars = { "node": streamnode, "mtype": "thought", "number": number || 4 };
		tsvars.cb = function() {
			var mdata = CAN.media.loader.cache[CAN.media.loader.varsToKey(tsvars)];
			var usecats = [];
			for (var i = 0; i < mdata.length; i++)
				usecats = usecats.concat(mdata[i].category);
			CAN.categories.loadSelector(CT.data.uniquify(usecats),
				filternode, cb);
			cb();
		};
		CAN.media.loader.load(tsvars);
	},

	"jumpTo": function(conversation) {
		CT.net.post({
			path: "/get",
			params: {
				gtype: "convolink",
				key: conversation
			},
			cb: function(clink) {
				window.location = clink;
			}
		});
	},

	"getNode": function(d, opts) {
		var n = CT.dom.div("", "padded bordered round bottommargined");
		var tnode = CT.dom.node(CT.parse.process(d[opts.type] || d.body || d.idea,
			false, opts.processArg));
		if (opts.onclick) {
			tnode.onclick = function() {
				opts.onclick(d);
			};
			tnode.className = "pointer";
		}
		if (opts.taguser && d.uid)
			n.appendChild(CAN.session.firstLastLink({ "firstName": d.user,
				"key": d.uid }, false, true, null, true));
		n.appendChild(tnode);
		if (opts.noConvo) {
			n.appendChild(CT.dom.button("Check out the conversation", function() {
				CAN.widget.stream.jumpTo(d.conversation);
			}, "w1"));
		} else {
			n.appendChild(CT.dom.node("", "hr"));
			var convonode = CT.dom.node();
			CAN.widget.conversation.load(opts.uid, d.conversation,
				convonode, d.key, d.conversation+"ta", true);
			n.appendChild(convonode);
		}
		return n;
	},

	// generic node stream adder
	"addNodes": function(opts) {
		var utinfo = CT.dom.node(opts.info);
		var utinput = CT.dom.node();
		var utlist = CT.dom.node("no " + opts.type + "s yet!");
		var addNode = opts.pnode.addNode = function(d, topdown) {
			var n = CAN.widget.stream.getNode(d, opts);
			if (!opts.taguser && !opts.listonly)
				n.appendChild(CAN.media.moderation.remove(d, opts));
			if (utlist.innerHTML == "no " + opts.type + "s yet!") {
				utlist.innerHTML = "";
				utlist.appendChild(n);
			} else if (topdown)
				utlist.appendChild(n);
			else
				utlist.insertBefore(n, utlist.firstChild);
		};
		if (!opts.noInput) {
			var linkMod = new CT.modal.Prompt({
				clear: true,
				transition: "slide",
				prompt: "what's the link?",
				cb: function(url) {
					CT.net.post({
						path: "/get",
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
			var rinput = CT.dom.richInput(utinput, opts.type + "input", CT.dom.div([
				CT.dom.button("Post " + CT.parse.capitalize(opts.type), function() {
					var cbody = CT.dom.id(opts.type + "input");
					var charcount = CT.dom.id(opts.type + "inputcc");
					var b = CT.parse.sanitize(cbody.value);
					if (b == "")
						return alert("say what?");
					var postOpts = {"key": opts.key || opts.type};
					postOpts[opts.bodyproperty || 'body'] = b.replace(/%E2%80%99/g, "'");
					CAN.categories.tagAndPost(postOpts, function(item) {
						CT.data.add(item);
						addNode(item);
						cbody.value = "";
						charcount.innerHTML = "(500 chars left)";
					}, 'anonymous');
				}),
				CT.dom.button("Embed Link", linkMod.show)
			]));
		}
		for (var i = 0; i < opts.items.length; i++)
			addNode(opts.items[i]);
		if (!opts.listonly) {
			opts.pnode.appendChild(utinfo);
			opts.pnode.appendChild(utinput);
			opts.pnode.appendChild(CT.dom.node("", "hr"));
		}
		opts.pnode.appendChild(utlist);
	},

	// thoughts
	"thought": function(pnode, uid, thoughts, listonly, taguser, onclick) {
		CAN.widget.stream.addNodes({
			pnode: pnode,
			uid: uid,
			items: thoughts,
			listonly: listonly,
			taguser: taguser,
			onclick: onclick,
			type: 'thought',
			noConvo: true,
			info: "Post a thought or idea here and it will appear on the CAN homepage in our 'Global Thought Stream'."
		});
	},

	// changes
	"changeidea": function(pnode, uid, changes, listonly, taguser, onclick) {
		CAN.widget.stream.addNodes({
			pnode: pnode,
			uid: uid,
			items: changes,
			listonly: listonly,
			taguser: taguser,
			onclick: onclick,
			type: 'idea',
			key: 'changeidea',
			bodyproperty: 'idea',
			info: "How can we change the world?"
		});
	},

	// questions
	"question": function(pnode, uid, questions, listonly, taguser, onclick) {
		CAN.widget.stream.addNodes({
			pnode: pnode,
			uid: uid,
			items: questions,
			listonly: listonly,
			taguser: taguser,
			onclick: onclick,
			type: 'question',
			bodyproperty: 'question',
			info: "Any questions?"
		});
	},

	// chatter
	"comment": function(pnode, uid, comments, listonly, taguser, processArg) {
		CAN.widget.stream.addNodes({
			pnode: pnode,
			uid: uid,
			items: comments,
			listonly: listonly,
			taguser: taguser,
			type: 'comment',
			info: "Here's the latest chatter...",
			noInput: true,
			noConvo: true,
			processArg: typeof processArg != "function" && processArg // no onclick
		});
	}
};
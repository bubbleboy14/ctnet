CT.parse.set_ts_server_offset(CAN.config.pubsub.timezone_offset);
CAN.chat = CT.chat;
Object.assign(CAN.chat.settings, {
	NO_INFO_MSG: " hasn't filled out the 'Other Interests or Comments' section on the profile page. How mysterious!",
	defaults: {
		lastName: CAN.cookie.checkLastName(),
		firstName: CAN.cookie.checkFirstName(),
		zipcode: { city: "unknown" }
	},
	require: ["zipcode"],
	location: {
		host: CAN.config.pubsub.host,
		port: CAN.config.pubsub.port
	},
	data: {},
	on: {
		roomSelect: function(room) {
			CAN.widget.share.updateShareItem("community", room, "People");
		}
	}
});

Object.assign(CAN.chat, {
	"userSpotlight": function(key, uspot, isWidget, noFocus) {
		CAN.chat.udata(key, function(u) {
			uspot.innerHTML = "";
			uspot.appendChild(CT.dom.node(CT.dom.img("/get?gtype=avatar&uid="
				+ CAN.cookie.flipReverse(u.key)),
				"div", isWidget ? "right" : "right shiftupsome"));
			uspot.appendChild(CT.dom.node(u.fullName, "div", "bold"));
			uspot.appendChild(CT.dom.node("Hometown: " + u.zipcode.city));
			if (u.lastName != "(guest)")
				uspot.appendChild(CT.dom.link("View Feed", null, "/feed.html#!"
					+ CAN.cookie.flipReverse(u.key), null, null, null, true));
			!noFocus && CAN.chat.focusChatInput();
		});
	},
	"loadAllChats": function(uid, chpanels, chsides, uspot, cb, mr, mrlink, mrcontainer) {
		CAN.chat.init();
		if (!uid) { // widget only
			var namePrompt = CT.dom.node();
			namePrompt.appendChild(CT.dom.node([
				CT.dom.node("Enter your name:", "span"),
				CT.dom.inputEnterCallback(CT.dom.field(), function(gname) {
					document.location.hash = "ue";
					chpanels.removeChild(namePrompt);
					var guestname = gname + "[guest]";
					CAN.cookie.set(guestname);
					CAN.chat.loadAllChats(guestname, chpanels, chsides,
						uspot, cb, mr, mrlink, mrcontainer);
					CAN.cookie.set();
				})
			], "div", "bold bottompadded"));
			namePrompt.appendChild(CT.dom.link("Or sign in to join this chat room :)",
				function() {
					window.open(location.protocol + core.config.ctnet.domain + "/login.html",
						"_blank");
				}));
			chpanels.appendChild(namePrompt);
			return;
		}
		var isGuest = uid.indexOf("guest") != -1;
		var isWidget = false;
		if (!mr) {
			isWidget = true;
			mr = CT.dom.id("chitems");
			mr.appendChild(CT.dom.node("Main Rooms",
				"div", "big bold bottommargined"));
		}
		var loadGroupRooms = function() {
			var pdata = {"approved": "both", "gtype": "media",
				"list_only": 1, "mtype": "group", "number": 1000, "offset": 0};
			if (!isGuest)
				pdata.uid = pdata.authid = uid;
			CT.net.post("/get", pdata, "error retrieving groups",
				function(glist) {
					var yg = [];
					var og = [];
					for (var i = 0; i < glist.length; i++) {
						var g = glist[i];
						var capped = CAN.chat.loadChatRoom(uid, g.title, chsides, uspot, isWidget);
						CAN.chat.groups[g.key] = capped;
						if (g.memtype)
							yg.push(capped);
						else
							og.push(capped);
					}
					if (yg.length > 0) {
						mr.appendChild(CT.dom.node("Your Action Groups",
							"div", "big bold topmargined bottommargined"));
						CT.panel.load(yg, true, "ch", mr,
							null, null, null, true);
					}
					if (og.length > 0) {
						var agtitle = isGuest ? "Action Groups" : "More Action Groups";
						mr.appendChild(CT.dom.node(agtitle,
							"div", "big bold topmargined bottommargined"));
						CT.panel.load(og, true, "ch", mr,
							null, null, null, true);
					}
					cb && cb();
				});
		};

		if (isGuest) {
			CAN.chat.loadChatGroup(uid, ["global", "peace", "law & order", "environment",
				"industry", "government"], null, isWidget, chsides, uspot, isWidget);
			if (isWidget)
				loadGroupRooms();
			else
				cb && cb();
		}
		else CT.net.post("/get", {"gtype": "user", "uid": uid, "role": 1},
			"error retrieving roles", function(u) {
				CT.data.add(u);

				// main rooms
				CAN.chat.loadChatGroup(uid, ["global", "peace", "law & order",
					"environment", "industry", "government"],
					null, isWidget, chsides, uspot, isWidget);

				// more rooms
				if (isWidget) {
					mr.appendChild(CT.dom.node("Your Area",
						"div", "big bold topmargined bottommargined"));
				} else {
					mrlink.onclick = function() {
						if (mrlink.innerHTML == "show more rooms") {
							mrlink.innerHTML = "hide more rooms";
							mrcontainer.style.display = "block";
						}
						else {
							mrlink.innerHTML = "show more rooms";
							mrcontainer.style.display = "none";
						}
					};
				}

				// area rooms
				CAN.chat.loadChatGroup(uid, [u.zipcode.state, u.zipcode.city,
					u.zipcode.code], mr, isWidget, chsides, uspot, isWidget);

				// contribution rooms
				if (u.role.length > 0) {
					mr.appendChild(CT.dom.node("Your Contributions",
						"div", "big bold topmargined bottommargined"));
					var crooms = CT.data.copyList(u.role);
					var founders = ["greg", "paul", "mario"];
					if (founders.indexOf(crooms[0]) != -1)
						crooms[0] = "founder";
					CAN.chat.loadChatGroup(uid, crooms, mr,
						true, chsides, uspot, isWidget);
				}

				loadGroupRooms();
			});
	}
});
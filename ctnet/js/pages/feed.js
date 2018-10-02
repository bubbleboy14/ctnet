CT.require("CT.align");
CT.require("CT.data");
CT.require("CT.db");
CT.require("CT.dom");
CT.require("CT.parse");
CT.require("CT.trans");
CT.require("CT.video");
CT.require("CAN.config");
CT.require("CAN.cookie");
CT.require("CAN.frame");
CT.require("CAN.session");
CT.require("CAN.widget.slider");
CT.require("CAN.widget.stream");
CT.require("CAN.media.all");

var empty, chunk = 15, offset = 0,
	hash = location.hash.slice(2),
	plink = "/profile.html?u=" + hash,
	uid = CAN.cookie.flipReverse(hash);
var refill = function() {
	!empty && CT.net.post({
		path: "/get",
		spinner: true,
		params: {
			uid: uid,
			chunk: chunk,
			offset: offset,
			gtype: "skinfo"
		},
		cb: function(fulld) {
			var skin = fulld.skin,
				data = fulld.data;
			if (!(offset || data.length))
				window.location = plink;
			CT.data.addSet(data);
			if (!offset) { // first request
				CT.dom.addContent(document.body, CT.dom.link("profile", null, plink,
					"fixed cbl mosthigh biggerest whitelink nodecoration hoverglow"));
				if (skin) {
					skin.font && CT.dom.addStyle(null, null, {
						body: {
							"font-family": skin.font
						}
					});
					skin.color && CT.dom.addStyle(null, null, {
						body: {
							color: skin.color
						}
					});
					skin.background && CT.dom.addStyle(null, null, {
						body: {
							background: skin.background
						}
					});
					skin.img && CT.dom.addStyle(null, null, {
						body: {
							background: "url(" + skin.img + ")",
							"background-size": "cover"
						}
					});
					skin.css && CT.dom.addStyle(skin.css);
					if (skin.title) {
						CT.dom.setContent("feed_title", skin.title);
						CT.dom.setContent(CT.dom.tag("title")[0], skin.title);
					}
					if (skin.chatter) {
						var chchunk = 6, chparams = {
							uid: uid,
							offset: 0,
							number: chchunk,
							gtype: "media",
							mtype: "comment"
						};
						CT.dom.id("feed").classList.add("w4-5");
						CT.dom.show("feed_chatter");
						CT.net.post("/get", chparams, null, function(items) {
							var fcnode = CT.dom.id("feed_chatter"),
								fcrefiller = CT.dom.div();
							fcrefiller.on("visible", function() {
								chparams.offset += chchunk;
								CT.dom.remove(fcrefiller);
								CT.net.post("/get", chparams, null, function(cz) {
									for (var i = 0; i < cz.length; i++)
										fcnode.addNode(cz[i], true);
									if (cz.length == chchunk)
										CT.dom.addContent(fcnode, fcrefiller);
								});
							});
							CAN.widget.stream.comment(fcnode, null,
								items.reverse(), false, true, "full");
							CT.dom.addContent(fcnode, fcrefiller);
						});
					}
					if (skin.chat) {
						CT.dom.loadAllNode(true);
						CAN.frame.loadSiteWideChat();
					}
				}
			}
			CT.dom.addContent("feed", data.map(CAN.media.loader.contentNode));
			empty = data.length != chunk;
			if (empty)
				CT.dom.remove("refiller");
			else if (!offset) { // first request
				CT.dom.addContent(document.body, CT.dom.div(null, null, "refiller", {
					onvisible: refill
				}));
			}
			offset += chunk;
		}
	});
};
CT.onload(refill);
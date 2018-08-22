CT.require("CT.align");
CT.require("CT.data");
CT.require("CT.db");
CT.require("CT.dom");
CT.require("CT.parse");
CT.require("CT.trans");
CT.require("CAN.config");
CT.require("CAN.cookie");
CT.require("CAN.frame");
CT.require("CAN.media.loader");
CT.require("CAN.widget.stream");

var empty, chunk = 15, offset = 0,
	uid = CAN.cookie.flipReverse(location.hash.slice(2));
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
			CT.data.addSet(data);
			if (skin && !offset) { // first request
				skin.css && CT.dom.addStyle(skin.css);
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
				if (skin.title) {
					CT.dom.setContent("feed_title", skin.title);
					CT.dom.setContent(CT.dom.tag("title")[0], skin.title);
				}
				if (skin.chatter) {
					CT.dom.id("feed").classList.add("w4-5");
					CT.dom.show("feed_chatter");
				    CT.net.post("/get", {
				    	uid: uid,
				    	number: 6,
				    	gtype: "media",
				    	mtype: "comment"
				    }, null, function(items) {
				        CAN.widget.stream.comment(CT.dom.id("feed_chatter"),
				        	null, items.reverse(), false, true, "full");
				    });
				}
				if (skin.chat) {
					CT.dom.loadAllNode(true);
					CAN.frame.loadSiteWideChat();
				}
			}
			CT.dom.addContent("feed", data.map(CAN.media.loader.contentNode));
			empty = data.length != chunk;
			if (empty)
				CT.dom.remove("refiller");
			else if (!offset) { // first request
				var io = new IntersectionObserver(function(entz) {
					if (entz[0].intersectionRatio)
						refill();
				}), refiller = CT.dom.div(null, null, "refiller");
				io.observe(refiller);
				CT.dom.addContent(document.body, refiller);
			}
			offset += chunk;
		}
	});
};
CT.onload(refill);
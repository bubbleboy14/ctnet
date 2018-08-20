CT.require("CT.data");
CT.require("CT.db");
CT.require("CT.dom");
CT.require("CT.parse");
CT.require("CT.trans");
CT.require("CAN.media.loader");
CT.require("CAN.widget.stream");

var empty, chunk = 15, offset = 0,
	uid = location.hash.slice(2);
refill = function() {
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
				CT.dom.addStyle(skin.css);
				CT.dom.setContent("feed_title", skin.title);
			}
			CT.dom.addContent("feed", data.map(CAN.media.loader.contentNode));
			offset += chunk;
			empty = data.length != chunk;
		}
	});
};
CT.onload(refill);
CT.require("CT.dom");

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
			if (skin && !offset) { // first request
				CT.dom.addStyle(skin.css);
				CT.dom.setContent("feed_title", skin.title);
			}
			CT.dom.addContent("feed", JSON.stringify(data));
			offset += chunk;
			empty = data.length != chunk;
		}
	});
};
refill();
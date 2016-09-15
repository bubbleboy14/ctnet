CT.require("CT.data");
CT.require("CT.dom");
CT.require("CT.parse");
CT.require("CT.video");
CT.require("CAN.cookie");
CT.require("CAN.media.loader");
CT.require("CAN.media.moderation");
CT.require("CAN.media.video");
CT.require("CAN.session");
CT.require("CAN.widget.action");
CT.require("CAN.widget.conversation");

CT.onload(function() {
	var _hash = document.location.hash.slice(1),
		snode = CT.dom.id("stream");
	if (!_hash)
		return snode.appendChild(CT.dom.node("Sorry, no Action Group specified!"));
	CAN.widget.action.load("stream", CAN.cookie.flipReverse(_hash), function(wdata) {
		CT.data.add(wdata.stream);
		CAN.widget.conversation.load(CAN.cookie.getUid(), wdata.stream.key, snode);
	});
});
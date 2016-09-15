CT.require("CT.data");
CT.require("CT.dom");
CT.require("CT.parse");
CT.require("CT.panel");
CT.require("CT.modal");
CT.require("CT.storage");
CT.require("CT.trans");
CT.require("CT.map");
CT.require("CAN.cookie");
CT.require("CAN.widget.action");
CT.require("CAN.widget.map");

CT.onload(function() {
	var _hash = document.location.hash.slice(1),
		mnode = CT.dom.id("map");
	if (!_hash)
		return mnode.appendChild(CT.dom.node("Sorry, no Action Group specified!"));
	CAN.widget.action.load("map", CAN.cookie.flipReverse(_hash), function(wdata) {
		var map = new CAN.widget.map.Map({ node: mnode });
		map.showPlaces();
	});
});
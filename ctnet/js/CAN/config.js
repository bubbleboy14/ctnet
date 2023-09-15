CT.require("core");
var c = CAN.config = core.config.ctnet;
c.mobile.page = c.mobile.menus[CT.info.page];
// get rid of scrambler bs below -- now built into ct (properly)
c.scrambler = c.scrambler || CT.net._scrambler;
c.scramlen = c.scrambler.length;
c.scramlenh = c.scramlen / 2;

c.setPage = function(type, name, image, data) {
	var h = document.head;
	h.appendChild(CT.dom.node(JSON.stringify(CT.merge(data, {
			"@context": "http://schema.org",
			"@type": type,
			"name": name,
			"image": image
	})), "script", null, null, {
		type: 'application/ld+json'
	}));
	CT.dom.setContent(h.getElementsByTagName("title")[0], name + " - CAN")
};
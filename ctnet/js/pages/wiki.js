CT.require("CT.dom");
CT.require("CT.panel");
CT.require("CAN.cookie");
CT.require("CAN.widget.action");

onload = function() {
	var _hash = document.location.hash.slice(1);
	if (!_hash)
		return CT.dom.id("sbpanels")
			.appendChild(CT.dom.node("Sorry, no Action Group specified!"));
	CAN.widget.action.load("wiki", CAN.cookie.flipReverse(_hash), function(wdata) {
		var names = [];
		var nospace = [];
		var pages = wdata.wiki.pages;
		for (var i = 0; i < pages.length; i++) {
			var pageTitle = pages[i].title;
			names.push(pageTitle);
			nospace.push(pageTitle.replace(/ /g, ""));
		}
		CT.panel.load(names, null, null, null, null, nospace);
		for (var i = 0; i < nospace.length; i++) {
			var linkNode = CT.dom.id("sbitem" + nospace[i]);
			linkNode.onclick = linkNode.firstChild.onclick;
			var bodyNode = CT.dom.id("sbcontent" + nospace[i]);
			bodyNode.appendChild(CT.dom.node(pages[i].body,
				"div", "bodybox"));
			bodyNode.previousSibling.className += " titlebox";
		}
	});
};
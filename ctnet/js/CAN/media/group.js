CAN.media.group = {
	"build": function(d) {
	    var n = CT.dom.node("", "div", "bordered padded round bottommargined");
	    n.appendChild(CT.dom.node(d.title,
	        "div", "big bold blue bottompadded"));
	    n.appendChild(CT.dom.node(d.blurb,
	        "div", "bottompadded"));
	    n.appendChild(CT.dom.node(CT.dom.link("View Group", null,
	        "/participate.html#ActionGroups|" + CAN.cookie.flipReverse(d.key))));
	    return n;
	},
	"result": function(d, lastGroup) {
	    return CT.dom.node(CAN.media.group.build(d), "div",
	        (!lastGroup) && "bottompadded bottomline"||"");
	}
};

CAN.media.loader.registerBuilder("group", CAN.media.group.build);
CAN.media.loader.registerBuilder("groupresult", CAN.media.group.result);
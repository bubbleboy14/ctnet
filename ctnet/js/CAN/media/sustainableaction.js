CAN.media.sustainableaction = {
	"build": function(d) {
	    var v = CAN.media.loader.args.sustainableaction;
	    var sa = CT.dom.node();
	    sa.appendChild(CAN.media.photo.viewSingle(d.photo, true, "div", "right lmargimg thumb"));
	    sa.appendChild(CT.dom.node(d.title, "div", "bold"));
	    sa.appendChild(CT.dom.node(d.content));
	    sa.appendChild(CT.dom.link("Take Action", null,
	    	"http://" + d.link, null, null, {"target": "_blank"}));
	    sa.appendChild(CT.dom.node("", "div", "clearnode"));
	    return sa;
	},
	"result": function(d, lastAction) {
	    return CT.dom.node(CAN.media.sustainableaction.build(d),
	    	"div", (!lastAction) && "bottompadded bottomline"||"");
	}
};

CAN.media.loader.registerBuilder("sustainableaction", CAN.media.sustainableaction.build);
CAN.media.loader.registerBuilder("actionresult", CAN.media.sustainableaction.result);
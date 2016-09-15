CAN.media.referenda = {
	"build": function(ref, vindex, v, isSlider) {
	    var v = CAN.media.loader.args.referenda;
	    var n = CT.dom.node("", "div", isSlider ? "bigger" : "bottompadded");
	    n.appendChild(CT.dom.link(ref.title, null, "/referenda.html#!"
	    	+ CAN.cookie.flipReverse(ref.key), "bold nodecoration"));
	    n.appendChild(CT.dom.node(ref.summary || ref.blurb));
	    if (v.uid && v.uid != "nouid") {
	        if (ref.vote)
	            var rlink = CT.dom.link("VIEW RESULTS", null,
	            	"/referenda.html#!" + CAN.cookie.flipReverse(ref.key),
	            	"small gray");
	        else {
	            var rlink = CT.dom.img("/img/buttons/VOTE_BUTTON.gif", null,
	            	null, "/referenda.html#!" + CAN.cookie.flipReverse(ref.key));
	            rlink.firstChild.style.padding = "0px";
	        }
	    }
	    else
	        var rlink = CT.dom.link("MORE INFO", null, "/referenda.html#!"
	        	+ CAN.cookie.flipReverse(ref.key), "small gray");
	    if (!v.nolink)
	        n.appendChild(rlink);
	    return n;
	},
	"slider": function(d) {
	    var n = CAN.media.referenda.build(d, null, null, true);
	    n.onclick = function() {
	        document.location = "/referenda.html#!"
	        	+ CAN.cookie.flipReverse(d.key);
	    };
	    return n;
	},
	"result": function(d, islast) {
	    var n = CT.dom.node("", "div", islast ? "" : "bottompadded bottomline");
	    n.appendChild(CT.dom.node(CT.dom.link(d.title, null,
	        "/referenda.html#!" + CAN.cookie.flipReverse(d.key)),
	        "div", "newstitletext"));
	    n.appendChild(CT.dom.node(CT.parse.shortened(d.summary || d.blurb, 900)));
	    return n;
	},
	"approve": function(ref) {
	    var v = CAN.media.loader.args.refapprove;
	    var n = CT.dom.node("", "div", "bottompadded");
	    n.appendChild(CT.dom.node(ref.title + " ("
	    	+ ref.jurisdiction + ")", "div", "big bold"));
	    n.appendChild(CT.dom.node(ref.summary));
	    return n;
	}
};

CAN.media.referenda.evidence = CAN.media.referenda.result;
CAN.media.cases.registerEvidence("referendum", CAN.media.referenda.evidence);
CAN.media.loader.registerBuilder("referenda", CAN.media.referenda.build);
CAN.media.loader.registerBuilder("lawresult", CAN.media.referenda.result);
CAN.media.loader.registerBuilder("refapprove", CAN.media.referenda.approve);
CAN.widget.slider.registerBuilder("referendum", CAN.media.referenda.slider);
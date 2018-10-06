CAN.media.paper = {
	"build": function(d, i, v, notit) {
	    var n = CT.dom.node("", "div", "bordered padded round bottommargined");
	    if (v) {
	        if (!notit) {
	            n.appendChild(CT.dom.node(CAN.widget.invite.button(d,
	            	"paper", "read", CAN.cookie.getUid()), "div", "right"));
	            n.appendChild(CT.dom.node(CT.dom.link(d.title, function() {
	                if (location.pathname.slice(1, -5) == "recommendations")
	                    CAN.media.paper.viewSingle(d);
	                else
	                    location = "/recommendations.html#!PositionPapers|"
	                        + CAN.cookie.flipReverse(d.key);
	            }), "div", "big blue nodecoration"));
	        }
	        n.appendChild(CT.dom.node(d.body));
	        if (d.conversation) {
	            var convonode = CT.dom.node("loading conversation...", "div", "bordertop");
	            n.appendChild(convonode);
	            CAN.widget.conversation.load(v.uid,
	            	d.conversation, convonode, d.key);
	        }
	    }
	    else {
	        n.appendChild(CT.dom.node(CT.dom.link(d.title, null,
	            "/recommendations.html#!PositionPapers|" + CAN.cookie.flipReverse(d.key)),
	            "div", "big"));
	        n.appendChild(CT.dom.node(CT.parse.shortened(d.body)));
	    }
	    return n;
	},
	"viewSingle": function(paper) {
	    if (!paper.viewed) {
	        CT.panel.add(paper.title, null, null,
	            CT.dom.id("sppl"),
	            null, paper.key, null, function() {
	                CAN.widget.share.updateShareItem("recommendations",
	                    paper.key, "PositionPapers");
	            });
	        var cnode = CT.dom.id("sbcontent" + paper.key);
	        cnode.parentNode.insertBefore(CT.dom.node(CAN.widget.invite.button(paper,
	            "paper", "read", CAN.cookie.getUid()), "div", "right"),
	            cnode.parentNode.firstChild);
	        cnode.appendChild(CAN.media.paper.build(paper,
	        	null, { uid: CAN.cookie.getUid() }, true));
	        CT.dom.id("spp").style.display = "block";
	        paper.viewed = true;
	    }
	    CT.panel.swap(paper.key);
	    CAN.widget.share.updateShareItem("recommendations",
	    	paper.key, "PositionPapers");
	},
	"result": function(d, lastPaper) {
	    return CT.dom.node(CAN.media.paper.build(d));
	}
};

CAN.media.loader.registerBuilder("paper", CAN.media.paper.build);
CAN.media.loader.registerBuilder("paperresult", CAN.media.paper.result);
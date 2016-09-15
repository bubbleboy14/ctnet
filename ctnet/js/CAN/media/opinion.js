CAN.media.opinion = {
	"build": function(d, i, v, notit) {
	    var n = CT.dom.node("", "div", "bordered padded round bottommargined");
	    if (v) {
	        if (!notit) {
	            n.appendChild(CT.dom.node(CAN.widget.invite.button(d,
	            	"opinion", "consider", CAN.cookie.getUid()), "div", "right"));
	            n.appendChild(CT.dom.node(CT.dom.link(d.title, function() {
	                if (location.pathname.slice(1, -5) == "recommendations")
	                    CAN.media.opinion.viewSingle(d);
	                else
	                    location = "/recommendations.html#!OpinionsAndIdeas|"
	                        + CAN.cookie.flipReverse(d.key);
	            }), "div", "big blue nodecoration"));
	        }
	        n.appendChild(CT.dom.node(CT.parse.process(d.body)));
	        if (d.conversation_active) {
	            var convonode = CT.dom.node("loading conversation...", "div", "bordertop");
	            n.appendChild(convonode);
	            CAN.widget.conversation.load(v.uid, d.conversation, convonode, d.key);
	        }
	    }
	    else {
	        n.appendChild(CT.dom.node(CT.dom.link(d.title, null,
	            "/recommendations.html#!OpinionsAndIdeas|" + CAN.cookie.flipReverse(d.key)),
	            "div", "big"));
	        n.appendChild(CT.dom.node(CT.parse.shortened(d.body)));
	    }
	    return n;
	},
	"viewSingle": function(opinion) {
	    if (!opinion.viewed) {
	        CT.panel.add(opinion.title, null, null,
	            CT.dom.id("soil"),
	            null, opinion.key, null, function() {
	                CAN.widget.share.updateShareItem("recommendations",
	                    opinion.key, "OpinionsAndIdeas");
	            });
	        var cnode = CT.dom.id("sbcontent" + opinion.key);
	        cnode.parentNode.insertBefore(CT.dom.node(CAN.widget.invite.button(opinion,
	            "opinion", "consider", CAN.cookie.getUid()), "div", "right"),
	            cnode.parentNode.firstChild);
	        cnode.appendChild(CAN.media.opinion.build(opinion,
	        	null, { uid: CAN.cookie.getUid() }, true));
	        CT.dom.id("soi").style.display = "block";
	        opinion.viewed = true;
	    }
	    CT.panel.swap(opinion.key);
	    CAN.widget.share.updateShareItem("recommendations",
	    	opinion.key, "OpinionsAndIdeas");
	},
	"result": function(d, lastIdea) {
	    return CT.dom.node(CAN.media.opinion.build(d));
	}
};

CAN.media.loader.registerBuilder("opinion", CAN.media.opinion.build);
CAN.media.loader.registerBuilder("idearesult", CAN.media.opinion.result);
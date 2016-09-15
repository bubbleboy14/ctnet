CAN.media.moderation = {
	"setApproval": function(b, c, d) {
	    b.disabled = c.disabled = d.approved || d.critiqued;
	    b.innerHTML = d.approved && "Approved" || "Approve";
	    c.innerHTML = d.critiqued && "Critiqued" || "Critique";
	},
	"approve": function(d, vars) {
	    var b = CT.dom.button();
	    var c = CT.dom.button();
	    b.onclick = function() {
	        CT.net.post("/edit", {"eid": vars.uid, "data": {"key": d.key,
	            "approve": true}}, "error approving media",
	            function() {
	                d.approved = true;
	                CAN.media.moderation.setApproval(b, c, d);
	                vars.approveCb && vars.approveCb(d.key);
	            });
	    };
	    c.onclick = function() {
	        var crit = prompt("What seems to be the problem?");
	        if (!crit) return;
	        CT.net.post("/edit", {"eid": vars.uid, "data":
	            {"key": d.key, "addcritique": crit}}, "error critiquing media",
	            function() {
	            	d.critiqued = true;
	            	CAN.media.moderation.setApproval(b, c, d);
	            });
	    };
	    CAN.media.moderation.setApproval(b, c, d);

	    var n = CT.dom.node("", "div", "nowrap");
	    n.appendChild(b);
	    n.appendChild(c);
	    return n;
	},
	"remove": function(d, vars) {
	    if (d.memtype == "member") // action groups - only leaders can delete
	        return CT.dom.node();
	    var b = CT.dom.button("Delete", function() {
	        if (! confirm("Are you sure you want to delete this? No takebacks!"))
	            return;
	        var userkey = vars.uid != "nouid" && vars.uid || vars.hidden_uid;
	        CT.net.post("/edit", {"eid": userkey,
	            "data": {"key": d.key, "delete": 1}},
	            "error deleting element", function() {
	                b.innerHTML = "Deleted";
	                b.disabled = true;
	            });
	    });
	    return b;
	},
	"unselectMedia": function(key, pname) {
	    var node = CT.dom.id("selector" + key);
	    if (node) node.onclick();
	    else {
	        node = CT.dom.id("ms" + pname + key);
	        node.parentNode.removeChild(node);
	    }
	},
	"unselectAllMedia": function(c, aslists, pname) {
	    if (c) {
	        if (aslists) {
	            for (var i = 0; i < (c.photo || []).length; i++)
	                CAN.media.moderation.unselectMedia(c.photo[i], pname);
	            for (var i = 0; i < (c.video || []).length; i++)
	                CAN.media.moderation.unselectMedia(c.video[i], pname);
	        }
	        else if (c.photo)
	            CAN.media.moderation.unselectMedia(c.photo, pname);
	    }
	},
	"clickOrAppend": function(key, tnode, pname) {
	    var dnode = CT.dom.id("selector" + key);
	    if (dnode)
	        dnode.onclick();
	    else
	        tnode.appendChild(CT.dom.node(CAN.media.photo.viewSingle(CT.data.get(key)),
	            "div", null, "ms" + pname + key));
	},
	"selectNewMedia": function(d, aslists, pname) {
	    var tnode = CT.dom.id(pname + "photoselected");
	    if (aslists) {
	        CT.data.checkAndDo((d.photo || []).concat(d.video || []), function() {
	            for (var i = 0; i < (d.photo || []).length; i++)
	                CAN.media.moderation.clickOrAppend(d.photo[i], tnode, pname);
	            for (var i = 0; i < (d.video || []).length; i++)
	                CT.dom.id("selector" + d.video[i]).onclick();
	        });
	    }
	    else if (d.photo) {
	        CT.data.checkAndDo([d.photo], function() {
	            CAN.media.moderation.clickOrAppend(d.photo, tnode, pname);
	        });
	    }
	},
	"_lastselectedbutton": null,
	"select": function(d, vars) {
	    var b = CT.dom.button(CT.dom.id("ms" + vars.buttonCbDefault.whichPanel() + d.key) && "Unselect" || "Select");
	    b.id = "selector" + d.key;
	    b.onclick = function() {
	        var tnode = vars.buttonCbDefault.target || vars.buttonCbDefault.targetCb();
	        var pname = vars.buttonCbDefault.whichPanel();
	        if (b.innerHTML == "Select") {
	            tnode.appendChild(CT.dom.node(CAN.media.loader.dNode(vars, d, null, vars.newMediaSelect), "div", null, "ms" + pname + d.key));
	            b.innerHTML = "Unselect";
	            if (CAN.media.moderation._lastselectedbutton != b && vars.buttonCbDefault.justOneCb && vars.buttonCbDefault.justOneCb()) {
	                if (CAN.media.moderation._lastselectedbutton.innerHTML == "Unselect")
	                    CAN.media.moderation._lastselectedbutton.onclick();
	                CAN.media.moderation._lastselectedbutton = b;
	            }
	        }
	        else { // Unselect
	            var msnode = CT.dom.id("ms" + pname + d.key);
	            if (msnode)
	                tnode.removeChild(msnode);
	            b.innerHTML = "Select";
	        }
	    };
	    return CT.dom.node(b);
	},
	"newCritique": function(c, medianame) {
	    var n = CT.dom.node();
	    var tn = CT.dom.node("", "div", "bottompadded");
	    tn.appendChild(CT.dom.node("Your " + medianame + " has been reviewed by ", "span"));
	    var criticlink = CT.dom.node("", "span");
	    CT.data.checkAndDo([c.critic], function() {
	        var critic = CT.data.get(c.critic);
	        criticlink.appendChild(CT.dom.link(critic.firstName + " " + critic.lastName,
	            null, "/profile.html?u=" + CAN.cookie.flipReverse(critic.key),
	            "", "", {"target": "_blank"}));
	    });
	    tn.appendChild(criticlink);
	    tn.appendChild(CT.dom.node(". Please read the comment below, revise your work, and resubmit.", "span"));

	    n.appendChild(tn);
	    n.appendChild(CT.dom.node(c.comment));

	    return n;
	},
	"listCritiques": function(d, node, medianame) {
	    if ((d.critiques || []).length == 0)
	        node.parentNode.style.display = "none";
	    else {
	        var clist = d.critiques;
	        var n = CT.dom.node();
	        n.appendChild(CAN.media.moderation.newCritique(clist[0], medianame));
	        if (clist.length > 1) {
	            var h = CT.dom.node("", "div", "bordered padded hidden");
	            for (var i = 1; i < clist.length; i++) {
	                if (i > 1)
	                    h.appendChild(CT.dom.node("", "hr"));
	                h.appendChild(CAN.media.moderation.newCritique(clist[i], medianame));
	            }
	            n.appendChild(CT.dom.link((clist.length-1) + " old critiques",
	                function() { CT.dom.showHide(h); }));
	            n.appendChild(h);
	        }
	        node.innerHTML = "";
	        node.appendChild(n);
	        node.parentNode.style.display = "block";
	    }
	}
};
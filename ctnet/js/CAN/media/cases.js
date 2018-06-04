CAN.media.cases = {
	"inviteButton": null,
	"current": null,
	"evidenceCb": {},
	"basic": function(d) {
	    var n = CT.dom.node();
	    n.appendChild(CT.dom.node(d.title, "div", "big blue"));
	    n.appendChild(CT.dom.node(CT.parse.shortened(d.blurb, 1200)));
	    return n;
	},
	"result": function(d) {
	    var n = CAN.media.cases.basic(d);
	    n.onclick = function() {
	        document.location = "/cases.html#!" + CAN.cookie.flipReverse(d.key);
	    };
	    return n;
	},
	"registerEvidence": function(mtype, cb) {
		CAN.media.cases.evidenceCb[mtype] = cb;
	},
	"loadEvidence": function(d, evnode, uid) {
	    evnode.innerHTML = "";
	    evnode.style.display = d.evidence.length ? "block" : "none";
	    if (d.evidence.length) {
	        var evbox = CT.dom.node();
	        evbox.style.height = "346px";
	        var evlinks = CT.dom.node("", "center");
	        var curEv = null;
	        var buildEv = function(i) {
	            curEv = i;
	            var e = CT.data.get(d.evidence[i]);
	            evbox.innerHTML = "";
	            evbox.appendChild(CAN.media.cases.evidenceCb[e.mtype](e));
	        };
	        var evLink = function(i) {
	            return CT.dom.link(i + 1, function() { buildEv(i); });
	        };
	        for (var i = 0; i < d.evidence.length; i++) {
	            i && evlinks.appendChild(CT.dom.node(" | " , "span"));
	            evlinks.appendChild(evLink(i));
	        }
	        buildEv(0);
	        if (uid == d.uid) {
	            evnode.appendChild(CT.dom.button("Doesn't Apply", function() {
	                CT.net.post("/edit", {
	                    "eid": uid,
	                    "data": {
	                        "key": d.key,
	                        "evidence": CT.data.get(d.evidence[curEv]).key,
	                        "remove": 1
	                    }
	                }, "error removing evidence", function() {
	                    d.evidence.splice(curEv, 1);
	                    CAN.media.cases.loadEvidence(d, evnode, uid);
	                });
	            }, "right"));
	        }
	        evnode.appendChild(CT.dom.node("Evidence",
	            "div", "bold blue bottompadded"));
	        evnode.appendChild(evbox);
	        evnode.appendChild(evlinks);
	    }
	},
	"build": function(d, vindex, v, isSingle, uid) {
	    if (isSingle) {
	        CAN.media.cases.current = d;
	        CT.dom.showHide(CAN.media.cases.inviteButton.parentNode, true);
	    }
	    var cclass = "categoriedbox bordered padded round bottommargined";
	    for (var i = 0; i < d.category.length; i++)
	        cclass += " " + d.category[i];
	    if (typeof vindex == "number" && (vindex < CAN.media.loader.newcount))
	        cclass += " Latest";
	    var n = CT.dom.node("", "div", cclass);
	    n.appendChild(CT.dom.node(CT.dom.link(d.title, function() {
	        (v || newMediaVars['case']).newMediaViewMoreCb(d); },
	        null, "nodecoration"), "div",
	        "big bold blue bottompadded"));
	    n.appendChild(CT.dom.node(d.blurb,
	        "div", "bottompadded"));

	    if (d.doc) {
	        n.appendChild(CT.dom.div(CT.dom.link("Download Text of "
	        	+ d.title, null, d.doc, "gray", "",
	        	{"target": "_blank"}), "bottompadded"));
	    }

	    var evnode = CT.dom.node("", "div", "bordered padded");
	    CAN.media.cases.loadEvidence(d, evnode, uid);
	    n.appendChild(evnode);

	    var convonode = CT.dom.node("loading conversation...",
	        "div", "red bordertop");
	    n.appendChild(convonode);
	    CAN.widget.conversation.load(uid || (v && v.uid) || null,
	    	d.conversation, convonode, d.key);
	    return n;
	},
	"profile": function(d, vindex, v) {
	    return CAN.media.cases.build(d, vindex, v, false, v.uid);
	},
	"widget": function(uid) {
	    var n = CT.dom.id("casenode");
	    n.appendChild(CT.dom.link("Build a New Case", null,
	        uid ? "/participate.html#Cases" : "/login.html",
	        "right small bold blue nodecoration"));
	    n.appendChild(CT.dom.link("Cases", null, "/cases.html",
	        "bigger bold blue nodecoration"));
	    var existingCases = CT.dom.node();
	    CAN.media.loader.load({"mtype": "case", "node": existingCases,
	        "newMediaDefault": "sideCase", "number": 3, "uid": uid,
	        "paging": "rotation", "newMediaViewMoreCb": function(c) {
	            document.location = "cases.html#!"
	            + CAN.cookie.flipReverse(c.key);
	        }});
	    n.appendChild(existingCases);
	},
	"side": function(c, i, v) {
	    var cnode = CT.dom.node("", "div",
	        "bordered padded round topmargined");
	    cnode.appendChild(CT.dom.link(c.title, null,
	        "/cases.html#!" + CAN.cookie.flipReverse(c.key),
	        "big bold blue bottompadded nodecoration"));
	    cnode.appendChild(CT.dom.node(CT.parse.shortened(c.blurb, 300)));
	    var supportBtn = CT.dom.button("This " + CAN.widget.share.currentShareName
	        + " supports this case.", function() {
	            if (!v.uid || v.uid == "nouid")
	                return document.location = "/login.html";
	            var pdata = {
	                "eid": v.uid,
	                "data": {
	                    "key": c.key,
	                    "evidence": CAN.widget.share.currentShareKey
	                }
	            }
	            CT.net.post("/edit", pdata,
	                "error supporting case", function() {
	                    alert("Nice! Thanks for your input!");
	                    supportBtn.style.display = "none";
	                });
	        }, "casebutton");
	    cnode.appendChild(supportBtn);
	    return cnode;
	}
};

CAN.media.cases.slider = CAN.media.cases.result;
CAN.media.loader.registerBuilder("case", CAN.media.cases.build);
CAN.media.loader.registerBuilder("caseprofile", CAN.media.cases.profile);
CAN.media.loader.registerBuilder("caseBasic", CAN.media.cases.basic);
CAN.media.loader.registerBuilder("caseresult", CAN.media.cases.result);
CAN.media.loader.registerBuilder("sideCase", CAN.media.cases.side);
CAN.widget.slider.registerBuilder("case", CAN.media.cases.result);

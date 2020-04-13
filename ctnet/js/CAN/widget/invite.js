CAN.widget.invite = {
	"button": function(d, itype, iverb, uid) {
	    var ibutt = CT.dom.button("Invite a Friend to "
	        + CT.parse.capitalize(iverb) + " this "
	        + CT.parse.capitalize(itype), null, "fullwidth");
	    if (uid && uid !== "nouid")
	        CAN.widget.invite.load(itype, uid, ibutt,
	            null, function() { return d; }, iverb);
	    else
	        CAN.frame.clickToLogin(ibutt);
	    return ibutt;
	},
	"load": function(itype, uid, openbutton, addCb, getCurData, invAction, omitEmail) {
	    addCb = addCb || function() { alert("Invitation sent!"); };
	    var n = CT.dom.node("", "div", "hidden basicpopup");
	    var closebutton = CT.dom.button("close");
	    var invitenonmember = CT.dom.field(null, null, "fullwidth");
	    openbutton.onclick = closebutton.onclick = function() {
	        CT.dom.showHide(n);
	        if (n.style.display == "block") {
	            CT.align.centered(n);
	            invitenonmember.focus();
	        }
	    }
	    n.appendChild(CT.dom.node(closebutton, "div", "right shiftup"));
	    n.appendChild(CT.dom.node("Invite to "
	    	+ CT.parse.capitalize(invAction || itype), "div",
	    	"big bold blue bottommargined bottomline"));
	    n.appendChild(CT.dom.node("Click the person you'd like to invite."));
	    var userselector = CT.dom.node("", "div", "h200 scrolly bordered");
	    n.appendChild(userselector);
	    var loadUser = function(d) {
	        CT.data.add(d);
	        userselector.appendChild(CAN.session.userLine(d.key, "sel",
	            null, CT.dom.link("", function() {
	                if (CT.dom.id("uline"+itype+d.key))
	                    alert(d.firstName + " " + d.lastName + " is already part of this " + itype + "!");
	                else if (confirm("Invite " + d.firstName + " " + d.lastName + " to " + (invAction || "join") + " this " + itype + "?")) {
	                    var curdata = getCurData();
	                    if (curdata.key == itype)
	                        addCb(d.key);
	                    else {
	                        CT.net.post("/invite", {"uid": uid, "key": curdata.key,
	                            "mtype": itype, "invitee": d.key},
	                            "error inviting user", function() {
	                                addCb(d.key);
	                            });
	                    }
	                }
	            })));
	    };
	    CT.net.post("/get", {"gtype": "user", "uid": uid, "all": 1,
	    	"searchable": 1}, "error retrieving users", function(d) {
	            for (var i = 0; i < d.length; i++)
	                if (d[i].key != uid)
	                    loadUser(d[i]);
	        });
	    if (!omitEmail) { // disabled in profile conversations... enable later.
		    n.appendChild(CT.dom.node("Invite Non-Member", "div",
		        "big bold blue topmargined bottommargined bottomline"));
		    n.appendChild(CT.dom.node("Enter the email address of the person you'd like to invite"));
		    n.appendChild(invitenonmember);
		    var invitenonmembercb = function() {
		        if (!invitenonmember.value) return;
		        if (!CT.parse.validEmail(invitenonmember.value))
		            return alert("Are you sure that's a real email address?");
		        CT.net.post("/invite", {"uid": uid, "key": getCurData().key,
		            "mtype": itype, "email": invitenonmember.value},
		            "error inviting user", function() {
		                invitenonmember.value = "";
		                alert("Invitation sent!");
		            }, function(err) {
		            	alert(err);
		            });
		    };
		    CT.dom.inputEnterCallback(invitenonmember, invitenonmembercb);
		    n.appendChild(CT.dom.button("Invite Non-Member", invitenonmembercb));
		}
	    document.body.appendChild(n);
	}
};
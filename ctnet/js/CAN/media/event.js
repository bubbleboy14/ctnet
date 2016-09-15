CAN.media.event = {
	"_desc": function(d) {
	    return CT.parse.process(d.replace(/<pre>/g, '<div>').replace(/<\/pre>/g, '</div>'));
	},
	"_zip": function(z) {
	    return z.city + ", " + z.state + ", " + z.code;
	},

	"info": function(d, v) {
		v = v || CAN.media.loader.args.event;
		return CT.dom.node([
		    CT.dom.link(d.title, function() {
		        v.newMediaViewMoreCb(d); }, null, "big nodecoration"),
		    CT.dom.node(d.where.name + " (" + d.where.address + ")", "div", "bold"),
		    CT.dom.node(d.when.full, "div", "italic"),
		    CT.dom.node(d.description < 300 ? d.description :
		    	(d.description.slice(0, 300) + "..."), "div", "topmargined")
		]);
	},
	"result": function(d, v) {
		v = v || CAN.media.loader.args.eventresult;
	    var n = CT.dom.node();
	    n.appendChild(CT.dom.node(CT.dom.link(d.title, null,
	        "community.html#!Events|" + CAN.cookie.flipReverse(d.key), "big bold")));
	    var shortdesc = d.description;
	    if (shortdesc.length > 300)
	         shortdesc = shortdesc.slice(0, 300) + "...";
	    n.appendChild(CT.dom.node(shortdesc));
	    return n;
	},
	"build": function(d, v) {
	    if (typeof v != "object")
	        v = CAN.media.loader.args.event;
	    var n = CT.dom.node("", "div",
	        "bordered padded round bottommargined maxwidthoverride");

	    // geographical classnames for filtering
	    n.className += " event";
	    n.className += " " + d.where.zipcode.state.toLowerCase();
	    n.className += " " + d.where.zipcode.city.replace(/ /g, "").toLowerCase();

	    var topnode = CT.dom.node("", "div", "newstitle");
	    topnode.appendChild(CT.dom.link(d.title, function() {
	        v.newMediaViewMoreCb(d); }, null, "big nodecoration"));
	    topnode.insertBefore(CT.dom.node(CAN.widget.invite.button(d, "event",
	    	"join", v.uid), "div", "right shiftup"), topnode.firstChild);
	        /* unnecessary
	        var u = datamap[d.user];
	        var byline = newNode("", "div", "small italic");
	        byline.appendChild(newNode("posted by ", "span", "gray"));
	        byline.appendChild(newLink(u.firstName + " " + u.lastName,
	            null, "/profile.html?u="+flipReverse(u.key), "gray"));
	        topnode.appendChild(byline);
	        */
	    n.appendChild(topnode);
	    n.appendChild(CT.dom.node(CAN.media.event._desc(d.description),
	        "div", "bottompadded"));
	    n.appendChild(CT.dom.node("Who", "div", "blue bold"));
	    if (v.uid && v.uid != "nouid") {
	        var abox = CT.align.centered(CT.dom.node("", "div", "hidden adminpopup"));
	        n.appendChild(abox);
	        n.appendChild(CT.dom.node(CT.dom.link(d.attendees.length + " attendees",
	            function() { CT.data.checkAndDo(d.attendees, function() {
	                if (abox.innerHTML == "") {
	                    abox.appendChild(CT.dom.node("Attendees", "div",
	                        "big bold blue bottomline bottommargined"));
	                    var ubox = CT.dom.node("", "div", "", d.key + "attendees");
	                    abox.appendChild(ubox);
	                    for (var i = 0; i < d.attendees.length; i++)
	                        ubox.appendChild(userLine(d.attendees[i], "event"));
	                    abox.appendChild(CT.dom.button("Close", function() {
	                        abox.style.display = "none"; }));
	                    if (d.attendees.indexOf(v.uid) == -1) {
	                        var abutton = CT.dom.button("Attend", function() {
	                            CT.net.post("/edit", {"eid": v.uid,
	                                "data": {"key": d.key,
	                                "addattendee": v.uid}},
	                                "error attending event", function() {
	                                    d.attendees.push(v.uid);
	                                    ubox.appendChild(userLine(v.uid, "event"));
	                                    abox.removeChild(abutton);
	                                    CT.dom.id(d.key + "attendeelink").innerHTML = d.attendees.length + " attendees";
	                                });
	                        });
	                        abox.appendChild(abutton);
	                    }
	                }
	                abox.style.display = "block";
	                CT.align.centernode(abox);
	            }); }, null, "", d.key + "attendeelink"), "div", "bottompadded"));
	    }
	    else
	        n.appendChild(CT.dom.node(d.attendees.length + " attendees",
	            "div", "bottompadded", d.key+"attendeelink"));
	    n.appendChild(CT.dom.node("Where", "div", "blue bold"));
	    n.appendChild(CT.dom.node(CT.dom.link(d.where.name, function() {
	    	v.showMarker(d.key);
	    })));
	    n.appendChild(CT.dom.node(d.where.address));
	    n.appendChild(CT.dom.node(CAN.media.event._zip(d.where.zipcode), "div", "bottompadded"));
	    n.appendChild(CT.dom.node("When", "div", "blue bold"));
	    n.appendChild(CT.dom.node(d.when.full, "div", "bottompadded"));
	    n.appendChild(CT.dom.node("Transportation", "div", "blue bold"));
	    n.appendChild(CT.dom.node("More cars, bigger event."));
	    if (v.uid && v.uid != "nouid") {
	        var rsbox = CT.align.centered(CT.dom.node("", "div", "hidden adminpopup"));
	        n.appendChild(rsbox);
	        n.appendChild(CT.dom.node(CT.dom.link(d.rideshares.length + " rideshares",
	            function() {
	                CAN.media.loader.checkAndShow(d.rideshares, {"newMediaChecks": {
	                    "single": ["driver"], "list": ["passengers"]}}, function() {
	                        if (rsbox.innerHTML == "") {
	                            rsbox.appendChild(CT.dom.node("Rideshares", "div",
	                                "big bold blue bottomline bottommargined"));
	                            var canjoin = true;
	                            if (v.uid == "nouid")
	                                canjoin = false;
	                            else {
	                                for (var i = 0; i < d.rideshares.length; i++) {
	                                    var rs = d.rideshares[i];
	                                    if (rs.driver == v.uid) {
	                                        canjoin = false;
	                                        break;
	                                    }
	                                    for (var j = 0; j < rs.passengers.length; j++) {
	                                        if (rs.passengers[j] == v.uid) {
	                                            canjoin = false;
	                                            break;
	                                        }
	                                    }
	                                    if (canjoin == false)
	                                        break; // double-break for passenger match
	                                }
	                            }
	                            eventridebuttons[d.key] = [];
	                            var sharelist = CT.dom.node();
	                            for (var i = 0; i < d.rideshares.length; i++) {
	                                sharelist.appendChild(newrideshare(d.rideshares[i],
	                                    v.uid, canjoin));
	                            }
	                            rsbox.appendChild(sharelist);
	                            rsbox.appendChild(CT.dom.button("Close", function() {
	                                rsbox.style.display = "none"; }));
	                            if (canjoin) {
	                                var shbutton = CT.dom.button("Share My Ride", function() {
	                                    var capacity = prompt("Capacity?");
	                                    CT.net.post("/edit", {"eid": v.uid, "data": {
	                                        "key": d.key, "addrideshare": capacity}},
	                                        "error adding rideshare", function(key) {
	                                            var rs = {"key": key,
	                                                "event": d.key, "driver": v.uid,
	                                                "capacity": capacity,
	                                                "passengers": []};
	                                            d.rideshares.push(rs);
	                                            sharelist.appendChild(newrideshare(rs, v.uid));
	                                            showhideeventridebuttons(d.key);
	                                            updateattendees(d.key, v.uid);
	                                            CT.dom.id(d.key+"ridesharelink").innerHTML = d.rideshares.length + " rideshares";
	                                        });
	                                });
	                                eventridebuttons[d.key].push(shbutton);
	                                rsbox.appendChild(shbutton);
	                            }
	                        }
	                        rsbox.style.display = "block";
	                        CT.align.centernode(rsbox);
	                    });
	            }, null, null, d.key+"ridesharelink"), "div", "bottompadded"));
	    }
	    else
	        n.appendChild(CT.dom.node(d.rideshares.length + " rideshares",
	            "div", "bottompadded", d.key+"ridesharelink"));
	    if (d.tasks.length > 0) {
	        n.appendChild(CT.dom.node("Tasks", "div", "blue bold"));
	        var tbox = CT.dom.node();
	        var canvolunteer = v.uid != "nouid";
	        for (var i = 0; i < d.tasks.length; i++)
	            tbox.appendChild(newtask(d.tasks[i], v.uid, canvolunteer));
	        n.appendChild(tbox);
	    }
	    if (!v.noconvo) {
	        n.appendChild(CT.dom.node("Conversation", "div", "blue bold"));
	        var convonode = CT.dom.node("loading conversation...", "div", "bordertop");
	        n.appendChild(convonode);
	        CAN.widget.conversation.load(v.uid, d.conversation, convonode, d.key);
	    }
	    return n;
	},
	"remove": function(d) {
	    return CAN.media.event.build(d, CAN.media.loader.args.eventdelete);
	},
	"approve": function(d) {
	    return CAN.media.event.build(d, CAN.media.loader.args.eventapprove);
	}
};

CAN.media.loader.registerBuilder("event", CAN.media.event.build);
CAN.media.loader.registerBuilder("eventresult", CAN.media.event.result);
CAN.media.loader.registerBuilder("eventdelete", CAN.media.event.remove);
CAN.media.loader.registerBuilder("eventapprove", CAN.media.event.approve);
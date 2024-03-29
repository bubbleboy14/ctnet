CT.require("CT.all");
CT.require("CAN.all");
CT.setVal("mapkey", CT.data.choice(core.config.ctnet.geokeys));
CT.require("CT.map", true);
CT.map.util.setGeoKeys(core.config.ctnet.geokeys);

onload = function() {
    var uid = CAN.session.isLoggedIn();
    var svnode = CT.dom.node("", "div", "hidden", "svnode");
    var events = CT.dom.node();
    var people = CT.dom.id("sbpanelPeople");
    var viewmap = CT.dom.id("viewmap");
    var grotadd = CT.dom.button("Push to Front of Slider Rotation",
        null, "w1 hidden", "grotadd");
    var map = null;
    var streamnodes = {};
    var cur = {};

    var showInvite = function() {
        CT.dom.show("comminvite");
        CT.dom.show("mminvite");
    };
    var hideInvite = function() {
        CT.dom.hide("comminvite");
        CT.dom.hide("mminvite");
    };

    CAN.categories.load(uid);
    CAN.media.loader.load({"mtype": "referenda", "number": 3, "uid": uid,
        "node": CT.dom.id("reflist"), "paging": "bidirectional"});
    CT.panel.load(["Events", "People", "Questions", "Ideas", "Stream", "Memes", "Chatter", "Map"],
        true, null, null, null, null, ["/img/community/events.png",
        "/img/community/people.png", "/img/community/questions.png",
        "/img/community/ideas.png", "/img/community/stream.png",
        "/img/community/memes.png",
        "/img/community/comments.png", "/img/community/map.png"],
        null, null, [function() {
            delete cur.item;
            CT.dom.hide(viewmap.parentNode);
            CT.dom.hide(svnode);
            CT.dom.show(events);
            CAN.widget.share.updateShareItem("community", null, "Events");
            hideInvite();
        }, function() {
            delete cur.item;
            CAN.widget.share.updateShareItem("community",
                CAN.chat.currentRoom, "People");
            if (CAN.chat.currentRoom) {
                CAN.chat.scrollOutie();
                CAN.chat.focusChatInput();
            }
            hideInvite();
        }, function() {
            delete cur.item;
            CAN.widget.share.updateShareItem("community", null, "Questions");
            CT.dom.hide(streamnodes.question.snode);
            CT.dom.show(streamnodes.question.anode);
            hideInvite();
        }, function() {
            delete cur.item;
            CAN.widget.share.updateShareItem("community", null, "Ideas");
            CT.dom.hide(streamnodes.changeidea.snode);
            CT.dom.show(streamnodes.changeidea.anode);
            hideInvite();
        }, function() {
            delete cur.item;
            CAN.widget.share.updateShareItem("community", null, "Stream");
            CT.dom.hide(streamnodes.thought.snode);
            CT.dom.show(streamnodes.thought.anode);
            hideInvite();
        }, function() {
            delete cur.item;
            CAN.widget.share.updateShareItem("community", null, "Memes");
            CT.dom.hide(streamnodes.meme.snode);
            CT.dom.show(streamnodes.meme.anode);
            hideInvite();
        }, function() {
            delete cur.item;
            CAN.widget.share.updateShareItem("community", null, "Chatter");
            hideInvite();
        }, function() {
            delete cur.item;
            CAN.widget.share.updateShareItem("community", null, "Map");
            map.refresh();
            hideInvite();
        }]);

    // video
    var vsb = CT.dom.id("vstream");
    CT.dom.show(vsb.parentNode);
    vsb.onclick = function() {
        vsb._modal = vsb._modal || new CT.modal.Modal({
            center: false,
            innerClass: "w1 h1 noflow",
            className: "w1 bigger vslide mosthigh fixed whitelink noflow",
            transition: "slide",
            slide: {
                origin: "bottom"
            },
            content: [
                "Who else is lurking around CAN? Ask them yourself!",
                CT.dom.iframe("https://fzn.party/stream/widget.html#can", "w1", null, {
                    allow: "microphone; camera"
                })
            ]
        });
        vsb._modal.showHide();
    };

    // map
    map = new CAN.widget.map.Map({
        node: CT.dom.id("sbcontentMap")
    });
    map.showPlaces();
    var showMarker = function(mkey) {
        CT.panel.swap("Map", true);
        map.refresh();
        map.markerInfo(mkey);
    };
    viewmap.onclick = function() {
        showMarker(viewmap._evt.key);
    };

    // node streams
    var nodetypes = { "question": "Questions", "changeidea": "Ideas",
        "thought": "Stream", "comment": "Chatter", "meme": "Memes" },
        ntrev = { "Questions": "question", "Ideas": "changeidea", "Stream": "thought", "Memes": "meme" };
    viewSingleItem = function(d, mtype) {
        if (!CT.dom.id("sbitem" + d.key)) {
            var pnode = CT.dom.id("sv_" + mtype),
                lname = (d.body || d.idea || d[mtype] || d.title).split("http")[0].split(' ').slice(0, 2).join(' ') + " ...";
            pnode.appendChild(CT.dom.div(CT.dom.link(lname,
                function() { viewSingleItem(d, mtype); }),
                "bottompadded sbitem", "sbitem"+d.key));
            CT.dom.show(pnode.parentNode);
        }
        var ntype = nodetypes[mtype], nodez = streamnodes[mtype];
        CT.panel.swap(ntype, true);
        CT.panel.select(d.key);
        CT.dom.setContent(nodez.snode, CAN.widget.stream.getNode(d, {
            uid: uid,
            type: mtype,
            taguser: true
        }));
        CT.dom.hide(nodez.anode);
        CT.dom.show(nodez.snode);
        CAN.widget.share.updateShareItem("community", d.key, ntype);
        if (mtype != "comment") {
            CT.dom.setContent("comminvite", CAN.widget.invite.button(d,
                (mtype == "changeidea") ? "idea" : mtype,
                "consider", uid));
            showInvite();
            if (mtype == "meme" || mtype == "thought") {
                cur.item = d;
                CT.dom.addContent("comminvite", grotadd);
            } else
                delete cur.item;
        }
        var dname = d.title || d.thought || d.question || d.idea,
            dimg = d.image;
        if (dimg)
            dimg = location.protocol + "//" + location.hostname + dimg;
        else if (dname.includes("http")) {
            [dname, dimg] = dname.split("http");
            dimg = "http" + dimg.split(" ")[0];
        }
        CAN.cc.view(CT.merge(d, {
            mtype: mtype,
            name: dname
        }));
        CAN.config.setPage("Article", dname, dimg);
    };
    ['question', 'changeidea', 'thought', 'comment', 'meme'].forEach(function(item) {
        var nodez = streamnodes[item] = {},
            pnode = CT.dom.id("sbcontent" + nodetypes[item]),
            snode = nodez.snode = CT.dom.div(null, "hidden"),
            anode = nodez.anode = CT.dom.div();
        pnode.appendChild(snode);
        pnode.appendChild(anode);
        CAN.widget.stream.infi(anode, item, uid,
            d => viewSingleItem(d, item));
    });

    var eventStuff = CT.dom.id("sbcontentEvents");
    eventStuff.appendChild(svnode);
    eventStuff.appendChild(events);
    eventStuff.parentNode.insertBefore(CT.dom.div(CT.dom.button("Post Event",
        function() { document.location = "/participate.html#Coordinator"; }),
        "right"), eventStuff.previousSibling);

    var mrlink = CT.dom.id("moreroomslink");

    var EVENTS_LOADED = false;
    var GROUPS_LOADED = false;

    // events
    var sv = CT.dom.id("sv");
    var svl = CT.dom.id("svl");
    CAN.widget.share.currentShareName = "community";
    CAN.widget.share.shareSub("community");
    CAN.widget.share.updateShareItem("community");
    viewSingleEvent = function(event) {
        if (!CT.dom.id("sbitem"+event.key)) {
            svl.appendChild(CT.dom.div(CT.dom.link(event.title,
                function() { viewSingleEvent(event); }),
                "bottompadded sbitem", "sbitem"+event.key));
            CT.dom.show(sv);
        }
        delete cur.item;
        viewmap._evt = event;
        CT.dom.show(viewmap.parentNode);
        CT.panel.swap("Events", true);
        CT.panel.select(event.key);
        CT.dom.setContent(svnode, CAN.media.event.build(event));
        CT.dom.hide(events);
        CT.dom.show(svnode);
        CAN.widget.share.updateShareItem("community", event.key, "Events");
        CAN.cc.view(event);
        CAN.config.setPage("Event", event.title);
    };

    var check_hash = function() {
        if (!EVENTS_LOADED || (uid && !GROUPS_LOADED))
            return;
        var h = unescape(document.location.hash.slice(2));
        if (h) {
            var hs = h.split("|");
            var hkey = hs[1] && CAN.cookie.flipReverse(hs[1]);
            var section = hs[0];
            if (section == "Events")
                CAN.widget.conversation.jump(hkey, "event", viewSingleEvent, "mydata");
            else if (["Questions", "Ideas", "Stream", "Memes"].indexOf(section) != -1) {
                if (hkey) {
                    var ntsec = ntrev[section];
                    CAN.widget.conversation.jump(hkey, ntsec, function(item) {
                        viewSingleItem(item, ntsec);
                    });
                } else {
                    CT.panel.swap(section, true, "sb");
                    CAN.widget.share.updateShareItem("community", null, section);
                    if (section == "Stream") {
                        var ti = CT.dom.id("thoughtinput"),
                            val = CT.storage.get("gts");
                        if (val) {
                            ti.value = val;
                            CT.storage.set("gts", ""); // jank clear?
                            ti.parentNode.nextSibling.nextSibling.onclick();
                        }
                    }
                }
            } else { // People, Chatter, Map
                CT.panel.swap(section, true, "sb");
                CAN.widget.share.updateShareItem("community", null, section);
                if (section == "People") {
                    mrlink.onclick();
                    CT.panel.swap(CAN.chat.groups[hkey], true, "ch");
                }
            }
            document.location.hash = "";
        }
    };

    var showNewEvent = function() {
        document.location = "/participate.html#Coordinator";
    };
    CAN.media.loader.load({"mtype": "event", "number": 1000, "uid": uid,
        "esort": 1, "newMediaViewMoreCb": viewSingleEvent, "showMarker": showMarker,
        "newMediaChecks": {"single": ["user", "conversation"]},
        "node": events, "eb": function() {
                events.appendChild(CT.dom.node("We're sorry, there aren't any upcoming events listed! Know about anything that could use a little publicity? Don't be shy! ", "span"));
                events.appendChild(CT.dom.link("Spread the word!",
                    null, "/participate.html#Coordinator", "nodecoration"));
                CT.dom.id("mapevents").appendChild(CT.panel.trigger({"title": "new event"}, showNewEvent));
                EVENTS_LOADED = true;
                check_hash();
            }, "cb": function(data) {
                map.addTriggers(data, "event", function(d) {
                    return {
                        address: d.where.address + " " + d.where.zipcode.code,
                        title: d.title,
                        info: CAN.media.event.info(d)
                    };
                }, showNewEvent);
                EVENTS_LOADED = true;
                check_hash();
            }});

    var filterall = CT.dom.id("filterall");
    var filtermsg = CT.dom.id("filtermsg");
//    var filtercity = CT.dom.id("filtercity");
//    var filterstate = CT.dom.id("filterstate");
//    filterall.className = "red";
    var filterinput = CT.dom.id("filterinput");
    var filterEvents = function(mainon, onstring) {
        var newstyle = mainon && "block" || "none";
        var nodes = document.getElementsByClassName("event");
        for (var i = 0; i < nodes.length; i++)
            nodes[i].style.display = newstyle;
        if (onstring) {
            var nodes = document.getElementsByClassName(onstring);
            for (var i = 0; i < nodes.length; i++)
                CT.dom.show(nodes[i]);
        }
    };
    filterall.onclick = function() {
        filterEvents(true);
        filterall.className = "hidden";
        filtermsg.innerHTML = "viewing <b>all</b> events";
    };
    var geofilter = CT.dom.id("filterbutton").onclick = function() {
        var sval = filterinput.value;
        if (sval == "")
            return filterall.onclick();
        filterEvents(false, sval.replace(/ /g, "").toLowerCase());
        filtermsg.innerHTML = "viewing events in <b>" + sval + "</b>";
        filterall.className = "";
    };
    CT.dom.inputEnterCallback(filterinput, geofilter);
/*    filtercity.onclick = function() {
        filterEvents(false, user.zipcode.city.replace(/ /g, ""));
        filterall.className = filterstate.className = "";
        filtercity.className = "red";
    };
    filterstate.onclick = function() {
        filterEvents(false, user.zipcode.state);
        filtercity.className = filterall.className = "";
        filterstate.className = "red";
    };*/

    // people
    var buildChat = function(uid) {
        // user search
        var us = CT.dom.id("usersearch");
        var usf = CT.dom.field(null, null, "w150");
        us.appendChild(usf);
        var usearch = function() {
            var v = usf.value.trim();
            if (v == "")
                return alert("search for what?");
            setActiveSearch("User");
            CAN.cookie.set(uid, CAN.cookie.checkFirstName(),
                CAN.cookie.checkLastName(), CAN.cookie.checkSiteWideChat());
            document.location = "/search.html#"+v;
        };
        CT.dom.inputEnterCallback(usf, usearch);
        us.appendChild(CT.dom.button("Search", usearch));

        // chat rooms
        var chpanels = CT.dom.node("", "div", "", "chpanels");
        people.appendChild(chpanels);
        CHAT_TITLE_STYLE = 'blue';
        CAN.chat.loadAllChats(uid, chpanels,
            CT.dom.id("chsides"),
            CT.dom.id("userspotlight"), function() {
                GROUPS_LOADED = true;
                CAN.chat.currentRoom = "global";
                check_hash();
            }, CT.dom.id("morerooms"), mrlink,
            CT.dom.id("moreroomscontainer"));
    };
    if (uid) {
        CT.dom.show(CT.dom.id("geofilter"));
        buildChat(uid);
        CAN.widget.slider.initUpdate(uid, function() {
            return cur.item && cur.item.key;
        });
    } else {
        var rsc = CT.dom.id("roomselectorcontainer");
        rsc.style.display
            = CT.dom.id("userspotlightcontainer").style.display
            = CT.dom.id("usersearchcontainer").style.display = "none";
//        people.appendChild(newNode("No chat for non-users (yet!)."));
//        people.appendChild(wrapped(newLink("Join the conversation!",
//                    null, "login.html"), "div", "topmargined"));
        var namePrompt = CT.dom.node();
        namePrompt.appendChild(CT.dom.node("Enter your name to chat."));
        namePrompt.appendChild(CT.dom.inputEnterCallback(CT.dom.field(), function(gname) {
            people.removeChild(namePrompt);
            var guestname = gname + "[guest]";
            CAN.cookie.set(guestname);
            buildChat(guestname);
            CAN.cookie.set();
            CT.dom.show(rsc);
            mrlink.href = "/login.html";
        }));
        namePrompt.appendChild(CT.dom.node(CT.dom.link("Or log in to join the conversation!",
            null, "login.html"), "div", "topmargined"));
        people.appendChild(namePrompt);
    }
};
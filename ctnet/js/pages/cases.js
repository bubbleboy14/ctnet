CT.require("CT.all");
CT.require("CAN.all");

onload = function() {
    var LOADED = false;
    var uid = CAN.session.isLoggedIn();
    var svnode = CT.dom.id("svnode");
    var sv = CT.dom.id("sv");
    var svl = CT.dom.id("svl");
    var caselist = CT.dom.id("caselist");

    CAN.widget.share.currentShareName = "case";
    CAN.widget.share.shareSub("case");

    CAN.media.cases.inviteButton = CT.dom.id("caseinvite");
    if (uid && uid != "nouid") {
        CAN.widget.invite.load("case", uid, CAN.media.cases.inviteButton,
            null, function() { return CAN.media.cases.current; }, "review");
        CAN.widget.slider.initUpdate(uid, function() { return CAN.media.cases.current.key; });
    }
    else
        CAN.frame.clickToLogin(CAN.media.cases.inviteButton);

    viewSingleCase = function(cdata) {
        if (!CT.dom.id("sbitem"+cdata.key)) {
            svl.appendChild(CT.dom.node(CT.dom.link(cdata.title,
                function() { viewSingleCase(cdata); }),
                "div", "bottompadded sbitem", "sbitem"+cdata.key));
            sv.style.display = "block";
        }
        CT.panel.select(cdata.key);
        svnode.innerHTML = "";
        svnode.appendChild(CAN.media.cases.build(cdata, null, null, true, uid));
        CAN.categories.heading.style.display = "none";
        caselist.style.display = "none";
        svnode.style.display = "block";
        CAN.widget.share.updateShareItem("case", cdata.key);
        CAN.cc.view(cdata);
        CAN.config.setPage("Article", cdata.title);
    };

    // center: case
    CAN.media.loader.load({"mtype": "case", "number": 40,
        "node": caselist, "uid": uid,
        "newMediaChecks": {"list": ["evidence"]},
        "newMediaViewMoreCb": viewSingleCase,
        "newMediaDefault": "case",
        "cb": function() { LOADED = true; }});

    CAN.media.loader.load({"mtype": "referenda", "number": 3,
        "uid": uid, "node": CT.dom.id("reflist"),
        "paging": "bidirectional"});

    CAN.categories.loadSorter(function() {
        svnode.style.display = "none";
        CAN.categories.heading.style.display = "block";
        caselist.style.display = "block";
        CAN.widget.share.updateShareItem("case");
        CT.dom.hide(CAN.media.cases.inviteButton.parentNode);
        CT.dom.hide("mminvite");
    });

    // single case (hash linked or simply clicked)
    var checkHash = function() {
        if (! LOADED)
            return setTimeout(checkHash, 300);
        CAN.widget.conversation.hash("case", viewSingleCase);
    };
    if (document.location.hash) checkHash();
};
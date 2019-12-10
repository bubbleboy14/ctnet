CT.require("CT.all");
CT.require("CAN.all");

onload = function() {
    var LOADED = false;
    var uid = CAN.session.isLoggedIn();

    CAN.widget.share.currentShareName = "video";
    CAN.widget.share.shareSub("video");
    CAN.media.cases.widget(uid);

    CAN.media.video.inviteButton = CT.dom.id("vidinvite");
    if (uid && uid != "nouid") {
        CAN.widget.invite.load("video", uid, CAN.media.video.inviteButton,
            null, function() { return CAN.media.video.current; }, "watch");
        CAN.widget.slider.initUpdate(uid, function() { return CAN.media.video.current.key; });
    }
    else
        CAN.frame.clickToLogin(CAN.media.video.inviteButton);

    CT.dom.id("postButton").onclick = function() {
        location = (uid && uid != "nouid")
            ? "/participate.html#Videographer"
            : "/login.html";
    };

    CAN.categories.loadSorter(function() {
        CAN.widget.share.updateShareItem("video");
        CT.dom.showHide(CAN.media.video.inviteButton.parentNode, null, true);
    });

    CAN.media.loader.load({"mtype": "video", "number": 20, "uid": uid,
        "node": CT.dom.id("vidlist"),
        "cb": function() { LOADED = true; }});

    CAN.media.loader.load({"mtype": "referenda", "number": 3, "uid": uid,
        "node": CT.dom.id("reflist"), "paging": "bidirectional"});

    // chatterbox
    CT.net.post("/get", {"gtype": "media", "mtype": "comment", "number": 4}, null, function(items) {
        CAN.widget.stream.comment(CT.dom.id("chatterbox"), uid, items.reverse(), false, true, "full");
    });

    var _hash = CAN.cookie.flipReverse(document.location.hash.slice(2));
    var checkHash = function() {
        if (!LOADED)
            return setTimeout(checkHash, 300);
        CT.data.checkAndDo([_hash], function() {
            var vid = CT.data.get(_hash);
            if (vid && vid.mtype == "video") // else it's a comment
                return CAN.media.video.viewSingle(vid);
            CT.db.one(_hash, function(comm) {
                CT.db.get("video", function(vz) {
                    CAN.media.video.viewSingle(vz[0]);
                    CAN.widget.conversation.select(_hash, 800);
                }, null, null, null, {
                    conversation: comm.conversation
                });
            });
        });
        document.location.hash = "";
    };
    if (_hash) checkHash();
};
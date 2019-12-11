CT.require("CT.all");
CT.require("CAN.all");

onload = function() {
    var LOADED = false;
    var uid = CAN.session.isLoggedIn();
    var svnode = CT.dom.id("svnode");
    var sv = CT.dom.id("sv");
    var svl = CT.dom.id("svl");
    var newslist = CT.dom.id("newslist");

    CAN.widget.share.currentShareName = "article";
    CAN.widget.share.shareSub("news");
    CAN.media.cases.widget(uid);

    CAN.media.news.inviteButton = CT.dom.id("newsinvite");
    if (uid && uid != "nouid") {
        CAN.widget.invite.load("article", uid, CAN.media.news.inviteButton,
            null, function() { return CAN.media.news.current; }, "read");
        CAN.widget.slider.initUpdate(uid, function() { return CAN.media.news.current.key; });
    }
    else
        CAN.frame.clickToLogin(CAN.media.news.inviteButton);

    CT.dom.id("postButton").onclick = function() {
        location = (uid && uid != "nouid")
            ? "/participate.html#Reporter"
            : "/login.html";
    };

    var viewSingleNews = function(news) {
        if (!CT.dom.id("sbitem" + news.key)) {
            svl.appendChild(CT.dom.node(CT.dom.link(news.title,
                function() { viewSingleNews(news); }),
                "div", "bottompadded sbitem", "sbitem" + news.key));
            sv.style.display = "block";
        }
        CT.panel.select(news.key);
        svnode.innerHTML = "";
        svnode.appendChild(CAN.media.news.build(news));
        catheading.style.display = "none";
        newslist.style.display = "none";
        svnode.style.display = "block";
        CAN.widget.share.updateShareItem("news", news.key);
        CAN.cc.view(news);
    };

    // center: news
    CAN.media.loader.load({"mtype": "news", "number": 20,
        "node": newslist, "uid": uid,
        "newMediaChecks": {"list": ["photo", "video", "category"],
        "single": ["user"]},
        "newMediaViewMoreCb": viewSingleNews,
        "newMediaDefault": "newsintro",
        "cb": function() { LOADED = true; }});

    CAN.media.loader.load({"mtype": "referenda",
        "number": 3, "uid": uid,
        "node": CT.dom.id("reflist"),
        "paging": "bidirectional"});

    CAN.categories.loadSorter(function() {
        svnode.style.display = "none";
        catheading.style.display = "block";
        newslist.style.display = "block";
        CAN.widget.share.updateShareItem("news");
        CT.dom.showHide(CAN.media.news.inviteButton.parentNode, null, true);
    });

    // chatterbox
    CT.net.post("/get", {"gtype": "media", "mtype": "comment", "number": 4}, null, function(items) {
        CAN.widget.stream.comment(CT.dom.id("chatterbox"), uid, items.reverse(), false, true, "full");
    });

    // single news article (hash linked or simply clicked)
    var checkHash = function() {
        if (! LOADED)
            return setTimeout(checkHash, 300);
        CAN.widget.conversation.hash("news", function(news) {
            CAN.media.loader.checkAndShow([news], {
                "newMediaChecks": {
                    "list": ["photo", "video"],
                    "single": ["user"]
                }
            }, function() { viewSingleNews(news); });
        });
    };
    if (document.location.hash) checkHash();
};
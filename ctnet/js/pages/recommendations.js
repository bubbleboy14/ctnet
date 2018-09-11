CT.require("CT.all");
CT.require("CAN.all");

onload = function() {
    var uid = CAN.session.isLoggedIn();

    CAN.widget.share.currentShareName = "recommendations";
    CAN.widget.share.shareSub("recommendations");
    CAN.widget.share.updateShareItem("recommendations", null, "Books");

    var panelNames = ["Books", "Opinions And Ideas",
        "Position Papers", "Sustainable Actions",
        "Quotes", "Photographs", "News", "Videos"];
    var panelKeys = panelNames.map(function(name) {
        return name.replace(/ /g, '');
    });
    if (!uid)
        CT.dom.showHide(CT.dom.id("getmost"));
    CAN.media.loader.load({"mtype": "referenda", "number": 3, "uid": uid,
        "node": CT.dom.id("reflist"), "paging": "bidirectional"});
    CT.panel.load(panelNames, false, null, null, null, null,
        ['/img/icons/books.png',
        '/img/icons/opinions_and_ideas.png',
        '/img/icons/position_papers.png',
        '/img/icons/founder.png',
        '/img/icons/conversations.png',
        '/img/icons/photographs.png',
        '/img/icons/articles.png',
        '/img/icons/videos.png'], null, null, [function() {
            CAN.widget.share.updateShareItem("recommendations", null, "Books");
        }, function() {
            CAN.widget.share.updateShareItem("recommendations", null, "OpinionsAndIdeas");
        }, function() {
            CAN.widget.share.updateShareItem("recommendations", null, "PositionPapers");
        }, function() {
            CAN.widget.share.updateShareItem("recommendations", null, "SustainableActions");
        }, function() {
            CAN.widget.share.updateShareItem("recommendations", null, "Quotes");
        }, function() {
            CAN.widget.share.updateShareItem("recommendations", null, "Photographs");
        }, function() {
            CAN.widget.share.updateShareItem("recommendations", null, "News");
        }, function() {
            CAN.widget.share.updateShareItem("recommendations", null, "Videos");
        }]);

    var recMap = {
        opinion: "OpinionsAndIdeas",
        paper: "PositionPapers",
        photo: "Photographs",
        action: "SustainableActions"
    };
    var pr2hash = {
        Books: "Writer",
        Quotes: "Writer",
        SustainableActions: "Writer",
        News: "Reporter",
        Videos: "Videographer"
    };
    var mtypesubs = {
        action: "sustainableaction"
    };
    var properRecName = function(recName) {
        return recMap[recName] || (CT.parse.capitalize(recName) + "s");
    };
    var postContentButton = function(cnode, cname, prname) {
        prname = prname || cname;
        cnode.insertBefore(CT.dom.node(CT.dom.button("Post " + CT.parse.capitalize(cname),
            function() {
                document.location = "/participate.html#" + (pr2hash[prname] || prname);
            }), "div", "right"), cnode.firstChild);
    };
    var loadRecs = function(recName, recCount) {
        var prname = properRecName(recName);
        var mnode = CT.dom.id("sbcontent" + prname);
        postContentButton(mnode.parentNode, recName, prname);
        CAN.media.loader.load({"filter_voted": true,
            "mtype": mtypesubs[recName] || recName,
            "number": recCount, "uid": uid, "node": mnode,
            "rating": "0to10", "paging": "bidirectional",
            "recommendations": true});
    };

    loadRecs("book", 5);
    loadRecs("opinion", 2);
    loadRecs("paper", 2);
    loadRecs("action", 5);
    loadRecs("quote", 8);
    loadRecs("photo", 5);

    // news stuff
    var newsnode = CT.dom.id("sbcontentNews");
    postContentButton(newsnode.parentNode, "News")
    CAN.media.loader.load({"filter_voted": true, "mtype": "news", "nextimg": "MORE_NEWS_BUTTON",
        "node": newsnode, "eb": function(msg) {
        newsnode.innerHTML = msg; },
        "newMediaChecks": {"list": ["photo", "video"],
        "single": ["user"]}, "rating": "0to10",
        "paging": "bidirectional", "recommendations": true,
        "newMediaDefault": "newsintronocat", "number": 4,
        "uid": uid, "newMediaViewMoreCb": function(n) {
            document.location = "news.html#!" + CAN.cookie.flipReverse(n.key); }});

    // video stuff
    var videonode = CT.dom.id("sbcontentVideos");
    postContentButton(videonode.parentNode, "Videos")
    CAN.media.loader.load({"filter_voted": true, "mtype": "video", "number": 4, "uid": uid,
        "node": videonode, "eb": function(msg) {
        videonode.innerHTML = msg; },
        "newMediaDefault": "videonocat", "rating": "0to10",
        "paging": "bidirectional", "recommendations": true});

    // chatterbox
    CT.net.post("/get", {"gtype": "media", "mtype": "comment", "number": 4}, null, function(items) {
        CAN.widget.stream.comment(CT.dom.id("chatterbox"), uid, items.reverse(), false, true, "full");
    });

    var singleLoaders = {
        OpinionsAndIdeas: CAN.media.opinion.viewSingle,
        PositionPapers: CAN.media.paper.viewSingle
    };
    var h = unescape(document.location.hash.slice(2));
    if (h.indexOf("|") != -1) {
        var p = h.split("|");
        var k = CAN.cookie.flipReverse(p[1]);
        CT.data.checkAndDo([k], function() {
            singleLoaders[p[0]](CT.data.get(k));
        });
    }
    else if (panelKeys.indexOf(h) != -1) {
        CT.panel.swap(h);
        CAN.widget.share.updateShareItem("recommendations", null, h);
    }
    document.location.hash = "";
};
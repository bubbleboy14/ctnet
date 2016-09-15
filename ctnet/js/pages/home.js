CT.require("CT.all");
CT.require("CAN.all");

onload = function() {
    var feat = CT.dom.id("home_featured");
    var signup_share = CT.dom.id("home_signup_share");
    var freedomquote = CT.dom.id("freedomquote");
    var uid = CAN.session.isLoggedIn();

    // challenge
    CAN.categories.load(uid || "anonymous");
    CAN.widget.challenge.load(uid);

    var mostRecent = CT.dom.id("mostRecent");
    var mostPopular = CT.dom.id("mostPopular");
    mostRecent.order = "recent";
    mostPopular.order = "popular";
    var updateIdea = function (idea, pnode) {
        pnode.idea = idea;
        if (idea) {
            var i = idea.idea;
            if (i.length > 205)
                i = i.slice(0, 200) + ' ...';
            pnode.innerHTML = idea.user + " Wrote, " + idea.date
                + ' "' + CT.parse.process(i, true) + '"';
        }
        else
            pnode.innerHTML = "You've seen all the ideas! Submit a fresh one!";
        pnode.onclick = (idea && idea.uid) ? function() {
            document.location = "/profile.html?u="
                + CAN.cookie.flipReverse(idea.uid) + "#changes";
        } : null;
    };

    CT.net.post("/get", { gtype: "topIdeas", uid: uid },
        "error retrieving ideas", function(ideas) {
            updateIdea(ideas.recent, mostRecent);
            updateIdea(ideas.popular, mostPopular);
        });

    var bigIdea = CT.dom.id("bigIdea");
    var postIdea = CT.dom.id("postIdea");
    postIdea.onclick = function() {
        var idea = bigIdea.value.trim();
        if (!idea)
            return alert("what's the big idea?");
        CAN.categories.tagAndPost({ "key": "changeidea", "idea": idea },
            function(idea) {
                if (CT.dom.id("changeTwitter").checked) {
                    window.open(CAN.widget.share.SHAREURL.TWITTER.replace(/LINK_URL/g,
                        CAN.session.DOMAIN).replace(/LINK_TITLE/g,
                        core.config.ctnet.name), "_blank");
                }
                if (CT.dom.id("changeFacebook").checked) {
                    window.open(CAN.widget.share.SHAREURL.FACEBOOK.replace(/LINK_URL/g,
                        CAN.session.DOMAIN), "_blank");
                }
                CT.data.add(idea);
                updateIdea(idea, mostRecent);
                bigIdea.value = "";
            });
    };

    var genVoteClicker = function(ideaNode, opinion) {
        return function() {
            if (!ideaNode.idea)
                return alert("vote on what?");
            CT.net.post("/vote", {
                uid: uid || "anonymous",
                key: ideaNode.idea.key,
                opinion: opinion,
                returnMost: ideaNode.order
            }, "error casting vote", function(newIdea) {
                newIdea && CT.data.add(newIdea);
                updateIdea(newIdea, ideaNode);
            });
        };
    };

    CT.dom.id("recentYes").onclick
        = genVoteClicker(mostRecent, 1);
    CT.dom.id("recentNo").onclick
        = genVoteClicker(mostRecent, -1);
    CT.dom.id("popularYes").onclick
        = genVoteClicker(mostPopular, 1);
    CT.dom.id("popularNo").onclick
        = genVoteClicker(mostPopular, -1);

    // slider
    initSlider();
    CT.net.post("/get", { "gtype": "slider" },
        "error retrieving slider content", function(d) {
            CT.data.addSet(d.extra);
            for (var i = 0; i < d.rotation.length; i++) {
                CT.dom.id('gcontent'+i)
                    .appendChild(CAN.widget.slider.builders[d.rotation[i].mtype](d.rotation[i]));
            }
        });

    // everyday currency search
    var ecs = CT.dom.id("everydayCurrencySearch");
    CT.dom.inputEnterCallback(ecs, function() {
        if (ecs.value) {
            document.location = 'http://www.everydaycurrency.org/Directory/search_results.php?keyword=' + ecs.value.replace(/ /g, "+");
        }
    });

    CT.dom.id("lightbulblink").href = uid && "/participate.html" || "/login.html";

    // latest news and videos
    var vOffset = 295;//300;//0;//365;
    feat.appendChild(CT.align.absed(CT.dom.node(CT.dom.link("LATEST VIDEOS",
        null, "/video.html"), "div", "bold whitelink nowrap"), 625, 273 + vOffset));
    feat.appendChild(CT.align.absed(CT.dom.node(CT.dom.link("LATEST NEWS",
        null, "/news.html"), "div", "bold whitelink"), 300, 273 + vOffset));

    var newslink = CT.dom.link("", null, "/news.html");
    newslink.appendChild(CT.dom.node("", "div", null, "newswirelink"));
    feat.appendChild(CT.align.absed(CT.dom.node(newslink), 30, 240 + vOffset));

    var reflink = CT.dom.link("", null, "/referenda.html");
    reflink.appendChild(CT.dom.node("", "div", null, "votenowlink"));
    feat.appendChild(CT.align.absed(CT.dom.node(reflink), 30, 420 + vOffset));

    // social networking links
    var snlinks = CT.dom.node("", "div", "right rmargined rpadded shiftupless");
    CAN.widget.share.shareSub("home", snlinks, 740, 632 + vOffset, true);
    signup_share.appendChild(snlinks);

    if (uid) {
        signup_share.appendChild(CT.dom.node("Thank you!", "span", "bold"));
        signup_share.appendChild(CT.dom.node("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CAN values your participation.", "span"));
    }
    else {
        signup_share.appendChild(CT.dom.link("Sign up today.", null, "/login.html"));
        signup_share.appendChild(CT.dom.node("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;It's free. It's private.", "span"));
    }

    // latest videos
    var latestvideos = CT.dom.node("", "div",
        "thumb awhite blackimg dashedgrayleft", "latestVideos");
    feat.appendChild(CT.align.absed(latestvideos, 612, 293 + vOffset));
    CAN.media.loader.load({"mtype": "video", "layout": "tiled", "node": latestvideos,
        "number": 4, "width": 2, "nextimg": "MORE_VIDEO_BUTTON_BLUE_TRANS.png",
        "newMediaDefault": "videothumb", "paging": "rotation"});

    // latest news
    var latestnews = CT.dom.node("", "div",
        "smallthumb awhite whiteimg w300", "latestNews");
    feat.appendChild(CT.align.absed(latestnews, 300, 298 + vOffset));
    CAN.media.loader.load({"mtype": "news", "node": latestnews,
        "nextimg": "MORE_NEWS_BUTTON_BLUE_TRANS.png",
        "newMediaDefault": "newsteaser", "number": 3,
        "newMediaChecks": {"justFirst": ["photo"]}, "shared": 1,
        "paging": "rotation", "newMediaViewMoreCb": function(n) {
            document.location = "news.html#!" + CAN.cookie.flipReverse(n.key); }});

    var nheight = function(n) {
        if (!n.className || n.className.indexOf("right") != -1)
            return 0;
        return n.offsetHeight || n.clientHeight || 0;
    };
    var refreshSameHeights = function(issecond) {
        var d = document.getElementsByClassName("sameheight");
        var most = 0;
        for (var i = 0; i < d.length; i++) {
            var n = d[i];
            var myheight = 0;
            for (var q = 0; q < n.childNodes.length; q++) {
                var h = nheight(n.childNodes[q]);
                if (!h) {
                    for (var z = 0; z < n.childNodes[q].childNodes.length; z++)
                        h += (nheight(n.childNodes[q].childNodes[z]));
                }
                myheight += h;
            }
            most = Math.max(n.scrollHeight - 22,
                nheight(n) - 22, myheight, most);
        }
        var hpx = most + "px"; // border, padding
        for (var i = 0; i < d.length; i++)
            d[i].style.height = hpx;
        if (!issecond) { // just in case
            setTimeout(refreshSameHeights, 500, true);
            setTimeout(refreshSameHeights, 1000, true);
            setTimeout(refreshSameHeights, 2000, true);
            setTimeout(refreshSameHeights, 3000, true);
        }
    };

    // global thought stream
    CAN.widget.stream.load(CT.dom.id("thoughtstream"),
        CT.dom.id("thoughtfilter"), refreshSameHeights);

    // random susact request automatically filters out non-shared
    CAN.media.loader.load({"mtype": "sustainableaction", "random": true,
        "node": CT.dom.id("sustainableaction")});

    var pn = CT.dom.id("photo");
    CAN.media.loader.load({"mtype": "photo", "random": true, "node": pn,
        "rating": "0to10", "uid": uid, "newMediaDefault": "photoscale"});

    CAN.media.loader.load({"mtype": "referenda", "number": 9, "uid": uid,
        "node": CT.dom.id("reflist"),
        "paging": "rotation", "cb": refreshSameHeights});

    CAN.media.loader.load({"mtype": "book", "number": 9, "uid": uid,
        "node": CT.dom.id("bookrecommendations"),
        "paging": "rotation", "cb": refreshSameHeights, "shared": 1});

    CAN.media.loader.load({"mtype": "quote", "uid": uid,
        "rating": "5star", "node": freedomquote, "shared": 1});
};
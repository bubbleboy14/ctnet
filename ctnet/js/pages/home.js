CT.require("CT.all");
CT.require("CAN.all");
CT.net.setRetry(3);

onload = function() {
    var feat = CT.dom.id("home_featured");
    var signup_share = CT.dom.id("home_signup_share");
    var freedomquote = CT.dom.id("freedomquote");
    var uid = CAN.session.isLoggedIn();
    CAN.categories.load(uid || "anonymous");

    // topz (more like a forum)
    var topIndex = 0, topChunk = 7, topRefilling;
    var topTable = CT.dom.table([[
        "<b>Tags</b>", "<b id='threadspot'>Thread</b>", "<b>Poster</b>",
        "<b>Replies</b>", "<b>Posted</b>", "<b>Updated</b>"
    ]]), topNode = CT.dom.id("topz");
    var topRefill = function(cb) {
        if (topRefilling) return;
        topRefilling = true;
        CT.db.get("thought", function(thoughts) {
            cb(thoughts);
            topRefilling = false;
            topIndex += topChunk;
        }, topChunk, topIndex, "-created");
    };

    CT.dom.setContent(topNode, topTable);
    if (CT.info.isFirefox)
        CT.dom.addStyle("#topz { font-size: 110% !important; }");
    CT.dom.id("threadspot").appendChild(CT.dom.div([
        CT.dom.button("global feed", function() {
            window.location = "/feed.html";
        }, "bold mh5"),
        CT.dom.button("new", function() {
            window.location = "/community.html#!Stream";
        }, "bold")
    ], "right"));

    var topRefiller = function(thoughts) {
        var unodez = [], rnodez = [], posterz = [], pkeyz = [];
        CT.dom.addRows(topTable, thoughts.map(function(t) {
            var unode = CT.dom.div(), tnode = CT.dom.div(), rnode = CT.dom.div();
            unodez.push(unode);
            rnodez.push(rnode);
            posterz.push(t.user || "anon");
            t.user && pkeyz.push(t.user);
            CAN.categories.get(function() {
                CT.dom.setContent(tnode, t.category.filter(function(c) {
                    return CAN.categories.byKey(c).name in core.config.ctnet.categories.icons;
                }).map(function(c) {
                    return CT.dom.img(core.config.ctnet.categories.icons[CAN.categories.byKey(c).name]);
                }));
            });
            return [
                tnode,
                CT.dom.link(CT.parse.shortened(t.thought, 100, 15, true), null,
                    "/community.html#!Stream|" + CAN.cookie.flipReverse(t.key)),
                unode,
                rnode,
                CT.parse.timeStamp(t.created),
                CT.parse.timeStamp(t.modified)
            ];
        }));
        CT.data.checkAndDo(pkeyz, function() {
            unodez.forEach(function(n, i) {
                n.appendChild(posterz[i] == "anon" ? CT.dom.div("(anon)") :
                    CAN.session.firstLastLink(CT.data.get(posterz[i]), null, null, null, true));
            });
        });
        CT.net.post({
            path: "/get",
            params: {
                gtype: "comcount",
                keys: thoughts.map(function(t) {
                    return t.conversation;
                })
            },
            cb: function(countz) {
                rnodez.forEach(function(n, i) {
                    CT.dom.setContent(n, countz[i]);
                });
            }
        });
    };
    CT.hover.set(topNode, CT.dom.marquee("scroll for more!", null, null, true));
    topRefill(topRefiller);
    topNode.onwheel = function(wevent) {
        if (wevent.deltaY > 0) {
            if (!topNode._scrolled) {
                CT.hover.unset(topNode);
                topNode._scrolled = true;
                topNode.style.overflow = "auto";
            }
            if (topNode.scrollTop == topNode.scrollHeight - topNode.clientHeight)
                topRefill(topRefiller);
        }
    };
    CT.dom.ALLNODE.onwheel = function(wevent) {
        topRefilling && wevent.preventDefault();
    };

    // memez [scrolly]
    var memez = CT.dom.id("memez"), mindex = 0, mchunk = 7, memeRefilling;
    CT.hover.set(memez, CT.dom.marquee("scroll for more!", null, null, true));
    var memeRefill = function() {
        if (memeRefilling) return;
        memeRefilling = true;
        CT.db.get("meme", function(memes) {
            CT.dom.addContent(memez, memes.map(function(m) {
                return CT.dom.link([
                    CT.dom.img(m.image),
                    CT.dom.div(m.title, "abs all0 h100 pt100 white centered overlay nonowrap")
                ], null, "/community.html#!Memes|" + CAN.cookie.flipReverse(m.key),
                    "pointer relative inline-block");
            }));
            memeRefilling = false;
            mindex += mchunk;
        }, mchunk, mindex, "-created");
    };
    memeRefill();
    memez.onwheel = function(wevent) {
        if (!memez._scrolled) {
            CT.hover.unset(memez);
            memez._scrolled = true;
            memez.style.overflowX = "scroll";
        }
        memez.scrollLeft += wevent.deltaY;
        if (memez.scrollLeft + memez.clientWidth == memez.scrollWidth)
            memeRefill();
        wevent.preventDefault();
        wevent.stopPropagation();
    };

    // forum (more like hot topics)
    CT.net.post("/get", {
        "gtype": "media", "mtype": "comment", "number": 60
    }, null, function(comments) {
        var topic, cat, i, j, k, top = 0,
            clist = [], convos = {},
            fcats = {}, winners = [];

        // prunes away duplicates from biggest cats
        var pruneCats = function() {
            var pruned, touched;
            for (i = 0; i < 3; i++) {
                touched = false;
                cat = fcats[winners[i]];
                for (j = 0; !touched && j < cat.length; j++) {
                    topic = cat[j];
                    for (k = i + 1; k < 4; k++)
                        touched = !!CT.data.remove(fcats[winners[k]], topic) || touched;
                    pruned = touched || pruned;
                }
            }
            if (pruned) {
                winners.sort(function(a, b) {
                    return fcats[a].length - fcats[b].length;
                });
                pruneCats();
            }
        };

        CT.data.addSet(comments);

        // compile conversation sets
        comments.forEach(function(comment) {
            if (!(comment.conversation in convos)) {
                clist.push(comment.conversation);
                convos[comment.conversation] = [];
            }
            convos[comment.conversation].push(comment);
        });

        // compile topic sets
        CT.net.post({
            path: "/get",
            params: {
                gtype: "convodata",
                keys: clist
            },
            cb: function(cdata) {
                CT.data.addSet(cdata);

                // compile category sets
                clist.forEach(function(c, i) {
                    topic = convos[c].topic = cdata[i];
                    topic.category && topic.category.forEach(function(cat) {
                        fcats[cat] = fcats[cat] || [];
                        fcats[cat].push(topic.key);
                        top = Math.max(top, fcats[cat].length);
                    });
                });

                // get top 4 categories
                for (i = top; i > 0 && winners.length < 4; i--) {
                    for (c in fcats) {
                        if (fcats[c].length == i) {
                            winners.unshift(c);
                            if (winners.length == 4)
                                break;
                        }
                    }
                }

                // prune (recurses several times)
                pruneCats();

                // now show it in 4 columns...
                var bgz = [];
                CT.dom.setContent("forum", winners.map(function(ckey) {
                    var cat = CT.data.get(ckey), n = CT.dom.div([
                        CT.dom.div(cat.name, "biggest bold blue centered whitestroke"),
                        fcats[ckey].map(function(key) {
                            return CAN.media.loader.contentNode(key, convos);
                        })
                    ]);
                    CT.db.get("photo", function(pz) {
                        var idata = CT.data.choice(pz.filter(function(p) {
                            return bgz.indexOf(p.key) == -1;
                        })), img;
                        bgz.push(idata.key);
                        if (idata.photo)
                            img = idata.photo;
                        else if (idata.html)
                            img = idata.html.split('src="')[1].split('" ')[0];
                        else
                            img = "/get?gtype=graphic&key=" + (idata.graphic || idata.key);
                        n.appendChild(CT.dom.panImg({
                            img: img,
                            panDuration: 10000
                        }));
                    }, 8, 0, null, {
                        category: {
                            value: cat.key,
                            comparator: "contains"
                        },
                        shared: true,
                        is_book_cover: false
                    });
                    return n;
                }));
            }
        });
    });


    // challenge
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
    CT.net.post("/get", { "gtype": "slider" },
        "error retrieving slider content", function(d) {
            CT.data.addSet(d.extra);
            new CT.slider.Slider({
                parent: "slider-container",
                frames: ['start'].concat(d.rotation),
                arrowPosition: "bottomer",
                frameCb: function(item) {
                    if (item.img == 'start')
                        return CT.dom.img("/img/home/banner.png",
                            "block automarg");
                    return CAN.widget.slider.builders[item.mtype](item);
                }
            });
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
    feat.appendChild(CT.align.absed(CT.dom.button("new", function() {
        location = "/participate.html#Videographer";
    }, "bold"), 843, 268 + vOffset));
    feat.appendChild(CT.align.absed(CT.dom.button("new", function() {
        location = "/participate.html#Reporter";
    }, "bold"), 560, 268 + vOffset));

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
        "vthumb awhite blackimg dashedgrayleft", "latestVideos");
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
        CT.dom.id("thoughtfilter"), refreshSameHeights, 5);

    // random susact request automatically filters out non-shared
    CAN.media.loader.load({"mtype": "sustainableaction", "random": true,
        "node": CT.dom.id("sustainableaction")});

    var pn = CT.dom.id("photo");
    CAN.media.loader.load({"mtype": "photo", "random": true, "node": pn,
        "rating": "0to10", "uid": uid, "newMediaDefault": "photoscale"});

    CAN.media.loader.load({"mtype": "referenda", "number": 10, "uid": uid,
        "node": CT.dom.id("reflist"),
        "paging": "rotation", "cb": refreshSameHeights});

    CAN.media.loader.load({"mtype": "book", "number": 10, "uid": uid,
        "node": CT.dom.id("bookrecommendations"),
        "paging": "rotation", "cb": refreshSameHeights, "shared": 1});

    CAN.media.loader.load({"mtype": "quote", "uid": uid,
        "rating": "5star", "node": freedomquote, "shared": 1});
};
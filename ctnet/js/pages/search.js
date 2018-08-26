CT.require("CT.all");
CT.require("CAN.all");

google.setOnLoadCallback(function() {
    var LOADED = false;
    var uid = CAN.session.isLoggedIn();
    CAN.widget.challenge.load(uid);

    var searchRules = { // filled in by request later...
        "liberty": { }, "eco": { } };
    var results = CT.dom.id("results");
    var canresults = CT.dom.id("canresults");
    var querystring = CT.dom.id("querystring");
    var CANSearch = function() {
        this.searchers = {};
        var newIsOn = function(s) {
            return function() {
                    return CT.dom.id("Googlecheckbox").checked
                        && CT.dom.id(s+"checkbox").checked;
                };
        };
        for (var i = 0; i < CAN.search.types.length; i++) {
            var s = CAN.search.types[i];
            if (!(CAN.search.info[s].google))
                continue;
            this.searchers[s] = new google.search[s+'Search']();
            this.searchers[s].setSearchCompleteCallback(this,
                CANSearch.prototype.searchComplete, [s]);
            this.searchers[s].setResultSetSize(google.search.Search.LARGE_RESULTSET);
            if (this.searchers[s].setSiteRestriction == null)
                this.searchers[s].setSiteRestriction = function(){};
            this.searchers[s].isOn = newIsOn(s);
        }
    };
    var resultpage = {};
    CANSearch.prototype.searchComplete = function(s) {
        var container = CT.dom.id(s+"results");
        if (!container) {
            container = CT.dom.node("", "div", "bordered padded bottommargined inlineimg" + ((s != "Book") && " small" || ""), s + "results");
            resultpage[s] = 1;
        }
        else
            container.innerHTML = "";
        container.appendChild(CT.dom.node(s + " Results", "div", "right gray"));
        var searcher = this.searchers[s];
        if (searcher.results.length == 0)
            container.appendChild(CT.dom.node("no results"));
        else {
            for (var i = 0; i < searcher.results.length; i++) {
                var r = searcher.results[i].html;
                if (r.childNodes.length)
                    r.removeChild(r.childNodes[r.childNodes.length - 1]);
                container.appendChild(r);
                container.innerHTML += "<hr>";
            }
            container.innerHTML = container.innerHTML.slice(
                0, container.innerHTML.length - 4);
        }
        var prevnext = CT.dom.node("", "center");
        if (resultpage[s] != 1) {
            prevnext.appendChild(CT.dom.img("/img/search/previous.png", null,
                function() { resultpage[s] -= 1;
                searcher.gotoPage(resultpage[s]); }));
            prevnext.appendChild(CT.dom.node("&nbsp;&nbsp;&nbsp;", "span"));
        }
        prevnext.appendChild(CT.dom.img("/img/search/next.png", null,
            function() { resultpage[s] += 1;
            searcher.gotoPage(resultpage[s]); }));
        container.appendChild(prevnext);
        results.appendChild(container);
        if (s == "Book") {
            var hidethese = document.getElementsByClassName("gs-row-1");
            for (var i = 0; i < hidethese.length; i++)
                hidethese[i].style.display = "none";
        }
    };
    var searchcolumn = CT.dom.id("searchcolumn");
    var featuredResults = null;
    var insertedWords = null;
    CAN.media.loader.registerBuilder("userresult", function(u, lastuser) {
        var n = CT.dom.link("", function() {
            document.location = "/profile.html?u=" + CAN.cookie.flipReverse(u.key); });
        n.appendChild(CT.dom.node(CT.dom.img("/get?gtype=avatar&size=chat&uid="
            + CAN.cookie.flipReverse(u.key)), "div", "lfloat rpadded"));
        n.appendChild(CT.dom.node(u.firstName + " " + u.lastName));
        n.appendChild(CT.dom.node("", "div", "clearnode"));
        return CT.dom.node(n, "div", (!lastuser) && "bottompadded bottomline" || "");
    });

    // Old: User, Event, News, Video, Book
    // New: Group, Idea, Paper, Quote, Action, Thought
    // Newer: Case
    // Newest: Question, Change
    var searchers = {
        "Event": function(events, container) {
            CAN.media.loader.checkAndShow(events, {},
                function() {
                    for (var i = 0; i < events.length; i++)
                        container.appendChild(CT.dom.node(
                            CAN.media.loader.builders.eventresult(events[i]), "div",
                            (i != events.length - 1) && "bottompadded bottomline" || ""));
                });
        }, "News": function(news, container) {
            CAN.media.loader.checkAndShow(news,
                { "newMediaChecks": {"justFirst": ["photo"]} }, function() {
                    CAN.media.loader.args.news = {
                        "newMediaViewMoreCb": function(d) {
                            document.location = "news.html#!" + CAN.cookie.flipReverse(d.key);
                        }};
                    for (var i = 0; i < news.length; i++)
                        container.appendChild(CT.dom.node(
                            CAN.media.loader.builders.news(news[i], i, "result"),
                            "div", (i != news.length - 1) && "bottomline" || ""));
                });
        }, "User": false, "Video": false, "Book": false,
        "Group": false, "Idea": false, "Paper": false, "Law": false,
        "Quote": false, "Action": false, "Thought": false,
        "Question": false, "Change": false, "Case": false
    };
    var searchOuts = {};
    var checkResults = function() {
        for (var k in searchOuts)
            if (searchOuts[k]) return;
        var gcheck = CT.dom.id("Googlecheckbox");
        if (canresults.innerHTML == "searching...") {
            canresults.innerHTML = "No CAN results!";
            if (!gcheck.checked) {
                canresults.appendChild(CT.dom.node(CT.dom.link("Broaden search to include Google results",
                    function() {
                        canresults.innerHTML = "";
                        gcheck.checked = true;
                        searchGoog();
                        gcheck.checked = false;
                    })));
            }
        }
    };
    var singleSearch = function(searchType, q) {
        searchOuts[searchType] = true;
        var stLower = searchType.toLowerCase();
        CT.net.post("/get", {"gtype": "search", "stype": stLower,
            "string": q, "sd": CAN.cookie.checkStartDate(),
            "ed": CAN.cookie.checkEndDate()},
            "error finding " + stLower + "s", function(results) {
                searchOuts[searchType] = false;
                var container = CT.dom.div(null, "bordered padded small bottommargined "
                    + ((stLower == "thought") && "fwimg" || "thumb"));
                container.appendChild(CT.dom.node(
                    "CAN " + searchType + " Results",
                    "div", "right gray"));
                if (results.length == 0)
                    return checkResults();
                else if (searchers[searchType])
                    searchers[searchType](results, container);
                else {
                    for (var i = 0; i < results.length; i++)
                        container.appendChild(CT.dom.node(
                            CAN.media.loader.builders[stLower + 'result'](
                                results[i], i == (results.length - 1))));
                }
                if (canresults.innerHTML == "searching...")
                    canresults.innerHTML = "";
                canresults.appendChild(container);
                checkResults();
            });
    };

    var currentQuery;
    var searchGoog = function() {
        var r = CT.dom.getFieldValue("restriction", [], {"requires": ["."]});
        for (searcherName in CAN.search.cansearch.searchers) {
            var searcher = CAN.search.cansearch.searchers[searcherName];
            if (searcher.isOn()) {
                searcher.setSiteRestriction(r);
                searcher.execute(currentQuery);
            }
        }
    };
    CANSearch.prototype.search = function(form) {
        var q = currentQuery = CT.dom.getFieldValue("search", ["childNodes", 0, "search"]);
        if (q) {
            results.innerHTML = "";
            searchcolumn.innerHTML = "";
            canresults.innerHTML = "searching...";
            var ast = CAN.cookie.activeSearchTypes();

            for (var k in searchers) {
                if (ast.indexOf(k) != -1)
                    singleSearch(k, q);
            }

            var qa = null;
            if (CT.dom.id("Ecocheckbox").checked)
                qa = searchRules.eco;
            else if (CT.dom.id("Libertycheckbox").checked)
                qa = searchRules.liberty;
            if ((!form) && qa) {
                searchcolumn.parentNode.style.display = "block";
                insertedWords = CT.dom.node("", "div", "bottompadded", "insertedWords");
                featuredResults = CT.dom.node("", "ul", "", "featuredResults");
                var scf = CT.dom.node("", "div", "", "searchcolumnfull");
                scf.appendChild(CT.dom.node("Inserted Words", "div", "big bold underline"));
                scf.appendChild(insertedWords);
                scf.appendChild(CT.dom.node("Featured Results", "div", "big bold underline"));
                scf.appendChild(featuredResults);
                searchcolumn.appendChild(scf);
                for (a in qa) {
                    if (q.indexOf(a) != -1)
                        q = qa[a](q);
                }
            }
            else  // Google's button was clicked
                searchcolumn.parentNode.style.display = "none";
            querystring.innerHTML = '&quot;' + q + '&quot;';
            searchGoog();
            CT.dom.setFieldValue(q.replace(/  /g, " "), "search", ["childNodes", 0, "search"]);
        }
        return false;
    };
    CAN.search.setCANsearch(new CANSearch());
    var searchform = new google.search.SearchForm(false,
        CT.dom.id("search"));
    searchform.setOnSubmitCallback(CAN.search.cansearch,
        CANSearch.prototype.search);
    var _hash = document.location.hash.slice(1);
    var checkHash = function() {
        if (! LOADED)
            return setTimeout(checkHash, 300);
        CT.dom.setFieldValue(_hash, "search", ["childNodes", 0, "search"]);
        CAN.search.cansearch.search();
        document.location.hash = "";
    }
    if (_hash) checkHash();
    var addWord = function(w) {
        var showword = (w.indexOf(" ") == -1) && w || ("'" + w + "'");
        var n = CT.dom.node();
        var c = CT.dom.field();
        c.type = "checkbox";
        c.checked = true;
        c.onclick = function() {
            var q = CT.dom.getFieldValue("search", ["childNodes", 0, "search"]);
            if (c.checked) {
                if (q.indexOf(showword) == -1) {
                    if (q.charAt(q.length-1) != " ")
                        q += " ";
                    CT.dom.setFieldValue(q + showword, "search", ["childNodes", 0, "search"]);
                }
            }
            else
                setFieldValue(q.split(showword).join("").replace(/  /g, " "), "search", ["childNodes", 0, "search"]);
        };
        n.appendChild(c);
        n.appendChild(CT.dom.node(showword, "span"));
        insertedWords.appendChild(n);
        return " " + showword;
    };
    var searchRuleCb = function(rule) {
        return function(qstring) {
            for (var i = 0; i < rule.insert.length; i++) {
                var w = rule.insert[i];
                if (qstring.indexOf(w) == -1)
                    qstring += addWord(w);
            }
            CT.data.checkAndDo(rule.featured, function() {
                for (var i = 0; i < rule.featured.length; i++) {
                    var f = CT.data.get(rule.featured[i]);
                    if (CT.dom.id("f"+f.key))
                        continue;
                    var n = CT.dom.node("", "li", "", "f" + f.key);
                    n.appendChild(CT.dom.node(f.title, "b"));
                    n.appendChild(CT.dom.node(", " + f.blurb + " - ", "i"));
                    n.appendChild(CT.dom.link(f.link, null, "http://" + f.link));
                    featuredResults.appendChild(n);
                }
            });
            return qstring;
        };
    };
    CT.net.post("/get", {"gtype": "search"}, "error retrieving search rules",
        function(r) {
            for (var i = 0; i < r.length; i++) {
                var cb = searchRuleCb(r[i]);
                for (var z = 0; z < r[i].keyword.length; z++)
                    searchRules[r[i].type][r[i].keyword[z]] = cb;
            }
            LOADED = true;
        });
});
CT.require("CT.all");
CT.require("CT.rte");
CT.require("CAN.all");

onload = function() {
    CT.dom.className("dswap").forEach(function(n) {
        n.innerHTML = CAN.session.DOMAIN;
    });
    var panelname = null; // basically used for photo and video selection
    var ALLUSERSLOADED = false;
    var loadSettingsPanel; // for compilation
    var SBITEMS = CT.dom.id("sbitems");
    var uid = CAN.session.isLoggedIn(function() {
        loadSettingsPanel();
    });
    if (!uid)
        CT.dom.showHide(CT.dom.id("getmost"));

    var resizeThese = [];
    var resizeNodes = function() {
        var newsize = SBITEMS.clientHeight + "px";
        for (var i = 0; i < resizeThese.length; i++)
            resizeThese[i].style.minHeight = newsize;
    };

    var loaders = {};
    var loaded = {};
    var ggroles = ["approver", "authenticator", "coordinator",
        "moderator", "lawyer", "recruiter"];
    var roles = ["reporter", "writer", "photographer", "videographer"];
    var hashsub = null;
    var loadAdminPanels = function(p, o) {
        // p = new roles
        // o = old roles
        p = p || [];
        o = o || [];
        if (p.indexOf("greg") == 0)
            roles = ggroles.concat(roles);
        var pstart = ["Introduction"];
        p = pstart.concat(p);
        if (uid) {
            p.push("opinions_and_ideas");
            p.push("position_papers");
            p.push("action_groups");
            p.push("cases");
        }
        var cicons = [];
        var pcap = [];
        var nospaces = [];
        var hashLawyerJump = "Lawyer";
        if (uid && p.indexOf("lawyer") == -1) {
            p.push("referenda");
            hashLawyerJump = "Referenda";
        }
        if (p.indexOf("reporter") != -1 || p.indexOf("writer") != -1)
            loaders["photosandvideos"]();
        var iconMap = {
            "lawyer": "referenda",
            "photographer": "photographs",
            "videographer": "videos",
            "writer": "writing",
            "reporter": "articles",
            "coordinator": "events",
            "greg": "founder",
            "paul": "founder",
            "mario": "founder"
        };
        var titleMap = {
            "videographer": "Videos",
            "photographer": "Photographs",
            "reporter": "Articles",
            "coordinator": "Events",
            "writer": "Quips And Tips"
        };
        for (var i = 0; i < p.length; i++) {
            if (loaders[p[i]]) loaders[p[i]]();
            //var cappedname = p[i].slice(0,1).toUpperCase() + p[i].slice(1);
            var cappedname = CT.parse.key2title(p[i]);
            pcap.push(titleMap[p[i]] || cappedname);
            nospaces.push(cappedname.replace(/ /g, ""));
            cicons[i] = "/img/icons/" + (iconMap[p[i]] || p[i]) + ".png";
        }
        for (var i = 0; i < o.length; i++) {
            if (p.indexOf(o[i]) == -1)
                CT.panel.remove(o[i]);
        }
        var pcap2 = [];
        var nospaces2 = [];
        var icons2 = [];
        pcap2.push("Put Up Flyers");
        pcap2.push("Make a Donation");
        pcap2.push("Link to CAN");
        nospaces2.push("PutUpFlyers");
        nospaces2.push("MakeaDonation");
        nospaces2.push("LinktoCAN");
        icons2.push("/img/icons/flyer.png");
        icons2.push("/img/icons/donation.png");
        icons2.push("/img/participate/logo_mini.gif");
        if (p.length > 0) {
            CT.panel.load(pcap, true, null, null, null, nospaces, cicons);
            SBITEMS.appendChild(CT.dom.node("", "br"));
        }
        CT.panel.load(pcap2, true, null, null, null, nospaces2,
            icons2, SBITEMS.innerHTML != "loading...");
        CT.panel.alternatebg(null, true, true);

        var h = document.location.hash.slice(1);
        if (h && uid) {
            if (!uid && nospaces2.indexOf(h) == -1)
                document.location = "login.html";
            var hs = unescape(h).split("|");
            if (hs.length > 1) {
                h = hs[0];
                hashsub = hs[1];
            }
            if (h == "lawyer")
                CT.panel.swap(hashLawyerJump, true);
            else if (h == "Photographs")
                CT.panel.swap("Photographer", true);
            else
                CT.panel.swap(h, true);
            if (history && history.pushState)
                history.pushState("", document.title, window.location.pathname);
            else
                document.location.hash = "";
        }

        resizeThese.push(CT.dom.id("sbpanelIntroduction"));
        resizeThese.push(CT.dom.id("sbpanelMakeaDonation"));
        setInterval(resizeNodes, 1000); // horrible hack!
    };
    if (uid) {
        CT.net.post("/get", {"gtype": "user", "uid": uid, "role": 1},
            "error retrieving user roles", function(d) {
                CT.data.add(d);
                loadAdminPanels(d.role);
            });
    }
    else
        loadAdminPanels();

    // role application
    var applyrole = CT.dom.select(["Select Desired Role", "reporter",
        "photographer", "videographer", "coordinator", "other"]);
    var lastclickedapplyrole = null;
    applyrole.onclick = function() {
        var rtext = CT.dom.id("applyrole" + applyrole.value);
        if (lastclickedapplyrole)
            lastclickedapplyrole.className = "";
        if (applyrole.value == "Select Desired Role")
            return;
        rtext.className = "lastclickedapplyrole";
        lastclickedapplyrole = rtext;
    };
    CT.dom.id("applyrole").appendChild(applyrole);
    var applystatement = CT.dom.id("applystatement");
    CT.dom.id("applysubmit").onclick = function() {
        if (applyrole.value == "Select Desired Role")
            return alert("please select a role");
        if (applystatement.value == "")
            return alert("please provide a statement");
        var pdata = {"key": uid, "etype": "application", "apply": {
            "role": applyrole.value,
            "statement": applystatement.value }};
        CT.net.post("/edit", {"eid": uid, "data": pdata},
            "error submitting application", function() {
                applyrole.value = "Select Desired Role";
                applystatement.value = "";
                alert("Thank you for your application.");
            });
    };

    var REFORDERER = CT.dom.id("reforderer");
    var CATORDERER = CT.dom.id("catorderer");
    var allcategories = null;
    var allreferenda = null;
    var swappertypes = {"Prime": ["Other"], "Other": ["Prime"],
        "CAN": ["User", "Unlisted"], "User": ["CAN", "Unlisted"],
        "Unlisted": ["CAN", "User"]};
    // setSwapperItem must appear before setSwapLine for compilation reasons
    var setSwapperItem = null;
    var setSwapLine = function(n, key, nextswapper) {
        n.appendChild(CT.dom.link(nextswapper, function() {
            n.parentNode.removeChild(n);
            setSwapperItem(key, nextswapper);
        }));
    };
    setSwapperItem = function(key, stype) {
        var n = CT.dom.node("", "div",
            "bordered padded round bottommargined", "si"+key);
        n.appendChild(CT.dom.node(CT.data.get(key).name || CT.data.get(key).title));
        if (stype == "Unlisted") {
            n.appendChild(CT.dom.button("DELETE", function() {
                if (confirm("are you sure?") && confirm("really? no takebacks...")) {
                    CT.net.post("/edit", {"eid": uid, "data": {"key": key,
                        "delete": 1}}, "error deleting referendum", function() {
                        CT.dom.remove(n);
                    });
                }
            }, "m10"));
        } else {
            n.appendChild(CT.dom.link("up", function() {
                var prev = n.previousSibling;
                if (prev)
                    n.parentNode.insertBefore(n, prev);
                else // n is top node -- move it to bottom!
                    n.parentNode.appendChild(n);
            }));
            n.appendChild(CT.dom.node("&nbsp;&nbsp;&nbsp;", "span"));
            n.appendChild(CT.dom.link("down", function() {
                var p = n.parentNode;
                var nxt = n.nextSibling;
                if (nxt) {
                    var nxtnxt = nxt.nextSibling;
                    if (nxtnxt)
                        p.insertBefore(n, nxtnxt);
                    else
                        p.appendChild(n);
                }
                else // n is bottom node -- move it to top!
                    p.insertBefore(n, p.firstChild);
            }));
        }
        n.appendChild(CT.dom.node("", "br"));
        for (var i = 0; i < swappertypes[stype].length; i++) {
            setSwapLine(n, key, swappertypes[stype][i]);
            if (i < swappertypes[stype].length - 1)
                n.appendChild(CT.dom.node("&nbsp;&nbsp;&nbsp;", "span"));
        }
        CT.dom.id(stype + "swappers").appendChild(n);
    };
    var loadSwapper = function(parentnode, stype, name1, name2, name3) {
        var t = CT.dom.node("", "table", "fullwidth");
        var r = t.insertRow(0);
        var c1 = r.insertCell(0);
        var c2 = r.insertCell(1);
        c1.appendChild(CT.dom.node(name1+" "+stype,
            "div", "bold blue bottommargined bottomline nowrap"));
        c2.appendChild(CT.dom.node(name2+" "+stype,
            "div", "bold blue bottommargined bottomline nowrap"));
        c1.appendChild(CT.dom.node("", "div", "", name1 + "swappers"));
        c2.appendChild(CT.dom.node("", "div", "", name2 + "swappers"));
        if (name3) {
            var c3 = r.insertCell(2);
            c1.className = c2.className = c3.className = "w100";
            c3.appendChild(CT.dom.node(name3 + " " + stype,
                "div", "bold blue bottommargined bottomline nowrap"));
            c3.appendChild(CT.dom.node("", "div", "", name3 + "swappers"));
        }
        else
            c1.style.width = "50%";
        parentnode.innerHTML = "";
        parentnode.appendChild(t);
    };
    var saveSetting = function(sname, swapname, cb) {
        var snode = CT.dom.id(swapname + "swappers");
        var pdata = {"uid": uid, "key": sname};
        pdata.val = [];
        for (var i = 0; i < snode.childNodes.length; i++)
            pdata.val.push(snode.childNodes[i].id.slice(2));
        if (CT.data.sameList(CAN.session.settings[sname], pdata.val)) {
            if (cb) cb(false);
            else alert("but you haven't changed anything!");
        }
        else {
            CT.net.post("/settings", pdata, "error committing changes",
                function() { CAN.session.settings[sname] = pdata.val;
                if (cb) cb(true); else alert("success!"); });
        }
    };
    var loadRefData = function() {
        var listedrefs = CAN.session.settings.CAN_referenda.concat(CAN.session.settings.user_referenda);
        loadSwapper(REFORDERER, "Referenda", "CAN", "User", "Unlisted");
        for (var i = 0; i < CAN.session.settings.CAN_referenda.length; i++)
            setSwapperItem(CAN.session.settings.CAN_referenda[i], "CAN");
        for (var i = 0; i < CAN.session.settings.user_referenda.length; i++)
            setSwapperItem(CAN.session.settings.user_referenda[i], "User");
        for (var i = 0; i < allreferenda.length; i++) {
            if (listedrefs.indexOf(allreferenda[i].key) == -1)
                setSwapperItem(allreferenda[i].key, "Unlisted");
        }
    };
    loadSettingsPanel = function() {
        if (allcategories == null || allreferenda == null || CAN.session.settings == null)
            return;
        for (var i = 0; i < allcategories.length; i++)
            CT.data.add(allcategories[i]);
        for (var i = 0; i < allreferenda.length; i++)
            CT.data.add(allreferenda[i]);

        // categories
        loadSwapper(CATORDERER, "Categories", "Prime", "Other");
        for (var i = 0; i < CAN.session.settings.prime_categories.length; i++)
            setSwapperItem(CAN.session.settings.prime_categories[i], "Prime");
        for (var i = 0; i < allcategories.length; i++) {
            if (CAN.session.settings.prime_categories.indexOf(allcategories[i].key) == -1)
                setSwapperItem(allcategories[i].key, "Other");
        }
        CT.dom.id("submitcatorder").onclick = function() {
            saveSetting("prime_categories", "Prime");
        };

        // referenda
        loadRefData();
        CT.dom.id("submitreforder").onclick = function() {
            saveSetting("CAN_referenda", "CAN", function(firstworked) {
                saveSetting("user_referenda", "User", function(secondworked) {
                    if (firstworked || secondworked)
                        alert("success!");
                    else
                        alert("but you haven't changed anything!");
                });
            });
        };
    };

    var founderWelcome = function(n) {
        n.appendChild(CT.dom.node("You're a founder. Congratulations! Now that you're here, try out Founder Chat on the Community page!",
            "div", "bottompadded"));
        var mhits = ["videos", "referenda", "news", "events"];
        var iporder = ["address", "users", "votes", "authentications"];
        var statsnode = CT.dom.node("", "div", "bottompadded");
        statsnode.appendChild(CT.dom.node("General Stats", "div",
            "big gray bottommargined bottomline"));
        var medianode = CT.dom.node("", "div", "bottompadded");
        medianode.appendChild(CT.dom.node("Submissions", "div",
            "big gray bottommargined bottomline"));
        var ipnode = CT.dom.node();
        ipnode.appendChild(CT.dom.node("IP Addresses", "div",
            "big gray bottommargined bottomline"));
        CT.net.post("/get", {"gtype": "fstats", "uid": uid},
            "error retrieving stats", function(s) {
                for (var k in s) {
                    if (k == "ips") {
                        ipnode.appendChild(CT.dom.node("Count: " + s.ips.length,
                            "div", "bold bottompadded"));
                        var votes = 0;
                        for (var i = 0; i < s.ips.length; i++) {
                            var n = CT.dom.node("", "div", "bottompadded");
                            for (var k = 0; k < iporder.length; k++) {
                                var io = iporder[k];
                                var ioval = s.ips[i][io];
                                n.appendChild(CT.dom.node("<b>" + io + "</b>: " + ioval));
                                if (io == "votes")
                                    votes += ioval;
                            }
                            ipnode.appendChild(n);
                        }
                        statsnode.appendChild(CT.dom.node("<b>Total Votes</b>: " + votes));
                    }
                    else if (mhits.indexOf(k) != -1)
                        medianode.appendChild(CT.dom.node("<b>" + CT.parse.key2title(k) + "</b>: " + s[k]));
                    else
                        statsnode.appendChild(CT.dom.node("<b>" + CT.parse.key2title(k) + "</b>: " + s[k]));
                }
            });
        n.appendChild(statsnode);
        n.appendChild(medianode);
        n.appendChild(ipnode);
    };

    var welcomeFounderFunction = function(person) {
        return function() {
            if (loaded[person])
                return;
            loaded[person] = true;
            var cname = CT.parse.capitalize(person);
            var fnode = CT.dom.id("sbpanel" + cname);
            fnode.appendChild(CT.dom.node("Hi " + cname + "!",
                "div", "bigger blue bold bottompadded"));
            founderWelcome(fnode);
            resizeThese.push(fnode);
        };
    };

    var mp = ["paul", "mario"];
    for (var i = 0; i < mp.length; i++) {
        var person = mp[i];
        loaders[person] = welcomeFounderFunction(person);
    }

    // media tagging (always load)
    CAN.categories.load(uid, function(data) {
        allcategories = data;
        loadSettingsPanel();
    });

    // newsletter tools
    var loadNewsletterForm = function(pnode) {
        var pref = pnode.id.slice(0,2);

        // form
        if (pref == "gg")
            pnode.appendChild(CT.dom.node("Send a newsletter to CAN's users.",
                "div", "bottompadded"));
        else
            pnode.appendChild(CT.dom.node("Send a newsletter to the group.",
                "div", "bottompadded"));
        var enode = CT.dom.node("", "div", "", pref + "nledit");
        var tnode = CT.dom.node("", "div", "bordered padded round bottommargined");
        tnode.appendChild(CT.dom.node("Title", "div", "big bold blue"));
        tnode.appendChild(CT.dom.field(pref+"nltitle", null, "fullwidth"));
        enode.appendChild(tnode);
        var bnode = CT.dom.node("", "div", "bordered padded round bottommargined");
        bnode.appendChild(CT.dom.node("Body", "div", "big bold blue"));
        bnode.appendChild(CT.dom.node("Feel free to use html. Also, we will replace {firstname} with the user's first name."));
        bnode.appendChild(CT.dom.textArea(pref+"nlbody", null, "fullwidth"));
        enode.appendChild(bnode);
        var buttonnode = CT.dom.node("", "div", null, pref + "nlbuttons");
        var b1 = CT.dom.node("", "div", "bordered padded round bottommargined");
        b1.appendChild(CT.dom.node("Test Email", "div", "big bold blue"));
        b1.appendChild(CT.dom.node("Check this box to send email to yourself only."));
        b1.appendChild(CT.dom.node("", "div", "", pref+"nltest"));
        buttonnode.appendChild(b1);
        buttonnode.appendChild(CT.dom.button("Send", null, null, pref + "nlsend"));
        buttonnode.appendChild(CT.dom.button("Save", null, null, pref + "nlsave"));
        buttonnode.appendChild(CT.dom.button("Save as Template",
            null, null, pref + "nlsaveastemplate"));
        enode.appendChild(buttonnode);
        var tbutts = CT.dom.node("", "div", "hidden", pref + "nltbuttons");
        tbutts.appendChild(CT.dom.button("Save", null, null, pref + "nltsave"));
        tbutts.appendChild(CT.dom.button("Use", null, null, pref + "nltuse"));
        enode.appendChild(tbutts);
        pnode.appendChild(enode);
        pnode.appendChild(CT.dom.node("", "div", "hidden", pref + "nlreview"));

        // side
        var s = CT.dom.id(pref + "panelNewsletterSide");
        s.innerHTML = "";
        var n1 = CT.dom.node("", "div", "padded bordered round bottommargined");
        n1.appendChild(CT.dom.node("Newsletters in Progress",
            "div", "big bold blue bottommargined bottomline"));
        n1.appendChild(CT.dom.node("", "div", "h200 scrolly", pref + "nlinprogress"));
        s.appendChild(n1);
        var n2 = CT.dom.node("", "div",
            "padded bordered round bottommargined hidden");
        n2.appendChild(CT.dom.node("Templates", "div",
            "big bold blue bottommargined bottomline"));
        n2.appendChild(CT.dom.node("", "div", "h200 scrolly", pref + "nltemplates"));
        s.appendChild(n2);
        var n3 = CT.dom.node("", "div",
            "padded bordered round bottommargined hidden");
        n3.appendChild(CT.dom.node("Newsletter Gallery", "div",
            "big bold blue bottommargined bottomline"));
        n3.appendChild(CT.dom.node("", "div", "h200 scrolly", pref + "nlgallery"));
        s.appendChild(n3);
    };
    var loadNewsletterLogic = function(pref, groupkey) {
        var nltitle = CT.dom.id(pref + "nltitle");
        var nlbody = CT.dom.id(pref + "nlbody");
        var nltestnode = CT.dom.id(pref + "nltest");
        nltestnode.appendChild(CT.dom.checkboxAndLabel(pref + "test", true, "test"));
        var nltest = CT.dom.id(pref + "testcheckbox");
        nlbody.onkeyup = function() {
            CT.dom.resizeTextArea(nlbody);
            return true;
        };

        var currentNL = null;
        var nltemplates = CT.dom.id(pref + "nltemplates");
        var nlinprogress = CT.dom.id(pref + "nlinprogress");
        var nlgallery = CT.dom.id(pref + "nlgallery");
        var newsletterbuttons = CT.dom.id(pref + "nlbuttons");
        var templatebuttons = CT.dom.id(pref + "nltbuttons");
        var editpanel = CT.dom.id(pref + "nledit");
        var reviewpanel = CT.dom.id(pref + "nlreview");
        var adjustNLDisplay = function(d) {
            if (d.sent) {
                editpanel.style.display = "none";
                reviewpanel.style.display = "block";
            }
            else {
                editpanel.style.display = "block";
                reviewpanel.style.display = "none";
            }
            if (d.template) {
                newsletterbuttons.style.display = "none";
                templatebuttons.style.display = "block";
            }
            else {
                newsletterbuttons.style.display = "block";
                templatebuttons.style.display = "none";
            }
        };
        var showNewsletter = function(d) {
            adjustNLDisplay(d);
            if (d.sent) {
                reviewpanel.innerHTML = "";
                reviewpanel.appendChild(CT.dom.node(d.title, "div", "big bold"));
                reviewpanel.appendChild(CT.dom.node(d.body));
            }
            else {
                nltitle.value = d.title;
                nlbody.value = d.body;
                nltest.checked = true;
            }
            CT.panel.selectLister(d.key, currentNL && currentNL.key || null);
            currentNL = d;
        };

        var newsletterHasChanged = function() {
            if (currentNL == null)
                return false;
            return currentNL.title != nltitle.value || currentNL.body != nlbody.value;
        };

        var newsletterWhichNode = function(d) {
            if (d) {
                if (d.template)
                    return nltemplates;
                if (d.sent)
                    return nlgallery;
            }
            return nlinprogress; // default
        };

        var newsletterIsReady = function() {
            if (nltitle.value == "")
                alert("title?");
            else if (nlbody.value == "")
                alert("body?");
            else
                return true;
            return false;
        };

        CT.dom.id(pref + "nlsend").onclick = function() {
            if (! newsletterIsReady())
                return;
            var pdata = {"key": currentNL.key,
                "title": nltitle.value,
                "body": nlbody.value,
                "send": true,
                "test": nltest.checked,
                "template": false};
            if (pdata.key == "newsletter" && groupkey)
                pdata.group = groupkey;
            CT.net.post("/edit", {"eid": uid, "data": pdata},
                "error submitting newsletter", function(key) {
                    if (currentNL.is_new) {
                        currentNL = {"key": key, "title": pdata.title,
                            "body": pdata.body};
                        if (nltest.checked) {
                            CAN.media.loader.newLister(currentNL, nlinprogress, "newsletter",
                                showNewsletter, newsletterHasChanged);
                        }
                        else {
                            currentNL.sent = true;
                            CAN.media.loader.newLister(currentNL, nlgallery, "newsletter",
                                showNewsletter, newsletterHasChanged);
                            nlgallery.parentNode.style.display = "block";
                        }
                    }
                    else {
                        currentNL.title = pdata.title;
                        currentNL.body = pdata.body;
                        if (! nltest.checked) {
                            // remove old listing
                            var oldnode = CT.dom.id("ll"+key).parentNode;
                            oldnode.parentNode.removeChild(oldnode);
                            // new gallery listing
                            CAN.media.loader.newLister(currentNL, nlgallery, "newsletter",
                                showNewsletter, newsletterHasChanged);
                            nlgallery.parentNode.style.display = "block";
                            showNewsletter(currentNL);
                        }
                    }
                    CT.data.add(currentNL);
                    alert("success!");
                });
        };

        CT.dom.id(pref + "nlsave").onclick = function() {
            if (! newsletterIsReady())
                return;
            var pdata = {"key": currentNL.key,
                "title": nltitle.value,
                "body": nlbody.value,
                "send": false,
                "test": false,
                "template": false};
            if (pdata.key == "newsletter" && groupkey)
                pdata.group = groupkey;
            CT.net.post("/edit", {"eid": uid, "data": pdata},
                "error submitting newsletter", function(key) {
                    if (currentNL.is_new) {
                        currentNL = {"key": key, "title": pdata.title,
                            "body": pdata.body};
                        CAN.media.loader.newLister(currentNL, nlinprogress, "newsletter",
                            showNewsletter, newsletterHasChanged);
                    }
                    else {
                        if (currentNL.title != pdata.title)
                            CT.dom.id("ll"+key).firstChild.innerHTML = pdata.title;
                        currentNL.title = pdata.title;
                        currentNL.body = pdata.body;
                    }
                    CT.data.add(currentNL);
                    alert("success!");
                });
        };

        CT.dom.id(pref + "nlsaveastemplate").onclick = function() {
            if (! newsletterIsReady())
                return;
            var pdata = {"key": "newsletter", // template is new
                "title": nltitle.value,
                "body": nlbody.value,
                "send": false,
                "test": false,
                "template": true};
            if (pdata.key == "newsletter" && groupkey)
                pdata.group = groupkey;
            CT.net.post("/edit", {"eid": uid, "data": pdata},
                "error submitting newsletter", function(key) {
                    var oldkey = currentNL.key;
                    currentNL = {"key": key, "title": pdata.title,
                        "body": pdata.body, "template": true};
                    CT.data.add(currentNL);
                    CAN.media.loader.newLister(currentNL, nltemplates, "newsletter",
                        showNewsletter, newsletterHasChanged, oldkey);
                    nltemplates.parentNode.style.display = "block";
                    showNewsletter(currentNL);
                    alert("success!");
                }); 
        };

        CT.dom.id(pref + "nltsave").onclick = function() {
            if (! newsletterIsReady())
                return;
            var pdata = {"key": currentNL.key,
                "title": nltitle.value,
                "body": nlbody.value};
            if (pdata.key == "newsletter" && groupkey)
                pdata.group = groupkey;
            CT.net.post("/edit", {"eid": uid, "data": pdata},
                "error submitting newsletter", function(key) {
                    if (currentNL.title != pdata.title)
                        CT.dom.id("ll"+key).firstChild.innerHTML = pdata.title;
                    currentNL.title = pdata.title;
                    currentNL.body = pdata.body;
                    CT.data.add(currentNL);
                    alert("success!");
                }); 
        };

        CT.dom.id(pref + "nltuse").onclick = function() {
            CT.dom.id("ll" + currentNL.key).className = "";
            currentNL = {"key": "newsletter", "is_new": true,
                "title": nltitle.value, "body": nlbody.value};
            showNewsletter(currentNL);
        };

        CAN.media.loader.list(uid, "newsletter", newsletterWhichNode(),
            showNewsletter, newsletterHasChanged,
            {"title": "", "body": ""}, newsletterWhichNode, function() {
                if (nltemplates.innerHTML != "")
                    nltemplates.parentNode.style.display = "block";
                if (nlgallery.innerHTML != "")
                    nlgallery.parentNode.style.display = "block";
            }, groupkey && {"nlgroup": groupkey} || null);
    };

    // greg panel
    loaders["greg"] = function() {
        if (loaded["greg"])
            return;
        loaded["greg"] = true;

        founderWelcome(CT.dom.id("ggpanelWelcome"));
        CT.panel.load(["Welcome", "Settings", "Newsletter", "Keyword System", "Referenda", "Categories", "Events", "Media"], true, "gg");

        // settings
        var loadGregSettings = function() {
            if (CAN.session.settings == null)
                return setTimeout(loadGregSettings, 500);
            var gps = CT.dom.id("ggpanelSettings");
            gps.appendChild(CT.dom.checkboxAndLabel("authenticate_phone",
                CAN.session.settings.authenticate_phone, "Authenticate Phone"));
            gps.appendChild(CT.dom.checkboxAndLabel("password_to_edit_profile",
                CAN.session.settings.password_to_edit_profile,
                "Require Password to Edit User Profile"));
            gps.appendChild(CT.dom.checkboxAndLabel("email_founders_on_comment",
                CAN.session.settings.email_founders_on_comment,
                "Email Founders When People Comment"));
            var bnode = CT.dom.node();
            bnode.appendChild(CT.dom.node(CT.dom.labelAndField("Beta Password",
                "beta_password", "w300", null, CAN.session.settings.beta_password),
                "div", "bigtabbed w400"));
            bnode.appendChild(CT.dom.node(CT.dom.labelAndField("Beta Message",
                "beta_message", "w300", null, CAN.session.settings.beta_message,
                true, true), "div", "bigtabbed w400"));
            gps.appendChild(CT.dom.checkboxAndLabel("closed_beta",
                CAN.session.settings.closed_beta, "Closed Beta",
                null, null, function(cb) {
                    if (cb.checked)
                        bnode.style.display = "block";
                    else
                        bnode.style.display = "none";
                }));
            if (!CAN.session.settings.closed_beta)
                bnode.style.display = "none";
            gps.appendChild(bnode);
            gps.appendChild(CT.dom.node(CT.dom.button("Submit", function() {
                var ap = CT.dom.id("authenticate_phonecheckbox");
                var pp = CT.dom.id("password_to_edit_profilecheckbox");
                var ef = CT.dom.id("email_founders_on_comment");
                var cb = CT.dom.id("closed_betacheckbox");
                var bp = CT.dom.id("beta_password");
                var bm = CT.dom.id("beta_message");
                if (ap.checked == CAN.session.settings.authenticate_phone && pp.checked == CAN.session.settings.password_to_edit_profile && ef.checked == CAN.session.settings.email_founders_on_comment && cb.checked == CAN.session.settings.closed_beta && bp.value == CAN.session.settings.beta_password && bm.value == CAN.session.settings.beta_message)
                    return alert("no changes!");
                var pdata = {"key": "settings"};
                if (ap.checked != CAN.session.settings.authenticate_phone)
                    pdata.authenticate_phone = ap.checked;
                if (pp.checked != CAN.session.settings.password_to_edit_profile)
                    pdata.password_to_edit_profile = pp.checked;
                if (ef.checked != CAN.session.settings.email_founders_on_comment)
                    pdata.email_founders_on_comment = ef.checked;
                if (cb.checked != CAN.session.settings.closed_beta)
                    pdata.closed_beta = cb.checked;
                if (bp.value != CAN.session.settings.beta_password)
                    pdata.beta_password = bp.value;
                if (bm.value != CAN.session.settings.beta_message)
                    pdata.beta_message = bm.value;
                CT.net.post("/edit", {"eid": uid, "data": pdata},
                    "error changing settings", function() {
                        settings.authenticate_phone = ap.checked;
                        settings.password_to_edit_profile = pp.checked;
                        settings.email_founders_on_comment = ef.checked;
                        settings.closed_beta = cb.checked;
                        settings.beta_password = bp.value;
                        settings.beta_message = bm.value;
                        alert("success!");
                    });
            }), "div", "topmargined"));
        };
        loadGregSettings();

        // newsletter sender
        loadNewsletterForm(CT.dom.id("ggpanelNewsletter"));
        loadNewsletterLogic("gg");

        // keyword system
        var kwsiderules = CT.dom.id("ggkwsiderules");
        var kwsidefeatured = CT.dom.id("ggkwsidefeatured");
        var kwmainrules = CT.dom.id("ggkwmainrules");
        var kwmainfeatured = CT.dom.id("ggkwmainfeatured");
        var vfr = CT.dom.link("view Featured Results", function() {
            kwsiderules.style.display = kwmainrules.style.display = "none";
            kwsidefeatured.style.display = kwmainfeatured.style.display = "block";
        });
        CT.dom.id("ggkwswaprules").appendChild(vfr);
        CT.dom.id("ggkwswapfeatured").appendChild(CT.dom.link("view Search Rules", function() {
            kwsidefeatured.style.display = kwmainfeatured.style.display = "none";
            kwsiderules.style.display = kwmainrules.style.display = "block";
        }));

        var ks = {"rules": {"v": {}, "n": {}}, "featured": {"v": {}, "n": {}}};
        ks.rules.current = ks.featured.current = null;
        ks.rules.n.name = CT.dom.id("ggkwrulesname");
        ks.rules.n.type = CT.dom.select(["Select Type", "eco", "liberty"]);
        CT.dom.id("ggkwrulestype").appendChild(ks.rules.n.type);
        ks.rules.n.keyword = CT.dom.id("ggkwruleskeyword");
        ks.rules.n.insert = CT.dom.id("ggkwrulesinsert");
        ks.rules.n.featured = CT.dom.id("ggkwrulesfeatured");
        ks.featured.n.title = CT.dom.id("ggkwfeaturedtitle");
        ks.featured.n.blurb = CT.dom.id("ggkwfeaturedblurb");
        ks.featured.n.link = CT.dom.id("ggkwfeaturedlink");
        ks.rules.v.node = CT.dom.id("ggsearchrules");
        ks.featured.v.node = CT.dom.id("ggfeaturedresults");
        ks.rules.v.mtype = "rules";
        var afbox = CT.dom.node("", "div", "hidden adminpopup fullheight");
        afbox.appendChild(CT.dom.node(CT.dom.link("X", function() {
            CT.dom.showHide(afbox); }), "div", "right"));
        CT.dom.id("addfeaturedbutton").onclick = function() {
            CT.dom.showHide(afbox);
        };
        var allfeats = CT.dom.node();
        afbox.appendChild(allfeats);
        document.body.appendChild(afbox);
        var featuredItem = function(key, isadd) {
            var d = CT.data.get(key);
            var n = CT.dom.node("", "div", "", (isadd && "all" || "") + "feat" + key);
            n.appendChild(CT.dom.node(d.title, "b"));
            n.appendChild(CT.dom.node(" (", "span"));
            n.appendChild(CT.dom.link("view", function() {
                if (ks.rules.v.hasChanged() && ! confirm("You have unsaved changes! You will lose them if you inspect this featured result! Continue?"))
                    return;
                vfr.onclick();
                ks.featured.v.showMedia(d);
                if (isadd)
                    CT.dom.showHide(afbox);
            }));
            n.appendChild(CT.dom.node(" | ", "span"));
            if (isadd) {
                n.appendChild(CT.dom.link("add", function() {
                    ks.rules.n.featured.appendChild(featuredItem(key));
                    n.style.display = "none";
                }));
            }
            else {
                n.appendChild(CT.dom.link("remove", function() {
                    n.parentNode.removeChild(n);
                }));
            }
            n.appendChild(CT.dom.node(")", "span"));
            return n;
        };
        var featuredItems = function() {
            var fnode = ks.rules.n.featured;
            var newfeat = [];
            for (var i = 0; i < fnode.childNodes.length; i++)
                newfeat.push(fnode.childNodes[i].id.slice(4));
            return newfeat;
        };
        var featuredDiff = function() {
            return ! CT.data.sameList(featuredItems(),
                ks.rules.current.featured);
        };
        ks.rules.v.showMedia = function(d) {
            var n = ks.rules.n;
            n.name.value = d.name;
            n.type.value = d.type;
            n.keyword.value = d.keyword.join(", ");
            n.insert.value = d.insert.join(", ");
            n.featured.innerHTML = "";
            for (var i = 0; i < d.featured.length; i++)
                n.featured.appendChild(featuredItem(d.featured[i]));
            CT.panel.selectLister(d.key, ks.rules.current && ks.rules.current.key || null);
            ks.rules.current = d;
        };
        ks.rules.v.hasChanged = function() {
            var curdata = ks.rules.current;
            if (curdata == null)
                return false;
            var newdata = ks.rules.n;
            return curdata.name != newdata.name.value || curdata.type != newdata.type.value || curdata.keyword.join(", ") != newdata.keyword.value || curdata.insert.join(", ") != newdata.insert.value || featuredDiff();
        };
        ks.rules.v.blankData = {
            "name": "",
            "type": "Select Type",
            "keyword": [],
            "insert": [],
            "featured": []
        };
        ks.featured.v.mtype = "featured";
        ks.featured.v.showMedia = function(d) {
            var n = ks.featured.n;
            n.title.value = d.title;
            n.blurb.value = d.blurb;
            n.link.value = d.link;

            CT.panel.selectLister(d.key, ks.featured.current && ks.featured.current.key || null);
            ks.featured.current = d;
        };
        ks.featured.v.hasChanged = function() {
            var curdata = ks.featured.current;
            if (curdata == null)
                return false;
            var newdata = ks.featured.n;
            return curdata.title != newdata.title.value || curdata.blurb != newdata.blurb.value || curdata.link != newdata.link.value;
        };
        ks.featured.v.blankData = {
            "title": "",
            "blurb": "",
            "link": ""
        };
        var keywordLoadAll = function(kwtype) {
            CT.net.post("/get", {"gtype": "search", "stype": kwtype},
                "error loading search rules", function(rawdata) {
                    var isfeatured = kwtype == "featured";
                    for (var i = 0; i < rawdata.length; i++) {
                        var d = rawdata[i];
                        CT.data.add(d);
                        ks[kwtype].v.node.appendChild(CAN.media.loader.listOne(d, null, ks[kwtype].v));
                        if (isfeatured)
                            allfeats.appendChild(featuredItem(d.key, true));
                    }
                });
            CT.dom.id("delete" + kwtype + "button").onclick = function() {
                var c = ks[kwtype].current;
                if (c == null || c.key == kwtype)
                    return alert("can't delete unsaved " + kwtype);
                if (confirm("Are you sure you want to delete this?")) {
                    CT.net.post("/edit", {"eid": uid, "data": {"key": c.key, "delete": 1}},
                        "error deleting "+kwtype, function() {
                            var rlister = CT.dom.id("ll" + c.key);
                            rlister.parentNode.removeChild(rlister);
                            ks[kwtype].current = null;
                            ks[kwtype].v.showMedia(ks[kwtype].v.blankData);
                        });
                }
            };
        };
        for (var kwtype in ks)
            keywordLoadAll(kwtype);

        CT.dom.id("ggkwrulessubmit").onclick = function() {
            if (!ks.rules.v.hasChanged())
                return alert("No changes made!");
            var n = ks.rules.n;
            if (n.name.value == "")
                return alert("name?");
            if (n.type.value == "Select Type")
                return alert("type?");
            if (n.keyword.value == "")
                return alert("keyword?");
            if (n.insert.value == "")
                return alert("insert?");
            if (n.featured.innerHTML == "")
                return alert("featured?");
            var pdata = {"key": ks.rules.current.key, "name": n.name.value,
                "type": n.type.value, "keyword": n.keyword.value.split(", "),
                "insert": n.insert.value.split(", "), "featured": featuredItems()};
            CT.net.post("/edit", {"eid": uid, "data": pdata},
                "error uploading rules", function(rawdata) {
                    CT.data.add(rawdata);
                    if (ks.rules.current.is_new) {
                        ks.rules.current = rawdata;
                        CAN.media.loader.newLister(ks.rules.current, ks.rules.v.node,
                            "rules", ks.rules.v.showMedia, ks.rules.v.hasChanged);
                    }
                    else {
                        ks.rules.current.name = rawdata.name;
                        ks.rules.current.type = rawdata.type;
                        ks.rules.current.keyword = rawdata.keyword;
                        ks.rules.current.insert = rawdata.insert;
                        ks.rules.current.featured = rawdata.featured;
                    }
                    alert("success!");
                });
        };
        CT.dom.id("ggkwfeaturedsubmit").onclick = function() {
            if (!ks.featured.v.hasChanged())
                return alert("No changes made!");
            var n = ks.featured.n;
            if (n.title.value == "")
                return alert("title?");
            if (n.blurb.value == "")
                return alert("blurb?");
            if (n.link.value == "")
                return alert("link?");
            var pdata = {"key": ks.featured.current.key, "title": n.title.value,
                "blurb": n.blurb.value, "link": n.link.value};
            CT.net.post("/edit", {"eid": uid, "data": pdata},
                "error uploading featured item", function(rawdata) {
                    CT.data.add(rawdata);
                    if (ks.featured.current.is_new) {
                        ks.featured.current = rawdata;
                        CAN.media.loader.newLister(ks.featured.current, ks.featured.v.node,
                            "featured", ks.featured.v.showMedia, ks.featured.v.hasChanged);
                        allfeats.appendChild(featuredItem(rawdata.key, true));
                    }
                    else {
                        if (ks.featured.current.title != rawdata.title)
                            CT.dom.id("allfeat"+rawdata.key).firstChild.innerHTML = rawdata.title;
                        ks.featured.current.title = rawdata.title;
                        ks.featured.current.blurb = rawdata.blurb;
                        ks.featured.current.link = rawdata.link;
                    }
                    alert("success!");
                });
        };

        // media deletion
        CT.panel.load(["Change Idea", "Position Paper",
            "News", "Photo", "Video", "Text"], true, "ggma");

        var cwcontent = CT.dom.id("ggmacontentChangeIdea");
        var changeIdeaNewMediaGGCB = function(d) {
            return CT.dom.node(CT.dom.node(d.idea), "div", "bordered padded round bottommargined");
        };
        CAN.media.loader.load({"mtype": "changeidea", "layout": "fluid", "number": 8,
            "node": cwcontent, "buttonCbDefault": {"name": "remove"}, "hidden_uid": uid,
            "newMedia": changeIdeaNewMediaGGCB, "paging": "bidirectional",
            "eb": function(e) { cwcontent.appendChild(CT.dom.node(e)); }});

        var ppcontent = CT.dom.id("ggmacontentPositionPaper");
        CAN.media.loader.load({"mtype": "paper", "layout": "fluid", "number": 4,
            "node": ppcontent, "buttonCbDefault": {"name": "remove"},
            "hidden_uid": uid, "paging": "bidirectional", "eb": function(e) {
                ppcontent.appendChild(CT.dom.node(e)); }});

        CT.dom.id("ggmapanelText").appendChild(CT.dom.node("",
            "div", "", "ggmatxtpanels"));

        CT.panel.load(["Quote", "Book Recommendation", "Sustainable Action"],
            true, "ggmatxt");

        var ggtxtquote = CT.dom.node();
        CT.dom.id("ggmatxtpanelQuote").appendChild(ggtxtquote);
        CAN.media.loader.load({"mtype": "quote", "layout": "fluid", "number": 12,
            "node": ggtxtquote, "newMediaDefault": "quote", "uid": uid,
            "buttonCbDefault": {"name": "remove"}, "paging": "bidirectional",
            "approved": true, "eb": function(e) {
                ggtxtquote.appendChild(CT.dom.node(e)); }});

        var ggtxtbook = CT.dom.node();
        CT.dom.id("ggmatxtpanelBookRecommendation").appendChild(ggtxtbook);

        CAN.media.loader.load({"mtype": "book", "layout": "fluid", "number": 12,
            "node": ggtxtbook, "newMediaDefault": "book", "uid": uid,
            "buttonCbDefault": {"name": "remove"}, "paging": "bidirectional",
            "approved": true, "eb": function(e) {
                ggtxtbook.appendChild(CT.dom.node(e)); }});

        var ggtxtsusact = CT.dom.node();
        CT.dom.id("ggmatxtpanelSustainableAction").appendChild(ggtxtsusact);

        CAN.media.loader.load({"mtype": "sustainableaction", "layout": "fluid", "number": 12,
            "node": ggtxtsusact, "newMediaDefault": "sustainableaction",
            "buttonCbDefault": {"name": "remove"}, "paging": "bidirectional",
            "approved": true, "uid": uid, "eb": function(e) {
                ggtxtsusact.appendChild(CT.dom.node(e)); }});

        var ggmpnode = CT.dom.node("", "div", "thumb");
        CT.dom.id("ggmapanelPhoto").appendChild(ggmpnode);

        CAN.media.loader.load({"mtype": "photo", "layout": "tiled", "number": 12,
            "node": ggmpnode, "newMediaDefault": "photoscale", "width": 2,
            "buttonCbDefault": {"name": "remove"}, "paging": "bidirectional",
            "approved": true, "uid": uid, "eb": function(e) {
                ggmpnode.appendChild(CT.dom.node(e)); }});

        var ggmvnode = CT.dom.node("", "div", "vthumb shiftleft5");
        CT.dom.id("ggmapanelVideo").appendChild(ggmvnode);

        CAN.media.loader.load({"mtype": "video", "layout": "tiled", "number": 12,
            "node": ggmvnode, "newMediaDefault": "videothumbnaked", "width": 3,
            "buttonCbDefault": {"name": "remove"}, "paging": "bidirectional",
            "approved": true, "uid": uid, "eb": function(e) {
                ggmvnode.appendChild(CT.dom.node(e)); }});

        var ggmnewsfull = CT.dom.node("", "div", "hidden adminpopup");
        var ggmnnode = CT.dom.node("", "div", "thumb");
        CT.dom.id("ggmapanelNews").appendChild(ggmnewsfull);
        CT.dom.id("ggmapanelNews").appendChild(ggmnnode);
        CT.align.centered(ggmnewsfull);

        CAN.media.loader.load({"mtype": "news", "layout": "fluid", "number": 12,
            "node": ggmnnode, "newMediaDefault": "newsteaser",
            "buttonCbDefault": {"name": "remove"}, "paging": "bidirectional",
            "newMediaChecks": {"justFirst": ["photo"]}, "approved": true,
            "uid": uid, "newMediaViewMoreCb": function(d) {
                ggmnewsfull.innerHTML = "";
                ggmnewsfull.appendChild(CAN.media.news.build(d, null, "full", true));
                ggmnewsfull.appendChild(CT.dom.button("Close", function() {
                    ggmnewsfull.style.display = "none"; }));
                ggmnewsfull.style.display = "block";
            }, "eb": function(e) { ggmnnode.appendChild(CT.dom.node(e)); }});

        // event deletion
        var loadEventDeletion = function() {
            if (!ALLUSERSLOADED)
                return setTimeout(loadEventDeletion, 200);
            var ggevents = CT.dom.id("ggevents");
            CAN.media.loader.load({"mtype": "event", "layout": "fluid", "number": 12,
                "node": ggevents, "buttonCbDefault": {"name": "remove"},
                "paging": "bidirectional",
                "uid": uid, "approved": true, "noconvo": 1,
                "newMediaDefault": "eventdelete", "mkey": "eventdelete",
                "eb": function(e) { ggevents.appendChild(CT.dom.node(e)); }});
        };
        loadEventDeletion();

        // refs, cats
        CT.net.post("/get", {"gtype": "media", "mtype": "referenda",
            "uid": "nouid", "noblurb": 1, "number": 1000, "allrefs": 1},
            "error retrieving all refs", function(data) {
                allreferenda = data; loadSettingsPanel(); });
    };

    // approver panel
    loaders["approver"] = function() {
        if (loaded["approver"])
            return;
        loaded["approver"] = true;

        resizeThese.push(CT.dom.id("sbpanelApprover"));

        var sbplist = ["Events", "Media"];
        var user = CT.data.get(uid);
        if (user.role.indexOf("greg") != -1)
            sbplist = ["Referenda"].concat(sbplist);
        CT.panel.load(sbplist, true, "ap");

        if (user.role.indexOf("greg") != -1) {
            // referendum approval
            var aprefs = CT.dom.id("apreferenda");
            CAN.media.loader.load({"mtype": "referenda", "layout": "fluid", "number": 12,
                "node": aprefs, "buttonCbDefault": {"name": "approve"},
                "critiqued": false, "withsummary": 1, "noblurb": 1,
                "mkey": "refapprove", "newMediaDefault": "refapprove",
                "eb": function(e) { aprefs.appendChild(CT.dom.node(e)); },
                "uid": uid, "approved": false, "approveCb": function(key) {
                    CAN.session.settings.user_referenda.push(key);
                    loadRefData();
                }});
        }

        // event approval
        var apevents = CT.dom.id("apevents");
        CAN.media.loader.load({"mtype": "event", "layout": "fluid", "number": 12,
            "node": apevents, "buttonCbDefault": {"name": "approve"},
            "newMediaChecks": {"single": ["user"]}, "noconvo": 1,
            "mkey": "eventapprove", "newMediaDefault": "eventapprove",
            "uid": uid, "approved": false, "eb": function(e) {
                apevents.appendChild(CT.dom.node(e)); }});

        // media approval: news, photo, video, text
        CT.panel.load(["News", "Photo", "Video", "Text"], true, "apma");

        CT.dom.id("apmapanelText").appendChild(CT.dom.node("",
            "div", "", "apmatxtpanels"));

        // text approval
        CT.panel.load(["Quote", "Book Recommendation", "Sustainable Action"],
            true, "apmatxt");

        var aptxtquote = CT.dom.node();
        CT.dom.id("apmatxtpanelQuote").appendChild(aptxtquote);

        CAN.media.loader.load({"mtype": "quote", "layout": "fluid", "number": 12,
            "node": aptxtquote, "newMediaDefault": "quote",
            "buttonCbDefault": {"name": "approve"}, "uid": uid,
            "approved": false, "eb": function(e) {
                aptxtquote.appendChild(CT.dom.node(e)); }});

        var aptxtbook = CT.dom.node();
        CT.dom.id("apmatxtpanelBookRecommendation").appendChild(aptxtbook);

        CAN.media.loader.load({"mtype": "book", "layout": "fluid", "number": 12,
            "node": aptxtbook, "newMediaDefault": "book",
            "buttonCbDefault": {"name": "approve"}, "uid": uid,
            "approved": false, "eb": function(e) {
                aptxtbook.appendChild(CT.dom.node(e)); }});

        var aptxtsusact = CT.dom.node();
        CT.dom.id("apmatxtpanelSustainableAction").appendChild(aptxtsusact);

        CAN.media.loader.load({"mtype": "sustainableaction", "layout": "fluid", "number": 12,
            "node": aptxtsusact, "newMediaDefault": "sustainableaction",
            "buttonCbDefault": {"name": "approve"}, "uid": uid,
            "approved": false, "eb": function(e) {
                aptxtsusact.appendChild(CT.dom.node(e)); }});

        var apmpnode = CT.dom.node("", "div", "thumb");
        CT.dom.id("apmapanelPhoto").appendChild(apmpnode);

        CAN.media.loader.load({"mtype": "photo", "layout": "tiled", "number": 12,
            "node": apmpnode, "newMediaDefault": "photoscale", "width": 2,
            "buttonCbDefault": {"name": "approve"}, "uid": uid,
            "approved": false, "eb": function(e) {
                apmpnode.appendChild(CT.dom.node(e)); }});

        var apmvnode = CT.dom.node("", "div", "vthumb shiftleft10");
        CT.dom.id("apmapanelVideo").appendChild(apmvnode);

        CAN.media.loader.load({"mtype": "video", "layout": "tiled", "number": 12,
            "node": apmvnode, "newMediaDefault": "videothumbnaked",
            "width": 3, "buttonCbDefault": {"name": "approve"},
            "uid": uid, "approved": false, "eb": function(e) {
                apmvnode.appendChild(CT.dom.node(e)); }});

        var apmnewsfull = CT.dom.node("", "div", "hidden adminpopup");
        var apmnnode = CT.dom.node("", "div", "thumb");
        CT.dom.id("apmapanelNews").appendChild(apmnewsfull);
        CT.dom.id("apmapanelNews").appendChild(apmnnode);
        CT.align.centered(apmnewsfull);

        CAN.media.loader.load({"mtype": "news", "layout": "fluid", "number": 12,
            "node": apmnnode, "newMediaDefault": "newsteaser",
            "buttonCbDefault": {"name": "approve"}, "uid": uid,
            "newMediaChecks": {"justFirst": ["photo"]}, "approved": false,
            "newMediaViewMoreCb": function(d) {
                apmnewsfull.innerHTML = "";
                apmnewsfull.appendChild(CAN.media.news.build(d, null, "full", true));
                apmnewsfull.appendChild(CT.dom.button("Close", function() {
                    apmnewsfull.style.display = "none"; }));
                apmnewsfull.style.display = "block";
            }, "eb": function(e) { apmnnode.appendChild(CT.dom.node(e)); }});
    };

    // coordinator panel
    loaders["coordinator"] = function() {
        if (loaded["coordinator"])
            return;
        loaded["coordinator"] = true;

        var currentEvent = null;
        var e = {};
        e.title = CT.dom.id("cooeventtitle");
        e.description = CT.dom.id("cooeventdescription");

        CT.rte.wysiwygize("cooeventdescription");

        // where stuff
        e.wherename = CT.dom.id("cooeventwherename");
        e.whereaddress = CT.dom.id("cooeventwhereaddress");
        e.wherezip = CT.dom.id("cooeventwherezip");

        var etaskbox = CT.dom.id("cooeventtasks");
        var ecritique = CT.dom.id("eventcritique");

        // load 'when' selection stuff
        CT.dom.dateSelectors(CT.dom.id("cooeventwhen"),
            e, null, CT.dom.currentyear + 3, true);

        // load task stuff
        var tnum = 0;
        var tbox = CT.dom.node();
        etaskbox.appendChild(tbox);
        var addTask = function(d) {
            if (!d || !d.title)
                d = {"title": "", "description": ""};
            var n = CT.dom.node("", "div",
                "bordered padded round bottommargined");
            var tn = CT.dom.node();
            tn.appendChild(CT.dom.node("Title", "div",
                "bold blue"));
            tn.appendChild(CT.dom.field("task" + tnum + "title", d.title, "fullwidth"));
            var dn = CT.dom.node();
            dn.appendChild(CT.dom.node("Description", "div",
                "bold blue topmargined"));
            dn.appendChild(CT.dom.textArea("task" + tnum + "description",
                d.description, "fullwidth height200"));
            var kn = CT.dom.field("task" + tnum + "key", d.key || "task", null, "hidden");
            n.appendChild(tn);
            n.appendChild(dn);
            n.appendChild(kn);
            n.appendChild(CT.dom.button("Remove Task", function() {
                if (d.key) {
                    kn.value = "delete" + d.key;
                    n.style.display = "none";
                }
                else
                    tbox.removeChild(n);
            }));
            tbox.appendChild(n);
            tnum += 1;
        };
        etaskbox.appendChild(CT.dom.button("Add Task", addTask));

        // load task suggestions
        var evt = {"standard": CT.dom.id("evstandardtasks"),
            "supplemental": CT.dom.id("evsupplementaltasks")};
        var sttasks = [
            {"title": "Nourishment", "description": "Liquids and solids. Everyone needs them. Someone needs to bring them."},
            {"title": "Communications", "description": "Help keep everyone in the loop. Be a point of contact for the movement."}
        ];
        var sutasks = [
            {"title": "Music", "description": "Psych people up! Sing it how you see it! Music makes people happy, and happy people are more sympathetic and inclined to open communication. And music draws a crowd."},
            {"title": "Signage", "description": "Can't protest without em."},
            {"title": "Speeches", "description": "Sign up to get your perspective out there."},
            {"title": "Blankets", "description": "Help the people around you stay warm."},
            {"title": "Sanitation", "description": "We're trying to make a statement, not a mess."},
            {"title": "First Aid", "description": "Various municipalities require a doctor to be present at any sufficiently large gathering. Set up stations. Coordinate with other experts and professionals. Heal."},
            {"title": "Documentation", "description": "We are the media. Show the world what's going down."},
            {"title": "Legal Support", "description": "Protect your fellow human beings. Confront police brutality head-on. Use big words."}
        ];
        var loadTaskSuggestion = function(d, dtype) {
            var n = CT.dom.node("", "div", "topmargined");
            n.appendChild(CT.dom.node(d.title, "div", "bold"));
            n.appendChild(CT.dom.node(d.description));
            n.appendChild(CT.dom.button("Add Task", function() {
                addTask(d);
            }));
            evt[dtype].appendChild(n);
        };
        for (var i = 0; i < sttasks.length; i++)
            loadTaskSuggestion(sttasks[i], "standard");
        for (var i = 0; i < sutasks.length; i++)
            loadTaskSuggestion(sutasks[i], "supplemental");

        var getTask = function(i, pdata) {
            var t = CT.dom.id("task" + i + "title");
            if (!t) return true; // task removed by user
            var d = CT.dom.id("task" + i + "description");
            if (!t.value) {
                alert("task title?");
                return false;
            }
            if (!d.value) {
                alert("task description?");
                return false;
            }
            pdata.tasks.push({"title": t.value, "description": d.value,
                "key": CT.dom.id("task"+i+"key").value});
            return true;
        };

        var getTasks = function(pdata) {
            for (var i = 0; i < tnum; i++) {
                if (!getTask(i, pdata)) return false;
            }
            return true;
        };

        var tasksHaveChanged = function() {
            var curtasks = {"tasks": []};
            if (!getTasks(curtasks)) return true;
            if (currentEvent.tasks.length != curtasks.tasks.length)
                return true;
            for (var i = 0; i < currentEvent.tasks.length; i++) {
                var c1 = currentEvent.tasks[i];
                var c2 = curtasks.tasks[i];
                if (c1.title != c2.title || c1.description != c2.description)
                    return true;
            }
            return false;
        };

        var eventHasChanged = function() {
            if (currentEvent == null)
                return false;
            return currentEvent.title != e.title.value || currentEvent.description != e.description.get() || currentEvent.where.name != e.wherename.value || currentEvent.where.address != e.whereaddress.value || currentEvent.where.zipcode.code != e.wherezip.value || currentEvent.when.year != e.year.value || _pad(currentEvent.when.month) != e.month.value || _pad(currentEvent.when.day) != e.day.value || _tpad(currentEvent.when.time) != e.time.value || tasksHaveChanged();
        };

        var _pad = function(n) {
            if (n < 10)
                return "0" + n;
            return n.toString();
        };
        var _tpad = function(t) {
            if (t.charAt(1) == ":")
                return "0" + t;
            return t;
        };
        var submitevent = null; // for compiler
        var showEvent = function(d) {
            CAN.media.moderation.listCritiques(d, ecritique, "event");

            e.title.value = d.title;
            e.wherename.value = d.where.name;
            e.whereaddress.value = d.where.address;
            e.wherezip.value = d.where.zipcode.code;
            e.year.value = d.when.year;
            e.month.value = _pad(d.when.month);
            e.day.value = _pad(d.when.day);
            e.time.value = _tpad(d.when.time);

            tnum = 0;
            tbox.innerHTML = "";
            for (var i = 0; i < d.tasks.length; i++)
                addTask(d.tasks[i]);

            CT.panel.selectLister(d.key, currentEvent && currentEvent.key || null);
            currentEvent = d;
            e.description.set(d.description, submitevent);
        };

        var events = CT.dom.id("evitems");
        CAN.media.loader.list(uid, "event", events, showEvent, eventHasChanged,
            {"title": "", "description": "", "where": {"name": "",
            "address": "", "zipcode": {"code": ""}}, "tasks": [], "when": {
            "year": "Year", "month": "Month", "day": "Day", "time": "Time"}});

        var origvals = {"title": "", "description": "", "wherename": "",
            "whereaddress": "", "wherezip": "", "year": "Year",
            "month": "Month", "day": "Day", "time": "Time"};

        submitevent = CT.dom.id("cooeventsubmit").onclick = function() {
            if (!eventHasChanged())
                return alert("No changes made!");
            for (var k in origvals) {
                if (k == "description") {
                    if (e.description.get() == "")
                        return alert("description?");
                }
                else if (e[k].value == origvals[k])
                    return alert(k+"?");
            }
            var pdata = {"key": currentEvent.key, "title": e.title.value,
                "description": e.description.get(),
                "where": {"name": e.wherename.value,
                "address": e.whereaddress.value, "zip": e.wherezip.value},
                "when": {"year": e.year.value,
                "month": e.month.value, "day": e.day.value,
                "time": e.time.value}, "tasks": []};

            if (!getTasks(pdata)) return;

            CAN.categories.tagAndPost(pdata, function(rawdata) {
                CT.data.add(rawdata);
                if (currentEvent.is_new) {
                    currentEvent = rawdata;
                    CAN.media.loader.newLister(currentEvent, events, "event", showEvent, eventHasChanged);
                }
                else {
                    currentEvent.title = rawdata.title;
                    currentEvent.description = rawdata.description;
                    currentEvent.where = rawdata.where;
                    currentEvent.when = rawdata.when;
                    currentEvent.tasks = rawdata.tasks;
                }
                alert("success");
            });
        };
    };

    // recruiter panel essentials
    var REC_USER_EDITOR = CT.dom.id("recusereditor");
    var recViewUser = function(key) {
        var u = CT.data.get(key);
        if (!u.role) {
            CT.net.post("/get", {"gtype": "user", "uid": key, "role_only": 1},
                "error retrieving user data", function(d) {
                    CT.data.add(d);
                    recViewUser(key);
                });
        }
        else {
            var n = CT.dom.node();
            n.appendChild(CT.dom.node(u.firstName + " " + u.lastName + "'s Roles",
                "div", "big bold"));
            for (var i = 0; i < roles.length; i++) {
                var r = roles[i];
                n.appendChild(CT.dom.checkboxAndLabel(r,
                    u.role.indexOf(r) != -1));
            }
            n.appendChild(CT.dom.button("Save Changes", function() {
                var rs = [];
                var guys = ["greg", "paul", "mario"];
                for (var i = 0; i < guys.length; i++) {
                    if (u.role.indexOf(guys[i]) != -1)
                        rs.push(guys[i]);
                }
                if (CT.data.get(uid).role.indexOf("greg") == -1) {
                    for (var i = 0; i < u.role.length; i++) {
                        if (ggroles.indexOf(u.role[i]) != -1)
                            rs.push(u.role[i]);
                    }
                }
                for (var i = 0; i < roles.length; i++) {
                    var r = roles[i];
                    if (CT.dom.id(r + "checkbox").checked)
                        rs.push(r);
                }
                if (CT.data.sameList(u.role, rs))
                    return alert("you haven't changed anything!");
                var oldroles = u.role;
                u.role = rs;
                CT.net.post("/edit", {"eid": uid,
                    "data": {"role": u.role, "key": u.key}},
                    "failed to edit user data", function() {
                        if (uid == u.key)
                            loadAdminPanels(u.role, oldroles);
                        alert("success!"); });
            }));
            REC_USER_EDITOR.innerHTML = "";
            REC_USER_EDITOR.appendChild(n);
        }
    };

    // moderator panel essentials
    var MOD_CUR_USER = null;
    var MOD_USER_EDITOR = CT.dom.id("modusereditor");
    var MFI = CT.dom.id("modflaggeditems");
    var modCommentForm = function(c, pnode, flag) {
        var cbody = CT.dom.node(c.body);
        pnode.appendChild(cbody);
        var tabox = CT.dom.node("", "div", "hidden");
        var ta = CT.dom.textArea(null, null, "fullwidth");
        var tasub = CT.dom.button("Delete", function() {
            var taval = ta.value.trim();
            if (taval == c.body)
                return alert("You haven't changed anything!");
            if (taval == "") {
                alert("Using default message.");
                taval = "<b>This item has been deleted by a moderator for violating <a href='/about.html#TermsofUse' target='_blank'>CAN's Terms of Use</a>. Please be respectful.</b>";
            }
            var pdata = {"key": c.key, "deleted": taval};
            if (flag)
                pdata.unflag = flag.key;
            CT.net.post("/edit", {"data": pdata, "eid": uid},
                "error moderating comment", function() {
                    if (flag) {
                        MFI.removeChild(CT.dom.id("flag" + flag.key));
                        if (MFI.innerHTML == "")
                            MFI.innerHTML = "No flagged items!";
                    }
                    else {
                        cbody.innerHTML = taval;
                        CT.dom.showHide(tabox);
                    }
                });
        });
        tabox.appendChild(ta);
        tabox.appendChild(tasub);
        tabox.appendChild(CT.dom.node("Please provide your rationale above.",
            "span", "gray"));
        pnode.appendChild(tabox);
        return tabox;
    };
    var modCommentLine = function(c) {
        var n = CT.dom.node("", "div", "bordered padded round bottommargined");
        var tabox = modCommentForm(c, n);
        n.appendChild(CT.dom.node(CT.dom.link("Delete Item", function() {
            CT.dom.showHide(tabox); })));
        return n;
    };
    var modViewUser = function(key) {
        var u = CT.data.get(key);
        if (!u.email) {
            CT.net.post("/get", {"gtype": "user", "comments": 1, "uid": key},
                "error retrieving user data", function(d) {
                    CT.data.add(d);
                    modViewUser(key);
                });
        }
        else {
            var nstring = u.firstName + " " + u.lastName;
            var n = CT.dom.node();
            n.appendChild(CT.dom.node(nstring + "'s Profile",
                "div", "big bold bottompadded"));
            n.appendChild(CT.dom.node("There isn't much about the profile to edit at the moment, but stay tuned for changes as the profile expands.", "div", "bottompadded"));
            n.appendChild(CT.dom.node(nstring + "'s Remarks",
                "div", "big bold bottompadded"));
            if (!u.comments || u.comments.length == 0)
                n.appendChild(CT.dom.node(nstring + " hasn't made any remarks."));
            else {
                for (var i = 0; i < u.comments.length; i++)
                    n.appendChild(modCommentLine(u.comments[i]));
            }
            MOD_USER_EDITOR.innerHTML = "";
            MOD_USER_EDITOR.appendChild(n);
            CT.panel.select(key, "modus");
            MOD_CUR_USER = key;
        }
    };

    // moderator conversations panel
    var MODCON = CT.dom.id("modconversations");
    var MODCONS = CT.dom.id("modconvoselector");
    var viewConversation = function(key) {
        var c = CT.data.get(key);
        if (!c.comments) {
            CT.net.post("/get", {"gtype": "conversations", "key": key},
                "error retrieving comments", function(d) {
                CT.data.add(d); viewConversation(key); });
       }
       else {
            var n = CT.dom.node();
            n.appendChild(CT.dom.node(CT.parse.breakurl(c.topic),
                "div", "big bold bottompadded"));
            for (var i = 0; i < c.comments.length; i++)
                n.appendChild(modCommentLine(c.comments[i]));
            MODCON.innerHTML = "";
            MODCON.appendChild(n);
            CT.panel.select(key, "modcs");
       }
    };
    var newConversation = function(c) {
        CT.data.add(c);
        return CT.dom.node(CT.dom.link(CT.parse.breakurl(c.topic),
            function() { viewConversation(c.key); }),
            "div", "modcsitem", "modcsitem" + c.key);
    };

    var newFlag = function(f) {
        var flagger = CT.data.get(f.flagger);
        var flaggerfull = flagger.firstName + " " + flagger.lastName;
        var fItem = CT.data.get(f.flagged);
        var fConvo = null;
        if (fItem.firstName)
            var fUser = fItem;
        else {
            var fUser = CT.data.get(fItem.user);
            fConvo = CT.data.get(fItem.conversation);
        }
        var flageefull = fUser.firstName + " " + fUser.lastName;
        var n = CT.dom.node("", "div",
            "bordered padded round bottommargined", "flag" + f.key);
        var fstring = flaggerfull + " flagged " + flageefull;
        if (fUser == fItem)
            fstring += "'s profile.";
        else
            fstring += "'s comment.";
        n.appendChild(CT.dom.snode(fstring, "div", "bold"));
        var tabox = null;
        if (fUser != fItem) {
            n.appendChild(CT.dom.node("The offending text reads:"));
            var pn = CT.dom.node("", "div", "tabbed bottompadded");
            n.appendChild(pn);
            tabox = modCommentForm(fItem, pn, f);
        }
        n.appendChild(CT.dom.node("According to " + flaggerfull + ":"));
        n.appendChild(CT.dom.node(f.message, "div", "tabbed bottompadded"));
        n.appendChild(CT.dom.link("View User", function() {
            CT.panel.swap("Users", true, "mod");
            modViewUser(fUser.key);
        }));
        if (fConvo) {
            n.appendChild(CT.dom.node(" | ", "span"));
            n.appendChild(CT.dom.link("View Conversation", function() {
                CT.panel.swap("Conversations", true, "mod");
                viewConversation(fConvo.key);
            }));
        }
        if (tabox) {
            n.appendChild(CT.dom.node(" | ", "span"));
            n.appendChild(CT.dom.link("Delete Item", function() {
                CT.dom.showHide(tabox); }));
        }
        return n;
    };

    var viewUserCbs = { 'rec': recViewUser, 'mod': modViewUser };
    var viewUserLink = function(vtype, key) {
        return CT.dom.link("", function() { viewUserCbs[vtype](key); });
    };

    var alluserkeys = [];
    var removeCurrentUser = function() {
        for (var vtype in viewUserCbs)
            CT.dom.id(vtype + "userselector").removeChild(CT.dom.id(vtype + "usitem" + MOD_CUR_USER));
        var cui = alluserkeys.indexOf(MOD_CUR_USER);
        alluserkeys = alluserkeys.slice(0, cui).concat(alluserkeys.slice(cui + 1));
        MOD_CUR_USER = alluserkeys[0];
        recViewUser(MOD_CUR_USER);
        modViewUser(MOD_CUR_USER);
    };

    // loads Recruiter and Moderator user panels
    var newUser = function(d) { // largely from search.js
        alluserkeys.push(d.key);
        CT.data.add(d);
        for (var vtype in viewUserCbs)
            CT.dom.id(vtype + "userselector").appendChild(CAN.session.userLine(d.key,
                null, null, viewUserLink(vtype, d.key),
                vtype + "usitem", vtype + "usitem" + d.key));
    };
    var allusersloaded = false;
    var loadAllUsers = function() {
        if (allusersloaded)
            return;
        CT.net.post("/get", {"gtype": "user", "uid": uid, "all": 1},
            "error retrieving all users", function(d) {
                for (var i = 0; i < d.length; i++)
                    newUser(d[i]);
                ALLUSERSLOADED = true;
                recViewUser(d[0].key);
                modViewUser(d[0].key);
            });
        allusersloaded = true;
    };

    loaders["authenticator"] = function() {
        if (loaded["authenticator"])
            return;
        loaded["authenticator"] = true;

        resizeThese.push(CT.dom.id("sbpanelAuthenticator"));

        loadAllUsers();

        var curattempt = null;
        var authmessage = CT.dom.id("authmessage");
        var authgraphic = CT.dom.id("authgraphic");
        var authpass = CT.dom.id("authpass");
        var authaccept = CT.dom.id("authaccept");
        var authreject = CT.dom.id("authreject");
        var viewAttempt = function(a) {
            if (a == "none") {
                authmessage.innerHTML = "No authentication attempts to review!";
                authgraphic.style.display = authpass.style.display = authaccept.style.display = authreject.style.display = "none";
                return;
            }
            if (a.lastone)
                authpass.style.display = "none";
            var user = CT.data.get(a.user);
            user.name = user.firstName + " " + user.lastName;
            authmessage.innerHTML = "";
            authmessage.appendChild(CT.dom.node("Does this image look authentic?"));
            authmessage.appendChild(CT.dom.node("<b>Auth Type</b>: " + a.property));
            authmessage.appendChild(CT.dom.node("<b>Look For</b>: " + user[a.property]));
            authgraphic.innerHTML = "";
            authgraphic.appendChild(CT.dom.img("/get?gtype=graphic&key=" + a.graphic));
            curattempt = a;
        };

        var nextAttempt = function(review) {
            var pdata = {"gtype": "authattempt", "uid": uid};
            if (review) {
                review.uid = curattempt.user;
                review.gid = curattempt.graphic;
                pdata.review = review;
            }
            CT.net.post("/get", pdata,
                "error retrieving auth attempt", viewAttempt);
        };
        nextAttempt();
        authpass.onclick = function() {
            nextAttempt();
        };
        authaccept.onclick = function() {
            if (curattempt)
                nextAttempt({"decision": true});
            else
                nextAttempt();
        };
        authreject.onclick = function() {
            if (curattempt)
                nextAttempt({"decision": false});
            else
                nextAttempt();
        };
    };

    loaders["recruiter"] = function() {
        if (loaded["recruiter"])
            return;
        loaded["recruiter"] = true;

        loadAllUsers();

        var curappkey = null;
        var appview = CT.dom.id("recappreview");
        var rapass = CT.dom.id("recapppass");
        var raaccept = CT.dom.id("recappaccept");
        var rareject = CT.dom.id("recappreject");
        var viewApplication = function(app) {
            if (app == "none") {
                appview.innerHTML = "No applications to review!";
                rapass.style.display = raaccept.style.display = rareject.style.display = "none";
                return;
            }
            if (app.lastone)
                rapass.style.display = "none";
            CT.data.add(app);
            var user = CT.data.get(app.user);
            if (!user) // wait for user to load
                return setTimeout(viewApplication, 500, [app]);
            appview.innerHTML = "";
            appview.appendChild(CT.dom.node("Applicant: ", "span", "bold"));
            appview.appendChild(CT.dom.link(user.firstName + " " + user.lastName,
                null, "/profile.html?u=" + CAN.cookie.flipReverse(user.key)));
            appview.appendChild(CT.dom.node("Desired Role: " + app.role,
                "div", "bold"));
            appview.appendChild(CT.dom.node("Statement:", "div", "bold"));
            appview.appendChild(CT.dom.node(app.statement, "div", "small"));
            curappkey = app.key;
        };
        var nextApplication = function(review) {
            var pdata = {"gtype": "application", "uid": uid};
            if (review)
                pdata.review = review;
            CT.net.post("/get", pdata,
                "error retrieving application", viewApplication);
        };
        nextApplication();
        rapass.onclick = function() {
            nextApplication();
        };
        raaccept.onclick = function() {
            if (curappkey)
                nextApplication({"key": curappkey, "decision": true});
            else
                nextApplication();
        };
        rareject.onclick = function() {
            if (curappkey)
                nextApplication({"key": curappkey, "decision": false});
            else
                nextApplication();
        };
    };

    loaders["moderator"] = function() {
        if (loaded["moderator"])
            return;
        loaded["moderator"] = true;

        loadAllUsers();
        CT.panel.load(["Users", "Conversations", "Flagged Items"], true, "mod");

        var convosort = function(a, b) {
            var x = a.topic;
            var y = b.topic;
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        };

        CT.net.post("/get", {"gtype": "conversations"},
            "error retrieving conversations", function(cs) {
                cs.sort(convosort);
                for (var i = 0; i < cs.length; i++)
                    MODCONS.appendChild(newConversation(cs[i]));
                viewConversation(cs[0].key);
            });
        CT.net.post("/get", {"gtype": "flags", "uid": uid},
            "error retrieving flags", function(f) {
                if (f.length == 0)
                    MFI.innerHTML = "No flagged items!";
                else
                    MFI.innerHTML = "";
                var needed = [];
                for (var i = 0; i < f.length; i++) {
                    needed.push(f[i].flagger);
                    needed.push(f[i].flagged);
                }
                CT.data.checkAndDo(needed, function() {
                    for (var i = 0; i < f.length; i++)
                        MFI.appendChild(newFlag(f[i]));
                });
            });

        if (CT.data.get(uid).role.indexOf("greg") != -1) {
            var dub = CT.dom.id("ggdeluser");
            CT.dom.showHide(dub.parentNode);
            dub.onclick = function() {
                if (confirm("Are you sure? Deleting a user is serious business!")) {
                    CT.dom.passwordPrompt(function(pass) {
                        CT.net.post("/edit", {"eid": uid, "data": {"key": MOD_CUR_USER,
                            "deleteuser": 1, "password": pass}},
                            "error deleting user", removeCurrentUser);
                    });
                }
            };
        }
    };

    var npsd = CT.dom.id("newsphotoselected");
    var nvsd = CT.dom.id("newsvideoselected");

    var pssh = CT.dom.id("npsclose").onclick = function() {
        CT.dom.showHide(CT.dom.id("photoselector")); };
    var vssh = CT.dom.id("nvsclose").onclick = function() {
        CT.dom.showHide(CT.dom.id("videoselector")); };

    var _buttoncbs = {
        "photo": {"name": "select", "targetCb": function() {
            return CT.dom.id(panelname + "photoselected"); },
            "whichPanel": function() { return panelname; },
            "justOneCb": function() {
                if (panelname == "book" || panelname == "sustainableaction") {
                    CT.dom.showHide(CT.dom.id("photoselector"),
                        false, true);
                    return true;
                }
                return false;
            } },
        "video": {"name": "select", "targetCb": function() {
            return CT.dom.id(panelname + "videoselected"); },
            "whichPanel": function() { return panelname; }
        },
    }

    // these functions update fresh video/photo caches
    var newPhotos = [];
    var newVideos = [];
    var newPhoto = function(d, i) {
        var f = CT.dom.id("npsfresh");
        CT.data.add(d);
        newPhotos.push(d);
        CAN.media.loader.load({"mtype": "photo", "mkey": "freshphoto", "layout": "tiled",
            "node": f, "number": 4, "buttonCbDefault": _buttoncbs['photo']}, newPhotos);
        f.style.display = CT.dom.id("npsfreshtitle").style.display = "block";
    };
    var newVideo = function(d, i) {
        var f = CT.dom.id("nvsfresh");
        CT.data.add(d);
        newVideos.push(d);
        CAN.media.loader.load({"mtype": "video", "mkey": "freshvideo", "layout": "tiled",
            "node": f, "number": 4, "buttonCbDefault": _buttoncbs['video']}, newVideos);
        f.style.display = CT.dom.id("nvsfreshtitle").style.display = "block";
    };

    var psunode = CT.dom.id("photoselectoruploadnode");
    var psutitle = CT.dom.node("", "div", "bordered padded round bottommargined");
    psutitle.appendChild(CT.dom.node(CT.dom.node("Title", "label", "", "",
        {"htmlFor": "psutitlefield", "for": "psutitlefield"}),
        "div", "big bold blue"));
    var psutitlefield = CT.dom.field("psutitlefield", null, "fullwidth");
    psutitle.appendChild(psutitlefield);
    var psuartist = CT.dom.node("", "div", "bordered padded round bottommargined");
    psuartist.appendChild(CT.dom.node(CT.dom.node("Artist", "label", "", "",
        {"htmlFor": "psuartistfield", "for": "psuartistfield"}),
        "div", "big bold blue"));
    var psuartistfield = CT.dom.field("psuartistfield", null, "fullwidth");
    psuartist.appendChild(psuartistfield);
    var psucredit = CT.dom.node("", "div", "bordered padded round bottommargined");
    psucredit.appendChild(CT.dom.node(CT.dom.node("Credit Link", "label", "", "",
        {"htmlFor": "psucreditfield", "for": "psucreditfield"}),
        "div", "big bold blue"));
    var psucreditfield = CT.dom.field("psucreditfield", null, "fullwidth");
    psucredit.appendChild(psucreditfield);
    var psushare = CT.dom.node("", "div", "bordered padded round bottommargined");
    psushare.appendChild(CT.dom.node("Optional", "div", "big bold blue"));
    psushare.appendChild(CT.dom.checkboxAndLabel("psushare", false,
        "Display this content on the CAN homepage in addition to my personal profile."));
    psunode.appendChild(psutitle);
    psunode.appendChild(psuartist);
    psunode.appendChild(psucredit);
    psunode.appendChild(psushare);
    var psustatus = CT.dom.node("", "span", "red");
    var psuform = CT.upload.form(uid, "photograph",
        CT.dom.button("Submit", function() {
            if (!psuform.data.value)
                return alert("please select a file to upload");
            psustatus.innerHTML = "uploading file";
            var psusharecb = CT.dom.id("psusharecheckbox");
            var pdata = {"key": "photo",
                "title": psutitlefield.value,
                "artist": psuartistfield.value,
                "link": psucreditfield.value,
                "shared": psusharecb.checked};
            CT.upload.submit(psuform, function(gkey) {
                psustatus.innerHTML = "saving picture";
                pdata.photo = "/get?gtype=graphic&key="+gkey;
                CAN.categories.tagAndPost(pdata, function(key) {
                    pdata.key = key;
                    newPhoto(pdata);
                    psuform.data.value = psutitlefield.value = psuartistfield.value = psucreditfield.value = "";
                    psusharecb.checked = false;
                    psustatus.innerHTML = "";
                    CT.dom.showHide(psunode);
                });
            }, function(msg) {
                psustatus.innerHTML = "";
                alert("failed to upload graphic: "+msg);
            }, true);
        }));
    psuform.style.display = "inline";
    psunode.appendChild(psuform);
    psunode.appendChild(psustatus);
    CT.dom.id("photoselectoruploadlink").onclick = function() {
        CT.dom.showHide(psunode);
    };

    loaders["photosandvideos"] = function() {
        if (loaded["photosandvideos"])
            return;
        loaded["photosandvideos"] = true;

        CAN.media.loader.load({"mtype": "photo", "layout": "tiled", "number": 12,
            "node": CT.dom.id("photoselectorbrowse"),
            "newMediaDefault": "photoscale", "paging": "bidirectional",
            "buttonCbDefault": _buttoncbs['photo'], "shared": 1});
        CAN.media.loader.load({"mtype": "video", "layout": "tiled", "number": 12,
            "node": CT.dom.id("videoselectorbrowse"),
            "paging": "bidirectional", "newMediaDefault": "videothumb",
            "buttonCbDefault": _buttoncbs['video'], "newMediaSelect": "video"});
    };

    CT.dom.id("showhidenewsphotoselector").onclick = function() {
        panelname = "news"; pssh(); };

    CT.dom.id("showhidenewsvideoselector").onclick = function() {
        panelname = "news"; vssh(); };

    // news uploader
    loaders["reporter"] = function() {
        if (loaded["reporter"])
            return;
        loaded["reporter"] = true;

        var currentNews = null;
        var ntitle = CT.dom.id("newstitlefield");
        var nbody = CT.dom.id("newsbodyfield");
        var ncritique = CT.dom.id("newscritique");
        var nshared = CT.dom.id("newsshared");

        CT.rte.wysiwygize("newsbodyfield");

        var currentNewsPhotos = function() {
            var p = [];
            for (var i = 0; i < npsd.childNodes.length; i++)
                p.push(npsd.childNodes[i].id.split("news")[1] || "");
            return p;
        };

        var currentNewsVideos = function() {
            var v = [];
            for (var i = 0; i < nvsd.childNodes.length; i++)
                v.push(nvsd.childNodes[i].id.split("news")[1] || "");
            return v;
        };

        var newsHasChanged = function() {
            if (currentNews == null)
                return false;
            return currentNews.title != ntitle.value || currentNews.body != nbody.get() || !CT.data.sameList(currentNews.photo, currentNewsPhotos()) || !CT.data.sameList(currentNews.video, currentNewsVideos()) || currentNews.shared != nshared.checked;
        };

        var submitnewsedits = null; // for compiler
        var showNews = function(d) {
            CAN.media.moderation.unselectAllMedia(currentNews, true, "news");
            CAN.media.moderation.listCritiques(d, ncritique, "article");

            ntitle.value = d.title;
            //nbody.value = d.body;
            //nbody.set(processTemplate(d.body));
            nshared.checked = d.shared;

            panelname = "news";
            CAN.media.moderation.selectNewMedia(d, true, "news");
            CT.panel.selectLister(d.key, currentNews && currentNews.key || null);

            currentNews = d;

            nbody.set(d.body, submitnewsedits);
        };

        var articles = CT.dom.id("rpitems");
        CAN.media.loader.list(uid, "news", articles, showNews,
            newsHasChanged, {"title": "", "body": "",
            "photo": [], "video": [], "shared": false});

        var newspreview = CT.dom.id("newspreview");
        submitnewsedits = CT.dom.id("newssubmit").onclick = function() {
            // user, title, body, photo, video
            if (!newsHasChanged())
                return alert("No changes made!");
            var pdata = {"key": currentNews.key, "shared": nshared.checked};
            var bod = nbody.get();
            if (!ntitle.value || !bod)
                return alert("no title or body!");
            pdata.title = ntitle.value;
            pdata.body = bod;//replaceUnicode(bod);

            // photo
            pdata.photo = currentNewsPhotos();

            // video
            pdata.video = currentNewsVideos();

            newspreview.innerHTML = "";
            pdata.user = uid;
            newspreview.appendChild(CAN.media.news.build(pdata, null, "full", true));
            delete pdata.user;
            newspreview.appendChild(CT.dom.button("Really Submit", function() {
                newspreview.style.display = "none";
                CAN.categories.tagAndPost(pdata, function(key) {
                    if (currentNews.is_new) {
                        currentNews = {"key": key, "title": pdata.title,
                            "body": pdata.body, "photo": pdata.photo,
                            "video": pdata.video, "shared": pdata.shared};
                        CAN.media.loader.newLister(currentNews, articles,
                            "news", showNews, newsHasChanged);
                    }
                    else {
                        currentNews.title = pdata.title;
                        currentNews.body = pdata.body;
                        currentNews.photo = pdata.photo;
                        currentNews.video = pdata.video;
                        currentNews.shared = pdata.shared;
                    }
                    alert("success!");
                });
            }));
            newspreview.appendChild(CT.dom.button("Cancel", function() {
                newspreview.style.display = "none"; }));
            newspreview.style.display = "block";
        };
    };

    // Photo adder
    loaders["photographer"] = function() {
        if (loaded["photographer"])
            return;
        loaded["photographer"] = true;

        resizeThese.push(CT.dom.id("sbpanelPhotographer"));

        CT.panel.load(["Upload", "HTML", "Manual"], true, "ps");
        var photopreview = CT.dom.id("photopreview");
        var h = CT.dom.id("photohtmlfield");
        var t = CT.dom.id("phototitlefield");
        var a = CT.dom.id("photoartistfield");
        var p = CT.dom.id("photophotofield");
        var l = CT.dom.id("photolinkfield");
        var tup = CT.dom.id("photouploadtitle");
        var aup = CT.dom.id("photouploadartist");
        var pup = CT.dom.id("photouploadupload");
        var pupstatus = CT.dom.id("photouploadstatus");
        var dform = CT.upload.form(uid, "photograph");
        pup.appendChild(dform);
        var lup = CT.dom.id("photouploadlink");
        var photoshared = CT.dom.id("photoshared");
        var submitPhoto = function(pdata) {
            photopreview.innerHTML = "";
            photopreview.appendChild(CAN.media.photo.build(pdata));
            photopreview.appendChild(CT.dom.button("Really Submit", function() {
                photopreview.style.display = "none";
                CAN.categories.tagAndPost(pdata, function(key) {
                    pdata.key = key;
                    newPhoto(pdata);
                    h.value = t.value = a.value = p.value = l.value = tup.value = aup.value = lup.value = "";
                    photoshared.checked = false;
                    alert("success!");
                });
            }));
            photopreview.appendChild(CT.dom.button("Cancel", function() {
                photopreview.style.display = "none"; }));
            photopreview.style.display = "block";
        };
        var ticktimer = null;
        var tickStatus = function(orig, dots) {
            if (dots == null) {
                ticktimer = setTimeout(tickStatus, 500, orig, ".");
                return;
            }
            pupstatus.innerHTML = orig + dots;
            dots += ".";
            if (dots == "....")
                dots = "";
            ticktimer = setTimeout(tickStatus, 500, orig, dots);
        };
        var setStatus = function(txt, hideafter, dotticks) {
            if (ticktimer) {
                clearTimeout(ticktimer);
                ticktimer = null;
            }
            txt = txt || "";
            pupstatus.innerHTML = txt;
            if (dotticks)
                tickStatus(txt);
            if (hideafter)
                setTimeout(setStatus, hideafter * 1000, null);
        };
        CT.dom.id("photosubmit").onclick = function() {
            var pdata = {"key": "photo", "shared": photoshared.checked};
            if (CT.panel.lastClicked.ps == "Upload") {
                pdata.title = tup.value;
                pdata.artist = aup.value;
                pdata.link = lup.value;
                for (var k in pdata) {
                    if (k != "shared" && pdata[k] == "")
                        return alert(k+"?");
                }
                if (!dform.data.value)
                    return alert("don't forget the photograph!");
                setStatus("uploading photograph", null, true);
                return CT.upload.submit(dform, function(key) {
                    dform.data.value = "";
                    setStatus("done uploading photograph!", 5);
                    pdata.photo = "/get?gtype=graphic&key=" + key;
                    submitPhoto(pdata);
                }, function(msg) {
                    setStatus("failed to upload photograph: " + msg);
                }, true);
            }
            else if (CT.panel.lastClicked.ps == "HTML")
                pdata.html = h.value;
            else { // manual
                pdata.title = t.value;
                pdata.artist = a.value;
                pdata.photo = p.value;
                pdata.link = l.value;
            }
            for (var k in pdata) {
                if (k != "shared" && pdata[k] == "")
                    return alert(k+"?");
            }
            submitPhoto(pdata);
        };
    };

    // video adding
    loaders["videographer"] = function() {
        if (loaded["videographer"])
            return;
        loaded["videographer"] = true;

        resizeThese.push(CT.dom.id("sbpanelVideographer"));
        CT.dom.richInput(CT.dom.id("vdnode"), "vdescription");

        var currentVideo = null;
        var vtitle = CT.dom.id("vtitle");
        var vdescription = CT.dom.id("vdescription");
        var vlink = CT.dom.id("vlink");
        var vcritique = CT.dom.id("videocritique");
        var vtest = CT.dom.id("videotest");
        var videos = CT.dom.id("voitems");

        var videoHasChanged = function() {
            if (currentVideo == null)
                return false;
            return currentVideo.title != vtitle.value ||
                (currentVideo.description || "") != vdescription.value ||
                currentVideo.docid != CT.video.docidFromUrl(vlink.value) ||
                currentVideo.player != CT.video.playerFromUrl(vlink.value);
        };
        var showVideo = function(d) {
            CAN.media.moderation.unselectAllMedia(currentVideo, true, "video");
            CAN.media.moderation.listCritiques(d, vcritique, "video");

            vtest.innerHTML = "";
            vtitle.value = d.title;
            vdescription.value = d.description;
            vlink.value = CT.video.urlFromData(d.player, d.docid);

            panelname = "video";
            CAN.media.moderation.selectNewMedia(d, true, "video");
            CT.panel.selectLister(d.key, currentVideo && currentVideo.key || null);

            currentVideo = d;
        };
        CAN.media.loader.list(uid, "video", videos, showVideo,
            videoHasChanged, {"title": "", "description": "",
            "player": "", "docid": ""});
        var majorVideoData = function() {
            // only allows video from major platforms
            var d = CT.video.videoData(vlink.value);
            if (d && CT.video.rawVidTypes.indexOf(d.player) == -1)
                return d;
            alert('No usable value for "link". Please note that for now, we only support Youtube, Google Video, and Vimeo. We\'re always working to improve the site, so check back soon!');
        };
        CT.dom.id("vtestbutton").onclick = function() {
            var pdata = majorVideoData();
            vtest.innerHTML = pdata && CT.video.embed(pdata) || "no video!";
        };
        CT.dom.id("vsubmitbutton").onclick = function() {
            if (!videoHasChanged())
                return alert("No changes made!");
            if (vtest.innerHTML == "" || vtest.innerHTML == "no video!")
                return alert("please test your video before you submit");
            var pdata = majorVideoData();
            if (!pdata)
                return;
            pdata.key = currentVideo.key;
            pdata.title = vtitle.value;
            pdata.description = vdescription.value;
            if (! pdata.title)
                return alert("What's this video called?");
            CAN.categories.tagAndPost(pdata, function(key) {
                pdata.key = key;
                newVideo(pdata);
                if (currentVideo.is_new) {
                    currentVideo = {
                        "key": key,
                        "title": pdata.title,
                        "description": pdata.description,
                        "player": pdata.player,
                        "docid": pdata.docid
                    };
                    CAN.media.loader.newLister(currentVideo, videos, "video",
                        showVideo, videoHasChanged);
                }
                currentVideo.critiques = [];
                CAN.media.moderation.listCritiques(currentVideo, vcritique);
                alert("success");
            });
        };
    };

    // text snippet editing
    loaders["writer"] = function() {
        if (loaded["writer"])
            return;
        loaded["writer"] = true;

        var writercritique = CT.dom.id("writercritique");

        CT.panel.load(["Quote", "Book Recommendation", "Sustainable Action"], true, "ws");
        CT.dom.id("writerbookphotobutton").onclick = function() {
            panelname = "book"; pssh(); };
        CT.dom.id("writersustainableactionphotobutton").onclick = function() {
            panelname = "sustainableaction"; pssh(); };
        var shorthand = {"Quote": "quote", "BookRecommendation": "book",
            "SustainableAction": "sustainableaction"};
        var wfields = {
            "quote": ["author", "content", "shared"],
            "book": ["author", "content", "title", "author", "readlink", "buylink", "photo", "shared"],
            "sustainableaction": ["content", "title", "link", "photo", "shared"]};
        var currentWriting = {
            "quote": null,
            "book": null,
            "sustainableaction": null
        };
        var blankSet = function(wtype) {
            var d = {};
            for (var i = 0; i < wfields[wtype].length; i++) {
                if (wfields[wtype][i] == "shared")
                    d.shared = false;
                else
                    d[wfields[wtype][i]] = "";
            }
            return d;
        };
        var hasChanged = function(wtype) {
            if (currentWriting[wtype] == null)
                return false;
            for (var i = 0; i < wfields[wtype].length; i++) {
                var wname = wfields[wtype][i];
                var curvalue = currentWriting[wtype][wname];
                if (wname == "photo") {
                    var psnode = CT.dom.id(wtype + "photoselected");
                    var photoid = psnode && psnode.firstChild && psnode.firstChild.id.split(wtype)[1] || "";
                    if (curvalue != photoid)
                        return true;
                }
                else if (wname == "shared") {
                    if (curvalue != CT.dom.id("writer" + wtype + "shared").checked)
                        return true;
                }
                else if (curvalue != CT.dom.getFieldValue("writer" + wtype + wname))
                    return true;
            }
            return false;
        };
        var showWriting = function(d, wtype) {
            if (currentWriting[wtype] && currentWriting[wtype].key == d.key)
                return;
            if (wtype == "book" || wtype == "sustainableaction") {
                if (typeof d.photo != "string") {
                    CT.data.add(d.photo);
                    d.photo = d.photo.key;
                    CT.data.add(d);
                }
            }
            CAN.media.moderation.unselectAllMedia(currentWriting[wtype], false, wtype);
            CAN.media.moderation.listCritiques(d, writercritique, "writing");

            for (var i = 0; i < wfields[wtype].length; i++) {
                var wname = wfields[wtype][i];
                if (wname == "shared")
                    CT.dom.id("writer" + wtype + "shared").checked = d.shared;
                else if (wname != "photo")
                    CT.dom.setFieldValue(d[wname], "writer" + wtype + wname);
            }

            panelname = wtype;
            CAN.media.moderation.selectNewMedia(d, false, wtype);
            CT.panel.selectLister(d.key, currentWriting[wtype] && currentWriting[wtype].key || null);

            currentWriting[wtype] = d;
        };

        var listernodes = {
            "quote": CT.dom.id("wsqitems"),
            "book": CT.dom.id("wsbitems"),
            "sustainableaction": CT.dom.id("wssitems")
        };

        var hccb = function(wtype) {
            return function() { return hasChanged(wtype); };
        };

        var swcb = function(wtype) {
            return function(d) { showWriting(d, wtype); };
        };

        CAN.media.loader.list(uid, "quote", listernodes.quote, swcb("quote"),
            hccb("quote"), blankSet("quote"));
        CAN.media.loader.list(uid, "book", listernodes.book, swcb("book"),
            hccb("book"), blankSet("book"));
        CAN.media.loader.list(uid, "sustainableaction",
            listernodes.sustainableaction, swcb("sustainableaction"),
            hccb("sustainableaction"), blankSet("sustainableaction"));

        CT.dom.id("writersubmit").onclick = function() {
            var sftype = shorthand[CT.panel.lastClicked['ws']];
            if (!hasChanged(sftype))
                return alert("No changes made!");
            var pdata = {"key": currentWriting[sftype].key};
            for (var i = 0; i < wfields[sftype].length; i++) {
                var key = wfields[sftype][i];
                if (key == "shared")
                    pdata.shared = CT.dom.id("writer" + sftype + "shared").checked;
                else if (key == "photo") {
                    var psnode = CT.dom.id(sftype+"photoselected").firstChild;
                    pdata[key] = psnode && psnode.id.split(panelname)[1] || null;
                }
                else
                    pdata[key] = CT.dom.getFieldValue("writer" + sftype + key);
                if (key != "shared" && !pdata[key])
                    return alert("Oops! You missed a spot. Please fill in the '" + key + "' section. Thanks!");
            }
            CAN.categories.tagAndPost(pdata, function(key) {
                if (currentWriting[sftype].is_new) {
                    currentWriting[sftype] = pdata;
                    currentWriting[sftype].key = key;
                    CAN.media.loader.newLister(currentWriting[sftype],
                        listernodes[sftype], sftype, swcb(sftype), hccb(sftype));
                }
                else {
                    for (var p in pdata)
                        currentWriting[sftype][p] = pdata[p];
                }
                alert("success");
            });
        };
    };

    // action groups!
    loaders["action_groups"] = function() {
        if (loaded["action_groups"])
            return;
        loaded["action_groups"] = true;

        var agmembernode = CT.dom.id("agmembernode");
        var yourgroups = CT.dom.id("agyour");
        var moregroups = CT.dom.id("agmore");
        var gmain = CT.dom.id("agmain");
        var agstyle = CT.dom.textArea("agstyle", null, "fullwidth h255");
        var agcur = null;
        var agdescription = null;
        var curPage = null;
        var user = CT.data.get(uid);
        var getCurAg = function() {
            return agcur;
        };
        var agHasChanged = function() {
            if (agcur == null || (agcur.is_new != true && agcur.memtype != "leader") || !agdescription.node)
                return false;
            return agcur.title != CT.dom.getFieldValue("agtitle") || agcur.blurb != CT.dom.getFieldValue("agblurb") || agcur.description != agdescription.get() || agcur.website != CT.dom.getFieldValue("agwebsite") || agcur.style != agstyle.value;
        };
        var agSubmitChanges = function() {
            if (! agHasChanged())
                return alert("No changes made!");
            var alldata = {
                "title": CT.dom.getFieldValue("agtitle"),
                "blurb": CT.dom.getFieldValue("agblurb"),
                "description": agdescription.get(true),
                "website": CT.dom.getFieldValue("agwebsite"),
                "style": agstyle.value
            };
            if (!alldata.title)
                return alert("please provide a title for your group");
            if (!alldata.blurb)
                return alert("please provide a blurb for your group");
            var pdata = CT.data.diff(agcur,
                alldata, {"key": agcur.key});
            CT.net.post("/edit", {"eid": uid, "data": pdata},
                "error editing group", function(dataorkey) {
                    if (agcur.is_new) { // data
                        agcur = dataorkey;
                        agstyle.value = agcur.style;
                        agdescription.set(agcur.description);
                        CT.dom.setFieldValue(agcur.blurb, "agblurb");
                        CAN.media.loader.newLister(agcur, yourgroups, "group",
                            agShow, agHasChanged);
                        agShow(agcur);
                    }
                    else { // key
                        if (pdata.title)
                            CT.dom.id("ll"+agcur.key).firstChild.innerHTML = pdata.title;
                        agcur.title = alldata.title;
                        agcur.blurb = alldata.blurb;
                        agcur.description = alldata.description;
                        agcur.website = alldata.website;
                        agcur.style = alldata.style;
                        agdescription.set(agcur.description);
                        CT.dom.setFieldValue(agcur.blurb, "agblurb");
                    }
                    CT.data.add(agcur);
                    alert("success!");
                });
        };
        var agShow = function(d) {
            agmembernode.style.display = d.is_new ? "none" : "block";
            var n = CT.dom.node();
            var agkey = CAN.cookie.flipReverse(d.key);
            if (d.is_new || d.memtype == "leader") {
                // build edit area (leaders, founders)
                var ge = CT.dom.node("", "div", "gmpanel", "gmpanelGroupEditor");
                var tnode = CT.dom.node("", "div",
                    "bordered padded round bottommargined");
                tnode.appendChild(CT.dom.node("Title",
                    "div", "big bold blue"));
                tnode.appendChild(CT.dom.field("agtitle",
                    d.title, "fullwidth"));
                ge.appendChild(tnode);
                var bnode = CT.dom.node("", "div",
                    "bordered padded round bottommargined");
                bnode.appendChild(CT.dom.node("Blurb",
                    "div", "big bold blue"));
                bnode.appendChild(CT.dom.textArea("agblurb",
                    d.blurb, "fullwidth height200"));
                ge.appendChild(bnode);
                var dnode = CT.dom.node("", "div",
                    "bordered padded round bottommargined");
                dnode.appendChild(CT.dom.node("Description",
                    "div", "big bold blue"));
                agdescription = CT.dom.textArea("agdescription",
                    d.description, "fullwidth height200");
                dnode.appendChild(agdescription);
                ge.appendChild(dnode);
                var wnode = CT.dom.node("", "div",
                    "bordered padded round bottommargined");
                wnode.appendChild(CT.dom.node("Website",
                    "div", "big bold blue"));
                wnode.appendChild(CT.dom.field("agwebsite",
                    d.website, "fullwidth"));
                ge.appendChild(wnode);

                // style
                agstyle.value = d.style;

                // submit button
                ge.appendChild(CT.dom.button("Submit", agSubmitChanges));

                n.appendChild(ge);

                if (d.memtype == "leader") {
                    // newsletter sender
                    var nlnode = CT.dom.node("", "div",
                        "gmpanel hidden", "gmpanelNewsletter");
                    loadNewsletterForm(nlnode);
                    n.appendChild(nlnode);

                    // widget
                    var gwidget = CT.dom.node("", "div", "gmpanel",
                        "gmpanelWidgets");
                    var gwidgetcontainer = CT.dom.node("", "div",
                        "bordered padded round topmargined");
                    gwidgetcontainer.appendChild(CT.dom.node("Widget Selection",
                        "div", "big bold blue bottompadded"));
                    var wikiwidgetnode = CT.dom.node("", "div", "bordered padded round");
                    wikiwidgetnode.appendChild(CT.dom.node("Wiki Widget", "div", "bold blue bottompadded"));
                    wikiwidgetnode.appendChild(CT.dom.node("The Wiki Widget provides access to a collection of wiki pages (administered by your group via the Wiki panel on this page) from the comfort of your own website.",
                        "div", "bottompadded"));
                    wikiwidgetnode.appendChild(CT.dom.node("To add a <b>" + d.title + " Wiki Widget</b> to your website, simply paste the following code into your html, inside of the DOM node in which you want the widget:",
                        "div", "bottompadded"));
                    wikiwidgetnode.appendChild(CT.dom.node(document.createTextNode('<scr' + 'ipt src="' + CAN.session.DOMAIN + '/lib/wiki.js#' + encodeURI(agkey) + '"></scr' + 'ipt>'),
                        "div", "round bordered padded bold breakit bottommargined maxwidthoverride"));
                    wikiwidgetnode.appendChild(CT.dom.node("The widget will fill whatever DOM node it finds itself inside of, so size and position your container node (probably a div) wherever and however big you want to see the wiki."));
                    gwidgetcontainer.appendChild(wikiwidgetnode);
                    var streamwidgetnode = CT.dom.node("", "div", "bordered padded round topmargined");
                    streamwidgetnode.appendChild(CT.dom.node("Stream Widget", "div", "bold blue bottompadded"));
                    streamwidgetnode.appendChild(CT.dom.node("The Stream Widget provides access to your group's message board.",
                        "div", "bottompadded"));
                    streamwidgetnode.appendChild(CT.dom.node("To add a <b>" + d.title + " Stream Widget</b> to your website, simply paste the following code into your html, inside of the DOM node in which you want the widget:",
                        "div", "bottompadded"));
                    streamwidgetnode.appendChild(CT.dom.node(document.createTextNode('<scr' + 'ipt src="' + CAN.session.DOMAIN + '/lib/stream.js#' + encodeURI(agkey) + '"></scr' + 'ipt>'),
                        "div", "round bordered padded bold breakit bottommargined maxwidthoverride"));
                    streamwidgetnode.appendChild(CT.dom.node("The widget will fill whatever DOM node it finds itself inside of, so size and position your container node (probably a div) wherever and however big you want to see the message board."));
                    gwidgetcontainer.appendChild(streamwidgetnode);
                    var mapwidgetnode = CT.dom.node("", "div", "bordered padded round topmargined");
                    mapwidgetnode.appendChild(CT.dom.node("Map Widget", "div", "bold blue bottompadded"));
                    mapwidgetnode.appendChild(CT.dom.node("The Map Widget provides access to your group's community resource map.",
                        "div", "bottompadded"));
                    mapwidgetnode.appendChild(CT.dom.node("To add a <b>" + d.title + " Map Widget</b> to your website, simply paste the following code into your html, inside of the DOM node in which you want the widget:",
                        "div", "bottompadded"));
                    mapwidgetnode.appendChild(CT.dom.node(document.createTextNode('<scr' + 'ipt src="' + CAN.sesion.DOMAIN + '/lib/map.js#' + encodeURI(agkey) + '"></scr' + 'ipt>'),
                        "div", "round bordered padded bold breakit bottommargined maxwidthoverride"));
                    mapwidgetnode.appendChild(CT.dom.node("The widget will fill whatever DOM node it finds itself inside of, so size and position your container node (probably a div) wherever and however big you want to see the map."));
                    gwidgetcontainer.appendChild(mapwidgetnode);
                    var chatwidgetnode = CT.dom.node("", "div", "bordered padded round topmargined");
                    chatwidgetnode.appendChild(CT.dom.node("Chat Widget", "div", "bold blue bottompadded"));
                    chatwidgetnode.appendChild(CT.dom.node("The Chat Widget is a live chat room that you can add to your website. It hangs out in a small tab in the bottom-right corner of the screen, and pops open when clicked.",
                        "div", "bottompadded"));
                    chatwidgetnode.appendChild(CT.dom.node("To add a <b>" + d.title + " Live Chat Widget</b> to your website, simply paste the following code into your html:",
                        "div", "bottompadded"));
                    chatwidgetnode.appendChild(CT.dom.node(document.createTextNode('<scr' + 'ipt src="' + CAN.session.domdain + '/lib/chat.js#' + encodeURI(agkey) + '"></scr' + 'ipt>'),
                        "div", "round bordered padded bold breakit bottommargined maxwidthoverride"));
                    chatwidgetnode.appendChild(CT.dom.node("The widget starts at 400px wide and 25px tall. When opened, it's 558px wide and 257 pixels tall."));
                    gwidgetcontainer.appendChild(chatwidgetnode);

                    var gskincontainer = CT.dom.node("", "div",
                        "bordered padded round topmargined");
                    gskincontainer.appendChild(CT.dom.node("Skinning Your Widgets",
                        "div", "big bold blue bottompadded"));
                    gskincontainer.appendChild(CT.dom.node("You want these widgets to match the rest of your website. Modify this stylesheet to spice things up.",
                        "div", "bottompadded"));
                    gskincontainer.appendChild(agstyle);
                    gskincontainer.appendChild(CT.dom.button("Submit", agSubmitChanges));
                    gwidget.appendChild(gwidgetcontainer);
                    gwidget.appendChild(gskincontainer);
                    n.appendChild(gwidget);
                }
            }
            else {
                // build display area (members, non-members)
                var dnode = CT.dom.node("", "div", "bordered padded round");
                dnode.appendChild(CT.dom.node(d.title,
                    "div", "big bold blue bottompadded"));
                dnode.appendChild(CT.dom.node(d.blurb.replace(/\n|\r/ig, '<br>'),
                    "div", "bottompadded"));
                if (d.website) {
                    dnode.appendChild(CT.dom.node(CT.parse.url2link(d.website,
                        "Official Website")));
                }
                n.appendChild(dnode);
            }

            var hasDescription = d.description && d.memtype != "leader";
            if (! d.is_new) {
                // description
                if (hasDescription) {
                    var gd = CT.dom.node("", "div", "gmpanel",
                        "gmpanelDescription");
                    var dcontainer = CT.dom.node("", "div",
                        "bordered padded round topmargined");
                    dcontainer.appendChild(CT.dom.node("Description",
                        "div", "big bold blue bottompadded"));
                    dcontainer.appendChild(CT.dom.node(d.description));
                    gd.appendChild(dcontainer);
                    n.appendChild(gd);
                }

                // member list
                //  - leaders first
                //  - leaders can appoint new leaders from membership
                var buttonnode = CT.dom.node("", "div", "right");
                var lnode = CT.dom.node();
                var mnode = CT.dom.node();
                var memcontainer = CT.dom.node("", "div", "h200 scrolly fullwidth bordered");
                var memnode = CT.dom.node("", "div", "bordered padded round topmargined");
                memnode.appendChild(buttonnode);
                memnode.appendChild(CT.dom.node("Roster", "div", "big bold blue bottompadded"));
                memcontainer.appendChild(lnode);
                memcontainer.appendChild(mnode);
                memnode.appendChild(memcontainer);
                var aginvitebutton = CT.dom.button("Invite a Friend to Join the Group");
                memnode.appendChild(aginvitebutton);
                CAN.widget.invite.load("group", uid,
                    aginvitebutton, null, getCurAg);
                var loadMembers = null; // for compilation
                var memberLine = function(k) {
                    if (d.memtype == "leader" && d.members[k] == "member") {
                        mnode.appendChild(CAN.session.uLineAndRight(k,
                            CT.dom.button("Promote to Leader", function() {
                                CT.net.post("/edit", {"eid": uid, "data": {
                                    "key": d.key, "promotemember": k}},
                                    "error promoting member", function() {
                                        d.members[k] = "leader";
                                        loadMembers();
                                    });
                            }, "group")));
                    } else
                        lnode.appendChild(CAN.session.userLine(k, "group"));
                };
                loadMembers = function() {
                    var mems = [];
                    for (var k in d.members)
                        mems.push(k);
                    CT.data.checkAndDo(mems, function() {
                        lnode.innerHTML = mnode.innerHTML = "";
                        for (var k in d.members)
                            memberLine(k);
                    });
                };

                // join/leave buttons
                var loadJoinLeave = function() {
                    buttonnode.innerHTML = "";
                    if (d.memtype) { // leave
                        buttonnode.appendChild(CT.dom.button("Leave", function() {
                            CT.net.post("/edit", {"eid": uid, "data": {
                                "key": d.key, "leavegroup": 1}},
                                "error leaving group", function() {
                                    d.memtype = false;
                                    delete d.members[uid];
                                    loadJoinLeave();
                                    loadMembers();
                                });
                        }));
                    }
                    else { // join
                        buttonnode.appendChild(CT.dom.button("Join", function() {
                            CT.net.post("/edit", {"eid": uid, "data": {
                                "key": d.key, "joingroup": 1}},
                                "error joining group", function() {
                                    d.memtype = d.members[uid] = "member";
                                    loadJoinLeave();
                                    loadMembers();
                                });
                        }));
                    }
                };

                var gm = CT.dom.node("", "div", "gmpanel",
                    "gmpanelRoster");
                gm.appendChild(memnode);
                n.appendChild(gm);
                loadJoinLeave();
                loadMembers();

                var gchat = CT.dom.node("", "div", "gmpanel", "gmpanelChatRoom");
                var gchatbox = CT.dom.node("", "div", "bordered padded round topmargined");
                var linknode = CT.dom.node("", "div", "bottompadded");
                linknode.appendChild(CT.dom.node("Hatch a plan in the official ", "span"));
                linknode.appendChild(CT.dom.link(d.title + " Chat Room",
                    null, "/community.html#!People|" + agkey));
                linknode.appendChild(CT.dom.node("!", "span"));
                var embednode = CT.dom.node();
                embednode.appendChild(CT.dom.node("To add a <b>" + d.title + " Live Chat Widget</b> to your website, simply paste the following code into your html:"));
                embednode.appendChild(CT.dom.node(document.createTextNode('<scr' + 'ipt src="' + CAN.session.DOMAIN + '/lib/chat.js#' + encodeURI(agkey) + '"></scr' + 'ipt>'),
                    "div", "round bordered padded bold breakit topmargined maxwidthoverride"));
                gchatbox.appendChild(CT.dom.node("Chat Room", "div", "big bold blue bottompadded"));
                gchatbox.appendChild(linknode);
                gchatbox.appendChild(embednode);
                gchat.appendChild(gchatbox);
                n.appendChild(gchat);

                // message board
                var gc = CT.dom.node("", "div", "gmpanel",
                    "gmpanelMessageBoard");
                var ccontainer = CT.dom.node("", "div",
                    "bordered padded round topmargined");
                var cnode = CT.dom.node();
                var embednode = CT.dom.node();
                embednode.appendChild(CT.dom.node("To add a <b>" + d.title + " Stream Widget</b> to your website, simply paste the following code into your html:"));
                embednode.appendChild(CT.dom.node(document.createTextNode('<scr' + 'ipt src="' + CAN.session.DOMAIN + '/lib/stream.js#' + encodeURI(agkey) + '"></scr' + 'ipt>'),
                    "div", "round bordered padded bold breakit topmargined maxwidthoverride"));
                CAN.widget.conversation.load(uid, d.conversation, cnode, d.key);
                ccontainer.appendChild(CT.dom.node("Message Board",
                    "div", "big bold blue bottompadded"));
                ccontainer.appendChild(embednode);
                ccontainer.appendChild(CT.dom.node("", "hr"));
                ccontainer.appendChild(cnode);
                gc.appendChild(ccontainer);
                n.appendChild(gc);

                // wiki
                var gw = CT.dom.node("", "div", "gmpanel",
                    "gmpanelWiki");
                var gwcontainer = CT.dom.node("", "div",
                    "bordered padded round topmargined");
                gwcontainer.appendChild(CT.dom.node("Wiki",
                    "div", "big bold blue bottompadded"));
                var wikinode = CT.dom.node();
                gwcontainer.appendChild(wikinode);
                gwcontainer.appendChild(CT.dom.node("", "hr"));
                var embednode = CT.dom.node();
                embednode.appendChild(CT.dom.node("To add a <b>" + d.title + " Wiki Widget</b> to your website, simply paste the following code into your html, inside of the DOM node in which you want the widget:"));
                embednode.appendChild(CT.dom.node(document.createTextNode('<scr' + 'ipt src="' + CAN.session.DOMAIN + '/lib/wiki.js#' + encodeURI(agkey) + '"></scr' + 'ipt>'),
                    "div", "round bordered padded bold breakit topmargined maxwidthoverride"));
                gwcontainer.appendChild(embednode);

                curPage = null;
                var gwtitle = null;
                var gwbody = null;
                var gwitems = CT.dom.id("gwitems");
                gwitems.innerHTML = "";
                var wikiHasChanged = function() {
                    return curPage && (curPage.title != gwtitle.value || curPage.body != gwbody.get());
                };
                var showWiki = function(w) {
                    CT.data.add(w);
                    CT.data.add(w.user);

                    var wtnode = CT.dom.node("", "div",
                        "bordered padded round bottommargined");
                    wtnode.appendChild(CT.dom.node("Title",
                        "div", "big bold blue bottompadded"));
                    gwtitle = CT.dom.field("gwtitle",
                        w.title, "fullwidth");
                    wtnode.appendChild(gwtitle);

                    var wbnode = CT.dom.node("", "div",
                        "bordered padded round bottommargined");
                    wbnode.appendChild(CT.dom.node("Body",
                        "div", "big bold blue bottompadded"));
                    gwbody = CT.dom.textArea("gwbody",
                        w.body, "fullwidth height200");
                    wbnode.appendChild(gwbody);

                    var winode = CT.dom.node("", "div",
                        "bordered padded round bottommargined");
                    winode.appendChild(CT.dom.node("Last Edited By",
                        "div", "big bold blue bottompadded"));
                    winode.appendChild(CAN.session.userLine(w.user.key, "page", true));

                    wikinode.innerHTML = "";
                    wikinode.appendChild(wtnode);
                    wikinode.appendChild(wbnode);
                    wikinode.appendChild(winode);
                    CT.rte.qwiz("gwbody", w.body);
                    CT.panel.selectLister(w.key, curPage && curPage.key || null);
                    curPage = w;

                    wikinode.appendChild(CT.dom.button("Submit", function() {
                        if (!wikiHasChanged())
                            return alert("no changes made!");
                        if (gwtitle.value == "")
                            return alert("title?");
                        var gwbodyval = gwbody.get(true);
                        if (gwbodyval == "")
                            return alert("body?");
                        var pdata = {
                            "key": curPage.key,
                            "wiki": d.wiki,
                            "title": gwtitle.value,
                            "body": gwbodyval,
                            "revision": curPage.revision
                        };

                        CAN.categories.tagAndPost(pdata, function(key) {
                            gwbody.set(gwbodyval);
                            if (curPage.is_new) {
                                curPage = {"body": gwbodyval, "wiki": d.wiki,
                                    "title": gwtitle.value, "key": key, "user": user};
                                CAN.media.loader.newLister(curPage, gwitems, "page",
                                    showWiki, wikiHasChanged);
                            }
                            else {
                                curPage.key = key;
                                curPage.title = gwtitle.value;
                                curPage.body = gwbodyval;
                                curPage.user = user;
                            }
                            alert("success!");
                        });
                    }));
                };
                CAN.media.loader.list(uid, "page", gwitems, showWiki,
                    wikiHasChanged, {"title": "", "body": "",
                    "wiki": d.wiki, "user": user},
                    null, null, {"wiki": d.wiki});
                gw.appendChild(gwcontainer);
                n.appendChild(gw);
            }

            gmain.innerHTML = "";
            gmain.appendChild(n);

            if (d.is_new || d.memtype == "leader")
                CT.rte.wysiwygize("agdescription", true, d.description);

            if (! d.is_new) {
                var agpnames = ["Roster", "Chat Room", "Message Board", "Wiki"];
                if (hasDescription) agpnames.unshift("Description");
                else if (d.memtype == "leader") {
                    agpnames.unshift("Widgets");
                    agpnames.unshift("Newsletter");
                    agpnames.unshift("Group Editor");
                }
                CT.panel.load(agpnames, true, "gm");
                d.memtype == "leader" && loadNewsletterLogic("gm", d.key);
            }

            CT.panel.selectLister(d.key, agcur && agcur.key || null);
            agcur = d;
        };
        var agWhichNode = function(d) {
            if (!d || d.memtype)
                return yourgroups;
            return moregroups;
        };
        CAN.media.loader.list(uid, "group", null, agShow, agHasChanged,
            {"title": "", "blurb": "", "description": "",
            "website": "", "style": ""}, agWhichNode, function() {
                if (moregroups.innerHTML != "")
                    CT.dom.id("moreactiongroups").style.display = "block";
                if (hashsub)
                    CT.dom.id("ll" + CAN.cookie.flipReverse(hashsub)).firstChild.onclick();
            });

        if (user.role.indexOf("greg") != -1) {
            var gdelgroup = CT.dom.id("gdelgroup");
            gdelgroup.onclick = function() {
                if (agcur == null || agcur.is_new)
                    return alert("This group is unsaved, and cannot be deleted.");
                if (! confirm("Are you sure you want to delete this Action Group? No take backs!"))
                    return;
                CT.net.post("/edit", {"eid": uid, "data": {"key": agcur.key,
                    "delete": 1}}, "error deleting group", function() {
                        var gnode = CT.dom.id("ll" + agcur.key);
                        gnode.parentNode.removeChild(gnode);
                        agcur = null;
                        CT.dom.id("llgroup").firstChild.onclick();
                    });
            };
            CT.dom.showHide(gdelgroup.parentNode);
        }
    };

    // cases
    loaders["cases"] = function() {
        if (loaded["cases"])
            return;
        loaded["cases"] = true;

        var curCase = null;
        var docForm = null;
        var tin = CT.dom.field(null, null, "fullwidth");
        CT.dom.id("casetitle").appendChild(tin);
        var bin = CT.dom.textArea("newcaseblurb");
        var casePDF = CT.dom.id("casePDF");
        var caseStatus = CT.dom.id("caseStatus");
        CT.dom.id("caseblurb").appendChild(bin);
        CT.rte.wysiwygize("newcaseblurb", true);

        var setStatus = function(msg) {
            caseStatus.innerHTML = msg || "";
        };
        var clearStatus = function() {
            caseStatus.innerHTML = "";
        };
        var viewPDF = function(d) {
            casePDF.innerHTML = "";
            casePDF.appendChild(CT.dom.node("PDF", "div", "big bold blue"));
            if (d.hasDoc) {
                casePDF.appendChild(CT.dom.node("Current PDF: ", "span"));
                // "ref" stands for "reference" ;)
                var caseLink = CT.dom.link(d.title, null, "/refDoc?key=" + d.key,
                    null, "reflink" + d.key);
                caseLink.target = "_blank";
                casePDF.appendChild(caseLink);
            }

            casePDF.appendChild(CT.dom.node("Upload New PDF: "));
            docForm = CT.upload.form(uid);
            casePDF.appendChild(docForm);
        };

        var showCase = function(d) {
            tin.value = d.title;
            bin.set(d.blurb);
            viewPDF(d);
            CT.panel.selectLister(d.key, curCase && curCase.key || null);
            curCase = d;
        };

        var caseHasChanged = function() {
            if (curCase == null)
                return false;
            return curCase.title != tin.value || curCase.blurb != bin.get() || !!docForm.data.value;
        };

        var caseitems = CT.dom.id("caitems");
        CAN.media.loader.list(uid, "case", caseitems, showCase,
            caseHasChanged, {"title": "", "blurb": "", "hasDoc": false});

        var casereview = CT.dom.id("careview");
        CT.dom.id("casesubmit").onclick = function() {
            if (!caseHasChanged())
                return alert("No changes made!");
            if (tin.value == "")
                return alert("title?");
            var caseblurb = bin.get();
            if (caseblurb == "")
                return alert("blurb?");
            var pdata = {"key": curCase.key, "title": tin.value, "blurb": caseblurb};
            casereview.innerHTML = "";
            casereview.appendChild(CAN.media.cases.basic(pdata));
            casereview.appendChild(CT.dom.button("Really Submit", function() {
                casereview.style.display = "none";
                CAN.categories.tagAndPost(pdata, function(key) {
                    if (curCase.is_new) {
                        curCase = {"blurb": caseblurb,
                            "title": tin.value, "key": key};
                        CAN.media.loader.newLister(curCase, caseitems, "case",
                            showCase, caseHasChanged);
                    }
                    else {
                        curCase.title = tin.value;
                        curCase.blurb = caseblurb;
                    }
                    if (docForm.data.value) {
                        docForm.key.value = curCase.key;
                        setStatus("uploading pdf");
                        CT.upload.submit(docForm, function() {
                            docForm.data.value = "";
                            curCase.hasDoc = true;
                            viewPDF(curCase);
                            setStatus("done");
                        }, function(err) {
                            setStatus("failed to upload pdf! " + err);
                        });
                    }
                    else {
                        alert("success!");
                        setStatus("done");
                    }
                }, clearStatus);
            }));
            casereview.appendChild(CT.dom.button("Cancel", function() {
                casereview.style.display = "none";
            }));
            casereview.style.display = "block";
        };
    };

    // opinions and ideas
    loaders["opinions_and_ideas"] = function() {
        if (loaded["opinions_and_ideas"])
            return;
        loaded["opinions_and_ideas"] = true;

        var curPP = null;
        var tin = CT.dom.field(null, null, "fullwidth");
        CT.dom.id("oititle").appendChild(tin);
        var bin = CT.dom.textArea("opinionideabody");
        CT.dom.id("oibody").appendChild(bin);
        var cactive = CT.dom.id("oiconversation");
        CT.rte.wysiwygize("opinionideabody", true);

        var showPP = function(d) {
            tin.value = d.title;
            bin.set(d.body);
            cactive.checked = d.conversation_active;

            CT.panel.selectLister(d.key, curPP && curPP.key || null);
            curPP = d;
        };

        var ppHasChanged = function() {
            if (curPP == null)
                return false;
            return curPP.title != tin.value || curPP.body != bin.get() || curPP.conversation_active != cactive.checked;
        };

        var ppitems = CT.dom.id("oiitems");
        CAN.media.loader.list(uid, "opinion", ppitems, showPP,
            ppHasChanged, {"title": "", "body": "", "conversation_active": true});

        var opreview = CT.dom.id("opreview");
        CT.dom.id("oisubmit").onclick = function() {
            if (!ppHasChanged())
                return alert("No changes made!");
            if (tin.value == "")
                return alert("title?");
            var ppbody = bin.get();
            if (ppbody == "")
                return alert("body?");
            var pdata = {"key": curPP.key, "title": tin.value, "body": ppbody};
            opreview.innerHTML = "";
            opreview.appendChild(CAN.media.opinion.build(pdata));
            opreview.appendChild(CT.dom.button("Really Submit", function() {
                opreview.style.display = "none";
                pdata.conversation_active = cactive.checked;
                CAN.categories.tagAndPost(pdata, function(key) {
                    if (curPP.is_new) {
                        curPP = {"body": ppbody, "title": tin.value,
                            "key": key, "conversation_active": cactive.checked};
                        CAN.media.loader.newLister(curPP, ppitems, "opinion",
                            showPP, ppHasChanged);
                    }
                    else {
                        curPP.title = tin.value;
                        curPP.body = ppbody;
                    }
                    alert("success!");
                });
            }));
            opreview.appendChild(CT.dom.button("Cancel", function() {
                opreview.style.display = "none";
            }));
            opreview.style.display = "block";
        };
    };

    // position papers!
    loaders["position_papers"] = function() {
        if (loaded["position_papers"])
            return;
        loaded["position_papers"] = true;

        var curPP = null;
        var tin = CT.dom.field(null, null, "fullwidth");
        CT.dom.id("pptitle").appendChild(tin);
        var bin = CT.dom.textArea("positionpaperbody");
        CT.dom.id("ppbody").appendChild(bin);
        CT.rte.wysiwygize("positionpaperbody", true);

        var showPP = function(d) {
            tin.value = d.title;
            bin.set(d.body);

            CT.panel.selectLister(d.key, curPP && curPP.key || null);
            curPP = d;
        };

        var ppHasChanged = function() {
            if (curPP == null)
                return false;
            return curPP.title != tin.value || curPP.body != bin.get();
        };

        var ppitems = CT.dom.id("ppitems");
        CAN.media.loader.list(uid, "paper", ppitems, showPP,
            ppHasChanged, {"title": "", "body": ""});

        var pppreview = CT.dom.id("pppreview");
        CT.dom.id("ppsubmit").onclick = function() {
            if (!ppHasChanged())
                return alert("No changes made!");
            if (tin.value == "")
                return alert("title?");
            var ppbody = bin.get();
            if (ppbody == "")
                return alert("body?");
            var pdata = {"key": curPP.key, 
                "title": tin.value, "body": ppbody};
            pppreview.innerHTML = "";
            pppreview.appendChild(CAN.media.paper.build(pdata));
            pppreview.appendChild(CT.dom.button("Really Submit", function() {
                pppreview.style.display = "none";
                CAN.categories.tagAndPost(pdata, function(key) {
                    if (curPP.is_new) {
                        curPP = {"key": key,
                            "title": tin.value, "body": ppbody};
                        CAN.media.loader.newLister(curPP, ppitems, "paper",
                            showPP, ppHasChanged);
                    }
                    else {
                        curPP.title = tin.value;
                        curPP.body = ppbody;
                    }
                    alert("success!");
                });
            }));
            pppreview.appendChild(CT.dom.button("Cancel", function() {
                pppreview.style.display = "none";
            }));
            pppreview.style.display = "block";
        };
    };

    // referenda editing for non-lawyers
    loaders["referenda"] = function() {
        if (loaded["referenda"])
            return;
        loaded["referenda"] = true;

        var user = CT.data.get(uid);
        var tit = CT.dom.field(null, null, "fullwidth");
        CT.dom.id("refsubtitle").appendChild(tit);
        var jur = CT.dom.select(["United States",
            user.zipcode.state, user.zipcode.city]);
//        var jur = newField(null, null, "fullwidth");
        CT.dom.id("refsubjurisdiction").appendChild(jur);
        var sum = CT.dom.textArea("refsubsuminput");
        CT.dom.id("refsubsummary").appendChild(sum);
        CT.rte.wysiwygize("refsubsuminput", true);

        var refreview = CT.dom.id("refreview");
        CT.dom.id("refsubbutton").onclick = function() {
            if (tit.value == "")
                return alert("title?");
            var sval = sum.get();
            if (sval == "")
                return alert("summary?");
            var pdata = {"title": tit.value, "summary": sval,
                "key": "refnonlawyer", "jurisdiction": jur.value};
            refreview.innerHTML = "";
            CAN.media.loader.args.referenda = { "nolink": true };
            refreview.appendChild(CAN.media.referenda.build(pdata));
            refreview.appendChild(CT.dom.button("Really Submit", function() {
                refreview.style.display = "none";
                CT.net.post("/edit", {"eid": uid, "data": pdata},
                    "error submitting referendum", function() {
                        tit.value = "";
                        jur.value = "";
                        sum.set("");
                        alert("Your proposed referendum is awaiting approval by the moderator. Thank you for your participation, and your patience.");
                    });
            }));
            refreview.appendChild(CT.dom.button("Cancel", function() {
                refreview.style.display = "none";
            }));
            refreview.style.display = "block";
        };
    };

    // referenda editing
    loaders["lawyer"] = function() {
        if (loaded["lawyer"])
            return;
        loaded["lawyer"] = true;

        var docForm = null;
        var currentRef = null;
        var ALLREFS = CT.dom.id("referenda");
        var REFCRITS = CT.dom.id("refCritiques");
        var REFTITLE = CT.dom.id("refTitle");
        var REFPDF = CT.dom.id("refPdf");
        var REFBLURB = CT.dom.id("refBlurb");
        var REFSUMMARY = CT.dom.id("refSummary");
        var REFSTATUS = CT.dom.id("refStatus");
        var REFJURISDICTION = CT.dom.id("refJurisdiction");
        var REFISREADY = CT.dom.id("refIsReady");
        var setStatus = function(msg) {
            REFSTATUS.innerHTML = msg || "";
        };
        var clearStatus = function() {
            REFSTATUS.innerHTML = "";
        };
        var currentChanges = function() {
            if (currentRef == null)
                return false;
            return currentRef.title != CT.dom.id("refTitleInput").value || currentRef.blurb != CT.dom.id("refBlurbInput").value || currentRef.summary != CT.dom.id("refSummaryInput").get() || !!docForm.data.value || CT.dom.id("refisreadycheckbox").checked != currentRef.is_ready || CT.dom.id("refJurisdictionInput").value != currentRef.jurisdiction;
        };
        var viewPDF = function(ref) {
            REFPDF.innerHTML = "";
            REFPDF.appendChild(CT.dom.node("PDF", "div", "big bold blue"));
            if (ref.hasDoc) {
                REFPDF.appendChild(CT.dom.node("Current PDF: ", "span"));
                var refLink = CT.dom.link(ref.title, null,
                    "/refDoc?key=" + ref.key, null, "reflink" + ref.key);
                refLink.target = "_blank";
                REFPDF.appendChild(refLink);
            }

            REFPDF.appendChild(CT.dom.node("Upload New PDF: "));
            docForm = CT.upload.form(uid);
            REFPDF.appendChild(docForm);
        };
        var viewRef = null; // for avoiding compilation problems
        var lawreview = CT.dom.id("lawreview");
        var submitref = CT.dom.id("refSaveChanges").onclick = function() {
            if (! currentChanges())
                return alert("No changes made!");
            var rtitle = CT.dom.id("refTitleInput");
            var rblurb = CT.dom.id("refBlurbInput");
            var rsummary = CT.dom.id("refSummaryInput");
            var rjurisdiction = CT.dom.id("refJurisdictionInput");
            var risready = CT.dom.id("refisreadycheckbox");
            //rblurb.value = replaceUnicode(rblurb.value);
            var rsum = rsummary.get();
            //rsummary.value = replaceUnicode(rsummary.value);

            var pdata = {"title": rtitle.value,
                "blurb": rblurb.value, "summary": rsum,
                "key": currentRef.key, "is_ready": risready.checked,
                "jurisdiction": rjurisdiction.value};
            lawreview.innerHTML = "";
            CAN.media.loader.args.referenda = { "nolink": true };
            lawreview.appendChild(CAN.media.referenda.build(pdata));
            lawreview.appendChild(CT.dom.button("Really Submit", function() {
                lawreview.style.display = "none";
                setStatus("submitting referendum");
                CT.net.post("/edit", {"eid": uid, "data": pdata},
                    "error submitting referendum", function(key) {
                    clearStatus();
                    if (currentRef.is_new) {
                        currentRef = {"key": key,
                            "title": rtitle.value,
                            "blurb": rblurb.value,
                            "summary": rsum,
                            "jurisdiction": rjurisdiction.value,
                            "is_ready": risready.checked};
                        CAN.media.loader.newLister(currentRef, ALLREFS,
                            "referenda", viewRef, currentChanges);
                    }
                    else {
                        if (currentRef.title != rtitle.value) {
                            CT.dom.id("ll" + key).firstChild.innerHTML = rtitle.value;
                            if (currentRef.hasDoc)
                                CT.dom.id("reflink" + key).innerHTML = rtitle.value;
                        }
                        currentRef.title = rtitle.value;
                        currentRef.blurb = rblurb.value;
                        currentRef.summary = rsum;
                        currentRef.jurisdiction = rjurisdiction.value;
                        currentRef.is_ready = risready.checked;
                    }

                    if (docForm.data.value) {
                        docForm.key.value = currentRef.key;
                        setStatus("uploading pdf");
                        CT.upload.submit(docForm, function() {
                            docForm.data.value = "";
                            currentRef.hasDoc = true;
                            viewPDF(currentRef);
                            setStatus("done");
                        }, function() {
                            setStatus("failed to upload pdf!");
                        });
                    }
                    else {
                        alert("success!");
                        setStatus("done");
                    }
                }, clearStatus);
            }));
            lawreview.appendChild(CT.dom.button("Cancel", function() {
                lawreview.style.display = "none";
            }));
            lawreview.style.display = "block";
        };
        viewRef = function(ref) {
            if (ref.critiques) {
                REFCRITS.innerHTML = "";
                REFCRITS.appendChild(CT.dom.node("Critique", "div", "big bold blue"));
                var rcnode = CT.dom.node();
                REFCRITS.appendChild(rcnode);
                CAN.media.moderation.listCritiques(ref, rcnode, "referendum");
                REFCRITS.style.display = "block";
            }
            else
                REFCRITS.style.display = "none";

            REFTITLE.innerHTML = "";
            REFTITLE.appendChild(CT.dom.node("Title", "div", "big bold blue"));
            REFTITLE.appendChild(CT.dom.field("refTitleInput", ref.title, "fullwidth"));

            viewPDF(ref);

            REFBLURB.innerHTML = "";
            REFBLURB.appendChild(CT.dom.node("Summary", "div", "big bold blue"));
            CT.dom.richInput(REFBLURB, "refBlurbInput", null, ref.blurb);
            REFBLURB.appendChild(CT.dom.node("", "div", "clearnode"));

            REFSUMMARY.innerHTML = "";
            REFSUMMARY.appendChild(CT.dom.node("Text of Law", "div", "big bold blue"));
            var rsi = CT.dom.node("", "textarea", "fullwidth height200", "refSummaryInput");
            REFSUMMARY.appendChild(rsi);
            CT.rte.wysiwygize("refSummaryInput", true, ref.summary, null, submitref);

            var user = CT.data.get(uid);
            REFJURISDICTION.innerHTML = "";
            REFJURISDICTION.appendChild(CT.dom.node("Jurisdiction", "div", "big bold blue"));
            var rjz = ["World", "United States",
                user.zipcode.state, user.zipcode.city, "Other"];
            var rjv = ref.jurisdiction;
            var rji = CT.dom.field("refJurisdictionInput", rjv, "hidden");
            if (rjz.indexOf(rjv) == -1) {
                rjv = "Other";
                rji.style.display = "inline";
            }
            var rjs = CT.dom.select(rjz, null, "refJurisdictionSelect", rjv);
            rjs.onchange = function() {
                if (rjs.value == "Other") {
                    rji.value = "";
                    rji.style.display = "inline";
                }
                else {
                    rji.style.display = "none";
                    rji.value = rjs.value;
                }
            }
            REFJURISDICTION.appendChild(rjs);
            REFJURISDICTION.appendChild(rji);

            REFISREADY.innerHTML = "";
            REFISREADY.appendChild(CT.dom.node("Deploy", "div", "big bold blue"));
            REFISREADY.appendChild(CT.dom.node("Is this referendum ready for the voters?"));
            REFISREADY.appendChild(CT.dom.checkboxAndLabel("refisready", ref.is_ready,
                "Is Ready"));

            if (currentRef)
                CT.dom.id("ll" + currentRef.key).className = "";
            CT.dom.id("ll" + ref.key).className = "activetab";

            currentRef = ref;
        };

        CAN.media.loader.list(uid, "referenda", ALLREFS, viewRef,
            currentChanges, {"title": "", "blurb": "",
                "summary": "", "jurisdiction": "World",
                "hasDoc": false, "is_ready": false});
    };
};
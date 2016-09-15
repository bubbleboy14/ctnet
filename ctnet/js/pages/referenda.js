CT.require("CT.all");
CT.require("CT.rte");
CT.require("CAN.all");

onload = function() {
    var curRef = null;
    var loadRefs; // for compilation
    var uid = CAN.session.isLoggedIn(function() {
        loadRefs();
    });

    CAN.widget.share.currentShareName = "referendum";
    CAN.widget.share.shareSub("referenda");
    CAN.media.cases.widget(uid);

    var refInviteButton = CT.dom.id("refinvite");
    if (uid && uid != "nouid") {
        CAN.widget.invite.load("referendum", uid, refInviteButton,
            null, function() { return curRef; }, "consider");
        CAN.widget.slider.initUpdate(uid, function() { return curRef.key; });
    }
    else
        CAN.frame.clickToLogin(refInviteButton);

    var bubbles = {
        "read": "Read the full text of this user-submitted referendum.",
        "branch": "Like what you see, but have some reservations? Modify this referendum as you see fit, and let the community decide what makes the most sense!",
        "comment": "See what other users have to say about this referendum, and join the conversation. Remember that your unique perspective is what makes collaborative referenda so valuable. Hold nothing back!",
        "download": "Download the full text of this user-submitted referendum.",
        "login": "Log in to your free, secure CAN account and craft a new law today!",
        "result": "How did you vote? How did others vote? Check it out!",
        "vote": "Make your opinion count - vote today!"
    };
    var REFLISTS = {
        "can": CT.dom.id("canreflist"),
        "user": CT.dom.id("userreflist")
    };
    var REFAREA = CT.dom.id("refarea");
    var LCNODE = CT.dom.id("lcnode");
    var castVote = null;
    var setVoteArea = function(ref, shownow, customvotearea) {
        var votearea = customvotearea || CT.dom.id("votearea");
        if (votearea == null) {
            votearea = CT.dom.node("", "div", "topmargined", "votearea");
            REFAREA.appendChild(votearea);
        }
        else
            votearea.innerHTML = "";
        if (uid == null) {
            CAN.frame.setInfoBubble(votearea, bubbles.login);
            var loginimg = CT.dom.node(CT.dom.img("/img/referenda/login.png"),
                "div", "lfloat shiftup pointer");
            loginimg.onclick = function() {
                document.location = "/login.html";
            };
            votearea.appendChild(loginimg);
            return votearea.appendChild(CT.dom.link("Login to Vote",
                null, "/login.html", "gray lmargined"));
        }
        if (ref.is_ready == false)
            return votearea.appendChild(CT.dom.node("This referendum isn't ready for voting yet, so now's your chance to get your changes in before it solidifies. Explore the branches, propose your own, check back for updates, and stay in the conversation.", "div", "bordered padded round"));
        var voteresults = CT.dom.node("", "div", "hidden bordered padded round");
        var votelinks = CT.dom.node();
        if (ref.vote) {
            CAN.frame.setInfoBubble(votelinks, bubbles.result);
            voteresults.className += " topmargined";
            votelinks.className = "bottompadded";
            var resimg = CT.dom.node(CT.dom.img("/img/referenda/results.png"),
                "div", "lfloat shiftup pointer");
            var reslink = CT.dom.link("View Results");
            reslink.className = "gray lmargined";
            resimg.onclick = reslink.onclick = function() {
                CT.dom.showHide(voteresults);
            };
            votelinks.appendChild(resimg);
            votelinks.appendChild(reslink);
            voteresults.appendChild(CT.dom.node("Yes: <b>"
                + ref.ye + "</b>", "div", "green"));
            voteresults.appendChild(CT.dom.node("No: <b>"
                + ref.nay + "</b>", "div", "red"));
            voteresults.appendChild(CT.dom.node("You voted: <b>"
                + ref.vote + "</b>", "div", "black"));
        }
        else {
            CAN.frame.setInfoBubble(votelinks, bubbles.vote);
            votelinks.appendChild(CT.dom.img("/img/buttons/VOTE_BUTTON.gif", null, function() {
                CT.dom.showHide(voteresults); }));
            if (!customvotearea) {
                var tchanode = CT.dom.node();
                voteresults.appendChild(tchanode);
                CT.recaptcha.build(CAN.config.RECAPTCHA_KEY, tchanode);
            }
            voteresults.appendChild(CT.dom.img("/img/buttons/Vote_Yes_Button.gif", null, function() {
                castVote(ref, true, null, customvotearea); }));
            voteresults.appendChild(CT.dom.img("/img/buttons/Vote_No_Button.gif", null, function() {
                castVote(ref, false, null, customvotearea); }));
        }
        if (shownow)
            voteresults.style.display = "block";
        votearea.appendChild(votelinks);
        votearea.appendChild(voteresults);
    };
    var jurisdictionLink = null; // for compilation
    var setTitle = function(ref) {
        var titleline = CT.dom.id("titleline");
        if (titleline == null) {
            REFAREA.appendChild(CT.dom.node(CT.dom.button("Post Referendum",
                function() {
                    location = (uid && uid != "nouid")
                        ? "/participate.html#Referenda"
                        : "/login.html";
                }), "div", "right"));
            titleline = CT.dom.node("", "div", "graybottom", "titleline");
            REFAREA.appendChild(titleline);
        }
        titleline.innerHTML = "";
        titleline.appendChild(CT.dom.node(ref.title,
            "div", "bigger bold red"));
        if (ref.is_ready)
            titleline.firstChild.innerHTML += " - " + (ref.ye * 100 / (ref.ye
                + ref.nay)).toString().slice(0,5) + "% Approval";
        titleline.style.paddingBottom = "0px";
        var byline = CT.dom.node("", "div", "small");
        if (ref.is_user) {
            var u = ref.user;
            byline.appendChild(CT.dom.node("proposed by ", "span", "gray"));
            byline.appendChild(CT.dom.link(u.firstName + " " + u.lastName, null,
                "/profile.html?u=" + CAN.cookie.flipReverse(u.key), "gray"));
            byline.appendChild(CT.dom.node(" for ", "span", "gray"));
        }
        else // glaser refs
            byline.appendChild(CT.dom.node("proposed for ", "span", "gray"));
        byline.appendChild(jurisdictionLink(ref.jurisdiction, "gray"));
        titleline.appendChild(byline);
    };
    castVote = function(ref, opinion, pdata, customvotearea) { // set to null higher up to avoid compilation issues
        if (!pdata) {
            if (!customvotearea) {
                var captchaResponse = Recaptcha.get_response();
                if (captchaResponse.length < 3)
                    return alert("don't forget to fill in the CAPTCHA! you are human, right?");
            }
            pdata = {"key": ref.key, "uid": uid,
                "opinion": opinion, "cresponse": captchaResponse,
                "cchallenge": Recaptcha.get_challenge()};
        }
        CT.net.post("/vote", pdata, "error casting vote",
            function() {
                if (opinion) {
                    ref.ye += 1;
                    ref.vote = "yes";
                }
                else {
                    ref.nay += 1;
                    ref.vote = "no";
                }
                setVoteArea(ref, true, customvotearea);
                setTitle(ref);
            }, function(e) {
                if (e.slice(0,2) == "SQ") {
                    pdata.squestion = e.slice(4);
                    pdata.sanswer = prompt("We don't recognize your IP address. "+pdata.squestion);
                    if (pdata.sanswer)
                        castVote(ref, opinion, pdata);
                }
                else if (e == "Unrecognized IP and no security questions!") {
                    alert(e);
                    document.location = "/security.html";
                }
                else {
                    alert(e);
                    document.location = "/login.html";
                }
            });
    };
    var verticalAlign = function() {
        REFAREA.style.height = (LCNODE.clientHeight - 50) + "px";
    };

    // collaboration stuff
    var currentBranch, branchtitle, branchbody, branchrationale,
        branchesnode = CT.dom.id("branchesnode"),
        modeSwapper = CT.dom.id("branchModeSwapper"),
        branchDeleter = CT.dom.id("branchDeleter"),
        editnode, diffnode, diffbody, diffrationale, sigline, votearea,
        editbranch, branchViewModes = { "diff": "edit", "edit": "diff" };
    modeSwapper.onclick = function() {
        CT.dom.showHideSet([diffnode, editnode]);
        modeSwapper.innerHTML = "Switch To "
            + CT.parse.capitalize(modeSwapper.mode) + " Mode";
        modeSwapper.mode = branchViewModes[modeSwapper.mode];
    };
    branchDeleter.onclick = function() {
        if (! confirm("Are you sure you want to delete this? No takebacks!"))
            return;
        CT.net.post("/edit", {"eid": uid,
            "data": {"key": currentBranch.key, "delete": 1}},
            "error deleting element", function() {
                var oldLink = CT.dom.id("ll" + currentBranch.key);
                oldLink.parentNode.removeChild(oldLink);
                currentBranch = null;
                CT.dom.id("llbranch").firstChild.onclick();
            });
    };
    var canEditBranch = function() {
        return currentBranch && currentBranch.user
            && currentBranch.user.key == uid;
    };
    var forceMode = function(mode) {
        modeSwapper.style.display = "none";
        if (modeSwapper.mode != mode) modeSwapper.onclick();
    };
    var cleanDiff = function() {
        return diffString(curRef.summary, currentBranch.body)
            .replace(/&lt;em&gt;/g, "")        // "<em>"
            .replace(/&lt;\/em&gt;/g, "")      // "</em>"
            .replace(/&lt;strong&gt;/g, "")    // "<strong>"
            .replace(/&lt;\/strong&gt;/g, "")  // "</strong>"
            .replace(/&lt;p&gt;/g, "<br><br>") // "<p>"
            .replace(/&lt;\/p&gt;/g, "")       // "</p>"
            .replace(/&lt;br /g, "")           // "<br "
            .replace(/\/&gt;/g, "")            // "/>"
            .replace(/&amp;nbsp;/g, "")        // "&nbsp;"
            .replace(/&amp;lsquo;/g, "'")      // "&lsquo;"
            .replace(/&amp;rsquo;/g, "'");     // "&rsquo;"
    };
    var setDiffNodes = function() {
        diffbody.innerHTML = cleanDiff();
        diffrationale.innerHTML = currentBranch.rationale.replace(/\n/g, "<br>");
        setVoteArea(currentBranch, false, votearea);
    };
    var showBranch = function(branch) {
        if (uid && !branchbody.set)
            return setTimeout(showBranch, 200, branch);
        CAN.widget.conversation.setCommentPrefix(branch.is_new
            ? null : branch.title);
        CT.data.add(branch);
        if (branch.user) { // else is anon new
            CT.data.add(branch.user);
            sigline.refresh(branch.user);
        }
        CT.panel.selectLister(branch.key, currentBranch && currentBranch.key || null);
        currentBranch = branch;
        var canedit = canEditBranch();

        // diff view
        setDiffNodes();

        // edit view
        if (branch.is_new)
            forceMode("edit");
        if (canedit) {
            modeSwapper.style.display = branch.is_new ? "none" : "inline";
            CT.dom.setFieldValue(branch.title, "branchtitle");
            CT.dom.setFieldValue(branch.rationale, "branchrationale");
            branchrationale.onkeyup();
            branchbody.set(branch.body); // editbranch not necessary (?)
        } else if (!branch.is_new)
            forceMode("diff");

        // deletion
        if (branch.is_new)
            branchDeleter.style.display = "none";
        else if (canedit)
            branchDeleter.style.display = "inline";
        else if (uid) ifGreg(uid,
            function () { branchDeleter.style.display = "inline"; },
            function () { branchDeleter.style.display = "none"; });
    };
    var branchHasChanged = function() {
        if (!canEditBranch()) return false;
        return currentBranch.title != CT.dom.getFieldValue("branchtitle") ||
            currentBranch.body != branchbody.get() ||
            currentBranch.rationale != CT.dom.getFieldValue("branchrationale");
    };
    editbranch = function() { // var'ed above for compiler's sake ;)
        if (!branchHasChanged())
            return alert("no changes made!");
        var ratval = CT.dom.getFieldValue("branchrationale");
        var bodyval = branchbody.get(true);
        if (!branchtitle.value)
            return alert("What will you call this branch?");
        if (!ratval)
            return alert("Please provide a rationale for these changes");
        if (!bodyval)
            return alert("You can't just delete the whole thing :)");
        var pdata = {
            "key": currentBranch.key,
            "referendum": currentBranch.referendum,
            "title": branchtitle.value,
            "body": bodyval,
            "rationale": ratval
        };
        CT.net.post("/edit", {"eid": uid, "data": pdata},
            "error submitting referendum branch", function(key) {
                branchbody.set(bodyval);
                if (currentBranch.is_new) {
                    currentBranch = {
                        "referendum": pdata.referendum,
                        "title": pdata.title,
                        "body": pdata.body,
                        "rationale": pdata.rationale,
                        "key": key,
                        "user": CT.data.get(uid)
                    };
                    CT.panel.add(currentBranch, branchesnode,
                        "branch", showBranch, branchHasChanged);
                }
                else {
                    if (currentBranch.title != pdata.title)
                        CT.dom.id("ll" + key).firstChild.innerHTML = pdata.title;
                    currentBranch.title = pdata.title;
                    currentBranch.body = pdata.body;
                    currentBranch.rationale = pdata.rationale;
                    setDiffNodes();
                }
                alert("success!");
            });
    };
    var editView = function(ref) {
        if (!uid) {
            editnode = CT.dom.node(CT.dom.link("Log in to customize this referendum!",
                null, "/login.html"), "div", "hidden");
            return editnode;
        }

        var titlenode = CT.dom.node("", "div",
            "bordered padded round bottommargined");
        titlenode.appendChild(CT.dom.node("Title", "div", "big bold blue"));
        titlenode.appendChild(CT.dom.node("Provide a name for this branch."));
        branchtitle = CT.dom.field("branchtitle", null, "fullwidth");
        titlenode.appendChild(branchtitle);
        CT.dom.blurField(branchtitle, ["What is the name of this branch?",
            "What will you call this branch?"]);

        var ratnode = CT.dom.node("", "div",
            "bordered padded round bottommargined");
        ratnode.appendChild(CT.dom.node("Rationale", "div", "big bold blue"));
        ratnode.appendChild(CT.dom.node("Explain the reasoning behind your modifications."));
        var ratbox = CT.dom.node();
        branchrationale = CT.dom.richInput(ratbox, "branchrationale",
            null, null, null, ["Why are you making these changes?",
            "Why is this an improvement?", "What's your rationale?"]);
        ratnode.appendChild(ratbox);

        var textnode = CT.dom.node("", "div",
            "bordered padded round bottommargined");
        textnode.appendChild(CT.dom.node("Text", "div", "big bold blue"));
        textnode.appendChild(CT.dom.node("Make your changes below."));
        branchbody = CT.dom.textArea("branchbody", ref.summary);
        textnode.appendChild(branchbody);
        CT.rte.qwiz("branchbody", ref.summary);

        editnode = CT.dom.node("", "div", "hidden");
        editnode.appendChild(titlenode);
        editnode.appendChild(ratnode);
        editnode.appendChild(textnode);

        editnode.appendChild(CT.dom.node(CT.dom.button("Submit", editbranch)));
        return editnode;
    };
    var diffView = function() {
        var ratnode = CT.dom.node("", "div",
            "bordered padded round bottommargined");
        ratnode.appendChild(CT.dom.node("Rationale", "div", "big bold blue"));
        diffrationale = CT.dom.node();
        ratnode.appendChild(diffrationale);

        var textnode = CT.dom.node("", "div",
            "bordered padded round bottommargined");
        sigline = CAN.session.firstLastLink();
        textnode.appendChild(CT.dom.node([CT.dom.node("proposed by ",
            "b"), sigline], "div", "small right lpadded"));
        textnode.appendChild(CT.dom.node("Modifications", "div", "big bold blue"));
        diffbody = CT.dom.node();
        textnode.appendChild(diffbody);

        votearea = CT.dom.node();

        diffnode = CT.dom.node("", "div", "garamond");
        diffnode.appendChild(ratnode);
        diffnode.appendChild(textnode);
        diffnode.appendChild(votearea);

        return diffnode;
    };
    var collaborationNode = function(ref) {
        modeSwapper.mode = "diff";
        var collabnode = CT.dom.node("", "div", "hidden");
        collabnode.appendChild(diffView());
        collabnode.appendChild(editView(ref));
        collabnode.appendChild(CT.dom.node("", "hr"));

        CAN.media.loader.list(uid, "branch", branchesnode,
            showBranch, branchHasChanged, {
                "user": CT.data.get(uid),
                "referendum": ref.key,
                "body": ref.summary,
                "title": "",
                "rationale": ""
            }, null, null, {"referendum": ref.key});
        return collabnode;
    };

    var viewRef = function(ref, branch) {
        curRef = ref;
        currentBranch = null;
        REFAREA.innerHTML = branchesnode.innerHTML = "";
        branchesnode.parentNode.style.display = "none";
        setTitle(ref);
        var blurbnode = CT.dom.node(ref.blurb);
        REFAREA.appendChild(blurbnode);

        var hiders = [blurbnode];

        var branchline = CAN.frame.setInfoBubble(CT.dom.node("", "div",
            "topmargined pointer" + (ref.is_ready ? " hidden" : "")), bubbles.branch);
        var convoshowhide = CAN.frame.setInfoBubble(CT.dom.node("",
            "div", "topmargined pointer"), bubbles.comment);

        if (ref.summary) {
            var readwhole = CAN.frame.setInfoBubble(CT.dom.node("",
                "div", "topmargined pointer"), bubbles.read);
            var infonode = CT.dom.node(ref.summary, "div",
                "garamond hidden bordered padded round big bottommargined");
            var readimg = CT.dom.node(CT.dom.img("/img/referenda/read.png"),
                "div", "lfloat shiftup");
            var readlink = CT.dom.link("Read the Whole Referendum");
            readlink.className = "gray lmargined";
            readwhole.appendChild(readimg);
            readwhole.appendChild(readlink);
            readimg.onclick = readlink.onclick = function() {
                CT.dom.showHideSet([blurbnode, infonode, readwhole]);
            };
            readwhole.appendChild(CT.dom.node("", "div", "clearnode"));
            REFAREA.appendChild(readwhole);
            REFAREA.appendChild(infonode);
            hiders.push(infonode);
            hiders.push(readwhole);
        }

        var branchnode = collaborationNode(ref);
        var branchimg = CT.dom.node(CT.dom.img("/img/referenda/branches.png"),
            "div", "lfloat shiftup");
        var branchlink = CT.dom.link("Explore Branches");
        branchlink.className = "gray lmargined";
        branchline.appendChild(branchimg);
        branchline.appendChild(branchlink);
        hiders.push(branchline);
        branchimg.onclick = branchlink.onclick = function() {
            CT.dom.showHideSet([branchnode, branchesnode.parentNode], true);
            CT.dom.showHideSet(hiders, false, true);
        };
        branchline.appendChild(CT.dom.node("", "div", "clearnode"));
        REFAREA.appendChild(branchline);
        REFAREA.appendChild(branchnode);

        var convonode = CT.dom.node("loading conversation...",
            "div", "hidden small red bordertop bottommargined");
        var cimg = CT.dom.node(CT.dom.img("/img/referenda/comments.png"),
            "div", "lfloat shiftup");
        convoshowhide.appendChild(cimg);
        var ctxt = CT.dom.link("View Comments");
        ctxt.className = "gray lmargined";
        convoshowhide.appendChild(ctxt);
        cimg.onclick = ctxt.onclick = function() {
            if (ctxt.innerHTML == "View Comments") {
                ctxt.innerHTML = "Hide Comments";
                if (convonode.innerHTML == "loading conversation...")
                    CAN.widget.conversation.load(uid, ref.conversation, convonode, ref.key);
                convonode.style.display = "block";
            }
            else {
                ctxt.innerHTML = "View Comments";
                convonode.style.display = "none";
            }
        };
        convoshowhide.appendChild(CT.dom.node("", "div", "clearnode"));
        REFAREA.appendChild(convoshowhide);
        REFAREA.appendChild(convonode);
        if (ref.hasDoc) {
            var docnode = CAN.frame.setInfoBubble(CT.dom.node("",
                "div", "topmargined pointer"), bubbles.download);
            var docimg = CT.dom.node(CT.dom.img("/img/referenda/download.png"),
                "div", "lfloat shiftup");
            docimg.onclick = function() {
                window.open("/refDoc?key="+ref.key);
            };
            docnode.appendChild(docimg);
            docnode.appendChild(CT.dom.link("Download Text of " + ref.title, null,
                "/refDoc?key=" + ref.key, "gray lmargined", "", {"target": "_blank"}));
            docnode.appendChild(CT.dom.node("", "div", "clearnode"));
            REFAREA.appendChild(docnode);
        }

        setVoteArea(ref);
        CT.panel.select(ref.key);
        verticalAlign();
        CAN.widget.share.updateShareItem("referenda", ref.key);

        if (branch && !ref.is_ready) {
            branchlink.onclick();
            showBranch(branch);
        }
    };
    var changeRef = function(ref, branch) {
        if (ref.summary)
            viewRef(ref, branch);
        else
            CT.net.post("/get", {"gtype": "ref", "key": ref.key,
                "uid": uid || "nouid", "is_user": ref.is_user},
                "error retrieving referendum", function(refData) {
                    CT.data.add(refData);
                    viewRef(ref, branch);
                });
    };
    var user = null;
    var refsready = false;
    var jurisdictions = [];
    var s2jurlink = {};
    var newRef = function(ref, rtype) {
        if (rtype == "user")
            ref.is_user = true;
        jurisdictions.push(ref.jurisdiction);
        REFLISTS[rtype].appendChild(CT.dom.node(CT.dom.link(ref.title,
            function() { changeRef(ref); }), "div",
            "sbitem " + ref.jurisdiction.replace(/ /g, ""), "sbitem"+ref.key));
    };
    var jHide = function(cname) {
        cname = (cname || "sbitem").replace(/ /g, "");
        var items = document.getElementsByClassName(cname);
        for (var i = 0; i < items.length; i++) {
            var z = items[i];
            if (z.className.indexOf("hidden") == -1)
                z.className += " hidden";
        }
    };
    var jShow = function(cname) {
        cname = (cname || "sbitem").replace(/ /g, "");
        var items = document.getElementsByClassName(cname);
        for (var i = 0; i < items.length; i++)
            items[i].className = items[i].className.replace(" hidden", "");
    };
    var jSelect = function(cname) {
        CT.panel.select(cname && cname.replace(/ /g, "") || null, "fj");
    };
    var jCountTotal = 0;
    var jCountExceptions = [];
    var jCountLink = function(cname) {
        if (cname == "All")
            return "All (" + CAN.session.settings.all_referenda.length + ")";
        else if (cname == "Other")
            return "(view active)";
        var nsname = (cname || "sbitem").replace(/ /g, "");
        var thiscount = document.getElementsByClassName(nsname).length;
        jCountTotal += thiscount;
        jCountExceptions.push(nsname);
        return cname + " (" + thiscount + ")";
    };
    var noRefsYet = function(cname) {
        REFAREA.innerHTML = "";
        REFAREA.appendChild(CT.dom.node("We don't have any referenda yet for <b>"
            + cname + "</b>. Be the first to ", "span"));
        REFAREA.appendChild(CT.dom.link("submit your own referenda",
            null, "/participate.html#lawyer", "bold"));
        REFAREA.appendChild(CT.dom.node(" today!", "span"));
    };
    var jIsOther = function(cname) {
        for (var i = 0; i < jCountExceptions.length; i++) {
            if (cname.indexOf(jCountExceptions[i]) != -1)
                return false;
        }
        return true;
    };
    var jOthersOnly = function(collection, firstonly) {
        if (collection.length == 0)
            return [];
        if (! jIsOther(collection[0].className))
            return jOthersOnly(Array.prototype.slice.call(collection, 1), firstonly);
        if (! firstonly) {
            for (var i = 1; i < collection.length; i++) {
                if (! jsIsOther(collection[i].className)) {
                    Array.prototype.splice.call(collection, i, i+1);
                    // we recurse here to avoid changing
                    // collection.length mid-iteration
                    return jOthersOnly(collection, firstonly);
                }
            }
        }
        return collection;
    };
    var jViewFirst = function(cname) {
        var thisname = cname == "Other" && "sbitem" || (cname || "sbitem").replace(/ /g, "");
        var collection = document.getElementsByClassName(thisname);
        if (cname == "Other")
            collection = jOthersOnly(collection, true);
        if (collection.length == 0)
            return noRefsYet(cname);
        collection[0].firstChild.onclick();
    };
    jurisdictionLink = function(cname, cclass) {
        return CT.dom.link(jCountLink(cname), function() {
            jHide();
            jShow(cname);
            jSelect(cname);
            jViewFirst(cname);
        }, null, cclass);
    };
    var loadJLinks = function() {
        CAN.session.settings.all_referenda
            = CAN.session.settings.CAN_referenda.concat(CAN.session.settings.user_referenda);
        var jlinks = CT.dom.id("jlinks");
        if (user == "nouser") {
            jlinks.parentNode.style.display = "none";
            return;
        }
        var jurLine = function(cname, pnode) {
            var jlink = jurisdictionLink(cname);
            s2jurlink[cname.replace(/ /g, "").toLowerCase()] = jlink;
            (pnode || jlinks).appendChild(CT.dom.node(jlink,
                "div", "fjitem", "fjitem" + cname.replace(/ /g, "")));
        };
//        jurLine("United States");
//        jurLine(user.zipcode.state);
//        jurLine(user.zipcode.city);
        var osearchfield = CT.dom.field(null, null, "w125");
        jlinks.appendChild(osearchfield);
        var osearchfunc = function() {
            var osearch = osearchfield.value.replace(/ /g, "").toLowerCase();
            if (osearch == "")
                return;
            if (osearch in s2jurlink)
                s2jurlink[osearch].onclick();
            else {
                jSelect("Other");
                noRefsYet(osearchfield.value);
            }
            osearchfield.value = "";
        };
        CT.dom.inputEnterCallback(osearchfield, osearchfunc);
//        osearchfield.onkeyup = function(e) {
//            e = e || window.event;
//            var code = e.keyCode || e.which;
//            if (code == 13 || code == 3)
//                osearchfunc();
//        };
        var jfilterline = CT.dom.node("", "div", "nowrap");
        jfilterline.appendChild(CT.dom.button("Filter", osearchfunc));
        var othernode = CT.dom.node("", "div", "hidden");
        othernode.appendChild(CT.dom.node(CT.dom.link(jCountLink("All"),
            function() {
                jShow();
                jSelect("All");
                jViewFirst();
            }), "div", "fjitem activetab", "fjitemAll"));
//        jurisdictions = uniquify(jurisdictions,
  //          ["United States", user.zipcode.state, user.zipcode.city]);
        jurisdictions = CT.data.uniquify(jurisdictions);
        for (var i = 0; i < jurisdictions.length; i++)
            jurLine(jurisdictions[i], othernode);
        jfilterline.appendChild(CT.dom.node(CT.dom.link(jCountLink("Other"), function() {
            jShow();
//            jHide("United States");
//            jHide(user.zipcode.state);
//            jHide(user.zipcode.city);
            jSelect(othernode.style.display != "block" && "Other" || null);
            jViewFirst(jurisdictions[0]);
            CT.dom.showHide(othernode);
            osearchfield.focus();
        }), "span", "fjitem", "fjitemOther"));
        jlinks.appendChild(jfilterline);
        jlinks.appendChild(othernode);
    };
    var refSorters = {};
    refSorters["recent"] = function(a, b) {
        var y = CT.data.get(a).sse;
        var x = CT.data.get(b).sse;
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    };
    refSorters["popular"] = function(a, b) {
        var y = CT.data.get(a).ye;
        var x = CT.data.get(b).ye;
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    };
    var whichRS = "popular";
    var otherRS = {"recent": "popular", "popular": "recent"};
    var ursnode = CT.dom.id("userrefsort");
    var loadUserRefs = function() {
        if (CAN.session.settings.user_referenda.length > 0) {
            REFLISTS['user'].innerHTML = "";
            ursnode.innerHTML = "";
            ursnode.appendChild(CT.dom.link("current sort: most " + whichRS,
                function() {
                    whichRS = otherRS[whichRS];
                    loadUserRefs();
                }, null, "small"));
            CAN.session.settings.user_referenda.sort(refSorters[whichRS]);
            var rlim = Math.min(CAN.session.settings.user_referenda.length, 15);
            for (var i = 0; i < rlim; i++)
                newRef(CT.data.get(CAN.session.settings.user_referenda[i]), "user");
            CT.dom.id("userreftitle").style.display = "block";
            ursnode.style.display = REFLISTS['user'].style.display = "block";
            //tabout(REFLISTS["user"]);
            CT.panel.alternatebg(REFLISTS["user"]);
        }
    };
    loadRefs = function() {
        if (user == null || CAN.session.settings == null || refsready == false)
            return;
        REFLISTS['can'].innerHTML = "";
        for (var i = 0; i < CAN.session.settings.CAN_referenda.length; i++)
            newRef(CT.data.get(CAN.session.settings.CAN_referenda[i]), "can");
        //tabout(REFLISTS["can"]);
        CT.panel.alternatebg(REFLISTS["can"]);
        loadUserRefs();
        loadJLinks();

        // load indicated ref according to hash
        var _hash = CAN.cookie.flipReverse(document.location.hash.slice(2));
        if (_hash) {
            CT.data.checkAndDo([_hash], function() {
                var d = CT.data.get(_hash);
                if (d.referendum) // this is a branch
                    CT.data.checkAndDo([d.referendum], function() {
                        changeRef(CT.data.get(d.referendum), d);
                    });
                else
                    changeRef(d);
            }, null, function() {
                changeRef(CT.data.get(CAN.session.settings.CAN_referenda[0]));
            });
            document.location.hash = "";
        }
        else
            changeRef(CT.data.get(CAN.session.settings.CAN_referenda[0]));
    };
    if (uid) {
        CT.dom.id("lawyerlink").appendChild(CT.dom.link("Submit Your Own Referenda Today", null, "/participate.html#lawyer", "bold"));
        CT.net.post("/get", {"gtype": "user", "uid": uid},
            "error retrieving user data", function(udata) {
            CT.data.add(udata); user = udata; loadRefs(); });
    }
    else
        user = "nouser";
/*    postData("/settings", {}, "error retrieving settings", function(s) {
        settings = s; loadRefs(); });*/
    CT.net.post("/get", {"gtype": "media", "mtype": "referenda",
        "uid": "nouid", "number": 1000, "allrefs": 1,
        "noblurb": true, "ordered": true},
//    postData("/get", {"gtype": "refs", "uid": "nouid"},
        "error retrieving referenda", function(refs) {
            CT.data.addSet(refs);
            refsready = true;
            loadRefs();
        });
};
CT.require("CT.all");
CT.require("CT.rte");
CT.require("CAN.all");

var loadPage = function(uid, pid) {
    CT.dom.setContent("feedback", core.config.ctnet.feedback);
    var addUser; // for compilation
    var processHash = function() {
        var _hash = document.location.hash.slice(1);
        if (_hash) {
            if (CT.dom.id("sbitem" + _hash)) // contribution panel
                CT.dom.id("sbitem" + _hash).firstChild.onclick();
            else { // conversation
                CT.dom.id("userconvoslink").onclick();
                var hkey = CAN.cookie.flipReverse(_hash);
                var cnode = CT.dom.id("ll" + hkey);
                if (cnode) // conversation exists
                    cnode.firstChild.onclick();
                else // conversation is about to exist
                    CT.data.checkAndDo([hkey], function() { addUser(hkey); });
            }
            document.location.hash = "";
        }
    };
    CT.net.post("/get", {"gtype": "user", "contributions": 1,
        "judgments": 1, "credentials": 1, "messages": 1,
        "thoughts": 1, "changes": 1, "authentication": 1,
        "non_user_view": 1, "role": 1, "uid": pid || uid},
        "error retrieving user data", function(u) {
        if (!(uid || u.non_user_view))
            return document.location = "/login.html";
        CT.data.add(u);
        var setContribution = function(pnode) {
            // temporary code while active/provisional system is inactive
            if (u.is_active || u.contributions.length)
                pnode.appendChild(CT.dom.node(CT.dom.node("CAN Contributor",
                    "div", "gray big"), "div", "right"));
            else if (u.changes.length)
                pnode.appendChild(CT.dom.node(CT.dom.node("CAN Changer",
                    "div", "gray big"), "div", "right"));
            else if (u.thoughts.length)
                pnode.appendChild(CT.dom.node(CT.dom.node("CAN Thinker",
                    "div", "gray big"), "div", "right"));
            else
                pnode.appendChild(CT.dom.node(CT.dom.node("CAN User",
                    "div", "gray big"), "div", "right"));

            // too exclusive
/*            if (u.is_active || u.contributions.indexOf("articles") != -1 || u.contributions.indexOf("photographs") != -1 || u.contributions.indexOf("videos") != -1)
                pnode.appendChild(wrapped(newNode("CAN Contributor",
                    "div", "gray big"), "div", "right"));*/

            // reactivate this code block for active/provisional system
/*            if (u.is_active)
                pnode.appendChild(wrapped(newNode("Active CAN Contributor",
                    "div", "gray big"), "div", "right"));
            else if (u.contributions.indexOf("articles") != -1 || u.contributions.indexOf("photographs") != -1 || u.contributions.indexOf("videos") != -1)
                pnode.appendChild(wrapped(newNode("Provisional CAN Contributor",
                    "div", "gray big"), "div", "right"));*/
        };
        var setFullName = function() {
            u.fullName = u.firstName + " " + u.lastName;
            document.title = "CAN Profile | " + u.fullName; // title
            var hl = CT.dom.id("headline");
            hl.innerHTML = "";
            setContribution(hl);
            hl.appendChild(CT.dom.node("Hello, " + u.firstName,
                "div", "red bigger bold")); // headline
            if (uid == u.key)
                CAN.session.welcomeFirstName.innerHTML = u.firstName;
        }
        setFullName();
 
        var setSiteWideChat = function(ison) {
            var ifr = CT.dom.id("canchatiframe");
            if (ifr) {
                CT.dom.showHide(ifr, ison, !ison);
                CT.dom.showHide(CT.dom.id("canchatexpander"), ison, !ison);
            } else if (ison)
                CAN.frame.loadSiteWideChat();
        };

        var yp = CT.dom.id("yourprofile");
        var op = CT.dom.id("otherprofile");
        var sbitems = CT.dom.id("sbitems");
        sbitems.innerHTML = "";

        var alignAndClick = function(phash) {
            sbitems.firstChild.firstChild.onclick();
            CT.dom.id("pcontentcontainer").style.minHeight = (CT.dom.id("leftcolumn").clientHeight - 40) + "px";
            if (phash)
                processHash();
        };

        if (u.contributions.length > 0) {
            var contributions = CT.dom.id("copanels");
            var coitems = CT.dom.id("coitems");
            coitems.innerHTML = "";

            var cappedCons = CT.parse.keys2titles(u.contributions);

            // deal with writing separately
            var con2mtype = {"Events": "event", "Articles": "news",
                "Photographs": "photo", "Videos": "video", "Cases": "case",
                "Referenda": "referenda", "Position Papers": "paper",
                "Action Groups": "group", "Opinions And Ideas": "opinion"};
            var con2role = {"events": "Coordinator", "articles": "Reporter",
                "photographs": "Photographer", "videos": " Videographer",
                "referenda": "Lawyer", "writing": "Writer",
                "position_papers": "PositionPapers", "action_groups": "ActionGroups",
                "opinions_and_ideas": "OpinionsAndIdeas", "cases": "Cases"};

            var cicons = [];
            for (var i = 0; i < u.contributions.length; i++)
                cicons[i] = "/img/icons/"+u.contributions[i]+".png";
            CT.panel.load(cappedCons, true, "sb", coitems, contributions, null, cicons);

            var basicMVars = function(cname, ctype, node) {
                var d = {"mtype": ctype || con2mtype[cname],
                    "uid": uid, "authid": u.key,
                    "node": node || CT.dom.id("sbcontent" + cname.replace(/ /g, "")),
                    "paging": "bidirectional", "number": 4};
                if (pid == null)
                    d.buttonCbDefault = {"name": "remove"};
                else if (cname != "Referenda") {
                    d.rating = "0to10";
                    d.showrating = true;
                }
                return d;
            };

            // load each data set
            for (var i = 0; i < u.contributions.length; i++) {
                var clower = u.contributions[i];
                var cupper = cappedCons[i];
                if (clower == "writing") {
                    var writings = ["quote", "book", "sustainableaction"];
                    var wtitles = ["Quotes", "Book Recommendations", "Sustainable Actions"];
                    CT.panel.load(wtitles, false, "wt", null,
                        CT.dom.id("sbcontentWriting"));
                    var loadWriting = function(w, wt) {
                        var wtns = wt.replace(/ /g, "");
                        var mvars = basicMVars(cupper, w,
                            CT.dom.id("wtcontent" + wtns));
                        mvars.eb = function() {
                            var wti = CT.dom.id("wtitems");
                            wti.removeChild(CT.dom.id("wtitem" + wtns));
                            wti.firstChild.firstChild.onclick();
                            if (wti.childNodes.length == 1) {
                                var sbws = CT.dom.id("sbpanelWritingSide");
                                sbws.parentNode.removeChild(sbws);
                            }
                        };
                        CAN.media.loader.load(mvars);
                    };
                    for (var j = 0; j < writings.length; j++)
                        loadWriting(writings[j], wtitles[j]);
                }
                else {
                    var mvars = basicMVars(cupper);
                    if (clower == "articles") {
                        mvars.nextimg = "MORE_NEWS_BUTTON";
                        mvars.newMediaChecks = {"justFirst": ["photo"]};
                        mvars.newMediaDefault = "newsintronocat";
                        mvars.newMediaViewMoreCb = function(n) {
                            document.location = "news.html#!" + CAN.cookie.flipReverse(n.key);
                        };
                    }
                    else if (clower == "videos")
                        mvars.newMediaDefault = "videoprofile";
                    else if (clower == "cases") {
                        if (!pid || uid && CT.data.get(uid).role[0] == "greg")
                            mvars.newMediaDefault = "caseprofile";
                        mvars.newMediaChecks = {
                            "list": ["evidence"]
                        };
                    }
                    CAN.media.loader.load(mvars);
                }
                var pnode = CT.dom.id("sbpanel" + cupper.replace(/ /g, ""));
                pnode.insertBefore(CT.dom.node(CT.dom.link("contribute more",
                    null, "/participate.html#" + con2role[clower], "nodecoration"),
                    "div", "right rpadded bold"), pnode.firstChild);
            }
            coitems.parentNode.style.display = "block";
        }

        // credentials
        var ctypes = ["websites", "qualifications", "jobs",
            "education", "volunteering", "affiliations", "projects"];
        var cfields = {
            "websites": ["name", "url", "description"],
            "qualifications": [{"license": ["name", "issuing_authority_name",
                "website_url", "issuing_authority_primary_address"]},
                "date_started"],
            "jobs": [{"employer": ["name", "location"]}, "title",
                "date_started", "date_stopped"],
            "education": [{"school": ["name", "location"]},
                "date_started", "date_stopped"],
            "volunteering": [{"beneficiary": ["name", "location"]},
                "date_started", "date_stopped"],
            "affiliations": ["name", "url", "description"],
            "projects": ["name", "url", "description"]
        };
        var csingulars = {
            "websites": "website",
            "qualifications": "qualification",
            "jobs": "job",
            "education": "education",
            "volunteering": "volunteering",
            "affiliations": "affiliation",
            "projects": "project"
        };
        var modkeys = {};
        var credline = function(propname, propdata) {
            if (propname == "url" || propname == "website_url")
                return CT.dom.node("<b>" + CT.parse.key2title(propname) + "</b>: " + CT.parse.url2link(propdata));
            return CT.dom.node("<b>" + CT.parse.key2title(propname) + "</b>: " + propdata);
        };
        var credsetfield = function(preface, fname, fdata) {
            if (fname.slice(0,4) == "date") {
                if (fname == "date_stopped") {
                    var dscb = CT.dom.id(preface + "date_stoppedcheckbox");
                    if (fdata)
                        dscb.checked = false;
                    else {
                        dscb.checked = true;
                        return;
                    }
                }
                var d = fdata.split(" ");
                CT.dom.id(preface + fname + "year").value = d[1];
                CT.dom.id(preface + fname + "month").value = CT.parse.month2num(d[0]);
            }
            else
                CT.dom.id(preface + fname).value = fdata;
        };
        var credunit = function(cname, cdata, noedit) {
            var cnode = CT.dom.node("", "div", "bordered padded topmargined", cname + cdata.key);
            if (!noedit) {
                cnode.appendChild(CT.dom.node(CT.dom.link("edit", function() {
                    CT.dom.showHide(CT.dom.id("edit"+cname), true);
                    for (var i = 0; i < cfields[cname].length; i++) {
                        var cf = cfields[cname][i];
                        if (typeof cf == "string")
                            credsetfield(cname, cf, cdata[cf]);
                        else {
                            for (var k in cf) { // should only be one!
                                for (var q = 0; q < cf[k].length; q++)
                                    credsetfield(cname+k, cf[k][q],
                                        cdata[k][cf[k][q]])
                            }
                        }
                    }
                    modkeys[cname] = cdata.key;
                }), "div", "right"));
            }
            for (var j = 0; j < cfields[cname].length; j++) {
                var cf = cfields[cname][j];
                if (typeof cf == "string") {
                    if (cdata[cf])
                        cnode.appendChild(credline(cf, cdata[cf]));
                }
                else {
                    for (var k in cf) { // should only be one!
                        cnode.appendChild(CT.dom.node(CT.parse.capitalize(k), "div", "bold red"));
                        for (var q = 0; q < cf[k].length; q++) {
                            var csubf = cf[k][q];
                            var csubdata = cdata[k][csubf];
                            if (csubdata)
                                cnode.appendChild(credline(csubf, csubdata));
                        }
                        cnode.appendChild(CT.dom.node("Details", "div", "bold red topmargined"));
                    }
                }
            }
            return cnode;
        };
        var credunitfield = function(fname, preface) {
            var fline = CT.dom.node();
            if (fname == "description")
                fline.appendChild(CT.dom.textArea(preface + fname, null, "right w300"));
            else if (fname.slice(0,4) == "date") {
                var d = {};
                var dnode = CT.dom.node();//"", "div", "right w300");
                CT.dom.dateSelectors(dnode, d, 1990, null, false, true);
                d.year.id = preface + fname + "year";
                d.month.id = preface + fname + "month";
                if (fname == "date_stopped") {
                    dnode.style.display = "none";
                    var cnode = CT.dom.node("", "div", "right w300");
                    cnode.appendChild(CT.dom.checkboxAndLabel(preface + fname,
                        true, "current?", "bold", "right", function(cb) {
                            if (cb.checked) CT.dom.showHide(dnode, false, true);
                            else CT.dom.showHide(dnode, true);
                        }));
                    cnode.appendChild(dnode);
                    fline.appendChild(cnode);
                }
                else
                    fline.appendChild(CT.dom.node(dnode, "div", "right w300"));
            } else
                fline.appendChild(CT.dom.field(preface + fname, null, "right w300"));
            fline.appendChild(CT.dom.node(CT.parse.key2title(fname), "div", "bold"));
            fline.appendChild(CT.dom.node("", "div", "clearnode"));
            return fline;
        };
        var credunitcheck = function(d, fname, preface) {
            if (fname.slice(0,4) == "date") {
                if (fname == "date_stopped" && CT.dom.id(preface + "date_stoppedcheckbox").checked)
                    return true;
                d[fname] = {};
                d[fname].year = CT.dom.id(preface+fname+"year").value;
                d[fname].month = CT.dom.id(preface+fname+"month").value;
                if (d[fname].year == "Year" || d[fname].month == "Month")
                    return false;
                return true;
            }
            d[fname] = CT.dom.id(preface + fname).value;
            if (d[fname].trim() == "")
                return false;
            return true;
        };
        var credunitready = function(d, fname, preface) {
            if (!credunitcheck(d, fname, preface)) {
                if (fname == "name")
                    alert("Please provide a name.");
                else if (fname.slice(0,4) == "date")
                    alert("Please provide a valid date.");
                else
                    return true;
                return false;
            }
            return true;
        };
        var credunitclear = function(preface, fname) {
            if (fname.slice(0,4) == "date") {
                CT.dom.id(preface + fname + "month").value = "Month";
                CT.dom.id(preface + fname + "year").value = "Year";
            }
            else
                CT.dom.id(preface + fname).value = "";
        };
        var credunitfields = function(cname, collection) {
            var n = CT.dom.node("", "div", "hidden bordered padded", "edit" + cname);
            for (var i = 0; i < cfields[cname].length; i++) {
                var cf = cfields[cname][i];
                if (typeof cf == "string")
                    n.appendChild(credunitfield(cf, cname));
                else {
                    for (var k in cf) { // should only be one!
                        n.appendChild(CT.dom.node(CT.parse.capitalize(k), "div", "bold red"));
                        for (var j = 0; j < cf[k].length; j++)
                            n.appendChild(credunitfield(cf[k][j], cname + k));
                        n.appendChild(CT.dom.node("You", "div", "bold red topmargined"));
                    }
                }
            }
            n.appendChild(CT.dom.button("Submit", function() {
                var pdata = {"cname": cname};
                for (var i = 0; i < cfields[cname].length; i++) {
                    var cf = cfields[cname][i];
                    if (typeof cf == "string") {
                          if (!credunitready(pdata, cf, cname))
                              return;
                    }
                    else {
                        for (var k in cf) { // should only be one!
                            pdata[k] = {};
                            for (var j = 0; j < cf[k].length; j++) {
                                if (!credunitready(pdata[k], cf[k][j], cname+k))
                                    return;
                            }
                        }
                    }
                }
                var alldata = {"key": u.key};
                if (modkeys[cname]) {
                    pdata.key = modkeys[cname];
                    alldata.modcredential = pdata;
                }
                else
                    alldata.addcredential = pdata;
                var doSubmit = function(pass) {
                    if (pass)
                        alldata.password = pass;
                    CT.net.post("/edit", {"eid": u.key, "data": alldata},
                        "error submitting credential", function(cdata) {
                            // add credential to user object and collection
                            if (modkeys[cname]) {
                                for (var i = 0; i < u[cname]; i++) {
                                    if (u[cname][i].key == modkeys[cname]) {
                                        u[cname][i] = cdata;
                                        break;
                                    }
                                }
                                collection.replaceChild(credunit(cname, cdata),
                                    CT.dom.id(cname + modkeys[cname]));
                            }
                            else {
                                u[cname].push(cdata);
                                collection.appendChild(credunit(cname, cdata));
                            }

                            // clear fields
                            for (var i = 0; i < cfields[cname].length; i++) {
                                var cf = cfields[cname][i];
                                if (typeof cf == "string")
                                    credunitclear(cname, cf);
                                else {
                                    for (var k in cf) { // should only be one!
                                        for (j = 0; j < cf[k].length; j++)
                                            credunitclear(cname+k, cf[k][j]);
                                    }
                                }
                            }
                            modkeys[cname] = null;
                        });
                };
                if (CAN.session.settings.password_to_edit_profile)
                    CT.dom.passwordPrompt(doSubmit);
                else
                    doSubmit();
            }));
            return n;
        };
        var credgroup = function(cname, noedit) {
            var n = CT.dom.node("", "div", "bottommargined");
            var collection = CT.dom.node();
            for (var i = 0; i < u[cname].length; i++)
                collection.appendChild(credunit(cname, u[cname][i], noedit));
            n.appendChild(CT.dom.node(CT.parse.capitalize(cname), "div", "big red"));
            if (!noedit) {
                var cuf = credunitfields(cname, collection);
                n.appendChild(CT.dom.node(CT.dom.link("new " + csingulars[cname],
                    function() { CT.dom.showHide(cuf); })));
                n.appendChild(cuf);
            }
            n.appendChild(collection);
            return n;
        };

        CAN.categories.load(uid); // prep media tagger

        if (pid) {
            if (u.deleted)
                return op.appendChild(CT.dom.node("This profile has been deleted. Have a nice day!"));

            setContribution(op);

            var namenode = CT.dom.node();
            namenode.appendChild(CT.dom.node(u.fullName,
                "span", "red bigger bold"));
            namenode.appendChild(CT.dom.img("/img/buttons/rss_icon.gif",
                "shiftdown", null, "/rss?rtype=user&ukey=" + CAN.cookie.flipReverse(u.key),
                "_blank", "RSS Feed for " + u.fullName));

            op.appendChild(namenode);
            op.appendChild(CT.dom.node("", "hr"));

            var bp = CT.dom.node();
            bp.appendChild(CT.dom.node(CT.dom.img("/get?gtype=avatar&size=profile&uid=" + CAN.cookie.flipReverse(u.key)),
                "div", "right padded bordered"));
            bp.appendChild(CT.dom.node("Basic Profile", "div", "red big bold"));
            bp.appendChild(CT.dom.node("<b>Name</b>: " + u.fullName));
            bp.appendChild(CT.dom.node("<b>Hometown</b>: " + u.zipcode.city));
            op.appendChild(bp);

            var ep = CT.dom.node();
            if (u.age || (u.gender != "decline")) {
                ep.appendChild(CT.dom.node("Background",
                    "div", "topmargined red big bold"));
                if (u.age)
                    ep.appendChild(CT.dom.node("<b>Age</b>: " + u.age));
                if (u.gender != "decline")
                    ep.appendChild(CT.dom.node("<b>Gender</b>: " + u.gender));
            }
            if (u.age > 17 && u.show_contact_info) {
                ep.appendChild(CT.dom.node("Contact Info",
                    "div", "topmargined red big bold"));
                ep.appendChild(CT.dom.node("<b>Email</b>: " + u.email));
                if (u.phone)
                    ep.appendChild(CT.dom.node("<b>Phone</b>: " + u.phone));
                if (u.address)
                    ep.appendChild(CT.dom.node("<b>Address</b>: " + u.address));
            }
            if (u.blurb) {
                ep.appendChild(CT.dom.node("Other Interests or Comments",
                    "div", "topmargined big red bold"));
                ep.appendChild(CT.dom.node(u.blurb));
            }

            // expanded profile credentials
            var crednode = CT.dom.node("", "div", "small");
            for (var i = 0; i < ctypes.length; i++) {
                if (u[ctypes[i]].length > 0)
                    crednode.appendChild(credgroup(ctypes[i], true));
            }
            if (crednode.innerHTML != "") {
                ep.appendChild(CT.dom.node("Credentials",
                    "div", "topmargined big red bold"));
                ep.appendChild(crednode);
            }

            op.appendChild(ep);

            var ut = CT.dom.node();
            CAN.widget.stream.thought(ut, uid, u.thoughts, true);
            op.appendChild(ut);

            var uc = CT.dom.node();
            CAN.widget.stream.changeidea(uc, uid, u.changes, true);
            op.appendChild(uc);

            var bpf = function() {
                bp.style.display = "block";
                ep.style.display = "none";
                ut.style.display = "none";
                uc.style.display = "none";
                CT.panel.swap("profile", false, "sb", true);
                CT.panel.select("basicprofile");
            };
            var epf = function() {
                bp.style.display = "block";
                ep.style.display = "block";
                ut.style.display = "none";
                uc.style.display = "none";
                CT.panel.swap("profile", false, "sb", true);
                CT.panel.select("expandedprofile");
            };
            var tsf = function() {
                bp.style.display = "none";
                ep.style.display = "none";
                ut.style.display = "block";
                uc.style.display = "none";
                CT.panel.swap("profile", false, "sb", true);
                CT.panel.select("thoughtstream");
            };
            var cwf = function() {
                bp.style.display = "none";
                ep.style.display = "none";
                ut.style.display = "none";
                uc.style.display = "block";
                CT.panel.swap("profile", false, "sb", true);
                CT.panel.select("changes");
            };
            var rpf = function() {
                var theproblem = prompt("What's the problem?");
                if (theproblem) {
                    CT.net.post("/edit", {"eid": uid,
                        "data": {"key": u.key, "flag": theproblem}},
                        "error flagging profile", function() { alert("flagged!"); });
                }
            };
            sbitems.appendChild(CT.dom.node(CT.dom.img("/img/icons/person.png",
                null, bpf), "div", "lfloat shiftleft"));
            sbitems.appendChild(CT.dom.node(CT.dom.link("Basic Profile", bpf),
                "div", "sbitem", "sbitembasicprofile"));
            sbitems.appendChild(CT.dom.node(CT.dom.img("/img/icons/briefcase.png",
                null, epf), "div", "lfloat shiftleft"));
            sbitems.appendChild(CT.dom.node(CT.dom.link("Expanded Profile", epf),
                "div", "sbitem", "sbitemexpandedprofile"));
            sbitems.appendChild(CT.dom.node(CT.dom.img("/img/icons/conversations.png",
                null, null, "/profile.html#" + CAN.cookie.flipReverse(pid)),
                "div", "lfloat shiftleft"));
            sbitems.appendChild(CT.dom.node(CT.dom.link("Converse", null,
                "/profile.html#" + CAN.cookie.flipReverse(pid), null, "userconvoslink"),
                "div", "sbitem", "sbitemuserconvos"));
            sbitems.appendChild(CT.dom.node(CT.dom.img("/img/icons/thought_stream.png",
                null, tsf), "div", "lfloat shiftleft"));
            sbitems.appendChild(CT.dom.node(CT.dom.link("Thought Stream", tsf),
                "div", "sbitem", "sbitemthoughtstream"));
            sbitems.appendChild(CT.dom.node(CT.dom.img("/img/icons/world.png",
                null, cwf), "div", "lfloat shiftleft"));
            sbitems.appendChild(CT.dom.node(CT.dom.link("Change The World", cwf),
                "div", "sbitem", "sbitemchanges"));
            var rpnode = CT.dom.node("", "div", "topmargined bottommargined");
            rpnode.appendChild(CT.dom.node(CT.dom.img("/img/icons/moderator.png",
                null, rpf), "div", "lfloat shiftleft"));
            rpnode.appendChild(CT.dom.node(CT.dom.link("Report This Page", rpf),
                "div", "sbitem", "sbitemreportpage"));
            sbitems.appendChild(rpnode);
            return alignAndClick(true);
        }
        var userinfo = CT.dom.id("userinfo");
        var usermsgs = CT.dom.id("usermsgs");
        var userthoughts = CT.dom.id("userthoughts");
        var userchanges = CT.dom.id("userchanges");
        var cred = CT.dom.id("usercred");
        var userconvos = CT.dom.id("userconvos");
        var userconvoside = CT.dom.id("userconvoside");
        CAN.widget.stream.thought(userthoughts, uid, u.thoughts);
        CAN.widget.stream.changeidea(userchanges, uid, u.changes);
        var uifunc = function() {
            usermsgs.style.display = "none";
            cred.style.display = "none";
            userconvos.style.display = "none";
            userconvoside.style.display = "none";
            userthoughts.style.display = "none";
            userchanges.style.display = "none";
            userinfo.style.display = "block";
            CT.panel.swap("profile", false, "sb", true);
            CT.panel.select("userinfo");
        };
        var crfunc = function() {
            usermsgs.style.display = "none";
            cred.style.display = "block";
            userconvos.style.display = "none";
            userconvoside.style.display = "none";
            userthoughts.style.display = "none";
            userchanges.style.display = "none";
            userinfo.style.display = "none";
            CT.panel.swap("profile", false, "sb", true);
            CT.panel.select("usercred");
        };
        var cofunc = function() {
            usermsgs.style.display = "none";
            cred.style.display = "none";
            userconvos.style.display = "block";
            userconvoside.style.display = "block";
            userthoughts.style.display = "none";
            userchanges.style.display = "none";
            userinfo.style.display = "none";
            CT.panel.swap("profile", true, "sb", true);
            CT.panel.select("userconvos");
        };
        var tsfunc = function() {
            userinfo.style.display = "none";
            cred.style.display = "none";
            userconvos.style.display = "none";
            userconvoside.style.display = "none";
            userthoughts.style.display = "block";
            userchanges.style.display = "none";
            usermsgs.style.display = "none";
            CT.panel.swap("profile", true, "sb", true);
            CT.panel.select("userthoughts");
        };
        var cwfunc = function() {
            userinfo.style.display = "none";
            cred.style.display = "none";
            userconvos.style.display = "none";
            userconvoside.style.display = "none";
            userthoughts.style.display = "none";
            userchanges.style.display = "block";
            usermsgs.style.display = "none";
            CT.panel.swap("profile", true, "sb", true);
            CT.panel.select("userchanges");
        };
        var msfunc = function() {
            userinfo.style.display = "none";
            cred.style.display = "none";
            userconvos.style.display = "none";
            userconvoside.style.display = "none";
            userthoughts.style.display = "none";
            userchanges.style.display = "none";
            usermsgs.style.display = "block";
            CT.panel.swap("profile", true, "sb", true);
            CT.panel.select("usermsgs");
        };
        var vpfunc = function() {
            document.location = "/profile.html?u=" + CAN.cookie.flipReverse(uid);
        };
        sbitems.appendChild(CT.dom.node(CT.dom.img("/img/icons/person.png",
            null, uifunc), "div", "lfloat shiftleft"));
        sbitems.appendChild(CT.dom.node(CT.dom.link("User Info", uifunc, null,
            null, "userinfolink"), "div", "sbitem", "sbitemuserinfo"));
        sbitems.appendChild(CT.dom.node(CT.dom.img("/img/icons/briefcase.png",
            null, crfunc), "div", "lfloat shiftleft"));
        sbitems.appendChild(CT.dom.node(CT.dom.link("Credentials", crfunc, null,
            null, "usercredlink"), "div", "sbitem", "sbitemusercred"));
        sbitems.appendChild(CT.dom.node(CT.dom.img("/img/icons/conversations.png",
            null, cofunc), "div", "lfloat shiftleft"));
        sbitems.appendChild(CT.dom.node(CT.dom.link("Conversations", cofunc, null,
            null, "userconvoslink"), "div", "sbitem", "sbitemuserconvos"));
        sbitems.appendChild(CT.dom.node(CT.dom.img("/img/icons/thought_stream.png",
            null, tsfunc), "div", "lfloat shiftleft"));
        sbitems.appendChild(CT.dom.node(CT.dom.link("Thought Stream", tsfunc, null,
            null, "userthoughtslink"), "div", "sbitem", "sbitemuserthoughts"));
        sbitems.appendChild(CT.dom.node(CT.dom.img("/img/icons/world.png",
            null, cwfunc), "div", "lfloat shiftleft"));
        sbitems.appendChild(CT.dom.node(CT.dom.link("Change The World", cwfunc),
            "div", "sbitem", "sbitemuserchanges"));
        var usermsgslink = CT.dom.node("", "div", "hidden");
        usermsgslink.appendChild(CT.dom.node(CT.dom.img("/img/icons/messages.png",
            null, msfunc), "div", "lfloat shiftleft"));
        usermsgslink.appendChild(CT.dom.node(CT.dom.link("Messages", msfunc),
            "div", "sbitem", "sbitemusermsgs"));
        sbitems.appendChild(usermsgslink);
        sbitems.appendChild(CT.dom.node(CT.dom.img("/img/icons/eye.png",
            null, vpfunc), "div", "lfloat shiftleft"));
        sbitems.appendChild(CT.dom.node(CT.dom.link("View my profile", vpfunc)));

        // conversations
        var curconvo = null;
        var getCurConvo = function() {
            return curconvo;
        };
        var ucitems = CT.dom.id("ucitems");
        var uctopic = CT.dom.id("uctopic");
        var ucconvo = CT.dom.id("ucconvo");
        var userselectorpopup = CT.dom.id("userselectorpopup");
        var ucparticipants = CT.dom.id("ucparticipants");
        /*var userselector = CT.dom.id("userselector");
        CT.dom.id("closeuserselector").onclick = CT.dom.id("ucinvitebutton").onclick = function() {
            showHide(userselectorpopup);
            centered(userselectorpopup);
        };*/
        // var-ing this at top of file for compilation ;)
        addUser = function(key, noadd) {
            if (!noadd)
                curconvo.privlist.push(key);
            if (CT.dom.id("ulineconversation" + key))
                return;
            ucparticipants.appendChild(CAN.session.userLine(key, "conversation"));
        };

        var convoHasChanged = function() {
            if (curconvo == null)
                return false;
            return !!CT.dom.id(curconvo.key + "ta").value;
        };
        var showConversation = function(d) {
            uctopic.innerHTML = ucconvo.innerHTML = ucparticipants.innerHTML = "";
            for (var i = 0; i < d.privlist.length; i++)
                addUser(d.privlist[i], true);
            CAN.widget.conversation.load(uid, d.key, ucconvo, null, d.key + "ta", true);
            if (d.key == "conversation") {
                uctopic.appendChild(CT.dom.node("What is the topic of this conversation?"));
                var ctopic = CT.dom.field(null, null, "fullwidth");
                uctopic.appendChild(ctopic);
                uctopic.appendChild(CT.dom.node("What is your opening remark?"));
                ucconvo.appendChild(CT.dom.button("Start Conversation", function() {
                    var cbody = CT.dom.id("conversationta");
                    var ct = CT.parse.sanitize(ctopic.value);
                    var cb = CT.parse.sanitize(cbody.value);
                    if (ct == "")
                        return alert("please provide a topic");
                    if (cb == "")
                        return alert("please provide an opening remark");
                    if (d.privlist.length == 1)
                        return alert("please invite another user to this conversation");
                    CT.net.post("/say", {"uid": uid, "conversation": "conversation",
                        "body": cb, "topic": ct, "privlist": d.privlist},
                        "error starting conversation", function(ckey) {
                            curconvo = {
                                "key": ckey,
                                "topic": ct,
                                "privlist": d.privlist,
                                "unseencount": 0,
                                "comments": [{
                                    "body": cb,
                                    "conversation": ckey,
                                    "deleted": false,
                                    "user": uid
                                }]
                            };
                            CAN.media.loader.newLister(curconvo, ucitems,
                                "conversation", showConversation, convoHasChanged);
                            showConversation(curconvo);
                        });
                }));
            }
            else
                uctopic.appendChild(CT.dom.node(d.topic, "div", "big blue bold bottomline"));
            CT.panel.selectLister(d.key, curconvo && curconvo.key || null, d.topic);
            d.unseencount = 0;
            curconvo = d;
        };
        CAN.media.loader.list(uid, "conversation", ucitems,
            showConversation, convoHasChanged,
            {"privlist": [uid]}, null, processHash,
            {"newMediaChecks": {"list": ["privlist"]}},
            processHash);

        CAN.widget.invite.load("conversation", uid,
            CT.dom.id("ucinvitebutton"),
            addUser, getCurConvo, null, true);

        if (u.messages.length > 0 || u.judgments.length > 0) {
            usermsgslink.style.display = "block";
            var removeAndCheck = function(n1, n2) {
                usermsgs.removeChild(n1);
                usermsgs.removeChild(n2);
                if (usermsgs.innerHTML == "") {
                    usermsgslink.style.display = "none";
                    CT.dom.id("userinfolink").onclick();
                }
            };

            // judgments
            if (u.judgments.length > 0) {
                var sysmsgs = CT.dom.node();
                var sysmsgstitle = CT.dom.node("System Messages",
                    "div", "big bold blue bottommargined");
                var newJudgment = function(j) {
                    var n = CT.dom.node("", "div",
                        "bordered padded round bottommargined");
                    n.appendChild(CT.dom.node(j.message));
                    n.appendChild(CT.dom.node(CT.dom.button("OK", function() {
                        postData("/edit", {"eid": uid, "data": {"key": j.key,
                            "userviewed": true}}, "error setting status", function() {
                                sysmsgs.removeChild(n);
                                if (sysmsgs.innerHTML == "")
                                    removeAndCheck(sysmsgs, sysmsgstitle);
                            });
                    }), "div", "right"));
                    n.appendChild(CT.dom.node(CT.dom.link("Moderator's Profile", null,
                        "/profile.html?u=" + CAN.cookie.flipReverse(j.moderator),
                        null, null, {"target": "_blank"})));
                    n.appendChild(CT.dom.node(CT.dom.link("Terms of Use", null,
                        "/about.html#TermsofUse", null, null,
                        {"target": "_blank"})));
                    return n;
                };
                usermsgs.appendChild(sysmsgstitle);
                for (var i = 0; i < u.judgments.length; i++)
                    sysmsgs.appendChild(newJudgment(u.judgments[i]));
                usermsgs.appendChild(sysmsgs);
            }

            // messages
            if (u.messages.length > 0) {
                var umsgs = CT.dom.node();
                var umsgstitle = CT.dom.node("User Messages",
                    "div", "big bold blue bottommargined");
                var newMsg = function(m) {
                    var n = CT.dom.node("", "div",
                        "bordered padded round bottommargined");
                    n.appendChild(CT.dom.node(m.message, "div", "bottommargined"));
                    n.appendChild(CT.dom.node(CT.dom.button("OK", function() {
                        CT.net.post("/edit", {"eid": uid, "data": {"key": m.key,
                            "userviewed": true}}, "error setting status", function() {
                                umsgs.removeChild(n);
                                if (umsgs.innerHTML == "")
                                    removeAndCheck(umsgs, umsgstitle);
                            });
                    }), "div", "right"));
                    if (m.check_link) {
                        var mcl = m.check_link;
                        if (mcl[0] == "profile") {
                            var connode = CT.dom.id("sbitem" + mcl[1]);
                            if (connode) {
                                n.appendChild(CT.dom.node(CT.dom.link("Check it out!",
                                    connode.firstChild.onclick)));
                            }
                        }
                        else {
                            n.appendChild(CT.dom.node(CT.dom.link("Check it out!",
                                null, mcl[0] + CAN.cookie.flipReverse(mcl[1]),
                                null, null, {"target": "_blank"})));
                        }
                    }
                    if (m.sender) {
                        n.appendChild(CT.dom.node(CT.dom.link("Sender's Profile", null,
                            "/profile.html?u=" + CAN.cookie.flipReverse(m.sender),
                            null, null, {"target": "_blank"})));
                    }
                    return n;
                }
                usermsgs.appendChild(umsgstitle);
                for (var i = 0; i < u.messages.length; i++)
                    umsgs.appendChild(newMsg(u.messages[i]));
                usermsgs.appendChild(umsgs);
            }
        }
        yp.style.display = "block";

        for (var i = 0; i < ctypes.length; i++)
            cred.appendChild(credgroup(ctypes[i]));

        var ufields = {};
        var thesefields = ["name", "email", "new_password",
            "retype_new_password", "zipcode", "address", "phone"];
        var authstati = {};
        var authStatus = function(ftype) {
            var n = CT.dom.node("", "span", "small bold");
            var a = CT.dom.node("confirming", "span", "hidden red");
            var c = CT.dom.node("confirmed", "span", "hidden green");
            var l = CT.dom.link("(confirm)", function() {
                CT.dom.showHide(CT.dom.id("confirm" + ftype));
            }, null, "hidden");
            n.appendChild(a);
            n.appendChild(c);
            n.appendChild(l);
            authstati[ftype] = {"attempting": a, "confirmed": c, "link": l};
            return n;
        };
        var gennewfield = function(ftype) {
            if (ftype == "name") {
                CT.dom.genfield("name", CT.dom.id("userinfoname"),
                    ufields, u, u.fullName, authStatus(ftype));
            }
            else if (ftype == "zipcode") {
                CT.dom.genfield("zipcode", CT.dom.id("userinfozipcode"),
                    ufields, u, u.zipcode.code);
            }
            else if (ftype == "phone" || ftype == "address") {
                CT.dom.genfield(ftype, CT.dom.id("userinfo"+ftype),
                    ufields, u, null, authStatus(ftype));
            }
            else {
                CT.dom.genfield(ftype, CT.dom.id("userinfo"+ftype),
                    ufields, u);
            }
        };
        for (var i = 0; i < thesefields.length; i++)
            gennewfield(thesefields[i]);

        // survey
        var surveycontext = CT.dom.id("surveycontext");
        CT.rte.wysiwygize("surveycontext", true, u.survey_context);
        var newSurveyAnswers = CT.data.copyList(u.survey);
        var loadSurveyChoices = function(num) {
            CT.dom.radioStrip(CT.dom.id("survey"+num),
                ["always", "mostly", "sometimes", "rarely", "never"],
                function(whichone) { newSurveyAnswers[num] = whichone; },
                "surveyanswer", num, u.survey[num]);
        };
        for (var i = 0; i < 4; i++)
            loadSurveyChoices(i);

        var showauthconditions = {
            "phone": function() { return CAN.session.settings.authenticate_phone && u.phone != ""; },
            "name": function() { return u.firstName != "" && u.lastName != ""; },
            "address": function() { return u.address != ""; }
        };
        var drawConfBox = function(ftype) {
            var con = CT.dom.id("confirm" + ftype);
            var n = CT.dom.node("", "div", "small");
            if (ftype == "phone") {
                n.appendChild(CT.dom.node("Phone authentication is a three-step process:", "div", "big red"));
                var phoneauthsteps = CT.dom.node("", "ol");
                phoneauthsteps.appendChild(CT.dom.node("You give us your phone number", "li"));
                phoneauthsteps.appendChild(CT.dom.node("We call you and tell you a secret code", "li"));
                phoneauthsteps.appendChild(CT.dom.node("You give us back the secret code", "li"));
                n.appendChild(phoneauthsteps);
                n.appendChild(CT.dom.node("That's it! Phone authentication is quite easy, and takes only a moment."));
                n.appendChild(CT.dom.link("authenticate now!", function() {
                    CT.net.post("/phoneAuth", {"uid": uid, "num": u.phone}, "phone authentication error", function() {
                        var code = CT.parse.stripToZip(prompt("Answer your phone to hear your 5-digit secret code. Type it in here and press OK to complete your authentication."));
                        if (code == "")
                            return alert("Authentication failed. You entered your authentication code incorrectly. Please try again.");
                        CT.net.post("/tryAuth", {"uid": uid, "code": code}, "phone authentication error", function() {
                            u.authentication.push("phone");
                            CT.dom.showHide(con);
                            showHideAuth(ftype);
                            alert("Your account has been authenticated by phone. Hooray!");
                        });
                    });
                }));
            }
            else {
                n.appendChild(CT.dom.node("Confirm Your " + CT.parse.capitalize(ftype), "div", "big red bottompadded"));
                n.appendChild(CT.dom.node("Upload a picture of something with your " + ftype + " on it, such as a driver license or state-issued ID."));
                var f = CT.upload.form(uid, "auth" + ftype);
                n.appendChild(f);
                n.appendChild(CT.dom.button("Submit", function() {
                    if (!f.data.value)
                        return alert("please select a graphic from your computer.");
                    CT.upload.submit(f, function() {
                        u.auth_attempts.push(ftype);
                        CT.dom.showHide(con);
                        showHideAuth(ftype);
                        alert("success!");
                    }, function(e) {
                        alert("upload failed: "+e);
                    });
                }));
            }
            con.appendChild(n);
        };
        var showHideAuth = function(ftype) {
            if (CAN.session.settings == null)
                return setTimeout(showHideAuth, 500, ftype);
            authstati[ftype].attempting.style.display = "none";
            authstati[ftype].confirmed.style.display = "none";
            authstati[ftype].link.style.display = "none";
            if (u.authentication.indexOf(ftype) != -1)
                authstati[ftype].confirmed.style.display = "inline";
            else if (u.auth_attempts.indexOf(ftype) != -1)
                authstati[ftype].attempting.style.display = "inline";
            else if (showauthconditions[ftype]()) {
                var con = CT.dom.id("confirm" + ftype);
                if (con.innerHTML == "") {
                    con.appendChild(CT.dom.node(CT.dom.link("X", function() {
                        CT.dom.showHide(con); }), "div", "right small"));
                    drawConfBox(ftype);
                }
                authstati[ftype].link.style.display = "inline";
            }
        };
        showHideAuth("name");
        showHideAuth("address");
        showHideAuth("phone");

        var fullname = ufields["name"];
        var email = ufields["email"];
        var zip = ufields["zipcode"];
        var newpass = ufields["new_password"];
        var renewpass = ufields["retype_new_password"];
        var address = ufields["address"];
        var phone = ufields["phone"];

        // change user photo
        var aup = CT.dom.id("avatarupload");
        var docForm = null;
        var nocacheindex = 0;
        var refreshAvatar = function() {
            aup.innerHTML = "";
            aup.appendChild(CT.dom.node(CT.dom.img("/get?gtype=avatar&size=profile&uid=" + CAN.cookie.flipReverse(u.key) + "&nocache=" + nocacheindex), "div", "right shiftupmore"));
            nocacheindex += 1;
            docForm = CT.upload.form(uid, "avatar", null, 15);
            aup.appendChild(docForm);
            aup.appendChild(CT.dom.node("(nudity prohibited)", "div", "small italic"));
            aup.appendChild(CT.dom.node("", "div", "clearnode"));
        };
        refreshAvatar();

        // user communication settings
        // checkbox for email notifications of messages
        CT.dom.id("messageoption").appendChild(CT.dom.checkboxAndLabel("messages", u.email_messages, "Check this box to receive an email notification whenever someone sends you a message"));
        var mcb = CT.dom.id("messagescheckbox");

        // checkbox for email notifications
        CT.dom.id("notificationoption").appendChild(CT.dom.checkboxAndLabel("notifications", u.email_notifications, "Check this box to receive an email notification whenever someone approves, comments on, or votes on your content"));
        var ncb = CT.dom.id("notificationscheckbox");

        // checkbox for email newsletters
        CT.dom.id("newsletteroption").appendChild(CT.dom.checkboxAndLabel("newsletters",
            u.email_newsletters, "Check this box to receive CAN email newsletters"));
        var nlcb = CT.dom.id("newsletterscheckbox");

        // checkbox for contact info
        CT.dom.id("contactinfooption").appendChild(CT.dom.checkboxAndLabel("contactinfo",
            u.show_contact_info, "Check this box to show your contact info on your profile"));
        var cicb = CT.dom.id("contactinfocheckbox");

        // checkbox for searchable profile
        CT.dom.id("searchableprofileoption").appendChild(CT.dom.checkboxAndLabel("searchableprofile",
            u.searchable_profile, "Check this box to show up in User Searches and on the Invitation Widget"));
        var spcb = CT.dom.id("searchableprofilecheckbox");

        // checkbox for non-user visibility
        CT.dom.id("nonuserviewoption").appendChild(CT.dom.checkboxAndLabel("nonuserview",
            u.non_user_view, "Check this box if you don't mind non-members viewing your profile"));
        var nucb = CT.dom.id("nonuserviewcheckbox");

        // checkbox for site-wide chat
        CT.dom.id("sitewidechatoption").appendChild(CT.dom.checkboxAndLabel("sitewidechat",
            u.site_wide_chat, "Check this box to chat with other CAN users"));
        var swcb = CT.dom.id("sitewidechatcheckbox");

        // dob
        var dob = {};
        CT.dom.dateSelectors(CT.dom.id("dobnode"), dob, 1900);
        dob.year.value = u.dob.year;
        dob.month.value = u.dob.month;
        dob.day.value = u.dob.day;

        var sameDob = function() {
            return dob.year.value == u.dob.year && dob.month.value == u.dob.month && dob.day.value == u.dob.day;
        };

        // gender
        var gnode = CT.dom.id("gendernode");
        var genderselect = CT.dom.select(["male", "female", "other", "decline to state"],
            ["male", "female", "other", "decline"], "genderselect", u.gender, "other");
        var genderother = CT.dom.field();
        if (genderselect.value == "other")
            genderother.value = u.gender;
        else
            genderother.style.display = "none";
        genderselect.onchange = function() {
            if (genderselect.value == "other")
                genderother.style.display = "block";
            else
                genderother.style.display = "none";
        };
        gnode.appendChild(genderselect);
        gnode.appendChild(genderother);
        var genderval = function() {
            if (genderselect.value == "other")
                return genderother.value.trim();
            return genderselect.value;
        };

        // blurb
        var bnode = CT.dom.id("blurbnode");
        var blurbta = CT.dom.textArea("blurbta", u.blurb, "fullwidth");
        bnode.appendChild(blurbta);
        CT.rte.wysiwygize("blurbta", true);

        var statusnode = CT.dom.node("", "div", "red");
        var setStatus = function(msg, timeout) {
            statusnode.innerHTML = msg || "";
            if (timeout)
                setTimeout(setStatus, timeout, null);
        };
        userinfo.appendChild(statusnode);

        var dhidden = CT.dom.node("", "div",
            "hidden small round bordered padded w200", "dstuff");
        CT.align.absed(dhidden, 615);
        dhidden.appendChild(CT.dom.node("Are you sure you want to delete your account? No take backs!"));
        dhidden.appendChild(CT.dom.button("Really Delete My Account", function() {
            CT.dom.passwordPrompt(function(pass) {
                CT.net.post("/edit", {"eid": uid, "data": {"key": uid,
                    "deleteaccount": 1, "password": pass}},
                    "error deleting account", function() {
                        alert("Account deleted!");
                        document.location = "/login.html";
                    });
            });
        }));
        document.body.appendChild(dhidden);

        var pdeleter = CT.dom.node(CT.dom.link("delete profile", function() {
            dhidden.style.top = (yp.clientHeight + 148) + "px";
            CT.dom.showHide(dhidden);
        }), "div", "right");
        userinfo.appendChild(pdeleter);

        var submitButton = CT.dom.button();
        var pg = CT.dom.id("profilegreeting");
        var refreshDeleted = function() {
            if (u.deleted) {
                pg.innerHTML = "Your profile has been deleted, and will not appear in User searches.";
                submitButton.innerHTML = "Undelete And Update Profile";
                pdeleter.style.display = "none";
            }
            else {
                pg.innerHTML = "Thank you for creating a free, secure profile with CAN.";
                submitButton.innerHTML = "Update Profile";
                pdeleter.style.display = "block";
            }
        };
        refreshDeleted();

        userinfo.appendChild(submitButton);
        submitButton.onclick = function() {
            var gender = genderval();
            if (sameDob() && email.value == u.email && zip.value == u.zipcode.code && newpass.value == "" && !docForm.data.value && mcb.checked == u.email_messages && ncb.checked == u.email_notifications && nlcb.checked == u.email_newsletters && cicb.checked == u.show_contact_info && spcb.checked == u.searchable_profile && nucb.checked == u.non_user_view && swcb.checked == u.site_wide_chat && gender == u.gender && blurbta.get() == u.blurb && address.value == u.address && phone.value == u.phone && fullname.value == u.fullName && surveycontext.get() == u.survey_context && CT.data.sameList(newSurveyAnswers, u.survey) && ! u.deleted)
                return alert("no changes to commit!");
            if (gender == "")
                return alert("you have selected 'other' for gender. please fill in the input field or select 'decline to state'");
            if (dob.year == "Year" || dob.month == "Month" || dob.day == "Day")
                return alert("invalid date of birth!");
            if (! CT.parse.validEmail(email.value))
                return alert("invalid email!");
            if (zip.value != u.zipcode.code) {
                zip.value = CT.parse.stripToZip(zip.value);
                if (zip.value == "")
                    return alert("invalid zip code!");
            }
            if (phone.value != u.phone && phone.value != "") {
                phone.value = CT.parse.stripToPhone(phone.value);
                if (phone.value == "")
                    return alert("please enter a 10-digit phone number");
            }
            if (newpass.value || renewpass.value) {
                if (newpass.value != renewpass.value)
                    return alert("new passwords don't match!");
                if (! CT.parse.validPassword(newpass.value))
                    return alert("invalid new password!");
            }
            var namelist = fullname.value.split(' ');
            if (namelist.length < 2)
                return alert("please provide your full name");
            var firstname = namelist[0];
            var lastname = namelist.slice(1).join(" ");
            var newdob = {"year": dob.year.value, "month": dob.month.value,
                "day": dob.day.value};
            var newdata = {"dob": newdob, "email": email.value,
                "blurb": blurbta.get(), "email_newsletters": nlcb.checked,
                "survey": newSurveyAnswers, "email_notifications": ncb.checked,
                "email_messages": mcb.checked, "gender": gender,
                "survey_context": surveycontext.get(), "zipcode": zip.value,
                "address": address.value, "phone": phone.value,
                "firstName": firstname, "lastName": lastname,
                "deleted": false, "show_contact_info": cicb.checked,
                "searchable_profile": spcb.checked, "non_user_view": nucb.checked,
                "site_wide_chat": swcb.checked
            };
            if (newpass.value)
                newdata.newpass = newpass.value;
            var rdata = {"key": uid};
            var doSubmit = function(pass) {
                setStatus("saving changes");
                if (pass)
                    rdata.password = pass;
                CT.net.post("/edit", {"eid": uid, "data": CT.data.diff(u, newdata,
                    rdata, ["dob"], {"zipcode": "code"}, ["survey"])},
                    "error editing profile", function() {
                        if (u.deleted) {
                            u.deleted = false;
                            refreshDeleted();
                        }
                        u.dob = newdob;
                        if (u.email != email.value) {
                            u.email = email.value;
                            u.authentication = listRemove(u.authentication, "email");
                        }
                        u.blurb = blurbta.get();
                        if (u.phone != phone.value) {
                            u.phone = phone.value;
                            u.authentication = listRemove(u.authentication, "phone");
                            showHideAuth("phone");
                        }
                        u.address = address.value;
                        u.gender = gender;
                        u.email_messages = mcb.checked;
                        u.email_notifications = ncb.checked;
                        u.email_newsletters = nlcb.checked;
                        u.show_contact_info = cicb.checked;
                        u.searchable_profile = spcb.checked;
                        u.non_user_view = nucb.checked;
                        u.site_wide_chat = swcb.checked;
                        u.firstName = firstname;
                        u.lastName = lastname;
                        u.zipcode.code = zip.value;
                        newpass.value = "";
                        renewpass.value = "";

                        setSiteWideChat(u.site_wide_chat);
                        setFullName();
                        CAN.cookie.set(uid, CAN.cookie.checkFirstName(),
                            CAN.cookie.checkLastName(), u.site_wide_chat);

                        if (docForm.data.value) {
                            setStatus("uploading avatar");
                            CT.upload.submit(docForm, function() {
                                docForm.data.value = "";
                                refreshAvatar();
                                setStatus("profile updated successfully!", 2000);
                            }, function(e) {
                                setStatus("failed to upload avatar: "+e);
                            });
                        }
                        else
                            setStatus("profile updated successfully!", 2000);
                    });
            };
            if (CAN.session.settings.password_to_edit_profile)
                CT.dom.passwordPrompt(doSubmit);
            else
                doSubmit();
        };
        alignAndClick();
    });
};

onload = function() {
    var uid = CAN.session.isLoggedIn();
    var pid = (location.href.indexOf("?u=") != -1) &&
        CAN.cookie.flipReverse(location.href.split("?u=")[1].split("#")[0]) || null;
    if (!(uid || pid))
        return document.location = "/login.html";
    CAN.widget.challenge.load(uid);
    if (uid && pid && uid != pid) {
        CT.net.post("/get", {"gtype": "user", "uid": uid, "role": 1},
            "error retrieving user data", function(u) {
                CT.data.add(u);
                loadPage(uid, pid);
            });
    } else
        loadPage(uid, pid);
};
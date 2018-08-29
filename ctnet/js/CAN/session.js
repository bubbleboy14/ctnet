var _RD = core.config.ctnet.domain;
CAN.session = {
	"RAWDOMAIN": _RD,
	"DOMAIN": "http://" + _RD,
	"okdomains": core.config.ctnet.okdomains,
	"settings": null,
	"welcomeFirstName": CT.dom.span(),

	"_getIEVersion": function() {
	    var ua = navigator.userAgent;
	    if (ua.indexOf("Opera") == -1) {
	        var parts = ua.split("MSIE ");
	        if (parts.length > 1)
	            return parseFloat(parts[1].split(";")[0]);
	    }
	    return -1;
	},
	"checkBrowser": function() {
	    var ieversion = CAN.session._getIEVersion();
	    if (ieversion != -1 && ieversion < 7.0)
	        document.location = "/browsers.html";
	},
	"checkDomain": function() {
	    if (CAN.session.okdomains.indexOf(document.location.hostname) == -1)
	        document.location = CAN.session.DOMAIN + document.location.pathname;
	},

	// user nodes. better place for this? maybe (small) CAN.util?
	"firstLastLink": function(u, noname, rfloat, hash, firstonly) {
	    var nl = CT.dom.node(null, "b", "unamelink");
	    nl.refresh = function(u) {
	        nl.innerHTML = noname && "user" || (u.firstName +
	            ((firstonly || !u.lastName) ? "" : (" " + u.lastName)));
	    };
	    u && nl.refresh(u);
	    if (core.config.ctnet.feedlinks)
	    	nl = CT.dom.link(nl, null,
	    		"/feed.html#!" + CAN.cookie.flipReverse(u.key), "nodecoration");
	    if (rfloat)
	        return CT.dom.node(nl, "div", "small right lpadded");
	    return nl;
	},
	"userLine": function(key, token, noline, n, wclass, wid, rfloat) {
	    token = token || "";
	    var u = CT.data.get(key);
	    n = n || CT.dom.link("", null, "/feed.html#!" + CAN.cookie.flipReverse(key));
	    if (rfloat)
	        n.appendChild(CT.dom.node(rfloat, "div", "right"));
	    n.appendChild(CT.dom.node(CT.dom.img("/get?gtype=avatar&size=chat&uid=" + CAN.cookie.flipReverse(key)), "div", "lfloat rpadded"));
	    if (rfloat)
	        n.appendChild(CAN.session.firstLastLink(u));
	    else
	        n.appendChild(CT.dom.node(u.firstName + " " + u.lastName));
	    n.appendChild(CT.dom.node("", "div", "clearnode"));
	    var uclass = "bottompadded";
	    if (!noline)
	        uclass += " bottomline";
	    if (wclass)
	        uclass += " " + wclass;
	    return CT.dom.node(n, "div", uclass, wid || ("uline" + token + key));
	},
	"uLineAndRight": function(key, rfloat, token) {
	    return CAN.session.userLine(key, token, null, newNode(), null, null, rfloat);
	},

	"isLoggedIn": function(settingscb) {
	    CAN.session.checkDomain();
	    CAN.session.checkBrowser();
	    CT.dom.loadAllNode();
	    var welbar = CT.dom.id("welcome_bar");
	    welbar.innerHTML = "";

	    var uid = CAN.cookie.getUid();

	    // same for every page...
	    CAN.frame.header(uid);
	    CAN.frame.footer();

	    var fn = uid && CAN.cookie.checkFirstName() || "(Guest)";
	    var logmsg = uid && "Log Out" || "Log In";
	    var rd = CT.dom.div("", "small right shiftupless");
	    if (uid) {
	        rd.appendChild(CAN.frame.setInfoBubble(
	        	CT.dom.linkWithIcon("/img/header/participate.png",
	            "Participate", "/participate.html"), CAN.frame.navinfo.participate));
	        rd.appendChild(CT.dom.span("&nbsp;&nbsp;&nbsp;"));
	        rd.appendChild(CAN.frame.setInfoBubble(
	        	CT.dom.linkWithIcon("/img/header/profile.png",
	            "Profile", "/profile.html"), CAN.frame.navinfo.profile));
	        rd.appendChild(CT.dom.span("&nbsp;&nbsp;&nbsp;"));
	    }
        rd.appendChild(CAN.frame.setInfoBubble(
        	CT.dom.linkWithIcon("/img/header/what.png", "What's This?", null,
        		CAN.widget.chatterlightbox.load), CAN.frame.navinfo.what));
        rd.appendChild(CT.dom.span("&nbsp;&nbsp;&nbsp;"));
	    CT.net.post("/settings", {}, "error retrieving settings",
	        function(s) {
	            CAN.session.settings = s;
	            if (CAN.session.settings.closed_beta) {
	                if (uid)
	                    rd.appendChild(CT.dom.linkWithIcon("/img/header/inout.png", logmsg, "/beta.html"));
	                else {
	                    if (location.pathname.slice(1,-5) == "login"
	                    	&& location.hash.slice(1) == CAN.session.settings.beta_password) {
	                        location.hash = "";
	                        var wbox = CT.align.centered(CT.dom.node("", "div", "hidden adminpopup black"));
	                        wbox.appendChild(CT.dom.node("Welcome to CAN Beta",
	                            "div", "blue big bold bottompadded"));
	                        wbox.appendChild(CT.dom.node("To get started, check out the links on the left, under 'Login'.", "div", "bottompadded"));
	                        wbox.appendChild(CT.dom.node("To log in to your account, click 'Existing User'.", "div", "bottompadded"));
	                        wbox.appendChild(CT.dom.node("To create a new account, click 'New User'.", "div", "bottompadded"));
	                        wbox.appendChild(CT.dom.button("OK",
	                            function() { CT.dom.showHide(wbox); }));
	                        rd.appendChild(centered(wbox));
	                        rd.appendChild(CT.dom.linkWithIcon("/img/header/inout.png",
	                            logmsg, null,
	                            function() { CT.dom.showHide(wbox); centerall(); }));
	                    }
	                    else {
	                        document.location = "/beta.html";
	                        return;
	                    }
	                }
	            }
	            else
	                rd.appendChild(CAN.frame.setInfoBubble(CT.dom.linkWithIcon("/img/header/inout.png",
	                    logmsg, "/login.html"), CAN.frame.navinfo[logmsg.toLowerCase().replace(" ", "")]));
	            if (settingscb) settingscb();
	            if (CAN.cookie.checkSiteWideChat() && CT.info.page != "community")
	                CAN.frame.loadSiteWideChat();
	            CT.dom.showAllNode();
	        });
	    welbar.appendChild(rd);

	    var greeting = CT.dom.node("", "span", "italic");
	    greeting.appendChild(CT.dom.node((new Date()).toDateString() + " ... Welcome ", "span"));
	    CAN.session.welcomeFirstName.innerHTML = fn;
	    greeting.appendChild(CAN.session.welcomeFirstName);
	    greeting.appendChild(CT.dom.node(" to CAN, a wiki-style forum for peaceful activism.", "span"));
	    welbar.appendChild(greeting);

	    CT.mobile.initResizer(!!uid, CAN.config.mobile.resize,
	    	CAN.config.mobile.menus, CAN.config.mobile.page,
	    	CAN.search.doBasicSearch);
	    return uid;
	},

	// admin checker
	"gvars": {
	    "isadmin": false,
	    "isnotadmin": false,
	    "checking": false,
	    "cbs": [],
	    "ngcbs": []
	},
	"checkAdmin": function(u) {
	    CAN.session.gvars.isadmin = u.role.indexOf("admin") != -1;
	    CAN.session.gvars.isnotadmin = !CAN.session.gvars.isadmin;
	    return CAN.session.gvars.isadmin;
	},
	"ifAdmin": function(uid, cb, ngcb) {
	    if (CAN.session.gvars.isnotadmin) return ngcb && ngcb();
	    if (CAN.session.gvars.isadmin) return cb();
	    var u = CT.data.get(uid);
	    if (u && u.role)
	        return CAN.session.checkAdmin(u) && cb() || (ngcb && ngcb());
	    CAN.session.gvars.cbs.push(cb);
	    ngcb && CAN.session.gvars.ngcbs.push(ngcb);
	    if (!CAN.session.gvars.checking) {
	        CAN.session.gvars.checking = true;
	        CT.net.post("/get", { "gtype": "user", "uid": uid, "role_only": 1 },
	            "error retrieving user data", function(d) {
	                CT.data.add(d);
	                var cbset = CAN.session.checkAdmin(d) ?
	                	CAN.session.gvars.cbs : CAN.session.gvars.ngcbs;
	                for (var i = 0; i < cbset.length; i++)
	                    cbset[i]();
	            });
	    }
	}
};
CAN.frame = {
	"navitems": [ "Home", "News", "Video", "Referenda",
	    "Community", "Recommendations", "Cases", "About" ],
	"navinfo": {
	    'home': 'Check out the latest news, videos, and more from users like you.',
	    'news': 'Read news articles submitted by your peers.',
	    'video': 'Watch user-submitted videos.',
	    'referenda': 'Hammer out some legislation with fellow CAN users.',
	    'community': 'Ask a question, submit a change idea, post a thought, discover upcoming events, and chat live with other CAN users.',
	    'recommendations': "View user-sourced essays, quotes, books, pictures, articles, and videos that we recommend based on your personal taste. Keep rating content to help us get to know you better!",
	    'cases': 'Review cases submitted by users like you. If you think a case has merit, help compile evidence!',
	    'about': 'Learn the basics about Civil Action Network.',
	    'participate': 'Disagree with anything you see? Great! Post a new perspective on the Participate Page!',
	    'profile': 'Establish your credentials, connect with other users, participate in thought streams, tweak your account settings, and review your content contributions to the CAN community.',
	    'what': "What are the people saying? Aren't you curious? And what's this all about, anyway?",
	    'logout': 'We miss you already!',
	    'login': 'Log in to your free, secure CAN account and broadcast your perspective today!'
	},
	"header": function(uid) {
	    var header = CT.dom.id("header");
	    header.innerHTML = "";
	    var hright = CT.dom.node("", "div", "right");

	    // top
	    CAN.search.build(uid, header, hright);
	    var logonode = CT.dom.node(CT.dom.img("/img/header/can-logo.jpg",
	        null, null, "/home.html"));
	    logonode.style.paddingTop = "17px";
	    logonode.firstChild.firstChild.style.width = "420px";
	    logonode.firstChild.firstChild.style.height = "auto";
	    header.appendChild(logonode);

	    // nav bar
	    var navbar = CT.dom.id("navigation_bar");
	    navbar.innerHTML = "";
	    navbar.appendChild(CT.dom.img("/img/header/Top_Blue_Nav_Bar_LEFT.gif"));
	    for (var i = 0; i < CAN.frame.navitems.length; i++) {
	        var _thisname = CAN.frame.navitems[i].toLowerCase();
	        var iscurrent = CT.info.page == _thisname;
	        var navname = "/img/header/" + CAN.frame.navitems[i] + "_Nav"
	            + ((!iscurrent) && "_NOT" || "") + "_ACTIVE.gif";
	        navbar.appendChild(CAN.frame.setInfoBubble(CT.dom.img(navname,
	        	null, null, (!iscurrent) && ("/" + _thisname + ".html")),
	        	CAN.frame.navinfo[_thisname]));
	    }
	    navbar.appendChild(CT.dom.img("/img/header/Top_Blue_Nav_Bar_RIGHT.gif"));

	    CT.dom.blurField(CT.dom.id("restriction"));
	},
	"footer": function() {
	    var footer = CT.dom.id("footer");
	    footer.innerHTML = "";
	    footer.appendChild(CT.dom.node(CT.dom.link("www.CivilActionNetwork.org", null, "https://www.civilactionnetwork.org")));
	    var navfoot = CT.dom.node();
	    for (var i = 0; i < CAN.frame.navitems.length; i++) {
	        navfoot.appendChild(CT.dom.link(CAN.frame.navitems[i], null,
	        	"/" + CAN.frame.navitems[i].toLowerCase() + ".html"));
	        navfoot.appendChild(CT.dom.node(" | ", "span"));
	    }
	//    navfoot.appendChild(newLink("Terms of Use", null, "/about.html#TermsofUse"));
	    navfoot.appendChild(CT.dom.link("Terms of Use", function() {
	        if (location.pathname.slice(1,-5) == "about")
	            CT.panel.swap("TermsofUse");
	        else
	            document.location = "/about.html#TermsofUse";
	    }));
	    footer.appendChild(navfoot);
	    footer.appendChild(CT.dom.node("", "br"));
	    footer.appendChild(CT.dom.node(CT.dom.img("/img/PublicDomain.png", null, null, "http://creativecommons.org")));
	    footer.appendChild(CT.dom.node("", "br"));
	    footer.appendChild(CT.dom.node("Public Domain, with the caveat that certain images and excerpts from third party publications may be licensed by their respective copyright holders. Please inquire."));
	},

	"basic": function() {
		CT.dom.loadAllNode();
		CAN.frame.header();
		CAN.frame.footer();
		CT.dom.showAllNode();
	},

	// info bubbles
	"infoBubble": null,
	"bubbleBounds": null,
	"checkPos": function(n) {
		return [n.offsetLeft, CT.align.offset(n).top];
		// method below doesn't work horizontally w/ resize...
	    if (n.style.position == "fixed") {
	        CAN.frame.infoBubble.style.position = "fixed";
	        return [n.offsetLeft, n.offsetTop];
	    } else {
	        CAN.frame.infoBubble.style.position = "absolute";
	        return CT.align.position(n);
	    }
	},
	"setInfoBubble": function(n, content, poptop) {
    	var _f = CAN.frame;
	    if (!_f.infoBubble) {
	        _f.infoBubble = CT.dom.node("", "div", "small hidden infobubble");
	        CT.dom.ALLNODE.appendChild(_f.infoBubble);
	        _f.bubbleBounds = {
	            'left': 0,
	            'top': 0
	        };
	    }
	    n.onmouseover = function(e) {
	        if (n.nodeName == "A") // contains image
	            n = n.firstChild;
	        var npos = _f.checkPos(n); // recheck every time in case target moves
	        if (n.parentNode == document.body)
	        	document.body.appendChild(_f.infoBubble);
	        else
	        	CT.dom.ALLNODE.appendChild(_f.infoBubble);
	        _f.infoBubble.innerHTML = content;
	        CT.dom.showHide(_f.infoBubble, true);
	        var voffset = poptop ? -(_f.infoBubble.clientHeight + 10)
	        	: ((n.clientHeight || n.offsetHeight) + 10);
	        _f.bubbleBounds.right = _f.bubbleBounds.left
	        	+ CT.dom.ALLNODE.clientWidth - _f.infoBubble.clientWidth;
	        _f.bubbleBounds.bottom = _f.bubbleBounds.top
	        	+ CT.dom.ALLNODE.clientHeight - _f.infoBubble.clientHeight;
	        _f.infoBubble.style.left = Math.min(_f.bubbleBounds.right - 10,
	            Math.max(_f.bubbleBounds.left + 10,
	            npos[0] - (_f.infoBubble.clientWidth - (n.clientWidth || n.offsetWidth)) / 2)) + "px";
	        _f.infoBubble.style.top = Math.min(_f.bubbleBounds.bottom - 10,
	            Math.max(_f.bubbleBounds.top + 10, npos[1] + voffset)) + "px";
	    };
	    n.onmouseout = function() {
	        CT.dom.showHide(_f.infoBubble, false, true);
	    };
	    return n;
	},

	// chat widget
	"CHATINFO": "Chat live with other CAN users! Not your thing? If you don't feel like talking, you can disable the Site Wide Chat Widget on the profile page.",
	"loadSiteWideChat": function() {
	    document.body.appendChild(CT.dom.script(CT.net._encode &&
	        "/lib/chat.js" || "/js/lib/chat.js"));
	    document.body.appendChild(CT.dom.script(null,
	        'CT.dom.doWhenNodeExists("canchatiframe", function() { CAN.frame.setInfoBubble(CT.dom.id("canchatiframe"), CAN.frame.CHATINFO, true); });', true));
	},

	// login buttonization
	"clickToLogin": function(b) {
	    b.onclick = function() { document.location = "/login.html"; };
	}
};
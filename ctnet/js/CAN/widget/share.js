CAN.widget.share = {
	// SHARELINKS adapted from http://bookmarkcraze.com/
	"SHARELINKS": [
		{"icon": "/img/share/delicious.png",
			"alt": "del.icio.us",
			"url": "http://del.icio.us/post?url1=LINK_URL&title=LINK_TITLE"},
		{"icon": "/img/share/digg.png",
			"alt": "Digg it",
			"url": "http://digg.com/submit?phase=2&url=LINK_URL&title=LINK_TITLE"},
		{"icon": "/img/share/stumbleupon.png",
			"alt": "Stumbleupon",
			"url": "http://www.stumbleupon.com/submit?url=LINK_URL&title=LINK_TITLE"},
		{"icon": "/img/share/windowslive.png",
			"alt": "Windows Live",
			"url": "https://favorites.live.com/quickadd.aspx?url=LINK_URL&title=LINK_TITLE"},
		{"icon": "/img/share/reddit.png",
			"alt": "Reddit",
			"url": "http://reddit.com/submit?url=LINK_URL&title=LINK_TITLE"},
		{"icon": "/img/share/technorati.png",
			"alt": "Technorati",
			"url": "http://technorati.com/favorites/?sub=favthis&add=LINK_URL"},
		{"icon": "/img/share/plus.png",
			"alt": "Google Plus",
			"url": "https://plus.google.com/share?url=LINK_URL&title=LINK_TITLE&message={TITLE}"},
		{"icon": "/img/share/slashdot.png",
			"alt": "Slashdot",
			"url": "http://slashdot.org/slashdot-it.pl?op=basic&url=LINK_URL"},
		{"icon": "/img/share/yahoo.png",
			"alt": "Yahoo Buzz",
			"url": "http://buzz.yahoo.com/submit/?url=LINK_URL"},
		{"icon": "/img/share/tumblr.png",
			"alt": "tumblr",
			"url": "http://www.tumblr.com/share?s=&t=LINK_TITLE&u=LINK_URL&v=3"},
		{"icon": "/img/share/linkedin.png",
			"alt": "Linkedin",
			"url": "https://www.linkedin.com/cws/share?url=LINK_URL"},
		{"icon": "/img/share/vk.png",
			"alt": "VK",
			"url": "http://vkontakte.ru/share.php?url=LINK_URL"},
		{"icon": "/img/share/friendfeed.png",
			"alt": "FriendFeed",
			"url": "http://friendfeed.com/share?url=LINK_URL&title=LINK_TITLE"},
		{"icon": "/img/share/newsvine.png",
			"alt": "Newsvine",
			"url": "http://www.newsvine.com/_tools/seed&save?u=LINK_URL&h=LINK_TITLE"}
	],
	"RSS_ITEMS": [
		{ "rtype": "news", "name": "News" },
		{ "rtype": "referenda", "name": "Law" },
		{ "rtype": "video", "name": "Video" },
		{ "rtype": "event", "name": "Event" },
		{ "rtype": "book", "name": "Book" },
		{ "rtype": "quote", "name": "Quote" },
		{ "rtype": "thought", "name": "Think" },
		{ "rtype": "sustainableaction", "name": "Act" },
		{ "rtype": "case", "name": "Case" },
		{ "rtype": "changeidea", "name": "Idea" },
		{ "rtype": "paper", "name": "Paper" },
		{ "rtype": "opinion", "name": "View" }
	],
	"type2item": {
		"news": "Article",
		"video": "Video",
		"referenda": "Referendum",
		"case": "Case",
		"community": "Community",
		"recommendations": "Recommendation"
	},
	"SHAREURL": {
		"FACEBOOK": "http://www.facebook.com/share.php?u=LINK_URL",
		"TWITTER": "http://twitthis.com/twit?url=LINK_URL&title=LINK_TITLE"
	},
	"pageAddrPages": { "case": "cases" },
	"sharebuttons": {},
	"currentShareName": null,
	"currentShareKey": null,

	"rsslinks": function() {
		var start = 0, end = 6, n = CT.dom.node("", "div", "shiftup");
		n.style.fontSize = "55%";
		n.style.width = "185px";
		for (var j = 0; j < 2; j++) {
			var row = CT.dom.node();
			for (var i = start; i < end; i++) {
				var item = CAN.widget.share.RSS_ITEMS[i];
				row.appendChild(CT.dom.labeledImage("/img/buttons/rss_icon.gif",
					"/rss?rtype=" + item.rtype, item.name,
					"CAN RSS Feed: " + item.name, "centeredimg",
					i == end - 1 ? "lfloat" : "lfloat rbordered",
					"centered w26 nowrap"));
			}
			n.appendChild(row);
			start += 6;
			end += 6;
		}
		return n;
	},
	"pageAddr": function(lname, hash, prefix) {
		return CAN.session.DOMAIN + "/" + (CAN.widget.share.pageAddrPages[lname] || lname)
			+ ".html" + ((hash || prefix) && ("#!" + ((hash && prefix) ? prefix
				+ "%7C" + escape(hash) : (prefix || escape(hash)))) || "");
	},
	"replaceLinkTokens": function(lname, txt, token, hash, title, prefix) {
		if (token && !CAN.widget.share.sharebuttons[token])
			CAN.widget.share.sharebuttons[token] = txt;
		var lurl = escape(CAN.widget.share.pageAddr(lname, hash, prefix));
		var ltitle = "CAN " + CT.parse.capitalize(lname) + (title && (" - "+title) || "");
		return txt.replace(/LINK_URL/g, lurl).replace(/LINK_TITLE/g, ltitle);
	},
	"updateShareItem": function(lname, newkey, prefix) {
		CAN.widget.share.currentShareName = lname;
		CAN.widget.share.currentShareKey = newkey;
		CAN.widget.share.currentSharePrefix = prefix;
		var ntitle = newkey && CT.data.map[newkey] && CT.data.map[newkey].title || prefix || null;
		var frkey = newkey && CAN.cookie.flipReverse(newkey) || null;
		for (var k in CAN.widget.share.sharebuttons)
			CT.dom.id(k).href = CAN.widget.share.replaceLinkTokens(lname,
				CAN.widget.share.sharebuttons[k], null, frkey, ntitle, prefix);
		var cboard = CT.dom.id(lname+"clipboard");
		var cboardbox = CT.dom.id(lname+"clipboard_box");
		var cboardnode = CT.dom.id(lname+"clipboard_node");
		var casenode = (["case", "community", "recommendations"].indexOf(lname) != -1)
			? { style: {} } : CT.dom.id("casenode").parentNode;
		var mmcb = CT.dom.id("mmclipboard");
		if (newkey == null && prefix == null) {
			cboard.style.display = casenode.style.display = "none";
			cboardbox.style.opacity = "0";
			if (mmcb)
				mmcb.style.display = "none";
		} else {
			casenode.style.display = "block";
			cboard.style.display = "inline";
			if (mmcb)
				mmcb.style.display = "block";
			cboardnode.value = CAN.widget.share.pageAddr(lname, frkey, prefix);
			cboardnode.select();
		}
		var cbs = document.getElementsByClassName("casebutton");
		for (var i = 0; i < cbs.length; i++)
			cbs[i].style.display = "inline";
	},
	"shareSub": function(lname, pnode, x, y, skipLink) {
		pnode = pnode || CT.dom.id("sharesubnode");
		x = x || 627;
		y = y || 285;
		var ssbox = CT.dom.node("", "div", "hidden smallpopup round");
		ssbox.appendChild(CT.dom.node(CT.dom.link("X", function() {
			CT.dom.showHide(ssbox); }), "div", "right small"));
		var sharebox = CT.dom.node();
		sharebox.appendChild(CT.dom.node("Share", "div", "blue bold bottompadded"));
		for (var i = 0; i < CAN.widget.share.SHARELINKS.length; i++) {
			var s = CAN.widget.share.SHARELINKS[i];
			var slinkid = (lname+s.alt).replace(/ /g, "").replace(/\./g, "");
			var shareItemClass = "rpaddedsmall";
			// fix for an obscure chrome rendering bug
			if (i > 6) {
				shareItemClass += " tbordered";
			}
			sharebox.appendChild(CT.dom.img(s.icon, shareItemClass,
				null, CAN.widget.share.replaceLinkTokens(lname, s.url, slinkid),
				"_blank", s.alt, slinkid));
		}

		var subbox = CT.dom.node();
		subbox.appendChild(CT.dom.labeledImage("/img/buttons/rss_icon.gif",
			"/rss?rtype=all", "ALL", "CAN RSS Feed: The Whole Shebang",
			null, "rssallbox", "smaller lpaddedsmall", true));
		subbox.appendChild(CT.dom.node("Subscribe", "div", "blue bold bottompadded"));
		subbox.appendChild(CAN.widget.share.rsslinks());
		ssbox.appendChild(sharebox);
		ssbox.appendChild(subbox);
		CT.dom.ALLNODE.appendChild(CT.align.absed(ssbox, x, y));
		var switchEm = function(toOn, toOff) {
			toOn.style.display = "block";
			toOff.style.display = "none";
		};

		if (!skipLink) {
			var cbnode = CT.dom.node([
				CT.dom.node("Ctr-C to Copy URL"),
				CT.dom.field(lname+"clipboard_node")
			], "div", "transparent clipboard_box", lname+"clipboard_box");
			cbnode._on = false;
			pnode.appendChild(cbnode);
		}

		pnode.appendChild(CT.dom.img("/img/buttons/rss_icon.gif",
			"", function() {
				CT.dom.showHide(ssbox, true);
				switchEm(subbox, sharebox);
			}, null, null, "CAN RSS Feeds"));
		pnode.appendChild(CT.dom.img("/img/share/facebook.png", null, null,
			CAN.widget.share.replaceLinkTokens(lname, CAN.widget.share.SHAREURL.FACEBOOK,
			lname+"Facebook"), "_blank", "Facebook", lname+"Facebook"));
		pnode.appendChild(CT.dom.img("/img/share/twitter.png", null, null,
			CAN.widget.share.replaceLinkTokens(lname, CAN.widget.share.SHAREURL.TWITTER,
			lname+"Twitter"), "_blank", "Twitter", lname+"Twitter"));
		pnode.appendChild(CT.dom.img("/img/buttons/share_icon.png", "", function() {
			CT.dom.showHide(ssbox, true);
			switchEm(sharebox, subbox);
		}, null, null, "More Share Options"));
		if (!skipLink) {
			pnode.appendChild(CT.dom.img("/img/buttons/clipboard.png", "hidden", function() {
				if (cbnode._on) { // hide fallback node
					CT.dom.showHideT(cbnode);
					cbnode._on = false;
				} else {
					cbnode.firstChild.nextSibling.select();
					if (document.execCommand('copy'))
						alert("Link saved to clipboard. Great!");
					else {
						CT.dom.showHideT(cbnode);
						cbnode._on = true;
						cbnode.firstChild.nextSibling.select();
					}
				}
			}, null, null, "Link To " + CAN.widget.share.type2item[lname], lname + "clipboard"));
		}
	}
};
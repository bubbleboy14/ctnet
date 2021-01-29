CAN.search = {
	"SEARCHHELPTEXT": "<div class=\"big bold\">What Is The CAN Smart Web Search?</div><div class=\"small\">Language is routinely diluted. For example, how often is \"eco-friendly\" just a superficial label, and \"freedom\" merely a veneer? We must dig deeper. Quality research is a careful study to help separate propaganda from truth.</div><br><div class=\"bold\">Eco-Search</div><div class=\"small\">CAN eco-search is designed to dig deeper, and deliver information about what is natural and organic. For example, it's not enough to search for home cleaning products that are \"safe\" or \"non-toxic,\" since virtually all conventional products make these claims, yet still contain highly unnatural and unsafe chemicals.</div><br><div class=\"bold\">Liberty Search</div><div class=\"small\">Nor is it enough to simply read the mainstream news to understand what's really happening in the world. History shows the most oppressive and violent regimes also espouse ideals of freedom and prosperity through their conventional media. Again, we need to dig deeper - to learn about the New World Order power centers and tools. A helpful rule of thumb is that all information should be presumed fallible (i.e., gives a partial story, misdirects issues, presents false solutions), even from \"independent\" news, books, and documentaries. CAN liberty search is just a helpful tool for starting your reading - it's up to the reader to embrace temperance, logic, and careful reflection in the humble search for truth.</div>",
	"ADVANCEDSEARCHHELPTEXT": "CAN Smart Web Search returns results in the categories selected under <b>Search Types</b>. The standard CAN search scans the CAN media archive for hits, filtering by the dates indicated under <b>Filter CAN Results by Date</b> (if any). Google-enabled searches (disabled by default, indicated by <i>italics</i> in the <b>Search Types</b> list) are restricted to the domain specified under <b>Restrict Google Results to Site</b> (if any).",
	"GOOGLE_DISCLAIMER": "If you wish, you can expand your search beyond Civil Action Network by checking the 'Search Google' checkbox below.",
	"info": {
	    'Video': { 'google': false, 'can': true },
	    'News': { 'google': false, 'can': true },
	    'Book': { 'google': false, 'can': true },
	    'Law': { 'can': true },
	    'Event': { 'can': true },
	    'Group': { 'can': true },
	    'Idea': { 'can': true },
	    'Paper': { 'can': true },
	    'Quote': { 'can': true },
	    'Action': { 'can': true },
	    'Thought': { 'can': true },
	    'Question': { 'can': true },
	    'Change': { 'can': true },
	    'Meme': { 'can': true },
	    'Case': { 'can': true },
	    'User': { 'can': true }
	},
	"types": ['Video', 'News', 'Book', 'Law',
	    'Event', 'Group', 'Idea', 'Paper', 'Quote', 'Action',
	    'Thought', 'Question', 'Change', 'Case', 'User', 'Meme'],
	"cansearch": null,
	"_google_logo": null,
	"setCANsearch": function(cs) {
		CAN.search.cansearch = cs;
	},
	"checkSearchTypes": function() {
	    var c = CAN.cookie.get();
	    return CAN.cookie.flipU(c.slice(c.indexOf("<>")+2,
	    	c.indexOf("??"))) || CAN.search.types.join('');
	},
	"toggleGoogle": function(ison) {
	    CAN.search._google_logo.style.display = ison ? 'inline' : 'none';
	},
	"doBasicSearch": function() {
	    var val = CT.dom.getFieldValue("basicsearch", null, { "length": 3 })
	        || CT.dom.getFieldValue("mobile_search", null, { "length": 3 });
	    if (val) {
	        CAN.cookie.set(CAN.cookie.getUid(), CAN.cookie.checkFirstName(),
	        	CAN.cookie.checkLastName(), CAN.cookie.checkSiteWideChat());
	        if (CT.info.page == "search") {
//	            CT.dom.setFieldValue(val, "search", ["childNodes", 0, "search"]);
	            CT.dom.id("basicsearch").value = val;
	            CAN.search.cansearch.search();
	            if (CT.mobile.isMobile())
		            CT.dom.ALLNODE.toggleMobileMenu();
	        } else
	            document.location = "/search.html#"+val;
	    }
	},
	"build": function(uid, header, hright) {
	    var sinput = CT.dom.field("basicsearch");
	    hright.appendChild(CT.dom.img("/img/header/Smart_Web_Search.gif", null, function() { sinput.focus(); }));

	    // search help box
	    var searchhelpnode = CT.dom.node(CAN.search.SEARCHHELPTEXT,
	    	"div", "hidden", "searchhelpbox");
	    searchhelpnode.insertBefore(CT.dom.node(CT.dom.link("X",
	    	function() { CT.dom.showHide(searchhelpnode); }),
	    	"div", "small right"), searchhelpnode.firstChild);
	    CT.dom.ALLNODE.appendChild(CT.align.absed(searchhelpnode, 200, 140));

	    // advanced search box
	    var ast = CAN.search.checkSearchTypes();
	    var advancedsearch = CT.dom.node("", "div", "hidden", "advancedsearchbox");
	    advancedsearch.appendChild(CT.dom.node(CT.dom.link("X", function() {
	        CT.dom.showHide(advancedsearch); }), "div", "small right"));
	    var t = CT.dom.node("", "table");
	    var r = t.insertRow(0);
	    var c = r.insertCell(0);
	    for (var i = 0; i < CAN.search.types.length; i++) {
	        var s = CAN.search.types[i];
	        var si = CAN.search.info[s];
	        var sc = '';
	        if (si.google) sc += ' italic';
	        if (si.can) sc += ' bold';
	        sc = sc.slice(1);
	        if (i == 5 || i == 10)
	            c = r.insertCell(-1);
	        c.appendChild(CT.dom.checkboxAndLabel(s, ast.indexOf(s) != -1,
	            s+" Search", sc, "nowrap"));
	    }
	    var st = CT.dom.node("", "div", "bordered padded round bottommargined");
	    st.appendChild(CT.dom.node("Search Types",
	        "div", "big bold bottommargined bottomline"));
	    st.appendChild(t);
	    advancedsearch.appendChild(st);

	    var rnode = CT.dom.node("", "div", "bordered padded round bottommargined");
	    rnode.appendChild(CT.dom.node("Google Searching", "div",
	        "big bold bottommargined bottomline"));
	    rnode.appendChild(CT.dom.node(CAN.search.GOOGLE_DISCLAIMER, "div", "bottompadded"));
	    rnode.appendChild(CT.dom.checkboxAndLabel('Google', ast.indexOf('Google') != -1,
	        "Search Google", null, null, function(cbnode) {
	            CT.search.toggleGoogle(cbnode.checked);
	        }));
	    rnode.appendChild(CT.dom.node("Restrict Google Results to Site: ",
	        "label", "", "", {"for": "restriction", "htmlFor": "restriction"}));
	    rnode.appendChild(CT.dom.node("", "input", "", "restriction",
	        {"value": CAN.cookie.checkSiteRestriction()}));
	    advancedsearch.appendChild(rnode);

	    // filter by date
	    var fbd = CT.dom.node("", "div", "bordered padded round bottommargined");
	    fbd.appendChild(CT.dom.node("Filter CAN Results by Date",
	        "div", "big bold bottommargined bottomline"));
	    var sdnode = CT.dom.node();
	    sdnode.appendChild(CT.dom.node("Start Date:&nbsp;", "span"));
	    CT.dom.dateSelectors(sdnode, CAN.cookie.search_start_date, 2011, null, false, true);
	    fbd.appendChild(sdnode);
	    var ednode = CT.dom.node();
	    ednode.appendChild(CT.dom.node("End Date:&nbsp;&nbsp;", "span"));
	    CT.dom.dateSelectors(ednode, CAN.cookie.search_end_date, 2011, null, false, true);
	    fbd.appendChild(ednode);
	    var sd = CAN.cookie.checkStartDate();
	    var ed = CAN.cookie.checkEndDate();
	    CAN.cookie.search_start_date.year.value = sd.slice(0,4);
	    CAN.cookie.search_start_date.month.value = sd.slice(4);
	    CAN.cookie.search_end_date.year.value = ed.slice(0,4);
	    CAN.cookie.search_end_date.month.value = ed.slice(4);
	    advancedsearch.appendChild(fbd);

	    var howto = CT.dom.node("", "div", "bordered padded round bottommargined");
	    howto.appendChild(CT.dom.node("How Search Works",
	        "div", "big bold bottommargined bottomline"));
	    howto.appendChild(CT.dom.node(CAN.search.ADVANCEDSEARCHHELPTEXT));
	    advancedsearch.appendChild(howto);

	    CT.dom.ALLNODE.appendChild(CT.align.absed(advancedsearch, 250, 140));

	    var libertyOnly1 = function() {
	        if (CT.dom.id("Libertycheckbox").checked)
	            CT.dom.id("Ecocheckbox").checked = false;
	    };

	    var ecoOnly1 = function() {
	        if (CT.dom.id("Ecocheckbox").checked)
	            CT.dom.id("Libertycheckbox").checked = false;
	    };

	    var libertyOnly2 = function() {
	        if (! CT.dom.id("Libertycheckbox").checked)
	            CT.dom.id("Ecocheckbox").checked = false;
	    };

	    var ecoOnly2 = function() {
	        if (! CT.dom.id("Ecocheckbox").checked)
	            CT.dom.id("Libertycheckbox").checked = false;
	    };

	    var libcbdata = {"type": "checkbox", "onclick": libertyOnly1};
	    if (ast.indexOf("Liberty") != -1)
	        libcbdata.checked = true;
	    CT.dom.ALLNODE.appendChild(CT.align.absed(CT.dom.node("", "input",
	        "", "Libertycheckbox", libcbdata), 726, 106));
	    var ecocbdata = {"type": "checkbox", "onclick": ecoOnly1};
	    if (ast.indexOf("Eco") != -1)
	        ecocbdata.checked = true;
	    CT.dom.ALLNODE.appendChild(CT.align.absed(CT.dom.node("", "input",
	        "", "Ecocheckbox", ecocbdata), 832, 106));

	    // search input, search button, search functionality
	    CT.dom.inputEnterCallback(sinput, CAN.search.doBasicSearch);
	    CT.dom.ALLNODE.appendChild(CT.align.absed(sinput, 458, 107));
	    CT.dom.ALLNODE.appendChild(CT.align.absed(CT.dom.img("/img/header/search_button.gif",
	    	"", CAN.search.doBasicSearch), 655, 107));

	    hright.appendChild(CT.dom.node(CT.dom.img("/img/header/Liberty_Bell_Search.gif"),
	        "label", "", "", {"for": "Libertycheckbox",
	        "htmlFor": "Libertycheckbox", "onclick": libertyOnly2}));
	    hright.appendChild(CT.dom.node(CT.dom.img("/img/header/Eco_Leaf_Search.gif"),
	        "label", "", "", {"for": "Ecocheckbox",
	        "htmlFor": "Ecocheckbox", "onclick": ecoOnly2}));
	    header.appendChild(hright);

	    CAN.search._google_logo = CT.dom.img("/img/header/Powered_by_Google.gif",
	    	null, null, "http://www.google.com/");
	    header.appendChild(CT.align.absed(CAN.search._google_logo, 445, 128));
	    CAN.search.toggleGoogle(ast.indexOf('Google') != -1);

	    var aslink = CT.dom.link("ADVANCED SEARCH", function() {
	        CT.dom.showHide(advancedsearch); }, null, "smaller nowrap");
	    header.appendChild(aslink);
	    CT.align.absed(aslink, 718 - aslink.offsetWidth, 133);

	    header.appendChild(CT.align.absed(CT.dom.link("What's this?", function() {
	        CT.dom.showHide(searchhelpnode); }, null, "smaller nowrap"), 729, 133));//128));
	    header.appendChild(CT.align.absed(CT.dom.link("Ask the Community", null,
	        "/community.html#!Questions", "smaller nowrap"), 835, 133));
	}
};
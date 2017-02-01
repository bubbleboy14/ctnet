CAN.cookie = {
	"search_start_date": {},
	"search_end_date": {},
	"set": function(uid, firstName, lastName, siteWideChat) {
	    if (siteWideChat == undefined)
	        siteWideChat = true;
	    var c = (siteWideChat ? '1' : '0') + CAN.cookie.flipU(firstName || "") + "&&" + CAN.cookie.flipU(lastName || "") + "||" + CAN.cookie.flipU(uid || "") + "<>" + CAN.cookie.flipU(CAN.cookie.activeSearchTypes()) + "??" + CAN.cookie.flipU(CT.dom.getFieldValue("restriction", [], {"requires": ["."]}) || "") + "$$";
	    if (CAN.cookie.search_start_date.year) {
	        c += CAN.cookie.flipU(CAN.cookie.search_start_date.year.value
	        	+ CAN.cookie.search_start_date.month.value) + "**"
	        	+ CAN.cookie.flipU(CAN.cookie.search_end_date.year.value
	        	+ CAN.cookie.search_end_date.month.value);
	    }
	    else
	        c += CAN.cookie.flipU("YearMonth") + "**" + CAN.cookie.flipU("YearMonth");
	    document.cookie = "_=" + c.replace(/\"/g, '%22');
	},
	"get": function() {
	    var c = document.cookie;
	    var i = c.indexOf("_=") + 2;
	    if (i == 1)
	        return "";
	    var cc, si = c.indexOf(";", i);
	    if (si == -1)
	        cc = c.slice(i);
	    else
	        cc = c.slice(i, si);
	    if (cc && isNaN(parseInt(cc.slice(0, 1)))) {
	        cc = '0' + cc; // play it safe
	        document.cookie = "_=" + cc;
	    }
	    return cc.replace(/%22/g, "\"");
	},
	"flipU": function(s) {
	    var s2 = "", i, z, _c = CAN.config.scrambler, _cl, _chl;
	    if (_c) {
	    	_cl = CAN.config.scramlen;
	    	_clh = CAN.config.scramlenh;
		    for (i = 0; i < s.length; i++) {
		        z = _c.indexOf(s[i]);
		        if (z == -1)
		            s2 += s[i];
		        else
		            s2 += _c[(z + _chl) % _cl];
		    }
		}
	    return s2;
	},
	"flipReverse": function(d) {
	    return CAN.cookie.flipU(unescape(unescape(d))).split("").reverse().join("").trim();
	},
	"flipSafe": function(d) {
	    return CAN.cookie.flipU(unescape(unescape(d))).trim();
	},
	"flipJ": function(d) {
	    return CAN.cookie.flipSafe(btoa(d));
	},
	"flipJD": function(d) {
	    return atob(CAN.cookie.flipSafe(d));
	},
	"activeSearchTypes": function() {
	    var s = "";
	    for (var i = 0; i < CAN.search.types.length; i++) {
	        var c = CT.dom.id(CAN.search.types[i] + "checkbox");
	        if (c && c.checked)
	            s += CAN.search.types[i];
	    }
	    var l = CT.dom.id("Libertycheckbox");
	    var e = CT.dom.id("Ecocheckbox");
	    var g = CT.dom.id("Googlecheckbox");
	    if (l && l.checked)
	        s += "Liberty";
	    else if (e && e.checked)
	        s += "Eco";
	    if (g && g.checked)
	        s += "Google";
	    return s;
	},
	"checkSearchTypes": function() {
	    var c = CAN.cookie.get();
	    return CAN.cookie.flipU(c.slice(c.indexOf("<>")+2, c.indexOf("??"))) || CAN.search.types.join('');
	},
	"checkEndDate": function() {
	    var c = CAN.cookie.get();
	    return CAN.cookie.flipU(c.slice(c.indexOf("**")+2));
	},
	"checkStartDate": function() {
	    var c = CAN.cookie.get();
	    return CAN.cookie.flipU(c.slice(c.indexOf("$$")+2, c.indexOf("**")));
	},
	"checkSiteRestriction": function() {
	    var c = CAN.cookie.get();
	    return CAN.cookie.flipU(c.slice(c.indexOf("??")+2, c.indexOf("$$")));
	},
	"checkSiteWideChat": function() {
	    var c = CAN.cookie.get();
	    var swcSwitch = c.slice(0, 1);
	    return !swcSwitch || parseInt(swcSwitch);
	},
	"checkFirstName": function() {
	    var c = CAN.cookie.get();
	    return CAN.cookie.flipU(c.slice(1, c.indexOf("&&")));
	},
	"checkLastName": function() {
	    var c = CAN.cookie.get();
	    return CAN.cookie.flipU(c.slice(c.indexOf("&&")+2, c.indexOf("||")));
	},
	"getUid": function() {
	    var c = CAN.cookie.get();
	    var uid = CAN.cookie.flipU(c.slice(c.indexOf("||")+2, c.indexOf("<>"))) || null;
	    if (uid)
	        CT.data.add({"key": uid,
	        	"firstName": CAN.cookie.checkFirstName(),
	            "lastName": CAN.cookie.checkLastName()});
	    return uid;
	}
};
// TODO: probs get rid of encoding stuff here -- it's been replaced by prod enc stuff built into ct
//CT.net.setEncoder(CAN.cookie.flipJ);
//CT.net.setDecoder(CAN.cookie.flipJD);
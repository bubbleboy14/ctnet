setTimeout(function() {
	var IFR_EXP_WIDTH = 558,
		IFR_SHR_WIDTH = 400,
		IFR_EXP_HEIGHT = 257,
		IFR_SHR_HEIGHT = 25,
		marker = '/lib/chat.js#',
		agkey = "";

	var blocker = document.createElement("div");
	blocker._on = window.innerWidth < IFR_EXP_WIDTH;
	blocker.id = "chatblocker";
	blocker.style.background = "white";
	blocker.style.textAlign = "center";
	blocker.style.position = 'fixed';
	blocker.style.right = '0px';
	blocker.style.left = '0px';
	blocker.style.bottom = '0px';
	blocker.style.height = IFR_SHR_HEIGHT + "px";
	blocker.style.display = blocker._on ? "block" : "none";
	blocker.innerHTML = "Click <i><a href='/community.html#chat'>here</a></i> Or Rotate Your Phone To Chat!";

	for (var i = 0; i < document.scripts.length; i++) {
		if (document.scripts[i].src.indexOf(marker) != -1) {
			agkey = document.scripts[i].src.split(marker)[1];
			break;
		}
	}

	var iframe = document.createElement('iframe');
	iframe.id = "canchatiframe";
	iframe.scrolling = 'no';
	iframe.style.position = 'fixed';
	iframe.style.right = '0px';
	iframe.style.bottom = '0px';
	iframe.style.width = IFR_SHR_WIDTH + 'px';
	iframe.style.height = IFR_SHR_HEIGHT + 'px';
	iframe.style.borderRight = '0px';
	iframe.style.borderBottom = '0px';
	iframe.style.overflow = 'hidden';
	iframe.src = ((["localhost", "can.mkult.co", "www.civilactionnetwork.org"].indexOf(location.hostname) != -1)
		? "" : "//civac.net")
		+ "/talk.html" + (agkey ? ("#" + agkey) : "");

	// iframe getters (from CT.dom)
	var getDoc = function(iframe) {
		return iframe.documentWindow || iframe.contentWindow || iframe.contentDocument;
	};
	var getLoc = function(iframe) {
		return getDoc(iframe).location;
	};

	var msgDown = function(msg) {
		if (!agkey) // only works same domain
			getLoc(iframe).hash = "d" + msg;
	};

	var expander = document.createElement('div');
	expander.id = "canchatexpander";
	expander.style.position = 'fixed';
	expander.style.right = '0px';
	expander.style.bottom = '0px';
	expander.style.fontWeight = 'bold';
	expander.style.color = agkey ? 'blue' : '#010068';
	expander.style.cursor = 'pointer';
	expander.innerHTML = 'expand';
	expander.onclick = function() {
		if (expander.innerHTML == 'expand') {
			expander.innerHTML = 'shrink';
			iframe.style.width = IFR_EXP_WIDTH + 'px';
			iframe.style.height = IFR_EXP_HEIGHT + 'px';
			msgDown("big");
		} else {
			expander.innerHTML = 'expand';
			iframe.style.width = IFR_SHR_WIDTH + 'px';
			iframe.style.height = IFR_SHR_HEIGHT + 'px';
			msgDown("small");
		}
	};

//	if (CT && CT.dom && CT.dom.ALLNODE) {
	if (typeof ALLNODE != "undefined") {
		ALLNODE.chatBlock = function() {
			var w = window.innerWidth;
			if (!blocker._on && w < IFR_EXP_WIDTH) {
				blocker._on = true;
				blocker.style.display = "block";
				if (expander.innerHTML == "shrink")
					expander.onclick();
			} else if (blocker._on && w >= IFR_EXP_WIDTH) {
				blocker._on = false;
				blocker.style.display = "none";
			}
		};
	}

	document.body.appendChild(iframe);
	document.body.appendChild(expander);
	document.body.appendChild(blocker);

	// listen for notifications unless action group key is specified
	// (if agkey, we're on a different domain, so this technique won't work)
	if (!agkey) {
		var _chatbridge = setInterval(function() {
			try {
				var loc = getLoc(iframe);
				var hash = loc.hash.slice(2);
				if (loc.hash.charAt(1) == 'u' && hash != lastHash) {
					lastHash = hash; // defined in util
					if (hash == 'x')
						clearTab();
					else if (hash == "e")
						expander.onclick();
					else
						flashTab(hash);
				}
			} catch(err) {
				/* whatever - for xd testing */
				clearInterval(_chatbridge);
			}
		}, 1000);
	}
}, 0);
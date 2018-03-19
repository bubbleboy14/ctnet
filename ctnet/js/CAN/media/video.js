CAN.media.video = {
	// single video watching (linked or clicked)
	"inviteButton": null,
	"current": null,
	"viewSingle": function(video) {
	    CAN.media.video.current = video;
	    CT.dom.showHide(CAN.media.video.inviteButton.parentNode, true);
	    var vnode = CT.dom.id(video.docid);
	    if (!vnode) {
	        vnode = CAN.media.video.build(video, null, true);
	        CT.dom.id('vidlist').appendChild(vnode);
	    }
	    if (!video.viewed) {
	        CT.dom.id("svl").appendChild(
	        	CT.dom.node(CT.dom.link(video.title,
	            function() { CAN.media.video.viewSingle(video); }),
	            "div", "sbitem", "sbitem" + video.docid));
	        CT.dom.id("sv").style.display = "block";
	        video.viewed = true;
	    }
	    CAN.categories.heading.innerHTML = video.title;
	    CAN.categories.hideAll();
	    vnode.style.display = "block";
	    CT.dom.id(video.docid+"conversation").style.display = "block";
	    CT.panel.select(video.docid);
	    CAN.widget.share.updateShareItem("video", video.key);
	},
	// embedded video, as in list
	"build": function(video, vindex, nocat, inconvo) {
		var v = CAN.media.loader.args.video;
	    if (vindex != null)
	        CT.data.add(video);
	    var c = CT.dom.node("", "div", "bordered padded");
	    c.appendChild(CT.video.thumbnail(video));
	    var notVidPage = location.pathname.slice(1, 6) != "video";
	    c.appendChild(CT.dom.link(video.title, notVidPage ? null
	    	: function() { CAN.media.video.viewSingle(video); },
	    	notVidPage ? "/video.html#!" +
	    	CAN.cookie.flipReverse(video.key) : null,
	        "bold red nodecoration"));
	    var byline = CT.dom.node("", "div", "smaller right");
	    byline.appendChild(CT.dom.node("posted "
	    	+ (video.date || "(now)") + ", by ", "span", "gray"));
	    byline.appendChild(CAN.session.firstLastLink({
	    	"firstName": video.user, "key": video.uid
	    }, false, false, "Videos", true));
	    c.appendChild(byline);
	    c.appendChild(CT.dom.node(CT.parse.process(video.description,
	    	true), "div", "small"));
	    if (!nocat)
	        c.appendChild(CAN.categories.listing(video.category));
	    var convobox = CT.dom.node("", "div", "categoriedbox hidden",
	        video.docid + "conversation");
	    convobox.appendChild(CT.dom.node("Conversation",
	    	"div", "blue bold topmargined"));
	    var convonode = CT.dom.node("loading conversation...",
	        "div", "bordertop");
	    convobox.appendChild(convonode);
	    c.appendChild(convobox);
	    if (!inconvo && video.conversation)
	        CAN.widget.conversation.load(v.uid,
	        	video.conversation, convonode, video.key);
	    var cclass = "categoriedbox bottompadded";
	    if (video.category) {
	        for (var i = 0; i < video.category.length; i++)
	            cclass += " " + video.category[i];
	    }
	    if (typeof vindex == "number" && (vindex < CAN.media.loader.newcount))
	        cclass += " Latest";
	    return CT.dom.node(c, "div", cclass, video.docid);
	},
	"getAndShow": function(vid) {
	    var n = CT.dom.node();
	    n.id = "convovid" + vid;
	    var viddata = CT.data.get(vid);
	    if (viddata && viddata.player)
	        n.innerHTML = CAN.media.video.build(viddata,
	        	null, true, true).firstChild.innerHTML;
	    else {
	        CT.net.post("/get", {"gtype": "data", "key": vid},
	            "error retrieving video", function(result) {
	            CT.data.add(result);
	            (CT.dom.id("convovid" + vid)
	            	|| n).innerHTML = CAN.media.video.build(result,
	                	null, true, true).firstChild.innerHTML;
	        });
	    }
	    return n;
	},
	"slider": function(video) {
	    var n = CT.dom.node();
	    var r = CT.dom.node("", "div", "right w400");
	    r.appendChild(CT.dom.node(video.title, "div", "big bold"));
	    r.appendChild(CT.dom.node(CT.parse.process(video.description)));
	    n.appendChild(r);
	    n.appendChild(CT.dom.node(CT.video.embed(video)));
	    n.onclick = function() {
	        document.location = "/video.html#!"
	        	+ CAN.cookie.flipReverse(video.key);
	    };
	    return n;
	},
	"evidence": function(video) {
	    var n = CT.dom.node();
	    n.appendChild(CT.dom.node(CT.video.embed(video, true)));
	    n.appendChild(CT.dom.node(video.title, "div", "big bold"));
	    n.onclick = function() {
	        document.location = "/video.html#!"
	        	+ CAN.cookie.flipReverse(video.key);
	    };
	    return n;
	},
	"nocat": function(video, vindex) {
	    return CAN.media.video.build(video, vindex, true);
	},
	"profile": function(video, vindex) {
	    return CAN.media.video.build(video, vindex, true, true);
	},
	"result": function(video, lastvideo) {
	    var n = CT.dom.link("", null, "/video.html#!"
	    	+ CAN.cookie.flipReverse(video.key));
	    n.appendChild(CT.dom.node(CT.dom.img(
	    	video.thumbnail.replace(/&amp;/g, "&")), "div", "lfloat rpadded"));
	    n.appendChild(CT.dom.node(video.title, "div", "big"));
	    n.appendChild(CT.dom.node(CT.parse.process(video.description, true)));
	    n.appendChild(CT.dom.node("", "div", "clearnode"));
	    return CT.dom.node(n, "div", (!lastvideo)
	    	&& "bottompadded bottomline" || "");
	},
	"thumbnaked": function(video, i) {
	    var n = CT.dom.link("", null, "/video.html#!"
	    	+ CAN.cookie.flipReverse(video.key));
	    n.appendChild(CT.dom.img(video.thumbnail.replace(/&amp;/g, "&")));
	    n.appendChild(CT.dom.node(video.title, "div", "cutoff64"));
	    return CT.dom.node(n);
	},
	"thumb": function(video, i) {
	    return CT.dom.node(CAN.media.video.thumbnaked(video, i),
	        "div", "thumbcell");
	}
};

CAN.media.cases &&
	CAN.media.cases.registerEvidence("video", CAN.media.video.evidence);
CAN.media.loader.registerBuilder("video", CAN.media.video.build);
CAN.media.loader.registerBuilder("videonocat", CAN.media.video.nocat);
CAN.media.loader.registerBuilder("videoprofile", CAN.media.video.profile);
CAN.media.loader.registerBuilder("videoresult", CAN.media.video.result);
CAN.media.loader.registerBuilder("videothumbnaked", CAN.media.video.thumbnaked);
CAN.media.loader.registerBuilder("videothumb", CAN.media.video.thumb);
CAN.widget && CAN.widget.slider &&
	CAN.widget.slider.registerBuilder("video", CAN.media.video.slider);
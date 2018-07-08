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
	        	CT.dom.div(CT.dom.link(video.title,
	            function() { CAN.media.video.viewSingle(video); }),
	            "sbitem", "sbitem" + video.docid));
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
	"build": function(video, vindex, nocat, inconvo, htmlSafe) {
		var v = CAN.media.loader.args.video;
	    if (vindex != null)
	        CT.data.add(video);
	    var c = CT.dom.div(CT.video.thumbnail(video, htmlSafe), "bordered padded");
	    var notVidPage = location.pathname.slice(1, 6) != "video";
	    c.appendChild(CT.dom.link(video.title, (notVidPage || htmlSafe)
	    	? null : function() { CAN.media.video.viewSingle(video); },
	    	notVidPage ? "/video.html#!" + CAN.cookie.flipReverse(video.key) : null,
	        "bold red nodecoration"));
	    if (htmlSafe && !notVidPage) {
	    	var randid = c.lastChild.id = "randid" + CT.data.random(1000);
	    	setTimeout(function() {
	    		CT.dom.doWhenNodeExists(randid, function() {
			    	CT.dom.id(randid).onclick = function() {
			    		CAN.media.video.viewSingle(CT.data.get(video.key));
			    	};
	    		});
	    	}, 5000);
	    }
	    var byline = CT.dom.div("", "smaller right");
	    byline.appendChild(CT.dom.span("posted " + (video.date || "(now)") + ", by ", "gray"));
	    byline.appendChild(CAN.session.firstLastLink({
	    	"firstName": video.user, "key": video.uid
	    }, false, false, "Videos", true));
	    c.appendChild(byline);
	    c.appendChild(CT.dom.div(CT.parse.process(video.description, true), "small"));
	    if (!nocat)
	        c.appendChild(CAN.categories.listing(video.category));
	    if (!inconvo && video.conversation) {
		    var convobox = CT.dom.div("", "categoriedbox hidden",
		        video.docid + "conversation");
		    convobox.appendChild(CT.dom.div("Conversation", "blue bold topmargined"));
		    var convonode = CT.dom.div("loading conversation...", "bordertop");
		    convobox.appendChild(convonode);
		    c.appendChild(convobox);
	        CAN.widget.conversation.load(v.uid,
	        	video.conversation, convonode, video.key);
	    }
	    var cclass = "categoriedbox bottompadded";
	    if (video.category) {
	        for (var i = 0; i < video.category.length; i++)
	            cclass += " " + video.category[i];
	    }
	    if (typeof vindex == "number" && (vindex < CAN.media.loader.newcount))
	        cclass += " Latest";
	    return CT.dom.div(c, cclass, video.docid);
	},
	"getAndShow": function(vid) {
	    var n = CT.dom.div(null, null, "convovid" + vid + CT.data.random(1000));
	    var viddata = CT.data.get(vid);
	    if (viddata && viddata.player)
	        n.innerHTML = CAN.media.video.build(viddata,
	        	null, true, true, true).firstChild.innerHTML;
	    else {
	        CT.net.post("/get", {"gtype": "data", "key": vid},
	            "error retrieving video", function(result) {
	            CT.data.add(result);
	            (CT.dom.id(n.id) || n).innerHTML = CAN.media.video.build(result,
                	null, true, true, true).firstChild.innerHTML;
	        });
	    }
	    return n;
	},
	"slider": function(video) {
	    var n = CT.dom.div();
	    var r = CT.dom.div("", "right w400");
	    r.appendChild(CT.dom.div(video.title, "big bold"));
	    r.appendChild(CT.dom.div(CT.parse.process(video.description)));
	    n.appendChild(r);
	    n.appendChild(CT.dom.div(CT.video.embed(video)));
	    n.onclick = function() {
	        document.location = "/video.html#!"
	        	+ CAN.cookie.flipReverse(video.key);
	    };
	    return n;
	},
	"evidence": function(video) {
	    var n = CT.dom.div();
	    n.appendChild(CT.dom.div(CT.video.embed(video, true)));
	    n.appendChild(CT.dom.div(video.title, "big bold"));
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
	    n.appendChild(CT.dom.div(CT.dom.img(
	    	video.thumbnail.replace(/&amp;/g, "&")), "lfloat rpadded"));
	    n.appendChild(CT.dom.div(video.title, "big"));
	    n.appendChild(CT.dom.div(CT.parse.process(video.description, true)));
	    n.appendChild(CT.dom.div("", "clearnode"));
	    return CT.dom.div(n, lastvideo ? "" : "bottompadded bottomline");
	},
	"thumbnaked": function(video, i) {
	    var n = CT.dom.link("", null, "/video.html#!"
	    	+ CAN.cookie.flipReverse(video.key));
	    n.appendChild(CT.dom.img(video.thumbnail.replace(/&amp;/g, "&")));
	    n.appendChild(CT.dom.div(video.title, "cutoff64"));
	    return CT.dom.div(n);
	},
	"thumb": function(video, i) {
	    return CT.dom.div(CAN.media.video.thumbnaked(video, i), "thumbcell");
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
CAN.media.book = {
	"result": function(b, lastbook) {
	    var v = CAN.media.loader.args.book;
	    var n = CT.dom.node("", "div", (!lastbook) && "bottompadded bottomline" || "");
	    n.appendChild(CAN.media.photo.viewSingle(b.photo, true, "div", "lfloat",
	        null, b.readlink || b.buylink, true));
	    n.appendChild(CT.dom.link(b.title, null,
	        "/recommendations.html#!Books", "bold nodecoration"));
	    n.appendChild(CT.dom.node("by " + b.author, "div", "italic"));
	    if (b.readlink || b.buylink) {
	        var ln = CT.dom.node();
	        if (b.readlink)
	            ln.appendChild(CT.dom.link("READ", null, b.readlink,
	                "bold gray", null, {"target": "_blank"}));
	        if (b.readlink && b.buylink)
	            ln.appendChild(CT.dom.node(" | ", "span"));
	        if (b.buylink)
	            ln.appendChild(CT.dom.link("BUY", null, b.buylink,
	                "bold gray", null, {"target": "_blank"}));
	        n.appendChild(ln);
	    }
	    n.appendChild(CT.dom.node(b.content));
	    n.appendChild(CT.dom.node("", "div", "clearnode"));
	    return n;
	},
	"build": function(b) {
	    var v = CAN.media.loader.args.book;
	    var n = CT.dom.node("", "div", "bottompadded");
	    n.appendChild(CAN.media.photo.viewSingle(b.photo, true, "div", "right thumb",
	        null, b.readlink || b.buylink, true));
	    n.appendChild(CT.dom.link(b.title, null,
	        "/recommendations.html#!Books", "bold nodecoration"));
	    n.appendChild(CT.dom.node("by " + b.author, "div", "italic"));
	    if (b.readlink || b.buylink) {
	        var ln = CT.dom.node();
	        if (b.readlink)
	            ln.appendChild(CT.dom.link("READ", null, b.readlink,
	                "bold gray", null, {"target": "_blank"}));
	        if (b.readlink && b.buylink)
	            ln.appendChild(CT.dom.node(" | ", "span"));
	        if (b.buylink)
	            ln.appendChild(CT.dom.link("BUY", null, b.buylink,
	                "bold gray", null, {"target": "_blank"}));
	        n.appendChild(ln);
	    }
	    n.appendChild(CT.dom.node("", "br"));
	    n.appendChild(CT.dom.node(b.content));
	    n.appendChild(CT.dom.node("", "div", "clearnode"));
	    return n;
	}
};

CAN.media.loader.registerBuilder("book", CAN.media.book.build);
CAN.media.loader.registerBuilder("bookresult", CAN.media.book.result);
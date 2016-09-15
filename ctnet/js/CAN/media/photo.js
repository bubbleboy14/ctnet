CAN.media.photo = {
	"viewSingle": function(d, scale, wrappertype, wrapperclass, imgcb, imghref, skipcredit) {
        var n = CT.dom.node("", wrappertype, wrapperclass);
	    var _view = function(d) {
		    if (d.graphic)
		    	d.photo = "/_db?action=blob&property=img&key=" + escape(d.graphic);
		    if (d.html) {
		        // these also must be title:_blank-ed
		        var t = d.html.replace(/a href/g, 'a target="_blank" href');
		        if (scale) {
		            // this code allows the image to scale properly
		            var si = t.indexOf("width");
		            if (si != -1)
		                t = t.slice(0, si) + t.slice(t.indexOf(" ", si+1));
		            si = t.indexOf("height");
		            if (si != -1)
		                t = t.slice(0, si) + t.slice(t.indexOf(" ", si+1));
		        }
	            CT.dom.setContent(n, t);
		        if (n.firstChild.firstChild) {
		            n.insertBefore(n.firstChild.firstChild, n.firstChild);
		            n.firstChild.style.display = "block";
		            if (imgcb || imghref) {
		                var lnode = CT.dom.link("", imgcb, imghref);
		                n.insertBefore(lnode, n.firstChild);
		                n.firstChild.appendChild(n.firstChild.nextSibling);
		            }
		            n.childNodes[1].innerHTML = "Photo Credit";
		            n.childNodes[1].className += " small right";
		            if (skipcredit)
		                n.childNodes[1].className += " hidden";
		        }
		    }
		    else if (d.photo) {
		        var i = CT.dom.img(d.photo, null, imgcb, imghref);
		        i.style.display = "block";
		        n.appendChild(i);
		        if (!skipcredit && (d.link && d.title && d.artist))
		            n.appendChild(CT.dom.link("Photo Credit", null,
		                d.link, "small right", null,
		                {"title": d.title + " by " + d.artist,
		                "target": "_blank"}));
		    }
		};
	    if (typeof(d) == "string")
	    	CT.db.one(d, _view);
	    else
	    	_view(d);

	    n.appendChild(CT.dom.node("", "div", "clearnode"));
	    return n;
	},
	"scale": function(rawdata) {
	    return CAN.media.photo.viewSingle(rawdata, true);
	},
	"build": function(d, i, vars) {
		return CAN.media.photo.viewSingle(d);
	}
};

CAN.media.loader.registerBuilder("photo", CAN.media.photo.build);
CAN.media.loader.registerBuilder("photoscale", CAN.media.photo.scale);
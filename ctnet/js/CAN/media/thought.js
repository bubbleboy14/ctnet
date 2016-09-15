CAN.media.thought = {
	"build": function(d, vindex, v) {
	    var n = CT.dom.node();
	    var cclass = "bordered padded round bottommargined categoriedbox";
	    for (var i = 0; i < d.category.length; i++)
	        cclass += " " + d.category[i];
	    if ((vindex || 0) < CAN.media.loader.newcount)
	        cclass += " Latest";
	    n.className = cclass;
	    if (d.uid) {
	        n.appendChild(CAN.session.firstLastLink({
	        	"firstName": d.user, "key": d.uid
	        }, false, true, "thoughtstream", true));
	    }
	    n.appendChild(CT.dom.node(d.date, "span", "gray"));
	    n.appendChild(CT.dom.node(": ", "b"));
	    n.appendChild(CT.dom.node(CT.parse.process(d.thought, false, true), "span"));
	    return n;
	}
};

CAN.media.loader.registerBuilder("thought", CAN.media.thought.build);
CAN.media.loader.registerBuilder("thoughtresult", CAN.media.thought.build);
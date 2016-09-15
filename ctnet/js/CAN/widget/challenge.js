CAN.widget.challenge = {
	"load": function(uid) {
	    CT.dom.id("writeNews").onclick = function() {
	        document.location = uid ?
	            "/participate.html#Reporter" : "/login.html";
	    };
	    CT.dom.id("writeReferendum").onclick = function() {
	        document.location = uid ?
	            "/participate.html#lawyer" : "/login.html";
	    };
	    CT.dom.id("buildCase").onclick = function() {
	        document.location = uid ?
	            "/participate.html#Cases" : "/login.html";
	    };
	}
};
CAN.widget.slider = {
	"builders": {},

	"registerBuilder": function(key, cb) {
		CAN.widget.slider.builders[key] = cb;
	},

	// slider rotation setting (greg-only)
	"initUpdate": function(uid, curkeycb) {
	    CAN.session.ifAdmin(uid, function() {
	        var rotButton = CT.dom.id("grotadd");
	        rotButton.onclick = function() {
	            CT.net.post("/settings", { "key": "slider_rotation",
	                "val": curkeycb(), "uid": uid },
	                "error updating slider rotation",
	                function() { alert("success"); });
	        };
	        CT.dom.showHide(rotButton);
	    });
	}
};
CAN.widget.action = {
	// get the stylesheet for the action group
	// and the supplemental data required by the widget
	"load": function(widgetname, agkey, cb) {
	    if (agkey) CT.net.post("/get", {"gtype": "wdata",
	        "group": agkey, "widget": widgetname},
	        "error loading " + widgetname + " widget", function(wdata) {
	            CT.dom.addStyle(wdata.style);
	            cb && cb(wdata.data);
	        });
	    else
	        CT.dom.addStyle("a, .chatname { color: #010068; }");
	}
};
CT.require("CT.all");
CT.require("CAN.all");

onload = function() {
    var _hash = document.location.hash.slice(1);
    document.location.hash = "";
    var agkey = _hash.length > 10 ? CAN.cookie.flipReverse(_hash) : null;
    CAN.widget.action.load("chat", agkey);
    CAN.chat.loadAllChats(CAN.cookie.getUid(),
        CT.dom.id("chpanels"),
    	CT.dom.id("presence"),
    	CT.dom.id("spotlight"),
    	function() {
            CT.panel.swap(agkey ? CAN.chat.groups[agkey] : "Global", true, "ch");
            CAN.chat.currentRoom = "global";
    	});

    var people = CT.dom.id("people");
    var places = CT.dom.id("chitems");
    CT.dom.id("peopleButton").onclick = function() {
        CT.dom.showHide(people, true);
        CT.dom.showHide(places, false, true);
        CAN.chat.focusChatInput();
    };
    CT.dom.id("placesButton").onclick = function() {
        CT.dom.showHide(people, false, true);
        CT.dom.showHide(places, true);
        CAN.chat.focusChatInput();
    };

    window.onhashchange = function() {
        var hash = location.hash.slice(2);
        if (location.hash.charAt(1) == 'd' && hash != CAN.chat.lastHash) {
            CAN.chat.lastHash = hash; // defined in util
            if (hash == "big")
                CAN.chat.chatWidgetOpened();
        }
    };
};
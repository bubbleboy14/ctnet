CT.require("CT.align");
CT.require("CT.dom");
CT.require("CAN.cookie");
CT.require("CAN.frame");
CT.require("CAN.search");

onload = function() {
    CAN.frame.basic();
    var binfo = [
        {"name": "firefox",
         "href": "http://www.mozilla.com/en-US/firefox/new/",
         "label": "Firefox",
         "_alt": "Install Mozilla Firefox"},
        {"name": "opera",
         "href": "http://www.opera.com/",
         "label": "Opera",
         "_alt": "Install Opera"},
        {"name": "chrome",
         "href": "http://www.google.com/chrome/",
         "label": "Chrome",
         "_alt": "Install Google Chrome"},
        {"name": "ie",
         "href": "http://windows.microsoft.com/en-US/internet-explorer/products/ie/home",
         "label": "Explorer",
         "_alt": "Install Internet Explorer 7+"},
        {"name": "safari",
         "href": "http://www.apple.com/safari/",
         "label": "Safari",
         "_alt": "Install Safari"}
    ];
    var n = CT.dom.id("browserlist");
    for (var i = 0; i < binfo.length; i++) {
        var b = binfo[i];
        n.appendChild(CT.dom.labeledImage("/img/browsers/"+b.name+".png", b.href,
            b.label, b._alt, null, "lfloat rpadded centered", "nodecoration"));
    }
    n.appendChild(CT.dom.node("", "div", "clearnode"));
};

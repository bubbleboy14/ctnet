CT.require("CT.align");
CT.require("CT.data");
CT.require("CT.dom");
CT.require("CT.mobile");
CT.require("CT.parse");
CT.require("CT.storage");
CT.require("CT.trans");
CT.require("CAN.config");
CT.require("CAN.cookie");
CT.require("CAN.frame");
CT.require("CAN.search");
CT.require("CAN.session");
CT.require("CAN.widget.chatterlightbox");

onload = function() {
    var uid = CAN.session.isLoggedIn();
    var sq = CT.dom.id("sq");
    var newSQ = function(s, i) {
        var n = CT.dom.node("", "div", "bordered padded round bottommargined");
        n.appendChild(CT.dom.node(s));
        n.appendChild(CT.dom.field("sq"+i));
        sq.appendChild(n);
    };
    CT.net.post("/get", {"gtype": "securityquestions", "uid": uid},
        "error retrieving security questions", function(s) {
            for (var i = 0; i < s.length; i++)
                newSQ(s[i], i);
            // submit button
            sq.appendChild(CT.dom.node(CT.dom.button("Submit", function() {
                var qas = [];
                for (var i = 0; i < s.length; i++) {
                    var f = CT.dom.id("sq"+i);
                    if (f.value)
                        qas.push({"question": s[i], "answer": f.value});
                }
                if (qas.length < 3)
                    return alert("Please answer at least three.");
                CT.dom.passwordPrompt(function(pw) {
                    CT.net.post("/edit", {"eid": uid, "data": {"key": uid,
                        "password": pw, "qas": qas}},
                        "error answering security questions",
                        function() { document.location = "/home.html"; });
                });
            })));
        }, function() { document.location = "/home.html"; });
    var moreinfo = CT.dom.id("moreinfo");
    CT.dom.id("moreinfolink").onclick = function() {
        CT.dom.showHide(moreinfo);
        CT.align.centered(moreinfo);
    };
    CT.dom.id("closemoreinfo").onclick = function() {
        CT.dom.showHide(moreinfo);
    };
};
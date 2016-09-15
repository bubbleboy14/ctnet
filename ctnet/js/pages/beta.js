CT.require("CT.align");
CT.require("CT.dom");
CT.require("CT.parse");
CT.require("CAN.session");
CT.require("CAN.widget.share");

onload = function() {
    CT.net.post("/settings", {"key": "closed_beta"},
        "error determining beta status", function(isbeta) {
            if (isbeta)
                CT.dom.id("beta_all").style.opacity = "1";
            else
                document.location = "/home.html";
        });
    document.cookie = "_=";
    CAN.session.checkDomain();
    CAN.session.checkBrowser();
    var bm = CT.dom.id("betamessage");
    var ndate = new Date();
    var tdate = new Date(2011, 6, 24);
    var phrases = ["Can A Peaceful Revolution Begin With Us?",
        "Can We Promote Radical Peace With A Natural Approach To Law And Governance?",
        "Can We Use Referenda To Opt Out Of The War-Hungry 'New World Order'?"];
    bm.appendChild(CT.dom.node((ndate < tdate) && "Can A Peaceful Revolution Begin With Us?"
        || phrases[Math.floor(Math.random()*3)], "div", "", "betaphrase"));
    bm.appendChild(CT.dom.node("July 4, 2011", "div", "", "betadate"));
    var lnode = CT.dom.id("betalogin");
    var bp = CT.dom.field(null, null, "w100");
    CT.dom.blurField(bp, ["beta password"]);
    CT.dom.inputEnterCallback(bp, function() {
        document.location = "/login.html#"+bp.value;
    });
    lnode.appendChild(CT.dom.node(bp, "div", "right"));
    var s = CT.dom.id("share");
    s.appendChild(CT.dom.img("http://bookmarkcraze.com/images/bookmarkcraze_Facebook.png",
        "nodecoration", null, CAN.widget.share.replaceLinkTokens("beta",
        "http://www.facebook.com/share.php?u=LINK_URL", "betaFacebook"),
        "_blank", "Facebook", "betaFacebook"));
    s.appendChild(CT.dom.node("&nbsp;", "span"));
    s.appendChild(CT.dom.img("http://bookmarkcraze.com/images/bookmarkcraze_Twitter.png",
        "nodecoration", null, CAN.widget.share.replaceLinkTokens("beta",
        "http://twitthis.com/twit?url=LINK_URL&title=LINK_TITLE", "betaTwitter"),
        "_blank", "Twitter", "betaTwitter"));
    window.onresize = function() {
        lnode.style.left = (CT.align.width()-120) + "px";
    };
    window.onresize();
};
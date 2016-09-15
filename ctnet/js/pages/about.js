CT.require("CT.align");
CT.require("CT.data");
CT.require("CT.dom");
CT.require("CT.panel");
CT.require("CT.pubsub");
CT.require("CT.mobile");
CT.require("CT.trans");
CT.require("CAN.config");
CT.require("CAN.cookie");
CT.require("CAN.frame");
CT.require("CAN.search");
CT.require("CAN.session");

onload = function() {
    var uid = CAN.session.isLoggedIn();
    CT.panel.load(["Mission", "Founders", "Contact", "Terms of Use"]);

    var _hash = document.location.hash.slice(1);
    if (_hash)
        CT.panel.swap(_hash);
};
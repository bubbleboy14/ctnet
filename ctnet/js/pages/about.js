CT.require("CT.align");
CT.require("CT.data");
CT.require("CT.dom");
CT.require("CT.key");
CT.require("CT.panel");
CT.require("CT.parse");
CT.require("CT.pubsub");
CT.require("CT.mobile");
CT.require("CT.modal");
CT.require("CT.storage");
CT.require("CT.trans");
CT.require("CT.video");
CT.require("CAN.config");
CT.require("CAN.cookie");
CT.require("CAN.frame");
CT.require("CAN.search");
CT.require("CAN.session");
CT.require("CAN.media.loader");
CT.require("CAN.widget.chatterlightbox");
CT.require("CAN.widget.stream");

onload = function() {
    var uid = CAN.session.isLoggedIn();
    CT.panel.load(["Mission", "Terms of Use"]);

    var _hash = document.location.hash.slice(1);
    if (_hash)
        CT.panel.swap(_hash);
};
CAN.widget.skinner = {
	load: function(uid) {
		if (CAN.widget.skinner._box)
			return CAN.widget.skinner._box.show();
		CT.net.post("/get", {
			uid: uid,
			nodata: true,
			gtype: "skinfo"
		}, null, function(skin) {
			skin = skin || {
				key: "skin",
				user: uid,
				title: "",
				css: ""
			};
			var title = CT.dom.field(null, skin.title, "w400p"),
				css = CT.dom.textArea(null, skin.css, "w400p h200p"),
				submitter = CT.dom.button("Update", function() {
					skin.title = title.value;
					skin.css = css.value;
					CT.net.post("/edit", {
						eid: uid,
						data: skin
					}, null, function(skey) {
						skin.key = skey;
						alert("great!");
					});
				});
			CAN.widget.skinner._box = new CT.modal.LightBox({
				content: [
					CT.dom.link("view feed", null,
						"/feed.html#!" + CAN.cookie.flipReverse(uid),
						"right bold nodecoration"),
					CT.dom.div("Skin Your Feed!", "biggerest bold centered"),
					CT.dom.div([
						"Title", title
					]),
					CT.dom.div([
						"CSS", css
					]),
					submitter
				]
			});
			CT.key.on("ESCAPE", CAN.widget.skinner._box.hide);
			CAN.widget.skinner._box.show();
		});
	}
};
CAN.widget.skinner = {
	load: function(uid) {
		if (CAN.widget.skinner._box)
			return CAN.widget.skinner._box.show();
		CT.net.post({
			path: "/get",
			spinner: true,
			params: {
				uid: uid,
				nodata: true,
				gtype: "skinfo"
			},
			cb: function(skin) {
				skin = skin || {
					key: "skin",
					user: uid,
					title: "",
					css: "",
					chat: false,
					chatter: false
				};
				var title = CT.dom.field(null, skin.title, "w400p"),
					css = CT.dom.textArea(null, skin.css, "w400p h200p"),
					chat = CT.dom.checkboxAndLabel("Live Chat", skin.chat),
					chatter = CT.dom.checkboxAndLabel("Chatter Feed", skin.chatter),
					submitter = CT.dom.button("Update", function() {
						skin.title = title.value;
						skin.css = css.value;
						skin.chat = chat.isChecked();
						skin.chatter = chatter.isChecked();
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
							chat, chatter
						], "right"),
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
			}
		});
	}
};
CAN.widget.skinner = {
	color: function(key, val) {
		var id = key.replace(/ /g, ""),
			n = CT.dom.field(id, val, "block", null, null, {
				color: "gray",
				background: val
			});
		setTimeout(function() { // wait a tick
			jsColorPicker("input#" + id, {
				color: val,
				readOnly: true
			});
		}, 500);
		return n;
	},
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
					chatter: false,
					color: "#000000",
					background: "#FFFFFF",
					font: "sans-serif, Arial, Helvetica"
				};
				var title = CT.dom.field(null, skin.title, "w400p"),
					css = CT.dom.textArea(null, skin.css, "w400p h200p"),
					chat = CT.dom.checkboxAndLabel("Live Chat", skin.chat),
					font = CT.dom.select([
						"sans-serif, Arial, Helvetica",
						"serif, Times New Roman, Times",
						"monospace, Courier, Courier New"
					], null, null, skin.font),
					chatter = CT.dom.checkboxAndLabel("Chatter Feed", skin.chatter),
					color = CAN.widget.skinner.color("Text Color", skin.color),
					background = CAN.widget.skinner.color("Background Color", skin.background),
					img = CT.dom.div(null, "hidden"),
					loadImg = function() {
						if (!img._loaded) {
							CT.dom.setContent(img, [
								CT.dom.label("Background Image", "BackgroundImage",
									null, true),
								CT.db.edit.media({
									data: skin,
									delNode: true,
									id: "BackgroundImage",
									className: "hm200p wm200p"
								})
							]);
							CT.dom.show(img);
							img._loaded = true;
						}
					},
					submitter = CT.dom.button("Update", function() {
						skin.title = title.value;
						skin.css = css.value;
						skin.color = color.value;
						skin.background = background.value;
						skin.font = font.value;
						skin.chat = chat.isChecked();
						skin.chatter = chatter.isChecked();
						var simg = skin.img;
						delete skin.img; // to avoid overwriting
						CT.net.post("/edit", {
							eid: uid,
							data: skin
						}, null, function(skey) {
							skin.img = simg;
							skin.key = skey;
							loadImg();
							alert("great!");
						});
					});
				(skin.key != "skin") && loadImg();
				CAN.widget.skinner._box = new CT.modal.LightBox({
					content: [
						CT.dom.link("view feed", null,
							"/feed.html#!" + CAN.cookie.flipReverse(uid),
							"right bold nodecoration"),
						CT.dom.div("Skin Your Feed!", "biggerest bold centered"),
						CT.dom.div([
							[
								CT.dom.label("Text Color", "TextColor"),
								color
							], [
								CT.dom.label("Background Color", "BackgroundColor"),
								background
							], img, [
								"Font", font
							],
							chat, chatter
						], "right", "skinner_opts"),
						[
							"Title", title
						],
						[
							"CSS", css
						],
						submitter
					]
				});
				CT.key.on("ESCAPE", CAN.widget.skinner._box.hide);
				CAN.widget.skinner._box.show();
			}
		});
	}
};
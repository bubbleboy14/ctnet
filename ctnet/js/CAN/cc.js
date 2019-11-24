CT.require("CT.cc");

CAN.cc = {
	_: {
		up: function(upd) {
			var ukey = CAN.cc._.ukey;
			CT.net.post({
				path: "/edit",
				params: {
					eid: ukey,
					data: CT.merge(upd, { key: ukey })
				},
			});
			Object.assign(u, upd);
		}
	},
	switcher: function(node) {
		var ukey = CAN.cc._.ukey = CAN.cookie.getUid();
		new CT.cc.Switcher({
			up: CAN.cc._.up,
			node: node || "ctmain",
			user: CT.data.get(ukey)
		});
	},
	view: function(content) {
		CT.cc.view(content);
	}
};
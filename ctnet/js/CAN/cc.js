if (CAN.config.CC && CAN.config.CC.agent)
	CT.scriptImport(CAN.config.CC.gateway);

CAN.cc = {
	_: {
		switcheroo: CT.dom.div(null, "h1 centered"),
		u: function(prop) {
			var u = CT.data.get(CAN.cookie.getUid());
			return u[prop] || u;
		},
		isDiff: function(ccdude) {
			var ccfg = CAN.cc._.u("cc"),
				cur = ccfg && ccfg.person;
			return ccdude != cur;
		},
		shouldSwitch: function(ccdude) {
			return CAN.cc._.isDiff(ccdude) && confirm("update your associated carecoin account?");
		},
		up: function(cc) {
			var upd = { cc: cc }, _ = CAN.cc._, u = _.u();
			CT.net.post({
				path: "/edit",
				params: {
					eid: u.key,
					data: CT.merge(upd, { key: u.key })
				},
			});
			Object.assign(u, upd);
			_.setSwitcher();
		},
		switched: function(data) {
			var _ = CAN.cc._, ccfg = CAN.config.CC,
				ccdata = data.data;
			if (data.action == "switch") {
				CT.log("you are now " + (ccdata || "no one"));
				if (_.shouldSwitch(ccdata)) {
					if (ccdata) {
						_.ccdude = ccdata;
						_.switcher.enroll({
							agent: ccfg.agent,
							pod: ccfg.pod
						});
					} else
						_.up();
				}
			} else if (data.action == "enrollment") {
				_.up({
					person: _.ccdude,
					membership: ccdata
				});
			}
		},
		setSwitcher: function(switchIt) {
			var _ = CAN.cc._, ccfg = _.u("cc"),
				p = ccfg && ccfg.person;
			if (switchIt) {
				CT.dom.clear(_.switcheroo);
				_.switcher = CC.switcher(_.switcheroo, _.switched);
			} else {
				CT.dom.setContent(_.switcheroo, CT.dom.div([
					"Associated carecoin Account: " + (p || "none"),
					CT.dom.button("switch it up", function() {
						_.setSwitcher(true);
					})
				], "biggerest bigpadded down20"));
			}
		}
	},
	switcher: function(node) {
		var _ = CAN.cc._;
		_.setSwitcher();
		CT.dom.setContent(node || "ctmain", CT.dom.div([
			CT.dom.div("Your <b>carecoin</b> Membership", "bigger centered"),
			CT.dom.div(_.switcheroo, "h170p p0 noflow")
		], "bordered padded margined round"));
	},
	view: function(content) {
		var _ = CAN.cc._, cfg = CAN.config.CC,
			name = content.title || content.name,
			identifier = content.mtype + ": " + name,
			author = CT.data.get(content.user),
			memship = author && author.cc.membership || cfg.membership;
		CT.log("viewing: " + identifier);
		_.viewer = _.viewer || CC.viewer();
		_.viewer.view({
			agent: cfg.agent,
			content: {
				membership: memship,
				identifier: identifier
			}
		});
	}
};
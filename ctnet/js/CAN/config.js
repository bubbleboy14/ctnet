CT.require("core");
var c = CAN.config = core.config.ctnet;
c.mobile.page = c.mobile.menus[CT.info.page];
// get rid of scrambler bs below -- now built into ct (properly)
c.scramlen = CT.net._scrambler.length;
c.scramlenh = c.scramlen / 2;
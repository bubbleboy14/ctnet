CT.require("core");
var c = CAN.config = core.config.ctnet;
c.mobile.page = c.mobile.menus[CT.info.page];
c.scramlen = c.scrambler.length;
c.scramlenh = c.scramlen / 2;
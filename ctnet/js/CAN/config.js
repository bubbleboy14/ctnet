CT.require("core");
var c = CAN.config = core.config.ctnet;
c.mobile.page = c.mobile.menus[CT.info.page];
// get rid of scrambler bs below -- now built into ct (properly)
c.scrambler = c.scrambler || CT.net._scrambler;
c.scramlen = c.scrambler.length;
c.scramlenh = c.scramlen / 2;
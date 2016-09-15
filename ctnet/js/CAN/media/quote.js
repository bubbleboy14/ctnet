CAN.media.quote = {
	"build": function(rawdata) {
	    var v = CAN.media.loader.args.quote;
	    var freedomquote = CT.dom.node("", "div", "bottompadded");
	    freedomquote.appendChild(CT.dom.node('&quot;' + rawdata.content + '&quot;'));
	    freedomquote.appendChild(CT.dom.node("", "br"));
	    freedomquote.appendChild(CT.dom.node(rawdata.author));
	    return freedomquote;
	},
	"result": function(d, lastQuote) {
	    return CT.dom.node(CAN.media.quote.build(d), "div",
	        (!lastQuote) && "bottomline" || "");
	}
};

CAN.media.loader.registerBuilder("quote", CAN.media.quote.build);
CAN.media.loader.registerBuilder("quoteresult", CAN.media.quote.result);
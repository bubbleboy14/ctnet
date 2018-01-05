CAN.widget.chatterlightbox = {
	"load": function() {
		if (CAN.widget.chatterlightbox._box)
			return CAN.widget.chatterlightbox._box.show();
	    CT.net.post("/get", {"gtype": "media", "mtype": "comment", "number": 4}, null, function(items) {
	    	var cbox = CT.dom.div(null, "w1-3 right"),
	    		talkBack = CT.dom.div();
	        CAN.widget.stream.comment(cbox, null, items.reverse(), false, true, "full");
	        CT.dom.inputEnterCallback(CT.dom.richInput(talkBack, null, null, null, null,
	        	["what do you think we should discuss?", "breaking news?", "what's the latest?",
	        	"your turn! what's next on the global thought stream?"], null, "w1 h100p"), function(val) {
		        	CT.storage.set("gts", val.trim());
		        	location = "/community.html#!Stream";
		        });
			CAN.widget.chatterlightbox._box = new CT.modal.LightBox({
				content: [
					cbox,
					CT.dom.div([
						CT.dom.div("What's This All About?", "biggerest bold centered"),
						CT.dom.div("Civil Action Network is your source for peaceful activism and the democratic exchange of ideas. Every perspective counts - make yourself heard!", "padded"),
						CT.dom.div("true democracy", "biggerer bold right bordertop"),
						CT.dom.div([
							CT.dom.span("Our goal is to increase the degree to which all of us can have a positive, creative impact on ourselves, each other, our neighborhoods, and our world. This means having a"),
							CT.dom.pad(),
							CT.dom.link("direct say", null, "/referenda.html"),
							CT.dom.pad(),
							CT.dom.span("in projects and policies that affect us (as any genuine human being would expect). With CAN Referenda, we all riff on each other's ideas, branching proposals and even voting on branches individually before settling upon a final version (for further voting :).")
						], "padded"),
						CT.dom.div("real media", "biggerer bold right bordertop"),
						CT.dom.div([
							CT.dom.span("As a precursor to individual and collective action, we must forage for healthy, true information. And when we find choice nuggets,"),
							CT.dom.pad(),
							CT.dom.link("it's important to share", null, "/community.html#!Stream"),
							CT.dom.span(". Whether you scour alternative media for the"),
							CT.dom.pad(),
							CT.dom.link("latest video updates", null, "/video.html"),
							CT.dom.pad(),
							CT.dom.span("or repost"),
							CT.dom.pad(),
							CT.dom.link("public domain news articles", null, "/news.html"),
							CT.dom.span(", you're helping us all question mainstream narratives.")
						], "padded"),
						CT.dom.div([
							CT.dom.span("Meanwhile, our system catalogs your findings for"),
							CT.dom.pad(),
							CT.dom.link("fellow researchers", null, "/cases.html"),
							CT.dom.span(". The best part is, member-initiated investigations are crowd-sourced, with other members submitting evidence as they encounter it.")
						], "padded"),
						CT.dom.div([
							CT.dom.span("And then there's the content delivery algorithm. Unlike FaceGoogTube et al, we don't pretend to know what's true. Members rate content, and the ratings curate the personal and global"),
							CT.dom.pad(),
							CT.dom.link("recommendation feeds", null, "/recommendations.html"),
							CT.dom.span(". Simple is best.")
						], "padded"),
						CT.dom.div("grassroots cooperation", "biggerer bold right bordertop"),
						CT.dom.div([
							CT.dom.span("This means communication. Want to talk to anyone else on the site? Click 'expand' in the bottom-right corner of the page to see who's logged in. Prefer video chat? Just click 'Give It A Whirl!' on the"),
							CT.dom.pad(),
							CT.dom.link("community page", null, "/community.html"),
							CT.dom.span(", which by the way is also where members post and peruse upcoming events.")
						], "padded"),
						CT.dom.div([
							CT.dom.span("This also means"),
							CT.dom.pad(),
							CT.dom.link("secure organizational tools", null, "/participate.html#ActionGroups"),
							CT.dom.pad(),
							CT.dom.span("for things like internal communication (live and via private messages and message boards), newsletters, event planning, sprucing up your organization's own site (via free widgets), and various other what-have-yous.")
						], "padded"),
						talkBack
					], "w2-3")
				]
			});
			CAN.widget.chatterlightbox._box.show();
	    });
	}
};
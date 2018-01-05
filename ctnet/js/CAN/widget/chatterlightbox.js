CAN.widget.chatterlightbox = {
	"load": function() {
		(new CT.modal.LightBox({
			content: [
				CT.dom.div("What's This All About?", "bigger bold centered"),
				CT.dom.div("Civil Action Network is your source for peaceful activism and the democratic exchange of ideas. Every perspective counts - make yourself heard!")
			]
		})).show();
	}
};
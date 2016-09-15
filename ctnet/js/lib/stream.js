setTimeout(function() {
	var marker = '/lib/stream.js#';
	var wkey = null;
	var iframe = null;
	var container = null;
	var fillContainer = function() {
		var cw = container.clientWidth || container.offsetWidth;
		var ch = container.clientHeight || container.offsetHeight;
		if (!(cw && ch))
			return setTimeout(fillContainer, 1000);
		var computedStyle = window.getComputedStyle(container);
		var padding = parseInt(computedStyle.paddingLeft) + parseInt(computedStyle.paddingRight);
		iframe.style.width = (cw - padding) + "px";
		iframe.style.height = (ch - padding) + "px";
		iframe.style.opacity = 1.0;
	};
	for (var i = 0; i < document.scripts.length; i++) {
		var script = document.scripts[i];
		if (script.src.indexOf(marker) != -1) {
			container = script.parentNode;
			wkey = script.src.split(marker)[1];
			break;
		}
	}
	if (wkey) {
		iframe = document.createElement('iframe');
		iframe.scrolling = 'no';
		iframe.style.overflow = 'hidden';
		iframe.style.border = '0px';
		iframe.style.opacity = 0.0;
		iframe.src = "http://www.civilactionnetwork.org/stream.html#" + wkey;
		container.appendChild(iframe);
		fillContainer();
	} else
		console.log("Can't load stream -- no action group specified.");
}, 0);
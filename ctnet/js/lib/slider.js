/* taken from gameclosure.com, grossly oversimplified :) */
var initSlider = function () {
	var isIE = (navigator.userAgent.toUpperCase().indexOf("MSIE") !== -1);

	function el (id) {
		return CT.dom.id(id);
	}

	var sliderContainer = el("slider-container");
	if (!sliderContainer) {
		return;
	}

	var sliderButtons = el("slider-buttons");
	var sliderContent = el("slider-content");
	var sliderClip = el("slider-clip");
	var sliderLeft = el("slider-left");
	var sliderRight = el("slider-right");

	var sliderWidth = 830;
	var sliderHeight = 315;

	var numSlides = 0;

	var targetButtons = [];

	var autoCycleIndex = 0;
	var autoCycle = setInterval(function () {
			autoCycleIndex = (autoCycleIndex + 1) % numSlides;
			selectPage(autoCycleIndex);
		}, 7000);

	var targetPos = 0;
	var targetIndex = -1;
	var targetChildren = sliderContent.getElementsByTagName("li");
	var targetReady = false;
	var targetLists = [];

	var moveTimeout = false;

	function setupChild (targetList, child, offset) {
		child.style.width = sliderWidth + "px";
		child.style.height = sliderHeight + "px";
	}

	function createClick (index) {
		return function () {
			selectPage(index, true);
		};
	}

	function setup () {
		sliderContainer.style.width = (sliderWidth + 60) + "px";
		sliderContainer.style.height = (sliderHeight + 30) + "px";

		sliderContent.style.width = (sliderWidth * targetChildren.length) + "px";
		sliderContent.style.height = sliderHeight + "px";

		sliderLeft.style.height = sliderHeight + "px";

		sliderClip.style.width = sliderWidth + "px";
		sliderClip.style.height = sliderHeight + "px";
		sliderClip.style.top = "-" + sliderHeight + "px";
		sliderClip.style.left = "30px";

		sliderRight.style.height = sliderHeight + "px";
		sliderRight.style.left = (sliderWidth + 30) + "px";
		sliderRight.style.top = (-sliderHeight * 2) + "px";

		sliderButtons.style.width = (sliderWidth + 60) + "px";
		sliderButtons.style.top = (-sliderHeight * 2) + "px";

		numSlides = targetChildren.length;
		for (var i = 0; i < numSlides; i++) {
			targetLists[i] = [];
			setupChild(targetLists[i], targetChildren[i], i * sliderWidth);

			var button = document.createElement("input");
			button.type = "button";
			button.onclick = createClick(i);
			sliderButtons.appendChild(button);

			targetButtons.push(button);
		}

		var button = el("slider-left-button");
		button.style.marginTop = (sliderHeight / 2 - 30) + "px";
		button.style.marginRight = "5px";
		button.onclick = function () {
			selectPage((targetIndex + numSlides - 1) % numSlides, true);
		};
		button = el("slider-right-button");
		button.style.marginTop = (sliderHeight / 2 - 30) + "px";
		button.style.marginLeft = "5px";
		button.onclick = function () {
			selectPage((targetIndex + 1) % numSlides, true);
		};

		selectPage(0);
	}

	function setInitialPosition (targetList, offset) {
		var i = targetList.length;

		while (i) {
			var target = targetList[--i];
			var element = target.element;
			var style = element.style;

			if (!isIE) {
				style.transition = "";
				style.webkitTransition = "";
				style.MozTransition = "";
				style.oTransition = "";
				style.msTransition = "";
			}

			style.visibility = "hidden";
			style.position = "absolute";
			style.opacity = 0;
		}
	}

	function clearTimeouts (timeouts) {
		while (timeouts.length) {
			clearTimeout(timeouts.pop());
		}
	}

	function moveIn (target, offset) {
		var element = target.element;
		var style = element.style;
		var v = "all " + (target["data-duration"] || "0") + "s ease-in-out";

		if (!isIE) {
			style.transition = v;
			style.webkitTransition = v;
			style.MozTransition = v;
			style.oTransition = v;
			style.msTransition = v;
		}

		style.visibility = "visible";
		style.opacity = 1;
	}

	function moveIns (targetList, offset) {
		var i = targetList.length;

		while (i) {
			var target = targetList[--i];
			moveIn(target, offset);
		}
	}

	function moveOut (target, offset) {
		var element = target.element;
		var style = element.style;
		var v = "all " + (target["data-duration"] || "0") + "s ease-in";

		if (!isIE) {
			style.transition = v;
			style.webkitTransition = v;
			style.MozTransition = v;
			style.oTransition = v;
			style.msTransition = v;
		}

		style.opacity = 0;
	}

	function moveOuts (targetList, offset) {
		var i = targetList.length;

		while (i) {
			var target = targetList[--i];
			moveOut(target, offset);
		}
	}

	function moveOutDelayed (index) {
		moveTimeout && clearTimeout(moveTimeout);
		moveTimeout = setTimeout(
			function () {
				moveOuts(targetLists[index], index * sliderWidth);
			},
			200
		);
	}

	function selectPage (index, isUserEvent) {

		if (isUserEvent) {
			clearInterval(autoCycle);
		}

		if (index !== targetIndex) {
			if (targetButtons[targetIndex]) {
				moveOutDelayed(targetIndex);
				targetButtons[targetIndex].className = "";
			}

			targetPos = (index * -sliderWidth);
			targetIndex = index;
			targetReady = false;
			targetButtons[targetIndex].className = "selected";
			setInitialPosition(targetLists[targetIndex], targetIndex * sliderWidth);
			sliderContent.style.left = targetPos + "px";
		}
	}

	setInterval(
		function () {
			if (!targetReady && (Math.abs(sliderContent.offsetLeft - targetPos) < 150)) {
				moveIns(targetLists[targetIndex], targetIndex * sliderWidth);
				targetReady = true;
			}
		},
		17
	);

	setup();
}
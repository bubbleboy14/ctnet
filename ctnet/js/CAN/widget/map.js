CAN.widget.map = {
    placeData: function(d) {
        return {
            "position": {
                "lat": d.lat,
                "lng": d.lng
            },
            "title": d.name,
            "info": d.description
        };
    }
};

CAN.widget.map.Map = CT.Class({
	CLASSNAME: "CT.widget.map.Map",
    initNewPlaceModal: function() {
    	if (!this.newPlaceModal) {
    		var newPlaceModal, map = this.map, newPlaceSubmit = CT.dom.button("Submit", function() {
		        var pdata = { "key": "place" };
		        ["name", "address", "zipcode", "description"].forEach(function(prop) {
		            pdata[prop] = CT.dom.id("np" + prop).value;
		        });
		        CT.dom.hide(newPlaceSubmit);
		        CT.net.post("/edit", {
		            "eid": CAN.cookie.getUid(),
		            "data": pdata
		        }, null, function(place) {
		            place.marker = map.addMarker(CAN.widget.map.placeData(place));
		            CT.dom.id("mapplaces").appendChild(CT.panel.trigger({
		                "title": place.name,
		            }, place.marker.showInfo));
		            newPlaceModal.hide();
		            newPlaceSubmit.show();
		            place.marker.showInfo();
		        });
		    });
		    var newPlaceForm = CT.dom.node([
		        CT.dom.node("New Place", "div", "big bold blue bottompadded"),
		        CT.dom.labelAndField("name", "npname", "w200"),
		        CT.dom.labelAndField("address", "npaddress", "w200"),
		        CT.dom.labelAndField("zipcode", "npzipcode", "w200"),
		        CT.dom.labelAndField("description", "npdescription", "w200", null, null, true, true),
		        newPlaceSubmit
		    ]);
		    newPlaceModal = this.newPlaceModal = new CT.modal.Modal({
		        transition: "fade",
		        node: newPlaceForm
		    });
		}
    },
    showNewPlace: function() {
        if (CAN.cookie.getUid()) {
        	this.initNewPlaceModal();
            this.newPlaceModal.show();
        } else
	        document.location = "/login.html";
    },
    showPlaces: function() {
    	var that = this;
	    CT.net.post("/get", {"gtype": "media", "mtype": "place", "number": 1000}, null, function(places) {
	        that.addTriggers(places, "place", CAN.widget.map.placeData, that.showNewPlace);
	    }, function() {
	        that.opts.places.appendChild(CT.panel.trigger({"title": "new place"}, that.showNewPlace));
	    });
    },
    markerInfo: function(key) {
        this.map.markers[key].showInfo();
    },
	init: function(opts) {
		opts = this.opts = CT.merge(opts, {
			places: CT.dom.id("mapplaces")
		});
		this.node = CT.dom.node(null, null, "fill");
		this.map = new CT.map.Map({ node: this.node, deferBuild: true });
		this.refresh = this.map.refresh;
		this.addTriggers = this.map.addTriggers;
		opts.node.appendChild(this.node);
	}
});
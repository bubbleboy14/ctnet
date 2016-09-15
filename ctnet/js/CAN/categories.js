CAN.categories = {
	// category sorting widget
	"list": null,
	"heading": null,
	"collection": null,
	"is_loading": null,
	"new_field": null,
	"submit_button": null,
	"cats": null,
	"catuid": null, // supports some old stuff
	"cbs": [],

	"listing": function(k) {
	    var s = "";
	    for (var i = 0; i < k.length; i++)
	        s += CT.data.get(k[i]).name + ", ";
	    return CT.dom.node("Categories: " + s.slice(0,
	    	s.length-2), "div", "gray italic");
	},
	"hideAll": function() {
	    var closethese = document.getElementsByClassName("categoriedbox");
	    for (var i = 0; i < closethese.length; i++)
	        closethese[i].style.display = "none";
	},
	"view": function(cat, cb) {
	    // change heading
	    CAN.categories.heading.innerHTML = cat.name;

	    // sort content nodes
	    CAN.categories.hideAll();
	    var openthese = document.getElementsByClassName(cat.key);
	    for (var i = 0; i < openthese.length; i++)
	        openthese[i].style.display = "block";

	    CT.panel.select(cat.key);
	    if (cb) cb();
	},
	"add": function(cat, cb) {
	    CAN.categories.list.appendChild(CT.dom.node(CT.dom.link(cat.name,
	    	function() { CAN.categories.view(cat, cb); }),
	    	"div", "sbitem", "sbitem"+cat.key));
	},
	"get": function(cb, gotcats, getpath, getparams) {
	    CAN.categories.collection = CAN.categories.collection || gotcats;
	    if (CAN.categories.collection) {
	        cb(CAN.categories.collection);
	    } else {
	        CAN.categories.cbs.push(cb);
	        if (CAN.categories.is_loading)
	            return;
	        CAN.categories.is_loading = true;
	        CT.net.post(getpath || "/get", getparams
	        	|| {"key": "categories", "gtype": "categories"},
	            "error retrieving categories", function(cats) {
	                CT.data.addSet(cats);
	                CAN.categories.collection = cats;
	                for (var i = 0; i < CAN.categories.cbs.length; i++)
	                    CAN.categories.cbs[i](cats);
	            });
	    }
	},
	"process": function(cats, cb, useallcats) {
	    if (useallcats) {
	        for (var i = 0; i < cats.length; i++)
	            CAN.categories.add(cats[i], cb);
	    }
	    else {
	        CT.net.post("/settings", {"key": "prime_categories"},
	            "error retrieving prime categories", function(d) {
	                for (var i = 0; i < d.length; i++)
	                    CAN.categories.add(CT.data.get(d[i]), cb);
	            });
	    }
	},
	"loadSorter": function(cb, pcarg) {
	    CAN.categories.list = CT.dom.id("catlist");
	    CAN.categories.heading = CT.dom.id("catheading");
	    CAN.categories.get(function(cats) {
	        var latestcat = {"name": "Latest", "key": "Latest"};
	        CAN.categories.add(latestcat, cb);
	        CAN.categories.process(cats, cb, pcarg);
	        CAN.categories.view(latestcat, cb);
	    });
	},
	"loadSelector": function(usecats, pnode, cb) {
	    CAN.categories.get(function(cats) {
	        var onames = ["Latest"];
	        var ovalues = ["Latest"];
	        for (var i = 0; i < cats.length; i++) {
	            if (usecats.indexOf(cats[i].key) != -1) {
	                onames.push(cats[i].name);
	                ovalues.push(cats[i].key);
	            }
	        }
	        var s = CT.dom.select(onames, ovalues);
	        s.onchange = function() {
	            CAN.categories.hideAll();
	            var openthese = document.getElementsByClassName(s.value);
	            for (var i = 0; i < openthese.length; i++)
	                openthese[i].style.display = "block";
	            cb && cb();
	        }
	        pnode.appendChild(s);
	    });
	},

	// category editing stuff
	"editField": function(pnode, cat) {
	    var namefield = CT.dom.field(null, cat && cat.name, "fullwidth");
	    CT.dom.inputEnterCallback(namefield, function() {
	        CT.net.post("/edit", {
	            "key": cat && cat.key || "category", "name": namefield.value
	        }, "error uploading media", function() {
	            cat.name = namefield.value;
	            alert("success!");
	        });
	    });
	    pnode.insertBefore(CT.dom.node(namefield,
	        "div", "bordered padded round bottommargined"),
	        CAN.categories.new_field.parentNode.nextSibling);
	},
	"loadBuilder": function(pnode, uid) {
	    CAN.categories.new_field = CT.dom.field("newcat", null, "fullwidth");
	    CT.dom.inputEnterCallback(CAN.categories.new_field, function() {
	        CT.net.post("/edit", {
	            "key": "category", "name": CAN.categories.new_field.value
	        }, "error uploading media", function(key) {
	            var newcatdata = {
	                key: key,
	                name: CAN.categories.new_field.value
	            };
	            CT.data.add(newcatdata);
	            CAN.categories.editField(pnode, newcatdata);
	            CAN.categories.collection.push(newcatdata);
	            CAN.categories.load();
	            CAN.categories.new_field.value = '';
	            CAN.categories.new_field.onblur();
	            alert("success!");
	        });
	    });
	    pnode.appendChild(CT.dom.node(CAN.categories.new_field,
	        "div", "bordered padded round"));
	    CAN.categories.get(function(cats) {
	        cats.forEach(function(cat) {
	            CAN.categories.editField(pnode, cat);
	        });
	    });
	},

	// category tagging stuff
	"load": function(cuid, lccb) {
	    if (cuid instanceof Function)
	        lccb = cuid;
	    else
	        CAN.categories.catuid = cuid;
	    if (!CAN.categories.cats) {
	        CAN.categories.cats = CT.dom.node("",
	        	"div", "hidden basicpopup", "categories");
	        document.body.appendChild(CAN.categories.cats);
	    }
	    CAN.categories.cats.innerHTML = "";
	    CAN.categories.get(function(data) {
	        CAN.categories.cats.appendChild(CT.dom.node("media tagger",
	        	"div", "big underline"));
	        CAN.categories.cats.appendChild(CT.dom.node("check any categories that apply, then click OK to submit!", "div", "small"));
	        for (var i = 0; i < data.length; i++) {
	            var cb = CT.dom.field();
	            cb.type = "checkbox";
	            cb.name = "category";
	            cb.value = data[i].key;
	            cb.id = data[i].key + "checkbox";
	            var cbline = CT.dom.node();
	            cbline.appendChild(cb);
	            cbline.appendChild(CT.dom.node(data[i].name, "label",
	            	"", "", {"for": cb.id, "htmlFor": cb.id}));
	            CAN.categories.cats.appendChild(cbline);
	        };
	        CAN.categories.submit_button = CT.dom.button("OK");
	        CAN.categories.cats.appendChild(CAN.categories.submit_button);
	        CAN.categories.cats.appendChild(CT.dom.button("Cancel",
	        	function() { CAN.categories.cats.style.display = "none"; }));
	        lccb && lccb(data);
	    });
	},

	"_processPData": function(pdata, pdarg) {
	    pdata.uid = CAN.categories.catuid;
	    return {"eid": CAN.categories.catuid || pdarg, "data": pdata};
	},
	"tagAndPost": function(pdata, cbfunc, pdarg) {
	    CAN.categories.cats.style.display = "block";
	    CT.align.centered(CAN.categories.cats);
	    CAN.categories.submit_button.onclick = function() {
	        CAN.categories.cats.style.display = "none";
	        pdata.category = [];
	        var allcats = document.getElementsByName("category");
	        for (var i = 0; i < allcats.length; i++) {
	            if (allcats[i].checked)
	                pdata.category.push(allcats[i].value);
	        };
	        CT.net.post("/edit",
	        	CAN.categories._processPData(pdata, pdarg),
	        	"error uploading media", cbfunc);
	    }
	}
};
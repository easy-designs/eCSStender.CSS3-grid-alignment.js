var Sample = Sample || {};

Sample.list = function (template, data, target) {
	var trm = $(target.master);
	var trd = $(target.details);
	trm.empty();
	trd.empty();
	$(template.master).tmpl(data).appendTo(trm);
};

Sample.about = function (template, data, target) {
	var t = $(target.master);
	var c = $(template).clone();
	t.empty();
	c.toggleClass("none");
	t.append(c);
};

Sample.details = function (template, data, target) {
	var t = $(target);
	t.empty();
	$(template).tmpl(data).appendTo(t);
	if(target === "#shot-details-content")
	$("#shot-details-shadow").css("display", "-ms-box");
};

Sample.getHash = function () {
	return window.location.hash.substring(1);
};

Sample.vtable = {
	popular: {
		template: { master: "#t-content", details: "#t-shot-details" },
		action: Sample.list,
		data: Data.popular,
		target: { master: "#content-scroller", details: "#shot-details-content" }
	},
	everyone: {
		template: { master: "#t-content", details: "#t-shot-details" },
		action: Sample.list,
		data: Data.everyone,
		target: { master: "#content-scroller", details: "#shot-details-content" }
	},
	debuts: {
		template: { master: "#t-content", details: "#t-shot-details" },
		action: Sample.list,
		data: Data.debuts,
		target: { master: "#content-scroller", details: "#shot-details-content" }
	},
	about: {
		template: "#about-section-scroller",
		action: Sample.about,
		data: "about.html",
		target: { master: "#content-scroller", details: null }
	},
	details: {
		template: "#t-shot-details",
		action: Sample.details,
		data: Data,
		target: "#shot-details-content"
	}
};

Sample.modes = [
	{
		mode: "landscape",
		query: "(orientation: landscape)",
		action: function () {
			Sample.vtable["details"].template = "#t-shot-details";
			Sample.vtable["details"].target = "#shot-details-content";
		}
	},
	{
		mode: "portrait",
		query: "(orientation: portrait) and (min-width: 321px)",
		action: function () {
			Sample.vtable["details"].template = "#t-shot-details";
			Sample.vtable["details"].target = "#shot-details-content";
		}
	},
	{
		mode: "mobile",
		query: "(orientation: portrait) and (max-width: 320px)",
		action: function () {
			Sample.vtable["details"].template = "#t-sub-content-hero";
			Sample.vtable["details"].target = "#sub-content-grid-hero";
			$("#shot-details-shadow").css("display", "none");
		}
	}
];

Sample.lastMode = null;
Sample.matchMode = function (modes) {
	for(i = 0; i < modes.length; i++) {
		if(window.styleMedia.matchMedium(modes[i].query) && Sample.modes[i].mode !== Sample.lastMode) {
			Sample.lastMode = modes[i].mode;
			if(modes[i].action) {
				modes[i].action();
			}
		}
	}
};

$(document).ready(function ()  {
	Sample.matchMode(Sample.modes);
	$("#about-section").load("about.html");
	$("#t-sub-content-hero").tmpl(Data.debuts.shots[0]).appendTo("#sub-content-grid-hero");
	$("#t-sub-content-list-item").tmpl(Data.debuts).appendTo("#sub-content-grid-list-scroller");
	
	$("#shot-details-shadow").click(function (e) {
		$("#shot-details-shadow").css("display", "none");
	});
	
	window.addEventListener("hashchange", function () {
		var hash = window.location.hash;
		hash = hash.substring(1);
		var route = hash.split("/");
		var view = route[0];
		
			if(view !== null && view !== undefined && view !== "")  {
				var tp = Sample.vtable[view].template;
				var a = Sample.vtable[view].action;
				var d = Sample.vtable[view].data;
				var tr = Sample.vtable[view].target;
				
				if (a !== undefined && a !== null) {
					if(route.length < 2) {
						a(tp, d, tr);
					}
					else {
						var v = route[1];
						var p = route[2];
						a(tp, d[v].shots[p], tr);
					}
				}
			}
	});

	window.addEventListener("resize", function () {
		Sample.matchMode(Sample.modes);
	});
	
	window.navigate("#popular");
});
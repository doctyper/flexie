(function () {
	var DEFAULTS = {
		orient : "horizontal",
		align : "stretch",
		direction : "normal",
		pack : "start"
	},

	ORIGINAL_HTML,

	PREFIXES = "-webkit- -moz- ".split(" "),
	DOM_PREFIXES = "Webkit Moz Khtml".split(" "),

	PARENT_CSS_PROPERTIES = {
		"display" : "box"
	},

	OMIT = true,

	CHILD_CSS_PROPERTIES = {};

	function getPresetValues () {
		return {
			orient : $("#box-orient").val(),
			align : $("#box-align").val(),
			direction : $("#box-direction").val(),
			pack : $("#box-pack").val(),
			flexMatrix : [$("#box-flex-1").val(), $("#box-flex-2").val(), $("#box-flex-3").val()],
			ordinalMatrix : [$("#box-ordinal-group-1").val(), $("#box-ordinal-group-2").val(), $("#box-ordinal-group-3").val()]
		};
	}

	function applyFlexboxProperties (target) {
		var instance = Flexie.getInstance(target.get(0)),
		    values = getPresetValues(),
		    SUPPORT = Flexie.flexboxSupported;

		$.each(values, function (key, value) {
			if (value !== undefined) {
				instance[key] = value;
			}
		});

		target.children().andSelf().removeAttr("style").css("opacity", 0);

		window.setTimeout(function() {
			target.removeAttr("style");

			if (!SUPPORT || SUPPORT.partialSupport) {
				Flexie.updateInstance(target.get(0), instance);
			}

			if (SUPPORT) {
				var prefix;

				if ($.browser.mozilla) {
					prefix = "Moz";
				} else if ($.browser.webkit) {
					prefix = "Webkit";
				} else if ($.browser.opera) {
					prefix = "O";
				}

				target.css(prefix + "BoxOrient", values.orient);
				target.css(prefix + "BoxAlign", values.align);
				target.css(prefix + "BoxDirection", values.direction);
				target.css(prefix + "BoxPack", values.pack);

				window.setTimeout(function() {
					target.children().each(function (i) {
						var child = $(this);

						if (values.ordinalMatrix) {
							child.get(0).style[prefix + "BoxOrdinalGroup"] = values.ordinalMatrix[i];
						}

						if (values.flexMatrix) {
							child.get(0).style[prefix + "BoxFlex"] = values.flexMatrix[i];
						}
					});
				}, 0);
			}
		}, 0);
	}

	function parentRuleOutput (target, prefixes, rules) {
		var cssText = [], display;

		$.each(rules, function (property, value) {
			display = (property === "display");
			
			if (!OMIT || display || ((property === "box-orient" && value !== "horizontal") || (property === "box-align" && value !== "stretch") || (property === "box-direction" && value !== "normal") || (property === "box-pack" && value !== "start"))) {
				$.each(prefixes, function (i, prefix) {
					cssText.push((display ? property : (prefix + property)) + ": " + (display ? (prefix + value) : value) + ";" + (prefixes[i + 1] === undefined ? "\n" : ""));
				});
			}
		});

		return target.selector + " {\n" + "\t" + cssText.join("\n\t") + "}\n\n";
	}

	function childRuleOutput (children, prefixes, rules) {
		var cssRules = {}, rule, cssText = "", fragments, node, key;

		if (!$.isEmptyObject(rules)) {
			$.each(rules, function (property, value) {
				fragments = (/(.*)\-(\d)+/).exec(property);
				property = fragments[1];

				if (!OMIT || ((property === "box-flex" && value !== "0") || (property === "box-ordinal-group" && value !== "1"))) {
					node = $("#box-" + fragments[2]);
					key = "#" + node.attr("id") + " {\n";

					rule = cssRules[key];
					if (!rule) {
						rule = cssRules[key] = [];
					}

					$.each(prefixes, function (x, prefix) {
						rule.push("\t" + prefix + property + ": " + value + ";" + (prefixes[x + 1] === undefined ? "\n" : ""));
					});
				}
			});

			$.each(cssRules, function (key, value) {
				value[value.length - 1] = value[value.length - 1].replace(/\n$/, "");
				value.push("}\n\n");

				cssText += key + value.join("\n");
			});
		}

		return cssText;
	}

	function outputFlexboxCSS (target, property, value) {
		var output = $("#flexie-css-output"), cssText;

		if (/box\-(flex|ordinal\-group)/.test(property)) {
			CHILD_CSS_PROPERTIES[property] = value;
		} else {
			PARENT_CSS_PROPERTIES[property] = value;
		}

		cssText = parentRuleOutput(target, PREFIXES, PARENT_CSS_PROPERTIES);
		cssText += childRuleOutput(target.children(), PREFIXES, CHILD_CSS_PROPERTIES);

		if (!output.get(0)) {
			output = $('<div id="flexie-css-output"><pre></pre><label><input type="checkbox" checked="checked" /> Omit Defaults</label></div>').appendTo("body");
		}

		output.find("pre").replaceWith('<pre>' + cssText + '</pre>');
	}

	$(document).ready(function () {
		var target = $("#box-wrap-inner"),
		    selects = $("#flexie-playground select"),
		    select, property, value;

		selects.bind("change", function () {
			select = $(this);
			property = select.attr("id");
			value = select.val();

			applyFlexboxProperties(target);
			outputFlexboxCSS(target, property, value);
		});

		// sets selected index to first item using the DOM
		selects.each(function () {
			var select = $(this),
			    selectedIndex = 0,
			    maxLimit;

			if (window.location.search === "?random") {
				if ((/flex|ordinal/).test(select.attr("id"))) {
					maxLimit = 4;
				} else {
					maxLimit = select.find("option").not(":disabled").length;
				}

				selectedIndex = Math.floor(Math.random() * maxLimit);
			}

			select.attr("selectedIndex", selectedIndex);
		});

		$("#flexie-css-output input").live("click", function (e) {
			OMIT = !OMIT;
			selects.trigger("change");
		});

		$(window).bind("resize", function () {
			selects.trigger("change");
		});

		$(window).load(function () {
			selects.trigger("change");
		});
	});
})();
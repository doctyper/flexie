var DEFAULTS = {
	orient : "horizontal",
	align : "stretch",
	direction : "normal",
	pack : "start"
},

ORIGINAL_HTML,

PREFIXES = "-webkit- -moz- -ms- ".split(" "),
DOM_PREFIXES = "Webkit Moz O ms Khtml".split(" "),

PARENT_CSS_PROPERTIES = {
	"display" : "box"
},

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
	
	$.each(instance.children, function (i, child) {
		child["ordinal-group"] = values.ordinalMatrix[i];
		child.flex = values.flexMatrix[i];
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
		$.each(prefixes, function (i, prefix) {
			display = (property === "display");
			cssText.push((display ? property : (prefix + property)) + ": " + (display ? (prefix + value) : value) + ";" + (prefixes[i + 1] === undefined ? "\n" : ""));
		});
	});
	
	return target.selector + " {\n" + "\t" + cssText.join("\n\t") + "}\n\n";
}

function childRuleOutput (children, prefixes, rules) {
	var cssRules = {}, rule, cssText = "", fragments, node, key;
	
	if (!$.isEmptyObject(rules)) {
		$.each(rules, function (property, value) {
			
			fragments = (/(.*)\-(\d)+/).exec(property);
			property = fragments[1];
			
			node = $("#box-" + fragments[2]);
			key = "#" + node.attr("id") + " {\n";
			
			rule = cssRules[key];
			if (!rule) {
				rule = cssRules[key] = [];
			}
			
			$.each(prefixes, function (x, prefix) {
				rule.push("\t" + prefix + property + ": " + value + ";" + (prefixes[x + 1] === undefined ? "\n" : ""));
			});
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
		output = $('<div id="flexie-css-output"></div>').appendTo("body");
	}
	
	output.html('<pre>' + cssText + '</pre>');
}

$(document).ready(function () {
	var target = $("#box-wrap-inner"),
	    selects = $("#flexie-playground select"),
	    select, property, value;
	
	// sets selected index to first item using the DOM
	selects.each(function () {
		$(this).get(0).selectedIndex = 0;
	});
	
	selects.bind("change", function () {
		select = $(this);
		property = select.attr("id");
		value = select.val();

		applyFlexboxProperties(target);
		outputFlexboxCSS(target, property, value);
	});
	
	$(window).bind("resize", function () {
		selects.eq(0).trigger("change");
	});
});

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

function applyFlexboxProperty (target, property, value) {
	var domPrefixes = DOM_PREFIXES, box,
	    propertyFragments = property.split("-"),
	    domProperty = "", props, values;
	
	$.each(propertyFragments, function (i, fragment) {
		domProperty += fragment.charAt(0).toUpperCase() + fragment.substr(1);
	});
	
	props = (/(.*)\-(\d)+/).exec(property);
	
	if (Flexie.flexboxSupported) {
		$.each(domPrefixes, function (i, prefix) {
			if (/box\-(flex|ordinal\-group)/.test(property)) {
				domProperty = domProperty.replace(/\d$/, "");
				
				// Null values first
				// Set display to something other than block
				// Set opacity to 0 to hide new display setting
				// Solves a bug in Webkit browsers where box-flex properties do not revert once a value is applied.
				$("box-" + props[2]).css("opacity", "0").css(prefix + domProperty, "0").css("display", "inline-block");
				
				// Set a timeout.
				// Solves the same Webkit bug. Webkit needs a pause to register the new values.
				window.setTimeout(function() {
					// Set correct box-flex property
					// Remove display/opacity values
					$("box-" + props[2]).css(prefix + domProperty, value).css("display", "").css("opacity", "");
				}, 0);
			} else {
				target.get(0).style[prefix + domProperty] = value;
			}
		});
	} else {
		ORIGINAL_HTML = ORIGINAL_HTML || target.outerHTML;
		target.outerHTML = ORIGINAL_HTML;
		
		DEFAULTS.target = DEFAULTS.target || target.get(0);
		DEFAULTS.selector = DEFAULTS.selector || target.selector;
		DEFAULTS.children = DEFAULTS.children || function () {
			var matches = [];
			
			target.children().each(function () {
				var obj = {
					selector : "#" + $(this).attr("id"),
					properties : [],
					match : this
				};
				
				matches.push(obj);
			});
			
			return matches;
		}();
		
		if (/box\-(flex|ordinal\-group)/.test(property)) {
			DEFAULTS.children[props[2] - 1][props[1].replace("box-", "")] = value;
		} else {
			DEFAULTS[property.replace(/box\-|\-\d/g, "")] = value;
		}
		
		box = new Flexie.box(DEFAULTS);
	}
}

function parentRuleOutput (target, prefixes, rules) {
	var cssText = [];
	
	$.each(rules, function (property, value) {
		$.each(prefixes, function (i, prefix) {
			cssText.push(prefix + property + ": " + value + ";" + (prefixes[i + 1] === undefined ? "\n" : ""));
		});
	});
	
	return target.selector + " {\n" + "\t" + cssText.join("\n\t") + "}\n\n";
}

function childRuleOutput (children, prefixes, rules) {
	var cssText = [], fragments, node;
	
	if (!$.isEmptyObject(rules)) {
		$.each(rules, function (property, value) {
			
			fragments = (/(.*)\-(\d)+/).exec(property);
			property = fragments[1];
			
			node = $("#box-" + fragments[2]);
			
			cssText.push("#" + node.attr("id") + " {");
			
			$.each(prefixes, function (x, prefix) {
				cssText.push("\t" + prefix + property + ": " + value + ";" + (prefixes[x + 1] === undefined ? "\n" : ""));
			});
			
			cssText[cssText.length - 1] = cssText[cssText.length - 1].replace(/\n$/, "");
			cssText.push("}\n");
		});
	}
	
	return cssText.join("\n") || "";
}

function outputFlexboxCSS (target, property, value) {
	var output = $("#flexie-css-output pre"), cssText;
	
	if (/box\-(flex|ordinal\-group)/.test(property)) {
		CHILD_CSS_PROPERTIES[property] = value;
	} else {
		PARENT_CSS_PROPERTIES[property] = value;
	}
	
	cssText = parentRuleOutput(target, PREFIXES, PARENT_CSS_PROPERTIES);
	cssText += childRuleOutput(target.children(), PREFIXES, CHILD_CSS_PROPERTIES);
	
	if (!output.get(0)) {
		output = $('<div id="flexie-css-output"><pre></pre></div>').appendTo("body").find("pre");
	}
	
	output.text(cssText);
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

		applyFlexboxProperty(target, property, value);
		outputFlexboxCSS(target, property, value);
	});
});

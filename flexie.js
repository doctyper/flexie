/*
File: flexie.js

About: Version
	0.1

Project: Flexie

Description:
	Legacy support for the CSS3 Flexible Box Model

License:
	The MIT License
	
	Copyright (c) 2010 Richard Herrera

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
*/

/*
Class: Flexie
	Scoped to the Flexie Global Namespace
*/

/*jslint evil: true, regexp: false, plusplus: false */
/*global window, document */

var Flexie = (function (window, doc) {
	var FLX = {},
	
	// Store support for flexbox
	SUPPORT,
	
	// Store reference to library
	LIBRARY,
	
	PIXEL = /^\d+(px)?$/i,
	SIZES = /width|height|top|bottom|left|right|margin|padding|border(.*)?Width/,
	
	BORDER_RIGHT = "borderRightWidth",
	BORDER_BOTTOM = "borderBottomWidth",
	BORDER_LEFT = "borderLeftWidth",
	BORDER_TOP = "borderTopWidth",
	
	PREFIXES = " -o- -moz- -ms- -webkit- -khtml- ".split(" "),
	
	DEFAULTS = {
		orient : "horizontal",
		align : "stretch",
		direction : "normal",
		pack : "start"
	},
	
	FLEX_BOXES = [],
	POSSIBLE_FLEX_CHILDREN = [],
	
	FLEX_INSTANCES = [],
	
	RESIZE_LISTENER,
	
	BROWSER = {
		IE : (function() {
			var ie, ua = window.navigator.userAgent,
			    match = (/(msie) ([\w.]+)/).exec(ua.toLowerCase());
			
			if (match) {
				ie = parseInt(match[2], 10);
			}
			
			return ie;
		}())
	},
	
	/*
	selectivizr v1.0.0 - (c) Keith Clark, freely distributable under the terms 
	of the MIT license.

	selectivizr.com
	*/
	selectivizr;
	
	// --[ determineSelectorMethod() ]--------------------------------------
	// walks through the selectorEngines object testing for an suitable
	// selector engine.
	function determineSelectorMethod() {
		// compatiable selector engines in order of CSS3 support
		var selectorEngines = {
			"NW" : "*.Dom.select",
			"DOMAssistant" : "*.$", 
			"Prototype" : "$$",
			"YAHOO" : "*.util.Selector.query",
			"MooTools" : "$$",
			"Sizzle" : "*", 
			"jQuery" : "*",
			"dojo" : "*.query"
		}, method, engine;
		
		for (engine in selectorEngines) {
			if (window[engine] && (method = eval(selectorEngines[engine].replace("*", engine)))) {
				return method;
			}
		}
		return false;
	}
	
	function attachLoadMethod(handler) {
		// compatiable selector engines in order of CSS3 support
		var selectorEngines = {
			"DOMAssistant" : ["*.DOMReady", "%"],
			"Prototype" : ["document.observe", "'dom:loaded', %"],
			"YAHOO" : ["*.util.Event", "onDOMReady", "%"],
			"MooTools" : ["window.addEvent", "'domready', %"],
			"jQuery" : ["*(document).ready", "%"],
			"dojo" : ["*.addOnLoad", "%"]
		}, method, current, engine;
		
		for (engine in selectorEngines) {
			current = selectorEngines[engine];
			
			if (window[engine] && (method = eval(current[0].replace("*", engine)))) {
				if (current[2]) {
					method = method[current[1]];
				}
				
				method && eval(method + "(" + current[current.length - 1].replace("%", handler) + ")");
			}
		}
		
		if (!method) {
			window.onload = handler;
		}
	}
	
	function buildSelectorTree(text) {
		var rules = [], ruletext, rule, i, j, k, l,
		    match, selector, proptext, splitprop, properties;
		
		// Tabs, Returns
		text = text.replace(/\t/g, "").replace(/\n/g, "").replace(/\r/g, "");
		
		// Leading / Trailing Whitespace
		text = text.replace(/\s?(\{|\:|\})\s?/g, "$1");
		
		ruletext = text.split("}");
		
		for (i = 0, j = ruletext.length; i < j; i++) {
			if (ruletext[i]) {
				rule = [ruletext[i], "}"].join("");
				
				match = (/(.*)\{(.*)\}/).exec(rule);
				
				if (match.length && match[2]) {
					selector = match[1];
					proptext = match[2].split(";");
					properties = [];
					
					for (k = 0, l = proptext.length; k < l; k++) {
						splitprop = proptext[k].split(":");
						
						if (splitprop.length && splitprop[1]) {
							properties.push({
								property : splitprop[0],
								value : splitprop[1]
							});
						}
					}
					
					rules.push({
						selector : selector,
						properties : properties
					});
				}
			}
		}
		
		return rules;
	}
	
	function findFlexBoxElements(rules) {
		var rule, selector, properties, prop,
		    property, value, i, j, k, l,
		    leadingTrim = /^\s\s*/,
		    trailingTrim = /\s\s*$/,
		    selectorSplit = /(\s)?,(\s)?/, trim,
		    multiSelectors, multi, m, n, key, updatedRule;
		
		trim = function(string) {
			return string.replace(leadingTrim, "").replace(trailingTrim, "");
		};
		
		for (i = 0, j = rules.length; i < j; i++) {
			rule = rules[i];
			selector = rule.selector;
			properties = rule.properties;
			
			for (k = 0, l = properties.length; k < l; k++) {
				prop = properties[k];
				
				// Trim any residue whitespace (it happens)
				prop.property = trim(prop.property);
				prop.value = trim(prop.value);
				
				property = prop.property;
				value = prop.value;
				
				if (property === "display" && value === "box") {
					FLEX_BOXES.push(rule);
				} else if (property === "box-flex" && value) {
					
					// Multiple selectors?
					multiSelectors = selector.split(selectorSplit);
					
					for (m = 0, n = multiSelectors.length; m < n; m++) {
						multi = multiSelectors[m];
						
						if (multi && (multi = trim(multi))) {
							updatedRule = {};

							// Each selector gets its own call
							for (key in rule) {
								if (rule.hasOwnProperty(key)) {
									updatedRule[key] = rule[key];
								}
							}
							
							updatedRule.selector = multi;

							// Easy access for later
							updatedRule.flex = value;
							POSSIBLE_FLEX_CHILDREN.push(updatedRule);
						}
					}
				}
			}
		}
		
		return {
			boxes : FLEX_BOXES,
			children : POSSIBLE_FLEX_CHILDREN
		};
	}
	
	function matchFlexChildren(parent, lib, possibleChildren) {
		var child, caller, unique, key,
		    matches = [], i, j, k, l;
		
		for (i = 0, j = possibleChildren.length; i < j; i++) {
			child = possibleChildren[i];
			
			caller = lib(child.selector);
			
			if (caller[0]) {
				for (k = 0, l = caller.length; k < l; k++) {
					if (caller[k].parentNode === parent) {
						unique = {};
						
						for (key in child) {
							unique[key] = child[key];
						}
						
						unique.match = caller[k];
						matches.push(unique);
					}
				}
			}
		}
		
		return matches;
	}
	
	function getParams(params) {
		var key;
		
		for (key in params) {
			if (params.hasOwnProperty(key)) {
				params[key] = params[key] || DEFAULTS[key];
			}
		}
		
		return params;
	}
	
	function buildFlexieCall(flexers) {
		var flex, selector, properties, prop,
		    orient, align, direction, pack,
		    lib, caller, children, i, j, k, l,
		    box, params;
		
		for (i = 0, j = flexers.boxes.length; i < j; i++) {
			flex = flexers.boxes[i];
			
			selector = flex.selector;
			properties = flex.properties;
			
			orient = align = direction = pack = null;
			
			for (k = 0, l = properties.length; k < l; k++) {
				prop = properties[k];
				
				switch (prop.property) {
				case "box-orient" :
					orient = prop.value;
					break;
					
				case "box-align" :
					align = prop.value;
					break;
					
				case "box-direction" :
					direction = prop.value;
					break;
					
				case "box-pack" :
					pack = prop.value;
					break;
				}
			}
			
			// Determine library
			lib = LIBRARY;
			
			// Call it.
			caller = lib(flex.selector);
			
			// In an array?
			caller = caller[0] || caller;
			
			// Find possible child node matches
			children = matchFlexChildren(caller, lib, flexers.children);
			
			// Make sure there is some value associated with box properties
			params = getParams({
				target : caller,
				children : children,
				orient : orient,
				align : align,
				direction: direction,
				pack : pack
			});
			
			// Constructor
			box = new FLX.box(params);
		}
	}
	
	function calcPx(element, props, dir) {
		var value, i, j, key, globalProps, dummy;
		dir = dir.replace(dir.charAt(0), dir.charAt(0).toUpperCase());

		globalProps = {
			visibility : "hidden",
			position : "absolute",
			left : "-9999px",
			top : "-9999px"
		};

		dummy = element.cloneNode(true);

		for (i = 0, j = props.length; i < j; i++) {
			dummy.style[props[i]] = "0";
		}
		for (key in globalProps) {
			if (globalProps.hasOwnProperty(key)) {
				dummy.style[key] = globalProps[key];
			}
		}

		doc.body.appendChild(dummy);
		value = dummy["offset" + dir];
		doc.body.removeChild(dummy);

		return value;
	}
	
	function getTrueValue(element, prop) {
		var left, rsLeft, ret = element.currentStyle && element.currentStyle[name], style = element.style;
		
		// Remember the original values
		left = style.left;
		rsLeft = element.runtimeStyle.left;

		// Put in the new values to get a computed value out
		element.runtimeStyle.left = element.currentStyle.left;
		style.left = name === "fontSize" ? "1em" : (ret || 0);
		ret = style.pixelLeft;

		// Revert the changed values
		style.left = left;
		element.runtimeStyle.left = rsLeft;
		
		return ret;
	}
	
	function unAuto(element, prop) {
		var props;
		
		switch (prop) {
		case "width" :
			props = ["paddingLeft", "paddingRight", BORDER_LEFT, BORDER_RIGHT];
			prop = calcPx(element, props, prop);
			break;

		case "height" :
			props = ["paddingTop", "paddingBottom", BORDER_TOP, BORDER_BOTTOM];
			prop = calcPx(element, props, prop);
			break;

		default :
			prop = getTrueValue(element, prop);
			break;
		}

		return prop;
	}
	
	function getPixelValue(element, prop, name) {
		if (PIXEL.test(prop)) {
			return prop;
		}
		
		// if property is auto, do some messy appending
		if (prop === "auto" || prop === "medium") {
			prop = unAuto(element, name);
		} else {
			prop = getTrueValue(element, prop);
		}
		
		return prop + "px";
	}
	
	function getComputedStyle(element, property, returnAsInt) {
		if (doc.defaultView && doc.defaultView.getComputedStyle) {
			property = doc.defaultView.getComputedStyle(element, null)[property];
		} else {
			if (SIZES.test(property)) {
				property = getPixelValue(element, element.currentStyle[property], property);
			} else {
				property = element.currentStyle[property];
			}
		}
		
		return returnAsInt ? parseInt(property, 10) : (property || "");
	}
	
	function clientWidth(element) {
		return element.innerWidth || element.clientWidth;
	}
	
	function clientHeight(element) {
		return element.innerHeight || element.clientHeight;
	}
	
	function appendProperty(target, prop, value) {
		var cssText = [], i, j;

		for (i = 0, j = PREFIXES.length; i < j; i++) {
			cssText.push(prop + ":" + PREFIXES[i] + value);
		}

		target.style.cssText = cssText.join(";");
		return target;
	}
	
	function appendPixelValue(target, prop, value) {
		var targets = target[0] ? target : [target],
		    i, j;
		
		for (i = 0, j = targets.length; i < j; i++) {
			if (targets[i] && targets[i].style) {
				targets[i].style[prop] = (value ? (value + "px") : "");
			}
		}
	}
	
	function attachResizeListener(constructor, params) {
		FLEX_INSTANCES.push({
			constructor : constructor,
			params : params
		});
		
		if (!RESIZE_LISTENER) {
			var storedWidth, storedHeight,
			    currentWidth, currentHeight,
			    docBody = document.body,
			    docEl = document.documentElement,
			    i, j, instance;

			window.onresize = function () {
				currentWidth = docEl.innerWidth || docBody.clientWidth || docEl.clientWidth;
				currentHeight = docEl.innerHeight || docBody.clientHeight || docEl.clientHeight;
				
				if (storedWidth !== currentWidth || storedHeight !== currentHeight) {
					for (i = 0, j = FLEX_INSTANCES.length; i < j; i++) {
						instance = FLEX_INSTANCES[i];
						instance.constructor.updateModel(instance.params);
					}
					
					storedWidth = currentWidth;
					storedHeight = currentHeight;
				}
			};
			
			RESIZE_LISTENER = true;
		}
	}

	function flexBoxSupported() {
		var dummy = doc.createElement("div");
		appendProperty(dummy, "display", "box");
		return ((dummy.style.display).indexOf("box") !== -1) ? true : false;
	}
	
	selectivizr = (function () {
		var RE_COMMENT = /(\/\*[^*]*\*+([^\/][^*]*\*+)*\/)\s*/g,
		    RE_IMPORT = /@import\s*url\(\s*(["'])?(.*?)\1\s*\)[\w\W]*?;/g,
		    RE_SELECTOR_GROUP = /(^|\})\s*([^\{]*?[\[:][^\{]+)/g,
			
		    // Whitespace normalization regexp's
		    RE_TIDY_TRAILING_WHITESPACE = /([(\[+~])\s+/g,
		    RE_TIDY_LEADING_WHITESPACE = /\s+([)\]+~])/g,
		    RE_TIDY_CONSECUTIVE_WHITESPACE = /\s+/g,
		    RE_TIDY_TRIM_WHITESPACE = /^\s*((?:[\S\s]*\S)?)\s*$/,
			
		    // String constants
		    EMPTY_STRING = "",
		    SPACE_STRING = " ",
		    PLACEHOLDER_STRING = "$1";

		// --[ trim() ]---------------------------------------------------------
		// removes leading, trailing whitespace from a string
		function trim(text) {
			return text.replace(RE_TIDY_TRIM_WHITESPACE, PLACEHOLDER_STRING);
		}

		// --[ normalizeWhitespace() ]------------------------------------------
		// removes leading, trailing and consecutive whitespace from a string
		function normalizeWhitespace(text) {
			return trim(text).replace(RE_TIDY_CONSECUTIVE_WHITESPACE, SPACE_STRING);
		}

		// --[ normalizeSelectorWhitespace() ]----------------------------------
		// tidys whitespace around selector brackets and combinators
		function normalizeSelectorWhitespace(selectorText) {
			return normalizeWhitespace(selectorText.replace(RE_TIDY_TRAILING_WHITESPACE, PLACEHOLDER_STRING).replace(RE_TIDY_LEADING_WHITESPACE, PLACEHOLDER_STRING));
		}

		// --[ patchStyleSheet() ]----------------------------------------------
		// Scans the passed cssText for selectors that require emulation and
		// creates one or more patches for each matched selector.
		function patchStyleSheet(cssText) {
			return cssText.replace(RE_SELECTOR_GROUP, function (m, prefix, selectorText) {
				var selectorGroups, c, cs, selector;
				
				selectorGroups = selectorText.split(",");
				for (c = 0, cs = selectorGroups.length; c < cs; c++) {
					selector = normalizeSelectorWhitespace(selectorGroups[c]) + SPACE_STRING;
				}
				return prefix + selectorGroups.join(",");
			});
		}
		
		// --[ getXHRObject() ]-------------------------------------------------
		function getXHRObject() {
			if (window.XMLHttpRequest) {
				return new window.XMLHttpRequest();
			}
			
			try	{ 
				return new window.ActiveXObject('Microsoft.XMLHTTP');
			} catch (e) { 
				return null;
			}
		}
		
		// --[ loadStyleSheet() ]-----------------------------------------------
		function loadStyleSheet(url) {
			var xhr = getXHRObject();
			
			xhr.open("GET", url, false);
			xhr.send();
			return (xhr.status === 200) ? xhr.responseText : "";	
		}
		
		// --[ resolveUrl() ]---------------------------------------------------
		// Converts a URL fragment to a fully qualified URL using the specified
		// context URL. Returns null if same-origin policy is broken
		function resolveUrl(url, contextUrl) {
			
			// IE9 returns a false positive sometimes(?)
			if (!url) {
				return;
			}
			
			function getProtocolAndHost(url) {
				return url.substring(0, url.indexOf("/", 8));
			}

			// absolute path
			if (/^https?:\/\//i.test(url)) {
				return getProtocolAndHost(contextUrl) === getProtocolAndHost(url) ? url : null;
			}

			// root-relative path
			if (url.charAt(0) === "/")	{
				return getProtocolAndHost(contextUrl) + url;
			}

			// relative path
			var contextUrlPath = contextUrl.split("?")[0]; // ignore query string in the contextUrl
			if (url.charAt(0) !== "?" && contextUrlPath.charAt(contextUrlPath.length - 1) !== "/") {
				contextUrlPath = contextUrlPath.substring(0, contextUrlPath.lastIndexOf("/") + 1);
			}

			return contextUrlPath + url;
		}
		
		// --[ parseStyleSheet() ]----------------------------------------------
		// Downloads the stylesheet specified by the URL, removes it's comments
		// and recursivly replaces @import rules with their contents, ultimately
		// returning the full cssText.
		function parseStyleSheet(url) {
			if (url) {
				var cssText = loadStyleSheet(url);
				return cssText.replace(RE_COMMENT, EMPTY_STRING).replace(RE_IMPORT, function (match, quoteChar, importUrl) {
					return parseStyleSheet(resolveUrl(importUrl, url));
				});
			}
			return EMPTY_STRING;
		}
		
		// --[ init() ]---------------------------------------------------------
		return function () {
			// honour the <base> tag
			var url, stylesheet, c,
			    baseTags = doc.getElementsByTagName("BASE"),
			    baseUrl = (baseTags.length > 0) ? baseTags[0].href : doc.location.href,
			    cssText, tree, flexers;
			
			for (c = 0; c < doc.styleSheets.length; c++) {
				stylesheet = doc.styleSheets[c];
				
				if (stylesheet.href !== "") {
					url = resolveUrl(stylesheet.href, baseUrl);
					
					if (url) {
						cssText = patchStyleSheet(parseStyleSheet(url));
						tree = buildSelectorTree(cssText);
						flexers = findFlexBoxElements(tree);
					}
				}
			}
			
			buildFlexieCall(flexers);
		};
	}());
	
	FLX.box = function (params) {
		this.renderModel(params);
	};
	
	FLX.box.prototype = {
		boxModel : function (target, children) {
			target.style.overflow = "hidden";
		},

		boxOrient : function (target, children, params) {
			var self = this,
			    i, j, kid,
			    wide, high;

			wide = {
				pos : "marginLeft",
				add : ["marginRight", BORDER_LEFT, BORDER_RIGHT],
				dim : "width",
				out : "offsetWidth",
				func : clientWidth
			};

			high = {
				pos : "marginTop",
				add : ["marginBottom", BORDER_TOP, BORDER_BOTTOM],
				dim : "height",
				out : "offsetHeight",
				func : clientHeight
			};

			for (i = 0, j = children.length; i < j; i++) {
				kid = children[i];

				kid.style.cssFloat = kid.style.styleFloat = "left";
				kid.style[wide.dim] = getComputedStyle(kid, wide.dim, null);

				if (params.orient === "vertical") {
					kid.style.cssFloat = kid.style.styleFloat = "";
				}
			}

			switch (params.orient) {
			case "horizontal" :
			case "inline-axis" :
				self.props = wide;
				self.anti = high;
				break;

			case "vertical" :
			case "block-axis":
				self.props = high;
				self.anti = wide;
				break;
			}
		},

		boxAlign : function (target, children, params) {
			var self = this,
			    kid, targetDimension = self.anti.func(target),
			    kidDimension, i, j, k, l;
				
			switch (params.align) {
			case "stretch" :
				appendPixelValue(children, self.anti.dim, self.anti.func(target));
				break;

			case "end" :
				for (i = 0, j = children.length; i < j; i++) {
					kid = children[i];
					kidDimension = self.anti.func(kid);

					for (k = 0, l = self.anti.add.length; k < l; k++) {
						kidDimension += getComputedStyle(kid, self.anti.add[k], true);
					}

					kid.style[self.anti.pos] = (targetDimension - kidDimension) + "px";
				}
				break;

			case "center":
				for (i = 0, j = children.length; i < j; i++) {
					kid = children[i];
					kid.style[self.anti.pos] = (targetDimension / 2 - self.anti.func(kid) / 2) + "px";
				}
				break;
			}
		},

		boxDirection : function (target, children, params) {
			var i;
			
			if (params.direction === "reverse") {
				for (i = children.length - 1; i >= 0; i--) {
					target.appendChild(children[i]);
				}
			}
		},

		boxPack : function (target, children, params) {
			var self = this,
			    groupDimension = 0, i, j,
			    totalDimension, fractionedDimension,
			    currentDimension, remainder,
			    length = children.length - 1;

			for (i = 0, j = children.length; i < j; i++) {
				groupDimension += children[i][self.props.out];
			}

			totalDimension = self.props.func(target) - groupDimension;
			fractionedDimension = Math.ceil(totalDimension / length);
			remainder = (fractionedDimension * length) - totalDimension;
			
			if (params.orient === "horizontal" && BROWSER.IE === 6) {
				totalDimension /= 2;
			}
			
			switch (params.pack) {
			case "end" :
				appendPixelValue(children[0], self.props.pos, totalDimension);
				break;

			case "center" :
				appendPixelValue(children[0], self.props.pos, totalDimension / 2);
				break;

			case "justify" :
				for (i = children.length - 1; i >= 1; i--) {
					currentDimension = fractionedDimension;
					
					if (remainder) {
						currentDimension--;
						remainder--;
					}
					
					children[i].style[self.props.pos] = currentDimension + "px";
				}
				break;
			}
		},

		boxFlex : function (target, children, params) {
			var self = this,
			    createMatchMatrix,
			    findTotalWhitespace,
			    distributeRatio,
			    matrix, whitespace, distro;
			
			createMatchMatrix = function (matches) {
				var kid, child, totalRatio = 0, i, j, k, l, x,
				    key, flexers = {}, keys = [];

				for (i = 0, j = children.length; i < j; i++) {
					kid = children[i];
					child = null;

					for (k = 0, l = matches.length; k < l; k++) {
						x = matches[k];

						if (x.match === kid) {
							child = x.match;
							totalRatio += parseInt(x.flex, 10);

							flexers[x.flex] = flexers[x.flex] || [];
							flexers[x.flex].push(x);
						}
					}

					if (!child) {
						flexers["0"] = flexers["0"] || [];
						flexers["0"].push(kid);
					}
				}

				for (key in flexers) {
					if (flexers.hasOwnProperty(key)) {
						keys.push(key);
					}
				}

				keys.sort(function (a, b) {
					return b - a;
				});

				return {
					keys : keys,
					flexers : flexers,
					total : totalRatio
				};
			};

			findTotalWhitespace = function (matrix) {
				var groupDimension = 0, kid, i, j,
				    whitespace, ration;

				for (i = 0, j = children.length; i < j; i++) {
					kid = children[i];
					groupDimension += kid[self.props.out];
				}
				
				whitespace = self.props.func(target) - groupDimension;
				ration = (whitespace / matrix.total);

				return {
					whitespace : whitespace,
					ration : ration
				};
			};

			distributeRatio = function (matrix, whitespace) {
				var flexers = matrix.flexers, i, j,
				    keys = matrix.keys, k, l,
				    ration = whitespace.ration,
				    x, w, key, flexWidths = {},
				    widthRation, trueDim, newWidth;

				for (i = 0, j = keys.length; i < j; i++) {
					key = keys[i];
					
					widthRation = (ration * key);
					flexWidths[key] = widthRation;

					for (k = 0, l = flexers[key].length; k < l; k++) {
						x = flexers[key][k];
						w = flexWidths[key];

						if (x.match) {
							trueDim = getComputedStyle(x.match, self.props.dim, true);
							newWidth = Math.max(0, (trueDim + w));
							x.match.style[self.props.dim] = newWidth + "px";
						}

					}
				}
			};

			matrix = createMatchMatrix(params.children);
			
			if (matrix.total) {

				// Zero out any defined positioning
				appendPixelValue(children, self.props.pos, null);
				
				whitespace = findTotalWhitespace(matrix);

				// Distribute the calculated ratios among the children
				distro = distributeRatio(matrix, whitespace);
			}
		},

		setup : function (target, children, params) {
			var self = this;
			
			// Set up parent
			self.boxModel(target, children);
			self.boxOrient(target, children, params);
			self.boxAlign(target, children, params);
			self.boxDirection(target, children, params);
			self.boxPack(target, children, params);

			// Children properties
			if (children.length) {
				self.boxFlex(target, children, params);
			}
		},

		trackDOM : function (params) {
			attachResizeListener(this, params);
		},

		updateModel : function (params) {
			var target = params.target, i, j,
			    children = target.childNodes;

			// Null properties
			for (i = 0, j = children.length; i < j; i++) {
				children[i].style.cssText = "";
			}

			this.setup(target, children, params);
		},

		renderModel : function (params) {
			var self = this,
			    target = params.target, i, j,
			    nodes = target.childNodes,
			    children = [];
			
			// Sanity check.
			if (!target.length && !nodes) {
				return;
			}
			
			for (i = 0, j = nodes.length; i < j; i++) {
				if (nodes[i]) {
					if (nodes[i].nodeType === 1) {
						children.push(nodes[i]);
					} else {
						target.removeChild(nodes[i]);
						i--;
					}
				}
			}
			
			// Setup properties
			self.setup(target, children, params);
			
			// Resize / DOM Polling Events
			self.trackDOM(params);
		}
	};

	FLX.init = (function () {
		SUPPORT = flexBoxSupported();
		LIBRARY = determineSelectorMethod();

		if (!SUPPORT && LIBRARY) {
			attachLoadMethod(selectivizr);
		}
	}());
	
	return FLX;
}(this, document));

// For Google's Closure Compiler
// Exports Public Properties
window["Flexie"] = Flexie;
Flexie["box"] = Flexie.box;
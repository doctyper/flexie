/*
File: flexie.js

About: Version
	0.3

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

var Flexie = (function (win, doc) {
	var FLX = {},
	
	// Store support for flexbox
	SUPPORT,
	
	// Store reference to library
	ENGINE, LIBRARY,
	
	// REGEXP
	PIXEL = /^-?\d+(?:px)?$/i,
	NUMBER = /^-?\d/,
	SIZES = /width|height|margin|padding|border/,
	MSIE = /(msie) ([\w.]+)/,
	
	PADDING_RIGHT = "paddingRight",
	PADDING_BOTTOM = "paddingBottom",
	PADDING_LEFT = "paddingLeft",
	PADDING_TOP = "paddingTop",
	
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
	
	TRUE = true,
	FALSE = false,
	NULL = null,
	
	BROWSER = {
		IE : (function () {
			var ie, ua = win.navigator.userAgent,
			    match = (MSIE).exec(ua.toLowerCase());
			
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
	
	// Via jQuery 1.4.3
	// http://github.com/jquery/jquery/blob/master/src/core.js#L593
	function forEach(object, callback, reverse) {
		var name, i = 0, value,
			length = object.length,
			isObj = length === undefined;

		if (isObj) {
			for (name in object) {
				if (object.hasOwnProperty(name)) {
					if (callback.call(object[name], name, object[name]) === FALSE) {
						break;
					}
				}
			}
		} else {
			for (value = object[0]; i < length && callback.call(value, i, value) !== FALSE; value = object[++i]) {
				continue;
			}
		}
	}
	
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
		}, method;
		
		forEach(selectorEngines, function (engine, value) {
			if (win[engine] && !method && (method = eval(value.replace("*", engine)))) {
				ENGINE = engine;
			}
		});
		
		return method;
	}
	
	function addEvent(type, func) {
		type = "on" + type;
		var oldevent = win[type];

		if (typeof win[type] !== "function") {
			win[type] = func;
		} else {
			win[type] = function() {
				if (oldevent) {
					oldevent();
				}
				func();
			};
		}
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
		}, method, current;
		
		current = selectorEngines[ENGINE];
		
		if (current && (method = eval(current[0].replace("*", ENGINE)))) {
			if (current[2]) {
				method = method[current[1]];
			}
			
			// This works in IE9 Preview 6, but throws an error anyway(?)
			try {
				eval(method + "(" + current[current.length - 1].replace("%", handler) + ")");
			} catch (e) {}
		}
		
		addEvent("load", function () {
			if (!method) {
				handler && handler();
			}
			
			updateInstances();
		});
	}
	
	function buildSelectorTree(text) {
		var rules = [], ruletext, rule,
		    match, selector, proptext, splitprop, properties;
		
		// Tabs, Returns
		text = text.replace(/\t/g, "").replace(/\n/g, "").replace(/\r/g, "");
		
		// Leading / Trailing Whitespace
		text = text.replace(/\s?(\{|\:|\})\s?/g, "$1");
		
		ruletext = text.split("}");
		
		forEach(ruletext, function (i, text) {
			if (text) {
				rule = [text, "}"].join("");
				
				match = (/(.*)\{(.*)\}/).exec(rule);
				
				if (match.length && match[2]) {
					selector = match[1];
					proptext = match[2].split(";");
					properties = [];
					
					forEach(proptext, function (i, x) {
						splitprop = x.split(":");
						
						if (splitprop.length && splitprop[1]) {
							properties.push({
								property : splitprop[0],
								value : splitprop[1]
							});
						}
					});
					
					rules.push({
						selector : selector,
						properties : properties
					});
				}
			}
		});
		
		return rules;
	}
	
	function findFlexBoxElements(rules) {
		var selector, properties,
		    property, value, shortProp,
		    leadingTrim = /^\s\s*/,
		    trailingTrim = /\s\s*$/,
		    selectorSplit = /(\s)?,(\s)?/, trim,
		    multiSelectors, updatedRule,
		    uniqueSelectors = {};
		
		trim = function (string) {
			return string.replace(leadingTrim, "").replace(trailingTrim, "");
		};
		
		forEach(rules, function (i, rule) {
			selector = rule.selector;
			properties = rule.properties;
			
			forEach(properties, function (i, prop) {
				// Trim any residue whitespace (it happens)
				prop.property = trim(prop.property);
				prop.value = trim(prop.value);
				
				property = prop.property;
				value = prop.value;
				shortProp = property.replace("box-", "");
				
				if (property === "display" && value === "box") {
					FLEX_BOXES.push(rule);
				} else {
					switch (shortProp) {
					case "flex" :
					case "ordinal-group" :
						// Multiple selectors?
						multiSelectors = selector.split(selectorSplit);

						forEach(multiSelectors, function (i, multi) {
							if (multi && (multi = trim(multi))) {
								
								if (!uniqueSelectors[multi]) {
									updatedRule = {};

									// Each selector gets its own call
									forEach(rule, function (key) {
										updatedRule[key] = rule[key];
									});
									
									updatedRule.selector = multi;
									
									// Easy access for later
									updatedRule[shortProp] = value;
									
									uniqueSelectors[multi] = updatedRule;
								} else {
									// Easy access for later
									uniqueSelectors[multi][shortProp] = value;
								}
								
							}
						});
						break;
					}
				}
			});
		});
		
		forEach(uniqueSelectors, function (key, node) {
			POSSIBLE_FLEX_CHILDREN.push(node);
		});
		
		return {
			boxes : FLEX_BOXES,
			children : POSSIBLE_FLEX_CHILDREN
		};
	}
	
	function matchFlexChildren(parent, lib, possibleChildren) {
		var caller, unique, matches = [];
		
		forEach(possibleChildren, function (i, child) {
			caller = lib(child.selector);
			
			if (caller[0]) {
				forEach(caller, function (i, call) {
					if (call.parentNode === parent) {
						unique = {};
						
						forEach(child, function (key) {
							unique[key] = child[key];
						});
						
						unique.match = call;
						matches.push(unique);
					}
				});
			}
		});
		
		return matches;
	}
	
	function getParams(params) {
		forEach(params, function (key, value) {
			params[key] = value || DEFAULTS[key];
		});
		
		return params;
	}
	
	function buildFlexieCall(flexers) {
		var selector, properties,
		    orient, align, direction, pack,
		    lib, caller, children,
		    box, params;
		
		// No boxflex? No dice.
		if (!flexers) {
			return;
		}
		
		forEach(flexers.boxes, function (i, flex) {
			selector = flex.selector;
			properties = flex.properties;
			
			orient = align = direction = pack = NULL;
			
			forEach(properties, function (i, prop) {
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
			});
			
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
				selector : selector,
				children : children,
				orient : orient,
				align : align,
				direction: direction,
				pack : pack
			});
			
			// Constructor
			box = new FLX.box(params);
		});
	}
	
	function calcPx(element, props, dir) {
		var dim = dir.replace(dir.charAt(0), dir.charAt(0).toUpperCase()),
		    value = element["offset" + dim] || 0;
		
		if (value) {
			forEach(props, function (i, prop) {
				prop = parseFloat(element.currentStyle[prop]);
				if (!isNaN(prop)) {
					value -= prop;
				}
			});
		}
		
		return value;
	}
	
	function getTrueValue(element, name) {
		var left, rsLeft,
		    ret = element.currentStyle && element.currentStyle[name],
		    style = element.style;

		if (!PIXEL.test(ret) && NUMBER.test(ret)) {

			// Remember the original values
			left = style.left;
			rsLeft = element.runtimeStyle.left;

			// Put in the new values to get a computed value out
			element.runtimeStyle.left = element.currentStyle.left;
			style.left = ret || 0;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left || 0;
			element.runtimeStyle.left = rsLeft;
		}

		return ret;
	}
	
	function unAuto(element, prop, name) {
		var props;
		
		switch (name) {
		case "width" :
			props = [PADDING_LEFT, PADDING_RIGHT, BORDER_LEFT, BORDER_RIGHT];
			prop = calcPx(element, props, name);
			break;

		case "height" :
			props = [PADDING_TOP, PADDING_BOTTOM, BORDER_TOP, BORDER_BOTTOM];
			prop = calcPx(element, props, name);
			break;

		default :
			prop = getTrueValue(element, name);
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
			prop = unAuto(element, prop, name);
		} else {
			prop = getTrueValue(element, name);
		}
		
		return prop;
	}
	
	function getComputedStyle(element, property, returnAsInt) {
		var value;
		
		if (win.getComputedStyle) {
			value = win.getComputedStyle(element, NULL)[property];
		} else {
			if (SIZES.test(property)) {
				value = getPixelValue(element, element.currentStyle[property], property);
			} else {
				value = element.currentStyle[property];
			}
		}
		
		if (returnAsInt) {
			value = parseInt(value, 10);
			
			if (isNaN(value)) {
				value = 0;
			}
		}
		
		return value;
	}
	
	function clientWidth(element) {
		return element.innerWidth || element.clientWidth;
	}
	
	function clientHeight(element) {
		return element.innerHeight || element.clientHeight;
	}
	
	function appendProperty(target, prop, value) {
		var cssText = [];

		forEach(PREFIXES, function (i, prefix) {
			cssText.push(prop + ":" + prefix + value);
		});

		target.style.cssText = cssText.join(";");
		return target;
	}
	
	function appendPixelValue(target, prop, value) {
		var targets = target[0] ? target : [target];
		
		forEach(targets, function (i, target) {
			if (target && target.style) {
				target.style[prop] = (value ? (value + "px") : "");
			}
		});
	}
	
	function updateInstances() {
		forEach(FLEX_INSTANCES, function (i, instance) {
			instance.construct.updateModel(instance.params);
		});
	}
	
	function attachResizeListener(construct, params) {
		FLEX_INSTANCES.push({
			construct : construct,
			params : params
		});
		
		if (!RESIZE_LISTENER) {
			var storedWidth, storedHeight,
			    currentWidth, currentHeight,
			    docBody = doc.body,
			    docEl = doc.documentElement,
			    innerWidth = "innerWidth", innerHeight = "innerHeight",
			    clientWidth = "clientWidth", clientHeight = "clientHeight";
			
			addEvent("resize", function () {
				currentWidth = win[innerWidth] || docEl[innerWidth] || docEl[clientWidth] || docBody[clientWidth];
				currentHeight = win[innerHeight] || docEl[innerHeight] || docEl[clientHeight] || docBody[clientHeight];
				
				if (storedWidth !== currentWidth || storedHeight !== currentHeight) {
					updateInstances();
					
					storedWidth = currentWidth;
					storedHeight = currentHeight;
				}
			});
			
			RESIZE_LISTENER = TRUE;
		}
	}

	function flexBoxSupported() {
		var dummy = doc.createElement("div");
		appendProperty(dummy, "display", "box");
		return ((dummy.style.display).indexOf("box") !== -1) ? TRUE : FALSE;
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
				var selectorGroups, selector;
				
				selectorGroups = selectorText.split(",");
				
				forEach(selectorGroups, function (i, group) {
					selector = normalizeSelectorWhitespace(group) + SPACE_STRING;
				});
				
				return prefix + selectorGroups.join(",");
			});
		}
		
		// --[ getXHRObject() ]-------------------------------------------------
		function getXHRObject() {
			if (win.XMLHttpRequest) {
				return new win.XMLHttpRequest();
			}
			
			try	{ 
				return new win.ActiveXObject('Microsoft.XMLHTTP');
			} catch (e) { 
				return NULL;
			}
		}
		
		// --[ loadStyleSheet() ]-----------------------------------------------
		function loadStyleSheet(url) {
			var xhr = getXHRObject();
			
			xhr.open("GET", url, FALSE);
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
				return getProtocolAndHost(contextUrl) === getProtocolAndHost(url) ? url : NULL;
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
			var url, stylesheet, i, j,
			    baseTags = doc.getElementsByTagName("BASE"),
			    baseUrl = (baseTags.length > 0) ? baseTags[0].href : doc.location.href,
			    cssText, tree, flexers;
			
			for (i = 0, j = doc.styleSheets.length; i < j; i++) {
				stylesheet = doc.styleSheets[i];
				if (stylesheet && stylesheet.href !== "") {
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
		properties : {
			boxModel : function (target, children, params) {
				var selector, stylesheet, generatedRules;

				target.style.display = "block";

				// We'll be using floats, so the easiest way to retain layout
				// is the dreaded clear fix:
				if (!params.cleared) {
					selector = params.selector;
					stylesheet = doc.styleSheets;
					stylesheet = stylesheet[stylesheet.length - 1];
				
					generatedRules = [
						"content:' '",
						"display:block",
						"margin:0",
						"padding:0",
						"border:0",
						"height:0",
						"background:none",
						"clear:both",
						"font-size:0",
						"visibility:hidden"
					].join(";");
				
					if (stylesheet.addRule) {
						if (BROWSER.IE === 6) {
							stylesheet.addRule(selector, "zoom: 1;", 0);
						} else if (BROWSER.IE === 7) {
							stylesheet.addRule(selector, "display:inline-block;", 0);
						} else {
							stylesheet.addRule(selector + ":after", generatedRules, 0);
						}
					} else if (stylesheet.insertRule) {
						stylesheet.insertRule(selector + ":after{" + generatedRules + "}", 0);
					}

					params.cleared = TRUE;
				}
			},

			boxOrient : function (target, children, params) {
				var self = this,
				    wide, high,
				    combinedMargin;

				wide = {
					pos : "marginLeft",
					add : ["marginRight", PADDING_LEFT, PADDING_RIGHT, BORDER_LEFT, BORDER_RIGHT],
					dim : "width",
					out : "offsetWidth",
					func : clientWidth
				};

				high = {
					pos : "marginTop",
					add : ["marginBottom", PADDING_TOP, PADDING_BOTTOM, BORDER_TOP, BORDER_BOTTOM],
					dim : "height",
					out : "offsetHeight",
					func : clientHeight
				};

				forEach(children, function (i, kid) {
					kid.style.cssFloat = kid.style.styleFloat = "left";
					// kid.style[wide.dim] = getComputedStyle(kid, wide.dim, NULL);

					if (params.orient === "vertical") {
						// Margins collapse on a normal box
						// But not on flexbox
						// So we hack away...
						if (i !== 0 && i !== (children.length - 1)) {
							combinedMargin = getComputedStyle(kid, high.pos, TRUE) + getComputedStyle(kid, high.add[0], TRUE);

							kid.style[high.pos] = combinedMargin;
							kid.style[high.add[0]] = combinedMargin;
						}
						kid.style.cssFloat = kid.style.styleFloat = "";
					}
				});

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
				    targetDimension = self.anti.func(target),
				    kidDimension;

				switch (params.align) {
				case "stretch" :
					forEach(children, function (i, kid) {
						kidDimension = targetDimension;
						kidDimension -= getComputedStyle(kid, self.anti.pos, TRUE);

						kidDimension -= getComputedStyle(target, self.anti.add[1], TRUE);
						kidDimension -= getComputedStyle(target, self.anti.add[2], TRUE);

						forEach(self.anti.add, function (i, add) {
							kidDimension -= getComputedStyle(kid, add, TRUE);
						});

						kidDimension = Math.max(0, kidDimension);
						
						switch (kid.nodeName.toLowerCase()) {
						case "button" :
						case "input" :
						case "select" :
							break;

						default :
							kid.style[self.anti.dim] = (kidDimension) + "px";
							break;
						}
					});
					break;

				case "end" :
					forEach(children, function (i, kid) {
						kidDimension = targetDimension - kid[self.anti.out];
						kidDimension -= getComputedStyle(kid, self.anti.add[0], TRUE);

						kid.style[self.anti.pos] = kidDimension + "px";
					});
					break;

				case "center":
					forEach(children, function (i, kid) {
						kidDimension = (targetDimension - self.anti.func(kid)) / 2;
						kidDimension -= getComputedStyle(kid, self.anti.add[1], TRUE) / 2;
						kidDimension -= getComputedStyle(kid, self.anti.pos, TRUE) / 2;

						kid.style[self.anti.pos] = kidDimension + "px";
					});
					break;
				}
			},

			boxDirection : function (target, children, params) {
				var reversedChildren;

				if (params.direction === "reverse" && !params.reversed) {
					reversedChildren = children.reverse();

					forEach(reversedChildren, function (i, kid) {
						target.appendChild(kid);
					});

					params.reversed = TRUE;
				}
			},

			boxPack : function (target, children, params) {
				var self = this,
				    groupDimension = 0,
				    firstComputedMargin,
				    totalDimension, fractionedDimension,
				    currentDimension, remainder,
				    length = children.length - 1;

				forEach(children, function (i, kid) {
					groupDimension += kid[self.props.out];
					groupDimension += getComputedStyle(kid, self.props.pos, TRUE);

					if (params.orient === "horizontal") {
						groupDimension += getComputedStyle(kid, self.props.add[0], TRUE);
					}
				});

				if (params.orient === "vertical") {
					groupDimension += getComputedStyle(children[children.length - 1], self.props.add[0], TRUE) * ((params.pack === "end") ? 2 : 1);
				}

				firstComputedMargin = getComputedStyle(children[0], self.props.pos, TRUE);
				totalDimension = self.props.func(target) - groupDimension;

				if (params.orient === "horizontal" && BROWSER.IE === 6) {
					totalDimension /= 2;
				}

				switch (params.pack) {
				case "end" :
					appendPixelValue(children[0], self.props.pos, firstComputedMargin + totalDimension);
					break;

				case "center" :
					appendPixelValue(children[0], self.props.pos, firstComputedMargin + (totalDimension / 2));
					break;

				case "justify" :
					fractionedDimension = Math.ceil(totalDimension / length);
					remainder = (fractionedDimension * length) - totalDimension;

					children = children.reverse();

					forEach(children, function (i, kid) {
						currentDimension = fractionedDimension;

						if (remainder) {
							currentDimension--;
							remainder--;
						}

						kid.style[self.props.pos] = getComputedStyle(kid, self.props.pos, TRUE) + currentDimension + "px";
					});
					break;
				}
			},

			boxFlex : function (target, children, params) {
				var self = this,
				    createMatchMatrix,
				    testForRestrictiveProperties,
				    findTotalWhitespace,
				    distributeRatio,
				    matrix, restrict, whitespace, distro;

				if (!children.length) {
					return;
				}
				
				createMatchMatrix = function (matches) {
					var totalRatio = 0,
					    flexers = {}, keys = [];

					forEach(children, function (i, kid) {
						forEach(matches, function (i, x) {
							if (x.match === kid) {
								child = x.match;
								totalRatio += parseInt(x.flex, 10);

								flexers[x.flex] = flexers[x.flex] || [];
								flexers[x.flex].push(x);
							}
						});
					});

					forEach(flexers, function (key) {
						keys.push(key);
					});

					keys.sort(function (a, b) {
						return b - a;
					});

					return {
						keys : keys,
						flexers : flexers,
						total : totalRatio
					};
				};
				
				testForRestrictiveProperties = function (matrix) {
					var flexers = matrix.flexers,
					    keys = matrix.keys, max;
					
					forEach(keys, function (i, key) {
						forEach(flexers[key], function (i, x) {
							max = NULL;
							
							forEach(x.properties, function (i, rule) {
								if ((/^max\-([a-z]+)/).test(rule.property)) {
									max = parseFloat(rule.value);
								}
							});
							
							if (!max || x.match[self.props.out] > max) {
								appendPixelValue(x.match, self.props.pos, NULL);
							}
							
						});
					});
				};

				findTotalWhitespace = function (matrix) {
					var groupDimension = 0,
					    whitespace, ration;

					forEach(children, function (i, kid) {
						groupDimension += kid[self.props.out];
						groupDimension += getComputedStyle(kid, self.props.pos, TRUE);
						groupDimension += getComputedStyle(kid, self.props.add[0], TRUE);
					});

					whitespace = self.props.func(target) - groupDimension;
					ration = (whitespace / matrix.total);

					return {
						whitespace : whitespace,
						ration : ration
					};
				};

				distributeRatio = function (matrix, whitespace) {
					var flexers = matrix.flexers,
					    keys = matrix.keys,
					    ration = whitespace.ration,
					    w, flexWidths = {},
					    widthRation, trueDim, newWidth;

					forEach(keys, function (i, key) {
						widthRation = (ration * key);
						flexWidths[key] = widthRation;

						forEach(flexers[key], function (i, x) {
							w = flexWidths[key];

							if (x.match) {
								trueDim = getComputedStyle(x.match, self.props.dim, TRUE);
								newWidth = Math.max(0, (trueDim + w));
								x.match.style[self.props.dim] = newWidth + "px";
							}
						});
					});
				};

				matrix = createMatchMatrix(params.children);

				if (matrix.total) {
					restrict = testForRestrictiveProperties(matrix);
					whitespace = findTotalWhitespace(matrix);
				
					// Distribute the calculated ratios among the children
					distro = distributeRatio(matrix, whitespace);
				}
			},
			
			boxOrdinalGroup : function (target, children, params) {
				var createMatchMatrix,
				    organizeChildren,
				    matrix;

				if (!children.length) {
					return;
				}
				
				createMatchMatrix = function (matches) {
					var ordinals = {}, keys = [],
					    ordinal, order = "ordinal-group";

					forEach(children, function (i, kid) {
						forEach(matches, function (i, x) {
							ordinal = x[order];
							
							if (x.match === kid && ordinal) {
								ordinals[ordinal] = ordinals[ordinal] || [];
								ordinals[ordinal].push(x);
							}
						});
					});

					forEach(ordinals, function (key) {
						keys.push(key);
					});

					keys.sort(function (a, b) {
						return b - a;
					});

					return {
						keys : keys,
						ordinals : ordinals
					};
				};
				
				organizeChildren = function (matrix) {
					var keys = matrix.keys,
					    ordinals = matrix.ordinals;
					
					forEach(keys, function (i, key) {
						forEach(ordinals[key].reverse(), function (i, x) {
							target.insertBefore(x.match, target.firstChild);
						});
					});
				};

				matrix = createMatchMatrix(params.children);

				if (matrix.keys.length) {
					organizeChildren(matrix);
				}
			}
		},

		setup : function (target, children, params) {
			var self = this;
			
			forEach(self.properties, function (key, func) {
				func.call(self, target, children, params);
			});
		},

		trackDOM : function (params) {
			attachResizeListener(this, params);
		},

		updateModel : function (params) {
			var target = params.target,
			    children = params.nodes;

			// Null properties
			forEach(children, function (i, kid) {
				kid.style.cssText = "";
			});

			this.setup(target, children, params);
		},

		renderModel : function (params) {
			var self = this,
			    target = params.target, i, j,
			    nodes = target.childNodes, node,
			    children = [];
			
			// Sanity check.
			if (!target.length && !nodes) {
				return;
			}
			
			for (i = 0, j = nodes.length; i < j; i++) {
				node = nodes[i];
				
				if (node) {
					switch (node.nodeName.toLowerCase()) {
					case "script" :
					case "style" :
					case "link" :
						break;

					default :
						if (node.nodeType === 1) {
							children.push(node);
						} else {
							target.removeChild(node);
							i--;
						}
						break;
					}
				}
			}
			
			params.nodes = children;
			
			// Setup properties
			self.updateModel(params);
			
			// Resize / DOM Polling Events
			// Delay for an instant because IE6 is insane.
			win.setTimeout(function() {
				self.trackDOM(params);
			}, 0);
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

// Turn off dot notation warning for GCC
/*jslint sub: true */
window["Flexie"] = Flexie;
Flexie["box"] = Flexie.box;
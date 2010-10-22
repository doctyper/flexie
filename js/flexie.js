/*
File: flexie.js

About: Version
	0.1 pre

Project: Flexie

Description:
	Legacy support for the CSS3 Flexible Box Model

*/

/*
Class: Flexie
	Scoped to the Flexie Global Namespace
*/
var Flexie = window.Flexie || (function() {
	var $self = this;
	
	$self.vars = {
		prefixes : " -o- -moz- -ms- -webkit- -khtml- ".split(" ")
	};
	
	/*
	selectivizr v1.0.0 - (c) Keith Clark, freely distributable under the terms 
	of the MIT license.

	selectivizr.com
	*/
	$self.selectivizr = {
		RE_COMMENT : /(\/\*[^*]*\*+([^\/][^*]*\*+)*\/)\s*/g,
		
		RE_SELECTOR_GROUP : /(^|})\s*([^\{]*?[\[:][^{]+)/g,
		
		// Whitespace normalization regexp's
		RE_TIDY_TRAILING_WHITESPACE : /([(\[+~])\s+/g,
		RE_TIDY_LEADING_WHITESPACE : /\s+([)\]+~])/g,
		RE_TIDY_CONSECUTIVE_WHITESPACE : /\s+/g,
		RE_TIDY_TRIM_WHITESPACE : /^\s*((?:[\S\s]*\S)?)\s*$/,
		
		// String constants
		EMPTY_STRING : "",
		SPACE_STRING : " ",
		PLACEHOLDER_STRING : "$1",

		// --[ patchStyleSheet() ]----------------------------------------------
		// Scans the passed cssText for selectors that require emulation and
		// creates one or more patches for each matched selector.
		patchStyleSheet : function(cssText) {
			var _self = this;
			
			return cssText.replace(_self.RE_SELECTOR_GROUP, function(m, prefix, selectorText) {	
				var selectorGroups = selectorText.split(",");
				for (var c = 0, cs = selectorGroups.length; c < cs; c++) {
					var selector = _self.normalizeSelectorWhitespace(selectorGroups[c]) + _self.SPACE_STRING;
					var patches = [];
				}
				return prefix + selectorGroups.join(",");
			});
		},

		// --[ trim() ]---------------------------------------------------------
		// removes leading, trailing whitespace from a string
		trim : function(text) {
			return text.replace(this.RE_TIDY_TRIM_WHITESPACE, this.PLACEHOLDER_STRING);
		},

		// --[ normalizeWhitespace() ]------------------------------------------
		// removes leading, trailing and consecutive whitespace from a string
		normalizeWhitespace : function(text) {
			return this.trim(text).replace(this.RE_TIDY_CONSECUTIVE_WHITESPACE, this.SPACE_STRING);
		},

		// --[ normalizeSelectorWhitespace() ]----------------------------------
		// tidys whitespace around selector brackets and combinators
		normalizeSelectorWhitespace : function(selectorText) {
			return this.normalizeWhitespace(selectorText.replace(this.RE_TIDY_TRAILING_WHITESPACE, this.PLACEHOLDER_STRING).replace(this.RE_TIDY_LEADING_WHITESPACE, this.PLACEHOLDER_STRING));
		},
		
		// --[ determineSelectorMethod() ]--------------------------------------
		// walks through the selectorEngines object testing for an suitable
		// selector engine.
		determineSelectorMethod : function() {
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
			};
			
			var win = window, method;
			
			for (var engine in selectorEngines) {
				if (win[engine] && (method = eval(selectorEngines[engine].replace("*",engine)))) {
					return method;
				}
			}
			return false;
		},
		
		// --[ getXHRObject() ]-------------------------------------------------
		getXHRObject : function() {
			if (window.XMLHttpRequest) {
				return new XMLHttpRequest;
			}
			
			try	{ 
				return new ActiveXObject('Microsoft.XMLHTTP') ;
			} catch(e) { 
				return null;
			}
		},
		
		// --[ loadStyleSheet() ]-----------------------------------------------
		loadStyleSheet : function(url) {
			var xhr = this.getXHRObject();
			
			xhr.open("GET", url, false);
			xhr.send();
			return (xhr.status === 200) ? xhr.responseText : "";	
		},
		
		// --[ resolveUrl() ]---------------------------------------------------
		// Converts a URL fragment to a fully qualified URL using the specified
		// context URL. Returns null if same-origin policy is broken
		resolveUrl : function(url, contextUrl) {
			function getProtocolAndHost(url) {
				return url.substring(0, url.indexOf("/", 8));
			}

			// absolute path
			if (/^https?:\/\//i.test(url)) {
				return getProtocolAndHost(contextUrl) == getProtocolAndHost(url) ? url : null;
			}

			// root-relative path
			if (url.charAt(0) == "/")	{
				return getProtocolAndHost(contextUrl) + url;
			}

			// relative path
			var contextUrlPath = contextUrl.split("?")[0]; // ignore query string in the contextUrl
			if (url.charAt(0) != "?" && contextUrlPath.charAt(contextUrlPath.length-1) != "/") {
				contextUrlPath = contextUrlPath.substring(0, contextUrlPath.lastIndexOf("/") + 1);
			}

			return contextUrlPath + url;
		},
		
		// --[ parseStyleSheet() ]----------------------------------------------
		// Downloads the stylesheet specified by the URL, removes it's comments
		// and recursivly replaces @import rules with their contents, ultimately
		// returning the full cssText.
		parseStyleSheet : function(url) {
			var _self = this;
			
			if (url) {
				var cssText = this.loadStyleSheet(url);
				return cssText.replace(_self.RE_COMMENT, _self.EMPTY_STRING).replace(_self.RE_IMPORT, function( match, quoteChar, importUrl ) { 
					return _self.parseStyleSheet(_self.resolveUrl(importUrl, url));
				});
			}
			return _self.EMPTY_STRING;
		},
		
		// --[ init() ]---------------------------------------------------------
		init : function() {
			// honour the <base> tag
			var doc = document, url, stylesheet, c,
			    baseTags = doc.getElementsByTagName("BASE"),
			    baseUrl = (baseTags.length > 0) ? baseTags[0].href : doc.location.href;
			
			for (c = 0; c < doc.styleSheets.length; c++) {
				stylesheet = doc.styleSheets[c];
				
				if (stylesheet.href != "") {
					url = this.resolveUrl(stylesheet.href, baseUrl);
					
					if (url) {
						var cssText = this.patchStyleSheet(this.parseStyleSheet(url)),
						    tree = this.buildSelectorTree(cssText),
						    flexers = this.findFlexBoxElements(tree);
					}
				}
			}
			
			this.buildFlexieCall(flexers);
		},
		
		buildSelectorTree : function(text) {
			var rules = [], ruletext, i, j, k, l, rule,
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
		},
		
		findFlexBoxElements : function(rules) {
			this.flexers = this.flexers || [];
			
			var flexers = this.flexers, i, j, k, l,
			    rule, selector, properties, prop,
			    property, value;
			
			for (i = 0, j = rules.length; i < j; i++) {
				rule = rules[i];
				selector = rule.selector;
				properties = rule.properties;
				
				for (k = 0, l = properties.length; k < l; k++) {
					prop = properties[k];
					property = prop.property;
					value = prop.value;
					
					if (property == "display" && value == "box") {
						flexers.push(rule);
					}
				}
			}
			
			return flexers;
		},
		
		buildFlexieCall : function(flexers) {
			var i, j, k, l, flex, selector, properties, prop,
			    orient, align, direction, pack, lib, caller;
			
			for (i = 0, j = flexers.length; i < j; i++) {
				flex = flexers[i];
				
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
				
				if (orient || align || direction || pack) {
					lib = this.determineSelectorMethod();
					caller = lib(flex.selector);
					
					new $self.box({
						"target" : caller[0] || caller,
						"box-orient" : orient,
						"box-align" : align,
						"box-direction" : direction,
						"box-pack" : pack
					});
				}
			}
		}
	};
	
	$self.utils = {
		appendProperty : function(target, prop, value) {
			var prefixes = $self.vars.prefixes,
			    cssText = [];
			
			for (var i = 0, j = prefixes.length; i < j; i++) {
				cssText.push(prop + ":" + prefixes[i] + value);
			}
			
			target.style.cssText = cssText.join(";");
			return target;
		},
		
		applyBoxModel : function(target, children) {
			target.style.overflow = "hidden";
		},
		
		applyBoxOrient : function(target, children, orient) {
			switch (orient) {
				case "horizontal" :
				case "inline-axis" :
				for (var i = 0, j = children.length; i < j; i++) {
					var kid = children[i];
					kid.style.cssText = "float: left";
				}
				break;
				
				case "vertical" :
				case "block-axis":
				break;
			}
		},
		
		applyBoxAlign : function(target, children, align) {
			var groupHeight = 0;
			
			for (var i = 0, j = children.length; i < j; i++) {
				groupHeight += children[i].innerHeight || children[i].clientHeight;
			}
			
			// target.style.lineHeight = target.offsetHeight + "px";
			
			switch (align) {
				case "stretch" :
				// target.style.verticalAlign = "top";
				// target.style.lineHeight = 0;
				
				for (var i = 0, j = children.length; i < j; i++) {
					var kid = children[i];
					kid.style.height = target.offsetHeight + "px";
				}
				break;
				
				case "start" :
				// target.style.lineHeight = 0;
				// target.style.verticalAlign = "top";
				break;
				
				case "end" :
				// target.style.verticalAlign = "bottom";
				children[0].style.marginTop = ((target.innerHeight || target.clientHeight) - groupHeight) + "px";
				break;
				
				case "center":
				// target.style.verticalAlign = "middle";
				break;
				
				case "baseline":
				// target.style.verticalAlign = "baseline";
				break;
			}
		},
		
		applyBoxDirection : function(target, children, direction) {
			switch (direction) {
				case "normal" :
				break;
				
				case "reverse" :
				for (var i = children.length - 1; i >= 0; i--) {
					children[i].style.cssText = "float: right";
				}
				break;
			}
		},
		
		applyBoxPack : function(target, children, pack) {
			var groupWidth = 0;
			
			for (var i = 0, j = children.length; i < j; i++) {
				groupWidth += children[i].innerWidth || children[i].clientWidth;
			}
			
			// - start (default)
			// - end
			// - center
			// - justify
			switch (pack) {
				case "start" :
				target.style.textAlign = "left";
				break;
				
				case "end" :
				// target.style.textAlign = "right";
				children[0].style.marginLeft = ((target.innerWidth || target.clientWidth) - groupWidth) + "px";
				break;
				
				case "center" :
				target.style.textAlign = "center";
				break;
				
				case "justify" :
				target.style.textAlign = "justify";
				break;
			}
		},
		
		flexBoxSupported : function() {
			var dummy = document.createElement("div");
			this.appendProperty(dummy, "display", "box");
			return ((dummy.style.display).indexOf("box") !== -1) ? true : false;
		},
		
		boxModelRenderer : function(params) {
			var target = params.target,
			    nodes = target.childNodes,
			    children = [],
			    orient = params["box-orient"] || "horizontal",
			    align = params["box-align"] || "stretch",
			    direction = params["box-direction"] || "normal",
			    pack = params["box-pack"] || "start";
			
			var node = nodes[0];
			for (var i = 0, j = nodes.length; i < j; i++) {
				if (nodes[i]) {
					if (nodes[i].nodeType === 1) {
						children.push(nodes[i]);
					} else {
						target.removeChild(nodes[i]);
						i--;
					}
				}
			}
			
			this.applyBoxModel(target, children);
			this.applyBoxOrient(target, children, orient);
			this.applyBoxAlign(target, children, align);
			this.applyBoxDirection(target, children, direction);
			this.applyBoxPack(target, children, pack);
		}
	};
	
	$self.box = function(params) {
		var support = $self.utils.flexBoxSupported();
		
		if (!support) {
			$self.utils.boxModelRenderer(params);
		}
	};
	
	$self.init = function() {
		$self.selectivizr.init();
	};
	
	return $self;
})();

Flexie.init();
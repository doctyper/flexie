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
	
	$self.utils = {
		appendProperty : function(target, prop, value) {
			var prefixes = $self.vars.prefixes;
			
			for (var i = 0, j = prefixes.length; i < j; i++) {
				target.style[prop] = prefixes[i] + value;
			}
			
			target.style[prop] = value;
			return target;
		},
		
		flexBoxSupported : function() {
			var dummy = document.createElement("div"),
			    display = "box";
			
			this.appendProperty(dummy, "display", "box");
			
			document.body.appendChild(dummy);
			return dummy.style.display ? true : false;
		}
	};
	
	$self.box = function(params) {
		// console.log(params);
		// console.log(window.getComputedStyle(params.target, null).getPropertyValue("display"));
		var support = $self.utils.flexBoxSupported();
		
		if (!support) {
			console.log(support);
		}
	};
	
	return $self;
})();

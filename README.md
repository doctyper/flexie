Cross-browser support for the [CSS3 Flexible Box Model](http://www.w3.org/TR/css3-flexbox/). Check out [The Playground](http://flexiejs.com/playground/) to see it in action.
# Flexie v1.0 [![](http://stillmaintained.com/doctyper/flexie.png)](http://stillmaintained.com/doctyper/flexie)

## Browser Support
* IE 6-9
* Opera 10.0+

The Flexible Box Model is [supported natively](http://www.caniuse.com/#feat=flexbox) by these browsers:

* Firefox 3.0+
* Safari 3.2+
* Chrome 5.0+

In addition, Flexie attempts to normailze browser inconsistencies with the flexible box model.

### Currently Supported Properties
* box-orient
* box-align
* box-direction
* box-pack
* box-flex
* box-flex-group
* box-ordinal-group

## Why?
I *really* wanted to use the CSS3 Flexible Box Model.

## How?
It works like [Selectivizr](http://selectivizr.com). In fact, it uses Selectivizr's engine to traverse your style sheets and looks for `display: box` elements. After that, it looks for any of the currently supported properties.

Note: Flexie looks for non-vendor-prefixed properties. For example, it will ignore `-moz-box-pack`, but not `box-pack`. For best results, make sure to use a non-vendor-prefixed property _in addition to_ your prefixed properties. But you were already doing that to future-proof your code, weren't you?

No setup on your end, just stick Flexie in your markup after your [selector engine of choice](http://selectivizr.com/#things).

## Requirements
See the [things you need to know](http://selectivizr.com/#things)

## Caveats
* For older browsers (IE < 8), please remember that some advanced selectors (child, adjacent, pseudo-selectors) will fail. Flexie does not attempt to bridge this gap, so if you must support legacy browsers, class names and ID selectors are your best bets.

* As of FF 4.0 / Chrome 7 / Safari 5, Gecko and Webkit differ slightly in their flexbox implementations. <strike>Of note is their default values. Webkit will default to `box-align: start`, while Gecko defaults to the spec-defined `box-align: stretch`. Make sure your flexbox CSS works on both these browsers before adding Flexie.</strike>
	* As of version 0.7, Flexie normalizes the `box-align` property across Webkit browsers.
	* As of version 0.8, Flexie normalizes the `box-pack` property in Gecko.

* Be careful of pseudo-selectors (i.e., `:nth-child`, `:first-child`). While native flexbox does not modify the DOM, Flexie must. Thus, your CSS properties might not apply as intended. For example, if you use a combination of `box-direction: reverse` and a `:first-child` selector, that selector will target the wrong element. And if you followed all of that, congratulations.

* There may be cases where the floats used to mimic the flexbox layout drop in Internet Explorer browsers. If possible, you can try the [overflow fix](http://css-tricks.com/all-about-floats/) to snap these into place _(Flexie assumes it cannot use this as a workaround due to the impact this may have in your layouts)_.

* As of YUI 2.8.2r1, YUI's selector engine does not recognize dashed attributes (i.e. [data-name="foo"]). Flexie uses several [data- attributes](http://ejohn.org/blog/html-5-data-attributes/) as element flags. A bug report [has been filed](http://yuilibrary.com/projects/yui2/ticket/2529254) about this issue, but in the meantime YUI remains incompatible with Flexie.

## Asynchronous API
You can run Flexie asynchronously in case you cannot purely on style sheets. All parameters are optional, unless otherwise stated:

### Creating a new Flexie Object
	var box = new Flexie.box({
		target : document.getElementById("foo"),
		orient : "horizontal",
		align : "stretch",
		direction : "normal",
		pack : "start",
		flexMatrix : [1, 1, 1, 1],
		ordinalMatrix : [0, 0, 0, 0]
	});

*	**target**
	(required) The flexbox parent element. This must be a DOM node.
*	**orient**
	(optional) Possible values: `horizontal`, `vertical`
*	**align**
	(optional) Possible values: `stretch`, `start`, `end`, `center`
*	**direction**
	(optional) Possible values: `normal`, `reverse`
*	**pack**
	(optional) Possible values: `start`, `end`, `center`, `justify`
*	**flexMatrix**
	(optional) An array of values to apply to the parent's children. e.g.:
		flexMatrix : [1, 0, 0] // Three child nodes contained, the parent's first child has a box-flex value of 1
		flexMatrix : [1, 0, 1] // Three child nodes contained, the parent's first and last child have a box-flex value of 1
		flexMatrix : [1, 1, 1] // Three child nodes contained, all children have a box-flex value of 1
*	**ordinalMatrix**
	(optional) An array of values to apply to the parent's children. See `flexMatrix` for an example.

### Flexie.updateInstance(target, params)
Used to redraw currently active Flexie objects (i.e., after dynamically updating a flexbox element). All parameters optional.

_Note: Calling this method without parameters will update all instances._

*	**target**
	(optional) The flexbox element to update.
*	**params**
	(optional) An object of flexbox properties to update. See Creating a new Flexie Object for accepted parameters.

### Flexie.getInstance(target)
Returns the target instance

*	**target**
	(optional) The flexbox instance to retrieve.
	
### Flexie.destroyInstance(target)
Destroys the target instance.

_Note: Calling this method without parameters will destroy all instances._

*	**target**
	(optional) The flexbox instance to retrieve.
	
### Flexie.flexboxSupported
An exposed object detailing the level of flexbox support. Returns false for no support.

## Acknowledgements
Selectivizr, for their fantastic CSS parsing engine.

## Copyright and Software License
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

## Contact
* rich {at} doctyper {dot} com
* [@doctyper](http://twitter.com/doctyper) on Twitter
* <http://doctyper.com>

## Links
* Flexie on GitHub: <http://github.com/doctyper/flexie>

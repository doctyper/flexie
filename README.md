## Flexie
Legacy support for the [CSS3 Flexible Box Model](http://www.w3.org/TR/css3-flexbox/).

### Version
0.9

### See it in Action?
[Flexie Playground](http://doctyper.github.com/flexie/playground/)

### Ready For Prime Time?
...Possibly.

### Browser Support
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

#### Not There Yet
* box-lines (as far as I can tell, no browser currently supports this property)


### Why?
I *really* wanted to use the CSS3 Flexible Box Model.

### How?
It works like [Selectivizr](http://selectivizr.com). In fact, it uses Selectivizr's engine to traverse your style sheets and looks for `display: box` elements. After that, it looks for any of the currently supported properties.

Note: Flexie looks for non-namespaced properties. For example, it will ignore `-moz-box-pack`, but not `box-pack`. For best results, make sure to use a non-namespaced property. But you were already doing that to future-proof your code, weren't you?

No setup on your end, just stick Flexie in your markup after your [selector engine of choice](http://selectivizr.com/#things).

### Requirements
See the [Things you need to know](http://selectivizr.com/#things)

### Caveats
As of FF 4.0 / Chrome 7 / Safari 5, Gecko and Webkit differ slightly in their flexbox implementations. <strike>Of note is their default values. Webkit will default to `box-align: start`, while Gecko defaults to the spec-defined `box-align: stretch`. Make sure your flexbox CSS works on both these browsers before adding Flexie.</strike>

* As of version 0.7, Flexie normalizes the `box-align` property across Webkit browsers.
* As of version 0.8, Flexie normalizes the `box-pack` property in Gecko.

Be careful of pseudo-selectors (i.e., `:nth-child`, `:first-child`). While native flexbox does not modify the DOM, Flexie must. Thus, your CSS properties might not apply as intended. For example, if you use a combination of `box-direction: reverse` and a `:first-child` selector, that selector will target the wrong element. And if you followed all of that, congratulations.

### Acknowledgements
Selectivizr, for their fantastic CSS parsing engine.

### Copyright and Software License
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

### Contact
* rich {at} doctyper {dot} com
* [@doctyper](http://twitter.com/doctyper) on Twitter
* <http://doctyper.com>

### Links
* Flexie on GitHub: <http://github.com/doctyper/flexie>

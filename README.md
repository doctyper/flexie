Flexie
===============

Legacy support for the [CSS3 Flexible Box Model](http://www.w3.org/TR/css3-flexbox/).

Ready For Prime Time?
=====================

Nope.

Browser Support
===============
* IE 9
* IE 8
* IE 7
* IE 6
* Opera 10.63

The Flexible Box Model is [supported natively](http://www.caniuse.com/#feat=flexbox) by these browsers:

* Firefox 3.0+
* Safari 3.2+
* Chrome 5.0+


Currently Supported Properties
==============================
* box-orient
* box-align
* box-direction
* box-pack
* box-flex
* box-ordinal-group


Not There Yet
=============
* box-flex-group
* box-lines


Why?
=======

I *really* wanted to use the CSS3 Flexible Box Model.


How?
=======

It works like [Selectivizr](http://selectivizr.com). In fact, it uses Selectivizr's engine to traverse your style sheets and looks for `display: box` elements. After that, it looks for any of the currently supported properties.

Note: Flexie looks for non-namespaced properties. For example, it will ignore `-moz-box-pack`, but not `box-pack`. For best results, make sure to use a non-namespaced property. But you were already doing that to future-proof your code, weren't you?

No setup on your end, just stick Flexie in your markup after your [selector engine of choice](http://selectivizr.com/#things).

Requirements
============

See Selectivizr's [Things you need to know](http://selectivizr.com/#things)


Acknowledgements
================

[Selectivizr](http://selectivizr.com), for their fantastic CSS parsing engine.


Copyright and Software License
==============================

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


Contact
=======

* rich {at} doctyper {dot} com
* [@doctyper](http://twitter.com/doctyper) on Twitter
* <http://doctyper.com>


Links
=====

* Flexie on GitHub: <http://github.com/doctyper/flexie>

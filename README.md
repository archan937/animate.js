# Animate.js

Add slick animations to your web pages and page transitions.

### Installation

Setting up <code>animate.js</code> is only a matter of adding a simple script include tag:

    <script src="http://archan937.github.io/animate.js/animate.js"></script>

That's it!

### Configuration

To configure Animate.js, all you have to do is put the configuration in the query string:

  * <code>animation</code> - The animation to use when transitioning between pages (see the [list](https://github.com/archan937/animate.js/blob/master/src/animate.js#L492))
  * <code>next-slide</code> - This enables [presentation mode](http://archan937.github.io/animate.js/6.html) and specifies which URL to open when going to the next slide (URI encoded when necessary)
  * <code>selector</code> - The CSS selector used for binding the click event to start animating (default: <code>a</code>)

So for example:

    <script src="http://archan937.github.io/animate.js/animate.js?next-slide=.%2F7.html&animation=openSesame"></script>

Nice, right? :)

### Credits

Thanks to the following resources, writing Animate.js was possible:

  * <code>Codrops Demo</code> - Animations are based on the [Codrops Page Transitions demo](http://tympanus.net/Development/PageTransitions)
  * <code>html2canvas</code> - Animate.js uses [html2canvas](https://github.com/niklasvh/html2canvas) for taking snapshots of the current page

### Contact me

For support, remarks and requests, please mail me at [pm_engel@icloud.com](mailto:pm_engel@icloud.com).

### TODO

* Complement Keynote animations
* Complete naming available animations
* Accept a self defined animation (by passing a two-length array?)
* Animate form submits

### License

Copyright (c) 2016 Paul Engel, released under the MIT license

[http://gettopup.com](http://gettopup.com) - [http://github.com/archan937](http://github.com/archan937) - [http://twitter.com/archan937](http://twitter.com/archan937) - [pm_engel@icloud.com](mailto:pm_engel@icloud.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

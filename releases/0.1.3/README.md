# Animate.js

Add slick animations to your web pages and page transitions.

### Installation

Setting up <code>animate.js</code> is only a matter of adding a simple script include tag:
```html
    <script src="https://archan937.github.io/animate.js/animate.min.js"></script>
```
That's it!

### Configuration

To configure Animate.js, all you have to do is put the configuration in the `query string` of the animate.js URL:

  * <code>controls</code> - Control the animation sequence with the common presentation controls
  * <code>timing</code> - The timing used to automatically run the animation sequence in seconds separated by `+` (e.g. `timing=1.5+3.5+3.75+4.35+6+7`)
  * <code>animation</code> - The animation to use when [transitioning between pages](https://github.com/archan937/animate.js/blob/master/src/js/animate/pages.js#L257)
  * <code>next-slide</code> - This enables [presentation mode](http://archan937.github.io/animate.js/5.html) and specifies which URL to open when going to the next slide (URI encoded when necessary)
  * <code>selector</code> - The CSS selector used for binding the click event to start animating (default: <code>a</code>)

For instance:
```html
    <script src="http://archan937.github.io/animate.js/animate.min.js?next-slide=.%2F7.html&animation=openSesame"></script>
```
Nice, huh? :)

For now, please refer to [the source code](https://github.com/archan937/animate.js/blob/master/src/js/animate/pages.js#L257) for a list of all the available page transition animations. Though the list needs to be cleaned up.

### Animating page elements

To animate page elements, you need to add a data attribute `data-am-n` to them of which `n` is the step within the animation sequence.

A few examples:

- <code>data-am-0</code> - Animate page elements on page load
- <code>data-am-1</code> - Animate page elements when `Animate.next()` has been invoked (either by animation timing, page controls or programmatically)

The value of the data attribute is either of the animation classes of [animate.css](https://daneden.github.io/animate.css).

Finally, you can adjust the duration of the animation by adding a class in the format of `\d+(\.\d+)?m?s` (e.g. `1s` or `100ms`)

So for example:
```html
    <h1 data-am-0="bounceInDown" data-am-3="flipOutX">Hi there! Meet animate.js!</h1>
    <h2 data-am-1="bounceInLeft 0.5s" data-am-2="flipOutY">Add slick animations to your web pages and page transitions</h2>
    <h1 data-am-4="rollIn" data-am-5="rollOut">Using animate.js is really easy!</h1>
```
### Credits

Thanks to the following resources, writing Animate.js was possible:

  * <code>animate.css</code> - Animate.js used [animate.css](https://daneden.github.io/animate.css) to animate page elements
  * <code>Codrops Demo</code> - Page transitions are based on the [Codrops Page Transitions demo](http://tympanus.net/Development/PageTransitions)
  * <code>html2canvas</code> - Animate.js uses [html2canvas](https://github.com/niklasvh/html2canvas) for taking snapshots of the current page

### Contact me

For support, remarks and requests, please mail me at [pm_engel@icloud.com](mailto:pm_engel@icloud.com).

### TODO

* Complement Keynote animations
* Accept a self defined animation (by passing a two-length array?)
* Animate form submits

### License

Copyright (c) 2017 Paul Engel, released under the MIT license

[http://gettopup.com](http://gettopup.com) - [http://github.com/archan937](http://github.com/archan937) - [http://twitter.com/archan937](http://twitter.com/archan937) - [pm_engel@icloud.com](mailto:pm_engel@icloud.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

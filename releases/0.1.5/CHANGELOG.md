## Animate.js CHANGELOG

### Version 0.1.5 (June 8, 2017)

* Triggering 'next' event on parent iframe (or window if not available) after having animated all elements
* Improved jQuery-like library (not enhancing `window` with jQuery-like functions when doing `$(window)`)

### Version 0.1.4 (April 8, 2017)

* Naming injected elements
* Updated modules

### Version 0.1.3 (March 2, 2017)

* Fixed handling custom specified animation durations
* Given `.am-page iframe` the proper background #222 color (instead of white)
* Fixed timing when initializing animations after page transition
* Changed (internal) module functions to a jQuery-like programming interface
* Automatically correcting initial visibility of animated elements and thus adding `am-hide` CSS class is not necessary anymore
* Restructured source and build directories
* Being able to distinguish revealing versus concealing animations
* Completed naming available page animations

### Version 0.1.2 (September 5, 2016)

* Updated [mod.js](https://gist.github.com/archan937/b30aa420319932294d5feaf8fd808994) which really hides the 'private' module functions

### Version 0.1.1 (July 12, 2016)

* Being able to adjust the element animation duration
* Always animate step 0 after reset

### Version 0.1.0 (July 9, 2016)

* Initial release

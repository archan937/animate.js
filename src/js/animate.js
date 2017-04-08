if (typeof(Animate) == 'undefined') {

// *
// * animate.js {version} (Uncompressed)
// * Add slick animations to your web pages and page transitions
// *
// * (c) {year} Paul Engel
// * animate.js is licensed under MIT license
// *
// * $Date: {date} $
// *

Animate = define('animate.js', function() {

  registerJS(@@html2canvasJS, 'am-html2canvas');
  registerCSS(@@animateCSS, 'am-animate');
  registerCSS(@@opacCSS, 'am-opac');
  registerCSS(@@elementsCSS, 'am-elements');
  registerCSS(@@pagesCSS, 'am-pages');

  registerNext(Elements.next);
  registerBack(Elements.back);
  registerReset(Elements.reset);
  registerConfig(Elements.config);

  registerNext(Pages.next);
  registerBack(Pages.back);
  registerConfig(Pages.config);

  injectCode();

  ready(function() {
    configure();
    Elements.ready();
    Pages.ready();
  });

  return {
    version: '{version}',
    next: next,
    back: back,
    reset: reset,
    $: $,
    init: Elements.init,
    time: Elements.time,
    load: Pages.load
  };

},
  'Identifier',
  'Introspect',
  'Collections',
  'Elements',
  'Events',
  'Controls',
  'Inject',
  'Config',
  'Animate.Elements',
  'Animate.Pages'
);

}

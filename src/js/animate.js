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

Animate = (function() {

  mod.extend(this, 'Introspect');
  mod.extend(this, 'Collections');
  mod.extend(this, 'Elements');
  mod.extend(this, 'Events');
  mod.extend(this, 'Controls');
  mod.extend(this, 'Inject');
  mod.extend(this, 'Config');

  mod.extend(this, 'Animate.Elements');
  mod.extend(this, 'Animate.Pages');

  registerJS(@@html2canvasJS);
  registerCSS(@@animateCSS);
  registerCSS(@@elementsCSS);
  registerCSS(@@pagesCSS);

  registerNext(Elements.next);
  registerBack(Elements.back);
  registerReset(Elements.reset);
  registerConfig(Elements.config);

  registerNext(Pages.next);
  registerBack(Pages.back);
  registerConfig(Pages.config);

  injectCode();
  respectClicks();

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
    time: Elements.time,
    load: Pages.load
  }
})();

}

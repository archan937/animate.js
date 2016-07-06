mod.define('Inject', function() {
  var
    registered = {
      js: [], css: []
    },

  ensureHead = function() {
    if (!$('head').length) {
      document.body.parentNode.insertBefore(document.createElement('head'), document.body);
    }
    return $('head')[0];
  };

  return {
    registerJS: function(code) {
      registered.js.push(code);
    },

    registerCSS: function(code) {
      registered.css.push(code);
    },

    injectCode: function() {
      var head = ensureHead(), i, el;

      for (i = 0; i < registered.js.length; i++) {
        el = document.createElement('script');
        el.innerHTML = registered.js[i];
        head.insertBefore(el, head.childNodes[0]);
      }

      for (i = 0; i < registered.css.length; i++) {
        el = document.createElement('style');
        el.innerHTML = registered.css[i];
        head.insertBefore(el, head.childNodes[0]);
      }
    }
  };
});

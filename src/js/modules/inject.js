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
    },

    injectCSS: function(selector, style) {
      var el = $('style.injected')[0], head, css = [], attr;

      if (!el) {
        head = ensureHead();
        el = document.createElement('style');
        addClass(el, 'injected');
        head.insertBefore(el, head.childNodes[0]);
      }

      css.push('\n' + selector + ' {');
      for(attr in style) {
        css.push('  ' + attr + ': ' + style[attr] + ';');
      };
      css.push('}');

      el.innerHTML += css.join('\n') + '\n';
    }
  };
});

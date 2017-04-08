mod.define('Inject', function() {
  var
    registered = {
      js: [], css: [], html: []
    },

  ensureHead = function() {
    if (!$('head').length) {
      document.body.parentNode.insertBefore(document.createElement('head'), document.body);
    }
    return $('head')[0];
  };

  return {
    registerJS: function() {
      registered.js.push(arguments);
    },

    registerCSS: function() {
      registered.css.push(arguments);
    },

    registerHTML: function(code) {
      registered.html.push(code);
    },

    injectCode: function() {
      var head = ensureHead(), i, el, val;

      for (i = 0; i < registered.js.length; i++) {
        val = registered.js[i];
        el = document.createElement('script');
        if (val[1])
          el.id = val[1];
        el.innerHTML = val[0];
        head.appendChild(el);
      }

      for (i = 0; i < registered.css.length; i++) {
        val = registered.css[i];
        el = document.createElement('style');
        if (val[1])
          el.id = val[1];
        el.innerHTML = val[0];
        head.appendChild(el);
      }

      for (i = 0; i < registered.html.length; i++) {
        el = document.createElement('div');
        el.innerHTML = registered.html[i];
        while (el.children.length > 0) {
          document.body.appendChild(el.children[0]);
        }
      }
    },

    injectCSS: function(selector, style) {
      var el = $('style.injected')[0], head, css = [], attr;

      if (!el) {
        head = ensureHead();
        el = document.createElement('style');
        $(el).addClass('injected');
        head.insertBefore(el, head.childNodes[0]);
      }

      css.push('\n' + selector + ' {');
      for (attr in style) {
        css.push('  ' + attr + ': ' + style[attr] + ';');
      };
      css.push('}');

      el.innerHTML += css.join('\n') + '\n';
    }
  };
});

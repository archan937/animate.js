mod.define('Elements', function() {
  return {
    $: function(sel, context) {
      context || (context = document);
      var i, found = [], array = [], parents, f = {'#': 'ById', '.': 'sByClassName', '@': 'sByName'}[sel.charAt(0)], s = (f ? sel.slice(1) : sel), fn = 'getElement' + (f || 'sByTagName');
      if (sel.match(/(\[|\(|\=|\:)/) || sel.match(/[^\s](\#|\@|\.)/)) {
        if (context.querySelectorAll) {
          return context.querySelectorAll(sel);
        }
      }
      if (sel.match(/\s/)) {
        array = sel.split(' '), parents = $(array.shift(), context);
        for (i = 0; i < parents.length; i += 1) {
          found = found.concat($(array.join(' '), parents[i]));
        }
      } else {
        found = context[fn] ? context[fn](s) : $[fn](s, context);
        if (f == 'ById') {
          found = [found];
        } else {
          for (i = 0; i < found.length; i += 1) {
            array.push(found[i]);
          }
          found = array;
        }
      }
      return found;
    },

    closest: function(el, sel, elements) {
      elements || (elements = $(sel));
      if (indexOf(el, elements) != -1) {
        return el;
      } else if (el.parentNode) {
        return closest(el.parentNode, sel, elements);
      }
    },

    addClass: function(el, arg) {
      if (el) {
        var classes = arg.split(' '), i, name;
        for (i = 0; i < classes.length; i += 1) {
          name = classes[i];
          if (name.length && (indexOf(name, el.classList) == -1)) {
            el.classList.add(name);
          }
        }
      }
    },

    removeClass: function(el, arg) {
      if (el) {
        var classes = arg.split(' '), i, name;
        for (i = 0; i < classes.length; i += 1) {
          name = classes[i];
          if (name.length) {
            el.classList.remove(name);
          }
        }
        if (!el.classList.length) {
          el.removeAttribute('class');
        }
      }
    },

    hasClass: function(el, arg) {
      if (el) {
        for (var i = 0; i < el.classList.length; i += 1) {
          if (el.classList[i].toLowerCase() == arg.toLowerCase()) {
            return true;
          }
        }
        return false;
      }
    },

    innerWrap: function(el, tag, attributes) {
      if (el) {
        var attrs = '', name;
        for (name in (attributes || {})) {
          attrs += ' ' + name + '="' + attributes[name].toString().replace(/\n/g, "\\n").replace(/\"/g, "\\\"") + '"';
        }
        el.innerHTML = '<' + tag + attrs + '>' + el.innerHTML + '</' + tag + '>';
        return el;
      }
    },

    outerWrap: function(el, tag, attributes) {
      if (el) {
        var outerEl = document.createElement(tag), name;
        for (name in (attributes || {})) {
          outerEl.setAttribute(name, attributes[name]);
        }
        el.parentNode.insertBefore(outerEl, el);
        outerEl.appendChild(el);
        return outerEl;
      }
    }
  };
});

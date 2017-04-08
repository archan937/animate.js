mod.define('Elements', function() {
  var

    fn = {
      find: function(selector) {
        return $(selector, this);
      },

      children: function() {
        var children = [], i;
        children.at = true;
        for (i = 0; i < this.childNodes.length; i++) {
          node = this.childNodes[i];
          if (node instanceof HTMLElement) {
            children.push(node);
          }
        }
        return children;
      },

      parent: function() {
        return wrap(this.parentNode);
      },

      closest: function(sel, elements, context) {
        context || (context = root(this));
        elements || (elements = $(sel, context));

        if (indexOf(this, elements) != -1) {
          return this;
        } else {
          return $(this.parentNode).closest(sel, elements, context);
        }
      },

      show: function() {
        this.style.display = 'initial';
      },

      hide: function() {
        this.style.display = 'none';
      },

      remove: function() {
        this.parentNode.removeChild(this);
      },

      is: function(sel) {
        return this.matches(sel);
      },

      html: function(val) {
        if (arguments.length) {
          this.innerHTML = val;
        } else {
          return this.innerHTML;
        }
      },

      root: function() {
        return root(this);
      },

      edit: function(edit) {
        if (edit == false) {
          this.removeAttribute('contenteditable');
        } else {
          this.setAttribute('contenteditable', 'true');
        }
      },

      addClass: function() {
        var classes = ((arguments[0] instanceof Array) ? arguments[0] : arguments);
        classes = Array.prototype.join.call(classes, " ");
        this.classList.add.apply(this.classList, classes.trim().split(/\s+/));
      },

      removeClass: function() {
        var classes = [], i, name, regexp;

        if (arguments[0] instanceof RegExp) {
          regexp = arguments[0];
          for (i = 0; i < this.classList.length; i += 1) {
            name = this.classList[i];
            if (name.match(regexp))
              classes.push(name);
          }
        } else {
          classes = (arguments[0] instanceof Array) ? arguments[0] : arguments;
        }

        this.classList.remove.apply(this.classList, classes);
      },

      hasClass: function(arg) {
        return this.classList.contains(arg);
      },

      innerWrap: function(tag, attributes) {
        var attrs = '', name;
        for (name in (attributes || {})) {
          attrs += ' ' + name + '="' + attributes[name].toString().replace(/\n/g, "\\n").replace(/\"/g, "\\\"") + '"';
        }
        this.innerHTML = '<' + tag + attrs + '>' + this.innerHTML + '</' + tag + '>';
      },

      outerWrap: function(tag, attributes) {
        var outerEl = document.createElement(tag), name;
        for (name in (attributes || {})) {
          outerEl.setAttribute(name, attributes[name]);
        }
        this.parentNode.insertBefore(outerEl, this);
        outerEl.appendChild(this);
        return wrap(outerEl);
      },

      focus: function() {
        this.focus();
      },

      bind: function() {
        bind.apply(window, [this].concat(Array.prototype.slice.call(arguments)));
      },

      unbind: function() {
        unbind.apply(window, [this].concat(Array.prototype.slice.call(arguments)));
      },

      once: function() {
        once.apply(window, [this].concat(Array.prototype.slice.call(arguments)));
      },

      on: function() {
        var args = Array.prototype.slice.call(arguments);
        args[3] || (args[3] = root(this));
        on.apply(window, args);
      },

      trigger: function() {
        trigger.apply(window, [this].concat(Array.prototype.slice.call(arguments)));
      },

      width: function() {
        var c = computedStyle(this);
        return parseInt(c.width) +
               parseInt(c.borderLeftWidth) +
               parseInt(c.paddingLeft) +
               parseInt(c.borderRightWidth) +
               parseInt(c.paddingRight);
      },

      height: function() {
        var c = computedStyle(this);
        return parseInt(c.height) +
               parseInt(c.borderTopWidth) +
               parseInt(c.paddingTop) +
               parseInt(c.borderBottomWidth) +
               parseInt(c.paddingBottom);
      },

      bounds: function() {
        return bounds.apply(window, [this].concat(Array.prototype.slice.call(arguments)));
      },

      style: function() {
        return this.style;
      },

      computedStyle: function() {
        return computedStyle.apply(window, [this].concat(Array.prototype.slice.call(arguments)));
      },

      cssRules: function() {
        return cssRules.apply(window, [this].concat(Array.prototype.slice.call(arguments)));
      },

      attr: function() {
        var key = arguments[0], value = arguments[1], attr;
        if (arguments.length == 1) {
          if (typeof(key) == 'string') {
            return this.getAttribute(key);
          } else {
            for (attr in key) {
              this.setAttribute(attr, key[attr]);
            }
          }
        } else {
          this.setAttribute(key, value);
        }
      },

      removeAttr: function(attr) {
        var regexp, i;

        if (attr instanceof RegExp) {
          regexp = attr;
          for (i = 0; i < this.attributes.length; i += 1) {
            attr = this.attributes[i].localName;
            if (attr.match(regexp))
              this.removeAttribute(attr);
          }
        } else {
          this.removeAttribute(attr);
        }
      },

      css: function() {
        var key = arguments[0], value = arguments[1], prop;
        if (arguments.length == 1) {
          if (typeof(key) == 'string') {
            return computedStyle.apply(window, [this].concat(Array.prototype.slice.call(arguments)))[key];
          } else {
            for (prop in key) {
              this.style[prop] = key[prop];
            }
          }
        } else {
          this.style[key] = value;
        }
      },

      prev: function(selector) {
        var prev = $(this.previousElementSibling);
        if (selector && !prev.is(selector)) {
          return prev.prev(selector);
        } else {
          return prev;
        }
      },

      next: function(selector) {
        var next = $(this.nextElementSibling);
        if (selector && !next.is(selector)) {
          return next.next(selector);
        } else {
          return next;
        }
      },

      backward: function(selector) {
        var el = $(this).prev(selector);
        if (el.length) {
          this.parentNode.insertBefore(this, el.at(0));
        }
      },

      forward: function(selector) {
        var el = $(this).next(selector);
        if (el.length) {
          next = el.at(0).nextElementSibling;
          next ? this.parentNode.insertBefore(this, next) : this.parentNode.appendChild(this);
        }
      },

      prepend: function(child) {
        $(child).each(function(i, node) {
          var first = this.children[0];
          first ? this.insertBefore(node, first) : this.appendChild(node);
        }.bind(this));
      },

      prependTo: function(parent) {
        $(parent).each(function(i, node) {
          var first = node.children[0];
          first ? node.insertBefore(this, first) : node.appendChild(this);
        }.bind(this));
      },

      append: function(child) {
        $(child).each(function(i, node) {
          this.appendChild(node);
        }.bind(this));
      },

      appendTo: function(parent) {
        $(parent).each(function(i, node) {
          node.appendChild(this);
        }.bind(this));
      },

      before: function(el) {
        $(el).each(function(index, el) {
          this.parentNode.insertBefore(el, this);
        }.bind(this));
      },

      after: function(el) {
        $(el).each(function(index, el) {
          var next = this.nextElementSibling;
          if (next) {
            $(next).before(el);
          } else {
            this.parentNode.appendChild(el);
          }
        }.bind(this));
      },

      toShadowDom: function(id) {
        var body = document.body, el;
        if (body.createShadowRoot) {
          el = $('#' + id)[0];
          if (!el) {
            el = document.createElement('div');
            el.id = id;
            document.body.appendChild(el);
            el.createShadowRoot();
          }
          el.shadowRoot.appendChild(this);
        }
      },

      draggable: function(arg) {
        Draggable[(arg == false) ? 'stop' : 'init'](this, arg);
      }
    },

  newElement = function(html) {
    if ((typeof(html) == 'string') && html.match(/^\<(\w+)(.+\<\/\1)?\>$/m)) {
      var el = document.createElement('div');
      el.innerHTML = html;
      return wrap(el.childNodes[0]);
    }
  },

  search = function(sel, context) {
    context || (context = document);

    var i, found = [], array = [], parents,
        f = {'#': 'ById', '.': 'sByClassName', '@': 'sByName'}[sel.charAt(0)],
        s = (f ? sel.slice(1) : sel),
        fn = 'getElement' + (f || 'sByTagName');

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
      if (context[fn])
        found = context[fn](s);
      else {
        if (f == 'ById') {
          f = null;
          s = '[id="' + s + '"]';
        }
        found = context.querySelectorAll(s);
      }
      if (f == 'ById') {
        found = [found];
      } else {
        for (i = 0; i < found.length; i += 1) {
          array.push(found[i]);
        }
        found = array;
      }
    }

    for (i = 0; i < found.length; i++) {
      if (!found[i]) {
        found.splice(i, 1);
      }
    }

    return found;
  },

  wrap = function(arg) {
    if ((arg === null) || (typeof(arg) == 'undefined')) {
      return wrap([]);
    }
    if (!arg.at) {
      if (arg.nodeType) {
        arg = [arg];
      }
      for (var prop in fn) {
        if (fn.hasOwnProperty(prop)) {
          define(prop, arg);
        }
      }
      arg.at = function(i) {
        return this[i];
      };
      arg.each = function(f) {
        for (var i = 0; i < this.length; i++) {
          f.apply(this[i], [i, this[i]]);
        }
        return this;
      };
    }
    return arg;
  },

  define = function(name, elements) {
    elements[name] = function() {
      var
        func = fn[name],
        results = [],
        i, el, result;

      for (i = 0; i < elements.length; i++) {
        el = elements[i];
        result = func.apply(el, arguments);

        if (typeof(result) == 'undefined') {
          result = el;
        }

        if (result && result.nodeType) {
          results.push(result);
        } else if (result && result.at) {
          results = results.concat(Array.prototype.slice.call(result));
        } else {
          return result;
        }
      }

      return wrap(results);
    };
  };

  return {
    $: function(arg, context) {
      return newElement(arg) || wrap(
        (typeof(arg) == 'string') ? search(arg, context) : arg
      );
    }
  };
});

var mod = (function() {
  var varname = '__props__', modules = {},

  evil = function(object, code) {
    return eval.call(object, code);
  };

  return {
    define: function(name, mod) {
      modules[name] = (typeof(mod) == 'function') ? mod() : mod;
    },
    extend: function(object) {
      evil(object, 'var ' + varname + ' = {}');

      var props = evil(object, varname),
          i, mod, prop;
      for (i = 1; i < arguments.length; i++) {
        var mod = modules[arguments[i]];
        for (prop in mod) {
          props[prop] = mod[prop];
          evil(object, 'var ' + prop + ' = ' + varname + '.' + prop);
        }
      }

      evil(object, varname + ' = undefined');
    }
  };
}());

mod.define('Collections', function() {
  return {
    extend: function(target, object) {
      for (var key in object) {
        target[key] = object[key];
      }
      return target;
    },

    keys: function(object) {
      var keys = [], prop;
      for (prop in object) {
        if (object.hasOwnProperty(prop)) {
          keys.push(prop);
        }
      }
      return keys;
    },

    indexOf: function(val, array) {
      for (var i = 0; i < array.length; i += 1) {
        if (val === array[i]) {
          return i;
        }
      }
      return -1;
    },

    forEach: function(array, f) {
      for (var i = 0; i < array.length; i += 1) {
        f(array[i], i == array.length - 1);
      }
    },

    select: function(array, f) {
      var selected = [];
      forEach(array, function(el) {
        if (f(el)) {
          selected.push(el);
        }
      })
      return selected;
    },

    pickRandom: function(array) {
      return array[Math.floor(Math.random() * array.length)];
    }
  };
});

mod.define('Config', function() {
  var
    registered = [];

  return {
    registerConfig: function(config) {
      for (var param in config) {
        registered.push({
          param: param,
          function: config[param]
        });
      }
    },

    configure: function() {
      var param, i, spec;
      for (param in script.params) {
        for (i = 0; i < registered.length; i++) {
          spec = registered[i];
          if (spec.param == param) {
            spec.function(script.params[param]);
          }
        }
      }
    }
  };
});

mod.define('Controls', function() {
  var
    controls_binded = false,
    registered = {
      next: [], back: [], reset: []
    },

  call = function(type, e) {
    var functions = registered[type], i;
    for (i = 0; i < functions.length; i++) {
      if (functions[i](e) == false) {
        break;
      }
    }
  };

  return {
    registerNext: function(f) {
      registered.next.push(f);
    },

    registerBack: function(f) {
      registered.back.push(f);
    },

    registerReset: function(f) {
      registered.reset.push(f);
    },

    bindControls: function() {
      if (!controls_binded) {
        bind(document, 'click', function(e) {
          !(e.metaKey || e.shiftKey || e.ctrlKey || e.altKey) &&
          !closest(e.target || e.srcElement || window.event.target || window.event.srcElement, 'a') &&
          next(e);
        });
        bind(document, 'keypress', function(e) {
          switch (e.keyCode) {
            case 13: case 32:
              next(e); break;
            case 114:
              reset(); break;
          }
        });
        bind(document, 'keydown', function(e) {
          switch (e.keyCode) {
            case 38: case 39:
              next(e); break;
            case 8: case 37: case 40:
              back(e); break;
          }
        });
        controls_binded = true;
      }
    },

    next: function(e) {
      call('next', e);
    },

    back: function(e) {
      call('back', e);
    },

    reset: function(e) {
      call('reset', e);
    }
  };
});

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

mod.define('Events', function() {
  return {
    bind: function(el, type, fn, remove) {
      var tf = type + fn;

      if (el && (el.attachEvent ? (remove ? el.detachEvent('on' + type, el[tf]) : 1) : (remove ? el.removeEventListener(type, fn, 0) : el.addEventListener(type, fn, 0)))) {
        el['e' + tf] = fn;
        el[tf] = function() { el['e' + tf](window.event); };
        el.attachEvent('on' + type, el[tf]);
      }

      el._events || (el._events = {});
      el._events[type] || (el._events[type] = []);

      if (remove) {
        el._events[type].splice(indexOf(fn, el._events[type]), 1);
      } else {
        el._events[type].push(fn);
      }
    },

    unbind: function(el, type, fn) {
      if (fn) {
        bind(el, type, fn, true);
      } else {
        var fns = (el._events || {})[type] || [], i;
        for (i = 0; i < fns.length; i++) {
          unbind(el, type, fns[i]);
        }
      }
    },

    on: function(sel, type, fn) {
      bind(document, type, function(e) {
        var target = closest(e.target || e.srcElement || window.event.target || window.event.srcElement, sel);
        if (target) {
          e.preventDefault ? e.preventDefault() : e.returnValue = false;
          fn(e, target);
        }
      });
    },

    trigger: function(el, name) {
      var event;

      if (document.createEvent) {
        event = document.createEvent('Event');
        event.initEvent(name, true, true);
      } else {
        event = document.createEventObject();
        event.eventType = name;
      }

      event.eventName = name;

      if (document.createEvent) {
        el.dispatchEvent(event);
      } else {
        el.fireEvent('on' + name, event);
      }
    },

    animationEnd: function() {
      var
        style = document.body.style,
        mapping = {
          'WebkitAnimation': 'webkitAnimationEnd',
          'OAnimation': 'oAnimationEnd',
          'msAnimation': 'MSAnimationEnd'
        },
        prop;

      for (prop in mapping) {
        if (mapping.hasOwnProperty(prop) && typeof(style[prop]) == 'string') {
          return mapping[prop];
        }
      }

      return 'animationend';
    },

    respectClicks: function() {
      on('a', 'click', function(e, target) {
        if (e.metaKey) {
          window.open(target.getAttribute('href'), '_blank');
        }
      });
    },

    ready: function(fn) {
      '\v' == 'v' ? setTimeout(fn, 0) : bind(document, 'DOMContentLoaded', function(){ setTimeout(fn, 0) });
    }
  };
});

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

mod.define('Introspect', function() {
  return {
    script: (function() {
      var id = 'dummy', dummy, script, src, params = {}, pairs, i, key_value, key;
      document.write('<script id="' + id + '"></script>');

      dummy = document.getElementById(id);
      script = dummy.previousSibling;
      dummy.parentNode.removeChild(dummy);

      src = script.getAttribute('src');
      pairs = ((src.match(/([\?]*)\?(.*)+/) || ['', '', ''])[2] || '').replace(/(^[0123456789]+|\.js(\s+)?$)/, '').split('&');

      for (i = 0; i < pairs.length; i += 1) {
        if (pairs[i] != '') {
          key_value = pairs[i].split('=');
          key = key_value[0].replace(/^\s+|\s+$/g, '').toLowerCase();
          params[key] = (key_value.length == 1) || key_value[1].replace(/^\s+|\s+$/g, '');
        }
      }

      return {
        path: src.toLowerCase().replace(/[^\/]+\.js.*/, ''),
        params: params
      };
    }()),

    isRetinaDisplay: function() {
      if (window.matchMedia) {
        var mq = window.matchMedia('only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)');
        return (mq && mq.matches || (window.devicePixelRatio > 1));
      }
      return false;
    },

    inFrame: function() {
      return parent !== window;
    },

    viewWidth: function() {
      return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    },

    viewHeight: function() {
      return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    },

    viewTop: function() {
      return window.pageYOffset;
    },

    viewLeft: function() {
      return window.pageXOffset;
    },

    bounds: function(el) {
      var rect = el.getBoundingClientRect();
      return {
        top: parseInt(rect.top + viewTop()),
        left: parseInt(rect.left + viewLeft()),
        width: parseInt(rect.width),
        height: parseInt(rect.height)
      }
    },

    computed: function(el) {
      return window.getComputedStyle(el);
    }
  };
});

mod.define('Animate.Elements', function() {
  var
    timing = [],
    step = 0,
    lock = 0,
    hide_class = 'am-hide',

  currentKey = function() {
    return 'data-am-' + step;
  },

  currentElements = function() {
    return $('[' + currentKey() + ']');
  },

  animateEach = function(f) {
    var key = currentKey(),
        elements = currentElements(),
        wrapper;

    if (elements.length) {

      wrapper = document.createElement('div');
      wrapper.setAttribute('style', [
        'height: ' + (
          bounds(document.body).height +
          parseInt(computed(document.body).marginTop) +
          parseInt(computed(document.body).marginBottom)
        ) + 'px'
      ].join('; '));

      addClass(wrapper, 'am-wrapper');
      document.body.appendChild(wrapper);

      forEach(elements, function(el) {
        el.initial_class || (el.initial_class = select(el.classList, function(css_class) { return css_class == hide_class; }).join(' '));
        el.bounds = bounds(el);
      });

      forEach(elements, function(el, last) {
        var
          hidden = hasClass(el, hide_class),
          style = computed(el),
          body = computed(document.body),
          absolute = style['position'] == 'absolute',
          animated_el = document.createElement('div'),
          placeholder;

        if (!absolute) {
          addClass(animated_el, 'no_margin');
        }

        animated_el.setAttribute('style',
          [
            'display: block',
            'top: ' + (absolute ? '0' : (el.bounds.top + 'px')),
            'left: ' + (absolute ? body['marginLeft'] : (el.bounds.left + 'px')),
            ((style['display'] == 'block') ? ('width: ' + body.width) : ''),
            (absolute ? 'height: 100%' : '')
          ].join('; ')
        );

        placeholder = outerWrap(el, 'div', {
          style: [
            'width: ' + el.bounds.width + 'px',
            'height: ' + el.bounds.height + 'px',
            'margin: ' + style['margin'],
            'padding: ' + style['padding'],
            'display: ' + ((style['display'] == 'inline') ? 'inline-block' : style['display']),
            'line-height: ' + style['line-height']
          ].join('; ')
        });

        delete el.bounds;

        animated_el.appendChild(el);
        wrapper.appendChild(animated_el);

        if (hidden) {
          removeClass(el, hide_class);
        }

        bind(animated_el, animationEnd(), function() {
          placeholder.parentNode.insertBefore(el, placeholder);
          placeholder.parentNode.removeChild(placeholder);
          if (hidden) {
            removeClass(el, hide_class);
          } else {
            addClass(el, hide_class);
          }
          if (last) {
            wrapper.parentNode.removeChild(wrapper);
          }
        });

        f(el, animated_el, key);
      });

    }
  },

  animate = function() {
    animateEach(function(el, animated_el, key) {
      var animation = el.getAttribute(key);

      if (animation.match('|')) {
        animation = pickRandom(animation.split('|'));
      }

      addClass(animated_el, 'animated ' + animation);

      el.setAttribute(key, animation);
      el.setAttribute('data-animated', '');
    });
  },

  reverseAnimate = function(el) {
    animateEach(function(el, animated_el, key) {
      var animation, reverse_animation;

      animation = el.getAttribute(key);
      reverse_animation = animation.replace(/([a-z])(In|Out)([A-Z]|$)/g, function(s, m1, m2, m3) {
        return m1 + {In: 'Out', Out: 'In'}[m2] + m3;
      }).replace(/([a-z])(Up|Down)([A-Z]|$)/g, function(s, m1, m2, m3) {
        return m1 + {Up: 'Down', Down: 'Up'}[m2] + m3;
      });

      addClass(animated_el, 'animated ' + reverse_animation);
    });
  };

  return {
    Elements: {

      next: function(e) {
        e && (e.preventDefault ? e.preventDefault() : e.returnValue = false);

        if (e && lock > step) {
          return;
        }

        var elements = currentElements();

        if (step > 0 && !elements.length) {
          return;
        }

        animate();

        if (step == 0) {
          step = 1;
        } else if (elements.length) {
          step++;
        }

        if (lock == step) {
          lock = 0;
        }

        return false;
      },

      back: function(e) {
        e && (e.preventDefault ? e.preventDefault() : e.returnValue = false);

        if (step == 0) {
          return;
        }

        if (step == 1 && !$('[data-am-0]').length) {
          return;
        }

        if (e && lock > step) {
          return;
        }

        step--;

        reverseAnimate();

        return false;
      },

      reset: function() {
        forEach($('[data-animated]'), function(el) {
          addClass(el, el.initial_class || '');
          el.removeAttribute('data-animated');
        });

        step = 0;
        lock = 0;

        if (timing.length) {
          next();
          Elements.time.apply(this);
        }

        return false;
      },

      time: function() {
        if (arguments.length) {
          timing = arguments;
        }

        lock = step + timing.length;

        forEach(timing, function(seconds) {
          setTimeout(next, parseFloat(seconds) * 1000);
        });
      },

      config: {
        controls: function() {
          bindControls();
        },
        timing: function(value) {
          Elements.time.apply(this, value.split('+'));
        }
      },

      ready: function() {
        Elements.next();
      }

    }
  }

});

mod.define('Animate.Pages', function() {
  var
    selector = 'a',

  pageOut = function() {
    return $('#am-page-out')[0];
  },

  pageIn = function() {
    return $('#am-page-in')[0];
  },

  takeSnapshot = function(callback) {
    var
      body = document.body,
      width = viewWidth(),
      height = viewHeight(),
      factor = isRetinaDisplay() ? 2.0 : 1.0,
      canvas = document.createElement('canvas'),
      context = canvas.getContext('2d');

    canvas.width = width * factor;
    canvas.height = height * factor;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    if (computed(document.body)['background'].match(/rgba\(\d+, \d+, \d+, 0\)/)) {
      canvas.style.background = 'white';
    }

    context.scale(factor, factor);

    html2canvas(body.parentNode, {canvas: canvas}).then(callback);
  },

  splitCanvas = function(canvas, horizontal, vertical) {
    var
      width = canvas.clientWidth,
      height = canvas.clientHeight,
      factor = isRetinaDisplay() ? 2.0 : 1.0,
      wrapper = outerWrap(canvas, 'div', {
        style: [
          'top: ' + (canvas.style.top || 0) + 'px',
          'left: ' + (canvas.style.left || 0) + 'px',
          'width: ' + width + 'px',
          'height: ' + height + 'px',
          'display: inline-block',
          'position: ' + (canvas.style.position || 'relative')
        ].join('; ')
      }),
      c, i, j, t, l,
      w = width / horizontal,
      h = height / vertical;

    for (i = 0; i < vertical; i += 1) {
      for (j = 0; j < horizontal; j += 1) {
        c = document.createElement('canvas');
        c.width = w * factor;
        c.height = h * factor;
        c.style.top = (t = i * (height / vertical)) + 'px';
        c.style.left = (l = j * (width / horizontal)) + 'px';
        c.style.width = w + 'px';
        c.style.height = h + 'px';
        c.style.position = 'absolute';
        c.getContext('2d').drawImage(
          canvas,
          l * factor, t * factor, w * factor, h * factor,
          0, 0, w * factor, h * factor
        );
        wrapper.appendChild(c);
      }
    }

    canvas.parentNode.removeChild(canvas);
  },

  prepPageOut = function(snapshot) {
    var
      body = document.body,
      page_out;

    if (pageIn()) {
      page_out = document.createElement('div');
      page_out.id = 'am-page-out';
      addClass(page_out, 'am-page');
      body.appendChild(page_out);
    } else {
      page_out = innerWrap(body, 'div', {
        'id': 'am-page-out',
        'class': 'am-page'
      }).children[0];
      page_out.innerHTML = '';
    }

    page_out.appendChild(snapshot);
  },

  prepBody = function() {
    addClass(document.body, 'am-wrapper');
  },

  prepPageIn = function(url) {
    var
      page_in = pageIn(),
      iframe,
      iframe_document;

    url += url.match(/\?\w+/) ? '&' : '?';
    url += 't=' + (new Date()).getTime();

    if (url.match(/^\w+:\/\//)) {
      page_in && document.body.removeChild(page_in);
      return;
    }

    if (page_in) {
      iframe = $('iframe', page_in)[0];
    } else {
      page_in = document.createElement('div');
      page_in.id = 'am-page-in';
      page_in.classList.add('am-page');

      iframe = document.createElement('iframe');
      page_in.appendChild(iframe);
      document.body.appendChild(page_in);
    }

    iframe_document = iframe.contentWindow.document;
    iframe_document.open();
    iframe_document.write('<body onload="window.location.replace(\'' + url + '\')">');
    iframe_document.close();
  },

  animatePages = function(animation, url) {
    animation = animations[animation || randomAnimation()];

    var
      page_out = pageOut(),
      page_in = pageIn(),
      captures = animation[0].match(/(\d+):(\d+)\s+(.*)/) || [],
      css_classes, i;

    if (captures.length) {
      splitCanvas(page_out.children[0], parseInt(captures[1], 10), parseInt(captures[2], 10));
      bind(page_out.children[0].children[page_out.children[0].children.length - 1], animationEnd(), function() {
        pageOutEnd(url);
      });

      css_classes = (' ' + captures[3]).split(',');
      for (i = 0; i < css_classes.length; i += 1) {
        addClass(page_out.children[0].children[i], css_classes[i].replace(/\s+/, ' am-page-'));
      }
    } else {
      bind(page_out, animationEnd(), function() {
        pageOutEnd(url);
      });
      addClass(page_out, 'am-page-' + animation[0].replace(' ', ' am-page-'));
    }

    if (page_in) {
      bind(page_in, animationEnd(), pageInEnd);
      addClass(page_in, 'am-page-' + animation[1].replace(' ', ' am-page-'));
    }
  },

  pageOutEnd = function(url) {
    if (!pageIn()) {
      window.location.href = url;
    }
  },

  pageInEnd = function(event) {
    var
      iframe = $('iframe', pageIn())[0],
      iframe_document = iframe.contentWindow.document,
      page_out = pageOut(),
      complete = function() {
        document.title = iframe_document.title;
        document.body.removeAttribute('data-am-animation');
        document.body.removeAttribute('data-am-next-slide');

        if (page_out) {
          document.body.removeChild(page_out);
        }

        if (event) {
          history.pushState({
            title: document.title,
            path: iframe.contentWindow.window.location.pathname
          }, document.title, iframe_document.URL.replace(/(\?|&)t=\d+/, ''));
        }

        pageIn().setAttribute('class', 'am-page');
        iframe.focus();
      };

    if (iframe_document.readyState == 'complete') {
      complete();
    } else {
      iframe_document.onload = complete;
    }
  },

  animations = {
    'pushToLeft'         : ['moveToLeft', 'moveFromRight'],
    'pushToRight'        : ['moveToRight', 'moveFromLeft'],
    'pushToBottom'       : ['moveToBottom', 'moveFromTop'],
    'pushToTop'          : ['moveToTop', 'moveFromBottom'],
    'slideFromRight'     : ['idle', 'moveFromRight am-page-ontop'],
    'slideFromLeft'      : ['idle', 'moveFromLeft am-page-ontop'],
    'slideFromBottom'    : ['idle', 'moveFromBottom am-page-ontop'],
    'slideFromTop'       : ['idle', 'moveFromTop am-page-ontop'],
    'pushToLeftEasing'   : ['moveToLeftEasing am-page-ontop', 'moveFromRight'],
    'pushToRightEasing'  : ['moveToRightEasing am-page-ontop', 'moveFromLeft'],
    'pushToTopEasing'    : ['moveToTopEasing am-page-ontop', 'moveFromBottom'],
    'pushToBottomEasing' : ['moveToBottomEasing am-page-ontop', 'moveFromTop'],
    'openSesame'         : ['2:1 pullLeftDoor, pullRightDoor', 'rotateInNewspaper delay300'],
    14: ['scaleDown', 'moveFromRight am-page-ontop'],
    15: ['scaleDown', 'moveFromLeft am-page-ontop'],
    16: ['scaleDown', 'moveFromBottom am-page-ontop'],
    17: ['scaleDown', 'moveFromTop am-page-ontop'],
    18: ['scaleDown', 'scaleUpDown delay300'],
    19: ['scaleDownUp', 'scaleUp delay300'],
    20: ['moveToLeft am-page-ontop', 'scaleUp'],
    21: ['moveToRight am-page-ontop', 'scaleUp'],
    22: ['moveToTop am-page-ontop', 'scaleUp'],
    23: ['moveToBottom am-page-ontop', 'scaleUp'],
    24: ['scaleDownCenter', 'scaleUpCenter delay400'],
    25: ['rotateRightSideFirst', 'moveFromRight delay20 am-page-ontop'],
    26: ['rotateLeftSideFirst', 'moveFromLeft delay20 am-page-ontop'],
    27: ['rotateTopSideFirst', 'moveFromTop delay20 am-page-ontop'],
    28: ['rotateBottomSideFirst', 'moveFromBottom delay20 am-page-ontop'],
    29: ['flipOutRight', 'flipInLeft delay500'],
    30: ['flipOutLeft', 'flipInRight delay500'],
    31: ['flipOutTop', 'flipInBottom delay500'],
    32: ['flipOutBottom', 'flipInTop delay500'],
    'rotateFall': ['rotateFall am-page-ontop', 'scaleUp'],
    34: ['rotateOutNewspaper', 'rotateInNewspaper delay500'],
    35: ['rotatePushLeft', 'moveFromRight'],
    36: ['rotatePushRight', 'moveFromLeft'],
    37: ['rotatePushTop', 'moveFromBottom'],
    38: ['rotatePushBottom', 'moveFromTop'],
    39: ['rotatePushLeft', 'rotatePullRight delay180'],
    40: ['rotatePushRight', 'rotatePullLeft delay180'],
    41: ['rotatePushTop', 'rotatePullBottom delay180'],
    42: ['rotatePushBottom', 'rotatePullTop delay180'],
    43: ['rotateFoldLeft', 'moveFromRightFade'],
    44: ['rotateFoldRight', 'moveFromLeftFade'],
    45: ['rotateFoldTop', 'moveFromBottomFade'],
    46: ['rotateFoldBottom', 'moveFromTopFade'],
    47: ['moveToRightFade', 'rotateUnfoldLeft'],
    48: ['moveToLeftFade', 'rotateUnfoldRight'],
    49: ['moveToBottomFade', 'rotateUnfoldTop'],
    50: ['moveToTopFade', 'rotateUnfoldBottom'],
    51: ['rotateRoomLeftOut am-page-ontop', 'rotateRoomLeftIn'],
    52: ['rotateRoomRightOut am-page-ontop', 'rotateRoomRightIn'],
    53: ['rotateRoomTopOut am-page-ontop', 'rotateRoomTopIn'],
    54: ['rotateRoomBottomOut am-page-ontop', 'rotateRoomBottomIn'],
    55: ['rotateCubeLeftOut am-page-ontop', 'rotateCubeLeftIn'],
    56: ['rotateCubeRightOut am-page-ontop', 'rotateCubeRightIn'],
    57: ['rotateCubeTopOut am-page-ontop', 'rotateCubeTopIn'],
    58: ['rotateCubeBottomOut am-page-ontop', 'rotateCubeBottomIn'],
    59: ['rotateCarouselLeftOut am-page-ontop', 'rotateCarouselLeftIn'],
    60: ['rotateCarouselRightOut am-page-ontop', 'rotateCarouselRightIn'],
    61: ['rotateCarouselTopOut am-page-ontop', 'rotateCarouselTopIn'],
    62: ['rotateCarouselBottomOut am-page-ontop', 'rotateCarouselBottomIn'],
    63: ['rotateSidesOut', 'rotateSidesIn delay200'],
    64: ['rotateSlideOut', 'rotateSlideIn']
  },

  randomAnimation = function() {
    var names = keys(animations);
    return names[Math.floor(Math.random() * names.length)].toString();
  };

  return {
    Pages: {

      next: function(e) {
        e && (e.preventDefault ? e.preventDefault() : e.returnValue = false);
        if (document.body.getAttribute('data-am-next-slide')) {
          Pages.load(document.body.getAttribute('data-am-next-slide'));
          return false;
        }
      },

      back: function(e) {
        e && (e.preventDefault ? e.preventDefault() : e.returnValue = false);
        history.back();
        return false;
      },

      load: function(url, animation, snapshot) {
        animation = animation || document.body.getAttribute('data-am-animation');
        if (inFrame() && parent.Animate) {
          takeSnapshot(function(snapshot) {
            return parent.Animate.load(url, animation, snapshot);
          });
        } else {
          var load = function(snapshot) {
            prepPageOut(snapshot);
            prepBody();
            prepPageIn(url);
            animatePages(animation, url);
          };
          snapshot ? load(snapshot) : takeSnapshot(function(snapshot) {
            load(snapshot);
          });

          return false;
        }
      },

      config: {
        selector: function(value) {
          selector = value;
        },
        animation: function(animation) {
          document.body.setAttribute('data-am-animation', animation);
        },
        'next-slide': function(slide) {
          document.body.setAttribute('data-am-next-slide', decodeURIComponent(slide));
          bindControls();
        }
      },

      ready: function() {
        setTimeout(function() {
          window.onpopstate = function (e) {
            var state = e.state, iframe = $('iframe', pageIn())[0];
            if (state && iframe) {
              document.title = state.title;
              iframe.contentWindow.location.replace(state.path);
            } else {
              document.body.innerHTML = '';
              prepBody();
              prepPageIn(window.location.pathname);
              pageInEnd();
            }
          }
        }, 150);

        on(selector, 'click', function(e, target) {
          var
            url = target.getAttribute('data-am-url') || target.getAttribute('href'),
            animation = target.getAttribute('data-am-animation');

          if (e.metaKey) {
            window.open(url, '_blank');
          } else if (!(e.shiftKey || e.ctrlKey || e.altKey)) {
            e.preventDefault ? e.preventDefault() : e.returnValue = false;
            Pages.load(url, animation);
          }
        });
      }

    }
  };

});

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

  registerJS('!function(a){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=a();else if("function"==typeof define&&define.amd)define([],a);else{var b;"undefined"!=typeof window?b=window:"undefined"!=typeof global?b=global:"undefined"!=typeof self&&(b=self),b.html2canvas=a()}}(function(){var a;return function b(a,c,d){function e(g,h){if(!c[g]){if(!a[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module \'"+g+"\'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};a[g][0].call(k.exports,function(b){var c=a[g][1][b];return e(c?c:b)},k,k.exports,b,a,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(b,c,d){(function(b){!function(e){function f(a){throw RangeError(I[a])}function g(a,b){for(var c=a.length;c--;)a[c]=b(a[c]);return a}function h(a,b){return g(a.split(H),b).join(".")}function i(a){for(var b,c,d=[],e=0,f=a.length;e<f;)b=a.charCodeAt(e++),b>=55296&&b<=56319&&e<f?(c=a.charCodeAt(e++),56320==(64512&c)?d.push(((1023&b)<<10)+(1023&c)+65536):(d.push(b),e--)):d.push(b);return d}function j(a){return g(a,function(a){var b="";return a>65535&&(a-=65536,b+=L(a>>>10&1023|55296),a=56320|1023&a),b+=L(a)}).join("")}function k(a){return a-48<10?a-22:a-65<26?a-65:a-97<26?a-97:x}function l(a,b){return a+22+75*(a<26)-((0!=b)<<5)}function m(a,b,c){var d=0;for(a=c?K(a/B):a>>1,a+=K(a/b);a>J*z>>1;d+=x)a=K(a/J);return K(d+(J+1)*a/(a+A))}function n(a){var b,c,d,e,g,h,i,l,n,o,p=[],q=a.length,r=0,s=D,t=C;for(c=a.lastIndexOf(E),c<0&&(c=0),d=0;d<c;++d)a.charCodeAt(d)>=128&&f("not-basic"),p.push(a.charCodeAt(d));for(e=c>0?c+1:0;e<q;){for(g=r,h=1,i=x;e>=q&&f("invalid-input"),l=k(a.charCodeAt(e++)),(l>=x||l>K((w-r)/h))&&f("overflow"),r+=l*h,n=i<=t?y:i>=t+z?z:i-t,!(l<n);i+=x)o=x-n,h>K(w/o)&&f("overflow"),h*=o;b=p.length+1,t=m(r-g,b,0==g),K(r/b)>w-s&&f("overflow"),s+=K(r/b),r%=b,p.splice(r++,0,s)}return j(p)}function o(a){var b,c,d,e,g,h,j,k,n,o,p,q,r,s,t,u=[];for(a=i(a),q=a.length,b=D,c=0,g=C,h=0;h<q;++h)p=a[h],p<128&&u.push(L(p));for(d=e=u.length,e&&u.push(E);d<q;){for(j=w,h=0;h<q;++h)p=a[h],p>=b&&p<j&&(j=p);for(r=d+1,j-b>K((w-c)/r)&&f("overflow"),c+=(j-b)*r,b=j,h=0;h<q;++h)if(p=a[h],p<b&&++c>w&&f("overflow"),p==b){for(k=c,n=x;o=n<=g?y:n>=g+z?z:n-g,!(k<o);n+=x)t=k-o,s=x-o,u.push(L(l(o+t%s,0))),k=K(t/s);u.push(L(l(k,0))),g=m(c,r,d==e),c=0,++d}++c,++b}return u.join("")}function p(a){return h(a,function(a){return F.test(a)?n(a.slice(4).toLowerCase()):a})}function q(a){return h(a,function(a){return G.test(a)?"xn--"+o(a):a})}var r="object"==typeof d&&d,s="object"==typeof c&&c&&c.exports==r&&c,t="object"==typeof b&&b;t.global!==t&&t.window!==t||(e=t);var u,v,w=2147483647,x=36,y=1,z=26,A=38,B=700,C=72,D=128,E="-",F=/^xn--/,G=/[^ -~]/,H=/\\x2E|\\u3002|\\uFF0E|\\uFF61/g,I={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},J=x-y,K=Math.floor,L=String.fromCharCode;if(u={version:"1.2.4",ucs2:{decode:i,encode:j},decode:n,encode:o,toASCII:q,toUnicode:p},"function"==typeof a&&"object"==typeof a.amd&&a.amd)a("punycode",function(){return u});else if(r&&!r.nodeType)if(s)s.exports=u;else for(v in u)u.hasOwnProperty(v)&&(r[v]=u[v]);else e.punycode=u}(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],2:[function(a,b,c){function d(a,b,c){!a.defaultView||b===a.defaultView.pageXOffset&&c===a.defaultView.pageYOffset||a.defaultView.scrollTo(b,c)}function e(a,b){try{b&&(b.width=a.width,b.height=a.height,b.getContext("2d").putImageData(a.getContext("2d").getImageData(0,0,a.width,a.height),0,0))}catch(c){h("Unable to copy canvas content from",a,c)}}function f(a,b){for(var c=3===a.nodeType?document.createTextNode(a.nodeValue):a.cloneNode(!1),d=a.firstChild;d;)b!==!0&&1===d.nodeType&&"SCRIPT"===d.nodeName||c.appendChild(f(d,b)),d=d.nextSibling;return 1===a.nodeType&&(c._scrollTop=a.scrollTop,c._scrollLeft=a.scrollLeft,"CANVAS"===a.nodeName?e(a,c):"TEXTAREA"!==a.nodeName&&"SELECT"!==a.nodeName||(c.value=a.value)),c}function g(a){if(1===a.nodeType){a.scrollTop=a._scrollTop,a.scrollLeft=a._scrollLeft;for(var b=a.firstChild;b;)g(b),b=b.nextSibling}}var h=a("./log");b.exports=function(a,b,c,e,h,i,j){var k=f(a.documentElement,h.javascriptEnabled),l=b.createElement("iframe");return l.className="html2canvas-container",l.style.visibility="hidden",l.style.position="fixed",l.style.left="-10000px",l.style.top="0px",l.style.border="0",l.width=c,l.height=e,l.scrolling="no",b.body.appendChild(l),new Promise(function(b){var c=l.contentWindow.document;l.contentWindow.onload=l.onload=function(){var a=setInterval(function(){c.body.childNodes.length>0&&(g(c.documentElement),clearInterval(a),"view"===h.type&&(l.contentWindow.scrollTo(i,j),!/(iPad|iPhone|iPod)/g.test(navigator.userAgent)||l.contentWindow.scrollY===j&&l.contentWindow.scrollX===i||(c.documentElement.style.top=-j+"px",c.documentElement.style.left=-i+"px",c.documentElement.style.position="absolute")),b(l))},50)},c.open(),c.write("<!DOCTYPE html><html></html>"),d(a,i,j),c.replaceChild(c.adoptNode(k),c.documentElement),c.close()})}},{"./log":13}],3:[function(a,b,c){function d(a){this.r=0,this.g=0,this.b=0,this.a=null;this.fromArray(a)||this.namedColor(a)||this.rgb(a)||this.rgba(a)||this.hex6(a)||this.hex3(a)}d.prototype.darken=function(a){var b=1-a;return new d([Math.round(this.r*b),Math.round(this.g*b),Math.round(this.b*b),this.a])},d.prototype.isTransparent=function(){return 0===this.a},d.prototype.isBlack=function(){return 0===this.r&&0===this.g&&0===this.b},d.prototype.fromArray=function(a){return Array.isArray(a)&&(this.r=Math.min(a[0],255),this.g=Math.min(a[1],255),this.b=Math.min(a[2],255),a.length>3&&(this.a=a[3])),Array.isArray(a)};var e=/^#([a-f0-9]{3})$/i;d.prototype.hex3=function(a){var b=null;return null!==(b=a.match(e))&&(this.r=parseInt(b[1][0]+b[1][0],16),this.g=parseInt(b[1][1]+b[1][1],16),this.b=parseInt(b[1][2]+b[1][2],16)),null!==b};var f=/^#([a-f0-9]{6})$/i;d.prototype.hex6=function(a){var b=null;return null!==(b=a.match(f))&&(this.r=parseInt(b[1].substring(0,2),16),this.g=parseInt(b[1].substring(2,4),16),this.b=parseInt(b[1].substring(4,6),16)),null!==b};var g=/^rgb\\(\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*\\)$/;d.prototype.rgb=function(a){var b=null;return null!==(b=a.match(g))&&(this.r=Number(b[1]),this.g=Number(b[2]),this.b=Number(b[3])),null!==b};var h=/^rgba\\(\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*,\\s*(\\d?\\.?\\d+)\\s*\\)$/;d.prototype.rgba=function(a){var b=null;return null!==(b=a.match(h))&&(this.r=Number(b[1]),this.g=Number(b[2]),this.b=Number(b[3]),this.a=Number(b[4])),null!==b},d.prototype.toString=function(){return null!==this.a&&1!==this.a?"rgba("+[this.r,this.g,this.b,this.a].join(",")+")":"rgb("+[this.r,this.g,this.b].join(",")+")"},d.prototype.namedColor=function(a){a=a.toLowerCase();var b=i[a];if(b)this.r=b[0],this.g=b[1],this.b=b[2];else if("transparent"===a)return this.r=this.g=this.b=this.a=0,!0;return!!b},d.prototype.isColor=!0;var i={aliceblue:[240,248,255],antiquewhite:[250,235,215],aqua:[0,255,255],aquamarine:[127,255,212],azure:[240,255,255],beige:[245,245,220],bisque:[255,228,196],black:[0,0,0],blanchedalmond:[255,235,205],blue:[0,0,255],blueviolet:[138,43,226],brown:[165,42,42],burlywood:[222,184,135],cadetblue:[95,158,160],chartreuse:[127,255,0],chocolate:[210,105,30],coral:[255,127,80],cornflowerblue:[100,149,237],cornsilk:[255,248,220],crimson:[220,20,60],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgoldenrod:[184,134,11],darkgray:[169,169,169],darkgreen:[0,100,0],darkgrey:[169,169,169],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkseagreen:[143,188,143],darkslateblue:[72,61,139],darkslategray:[47,79,79],darkslategrey:[47,79,79],darkturquoise:[0,206,209],darkviolet:[148,0,211],deeppink:[255,20,147],deepskyblue:[0,191,255],dimgray:[105,105,105],dimgrey:[105,105,105],dodgerblue:[30,144,255],firebrick:[178,34,34],floralwhite:[255,250,240],forestgreen:[34,139,34],fuchsia:[255,0,255],gainsboro:[220,220,220],ghostwhite:[248,248,255],gold:[255,215,0],goldenrod:[218,165,32],gray:[128,128,128],green:[0,128,0],greenyellow:[173,255,47],grey:[128,128,128],honeydew:[240,255,240],hotpink:[255,105,180],indianred:[205,92,92],indigo:[75,0,130],ivory:[255,255,240],khaki:[240,230,140],lavender:[230,230,250],lavenderblush:[255,240,245],lawngreen:[124,252,0],lemonchiffon:[255,250,205],lightblue:[173,216,230],lightcoral:[240,128,128],lightcyan:[224,255,255],lightgoldenrodyellow:[250,250,210],lightgray:[211,211,211],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightsalmon:[255,160,122],lightseagreen:[32,178,170],lightskyblue:[135,206,250],lightslategray:[119,136,153],lightslategrey:[119,136,153],lightsteelblue:[176,196,222],lightyellow:[255,255,224],lime:[0,255,0],limegreen:[50,205,50],linen:[250,240,230],magenta:[255,0,255],maroon:[128,0,0],mediumaquamarine:[102,205,170],mediumblue:[0,0,205],mediumorchid:[186,85,211],mediumpurple:[147,112,219],mediumseagreen:[60,179,113],mediumslateblue:[123,104,238],mediumspringgreen:[0,250,154],mediumturquoise:[72,209,204],mediumvioletred:[199,21,133],midnightblue:[25,25,112],mintcream:[245,255,250],mistyrose:[255,228,225],moccasin:[255,228,181],navajowhite:[255,222,173],navy:[0,0,128],oldlace:[253,245,230],olive:[128,128,0],olivedrab:[107,142,35],orange:[255,165,0],orangered:[255,69,0],orchid:[218,112,214],palegoldenrod:[238,232,170],palegreen:[152,251,152],paleturquoise:[175,238,238],palevioletred:[219,112,147],papayawhip:[255,239,213],peachpuff:[255,218,185],peru:[205,133,63],pink:[255,192,203],plum:[221,160,221],powderblue:[176,224,230],purple:[128,0,128],rebeccapurple:[102,51,153],red:[255,0,0],rosybrown:[188,143,143],royalblue:[65,105,225],saddlebrown:[139,69,19],salmon:[250,128,114],sandybrown:[244,164,96],seagreen:[46,139,87],seashell:[255,245,238],sienna:[160,82,45],silver:[192,192,192],skyblue:[135,206,235],slateblue:[106,90,205],slategray:[112,128,144],slategrey:[112,128,144],snow:[255,250,250],springgreen:[0,255,127],steelblue:[70,130,180],tan:[210,180,140],teal:[0,128,128],thistle:[216,191,216],tomato:[255,99,71],turquoise:[64,224,208],violet:[238,130,238],wheat:[245,222,179],white:[255,255,255],whitesmoke:[245,245,245],yellow:[255,255,0],yellowgreen:[154,205,50]};b.exports=d},{}],4:[function(b,c,d){function e(a,b){var c=x++;if(b=b||{},b.logging&&(r.options.logging=!0,r.options.start=Date.now()),b.async="undefined"==typeof b.async||b.async,b.allowTaint="undefined"!=typeof b.allowTaint&&b.allowTaint,b.removeContainer="undefined"==typeof b.removeContainer||b.removeContainer,b.javascriptEnabled="undefined"!=typeof b.javascriptEnabled&&b.javascriptEnabled,b.imageTimeout="undefined"==typeof b.imageTimeout?1e4:b.imageTimeout,b.renderer="function"==typeof b.renderer?b.renderer:n,b.strict=!!b.strict,"string"==typeof a){if("string"!=typeof b.proxy)return Promise.reject("Proxy must be used when rendering url");var d=null!=b.width?b.width:window.innerWidth,e=null!=b.height?b.height:window.innerHeight;return u(l(a),b.proxy,document,d,e,b).then(function(a){return g(a.contentWindow.document.documentElement,a,b,d,e)})}var h=(void 0===a?[document.documentElement]:a.length?a:[a])[0];return h.setAttribute(w+c,c),f(h.ownerDocument,b,h.ownerDocument.defaultView.innerWidth,h.ownerDocument.defaultView.innerHeight,c).then(function(a){return"function"==typeof b.onrendered&&(r("options.onrendered is deprecated, html2canvas returns a Promise containing the canvas"),b.onrendered(a)),a})}function f(a,b,c,d,e){return t(a,a,c,d,b,a.defaultView.pageXOffset,a.defaultView.pageYOffset).then(function(f){r("Document cloned");var h=w+e,i="["+h+"=\'"+e+"\']";a.querySelector(i).removeAttribute(h);var j=f.contentWindow,k=j.document.querySelector(i),l="function"==typeof b.onclone?Promise.resolve(b.onclone(j.document)):Promise.resolve(!0);return l.then(function(){return g(k,f,b,c,d)})})}function g(a,b,c,d,e){var f=b.contentWindow,g=new m(f.document),l=new o(c,g),n=v(a),q="view"===c.type?d:j(f.document),s="view"===c.type?e:k(f.document),t=new c.renderer(q,s,l,c,document),u=new p(a,t,g,l,c);return u.ready.then(function(){r("Finished rendering");var d;return d="view"===c.type?i(t.canvas,{width:t.canvas.width,height:t.canvas.height,top:0,left:0,x:0,y:0}):a===f.document.body||a===f.document.documentElement||null!=c.canvas?t.canvas:i(t.canvas,{width:null!=c.width?c.width:n.width,height:null!=c.height?c.height:n.height,top:n.top,left:n.left,x:0,y:0}),h(b,c),d})}function h(a,b){b.removeContainer&&(a.parentNode.removeChild(a),r("Cleaned up container"))}function i(a,b){var c=document.createElement("canvas"),d=Math.min(a.width-1,Math.max(0,b.left)),e=Math.min(a.width,Math.max(1,b.left+b.width)),f=Math.min(a.height-1,Math.max(0,b.top)),g=Math.min(a.height,Math.max(1,b.top+b.height));c.width=b.width,c.height=b.height;var h=e-d,i=g-f;return r("Cropping canvas at:","left:",b.left,"top:",b.top,"width:",h,"height:",i),r("Resulting crop with width",b.width,"and height",b.height,"with x",d,"and y",f),c.getContext("2d").drawImage(a,d,f,h,i,b.x,b.y,h,i),c}function j(a){return Math.max(Math.max(a.body.scrollWidth,a.documentElement.scrollWidth),Math.max(a.body.offsetWidth,a.documentElement.offsetWidth),Math.max(a.body.clientWidth,a.documentElement.clientWidth))}function k(a){return Math.max(Math.max(a.body.scrollHeight,a.documentElement.scrollHeight),Math.max(a.body.offsetHeight,a.documentElement.offsetHeight),Math.max(a.body.clientHeight,a.documentElement.clientHeight))}function l(a){var b=document.createElement("a");return b.href=a,b.href=b.href,b}var m=b("./support"),n=b("./renderers/canvas"),o=b("./imageloader"),p=b("./nodeparser"),q=b("./nodecontainer"),r=b("./log"),s=b("./utils"),t=b("./clone"),u=b("./proxy").loadUrlDocument,v=s.getBounds,w="data-html2canvas-node",x=0;e.CanvasRenderer=n,e.NodeContainer=q,e.log=r,e.utils=s;var y="undefined"==typeof document||"function"!=typeof Object.create||"function"!=typeof document.createElement("canvas").getContext?function(){return Promise.reject("No canvas support")}:e;c.exports=y,"function"==typeof a&&a.amd&&a("html2canvas",[],function(){return y})},{"./clone":2,"./imageloader":11,"./log":13,"./nodecontainer":14,"./nodeparser":15,"./proxy":16,"./renderers/canvas":20,"./support":22,"./utils":26}],5:[function(a,b,c){function d(a){if(this.src=a,e("DummyImageContainer for",a),!this.promise||!this.image){e("Initiating DummyImageContainer"),d.prototype.image=new Image;var b=this.image;d.prototype.promise=new Promise(function(a,c){b.onload=a,b.onerror=c,b.src=f(),b.complete===!0&&a(b)})}}var e=a("./log"),f=a("./utils").smallImage;b.exports=d},{"./log":13,"./utils":26}],6:[function(a,b,c){function d(a,b){var c,d,f=document.createElement("div"),g=document.createElement("img"),h=document.createElement("span"),i="Hidden Text";f.style.visibility="hidden",f.style.fontFamily=a,f.style.fontSize=b,f.style.margin=0,f.style.padding=0,document.body.appendChild(f),g.src=e(),g.width=1,g.height=1,g.style.margin=0,g.style.padding=0,g.style.verticalAlign="baseline",h.style.fontFamily=a,h.style.fontSize=b,h.style.margin=0,h.style.padding=0,h.appendChild(document.createTextNode(i)),f.appendChild(h),f.appendChild(g),c=g.offsetTop-h.offsetTop+1,f.removeChild(h),f.appendChild(document.createTextNode(i)),f.style.lineHeight="normal",g.style.verticalAlign="super",d=g.offsetTop-f.offsetTop+1,document.body.removeChild(f),this.baseline=c,this.lineWidth=1,this.middle=d}var e=a("./utils").smallImage;b.exports=d},{"./utils":26}],7:[function(a,b,c){function d(){this.data={}}var e=a("./font");d.prototype.getMetrics=function(a,b){return void 0===this.data[a+"-"+b]&&(this.data[a+"-"+b]=new e(a,b)),this.data[a+"-"+b]},b.exports=d},{"./font":6}],8:[function(a,b,c){function d(b,c,d){this.image=null,this.src=b;var e=this,g=f(b);this.promise=(c?new Promise(function(a){"about:blank"===b.contentWindow.document.URL||null==b.contentWindow.document.documentElement?b.contentWindow.onload=b.onload=function(){a(b)}:a(b)}):this.proxyLoad(d.proxy,g,d)).then(function(b){var c=a("./core");return c(b.contentWindow.document.documentElement,{type:"view",width:b.width,height:b.height,proxy:d.proxy,javascriptEnabled:d.javascriptEnabled,removeContainer:d.removeContainer,allowTaint:d.allowTaint,imageTimeout:d.imageTimeout/2})}).then(function(a){return e.image=a})}var e=a("./utils"),f=e.getBounds,g=a("./proxy").loadUrlDocument;d.prototype.proxyLoad=function(a,b,c){var d=this.src;return g(d.src,a,d.ownerDocument,b.width,b.height,c)},b.exports=d},{"./core":4,"./proxy":16,"./utils":26}],9:[function(a,b,c){function d(a){this.src=a.value,this.colorStops=[],this.type=null,this.x0=.5,this.y0=.5,this.x1=.5,this.y1=.5,this.promise=Promise.resolve(!0)}d.TYPES={LINEAR:1,RADIAL:2},d.REGEXP_COLORSTOP=/^\\s*(rgba?\\(\\s*\\d{1,3},\\s*\\d{1,3},\\s*\\d{1,3}(?:,\\s*[0-9\\.]+)?\\s*\\)|[a-z]{3,20}|#[a-f0-9]{3,6})(?:\\s+(\\d{1,3}(?:\\.\\d+)?)(%|px)?)?(?:\\s|$)/i,b.exports=d},{}],10:[function(a,b,c){function d(a,b){this.src=a,this.image=new Image;var c=this;this.tainted=null,this.promise=new Promise(function(d,e){c.image.onload=d,c.image.onerror=e,b&&(c.image.crossOrigin="anonymous"),c.image.src=a,c.image.complete===!0&&d(c.image)})}b.exports=d},{}],11:[function(a,b,c){function d(a,b){this.link=null,this.options=a,this.support=b,this.origin=this.getOrigin(window.location.href)}var e=a("./log"),f=a("./imagecontainer"),g=a("./dummyimagecontainer"),h=a("./proxyimagecontainer"),i=a("./framecontainer"),j=a("./svgcontainer"),k=a("./svgnodecontainer"),l=a("./lineargradientcontainer"),m=a("./webkitgradientcontainer"),n=a("./utils").bind;d.prototype.findImages=function(a){var b=[];return a.reduce(function(a,b){switch(b.node.nodeName){case"IMG":return a.concat([{args:[b.node.src],method:"url"}]);case"svg":case"IFRAME":return a.concat([{args:[b.node],method:b.node.nodeName}])}return a},[]).forEach(this.addImage(b,this.loadImage),this),b},d.prototype.findBackgroundImage=function(a,b){return b.parseBackgroundImages().filter(this.hasImageBackground).forEach(this.addImage(a,this.loadImage),this),a},d.prototype.addImage=function(a,b){return function(c){c.args.forEach(function(d){this.imageExists(a,d)||(a.splice(0,0,b.call(this,c)),e("Added image #"+a.length,"string"==typeof d?d.substring(0,100):d))},this)}},d.prototype.hasImageBackground=function(a){return"none"!==a.method},d.prototype.loadImage=function(a){if("url"===a.method){var b=a.args[0];return!this.isSVG(b)||this.support.svg||this.options.allowTaint?b.match(/data:image\\/.*;base64,/i)?new f(b.replace(/url\\([\'"]{0,}|[\'"]{0,}\\)$/gi,""),(!1)):this.isSameOrigin(b)||this.options.allowTaint===!0||this.isSVG(b)?new f(b,(!1)):this.support.cors&&!this.options.allowTaint&&this.options.useCORS?new f(b,(!0)):this.options.proxy?new h(b,this.options.proxy):new g(b):new j(b)}return"linear-gradient"===a.method?new l(a):"gradient"===a.method?new m(a):"svg"===a.method?new k(a.args[0],this.support.svg):"IFRAME"===a.method?new i(a.args[0],this.isSameOrigin(a.args[0].src),this.options):new g(a)},d.prototype.isSVG=function(a){return"svg"===a.substring(a.length-3).toLowerCase()||j.prototype.isInline(a)},d.prototype.imageExists=function(a,b){return a.some(function(a){return a.src===b})},d.prototype.isSameOrigin=function(a){return this.getOrigin(a)===this.origin},d.prototype.getOrigin=function(a){var b=this.link||(this.link=document.createElement("a"));return b.href=a,b.href=b.href,b.protocol+b.hostname+b.port},d.prototype.getPromise=function(a){return this.timeout(a,this.options.imageTimeout)["catch"](function(){var b=new g(a.src);return b.promise.then(function(b){a.image=b})})},d.prototype.get=function(a){var b=null;return this.images.some(function(c){return(b=c).src===a})?b:null},d.prototype.fetch=function(a){return this.images=a.reduce(n(this.findBackgroundImage,this),this.findImages(a)),this.images.forEach(function(a,b){a.promise.then(function(){e("Succesfully loaded image #"+(b+1),a)},function(c){e("Failed loading image #"+(b+1),a,c)})}),this.ready=Promise.all(this.images.map(this.getPromise,this)),e("Finished searching images"),this},d.prototype.timeout=function(a,b){var c,d=Promise.race([a.promise,new Promise(function(d,f){c=setTimeout(function(){e("Timed out loading image",a),f(a)},b)})]).then(function(a){return clearTimeout(c),a});return d["catch"](function(){clearTimeout(c)}),d},b.exports=d},{"./dummyimagecontainer":5,"./framecontainer":8,"./imagecontainer":10,"./lineargradientcontainer":12,"./log":13,"./proxyimagecontainer":17,"./svgcontainer":23,"./svgnodecontainer":24,"./utils":26,"./webkitgradientcontainer":27}],12:[function(a,b,c){function d(a){e.apply(this,arguments),this.type=e.TYPES.LINEAR;var b=d.REGEXP_DIRECTION.test(a.args[0])||!e.REGEXP_COLORSTOP.test(a.args[0]);b?a.args[0].split(/\\s+/).reverse().forEach(function(a,b){switch(a){case"left":this.x0=0,this.x1=1;break;case"top":this.y0=0,this.y1=1;break;case"right":this.x0=1,this.x1=0;break;case"bottom":this.y0=1,this.y1=0;break;case"to":var c=this.y0,d=this.x0;this.y0=this.y1,this.x0=this.x1,this.x1=d,this.y1=c;break;case"center":break;default:var e=.01*parseFloat(a,10);if(isNaN(e))break;0===b?(this.y0=e,this.y1=1-this.y0):(this.x0=e,this.x1=1-this.x0)}},this):(this.y0=0,this.y1=1),this.colorStops=a.args.slice(b?1:0).map(function(a){var b=a.match(e.REGEXP_COLORSTOP),c=+b[2],d=0===c?"%":b[3];return{color:new f(b[1]),stop:"%"===d?c/100:null}}),null===this.colorStops[0].stop&&(this.colorStops[0].stop=0),null===this.colorStops[this.colorStops.length-1].stop&&(this.colorStops[this.colorStops.length-1].stop=1),this.colorStops.forEach(function(a,b){null===a.stop&&this.colorStops.slice(b).some(function(c,d){return null!==c.stop&&(a.stop=(c.stop-this.colorStops[b-1].stop)/(d+1)+this.colorStops[b-1].stop,!0)},this)},this)}var e=a("./gradientcontainer"),f=a("./color");d.prototype=Object.create(e.prototype),d.REGEXP_DIRECTION=/^\\s*(?:to|left|right|top|bottom|center|\\d{1,3}(?:\\.\\d+)?%?)(?:\\s|$)/i,b.exports=d},{"./color":3,"./gradientcontainer":9}],13:[function(a,b,c){var d=function(){d.options.logging&&window.console&&window.console.log&&Function.prototype.bind.call(window.console.log,window.console).apply(window.console,[Date.now()-d.options.start+"ms","html2canvas:"].concat([].slice.call(arguments,0)))};d.options={logging:!1},b.exports=d},{}],14:[function(a,b,c){function d(a,b){this.node=a,this.parent=b,this.stack=null,this.bounds=null,this.borders=null,this.clip=[],this.backgroundClip=[],this.offsetBounds=null,this.visible=null,this.computedStyles=null,this.colors={},this.styles={},this.backgroundImages=null,this.transformData=null,this.transformMatrix=null,this.isPseudoElement=!1,this.opacity=null}function e(a){var b=a.options[a.selectedIndex||0];return b?b.text||"":""}function f(a){if(a&&"matrix"===a[1])return a[2].split(",").map(function(a){return parseFloat(a.trim())});if(a&&"matrix3d"===a[1]){var b=a[2].split(",").map(function(a){return parseFloat(a.trim())});return[b[0],b[1],b[4],b[5],b[12],b[13]]}}function g(a){return a.toString().indexOf("%")!==-1}function h(a){return a.replace("px","")}function i(a){return parseFloat(a)}var j=a("./color"),k=a("./utils"),l=k.getBounds,m=k.parseBackgrounds,n=k.offsetBounds;d.prototype.cloneTo=function(a){a.visible=this.visible,a.borders=this.borders,a.bounds=this.bounds,a.clip=this.clip,a.backgroundClip=this.backgroundClip,a.computedStyles=this.computedStyles,a.styles=this.styles,a.backgroundImages=this.backgroundImages,a.opacity=this.opacity},d.prototype.getOpacity=function(){return null===this.opacity?this.opacity=this.cssFloat("opacity"):this.opacity},d.prototype.assignStack=function(a){this.stack=a,a.children.push(this)},d.prototype.isElementVisible=function(){return this.node.nodeType===Node.TEXT_NODE?this.parent.visible:"none"!==this.css("display")&&"hidden"!==this.css("visibility")&&!this.node.hasAttribute("data-html2canvas-ignore")&&("INPUT"!==this.node.nodeName||"hidden"!==this.node.getAttribute("type"))},d.prototype.css=function(a){return this.computedStyles||(this.computedStyles=this.isPseudoElement?this.parent.computedStyle(this.before?":before":":after"):this.computedStyle(null)),this.styles[a]||(this.styles[a]=this.computedStyles[a])},d.prototype.prefixedCss=function(a){var b=["webkit","moz","ms","o"],c=this.css(a);return void 0===c&&b.some(function(b){return c=this.css(b+a.substr(0,1).toUpperCase()+a.substr(1)),void 0!==c},this),void 0===c?null:c},d.prototype.computedStyle=function(a){return this.node.ownerDocument.defaultView.getComputedStyle(this.node,a)},d.prototype.cssInt=function(a){var b=parseInt(this.css(a),10);return isNaN(b)?0:b},d.prototype.color=function(a){return this.colors[a]||(this.colors[a]=new j(this.css(a)))},d.prototype.cssFloat=function(a){var b=parseFloat(this.css(a));return isNaN(b)?0:b},d.prototype.fontWeight=function(){var a=this.css("fontWeight");switch(parseInt(a,10)){case 401:a="bold";break;case 400:a="normal"}return a},d.prototype.parseClip=function(){var a=this.css("clip").match(this.CLIP);return a?{top:parseInt(a[1],10),right:parseInt(a[2],10),bottom:parseInt(a[3],10),left:parseInt(a[4],10)}:null},d.prototype.parseBackgroundImages=function(){return this.backgroundImages||(this.backgroundImages=m(this.css("backgroundImage")))},d.prototype.cssList=function(a,b){var c=(this.css(a)||"").split(",");return c=c[b||0]||c[0]||"auto",c=c.trim().split(" "),1===c.length&&(c=[c[0],g(c[0])?"auto":c[0]]),c},d.prototype.parseBackgroundSize=function(a,b,c){var d,e,f=this.cssList("backgroundSize",c);if(g(f[0]))d=a.width*parseFloat(f[0])/100;else{if(/contain|cover/.test(f[0])){var h=a.width/a.height,i=b.width/b.height;return h<i^"contain"===f[0]?{width:a.height*i,height:a.height}:{width:a.width,height:a.width/i}}d=parseInt(f[0],10)}return e="auto"===f[0]&&"auto"===f[1]?b.height:"auto"===f[1]?d/b.width*b.height:g(f[1])?a.height*parseFloat(f[1])/100:parseInt(f[1],10),"auto"===f[0]&&(d=e/b.height*b.width),{width:d,height:e}},d.prototype.parseBackgroundPosition=function(a,b,c,d){var e,f,h=this.cssList("backgroundPosition",c);return e=g(h[0])?(a.width-(d||b).width)*(parseFloat(h[0])/100):parseInt(h[0],10),f="auto"===h[1]?e/b.width*b.height:g(h[1])?(a.height-(d||b).height)*parseFloat(h[1])/100:parseInt(h[1],10),"auto"===h[0]&&(e=f/b.height*b.width),{left:e,top:f}},d.prototype.parseBackgroundRepeat=function(a){return this.cssList("backgroundRepeat",a)[0]},d.prototype.parseTextShadows=function(){var a=this.css("textShadow"),b=[];if(a&&"none"!==a)for(var c=a.match(this.TEXT_SHADOW_PROPERTY),d=0;c&&d<c.length;d++){var e=c[d].match(this.TEXT_SHADOW_VALUES);b.push({color:new j(e[0]),offsetX:e[1]?parseFloat(e[1].replace("px","")):0,offsetY:e[2]?parseFloat(e[2].replace("px","")):0,blur:e[3]?e[3].replace("px",""):0})}return b},d.prototype.parseTransform=function(){if(!this.transformData)if(this.hasTransform()){var a=this.parseBounds(),b=this.prefixedCss("transformOrigin").split(" ").map(h).map(i);b[0]+=a.left,b[1]+=a.top,this.transformData={origin:b,matrix:this.parseTransformMatrix()}}else this.transformData={origin:[0,0],matrix:[1,0,0,1,0,0]};return this.transformData},d.prototype.parseTransformMatrix=function(){if(!this.transformMatrix){var a=this.prefixedCss("transform"),b=a?f(a.match(this.MATRIX_PROPERTY)):null;this.transformMatrix=b?b:[1,0,0,1,0,0]}return this.transformMatrix},d.prototype.parseBounds=function(){return this.bounds||(this.bounds=this.hasTransform()?n(this.node):l(this.node))},d.prototype.hasTransform=function(){return"1,0,0,1,0,0"!==this.parseTransformMatrix().join(",")||this.parent&&this.parent.hasTransform()},d.prototype.getValue=function(){var a=this.node.value||"";return"SELECT"===this.node.tagName?a=e(this.node):"password"===this.node.type&&(a=Array(a.length+1).join("•")),0===a.length?this.node.placeholder||"":a},d.prototype.MATRIX_PROPERTY=/(matrix|matrix3d)\\((.+)\\)/,d.prototype.TEXT_SHADOW_PROPERTY=/((rgba|rgb)\\([^\\)]+\\)(\\s-?\\d+px){0,})/g,d.prototype.TEXT_SHADOW_VALUES=/(-?\\d+px)|(#.+)|(rgb\\(.+\\))|(rgba\\(.+\\))/g,d.prototype.CLIP=/^rect\\((\\d+)px,? (\\d+)px,? (\\d+)px,? (\\d+)px\\)$/,b.exports=d},{"./color":3,"./utils":26}],15:[function(a,b,c){function d(a,b,c,d,e){O("Starting NodeParser"),this.renderer=b,this.options=e,this.range=null,this.support=c,this.renderQueue=[],this.stack=new V((!0),1,a.ownerDocument,null);var f=new Q(a,null);if(e.background&&b.rectangle(0,0,b.width,b.height,new U(e.background)),a===a.ownerDocument.documentElement){var g=new Q(f.color("backgroundColor").isTransparent()?a.ownerDocument.body:a.ownerDocument.documentElement,null);b.rectangle(0,0,b.width,b.height,g.color("backgroundColor"))}f.visibile=f.isElementVisible(),this.createPseudoHideStyles(a.ownerDocument),this.disableAnimations(a.ownerDocument),this.nodes=J([f].concat(this.getChildren(f)).filter(function(a){return a.visible=a.isElementVisible()}).map(this.getPseudoElements,this)),this.fontMetrics=new T,O("Fetched nodes, total:",this.nodes.length),O("Calculate overflow clips"),this.calculateOverflowClips(),O("Start fetching images"),this.images=d.fetch(this.nodes.filter(B)),this.ready=this.images.ready.then(X(function(){return O("Images loaded, starting parsing"),O("Creating stacking contexts"),this.createStackingContexts(),O("Sorting stacking contexts"),this.sortStackingContexts(this.stack),this.parse(this.stack),O("Render queue created with "+this.renderQueue.length+" items"),new Promise(X(function(a){e.async?"function"==typeof e.async?e.async.call(this,this.renderQueue,a):this.renderQueue.length>0?(this.renderIndex=0,this.asyncRenderer(this.renderQueue,a)):a():(this.renderQueue.forEach(this.paint,this),a())},this))},this))}function e(a){return a.parent&&a.parent.clip.length}function f(a){return a.replace(/(\\-[a-z])/g,function(a){return a.toUpperCase().replace("-","")})}function g(){}function h(a,b,c,d){return a.map(function(e,f){if(e.width>0){var g=b.left,h=b.top,i=b.width,j=b.height-a[2].width;switch(f){case 0:j=a[0].width,e.args=l({c1:[g,h],c2:[g+i,h],c3:[g+i-a[1].width,h+j],c4:[g+a[3].width,h+j]},d[0],d[1],c.topLeftOuter,c.topLeftInner,c.topRightOuter,c.topRightInner);break;case 1:g=b.left+b.width-a[1].width,i=a[1].width,e.args=l({c1:[g+i,h],c2:[g+i,h+j+a[2].width],c3:[g,h+j],c4:[g,h+a[0].width]},d[1],d[2],c.topRightOuter,c.topRightInner,c.bottomRightOuter,c.bottomRightInner);break;case 2:h=h+b.height-a[2].width,j=a[2].width,e.args=l({c1:[g+i,h+j],c2:[g,h+j],c3:[g+a[3].width,h],c4:[g+i-a[3].width,h]},d[2],d[3],c.bottomRightOuter,c.bottomRightInner,c.bottomLeftOuter,c.bottomLeftInner);break;case 3:i=a[3].width,e.args=l({c1:[g,h+j+a[2].width],c2:[g,h],c3:[g+i,h+a[0].width],c4:[g+i,h+j]},d[3],d[0],c.bottomLeftOuter,c.bottomLeftInner,c.topLeftOuter,c.topLeftInner)}}return e})}function i(a,b,c,d){var e=4*((Math.sqrt(2)-1)/3),f=c*e,g=d*e,h=a+c,i=b+d;return{topLeft:k({x:a,y:i},{x:a,y:i-g},{x:h-f,y:b},{x:h,y:b}),topRight:k({x:a,y:b},{x:a+f,y:b},{x:h,y:i-g},{x:h,y:i}),bottomRight:k({x:h,y:b},{x:h,y:b+g},{x:a+f,y:i},{x:a,y:i}),bottomLeft:k({x:h,y:i},{x:h-f,y:i},{x:a,y:b+g},{x:a,y:b})}}function j(a,b,c){var d=a.left,e=a.top,f=a.width,g=a.height,h=b[0][0]<f/2?b[0][0]:f/2,j=b[0][1]<g/2?b[0][1]:g/2,k=b[1][0]<f/2?b[1][0]:f/2,l=b[1][1]<g/2?b[1][1]:g/2,m=b[2][0]<f/2?b[2][0]:f/2,n=b[2][1]<g/2?b[2][1]:g/2,o=b[3][0]<f/2?b[3][0]:f/2,p=b[3][1]<g/2?b[3][1]:g/2,q=f-k,r=g-n,s=f-m,t=g-p;return{topLeftOuter:i(d,e,h,j).topLeft.subdivide(.5),topLeftInner:i(d+c[3].width,e+c[0].width,Math.max(0,h-c[3].width),Math.max(0,j-c[0].width)).topLeft.subdivide(.5),topRightOuter:i(d+q,e,k,l).topRight.subdivide(.5),topRightInner:i(d+Math.min(q,f+c[3].width),e+c[0].width,q>f+c[3].width?0:k-c[3].width,l-c[0].width).topRight.subdivide(.5),bottomRightOuter:i(d+s,e+r,m,n).bottomRight.subdivide(.5),bottomRightInner:i(d+Math.min(s,f-c[3].width),e+Math.min(r,g+c[0].width),Math.max(0,m-c[1].width),n-c[2].width).bottomRight.subdivide(.5),bottomLeftOuter:i(d,e+t,o,p).bottomLeft.subdivide(.5),\nbottomLeftInner:i(d+c[3].width,e+t,Math.max(0,o-c[3].width),p-c[2].width).bottomLeft.subdivide(.5)}}function k(a,b,c,d){var e=function(a,b,c){return{x:a.x+(b.x-a.x)*c,y:a.y+(b.y-a.y)*c}};return{start:a,startControl:b,endControl:c,end:d,subdivide:function(f){var g=e(a,b,f),h=e(b,c,f),i=e(c,d,f),j=e(g,h,f),l=e(h,i,f),m=e(j,l,f);return[k(a,g,j,m),k(m,l,i,d)]},curveTo:function(a){a.push(["bezierCurve",b.x,b.y,c.x,c.y,d.x,d.y])},curveToReversed:function(d){d.push(["bezierCurve",c.x,c.y,b.x,b.y,a.x,a.y])}}}function l(a,b,c,d,e,f,g){var h=[];return b[0]>0||b[1]>0?(h.push(["line",d[1].start.x,d[1].start.y]),d[1].curveTo(h)):h.push(["line",a.c1[0],a.c1[1]]),c[0]>0||c[1]>0?(h.push(["line",f[0].start.x,f[0].start.y]),f[0].curveTo(h),h.push(["line",g[0].end.x,g[0].end.y]),g[0].curveToReversed(h)):(h.push(["line",a.c2[0],a.c2[1]]),h.push(["line",a.c3[0],a.c3[1]])),b[0]>0||b[1]>0?(h.push(["line",e[1].end.x,e[1].end.y]),e[1].curveToReversed(h)):h.push(["line",a.c4[0],a.c4[1]]),h}function m(a,b,c,d,e,f,g){b[0]>0||b[1]>0?(a.push(["line",d[0].start.x,d[0].start.y]),d[0].curveTo(a),d[1].curveTo(a)):a.push(["line",f,g]),(c[0]>0||c[1]>0)&&a.push(["line",e[0].start.x,e[0].start.y])}function n(a){return a.cssInt("zIndex")<0}function o(a){return a.cssInt("zIndex")>0}function p(a){return 0===a.cssInt("zIndex")}function q(a){return["inline","inline-block","inline-table"].indexOf(a.css("display"))!==-1}function r(a){return a instanceof V}function s(a){return a.node.data.trim().length>0}function t(a){return/^(normal|none|0px)$/.test(a.parent.css("letterSpacing"))}function u(a){return["TopLeft","TopRight","BottomRight","BottomLeft"].map(function(b){var c=a.css("border"+b+"Radius"),d=c.split(" ");return d.length<=1&&(d[1]=d[0]),d.map(G)})}function v(a){return a.nodeType===Node.TEXT_NODE||a.nodeType===Node.ELEMENT_NODE}function w(a){var b=a.css("position"),c=["absolute","relative","fixed"].indexOf(b)!==-1?a.css("zIndex"):"auto";return"auto"!==c}function x(a){return"static"!==a.css("position")}function y(a){return"none"!==a.css("float")}function z(a){return["inline-block","inline-table"].indexOf(a.css("display"))!==-1}function A(a){var b=this;return function(){return!a.apply(b,arguments)}}function B(a){return a.node.nodeType===Node.ELEMENT_NODE}function C(a){return a.isPseudoElement===!0}function D(a){return a.node.nodeType===Node.TEXT_NODE}function E(a){return function(b,c){return b.cssInt("zIndex")+a.indexOf(b)/a.length-(c.cssInt("zIndex")+a.indexOf(c)/a.length)}}function F(a){return a.getOpacity()<1}function G(a){return parseInt(a,10)}function H(a){return a.width}function I(a){return a.node.nodeType!==Node.ELEMENT_NODE||["SCRIPT","HEAD","TITLE","OBJECT","BR","OPTION"].indexOf(a.node.nodeName)===-1}function J(a){return[].concat.apply([],a)}function K(a){var b=a.substr(0,1);return b===a.substr(a.length-1)&&b.match(/\'|"/)?a.substr(1,a.length-2):a}function L(a){for(var b,c=[],d=0,e=!1;a.length;)M(a[d])===e?(b=a.splice(0,d),b.length&&c.push(P.ucs2.encode(b)),e=!e,d=0):d++,d>=a.length&&(b=a.splice(0,d),b.length&&c.push(P.ucs2.encode(b)));return c}function M(a){return[32,13,10,9,45].indexOf(a)!==-1}function N(a){return/[^\\u0000-\\u00ff]/.test(a)}var O=a("./log"),P=a("punycode"),Q=a("./nodecontainer"),R=a("./textcontainer"),S=a("./pseudoelementcontainer"),T=a("./fontmetrics"),U=a("./color"),V=a("./stackingcontext"),W=a("./utils"),X=W.bind,Y=W.getBounds,Z=W.parseBackgrounds,$=W.offsetBounds;d.prototype.calculateOverflowClips=function(){this.nodes.forEach(function(a){if(B(a)){C(a)&&a.appendToDOM(),a.borders=this.parseBorders(a);var b="hidden"===a.css("overflow")?[a.borders.clip]:[],c=a.parseClip();c&&["absolute","fixed"].indexOf(a.css("position"))!==-1&&b.push([["rect",a.bounds.left+c.left,a.bounds.top+c.top,c.right-c.left,c.bottom-c.top]]),a.clip=e(a)?a.parent.clip.concat(b):b,a.backgroundClip="hidden"!==a.css("overflow")?a.clip.concat([a.borders.clip]):a.clip,C(a)&&a.cleanDOM()}else D(a)&&(a.clip=e(a)?a.parent.clip:[]);C(a)||(a.bounds=null)},this)},d.prototype.asyncRenderer=function(a,b,c){c=c||Date.now(),this.paint(a[this.renderIndex++]),a.length===this.renderIndex?b():c+20>Date.now()?this.asyncRenderer(a,b,c):setTimeout(X(function(){this.asyncRenderer(a,b)},this),0)},d.prototype.createPseudoHideStyles=function(a){this.createStyles(a,"."+S.prototype.PSEUDO_HIDE_ELEMENT_CLASS_BEFORE+\':before { content: "" !important; display: none !important; }.\'+S.prototype.PSEUDO_HIDE_ELEMENT_CLASS_AFTER+\':after { content: "" !important; display: none !important; }\')},d.prototype.disableAnimations=function(a){this.createStyles(a,"* { -webkit-animation: none !important; -moz-animation: none !important; -o-animation: none !important; animation: none !important; -webkit-transition: none !important; -moz-transition: none !important; -o-transition: none !important; transition: none !important;}")},d.prototype.createStyles=function(a,b){var c=a.createElement("style");c.innerHTML=b,a.body.appendChild(c)},d.prototype.getPseudoElements=function(a){var b=[[a]];if(a.node.nodeType===Node.ELEMENT_NODE){var c=this.getPseudoElement(a,":before"),d=this.getPseudoElement(a,":after");c&&b.push(c),d&&b.push(d)}return J(b)},d.prototype.getPseudoElement=function(a,b){var c=a.computedStyle(b);if(!c||!c.content||"none"===c.content||"-moz-alt-content"===c.content||"none"===c.display)return null;for(var d=K(c.content),e="url"===d.substr(0,3),g=document.createElement(e?"img":"html2canvaspseudoelement"),h=new S(g,a,b),i=c.length-1;i>=0;i--){var j=f(c.item(i));g.style[j]=c[j]}if(g.className=S.prototype.PSEUDO_HIDE_ELEMENT_CLASS_BEFORE+" "+S.prototype.PSEUDO_HIDE_ELEMENT_CLASS_AFTER,e)return g.src=Z(d)[0].args[0],[h];var k=document.createTextNode(d);return g.appendChild(k),[h,new R(k,h)]},d.prototype.getChildren=function(a){return J([].filter.call(a.node.childNodes,v).map(function(b){var c=[b.nodeType===Node.TEXT_NODE?new R(b,a):new Q(b,a)].filter(I);return b.nodeType===Node.ELEMENT_NODE&&c.length&&"TEXTAREA"!==b.tagName?c[0].isElementVisible()?c.concat(this.getChildren(c[0])):[]:c},this))},d.prototype.newStackingContext=function(a,b){var c=new V(b,a.getOpacity(),a.node,a.parent);a.cloneTo(c);var d=b?c.getParentStack(this):c.parent.stack;d.contexts.push(c),a.stack=c},d.prototype.createStackingContexts=function(){this.nodes.forEach(function(a){B(a)&&(this.isRootElement(a)||F(a)||w(a)||this.isBodyWithTransparentRoot(a)||a.hasTransform())?this.newStackingContext(a,!0):B(a)&&(x(a)&&p(a)||z(a)||y(a))?this.newStackingContext(a,!1):a.assignStack(a.parent.stack)},this)},d.prototype.isBodyWithTransparentRoot=function(a){return"BODY"===a.node.nodeName&&a.parent.color("backgroundColor").isTransparent()},d.prototype.isRootElement=function(a){return null===a.parent},d.prototype.sortStackingContexts=function(a){a.contexts.sort(E(a.contexts.slice(0))),a.contexts.forEach(this.sortStackingContexts,this)},d.prototype.parseTextBounds=function(a){return function(b,c,d){if("none"!==a.parent.css("textDecoration").substr(0,4)||0!==b.trim().length){if(this.support.rangeBounds&&!a.parent.hasTransform()){var e=d.slice(0,c).join("").length;return this.getRangeBounds(a.node,e,b.length)}if(a.node&&"string"==typeof a.node.data){var f=a.node.splitText(b.length),g=this.getWrapperBounds(a.node,a.parent.hasTransform());return a.node=f,g}}else this.support.rangeBounds&&!a.parent.hasTransform()||(a.node=a.node.splitText(b.length));return{}}},d.prototype.getWrapperBounds=function(a,b){var c=a.ownerDocument.createElement("html2canvaswrapper"),d=a.parentNode,e=a.cloneNode(!0);c.appendChild(a.cloneNode(!0)),d.replaceChild(c,a);var f=b?$(c):Y(c);return d.replaceChild(e,c),f},d.prototype.getRangeBounds=function(a,b,c){var d=this.range||(this.range=a.ownerDocument.createRange());return d.setStart(a,b),d.setEnd(a,b+c),d.getBoundingClientRect()},d.prototype.parse=function(a){var b=a.contexts.filter(n),c=a.children.filter(B),d=c.filter(A(y)),e=d.filter(A(x)).filter(A(q)),f=c.filter(A(x)).filter(y),h=d.filter(A(x)).filter(q),i=a.contexts.concat(d.filter(x)).filter(p),j=a.children.filter(D).filter(s),k=a.contexts.filter(o);b.concat(e).concat(f).concat(h).concat(i).concat(j).concat(k).forEach(function(a){this.renderQueue.push(a),r(a)&&(this.parse(a),this.renderQueue.push(new g))},this)},d.prototype.paint=function(a){try{a instanceof g?this.renderer.ctx.restore():D(a)?(C(a.parent)&&a.parent.appendToDOM(),this.paintText(a),C(a.parent)&&a.parent.cleanDOM()):this.paintNode(a)}catch(b){if(O(b),this.options.strict)throw b}},d.prototype.paintNode=function(a){r(a)&&(this.renderer.setOpacity(a.opacity),this.renderer.ctx.save(),a.hasTransform()&&this.renderer.setTransform(a.parseTransform())),"INPUT"===a.node.nodeName&&"checkbox"===a.node.type?this.paintCheckbox(a):"INPUT"===a.node.nodeName&&"radio"===a.node.type?this.paintRadio(a):this.paintElement(a)},d.prototype.paintElement=function(a){var b=a.parseBounds();this.renderer.clip(a.backgroundClip,function(){this.renderer.renderBackground(a,b,a.borders.borders.map(H))},this),this.renderer.clip(a.clip,function(){this.renderer.renderBorders(a.borders.borders)},this),this.renderer.clip(a.backgroundClip,function(){switch(a.node.nodeName){case"svg":case"IFRAME":var c=this.images.get(a.node);c?this.renderer.renderImage(a,b,a.borders,c):O("Error loading <"+a.node.nodeName+">",a.node);break;case"IMG":var d=this.images.get(a.node.src);d?this.renderer.renderImage(a,b,a.borders,d):O("Error loading <img>",a.node.src);break;case"CANVAS":this.renderer.renderImage(a,b,a.borders,{image:a.node});break;case"SELECT":case"INPUT":case"TEXTAREA":this.paintFormValue(a)}},this)},d.prototype.paintCheckbox=function(a){var b=a.parseBounds(),c=Math.min(b.width,b.height),d={width:c-1,height:c-1,top:b.top,left:b.left},e=[3,3],f=[e,e,e,e],g=[1,1,1,1].map(function(a){return{color:new U("#A5A5A5"),width:a}}),i=j(d,f,g);this.renderer.clip(a.backgroundClip,function(){this.renderer.rectangle(d.left+1,d.top+1,d.width-2,d.height-2,new U("#DEDEDE")),this.renderer.renderBorders(h(g,d,i,f)),a.node.checked&&(this.renderer.font(new U("#424242"),"normal","normal","bold",c-3+"px","arial"),this.renderer.text("✔",d.left+c/6,d.top+c-1))},this)},d.prototype.paintRadio=function(a){var b=a.parseBounds(),c=Math.min(b.width,b.height)-2;this.renderer.clip(a.backgroundClip,function(){this.renderer.circleStroke(b.left+1,b.top+1,c,new U("#DEDEDE"),1,new U("#A5A5A5")),a.node.checked&&this.renderer.circle(Math.ceil(b.left+c/4)+1,Math.ceil(b.top+c/4)+1,Math.floor(c/2),new U("#424242"))},this)},d.prototype.paintFormValue=function(a){var b=a.getValue();if(b.length>0){var c=a.node.ownerDocument,d=c.createElement("html2canvaswrapper"),e=["lineHeight","textAlign","fontFamily","fontWeight","fontSize","color","paddingLeft","paddingTop","paddingRight","paddingBottom","width","height","borderLeftStyle","borderTopStyle","borderLeftWidth","borderTopWidth","boxSizing","whiteSpace","wordWrap"];e.forEach(function(b){try{d.style[b]=a.css(b)}catch(c){O("html2canvas: Parse: Exception caught in renderFormValue: "+c.message)}});var f=a.parseBounds();d.style.position="fixed",d.style.left=f.left+"px",d.style.top=f.top+"px",d.textContent=b,c.body.appendChild(d),this.paintText(new R(d.firstChild,a)),c.body.removeChild(d)}},d.prototype.paintText=function(a){a.applyTextTransform();var b=P.ucs2.decode(a.node.data),c=this.options.letterRendering&&!t(a)||N(a.node.data)?b.map(function(a){return P.ucs2.encode([a])}):L(b),d=a.parent.fontWeight(),e=a.parent.css("fontSize"),f=a.parent.css("fontFamily"),g=a.parent.parseTextShadows();this.renderer.font(a.parent.color("color"),a.parent.css("fontStyle"),a.parent.css("fontVariant"),d,e,f),g.length?this.renderer.fontShadow(g[0].color,g[0].offsetX,g[0].offsetY,g[0].blur):this.renderer.clearShadow(),this.renderer.clip(a.parent.clip,function(){c.map(this.parseTextBounds(a),this).forEach(function(b,d){b&&(this.renderer.text(c[d],b.left,b.bottom),this.renderTextDecoration(a.parent,b,this.fontMetrics.getMetrics(f,e)))},this)},this)},d.prototype.renderTextDecoration=function(a,b,c){switch(a.css("textDecoration").split(" ")[0]){case"underline":this.renderer.rectangle(b.left,Math.round(b.top+c.baseline+c.lineWidth),b.width,1,a.color("color"));break;case"overline":this.renderer.rectangle(b.left,Math.round(b.top),b.width,1,a.color("color"));break;case"line-through":this.renderer.rectangle(b.left,Math.ceil(b.top+c.middle+c.lineWidth),b.width,1,a.color("color"))}};var _={inset:[["darken",.6],["darken",.1],["darken",.1],["darken",.6]]};d.prototype.parseBorders=function(a){var b=a.parseBounds(),c=u(a),d=["Top","Right","Bottom","Left"].map(function(b,c){var d=a.css("border"+b+"Style"),e=a.color("border"+b+"Color");"inset"===d&&e.isBlack()&&(e=new U([255,255,255,e.a]));var f=_[d]?_[d][c]:null;return{width:a.cssInt("border"+b+"Width"),color:f?e[f[0]](f[1]):e,args:null}}),e=j(b,c,d);return{clip:this.parseBackgroundClip(a,e,d,c,b),borders:h(d,b,e,c)}},d.prototype.parseBackgroundClip=function(a,b,c,d,e){var f=a.css("backgroundClip"),g=[];switch(f){case"content-box":case"padding-box":m(g,d[0],d[1],b.topLeftInner,b.topRightInner,e.left+c[3].width,e.top+c[0].width),m(g,d[1],d[2],b.topRightInner,b.bottomRightInner,e.left+e.width-c[1].width,e.top+c[0].width),m(g,d[2],d[3],b.bottomRightInner,b.bottomLeftInner,e.left+e.width-c[1].width,e.top+e.height-c[2].width),m(g,d[3],d[0],b.bottomLeftInner,b.topLeftInner,e.left+c[3].width,e.top+e.height-c[2].width);break;default:m(g,d[0],d[1],b.topLeftOuter,b.topRightOuter,e.left,e.top),m(g,d[1],d[2],b.topRightOuter,b.bottomRightOuter,e.left+e.width,e.top),m(g,d[2],d[3],b.bottomRightOuter,b.bottomLeftOuter,e.left+e.width,e.top+e.height),m(g,d[3],d[0],b.bottomLeftOuter,b.topLeftOuter,e.left,e.top+e.height)}return g},b.exports=d},{"./color":3,"./fontmetrics":7,"./log":13,"./nodecontainer":14,"./pseudoelementcontainer":18,"./stackingcontext":21,"./textcontainer":25,"./utils":26,punycode:1}],16:[function(a,b,c){function d(a,b,c){var d="withCredentials"in new XMLHttpRequest;if(!b)return Promise.reject("No proxy configured");var e=g(d),i=h(b,a,e);return d?k(i):f(c,i,e).then(function(a){return o(a.content)})}function e(a,b,c){var d="crossOrigin"in new Image,e=g(d),i=h(b,a,e);return d?Promise.resolve(i):f(c,i,e).then(function(a){return"data:"+a.type+";base64,"+a.content})}function f(a,b,c){return new Promise(function(d,e){var f=a.createElement("script"),g=function(){delete window.html2canvas.proxy[c],a.body.removeChild(f)};window.html2canvas.proxy[c]=function(a){g(),d(a)},f.src=b,f.onerror=function(a){g(),e(a)},a.body.appendChild(f)})}function g(a){return a?"":"html2canvas_"+Date.now()+"_"+ ++p+"_"+Math.round(1e5*Math.random())}function h(a,b,c){return a+"?url="+encodeURIComponent(b)+(c.length?"&callback=html2canvas.proxy."+c:"")}function i(a){return function(b){var c,d=new DOMParser;try{c=d.parseFromString(b,"text/html")}catch(e){m("DOMParser not supported, falling back to createHTMLDocument"),c=document.implementation.createHTMLDocument("");try{c.open(),c.write(b),c.close()}catch(f){m("createHTMLDocument write not supported, falling back to document.body.innerHTML"),c.body.innerHTML=b}}var g=c.querySelector("base");if(!g||!g.href.host){var h=c.createElement("base");h.href=a,c.head.insertBefore(h,c.head.firstChild)}return c}}function j(a,b,c,e,f,g){return new d(a,b,window.document).then(i(a)).then(function(a){return n(a,c,e,f,g,0,0)})}var k=a("./xhr"),l=a("./utils"),m=a("./log"),n=a("./clone"),o=l.decode64,p=0;c.Proxy=d,c.ProxyURL=e,c.loadUrlDocument=j},{"./clone":2,"./log":13,"./utils":26,"./xhr":28}],17:[function(a,b,c){function d(a,b){var c=document.createElement("a");c.href=a,a=c.href,this.src=a,this.image=new Image;var d=this;this.promise=new Promise(function(c,f){d.image.crossOrigin="Anonymous",d.image.onload=c,d.image.onerror=f,new e(a,b,document).then(function(a){d.image.src=a})["catch"](f)})}var e=a("./proxy").ProxyURL;b.exports=d},{"./proxy":16}],18:[function(a,b,c){function d(a,b,c){e.call(this,a,b),this.isPseudoElement=!0,this.before=":before"===c}var e=a("./nodecontainer");d.prototype.cloneTo=function(a){d.prototype.cloneTo.call(this,a),a.isPseudoElement=!0,a.before=this.before},d.prototype=Object.create(e.prototype),d.prototype.appendToDOM=function(){this.before?this.parent.node.insertBefore(this.node,this.parent.node.firstChild):this.parent.node.appendChild(this.node),this.parent.node.className+=" "+this.getHideClass()},d.prototype.cleanDOM=function(){this.node.parentNode.removeChild(this.node),this.parent.node.className=this.parent.node.className.replace(this.getHideClass(),"")},d.prototype.getHideClass=function(){return this["PSEUDO_HIDE_ELEMENT_CLASS_"+(this.before?"BEFORE":"AFTER")]},d.prototype.PSEUDO_HIDE_ELEMENT_CLASS_BEFORE="___html2canvas___pseudoelement_before",d.prototype.PSEUDO_HIDE_ELEMENT_CLASS_AFTER="___html2canvas___pseudoelement_after",b.exports=d},{"./nodecontainer":14}],19:[function(a,b,c){function d(a,b,c,d,e){this.width=a,this.height=b,this.images=c,this.options=d,this.document=e}var e=a("./log");d.prototype.renderImage=function(a,b,c,d){var e=a.cssInt("paddingLeft"),f=a.cssInt("paddingTop"),g=a.cssInt("paddingRight"),h=a.cssInt("paddingBottom"),i=c.borders,j=b.width-(i[1].width+i[3].width+e+g),k=b.height-(i[0].width+i[2].width+f+h);this.drawImage(d,0,0,d.image.width||j,d.image.height||k,b.left+e+i[3].width,b.top+f+i[0].width,j,k)},d.prototype.renderBackground=function(a,b,c){b.height>0&&b.width>0&&(this.renderBackgroundColor(a,b),this.renderBackgroundImage(a,b,c))},d.prototype.renderBackgroundColor=function(a,b){var c=a.color("backgroundColor");c.isTransparent()||this.rectangle(b.left,b.top,b.width,b.height,c)},d.prototype.renderBorders=function(a){a.forEach(this.renderBorder,this)},d.prototype.renderBorder=function(a){a.color.isTransparent()||null===a.args||this.drawShape(a.args,a.color)},d.prototype.renderBackgroundImage=function(a,b,c){var d=a.parseBackgroundImages();d.reverse().forEach(function(d,f,g){switch(d.method){case"url":var h=this.images.get(d.args[0]);h?this.renderBackgroundRepeating(a,b,h,g.length-(f+1),c):e("Error loading background-image",d.args[0]);break;case"linear-gradient":case"gradient":var i=this.images.get(d.value);i?this.renderBackgroundGradient(i,b,c):e("Error loading background-image",d.args[0]);break;case"none":break;default:e("Unknown background-image type",d.args[0])}},this)},d.prototype.renderBackgroundRepeating=function(a,b,c,d,e){var f=a.parseBackgroundSize(b,c.image,d),g=a.parseBackgroundPosition(b,c.image,d,f),h=a.parseBackgroundRepeat(d);switch(h){case"repeat-x":case"repeat no-repeat":this.backgroundRepeatShape(c,g,f,b,b.left+e[3],b.top+g.top+e[0],99999,f.height,e);break;case"repeat-y":case"no-repeat repeat":this.backgroundRepeatShape(c,g,f,b,b.left+g.left+e[3],b.top+e[0],f.width,99999,e);break;case"no-repeat":this.backgroundRepeatShape(c,g,f,b,b.left+g.left+e[3],b.top+g.top+e[0],f.width,f.height,e);break;default:this.renderBackgroundRepeat(c,g,f,{top:b.top,left:b.left},e[3],e[0])}},b.exports=d},{"./log":13}],20:[function(a,b,c){function d(a,b){f.apply(this,arguments),this.canvas=this.options.canvas||this.document.createElement("canvas"),this.options.canvas||(this.canvas.width=a,this.canvas.height=b),this.ctx=this.canvas.getContext("2d"),this.taintCtx=this.document.createElement("canvas").getContext("2d"),this.ctx.textBaseline="bottom",this.variables={},h("Initialized CanvasRenderer with size",a,"x",b)}function e(a){return a.length>0}var f=a("../renderer"),g=a("../lineargradientcontainer"),h=a("../log");d.prototype=Object.create(f.prototype),d.prototype.setFillStyle=function(a){return this.ctx.fillStyle="object"==typeof a&&a.isColor?a.toString():a,this.ctx},d.prototype.rectangle=function(a,b,c,d,e){this.setFillStyle(e).fillRect(a,b,c,d)},d.prototype.circle=function(a,b,c,d){this.setFillStyle(d),this.ctx.beginPath(),this.ctx.arc(a+c/2,b+c/2,c/2,0,2*Math.PI,!0),this.ctx.closePath(),this.ctx.fill()},d.prototype.circleStroke=function(a,b,c,d,e,f){this.circle(a,b,c,d),this.ctx.strokeStyle=f.toString(),this.ctx.stroke()},d.prototype.drawShape=function(a,b){this.shape(a),this.setFillStyle(b).fill()},d.prototype.taints=function(a){if(null===a.tainted){this.taintCtx.drawImage(a.image,0,0);try{this.taintCtx.getImageData(0,0,1,1),a.tainted=!1}catch(b){this.taintCtx=document.createElement("canvas").getContext("2d"),a.tainted=!0}}return a.tainted},d.prototype.drawImage=function(a,b,c,d,e,f,g,h,i){this.taints(a)&&!this.options.allowTaint||this.ctx.drawImage(a.image,b,c,d,e,f,g,h,i)},d.prototype.clip=function(a,b,c){this.ctx.save(),a.filter(e).forEach(function(a){this.shape(a).clip()},this),b.call(c),this.ctx.restore()},d.prototype.shape=function(a){return this.ctx.beginPath(),a.forEach(function(a,b){"rect"===a[0]?this.ctx.rect.apply(this.ctx,a.slice(1)):this.ctx[0===b?"moveTo":a[0]+"To"].apply(this.ctx,a.slice(1))},this),this.ctx.closePath(),this.ctx},d.prototype.font=function(a,b,c,d,e,f){this.setFillStyle(a).font=[b,c,d,e,f].join(" ").split(",")[0]},d.prototype.fontShadow=function(a,b,c,d){this.setVariable("shadowColor",a.toString()).setVariable("shadowOffsetY",b).setVariable("shadowOffsetX",c).setVariable("shadowBlur",d)},d.prototype.clearShadow=function(){this.setVariable("shadowColor","rgba(0,0,0,0)")},d.prototype.setOpacity=function(a){this.ctx.globalAlpha=a},d.prototype.setTransform=function(a){this.ctx.translate(a.origin[0],a.origin[1]),this.ctx.transform.apply(this.ctx,a.matrix),this.ctx.translate(-a.origin[0],-a.origin[1])},d.prototype.setVariable=function(a,b){return this.variables[a]!==b&&(this.variables[a]=this.ctx[a]=b),this},d.prototype.text=function(a,b,c){this.ctx.fillText(a,b,c)},d.prototype.backgroundRepeatShape=function(a,b,c,d,e,f,g,h,i){var j=[["line",Math.round(e),Math.round(f)],["line",Math.round(e+g),Math.round(f)],["line",Math.round(e+g),Math.round(h+f)],["line",Math.round(e),Math.round(h+f)]];this.clip([j],function(){this.renderBackgroundRepeat(a,b,c,d,i[3],i[0])},this)},d.prototype.renderBackgroundRepeat=function(a,b,c,d,e,f){var g=Math.round(d.left+b.left+e),h=Math.round(d.top+b.top+f);this.setFillStyle(this.ctx.createPattern(this.resizeImage(a,c),"repeat")),this.ctx.translate(g,h),this.ctx.fill(),this.ctx.translate(-g,-h)},d.prototype.renderBackgroundGradient=function(a,b){if(a instanceof g){var c=this.ctx.createLinearGradient(b.left+b.width*a.x0,b.top+b.height*a.y0,b.left+b.width*a.x1,b.top+b.height*a.y1);a.colorStops.forEach(function(a){c.addColorStop(a.stop,a.color.toString())}),this.rectangle(b.left,b.top,b.width,b.height,c)}},d.prototype.resizeImage=function(a,b){var c=a.image;if(c.width===b.width&&c.height===b.height)return c;var d,e=document.createElement("canvas");return e.width=b.width,e.height=b.height,d=e.getContext("2d"),d.drawImage(c,0,0,c.width,c.height,0,0,b.width,b.height),e},b.exports=d},{"../lineargradientcontainer":12,"../log":13,"../renderer":19}],21:[function(a,b,c){function d(a,b,c,d){e.call(this,c,d),this.ownStacking=a,this.contexts=[],this.children=[],this.opacity=(this.parent?this.parent.stack.opacity:1)*b}var e=a("./nodecontainer");d.prototype=Object.create(e.prototype),d.prototype.getParentStack=function(a){var b=this.parent?this.parent.stack:null;return b?b.ownStacking?b:b.getParentStack(a):a.stack},b.exports=d},{"./nodecontainer":14}],22:[function(a,b,c){function d(a){this.rangeBounds=this.testRangeBounds(a),this.cors=this.testCORS(),this.svg=this.testSVG()}d.prototype.testRangeBounds=function(a){var b,c,d,e,f=!1;return a.createRange&&(b=a.createRange(),b.getBoundingClientRect&&(c=a.createElement("boundtest"),c.style.height="123px",c.style.display="block",a.body.appendChild(c),b.selectNode(c),d=b.getBoundingClientRect(),e=d.height,123===e&&(f=!0),a.body.removeChild(c))),f},d.prototype.testCORS=function(){return"undefined"!=typeof(new Image).crossOrigin},d.prototype.testSVG=function(){var a=new Image,b=document.createElement("canvas"),c=b.getContext("2d");a.src="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'></svg>";try{c.drawImage(a,0,0),b.toDataURL()}catch(d){return!1}return!0},b.exports=d},{}],23:[function(a,b,c){function d(a){this.src=a,this.image=null;var b=this;this.promise=this.hasFabric().then(function(){return b.isInline(a)?Promise.resolve(b.inlineFormatting(a)):e(a)}).then(function(a){return new Promise(function(c){window.html2canvas.svg.fabric.loadSVGFromString(a,b.createCanvas.call(b,c))})})}var e=a("./xhr"),f=a("./utils").decode64;d.prototype.hasFabric=function(){return window.html2canvas.svg&&window.html2canvas.svg.fabric?Promise.resolve():Promise.reject(new Error("html2canvas.svg.js is not loaded, cannot render svg"))},d.prototype.inlineFormatting=function(a){return/^data:image\\/svg\\+xml;base64,/.test(a)?this.decode64(this.removeContentType(a)):this.removeContentType(a)},d.prototype.removeContentType=function(a){return a.replace(/^data:image\\/svg\\+xml(;base64)?,/,"")},d.prototype.isInline=function(a){return/^data:image\\/svg\\+xml/i.test(a)},d.prototype.createCanvas=function(a){var b=this;return function(c,d){var e=new window.html2canvas.svg.fabric.StaticCanvas("c");b.image=e.lowerCanvasEl,e.setWidth(d.width).setHeight(d.height).add(window.html2canvas.svg.fabric.util.groupSVGElements(c,d)).renderAll(),a(e.lowerCanvasEl)}},d.prototype.decode64=function(a){return"function"==typeof window.atob?window.atob(a):f(a)},b.exports=d},{"./utils":26,"./xhr":28}],24:[function(a,b,c){function d(a,b){this.src=a,this.image=null;var c=this;this.promise=b?new Promise(function(b,d){c.image=new Image,c.image.onload=b,c.image.onerror=d,c.image.src="data:image/svg+xml,"+(new XMLSerializer).serializeToString(a),c.image.complete===!0&&b(c.image)}):this.hasFabric().then(function(){return new Promise(function(b){window.html2canvas.svg.fabric.parseSVGDocument(a,c.createCanvas.call(c,b))})})}var e=a("./svgcontainer");d.prototype=Object.create(e.prototype),b.exports=d},{"./svgcontainer":23}],25:[function(a,b,c){function d(a,b){f.call(this,a,b)}function e(a,b,c){if(a.length>0)return b+c.toUpperCase()}var f=a("./nodecontainer");d.prototype=Object.create(f.prototype),d.prototype.applyTextTransform=function(){this.node.data=this.transform(this.parent.css("textTransform"))},d.prototype.transform=function(a){var b=this.node.data;switch(a){case"lowercase":return b.toLowerCase();case"capitalize":return b.replace(/(^|\\s|:|-|\\(|\\))([a-z])/g,e);case"uppercase":return b.toUpperCase();default:return b}},b.exports=d},{"./nodecontainer":14}],26:[function(a,b,c){c.smallImage=function(){return"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"},c.bind=function(a,b){return function(){return a.apply(b,arguments)}},c.decode64=function(a){var b,c,d,e,f,g,h,i,j="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",k=a.length,l="";for(b=0;b<k;b+=4)c=j.indexOf(a[b]),d=j.indexOf(a[b+1]),e=j.indexOf(a[b+2]),f=j.indexOf(a[b+3]),g=c<<2|d>>4,h=(15&d)<<4|e>>2,i=(3&e)<<6|f,l+=64===e?String.fromCharCode(g):64===f||f===-1?String.fromCharCode(g,h):String.fromCharCode(g,h,i);return l},c.getBounds=function(a){if(a.getBoundingClientRect){var b=a.getBoundingClientRect(),c=null==a.offsetWidth?b.width:a.offsetWidth;return{top:b.top,bottom:b.bottom||b.top+b.height,right:b.left+c,left:b.left,width:c,height:null==a.offsetHeight?b.height:a.offsetHeight}}return{}},c.offsetBounds=function(a){var b=a.offsetParent?c.offsetBounds(a.offsetParent):{top:0,left:0};return{top:a.offsetTop+b.top,bottom:a.offsetTop+a.offsetHeight+b.top,right:a.offsetLeft+b.left+a.offsetWidth,left:a.offsetLeft+b.left,width:a.offsetWidth,height:a.offsetHeight}},c.parseBackgrounds=function(a){var b,c,d,e,f,g,h,i=" \\r\\n\\t",j=[],k=0,l=0,m=function(){b&&(\'"\'===c.substr(0,1)&&(c=c.substr(1,c.length-2)),c&&h.push(c),"-"===b.substr(0,1)&&(e=b.indexOf("-",1)+1)>0&&(d=b.substr(0,e),b=b.substr(e)),j.push({prefix:d,method:b.toLowerCase(),value:f,args:h,image:null})),h=[],b=d=c=f=""};return h=[],b=d=c=f="",a.split("").forEach(function(a){if(!(0===k&&i.indexOf(a)>-1)){switch(a){case\'"\':g?g===a&&(g=null):g=a;break;case"(":if(g)break;if(0===k)return k=1,void(f+=a);l++;break;case")":if(g)break;if(1===k){if(0===l)return k=0,f+=a,void m();l--}break;case",":if(g)break;if(0===k)return void m();if(1===k&&0===l&&!b.match(/^url$/i))return h.push(c),c="",void(f+=a)}f+=a,0===k?b+=a:c+=a}}),m(),j}},{}],27:[function(a,b,c){function d(a){e.apply(this,arguments),this.type="linear"===a.args[0]?e.TYPES.LINEAR:e.TYPES.RADIAL}var e=a("./gradientcontainer");d.prototype=Object.create(e.prototype),b.exports=d},{"./gradientcontainer":9}],28:[function(a,b,c){function d(a){return new Promise(function(b,c){var d=new XMLHttpRequest;d.open("GET",a),d.onload=function(){200===d.status?b(d.responseText):c(new Error(d.statusText))},d.onerror=function(){c(new Error("Network Error"))},d.send()})}b.exports=d},{}]},{},[4])(4)});');
  registerCSS('@charset "UTF-8";/*!\n * animate.css -http://daneden.me/animate\n * Version - 3.5.1\n * Licensed under the MIT license - http://opensource.org/licenses/MIT\n *\n * Copyright (c) 2016 Daniel Eden\n */.animated{-webkit-animation-duration:1s;animation-duration:1s;-webkit-animation-fill-mode:both;animation-fill-mode:both}.animated.infinite{-webkit-animation-iteration-count:infinite;animation-iteration-count:infinite}.animated.hinge{-webkit-animation-duration:2s;animation-duration:2s}.animated.bounceIn,.animated.bounceOut,.animated.flipOutX,.animated.flipOutY{-webkit-animation-duration:.75s;animation-duration:.75s}@-webkit-keyframes bounce{20%,53%,80%,from,to{-webkit-animation-timing-function:cubic-bezier(.215,.61,.355,1);animation-timing-function:cubic-bezier(.215,.61,.355,1);-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}40%,43%{-webkit-animation-timing-function:cubic-bezier(.755,.050,.855,.060);animation-timing-function:cubic-bezier(.755,.050,.855,.060);-webkit-transform:translate3d(0,-30px,0);transform:translate3d(0,-30px,0)}70%{-webkit-animation-timing-function:cubic-bezier(.755,.050,.855,.060);animation-timing-function:cubic-bezier(.755,.050,.855,.060);-webkit-transform:translate3d(0,-15px,0);transform:translate3d(0,-15px,0)}90%{-webkit-transform:translate3d(0,-4px,0);transform:translate3d(0,-4px,0)}}@keyframes bounce{20%,53%,80%,from,to{-webkit-animation-timing-function:cubic-bezier(.215,.61,.355,1);animation-timing-function:cubic-bezier(.215,.61,.355,1);-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}40%,43%{-webkit-animation-timing-function:cubic-bezier(.755,.050,.855,.060);animation-timing-function:cubic-bezier(.755,.050,.855,.060);-webkit-transform:translate3d(0,-30px,0);transform:translate3d(0,-30px,0)}70%{-webkit-animation-timing-function:cubic-bezier(.755,.050,.855,.060);animation-timing-function:cubic-bezier(.755,.050,.855,.060);-webkit-transform:translate3d(0,-15px,0);transform:translate3d(0,-15px,0)}90%{-webkit-transform:translate3d(0,-4px,0);transform:translate3d(0,-4px,0)}}.bounce{-webkit-animation-name:bounce;animation-name:bounce;-webkit-transform-origin:center bottom;transform-origin:center bottom}@-webkit-keyframes flash{50%,from,to{opacity:1}25%,75%{opacity:0}}@keyframes flash{50%,from,to{opacity:1}25%,75%{opacity:0}}.flash{-webkit-animation-name:flash;animation-name:flash}@-webkit-keyframes pulse{from,to{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}50%{-webkit-transform:scale3d(1.05,1.05,1.05);transform:scale3d(1.05,1.05,1.05)}}@keyframes pulse{from,to{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}50%{-webkit-transform:scale3d(1.05,1.05,1.05);transform:scale3d(1.05,1.05,1.05)}}.pulse{-webkit-animation-name:pulse;animation-name:pulse}@-webkit-keyframes rubberBand{from,to{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}30%{-webkit-transform:scale3d(1.25,.75,1);transform:scale3d(1.25,.75,1)}40%{-webkit-transform:scale3d(.75,1.25,1);transform:scale3d(.75,1.25,1)}50%{-webkit-transform:scale3d(1.15,.85,1);transform:scale3d(1.15,.85,1)}65%{-webkit-transform:scale3d(.95,1.05,1);transform:scale3d(.95,1.05,1)}75%{-webkit-transform:scale3d(1.05,.95,1);transform:scale3d(1.05,.95,1)}}@keyframes rubberBand{from,to{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}30%{-webkit-transform:scale3d(1.25,.75,1);transform:scale3d(1.25,.75,1)}40%{-webkit-transform:scale3d(.75,1.25,1);transform:scale3d(.75,1.25,1)}50%{-webkit-transform:scale3d(1.15,.85,1);transform:scale3d(1.15,.85,1)}65%{-webkit-transform:scale3d(.95,1.05,1);transform:scale3d(.95,1.05,1)}75%{-webkit-transform:scale3d(1.05,.95,1);transform:scale3d(1.05,.95,1)}}.rubberBand{-webkit-animation-name:rubberBand;animation-name:rubberBand}@-webkit-keyframes shake{from,to{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}10%,30%,50%,70%,90%{-webkit-transform:translate3d(-10px,0,0);transform:translate3d(-10px,0,0)}20%,40%,60%,80%{-webkit-transform:translate3d(10px,0,0);transform:translate3d(10px,0,0)}}@keyframes shake{from,to{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}10%,30%,50%,70%,90%{-webkit-transform:translate3d(-10px,0,0);transform:translate3d(-10px,0,0)}20%,40%,60%,80%{-webkit-transform:translate3d(10px,0,0);transform:translate3d(10px,0,0)}}.shake{-webkit-animation-name:shake;animation-name:shake}@-webkit-keyframes headShake{0%{-webkit-transform:translateX(0);transform:translateX(0)}6.5%{-webkit-transform:translateX(-6px) rotateY(-9deg);transform:translateX(-6px) rotateY(-9deg)}18.5%{-webkit-transform:translateX(5px) rotateY(7deg);transform:translateX(5px) rotateY(7deg)}31.5%{-webkit-transform:translateX(-3px) rotateY(-5deg);transform:translateX(-3px) rotateY(-5deg)}43.5%{-webkit-transform:translateX(2px) rotateY(3deg);transform:translateX(2px) rotateY(3deg)}50%{-webkit-transform:translateX(0);transform:translateX(0)}}@keyframes headShake{0%{-webkit-transform:translateX(0);transform:translateX(0)}6.5%{-webkit-transform:translateX(-6px) rotateY(-9deg);transform:translateX(-6px) rotateY(-9deg)}18.5%{-webkit-transform:translateX(5px) rotateY(7deg);transform:translateX(5px) rotateY(7deg)}31.5%{-webkit-transform:translateX(-3px) rotateY(-5deg);transform:translateX(-3px) rotateY(-5deg)}43.5%{-webkit-transform:translateX(2px) rotateY(3deg);transform:translateX(2px) rotateY(3deg)}50%{-webkit-transform:translateX(0);transform:translateX(0)}}.headShake{-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out;-webkit-animation-name:headShake;animation-name:headShake}@-webkit-keyframes swing{20%{-webkit-transform:rotate3d(0,0,1,15deg);transform:rotate3d(0,0,1,15deg)}40%{-webkit-transform:rotate3d(0,0,1,-10deg);transform:rotate3d(0,0,1,-10deg)}60%{-webkit-transform:rotate3d(0,0,1,5deg);transform:rotate3d(0,0,1,5deg)}80%{-webkit-transform:rotate3d(0,0,1,-5deg);transform:rotate3d(0,0,1,-5deg)}to{-webkit-transform:rotate3d(0,0,1,0deg);transform:rotate3d(0,0,1,0deg)}}@keyframes swing{20%{-webkit-transform:rotate3d(0,0,1,15deg);transform:rotate3d(0,0,1,15deg)}40%{-webkit-transform:rotate3d(0,0,1,-10deg);transform:rotate3d(0,0,1,-10deg)}60%{-webkit-transform:rotate3d(0,0,1,5deg);transform:rotate3d(0,0,1,5deg)}80%{-webkit-transform:rotate3d(0,0,1,-5deg);transform:rotate3d(0,0,1,-5deg)}to{-webkit-transform:rotate3d(0,0,1,0deg);transform:rotate3d(0,0,1,0deg)}}.swing{-webkit-transform-origin:top center;transform-origin:top center;-webkit-animation-name:swing;animation-name:swing}@-webkit-keyframes tada{from,to{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}10%,20%{-webkit-transform:scale3d(.9,.9,.9) rotate3d(0,0,1,-3deg);transform:scale3d(.9,.9,.9) rotate3d(0,0,1,-3deg)}30%,50%,70%,90%{-webkit-transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,3deg);transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,3deg)}40%,60%,80%{-webkit-transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,-3deg);transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,-3deg)}}@keyframes tada{from,to{-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}10%,20%{-webkit-transform:scale3d(.9,.9,.9) rotate3d(0,0,1,-3deg);transform:scale3d(.9,.9,.9) rotate3d(0,0,1,-3deg)}30%,50%,70%,90%{-webkit-transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,3deg);transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,3deg)}40%,60%,80%{-webkit-transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,-3deg);transform:scale3d(1.1,1.1,1.1) rotate3d(0,0,1,-3deg)}}.tada{-webkit-animation-name:tada;animation-name:tada}@-webkit-keyframes wobble{from,to{-webkit-transform:none;transform:none}15%{-webkit-transform:translate3d(-25%,0,0) rotate3d(0,0,1,-5deg);transform:translate3d(-25%,0,0) rotate3d(0,0,1,-5deg)}30%{-webkit-transform:translate3d(20%,0,0) rotate3d(0,0,1,3deg);transform:translate3d(20%,0,0) rotate3d(0,0,1,3deg)}45%{-webkit-transform:translate3d(-15%,0,0) rotate3d(0,0,1,-3deg);transform:translate3d(-15%,0,0) rotate3d(0,0,1,-3deg)}60%{-webkit-transform:translate3d(10%,0,0) rotate3d(0,0,1,2deg);transform:translate3d(10%,0,0) rotate3d(0,0,1,2deg)}75%{-webkit-transform:translate3d(-5%,0,0) rotate3d(0,0,1,-1deg);transform:translate3d(-5%,0,0) rotate3d(0,0,1,-1deg)}}@keyframes wobble{from,to{-webkit-transform:none;transform:none}15%{-webkit-transform:translate3d(-25%,0,0) rotate3d(0,0,1,-5deg);transform:translate3d(-25%,0,0) rotate3d(0,0,1,-5deg)}30%{-webkit-transform:translate3d(20%,0,0) rotate3d(0,0,1,3deg);transform:translate3d(20%,0,0) rotate3d(0,0,1,3deg)}45%{-webkit-transform:translate3d(-15%,0,0) rotate3d(0,0,1,-3deg);transform:translate3d(-15%,0,0) rotate3d(0,0,1,-3deg)}60%{-webkit-transform:translate3d(10%,0,0) rotate3d(0,0,1,2deg);transform:translate3d(10%,0,0) rotate3d(0,0,1,2deg)}75%{-webkit-transform:translate3d(-5%,0,0) rotate3d(0,0,1,-1deg);transform:translate3d(-5%,0,0) rotate3d(0,0,1,-1deg)}}.wobble{-webkit-animation-name:wobble;animation-name:wobble}@-webkit-keyframes jello{11.1%,from,to{-webkit-transform:none;transform:none}22.2%{-webkit-transform:skewX(-12.5deg) skewY(-12.5deg);transform:skewX(-12.5deg) skewY(-12.5deg)}33.3%{-webkit-transform:skewX(6.25deg) skewY(6.25deg);transform:skewX(6.25deg) skewY(6.25deg)}44.4%{-webkit-transform:skewX(-3.125deg) skewY(-3.125deg);transform:skewX(-3.125deg) skewY(-3.125deg)}55.5%{-webkit-transform:skewX(1.5625deg) skewY(1.5625deg);transform:skewX(1.5625deg) skewY(1.5625deg)}66.6%{-webkit-transform:skewX(-.78125deg) skewY(-.78125deg);transform:skewX(-.78125deg) skewY(-.78125deg)}77.7%{-webkit-transform:skewX(.390625deg) skewY(.390625deg);transform:skewX(.390625deg) skewY(.390625deg)}88.8%{-webkit-transform:skewX(-.1953125deg) skewY(-.1953125deg);transform:skewX(-.1953125deg) skewY(-.1953125deg)}}@keyframes jello{11.1%,from,to{-webkit-transform:none;transform:none}22.2%{-webkit-transform:skewX(-12.5deg) skewY(-12.5deg);transform:skewX(-12.5deg) skewY(-12.5deg)}33.3%{-webkit-transform:skewX(6.25deg) skewY(6.25deg);transform:skewX(6.25deg) skewY(6.25deg)}44.4%{-webkit-transform:skewX(-3.125deg) skewY(-3.125deg);transform:skewX(-3.125deg) skewY(-3.125deg)}55.5%{-webkit-transform:skewX(1.5625deg) skewY(1.5625deg);transform:skewX(1.5625deg) skewY(1.5625deg)}66.6%{-webkit-transform:skewX(-.78125deg) skewY(-.78125deg);transform:skewX(-.78125deg) skewY(-.78125deg)}77.7%{-webkit-transform:skewX(.390625deg) skewY(.390625deg);transform:skewX(.390625deg) skewY(.390625deg)}88.8%{-webkit-transform:skewX(-.1953125deg) skewY(-.1953125deg);transform:skewX(-.1953125deg) skewY(-.1953125deg)}}.jello{-webkit-animation-name:jello;animation-name:jello;-webkit-transform-origin:center;transform-origin:center}@-webkit-keyframes bounceIn{20%,40%,60%,80%,from,to{-webkit-animation-timing-function:cubic-bezier(.215,.61,.355,1);animation-timing-function:cubic-bezier(.215,.61,.355,1)}0%{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}20%{-webkit-transform:scale3d(1.1,1.1,1.1);transform:scale3d(1.1,1.1,1.1)}40%{-webkit-transform:scale3d(.9,.9,.9);transform:scale3d(.9,.9,.9)}60%{opacity:1;-webkit-transform:scale3d(1.03,1.03,1.03);transform:scale3d(1.03,1.03,1.03)}80%{-webkit-transform:scale3d(.97,.97,.97);transform:scale3d(.97,.97,.97)}to{opacity:1;-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}}@keyframes bounceIn{20%,40%,60%,80%,from,to{-webkit-animation-timing-function:cubic-bezier(.215,.61,.355,1);animation-timing-function:cubic-bezier(.215,.61,.355,1)}0%{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}20%{-webkit-transform:scale3d(1.1,1.1,1.1);transform:scale3d(1.1,1.1,1.1)}40%{-webkit-transform:scale3d(.9,.9,.9);transform:scale3d(.9,.9,.9)}60%{opacity:1;-webkit-transform:scale3d(1.03,1.03,1.03);transform:scale3d(1.03,1.03,1.03)}80%{-webkit-transform:scale3d(.97,.97,.97);transform:scale3d(.97,.97,.97)}to{opacity:1;-webkit-transform:scale3d(1,1,1);transform:scale3d(1,1,1)}}.bounceIn{-webkit-animation-name:bounceIn;animation-name:bounceIn}@-webkit-keyframes bounceInDown{60%,75%,90%,from,to{-webkit-animation-timing-function:cubic-bezier(.215,.61,.355,1);animation-timing-function:cubic-bezier(.215,.61,.355,1)}0%{opacity:0;-webkit-transform:translate3d(0,-3000px,0);transform:translate3d(0,-3000px,0)}60%{opacity:1;-webkit-transform:translate3d(0,25px,0);transform:translate3d(0,25px,0)}75%{-webkit-transform:translate3d(0,-10px,0);transform:translate3d(0,-10px,0)}90%{-webkit-transform:translate3d(0,5px,0);transform:translate3d(0,5px,0)}to{-webkit-transform:none;transform:none}}@keyframes bounceInDown{60%,75%,90%,from,to{-webkit-animation-timing-function:cubic-bezier(.215,.61,.355,1);animation-timing-function:cubic-bezier(.215,.61,.355,1)}0%{opacity:0;-webkit-transform:translate3d(0,-3000px,0);transform:translate3d(0,-3000px,0)}60%{opacity:1;-webkit-transform:translate3d(0,25px,0);transform:translate3d(0,25px,0)}75%{-webkit-transform:translate3d(0,-10px,0);transform:translate3d(0,-10px,0)}90%{-webkit-transform:translate3d(0,5px,0);transform:translate3d(0,5px,0)}to{-webkit-transform:none;transform:none}}.bounceInDown{-webkit-animation-name:bounceInDown;animation-name:bounceInDown}@-webkit-keyframes bounceInLeft{60%,75%,90%,from,to{-webkit-animation-timing-function:cubic-bezier(.215,.61,.355,1);animation-timing-function:cubic-bezier(.215,.61,.355,1)}0%{opacity:0;-webkit-transform:translate3d(-3000px,0,0);transform:translate3d(-3000px,0,0)}60%{opacity:1;-webkit-transform:translate3d(25px,0,0);transform:translate3d(25px,0,0)}75%{-webkit-transform:translate3d(-10px,0,0);transform:translate3d(-10px,0,0)}90%{-webkit-transform:translate3d(5px,0,0);transform:translate3d(5px,0,0)}to{-webkit-transform:none;transform:none}}@keyframes bounceInLeft{60%,75%,90%,from,to{-webkit-animation-timing-function:cubic-bezier(.215,.61,.355,1);animation-timing-function:cubic-bezier(.215,.61,.355,1)}0%{opacity:0;-webkit-transform:translate3d(-3000px,0,0);transform:translate3d(-3000px,0,0)}60%{opacity:1;-webkit-transform:translate3d(25px,0,0);transform:translate3d(25px,0,0)}75%{-webkit-transform:translate3d(-10px,0,0);transform:translate3d(-10px,0,0)}90%{-webkit-transform:translate3d(5px,0,0);transform:translate3d(5px,0,0)}to{-webkit-transform:none;transform:none}}.bounceInLeft{-webkit-animation-name:bounceInLeft;animation-name:bounceInLeft}@-webkit-keyframes bounceInRight{60%,75%,90%,from,to{-webkit-animation-timing-function:cubic-bezier(.215,.61,.355,1);animation-timing-function:cubic-bezier(.215,.61,.355,1)}from{opacity:0;-webkit-transform:translate3d(3000px,0,0);transform:translate3d(3000px,0,0)}60%{opacity:1;-webkit-transform:translate3d(-25px,0,0);transform:translate3d(-25px,0,0)}75%{-webkit-transform:translate3d(10px,0,0);transform:translate3d(10px,0,0)}90%{-webkit-transform:translate3d(-5px,0,0);transform:translate3d(-5px,0,0)}to{-webkit-transform:none;transform:none}}@keyframes bounceInRight{60%,75%,90%,from,to{-webkit-animation-timing-function:cubic-bezier(.215,.61,.355,1);animation-timing-function:cubic-bezier(.215,.61,.355,1)}from{opacity:0;-webkit-transform:translate3d(3000px,0,0);transform:translate3d(3000px,0,0)}60%{opacity:1;-webkit-transform:translate3d(-25px,0,0);transform:translate3d(-25px,0,0)}75%{-webkit-transform:translate3d(10px,0,0);transform:translate3d(10px,0,0)}90%{-webkit-transform:translate3d(-5px,0,0);transform:translate3d(-5px,0,0)}to{-webkit-transform:none;transform:none}}.bounceInRight{-webkit-animation-name:bounceInRight;animation-name:bounceInRight}@-webkit-keyframes bounceInUp{60%,75%,90%,from,to{-webkit-animation-timing-function:cubic-bezier(.215,.61,.355,1);animation-timing-function:cubic-bezier(.215,.61,.355,1)}from{opacity:0;-webkit-transform:translate3d(0,3000px,0);transform:translate3d(0,3000px,0)}60%{opacity:1;-webkit-transform:translate3d(0,-20px,0);transform:translate3d(0,-20px,0)}75%{-webkit-transform:translate3d(0,10px,0);transform:translate3d(0,10px,0)}90%{-webkit-transform:translate3d(0,-5px,0);transform:translate3d(0,-5px,0)}to{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}@keyframes bounceInUp{60%,75%,90%,from,to{-webkit-animation-timing-function:cubic-bezier(.215,.61,.355,1);animation-timing-function:cubic-bezier(.215,.61,.355,1)}from{opacity:0;-webkit-transform:translate3d(0,3000px,0);transform:translate3d(0,3000px,0)}60%{opacity:1;-webkit-transform:translate3d(0,-20px,0);transform:translate3d(0,-20px,0)}75%{-webkit-transform:translate3d(0,10px,0);transform:translate3d(0,10px,0)}90%{-webkit-transform:translate3d(0,-5px,0);transform:translate3d(0,-5px,0)}to{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.bounceInUp{-webkit-animation-name:bounceInUp;animation-name:bounceInUp}@-webkit-keyframes bounceOut{20%{-webkit-transform:scale3d(.9,.9,.9);transform:scale3d(.9,.9,.9)}50%,55%{opacity:1;-webkit-transform:scale3d(1.1,1.1,1.1);transform:scale3d(1.1,1.1,1.1)}to{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}}@keyframes bounceOut{20%{-webkit-transform:scale3d(.9,.9,.9);transform:scale3d(.9,.9,.9)}50%,55%{opacity:1;-webkit-transform:scale3d(1.1,1.1,1.1);transform:scale3d(1.1,1.1,1.1)}to{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}}.bounceOut{-webkit-animation-name:bounceOut;animation-name:bounceOut}@-webkit-keyframes bounceOutDown{20%{-webkit-transform:translate3d(0,10px,0);transform:translate3d(0,10px,0)}40%,45%{opacity:1;-webkit-transform:translate3d(0,-20px,0);transform:translate3d(0,-20px,0)}to{opacity:0;-webkit-transform:translate3d(0,2000px,0);transform:translate3d(0,2000px,0)}}@keyframes bounceOutDown{20%{-webkit-transform:translate3d(0,10px,0);transform:translate3d(0,10px,0)}40%,45%{opacity:1;-webkit-transform:translate3d(0,-20px,0);transform:translate3d(0,-20px,0)}to{opacity:0;-webkit-transform:translate3d(0,2000px,0);transform:translate3d(0,2000px,0)}}.bounceOutDown{-webkit-animation-name:bounceOutDown;animation-name:bounceOutDown}@-webkit-keyframes bounceOutLeft{20%{opacity:1;-webkit-transform:translate3d(20px,0,0);transform:translate3d(20px,0,0)}to{opacity:0;-webkit-transform:translate3d(-2000px,0,0);transform:translate3d(-2000px,0,0)}}@keyframes bounceOutLeft{20%{opacity:1;-webkit-transform:translate3d(20px,0,0);transform:translate3d(20px,0,0)}to{opacity:0;-webkit-transform:translate3d(-2000px,0,0);transform:translate3d(-2000px,0,0)}}.bounceOutLeft{-webkit-animation-name:bounceOutLeft;animation-name:bounceOutLeft}@-webkit-keyframes bounceOutRight{20%{opacity:1;-webkit-transform:translate3d(-20px,0,0);transform:translate3d(-20px,0,0)}to{opacity:0;-webkit-transform:translate3d(2000px,0,0);transform:translate3d(2000px,0,0)}}@keyframes bounceOutRight{20%{opacity:1;-webkit-transform:translate3d(-20px,0,0);transform:translate3d(-20px,0,0)}to{opacity:0;-webkit-transform:translate3d(2000px,0,0);transform:translate3d(2000px,0,0)}}.bounceOutRight{-webkit-animation-name:bounceOutRight;animation-name:bounceOutRight}@-webkit-keyframes bounceOutUp{20%{-webkit-transform:translate3d(0,-10px,0);transform:translate3d(0,-10px,0)}40%,45%{opacity:1;-webkit-transform:translate3d(0,20px,0);transform:translate3d(0,20px,0)}to{opacity:0;-webkit-transform:translate3d(0,-2000px,0);transform:translate3d(0,-2000px,0)}}@keyframes bounceOutUp{20%{-webkit-transform:translate3d(0,-10px,0);transform:translate3d(0,-10px,0)}40%,45%{opacity:1;-webkit-transform:translate3d(0,20px,0);transform:translate3d(0,20px,0)}to{opacity:0;-webkit-transform:translate3d(0,-2000px,0);transform:translate3d(0,-2000px,0)}}.bounceOutUp{-webkit-animation-name:bounceOutUp;animation-name:bounceOutUp}@-webkit-keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}.fadeIn{-webkit-animation-name:fadeIn;animation-name:fadeIn}@-webkit-keyframes fadeInDown{from{opacity:0;-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}to{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInDown{from{opacity:0;-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}to{opacity:1;-webkit-transform:none;transform:none}}.fadeInDown{-webkit-animation-name:fadeInDown;animation-name:fadeInDown}@-webkit-keyframes fadeInDownBig{from{opacity:0;-webkit-transform:translate3d(0,-2000px,0);transform:translate3d(0,-2000px,0)}to{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInDownBig{from{opacity:0;-webkit-transform:translate3d(0,-2000px,0);transform:translate3d(0,-2000px,0)}to{opacity:1;-webkit-transform:none;transform:none}}.fadeInDownBig{-webkit-animation-name:fadeInDownBig;animation-name:fadeInDownBig}@-webkit-keyframes fadeInLeft{from{opacity:0;-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}to{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInLeft{from{opacity:0;-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}to{opacity:1;-webkit-transform:none;transform:none}}.fadeInLeft{-webkit-animation-name:fadeInLeft;animation-name:fadeInLeft}@-webkit-keyframes fadeInLeftBig{from{opacity:0;-webkit-transform:translate3d(-2000px,0,0);transform:translate3d(-2000px,0,0)}to{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInLeftBig{from{opacity:0;-webkit-transform:translate3d(-2000px,0,0);transform:translate3d(-2000px,0,0)}to{opacity:1;-webkit-transform:none;transform:none}}.fadeInLeftBig{-webkit-animation-name:fadeInLeftBig;animation-name:fadeInLeftBig}@-webkit-keyframes fadeInRight{from{opacity:0;-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}to{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInRight{from{opacity:0;-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}to{opacity:1;-webkit-transform:none;transform:none}}.fadeInRight{-webkit-animation-name:fadeInRight;animation-name:fadeInRight}@-webkit-keyframes fadeInRightBig{from{opacity:0;-webkit-transform:translate3d(2000px,0,0);transform:translate3d(2000px,0,0)}to{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInRightBig{from{opacity:0;-webkit-transform:translate3d(2000px,0,0);transform:translate3d(2000px,0,0)}to{opacity:1;-webkit-transform:none;transform:none}}.fadeInRightBig{-webkit-animation-name:fadeInRightBig;animation-name:fadeInRightBig}@-webkit-keyframes fadeInUp{from{opacity:0;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}to{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInUp{from{opacity:0;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}to{opacity:1;-webkit-transform:none;transform:none}}.fadeInUp{-webkit-animation-name:fadeInUp;animation-name:fadeInUp}@-webkit-keyframes fadeInUpBig{from{opacity:0;-webkit-transform:translate3d(0,2000px,0);transform:translate3d(0,2000px,0)}to{opacity:1;-webkit-transform:none;transform:none}}@keyframes fadeInUpBig{from{opacity:0;-webkit-transform:translate3d(0,2000px,0);transform:translate3d(0,2000px,0)}to{opacity:1;-webkit-transform:none;transform:none}}.fadeInUpBig{-webkit-animation-name:fadeInUpBig;animation-name:fadeInUpBig}@-webkit-keyframes fadeOut{from{opacity:1}to{opacity:0}}@keyframes fadeOut{from{opacity:1}to{opacity:0}}.fadeOut{-webkit-animation-name:fadeOut;animation-name:fadeOut}@-webkit-keyframes fadeOutDown{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}}@keyframes fadeOutDown{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}}.fadeOutDown{-webkit-animation-name:fadeOutDown;animation-name:fadeOutDown}@-webkit-keyframes fadeOutDownBig{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(0,2000px,0);transform:translate3d(0,2000px,0)}}@keyframes fadeOutDownBig{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(0,2000px,0);transform:translate3d(0,2000px,0)}}.fadeOutDownBig{-webkit-animation-name:fadeOutDownBig;animation-name:fadeOutDownBig}@-webkit-keyframes fadeOutLeft{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}}@keyframes fadeOutLeft{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}}.fadeOutLeft{-webkit-animation-name:fadeOutLeft;animation-name:fadeOutLeft}@-webkit-keyframes fadeOutLeftBig{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(-2000px,0,0);transform:translate3d(-2000px,0,0)}}@keyframes fadeOutLeftBig{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(-2000px,0,0);transform:translate3d(-2000px,0,0)}}.fadeOutLeftBig{-webkit-animation-name:fadeOutLeftBig;animation-name:fadeOutLeftBig}@-webkit-keyframes fadeOutRight{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}}@keyframes fadeOutRight{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}}.fadeOutRight{-webkit-animation-name:fadeOutRight;animation-name:fadeOutRight}@-webkit-keyframes fadeOutRightBig{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(2000px,0,0);transform:translate3d(2000px,0,0)}}@keyframes fadeOutRightBig{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(2000px,0,0);transform:translate3d(2000px,0,0)}}.fadeOutRightBig{-webkit-animation-name:fadeOutRightBig;animation-name:fadeOutRightBig}@-webkit-keyframes fadeOutUp{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}}@keyframes fadeOutUp{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}}.fadeOutUp{-webkit-animation-name:fadeOutUp;animation-name:fadeOutUp}@-webkit-keyframes fadeOutUpBig{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(0,-2000px,0);transform:translate3d(0,-2000px,0)}}@keyframes fadeOutUpBig{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(0,-2000px,0);transform:translate3d(0,-2000px,0)}}.fadeOutUpBig{-webkit-animation-name:fadeOutUpBig;animation-name:fadeOutUpBig}@-webkit-keyframes flip{from{-webkit-transform:perspective(400px) rotate3d(0,1,0,-360deg);transform:perspective(400px) rotate3d(0,1,0,-360deg);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}40%{-webkit-transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-190deg);transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-190deg);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}50%{-webkit-transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-170deg);transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-170deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}80%{-webkit-transform:perspective(400px) scale3d(.95,.95,.95);transform:perspective(400px) scale3d(.95,.95,.95);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}to{-webkit-transform:perspective(400px);transform:perspective(400px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}}@keyframes flip{from{-webkit-transform:perspective(400px) rotate3d(0,1,0,-360deg);transform:perspective(400px) rotate3d(0,1,0,-360deg);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}40%{-webkit-transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-190deg);transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-190deg);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}50%{-webkit-transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-170deg);transform:perspective(400px) translate3d(0,0,150px) rotate3d(0,1,0,-170deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}80%{-webkit-transform:perspective(400px) scale3d(.95,.95,.95);transform:perspective(400px) scale3d(.95,.95,.95);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}to{-webkit-transform:perspective(400px);transform:perspective(400px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}}.animated.flip{-webkit-backface-visibility:visible;backface-visibility:visible;-webkit-animation-name:flip;animation-name:flip}@-webkit-keyframes flipInX{from{-webkit-transform:perspective(400px) rotate3d(1,0,0,90deg);transform:perspective(400px) rotate3d(1,0,0,90deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in;opacity:0}40%{-webkit-transform:perspective(400px) rotate3d(1,0,0,-20deg);transform:perspective(400px) rotate3d(1,0,0,-20deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}60%{-webkit-transform:perspective(400px) rotate3d(1,0,0,10deg);transform:perspective(400px) rotate3d(1,0,0,10deg);opacity:1}80%{-webkit-transform:perspective(400px) rotate3d(1,0,0,-5deg);transform:perspective(400px) rotate3d(1,0,0,-5deg)}to{-webkit-transform:perspective(400px);transform:perspective(400px)}}@keyframes flipInX{from{-webkit-transform:perspective(400px) rotate3d(1,0,0,90deg);transform:perspective(400px) rotate3d(1,0,0,90deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in;opacity:0}40%{-webkit-transform:perspective(400px) rotate3d(1,0,0,-20deg);transform:perspective(400px) rotate3d(1,0,0,-20deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}60%{-webkit-transform:perspective(400px) rotate3d(1,0,0,10deg);transform:perspective(400px) rotate3d(1,0,0,10deg);opacity:1}80%{-webkit-transform:perspective(400px) rotate3d(1,0,0,-5deg);transform:perspective(400px) rotate3d(1,0,0,-5deg)}to{-webkit-transform:perspective(400px);transform:perspective(400px)}}.flipInX{-webkit-backface-visibility:visible!important;backface-visibility:visible!important;-webkit-animation-name:flipInX;animation-name:flipInX}.flipInY,.flipOutX{-webkit-backface-visibility:visible!important}@-webkit-keyframes flipInY{from{-webkit-transform:perspective(400px) rotate3d(0,1,0,90deg);transform:perspective(400px) rotate3d(0,1,0,90deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in;opacity:0}40%{-webkit-transform:perspective(400px) rotate3d(0,1,0,-20deg);transform:perspective(400px) rotate3d(0,1,0,-20deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}60%{-webkit-transform:perspective(400px) rotate3d(0,1,0,10deg);transform:perspective(400px) rotate3d(0,1,0,10deg);opacity:1}80%{-webkit-transform:perspective(400px) rotate3d(0,1,0,-5deg);transform:perspective(400px) rotate3d(0,1,0,-5deg)}to{-webkit-transform:perspective(400px);transform:perspective(400px)}}@keyframes flipInY{from{-webkit-transform:perspective(400px) rotate3d(0,1,0,90deg);transform:perspective(400px) rotate3d(0,1,0,90deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in;opacity:0}40%{-webkit-transform:perspective(400px) rotate3d(0,1,0,-20deg);transform:perspective(400px) rotate3d(0,1,0,-20deg);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}60%{-webkit-transform:perspective(400px) rotate3d(0,1,0,10deg);transform:perspective(400px) rotate3d(0,1,0,10deg);opacity:1}80%{-webkit-transform:perspective(400px) rotate3d(0,1,0,-5deg);transform:perspective(400px) rotate3d(0,1,0,-5deg)}to{-webkit-transform:perspective(400px);transform:perspective(400px)}}.flipInY{backface-visibility:visible!important;-webkit-animation-name:flipInY;animation-name:flipInY}@-webkit-keyframes flipOutX{from{-webkit-transform:perspective(400px);transform:perspective(400px)}30%{-webkit-transform:perspective(400px) rotate3d(1,0,0,-20deg);transform:perspective(400px) rotate3d(1,0,0,-20deg);opacity:1}to{-webkit-transform:perspective(400px) rotate3d(1,0,0,90deg);transform:perspective(400px) rotate3d(1,0,0,90deg);opacity:0}}@keyframes flipOutX{from{-webkit-transform:perspective(400px);transform:perspective(400px)}30%{-webkit-transform:perspective(400px) rotate3d(1,0,0,-20deg);transform:perspective(400px) rotate3d(1,0,0,-20deg);opacity:1}to{-webkit-transform:perspective(400px) rotate3d(1,0,0,90deg);transform:perspective(400px) rotate3d(1,0,0,90deg);opacity:0}}.flipOutX{-webkit-animation-name:flipOutX;animation-name:flipOutX;backface-visibility:visible!important}@-webkit-keyframes flipOutY{from{-webkit-transform:perspective(400px);transform:perspective(400px)}30%{-webkit-transform:perspective(400px) rotate3d(0,1,0,-15deg);transform:perspective(400px) rotate3d(0,1,0,-15deg);opacity:1}to{-webkit-transform:perspective(400px) rotate3d(0,1,0,90deg);transform:perspective(400px) rotate3d(0,1,0,90deg);opacity:0}}@keyframes flipOutY{from{-webkit-transform:perspective(400px);transform:perspective(400px)}30%{-webkit-transform:perspective(400px) rotate3d(0,1,0,-15deg);transform:perspective(400px) rotate3d(0,1,0,-15deg);opacity:1}to{-webkit-transform:perspective(400px) rotate3d(0,1,0,90deg);transform:perspective(400px) rotate3d(0,1,0,90deg);opacity:0}}.flipOutY{-webkit-backface-visibility:visible!important;backface-visibility:visible!important;-webkit-animation-name:flipOutY;animation-name:flipOutY}@-webkit-keyframes lightSpeedIn{from{-webkit-transform:translate3d(100%,0,0) skewX(-30deg);transform:translate3d(100%,0,0) skewX(-30deg);opacity:0}60%{-webkit-transform:skewX(20deg);transform:skewX(20deg);opacity:1}80%{-webkit-transform:skewX(-5deg);transform:skewX(-5deg);opacity:1}to{-webkit-transform:none;transform:none;opacity:1}}@keyframes lightSpeedIn{from{-webkit-transform:translate3d(100%,0,0) skewX(-30deg);transform:translate3d(100%,0,0) skewX(-30deg);opacity:0}60%{-webkit-transform:skewX(20deg);transform:skewX(20deg);opacity:1}80%{-webkit-transform:skewX(-5deg);transform:skewX(-5deg);opacity:1}to{-webkit-transform:none;transform:none;opacity:1}}.lightSpeedIn{-webkit-animation-name:lightSpeedIn;animation-name:lightSpeedIn;-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}@-webkit-keyframes lightSpeedOut{from{opacity:1}to{-webkit-transform:translate3d(100%,0,0) skewX(30deg);transform:translate3d(100%,0,0) skewX(30deg);opacity:0}}@keyframes lightSpeedOut{from{opacity:1}to{-webkit-transform:translate3d(100%,0,0) skewX(30deg);transform:translate3d(100%,0,0) skewX(30deg);opacity:0}}.lightSpeedOut{-webkit-animation-name:lightSpeedOut;animation-name:lightSpeedOut;-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}@-webkit-keyframes rotateIn{from{-webkit-transform-origin:center;transform-origin:center;-webkit-transform:rotate3d(0,0,1,-200deg);transform:rotate3d(0,0,1,-200deg);opacity:0}to{-webkit-transform-origin:center;transform-origin:center;-webkit-transform:none;transform:none;opacity:1}}@keyframes rotateIn{from{-webkit-transform-origin:center;transform-origin:center;-webkit-transform:rotate3d(0,0,1,-200deg);transform:rotate3d(0,0,1,-200deg);opacity:0}to{-webkit-transform-origin:center;transform-origin:center;-webkit-transform:none;transform:none;opacity:1}}.rotateIn{-webkit-animation-name:rotateIn;animation-name:rotateIn}@-webkit-keyframes rotateInDownLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,-45deg);transform:rotate3d(0,0,1,-45deg);opacity:0}to{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:none;transform:none;opacity:1}}@keyframes rotateInDownLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,-45deg);transform:rotate3d(0,0,1,-45deg);opacity:0}to{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:none;transform:none;opacity:1}}.rotateInDownLeft{-webkit-animation-name:rotateInDownLeft;animation-name:rotateInDownLeft}@-webkit-keyframes rotateInDownRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,45deg);transform:rotate3d(0,0,1,45deg);opacity:0}to{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:none;transform:none;opacity:1}}@keyframes rotateInDownRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,45deg);transform:rotate3d(0,0,1,45deg);opacity:0}to{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:none;transform:none;opacity:1}}.rotateInDownRight{-webkit-animation-name:rotateInDownRight;animation-name:rotateInDownRight}@-webkit-keyframes rotateInUpLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,45deg);transform:rotate3d(0,0,1,45deg);opacity:0}to{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:none;transform:none;opacity:1}}@keyframes rotateInUpLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,45deg);transform:rotate3d(0,0,1,45deg);opacity:0}to{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:none;transform:none;opacity:1}}.rotateInUpLeft{-webkit-animation-name:rotateInUpLeft;animation-name:rotateInUpLeft}@-webkit-keyframes rotateInUpRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,-90deg);transform:rotate3d(0,0,1,-90deg);opacity:0}to{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:none;transform:none;opacity:1}}@keyframes rotateInUpRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,-90deg);transform:rotate3d(0,0,1,-90deg);opacity:0}to{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:none;transform:none;opacity:1}}.rotateInUpRight{-webkit-animation-name:rotateInUpRight;animation-name:rotateInUpRight}@-webkit-keyframes rotateOut{from{-webkit-transform-origin:center;transform-origin:center;opacity:1}to{-webkit-transform-origin:center;transform-origin:center;-webkit-transform:rotate3d(0,0,1,200deg);transform:rotate3d(0,0,1,200deg);opacity:0}}@keyframes rotateOut{from{-webkit-transform-origin:center;transform-origin:center;opacity:1}to{-webkit-transform-origin:center;transform-origin:center;-webkit-transform:rotate3d(0,0,1,200deg);transform:rotate3d(0,0,1,200deg);opacity:0}}.rotateOut{-webkit-animation-name:rotateOut;animation-name:rotateOut}@-webkit-keyframes rotateOutDownLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;opacity:1}to{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,45deg);transform:rotate3d(0,0,1,45deg);opacity:0}}@keyframes rotateOutDownLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;opacity:1}to{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,45deg);transform:rotate3d(0,0,1,45deg);opacity:0}}.rotateOutDownLeft{-webkit-animation-name:rotateOutDownLeft;animation-name:rotateOutDownLeft}@-webkit-keyframes rotateOutDownRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;opacity:1}to{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,-45deg);transform:rotate3d(0,0,1,-45deg);opacity:0}}@keyframes rotateOutDownRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;opacity:1}to{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,-45deg);transform:rotate3d(0,0,1,-45deg);opacity:0}}.rotateOutDownRight{-webkit-animation-name:rotateOutDownRight;animation-name:rotateOutDownRight}@-webkit-keyframes rotateOutUpLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;opacity:1}to{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,-45deg);transform:rotate3d(0,0,1,-45deg);opacity:0}}@keyframes rotateOutUpLeft{from{-webkit-transform-origin:left bottom;transform-origin:left bottom;opacity:1}to{-webkit-transform-origin:left bottom;transform-origin:left bottom;-webkit-transform:rotate3d(0,0,1,-45deg);transform:rotate3d(0,0,1,-45deg);opacity:0}}.rotateOutUpLeft{-webkit-animation-name:rotateOutUpLeft;animation-name:rotateOutUpLeft}@-webkit-keyframes rotateOutUpRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;opacity:1}to{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,90deg);transform:rotate3d(0,0,1,90deg);opacity:0}}@keyframes rotateOutUpRight{from{-webkit-transform-origin:right bottom;transform-origin:right bottom;opacity:1}to{-webkit-transform-origin:right bottom;transform-origin:right bottom;-webkit-transform:rotate3d(0,0,1,90deg);transform:rotate3d(0,0,1,90deg);opacity:0}}.rotateOutUpRight{-webkit-animation-name:rotateOutUpRight;animation-name:rotateOutUpRight}@-webkit-keyframes hinge{0%{-webkit-transform-origin:top left;transform-origin:top left;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out}20%,60%{-webkit-transform:rotate3d(0,0,1,80deg);transform:rotate3d(0,0,1,80deg);-webkit-transform-origin:top left;transform-origin:top left;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out}40%,80%{-webkit-transform:rotate3d(0,0,1,60deg);transform:rotate3d(0,0,1,60deg);-webkit-transform-origin:top left;transform-origin:top left;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out;opacity:1}to{-webkit-transform:translate3d(0,700px,0);transform:translate3d(0,700px,0);opacity:0}}@keyframes hinge{0%{-webkit-transform-origin:top left;transform-origin:top left;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out}20%,60%{-webkit-transform:rotate3d(0,0,1,80deg);transform:rotate3d(0,0,1,80deg);-webkit-transform-origin:top left;transform-origin:top left;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out}40%,80%{-webkit-transform:rotate3d(0,0,1,60deg);transform:rotate3d(0,0,1,60deg);-webkit-transform-origin:top left;transform-origin:top left;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out;opacity:1}to{-webkit-transform:translate3d(0,700px,0);transform:translate3d(0,700px,0);opacity:0}}.hinge{-webkit-animation-name:hinge;animation-name:hinge}@-webkit-keyframes rollIn{from{opacity:0;-webkit-transform:translate3d(-100%,0,0) rotate3d(0,0,1,-120deg);transform:translate3d(-100%,0,0) rotate3d(0,0,1,-120deg)}to{opacity:1;-webkit-transform:none;transform:none}}@keyframes rollIn{from{opacity:0;-webkit-transform:translate3d(-100%,0,0) rotate3d(0,0,1,-120deg);transform:translate3d(-100%,0,0) rotate3d(0,0,1,-120deg)}to{opacity:1;-webkit-transform:none;transform:none}}.rollIn{-webkit-animation-name:rollIn;animation-name:rollIn}@-webkit-keyframes rollOut{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(100%,0,0) rotate3d(0,0,1,120deg);transform:translate3d(100%,0,0) rotate3d(0,0,1,120deg)}}@keyframes rollOut{from{opacity:1}to{opacity:0;-webkit-transform:translate3d(100%,0,0) rotate3d(0,0,1,120deg);transform:translate3d(100%,0,0) rotate3d(0,0,1,120deg)}}.rollOut{-webkit-animation-name:rollOut;animation-name:rollOut}@-webkit-keyframes zoomIn{from{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}50%{opacity:1}}@keyframes zoomIn{from{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}50%{opacity:1}}.zoomIn{-webkit-animation-name:zoomIn;animation-name:zoomIn}@-webkit-keyframes zoomInDown{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,-1000px,0);transform:scale3d(.1,.1,.1) translate3d(0,-1000px,0);-webkit-animation-timing-function:cubic-bezier(.55,.055,.675,.19);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,60px,0);transform:scale3d(.475,.475,.475) translate3d(0,60px,0);-webkit-animation-timing-function:cubic-bezier(.175,.885,.32,1);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}@keyframes zoomInDown{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,-1000px,0);transform:scale3d(.1,.1,.1) translate3d(0,-1000px,0);-webkit-animation-timing-function:cubic-bezier(.55,.055,.675,.19);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,60px,0);transform:scale3d(.475,.475,.475) translate3d(0,60px,0);-webkit-animation-timing-function:cubic-bezier(.175,.885,.32,1);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}.zoomInDown{-webkit-animation-name:zoomInDown;animation-name:zoomInDown}@-webkit-keyframes zoomInLeft{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(-1000px,0,0);transform:scale3d(.1,.1,.1) translate3d(-1000px,0,0);-webkit-animation-timing-function:cubic-bezier(.55,.055,.675,.19);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(10px,0,0);transform:scale3d(.475,.475,.475) translate3d(10px,0,0);-webkit-animation-timing-function:cubic-bezier(.175,.885,.32,1);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}@keyframes zoomInLeft{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(-1000px,0,0);transform:scale3d(.1,.1,.1) translate3d(-1000px,0,0);-webkit-animation-timing-function:cubic-bezier(.55,.055,.675,.19);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(10px,0,0);transform:scale3d(.475,.475,.475) translate3d(10px,0,0);-webkit-animation-timing-function:cubic-bezier(.175,.885,.32,1);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}.zoomInLeft{-webkit-animation-name:zoomInLeft;animation-name:zoomInLeft}@-webkit-keyframes zoomInRight{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(1000px,0,0);transform:scale3d(.1,.1,.1) translate3d(1000px,0,0);-webkit-animation-timing-function:cubic-bezier(.55,.055,.675,.19);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(-10px,0,0);transform:scale3d(.475,.475,.475) translate3d(-10px,0,0);-webkit-animation-timing-function:cubic-bezier(.175,.885,.32,1);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}@keyframes zoomInRight{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(1000px,0,0);transform:scale3d(.1,.1,.1) translate3d(1000px,0,0);-webkit-animation-timing-function:cubic-bezier(.55,.055,.675,.19);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(-10px,0,0);transform:scale3d(.475,.475,.475) translate3d(-10px,0,0);-webkit-animation-timing-function:cubic-bezier(.175,.885,.32,1);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}.zoomInRight{-webkit-animation-name:zoomInRight;animation-name:zoomInRight}@-webkit-keyframes zoomInUp{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,1000px,0);transform:scale3d(.1,.1,.1) translate3d(0,1000px,0);-webkit-animation-timing-function:cubic-bezier(.55,.055,.675,.19);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);-webkit-animation-timing-function:cubic-bezier(.175,.885,.32,1);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}@keyframes zoomInUp{from{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,1000px,0);transform:scale3d(.1,.1,.1) translate3d(0,1000px,0);-webkit-animation-timing-function:cubic-bezier(.55,.055,.675,.19);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}60%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);-webkit-animation-timing-function:cubic-bezier(.175,.885,.32,1);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}.zoomInUp{-webkit-animation-name:zoomInUp;animation-name:zoomInUp}@-webkit-keyframes zoomOut{from{opacity:1}50%{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}to{opacity:0}}@keyframes zoomOut{from{opacity:1}50%{opacity:0;-webkit-transform:scale3d(.3,.3,.3);transform:scale3d(.3,.3,.3)}to{opacity:0}}.zoomOut{-webkit-animation-name:zoomOut;animation-name:zoomOut}@-webkit-keyframes zoomOutDown{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);-webkit-animation-timing-function:cubic-bezier(.55,.055,.675,.19);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}to{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,2000px,0);transform:scale3d(.1,.1,.1) translate3d(0,2000px,0);-webkit-transform-origin:center bottom;transform-origin:center bottom;-webkit-animation-timing-function:cubic-bezier(.175,.885,.32,1);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}@keyframes zoomOutDown{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);transform:scale3d(.475,.475,.475) translate3d(0,-60px,0);-webkit-animation-timing-function:cubic-bezier(.55,.055,.675,.19);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}to{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,2000px,0);transform:scale3d(.1,.1,.1) translate3d(0,2000px,0);-webkit-transform-origin:center bottom;transform-origin:center bottom;-webkit-animation-timing-function:cubic-bezier(.175,.885,.32,1);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}.zoomOutDown{-webkit-animation-name:zoomOutDown;animation-name:zoomOutDown}@-webkit-keyframes zoomOutLeft{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(42px,0,0);transform:scale3d(.475,.475,.475) translate3d(42px,0,0)}to{opacity:0;-webkit-transform:scale(.1) translate3d(-2000px,0,0);transform:scale(.1) translate3d(-2000px,0,0);-webkit-transform-origin:left center;transform-origin:left center}}@keyframes zoomOutLeft{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(42px,0,0);transform:scale3d(.475,.475,.475) translate3d(42px,0,0)}to{opacity:0;-webkit-transform:scale(.1) translate3d(-2000px,0,0);transform:scale(.1) translate3d(-2000px,0,0);-webkit-transform-origin:left center;transform-origin:left center}}.zoomOutLeft{-webkit-animation-name:zoomOutLeft;animation-name:zoomOutLeft}@-webkit-keyframes zoomOutRight{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(-42px,0,0);transform:scale3d(.475,.475,.475) translate3d(-42px,0,0)}to{opacity:0;-webkit-transform:scale(.1) translate3d(2000px,0,0);transform:scale(.1) translate3d(2000px,0,0);-webkit-transform-origin:right center;transform-origin:right center}}@keyframes zoomOutRight{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(-42px,0,0);transform:scale3d(.475,.475,.475) translate3d(-42px,0,0)}to{opacity:0;-webkit-transform:scale(.1) translate3d(2000px,0,0);transform:scale(.1) translate3d(2000px,0,0);-webkit-transform-origin:right center;transform-origin:right center}}.zoomOutRight{-webkit-animation-name:zoomOutRight;animation-name:zoomOutRight}@-webkit-keyframes zoomOutUp{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,60px,0);transform:scale3d(.475,.475,.475) translate3d(0,60px,0);-webkit-animation-timing-function:cubic-bezier(.55,.055,.675,.19);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}to{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,-2000px,0);transform:scale3d(.1,.1,.1) translate3d(0,-2000px,0);-webkit-transform-origin:center bottom;transform-origin:center bottom;-webkit-animation-timing-function:cubic-bezier(.175,.885,.32,1);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}@keyframes zoomOutUp{40%{opacity:1;-webkit-transform:scale3d(.475,.475,.475) translate3d(0,60px,0);transform:scale3d(.475,.475,.475) translate3d(0,60px,0);-webkit-animation-timing-function:cubic-bezier(.55,.055,.675,.19);animation-timing-function:cubic-bezier(.55,.055,.675,.19)}to{opacity:0;-webkit-transform:scale3d(.1,.1,.1) translate3d(0,-2000px,0);transform:scale3d(.1,.1,.1) translate3d(0,-2000px,0);-webkit-transform-origin:center bottom;transform-origin:center bottom;-webkit-animation-timing-function:cubic-bezier(.175,.885,.32,1);animation-timing-function:cubic-bezier(.175,.885,.32,1)}}.zoomOutUp{-webkit-animation-name:zoomOutUp;animation-name:zoomOutUp}@-webkit-keyframes slideInDown{from{-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0);visibility:visible}to{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}@keyframes slideInDown{from{-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0);visibility:visible}to{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.slideInDown{-webkit-animation-name:slideInDown;animation-name:slideInDown}@-webkit-keyframes slideInLeft{from{-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0);visibility:visible}to{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}@keyframes slideInLeft{from{-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0);visibility:visible}to{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.slideInLeft{-webkit-animation-name:slideInLeft;animation-name:slideInLeft}@-webkit-keyframes slideInRight{from{-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0);visibility:visible}to{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}@keyframes slideInRight{from{-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0);visibility:visible}to{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.slideInRight{-webkit-animation-name:slideInRight;animation-name:slideInRight}@-webkit-keyframes slideInUp{from{-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0);visibility:visible}to{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}@keyframes slideInUp{from{-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0);visibility:visible}to{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}}.slideInUp{-webkit-animation-name:slideInUp;animation-name:slideInUp}@-webkit-keyframes slideOutDown{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}to{visibility:hidden;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}}@keyframes slideOutDown{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}to{visibility:hidden;-webkit-transform:translate3d(0,100%,0);transform:translate3d(0,100%,0)}}.slideOutDown{-webkit-animation-name:slideOutDown;animation-name:slideOutDown}@-webkit-keyframes slideOutLeft{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}to{visibility:hidden;-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}}@keyframes slideOutLeft{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}to{visibility:hidden;-webkit-transform:translate3d(-100%,0,0);transform:translate3d(-100%,0,0)}}.slideOutLeft{-webkit-animation-name:slideOutLeft;animation-name:slideOutLeft}@-webkit-keyframes slideOutRight{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}to{visibility:hidden;-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}}@keyframes slideOutRight{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}to{visibility:hidden;-webkit-transform:translate3d(100%,0,0);transform:translate3d(100%,0,0)}}.slideOutRight{-webkit-animation-name:slideOutRight;animation-name:slideOutRight}@-webkit-keyframes slideOutUp{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}to{visibility:hidden;-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}}@keyframes slideOutUp{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}to{visibility:hidden;-webkit-transform:translate3d(0,-100%,0);transform:translate3d(0,-100%,0)}}.slideOutUp{-webkit-animation-name:slideOutUp;animation-name:slideOutUp}');
  registerCSS('div.am-wrapper,div.am-wrapper>div{position:absolute}.am-hide{opacity:0}div.am-wrapper{top:0;left:0;width:100%;min-height:100%;overflow:hidden}div.am-wrapper>div.no_margin *{margin:0!important}');
  registerCSS('.am-page,.am-page iframe{width:100%;height:100%;position:absolute}html{height:100%}body[data-am-next-slide]{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;cursor:default}body[data-am-next-slide] a{cursor:pointer}body.am-wrapper{height:100%;margin:0!important;overflow:hidden;text-align:left;background:#222!important;-webkit-perspective:1200px;-moz-perspective:1200px;perspective:1200px}.am-page{top:0;left:0;z-index:0;-webkit-backface-visibility:hidden;-moz-backface-visibility:hidden;backface-visibility:hidden;-webkit-transform:translate3d(0,0,0);-moz-transform:translate3d(0,0,0);transform:translate3d(0,0,0);-webkit-transform-style:preserve-3d;-moz-transform-style:preserve-3d;transform-style:preserve-3d}#am-page-in{background:#fff}#am-page-out{z-index:1}.am-page.am-page-ontop{z-index:2!important}.am-page iframe{border:0}.am-page-idle{-webkit-animation:idle .1s ease both;animation:idle .1s ease both}.am-page-moveToLeft{-webkit-animation:moveToLeft .6s ease both;animation:moveToLeft .6s ease both}.am-page-moveFromLeft{-webkit-animation:moveFromLeft .6s ease both;animation:moveFromLeft .6s ease both}.am-page-moveToRight{-webkit-animation:moveToRight .6s ease both;animation:moveToRight .6s ease both}.am-page-moveFromRight{-webkit-animation:moveFromRight .6s ease both;animation:moveFromRight .6s ease both}.am-page-moveToTop{-webkit-animation:moveToTop .6s ease both;animation:moveToTop .6s ease both}.am-page-moveFromTop{-webkit-animation:moveFromTop .6s ease both;animation:moveFromTop .6s ease both}.am-page-moveToBottom{-webkit-animation:moveToBottom .6s ease both;animation:moveToBottom .6s ease both}.am-page-moveFromBottom{-webkit-animation:moveFromBottom .6s ease both;animation:moveFromBottom .6s ease both}.am-page-fade{-webkit-animation:fade .7s ease both;animation:fade .7s ease both}.am-page-moveToLeftFade{-webkit-animation:moveToLeftFade .7s ease both;animation:moveToLeftFade .7s ease both}.am-page-moveFromLeftFade{-webkit-animation:moveFromLeftFade .7s ease both;animation:moveFromLeftFade .7s ease both}.am-page-moveToRightFade{-webkit-animation:moveToRightFade .7s ease both;animation:moveToRightFade .7s ease both}.am-page-moveFromRightFade{-webkit-animation:moveFromRightFade .7s ease both;animation:moveFromRightFade .7s ease both}.am-page-moveToTopFade{-webkit-animation:moveToTopFade .7s ease both;animation:moveToTopFade .7s ease both}.am-page-moveFromTopFade{-webkit-animation:moveFromTopFade .7s ease both;animation:moveFromTopFade .7s ease both}.am-page-moveToBottomFade{-webkit-animation:moveToBottomFade .7s ease both;animation:moveToBottomFade .7s ease both}.am-page-moveFromBottomFade{-webkit-animation:moveFromBottomFade .7s ease both;animation:moveFromBottomFade .7s ease both}.am-page-moveToLeftEasing{-webkit-animation:moveToLeft .7s ease-in-out both;animation:moveToLeft .7s ease-in-out both}.am-page-moveToRightEasing{-webkit-animation:moveToRight .7s ease-in-out both;animation:moveToRight .7s ease-in-out both}.am-page-moveToTopEasing{-webkit-animation:moveToTop .7s ease-in-out both;animation:moveToTop .7s ease-in-out both}.am-page-moveToBottomEasing{-webkit-animation:moveToBottom .7s ease-in-out both;animation:moveToBottom .7s ease-in-out both}@-webkit-keyframes moveToLeft{to{-webkit-transform:translateX(-100%)}}@keyframes moveToLeft{to{-webkit-transform:translateX(-100%);transform:translateX(-100%)}}@-webkit-keyframes moveFromLeft{from{-webkit-transform:translateX(-100%)}}@keyframes moveFromLeft{from{-webkit-transform:translateX(-100%);transform:translateX(-100%)}}@-webkit-keyframes moveToRight{to{-webkit-transform:translateX(100%)}}@keyframes moveToRight{to{-webkit-transform:translateX(100%);transform:translateX(100%)}}@-webkit-keyframes moveFromRight{from{-webkit-transform:translateX(100%)}}@keyframes moveFromRight{from{-webkit-transform:translateX(100%);transform:translateX(100%)}}@-webkit-keyframes moveToTop{to{-webkit-transform:translateY(-100%)}}@keyframes moveToTop{to{-webkit-transform:translateY(-100%);transform:translateY(-100%)}}@-webkit-keyframes moveFromTop{from{-webkit-transform:translateY(-100%)}}@keyframes moveFromTop{from{-webkit-transform:translateY(-100%);transform:translateY(-100%)}}@-webkit-keyframes moveToBottom{to{-webkit-transform:translateY(100%)}}@keyframes moveToBottom{to{-webkit-transform:translateY(100%);transform:translateY(100%)}}@-webkit-keyframes moveFromBottom{from{-webkit-transform:translateY(100%)}}@keyframes moveFromBottom{from{-webkit-transform:translateY(100%);transform:translateY(100%)}}@-webkit-keyframes fade{to{opacity:.3}}@keyframes fade{to{opacity:.3}}@-webkit-keyframes moveToLeftFade{to{opacity:.3;-webkit-transform:translateX(-100%)}}@keyframes moveToLeftFade{to{opacity:.3;-webkit-transform:translateX(-100%);transform:translateX(-100%)}}@-webkit-keyframes moveFromLeftFade{from{opacity:.3;-webkit-transform:translateX(-100%)}}@keyframes moveFromLeftFade{from{opacity:.3;-webkit-transform:translateX(-100%);transform:translateX(-100%)}}@-webkit-keyframes moveToRightFade{to{opacity:.3;-webkit-transform:translateX(100%)}}@keyframes moveToRightFade{to{opacity:.3;-webkit-transform:translateX(100%);transform:translateX(100%)}}@-webkit-keyframes moveFromRightFade{from{opacity:.3;-webkit-transform:translateX(100%)}}@keyframes moveFromRightFade{from{opacity:.3;-webkit-transform:translateX(100%);transform:translateX(100%)}}@-webkit-keyframes moveToTopFade{to{opacity:.3;-webkit-transform:translateY(-100%)}}@keyframes moveToTopFade{to{opacity:.3;-webkit-transform:translateY(-100%);transform:translateY(-100%)}}@-webkit-keyframes moveFromTopFade{from{opacity:.3;-webkit-transform:translateY(-100%)}}@keyframes moveFromTopFade{from{opacity:.3;-webkit-transform:translateY(-100%);transform:translateY(-100%)}}@-webkit-keyframes moveToBottomFade{to{opacity:.3;-webkit-transform:translateY(100%)}}@keyframes moveToBottomFade{to{opacity:.3;-webkit-transform:translateY(100%);transform:translateY(100%)}}@-webkit-keyframes moveFromBottomFade{from{opacity:.3;-webkit-transform:translateY(100%)}}@keyframes moveFromBottomFade{from{opacity:.3;-webkit-transform:translateY(100%);transform:translateY(100%)}}.am-page-scaleDown{-webkit-animation:scaleDown .7s ease both;animation:scaleDown .7s ease both}.am-page-scaleUp{-webkit-animation:scaleUp .7s ease both;animation:scaleUp .7s ease both}.am-page-scaleUpDown{-webkit-animation:scaleUpDown .5s ease both;animation:scaleUpDown .5s ease both}.am-page-scaleDownUp{-webkit-animation:scaleDownUp .5s ease both;animation:scaleDownUp .5s ease both}.am-page-scaleDownCenter{-webkit-animation:scaleDownCenter .4s ease-in both;animation:scaleDownCenter .4s ease-in both}.am-page-scaleUpCenter{-webkit-animation:scaleUpCenter .4s ease-out both;animation:scaleUpCenter .4s ease-out both}@-webkit-keyframes scaleDown{to{opacity:0;-webkit-transform:scale(.8)}}@keyframes scaleDown{to{opacity:0;-webkit-transform:scale(.8);transform:scale(.8)}}@-webkit-keyframes scaleUp{from{opacity:0;-webkit-transform:scale(.8)}}@keyframes scaleUp{from{opacity:0;-webkit-transform:scale(.8);transform:scale(.8)}}@-webkit-keyframes scaleUpDown{from{opacity:0;-webkit-transform:scale(1.2)}}@keyframes scaleUpDown{from{opacity:0;-webkit-transform:scale(1.2);transform:scale(1.2)}}@-webkit-keyframes scaleDownUp{to{opacity:0;-webkit-transform:scale(1.2)}}@keyframes scaleDownUp{to{opacity:0;-webkit-transform:scale(1.2);transform:scale(1.2)}}@-webkit-keyframes scaleDownCenter{to{opacity:0;-webkit-transform:scale(.7)}}@keyframes scaleDownCenter{to{opacity:0;-webkit-transform:scale(.7);transform:scale(.7)}}@-webkit-keyframes scaleUpCenter{from{opacity:0;-webkit-transform:scale(.7)}}@keyframes scaleUpCenter{from{opacity:0;-webkit-transform:scale(.7);transform:scale(.7)}}.am-page-rotateRightSideFirst{-webkit-transform-origin:0 50%;transform-origin:0 50%;-webkit-animation:rotateRightSideFirst .8s both ease-in;animation:rotateRightSideFirst .8s both ease-in}.am-page-rotateLeftSideFirst{-webkit-transform-origin:100% 50%;transform-origin:100% 50%;-webkit-animation:rotateLeftSideFirst .8s both ease-in;animation:rotateLeftSideFirst .8s both ease-in}.am-page-rotateTopSideFirst{-webkit-transform-origin:50% 100%;transform-origin:50% 100%;-webkit-animation:rotateTopSideFirst .8s both ease-in;animation:rotateTopSideFirst .8s both ease-in}.am-page-rotateBottomSideFirst{-webkit-transform-origin:50% 0;transform-origin:50% 0;-webkit-animation:rotateBottomSideFirst .8s both ease-in;animation:rotateBottomSideFirst .8s both ease-in}.am-page-flipOutRight{-webkit-transform-origin:50% 50%;transform-origin:50% 50%;-webkit-animation:flipOutRight .5s both ease-in;animation:flipOutRight .5s both ease-in}.am-page-flipInLeft{-webkit-transform-origin:50% 50%;transform-origin:50% 50%;-webkit-animation:flipInLeft .5s both ease-out;animation:flipInLeft .5s both ease-out}.am-page-flipOutLeft{-webkit-transform-origin:50% 50%;transform-origin:50% 50%;-webkit-animation:flipOutLeft .5s both ease-in;animation:flipOutLeft .5s both ease-in}.am-page-flipInRight{-webkit-transform-origin:50% 50%;transform-origin:50% 50%;-webkit-animation:flipInRight .5s both ease-out;animation:flipInRight .5s both ease-out}.am-page-flipOutTop{-webkit-transform-origin:50% 50%;transform-origin:50% 50%;-webkit-animation:flipOutTop .5s both ease-in;animation:flipOutTop .5s both ease-in}.am-page-flipInBottom{-webkit-transform-origin:50% 50%;transform-origin:50% 50%;-webkit-animation:flipInBottom .5s both ease-out;animation:flipInBottom .5s both ease-out}.am-page-flipOutBottom{-webkit-transform-origin:50% 50%;transform-origin:50% 50%;-webkit-animation:flipOutBottom .5s both ease-in;animation:flipOutBottom .5s both ease-in}.am-page-flipInTop{-webkit-transform-origin:50% 50%;transform-origin:50% 50%;-webkit-animation:flipInTop .5s both ease-out;animation:flipInTop .5s both ease-out}.am-page-rotateFall{-webkit-transform-origin:0 0;transform-origin:0 0;-webkit-animation:rotateFall 1s both ease-in;animation:rotateFall 1s both ease-in}.am-page-rotateOutNewspaper{-webkit-transform-origin:50% 50%;transform-origin:50% 50%;-webkit-animation:rotateOutNewspaper .5s both ease-in;animation:rotateOutNewspaper .5s both ease-in}.am-page-rotateInNewspaper{-webkit-transform-origin:50% 50%;transform-origin:50% 50%;-webkit-animation:rotateInNewspaper .5s both ease-out;animation:rotateInNewspaper .5s both ease-out}.am-page-rotatePushLeft{-webkit-transform-origin:0 50%;transform-origin:0 50%;-webkit-animation:rotatePushLeft .8s both ease;animation:rotatePushLeft .8s both ease}.am-page-rotatePushRight{-webkit-transform-origin:100% 50%;transform-origin:100% 50%;-webkit-animation:rotatePushRight .8s both ease;animation:rotatePushRight .8s both ease}.am-page-rotatePushTop{-webkit-transform-origin:50% 0;transform-origin:50% 0;-webkit-animation:rotatePushTop .8s both ease;animation:rotatePushTop .8s both ease}.am-page-rotatePushBottom{-webkit-transform-origin:50% 100%;transform-origin:50% 100%;-webkit-animation:rotatePushBottom .8s both ease;animation:rotatePushBottom .8s both ease}.am-page-rotatePullRight{-webkit-transform-origin:100% 50%;transform-origin:100% 50%;-webkit-animation:rotatePullRight .5s both ease;animation:rotatePullRight .5s both ease}.am-page-rotatePullLeft{-webkit-transform-origin:0 50%;transform-origin:0 50%;-webkit-animation:rotatePullLeft .5s both ease;animation:rotatePullLeft .5s both ease}.am-page-rotatePullTop{-webkit-transform-origin:50% 0;transform-origin:50% 0;-webkit-animation:rotatePullTop .5s both ease;animation:rotatePullTop .5s both ease}.am-page-rotatePullBottom{-webkit-transform-origin:50% 100%;transform-origin:50% 100%;-webkit-animation:rotatePullBottom .5s both ease;animation:rotatePullBottom .5s both ease}.am-page-pullLeftDoor{-webkit-transform-origin:left;transform-origin:left;-webkit-animation:pullLeftDoor 1.5s both ease;animation:pullLeftDoor 1.5s both ease}.am-page-pullRightDoor{-webkit-transform-origin:right;transform-origin:right;-webkit-animation:pullRightDoor 1.5s both ease;animation:pullRightDoor 1.5s both ease}.am-page-rotateFoldRight{-webkit-transform-origin:0 50%;transform-origin:0 50%;-webkit-animation:rotateFoldRight .7s both ease;animation:rotateFoldRight .7s both ease}.am-page-rotateFoldLeft{-webkit-transform-origin:100% 50%;transform-origin:100% 50%;-webkit-animation:rotateFoldLeft .7s both ease;animation:rotateFoldLeft .7s both ease}.am-page-rotateFoldTop{-webkit-transform-origin:50% 100%;transform-origin:50% 100%;-webkit-animation:rotateFoldTop .7s both ease;animation:rotateFoldTop .7s both ease}.am-page-rotateFoldBottom{-webkit-transform-origin:50% 0;transform-origin:50% 0;-webkit-animation:rotateFoldBottom .7s both ease;animation:rotateFoldBottom .7s both ease}.am-page-rotateUnfoldLeft{-webkit-transform-origin:100% 50%;transform-origin:100% 50%;-webkit-animation:rotateUnfoldLeft .7s both ease;animation:rotateUnfoldLeft .7s both ease}.am-page-rotateUnfoldRight{-webkit-transform-origin:0 50%;transform-origin:0 50%;-webkit-animation:rotateUnfoldRight .7s both ease;animation:rotateUnfoldRight .7s both ease}.am-page-rotateUnfoldTop{-webkit-transform-origin:50% 100%;transform-origin:50% 100%;-webkit-animation:rotateUnfoldTop .7s both ease;animation:rotateUnfoldTop .7s both ease}.am-page-rotateUnfoldBottom{-webkit-transform-origin:50% 0;transform-origin:50% 0;-webkit-animation:rotateUnfoldBottom .7s both ease;animation:rotateUnfoldBottom .7s both ease}.am-page-rotateRoomLeftOut{-webkit-transform-origin:100% 50%;transform-origin:100% 50%;-webkit-animation:rotateRoomLeftOut .8s both ease;animation:rotateRoomLeftOut .8s both ease}.am-page-rotateRoomLeftIn{-webkit-transform-origin:0 50%;transform-origin:0 50%;-webkit-animation:rotateRoomLeftIn .8s both ease;animation:rotateRoomLeftIn .8s both ease}.am-page-rotateRoomRightOut{-webkit-transform-origin:0 50%;transform-origin:0 50%;-webkit-animation:rotateRoomRightOut .8s both ease;animation:rotateRoomRightOut .8s both ease}.am-page-rotateRoomRightIn{-webkit-transform-origin:100% 50%;transform-origin:100% 50%;-webkit-animation:rotateRoomRightIn .8s both ease;animation:rotateRoomRightIn .8s both ease}.am-page-rotateRoomTopOut{-webkit-transform-origin:50% 100%;transform-origin:50% 100%;-webkit-animation:rotateRoomTopOut .8s both ease;animation:rotateRoomTopOut .8s both ease}.am-page-rotateRoomTopIn{-webkit-transform-origin:50% 0;transform-origin:50% 0;-webkit-animation:rotateRoomTopIn .8s both ease;animation:rotateRoomTopIn .8s both ease}.am-page-rotateRoomBottomOut{-webkit-transform-origin:50% 0;transform-origin:50% 0;-webkit-animation:rotateRoomBottomOut .8s both ease;animation:rotateRoomBottomOut .8s both ease}.am-page-rotateRoomBottomIn{-webkit-transform-origin:50% 100%;transform-origin:50% 100%;-webkit-animation:rotateRoomBottomIn .8s both ease;animation:rotateRoomBottomIn .8s both ease}.am-page-rotateCubeLeftOut{-webkit-transform-origin:100% 50%;transform-origin:100% 50%;-webkit-animation:rotateCubeLeftOut .6s both ease-in;animation:rotateCubeLeftOut .6s both ease-in}.am-page-rotateCubeLeftIn{-webkit-transform-origin:0 50%;transform-origin:0 50%;-webkit-animation:rotateCubeLeftIn .6s both ease-in;animation:rotateCubeLeftIn .6s both ease-in}.am-page-rotateCubeRightOut{-webkit-transform-origin:0 50%;transform-origin:0 50%;-webkit-animation:rotateCubeRightOut .6s both ease-in;animation:rotateCubeRightOut .6s both ease-in}.am-page-rotateCubeRightIn{-webkit-transform-origin:100% 50%;transform-origin:100% 50%;-webkit-animation:rotateCubeRightIn .6s both ease-in;animation:rotateCubeRightIn .6s both ease-in}.am-page-rotateCubeTopOut{-webkit-transform-origin:50% 100%;transform-origin:50% 100%;-webkit-animation:rotateCubeTopOut .6s both ease-in;animation:rotateCubeTopOut .6s both ease-in}.am-page-rotateCubeTopIn{-webkit-transform-origin:50% 0;transform-origin:50% 0;-webkit-animation:rotateCubeTopIn .6s both ease-in;animation:rotateCubeTopIn .6s both ease-in}.am-page-rotateCubeBottomOut{-webkit-transform-origin:50% 0;transform-origin:50% 0;-webkit-animation:rotateCubeBottomOut .6s both ease-in;animation:rotateCubeBottomOut .6s both ease-in}.am-page-rotateCubeBottomIn{-webkit-transform-origin:50% 100%;transform-origin:50% 100%;-webkit-animation:rotateCubeBottomIn .6s both ease-in;animation:rotateCubeBottomIn .6s both ease-in}.am-page-rotateCarouselLeftOut{-webkit-transform-origin:100% 50%;transform-origin:100% 50%;-webkit-animation:rotateCarouselLeftOut .8s both ease;animation:rotateCarouselLeftOut .8s both ease}.am-page-rotateCarouselLeftIn{-webkit-transform-origin:0 50%;transform-origin:0 50%;-webkit-animation:rotateCarouselLeftIn .8s both ease;animation:rotateCarouselLeftIn .8s both ease}.am-page-rotateCarouselRightOut{-webkit-transform-origin:0 50%;transform-origin:0 50%;-webkit-animation:rotateCarouselRightOut .8s both ease;animation:rotateCarouselRightOut .8s both ease}.am-page-rotateCarouselRightIn{-webkit-transform-origin:100% 50%;transform-origin:100% 50%;-webkit-animation:rotateCarouselRightIn .8s both ease;animation:rotateCarouselRightIn .8s both ease}.am-page-rotateCarouselTopOut{-webkit-transform-origin:50% 100%;transform-origin:50% 100%;-webkit-animation:rotateCarouselTopOut .8s both ease;animation:rotateCarouselTopOut .8s both ease}.am-page-rotateCarouselTopIn{-webkit-transform-origin:50% 0;transform-origin:50% 0;-webkit-animation:rotateCarouselTopIn .8s both ease;animation:rotateCarouselTopIn .8s both ease}.am-page-rotateCarouselBottomOut{-webkit-transform-origin:50% 0;transform-origin:50% 0;-webkit-animation:rotateCarouselBottomOut .8s both ease;animation:rotateCarouselBottomOut .8s both ease}.am-page-rotateCarouselBottomIn{-webkit-transform-origin:50% 100%;transform-origin:50% 100%;-webkit-animation:rotateCarouselBottomIn .8s both ease;animation:rotateCarouselBottomIn .8s both ease}.am-page-rotateSidesOut{-webkit-transform-origin:-50% 50%;transform-origin:-50% 50%;-webkit-animation:rotateSidesOut .5s both ease-in;animation:rotateSidesOut .5s both ease-in}.am-page-rotateSidesIn{-webkit-transform-origin:150% 50%;transform-origin:150% 50%;-webkit-animation:rotateSidesIn .5s both ease-out;animation:rotateSidesIn .5s both ease-out}.am-page-rotateSlideOut{-webkit-animation:rotateSlideOut 1s both ease;animation:rotateSlideOut 1s both ease}.am-page-rotateSlideIn{-webkit-animation:rotateSlideIn 1s both ease;animation:rotateSlideIn 1s both ease}@-webkit-keyframes rotateRightSideFirst{40%{-webkit-transform:rotateY(15deg);opacity:.8;-webkit-animation-timing-function:ease-out}100%{-webkit-transform:scale(.8) translateZ(-200px);opacity:0}}@keyframes rotateRightSideFirst{40%{-webkit-transform:rotateY(15deg);transform:rotateY(15deg);opacity:.8;-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}100%{-webkit-transform:scale(.8) translateZ(-200px);transform:scale(.8) translateZ(-200px);opacity:0}}@-webkit-keyframes rotateLeftSideFirst{40%{-webkit-transform:rotateY(-15deg);opacity:.8;-webkit-animation-timing-function:ease-out}100%{-webkit-transform:scale(.8) translateZ(-200px);opacity:0}}@keyframes rotateLeftSideFirst{40%{-webkit-transform:rotateY(-15deg);transform:rotateY(-15deg);opacity:.8;-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}100%{-webkit-transform:scale(.8) translateZ(-200px);transform:scale(.8) translateZ(-200px);opacity:0}}@-webkit-keyframes rotateTopSideFirst{40%{-webkit-transform:rotateX(15deg);opacity:.8;-webkit-animation-timing-function:ease-out}100%{-webkit-transform:scale(.8) translateZ(-200px);opacity:0}}@keyframes rotateTopSideFirst{40%{-webkit-transform:rotateX(15deg);transform:rotateX(15deg);opacity:.8;-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}100%{-webkit-transform:scale(.8) translateZ(-200px);transform:scale(.8) translateZ(-200px);opacity:0}}@-webkit-keyframes rotateBottomSideFirst{40%{-webkit-transform:rotateX(-15deg);opacity:.8;-webkit-animation-timing-function:ease-out}100%{-webkit-transform:scale(.8) translateZ(-200px);opacity:0}}@keyframes rotateBottomSideFirst{40%{-webkit-transform:rotateX(-15deg);transform:rotateX(-15deg);opacity:.8;-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}100%{-webkit-transform:scale(.8) translateZ(-200px);transform:scale(.8) translateZ(-200px);opacity:0}}@-webkit-keyframes flipOutRight{to{-webkit-transform:translateZ(-1000px) rotateY(90deg);opacity:.2}}@keyframes flipOutRight{to{-webkit-transform:translateZ(-1000px) rotateY(90deg);transform:translateZ(-1000px) rotateY(90deg);opacity:.2}}@-webkit-keyframes flipInLeft{from{-webkit-transform:translateZ(-1000px) rotateY(-90deg);opacity:.2}}@keyframes flipInLeft{from{-webkit-transform:translateZ(-1000px) rotateY(-90deg);transform:translateZ(-1000px) rotateY(-90deg);opacity:.2}}@-webkit-keyframes flipOutLeft{to{-webkit-transform:translateZ(-1000px) rotateY(-90deg);opacity:.2}}@keyframes flipOutLeft{to{-webkit-transform:translateZ(-1000px) rotateY(-90deg);transform:translateZ(-1000px) rotateY(-90deg);opacity:.2}}@-webkit-keyframes flipInRight{from{-webkit-transform:translateZ(-1000px) rotateY(90deg);opacity:.2}}@keyframes flipInRight{from{-webkit-transform:translateZ(-1000px) rotateY(90deg);transform:translateZ(-1000px) rotateY(90deg);opacity:.2}}@-webkit-keyframes flipOutTop{to{-webkit-transform:translateZ(-1000px) rotateX(90deg);opacity:.2}}@keyframes flipOutTop{to{-webkit-transform:translateZ(-1000px) rotateX(90deg);transform:translateZ(-1000px) rotateX(90deg);opacity:.2}}@-webkit-keyframes flipInBottom{from{-webkit-transform:translateZ(-1000px) rotateX(-90deg);opacity:.2}}@keyframes flipInBottom{from{-webkit-transform:translateZ(-1000px) rotateX(-90deg);transform:translateZ(-1000px) rotateX(-90deg);opacity:.2}}@-webkit-keyframes flipOutBottom{to{-webkit-transform:translateZ(-1000px) rotateX(-90deg);opacity:.2}}@keyframes flipOutBottom{to{-webkit-transform:translateZ(-1000px) rotateX(-90deg);transform:translateZ(-1000px) rotateX(-90deg);opacity:.2}}@-webkit-keyframes flipInTop{from{-webkit-transform:translateZ(-1000px) rotateX(90deg);opacity:.2}}@keyframes flipInTop{from{-webkit-transform:translateZ(-1000px) rotateX(90deg);transform:translateZ(-1000px) rotateX(90deg);opacity:.2}}@-webkit-keyframes rotateFall{0%{-webkit-transform:rotateZ(0)}20%{-webkit-transform:rotateZ(10deg);-webkit-animation-timing-function:ease-out}40%{-webkit-transform:rotateZ(17deg)}60%{-webkit-transform:rotateZ(16deg)}100%{-webkit-transform:translateY(100%) rotateZ(17deg)}}@keyframes rotateFall{0%{-webkit-transform:rotateZ(0);transform:rotateZ(0)}20%{-webkit-transform:rotateZ(10deg);transform:rotateZ(10deg);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}40%{-webkit-transform:rotateZ(17deg);transform:rotateZ(17deg)}60%{-webkit-transform:rotateZ(16deg);transform:rotateZ(16deg)}100%{-webkit-transform:translateY(100%) rotateZ(17deg);transform:translateY(100%) rotateZ(17deg)}}@-webkit-keyframes rotateOutNewspaper{to{-webkit-transform:translateZ(-3000px) rotateZ(360deg);opacity:0}}@keyframes rotateOutNewspaper{to{-webkit-transform:translateZ(-3000px) rotateZ(360deg);transform:translateZ(-3000px) rotateZ(360deg);opacity:0}}@-webkit-keyframes rotateInNewspaper{from{-webkit-transform:translateZ(-3000px) rotateZ(-360deg);opacity:0}}@keyframes rotateInNewspaper{from{-webkit-transform:translateZ(-3000px) rotateZ(-360deg);transform:translateZ(-3000px) rotateZ(-360deg);opacity:0}}@-webkit-keyframes rotatePushLeft{to{opacity:0;-webkit-transform:rotateY(90deg)}}@keyframes rotatePushLeft{to{opacity:0;-webkit-transform:rotateY(90deg);transform:rotateY(90deg)}}@-webkit-keyframes rotatePushRight{to{opacity:0;-webkit-transform:rotateY(-90deg)}}@keyframes rotatePushRight{to{opacity:0;-webkit-transform:rotateY(-90deg);transform:rotateY(-90deg)}}@-webkit-keyframes rotatePushTop{to{opacity:0;-webkit-transform:rotateX(-90deg)}}@keyframes rotatePushTop{to{opacity:0;-webkit-transform:rotateX(-90deg);transform:rotateX(-90deg)}}@-webkit-keyframes rotatePushBottom{to{opacity:0;-webkit-transform:rotateX(90deg)}}@keyframes rotatePushBottom{to{opacity:0;-webkit-transform:rotateX(90deg);transform:rotateX(90deg)}}@-webkit-keyframes rotatePullRight{from{opacity:0;-webkit-transform:rotateY(-90deg)}}@keyframes rotatePullRight{from{opacity:0;-webkit-transform:rotateY(-90deg);transform:rotateY(-90deg)}}@-webkit-keyframes rotatePullLeft{from{opacity:0;-webkit-transform:rotateY(90deg)}}@keyframes rotatePullLeft{from{opacity:0;-webkit-transform:rotateY(90deg);transform:rotateY(90deg)}}@-webkit-keyframes rotatePullTop{from{opacity:0;-webkit-transform:rotateX(-90deg)}}@keyframes rotatePullTop{from{opacity:0;-webkit-transform:rotateX(-90deg);transform:rotateX(-90deg)}}@-webkit-keyframes rotatePullBottom{from{opacity:0;-webkit-transform:rotateX(90deg)}}@keyframes rotatePullBottom{from{opacity:0;-webkit-transform:rotateX(90deg);transform:rotateX(90deg)}}@-webkit-keyframes pullLeftDoor{5%{webkit-transform:translateX(-6%) perspective(5000) rotateY(0)}to{opacity:.5;-webkit-transform:perspective(5000) rotateY(-90deg)}}@keyframes pullLeftDoor{5%{-webkit-transform:translateX(-6%) perspective(5000) rotateY(0);transform:translateX(-6%) perspective(5000) rotateY(0)}to{opacity:.5;-webkit-transform:perspective(5000) rotateY(-90deg);transform:perspective(5000) rotateY(-90deg)}}@-webkit-keyframes pullRightDoor{5%{-webkit-transform:translateX(6%) perspective(5000) rotateY(0)}to{opacity:.5;-webkit-transform:perspective(5000) rotateY(90deg)}}@keyframes pullRightDoor{5%{-webkit-transform:translateX(6%) perspective(5000) rotateY(0);transform:translateX(6%) perspective(5000) rotateY(0)}to{opacity:.5;-webkit-transform:perspective(5000) rotateY(90deg);transform:perspective(5000) rotateY(90deg)}}@-webkit-keyframes rotateFoldRight{to{opacity:0;-webkit-transform:translateX(100%) rotateY(90deg)}}@keyframes rotateFoldRight{to{opacity:0;-webkit-transform:translateX(100%) rotateY(90deg);transform:translateX(100%) rotateY(90deg)}}@-webkit-keyframes rotateFoldLeft{to{opacity:0;-webkit-transform:translateX(-100%) rotateY(-90deg)}}@keyframes rotateFoldLeft{to{opacity:0;-webkit-transform:translateX(-100%) rotateY(-90deg);transform:translateX(-100%) rotateY(-90deg)}}@-webkit-keyframes rotateFoldTop{to{opacity:0;-webkit-transform:translateY(-100%) rotateX(90deg)}}@keyframes rotateFoldTop{to{opacity:0;-webkit-transform:translateY(-100%) rotateX(90deg);transform:translateY(-100%) rotateX(90deg)}}@-webkit-keyframes rotateFoldBottom{to{opacity:0;-webkit-transform:translateY(100%) rotateX(-90deg)}}@keyframes rotateFoldBottom{to{opacity:0;-webkit-transform:translateY(100%) rotateX(-90deg);transform:translateY(100%) rotateX(-90deg)}}@-webkit-keyframes rotateUnfoldLeft{from{opacity:0;-webkit-transform:translateX(-100%) rotateY(-90deg)}}@keyframes rotateUnfoldLeft{from{opacity:0;-webkit-transform:translateX(-100%) rotateY(-90deg);transform:translateX(-100%) rotateY(-90deg)}}@-webkit-keyframes rotateUnfoldRight{from{opacity:0;-webkit-transform:translateX(100%) rotateY(90deg)}}@keyframes rotateUnfoldRight{from{opacity:0;-webkit-transform:translateX(100%) rotateY(90deg);transform:translateX(100%) rotateY(90deg)}}@-webkit-keyframes rotateUnfoldTop{from{opacity:0;-webkit-transform:translateY(-100%) rotateX(90deg)}}@keyframes rotateUnfoldTop{from{opacity:0;-webkit-transform:translateY(-100%) rotateX(90deg);transform:translateY(-100%) rotateX(90deg)}}@-webkit-keyframes rotateUnfoldBottom{from{opacity:0;-webkit-transform:translateY(100%) rotateX(-90deg)}}@keyframes rotateUnfoldBottom{from{opacity:0;-webkit-transform:translateY(100%) rotateX(-90deg);transform:translateY(100%) rotateX(-90deg)}}@-webkit-keyframes rotateRoomLeftOut{to{opacity:.3;-webkit-transform:translateX(-100%) rotateY(90deg)}}@keyframes rotateRoomLeftOut{to{opacity:.3;-webkit-transform:translateX(-100%) rotateY(90deg);transform:translateX(-100%) rotateY(90deg)}}@-webkit-keyframes rotateRoomLeftIn{from{opacity:.3;-webkit-transform:translateX(100%) rotateY(-90deg)}}@keyframes rotateRoomLeftIn{from{opacity:.3;-webkit-transform:translateX(100%) rotateY(-90deg);transform:translateX(100%) rotateY(-90deg)}}@-webkit-keyframes rotateRoomRightOut{to{opacity:.3;-webkit-transform:translateX(100%) rotateY(-90deg)}}@keyframes rotateRoomRightOut{to{opacity:.3;-webkit-transform:translateX(100%) rotateY(-90deg);transform:translateX(100%) rotateY(-90deg)}}@-webkit-keyframes rotateRoomRightIn{from{opacity:.3;-webkit-transform:translateX(-100%) rotateY(90deg)}}@keyframes rotateRoomRightIn{from{opacity:.3;-webkit-transform:translateX(-100%) rotateY(90deg);transform:translateX(-100%) rotateY(90deg)}}@-webkit-keyframes rotateRoomTopOut{to{opacity:.3;-webkit-transform:translateY(-100%) rotateX(-90deg)}}@keyframes rotateRoomTopOut{to{opacity:.3;-webkit-transform:translateY(-100%) rotateX(-90deg);transform:translateY(-100%) rotateX(-90deg)}}@-webkit-keyframes rotateRoomTopIn{from{opacity:.3;-webkit-transform:translateY(100%) rotateX(90deg)}}@keyframes rotateRoomTopIn{from{opacity:.3;-webkit-transform:translateY(100%) rotateX(90deg);transform:translateY(100%) rotateX(90deg)}}@-webkit-keyframes rotateRoomBottomOut{to{opacity:.3;-webkit-transform:translateY(100%) rotateX(90deg)}}@keyframes rotateRoomBottomOut{to{opacity:.3;-webkit-transform:translateY(100%) rotateX(90deg);transform:translateY(100%) rotateX(90deg)}}@-webkit-keyframes rotateRoomBottomIn{from{opacity:.3;-webkit-transform:translateY(-100%) rotateX(-90deg)}}@keyframes rotateRoomBottomIn{from{opacity:.3;-webkit-transform:translateY(-100%) rotateX(-90deg);transform:translateY(-100%) rotateX(-90deg)}}@-webkit-keyframes rotateCubeLeftOut{50%{-webkit-animation-timing-function:ease-out;-webkit-transform:translateX(-50%) translateZ(-200px) rotateY(-45deg)}100%{opacity:.3;-webkit-transform:translateX(-100%) rotateY(-90deg)}}@keyframes rotateCubeLeftOut{50%{-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out;-webkit-transform:translateX(-50%) translateZ(-200px) rotateY(-45deg);transform:translateX(-50%) translateZ(-200px) rotateY(-45deg)}100%{opacity:.3;-webkit-transform:translateX(-100%) rotateY(-90deg);transform:translateX(-100%) rotateY(-90deg)}}@-webkit-keyframes rotateCubeLeftIn{0%{opacity:.3;-webkit-transform:translateX(100%) rotateY(90deg)}50%{-webkit-animation-timing-function:ease-out;-webkit-transform:translateX(50%) translateZ(-200px) rotateY(45deg)}}@keyframes rotateCubeLeftIn{0%{opacity:.3;-webkit-transform:translateX(100%) rotateY(90deg);transform:translateX(100%) rotateY(90deg)}50%{-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out;-webkit-transform:translateX(50%) translateZ(-200px) rotateY(45deg);transform:translateX(50%) translateZ(-200px) rotateY(45deg)}}@-webkit-keyframes rotateCubeRightOut{50%{-webkit-animation-timing-function:ease-out;-webkit-transform:translateX(50%) translateZ(-200px) rotateY(45deg)}100%{opacity:.3;-webkit-transform:translateX(100%) rotateY(90deg)}}@keyframes rotateCubeRightOut{50%{-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out;-webkit-transform:translateX(50%) translateZ(-200px) rotateY(45deg);transform:translateX(50%) translateZ(-200px) rotateY(45deg)}100%{opacity:.3;-webkit-transform:translateX(100%) rotateY(90deg);transform:translateX(100%) rotateY(90deg)}}@-webkit-keyframes rotateCubeRightIn{0%{opacity:.3;-webkit-transform:translateX(-100%) rotateY(-90deg)}50%{-webkit-animation-timing-function:ease-out;-webkit-transform:translateX(-50%) translateZ(-200px) rotateY(-45deg)}}@keyframes rotateCubeRightIn{0%{opacity:.3;-webkit-transform:translateX(-100%) rotateY(-90deg);transform:translateX(-100%) rotateY(-90deg)}50%{-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out;-webkit-transform:translateX(-50%) translateZ(-200px) rotateY(-45deg);transform:translateX(-50%) translateZ(-200px) rotateY(-45deg)}}@-webkit-keyframes rotateCubeTopOut{50%{-webkit-animation-timing-function:ease-out;-webkit-transform:translateY(-50%) translateZ(-200px) rotateX(45deg)}100%{opacity:.3;-webkit-transform:translateY(-100%) rotateX(90deg)}}@keyframes rotateCubeTopOut{50%{-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out;-webkit-transform:translateY(-50%) translateZ(-200px) rotateX(45deg);transform:translateY(-50%) translateZ(-200px) rotateX(45deg)}100%{opacity:.3;-webkit-transform:translateY(-100%) rotateX(90deg);transform:translateY(-100%) rotateX(90deg)}}@-webkit-keyframes rotateCubeTopIn{0%{opacity:.3;-webkit-transform:translateY(100%) rotateX(-90deg)}50%{-webkit-animation-timing-function:ease-out;-webkit-transform:translateY(50%) translateZ(-200px) rotateX(-45deg)}}@keyframes rotateCubeTopIn{0%{opacity:.3;-webkit-transform:translateY(100%) rotateX(-90deg);transform:translateY(100%) rotateX(-90deg)}50%{-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out;-webkit-transform:translateY(50%) translateZ(-200px) rotateX(-45deg);transform:translateY(50%) translateZ(-200px) rotateX(-45deg)}}@-webkit-keyframes rotateCubeBottomOut{50%{-webkit-animation-timing-function:ease-out;-webkit-transform:translateY(50%) translateZ(-200px) rotateX(-45deg)}100%{opacity:.3;-webkit-transform:translateY(100%) rotateX(-90deg)}}@keyframes rotateCubeBottomOut{50%{-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out;-webkit-transform:translateY(50%) translateZ(-200px) rotateX(-45deg);transform:translateY(50%) translateZ(-200px) rotateX(-45deg)}100%{opacity:.3;-webkit-transform:translateY(100%) rotateX(-90deg);transform:translateY(100%) rotateX(-90deg)}}@-webkit-keyframes rotateCubeBottomIn{0%{opacity:.3;-webkit-transform:translateY(-100%) rotateX(90deg)}50%{-webkit-animation-timing-function:ease-out;-webkit-transform:translateY(-50%) translateZ(-200px) rotateX(45deg)}}@keyframes rotateCubeBottomIn{0%{opacity:.3;-webkit-transform:translateY(-100%) rotateX(90deg);transform:translateY(-100%) rotateX(90deg)}50%{-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out;-webkit-transform:translateY(-50%) translateZ(-200px) rotateX(45deg);transform:translateY(-50%) translateZ(-200px) rotateX(45deg)}}@-webkit-keyframes rotateCarouselLeftOut{to{opacity:.3;-webkit-transform:translateX(-150%) scale(.4) rotateY(-65deg)}}@keyframes rotateCarouselLeftOut{to{opacity:.3;-webkit-transform:translateX(-150%) scale(.4) rotateY(-65deg);transform:translateX(-150%) scale(.4) rotateY(-65deg)}}@-webkit-keyframes rotateCarouselLeftIn{from{opacity:.3;-webkit-transform:translateX(200%) scale(.4) rotateY(65deg)}}@keyframes rotateCarouselLeftIn{from{opacity:.3;-webkit-transform:translateX(200%) scale(.4) rotateY(65deg);transform:translateX(200%) scale(.4) rotateY(65deg)}}@-webkit-keyframes rotateCarouselRightOut{to{opacity:.3;-webkit-transform:translateX(200%) scale(.4) rotateY(65deg)}}@keyframes rotateCarouselRightOut{to{opacity:.3;-webkit-transform:translateX(200%) scale(.4) rotateY(65deg);transform:translateX(200%) scale(.4) rotateY(65deg)}}@-webkit-keyframes rotateCarouselRightIn{from{opacity:.3;-webkit-transform:translateX(-200%) scale(.4) rotateY(-65deg)}}@keyframes rotateCarouselRightIn{from{opacity:.3;-webkit-transform:translateX(-200%) scale(.4) rotateY(-65deg);transform:translateX(-200%) scale(.4) rotateY(-65deg)}}@-webkit-keyframes rotateCarouselTopOut{to{opacity:.3;-webkit-transform:translateY(-200%) scale(.4) rotateX(65deg)}}@keyframes rotateCarouselTopOut{to{opacity:.3;-webkit-transform:translateY(-200%) scale(.4) rotateX(65deg);transform:translateY(-200%) scale(.4) rotateX(65deg)}}@-webkit-keyframes rotateCarouselTopIn{from{opacity:.3;-webkit-transform:translateY(200%) scale(.4) rotateX(-65deg)}}@keyframes rotateCarouselTopIn{from{opacity:.3;-webkit-transform:translateY(200%) scale(.4) rotateX(-65deg);transform:translateY(200%) scale(.4) rotateX(-65deg)}}@-webkit-keyframes rotateCarouselBottomOut{to{opacity:.3;-webkit-transform:translateY(200%) scale(.4) rotateX(-65deg)}}@keyframes rotateCarouselBottomOut{to{opacity:.3;-webkit-transform:translateY(200%) scale(.4) rotateX(-65deg);transform:translateY(200%) scale(.4) rotateX(-65deg)}}@-webkit-keyframes rotateCarouselBottomIn{from{opacity:.3;-webkit-transform:translateY(-200%) scale(.4) rotateX(65deg)}}@keyframes rotateCarouselBottomIn{from{opacity:.3;-webkit-transform:translateY(-200%) scale(.4) rotateX(65deg);transform:translateY(-200%) scale(.4) rotateX(65deg)}}@-webkit-keyframes rotateSidesOut{to{opacity:0;-webkit-transform:translateZ(-500px) rotateY(90deg)}}@keyframes rotateSidesOut{to{opacity:0;-webkit-transform:translateZ(-500px) rotateY(90deg);transform:translateZ(-500px) rotateY(90deg)}}@-webkit-keyframes rotateSidesIn{from{opacity:0;-webkit-transform:translateZ(-500px) rotateY(-90deg)}}@keyframes rotateSidesIn{from{opacity:0;-webkit-transform:translateZ(-500px) rotateY(-90deg);transform:translateZ(-500px) rotateY(-90deg)}}@-webkit-keyframes rotateSlideOut{25%{opacity:.5;-webkit-transform:translateZ(-500px)}100%,75%{opacity:.5;-webkit-transform:translateZ(-500px) translateX(-200%)}}@keyframes rotateSlideOut{25%{opacity:.5;-webkit-transform:translateZ(-500px);transform:translateZ(-500px)}100%,75%{opacity:.5;-webkit-transform:translateZ(-500px) translateX(-200%);transform:translateZ(-500px) translateX(-200%)}}@-webkit-keyframes rotateSlideIn{0%,25%{opacity:.5;-webkit-transform:translateZ(-500px) translateX(200%)}75%{opacity:.5;-webkit-transform:translateZ(-500px)}100%{opacity:1;-webkit-transform:translateZ(0) translateX(0)}}@keyframes rotateSlideIn{0%,25%{opacity:.5;-webkit-transform:translateZ(-500px) translateX(200%);transform:translateZ(-500px) translateX(200%)}75%{opacity:.5;-webkit-transform:translateZ(-500px);transform:translateZ(-500px)}100%{opacity:1;-webkit-transform:translateZ(0) translateX(0);transform:translateZ(0) translateX(0)}}.am-page-delay100{-webkit-animation-delay:.1s;animation-delay:.1s}.am-page-delay180{-webkit-animation-delay:.18s;animation-delay:.18s}.am-page-delay200{-webkit-animation-delay:.2s;animation-delay:.2s}.am-page-delay300{-webkit-animation-delay:.3s;animation-delay:.3s}.am-page-delay400{-webkit-animation-delay:.4s;animation-delay:.4s}.am-page-delay500{-webkit-animation-delay:.5s;animation-delay:.5s}.am-page-delay700{-webkit-animation-delay:.7s;animation-delay:.7s}.am-page-delay1000{-webkit-animation-delay:1s;animation-delay:1s}');

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

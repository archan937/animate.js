if (typeof(Animate) == 'undefined') {

// *
// * animate.js {version} (Uncompressed)
// * Add slick sequential animations to your page elements
// *
// * (c) {year} Paul Engel
// * animate.js is licensed under MIT license
// *
// * $Date: {date} $
// *

Animate = (function() {

  var script_element = (function() {
    var id = 'animate_dummy_script', dummy_script, element;
    document.write('<script id="' + id + '"></script>');

    dummy_script = document.getElementById(id);
    element = dummy_script.previousSibling;

    dummy_script.parentNode.removeChild(dummy_script);
    return element;
  }()),

  script_path = (function() {
    return script_element.getAttribute('src').toLowerCase().replace(/[^\/]+\.js.*/, '');
  }()),

  script_params = (function() {
    var
      src = script_element.getAttribute('src'),
      pairs = ((src.match(/([\?]*)\?(.*)+/) || ['', '', ''])[2] || '').replace(/(^[0123456789]+|\.js(\s+)?$)/, '').split('&'),
      params = {},
      i, key_value, key;

    for (i = 0; i < pairs.length; i += 1) {
      if (pairs[i] != '') {
        key_value = pairs[i].split('=');
        key = key_value[0].replace(/^\s+|\s+$/g, '').toLowerCase();
        params[key] = (key_value.length == 1) || key_value[1].replace(/^\s+|\s+$/g, '');
      }
    }

    return params;
  }()),

  configure = function(config) {
    if (config['controls']) {
      bindControls();
    }
    if (config['timing']) {
      time.apply(this, config['timing'].split('+'));
    }
  },

  forEach = function(array, f) {
    for (var i = 0; i < array.length; i += 1) {
      f(array[i]);
    }
  },

  pickRandom = function(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  $ = function(sel, context) {
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

  closest = function(el, sel, elements) {
    elements || (elements = $(sel));
    if (indexOf(el, elements) != -1) {
      return el;
    } else if (el.parentNode) {
      return closest(el.parentNode, sel, elements);
    }
  },

  addClass = function(el, arg) {
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

  removeClass = function(el, arg) {
    if (el) {
      var classes = arg.split(' '), i, name;
      for (i = 0; i < classes.length; i += 1) {
        name = classes[i];
        if (name.length) {
          el.classList.remove(name);
        }
      }
    }
  },

  bind = function(el, type, fn, remove) {
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

  unbind = function(el, type, fn) {
    if (fn) {
      bind(el, type, fn, true);
    } else {
      var fns = (el._events || {})[type] || [], i;
      for (i = 0; i < fns.length; i++) {
        unbind(el, type, fns[i]);
      }
    }
  },

  indexOf = function(val, array) {
    for (var i = 0; i < array.length; i += 1) {
      if (val === array[i]) {
        return i;
      }
    }
    return -1;
  },

  on = function(sel, type, fn) {
    bind(document, type, function(e) {
      var target = closest(e.target || e.srcElement || window.event.target || window.event.srcElement, sel);
      if (target) {
        e.preventDefault ? e.preventDefault() : e.returnValue = false;
        fn(e, target);
      }
    });
  },

  next = function(e) {
    e && (e.preventDefault ? e.preventDefault() : e.returnValue = false);
    var key = 'data-step' + step, elements = $('[' + key + ']');

    forEach(elements, function(el) {
      el.initial_position || (el.initial_position = (el.getAttribute('class').match(/(am-above|am-below|am-left|am-right|am-transparent)/) || [])[1]);
      el.animations || (el.animations = []);

      if (el.initial_position) {
        removeClass(el, el.initial_position);
      }
      if (el.getAttribute(key).match('|')) {
        el.setAttribute(key, pickRandom(el.getAttribute(key).split('|')));
      }
      if (el.reverse_animation) {
        removeClass(el, el.reverse_animation);
      }

      addClass(el, 'animated ' + el.getAttribute(key));

      el.animations.push('animated');
      el.animations.push(el.getAttribute(key));
      el.setAttribute('data-animated', '');
    });

    if (step == 0) {
      step = 1;
    } else if (elements.length) {
      step++;
    }
  },

  back = function(e) {
    if (step == 0) {
      return;
    }

    e && (e.preventDefault ? e.preventDefault() : e.returnValue = false);

    step--;
    var elements = $('[data-step' + step + ']'), animation, reverse_animation;

    forEach(elements, function(el) {
      if (el.reverse_animation) {
        removeClass(el, el.reverse_animation);
      }

      animation = el.getAttribute('data-step' + step);
      reverse_animation = animation.replace(/([a-z])(In|Out)([A-Z]|$)/g, function(s, m1, m2, m3) {
        return m1 + {In: 'Out', Out: 'In'}[m2] + m3;
      }).replace(/([a-z])(Up|Down)([A-Z]|$)/g, function(s, m1, m2, m3) {
        return m1 + {Up: 'Down', Down: 'Up'}[m2] + m3;
      });

      if (animation != reverse_animation) {
        el.reverse_animation = reverse_animation;
        el.animations.push(reverse_animation);
        addClass(el, reverse_animation);
      } else {
        el.reverse_animation = undefined;
      }

      removeClass(el, animation);
    });
  },

  ready = function(fn) {
    '\v' == 'v' ? setTimeout(fn, 0) : bind(document, 'DOMContentLoaded', function(){ setTimeout(fn, 0) });
  },

  bindControls = function() {
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
  },

  time = function() {
    forEach(arguments, function(seconds) {
      setTimeout(next, parseFloat(seconds) * 1000);
    });
  },

  reset = function() {
    step = 0;
    forEach($('[data-animated]'), function(el) {
      removeClass(el, el.animations.join(' '));
      addClass(el, el.initial_position || '');
      el.removeAttribute('data-animated');
      el.animations = [];
    });
  },

  step = 0,
  css1 = document.createElement('style'), css2 = document.createElement('style');
  css1 = document.createElement('link'); css1.setAttribute('rel', 'stylesheet'); css1.setAttribute('href', script_path + 'animate.css'); // STYLESHEET1
  css2 = document.createElement('link'); css2.setAttribute('rel', 'stylesheet'); css2.setAttribute('href', script_path + 'animate.js.css'); // STYLESHEET2

  if (!$('head').length) {
    document.body.parentNode.insertBefore(document.createElement('head'), document.body);
  }

  $('head')[0].insertBefore(css1, $('head')[0].childNodes[0]);
  $('head')[0].insertBefore(css2, $('head')[0].childNodes[0]);

  ready(function() {
    configure(script_params);

    on('a', 'click', function(e, target) {
      if (e.metaKey) {
        window.open(target.getAttribute('href'), '_blank');
      }
    });

    next();
  });

  return {
    version: '{version}',
    next: next,
    back: back,
    time: time,
    reset: reset,
    $: $
  }
})();

}

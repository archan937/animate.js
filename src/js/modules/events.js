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

mod.define('Events', function() {
  var
    events = {};

  return {
    bind: function(el, type, f, remove) {
      var fn, id;

      if (typeof(f) == 'string') {
        fn = events[f];
      } else {
        id = objectid(el) + ':' + type + ':' + objectid(f);
        fn = events[id] || (events[id] = function(e) {
          e || (e = window.event);
          f(e, e.target || e.srcElement || window.event.target || window.event.srcElement);
        });
      }

      if (remove) {
        if (el.detachEvent)
          el.detachEvent('on' + type, fn);
        else
          el.removeEventListener(type, fn, false);
      } else {
        if (el.attachEvent)
          el.attachEvent('on' + type, fn);
        else
          el.addEventListener(type, fn, false);
      }
    },

    unbind: function(el, type, fn) {
      if (fn) {
        bind(el, type, fn, true);
      } else {
        var regexp = new RegExp('^' + objectid(el) + ':' + type), prop;
        for (prop in events) {
          if (events.hasOwnProperty(prop) && prop.match(regexp)) {
            unbind(el, type, prop);
          }
        }
      }
    },

    once: function(el, type, f) {
      var fn = function() {
        unbind(el, type, fn);
        f.apply(this, arguments);
      };
      bind(el, type, fn);
    },

    on: function(sel, type, fn, context) {
      context || (context = document);

      bind(context, type, function(e, target) {
        target = $(target).closest(sel);
        if (target.length) {
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

    ready: function(fn) {
      '\v' == 'v' ? setTimeout(fn, 0) : bind(document, 'DOMContentLoaded', function(){ setTimeout(fn, 0) });
    }
  };
});

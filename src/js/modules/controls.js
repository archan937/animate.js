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

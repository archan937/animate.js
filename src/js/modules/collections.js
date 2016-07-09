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
        f(array[i], i, i == array.length - 1);
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

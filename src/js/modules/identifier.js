mod.define('Identifier', function() {
  var
    id = 0;

  return {
    objectid: function(object) {
      if (typeof object.__objectid == 'undefined') {
        Object.defineProperty(object, '__objectid', {
          value: ++id,
          enumerable: false,
          writable: false
        });
      }
      return object.__objectid;
    }
  };
});

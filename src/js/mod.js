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
        mod = modules[arguments[i]];
        for (prop in mod) {
          props[prop] = mod[prop];
          evil(object, 'var ' + prop + ' = ' + varname + '.' + prop);
        }
      }

      evil(object, varname + ' = undefined');
    }
  };
}());

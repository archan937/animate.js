var mod = (function() {
  'use strict';

  var modules = {};

  return {
    define: function(name, mod) {
      modules[name] = (typeof(mod) == 'function') ? mod : function() { return mod; };
    },
    construct: function(init) {
      var body = [], i, mod, module, prop = '__prop__';

      for (i = 1; i < arguments.length; i++) {
        mod = arguments[i];
        module = modules[mod];

        if (mod.match(/\./)) {
          mod = mod.replace('.', '_');
        }

        body.push('var ' + mod + ' = (' + module.toString() + '());');
        body.push('');
        body.push('for (var ' + prop + ' in ' + mod + ') { ');
        body.push('  eval(\'var \' + ' + prop + ' + \' = ' + mod + '.\' + ' + prop + ');');
        body.push('}');
        body.push('');
      }

      body.push(init.toString().replace(/^function\s*\(\)\s*\{/, '').replace(/\}$/, ''));

      return (new Function(body.join('\n'))());
    }
  };
}());

var define = mod.construct;

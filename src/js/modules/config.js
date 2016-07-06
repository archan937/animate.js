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

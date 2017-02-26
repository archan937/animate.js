mod.define('Introspect', function() {
  return {
    script: (function() {
      var id = 'dummy', dummy, script, src, params = {}, pairs, pair, key, i;
      document.write('<script id="' + id + '"></script>');

      dummy = document.getElementById(id);
      script = dummy.previousSibling;
      dummy.parentNode.removeChild(dummy);

      src = script.getAttribute('src');
      pairs = ((src.match(/([\?]*)\?(.*)+/) || ['', '', ''])[2] || '').replace(/(^[0123456789]+|\.js(\s+)?$)/, '').split('&');

      for (i = 0; i < pairs.length; i += 1) {
        if (pairs[i] != '') {
          pair = pairs[i].split('=');
          key = pair[0].replace(/^\s+|\s+$/g, '').toLowerCase();
          params[key] = (pair.length == 1) || pair[1].replace(/^\s+|\s+$/g, '');
        }
      }

      return {
        el: script,
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

    pageWidth: function() {
      return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    },

    pageHeight: function() {
      return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
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
      var
        rect = el.getBoundingClientRect(),
        bounds = {
          top: parseInt(rect.top + viewTop()),
          left: parseInt(rect.left + viewLeft()),
          width: parseInt(rect.width),
          height: parseInt(rect.height)
        };

      bounds.bottom = pageHeight() - bounds.top - bounds.height;
      bounds.right = pageWidth() - bounds.left - bounds.width;

      return bounds;
    },

    computed: function(el) {
      return window.getComputedStyle(el);
    },

    root: function(el) {
      return el.parentNode ? root(el.parentNode) : el;
    }
  };
});

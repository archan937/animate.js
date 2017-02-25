mod.define('Animate.Elements', function() {
  var
    initialized = false,
    timing = [],
    step = 0,
    lock = 0,
    hideClass = 'am-hide',
    definedDurations = [],

  currentKey = function() {
    return 'data-am-' + step;
  },

  currentElements = function() {
    return $('[' + currentKey() + ']');
  },

  animateEach = function(f) {
    var key = currentKey(),
        elements = currentElements(),
        wrapper;

    if (elements.length) {

      wrapper = document.createElement('div');
      wrapper.setAttribute('style', [
        'height: ' + (
          bounds(document.body).height +
          parseInt(computed(document.body).marginTop) +
          parseInt(computed(document.body).marginBottom)
        ) + 'px'
      ].join('; '));

      addClass(wrapper, 'am-wrapper');
      document.body.appendChild(wrapper);

      forEach(elements, function(el) {
        el.initialClass || (el.initialClass = select(el.classList, function(cssClass) { return cssClass == hideClass; }).join(' '));
        el.bounds = bounds(el);
      });

      forEach(elements, function(el, index, last) {
        var
          hidden = hasClass(el, hideClass),
          style = computed(el),
          body = computed(document.body),
          absolute = style['position'] == 'absolute',
          animatedEl = document.createElement('div'),
          placeholder;

        if (!absolute) {
          addClass(animatedEl, 'no_margin');
        }

        animatedEl.setAttribute('style',
          [
            'display: block',
            'top: ' + (absolute ? '0' : (el.bounds.top + 'px')),
            'left: ' + (absolute ? body['marginLeft'] : (el.bounds.left + 'px')),
            ((style['display'] == 'block') ? ('width: ' + body.width) : ''),
            (absolute ? 'height: 100%' : '')
          ].join('; ')
        );

        placeholder = outerWrap(el, 'div', {
          style: [
            'width: ' + el.bounds.width + 'px',
            'height: ' + el.bounds.height + 'px',
            'margin: ' + style['margin'],
            'padding: ' + style['padding'],
            'display: ' + ((style['display'] == 'inline') ? 'inline-block' : style['display']),
            'line-height: ' + style['line-height']
          ].join('; ')
        });

        delete el.bounds;

        animatedEl.appendChild(el);
        wrapper.appendChild(animatedEl);

        if (hidden) {
          removeClass(el, hideClass);
        }

        bind(animatedEl, animationEnd(), function() {
          placeholder.parentNode.insertBefore(el, placeholder);
          placeholder.parentNode.removeChild(placeholder);
          if (hidden) {
            removeClass(el, hideClass);
          } else {
            addClass(el, hideClass);
          }
          if (last) {
            wrapper.parentNode.removeChild(wrapper);
          }
        });

        f(el, animatedEl, key);
      });

    }
  },

  animate = function() {
    animateEach(function(el, animatedEl, key) {
      var animation = el.getAttribute(key), duration, durationClass;

      if (animation.match('|')) {
        animation = pickRandom(animation.split('|'));
      }

      animation = animation.replace(/\b(\d+(\.\d+)?m?s)/, function(m) {
        duration = m;
        durationClass = 'am-' + duration.replace('.', '_');
        return durationClass;
      });

      if (duration && (indexOf(duration, definedDurations) == -1)) {
        injectCSS('.' + durationClass, {
          '-webkit-animation-duration': duration + ' !important',
          'animation-duration': duration + ' !important'
        });
        definedDurations.push(duration);
      }

      addClass(animatedEl, 'animated ' + animation);

      el.setAttribute(key, animation);
      el.setAttribute('data-animated', '');
    });
  },

  reverseAnimate = function(el) {
    animateEach(function(el, animatedEl, key) {
      var animation, reverseAnimation;

      animation = el.getAttribute(key);
      reverseAnimation = animation.replace(/([a-z])(In|Out)([A-Z]|$)/g, function(s, m1, m2, m3) {
        return m1 + {In: 'Out', Out: 'In'}[m2] + m3;
      }).replace(/([a-z])(Up|Down)([A-Z]|$)/g, function(s, m1, m2, m3) {
        return m1 + {Up: 'Down', Down: 'Up'}[m2] + m3;
      });

      addClass(animatedEl, 'animated ' + reverseAnimation);
    });
  },

  animationsIn = [
    'bounceIn',
    'bounceInDown',
    'bounceInLeft',
    'bounceInRight',
    'bounceInUp',
    'fadeIn',
    'fadeInDown',
    'fadeInDownBig',
    'fadeInLeft',
    'fadeInLeftBig',
    'fadeInRight',
    'fadeInRightBig',
    'fadeInUp',
    'fadeInUpBig',
    'flipInX',
    'flipInY',
    'lightSpeedIn',
    'rotateIn',
    'rotateInDownLeft',
    'rotateInDownRight',
    'rotateInUpLeft',
    'rotateInUpRight',
    'slideInUp',
    'slideInDown',
    'slideInLeft',
    'slideInRight',
    'zoomIn',
    'zoomInDown',
    'zoomInLeft',
    'zoomInRight',
    'zoomInUp',
    'rollIn'
  ],

  animationsOut = [
    'bounceOut',
    'bounceOutDown',
    'bounceOutLeft',
    'bounceOutRight',
    'bounceOutUp',
    'fadeOut',
    'fadeOutDown',
    'fadeOutDownBig',
    'fadeOutLeft',
    'fadeOutLeftBig',
    'fadeOutRight',
    'fadeOutRightBig',
    'fadeOutUp',
    'fadeOutUpBig',
    'flipOutX',
    'flipOutY',
    'lightSpeedOut',
    'rotateOut',
    'rotateOutDownLeft',
    'rotateOutDownRight',
    'rotateOutUpLeft',
    'rotateOutUpRight',
    'slideOutUp',
    'slideOutDown',
    'slideOutLeft',
    'slideOutRight',
    'zoomOut',
    'zoomOutDown',
    'zoomOutLeft',
    'zoomOutRight',
    'zoomOutUp',
    'rollOut',
    'hinge'
  ];

  return {
    Elements: {

      next: function(e) {
        e && (e.preventDefault ? e.preventDefault() : e.returnValue = false);

        if (e && lock > step) {
          return;
        }

        var elements = currentElements();

        if (step > 0 && !elements.length) {
          return;
        }

        animate();

        if (step == 0) {
          step = 1;
        } else if (elements.length) {
          step++;
        }

        if (lock == step) {
          lock = 0;
        }

        return false;
      },

      back: function(e) {
        e && (e.preventDefault ? e.preventDefault() : e.returnValue = false);

        if (step == 0) {
          return;
        }

        if (step == 1 && !$('[data-am-0]').length) {
          return;
        }

        if (e && lock > step) {
          return;
        }

        step--;

        reverseAnimate();

        return false;
      },

      reset: function() {
        forEach($('[data-animated]'), function(el) {
          addClass(el, el.initialClass || '');
          el.removeAttribute('data-animated');
        });

        step = 0;
        lock = 0;

        next();

        if (timing.length) {
          Elements.time.apply(this);
        }

        return false;
      },

      time: function() {
        if (arguments.length) {
          timing = arguments;
        }

        if (initialized) {
          lock = step + timing.length;
          forEach(timing, function(seconds) {
            setTimeout(next, parseFloat(seconds) * 1000);
          });
        }
      },

      config: {
        controls: function() {
          bindControls();
        },
        timing: function(value) {
          timing = value.split('+');
        }
      },

      ready: function() {
        setTimeout(function() {
          Elements.next();
          initialized = true;
          Elements.time();
        }, 50);
      },

      animations: {
        in: animationsIn,
        out: animationsOut
      }

    }
  }

});

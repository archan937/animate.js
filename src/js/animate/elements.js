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
        wrapper,
        body = $('body');

    if (elements.length) {

      wrapper = $('<div>');
      wrapper.css({
        width: '100%',
        height: (
          body.height() +
          parseInt(body.computedStyle().marginTop) +
          parseInt(body.computedStyle().marginBottom)
        ) + 'px'
      });

      wrapper.addClass('am-wrapper');
      wrapper.appendTo(body);

      elements.each(function(index, el) {
        el.initialClass || (el.initialClass = select(el.classList, function(cssClass) { return cssClass == hideClass; }).join(' '));
        el.bounds = bounds(el);
      });

      elements.each(function(index, el) {
        el = $(el);

        var
          bounds = el[0].bounds,
          hidden = el.hasClass(hideClass),
          style = el.computedStyle(),
          body = $('body').computedStyle(),
          absolute = style['position'] == 'absolute',
          animatedEl = $('<div>'),
          placeholder;

        delete el[0].bounds;

        if (absolute) {
          animatedEl.css({height: '100%'});
        } else {
          animatedEl.addClass('no_margin');
        }

        if (style['display'] == 'block') {
          animatedEl.css({width: body['width']});
        }

        animatedEl.css({
          display: 'block',
          top: (absolute ? '0' : (bounds.top + 'px')),
          left: (absolute ? body['marginLeft'] : (bounds.left + 'px')),
        });

        placeholder = el.outerWrap('div', {
          style: [
            'width: ' + bounds.width + 'px',
            'height: ' + bounds.height + 'px',
            'margin: ' + style['margin'],
            'padding: ' + style['padding'],
            'display: ' + ((style['display'] == 'inline') ? 'inline-block' : style['display']),
            'line-height: ' + style['line-height']
          ].join('; ')
        });

        animatedEl.append(el);
        wrapper.append(animatedEl);

        if (hidden) {
          el.removeClass(hideClass);
        }

        animatedEl.bind(animationEnd(), function() {
          placeholder.before(el);
          placeholder.remove();

          if (hidden) {
            el.removeClass(hideClass);
          } else {
            el.addClass(hideClass);
          }

          if (index == elements.length - 1) {
            wrapper.remove();
          }
        });

        f(el, animatedEl, key);
      });

    }
  },

  animate = function() {
    animateEach(function(el, animatedEl, key) {
      var animation = el.attr(key), duration, durationClass;

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

      animatedEl.addClass('animated ' + animation);

      el.attr(key, animation);
      el.attr('data-animated', '');
    });
  },

  reverseAnimate = function(el) {
    animateEach(function(el, animatedEl, key) {
      var animation, reverseAnimation;

      animation = el.attr(key);
      reverseAnimation = animation.replace(/([a-z])(In|Out)([A-Z]|$)/g, function(s, m1, m2, m3) {
        return m1 + {In: 'Out', Out: 'In'}[m2] + m3;
      }).replace(/([a-z])(Up|Down)([A-Z]|$)/g, function(s, m1, m2, m3) {
        return m1 + {Up: 'Down', Down: 'Up'}[m2] + m3;
      });

      animatedEl.addClass('animated ' + reverseAnimation);
    });
  },

  init = function() {
    if (!initialized) {
      Elements.next();
      initialized = true;
      Elements.time();
    }
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
    'jello',
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
  ],

  showHideElements = function() {
    $('body *').each(function(index, el) {
      var animation = {index: 99999}, match, index;
      Array.prototype.slice.call(el.attributes).forEach(function(attr) {
        if (match = attr.name.match(/^data-am-(\d+)$/)) {
          index = parseInt(match[1], 10);
          if (index < animation.index) {
            animation.index = index;
            animation.value = attr.value;
          }
        }
      });
      if (indexOf(animation.value, animationsIn) != -1) {
        $(el).addClass('am-hide');
      }
    });

    $('#css-data-am').remove();
  };

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
        $('[data-animated]').each(function(index, el) {
          $(el)
            .addClass(el.initialClass || '')
            .removeAttr('data-animated');
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
        var
          iframe = inFrame() && parent.Animate && window.frameElement,
          ms = (iframe && iframe.halt) ? 1250 : 50;

        if (iframe) {
          delete iframe.halt;
        }

        showHideElements();
        setTimeout(init, ms);
      },

      init: init,

      animations: {
        in: animationsIn,
        out: animationsOut
      }

    }
  }

});

mod.define('Animate.Pages', function() {
  var
    selector = 'a',

  pageOut = function() {
    return $('#am-page-out')[0];
  },

  pageIn = function() {
    return $('#am-page-in')[0];
  },

  takeSnapshot = function(callback) {
    var
      body = document.body,
      width = viewWidth(),
      height = viewHeight(),
      factor = isRetinaDisplay() ? 2.0 : 1.0,
      canvas = document.createElement('canvas'),
      context = canvas.getContext('2d');

    canvas.width = width * factor;
    canvas.height = height * factor;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    if (computed(document.body)['background'].match(/rgba\(\d+, \d+, \d+, 0\)/)) {
      canvas.style.background = 'white';
    }

    context.scale(factor, factor);

    html2canvas(body.parentNode, {canvas: canvas}).then(callback);
  },

  splitCanvas = function(canvas, horizontal, vertical) {
    var
      width = canvas.clientWidth,
      height = canvas.clientHeight,
      factor = isRetinaDisplay() ? 2.0 : 1.0,
      wrapper = outerWrap(canvas, 'div', {
        style: [
          'top: ' + (canvas.style.top || 0) + 'px',
          'left: ' + (canvas.style.left || 0) + 'px',
          'width: ' + width + 'px',
          'height: ' + height + 'px',
          'display: inline-block',
          'position: ' + (canvas.style.position || 'relative')
        ].join('; ')
      }),
      c, i, j, t, l,
      w = width / horizontal,
      h = height / vertical;

    for (i = 0; i < vertical; i += 1) {
      for (j = 0; j < horizontal; j += 1) {
        c = document.createElement('canvas');
        c.width = w * factor;
        c.height = h * factor;
        c.style.top = (t = i * (height / vertical)) + 'px';
        c.style.left = (l = j * (width / horizontal)) + 'px';
        c.style.width = w + 'px';
        c.style.height = h + 'px';
        c.style.position = 'absolute';
        c.getContext('2d').drawImage(
          canvas,
          l * factor, t * factor, w * factor, h * factor,
          0, 0, w * factor, h * factor
        );
        wrapper.appendChild(c);
      }
    }

    canvas.parentNode.removeChild(canvas);
  },

  prepPageOut = function(snapshot) {
    var
      body = document.body,
      page_out;

    if (pageIn()) {
      page_out = document.createElement('div');
      page_out.id = 'am-page-out';
      addClass(page_out, 'am-page');
      body.appendChild(page_out);
    } else {
      page_out = innerWrap(body, 'div', {
        'id': 'am-page-out',
        'class': 'am-page'
      }).children[0];
      page_out.innerHTML = '';
    }

    page_out.appendChild(snapshot);
  },

  prepBody = function() {
    addClass(document.body, 'am-wrapper');
  },

  prepPageIn = function(url) {
    var
      page_in = pageIn(),
      iframe,
      iframe_document;

    url += url.match(/\?\w+/) ? '&' : '?';
    url += 't=' + (new Date()).getTime();

    if (url.match(/^\w+:\/\//)) {
      page_in && document.body.removeChild(page_in);
      return;
    }

    if (page_in) {
      iframe = $('iframe', page_in)[0];
    } else {
      page_in = document.createElement('div');
      page_in.id = 'am-page-in';
      page_in.classList.add('am-page');

      iframe = document.createElement('iframe');
      page_in.appendChild(iframe);
      document.body.appendChild(page_in);
    }

    iframe_document = iframe.contentWindow.document;
    iframe_document.open();
    iframe_document.write('<body onload="window.location.replace(\'' + url + '\')">');
    iframe_document.close();
  },

  animatePages = function(animation, url) {
    animation = animations[animation || randomAnimation()];

    var
      page_out = pageOut(),
      page_in = pageIn(),
      captures = animation[0].match(/(\d+):(\d+)\s+(.*)/) || [],
      css_classes, i;

    if (captures.length) {
      splitCanvas(page_out.children[0], parseInt(captures[1], 10), parseInt(captures[2], 10));
      bind(page_out.children[0].children[page_out.children[0].children.length - 1], animationEnd(), function() {
        pageOutEnd(url);
      });

      css_classes = (' ' + captures[3]).split(',');
      for (i = 0; i < css_classes.length; i += 1) {
        addClass(page_out.children[0].children[i], css_classes[i].replace(/\s+/, ' am-page-'));
      }
    } else {
      bind(page_out, animationEnd(), function() {
        pageOutEnd(url);
      });
      addClass(page_out, 'am-page-' + animation[0].replace(' ', ' am-page-'));
    }

    if (page_in) {
      bind(page_in, animationEnd(), pageInEnd);
      addClass(page_in, 'am-page-' + animation[1].replace(' ', ' am-page-'));
    }
  },

  pageOutEnd = function(url) {
    if (!pageIn()) {
      window.location.href = url;
    }
  },

  pageInEnd = function(event) {
    var
      iframe = $('iframe', pageIn())[0],
      iframe_document = iframe.contentWindow.document,
      page_out = pageOut(),
      complete = function() {
        document.title = iframe_document.title;
        document.body.removeAttribute('data-am-animation');
        document.body.removeAttribute('data-am-next-slide');

        if (page_out) {
          document.body.removeChild(page_out);
        }

        if (event) {
          history.pushState({
            title: document.title,
            path: iframe.contentWindow.window.location.pathname
          }, document.title, iframe_document.URL.replace(/(\?|&)t=\d+/, ''));
        }

        pageIn().setAttribute('class', 'am-page');
        iframe.focus();
      };

    if (iframe_document.readyState == 'complete') {
      complete();
    } else {
      iframe_document.onload = complete;
    }
  },

  animations = {
    'pushToLeft'         : ['moveToLeft', 'moveFromRight'],
    'pushToRight'        : ['moveToRight', 'moveFromLeft'],
    'pushToBottom'       : ['moveToBottom', 'moveFromTop'],
    'pushToTop'          : ['moveToTop', 'moveFromBottom'],
    'slideFromRight'     : ['idle', 'moveFromRight am-page-ontop'],
    'slideFromLeft'      : ['idle', 'moveFromLeft am-page-ontop'],
    'slideFromBottom'    : ['idle', 'moveFromBottom am-page-ontop'],
    'slideFromTop'       : ['idle', 'moveFromTop am-page-ontop'],
    'pushToLeftEasing'   : ['moveToLeftEasing am-page-ontop', 'moveFromRight'],
    'pushToRightEasing'  : ['moveToRightEasing am-page-ontop', 'moveFromLeft'],
    'pushToTopEasing'    : ['moveToTopEasing am-page-ontop', 'moveFromBottom'],
    'pushToBottomEasing' : ['moveToBottomEasing am-page-ontop', 'moveFromTop'],
    'openSesame'         : ['2:1 pullLeftDoor, pullRightDoor', 'rotateInNewspaper delay300'],
    14: ['scaleDown', 'moveFromRight am-page-ontop'],
    15: ['scaleDown', 'moveFromLeft am-page-ontop'],
    16: ['scaleDown', 'moveFromBottom am-page-ontop'],
    17: ['scaleDown', 'moveFromTop am-page-ontop'],
    18: ['scaleDown', 'scaleUpDown delay300'],
    19: ['scaleDownUp', 'scaleUp delay300'],
    20: ['moveToLeft am-page-ontop', 'scaleUp'],
    21: ['moveToRight am-page-ontop', 'scaleUp'],
    22: ['moveToTop am-page-ontop', 'scaleUp'],
    23: ['moveToBottom am-page-ontop', 'scaleUp'],
    24: ['scaleDownCenter', 'scaleUpCenter delay400'],
    25: ['rotateRightSideFirst', 'moveFromRight delay20 am-page-ontop'],
    26: ['rotateLeftSideFirst', 'moveFromLeft delay20 am-page-ontop'],
    27: ['rotateTopSideFirst', 'moveFromTop delay20 am-page-ontop'],
    28: ['rotateBottomSideFirst', 'moveFromBottom delay20 am-page-ontop'],
    29: ['flipOutRight', 'flipInLeft delay500'],
    30: ['flipOutLeft', 'flipInRight delay500'],
    31: ['flipOutTop', 'flipInBottom delay500'],
    32: ['flipOutBottom', 'flipInTop delay500'],
    'rotateFall': ['rotateFall am-page-ontop', 'scaleUp'],
    34: ['rotateOutNewspaper', 'rotateInNewspaper delay500'],
    35: ['rotatePushLeft', 'moveFromRight'],
    36: ['rotatePushRight', 'moveFromLeft'],
    37: ['rotatePushTop', 'moveFromBottom'],
    38: ['rotatePushBottom', 'moveFromTop'],
    39: ['rotatePushLeft', 'rotatePullRight delay180'],
    40: ['rotatePushRight', 'rotatePullLeft delay180'],
    41: ['rotatePushTop', 'rotatePullBottom delay180'],
    42: ['rotatePushBottom', 'rotatePullTop delay180'],
    43: ['rotateFoldLeft', 'moveFromRightFade'],
    44: ['rotateFoldRight', 'moveFromLeftFade'],
    45: ['rotateFoldTop', 'moveFromBottomFade'],
    46: ['rotateFoldBottom', 'moveFromTopFade'],
    47: ['moveToRightFade', 'rotateUnfoldLeft'],
    48: ['moveToLeftFade', 'rotateUnfoldRight'],
    49: ['moveToBottomFade', 'rotateUnfoldTop'],
    50: ['moveToTopFade', 'rotateUnfoldBottom'],
    51: ['rotateRoomLeftOut am-page-ontop', 'rotateRoomLeftIn'],
    52: ['rotateRoomRightOut am-page-ontop', 'rotateRoomRightIn'],
    53: ['rotateRoomTopOut am-page-ontop', 'rotateRoomTopIn'],
    54: ['rotateRoomBottomOut am-page-ontop', 'rotateRoomBottomIn'],
    55: ['rotateCubeLeftOut am-page-ontop', 'rotateCubeLeftIn'],
    56: ['rotateCubeRightOut am-page-ontop', 'rotateCubeRightIn'],
    57: ['rotateCubeTopOut am-page-ontop', 'rotateCubeTopIn'],
    58: ['rotateCubeBottomOut am-page-ontop', 'rotateCubeBottomIn'],
    59: ['rotateCarouselLeftOut am-page-ontop', 'rotateCarouselLeftIn'],
    60: ['rotateCarouselRightOut am-page-ontop', 'rotateCarouselRightIn'],
    61: ['rotateCarouselTopOut am-page-ontop', 'rotateCarouselTopIn'],
    62: ['rotateCarouselBottomOut am-page-ontop', 'rotateCarouselBottomIn'],
    63: ['rotateSidesOut', 'rotateSidesIn delay200'],
    64: ['rotateSlideOut', 'rotateSlideIn']
  },

  randomAnimation = function() {
    var names = keys(animations);
    return names[Math.floor(Math.random() * names.length)].toString();
  };

  return {
    Pages: {

      next: function(e) {
        e && (e.preventDefault ? e.preventDefault() : e.returnValue = false);
        if (document.body.getAttribute('data-am-next-slide')) {
          Pages.load(document.body.getAttribute('data-am-next-slide'));
          return false;
        }
      },

      back: function(e) {
        e && (e.preventDefault ? e.preventDefault() : e.returnValue = false);
        history.back();
        return false;
      },

      load: function(url, animation, snapshot) {
        animation = animation || document.body.getAttribute('data-am-animation');
        if (inFrame() && parent.Animate) {
          takeSnapshot(function(snapshot) {
            return parent.Animate.load(url, animation, snapshot);
          });
        } else {
          var load = function(snapshot) {
            prepPageOut(snapshot);
            prepBody();
            prepPageIn(url);
            animatePages(animation, url);
          };
          snapshot ? load(snapshot) : takeSnapshot(function(snapshot) {
            load(snapshot);
          });

          return false;
        }
      },

      config: {
        selector: function(value) {
          selector = value;
        },
        animation: function(animation) {
          document.body.setAttribute('data-am-animation', animation);
        },
        'next-slide': function(slide) {
          document.body.setAttribute('data-am-next-slide', decodeURIComponent(slide));
          bindControls();
        }
      },

      ready: function() {
        setTimeout(function() {
          window.onpopstate = function (e) {
            var state = e.state, iframe = $('iframe', pageIn())[0];
            if (state && iframe) {
              document.title = state.title;
              iframe.contentWindow.location.replace(state.path);
            } else {
              document.body.innerHTML = '';
              prepBody();
              prepPageIn(window.location.pathname);
              pageInEnd();
            }
          }
        }, 150);

        on(selector, 'click', function(e, target) {
          var
            url = target.getAttribute('data-am-url') || target.getAttribute('href'),
            animation = target.getAttribute('data-am-animation');

          if (e.metaKey) {
            window.open(url, '_blank');
          } else if (!(e.shiftKey || e.ctrlKey || e.altKey)) {
            e.preventDefault ? e.preventDefault() : e.returnValue = false;
            Pages.load(url, animation);
          }
        });
      }

    }
  };

});

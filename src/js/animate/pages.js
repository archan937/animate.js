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

    if (computedStyle(document.body)['background'].match(/rgba\(\d+, \d+, \d+, 0\)/)) {
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
      wrapper = $(canvas).outerWrap('div', {
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
        wrapper.append(c);
      }
    }

    $(canvas).remove();
  },

  prepPageOut = function(snapshot) {
    var
      body = $('body'),
      pgOut;

    if (pageIn()) {
      pgOut = $('<div>');
      pgOut.attr('id', 'am-page-out');
      pgOut.addClass('am-page');
      pgOut.appendTo('body');
    } else {
      pgOut = body.innerWrap('div', {
        'id': 'am-page-out',
        'class': 'am-page'
      }).find('#am-page-out');
      pgOut.html('');
    }

    pgOut.append(snapshot);
  },

  prepBody = function() {
    $('body').addClass('am-wrapper');
  },

  prepPageIn = function(url) {
    var
      pgIn = pageIn(),
      iframe,
      iframeDocument;

    url += url.match(/\?\w+/) ? '&' : '?';
    url += 't=' + (new Date()).getTime();

    if (url.match(/^\w+:\/\//)) {
      pgIn && document.body.removeChild(pgIn);
      return;
    }

    if (pgIn) {
      iframe = $(pgIn).find('iframe')[0];
    } else {
      pgIn = document.createElement('div');
      pgIn.id = 'am-page-in';
      pgIn.classList.add('am-page');

      iframe = document.createElement('iframe');
      pgIn.appendChild(iframe);
      document.body.appendChild(pgIn);
    }

    iframeDocument = iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write('<body onload="window.location.replace(\'' + url + '\')">');
    iframeDocument.close();
  },

  animatePages = function(animation, url) {
    animation = animations[animation || randomAnimation()];

    var
      pgOut = pageOut(),
      pgIn = pageIn(),
      captures = animation[0].match(/(\d+):(\d+)\s+(.*)/) || [],
      cssClasses, cssClass, delay, x, y, stack = [], f;

    if (pgIn) {
      pgIn.style.display = 'none';
    }

    if (captures.length) {
      x = parseInt(captures[1], 10);
      y = parseInt(captures[2], 10);

      splitCanvas(pgOut.children[0], x, y);

      $(pgOut.children[0].children[pgOut.children[0].children.length - 1]).bind(animationEnd(), function() {
        pageOutEnd(url);
      });

      cssClasses = (' ' + captures[3]).split(',');

      for (i = 0; i < (x * y); i += 1) {
        delay = 0;

        classes = select((cssClasses[i] || cssClasses.slice(-1)[0]).split(' '), function(cssClass) {
          var milliseconds = parseInt((cssClass.match(/delay(\d+)/) || [])[1]);
          if (milliseconds) {
            delay = milliseconds;
          }
          return !milliseconds;
        });

        stack.push([classes.join(' ').replace(/\s+/, ' am-page-'), delay]);
      }

      delay = 0;

      forEach(stack, function(array, i) {
        var f = function() {
          $(pgOut.children[0].children[i]).addClass(array[0]);
        };
        if (array[1]) {
          delay += array[1];
          setTimeout(f, delay);
        } else {
          f();
        }
      });

    } else {
      $(pgOut)
        .bind(animationEnd(), function() {
          pageOutEnd(url);
        })
        .addClass('am-page-' + animation[0].replace(' ', ' am-page-'));
    }

    if (pgIn) {
      pgIn.children[0].halt = true;

      delay = 0;
      cssClass = animation[1].replace(/ delay(\d+)/, function(m, m1) {
        delay = parseInt(m1);
        return '';
      });

      f = function() {
        pgIn.style.display = 'block';
        $(pgIn)
          .addClass('am-page-' + cssClass.replace(' ', ' am-page-'));
      };

      $(pgIn).once(animationEnd(), pageInEnd);
      delay ? setTimeout(f, delay) : f();
    }
  },

  pageOutEnd = function(url) {
    var pgIn = pageIn(), animate;
    if (pgIn) {
      animate = pgIn.children[0].contentWindow.Animate;
      animate && animate.init && animate.init();
    } else {
      window.location.href = url;
    }
  },

  pageInEnd = function(event) {
    var
      iframe = $('iframe', pageIn())[0],
      iframeDocument = iframe.contentWindow.document,
      pgOut = pageOut(),
      complete = function() {
        document.title = iframeDocument.title;
        document.body.removeAttribute('data-am-animation');
        document.body.removeAttribute('data-am-next-slide');

        if (pgOut) {
          document.body.removeChild(pgOut);
        }

        if (event) {
          history.pushState({
            title: document.title,
            path: iframe.contentWindow.window.location.pathname
          }, document.title, iframeDocument.URL.replace(/(\?|&)t=\d+/, ''));
        }

        pageIn().setAttribute('class', 'am-page');
        iframe.focus();
      };

    if (iframeDocument.readyState == 'complete') {
      complete();
    } else {
      iframeDocument.onload = complete;
    }
  },

  animations = {
    'pushToLeft'          : ['moveToLeft', 'moveFromRight'],
    'pushToRight'         : ['moveToRight', 'moveFromLeft'],
    'pushToBottom'        : ['moveToBottom', 'moveFromTop'],
    'pushToTop'           : ['moveToTop', 'moveFromBottom'],
    'slideFromRight'      : ['idle', 'moveFromRight am-page-ontop'],
    'slideFromLeft'       : ['idle', 'moveFromLeft am-page-ontop'],
    'slideFromBottom'     : ['idle', 'moveFromBottom am-page-ontop'],
    'slideFromTop'        : ['idle', 'moveFromTop am-page-ontop'],
    'pushToLeftEasing'    : ['moveToLeftEasing am-page-ontop', 'moveFromRight'],
    'pushToRightEasing'   : ['moveToRightEasing am-page-ontop', 'moveFromLeft'],
    'pushToTopEasing'     : ['moveToTopEasing am-page-ontop', 'moveFromBottom'],
    'pushToBottomEasing'  : ['moveToBottomEasing am-page-ontop', 'moveFromTop'],
    'openSesame'          : ['2:1 pullLeftDoor, pullRightDoor', 'rotateInNewspaper delay300'],
    'mosaic'              : ['4:3 rotateLeftSideFirst am-page-ontop delay50', 'rotateInNewspaper delay1250'],
    'scaleDownFromRight'  : ['scaleDown', 'moveFromRight am-page-ontop'],
    'scaleDownFromLeft'   : ['scaleDown', 'moveFromLeft am-page-ontop'],
    'scaleDownFromBottom' : ['scaleDown', 'moveFromBottom am-page-ontop'],
    'scaleDownFromTop'    : ['scaleDown', 'moveFromTop am-page-ontop'],
    'scaleDownUpDown'     : ['scaleDown', 'scaleUpDown delay300'],
    'scaleDownUpCenter'   : ['scaleDownCenter', 'scaleUpCenter delay400'],
    'scaleDownUp'         : ['scaleDownUp', 'scaleUp delay300'],
    'toLeftScaleUp'       : ['moveToLeft am-page-ontop', 'scaleUp'],
    'toRightScaleUp'      : ['moveToRight am-page-ontop', 'scaleUp'],
    'toTopScaleUp'        : ['moveToTop am-page-ontop', 'scaleUp'],
    'toBottomScaleUp'     : ['moveToBottom am-page-ontop', 'scaleUp'],
    'glueLeftFromRight'   : ['rotateRightSideFirst', 'moveFromRight delay20 am-page-ontop'],
    'glueRightFromLeft'   : ['rotateLeftSideFirst', 'moveFromLeft delay20 am-page-ontop'],
    'glueBottomFromTop'   : ['rotateTopSideFirst', 'moveFromTop delay20 am-page-ontop'],
    'glueTopFromBottom'   : ['rotateBottomSideFirst', 'moveFromBottom delay20 am-page-ontop'],
    'flipRight'           : ['flipOutRight', 'flipInLeft delay500'],
    'flipLeft'            : ['flipOutLeft', 'flipInRight delay500'],
    'flipTop'             : ['flipOutTop', 'flipInBottom delay500'],
    'flipBottom'          : ['flipOutBottom', 'flipInTop delay500'],
    'rotateFall'          : ['rotateFall am-page-ontop', 'scaleUp'],
    'rotateNewspaper'     : ['rotateOutNewspaper', 'rotateInNewspaper delay500'],
    'pushLeftFromRight'   : ['rotatePushLeft', 'moveFromRight'],
    'pushRightFromLeft'   : ['rotatePushRight', 'moveFromLeft'],
    'pushTopFromBottom'   : ['rotatePushTop', 'moveFromBottom'],
    'pushBottomFromTop'   : ['rotatePushBottom', 'moveFromTop'],
    'pushLeftPullRight'   : ['rotatePushLeft', 'rotatePullRight delay180'],
    'pushRightPullLeft'   : ['rotatePushRight', 'rotatePullLeft delay180'],
    'pushTopPullBottom'   : ['rotatePushTop', 'rotatePullBottom delay180'],
    'pushBottomPullTop'   : ['rotatePushBottom', 'rotatePullTop delay180'],
    'rotateToLeft'        : ['rotateFoldLeft', 'moveFromRightFade'],
    'rotateToRight'       : ['rotateFoldRight', 'moveFromLeftFade'],
    'rotateToTop'         : ['rotateFoldTop', 'moveFromBottomFade'],
    'rotateToBottom'      : ['rotateFoldBottom', 'moveFromTopFade'],
    'rotateFromLeft'      : ['moveToRightFade', 'rotateUnfoldLeft'],
    'rotateFromRight'     : ['moveToLeftFade', 'rotateUnfoldRight'],
    'rotateFromTop'       : ['moveToBottomFade', 'rotateUnfoldTop'],
    'rotateFromBottom'    : ['moveToTopFade', 'rotateUnfoldBottom'],
    'roomToLeft'          : ['rotateRoomLeftOut am-page-ontop', 'rotateRoomLeftIn'],
    'roomToRight'         : ['rotateRoomRightOut am-page-ontop', 'rotateRoomRightIn'],
    'roomToTop'           : ['rotateRoomTopOut am-page-ontop', 'rotateRoomTopIn'],
    'roomToBottom'        : ['rotateRoomBottomOut am-page-ontop', 'rotateRoomBottomIn'],
    'cubeToLeft'          : ['rotateCubeLeftOut am-page-ontop', 'rotateCubeLeftIn'],
    'cubeToRight'         : ['rotateCubeRightOut am-page-ontop', 'rotateCubeRightIn'],
    'cubeToTop'           : ['rotateCubeTopOut am-page-ontop', 'rotateCubeTopIn'],
    'cubeToBottom'        : ['rotateCubeBottomOut am-page-ontop', 'rotateCubeBottomIn'],
    'carouselToLeft'      : ['rotateCarouselLeftOut am-page-ontop', 'rotateCarouselLeftIn'],
    'carouselToRight'     : ['rotateCarouselRightOut am-page-ontop', 'rotateCarouselRightIn'],
    'carouselToTop'       : ['rotateCarouselTopOut am-page-ontop', 'rotateCarouselTopIn'],
    'carouselToBottom'    : ['rotateCarouselBottomOut am-page-ontop', 'rotateCarouselBottomIn'],
    'rotateSides'         : ['rotateSidesOut', 'rotateSidesIn delay200'],
    'slide'               : ['rotateSlideOut', 'rotateSlideIn']
  },

  randomAnimation = function() {
    var names = keys(animations);
    return names[Math.floor(Math.random() * names.length)].toString();
  };

  return {
    Pages: {

      next: function(e) {
        e && (e.preventDefault ? e.preventDefault() : e.returnValue = false);
        var url = document.body.getAttribute('data-am-next-slide');
        if (url) {
          Pages.load(url);
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
            url = target.attr('data-am-url') || target.attr('href'),
            animation = target.attr('data-am-animation');

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

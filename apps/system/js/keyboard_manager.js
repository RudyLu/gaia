'use strict';

var KeyboardManager = (function() {

  function getStyle(el, styleProp) {
      var x = el; //document.getElementById(el);

      if (window.getComputedStyle)
      {
	  var y = document.defaultView.getComputedStyle(x,null).getPropertyValue(styleProp); 
      }  
      else if (x.currentStyle)
      {
	  var y = x.currentStyle[styleProp];
      }                     

      return y;
  }

  function printClassList (classList) {
      for (var i in classList) {
	  console.warn('++check++: ' + classList[i]);
      }
  }
	  
  function checkZIndex() {
    var windowContainer = document.querySelector('#screen > [data-z-index-level="app"] > iframe');
    if (windowContainer) {
	console.warn('++zIndex checking windows ++: ' + getStyle(windowContainer, 'z-index') +  'className' +
                      windowContainer.className);

		  printClassList(windowContainer.classList);
    } else 
	console.warn('++zIndex checking windows ++: no container');

    var container = document.getElementById('keyboard-frame');
    if (container)
	console.warn('++zIndex checking++: ' + getStyle(container, 'z-index'));
    else 
	console.warn('++zIndex checking++: no container');

    var screen = document.getElementById('screen');
    if (screen) {
	console.warn('++zIndex checking++: ' + getStyle(screen, 'z-index'));
	console.warn('++class checking++: '  + screen.className);
		  printClassList(screen.classList);
    } else  {
	console.warn('++zIndex checking++: no screen');
    }
  }

  function getKeyboardURL() {
    // TODO: Retrieve it from Settings, allowing 3rd party keyboards
    var host = document.location.host;
    var domain = host.replace(/(^[\w\d]+\.)?([\w\d]+\.[a-z]+)/, '$2');
    var protocol = document.location.protocol;

    return protocol + '//keyboard.' + domain + '/';;
  }

  function generateKeyboard(container, keyboardURL, manifestURL) {
    var keyboard = document.createElement('iframe');
    keyboard.src = keyboardURL;
    keyboard.setAttribute('mozbrowser', 'true');
    keyboard.setAttribute('mozapp', manifestURL);
    //keyboard.setAttribute('remote', 'true');

    container.appendChild(keyboard);
    return keyboard;
  }

  // Generate a <iframe mozbrowser> containing the keyboard.
  var container = document.getElementById('keyboard-frame');
  var keyboardURL = getKeyboardURL() + 'index.html';
  var manifestURL = getKeyboardURL() + 'manifest.webapp';
  var keyboard = generateKeyboard(container, keyboardURL, manifestURL);

  // The overlay will display part of the keyboard that are above the
  // current application.
  var overlay = document.getElementById('keyboard-overlay');

  // Listen for mozbrowserlocationchange of keyboard iframe.
  var previousHash = '';

  var urlparser = document.createElement('a');
  keyboard.addEventListener('mozbrowserlocationchange', function(e) {
    urlparser.href = e.detail;
    if (previousHash == urlparser.hash)
      return;
    previousHash = urlparser.hash;

    var type = urlparser.hash.split('=');
    switch (type[0]) {
      case '#show':
        var size = parseInt(type[1]);
        var height = window.innerHeight - size;
        overlay.hidden = false;

        var updateHeight = function() {
          container.removeEventListener('transitionend', updateHeight);
          overlay.style.height = height + 'px';
          container.classList.add('visible');

	  console.log('check 2');
	  checkZIndex();

          var detail = {
            'detail': {
              'height': size
            }
          };
          dispatchEvent(new CustomEvent('keyboardchange', detail));

	  checkZIndex();
        }

        if (container.classList.contains('hide')) {
	  checkZIndex();
          container.classList.remove('hide');
          container.addEventListener('transitionend', updateHeight);
          return;
        }

        updateHeight();
        break;

      case '#hide':
        container.classList.add('hide');
        container.classList.remove('visible');
        overlay.hidden = true;
        dispatchEvent(new CustomEvent('keyboardhide'));
        break;
    }
  });
})();


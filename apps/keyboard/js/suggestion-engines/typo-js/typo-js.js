'use strict';

(function () {

  var debugging = true;
  var debug = function(str) {
    if (!debugging)
      return;

    if (window.dump)
      window.dump('typoJS: ' + str + '\n');
    if (console && console.log) {
      console.log('typoJS: ' + str);
      if (arguments.length > 1)
        console.log.apply(this, arguments);
    }
  };

  /* for non-Mozilla browsers */
  if (!KeyEvent) {
    var KeyEvent = {
      DOM_VK_BACK_SPACE: 0x8,
      DOM_VK_RETURN: 0xd,
      DOM_VK_SPACE: 0x20
    };
  }


  var SpellChecker = function spellchecker() {
    var settings;
    var dictionaryWorker;

    var currentWord = '';

    this.init = function spellchecker_init(options) {
      settings = options;
      var affData;
      var dicData;

      dictionaryWorker = new Worker(settings.path + '/typo-js.worker.js');
      dictionaryWorker.onmessage = function (evt) {
        if (typeof evt.data == 'string') {
          debug(evt.data);
          return;
        }
        debug('got dictionary worker msg');
        var candidates = [];
        evt.data.forEach(function (word) {
          candidates.push([word]);
        });
        settings.sendCandidates(candidates);
      };

      /* load dictionaries */
      var lang = settings.lang;

      dictionaryWorker.postMessage(
        {
          name: 'lang',
          value: lang
        }
      );

      // XXX: Bug 753981 prevents XHR in Web Workers to get these dictionary data.
      // We get them here and postMessage the data into the worker.
      var getDictionary = function getDictionary(name, url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.overrideMimeType('text/plain; charset=utf-8');
        xhr.onreadystatechange = function xhrReadystatechange(ev) {
          if (xhr.readyState !== 4)
            return;
          debug(name + ' file loaded, length: ' + xhr.responseText.length);
          dictionaryWorker.postMessage(
            {
              name: name,
              value: xhr.responseText
            }
          );
          xhr = null;
        }
        xhr.send();
      };

      getDictionary('affData', settings.path + '/dictionaries/' + lang + '/' + lang + '.aff');
      getDictionary('dicData', settings.path + '/dictionaries/' + lang + '/' + lang + '.dic');

    };

    var empty = function spellchecker_empty() {
      debug('Empty');
      currentWord = '';
    };

    this.empty = empty;

    var doSpellCheck = function () {
      dictionaryWorker.postMessage(currentWord);
    };

    this.click = function spellchecker_click(keyCode) {
      debug('Clicked ' + keyCode);

      switch (keyCode) {
        case KeyEvent.DOM_VK_RETURN:
        case KeyEvent.DOM_VK_SPACE:
          empty();
          settings.sendCandidates([]);
          break;
        case KeyEvent.DOM_VK_BACK_SPACE:
          currentWord = currentWord.substr(0, currentWord.length - 1);
          debug('current word: ' + currentWord);
          doSpellCheck();
          break;
        default:
          currentWord += String.fromCharCode(keyCode);
          debug('current word: ' + currentWord);
          doSpellCheck();
          break;
      }
    };

    this.select = function (text, type) {
      var i = currentWord.length;
      while (i--) {
        settings.sendKey(KeyEvent.DOM_VK_BACK_SPACE);
      }

      settings.sendString(text + ' ');
      empty();
      settings.sendCandidates([]);
    };
  };

  var typoJSWrapper = new SpellChecker();

  // Expose typo-js wrapper as an AMD module
  if (typeof define === 'function' && define.amd)
    define('typo-js', [], function() { return typoJSWrapper; });

  // Expose to IMEManager if we are in Gaia homescreen
  if (typeof IMEManager !== 'undefined')
    IMEManager.SuggestionEngines['typo-js'] = typoJSWrapper;
})();

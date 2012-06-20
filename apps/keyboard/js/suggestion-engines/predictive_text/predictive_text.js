/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

(function() {

  var debugging = true;
  var TAG = '[PredictiveText] ';

  var debug = function(str) {
    if (!debugging)
      return;

    if (window.dump)
      window.dump(TAG + str + '\n');
    if (console && console.log) {
      console.log(TAG + str);
      if (arguments.length > 1)
        console.log.apply(this, arguments);
    }
  };

  var SimpleProfiler = function(tag) {
    this.startTime = new Date().getTime();
    this.tag = tag || 'Simple Profiling';
  };

  SimpleProfiler.prototype = {
    endProfiling: function() {
      var endTime = new Date().getTime();
      debug('elapse time for ' + this.tag + ' : ' +
             (endTime - this.startTime) + ' ms');
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

  var settings;
  var ptDict;

  var SpellChecker = function spellchecker() {

    var currentWord = '';

    this.init = function spellchecker_init(options) {
      settings = options;

      /* load dictionaries */
      var lang = settings.lang;

      // Load dictionary into indexedDB
      ptDict = new Dictionary('en');

      ptDict.initAsync(function() {
        debug('After DB init');
      });
    };

    var empty = function spellchecker_empty() {
      debug('Empty');
      currentWord = '';
    };

    this.empty = empty;

    var doSpellCheck = function() {

      // Only give word suggestions when the input >= 2 chars
      if (currentWord.length < 2) {
        settings.sendCandidates([]);
        return;
      }

      var sendCandidates = function send_can(wordList) {

        if (!wordList || wordList.length == 0) {
          ptDict.lookupCorrections(currentWord, sendCandidates);
          return;
        }

        var list = [];
        for (var i in wordList) {
          list.push([wordList[i].key]);
        }

        settings.sendCandidates(list);
      };

      ptDict.lookup(currentWord, sendCandidates);

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

    this.select = function(text, type) {
      var i = currentWord.length;
      while (i--) {
        settings.sendKey(KeyEvent.DOM_VK_BACK_SPACE);
      }

      settings.sendString(text + ' ');
      empty();
      settings.sendCandidates([]);
    };
  };

  var insertArray = function insertArray(array, element, limit) {


    for (var j = 0; j < Math.min(limit, array.length); j++) {
      if (array[j].value < element.value) {

        if (j + 1 == limit)
          array.splice(j, 1, element);
        else
          array.splice(j, 0, element);

        break;
      }
    }

    // just insert the element when the length < limit (and the case length = 0)
    if (j == array.length && array.length < limit) {
      array.push(element);
      return;
    }

    if (array.length > limit)
      var c = array.pop();

  };

  var Dictionary = function pt_dictionary(locale) {
    this._locale = locale;
    this._db = null;
    this._dictIndex = 0;
  };

  Dictionary.prototype = {

    kIndexedDB: window.indexedDB || window.webkitIndexedDB ||
                window.mozIndexedDB || window.msIndexedDB,

    kDBName: 'predict-text-dictionary',
    kDBVersion: 1,
    kAlphabet: 'abcdefghijklmnopqrstuvwxyz',
    kCandidateNumber: 10,

    // To open DB to store dictionary
    openAsync: function dict_openAsync(callback) {

      if (this._db) {
        callback();
        return;
      }

      if (!this.kIndexedDB) {
        console.error('[Predictive Text] Cannot init IndexedDB');
        return;
      }

      var request = this.kIndexedDB.open(this.kDBName, this.kDBVersion);

      request.onsuccess = function openDB_success(event) {
        debug('open database', this.kDBName, event);
        this._db = event.target.result;
        callback();

      }.bind(this);

      request.onerror = function(event) {
        debug('Can\'t open database', this.kDBName, event);
        callback();
      };

      request.onupgradeneeded = function(event) {
        var db = event.target.result;

        if (db.objectStoreNames.contains('dictionary')) {
          db.deleteObjectStore('dictionary');
          debug('dictionary store deleted!');
        }

        db.createObjectStore('dictionary', {keyPath: 'key'});
      }
    },

    initAsync: function pt_initAsync(callback) {
      // check DB is loaded or not
      debug('To check if the DB is ready');
      this.checkDBLoadedAsync(callback);
    },

    checkDBLoadedAsync: function pt_checkDBLoadedAsync(callback) {
      this.openAsync(function complete_openAsync() {
        if (!this._db) {
          debug('the DB is not ready');
          return;
        }

        var transaction = this._db.transaction('dictionary');
        var req = transaction.objectStore('dictionary').get('_last_entry_');
        req.onsuccess = function getdbSuccess(ev) {
          if (ev.target.result !== undefined) {
            callback();
            return;
          }

          debug('IndexedDB is supported but empty; Downloading JSON ...');
          this.loadAsync();
        }.bind(this);

      }.bind(this));

    },

    loadAsync: function pt_loadAsync() {

      var self = this;

      var getDictJSON = function dict_getDictJSON(callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', settings.path + '/dictionaries/en.json', true);

        try {
          xhr.responseType = 'json';
        } catch (e) { }

        xhr.overrideMimeType('application/json; charset=utf-8');
        xhr.onreadystatechange = function xhrReadystatechange(ev) {

          debug('xhr ready state: ' + xhr.readyState);
          if (xhr.readyState !== 4)
            return;

          var response;
          if (xhr.responseType == 'json') {
            response = xhr.response;
          } else {
            try {
              response = JSON.parse(xhr.responseText);
            } catch (e) {
              console.log('JSON parsing error: ' + e);

            }
          }

          if (typeof response !== 'object') {
            debug('Failed to load words.json: Malformed JSON');
            callback();
            return;
          }

          self.jsonData = response;

          xhr = null;
          callback();
        };

        xhr.send(null);
      }

      var JSONLoadingProfiling = new SimpleProfiler('JSON Loading');

      getDictJSON(function populateDB() {
          JSONLoadingProfiling.endProfiling();
          this.populateDBAsync();
      }.bind(this));

    },

    lookup: function(inputKey, callback) {

      debug('lookup + ' + inputKey);

      // query by keyRange
      var queryString = inputKey;
      this.currentWord = queryString;

      this.openAsync(function end_openAsync() {
        var db = this._db;
        var self = this;

        var transaction = db.transaction(['dictionary']);
        if (transaction == null)
          return;

        var boundKeyRange = IDBKeyRange.bound(queryString, queryString + 'z',
                                              false, false);
        var objectStore = transaction.objectStore('dictionary');

        var resultList = [];

        var queryDB = new SimpleProfiler('DB Query');

        var request = objectStore.openCursor(boundKeyRange, IDBCursor.PREV);
        request.onsuccess = function cursor_openSuccess(event) {
          var cursor = event.target.result;

          if (cursor) {
            var weight = 1;
            if (cursor.key.length == queryString.length) {
              weight = 3;
            } else if (cursor.key.length - queryString.length == 1) {
              weight = 2;
            }

            var result = {key: cursor.key,
                          value: cursor.value.value * weight};

            insertArray(resultList, result, self.kCandidateNumber);

            if (queryString == self.currentWord) {
              cursor.continue();
            }

          } else {
            queryDB.endProfiling();
            if (queryString == self.currentWord)
              callback(resultList);
          }
        };
      }.bind(this));
    },

    populateDBAsync: function pt_populateDBAsync(callback) {

      this._dictIndex = 0;
      debug('Going to populate DB part by part: ' + this._dictIndex);
      var dbPopulate = new SimpleProfiler('DB populating');

      var addChunk = function pt_addChunk() {

        debug('[InAddChunk] Going to populate DB part by part now i: ' +
               this._dictIndex);

        var addTransaction = this._db.transaction(['dictionary'], 'readwrite');
        var objectStore = addTransaction.objectStore('dictionary');

        addTransaction.oncomplete = function putComplete() {
          debug('add complete');
        };

        addTransaction.onerror = function(e) {
          console.log('transaction error: ', e);
        };

        for (var i = this._dictIndex; i < this.jsonData.length; ++i) {
          objectStore.put(this.jsonData[i]);
          if ((i + 1) % 2048 == 0) {
            this._dictIndex = i + 1;
            break;
          }
        }

        debug('Going to populate DB part by part now i: ' + i);

        if (i == this.jsonData.length) {

          dbPopulate.endProfiling();
          objectStore.put({key: '_last_entry_'});

          self.jsonData = null;

          if (callback)
            callback();
        } else {
          window.setTimeout(addChunk, 0);
        }

      }.bind(this);

      addChunk();

    },

    // get words with edit distance 1, from typo.js
    edits1: function pt_edits1(words) {
      var rv = [];

      for (var ii = 0, _iilen = words.length; ii < _iilen; ii++) {
        var word = words[ii];

        var splits = [];

        for (var i = 0, _len = word.length + 1; i < _len; i++) {
          splits.push([word.substring(0, i), word.substring(i, word.length)]);
        }

        var deletes = [];

        for (var i = 0, _len = splits.length; i < _len; i++) {
          var s = splits[i];

          if (s[1]) {
            deletes.push(s[0] + s[1].substring(1));
          }
        }

        var transposes = [];

        for (var i = 0, _len = splits.length; i < _len; i++) {
          var s = splits[i];

          if (s[1].length > 1) {
            transposes.push(s[0] + s[1][1] + s[1][0] + s[1].substring(2));
          }
        }

        var replaces = [];

        for (var i = 0, _len = splits.length; i < _len; i++) {
          var s = splits[i];

          if (s[1]) {
            for (var j = 0, _jlen = this.kAlphabet.length; j < _jlen; j++) {
              replaces.push(s[0] + this.kAlphabet[j] + s[1].substring(1));
            }
          }
        }

        var inserts = [];

        for (var i = 0, _len = splits.length; i < _len; i++) {
          var s = splits[i];

          if (s[1]) {
            for (var j = 0, _jlen = this.kAlphabet.length; j < _jlen; j++) {
              inserts.push(s[0] + this.kAlphabet[j] + s[1]);
            }
          }
        }

        rv = rv.concat(deletes);
        rv = rv.concat(transposes);
        rv = rv.concat(replaces);
        rv = rv.concat(inserts);
      }

      return rv;
    },

    lookupCorrections: function pt_lookupCorrection(word, callback) {

      this.currentWord = word;
      var correctPattern = this.edits1([word]);

      //unique
      var uniCorrectPattern = [];
      for (var i in correctPattern) {
        if (uniCorrectPattern.indexOf(correctPattern[i]) == -1)
          uniCorrectPattern.push(correctPattern[i]);
      }

      var correctionResult = [];
      var count = 0;
      var self = this;

      for (var i = 0; i < uniCorrectPattern.length; i++) {

        if (word != this.currentWord)
          break;

        var queryString = uniCorrectPattern[i];
        this.openAsync(function end_openAsync() {
          var db = this._db;
          var transaction = db.transaction(['dictionary']);
          if (transaction == null)
            return;

          var objectStore = transaction.objectStore('dictionary');
          var request = objectStore.get(queryString);
          request.onerror = function(event) {
            debug('failed to query the specific key: ' + queryString);
          };

          request.onsuccess = function correctionCallback(event) {

            ++count;
            var result = event.target.result;
            if (result) {
              debug('request success: ' + result.key + ' , ' + result.value);
              insertArray(correctionResult, result, self.kCandidateNumber);

            }

            if (count == uniCorrectPattern.length && word == self.currentWord) {
              callback(correctionResult);
            }
          };

        }.bind(this));
      }
    }
  };

  var predictiveTextWrapper = new SpellChecker();

  // Expose typo-js wrapper as an AMD module
  if (typeof define === 'function' && define.amd)
    define('PredictiveText', [], function() { return typoJSWrapper; });

  // Expose to IMEManager if we are in Gaia homescreen
  if (typeof IMEManager !== 'undefined')
    IMEManager.SuggestionEngines['predictive_text'] = predictiveTextWrapper;
})();

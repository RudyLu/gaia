/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

(function () {

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
    var dictionaryWorker;

    var currentWord = '';

    this.init = function spellchecker_init(options) {
      settings = options;
      var affData;
      var dicData;

      //dictionaryWorker = new Worker(settings.path + '/typo-js.worker.js');
      
      /*
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
      */

      /* load dictionaries */
      var lang = settings.lang;

      /*
      dictionaryWorker.postMessage(
        {
          name: 'lang',
          value: lang
        }
      );
      */

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

      //getDictionary('affData', settings.path + '/dictionaries/' + lang + '/' + lang + '.aff');
      //getDictionary('dicData', settings.path + '/dictionaries/' + lang + '/' + lang + '.dic');

      // Load dictionary into indexedDB
      ptDict= new Dictionary('en');

      ptDict.openDB(function () {
          ptDict.load();
      });
    };

    var empty = function spellchecker_empty() {
      debug('Empty');
      currentWord = '';
    };

    this.empty = empty;

    var doSpellCheck = function () {
      //dictionaryWorker.postMessage(currentWord);
      //settings.sendCandidates([ ['hi'], ['this']]);
      
      if (currentWord.length < 2) {
        settings.sendCandidates([]);
        return;
      }

      var sendCandidates = function send_can (wordList) {

        var list = [];
        for (var i in wordList) {
          list.push([ wordList[i] ]);
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

  var indexedDB = window.indexedDB || window.webkitIndexedDB ||
                  window.mozIndexedDB || window.msIndexedDB;

  if (!indexedDB) {
    var msg = 'Cannot init IndexedDB module';
    console.error(msg);
    window.alert(msg);
  }

  var jsonData;
  var dbName = "predictText-dictionary-test3";
  var dbVersion = 6;

  var Dictionary = function pt_dictionary(locale) {
    this._locale = locale;
    this._db = null;
  };

  Dictionary.prototype = {
    // To open DB to store dictionary
    openDB: function dict_openDB (callback) {
      var kDBVersion;   // to define the DB version
      //var dbName = "predictText-dictionary";
      var request = indexedDB.open(dbName, dbVersion);

      request.onsuccess = function openDB_success(event) {
        console.log('open database', dbName, event);
        //func(request.result, storeName, callback, data);
        //
        this._db = event.target.result;
        callback();

      }.bind(this);

      request.onerror = function(event) {
        console.error('Can\'t open database', dbName, event);
        alert("Cannot open dictionary IndexedDB?!");
      };

      request.onupgradeneeded = function (event) {
        var db = event.target.result;

        // Create an objectStore to hold information about our customers. We're  
        // going to use "ssn" as our key path because it's guaranteed to be  
        // unique.  
        if (db.objectStoreNames.contains("dictionary")) {
          db.deleteObjectStore("dictionary");
          console.log('dictionary store deleted!');
        }

        db.createObjectStore('dictionary', {keyPath: 'key'});
      }

    },


    load: function () {

      var getDictJSON = function dict_getDictJSON(callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', settings.path + '/dictionaries/en.json', true);

        try {
          //xhr.responseType = 'json';
        } catch (e) { }

        xhr.overrideMimeType('application/json; charset=utf-8');
        xhr.onreadystatechange = function xhrReadystatechange(ev) {

          console.log('xhr ready state: ' + xhr.readyState);
          if (xhr.readyState !== 4)
            return;

          var response;
          if (xhr.responseType == 'json') {
            response = xhr.response;
          } else {


            try {
              //console.log('JSON parsing: ' + xhr.responseText);
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

          jsonData = response;

          xhr = null;
          callback();
        };

        xhr.send(null);
      }


      // Store values in the newly created objectStore.  
      var timeBegin = (new Date()).getTime();

      getDictJSON( function populateDB() {

          var timeEnd = (new Date()).getTime();

          console.log('loading dict: ' + (timeEnd - timeBegin) + ' ms');

          var timeStart = (new Date()).getTime();

          var count = 0;

          var addTransaction = this._db.transaction(["dictionary"], IDBTransaction.READ_WRITE);
          var objectStore = addTransaction.objectStore("dictionary");


          addTransaction.oncomplete = function putComplete() {
            console.log('add complete');
          };

          addTransaction.onerror = function (e) {
            console.log("transaction error: ", e);
          };

          for (var i in jsonData) {
            var addRequest = objectStore.put(jsonData[i]);
            addRequest.onsuccess = function (event) {
              count++;
            }
          }

          console.log('Inserted: ' + count + ' records');

          addRequest.onsuccess = function(event) {  
            //i++;
            //objectStore.add(jsonData[i].value, jsonData[i].key);
          };

          timeEnd = (new Date()).getTime();
          console.log('loading dict into DB: ' + (timeEnd - timeStart) + ' ms');
      }.bind(this));

    },

    lookup: function (inputKey, callback) {

      // query by keyRange
      var queryString = inputKey

      var request = indexedDB.open(dbName, dbVersion);

      request.onsuccess = function(event) {
        console.log('open database', dbName, event);
        //func(request.result, storeName, callback, data);
        //
        var db = event.target.result;

        var transaction = db.transaction(["dictionary"]);  
        if (transaction == null)
          return;

        var boundKeyRange = IDBKeyRange.bound(queryString, queryString + 'z', false, false);
        var objectStore = transaction.objectStore("dictionary");

        var resultList = [];

        var timeStart = new Date().getTime();

        objectStore.openCursor(boundKeyRange, IDBCursor.PREV).onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
            resultList.push(cursor.value);
            cursor.continue();
          } else {
            console.log('empty cursor');

            var timeEnd = new Date().getTime();
            console.log('query DB took: ' + (timeEnd - timeStart) + 'ms' );

            resultList.sort(function compare(a, b) {
                return (b.value - a.value);
            });

            var returnList = [];
            for (var i = 0; i < Math.min(resultList.length, 10); i++) {
              console.log('key: ' + resultList[i].key + ' , ' + resultList[i].value);
              returnList.push(resultList[i].key);
            }
            // callback with results
            callback(returnList);
          }

        };

      }
    }

  }

  var predictiveTextWrapper = new SpellChecker();

  // Expose typo-js wrapper as an AMD module
  if (typeof define === 'function' && define.amd)
    define('PredictiveText', [], function() { return typoJSWrapper; });

  // Expose to IMEManager if we are in Gaia homescreen
  if (typeof IMEManager !== 'undefined')
    IMEManager.SuggestionEngines['predictive_text'] = predictiveTextWrapper;
})();

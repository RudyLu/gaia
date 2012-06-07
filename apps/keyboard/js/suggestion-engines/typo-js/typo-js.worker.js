'use strict';

var dictionary;
var affData;
var dicData;
var lang;

var debug = function debug(str) {
  self.postMessage('Worker: ' + str);
}

/* load typo.js */
importScripts('typo.js');

function load() {
  debug('Load');
  if (!affData || !dicData || !lang)
    return;

  dictionary = new Typo(lang, affData, dicData);

  debug('Loaded');

  // remove our own references
  affData = undefined;
  dicData = undefined;
};

self.onmessage = function (evt) {
  if (typeof evt.data !== 'string') {
    var data = evt.data;
    debug('Got data: ' + data.name + ', length: ' + data.value.length);

    self[data.name] = data.value;
    load();
    return;
  }

  var word = evt.data;
  debug('Got word: ' + word);

  if (word.length < 2) {
    self.postMessage([]);
  } else {
    self.postMessage(dictionary.suggest(evt.data, 10, false, true));
  }
};

/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

/*
 * The upper layer for predictive text feature, it would pass the user input to
 * the underlying engine for word suggestions.
 *
 * Overview: The predictive text feature is based on Android's solution in
 * LatinIME module.
 * see https://android.googlesource.com/platform/packages/inputmethods/LatinIME
 */

'use strict';

var NUL = -1;
var PROXIMITY = [
  'q', 'w', 's', 'a', 'z', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'w', 'q', 'a', 's', 'd', 'e', 'x', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'e', 'w', 's', 'd', 'f', 'r', 'a', 'i', 'o', 'u', NUL, NUL, NUL, NUL, NUL, NUL,
  'r', 'e', 'd', 'f', 'g', 't', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  't', 'r', 'f', 'g', 'h', 'y', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'y', 't', 'g', 'h', 'j', 'u', 'a', 's', 'd', 'x', NUL, NUL, NUL, NUL, NUL, NUL,
  'u', 'y', 'h', 'j', 'k', 'i', 'a', 'e', 'o', NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'i', 'u', 'j', 'k', 'l', 'o', 'a', 'e', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'o', 'i', 'k', 'l', 'p', 'a', 'e', 'u', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'p', 'o', 'l', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'a', 'z', 'x', 's', 'w', 'q', 'e', 'i', 'o', 'u', NUL, NUL, NUL, NUL, NUL, NUL,
  's', 'q', 'a', 'z', 'x', 'c', 'd', 'e', 'w', NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'd', 'w', 's', 'x', 'c', 'v', 'f', 'r', 'e', 'w', NUL, NUL, NUL, NUL, NUL, NUL,
  'f', 'e', 'd', 'c', 'v', 'b', 'g', 't', 'r', NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'g', 'r', 'f', 'v', 'b', 'n', 'h', 'y', 't', NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'h', 't', 'g', 'b', 'n', 'm', 'j', 'u', 'y', NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'j', 'y', 'h', 'n', 'm', 'k', 'i', 'u', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'k', 'u', 'j', 'm', 'l', 'o', 'i', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'l', 'i', 'k', 'p', 'o', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'z', 'a', 's', 'd', 'x', 't', 'g', 'h', 'j', 'u', 'q', 'e', NUL, NUL, NUL, NUL,
  'x', 'z', 'a', 's', 'd', 'c', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'c', 'x', 's', 'd', 'f', 'v', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'v', 'c', 'd', 'f', 'g', 'b', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'b', 'v', 'f', 'g', 'h', 'n', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'n', 'b', 'g', 'h', 'j', 'm', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  'm', 'n', 'h', 'j', 'k', 'l', 'o', 'p', NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
  NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL, NUL,
]; 

var debugging = true;

function debug(msg) {
  if (!debugging)
    return;
  console.log('[predictiveText]: ' + msg);

}

var SuggestionEngine = {};

var keyDetector;
var mostCommonKeyWidth;
var proximityInfo;

var BinaryDictionary = function BinaryDictionary(filename, offset, length) {

  this._outputChars = new Int32Array(1024);
  this._scores = new Int32Array(1024);

  //this.loadDictionary(filename, offset, length);
};

var _ptManager = window.navigator.predictiveText;
if (!_ptManager)
    console.error("Cannot get window.navigator.predictiveText");

BinaryDictionary.MAX_WORD_LENGTH = 48;

BinaryDictionary.prototype = {
  // const definitions
  MAX_WORD_LENGTH: 48,
  MAX_PROXIMITY_CHARS_SIZE: 16,
  MAX_WORDS: 10,
  //MAX_BIGRAMS: 60,
  TYPED_LETTER_MULTIPLIER: 2,
  FULL_WORD_SCORE_MULTIPLIER: 2,   // In Dictionary class

  loadDictionary: function binDict_loadDictionary(path, startOffset, length) {
    /*
    this._nativeDict = emScriptenCreateDictionary(path, startOffset, length,
      this.TYPED_LETTER_MULTIPLIER, this.FULL_WORD_SCORE_MULTIPLIER,
      this.MAX_WORD_LENGTH, this.MAX_WORDS, this.MAX_PROXIMITY_CHARS_SIZE);
    */
  },


  getWords: function binDict_getWords(codes, callback, proximityInfo) {

    if (!this.isValidDictionary())
      return -1;

    var codesSize = codes.size();

    // Won't deal with really long words.
    if (codesSize > this.MAX_WORD_LENGTH - 1)
      return -1;

    var flags = 0;
    this._inputCodes = [];  // -1 should be wordComposer.NOT_A_CODE
    for (var i = 0; i < (codesSize * this.MAX_PROXIMITY_CHARS_SIZE); i++) {
      this._inputCodes[i] = 0;
    } 

    for (var i = 0; i < codesSize; i++) {

      var alternatives = codes._codes[i];

      if (!alternatives) {
        debug('alternatives undefined/null');
        return -1;
      }

      debug('alternatives for ' + i + ' ' + JSON.stringify(alternatives));

      /*
      copyArray(alternatives, 0,
                 this._inputCodes, i * this.MAX_PROXIMITY_CHARS_SIZE,
                 Math.min(alternatives.length, this.MAX_PROXIMITY_CHARS_SIZE));
               */

      for (var j = 0; j < alternatives.length; j++) {
        if (alternatives[j] == -1) {
          this._inputCodes[i * this.MAX_PROXIMITY_CHARS_SIZE + j] = 0;
        } else {
          var code = String.fromCharCode(alternatives[j]);
          code = code.toLowerCase();
          this._inputCodes[i * this.MAX_PROXIMITY_CHARS_SIZE + j] = code;
          this
        }
      }

    }

    var start = new Date().getTime();

   /* TEST INPUT */

     var MAXPROXIMITYCHARSIZE = 16;
     var displayInfoParameters = {
       proximityCharsLength : MAXPROXIMITYCHARSIZE,
       keyboardWidth : 480,
       keyboardHeight : 300,
       gridWidth : 3,
       gridHeight : 10,
       proximityChars : PROXIMITY
     };
     var sweetSpotInfoParameters = {
       x : 0.0,
       y : 0.0,
       radius : 0.0
     };
     var sweetSpotInfoParameters2 = {
       x : 0.0,
       y : 0.0,
       radius : 0.0
     };
     var keyInfoParameters = {
       x : 0,
       y : 0,
       width : 0,
       height : 0,
       charCode : 0,
       sweetSpotInfo : sweetSpotInfoParameters
     };
     var keyInfoParameters2 = {
       x : 0,
       y : 0,
       width : 0,
       height : 0,
       charCode : 0,
       sweetSpotInfo : sweetSpotInfoParameters2
     };

     var testProximityInfo = _ptManager.createProximityInfo(displayInfoParameters, [keyInfoParameters, keyInfoParameters2]); 
     //console.log('testProx:' + JSON.stringify(testProximityInfo)); 

     for (var o in testProximityInfo) {
       console.log('dumpProx: ' + o + " : " + testProximityInfo[o]);
     }

   /****/

   var word = codes._typedWord;

   var xcoords = [];
   var ycoords = [];
   for (var i = 0; i < word.length; i++) {
     xcoords[i] = 0;
     ycoords[i] = 0;
   } 

   var inputword = [];
   for (var i = 0; i < (word.length * MAXPROXIMITYCHARSIZE); i++) {
     inputword[i] = 0;
   }
   for (var i = 0; i < word.length; i++) {
     inputword[i*MAXPROXIMITYCHARSIZE] = word[i];
   }

   var suggestionParameters = {
     xCoordinates : codes._xCoordinates,
     yCoordinates : codes._yCoordinates,
     input : this._inputCodes,
     flags : 0
   }; 

   console.log('input:' + JSON.stringify(proximityInfo._nativeProximityInfo)); 
   console.log('input2:' + JSON.stringify(suggestionParameters)); 


   var req = _ptManager.getSuggestions(proximityInfo._nativeProximityInfo, 
                                      suggestionParameters);

   // handle result
   req.onsuccess = function (event) {

     var elapsed = new Date().getTime() - start;
     var resStr = "";
     resStr += "time: " + elapsed + " ms <br/ ><br/ >";

     var res = event.target.result;
     console.log('res:' + res);

     // XXX: no frequency info
     callback.addWords(res, []); // no dicTypeId && DataType
   }

   // var elapsed = new Date().getTime() - start;
   // debug('Get suggestion with ' + codes._typedWord + ' cost: ' +
   //       elapsed + ' ms');

    //return suggestions;
  },

  isValidDictionary: function binDict_isValidDictionary() {
    return this._nativeDict != 0;
  }

}

var typedLetterMultiplier = 2;
var fullWordMultiplier = 2;
var maxWords = 18;
var maxAlternatives = 8;

function fillArray(array, value) {
  var length = array.length;
  for (var i = 0; i < length; i++) {
    array[i] = value;
  }
}

function copyArray(array1, start1, array2, start2, count) {
  for (var i = start1, j = start2, n = 0; n < count; i++, j++, n++) {
    array2[j] = array1[i];
  }
}

var KeyDetector = function(keys) {

  this.keys = keys;
  // working area
  this._distances = new Int32Array(KeyDetector.MAX_NEARBY_KEYS);
  this._indices = new Int32Array(KeyDetector.MAX_NEARBY_KEYS);
};

KeyDetector.MAX_NEARBY_KEYS = 12;

KeyDetector.prototype = {

  getKeyIndexAndNearbyCodes: function kd_getKeyIndexAndNearbyCodes(x, y,
                                                                   allCodes) {
    var allKeys = this.keys;

    this.initializeNearbyKeys();
    var primaryIndex = -1;
    var proximityCorrectOn = true;
    var proximityThresholdSquare = mostCommonKeyWidth * mostCommonKeyWidth;

    var nearestKeys = proximityInfo.getNearestKeys(x, y);
    for (var i = 0; i < nearestKeys.length; i++) {
      var index = nearestKeys[i];
      var key = allKeys[index];
      var isOnKey = key.isOnKey(x, y);
      var distance = key.squaredDistanceToEdge(x, y);

      if (isOnKey ||
          (proximityCorrectOn && distance < proximityThresholdSquare)) {
        var insertedPosition = this.sortNearbyKeys(index, distance, isOnKey);
        if (insertedPosition == 0 && isOnKey)
          primaryIndex = index;
      }
    }

    if (allCodes != null && allCodes.length > 0) {
      this.getNearbyKeyCodes(allCodes);
    }

    return primaryIndex;
  },

  initializeNearbyKeys: function kd_initializeNearbyKeys() {
    var INT_MAX = Math.pow(2, 31) - 1;
    fillArray(this._distances, INT_MAX);
    fillArray(this._indices, -1);
  },

  getNearbyKeyCodes: function kd_getNearbyKeyCodes(allCodes) {
    var allKeys = this.keys;
    var indices = this._indices;

    // allCodes[0] should always have the key code,
    // even if it is a non-letter key.
    if (indices[0] == -1) {
      allCodes[0] = -1;
      return;
    }

    var numCodes = 0;
    for (var j = 0; j < indices.length && numCodes < allCodes.length; j++) {
      var index = indices[j];
      if (index == -1)
        break;

      var code = allKeys[index].code;
      allCodes[numCodes++] = code;
    }
  },

  sortNearbyKeys: function kd_sortNearbyKeys(keyIndex, distance, isOnKey) {
    var distances = this._distances;
    var indices = this._indices;

    for (var insertPos = 0; insertPos < distances.length; insertPos++) {
      var comparingDistance = distances[insertPos];

      if (distance < comparingDistance ||
          (distance == comparingDistance && isOnKey)) {
        var nextPos = insertPos + 1;
        if (nextPos < distances.length) {

          var tempDistances = new Int32Array(distances);
          copyArray(tempDistances, insertPos, distances, nextPos,
            distances.length - nextPos);

          var tempIndices = new Int32Array(indices);
          copyArray(tempIndices, insertPos, indices, nextPos,
            indices.length - nextPos);
        }

        distances[insertPos] = distance;
        indices[insertPos] = keyIndex;
        return insertPos;
      }
    }

    return distances.length;
  }
};

var Key = function(code, x, y, width, height) {
  this.code = code;
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
};

Key.prototype = {
  isSpacer: function key_isSpacer() {
    return (this.code == ' ');
  },

  squaredDistanceToEdge: function key_squaredDistanceToEdge(x, y) {
    var left = this.x;
    var right = left + this.width;

    var top = this.y;
    var bottom = top + this.height;

    var edgeX = x < left ? left : (x > right ? right : x);
    var edgeY = y < top ? top : (y > bottom ? bottom : y);
    var dx = x - edgeX;
    var dy = y - edgeY;
    return dx * dx + dy * dy;
  },

  isOnKey: function key_isOnKey(x, y) {
    return (x >= this.x && x <= this.x + this.width) &&
           (y >= this.y && y <= this.y + this.height);
  }
};

var ProximityInfo = function ProximityInfo(gridWidth, gridHeight,
  minWidth, height, keyWidth, keyHeight, keys, touchPositionCorrection) {

  this._gridWidth = gridWidth;
  this._gridHeight = gridHeight;
  this._gridSize = this._gridWidth * this._gridHeight;
  this._cellWidth = Math.ceil(minWidth / this._gridWidth);
  this._cellHeight = Math.ceil(height / this._gridHeight);
  this._keyboardMinWidth = minWidth;
  this._keyboardHeight = height;
  this._keyHeight = keyHeight;

  this._gridNeighbors = [];

  if (minWidth == 0 || height == 0) {
    // No proximity required. Keyboard might be mini keyboard.
    return;
  }

  this.computeNearestNeighbors(keyWidth, keys, touchPositionCorrection);

};

ProximityInfo.MAX_PROXIMITY_CHARS_SIZE = 16;
ProximityInfo.SEARCH_DISTANCE = 1.2;

ProximityInfo.prototype = {

  computeNearestNeighbors: function binDict_computeNearestNeighbors(
    defaultWidth, keys, touchPositionCorrection) {
    var thresholdBase = Math.floor(defaultWidth *
                                   ProximityInfo.SEARCH_DISTANCE);
    var threshold = thresholdBase * thresholdBase;

    var indices = new Int32Array(keys.length);
    var gridWidth = this._gridWidth * this._cellWidth;
    var gridHeight = this._gridHeight * this._cellHeight;

    for (var x = 0; x < gridWidth; x += this._cellWidth) {
      for (var y = 0; y < gridHeight; y += this._cellHeight) {
        var centerX = x + this._cellWidth / 2;
        var centerY = y + this._cellHeight / 2;

        var count = 0;
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];

          if (key.isSpacer())
            continue;

          if (key.squaredDistanceToEdge(centerX, centerY) < threshold)
            indices[count++] = i;
        }

        var cell = new Int32Array(count);
        copyArray(indices, 0, cell, 0, count);

        var index = (y / this._cellHeight) * this._gridWidth +
                    (x / this._cellWidth);
        this._gridNeighbors[index] = cell;
      }
    }

    this.setProximityInfo(this._gridNeighbors, this._keyboardMinWidth,
      this._keyboardHeight, keys, touchPositionCorrection);
  },

  setProximityInfo: function pi_setProximityInfo(gridNeighborKeyIndices,
    keyboardWidth, keyboardHeight, keys, touchPositionCorrection) {
    var proximityCharsArray = new Int32Array(this._gridSize *
      ProximityInfo.MAX_PROXIMITY_CHARS_SIZE);

    fillArray(proximityCharsArray, -1); // should be KeyDetector.NOT_A_CODE

    for (var i = 0; i < this._gridSize; ++i) {
      var proximityCharsLength = gridNeighborKeyIndices[i].length;

      for (var j = 0; j < proximityCharsLength; ++j) {

        if (keys[gridNeighborKeyIndices[i][j]]) {
          proximityCharsArray[i * ProximityInfo.MAX_PROXIMITY_CHARS_SIZE + j] =
          keys[gridNeighborKeyIndices[i][j]].code;
        } else {
          console.error('error');
        }

      }
    }

    var keyCount = keys.length;

    var keyXCoordinates = new Int32Array(keyCount);
    var keyYCoordinates = new Int32Array(keyCount);
    var keyWidths = new Int32Array(keyCount);
    var keyHeights = new Int32Array(keyCount);

    var keyCharCodes = new Int32Array(keyCount);
    for (var i = 0; i < keyCount; ++i) {
      var key = keys[i];
      keyXCoordinates[i] = key.x;
      keyYCoordinates[i] = key.y;
      keyWidths[i] = key.width;
      keyHeights[i] = key.height;
      keyCharCodes[i] = key.code;
    }

    // TODO: no touch correction for now
    /*
     if (touchPositionCorrection != null && touchPositionCorrection.isValid()) {
       sweetSpotCenterXs = new float[keyCount];
       sweetSpotCenterYs = new float[keyCount];
       sweetSpotRadii = new float[keyCount];
       calculateSweetSpot(keys, touchPositionCorrection,
         sweetSpotCenterXs, sweetSpotCenterYs, sweetSpotRadii);
     }
     */
    var sweetSpotCenterXs = [];
    var sweetSpotCenterYs = [];
    var sweetSpotRadii = [];

    var displayInfoParameters = {
      proximityCharsLength : ProximityInfo.MAX_PROXIMITY_CHARS_SIZE,
      keyboardWidth : keyboardWidth,
      keyboardHeight : keyboardHeight,
      gridWidth : this._gridWidth,
      gridHeight : this._gridHeight,
      proximityChars : PROXIMITY
    };

    var sweetSpotInfoParameters = {
      x : 0.0,
      y : 0.0,
      radius : 0.0
    };

    var keyInfoArray = [];

    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var keyInfoParameters = {
        x : key.x,
        y : key.y,
        width : key.width,
        height : key.height,
        charCode : key.code - 0,
        sweetSpotInfo : sweetSpotInfoParameters
      };

      keyInfoArray.push(keyInfoParameters);
    }

    /*
    this._nativeProximityInfo = emScriptenCreateProximityInfo(
      ProximityInfo.MAX_PROXIMITY_CHARS_SIZE,
      keyboardWidth, keyboardHeight, this._gridWidth, this._gridHeight,
      proximityCharsArray, keyCount, keyXCoordinates, keyYCoordinates,
      keyWidths, keyHeights, keyCharCodes,
      sweetSpotCenterXs, sweetSpotCenterYs, sweetSpotRadii);
    */

    console.log('keyInfo:' + JSON.stringify(keyInfoArray));
    this._nativeProximityInfo = _ptManager.createProximityInfo(displayInfoParameters, keyInfoArray);

    if (this._nativeProximityInfo != null) 
      console.log('native prox:' + JSON.stringify(this._nativeProximityInfo));
    else 
      console.log('native prox null:');

  },

  getNearestKeys: function pi_getNearestKeys(x, y) {
    if (this._gridNeighbors == null) {
      return [];
    }

    if (x >= 0 && x < this._keyboardMinWidth &&
        y >= 0 && y < this._keyboardHeight) {
      var index = Math.floor(y / this._cellHeight) *
                  this._gridWidth + Math.floor(x / this._cellWidth);
      if (index < this._gridSize) {
        return this._gridNeighbors[index];
      }
    }

    return [];
  }

};

var InnerWordComposer = function InnerWordComposer(word) {

  var N = BinaryDictionary.MAX_WORD_LENGTH;
  this._codes = [];
  this._typedWord = '';
  this._xCoordinates = new Int32Array(N);
  this._yCoordinates = new Int32Array(N);

  var length = word._typedWord.length;
  for (var i = 0; i < length; i++) {
    var keys = keyDetector.keys;
    var codes = new Int32Array(KeyDetector.MAX_NEARBY_KEYS);
    fillArray(codes, -1);

    var x = word._xCoordinates[i];
    var y = word._yCoordinates[i];

    keyDetector.getKeyIndexAndNearbyCodes(x, y, codes);

    this.add(word._codes[i],
      codes,
      x,
      y);
  }
};

InnerWordComposer.prototype = {
  add: function(primaryCode, codes, x, y) {
    var newIndex = this.size();
    this._typedWord += String.fromCharCode(primaryCode);

    this._codes.push(codes);
    if (newIndex < BinaryDictionary.MAX_WORD_LENGTH) {
      this._xCoordinates[newIndex] = x;
      this._yCoordinates[newIndex] = y;
    }
  },

  reset: function() {
    this._codes.length = 0;
    this._typedWord.length = 0;
  },

  size: function() {
    return this._typedWord.length;
  },

  deleteLast: function() {
    var size = this.size();
    if (size > 0) {
      var lastPos = size - 1;
      var lastChar = this._typedWord[lastPos];
      this._codes.pop();

      this._typedWord = this._typedWord.substring(0, lastPos);
    }
  }
};

(function() {

  var debugging = false;
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

  var _settings;
  var _binDict;

  var SpellChecker = function spellchecker() {

    var currentWord = null;
    var ptWorker;
    var layoutParams = null;

    // init: to setup the message bridge with the predictive text worker
    this.init = function spellchecker_init(options) {

      _settings = options;
      var lang = _settings.lang;

      var sourceDir = '';
      var dictOffset = 0;
      var dictSize = 0;
      // init engine
      _binDict = new BinaryDictionary(sourceDir, dictOffset, dictSize);
    };

    // clear the current input
    var empty = function spellchecker_empty() {
      debug('Empty');
      currentWord.reset();
    };

    this.empty = empty;


    var sendResult = function sendResult(suggestResult) {

      var sendCandidates = function send_can(wordList) {

        if (!wordList || wordList.length == 0) {
          _settings.sendCandidates([]);
          return;
        }

        var list = [];
        for (var i in wordList) {
          list.push([wordList[i]]);
        }

        _settings.sendCandidates(list);
      };

      sendCandidates(suggestResult);
    };

    // ask the worker for word suggestions
    var doSpellCheck = function() {

      if (currentWord.size() < 1) {
        _settings.sendCandidates([]);
        return;
      }

      debug('post message to do suggest: ' + currentWord._typedWord);
      //ptWorker.postMessage({
      //  currentWord: currentWord
      //});

      var innerWordComposer = new InnerWordComposer(currentWord);

      // callback function to inform the client of the word suggestions
      var callback = {
        addWords: function callback_addWords(wordList, scores) {
          sendResult(wordList);
        }
      };

      _binDict.getWords(innerWordComposer, callback, proximityInfo);
    };

    // handler when a key is clicked
    this.click = function spellchecker_click(keyCode, wordComposer) {

      switch (keyCode) {
        case KeyEvent.DOM_VK_RETURN:
        case KeyEvent.DOM_VK_SPACE:
          empty();
          _settings.sendCandidates([]);
          break;
        case KeyEvent.DOM_VK_BACK_SPACE:
          currentWord.deleteLast();
          doSpellCheck();
          break;
        default:
          currentWord = wordComposer;
          if (currentWord.size() < 1) {
            debug('Invalid input for suggestion');
            return;
          }

          doSpellCheck();
          break;
      }
    };

    // handler when a suggestion is selected by the user
    this.select = function(text, type) {
      var i = currentWord.size();
      while (i--) {
        _settings.sendKey(KeyEvent.DOM_VK_BACK_SPACE);
      }

      _settings.sendString(text + ' ');
      empty();
      _settings.sendCandidates([]);
    };


    // Interface for controller to set the keyboard layout info
    this.setLayoutParams = function(params) {
      layoutParams = params;

      var gridWidth = 32;
      var gridHeight = 16;

      var keys = [];

      if (!layoutParams.keyArray) {
        debug('keyArray not ready');
        return;
      }

      for (var i = 0, length = layoutParams.keyArray.length; i < length; i++) {
        var key = layoutParams.keyArray[i];
        keys.push(new Key(key.code, key.x, key.y, key.width, key.height));
      }

      mostCommonKeyWidth = keys[0].width;

      proximityInfo = new ProximityInfo(gridWidth, gridHeight,
        layoutParams.keyboardWidth, layoutParams.keyboardHeight,
        mostCommonKeyWidth, keys[0].height, keys, null);

      keyDetector = new KeyDetector(keys);
    };
  };

  var predictiveTextWrapper = new SpellChecker();
  SuggestionEngine = predictiveTextWrapper;

  // Expose typo-js wrapper as an AMD module
  if (typeof define === 'function' && define.amd)
    define('PredictiveText', [], function() { return typoJSWrapper; });

  // Expose to IMEController if we are in Gaia homescreen
  if (typeof IMEManager !== 'undefined') {
    IMEController.suggestionEngines['predictive_text'] = predictiveTextWrapper;
  }


})();

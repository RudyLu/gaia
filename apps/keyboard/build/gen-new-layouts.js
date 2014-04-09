'use strict';

/* global require, exports */

var utils = require('utils');
var keyboardConfig = require('./keyboard-config');

function KeyboardLayoutGenerator() {

}

KeyboardLayoutGenerator.prototype.execute = function(options) {
  utils.log('yeah' + 'what the hell');
  keyboardConfig.genLayoutsWithNewFormat();
};

exports.execute = function(options) {
  // We cannot export prototype functions out :(
  // so we run execute() this way.
  (new KeyboardLayoutGenerator()).execute(options);
};

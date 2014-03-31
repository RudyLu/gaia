'use strict';

/* global require, exports */

var utils = require('utils');

function KeyboardAppBuilder() {

}

KeyboardAppBuilder.prototype.execute = function(options) {
  utils.log('yeah' + 'what the hell');
};

exports.execute = function(options) {
  // We cannot export prototype functions out :(
  // so we run execute() this way.
  (new KeyboardAppBuilder()).execute(options);
};

/*
 * To handle showing value selector in dialog overlay.
 * For now, this is used for trusted UI only, and will be deprecated by
 * Bug 911880.
 */

/* global ValueSelector */

'use strict';

(function(exports) {

function ValueSelectorOverlay() {
}

exports.ValueSelectorOverlay = ValueSelectorOverlay;

ValueSelectorOverlay.prototype = Object.create(window.BaseUI.prototype);

ValueSelectorOverlay.prototype.start = function() {
  this.element = document.getElementById('dialog-overlay');
  this.screen = document.getElementById('screen');
  window.addEventListener('mozChromeEvent', this);

  // Only active to show value selector for trusted UI
  this.active = false;
  //window.addEventListener('trusteduishow', this);
  //window.addEventListener('trusteduihide', this);

  this.render();
};

ValueSelectorOverlay.prototype.render = function() {
  // Make the value selector show in the dialog overlay
  this.valueSelector = new ValueSelector(this);
};

ValueSelectorOverlay.prototype.handleEvent = function(evt) {

  console.log('trusted UI value selector: ' + evt.type);
  switch (evt.type) {
    case 'mozChromeEvent':
      console.log('trusted UI value selector: mozChromeEvent ' +
                  evt.detail.type);
      if (!this.active ||
          !evt.detail ||
          evt.detail.type !== 'inputmethod-contextchange') {

        console.log('trusted UI value selector: mozChromeEvent  early return ' +
                     this.active);
        return;
      }

      var typesToHandle = ['select-one', 'select-multiple', 'date', 'time',
        'datetime', 'datetime-local', 'blur'];
      if (typesToHandle.indexOf(evt.detail.inputType) < 0) {
        return;
      }

      console.log(' calling stop propagation');

      // Making sure system dialog and app-window won't receive this event.
      evt.stopImmediatePropagation();

      this.debug('broadcast: for value selector');
      this.broadcast('inputmethod-contextchange', evt.detail);

      // Make dialog-overlay show
      if (evt.detail.inputType === 'blur') {
        this.screen.classList.remove('dialog');
      } else {
        this.screen.classList.add('dialog');
      }
      break;
    case 'trusteduishow':
      this.active = true;
    break;
    case 'trusteduihide':
      this.active = false;
    break;
  }
};

ValueSelectorOverlay.prototype._setVisibleForScreenReader =
  function vso__setVisibleForScreenReader(visible) {
  // XXX: do nothing
};

ValueSelectorOverlay.prototype.activate = function(frame) {
  this.active = true;
  this.trustedUiFrame = frame;
};

ValueSelectorOverlay.prototype.deactivate = function() {
  this.active = false;
  this.trustedUiFrame = null;
};

}(window));

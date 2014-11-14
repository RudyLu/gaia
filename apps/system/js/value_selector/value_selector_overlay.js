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

  this.render();
};

ValueSelectorOverlay.prototype.render = function() {
  // Make the value selector show in the dialog overlay
  this.valueSelector = new ValueSelector(this);
};

ValueSelectorOverlay.prototype.handleEvent = function(evt) {
  switch (evt.type) {
    case 'mozChromeEvent':
      if (!this.active ||
          !evt.detail ||
          evt.detail.type !== 'inputmethod-contextchange') {
        return;
      }

      var typesToHandle = ['select-one', 'select-multiple', 'date', 'time',
        'datetime', 'datetime-local', 'blur'];
      if (typesToHandle.indexOf(evt.detail.inputType) < 0) {
        return;
      }
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
  }
};

ValueSelectorOverlay.prototype._setVisibleForScreenReader =
  function vso__setVisibleForScreenReader(visible) {
  if (this.trustedUiFrame) {
    this.debug('aria-hidden on TrustedUiFrame:' + !visible);
    this.trustedUiFrame.setAttribute('aria-hidden', !visible);
  }
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

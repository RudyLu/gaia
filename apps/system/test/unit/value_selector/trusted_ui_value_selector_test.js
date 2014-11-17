'use strict';
/* global TrustedUiValueSelector, Event */

requireApp('system/js/base_ui.js');
requireApp('system/js/value_selector/value_selector.js');
requireApp('system/js/value_selector/trusted_ui_value_selector.js');

suite('Value Selector for trusted UI', function() {

  suiteSetup(function() {
    var dialogOverlay = document.createElement('div');
    dialogOverlay.classList.add('dialog-overlay');
  });

  test('> handle mozChrome event', function() {
    var context = {
      element: document.createElement('div')
    };

    var valueSelector = new TrustedUiValueSelector(context);
    valueSelector.start();

    this.sinon.spy(valueSelector, 'handleEvent');
    this.sinon.spy(valueSelector, 'broadcast');

    window.dispatchEvent(new Event('mozChromeEvent'));

    assert.isTrue(valueSelector.handleEvent.called);
  });

  test('> will broadcast event when active', function() {
    var context = {
      element: document.createElement('div')
    };

    var valueSelector = new TrustedUiValueSelector(context);
    valueSelector.start();

    valueSelector.active = true;

    this.sinon.spy(valueSelector, 'handleEvent');
    this.sinon.spy(valueSelector, 'broadcast');

    window.dispatchEvent(new CustomEvent('mozChromeEvent', {
      detail: {
        type: 'inputmethod-contextchange',
        inputType: 'select-one'
      }
    }));

    assert.isTrue(valueSelector.handleEvent.called);
    assert.isTrue(valueSelector.broadcast.called);
  });
});

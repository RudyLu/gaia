/* global Player */
'use strict';

requireApp('music/js/player.js');

suite('music player', function() {

  suite('player notification', function() {
    var player;

    setup(function() {
      player = new Player();
    });

    teardown(function() {
      player.destroy();
    });

    test('register the listener for state', function() {
      var fakeListener = sinon.stub();
      player.registerListener('state', fakeListener);

      player.updateState('state');

      assert.isTrue(fakeListener.called,
                    'does not get notified when start playing');
    });

    test('won\'t get notified when registering the wrong topic', function() {
      var fakeListener = sinon.stub();
      player.registerListener('whatever', fakeListener);

      player.updateState('state');

      assert.isFalse(fakeListener.called,
                    'should not get notified when did not register');
    });

    test('won\'t get notified after unregistering', function() {
      var fakeListener = sinon.stub();
      player.registerListener('state', fakeListener);
      player.unregisterListener('state', fakeListener);

      player.updateState('state');

      assert.isFalse(fakeListener.called,
                    'should not get notified when did not register');
    });
  });
});


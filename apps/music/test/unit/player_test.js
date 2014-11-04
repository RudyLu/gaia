'use strict';
/* global Player, MocksHelper */

require('/shared/test/unit/mocks/mock_audio.js');
requireApp('music/js/player.js');

var mocksHelperForPlayer = new MocksHelper([
  'Audio'
]);

mocksHelperForPlayer.init();

suite('music player', function() {
  mocksHelperForPlayer.attachTestHelpers();

  var player;
  setup(function() {
    player = new Player();
  });

  teardown(function() {
    player.destroy();
  });

  suite('basic functions', function() {
    setup(function() {
      this.sinon.stub(player._audio);
    });

    test('play', function() {
      player.play();
      assert.isTrue(player._audio.play.calledOnce);
    });

    test('pause', function() {
      player.pause();
      assert.isTrue(player._audio.pause.calledOnce);
    });

    test('stop', function() {
      player.stop();
      assert.isTrue(player._audio.removeAttribute.calledWith('src'));
      assert.isTrue(player._audio.load.calledOnce);
    });

    test('seek', function() {
      player.seek(100);
      assert.equal(player._audio.currentTime, 100);
    });
  });

  suite('player notification', function() {
    setup(function() {
      player.start();
    });

    test('register the listener for state', function() {
      var fakeListener = sinon.stub();
      player.registerListener('state', fakeListener);

      player.play();
      player._audio.startPlaying();

      assert.isTrue(fakeListener.called,
                    'does not get notified when start playing');
    });

    test('won\'t get notified when registering the wrong topic', function() {
      var fakeListener = sinon.stub();
      player.registerListener('whatever', fakeListener);

      player.play();
      player._audio.startPlaying();

      assert.isFalse(fakeListener.called,
                    'should not get notified when did not register');
    });

    test('won\'t get notified after unregistering', function() {
      var fakeListener = sinon.stub();
      player.registerListener('state', fakeListener);
      player.unregisterListener('state', fakeListener);

      player.play();
      player._audio.startPlaying();

      assert.isFalse(fakeListener.called,
                    'should not get notified when did not register');
    });
  });
});

/* Create a player module here */

/* global MusicComms */

(function(exports) {
'use strict';

// AVRCP spec defined the statuses in capitalized and to be simple,
// our player just use them instead of defining new constant strings.
var PLAYSTATUS_STOPPED = 'STOPPED';
var PLAYSTATUS_PLAYING = 'PLAYING';
var PLAYSTATUS_PAUSED = 'PAUSED';
var PLAYSTATUS_FWD_SEEK = 'FWD_SEEK';
var PLAYSTATUS_REV_SEEK = 'REV_SEEK';
var PLAYSTATUS_ERROR = 'ERROR';
// Interrupt begin and end are the statuses for audio channel,
// they will be used when music app is interrupt by some other channels.
var INTERRUPT_BEGIN = 'mozinterruptbegin';
var INTERRUPT_END = 'mozinterruptend';

function Player() {
  this.audio = document.createElement('audio');
  this.state = '';

  // For state subscription
  this._topics = {};
}

exports.Player = Player;

Player.prototype.start = function() {
  var audio = this.audio;

  audio.addEventListener('play', this);
  audio.addEventListener('pause', this);
  audio.addEventListener('playing', this);
  audio.addEventListener('durationchange', this);
  audio.addEventListener('timeupdate', this);
  audio.addEventListener('ended', this);

  // Listen to mozinterruptbegin and mozinterruptend for notifying the system
  // media playback widget to reflect the playing status.
  audio.addEventListener('mozinterruptbegin', this);
  audio.addEventListener('mozinterruptend', this);
};

Player.prototype.play = function() {
  this.audio.play();
};

Player.prototype.pause = function() {
  this.audio.pause();
};

Player.prototype.seek = function(time) {
  this.audio.currentTime = time;
};

Player.prototype.getStartTime = function() {
  return this.audio.startTime;
};

Player.prototype.getCurrentTime = function() {
  return this.audio.currentTime;
};

Player.prototype.getDuration = function() {
  var endTime;
  var duration = this.audio.duration;
  // The audio element's duration might be NaN or 'Infinity' if it's not ready
  // We should get the duration from the buffered parts before the duration
  // is ready, and be sure to get the buffered parts if there is data in it.
  if (isNaN(duration)) {
    endTime = 0;
  } else if (duration === Infinity) {
    endTime = (this.audio.buffered.length > 0) ?
      this.audio.buffered.end(this.audio.buffered.length - 1) : 0;
  } else {
    endTime = this.audio.duration;
  }

  return endTime;
};

Player.prototype.destroy = function() {
  this.audio = null;
  this.state = '';
  this._topics = null;
};

Player.prototype.handleEvent = function(evt) {
  var target = evt.target;
  if (!target) {
      return;
  }

  switch (evt.type) {
    case 'play':
      this.publish('state', PLAYSTATUS_PLAYING);
      break;
    case 'pause':
      this.state = PLAYSTATUS_PAUSED;
      this.publish('state', PLAYSTATUS_PAUSED);
      this.updateRemotePlayStatus();
      break;
    case 'playing':
      // The playing event fires when the audio is ready to start.
      this.state = PLAYSTATUS_PLAYING;
      this.updateRemotePlayStatus();
      break;
    case 'durationchange':
    case 'timeupdate':
      this.publish('time', this.audio.currentTime);

      // Update the metadata when the new track is really loaded
      // when it just started to play, or the duration will be 0 then it will
      // break the duration that the connected A2DP has.
      if (evt.type === 'durationchange' || this.audio.currentTime === 0) {
        this.pulish('metadatachange');
      }

      // Since we don't always get reliable 'ended' events, see if
      // we've reached the end this way.
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=783512
      // If we're within 1 second of the end of the song, register
      // a timeout to skip to the next song one second after the song ends
      if (this.audio.currentTime >= this.audio.duration - 1 &&
          this.endedTimer == null) {
        var timeToNext = (this.audio.duration - this.audio.currentTime + 1);
        this.endedTimer = window.setTimeout(this.next.bind(this, true),
                                            timeToNext * 1000);
      }
      break;
    case 'ended':
      // Because of the workaround above, we have to ignore real ended
      // events if we already have a timer set to emulate them
      if (!this.endedTimer) {
        this.next(true);
      }
      break;

    case 'mozinterruptbegin':
      this.state = INTERRUPT_BEGIN;
      this.updateRemotePlayStatus();
      break;

    case 'mozinterruptend':
      // After received the mozinterruptend event the player should recover
      // its status to the status before mozinterruptbegin, it should be
      // PLAYING because mozinterruptbegin only fires when an audio element
      // is playing.
      this.state = PLAYSTATUS_PLAYING;
      //this.updateRemotePlayStatus();
      break;
  }
};

Player.prototype.setAudioSrc = function(file) {
  var url = URL.createObjectURL(file);
  this.playingBlob = file;

  // Reset src before we set a new source to the audio element
  this.audio.removeAttribute('src');
  this.audio.load();
  // Add mozAudioChannelType to the player
  this.audio.mozAudioChannelType = 'content';
  this.audio.src = url;
  this.audio.load();

  this.audio.play();
  // An object URL must be released by calling URL.revokeObjectURL()
  // when we no longer need them
  this.audio.onloadeddata = function(evt) { URL.revokeObjectURL(url); };
  this.audio.onerror = (function(evt) {
    if (this.onerror) {
      this.onerror(evt);
    }
  }).bind(this);
  // when play a new song, reset the seekBar first
  // this can prevent showing wrong duration
  // due to b2g cannot get some mp3's duration
  // and the seekBar can still show 00:00 to -00:00
  this.setSeekBar(0, 0, 0);

  if (this.endedTimer) {
    clearTimeout(this.endedTimer);
    this.endedTimer = null;
  }
};

Player.prototype.updateState = function(state) {
  this.state = state;
};

Player.prototype.updateRemotePlayStatus = function() {
    // If MusicComms does not exist then no need to update the play status.
    if (typeof MusicComms === 'undefined') {
      return;
    }

    var position = this.pausedPosition ?
      this.pausedPosition : this.audio.currentTime;

    var info = {
      playStatus: this.state,
      duration: this.audio.duration * 1000,
      position: position * 1000
    };

    // Before we resume the player, we need to keep the paused position
    // because once the connected A2DP device receives different positions
    // on AFTER paused and BEFORE playing, it will break the play/pause states
    // that the A2DP device kept.
    this.pausedPosition = (this.state === PLAYSTATUS_PLAYING) ?
      null : this.audio.currentTime;

    // Notify the remote device that status is changed.
    MusicComms.notifyStatusChanged(info);
};

Player.prototype.publish = function(topic, info) {
  // If the topic doesn't exist, or there's no listeners in queue, just leave
  if(!this._topics[topic] || !this._topics[topic].queue.length) {
    return;
  }

  // Cycle through topics queue, fire!
  var listeners = this._topics[topic].queue;
  listeners.forEach(function(item) {
    item(info || {});
  });
};

Player.prototype.registerListener = function(topic, listener) {
   // Create the topic's object if not yet created
   if (!this._topics[topic]) {
     this._topics[topic] = { queue: [] };
   }

   // Add the listener to queue
   this._topics[topic].queue.push(listener);
};

Player.prototype.unregisterListener = function(topic, listener) {
   var listeners = this._topics[topic].queue;
   if (!listeners) {
     return;
   }

   var index = listeners.indexOf(listener);
   if (index >= 0) {
     listeners.splice(index, 1);
   }
};

})(window);

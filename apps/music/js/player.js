/* Create a player module here */

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

Player.prototype.handleEvent = function(evt) {
  var target = evt.target;
  if (!target) {
      return;
  }

  switch (evt.type) {
    case 'play':
      this.playControl.classList.remove('is-pause');
      break;
    case 'pause':
      this.playControl.classList.add('is-pause');
      this.state = PLAYSTATUS_PAUSED;
      this.updateRemotePlayStatus();
      break;
    case 'playing':
      // The playing event fires when the audio is ready to start.
      this.state = PLAYSTATUS_PLAYING;
      this.updateRemotePlayStatus();
      break;
    case 'durationchange':
    case 'timeupdate':
      this.updateSeekBar();

      // Update the metadata when the new track is really loaded
      // when it just started to play, or the duration will be 0 then it will
      // break the duration that the connected A2DP has.
      if (evt.type === 'durationchange' || this.audio.currentTime === 0) {
        this.updateRemoteMetadata();
      }

      // Since we don't always get reliable 'ended' events, see if
      // we've reached the end this way.
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=783512
      // If we're within 1 second of the end of the song, register
      // a timeout to skip to the next song one second after the song ends
      if (this.audio.currentTime >= this.audio.duration - 1 &&
          this.endedTimer == null) {
        var timeToNext = (this.audio.duration - this.audio.currentTime + 1);
        this.endedTimer = setTimeout(function() {
                                       this.next(true);
                                     }.bind(this),
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

Player.prototype.getAudio = function() {
  return this.audio;
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

Player.prototype.updateState = function() {
};

Player.prototype.registerListener = function(topic, handler) {
   // Create the topic's object if not yet created
   if (!this._topics[topic]) {
     this._topics[topic] = { queue: [] };
   }

   // Add the listener to queue
   var index = topics[topic].queue.push(listener) -1;

};

})(window);


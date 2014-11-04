'use strict';
/* global Event */

function MockAudio(src) {
  MockAudio.instances.push(this);
  this.src = src;
  this.readyState = 1;
  this.paused = true;
  // Element for event dispatch
  this._element = document.createElement('div');
}

MockAudio.instances = [];

MockAudio.mSetup = function() {
  MockAudio.instances = [];
};

MockAudio.mTeardown = function() {
  MockAudio.instances = [];
};

MockAudio.prototype.HAVE_NOTHING = 0;

MockAudio.prototype.play = function() {
  // FIXME can we replace playing with paused?
  this.playing = true;
  this.paused = false;
};

MockAudio.prototype.pause = function() {
  this.playing = false;
  this.paused = true;
};

MockAudio.prototype.load = function() {
};

MockAudio.prototype.cloneNode = function() {
  return this;
};

MockAudio.prototype.removeAttribute = function() {
};

/*
 * Mock functions to control the event dispatching
 *
 */
MockAudio.prototype.addEventListener = function() {
  var element = this._element;
  element.addEventListener.apply(element, arguments);
};

MockAudio.prototype.removeEventListener = function() {
  var element = this._element;
  element.removeEventListener.apply(element, arguments);
};

MockAudio.prototype.startPlaying = function() {
  console.log(this._element);
  this._element.dispatchEvent(new Event('play'));
};

function MockAudioContext(channel) {
  MockAudioContext.instances.push(this);
  this.mozAudioChannelType = channel;
  this.currentTime = 0;
  this.sampleRate = 0;
  this.destination = null;
}

MockAudioContext.instances = [];

MockAudioContext.mSetup = function() {
  MockAudioContext.instances = [];
};

MockAudioContext.mTeardown = function() {
  MockAudioContext.instances = [];
};

MockAudioContext.prototype.createBuffer = function() { return {}; };
MockAudioContext.prototype.createBufferSource = function() { return {
  connect: function() {},
  start: function() {},
  stop: function() {}
};};
MockAudioContext.prototype.createGain = function() {};
MockAudioContext.prototype.addEventListener = function() {};
MockAudioContext.prototype.removeEventListener = function() {};

/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';


var MediaStorage = (function MediaStorage() {

    var deviceStorage = {};

    function _getFreeSpace(type, callback) {
      deviceStorage[type] = navigator.getDeviceStorage(type);


      var request;

      if (!deviceStorage[type])
        console.error('Cannot get DeviceStorage for: ' + type);

      var request = deviceStorage[type].stat();

      request.onsuccess = function(e) {
        console.log('media type - ' + type);

        var totalSize = e.target.result.totalBytes;
        console.log('free: ' + e.target.result.freeBytes);
        console.log('total: ' + e.target.result.totalBytes);

        callback(e.target.result.totalBytes,
                 e.target.result.freeBytes);
      };

    }

    return {
      getStat: _getFreeSpace
    };
})();

// handle BlueTooth settings
window.addEventListener('localized', function mediaStorageSettings(evt) {

  function _updateSize(type, size) {
    var id = type + '-space';
    var sizeElement = document.querySelector('#' + id + ' span');

    sizeElement.textContent = size;
  }

  MediaStorage.getStat('music', function(size) {
    _updateSize('music', size);
  });

  MediaStorage.getStat('pictures', function(size) {
    _updateSize('pictures', size);
  });

  MediaStorage.getStat('apps', function(size) {
    _updateSize('apps', size);
  });

  MediaStorage.getStat('videos', function(size, freeSize) {
    _updateSize('videos', size);

    var sizeElement = document.querySelector('#left-space span');
    sizeElement.textContent = freeSize;
  });
});

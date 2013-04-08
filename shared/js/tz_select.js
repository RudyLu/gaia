/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

function tzSelect(regionSelector, citySelector, onchange, onload) {
  var TIMEZONE_FILE = '/shared/resources/tz.json';
  var gTZ = null;

  var TIME_OFFSET_PATTERN = /UTC([+-]\d\d:\d\d)/;
  var REGION_PATTERN = /\//;

  // To set the current value of the time zone selector the same as timezoneID
  // Note that timezoneID may be the time zone offset, like "UTC+08:00"
  // or the region name as "Pacific/Pago_Pago"
  function setTimezoneDescription(timezoneID) {

    console.log('tzSelect - tzID: ' + timezoneID);

    if (REGION_PATTERN.test(timezoneID)) {
      regionSelector.value = timezoneID.replace(/\/.*/, '');
      citySelector.value = timezoneID.replace(/.*?\//, '');
    } else if (TIME_OFFSET_PATTERN.test(timezoneID)) {
      // Handle the case the ID is from NITZ, in the format of UTC+08:00
      var res = timezoneID.match(TIME_OFFSET_PATTERN);
      console.log('time zone string matched' + res[1]);

      findMatchedTimezone(res[1], function updateSelector(region, cityIndex) {
        var origRegion = regionSelector.value;
        regionSelector.value = region;

        if (origRegion != region) {
          fillCities();
        }

        citySelector.value = cityIndex;

        if (onchange)
          onchange(getTZInfo(region, cityIndex));
      });

    } else {
      console.warn('Unexpected format for time.timezone in settings' +
        timezoneID);
    }
  }

  // Traverse the tz data to find the first matched time zone region
  // The callback function will have (region, cityIndex) as its parameter
  function findMatchedTimezone(timezoneOffset, callback) {
    for (var region in gTZ) {
      var list = gTZ[region];
      var cityCount = list.length;

      for (var j = 0; j < cityCount; j++) {
        var tzResult = list[j];
        var offset = tzResult.offset.split(',');

        if (timezoneOffset == offset[0]) {
          console.log('tz matched: ' + region, ' - ', tzResult.city, j);

          if (callback) {
            callback(region, j);
          }

          return;
        }
      }
    }
  }

  function getSelectedText(selector) {
    var options = selector.querySelectorAll('option');
    return options[selector.selectedIndex].textContent;
  }

  function getTZInfo(region, city) {
    var res = gTZ[region][city];
    var offset = res.offset.split(',');
    return {
      id: res.id || region + '/' + res.city,
      region: getSelectedText(regionSelector),
      city: getSelectedText(citySelector),
      cc: res.cc,
      utcOffset: offset[0],
      dstOffset: offset[1]
    };
  }

  function fillSelectElement(selector, options) {
    selector.innerHTML = '';
    options.sort(function(a, b) {
      return (a.text > b.text);
    });
    for (var i = 0; i < options.length; i++) {
      var option = document.createElement('option');
      option.textContent = options[i].text;
      option.selected = options[i].selected;
      option.value = options[i].value;
      selector.appendChild(option);
    }
  }

  function fillRegions(currentRegion, currentCity) {
    var _ = navigator.mozL10n.get;
    var options = [];
    for (var c in gTZ) {
      options.push({
        text: _('tzRegion-' + c) || c,
        value: c,
        selected: (c == currentRegion)
      });
    }
    fillSelectElement(regionSelector, options);
    fillCities(currentCity);

    if (onload) {
      onload(getTZInfo(currentRegion, citySelector.value));
    }
  }

  // Fill in the city options
  // toSetTimezone, to set the timezone or not
  function fillCities(currentCity, callback) {
    var region = regionSelector.value;
    var list = gTZ[region];
    var options = [];
    for (var i = 0; i < list.length; i++) {
      options.push({
        text: list[i].name || list[i].city.replace(/_/g, ' '),
        value: i,
        selected: (list[i].city == currentCity)
      });
    }
    fillSelectElement(citySelector, options);

    if (callback) {
      callback();
    }
  }


  /**
   * Activate a timezone selector UI
   */

  function newTZSelector(onchangeTZ, currentID) {

    var gRegion = '';
    var gCity = '';

    function setTimezone() {
      console.log('setTimezone()' + regionSelector.value, citySelector.value);
      onchangeTZ(getTZInfo(regionSelector.value, citySelector.value));
    }

    function loadTZ(callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', TIMEZONE_FILE, true);
      xhr.responseType = 'json';
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          if (xhr.status == 200 || xhr.status === 0) {
            gTZ = xhr.response;
          }
          callback();
        }
      };
      xhr.send();
    }


    regionSelector.onchange = function region_onchange(evt) {
      fillCities(null, setTimezone);
    };

    citySelector.onchange = setTimezone;
    loadTZ(function fillRegionAndCities() {

      if (REGION_PATTERN.test(currentID)) {
        gRegion = currentID.replace(/\/.*/, '');
        gCity = currentID.replace(/.*?\//, '');
      } else if (TIME_OFFSET_PATTERN.test(currentID)) {
        // Handle the case the ID is from NITZ, in the format of UTC+08:00
        var res = currentID.match(TIME_OFFSET_PATTERN);
        console.log('time zone string matched' + res[1]);

        findMatchedTimezone(res[1], function getMatched(region, cityIndex) {
          gRegion = region;
          gCity = gTZ[region][cityIndex].city;
        });

      } else {
        console.warn('Unexpected format for time.timezone in settings' +
          currentID);

        return;
      }

      console.log('tz hi: ' + gRegion, '-', gCity);
      fillRegions(gRegion, gCity);
    });
  }

  /**
   * Monitor time.timezone changes
   */

  function newTZObserver() {
    var settings = window.navigator.mozSettings;
    if (!settings)
      return;

    settings.addObserver('time.timezone', function(event) {
      setTimezoneDescription(event.settingValue);
    });

    var reqTimezone = settings.createLock().get('time.timezone');
    reqTimezone.onsuccess = function dt_getStatusSuccess() {
      var lastMozSettingValue = reqTimezone.result['time.timezone'];
      console.log('tzSelect the timezone is: ' + lastMozSettingValue);
      if (!lastMozSettingValue) {
        lastMozSettingValue = 'Pacific/Pago_Pago';
      }

      // initialize the timezone selector with the initial TZ setting
      newTZSelector(function updateTZ(tz) {
        var req = settings.createLock().set({ 'time.timezone': tz.id });
        if (onchange) {
          req.onsuccess = function updateTZ_callback() {
            // Wait until the timezone is actually set
            // before calling the callback.
            window.addEventListener('moztimechange', function timeChanged() {
              window.removeEventListener('moztimechange', timeChanged);
              onchange(tz);
            });
          };
        }
      }, lastMozSettingValue);

      console.log('Initial TZ value: ' + lastMozSettingValue);
    };
  }

  /**
   * Startup -- make sure webL10n is ready before using tzSelect()
   */

  newTZObserver();
}


let utils = require('utils');
const { Cc, Ci, Cr, Cu, CC } = require('chrome');
Cu.import('resource://gre/modules/Services.jsm');

exports.copyLayoutsAndResources = copyLayoutsAndResources;
exports.addEntryPointsToManifest = addEntryPointsToManifest;
exports.genLayoutsWithNewFormat= genLayoutsWithNewFormat;

function copyLayoutsAndResources(appDir, distDir, layoutNames) {
  // Here is where the layouts and dictionaries get copied to
  let layoutDest = utils.getFile(distDir.path, 'js', 'layouts');
  let dictDest = utils.getFile(distDir.path,
                               'js', 'imes', 'latin', 'dictionaries');

  let imeDest = utils.getFile(distDir.path, 'js', 'imes');

  // First delete any layouts or dictionaries that are in the src dir
  // from the last time.
  utils.ensureFolderExists(layoutDest);
  utils.ensureFolderExists(dictDest);

  // Now get the set of layouts for this build
  let layouts = getLayouts(appDir, layoutNames);

  // Loop through the layouts and copy the layout file and dictionary file
  layouts.forEach(function(layout) {
    // Copy the layout file to where it needs to go
    layout.file.copyTo(layoutDest, layout.file.leafName);

    try {
      if (layout.imEngineDir)
        layout.imEngineDir.copyTo(imeDest, layout.imEngineDir.leafName);
    }
    catch(e) {
      throw new Error('Unknown ime directory ' + layout.imEngineDir.path +
                      ' for keyboard layout ' + layout.name);

    }

    try {
      if (layout.dictFile)
        layout.dictFile.copyTo(dictDest, layout.dictFile.leafName);
    }
    catch(e) {
      throw new Error('Unknown dictionary file ' + layout.dictFile.path +
                      ' for keyboard layout ' + layout.name);

    }
  });
}

function addEntryPointsToManifest(appDir, distDir, layoutNames, manifest) {
  // Get the set of layouts
  let layouts = getLayouts(appDir, layoutNames);

  // The inputs property of the manifest object has one property
  // for each keyboard layout we support. The manifest file has a hard-coded
  // entry for the numeric layout, but we have to add each additional layout.
  layouts.forEach(function(layout) {
    manifest.inputs[layout.name] = {
      launch_path: '/index.html#' + layout.name,
      name: layout.label,
      description: layout.label,
      types: layout.types
    };
  });

  // Finally, save the modified manifest into the target directory
  return manifest;
}

// Read the keyboard layout file for each of the named keyboard layouts in
// GAIA_KEYBOARD_LAYOUTS, and return an array of layout objects
function getLayouts(appDir, layoutNames) {
  // Here is where the layouts and dictionaries come from
  let layoutSrc = utils.getFile(appDir.path, 'js', 'layouts');
  let dictSrc = utils.getFile(appDir.path, 'js', 'imes', 'latin', 'dictionaries');
  let imeSrc = utils.getFile(appDir.path, 'js', 'imes');

  // Read the layout files and find their names and dictionaries,
  // and copy them into the app package
  let layouts = layoutNames.map(function(layoutName) {
    let layoutFile = utils.getFile(layoutSrc.path, layoutName + '.js');

	if (!layoutFile.exists()) {
       throw new Error("Keyboard layout " + layoutName + ".js specified by GAIA_KEYBOARD_LAYOUTS not found in " + layoutSrc.path)
    }

    try {
      return getLayoutDetails(layoutName, layoutFile);
    }
    catch(e) {
      // keep the original Error with its stack, just annotate which
      // keyboard failed.
      e.message = 'Problem with keyboard layout "' + layoutName +
                  '" in GAIA_KEYBOARD_LAYOUTS\n' + e.message;
      throw e;
    }
  });

  return layouts;

  // Read the .js file for the named keyboard layout and extract
  // the language name and auto-correct dictionary name.
  function getLayoutDetails(layoutName, layoutFile) {
    // The keyboard layout files are JavaScript files that add properties
    // to the Keybords object. They are not clean JSON, so we have to use
    // use the scriptloader to load them. That also gives stacktraces for
    // errors inside the keyboard file.
    // They reference globals KeyEvent and KeyboardEvent, so we
    // have to define those on the context object.
    var win = {Keyboards: {},
               KeyEvent: {},
               KeyboardEvent: {}};
    Services.scriptloader.loadSubScript('file://' + layoutFile.path, win, 'UTF-8');
    let dictName = win.Keyboards[layoutName].autoCorrectLanguage;
    let dictFile = dictName
      ? utils.getFile(dictSrc.path, dictName + '.dict')
      : null;
    let imEngineName = win.Keyboards[layoutName].imEngine;
    let imEngineDir = (imEngineName && imEngineName !== 'latin')
      ? utils.getFile(imeSrc.path, imEngineName)
      : null;

    return {
      name: layoutName,
      label: win.Keyboards[layoutName].menuLabel,
      file: layoutFile,
      types: win.Keyboards[layoutName].types,
      dictFile: dictFile,
      imEngineDir: imEngineDir,
      keys: win.Keyboards[layoutName].keys
    };
  }
}

function getPages(layout) {
  var needsEmail = false;
  var needsURL = false;

  var pages = {
    main: {
      layout: []
    }
  };

  KeyMap = {
    '⇪': 'SHIFT',
    '⌫': 'BACKSPACE',
    '&nbsp': 'SPACE',
    '↵': 'RETURN'
  };

  function getKeyValue(key, variantType) {
    if (key.visible && key.visible.indexOf('email') != -1) {
      needsEmail = true;
    }

    if (key.visible && key.visible.indexOf('url') != -1) {
      needsURL = true;
    }

    if (!variantType && key.visible) { // main layout
      return null;
    }

    if (variantType && key.visible && key.visible.indexOf(variantType) == -1) {   // email or url variant
      return null;
    }

    if (key.value in KeyMap) {
      return KeyMap[key.value];
    }

    return key.value;

  }

  function getPage(keys, variantType) {
    var page = [];
    var rowNumber = 0;

    keys.forEach(function (keyRow) {
      var newRow = keyRow.reduce(function(prev, curr, index, array) {
        utils.log('prev: '  + prev);
        utils.log('curr value: ' + curr.value);
        var keyValue = getKeyValue(curr, variantType);

        if (!keyValue) {
          return prev;
        }

        return prev ? (prev + ' ' + keyValue) : keyValue;
      }, '');
      page.push(newRow);
      rowNumber++;
    });

    //modifyLastRow(page, variantType);
    if (!variantType) {  // main layout
      page[rowNumber - 1] = page[rowNumber - 1].replace('SPACE', 'SPACE .');
      page[rowNumber - 1] = '?123 SWITCH ' + page[rowNumber - 1];
    } else if (variantType === 'email') {
      page[rowNumber - 1] = page[rowNumber - 1].replace('SPACE', '@ SPACE .');
      page[rowNumber - 1] = '?123 SWITCH ' + page[rowNumber - 1];
    } else if (variantType === 'url') {
      page[rowNumber - 1] = page[rowNumber - 1].replace('SPACE', 'SPACE .');
      page[rowNumber - 1] = '?123 SWITCH ' + page[rowNumber - 1];
    }

    return page;
  }

  var keys = layout.keys;
  pages.main.layout = getPage(keys);

  if (needsEmail || needsURL) {
    pages.main.variants = {};
  }

  if(needsEmail) {
    pages.main.variants['email'] = getPage(keys, 'email');
  }

  if (needsURL) {
    pages.main.variants['url'] = getPage(keys, 'url');
  }

  return pages;
}

function genLayoutsWithNewFormat(appDir, distDir, layoutNames) {
  utils.log('gen Layouts with new format');
  let layouts = getLayouts(appDir, layoutNames);

  layouts.forEach(function(layout) {
    var newLayoutFormat = {};

    newLayoutFormat = {
      name: layout.label,
      label: layout.menuLabel,
      pages: getPages(layout)
    };

    utils.mkdirs(utils.joinPath(distDir.path, 'newLayouts'));

    // Write the result to file
    let resultFile = utils.resolve(
        utils.joinPath('newLayouts', layout.name + '.json'),
        distDir.path);
    utils.writeContent(resultFile, JSON.stringify(newLayoutFormat, null, 2));
  });
}

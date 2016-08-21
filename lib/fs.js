/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module to-vfile
 * @fileoverview Read virtual files from the file-system.
 */

'use strict';

/* Dependencies. */
var fs = require('fs');
var vfile = require('./core');

/* Expose. */
module.exports = vfile;

vfile.read = async;
vfile.readSync = sync;

/**
 * Create a virtual file and read it in, asynchronously.
 *
 * @param {string|buffer|Object} description - File description.
 * @param {Object|string} [options] - `fs.readFile` options.
 * @param {Function} callback - Callback.
 */
function async(description, options, callback) {
  var file = vfile(description);

  if (!callback) {
    callback = options;
    options = null;
  }

  fs.readFile(file.path, options, function (err, res) {
    if (err) {
      callback(err);
    } else {
      file.contents = res;
      callback(null, file);
    }
  });
}

/**
 * Create a virtual file and read it in, synchronously.
 *
 * @param {string|buffer|Object} description - File description.
 * @param {Object|string} [options] - `fs.readFile` options.
 */
function sync(description, options) {
  var file = vfile(description);
  file.contents = fs.readFileSync(file.path, options);
  return file;
}

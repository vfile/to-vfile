'use strict';

var fs = require('fs');
var func = require('x-is-function');
var vfile = require('./core');

module.exports = vfile;

vfile.read = read;
vfile.readSync = readSync;
vfile.write = write;
vfile.writeSync = writeSync;

/* Create a virtual file and read it in, asynchronously. */
function read(description, options, callback) {
  var file = vfile(description);

  if (!callback && func(options)) {
    callback = options;
    options = null;
  }

  if (!callback) {
    return new Promise(executor);
  }

  executor(null, callback);

  function executor(resolve, reject) {
    fs.readFile(file.path, options, done);

    function done(err, res) {
      if (err) {
        reject(err);
      } else {
        file.contents = res;

        if (resolve) {
          resolve(file);
        } else {
          callback(null, file);
        }
      }
    }
  }
}

/* Create a virtual file and read it in, synchronously. */
function readSync(description, options) {
  var file = vfile(description);
  file.contents = fs.readFileSync(file.path, options);
  return file;
}

/* Create a virtual file and write it out, asynchronously. */
function write(description, options, callback) {
  var file = vfile(description);

  /* Weird, right? Otherwise `fs` doesn’t accept it. */
  if (!callback && func(options)) {
    callback = options;
    options = undefined;
  }

  if (!callback) {
    return new Promise(executor);
  }

  executor(null, callback);

  function executor(resolve, reject) {
    fs.writeFile(file.path, file.contents || '', options, done);

    function done(err) {
      if (err) {
        reject(err);
      } else if (resolve) {
        resolve();
      } else {
        callback();
      }
    }
  }
}

/* Create a virtual file and write it out, synchronously. */
function writeSync(description, options) {
  var file = vfile(description);
  fs.writeFileSync(file.path, file.contents || '', options);
}

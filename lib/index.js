import fs from 'fs'
import path from 'path'
import buffer from 'is-buffer'
import {VFile} from 'vfile'

// Create a virtual file from a description.  If `options` is a string or a
// buffer, it’s used as the path.  In all other cases, the options are passed
// through to `vfile()`.
export function toVFile(options) {
  if (typeof options === 'string' || buffer(options)) {
    options = {path: String(options)}
  }

  return options instanceof VFile ? options : new VFile(options)
}

toVFile.read = read
toVFile.readSync = readSync
toVFile.write = write
toVFile.writeSync = writeSync

// Create a virtual file and read it in, synchronously.
function readSync(description, options) {
  var file = toVFile(description)
  file.value = fs.readFileSync(path.resolve(file.cwd, file.path), options)
  return file
}

// Create a virtual file and write it out, synchronously.
function writeSync(description, options) {
  var file = toVFile(description)
  fs.writeFileSync(path.resolve(file.cwd, file.path), file.value || '', options)
  return file
}

// Create a virtual file and read it in, asynchronously.
function read(description, options, callback) {
  var file = toVFile(description)

  if (!callback && typeof options === 'function') {
    callback = options
    options = null
  }

  if (!callback) {
    return new Promise(executor)
  }

  executor(resolve, callback)

  function resolve(result) {
    callback(null, result)
  }

  function executor(resolve, reject) {
    var fp

    try {
      fp = path.resolve(file.cwd, file.path)
    } catch (error) {
      return reject(error)
    }

    fs.readFile(fp, options, done)

    function done(error, result) {
      if (error) {
        reject(error)
      } else {
        file.value = result
        resolve(file)
      }
    }
  }
}

// Create a virtual file and write it out, asynchronously.
function write(description, options, callback) {
  var file = toVFile(description)

  // Weird, right? Otherwise `fs` doesn’t accept it.
  if (!callback && typeof options === 'function') {
    callback = options
    options = undefined
  }

  if (!callback) {
    return new Promise(executor)
  }

  executor(resolve, callback)

  function resolve(result) {
    callback(null, result)
  }

  function executor(resolve, reject) {
    var fp

    try {
      fp = path.resolve(file.cwd, file.path)
    } catch (error) {
      return reject(error)
    }

    fs.writeFile(fp, file.value || '', options, done)

    function done(error) {
      if (error) {
        reject(error)
      } else {
        resolve(file)
      }
    }
  }
}

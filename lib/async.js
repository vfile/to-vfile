import fs from 'fs'
import path from 'path'
import {toVFile} from './core.js'

// Create a virtual file and read it in, asynchronously.
export function read(description, options, callback) {
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
export function write(description, options, callback) {
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

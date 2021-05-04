import fs from 'fs'
import path from 'path'
import {toVFile} from './core.js'

// Create a virtual file and read it in, synchronously.
export function readSync(description, options) {
  var file = toVFile(description)
  file.value = fs.readFileSync(path.resolve(file.cwd, file.path), options)
  return file
}

// Create a virtual file and write it out, synchronously.
export function writeSync(description, options) {
  var file = toVFile(description)
  fs.writeFileSync(path.resolve(file.cwd, file.path), file.value || '', options)
  return file
}

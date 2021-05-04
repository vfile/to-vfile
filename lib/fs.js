import {toVFile} from './core.js'
import {readSync, writeSync} from './sync.js'
import {read, write} from './async.js'

toVFile.read = read
toVFile.readSync = readSync
toVFile.write = write
toVFile.writeSync = writeSync

export {toVFile}

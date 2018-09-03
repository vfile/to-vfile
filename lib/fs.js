'use strict'

var vfile = require('./core')
var fsSync = require('./sync')
var fsAsync = require('./async')

module.exports = vfile

vfile.read = fsAsync.read
vfile.readSync = fsSync.read
vfile.write = fsAsync.write
vfile.writeSync = fsSync.write

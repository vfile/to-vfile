'use strict'

var fs = require('fs')
var path = require('path')
var test = require('tape')
var buffer = require('is-buffer')
var vfile = require('.')

var join = path.join

var fixture = fs.readFileSync('readme.md', 'utf8')

test('toVFile()', function(t) {
  t.test('should accept a string as `.path`', function(st) {
    var file = vfile(join('foo', 'bar', 'baz.qux'))

    st.equal(file.path, join('foo', 'bar', 'baz.qux'))
    st.equal(file.basename, 'baz.qux')
    st.equal(file.stem, 'baz')
    st.equal(file.extname, '.qux')
    st.equal(file.dirname, join('foo', 'bar'))
    st.equal(file.contents, undefined)
    st.end()
  })

  t.test('should accept a buffer as `.path`', function(st) {
    var file = vfile(Buffer.from('readme.md'))

    st.equal(file.path, 'readme.md')
    st.equal(file.contents, undefined)
    st.end()
  })

  t.test('should accept an object', function(st) {
    var file = vfile({
      dirname: join('foo', 'bar'),
      stem: 'baz',
      extname: '.qux'
    })

    st.equal(file.path, join('foo', 'bar', 'baz.qux'))
    st.equal(file.basename, 'baz.qux')
    st.equal(file.stem, 'baz')
    st.equal(file.extname, '.qux')
    st.equal(file.dirname, join('foo', 'bar'))
    st.equal(file.contents, undefined)
    st.end()
  })
})

test('toVFile.readSync', function(t) {
  t.test('should fail without path', function(st) {
    st.throws(function() {
      vfile.readSync()
    }, /path/i)

    st.end()
  })

  t.test('should work (buffer without encoding)', function(st) {
    var file = vfile.readSync('readme.md')

    st.equal(file.path, 'readme.md')
    st.ok(buffer(file.contents))
    st.equal(file.toString(), fixture)
    st.end()
  })

  t.test('should work (string with encoding)', function(st) {
    var file = vfile.readSync('readme.md', 'utf8')

    st.equal(file.path, 'readme.md')
    st.equal(typeof file.contents, 'string')
    st.equal(file.toString(), fixture)
    st.end()
  })

  t.throws(
    function() {
      vfile.readSync('missing.md')
    },
    /ENOENT/,
    'should throw on non-existing files'
  )

  t.test('should honor file.cwd when file.path is relative', function(st) {
    var cwd = path.join(process.cwd(), 'lib')
    var file = vfile.readSync({path: 'core.js', cwd: cwd}, 'utf8')

    st.equal(typeof file.contents, 'string')

    st.end()
  })

  t.test(
    'should honor file.cwd when file.path is relative, even with relative cwd',
    function(st) {
      var file = vfile.readSync({path: 'core.js', cwd: 'lib'}, 'utf8')

      st.equal(typeof file.contents, 'string')

      st.end()
    }
  )

  t.throws(
    function() {
      vfile.readSync({
        path: path.join(process.cwd(), 'core.js'),
        cwd: path.join(process.cwd(), 'lib')
      })
    },
    /ENOENT/,
    'should ignore file.cwd when file.path is absolute'
  )
})

test('toVFile.read', function(t) {
  t.test('should pass an error without path', function(st) {
    st.plan(1)

    vfile.read(null, function(error) {
      st.ok(/path/i.test(error))
    })
  })

  t.test('should work (buffer without encoding)', function(st) {
    st.plan(4)

    vfile.read('readme.md', function(error, file) {
      st.ifErr(error)
      st.equal(file.path, 'readme.md')
      st.ok(buffer(file.contents))
      st.equal(file.toString(), fixture)
    })
  })

  t.test('should work in promise mode (buffer without encoding)', function(st) {
    st.plan(3)

    vfile
      .read('readme.md')
      .then(function(file) {
        st.equal(file.path, 'readme.md')
        st.ok(buffer(file.contents))
        st.equal(file.toString(), fixture)
      })
      .catch(function() {
        st.fail('should resolve, not reject')
      })
  })

  t.test('should work (string with encoding)', function(st) {
    st.plan(4)

    vfile.read('readme.md', 'utf8', function(error, file) {
      st.ifErr(error)
      st.equal(file.path, 'readme.md')
      st.equal(typeof file.contents, 'string')
      st.equal(file.toString(), fixture)
    })
  })

  t.test('should work in promise mode (string with encoding)', function(st) {
    st.plan(3)

    vfile
      .read('readme.md', 'utf8')
      .then(function(file) {
        st.equal(file.path, 'readme.md')
        st.equal(typeof file.contents, 'string')
        st.equal(file.toString(), fixture)
      })
      .catch(function() {
        st.fail('should resolve, not reject')
      })
  })

  t.test('should return an error on non-existing files', function(st) {
    st.plan(3)

    vfile.read('missing.md', 'utf8', function(error, file) {
      st.equal(file, undefined)
      st.ok(error instanceof Error)
      st.ok(/ENOENT/.test(error.message))
    })
  })

  t.test('should reject on non-existing files in promise mode', function(st) {
    st.plan(2)

    vfile
      .read('missing.md')
      .then(function() {
        st.fail('should reject, not resolve')
      })
      .catch(function(error) {
        st.ok(error instanceof Error)
        st.ok(/ENOENT/.test(error.message))
      })
  })
})

test('toVFile.writeSync', function(t) {
  var filePath = 'fixture.txt'
  var invalidFilePath = join('invalid', 'path', 'to', 'fixture.txt')

  t.test('should fail without path', function(st) {
    st.throws(function() {
      vfile.writeSync()
    }, /path/i)

    st.end()
  })

  t.test('should work (buffer without encoding)', function(st) {
    st.equal(
      vfile.writeSync({path: filePath, contents: Buffer.from('föo')}),
      undefined
    )

    st.equal(fs.readFileSync(filePath, 'utf8'), 'föo')

    st.end()
  })

  t.test('should work (string)', function(st) {
    st.equal(vfile.writeSync({path: filePath, contents: 'bär'}), undefined)

    st.equal(fs.readFileSync(filePath, 'utf8'), 'bär')

    st.end()
  })

  t.test('should work (null)', function(st) {
    st.equal(vfile.writeSync(filePath), undefined)

    st.equal(fs.readFileSync(filePath, 'utf8'), '')

    fs.unlinkSync(filePath)

    st.end()
  })

  t.throws(
    function() {
      vfile.writeSync(invalidFilePath)
    },
    /ENOENT/,
    'should throw on files that cannot be written'
  )
})

test('toVFile.write', function(t) {
  var filePath = 'fixture.txt'
  var invalidFilePath = join('invalid', 'path', 'to', 'fixture.txt')

  t.test('should pass an error without path', function(st) {
    st.plan(1)

    vfile.write(null, function(error) {
      st.ok(/path/i.test(error))
    })
  })

  t.test('should work (buffer without encoding)', function(st) {
    var file = {path: filePath, contents: Buffer.from('bäz')}

    st.plan(3)

    vfile.write(file, function(error, result) {
      st.ifErr(error)
      st.equal(result, undefined)
      st.equal(fs.readFileSync(filePath, 'utf8'), 'bäz')
    })
  })

  t.test('should work (string)', function(st) {
    var file = {path: filePath, contents: 'qüx'}

    st.plan(3)

    vfile.write(file, function(error, result) {
      st.ifErr(error)
      st.equal(result, undefined)
      st.equal(fs.readFileSync(filePath, 'utf8'), 'qüx')
    })
  })

  t.test('should work in promise mode (string)', function(st) {
    st.plan(2)

    vfile
      .write({path: filePath, contents: 'qüx-promise'})
      .then(function(result) {
        st.equal(result, undefined)
        st.equal(fs.readFileSync(filePath, 'utf8'), 'qüx-promise')
      })
      .catch(function() {
        st.fail('should resolve, not reject')
      })
  })

  t.test('should work (string with encoding)', function(st) {
    var file = {path: filePath, contents: '62c3a472'}

    st.plan(3)

    vfile.write(file, 'hex', function(error, result) {
      st.ifErr(error)
      st.equal(result, undefined)
      st.equal(fs.readFileSync(filePath, 'utf8'), 'bär')
    })
  })

  t.test('should work in promise mode (string with encoding)', function(st) {
    st.plan(3)

    vfile
      .write({path: filePath, contents: '62c3a4722d70726f6d697365'}, 'hex')
      .then(function(error, result) {
        st.ifErr(error)
        st.equal(result, undefined)
        st.equal(fs.readFileSync(filePath, 'utf8'), 'bär-promise')
      })
      .catch(function() {
        st.fail('should resolve, not reject')
      })
  })

  t.test('should work (null)', function(st) {
    st.plan(3)

    vfile.write(filePath, function(error, result) {
      var doc = fs.readFileSync(filePath, 'utf8')

      fs.unlinkSync(filePath)

      st.ifErr(error)
      st.equal(result, undefined)
      st.equal(doc, '')
    })
  })

  t.test('should work in promise mode (null)', function(st) {
    st.plan(2)

    vfile
      .write(filePath)
      .then(function(result) {
        var doc = fs.readFileSync(filePath, 'utf8')

        fs.unlinkSync(filePath)

        st.equal(result, undefined)
        st.equal(doc, '')
      })
      .catch(function() {
        st.fail('should resolve, not reject')
      })
  })

  t.test('should pass an error for files that cannot be written', function(st) {
    st.plan(1)

    vfile.write(invalidFilePath, function(error) {
      st.ok(/ENOENT/.test(error.message))
    })
  })

  t.test(
    'should reject for files that cannot be written in promise mode',
    function(st) {
      st.plan(1)

      vfile
        .write(invalidFilePath)
        .then(function() {
          st.fail('should reject, not resolve')
        })
        .catch(function(error) {
          st.ok(/ENOENT/.test(error.message))
        })
    }
  )
})

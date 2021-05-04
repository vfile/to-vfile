import fs from 'fs'
import path from 'path'
import test from 'tape'
import buffer from 'is-buffer'
import {toVFile} from './index.js'

var join = path.join

var fixture = fs.readFileSync('readme.md', 'utf8')

test('toVFile()', function (t) {
  t.test('should accept a string as `.path`', function (st) {
    var file = toVFile(join('foo', 'bar', 'baz.qux'))

    st.equal(file.path, join('foo', 'bar', 'baz.qux'))
    st.equal(file.basename, 'baz.qux')
    st.equal(file.stem, 'baz')
    st.equal(file.extname, '.qux')
    st.equal(file.dirname, join('foo', 'bar'))
    st.equal(file.value, undefined)
    st.end()
  })

  t.test('should accept a buffer as `.path`', function (st) {
    var file = toVFile(Buffer.from('readme.md'))

    st.equal(file.path, 'readme.md')
    st.equal(file.value, undefined)
    st.end()
  })

  t.test('should accept an object', function (st) {
    var file = toVFile({
      dirname: join('foo', 'bar'),
      stem: 'baz',
      extname: '.qux'
    })

    st.equal(file.path, join('foo', 'bar', 'baz.qux'))
    st.equal(file.basename, 'baz.qux')
    st.equal(file.stem, 'baz')
    st.equal(file.extname, '.qux')
    st.equal(file.dirname, join('foo', 'bar'))
    st.equal(file.value, undefined)
    st.end()
  })

  t.test('should accept a vfile', function (st) {
    var first = toVFile()
    var second = toVFile(first)

    st.equal(first, second)
    st.end()
  })
})

test('toVFile.readSync', function (t) {
  t.test('should fail without path', function (st) {
    st.throws(function () {
      // @ts-ignore runtime.
      toVFile.readSync()
    }, /path/i)

    st.end()
  })

  t.test('should work (buffer without encoding)', function (st) {
    var file = toVFile.readSync('readme.md')

    st.equal(file.path, 'readme.md')
    st.ok(buffer(file.value))
    st.equal(file.toString(), fixture)
    st.end()
  })

  t.test('should work (string with encoding)', function (st) {
    var file = toVFile.readSync('readme.md', 'utf8')

    st.equal(file.path, 'readme.md')
    st.equal(typeof file.value, 'string')
    st.equal(file.toString(), fixture)
    st.end()
  })

  t.throws(
    function () {
      toVFile.readSync('missing.md')
    },
    /ENOENT/,
    'should throw on non-existing files'
  )

  t.test('should honor file.cwd when file.path is relative', function (st) {
    var cwd = path.join(process.cwd(), 'lib')
    var file = toVFile.readSync({path: 'index.js', cwd}, 'utf8')

    st.equal(typeof file.value, 'string')

    st.end()
  })

  t.test(
    'should honor file.cwd when file.path is relative, even with relative cwd',
    function (st) {
      var file = toVFile.readSync({path: 'index.js', cwd: 'lib'}, 'utf8')

      st.equal(typeof file.value, 'string')

      st.end()
    }
  )

  t.throws(
    function () {
      toVFile.readSync({
        path: path.join(process.cwd(), 'core.js'),
        cwd: path.join(process.cwd(), 'lib')
      })
    },
    /ENOENT/,
    'should ignore file.cwd when file.path is absolute'
  )
})

test('toVFile.read', function (t) {
  t.test('should pass an error without path', function (st) {
    st.plan(1)

    toVFile.read(null, function (error) {
      st.ok(/path/i.test(String(error)))
    })
  })

  t.test('should work (buffer without encoding)', function (st) {
    st.plan(4)

    toVFile.read('readme.md', function (error, file) {
      st.ifErr(error)
      st.equal(file.path, 'readme.md')
      st.ok(buffer(file.value))
      st.equal(file.toString(), fixture)
    })
  })

  t.test(
    'should work in promise mode (buffer without encoding)',
    function (st) {
      st.plan(3)

      toVFile
        .read('readme.md')
        .then(function (result) {
          st.equal(result.path, 'readme.md')
          st.ok(buffer(result.value))
          st.equal(result.toString(), fixture)
        })
        .catch(function () {
          st.fail('should resolve, not reject')
        })
    }
  )

  t.test('should work (string with encoding)', function (st) {
    st.plan(4)

    toVFile.read('readme.md', 'utf8', function (error, file) {
      st.ifErr(error)
      st.equal(file.path, 'readme.md')
      st.equal(typeof file.value, 'string')
      st.equal(file.toString(), fixture)
    })
  })

  t.test('should work in promise mode (string with encoding)', function (st) {
    st.plan(3)

    toVFile
      .read('readme.md', 'utf8')
      .then(function (result) {
        st.equal(result.path, 'readme.md')
        st.equal(typeof result.value, 'string')
        st.equal(result.toString(), fixture)
      })
      .catch(function () {
        st.fail('should resolve, not reject')
      })
  })

  t.test('should return an error on non-existing files', function (st) {
    st.plan(3)

    toVFile.read('missing.md', 'utf8', function (error, file) {
      st.equal(file, undefined)
      st.ok(error instanceof Error)
      st.ok(/ENOENT/.test(error.message))
    })
  })

  t.test('should reject on non-existing files in promise mode', function (st) {
    st.plan(2)

    toVFile
      .read('missing.md')
      .then(function () {
        st.fail('should reject, not resolve')
      })
      .catch(function (/** @type {Error} */ error) {
        st.ok(error instanceof Error)
        st.ok(/ENOENT/.test(error.message))
      })
  })
})

test('toVFile.writeSync', function (t) {
  var filePath = 'fixture.txt'
  var invalidFilePath = join('invalid', 'path', 'to', 'fixture.txt')

  t.test('should fail without path', function (st) {
    st.throws(function () {
      // @ts-ignore runtime.
      toVFile.writeSync()
    }, /path/i)

    st.end()
  })

  t.test('should work (buffer without encoding)', function (st) {
    var result = toVFile.writeSync({path: filePath, value: Buffer.from('föo')})

    st.equal(result.path, filePath)
    st.equal(String(result), 'föo')
    st.equal(fs.readFileSync(filePath, 'utf8'), 'föo')

    st.end()
  })

  t.test('should work (string)', function (st) {
    var result = toVFile.writeSync({path: filePath, value: 'bär'})

    st.equal(result.path, filePath)
    st.equal(String(result), 'bär')
    st.equal(fs.readFileSync(filePath, 'utf8'), 'bär')

    st.end()
  })

  t.test('should work (null)', function (st) {
    var result = toVFile.writeSync(filePath)

    st.equal(result.path, filePath)
    st.equal(String(result), '')
    st.equal(fs.readFileSync(filePath, 'utf8'), '')

    fs.unlinkSync(filePath)

    st.end()
  })

  t.throws(
    function () {
      toVFile.writeSync(invalidFilePath)
    },
    /ENOENT/,
    'should throw on files that cannot be written'
  )
})

test('toVFile.write', function (t) {
  var filePath = 'fixture.txt'
  var invalidFilePath = join('invalid', 'path', 'to', 'fixture.txt')

  t.test('should pass an error without path', function (st) {
    st.plan(1)

    toVFile.write(null, function (error) {
      st.ok(/path/i.test(String(error)))
    })
  })

  t.test('should work (buffer without encoding)', function (st) {
    var file = {path: filePath, value: Buffer.from('bäz')}

    st.plan(3)

    toVFile.write(file, function (error, result) {
      st.ifErr(error)
      st.equal(result.path, filePath)
      st.equal(fs.readFileSync(filePath, 'utf8'), 'bäz')
    })
  })

  t.test('should work (string)', function (st) {
    var file = {path: filePath, value: 'qüx'}

    st.plan(3)

    toVFile.write(file, function (error, result) {
      st.ifErr(error)
      st.equal(result.path, filePath)
      st.equal(fs.readFileSync(filePath, 'utf8'), 'qüx')
    })
  })

  t.test('should work in promise mode (string)', function (st) {
    st.plan(2)

    toVFile
      .write({path: filePath, value: 'qüx-promise'})
      .then(function (result) {
        st.equal(result.path, filePath)
        st.equal(fs.readFileSync(filePath, 'utf8'), 'qüx-promise')
      })
      .catch(function () {
        st.fail('should resolve, not reject')
      })
  })

  t.test('should work (string with encoding)', function (st) {
    var file = {path: filePath, value: '62c3a472'}

    st.plan(3)

    toVFile.write(file, 'hex', function (error, result) {
      st.ifErr(error)
      st.equal(result.path, filePath)
      st.equal(fs.readFileSync(filePath, 'utf8'), 'bär')
    })
  })

  t.test('should work in promise mode (string with encoding)', function (st) {
    st.plan(2)

    toVFile
      .write({path: filePath, value: '62c3a4722d70726f6d697365'}, 'hex')
      .then(function (result) {
        st.equal(result.path, filePath)
        st.equal(fs.readFileSync(filePath, 'utf8'), 'bär-promise')
      })
      .catch(function () {
        st.fail('should resolve, not reject')
      })
  })

  t.test('should work (null)', function (st) {
    st.plan(3)

    toVFile.write(filePath, function (error, result) {
      var doc = fs.readFileSync(filePath, 'utf8')

      fs.unlinkSync(filePath)

      st.ifErr(error)
      st.equal(result.path, filePath)
      st.equal(doc, '')
    })
  })

  t.test('should work in promise mode (null)', function (st) {
    st.plan(2)

    toVFile
      .write(filePath)
      .then(function (result) {
        var doc = fs.readFileSync(filePath, 'utf8')

        fs.unlinkSync(filePath)

        st.equal(result.path, filePath)
        st.equal(doc, '')
      })
      .catch(function () {
        st.fail('should resolve, not reject')
      })
  })

  t.test(
    'should pass an error for files that cannot be written',
    function (st) {
      st.plan(1)

      toVFile.write(invalidFilePath, function (error) {
        st.ok(/ENOENT/.test(error.message))
      })
    }
  )

  t.test(
    'should reject for files that cannot be written in promise mode',
    function (st) {
      st.plan(1)

      toVFile
        .write(invalidFilePath)
        .then(function () {
          st.fail('should reject, not resolve')
        })
        .catch(function (/** @type {Error} */ error) {
          st.ok(/ENOENT/.test(error.message))
        })
    }
  )
})

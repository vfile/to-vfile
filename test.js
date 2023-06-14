import assert from 'node:assert/strict'
import {Buffer} from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import test from 'node:test'
import buffer from 'is-buffer'
import {toVFile, read, readSync, write, writeSync} from 'to-vfile'

const join = path.join

const fixture = fs.readFileSync('readme.md', 'utf8')

test('toVFile', async function (t) {
  assert.deepEqual(
    Object.keys(await import('to-vfile')).sort(),
    ['read', 'readSync', 'toVFile', 'write', 'writeSync'],
    'should expose the public api'
  )

  await t.test('should accept a string as `.path`', function () {
    const file = toVFile(join('foo', 'bar', 'baz.qux'))

    assert.equal(file.path, join('foo', 'bar', 'baz.qux'))
    assert.equal(file.basename, 'baz.qux')
    assert.equal(file.stem, 'baz')
    assert.equal(file.extname, '.qux')
    assert.equal(file.dirname, join('foo', 'bar'))
    assert.equal(file.value, undefined)
  })

  await t.test('should accept a buffer as `.path`', function () {
    const file = toVFile(Buffer.from('readme.md'))

    assert.equal(file.path, 'readme.md')
    assert.equal(file.value, undefined)
  })

  await t.test('should accept a uint array as `.path`', function () {
    const file = toVFile(new Uint8Array([0x61, 0x62, 0x63, 0x2e, 0x6d, 0x64]))

    assert.equal(file.path, 'abc.md')
  })

  await t.test('should accept an object', function () {
    const file = toVFile({
      dirname: join('foo', 'bar'),
      stem: 'baz',
      extname: '.qux'
    })

    assert.equal(file.path, join('foo', 'bar', 'baz.qux'))
    assert.equal(file.basename, 'baz.qux')
    assert.equal(file.stem, 'baz')
    assert.equal(file.extname, '.qux')
    assert.equal(file.dirname, join('foo', 'bar'))
    assert.equal(file.value, undefined)
  })

  await t.test('should accept a vfile', function () {
    const first = toVFile()
    const second = toVFile(first)

    assert.equal(first, second)
  })

  await t.test('should accept a WHATWG URL object', function () {
    const dir = fileURLToPath(new URL('./', import.meta.url))
    const file = toVFile(new URL('baz.qux', import.meta.url))

    assert.equal(file.path, join(dir, 'baz.qux'))
    assert.equal(file.basename, 'baz.qux')
    assert.equal(file.stem, 'baz')
    assert.equal(file.extname, '.qux')
    assert.equal(file.dirname, dir.replace(/[/\\]$/, ''))
    assert.equal(file.value, undefined)
  })
})

test('readSync', async function (t) {
  await t.test('should fail without path', function () {
    assert.throws(function () {
      // @ts-expect-error check that a runtime error is thrown.
      readSync()
    }, /path/i)
  })

  await t.test('should work (buffer without encoding)', function () {
    const file = readSync('readme.md')

    assert.equal(file.path, 'readme.md')
    assert.ok(buffer(file.value))
    assert.equal(file.toString(), fixture)
  })

  await t.test('should work (string with encoding)', function () {
    const file = readSync('readme.md', 'utf8')

    assert.equal(file.path, 'readme.md')
    assert.equal(typeof file.value, 'string')
    assert.equal(file.toString(), fixture)
  })

  assert.throws(
    function () {
      readSync('missing.md')
    },
    /ENOENT/,
    'should throw on non-existing files'
  )

  await t.test('should honor file.cwd when file.path is relative', function () {
    const cwd = path.join(process.cwd(), 'lib')
    const file = readSync({path: 'index.js', cwd}, 'utf8')

    assert.equal(typeof file.value, 'string')
  })

  await t.test(
    'should honor file.cwd when file.path is relative, even with relative cwd',
    function () {
      const file = readSync({path: 'index.js', cwd: 'lib'}, 'utf8')

      assert.equal(typeof file.value, 'string')
    }
  )

  assert.throws(
    function () {
      readSync({
        path: path.join(process.cwd(), 'core.js'),
        cwd: path.join(process.cwd(), 'lib')
      })
    },
    /ENOENT/,
    'should ignore file.cwd when file.path is absolute'
  )
})

test('read', async function (t) {
  await t.test('should pass an error without path', async function () {
    await new Promise(function (ok) {
      // @ts-expect-error: check that a runtime error is thrown.
      read(undefined, function (error) {
        assert.ok(/path/i.test(String(error)))
        ok(undefined)
      })
    })
  })

  await t.test('should work (buffer without encoding)', async function () {
    await new Promise(function (ok) {
      read('readme.md', function (error, file) {
        assert.ifError(error)
        assert(file, 'expected file')
        assert.equal(file.path, 'readme.md')
        assert.ok(buffer(file.value))
        assert.equal(file.toString(), fixture)
        ok(undefined)
      })
    })
  })

  await t.test(
    'should work in promise mode (buffer without encoding)',
    async function () {
      const result = await read('readme.md')
      assert.equal(result.path, 'readme.md')
      assert.ok(buffer(result.value))
      assert.equal(result.toString(), fixture)
    }
  )

  await t.test('should work (string with encoding)', async function () {
    await new Promise(function (ok) {
      read('readme.md', 'utf8', function (error, file) {
        assert.ifError(error)
        assert(file, 'expected file')
        assert.equal(file.path, 'readme.md')
        assert.equal(typeof file.value, 'string')
        assert.equal(file.toString(), fixture)
        ok(undefined)
      })
    })
  })

  await t.test(
    'should work in promise mode (string with encoding)',
    async function () {
      const result = await read('readme.md', 'utf8')

      assert.equal(result.path, 'readme.md')
      assert.equal(typeof result.value, 'string')
      assert.equal(result.toString(), fixture)
    }
  )

  await t.test(
    'should return an error on non-existing files',
    async function () {
      await new Promise(function (ok) {
        read('missing.md', 'utf8', function (error, file) {
          assert(error, 'expected error')
          assert.equal(file, undefined)
          assert.ok(error instanceof Error)
          assert.ok(/ENOENT/.test(error.message))
          ok(undefined)
        })
      })
    }
  )

  await t.test(
    'should reject on non-existing files in promise mode',
    async function () {
      try {
        await read('missing.md')
        assert.fail('should reject, not resolve')
      } catch (error) {
        assert.ok(error instanceof Error)
        assert.ok(/ENOENT/.test(error.message))
      }
    }
  )
})

test('writeSync', async function (t) {
  const filePath = 'fixture.txt'
  const invalidFilePath = join('invalid', 'path', 'to', 'fixture.txt')

  await t.test('should fail without path', function () {
    assert.throws(function () {
      // @ts-expect-error check that a runtime error is thrown.
      writeSync()
    }, /path/i)
  })

  await t.test('should work (buffer without encoding)', function () {
    const result = writeSync({
      path: filePath,
      value: Buffer.from('föo')
    })

    assert.equal(result.path, filePath)
    assert.equal(String(result), 'föo')
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'föo')
  })

  await t.test('should work (string)', function () {
    const result = writeSync({path: filePath, value: 'bär'})

    assert.equal(result.path, filePath)
    assert.equal(String(result), 'bär')
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'bär')
  })

  await t.test('should work (undefined)', function () {
    const result = writeSync(filePath)

    assert.equal(result.path, filePath)
    assert.equal(String(result), '')
    assert.equal(fs.readFileSync(filePath, 'utf8'), '')

    fs.unlinkSync(filePath)
  })

  assert.throws(
    function () {
      writeSync(invalidFilePath)
    },
    /ENOENT/,
    'should throw on files that cannot be written'
  )
})

test('write', async function (t) {
  const filePath = 'fixture.txt'
  const invalidFilePath = join('invalid', 'path', 'to', 'fixture.txt')

  await t.test('should pass an error without path', async function () {
    await new Promise(function (ok) {
      // @ts-expect-error: check that a runtime error is thrown.
      write(undefined, function (error) {
        assert.ok(/path/i.test(String(error)))
        ok(undefined)
      })
    })
  })

  await t.test('should work (buffer without encoding)', async function () {
    const file = {path: filePath, value: Buffer.from('bäz')}

    await new Promise(function (ok) {
      write(file, function (error, result) {
        assert.ifError(error)
        assert(result, 'expected result')
        assert.equal(result.path, filePath)
        assert.equal(fs.readFileSync(filePath, 'utf8'), 'bäz')
        ok(undefined)
      })
    })
  })

  await t.test('should work (string)', async function () {
    const file = {path: filePath, value: 'qüx'}

    await new Promise(function (ok) {
      write(file, function (error, result) {
        assert.ifError(error)
        assert(result, 'expected result')
        assert.equal(result.path, filePath)
        assert.equal(fs.readFileSync(filePath, 'utf8'), 'qüx')
        ok(undefined)
      })
    })
  })

  await t.test('should work in promise mode (string)', async function () {
    const result = await write({path: filePath, value: 'qüx-promise'})
    assert.equal(result.path, filePath)
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'qüx-promise')
  })

  await t.test('should work (string with encoding)', async function () {
    const file = {path: filePath, value: '62c3a472'}

    await new Promise(function (ok) {
      write(file, 'hex', function (error, result) {
        assert.ifError(error)
        assert(result, 'expected result')
        assert.equal(result.path, filePath)
        assert.equal(fs.readFileSync(filePath, 'utf8'), 'bär')
        ok(undefined)
      })
    })
  })

  await t.test(
    'should work in promise mode (string with encoding)',
    async function () {
      const result = await write(
        {path: filePath, value: '62c3a4722d70726f6d697365'},
        'hex'
      )
      assert.equal(result.path, filePath)
      assert.equal(fs.readFileSync(filePath, 'utf8'), 'bär-promise')
    }
  )

  await t.test('should work (undefined)', async function () {
    await new Promise(function (ok) {
      write(filePath, function (error, result) {
        const doc = fs.readFileSync(filePath, 'utf8')

        fs.unlinkSync(filePath)

        assert(result, 'expected result')
        assert.ifError(error)
        assert.equal(result.path, filePath)
        assert.equal(doc, '')
        ok(undefined)
      })
    })
  })

  await t.test('should work in promise mode (undefined)', async function () {
    const result = await write(filePath)

    const doc = fs.readFileSync(filePath, 'utf8')

    fs.unlinkSync(filePath)

    assert.equal(result.path, filePath)
    assert.equal(doc, '')
  })

  await t.test(
    'should pass an error for files that cannot be written',
    async function () {
      await new Promise(function (ok) {
        write(invalidFilePath, function (error) {
          assert(error, 'expected error')
          assert.ok(/ENOENT/.test(error.message))
          ok(undefined)
        })
      })
    }
  )

  await t.test(
    'should reject for files that cannot be written in promise mode',
    async function () {
      try {
        await write(invalidFilePath)
        assert.fail('should reject, not resolve')
      } catch (error) {
        assert(error instanceof Error)
        assert.ok(/ENOENT/.test(error.message))
      }
    }
  )
})

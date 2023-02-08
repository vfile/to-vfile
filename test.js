import assert from 'node:assert/strict'
import {Buffer} from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath, URL} from 'node:url'
import test from 'tape'
import buffer from 'is-buffer'
import {toVFile, read, readSync, write, writeSync} from './index.js'

const join = path.join

const fixture = fs.readFileSync('readme.md', 'utf8')

test('toVFile()', (t) => {
  t.test('should accept a string as `.path`', (t) => {
    const file = toVFile(join('foo', 'bar', 'baz.qux'))

    t.equal(file.path, join('foo', 'bar', 'baz.qux'))
    t.equal(file.basename, 'baz.qux')
    t.equal(file.stem, 'baz')
    t.equal(file.extname, '.qux')
    t.equal(file.dirname, join('foo', 'bar'))
    t.equal(file.value, undefined)
    t.end()
  })

  t.test('should accept a buffer as `.path`', (t) => {
    const file = toVFile(Buffer.from('readme.md'))

    t.equal(file.path, 'readme.md')
    t.equal(file.value, undefined)
    t.end()
  })

  t.test('should accept an object', (t) => {
    const file = toVFile({
      dirname: join('foo', 'bar'),
      stem: 'baz',
      extname: '.qux'
    })

    t.equal(file.path, join('foo', 'bar', 'baz.qux'))
    t.equal(file.basename, 'baz.qux')
    t.equal(file.stem, 'baz')
    t.equal(file.extname, '.qux')
    t.equal(file.dirname, join('foo', 'bar'))
    t.equal(file.value, undefined)
    t.end()
  })

  t.test('should accept a vfile', (t) => {
    const first = toVFile()
    const second = toVFile(first)

    t.equal(first, second)
    t.end()
  })

  t.test('should accept a WHATWG URL object', (t) => {
    const dir = fileURLToPath(new URL('./', import.meta.url))
    const file = toVFile(new URL('baz.qux', import.meta.url))

    t.equal(file.path, join(dir, 'baz.qux'))
    t.equal(file.basename, 'baz.qux')
    t.equal(file.stem, 'baz')
    t.equal(file.extname, '.qux')
    t.equal(file.dirname, dir.replace(/[/\\]$/, ''))
    t.equal(file.value, undefined)
    t.end()
  })
})

test('toVFile.readSync', (t) => {
  t.equal(toVFile.readSync, readSync, 'should export as an identifier')

  t.test('should fail without path', (t) => {
    t.throws(() => {
      // @ts-expect-error runtime.
      toVFile.readSync()
    }, /path/i)

    t.end()
  })

  t.test('should work (buffer without encoding)', (t) => {
    const file = toVFile.readSync('readme.md')

    t.equal(file.path, 'readme.md')
    t.ok(buffer(file.value))
    t.equal(file.toString(), fixture)
    t.end()
  })

  t.test('should work (string with encoding)', (t) => {
    const file = toVFile.readSync('readme.md', 'utf8')

    t.equal(file.path, 'readme.md')
    t.equal(typeof file.value, 'string')
    t.equal(file.toString(), fixture)
    t.end()
  })

  t.throws(
    () => {
      toVFile.readSync('missing.md')
    },
    /ENOENT/,
    'should throw on non-existing files'
  )

  t.test('should honor file.cwd when file.path is relative', (t) => {
    const cwd = path.join(process.cwd(), 'lib')
    const file = toVFile.readSync({path: 'index.js', cwd}, 'utf8')

    t.equal(typeof file.value, 'string')

    t.end()
  })

  t.test(
    'should honor file.cwd when file.path is relative, even with relative cwd',
    (t) => {
      const file = toVFile.readSync({path: 'index.js', cwd: 'lib'}, 'utf8')

      t.equal(typeof file.value, 'string')

      t.end()
    }
  )

  t.throws(
    () => {
      toVFile.readSync({
        path: path.join(process.cwd(), 'core.js'),
        cwd: path.join(process.cwd(), 'lib')
      })
    },
    /ENOENT/,
    'should ignore file.cwd when file.path is absolute'
  )
})

test('toVFile.read', (t) => {
  t.equal(toVFile.read, read, 'should export as an identifier')

  t.test('should pass an error without path', (t) => {
    t.plan(1)

    // @ts-expect-error: not a path.
    toVFile.read(null, (error) => {
      t.ok(/path/i.test(String(error)))
    })
  })

  t.test('should work (buffer without encoding)', (t) => {
    t.plan(4)

    toVFile.read('readme.md', (error, file) => {
      t.ifErr(error)
      assert(file, 'expected file')
      t.equal(file.path, 'readme.md')
      t.ok(buffer(file.value))
      t.equal(file.toString(), fixture)
    })
  })

  t.test('should work in promise mode (buffer without encoding)', (t) => {
    t.plan(3)

    toVFile
      .read('readme.md')
      .then((result) => {
        t.equal(result.path, 'readme.md')
        t.ok(buffer(result.value))
        t.equal(result.toString(), fixture)
      })
      .catch(() => {
        t.fail('should resolve, not reject')
      })
  })

  t.test('should work (string with encoding)', (t) => {
    t.plan(4)

    toVFile.read('readme.md', 'utf8', (error, file) => {
      t.ifErr(error)
      assert(file, 'expected file')
      t.equal(file.path, 'readme.md')
      t.equal(typeof file.value, 'string')
      t.equal(file.toString(), fixture)
    })
  })

  t.test('should work in promise mode (string with encoding)', (t) => {
    t.plan(3)

    toVFile
      .read('readme.md', 'utf8')
      .then((result) => {
        t.equal(result.path, 'readme.md')
        t.equal(typeof result.value, 'string')
        t.equal(result.toString(), fixture)
      })
      .catch(() => {
        t.fail('should resolve, not reject')
      })
  })

  t.test('should return an error on non-existing files', (t) => {
    t.plan(3)

    toVFile.read('missing.md', 'utf8', (error, file) => {
      assert(error, 'expected error')
      t.equal(file, undefined)
      t.ok(error instanceof Error)
      t.ok(/ENOENT/.test(error.message))
    })
  })

  t.test('should reject on non-existing files in promise mode', (t) => {
    t.plan(2)

    toVFile
      .read('missing.md')
      .then(() => {
        t.fail('should reject, not resolve')
      })
      .catch((/** @type {Error} */ error) => {
        t.ok(error instanceof Error)
        t.ok(/ENOENT/.test(error.message))
      })
  })
})

test('toVFile.writeSync', (t) => {
  const filePath = 'fixture.txt'
  const invalidFilePath = join('invalid', 'path', 'to', 'fixture.txt')

  t.equal(toVFile.writeSync, writeSync, 'should export as an identifier')

  t.test('should fail without path', (t) => {
    t.throws(() => {
      // @ts-expect-error runtime.
      toVFile.writeSync()
    }, /path/i)

    t.end()
  })

  t.test('should work (buffer without encoding)', (t) => {
    const result = toVFile.writeSync({
      path: filePath,
      value: Buffer.from('föo')
    })

    t.equal(result.path, filePath)
    t.equal(String(result), 'föo')
    t.equal(fs.readFileSync(filePath, 'utf8'), 'föo')

    t.end()
  })

  t.test('should work (string)', (t) => {
    const result = toVFile.writeSync({path: filePath, value: 'bär'})

    t.equal(result.path, filePath)
    t.equal(String(result), 'bär')
    t.equal(fs.readFileSync(filePath, 'utf8'), 'bär')

    t.end()
  })

  t.test('should work (null)', (t) => {
    const result = toVFile.writeSync(filePath)

    t.equal(result.path, filePath)
    t.equal(String(result), '')
    t.equal(fs.readFileSync(filePath, 'utf8'), '')

    fs.unlinkSync(filePath)

    t.end()
  })

  t.throws(
    () => {
      toVFile.writeSync(invalidFilePath)
    },
    /ENOENT/,
    'should throw on files that cannot be written'
  )
})

test('toVFile.write', (t) => {
  const filePath = 'fixture.txt'
  const invalidFilePath = join('invalid', 'path', 'to', 'fixture.txt')

  t.equal(toVFile.write, write, 'should export as an identifier')

  t.test('should pass an error without path', (t) => {
    t.plan(1)

    // @ts-expect-error: missing path.
    toVFile.write(null, (error) => {
      t.ok(/path/i.test(String(error)))
    })
  })

  t.test('should work (buffer without encoding)', (t) => {
    const file = {path: filePath, value: Buffer.from('bäz')}

    t.plan(3)

    toVFile.write(file, (error, result) => {
      t.ifErr(error)
      assert(result, 'expected result')
      t.equal(result.path, filePath)
      t.equal(fs.readFileSync(filePath, 'utf8'), 'bäz')
    })
  })

  t.test('should work (string)', (t) => {
    const file = {path: filePath, value: 'qüx'}

    t.plan(3)

    toVFile.write(file, (error, result) => {
      t.ifErr(error)
      assert(result, 'expected result')
      t.equal(result.path, filePath)
      t.equal(fs.readFileSync(filePath, 'utf8'), 'qüx')
    })
  })

  t.test('should work in promise mode (string)', (t) => {
    t.plan(2)

    toVFile
      .write({path: filePath, value: 'qüx-promise'})
      .then((result) => {
        t.equal(result.path, filePath)
        t.equal(fs.readFileSync(filePath, 'utf8'), 'qüx-promise')
      })
      .catch(() => {
        t.fail('should resolve, not reject')
      })
  })

  t.test('should work (string with encoding)', (t) => {
    const file = {path: filePath, value: '62c3a472'}

    t.plan(3)

    toVFile.write(file, 'hex', (error, result) => {
      t.ifErr(error)
      assert(result, 'expected result')
      t.equal(result.path, filePath)
      t.equal(fs.readFileSync(filePath, 'utf8'), 'bär')
    })
  })

  t.test('should work in promise mode (string with encoding)', (t) => {
    t.plan(2)

    toVFile
      .write({path: filePath, value: '62c3a4722d70726f6d697365'}, 'hex')
      .then((result) => {
        t.equal(result.path, filePath)
        t.equal(fs.readFileSync(filePath, 'utf8'), 'bär-promise')
      })
      .catch(() => {
        t.fail('should resolve, not reject')
      })
  })

  t.test('should work (null)', (t) => {
    t.plan(3)

    toVFile.write(filePath, (error, result) => {
      const doc = fs.readFileSync(filePath, 'utf8')

      fs.unlinkSync(filePath)

      assert(result, 'expected result')
      t.ifErr(error)
      t.equal(result.path, filePath)
      t.equal(doc, '')
    })
  })

  t.test('should work in promise mode (null)', (t) => {
    t.plan(2)

    toVFile
      .write(filePath)
      .then((result) => {
        const doc = fs.readFileSync(filePath, 'utf8')

        fs.unlinkSync(filePath)

        t.equal(result.path, filePath)
        t.equal(doc, '')
      })
      .catch(() => {
        t.fail('should resolve, not reject')
      })
  })

  t.test('should pass an error for files that cannot be written', (t) => {
    t.plan(1)

    toVFile.write(invalidFilePath, (error) => {
      assert(error, 'expected error')
      t.ok(/ENOENT/.test(error.message))
    })
  })

  t.test(
    'should reject for files that cannot be written in promise mode',
    (t) => {
      t.plan(1)

      toVFile
        .write(invalidFilePath)
        .then(() => {
          t.fail('should reject, not resolve')
        })
        .catch((/** @type {Error} */ error) => {
          t.ok(/ENOENT/.test(error.message))
        })
    }
  )
})

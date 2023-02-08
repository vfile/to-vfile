import assert from 'node:assert/strict'
import {Buffer} from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath, URL} from 'node:url'
import test from 'node:test'
import buffer from 'is-buffer'
import {toVFile, read, readSync, write, writeSync} from './index.js'

const join = path.join

const fixture = fs.readFileSync('readme.md', 'utf8')

test('toVFile()', async (t) => {
  await t.test('should accept a string as `.path`', () => {
    const file = toVFile(join('foo', 'bar', 'baz.qux'))

    assert.equal(file.path, join('foo', 'bar', 'baz.qux'))
    assert.equal(file.basename, 'baz.qux')
    assert.equal(file.stem, 'baz')
    assert.equal(file.extname, '.qux')
    assert.equal(file.dirname, join('foo', 'bar'))
    assert.equal(file.value, undefined)
  })

  await t.test('should accept a buffer as `.path`', () => {
    const file = toVFile(Buffer.from('readme.md'))

    assert.equal(file.path, 'readme.md')
    assert.equal(file.value, undefined)
  })

  await t.test('should accept an object', () => {
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

  await t.test('should accept a vfile', () => {
    const first = toVFile()
    const second = toVFile(first)

    assert.equal(first, second)
  })

  await t.test('should accept a WHATWG URL object', () => {
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

test('toVFile.readSync', async (t) => {
  assert.equal(toVFile.readSync, readSync, 'should export as an identifier')

  await t.test('should fail without path', () => {
    assert.throws(() => {
      // @ts-expect-error runtime.
      toVFile.readSync()
    }, /path/i)
  })

  await t.test('should work (buffer without encoding)', () => {
    const file = toVFile.readSync('readme.md')

    assert.equal(file.path, 'readme.md')
    assert.ok(buffer(file.value))
    assert.equal(file.toString(), fixture)
  })

  await t.test('should work (string with encoding)', () => {
    const file = toVFile.readSync('readme.md', 'utf8')

    assert.equal(file.path, 'readme.md')
    assert.equal(typeof file.value, 'string')
    assert.equal(file.toString(), fixture)
  })

  assert.throws(
    () => {
      toVFile.readSync('missing.md')
    },
    /ENOENT/,
    'should throw on non-existing files'
  )

  await t.test('should honor file.cwd when file.path is relative', () => {
    const cwd = path.join(process.cwd(), 'lib')
    const file = toVFile.readSync({path: 'index.js', cwd}, 'utf8')

    assert.equal(typeof file.value, 'string')
  })

  await t.test(
    'should honor file.cwd when file.path is relative, even with relative cwd',
    () => {
      const file = toVFile.readSync({path: 'index.js', cwd: 'lib'}, 'utf8')

      assert.equal(typeof file.value, 'string')
    }
  )

  assert.throws(
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

test('toVFile.read', async (t) => {
  assert.equal(toVFile.read, read, 'should export as an identifier')

  await t.test('should pass an error without path', async () => {
    await new Promise((ok) => {
      // @ts-expect-error: not a path.
      toVFile.read(null, (error) => {
        assert.ok(/path/i.test(String(error)))
        ok(undefined)
      })
    })
  })

  await t.test('should work (buffer without encoding)', async () => {
    await new Promise((ok) => {
      toVFile.read('readme.md', (error, file) => {
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
    async () => {
      const result = await toVFile.read('readme.md')
      assert.equal(result.path, 'readme.md')
      assert.ok(buffer(result.value))
      assert.equal(result.toString(), fixture)
    }
  )

  await t.test('should work (string with encoding)', async () => {
    await new Promise((ok) => {
      toVFile.read('readme.md', 'utf8', (error, file) => {
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
    async () => {
      const result = await toVFile.read('readme.md', 'utf8')

      assert.equal(result.path, 'readme.md')
      assert.equal(typeof result.value, 'string')
      assert.equal(result.toString(), fixture)
    }
  )

  await t.test('should return an error on non-existing files', async () => {
    await new Promise((ok) => {
      toVFile.read('missing.md', 'utf8', (error, file) => {
        assert(error, 'expected error')
        assert.equal(file, undefined)
        assert.ok(error instanceof Error)
        assert.ok(/ENOENT/.test(error.message))
        ok(undefined)
      })
    })
  })

  await t.test(
    'should reject on non-existing files in promise mode',
    async () => {
      try {
        await toVFile.read('missing.md')
        assert.fail('should reject, not resolve')
      } catch (error) {
        assert.ok(error instanceof Error)
        assert.ok(/ENOENT/.test(error.message))
      }
    }
  )
})

test('toVFile.writeSync', async (t) => {
  const filePath = 'fixture.txt'
  const invalidFilePath = join('invalid', 'path', 'to', 'fixture.txt')

  assert.equal(toVFile.writeSync, writeSync, 'should export as an identifier')

  await t.test('should fail without path', () => {
    assert.throws(() => {
      // @ts-expect-error runtime.
      toVFile.writeSync()
    }, /path/i)
  })

  await t.test('should work (buffer without encoding)', () => {
    const result = toVFile.writeSync({
      path: filePath,
      value: Buffer.from('föo')
    })

    assert.equal(result.path, filePath)
    assert.equal(String(result), 'föo')
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'föo')
  })

  await t.test('should work (string)', () => {
    const result = toVFile.writeSync({path: filePath, value: 'bär'})

    assert.equal(result.path, filePath)
    assert.equal(String(result), 'bär')
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'bär')
  })

  await t.test('should work (null)', () => {
    const result = toVFile.writeSync(filePath)

    assert.equal(result.path, filePath)
    assert.equal(String(result), '')
    assert.equal(fs.readFileSync(filePath, 'utf8'), '')

    fs.unlinkSync(filePath)
  })

  assert.throws(
    () => {
      toVFile.writeSync(invalidFilePath)
    },
    /ENOENT/,
    'should throw on files that cannot be written'
  )
})

test('toVFile.write', async (t) => {
  const filePath = 'fixture.txt'
  const invalidFilePath = join('invalid', 'path', 'to', 'fixture.txt')

  assert.equal(toVFile.write, write, 'should export as an identifier')

  await t.test('should pass an error without path', async () => {
    await new Promise((ok) => {
      // @ts-expect-error: missing path.
      toVFile.write(null, (error) => {
        assert.ok(/path/i.test(String(error)))
        ok(undefined)
      })
    })
  })

  await t.test('should work (buffer without encoding)', async () => {
    const file = {path: filePath, value: Buffer.from('bäz')}

    await new Promise((ok) => {
      toVFile.write(file, (error, result) => {
        assert.ifError(error)
        assert(result, 'expected result')
        assert.equal(result.path, filePath)
        assert.equal(fs.readFileSync(filePath, 'utf8'), 'bäz')
        ok(undefined)
      })
    })
  })

  await t.test('should work (string)', async () => {
    const file = {path: filePath, value: 'qüx'}

    await new Promise((ok) => {
      toVFile.write(file, (error, result) => {
        assert.ifError(error)
        assert(result, 'expected result')
        assert.equal(result.path, filePath)
        assert.equal(fs.readFileSync(filePath, 'utf8'), 'qüx')
        ok(undefined)
      })
    })
  })

  await t.test('should work in promise mode (string)', async () => {
    const result = await toVFile.write({path: filePath, value: 'qüx-promise'})
    assert.equal(result.path, filePath)
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'qüx-promise')
  })

  await t.test('should work (string with encoding)', async () => {
    const file = {path: filePath, value: '62c3a472'}

    await new Promise((ok) => {
      toVFile.write(file, 'hex', (error, result) => {
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
    async () => {
      const result = await toVFile.write(
        {path: filePath, value: '62c3a4722d70726f6d697365'},
        'hex'
      )
      assert.equal(result.path, filePath)
      assert.equal(fs.readFileSync(filePath, 'utf8'), 'bär-promise')
    }
  )

  await t.test('should work (null)', async () => {
    await new Promise((ok) => {
      toVFile.write(filePath, (error, result) => {
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

  await t.test('should work in promise mode (null)', async () => {
    const result = await toVFile.write(filePath)

    const doc = fs.readFileSync(filePath, 'utf8')

    fs.unlinkSync(filePath)

    assert.equal(result.path, filePath)
    assert.equal(doc, '')
  })

  await t.test(
    'should pass an error for files that cannot be written',
    async () => {
      await new Promise((ok) => {
        toVFile.write(invalidFilePath, (error) => {
          assert(error, 'expected error')
          assert.ok(/ENOENT/.test(error.message))
          ok(undefined)
        })
      })
    }
  )

  await t.test(
    'should reject for files that cannot be written in promise mode',
    async () => {
      try {
        await toVFile.write(invalidFilePath)
        assert.fail('should reject, not resolve')
      } catch (error) {
        assert(error instanceof Error)
        assert.ok(/ENOENT/.test(error.message))
      }
    }
  )
})

# to-vfile

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[vfile][] utility to read and write to the file system.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`toVFile(options)`](#tovfileoptions)
    *   [`read(options[, encoding][, callback])`](#readoptions-encoding-callback)
    *   [`readSync(options[, encoding])`](#readsyncoptions-encoding)
    *   [`write(options[, fsOptions][, callback])`](#writeoptions-fsoptions-callback)
    *   [`writeSync(options[, fsOptions])`](#writesyncoptions-fsoptions)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This utility places file paths and the file system first.
Where `vfile` itself focusses on file values (the file contents), this instead
focuses on the file system, which is a common case when working with files.

## When should I use this?

Use this if you know there’s a file system and want to use it.
Use `vfile` if there might not be a file system.

## Install

This package is [ESM only][esm].
In Node.js (version 12.20+, 14.14+, 16.0+, or 18.0+), install with [npm][]:

```sh
npm install to-vfile
```

In Deno with [`esm.sh`][esmsh]:

```js
import {toVFile, read, readSync, write, writeSync} from 'https://esm.sh/to-vfile@7'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {toVFile, read, readSync, write, writeSync} from 'https://esm.sh/to-vfile@7?bundle'
</script>
```

## Use

```js
import {toVFile, read} from 'to-vfile'

console.log(toVFile('readme.md'))
console.log(toVFile(new URL('readme.md', import.meta.url)))
console.log(await read('.git/HEAD'))
console.log(await read('.git/HEAD', 'utf8'))
```

Yields:

```js
VFile {
  data: {},
  messages: [],
  history: [ 'readme.md' ],
  cwd: '/Users/tilde/Projects/oss/to-vfile'
}
VFile {
  data: {},
  messages: [],
  history: [ '/Users/tilde/Projects/oss/to-vfile/readme.md' ],
  cwd: '/Users/tilde/Projects/oss/to-vfile'
}
VFile {
  data: {},
  messages: [],
  history: [ '.git/HEAD' ],
  cwd: '/Users/tilde/Projects/oss/to-vfile',
  value: <Buffer 72 65 66 3a 20 72 65 66 73 2f 68 65 61 64 73 2f 6d 61 69 6e 0a>
}
VFile {
  data: {},
  messages: [],
  history: [ '.git/HEAD' ],
  cwd: '/Users/tilde/Projects/oss/to-vfile',
  value: 'ref: refs/heads/main\n'
}
```

## API

This package exports the identifiers `toVFile`, `read`, `readSync`, `write`,
and `writeSync`.
There is no default export.

### `toVFile(options)`

Create a virtual file.
Works like the [`VFile`][vfile] constructor, except when `options` is `string`
or `Buffer`, in which case it’s treated as `{path: options}` instead of
`{value: options}`, or when `options` is a `URL` object, in which case it’s
treated as `{path: fileURLToPath(options)}`.

### `read(options[, encoding][, callback])`

Creates a virtual file from options (`toVFile(options)`), reads the file from
the file system and populates `file.value` with the result.
If `encoding` is specified, it’s passed to `fs.readFile`.
If `callback` is given, calls it with either an error or the populated virtual
file.
If `callback` is not given, returns a [`Promise`][promise] that is rejected
with an error or resolved with the populated virtual file.

### `readSync(options[, encoding])`

Like `read` but synchronous.
Either throws an error or returns a populated virtual file.

### `write(options[, fsOptions][, callback])`

Creates a virtual file from `options` (`toVFile(options)`), writes the file to
the file system.
`fsOptions` are passed to `fs.writeFile`.
If `callback` is given, calls it with an error, if any.
If `callback` is not given, returns a [`Promise`][promise] that is rejected
with an error or resolved with the written virtual file.

### `writeSync(options[, fsOptions])`

Like `write` but synchronous.
Either throws an error or returns a populated virtual file.

## Types

This package is fully typed with [TypeScript][].
It exports the additional types `Compatible`, `Callback`, `BufferEncoding`,
`Mode`, `ReadOptions`, and `WriteOptions`.

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, 16.0+, and 18.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Contribute

See [`contributing.md`][contributing] in [`vfile/.github`][health] for ways to
get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/vfile/to-vfile/workflows/main/badge.svg

[build]: https://github.com/vfile/to-vfile/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/vfile/to-vfile.svg

[coverage]: https://codecov.io/github/vfile/to-vfile

[downloads-badge]: https://img.shields.io/npm/dm/to-vfile.svg

[downloads]: https://www.npmjs.com/package/to-vfile

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/vfile/vfile/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[contributing]: https://github.com/vfile/.github/blob/main/contributing.md

[support]: https://github.com/vfile/.github/blob/main/support.md

[health]: https://github.com/vfile/.github

[coc]: https://github.com/vfile/.github/blob/main/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[vfile]: https://github.com/vfile/vfile

[promise]: https://developer.mozilla.org/Web/JavaScript/Reference/Global_Objects/Promise

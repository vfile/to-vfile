/**
 * @typedef {import('vfile').VFileValue} Value
 * @typedef {import('vfile').VFileOptions} Options
 * @typedef {import('vfile').BufferEncoding} BufferEncoding
 *
 * @typedef {number|string} Mode
 * @typedef {BufferEncoding|{encoding?: null|BufferEncoding, flag?: string}} ReadOptions
 * @typedef {BufferEncoding|{encoding?: null|undefined|BufferEncoding, mode?: Mode | undefined, flag?: string | undefined}} WriteOptions
 *
 * @typedef {URL|Value} Path
 *   Path of the file.
 *   Note: `Value` is used here because it’s a smarter `Buffer`
 * @typedef {Path|Options|VFile} Compatible
 *   Things that can be passed to the function.
 */

/**
 * @callback Callback
 * @param {NodeJS.ErrnoException|null} error
 * @param {VFile | null | undefined} file
 */

import fs from 'fs'
import path from 'path'
import {URL} from 'url'
import buffer from 'is-buffer'
import {VFile} from 'vfile'

/**
 * Create a virtual file from a description.
 * If `options` is a string or a buffer, it’s used as the path.
 * If it’s a VFile itself, it’s returned instead.
 * In all other cases, the options are passed through to `vfile()`.
 *
 * @param {Compatible} [options]
 * @returns {VFile}
 */
export function toVFile(options) {
  if (typeof options === 'string' || options instanceof URL) {
    options = {path: options}
  } else if (buffer(options)) {
    options = {path: String(options)}
  }

  return looksLikeAVFile(options) ? options : new VFile(options)
}

/**
 * Create a virtual file and read it in, synchronously.
 *
 * @param {Compatible} description
 * @param {ReadOptions} [options]
 * @returns {VFile}
 */
export function readSync(description, options) {
  const file = toVFile(description)
  file.value = fs.readFileSync(path.resolve(file.cwd, file.path), options)
  return file
}

/**
 * Create a virtual file and write it in, synchronously.
 *
 * @param {Compatible} description
 * @param {WriteOptions} [options]
 * @returns {VFile}
 */
export function writeSync(description, options) {
  const file = toVFile(description)
  fs.writeFileSync(path.resolve(file.cwd, file.path), file.value || '', options)
  return file
}

export const read =
  /**
   * @type {{
   *   (description: Compatible, options: ReadOptions, callback: Callback): void
   *   (description: Compatible, callback: Callback): void
   *   (description: Compatible, options?: ReadOptions): Promise<VFile>
   * }}
   */
  (
    /**
     * Create a virtual file and read it in, asynchronously.
     *
     * @param {Compatible} description
     * @param {ReadOptions | null} [options]
     * @param {Callback} [callback]
     */
    function (description, options, callback) {
      const file = toVFile(description)

      if (!callback && typeof options === 'function') {
        callback = options
        options = null
      }

      if (!callback) {
        return new Promise(executor)
      }

      executor(resolve, callback)

      /**
       * @param {VFile} result
       */
      function resolve(result) {
        // @ts-expect-error: `callback` always defined.
        callback(null, result)
      }

      /**
       * @param {(error: VFile) => void} resolve
       * @param {(error: NodeJS.ErrnoException, file?: VFile | undefined) => void} reject
       */
      function executor(resolve, reject) {
        /** @type {string} */
        let fp

        try {
          fp = path.resolve(file.cwd, file.path)
        } catch (error) {
          const exception = /** @type {NodeJS.ErrnoException} */ (error)
          return reject(exception)
        }

        fs.readFile(fp, options, done)

        /**
         * @param {NodeJS.ErrnoException | null} error
         * @param {Value} result
         */
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
  )

export const write =
  /**
   * @type {{
   *   (description: Compatible, options: WriteOptions, callback: Callback): void
   *   (description: Compatible, callback: Callback): void
   *   (description: Compatible, options?: WriteOptions): Promise<VFile>
   * }}
   */
  (
    /**
     * Create a virtual file and write it in, asynchronously.
     *
     * @param {Compatible} description
     * @param {WriteOptions} [options]
     * @param {Callback} [callback]
     */
    function (description, options, callback) {
      const file = toVFile(description)

      // Weird, right? Otherwise `fs` doesn’t accept it.
      if (!callback && typeof options === 'function') {
        callback = options
        options = undefined
      }

      if (!callback) {
        return new Promise(executor)
      }

      executor(resolve, callback)

      /**
       * @param {VFile} result
       */
      function resolve(result) {
        // @ts-expect-error: `callback` always defined.
        callback(null, result)
      }

      /**
       * @param {(error: VFile) => void} resolve
       * @param {(error: NodeJS.ErrnoException, file: VFile | null) => void} reject
       */
      function executor(resolve, reject) {
        /** @type {string} */
        let fp

        try {
          fp = path.resolve(file.cwd, file.path)
        } catch (error) {
          const exception = /** @type {NodeJS.ErrnoException} */ (error)
          return reject(exception, null)
        }

        fs.writeFile(fp, file.value || '', options || null, done)

        /**
         * @param {NodeJS.ErrnoException | null} error
         */
        function done(error) {
          if (error) {
            reject(error, null)
          } else {
            resolve(file)
          }
        }
      }
    }
  )

/**
 * @param {Compatible | undefined} value
 * @returns {value is VFile}
 */
function looksLikeAVFile(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'message' in value &&
      'messages' in value
  )
}

toVFile.readSync = readSync
toVFile.writeSync = writeSync
toVFile.read = read
toVFile.write = write

import buffer from 'is-buffer'
import {VFile} from 'vfile'

// Create a virtual file from a description.  If `options` is a string or a
// buffer, it’s used as the path.  In all other cases, the options are passed
// through to `vfile()`.
export function toVFile(options) {
  if (typeof options === 'string' || buffer(options)) {
    options = {path: String(options)}
  }

  return options instanceof VFile ? options : new VFile(options)
}

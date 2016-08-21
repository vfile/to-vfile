/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module to-vfile
 * @fileoverview Test suite for `to-vfile`.
 */

'use strict';

/* Dependencies. */
var fs = require('fs');
var test = require('tape');
var buffer = require('is-buffer');
var string = require('x-is-string');
var toVFile = require('./');

/* Start of `readme.md`. */
var fixture = fs.readFileSync('readme.md', 'utf8');

/* Tests. */
test('toVFile()', function (t) {
  t.test('should accept a string as `.path`', function (st) {
    var file = toVFile('foo/bar/baz.qux');

    st.equal(file.path, 'foo/bar/baz.qux');
    st.equal(file.basename, 'baz.qux');
    st.equal(file.stem, 'baz');
    st.equal(file.extname, '.qux');
    st.equal(file.dirname, 'foo/bar');
    st.equal(file.contents, undefined);
    st.end();
  });

  t.test('should accept a buffer as `.path`', function (st) {
    var file = toVFile(new Buffer('readme.md'));

    st.equal(file.path, 'readme.md');
    st.equal(file.contents, undefined);
    st.end();
  });

  t.test('should accept an object', function (st) {
    var file = toVFile({
      dirname: 'foo/bar',
      stem: 'baz',
      extname: '.qux'
    });

    st.equal(file.path, 'foo/bar/baz.qux');
    st.equal(file.basename, 'baz.qux');
    st.equal(file.stem, 'baz');
    st.equal(file.extname, '.qux');
    st.equal(file.dirname, 'foo/bar');
    st.equal(file.contents, undefined);
    st.end();
  });

  t.end();
});

test('toVFile.readSync', function (t) {
  t.test('should work (buffer without encoding)', function (st) {
    var file = toVFile.readSync('readme.md');

    st.equal(file.path, 'readme.md');
    st.ok(buffer(file.contents));
    st.equal(file.toString(), fixture);
    st.end();
  });

  t.test('should work (string with encoding)', function (st) {
    var file = toVFile.readSync('readme.md', 'utf8');

    st.equal(file.path, 'readme.md');
    st.ok(string(file.contents));
    st.equal(file.toString(), fixture);
    st.end();
  });

  t.throws(
    function () {
      toVFile.readSync('missing.md');
    },
    /ENOENT/,
    'should throw on non-existing files'
  );

  t.end();
});

test('toVFile.read', function (t) {
  t.test('should work (buffer without encoding)', function (st) {
    st.plan(4);

    toVFile.read('readme.md', function (err, file) {
      st.ifErr(err);
      st.equal(file.path, 'readme.md');
      st.ok(buffer(file.contents));
      st.equal(file.toString(), fixture);
    });
  });

  t.test('should work (string with encoding)', function (st) {
    st.plan(4);

    toVFile.read('readme.md', 'utf8', function (err, file) {
      st.ifErr(err);
      st.equal(file.path, 'readme.md');
      st.ok(string(file.contents));
      st.equal(file.toString(), fixture);
    });
  });

  t.test('should pass an error on non-existing files', function (st) {
    st.plan(2);

    toVFile.read('missing.md', 'utf8', function (err, file) {
      st.equal(file, undefined);
      st.ok(/ENOENT/.test(err.message));
    });
  });

  t.end();
});

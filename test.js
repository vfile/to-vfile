'use strict';

var fs = require('fs');
var test = require('tape');
var buffer = require('is-buffer');
var string = require('x-is-string');
var vfile = require('./');

/* Start of `readme.md`. */
var fixture = fs.readFileSync('readme.md', 'utf8');

test('toVFile()', function (t) {
  t.test('should accept a string as `.path`', function (st) {
    var file = vfile('foo/bar/baz.qux');

    st.equal(file.path, 'foo/bar/baz.qux');
    st.equal(file.basename, 'baz.qux');
    st.equal(file.stem, 'baz');
    st.equal(file.extname, '.qux');
    st.equal(file.dirname, 'foo/bar');
    st.equal(file.contents, undefined);
    st.end();
  });

  t.test('should accept a buffer as `.path`', function (st) {
    var file = vfile(Buffer.from('readme.md'));

    st.equal(file.path, 'readme.md');
    st.equal(file.contents, undefined);
    st.end();
  });

  t.test('should accept an object', function (st) {
    var file = vfile({
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
    var file = vfile.readSync('readme.md');

    st.equal(file.path, 'readme.md');
    st.ok(buffer(file.contents));
    st.equal(file.toString(), fixture);
    st.end();
  });

  t.test('should work (string with encoding)', function (st) {
    var file = vfile.readSync('readme.md', 'utf8');

    st.equal(file.path, 'readme.md');
    st.ok(string(file.contents));
    st.equal(file.toString(), fixture);
    st.end();
  });

  t.throws(
    function () {
      vfile.readSync('missing.md');
    },
    /ENOENT/,
    'should throw on non-existing files'
  );

  t.end();
});

test('toVFile.read', function (t) {
  t.test('should work (buffer without encoding)', function (st) {
    st.plan(4);

    vfile.read('readme.md', function (err, file) {
      st.ifErr(err);
      st.equal(file.path, 'readme.md');
      st.ok(buffer(file.contents));
      st.equal(file.toString(), fixture);
    });
  });

  t.test('should work (string with encoding)', function (st) {
    st.plan(4);

    vfile.read('readme.md', 'utf8', function (err, file) {
      st.ifErr(err);
      st.equal(file.path, 'readme.md');
      st.ok(string(file.contents));
      st.equal(file.toString(), fixture);
    });
  });

  t.test('should pass an error on non-existing files', function (st) {
    st.plan(2);

    vfile.read('missing.md', 'utf8', function (err, file) {
      st.equal(file, undefined);
      st.ok(/ENOENT/.test(err.message));
    });
  });

  t.end();
});

test('toVFile.writeSync', function (t) {
  var filePath = 'fixture.txt';

  t.test('should work (buffer without encoding)', function (st) {
    st.equal(vfile.writeSync({
      path: filePath,
      contents: Buffer.from('föo')
    }), undefined);

    st.equal(fs.readFileSync(filePath, 'utf8'), 'föo');

    st.end();
  });

  t.test('should work (string)', function (st) {
    st.equal(vfile.writeSync({
      path: filePath,
      contents: 'bär'
    }), undefined);

    st.equal(fs.readFileSync(filePath, 'utf8'), 'bär');

    st.end();
  });

  t.test('should work (null)', function (st) {
    st.equal(vfile.writeSync(filePath), undefined);

    st.equal(fs.readFileSync(filePath, 'utf8'), '');

    fs.unlinkSync(filePath);

    st.end();
  });

  t.end();
});

test('toVFile.write', function (t) {
  var filePath = 'fixture.txt';

  t.plan(4);

  t.test('should work (buffer without encoding)', function (st) {
    st.plan(3);

    vfile.write({
      path: filePath,
      contents: Buffer.from('bäz')
    }, function (err, result) {
      st.ifErr(err);
      st.equals(result, undefined);
      st.equal(fs.readFileSync(filePath, 'utf8'), 'bäz');
    });
  });

  t.test('should work (string)', function (st) {
    st.plan(3);

    vfile.write({
      path: filePath,
      contents: 'qüx'
    }, function (err, result) {
      st.ifErr(err);
      st.equals(result, undefined);
      st.equal(fs.readFileSync(filePath, 'utf8'), 'qüx');
    });
  });

  t.test('should work (string with encoding)', function (st) {
    st.plan(3);

    vfile.write({
      path: filePath,
      contents: '62c3a472'
    }, 'hex', function (err, result) {
      st.ifErr(err);
      st.equals(result, undefined);
      st.equal(fs.readFileSync(filePath, 'utf8'), 'bär');
    });
  });

  t.test('should work (null)', function (st) {
    st.plan(3);

    vfile.write(filePath, function (err, result) {
      var doc = fs.readFileSync(filePath, 'utf8');

      fs.unlinkSync(filePath);

      st.ifErr(err);
      st.equals(result, undefined);
      st.equal(doc, '');
    });
  });
});

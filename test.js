'use strict';

/* eslint-env mocha */

/*
 * Dependencies.
 */

var assert = require('assert');
var toVFile = require('./');

/*
 * Methods.
 */

var equal = assert.strictEqual;

/*
 * Tests.
 */

describe('to-vfile', function () {
    it('should work', function () {
        var file = toVFile('index.js');

        equal(file.filePath(), 'index.js');
        equal(file.filename, 'index');
        equal(file.extension, 'js');
        equal(file.directory, '.');
        equal(file.contents, '');
    });

    it('should work on fake files', function () {
        var file = toVFile('foo/bar/baz.bax');

        equal(file.filePath(), 'foo/bar/baz.bax');
        equal(file.filename, 'baz');
        equal(file.extension, 'bax');
        equal(file.directory, 'foo/bar');
        equal(file.contents, '');
    });

    describe('#sync', function () {
        it('should work', function () {
            var file = toVFile.readSync('readme.md');
            var fixture = '# to-vfile';
            var result = file.toString().slice(0, fixture.length);

            equal(file.filePath(), 'readme.md');
            equal(file.filename, 'readme');
            equal(file.extension, 'md');
            equal(file.directory, '.');
            equal(result, fixture);
        });

        it('should throw on fake files', function () {
            assert.throws(function () {
                toVFile.readSync('foo/bar/baz.bax');
            }, /ENOENT/);
        });
    });

    describe('#async', function () {
        it('should work', function (done) {
            toVFile.read('readme.md', function (err, file) {
                var fixture;
                var result;

                assert.ifError(err);

                fixture = '# to-vfile';
                result = file.toString().slice(0, fixture.length);

                equal(file.filePath(), 'readme.md');
                equal(file.filename, 'readme');
                equal(file.extension, 'md');
                equal(file.directory, '.');
                equal(result, fixture);

                done();
            });
        });

        it('should pass an error for fake files', function (done) {
            toVFile.read('foo/bar/baz.bax', function (err) {
                assert(/ENOENT/.test(err));

                done();
            });
        });
    });
});

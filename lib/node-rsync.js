/*!
 * node-rsync
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var crypto = require('crypto')
  , fs = require('fs')
  , EventEmitter = require('events').EventEmitter;

exports.version = '0.0.1';

var RSync = function (root, chunkSize) {
    this.root = root;
    this.chunkSize = chunkSize;
    this.M = 1 << 16; // Multiplier for weak checksum
};

RSync.prototype = {
    //
    // Finds weak and strong checksum
    // weak - similar to adler32
    // strong - md5
    //
    processChunk: function (chunk) {
        var A = 0
          , B = 0
          , i = 0
          , weak
          , strong;

        for (; i < this.chunkSize; i++) {
            A += chunk[i];
            B += A;
        }

        weak = (A + this.M * B).toString(16);

        strong = crypto.createHash('md5').update(chunk).digest('hex');
        
        return {
            chunk: chunk.toString()
          , weak: weak
          , strong: strong
        };
    },
    process: function (path, callback) {
        var self = this
          , path = this.root + path
          , result = []
          , index = 0;
        
        var t1, t2;

        t1 = Date.now();

        input.on('data', function (chunk) {
            var out = self.processChunk(chunk);
            out.index = index;
            result.push(out);
            index++;
        });

        input.on('end', function (chunk) {
            t2 = Date.now();
            result.unshift(t2 - t1);
            callback(result);
        });
    },
};
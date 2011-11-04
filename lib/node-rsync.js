/*!
 * node-rsync
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var crypto = require('crypto')
  , fs = require('fs');

var RSync = function (root, chunkSize) {
    this.root = root;
    this.chunkSize = chunkSize;
};

RSync.prototype = {
    //
    // Finds weak and strong checksum for file
    // weak - similar to adler32
    // strong - md5
    //
    // Calls back with array of checksum objects:
    // [{ weak: '59a9bf4d', strong: 'fe86160cf6...' }, { ... }]
    //
    checksum: function (path, callback) {
        var self = this
          , path = this.root + path
          , results = [];

        fs.readFile(path, function (err, data) {
            if (err) { return callback(err); }
            
            var length = data.length
              , incr = this.chunkSize
              , start = 0
              , end = incr > length ? length : incr;
            
            while (start < length) {
                var chunk = data.slice(start, end);

                // calculate hashes and add to results
                results.push({
                    weak: self.digestWeak(chunk)
                  , strong: crypto.createHash('md5').update(chunk).digest('hex') 
                });

                // update slice indices
                start += incr;
                end = (end + incr) > length ? length : end + incr;
            }

            return callback(null, results);
        });
    },
    //
    // Calculates instructions for synching using the given checksums
    //
    // Instructions are an array of sync objects which contain
    // the index of the block after which the the data must to be
    // inserted:
    // [{ index: null, data: 'cf92d' }, { index: 0, data: 'da41f' }]
    //
    diff: function (path, checksums, callback) {
        if (!checksums.length) { return callback(null, results); }

        var self = this
          , path = this.root + path
          , results = [];

        console.log('diff - path: %s', path);
        console.log('diff - checksums:', checksums);

        // create hashtable
        var hashtable = {}
          , len = checksums.length
          , i = 0;
        
        for (; i < len; i++) {
            var checksum = checksums[i]
              , weak16 = hash(checksum.weak);
            
            console.log('diff - weak32: %s', checksum.weak);
            console.log('diff - weak16: %s', weak16);

            if (hashtable[weak16]) {
                hashtable[weak16].push(checksum);
            } else {
                hashtable[weak16] = [checksum];
            }
        }

        console.log('diff - hashtable:', hashtable);

        // roll through the file
        fs.readFile(path, function (err, data) {
            if (err) { return callback(err); }

            var length = data.length
              , start = 0
              , end = this.chunkSize > length ? length : this.chunkSize
              // These get updated on every iteration
              // and are used to extract the sync data
              , lastMatchedBlock = null
              , lastMatchedEnd = 0
              // This gets updated every iteration
              // with the previous weak 32bit hash
              , prevWeak = null;

            for (; end <= length; start++, end++) {
                var weak
                  , weak16
                  , strong;

                if (prevWeak) {
                    weak = prevWeak - data[start - 1] + data[end];
                } else {
                    var chunk = data.slice(start, end);
                    weak = prevWeak = self.digestWeak(chunk);
                }

                weak16 = hash(weak);
                
                if (hashtable[weak16]) {
                    // Found weak16 match
                    var len = hashtable[weak16].length
                      , i = 0;
                    
                    for (; i < len; i++) {
                        if (hashtable[weak16][i].weak === weak) {
                            // Found weak32 match
                            var match = hashtable[weak16][i]
                              , chunk = data.slice(start, end);

                            strong = crypto.createHash('md5').update(chunk).digest();
                            if (match.strong === strong) {
                                // Push sync results
                                results.push({
                                    index: lastMatchedBlock
                                  , data: data.slice(lastMatchedEnd, start)
                                });

                                // Update rolling indices
                                lastMatchedBlock = i;
                                lastMatchedEnd = end;
                            }
                        }
                    }
                }
            }

            callback(null, results);
        });

        function hash(weak32) {
            var P = 1009;

            var weak16 = (weak32 >> 16) ^ ((weak32 & 0xffff) * P);
            return weak16 < 0 ? -1*weak16 : weak16;
        }
    },
    //
    // Syncs a file based on instructions, then recalculates it's
    // checksum
    //
    sync: function (path, diff, callback) {
        var self = this
          , path = this.root + path;
        
        fs.readFile(path, function (err, data) {
             
        });
    },
    //
    // Calculates weak adler32ish hash for data
    //
    digestWeak: function (data) {
        var len = data.length
          , M = 1 << 16
          , A = 0
          , B = 0
          , i = 0;
        
        for (; i < len; i++) {
            A += data[i];
            B += A;
        }
        A %= M;
        B %= M;
        return A + B * M;
    }
};

// Public API

exports.version = '0.0.1';

exports.createRSync = function (root, chunkSize) {
    var size = chunkSize || 750
    return new RSync(root, size);
}
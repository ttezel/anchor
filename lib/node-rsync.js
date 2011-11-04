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

function hash(type, data) {
    var result;

    if (type === 'md5') {
        result = crypto.createHash('md5').update(data).digest('hex');
    } else if (type === 'weak32') {
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
        result = A + B * M;
    } else if (type === 'weak16') {
        var P = 1009;

        var weak16 = (data >> 16) ^ ((data & 0xffff) * P);
        result = weak16 < 0 ? -1*weak16 : weak16;
    }

    return result;
}

function roll(data, checksums, chunkSize) {
    // create hashtable
    var hashtable = {}
      , len = checksums.length
      , i = 0;
    
    for (; i < len; i++) {
        var checksum = checksums[i]
          , weak16 = hash('weak16', checksum.weak);
        
        // console.log('diff - weak32: %s', checksum.weak);
        // console.log('diff - weak16: %s', weak16);

        if (hashtable[weak16]) {
            hashtable[weak16].push(checksum);
        } else {
            hashtable[weak16] = [checksum];
        }
    }

    var results = []
      , length = data.length
      , start = 0
      , end = chunkSize > length ? length : chunkSize
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
          , strong
          , chunk = data.slice(start, end);

        console.log('diff - checking %d to %d: %s', start, end, chunk);

        if (prevWeak) {
            weak = prevWeak - data[start - 1] + data[end];
        } else {
            var chunk = data.slice(start, end);
            weak = hash('weak32', chunk);
        }

        prevWeak = weak;
        weak16 = hash('weak16', weak);
        
        if (hashtable[weak16]) {
            var len = hashtable[weak16].length
              , i = 0;

            for (; i < len; i++) {
                if (hashtable[weak16][i].weak === weak) {
                    var match = hashtable[weak16][i]
                      , chunk = data.slice(start, end);

                    strong = crypto.createHash('md5').update(chunk).digest('hex');

                    if (match.strong === strong) {

                        // console.log('matched strong entry: %d', i);

                        // Push sync results
                        results.push({
                            index: lastMatchedBlock
                          , data: data.slice(lastMatchedEnd, start)
                        });

                        // Update rolling indices
                        lastMatchedBlock = i;
                        lastMatchedEnd = end;

                        break;
                    }
                }
            }
        }
    }

    return results;
}

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
    // [{ id: 0, weak: '59a9bf4d', strong: 'fe86160cf6...' }, { ... }]
    //
    checksum: function (path, callback) {
        var self = this
          , path = this.root + path
          , results = [];

        fs.readFile(path, function (err, data) {
            if (err) { return callback(err); }
            
            var length = data.length
              , incr = self.chunkSize
              , start = 0
              , end = incr > length ? length : incr
              , blockIndex = 0;
            
            while (start < length) {
                var chunk = data.slice(start, end);

                // calculate hashes and add to results
                results.push({
                    index: blockIndex
                  , weak: hash('weak32', chunk)
                  , strong: crypto.createHash('md5').update(chunk).digest('hex') 
                  , data: chunk.toString()
                });

                // update slice indices
                start += incr;
                end = (end + incr) > length ? length : end + incr;

                // update block index
                blockIndex++;
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
          , path = this.root + path;

        console.log('diff - path: %s', path);
        console.log('diff - checksums:', checksums);

        // roll through the file
        fs.readFile(path, function (err, data) {
            if (err) { return callback(err); }
            return callback(null, roll(data, checksums, self.chunkSize));
        });
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
};

// Public API

exports.version = '0.0.1';

exports.createRSync = function (root, chunkSize) {
    // var size = chunkSize || 750
    return new RSync(root, chunkSize);
}
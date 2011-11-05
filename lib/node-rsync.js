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

var hash = {
    md5: function (data) {
        return crypto.createHash('md5').update(data).digest('hex');
    },
    weak32: function (data, prev, start, end) {
        var args = [].slice.call(arguments)
          , a = 0
          , b = 0
          , sum = 0
          , M = 1 << 16;

        if (!prev) {
            var len = start >= 0 && end >= 0 ? end - start : data.length
              , i = 0;

              for (; i < len; i++) {
                  a += data[i];
                  b += a;
              }

              a %= M;
              b %= M;
        } else {
            var k = start
              , l = end - 1
              , prev_k = k - 1
              , prev_l = l - 1
              , prev_first = data[prev_k]
              , prev_last = data[prev_l]
              , curr_first = data[k]
              , curr_last = data[l];
            
            a = (prev.a - prev_first + curr_last) % M
            b = (prev.b - (prev_l - prev_k + 1) * prev_first + a) % M
        }
        return {
            a: a
          , b: b
          , sum: a + b * M
        };
    },
    weak16: function (data) {
        var P = 1009
          , weak16 = (data >> 16) ^ ((data & 0xffff) * P);

        return weak16 < 0 ? -1*weak16 : weak16;
    }
};

function createHashtable(checksums) {
    var hashtable = {}
      , len = checksums.length
      , i = 0;
    
    for (; i < len; i++) {
        var checksum = checksums[i]
          , weak16 = hash.weak16(checksum.weak);

        if (hashtable[weak16]) {
            hashtable[weak16].push(checksum);
        } else {
            hashtable[weak16] = [checksum];
        }
    }
    return hashtable;
}

function roll(data, checksums, chunkSize) {
    var results = []
      , hashtable = createHashtable(checksums)
      , length = data.length
      , start = 0
      , end = chunkSize > length ? length : chunkSize
      // These get updated on every iteration
      // and are used to extract the sync data
      , lastMatchedBlock = null
      , lastMatchedEnd = 0
      // This gets updated every iteration
      // with the previous weak 32bit hash
      , prevRollingWeak = null;

    console.log(hashtable);

    for (; end <= length; start++, end++) {
        var weak = hash.weak32(data, prevRollingWeak, start, end)
          , weak16 = hash.weak16(weak.sum)
          , chunk = data.slice(start, end);

        prevRollingWeak = weak;
        
        console.log('roll - %d %d %s %d %d', start, end, chunk, weak.sum, weak16);

        if (hashtable[weak16]) {
            console.log('weak16 hash matched');
            var len = hashtable[weak16].length
              , i = 0;

            for (; i < len; i++) {
                if (hashtable[weak16][i].weak === weak.sum) {
                    var match = hashtable[weak16][i]
                      , chunk = data.slice(start, end);

                    var strong = hash.md5(chunk);

                    if (match.strong === strong) {

                        // console.log('matched strong entry: %d', i);

                        // Push sync results
                        var d = start - lastMatchedEnd > 0
                            ? data.slice(lastMatchedEnd, start).toString()
                            : null;
    
                        results.push({
                            index: lastMatchedBlock
                          , data: d
                        });

                        // Update rolling indices
                        lastMatchedBlock = match.index;
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
                  , weak: hash.weak32(chunk).sum
                  , strong: hash.md5(chunk) 
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
    var size = chunkSize || 750;
    return new RSync(root, size);
}
/*!
 * node-rsync
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var hash = require('./hash')
  , fs = require('fs');

//
// Algorithm functions
//

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

// rolls through data 1 byte at a time, and determines sync instructions
function roll(data, checksums, chunkSize) {
    var results = []
      , hashtable = createHashtable(checksums)
      , length = data.length
      , start = 0
      , end = chunkSize > length ? length : chunkSize
      // Updated when a block matches
      , lastMatchedEnd = 0
      // This gets updated every iteration with the previous weak 32bit hash
      , prevRollingWeak = null;

    for (; end <= length; start++, end++) {
        var weak = hash.weak32(data, prevRollingWeak, start, end)
          , weak16 = hash.weak16(weak.sum)
          , match = false;

        prevRollingWeak = weak;
        
        if (hashtable[weak16]) {
            var len = hashtable[weak16].length
              , i = 0;

            for (; i < len; i++) {
                if (hashtable[weak16][i].weak === weak.sum) {
                    var mightMatch = hashtable[weak16][i]
                      , chunk = data.slice(start, end)
                      , strong = hash.md5(chunk);

                    if (mightMatch.strong === strong) {
                        match = mightMatch;
                        break;
                    }
                }
            }
        }

        if (match) {
            if (start - lastMatchedEnd > 0) {
                var d = data.slice(lastMatchedEnd, start);
                results.push({
                    data: d
                  , index: match.index
                });
            } else {
                results.push({
                    index: match.index
                });
            }
            lastMatchedEnd = end;
        } else if (end === length) {
            // Last block - since it hasn't matched, this data must be
            // appended
            var d = data.slice(lastMatchedEnd);
            results.push({
                data: d
            });
        }
    }

    return results;
}

//
// RSync implementation
//

var RSync = function (root, size) {
    this.root = root;
    this.size = size;
};

RSync.prototype = {
    //
    // Finds weak and strong checksums for given file
    // weak - similar to adler32
    // strong - md5
    //
    // Calls back with array of checksum objects:
    // [{ id: 0, weak: '59a9bf4d', strong: 'fe86160cf6...' }, { ... }]
    // 
    // id = block id
    //
    checksum: function (path, callback) {
        var self = this
          , path = this.root + path
          , results = [];

        fs.readFile(path, function (err, data) {
            if (err) { return callback(err); }
            
            var length = data.length
              , incr = self.size
              , start = 0
              , end = incr > length ? length : incr
              , blockIndex = 0;
            
            while (start < length) {
                // calculate hashes and add to results
                var chunk = data.slice(start, end);
                results.push({
                    index: blockIndex
                  , weak: hash.weak32(chunk).sum
                  , strong: hash.md5(chunk) 
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

        // roll through the file
        fs.readFile(path, function (err, data) {
            if (err) { return callback(err); }
            return callback(null, roll(data, checksums, self.size));
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
            // TODO
        });
    },
};

// Public API

exports.version = '0.0.1';

exports.createRSync = function (root, size) {
    return new RSync(root, size || 750);
};

/*!
 * node-rsync
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com> & Tolga Tezel <tolgatezel11@gmail.com>
 * MIT Licensed
 */

var crypto = require('crypto')
  , fs = require('fs');

/**
 * Library version.
 */

exports.version = '0.0.1';

var chunkSize = 750;

var rsync = {
    //
    // chunk a file
    //  @overlap    bool    represents whether chunks should overlap
    //
    chunk: function (path, overlap, callback) {
        var chunks = []
          , incr = overlap ? 1 : chunkSize;

        // read raw file
        fs.readFile(path, function (err, input) {
            if (err) {
                return callback(err);
            }

            var length = input.length;

            if (length <= chunkSize) {
                chunks.push(input);

                return callback(null, {
                    num: chunks.length
                  , chunks: chunks
                });
            }

            var start = 0
              , end = chunkSize;

            while (start < length) {
                var chunk = input.slice(start, end);
                chunks.push(chunk);

                // update slice indices
                start += incr;
                end = (end + incr) < length ? end + incr : length;
            }

            return callback(null, {
                num: chunks.length
              , chunks: chunks
            });

        });
    },
    //
    // calculates two checksums for each chunk:
    // weak - adler-32 (32 bit)
    // strong - md5 (128 bit)
    //
    checksum: function (chunkData, callback) {
        var chunks = chunkData.chunks
          , num = chunkData.num
          , checksums = []
          , i = 0;
        
        for(; i < num; i++) {
          var chunk = chunks[i];
          checksums.push({
              weak: rollingChecksum(chunk)
            , strong: crypto.createHash('md5').update(chunk).digest('hex')
          });
        }

        return checksums;
    },
    //
    //  searches file for blocks that match
    //  the checksum list
    //  
    search: function(path, list, callback) {
      var hashtable = []
        , length= list.length
        , P = 1009
        , i = 0;

      //populate hashtable
      for(; i < length; i++) {
        var weak = list[i].weak
          , hash16 = (weak >> 16) ^ ((weak & 0xffff) * P)
          , entry = hash16 < 0 ? -1*hash16 : hash16;

        if(hashtable[entry]) {
          hashtable[entry].push(list[i]);
        } else {
          hashtable[entry] = [list[i]]; 
        }
      }
      
      console.log(hashtable);
    }
};

function rollingChecksum (chunk) {
    var M = 1 << 16
      , length = chunk.length
      , A = 0
      , B = 0
      , i = 0;

    for (; i < length; i++) {
        A += chunk[i];
        B += A;
    }
    
    return A + M * B;
}

rsync.chunk('./files/hello-client.txt', false, function (err, chunkData) {
    var checksums = rsync.checksum(chunkData);
    //console.log(checksums);
    rsync.search('./files/hello-client.txt', checksums, function() {
    
    });
});


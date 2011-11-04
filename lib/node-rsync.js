/*!
 * node-rsync
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com> & Tolga Tezel <tolgatezel11@gmail.com>
 * MIT Licensed
 */

var childProcess = require('child_process')
  , crypto = require('crypto')
  , fs = require('fs');

/**
 * Library version.
 */

exports.version = '0.0.1';

var chunkSize = 2;  //750;

var rsync = module.exports = {
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

            if (!overlap && length <= chunkSize) {
                chunks.push(input);

                return callback(null, {
                    num: chunks.length
                  , chunks: chunks
                });
            }

            var start = 0
              , end = chunkSize > length ? length : chunkSize;

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
              , raw: input
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
    //  the checksum list, sends over 
    //  missing data
    //  
    search: function(path, list, callback) {
      var hashtable = {}
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

      var offset = 0;

      //roll thru file, perform 3-level search 
      //on overlapping chunks
      rsync.chunk(path, true, function (err, chunkData) {
        var gotMatch = gotMismatch = false
          , chunks = chunkData.chunks
          , num = chunkData.num
          , raw = chunkData.raw
          , i = 0
          , start;

        //iterate chunks
        for(; i < num; i++) {
          var chunk = chunks[i]
            , weak = rollingChecksum(chunk)
            , hash = (weak >> 16) ^ ((weak & 0xffff) * P)
            , hash16 = hash < 0 ? -1*hash : hash;

          //first level
          if(hashtable[hash16]) {
            var entry = 0
              , entries = hashtable[hash16].length;

            hashLoop:
              for(; entry < entries; entry++) {
                var match = hashtable[hash16][entry];

                //second level
                if(weak === match.weak) {
                  var strong = crypto.createHash('md5')
                                .update(chunk)
                                .digest('hex');
                  
                  //third level
                  if(strong === match.strong) {
                    if(gotMatch && gotMismatch) {
                      //send over data between matches

                      callback(null, {
                          start: start
                        , data: raw.slice(start, offset + i)
                      });

                      gotMismatch = false;
                      i += chunkSize - 1;

                      break hashLoop;
                    } else {  //we never had a mismatch
                      gotMatch = true;
                      i += chunkSize - 1;
                      start = offset + i + 1;

                      break hashLoop;
                    }
                  } //third level
                } //second level
              } //hashLoop
            } else {
              gotMismatch = true;
            }
          }
        
        offset += num;
      });
    }
};

//TODO: fix this calculation, it's incorrect (not returning 32-bit int)
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

/*!
 * node-rsync
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * MIT Licensed
 */

var crypto = require('crypto')
  , fs = require('fs');

/**
 * Library version.
 */

exports.version = '0.0.1';

var chunkSize = 2;

var rsync = {
    //
    // chunk a file
    //
    chunk: function (path, callback) {
        var chunks = [];

        // read raw file
        fs.readFile(path, function (err, data) {
            if (err) {
                return callback(err);
            }

            var input = data
              , length = data.length;

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
                start += chunkSize;
                end = (end + chunkSize) < length ? end + chunkSize : length;
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
        var num = chunkData.num
          , chunks = chunkData.chunks;
        
        chunks.forEach(function (chunk) {
            var sum = {
                weak: rollingChecksum(chunk)
              , strong: 
            }
            var weakSum = rollingChecksum(chunk);
            console.log('chunk: %s\n sum: %d', chunk, sum);
        });
    }
};

function rollingChecksum (chunk) {
    var M = 1 << 16
      , length = chunk.length
      , A = 0
      , B = 0
      , i;

    for (i = 0; i < length; i++) {
        A += chunk[i];
        B += A;
    }
    
    return A + M * B;
}

rsync.chunk('./files/hello-client.txt', function (err, chunkData) {
    rsync.checksum(chunkData);
});
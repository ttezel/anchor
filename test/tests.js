var vows = require('vows')
  , assert = require('assert')
  , rsync = require('../lib/node-rsync.js');

//Rsnyc tests
vows.describe('Rsync - updating server file').addBatch({
  'single chunk of size chunkSize in middle': {
    topic: function() {
        var self = this
        , difference = [];

        rsync.chunk('../lib/files/hello-server.txt', false, function (err, chunkData) {
          var checksums = rsync.checksum(chunkData);

          rsync.search('../lib/files/hello-client.txt', checksums, function(err, chunkData) {
            difference .push(chunkData.data.toString());
            self.callback(null, difference);  //return each block
          });
        });
    }, 

    'diffence is just that block': function(topic) {
      assert.equal(topic, 'dd');
    }
  }
  
}).run();
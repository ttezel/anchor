var rsync = require('./node-rsync.js');

rsync.chunk('./files/hello-server.txt', false, function (err, chunkData) {
    var checksums = rsync.checksum(chunkData);
    
    rsync.search('./files/hello-client.txt', checksums, function(err, chunkData) {
      console.log('outgoing', chunkData.data.toString());
    });
});
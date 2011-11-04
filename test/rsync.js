var rsync = require('../lib/node-rsync');

var sync = rsync.createRSync('../lib/files', 2);

sync.checksum('/server.txt', function (err, results) {
    sync.diff('/client.txt', results, function (err, results) {
        console.log(results);
    });
    // console.log(results);
});
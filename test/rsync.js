var rsync = require('../lib/node-rsync');

var sync = rsync.createRSync('../lib/files', 2);

sync.checksum('/server.txt', function (err, results) {
    var t1 = Date.now();
    sync.diff('/client.txt', results, function (err, syncdata) {
        var t2 = Date.now();
        console.log('total time: %d', t2 - t1);

        sync.sync('/server.txt', syncdata, function(err, results) {

        });
    });
});
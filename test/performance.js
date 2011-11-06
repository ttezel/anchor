var rsync = require('../lib/node-rsync.js');

var sync = rsync.createRSync('./performance', 750);

var t1 = Date.now();
sync.checksum('/libruby190.a', function (err, results) {
    var t2 = Date.now();
    console.log('checksum: %d', t2 - t1);
    var t3 = Date.now();
    sync.diff('/libruby191.a', results, function (err, results) {
        var t4 = Date.now();
        console.log('diff: %d', t4 - t3);
    });
});
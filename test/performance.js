var rsync = require('../lib/node-rsync.js');

var sync = rsync.createRSync('./performance', 750);

var t1 = Date.now();
sync.checksum('/libruby190.a', function (err, results) {
    var t2 = Date.now();
    console.log(results);
    console.log('checksum: %d', t2 - t1);
});
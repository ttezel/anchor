var rsync = require('../lib/node-rsync.js');

var sync = rsync.createRSync('./performance', 750);

var t1 = Date.now();
sync.checksum('/libruby190.a', function (err, checksums) {
    var t2 = Date.now();
    sync.diff('/libruby191.a', checksums, function (err, diffs) {
        var t3 = Date.now();
        console.log('checksums - time: %d, num: %d', t2 - t1, checksums.length);  
        console.log('diff - time: %d, num: %d', t3 - t2, diffs.length);
    });
});
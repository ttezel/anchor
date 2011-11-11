var server = require('../lib/server.js').createServer().listen(8000);
var client = require('../lib/client.js').createClient(8000);

server.checksum(function (path, client) {
    if (path === '/client.txt') {
        setTimeout(function () {
            client.write('checksum for ' + path);
        }, 5000);
    } else {
        client.write('checksum for ' + path);
    }
    // console.log('SERVER: checksum');
});

server.diff(function () {
    console.log('SERVER: diff');
});

server.sync(function () {
    console.log('SERVER: sync');
});

client.on('ready', function () {
    client.checksum('/client.txt', function (result) {
        console.log('CLIENT: received checksum: %s', result);
    });
    setTimeout(function () {
        client.checksum('/client2.txt', function (result) {
            console.log('CLIENT2: received checksum: %s', result);
        }); 
    }, 2000); 
});
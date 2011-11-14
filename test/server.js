var server = require('../lib/server.js').createServer().listen(8000);
var client1 = require('../lib/client.js').createClient(8000);
var client2 = require('../lib/client.js').createClient(8000);

server.checksum(function (client, data) {
    var path = data[1].toString();
});

server.sync(function (buffers) {
    console.log('SERVER: sync request');
});

server.error(function (buffers) {
    console.log('SERVER: error');
})

client1.on('ready', function () {
    client1.checksum('/client.txt', function (result) {
        console.log('CLIENT: received checksum: %s', result);
    });
});

client1.close();
client2.close();
/**
 * Node rsync server
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var net = require('net')
  , rsync = require('./node-rsync');

var sync = rsync.createRSync('./files', 2);

var server = net.createServer(function (client) {
    console.log('client connected, num clients: %d', server.connections);
    client.setEncoding('utf8');
    client.on('end', function () {
        console.log('client disconnected, num clients: %d', server.connections);
    });
    client.on('data', function (data) {
        var obj;

        console.log('received data: %s', data);

        try {
            obj = JSON.parse(data.slice(0, data.length - 1));
        } catch (e) {
            return client.end('-');
        }

        router.route(obj, function (error, result) {
            error ? client.end('-') : client.end(result);
        });
    });
}).listen(8000);

var router = {
    map: function (map) {
        this.map = map;
    },
    route: function (cmd, callback) {
        if (!cmd || !cmd.method) {
            return callback(new Error('no command'));
        }
        this.map[cmd.method]
            .call(null, cmd.payload || {}, callback || function () {});
    }
};

router.map({
    checksum: function (path, callback) {
        console.log('checksum - payload: %s', path);
        sync.checksum(path, function (error, checksum) {
            console.log('checksum - result: %s', checksum);
            callback(null, checksum);
        });
    }
});
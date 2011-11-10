/**
 * Node rsync server
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var net = require('net')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter
  , rsync = require('./node-rsync');

(function () {

    var exports = this.exports;

    var noop = function () {};

    //
    // Public API
    //

    exports.createServer = function (root, size, port) {
        return new Server(path, size || 750, port);
    };

    //
    // Server
    //

    function Server() {
        this.fn = {};
        var server = this.server = net.createServer();
        var self = this;
        server.on('connection', function (client) {
            handle_client(client);
            console.log('SERVER: client connected');
            self.update();
        });
        server.on('close', function () {
            console.log('SERVER: finished');
        });
    }

    util.inherits(Server, EventEmitter);

    Server.prototype = {
        listen: function () {
            this.server.listen();
        },
        close: function () {
            this.server.close();
        },
        handle_client: function (client) {
            var self = this;
            client.setEncoding('utf8');
            client.on('data', function (data) {
                console.log('SERVER: received data: %s', data);
                console.log('SERVER: received bytes: %d', data.length);

                try {
                    data = JSON.parse(data);
                } catch (e) {
                    // not json
                    return client.end('-');
                }

                // parse data
                if (data.method === 'checksum' && data.path) {
                    self.fn.checksum.call(null, data.path);
                } else if (data.method === 'diff') {
                    self.fn.diff.call(null, data.path, data.checksums);
                } else if (data.method === 'sync') {
                    self.fn.sync.call(null, data.path, data.diff);
                } else {
                    return client.end('-');
                }
            });
            client.on('end', function () {
                console.log('SERVER: client disconnected');
                self.update();
            });
        },
        checksum: function (fn) {
            this.fn.checksum = fn;
        },
        diff: function (fn) {
            this.fn.diff = fn;  
        },
        sync: function (fn) {
            this.fn.sync = fn;
        },
        update: function () {
            console.log('SERVER: # of clients: %d', this.server.connections);
        },
        log: function (what) {
            console.log('SERVER: ' + what);
        }
    };
}).call(this);
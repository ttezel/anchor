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
  , rsync = require('./node-rsync')
  , EventEmitter = require('events').EventEmitter
  , createParser = require('./parser').createParser;

function noop() {};

exports.createServer = function () {
    return new Server();
};

function Server() {
    var self = this;

    this.callbacks = {};
    this.server = net.createServer();

    this.server.on('connection', function (client) {
        self.handleClient(client);

        console.log('SERVER: client connected');
        self.update();
    });

    this.server.on('close', function () {
        console.log('SERVER: finished');
    });
}

Server.prototype = {
    listen: function (port) {
        this.server.listen(port);
        return this;
    },
    close: function () {
        this.server.close();
    },
    handleClient: function (client) {
        var self = this;
        client.on('data', function (chunk) {
            var parser = createParser();
            parser.on('message', function (data) {
                var command = data[0].toString();
                switch (command) {
                    case 'checksum':
                        self.callbacks.checksum(client, data);
                        break;
                    case 'sync':
                        self.callbacks.sync(client, data);
                        break;
                    default:
                        // error
                        self.callbacks.error(client, data);
                }
            });
            parser.on('error', function (error) {
                console.log('parser error: %s', error); 
            });
            parser.parse(chunk);
        });
        client.on('end', function () {
            console.log('SERVER: client disconnected');
            self.update();
        });
    },
    checksum: function (fn) {
        this.callbacks.checksum = fn;
    },
    sync: function (fn) {
        this.callbacks.sync = fn;
    },
    error: function (fn) {
        this.callbacks.error = fn;
    },
    update: function () {
        console.log('SERVER: # of clients: %d', this.server.connections);
    },
    log: function (what) {
        console.log('SERVER: ' + what);
    }
};
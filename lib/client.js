/**
 * Node rsync client
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var net = require('net')
  , EventEmitter = require('events').EventEmitter
  , util = require('util');

(function (exports) {

    //
    // Public API
    //

    exports.createClient = function (port, host) {
        return new Client(port, host);
    };

    //
    // Client
    //

    function Client(port, host) {
        EventEmitter.call(this);
        var self = this;
        self.socket = net.createConnection(port, host, function () {
            self.emit('ready');
        });
        self.socket.setEncoding('utf8');
        self.socket.setTimeout(300 * 1000);
        self.socket.on('data', function (data) {
            console.log(data) 
        });
    }

    util.inherits(Client, EventEmitter);

    Client.prototype.checksum = function (path, callback) {
        var data = { method: 'checksum', path: path };
        this.socket.write(JSON.stringify(data), 'utf8');
    };

    return exports;
}).call(null, exports);
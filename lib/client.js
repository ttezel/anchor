/**
 * Node rsync client
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var net = require('net')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter;

exports.createClient = function (port, host) {
    return new Client(port, host);
};

function Client(port, host) {
    this.delimiter = '\r\n';
    var self = this;

    self.socket = net.createConnection(port, host, function () {
        self.emit('ready');
    });
    self.socket.setTimeout(300 * 1000);
    self.socket.on('data', function (data) {
        console.log(data.toString('utf8'));
    });
    EventEmitter.call(this);
}

util.inherits(Client, EventEmitter);

Client.prototype.checksum = function (path, callback) {
    var self = this;

    var data = '$8'              + this.delimiter;
    data    += 'checksum'        + this.delimiter;
    data    += '$' + path.length + this.delimiter;
    data    += path              + this.delimiter;
    data    += '&'               + this.delimiter;

    self.socket.write(data, 'utf8');
};

Client.prototype.sync = function (path, diff, callback) {

};

Client.prototype.close = function () {
    this.socket.end();
};
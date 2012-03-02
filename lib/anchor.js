/**
 * Anchor
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var rsync = require('./node-rsync')
  , util = require('util')
  , https = require('https')
  , Parser = require('./parser').Parser
  , EventEmitter = require('events').EventEmitter;

function Anchor(options) {
    // folder roots
    this.roots = {};
    if (Array.isArray(options.roots)) {
        options.roots.forEach(function (root) {
            this.roots[root] = 1; 
        });
    } else if (typeof options.roots === 'string') {
        this.roots[options.roots] = 1;
    } else {
        this.roots['../files'] = 1;
    }

    // rsync
    this.rsync = new RSync(options.blockSize || 750);

    this.server = https.createServer();
    this.initServer();
}

util.inherits(Anchor, EventEmitter);

Anchor.prototype.initServer = function () {
    var self = this
      , server = this.server;
    
    server.on('connection', function (client) {
        var data = '';
        
        client.on('data', function (chunk) { 
          data += chunk;
        });
        client.on('end', function () {
          var parser = new Parser();
          parser.on('message', function (data) {
            self.handleMessage(client, data);
          });
          parser.on('error', function (error) {
            self.emit('error', error);
          }) 
          parser.parse(data);
        });
    });
};

Anchor.prototype.handleMessage = function (client, data) {
    var cmd = data[0].toString()
      , path = data[1].toString();

    switch (cmd) {
        case 'checksum':
            this.rsync.checksum(path, function (result) {
                client.write(result); 
            });
            break;
        case 'sync':
            this.rsync.sync(path, data, function (result) {
                client.write(result);
            });
            break;
        default:
            return this.emit('error', 'invalid message');
    }
};

Anchor.prototype.listen = function (port, cluster) {
    this.server.listen(port);
};

Anchor.prototype.close = function () {
    this.server.close();
};
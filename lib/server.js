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

(function (exports) {

    var noop = function () {};

    //
    // Public API
    //

    exports.createServer = function () {
        return new Server();
    };

    //
    // Server
    //

    function Server() {
        var self = this;
        this.fn = {};
        var server = this.server = net.createServer();

        server.on('connection', function (client) {
            self.handle_client(client);

            console.log('SERVER: client connected');
            self.update();
        });

        server.on('close', function () {
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
        handle_client: function (client) {
            var self = this;
            client.setEncoding('utf8');
            client.on('data', function (data) {
                console.log('SERVER: received data: %s', data);
                console.log('SERVER: bytes: %d', data.length);

                try {
                    data = JSON.parse(data);
                } catch (e) {
                    // not json
                    return client.end('-');
                }

                // parse data
                if (data.method === 'checksum' && data.path) {
                    self.fn.checksum.call(null, data.path, client);
                } else if (data.method === 'diff' && data.checksums) {
                    self.fn.diff.call(null, data.path, data.checksums);
                } else if (data.method === 'sync' && data.diff) {
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

    //
    // Parser
    //

    function Parser() {
        // possible states
        this.states = {
            NUM_ARGS: 1
          , ARG_SIZE: 2
          , DATA: 3
        };
        this.reset();
        EventEmitter.call(this);
    }

    util.inherits(Parser, EventEmitter);

    Parser.prototype.reset = function () {
        this.numArgs = 0;

        // initial state
        this.state = this.states.NUM_ARGS;
    };

    Parser.prototype.parse = function (data) {
        var index = 0;
        if (this.bufferOffset + data.length > buffer.length) {
            var biggerBuff = new Buffer(this.buffer.length << 1, 'utf8');
            this.bufferOffset = this.buffer.length;
            this.buffer.copy(biggerBuff);
            this.buffer = bifferBuff;
        }

        // append to buffer
        data.copy(this.buffer, this.bufferOffset);

        var states = this.states;

        while (index < data.length) {
            var val = data[index];

            switch (this.state) {
                case states.NUM_ARGS:
                    switch (val) {
                        case 42: // *
                            index++;
                            break;
                    }
                    break;
                case states.DATA:
                    break;
                case 
                default:
            }
        }
    };

})(exports);
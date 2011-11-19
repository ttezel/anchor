/**
 * Parser
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var util = require('util')
  , EventEmitter = require('events').EventEmitter;

var Parser = exports.Parser = function () {
    this.states = {
        START: 0
      , LENGTH: 1
      , DATA: 2
      , DATA_END: 3
    };
    this.reset();
    EventEmitter.call(this);
}

util.inherits(Parser, EventEmitter);

Parser.prototype.reset = function () {
    // data buffers
    this.buffers = [];

    // current buffer length and write offset
    this.length = '';
    this.offset = 0;

    // initial state
    this.state = this.states.START;
};

Parser.prototype.parse = function (data) {
    var states = this.states
      , index = 0;

    while (index < data.length) {
        var input = this.input = data[index];

        switch (this.state) {
            case states.START:
                switch (input) {
                    case 36: // $
                        this.state = states.LENGTH;
                        break;
                    default:
                        this.syntaxError();
                        this.reset();
                }
                break;
            case states.LENGTH:
                switch (input) {
                    case 13: break; // CR
                    case 10: // LF
                        this.length = parseInt(this.length);
                        if (isNaN(this.length)) {
                            this.syntaxError();
                            this.reset();
                        } else {
                            this.buffer = new Buffer(this.length);
                            this.buffers.push(this.buffer);
                            this.state = states.DATA;   
                        }
                        break;
                    default:
                        if (input >= 48 && input <= 57) {
                            this.length += input - 48;
                        } else {
                            this.syntaxError();
                            this.reset();
                        }
                }
                break;
            case states.DATA:
                if (this.offset < this.length) {
                    // write to current buffer
                    this.buffer[this.offset] = this.input;
                    this.offset++;
                } else {
                    switch (input) {
                        case 13: break; // CR
                        case 10: // LF
                            this.state = states.DATA_END;
                            break;
                        default:
                            this.syntaxError();
                            this.reset();
                    }
                }
                break;
            case states.DATA_END:
                switch (input) {
                    case 36: // $
                        // more data
                        this.state = states.LENGTH;

                        this.offset = 0;
                        this.buffer = null;
                        this.length = '';
                        break;
                    case 38: // &
                        // done parsing
                        this.gotMessage();
                        this.reset();
                        break;
                }
                break;
        }
        index++;
    }
};

Parser.prototype.syntaxError = function () {
    var states = this.states;
    this.emit('error', 'Syntax Error - state: ' + this.state + ', input: ' + this.input);
};

Parser.prototype.gotMessage = function () {
    this.emit('message', this.buffers);
};
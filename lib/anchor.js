/**
 * Anchor
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var EventEmitter = require('events').EventEmitter
  , path = require('path')
  , util = require('util')
  , Server = require('./server')

//
//  options keys:
//  -roots string  relpaths to allow sync access
//  -blockSize (defaults to 750)
//  -port (defaults to 8080)
//
//  usage: 
//
//  anchor.sync({
//      host: 'mydomain.myhost.com'
//   [, blockSize: 750 ]
//   [, port: 8080 ]
//    , roots: {
//      '../sync': './sync'
//    }
//  })
//
function Anchor(options) {
  if(options && typeof options !== 'object') throw new Error('Anchor options must be Object')
  if(!options.host) throw new Error('Must specify remote host to sync on')
  if(!options.roots || typeof options.roots !== 'object') throw new Error('Must specify sync paths')
  
  options.blockSize = options.blockSize || 750
  options.localPort = options.localPort || 8080
  options.remotePort = options.remotePort || 8080

  var self = this
    , relRoot = Object.keys(options.roots)[0]

  options.localRoot = path.resolve(__dirname, relRoot)
  options.remoteRoot = options.roots[relRoot]

  this.server = new Server(options).listen()
  this.server.on('ready', function () {
    self.emit('ready')
  })
}

util.inherits(Anchor, EventEmitter)

module.exports = Anchor
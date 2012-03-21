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
  , Client = require('./client');

//
//  options keys:
//  -roots (string or array)  relpaths to allow sync access (defaults to ../files)
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
  if(!options.roots) throw new Error('Must specify sync paths')
  
  options.blockSize = options.blockSize || 750
  options.port = options.port || 8080

  var roots = Object.keys(options.roots)

  options.localRoots = roots.map(function (root) {
    return path.resolve(__dirname, root)
  })
  //  incoming sync requests must match these regex's
  options.rgxLocalRoots = options.localRoots.map(function (root) {
    var base = path.basename(root)
    return new RegExp('^' + base)
  })
  options.remoteRoots = roots.map(function (root) {
    return options.roots[root]
  })
  
  this.server = new Server(options).listen()
  this.client = new Client(options).watch()
}

module.exports = Anchor
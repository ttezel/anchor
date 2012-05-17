/**
 * Anchor
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 *
 * Anchor listens on a port and performs updates on the local fs
 * when a sync request is received over http
 *
 * also watches the local fs on a specified filepath
 */

var EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , https = require('https')
  , path = require('path')
  , util = require('util')
  , Client = require('./client')

//
//  grab credentials
//
var privateKey = fs.readFileSync('../credentials/privatekey.pem').toString()
  , certificate = fs.readFileSync('../credentials/certificate.pem').toString()

//
//  regex to grab the resource
//
var rgxRoutes = /\/(rename|change)/;

module.exports = Anchor

//
//  usage: 
//
//  new Anchor({
//      host: 'mydomain.myhost.com'
//   [, blockSize: 750 ]
//   [, port: 8080 ]
//    , roots: {
//      '../sync': './sync'
//    }
//  })
//
function Anchor(options) {
  if(!options || typeof options !== 'object') throw new Error('Anchor options must be Object')
  if(!options.host) throw new Error('Must specify remote host to sync on')
  if(!options.roots || typeof options.roots !== 'object') throw new Error('Must specify sync paths')
  EventEmitter.call(this)
  
  options.blockSize = options.blockSize || 750
  options.localPort = options.localPort || 8080
  options.remotePort = options.remotePort || 8080

  var self = this
    , relRoot = Object.keys(options.roots)[0]

  options.localRoot = path.resolve(__dirname, relRoot)
  options.remoteRoot = options.roots[relRoot]

  this.options = options

  var creds = { key: privateKey, cert: certificate }

  //get the route using regex, once body is received
  //update the local fs
  function handleRequest(req, res) {
    var match = rgxRoutes.exec(req.url)
    if(!match) {
      res.writeHead(400)
      res.end()
      return
    }

    var action = match[1], data = ''

    req.setEncoding('utf8')
    req
      .on('data', function (chunk) { data += chunk })
      .on('end', function () {
        try {
          var parsed = JSON.parse(data)
        } catch(err) {
          var error = new Error('ANCHOR: request is not valid JSON')
          error.msg = err
          throw error
        }
        self.updateLocal(req, res, action, parsed) 
      })
  }
  this.server = https.createServer(creds, handleRequest)
  this.server.listen(this.options.localPort)

  console.log('SERVER: listening @ port', this.options.localPort)

  this.client = new Client(options)
  this.client.on('ready', function () { self.emit('ready') })
}
util.inherits(Anchor, EventEmitter)

Anchor.prototype.updateLocal = function (req, res, action, parsed) {
  var self = this
    , localRoot = this.options.localRoot

  console.log('received change. updating...')

  switch(action) {
    case 'rename':
      var oldName = path.resolve(localRoot, parsed.oldName)
        , newName = path.resolve(localRoot, parsed.newName)

      console.log('oldNamez', oldName)
      console.log('newNamez', newName)

      //temporarily unwatch file to prevent fs.watch firing
      //otherwise it would be an infinite update cycle
      this.client.ignorePath(oldName)
      this.client.ignorePath(newName)

      //apply the rename
      fs.rename(oldName, newName, function (err) {
        if(err) {
          res.writeHead(500)

          var msg = util.format('rename from `%s` to `%s` failed.', oldName, newName)
          res.end(msg)
          throw err
        }

        //update cache
        fs.stat(newName, function (err, stat) {
          if (err) throw err
          self.client.cache[stat.ino] = { fpath: newName, stat: stat }
          self.client.unignorePath(newName)
          res.end()
          return
        })
      })
      break
    case 'change':
      console.log('file contents changed')
      break
    default:
      throw new Error('action `' + action + '` is not supported')
  }
}
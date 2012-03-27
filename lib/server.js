/**
 * Node rsync server
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 *
 * Server listens on a port and performs updates on the local fs
 * when a sync request is received over http
 *
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
//  regex to grab the route & params
//
var rgxRoute = /\/(rename|change)/;

//
//  Server
//
var Server = module.exports = function (options) {
  var self = this
  this.options = options

  var creds = { key: privateKey, cert: certificate }

  function handleRequest(req, res) {
    var match = rgxRoute.exec(req.url)
    if(!match) {
      res.writeHead(400)
      res.end()
      return
    }

    var input = ''
    req.setEncoding('utf8')
    req
      .on('data', function (chunk) { 
        input += chunk 
      })
      .on('end', function () { 
        self.sync(req, res, match, input)
      })
  }

  this.client = new Client(options).watchRoot()
  this.server = https.createServer(creds, handleRequest)
  this.client.on('ready', function () { self.emit('ready') })
}

util.inherits(Server, EventEmitter)

Server.prototype.listen = function (port) {
  port = port || this.options.localPort
  this.server.listen(port)
  console.log('SERVER: listening @ port', port)
  return this
}

Server.prototype.sync = function (req, res, match, input) {
  var self = this
    , localRoot = this.options.localRoot
    , action = match[1]
    , data = JSON.parse(input)

  if(action === 'rename') {
    var oldName = path.resolve(localRoot, data.oldName)
      , newName = path.resolve(localRoot, data.newName)


    console.log('SERVER localRoot', localRoot)
    console.log('SERVER rename from to', oldName, newName)

    //temporarily unwatch file to prevent fs.watch firing
    this.client.ignorePath(oldName)

    fs.rename(oldName, newName, function (err) {
      if(err) {
        res.writeHead(500)

        var msg = util.format('rename from `%s` to `%s` failed.', oldName, newName)
        res.end(msg)
        throw err
      }
      console.log('renamed :)))')
      process.nextTick(function () {
        self.client.ignorePath(newName)
      })

      //update cache
      self.client.cache[newName] = self.client.cache[oldName]
      delete self.client.cache[oldName]

      self.client.rewatchPath(newName)
      res.end()
    })
  }
}
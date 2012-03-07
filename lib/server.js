/**
 * Node rsync server
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */
var crypto = require('crypto')
  , EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , https = require('https')
  , path = require('path')
  , util = require('util');

//
//  grab credentials
//
var privateKey = fs.readFileSync('../credentials/privatekey.pem').toString()
  , certificate = fs.readFileSync('../credentials/certificate.pem').toString();

//
//  regex to grab the route & params
//
var route = /\/sync\/(.+)|(\/sync)/;

//
//  options
//  -roots    array of absolute paths that are accessible roots
//
//
var Server = module.exports = function (options) {
  var self = this;
  this.options = options;

  function handleRequest(req, res) {
    var match = route.exec(req.url);
    if(!match) {
      res.writeHead(404);
      res.end();
      return;
    }
    self.sync(req, res, match);
  };

  var creds = { key: privateKey, cert: certificate };

  this.server = https.createServer(creds, handleRequest);
};

util.inherits(Server, EventEmitter);

Server.prototype.listen = function (port) {
  port = port || this.options.port;
  this.server.listen(port);
  console.log('SERVER: listening @ port', port)
  return this;
};

Server.prototype.sync = function (req, res, match) {
  var path = match[1]
    , roots = this.options.roots;

  console.log('SERVER: sync PATH:', path);
  console.log('SERVER roots', roots)

  for(var i = 0, j = roots.length; i < j; i++) {
    console.log('SERVER root', roots[i])
  }

  fs.readFile(path, function (err, data) {
    if(err) throw err;
   
    console.log('data', data.toString());
  });


  res.writeHead(200);
  res.end();
};
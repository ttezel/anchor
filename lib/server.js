/**
 * Node rsync server
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */
var crypto = require('crypto')
  , fs = require('fs')
  , https = require('https');

//
//  grab credentials
//
var privateKey = fs.readFileSync('../credentials/privatekey.pem').toString()
  , certificate = fs.readFileSync('../credentials/certificate.pem').toString();

//
//  regex to grab the route & params
//
var route = /\/sync\/(.+)|(\/sync)/;

var Server = module.exports = function () {
  var self = this;

  function handleRequest(req, res) {
      var match = route.exec(req.url);

      if(!match) {
        res.writeHead(404);
        res.end();
        return;
      }
      self.sync(req, res, match);
  };

  var opts = { key: privateKey, cert: certificate };

  this.server = https.createServer(opts, handleRequest);
};

Server.prototype.sync = function (req, res, match) {
  var path = match[1];
  console.log('sync PATH:', path)
  res.writeHead(200);
  res.end();
};

Server.prototype.listen = function (port) {
  if(!port) throw new Error('Server: must specify port to listen on.')
  this.server.listen(port);
  console.log('Server: listening @ port', port)
};
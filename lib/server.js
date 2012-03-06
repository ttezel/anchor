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
  , https = require('https')
  , path = require('path')
  , findit = require('findit')
  , DB = require('./db');

//
//  grab credentials
//
var privateKey = fs.readFileSync('../credentials/privatekey.pem').toString()
  , certificate = fs.readFileSync('../credentials/certificate.pem').toString();

//
//  regex to grab the route & params
//
var route = /\/sync\/(.+)|(\/sync)/;

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
  this.db = new DB();
  this.indexFiles();
};

Server.prototype.listen = function (port) {
  port = port || this.options.port;
  this.server.listen(port);
  console.log('Server: listening @ port', port)
  return this;
};

Server.prototype.sync = function (req, res, match) {
  var path = match[1];
  console.log('sync PATH:', path);
  res.writeHead(200);
  res.end();
};

Server.prototype.indexFiles = function () {
  var self = this;

  this.options.roots.forEach(function (root) {
    var rootPath = path.resolve(__dirname, root)
      , finder = findit.find(rootPath);

    finder.on('file', function (file, stat) {
      fs.readFile(file, function (err, data) {
        if(err) throw err;
        self.db.addFile(file, data, function (err, reply) {
          if(err) throw err;
        });
      });
    });
    finder.on('end', function () {
      console.log('traversal complete for root:', root);
    });
  });
};
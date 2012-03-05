/**
 * Node rsync client
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */
var https = require('https');

var Client = function (opts) {
  this.opts = opts;
};

module.exports = Client;

Client.prototype.get = function (path) { this.request('GET', path); };
Client.prototype.post = function (path) { this.request('POST', path); };

Client.prototype.request = function (method, path) {
  this.opts.method = method;
  this.opts.path = path;

  var req = https.request(this.opts, function (res) {
    console.log('statusCode:', res.statusCode);
    res.on('data', function (d) { console.log('data', d.toString()) });
  });
  req.on('error', function (e) {
    console.log('https client request error:', e)
  });
  req.end();
};
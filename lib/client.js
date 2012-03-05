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

//
//  make sync request
//
Client.prototype.sync = function (path) {
  this.opts.path = path;
  this.opts.method = 'POST';

  var req = https.request(this.opts, function (res) {
    console.log('statusCode:', res.statusCode);
    res.on('data', function (d) { console.log('data', d.toString()) });
  });
  req.on('error', function (e) {
    console.log('https client request error:', e)
  });
  req.end();
};
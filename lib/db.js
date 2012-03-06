/**
 * Node rsync server
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 *
 */

var redis = require('redis');



var DB = function () {
  this.client = redis.createClient();
  this.registerEvents();
};

module.exports = DB;

DB.prototype.registerEvents = function () {
  this.client.on('error', this.handleError);
};

DB.prototype.handleError = function (e) {
  console.log('REDIS CLIENT error:', e)
};

//
//  cb has signature fn(err, reply)
//  
DB.prototype.addFile = function (path, contents, cb) {
  this.client.set(path, contents, cb);
};

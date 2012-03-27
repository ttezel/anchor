/**
 * Node rsync client
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 *
 * Client watches the local fs, and performs sync requests
 * to update remote files
 *
 */

var EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , https = require('https')
  , path = require('path')
  , util = require('util')
  , findit = require('findit')
  ;

var Client = function (opts) {
  this.opts = opts
  this.cache = {}
  this.ignoreChanges = []
}

util.inherits(Client, EventEmitter)

module.exports = Client;

//
//  watch root for changes, make sync requests onChange
//
Client.prototype.watchRoot = function () {
  var localRoot = this.opts.localRoot
  this.watchPath(localRoot, true)
  return this
}

//
//  watch @fpath, recursively if @recursive is true
//
Client.prototype.watchPath = function (fpath, recursive) {
  var self = this
  //watch top level fpath
  fs.watch(fpath, function (event, filename) {
    var fullpath = path.resolve(fpath, filename)
    if(self.ignoreChanges.indexOf(fullpath) !== -1) return;
    return self.sync(event, fullpath)
  })
  if(!recursive) return

  //walk down fpath and watch contained dirs
  var finder = findit.find(fpath)
  finder.on('directory', function (dir, stat) {
    fs.watch(dir, function (event, fname) {
      var fullpath = path.resolve(dir, fname)
      if(self.ignoreChanges.indexOf(fullpath) !== -1) return;
      return self.sync(event, fullpath)
    })
  })

  //keep cache of stats for handling renames
  finder.on('path', function (file, stat) {
    self.cache[stat.ino] = { file: file, stat: stat }
  })

  finder.on('end', function () {
    self.emit('ready')
  })
}

//
//  ignore changes to fpath
//
Client.prototype.ignorePath = function (fpath) {
  this.ignoreChanges.push(fpath)
}

Client.prototype.rewatchPath = function (fpath) {
  var index = this.ignoreChanges.indexOf(fpath)
  if(index !== -1) {
    this.ignoreChanges.splice(index, 1)
  }
}

Client.prototype.updateCache = function (fpath) {
  var self = this
  fs.stat(fpath, function (err, stats) {
    if(err) throw err
    self.cache[stats.ino] = { file: fpath, stat: stats }
  })
}

//  
//  @path   absolute path to file/folder
//
Client.prototype.sync = function (event, fname) {
  var self = this
    , exists = path.existsSync(fname)

  if(!exists) return;  //file has been renamed again

  var reqOpts = {
      host: this.opts.host
    , port: this.opts.remotePort
    , method: 'POST'
    , path: '/' + event
  }

  var req = https.request(reqOpts, function (res) {
    //console.log('statusCode:', res.statusCode)
    res.on('data', function (d) { console.log('data', d.toString()) })
  })
  req.on('error', function (e) {
    console.log('https client request error:', e)
  })

  if(event === 'rename') {
    fs.stat(fname, function (err, stats) {
      if(err) throw err
      var cached = self.cache[stats.ino]
      if(!cached) throw new Error('renamed file was not cached')

      var localRoot = self.opts.localRoot

      var data = {
          oldName: path.relative(localRoot, cached.file)
        , newName: path.relative(localRoot, fname)
      }

      console.log('CLIENT: ', self.opts.localPort, data.oldName, data.newName)

      req.end(JSON.stringify(data))

      //update cache
      self.cache[stats.ino] = { file: fname, stat: stats}
    })
  }
}
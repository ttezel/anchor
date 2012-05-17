/**
 * Node rsync client
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 *
 * Client watches the local fs, and performs synchronization
 * requests to remote to update their files
 *
 */

var EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , https = require('https')
  , path = require('path')
  , util = require('util')
  , findit = require('findit')

module.exports = Client

//
//  emit `ready` once all local files are watched and cached
//
function Client (opts) {
  if(!opts.localRoot) throw new Error('must specify `localRoot`')
  EventEmitter.call(this)

  this.opts = opts
  this.cache = {}
  this.ignoreChanges = []
  
  //watch localRoot recursively and notify remote of updates
  this.watchPath(opts.localRoot, true) 
}
util.inherits(Client, EventEmitter)

//
//  watch @fpath for changes (recurses thru @fpath)
//  emit `ready` when done
//
Client.prototype.watchPath = function (fpath) {
  var self = this

  //watch @dir for renames only, call #updateRemote on a change
  function watchDir (dir) {
    return fs.watch(dir, function (event, filename) {
      if (!filename) return console.log('\nfs.watch: no filename emitted')
      if ('rename' === event) {
        var abspath = path.resolve(dir, filename)
        console.log('rename of:', abspath)
        if (self.ignoreChanges.indexOf(abspath) === -1)
          return self.updateRemote(event, abspath)
      } else if ('change' === event) {
        return console.log('file contents change to', filename)
      }
    })
  }

  //cache top level dir's stats
  fs.stat(fpath, function (err, stat) {
    if (err) throw err
    self.cache[stat.ino] = { fpath: fpath, stat: stat }
  })
  //watch top level dir
  watchDir(fpath)

  //recursively walk down @fpath and track contained files
  var finder = findit.find(fpath)
  finder.on('directory', function (dir, stat) {
    self.cache[stat.ino] = { fpath: dir, stat: stat }
    watchDir(dir)
  })
  finder.on('file', function (file, stat) {
    self.cache[stat.ino] = { fpath: file, stat: stat }
    return fs.watch(file, function (event, filename) {
      console.log('watched file %s had a %s event', filename, event)
      if (self.ignoreChanges.indexOf(file) === -1)
        return self.updateRemote(event, file)
    })
  })
  finder.on('end', function () { self.emit('ready') })
  return this
}

//
//  ignore changes to fpath
//
Client.prototype.ignorePath = function (fpath) {
  this.ignoreChanges.push(fpath)
}

Client.prototype.unignorePath = function (fpath) {
  var index = this.ignoreChanges.indexOf(fpath)
  if(index !== -1) this.ignoreChanges.splice(index, 1)
}

//  
//  @event    event emitted by fs.watch (`rename` or `change`)
//  @fname    absolute path to file/folder
//
Client.prototype.updateRemote = function (event, fname) {
  var self = this
    , exists = path.existsSync(fname)

  //file has been deleted or renamed - do nothing
  if(!exists) return

  var reqOpts = {
      host: this.opts.host
    , port: this.opts.remotePort
    , method: 'POST'
    , path: '/' + event
  }

  var req = https.request(reqOpts, function (res) {
    if (res.statusCode !== 200) console.log('res.statusCode', res.statusCode)
    res.on('data', function (d) { console.log('data', d.toString()) })
  })
  req.on('error', function (e) {
    console.log('https client request error:', e)
  })

  //send synchronization instructions to remote
  //then update local cache
  switch(event) {
    case 'rename':
      fs.stat(fname, function (err, stat) {
        if (err) throw err
        var cached = self.cache[stat.ino]
        if (!cached) throw new Error('renamed file was not cached')

        var localRoot = self.opts.localRoot

        var data = {
            oldName: path.relative(localRoot, cached.fpath)
          , newName: path.relative(localRoot, fname)
        }

        console.log('cached.fpath', cached.fpath)

        console.log('oldName', data.oldName)
        console.log('newName', data.newName)

        console.log('CLIENT: %s rename `%s` to `%s`', self.opts.localPort, data.oldName, data.newName)

        req.end(JSON.stringify(data))

        //update cache
        self.cache[stat.ino] = { fpath: fname, stat: stat }
      })
      break
    case 'change':
      console.log('CLIENT: content change')
      break
    default:
      throw new Error('CLIENT: event `' + event + '` is not supported')
  }
}
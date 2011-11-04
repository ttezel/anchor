var fs = require('fs')
  , vows = require('vows')
  , assert = require('assert')
  , rsync = require('../lib/node-rsync.js');
  
var clientFilePath = './lib/files/hello-client.txt'
  , serverFilePath = './lib/files/hello-server.txt'; 

//
//  Overwrite file contents of @path (string) with @contents (string)
//  Checks if path is an allowed path, so you can't overwrite important files
//
var fileOverwrite = function(path, contents, callback) { 

  //allowed paths
  var allowed = [
      './lib/files/hello-server.txt'
    , './lib/files/hello-client.txt' 
  ];
  
  if(allowed.indexOf(path) === -1) { return; }  //nuh-uh!
  
  fs.open(path,  'w+', function (err, fd) {
    if (err) {
      return callback(err);
    }
    
    fs.truncate(fd, 0, function(err) {
      if (err) {
        return callback(err);
      }
      
      fs.writeFile(path, contents, callback);
    });
  });
};

//
//  Helper for basic Rsync testing
//  Overwrite @clientPath with @clientContents
//  Overwrite @serverPath with@serverContents
//  When all this is done, call @callback
//
var RsyncWrite = function(clientPath, clientContents, serverPath, serverContents, callback) {
  fileOverwrite(clientPath, clientContents, function(err, written) {
    if(err) callback(err);
    
    fileOverwrite(serverPath, serverContents, function(err, written) {
      if(err) callback(err);
      
      rsync.chunk(serverPath, false, function (err, chunkData) {
        if(err) callback(err);
        
        var checksums = rsync.checksum(chunkData);
        
        rsync.search(clientPath, checksums,
          callback
        );
      });
    });
  });  
};

//Rsnyc tests
vows.describe('Rsync - updating server file').addBatch({
  'single chunk of size chunkSize in middle': {
    topic: function() {
      var self = this;
      
      var clientContents = 'aabbqqcc'
        , serverContents = 'aabbcc'
      
      RsyncWrite(
          clientFilePath
        , clientContents
        , serverFilePath
        , serverContents
        , function(err, outgoing) {
          if(err) throw err;
          self.callback(null, outgoing.data.toString())
      });
    }, 

    'diffence is just that block': function(topic) {
      assert.equal('qq', topic);
    }
  }
}).run();
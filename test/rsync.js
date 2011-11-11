var fs = require('fs')
  , vows = require('vows')
  , assert = require('assert')
  , rsync = require('../lib/node-rsync');
 
//test helpers - create TEST API
 
var allow = [
    '../lib/files/client.txt'
  , '../lib/files/server.txt'   
];
 
//upper bounds on file sizes
var levels = [
  10, 20, 30, 50, 70, 100, 150, 200, 500, 750, 1000, 5000, 1000000, 5000000
];
 
function randString(length) {
  var chars = '0123456789QWERTYUIOPASDFGHJKLZXCVBNM'
    , str = '';
   
  for(var i = 0; i < length; i++) {
    var index = Math.floor(Math.random()*chars.length)
    str += chars[index];
  }
  return str;
};
 
//writes to server.txt
function oldFile(level, callback) {
  var path = allow[1];  //server.txt
   
  var from = level === 0 ? 1 : levels[level - 1]
    , to = levels[level];
       
  var size = Math.floor(from + Math.random()*(to - from + 1))
    , contents = randString(size);
 
  fs.writeFileSync(path, contents);
  return callback(null);
};
 
//writes modified file contents to client.txt
function newFile(mode, level, callback) {
  var oldpath = allow[1]  //server.txt
    , newpath = allow[0] //client.txt
    , modified = fs.readFileSync(oldpath, 'utf-8');
 
  switch(mode) {
    case 0: //prepend
      modified = 'tolga Prepend test ' + modified;
      break;
    case 1: //append
      break;
    case 2: //modify middle contents
      break;
    case 3: //delete stuff
      break;
    case 4: //just go wild (mix of other modes)
      break;
  }
 
  fs.writeFileSync(newpath, modified); 
  return callback(null);
}
 
function runRsync(blocksize, callback) {
    var sync = rsync.createRSync('../lib/files', blocksize);
   
    sync.checksum('/server.txt', function (err, results) {
        if(err) { callback(err); }
       
        var t1 = Date.now();
        sync.diff('/client.txt', results, function (err, diff) {
            if(err) { callback(err); }
           
            var t2 = Date.now();
            sync.sync('/server.txt', diff, function(err, synced) {
                if(err) { callback(err); }

                var t3 = Date.now();
                     
                console.log('tot. time: %d, sync time: %d', t3-t1, t3-t2);
                return callback(null, synced);
            });
        });
    });
};
 
 
//Rsync test batches
var tests = vows.describe('Rsync tests');
 
for(var i = 0; i < 1; i++) {
 
  (function() {
    var level = i;
   
    tests.addBatch({
      'file test': {
        topic: function() {
          var self = this;
         
          oldFile(level, function(err) {
            if (err) { throw err; }
           
            //0 is mode (loop thru the modes)
            newFile(0, level, function(err) {
              if (err) { throw err; }

              //4 is block size used in Rsync (loop thru different block sizes)
              runRsync(4, self.callback);
            });
          });
        },
        'sync matches file contents': function(err, result) {
          console.log('result', result);
         
          //var ref = fs.readFileSync(allow[0]); //client contents
         
          //console.log('ref', ref);
          //console.log('result', result);
         
          //assert.equal(ref, result);
        }
      }
    });
  }).call(this);
}
 
tests.run();
 
/*
var level = 0;
 
oldFile(level, function(err) {
    if (err) { throw err; }
    console.log('done server.txt stuff');
   
    newFile(0, level, function(err) {
      if (err) { throw err; }
      console.log('done client.txt stuff');
      runRsync(4, function(err, synced) {
        console.log('done rsync stuff');
      });
    });
});
*/
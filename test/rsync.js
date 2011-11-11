var fs = require('fs')
  , vows = require('vows')
  , assert = require('assert')
  , rsync = require('../lib/node-rsync')
  , colors = require('colors');
 
var allow = [
    '../lib/files/client.txt'
  , '../lib/files/server.txt'   
];
 
//upper bounds on file sizes
(function() {
    levels = [];

    for(var i = 0; i < 24; i++) {
      levels.push(1 << i);
    }

    return levels;
}).call(this);

//modify modes
modes = [
    'prepend'
  , 'append'
  , 'middle'
  , 'delete'
  , 'wild'
];

//inclusive max
function rand(max) {
  return Math.floor(Math.random()*(max+1));
}

//range, inclusive on both ends
function randRange(min, max) {
  return Math.floor(min + Math.random()*(max+1 - min));
}
 
function randString(length) {
  var str = ''
  , min = 40
  , max = 126;
  
  for(var i = 0; i < length; i++) {
    var index = randRange(min, max);
    str += String.fromCharCode(index);
  }
  return str;
};
 
//writes to server.txt
function oldFile(level, callback) {
  var path = allow[1]
    , min = level === 0 ? 1 : levels[level - 1]
    , max = levels[level];
       
  var size = randRange(min, max)
    , contents = randString(size);
 
  fs.writeFileSync(path, contents);
  return callback(null);
};

//file modification helpers

function prepend(old, size) {
  return randString(size) + old;
};

function append(old, size) {
  return old + randString(size);
};

function middle(old, size) {
  var mods = randString(size)
    , k = randRange(1, old.length-2);

  return old.substr(0,k) + mods + old.substr(k+1);
};

function remove(old) {
  var min = randRange(0, old.length)
    , max = randRange(min, old.length);

    return old.substr(0,min) + old.substr(max);
}

function randomMode(modified, size) {
    var choices = [
        prepend
      , append
      , middle
      , remove
    ];
    
    var fn = choices[rand(choices.length-1)];   
    return fn.call(null, modified, size); 
};
 
//writes modified file contents to client.txt
//changes are based on mode
function newFile(mode, callback) {
  var oldpath = allow[1]  //server.txt
    , newpath = allow[0] //client.txt
    , old = fs.readFileSync(oldpath, 'utf-8');
 
  var size = rand(old.length)
    , numChanges = rand(old.length);

  //add colors dev dependency
  console.log('mode: %s (%d)'.green, modes[mode], mode);
  
  if(mode > 1) {
    console.log('# of changes: %d'.cyan, numChanges); 
  }

  console.log('filesize: %d Bytes'.bold, fs.readFileSync(oldpath).length);

  var modified = old;

  switch(mode) {
    case 0:
        modified = prepend(modified, size);
        break;
    case 1:
        modified = append(modified, size);
        break;
    case 2:
        for(var i = 0; i < numChanges; i++) {
            modified = middle(modified, size);
        }
        break;
    case 3:
        for(var i = 0; i < numChanges; i++) {
            modified = remove(modified); 
        }
        break;
    case 4:  //hybrid of the other modes
        for(var i = 0; i < numChanges; i++) {
            modified = randomMode(modified, size);
        }
        break;
    default:
        callback(new Error('mode not supported '+mode.toString()));
  }

  fs.writeFileSync(newpath, modified);

  fs.stat(newpath, function(err, stats) {
      if(err) { return callback(err); }
      return callback(null);
  });
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
                
                console.log('tot. time:', t3-t1, 
                            'sync time:', t3-t2, 
                            'diff time:', t2-t1);
                console.log('-----------------------'
                          + '-----------------------');

                return callback(null, synced);
            });
        });
    });
};
 
 
//test batches
(function() {
  var tests = vows.describe('Rsync tests');
 
  for(var i = 0; i < levels.length; i++) {  //file size (level)
      for(var j = 0; j < modes.length; j++) {  //mode
          (function() {
            var level = i
              , mode = j;
           
            tests.addBatch({
                'file test': {
                    topic: function() {
                        var self = this;
                       
                        oldFile(level, function(err) {
                            if (err) { throw err; }
                           
                            newFile(mode, function(err) {
                                if (err) { throw err; }

                                //TODO: use different blocksizes
                                runRsync(750, self.callback);
                            });
                        });
                    },
                    'sync matches file contents': function(err, result) {
                        var client = fs.readFileSync(allow[0], 'utf-8');
                        assert.equal(client, result.toString());
                    }
                }
            });
          }).call(this); 
      }
  }
  tests.export(module);
  return tests;
}).call(this);
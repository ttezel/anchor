var fs = require('fs')
  , vows = require('vows')
  , assert = require('assert')
  , colors = require('colors')
  , helper = require('./helper')
  , rsync = require('../lib/node-rsync');

//modify modes
var modes = [
    'prepend'
  , 'append'
  , 'middle'
  , 'remove'
  , 'hybrid'
];
 
function runRsync(blocksize, callback) {
    var sync = rsync.createRSync('../lib/files', blocksize)
      , t0 = Date.now();

    sync.checksum('/server.txt', function (err, results) {
        if(err) { callback(err); }
       
        var t1 = Date.now();
        sync.diff('/client.txt', results, function (err, diff) {
            if(err) { callback(err); }
           
            var t2 = Date.now();
            sync.sync('/server.txt', diff, function(err, synced) {
                if(err) { callback(err); }
 
                var t3 = Date.now();
                console.log(  'tot. time:'    , t3-t0
                            , 'sync time:'    , t3-t2
                            , 'diff time:'    , t2-t1
                            , 'chksum time:'  , t1-t0
                );
                console.log('---------------------------------'
                          + '---------------------------------');
                     
                return callback(null, synced);
            });
        });
    });
};

// 
//  test batch creation
//
var tests = vows.describe('Rsync tests')
  , numlevels = helper.levels.length
  , numModes = modes.length
  , blk = 750;

for(var level = 0; level < numlevels; level++) {
   
  for(mode = 0; mode < numModes; mode++) {
    (function() {    
      var lvl = level
        , m = mode;

      tests.addBatch({
        'file test': {
          topic: function() {
            var self = this
              , cur = lvl+m
              , tot = numlevels*numModes;
           
            console.log('Test %d of %d', cur, tot);
            console.log('mode: %s'.green, modes[m]);
            console.log('blocksize: %d', blk);
          
            helper.oldFile(lvl, function(err) {
              if (err) { throw err; }       
              
              helper.newFile(m, function(err) {
                if (err) { throw err; }
                   
                runRsync(blk, self.callback);
              });
            });
          },
          'sync matches newFile': function(err, result) {
            if(err) { throw err; }
            
            var client = fs.readFileSync(helper.allow[0], 'utf-8');
            assert.equal(client, result.toString());
          }
        }
      });
    }).call(this);
  }
}
tests.export(module);
var async = require('async')
  , fs = require('fs')
  , util = require('util')
  , sys = require('sys');

var Rsync = function() {
  this.streamOpts = {
    bufferSize: 500   //S
  };
  this.blocks = []; //blocks of size bufferSize
  this.weakChkSums = [];
  this.strongChkSums = [];
};

Rsync.prototype.send = function(filename) {
  var self = this;
  
  //create stream
  fs.createReadStream(filename, this.streamOpts)
    .on('error', function (err) {
      sys.puts('err', err);
    })
    .on('data', function (buff) {
      self.blocks.push(buff);
    })
    .on('end', function () {
      self.getWeakChkSum();
    });
  
  return this;
};

//calculate weak checksum for each block
Rsync.prototype.getWeakChkSum = function() {
  var self = this, a = [], b = [];

  async.series([
      function(cb) {
        self.blocks.forEach(function(buff, blockNum) {
          var len = buff.length, lastOffset = len - 1;
          
          //calculate block 'a' value
          a[blockNum] = 0;
          for(var i = 0; i < len; i++) {  //iterate byte-by-byte
            a[blockNum] += buff[i];     
          }
          
          //calculate block 'b' value
          b[blockNum] = 0;
          for(var i = 0; i < len; i++) {
            b[blockNum] += (lastOffset - i + 1)*buff[i];      
          }
        });
        
        cb(null);
      }
    , function (cb) {
        a = a.map(function(sum) { return sum%self.streamOpts.bufferSize });
        b = b.map(function(sum) { return sum%self.streamOpts.bufferSize });
        
        cb(null);
      }
    , function() {
      var numBlocks = self.blocks.length;
  
      for(var i = 0; i < numBlocks; i++) {
        self.weakChkSums[i] = a[i] + b[i]*Math.pow(2,16);   
      }
    }
  ]);

  return this;
};

var rsync = new Rsync().send('file.html');
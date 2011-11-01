var fs = require('fs')
  , util = require('util')
  , sys = require('sys');

var Rsync = function() {
  this.streamOpts = {
    bufferSize: 500   //S
  };
  this.weakChkSums = [];
  this.strongChkSums = [];
};

Rsync.prototype.send = function(filename) {
  var self = this;

  //file is split into blocks of size blockSize
  this.blocks = [];
  
  //create stream
  var fStream = fs.createReadStream(filename, this.streamOpts);
  
  fStream.on('error', function (err) {
    sys.puts('err', err);
  });
  fStream.on('data', function (buff) {
    self.blocks.push(buff);
  });
  fStream.on('end', function () {
    self.getWeakChkSum();
  });
  return this;
};

//calculate weak checksum for each block
Rsync.prototype.getWeakChkSum = function() {
  var self = this, a = [], b = [];
  
  this.blocks.forEach(function(buff, blockNum) {    //calculate 'a' for each block
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
  //TODO: establish flow control for doing mapping functions last
  a = a.map(function(sum) { return sum%self.streamOpts.bufferSize });
  b = b.map(function(sum) { return sum%self.streamOpts.bufferSize });
  
  var numBlocks = this.blocks.length;
  
  for(var i = 0; i < numBlocks; i++) {
    this.weakChkSums[i] = a[i] + b[i]*Math.pow(2,16);   
  }
  
  console.log('a', a, 'b', b, 'weakChkSums', this.weakChkSums);
};

var rsync = new Rsync().send('file.html');
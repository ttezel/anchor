//
//  File Helpers for Test Suite
//
var colors = require('colors')
  , fs = require('fs');

//  inclusive max
function rand (max) {
  return Math.floor(Math.random()*(max+1));
};

//  range, inclusive on both ends
function randRange (min, max) {
  return Math.floor(min + Math.random()*(max+1 - min));
};

//  random string
function randString (length) {
  var str = ''
    , min = 40
    , max = 126;
 
  for(var i = 0; i < length; i++) {
    var index = randRange(min, max);
    str += String.fromCharCode(index);
  }
  return str;
};

function populatelevels () {
  levels = [];   
  for(var i = 0; i < 24; i++) {
    levels.push(1 << i);
  } 
  return levels;
};

//
//  Helper
//
Helper = function() {
  this.allow = [
      '../lib/files/client.txt'
    , '../lib/files/server.txt'  
  ];
  this.levels = populatelevels();
};

Helper.prototype = {
  //
  //  file modification helpers 
  //
  prepend: function (old, size) {
    return randString(size) + old;
  }, 
  append: function (old, size) {
    return old + randString(size);
  },
  middle: function (old, size) {
    var mods = randString(size)
      , k = randRange(1, old.length-2);
   
    return old.substr(0,k) + mods + old.substr(k+1);
  }, 
  remove: function (old) {
    var min = randRange(0, old.length)
      , max = randRange(min, old.length);
   
    return old.substr(0,min) + old.substr(max);
  },
  randomMode: function (modified, size) {
    var choices = [
        this.prepend
      , this.append
      , this.middle
      , this.remove
    ];
   
    var fn = choices[rand(choices.length-1)];  
    return fn.call(null, modified, size);
  },
  //writes to server.txt
  oldFile: function (level, callback) {
    var path = this.allow[1] //server.txt
      , min = level === 0 ? 1 : this.levels[level - 1]
      , max = this.levels[level];
        
    var size = randRange(min, max)
      , contents = randString(size);
    
    fs.writeFileSync(path, contents);
    return callback(null);
  },
  //writes modified file contents to client.txt
  newFile: function (mode, callback) {
    var oldpath = this.allow[1]  //server.txt
      , newpath = this.allow[0] //client.txt
      , raw = fs.readFileSync(oldpath);

    console.log('old filesize: %d Bytes'.bold, raw.length);
    
    var old = raw.toString()
      , modsize = rand(old.length)
      , numChanges = rand(old.length/2);
   
    if(mode > 1) {
      console.log('# of changes: %d'.cyan, numChanges);
    }
   
    var modified = old;
   
    switch(mode) {
      case 0: 
          modified = this.prepend(modified, modsize);
          break;
      case 1:
          modified = this.append(modified, modsize);
          break;
      case 2:
          for(var i = 0; i < numChanges; i++) {
              modified = this.middle(modified, modsize);
          }
          break;
      case 3:
          for(var i = 0; i < numChanges; i++) {
              modified = this.remove(modified);
          }
          break;
      case 4:  //hybrid
          for(var i = 0; i < numChanges; i++) {
              modified = this.randomMode(modified, modsize);
          }
          break;
      default:
          callback(new Error('mode not supported: '+mode.toString()));
    }

    raw = new Buffer(modified);
    console.log('new filesize: %d Bytes'.bold, raw.length);
    
    fs.writeFileSync(newpath, raw);
  
    return callback(null);
  } 
};

module.exports = new Helper();
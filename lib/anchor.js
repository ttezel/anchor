/**
 * Anchor
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var Server = require('./server')
  , Client = require('./client');

//
//  options keys:
//  -roots (string array)  relpaths to allow sync access (defaults to ../files)
//  -blockSize (defaults to 750)
//  -port (defaults to 8080)
//  
function Anchor(options) {
  if(options && typeof options !== 'object') throw new Error('Anchor options must be Object');
  options = options || {};
  // folder roots
  options.blockSize = options.blockSize || 750;
  options.port = options.port || 8080;

  if(typeof options.roots === 'string') { 
    options.roots = [options.roots]; 
  } else if(!Array.isArray(options.roots)) {
    options.roots = ['../files']; //default sync directory
  }

  this.server = new Server(options).listen();
  this.client = new Client();
};

module.exports = Anchor;
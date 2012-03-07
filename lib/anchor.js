/**
 * Anchor
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var EventEmitter = require('events').EventEmitter
  , path = require('path')
  , util = require('util')
  , Server = require('./server')
  , Client = require('./client');

//
//  options keys:
//  -roots (string array)  relpaths to allow sync access (defaults to ../files)
//  -blockSize (defaults to 750)
//  -port (defaults to 8080)
//
//  Anchor is an EventEmitter
//
//  events:
//  error, ready
//  
function Anchor(options) {
  if(options && typeof options !== 'object') throw new Error('Anchor options must be Object');
  options = options || {};
  
  options.blockSize = options.blockSize || 750;
  options.port = options.port || 8080;

  if(typeof options.roots === 'string') { 
    options.roots = [options.roots]; 
  } else if(Array.isArray(options.roots)) {
    options.roots = options.roots;
  } else {
    options.roots = ['../files']; //default sync directory
  }

  options.roots = options.roots.map(function (root) {
    return path.resolve(__dirname, root);
  });

  this.server = new Server(options).listen();
  this.client = new Client();
};

module.exports = Anchor;
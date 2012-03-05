/**
 * Anchor
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var Server = require('./server');

//
//  options keys:
//  -roots (string or array)  relpath to allow sync access (defaults to ../files)
//  -blockSize (defaults to 750)
//  -port (defaults to 8080)
//  
function Anchor(options) {
    // folder roots
    this.roots = {};
    if (Array.isArray(options.roots)) {
      options.roots.forEach(function (root) {
          this.roots[root] = 1; 
      });
    } else if (typeof options.roots === 'string') {
        this.roots[options.roots] = 1;
    } else {
        this.roots['../files'] = 1;
    }

    options.blockSize = options.blockSize || 750;
    options.port = options.port || 8080;

    this.server = new Server(options).listen();
};
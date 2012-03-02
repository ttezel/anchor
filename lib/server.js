/**
 * Node rsync server
 *
 * Copyright(c) 2011 Mihai Tomescu <matomesc@gmail.com>
 * Copyright(c) 2011 Tolga Tezel <tolgatezel11@gmail.com>
 *
 * MIT Licensed
 */

var restify = require('restify');

var Server = function () {
    var self = this;
    this.server = restify.createServer({
        name: 'rsync-server'
    });

    this.server.use(restify.queryParser());
    this.server.use(restify.bodyParser());

    this.registerRoutes();
    this.server.listen(8080, function () {
      console.log('rsync node listening @ ', self.server.url);
    });
};

Server.prototype.registerRoutes = function () {
  var server= this.server;
  server.get('/sync/:path'. function (req, res, next) {
     res.send('hit checksum') 
     return next();
  }); 
};
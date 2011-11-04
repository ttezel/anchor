var restify = require('restify')
  , static = require('node-static')
  , formidable = require('formidable');

// RSync
var rsync = require('./node-rsync.js');

// HTTP Server
var server = restify.createServer();

// File handler
var file = new static.Server('./files', { cache: 600 });

/**
 * GET /files/<path_to_file>
 *
 * Example request:
 *
 * GET /files/matomesc/myproj/file.js
 */

server.get(/^\/files\/(?:\w+\/)*(?:.+\.\w+)/, function (req, res) {
    var path = req.url.replace('/files', '')
    file.serveFile(path, 200, {}, req, res);
});

/**
 * POST /files
 *
 * Handles multipart request and saves file
 */

server.post('/files', function (req, res) {
    var form = new formidable.IncomingForm();
    return form.parse(req, function (err, fields, files) {
        res.send(200, "got upload");
    });
});

/**
 * GET /checksum/<path>
 *
 * Serve file checksums
 */
 server.get(/^\/checksum\/(?:\w+\/)*(?:.+\.\w+)/, function (req, res) {

 });

/**
 * PUT /sync/<path>
 *
 * Takes instructions to reconstruct file
 */
server.put(/^\/sync\/(?:\w+\/)*(?:.+\.\w+)/, function (req, res) {
    
});

// Listen

server.listen(8000);
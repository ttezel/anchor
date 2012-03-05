var Client = require('../lib/client')
  , Server = require('../lib/server');

var server = new Server().listen(8080);

var client = new Client({
    host: '127.0.0.1'
  , port: 8080
  , path: '/sync/'
  , method: 'GET' 
});

client.post('/sync/foo/bar');

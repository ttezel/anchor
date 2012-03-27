var Client = require('../lib/client')
  , Anchor = require('../lib/anchor');

var anchor = new Anchor({
    roots: ['../files']
});

var client = new Client({
    host: '127.0.0.1'
  , port: 8080
  , path: '/sync/'
  , method: 'POST' 
});

client.sync('/sync/../files/server.txt');

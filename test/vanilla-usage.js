var Anchor = require('../lib/anchor')

var clientAnchor = new Anchor({
    host: '127.0.0.1'
  , localPort: 8080
  , remotePort: 8081
  , roots: {
      '../sync/client': '/home/ttezel/development/anchor/sync/server'
    }
})

var serverAnchor = new Anchor({
    host: '127.0.0.1'
  , localPort: 8081
  , remotePort: 8080
  , roots: {
      '../sync/server': '/home/ttezel/development/anchor/sync/client'
    }
})
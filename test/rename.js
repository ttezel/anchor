var assert = require('assert')
  , fs = require('fs')
  , path = require('path')
  , Anchor = require('../lib/anchor')
  , Client = require('../lib/client')

  , Seq = require('seq')

//paths to rename
var from = path.resolve(__dirname, '../sync/client/synced.txt')
  , to = path.resolve(__dirname, '../sync/client/renamed.txt')

var fromNest = path.resolve(__dirname, '../sync/client/a/a-synced.txt')
  , toNest = path.resolve(__dirname, '../sync/client/a/a-renamed.txt')

//test cases
var cases = [
  //{ fn: rename, from: from, to: to }
  //, { fn: rename, from: fromNest, to: toNest }
   { fn: renameDelay, from: from, to: to }
  //, { fn: renameDelay, from: fromNest, to: toNest }
]

/*
describe('#Rename', function () {
  before(function (done) {
    var anchor = new Anchor({
        host: '127.0.0.1'
      , roots: {
          '../sync/client': '/sync/server'
        }
    })

    anchor.on('ready', function () { done() })
  })

  cases.forEach(function (test) {
    it('does not throw', function(done) {
      test.fn.call(null, test.from, test.to, function (err) {
        assert.equal(null, err)
        done()
      })
    })
  })
})
*/

//non-mocha test
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

clientAnchor.on('ready', function () {
  var test = cases[0]

  test.fn.call(null, test.from, test.to, function (err) {
    if(err) throw err
  })
})

//
//  helpers
//

//rename @from to @to, then change it back
function rename (from, to, cb) {
  fs.rename(from, to, function (err) {
    if(err) return cb(err)

    fs.rename(to, from, function (err) {
      if(err) return cb(err)
      return cb(null)
    })
  })
}

//rename @from to @to, then change it back after a timeout
function renameDelay (from, to, cb) {
  fs.rename(from, to, function (err) {
    if(err) return cb(err)

    setTimeout(function () {
      fs.rename(to, from, function (err) {
        if(err) return cb(err)
        
        return cb(null)
      })
    }, 1000)
  })
}
var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../lorawan-keys.js");

exports.keys = "{\"12345678\":{\"nsw\":\"00000000000000000000000000000000\",\"asw\":\"123456789abcdef00000000000000000\",\"type\":\"foo\",\"name\":\"Foo 1\"},\"0000abcd\":{\"nsw\":\"00000000000000000000000000000000\",\"asw\":\"00000000000000000000000000000000\",\"type\":\"bar\",\"name\":\"Bar 1\"}}";

describe( 'lorawan-keys Node', function () {
    "use strict";

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function(done) {
      helper.unload().then(function() {
          helper.stopServer(done);
      });
  });

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "lorawan-keys", keys:exports.keys, name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('keys').which.is.an.Object();
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should find device keys', function (done) {
    var flow = [{ id: "n1", type: "lorawan-keys", keys:exports.keys, name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        var r = n1.getKey( "12345678" );
        r.should.be.an.Object();
        r.nsw.should.be.eql( '00000000000000000000000000000000');
        r.asw.should.be.eql( '123456789abcdef00000000000000000');
        r.type.should.be.eql('foo');
        r.name.should.be.eql('Foo 1');
        //
        r = n1.getKey( "0000abcd" );
        r.should.be.a.Object();
        r.nsw.should.be.eql( '00000000000000000000000000000000');
        r.asw.should.be.eql( '00000000000000000000000000000000');
        r.type.should.be.eql('bar');
        r.name.should.be.eql('Bar 1');
        //
        r = n1.getKey( "ffffffff" );
        should.not.exist( r );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should find device addresses', function (done) {
    var flow = [{ id: "n1", type: "lorawan-keys", keys:exports.keys, name: "test" }];
    helper.load(node, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        var r = n1.name2addr( "Foo 1" );
        r.should.be.eql( "12345678" );
        //
        r = n1.name2addr( "Bar 1" );
        r.should.be.eql( "0000abcd" );
        //
        r = n1.name2addr( "Charlie" );
        should.not.exist( r );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

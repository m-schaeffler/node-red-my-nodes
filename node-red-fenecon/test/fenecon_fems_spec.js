var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../fenecon_fems.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'fenecon_fems Node', function () {
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
    var flow = [{ id: "n1", type: "feneconFems", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('hostname', "");
        n1.should.have.a.property('user', "owner");
        n1.should.have.a.property('password', "owner");
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have data', function (done) {
    var flow = [{ id: "n1", type: "feneconFems", hostname:"fems.lan", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('hostname', "fems.lan");
        n1.should.have.a.property('user', "owner");
        n1.should.have.a.property('password', "owner");
        n1.should.have.a.property('httpRequest').which.is.a.Function();
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have a mutex', function (done) {
    var flow = [{ id: "n1", type: "feneconFems", hostname:"fems.lan", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('hostname', "fems.lan");
        n1.should.have.a.property('user', "owner");
        n1.should.have.a.property('password', "owner");
        n1.should.have.a.property('httpMutex').which.is.an.Object();
        let c1 = 0;
        let c2 = 0;
        let c3 = 0;
        await delay(50);
        n1.httpMutex.withLock( async function(){
          c1++;
          await delay(500);
          c1++;
        } );
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 0 );
        n1.httpMutex.withLock( async function(){
          c2++;
          await delay(500);
          c2++;
        } );
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 0 );
        await delay(10);
        c1.should.match( 1 );
        c2.should.match( 0 );
        c3.should.match( 0 );
        await delay(450);
        c1.should.match( 1 );
        c2.should.match( 0 );
        c3.should.match( 0 );
        await delay(50);
        c1.should.match( 2 );
        c2.should.match( 1 );
        c3.should.match( 0 );
        await n1.httpMutex.withLock( async function(){
          c3++;
          await delay(10);
          c3++;
        } );
        c1.should.match( 2 );
        c2.should.match( 2 );
        c3.should.match( 2 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

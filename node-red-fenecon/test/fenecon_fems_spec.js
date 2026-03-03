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
        n1.should.have.a.property('auth').which.is.a.String();
        await delay(50);
        var r = n1.httpUrl("Foo/Bar");
        r.should.be.a.String();
        await delay(50);
        r = n1.httpOptions();
        r.should.be.an.Object();
        r.should.have.a.property('headers');
        r.should.have.a.property('method','GET');
        r.should.have.a.property('signal');
        r.headers.should.have.a.property('Authorization');
        await delay(50);
        r = n1.httpOptions( "Test" );
        r.should.be.an.Object();
        r.should.have.a.property('headers');
        r.should.have.a.property('method','POST');
        r.should.have.a.property('body','{"value":"Test"}');
        r.should.have.a.property('signal');
        r.headers.should.have.a.property('Authorization');
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

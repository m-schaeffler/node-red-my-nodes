var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../fenecon_http_get.js");
var nodeFems = require("../fenecon_fems.js");
require("./fenecon_fems_spec.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'fenecon_http_get Node', function () {
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
    var flow = [{ id: "n1", type: "feneconHttpGet", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems', null);
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

  it('should make a simple request', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpGet", fems: "nf", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"fems.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        try {
          msg.should.have.property('topic',"_meta/Version");
          msg.should.have.property('payload').which.is.a.String();
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        await delay(50);
        n1.receive({ topic:"_meta/Version" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should make a wildcard request', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpGet", fems: "nf", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"fems.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        try {
          msg.should.have.property('topic',"_meta/.*");
          msg.should.have.property('payload').which.is.an.Object();
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        await delay(50);
        n1.receive({ topic:"_meta/.*" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

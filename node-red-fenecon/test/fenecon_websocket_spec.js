var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../fenecon_websocket.js");
var nodeFems = require("../fenecon_fems.js");
require("./fenecon_fems_spec.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'fenecon_websocket Node', function () {
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
    var flow = [{ id: "n1", type: "feneconWebsocket", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems', null);
        n1.should.have.a.property('edge', '0');
        n1.should.have.a.property('inlist', []);
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

  const inlist = ["_sum/State","_sum/ProductionActivePower","meter0/CurrentL1","batteryInverter0/AirTemperature"];

  it('should make a request', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconWebsocket", fems: "nf", edge:"0", inlist:JSON.stringify(inlist), name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"fems.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic','currentData');
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.property('_sum/ProductionActivePower').which.is.a.Number();
          msg.payload.should.have.property('meter0/CurrentL1').which.is.a.Number();
          msg.payload.should.have.property('_sum/State').which.is.a.Number();
          msg.payload.should.have.property('batteryInverter0/AirTemperature').which.is.a.Number();
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('edge', '0');
        n1.should.have.a.property('inlist', inlist);
        n1.should.have.a.property('state','closed');
        await delay(50);
        n1.receive({ topic:"open" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('state','connected');
        c.should.match( 0 );
        await delay(2000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('state','connected');
        c.should.match( 2 );
        n1.receive({ topic:"close" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('state','closed');
        c.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle invalid URLs', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconWebsocket", fems: "nf", edge:"0", inlist:JSON.stringify(inlist), name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"foobar:lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        ++c;
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('edge', '0');
        n1.should.have.a.property('inlist', inlist);
        await delay(50);
        n1.receive({ topic:"open" });
        await delay(2000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        n1.should.have.a.property('state','error');
        c.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle invalid addresses', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconWebsocket", fems: "nf", edge:"0", inlist:JSON.stringify(inlist), name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"foobar.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        ++c;
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('edge', '0');
        n1.should.have.a.property('inlist', inlist);
        await delay(50);
        n1.receive({ topic:"open" });
        await delay(2000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        n1.should.have.a.property('state','error');
        c.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle invalid IPs', function (done) {
    this.timeout( 2500 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconWebsocket", fems: "nf", edge:"0", inlist:JSON.stringify(inlist), name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"192.168.254.254", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        ++c;
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('edge', '0');
        n1.should.have.a.property('inlist', inlist);
        await delay(50);
        n1.receive({ topic:"open" });
        await delay(2000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        n1.should.have.a.property('state','error');
        c.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

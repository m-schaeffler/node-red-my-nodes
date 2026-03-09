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
        n1.should.have.a.property('risk', false);
        n1.should.have.a.property('timeout', false);
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

  it('should subscribe data, get and set config data', function (done) {
    this.timeout( 5000 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconWebsocket", fems: "nf", edge:"0", inlist:JSON.stringify(inlist), risk:true, timeout:true, name: "test", wires: [["n2"],["n3"],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"fems.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c1 = 0;
      var c2 = 0;
      var c3 = 0;
      var mtt;
      var actualState;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic','currentData');
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.property('_sum/ProductionActivePower').which.is.a.Number();
          msg.payload.should.have.property('meter0/CurrentL1').which.is.a.Number();
          msg.payload.should.have.property('_sum/State').which.is.a.Number();
          msg.payload.should.have.property('batteryInverter0/AirTemperature').which.is.a.Number();
          ++c1;
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic','edgeConfig');
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.a.property('ctrlGridOptimizedCharge0').which.is.an.Object();
          msg.payload.ctrlGridOptimizedCharge0.should.have.a.property('properties').which.is.an.Object();
          switch( ++c2 )
          {
              case 2:
                  msg.payload.ctrlGridOptimizedCharge0.properties.should.have.a.property('manualTargetTime','11:30');
                  break;
              case 3:
                  msg.payload.ctrlGridOptimizedCharge0.properties.should.have.a.property('manualTargetTime',mtt);
                  break;
              default:
                  msg.payload.ctrlGridOptimizedCharge0.properties.should.have.a.property('manualTargetTime').which.is.a.String();
          }
          mtt ??= msg.payload.ctrlGridOptimizedCharge0.properties.manualTargetTime;
          //console.log(mtt,msg.payload.ctrlGridOptimizedCharge0.properties.manualTargetTime);
        }
        catch(err) {
          done(err);
        }
      });
      n4.on("input", function (msg) {
        console.log(msg.payload);
        c3++;
        try {
          msg.should.have.property('topic','fems');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
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
        n1.should.have.a.property('risk', true);
        n1.should.have.a.property('timeout', true);
        n1.should.have.a.property('state','closed');
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 0 );
        n1.receive({ topic:"open" });
        await delay(150);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        c1.should.match( 0 );
        c2.should.match( 1 );
        c3.should.match( 6 );
        n1.receive({ topic:"open" }); // 2nd
        await delay(50);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        c1.should.match( 0 );
        c2.should.match( 1 );
        c3.should.match( 7 );
        n1.receive({ topic:"ctrlGridOptimizedCharge0/manualTargetTime", payload:"11:30" });
        await delay(1000);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        c1.should.match( 1 );
        c2.should.match( 2 );
        c3.should.match( 7 );
        n1.receive({ topic:"ctrlGridOptimizedCharge0/manualTargetTime", payload:mtt });
        await delay(1000);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        c1.should.match( 2 );
        c2.should.match( 3 );
        c3.should.match( 7 );
        await delay(1000);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        c1.should.match( 3 );
        c2.should.match( 3 );
        c3.should.match( 7 );
        n1.receive({ topic:"close" });
        await delay(200);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'closed' );
        c1.should.match( 3 );
        c2.should.match( 3 );
        c3.should.match( 9 );
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
                { id: "n1", type: "feneconWebsocket", fems: "nf", edge:"0", inlist:JSON.stringify(inlist), name: "test", wires: [["n2"],["n3"],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"foobar:lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c1 = 0;
      var c2 = 0;
      var c3 = 0;
      var actualState;
      n2.on("input", function (msg) {
        console.log(msg);
        ++c1;
      });
      n3.on("input", function (msg) {
        console.log(msg);
        ++c2;
      });
      n4.on("input", function (msg) {
        console.log(msg.payload);
        c3++;
        try {
          msg.should.have.property('topic','fems');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
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
        await delay(50);
        n1.receive({ topic:"open" });
        await delay(2000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        actualState.should.match( 'error' );
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 1 );
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
                { id: "n1", type: "feneconWebsocket", fems: "nf", edge:"0", inlist:JSON.stringify(inlist), name: "test", wires: [["n2"],["n3"],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"foobar.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c1 = 0;
      var c2 = 0;
      var c3 = 0;
      var actualState;
      n2.on("input", function (msg) {
        console.log(msg);
        ++c1;
      });
      n3.on("input", function (msg) {
        console.log(msg);
        ++c2;
      });
      n4.on("input", function (msg) {
        console.log(msg.payload);
        c3++;
        try {
          msg.should.have.property('topic','fems');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
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
        await delay(50);
        n1.receive({ topic:"open" });
        await delay(2000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        actualState.should.match( 'error' );
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 2 );
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
                { id: "n1", type: "feneconWebsocket", fems: "nf", edge:"0", inlist:JSON.stringify(inlist), name: "test", wires: [["n2"],["n3"],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"192.168.254.254", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c1 = 0;
      var c2 = 0;
      var c3 = 0;
      var actualState;
      n2.on("input", function (msg) {
        console.log(msg);
        ++c1;
      });
      n3.on("input", function (msg) {
        console.log(msg);
        ++c2;
      });
      n4.on("input", function (msg) {
        console.log(msg.payload);
        c3++;
        try {
          msg.should.have.property('topic','fems');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
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
        await delay(50);
        n1.receive({ topic:"open" });
        await delay(2000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        actualState.should.match( 'error' );
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle other requests without open', function (done) {
    this.timeout( 2500 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconWebsocket", fems: "nf", edge:"0", inlist:JSON.stringify(inlist), name: "test", wires: [["n2"],["n3"],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"fems.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c1 = 0;
      var c2 = 0;
      var c3 = 0;
      var actualState = "init";
      n2.on("input", function (msg) {
        console.log(msg);
        ++c1;
      });
      n3.on("input", function (msg) {
        console.log(msg);
        ++c2;
      });
      n4.on("input", function (msg) {
        console.log(msg.payload);
        c3++;
        try {
          msg.should.have.property('topic','fems');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
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
        await delay(50);
        n1.receive({ topic:"close" });
        await delay(50);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'closed' );
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 1 );
        n1.receive({ topic:"ctrlGridOptimizedCharge0/manualTargetTime", payload:"11:30" });
        await delay(50);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(1);
        actualState.should.match( 'closed' );
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 1 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not write config without risk accepted', function (done) {
    this.timeout( 2500 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconWebsocket", fems: "nf", edge:"0", inlist:JSON.stringify(inlist), name: "test", wires: [["n2"],["n3"],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"fems.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c1 = 0;
      var c2 = 0;
      var c3 = 0;
      var actualState;
      n2.on("input", function (msg) {
        console.log(msg);
        ++c1;
      });
      n3.on("input", function (msg) {
        console.log(msg);
        ++c2;
      });
      n4.on("input", function (msg) {
        console.log(msg.payload);
        c3++;
        try {
          msg.should.have.property('topic','fems');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
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
        n1.should.have.a.property('risk', false);
        await delay(50);
        n1.state = "connected";
        n1.should.have.a.property('state','connected');
        n1.receive({ topic:"ctrlGridOptimizedCharge0/manualTargetTime", payload:"11:30" });
        await delay(50);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 0 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

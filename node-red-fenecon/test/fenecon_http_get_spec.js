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
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('complete', false);
        n1.should.have.a.property('retries', 1);
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
        //console.log(msg);
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
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('complete', false);
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"_meta/Version" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        n1.should.have.a.property('stats',{ok:1,error:0,exception:0});
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
        //console.log(msg);
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
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('complete', false);
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"_meta/.*" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        n1.should.have.a.property('stats',{ok:1,error:0,exception:0});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should make a predefined request with complete option', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpGet", fems: "nf", topic: "_meta/Version", complete:true, name: "test", wires: [["n2"]], z: "flow" },
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
          msg.should.have.property('topic',"foo/bar");
          msg.should.have.property('payload').which.is.an.Object();
          msg.payload.should.have.property('address','_meta/Version');
          msg.payload.should.have.property('type','STRING');
          msg.payload.should.have.property('accessMode','RO');
          msg.payload.should.have.property('text');
          msg.payload.should.have.property('unit','');
          msg.payload.should.have.property('value');
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('topic', '_meta/Version');
        n1.should.have.a.property('complete', true);
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"foo/bar" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        n1.should.have.a.property('stats',{ok:1,error:0,exception:0});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle invalid requests', function (done) {
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
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"foo/bar" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c.should.match( 0 );
        n1.should.have.a.property('stats',{ok:0,error:1,exception:0});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle invalid URLs', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpGet", fems: "nf", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"foobar:lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"foo/bar" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c.should.match( 0 );
        n1.should.have.a.property('stats',{ok:0,error:0,exception:1});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle invalid addresses', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpGet", fems: "nf", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"foobar.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"foo/bar" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c.should.match( 0 );
        n1.should.have.a.property('stats',{ok:0,error:0,exception:1});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle invalid IPs', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpGet", fems: "nf", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"192.168.254.254", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"foo/bar" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c.should.match( 0 );
        n1.should.have.a.property('stats',{ok:0,error:0,exception:1});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should time out', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpGet", fems: "nf", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"192.168.3.254", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('retries', 1);
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"foo/bar" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 0 );
        await delay(1000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c.should.match( 0 );
        n1.should.have.a.property('stats',{ok:0,error:0,exception:1});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

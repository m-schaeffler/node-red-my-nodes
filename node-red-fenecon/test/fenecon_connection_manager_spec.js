var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../fenecon_connection_manager.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'fenecon_connection_manager Node', function () {
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
    var flow = [{ id: "n1", type: "feneconConnMan", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        await delay(750);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

/*
  it('should write one value', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpPost", fems: "nf", name: "test", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"fems.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"ess0/SetActivePowerLessOrEquals", payload:1000 });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.receive({ topic:"ess0/SetActivePowerLessOrEquals", payload:null });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('stats',{ok:2,error:0,exception:0});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should write one predefined value', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpPost", topic:"ess0/SetActivePowerLessOrEquals", fems: "nf", name: "test", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"fems.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('topic', 'ess0/SetActivePowerLessOrEquals');
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"foo/bar", payload:1000 });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.receive({ topic:"foo/bar", payload:null });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('stats',{ok:2,error:0,exception:0});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not write invalid requests', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpPost", fems: "nf", name: "test", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"fems.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"foo/bar", payload:0 });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        n1.should.have.a.property('stats',{ok:0,error:1,exception:0});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not write invalid URLs', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpPost", fems: "nf", name: "test", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"foobar:lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"foo/bar", payload:0 });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        n1.should.have.a.property('stats',{ok:0,error:0,exception:1});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not write invalid addresses', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpPost", fems: "nf", name: "test", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"foobar.lan", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"foo/bar", payload:0 });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        n1.should.have.a.property('stats',{ok:0,error:0,exception:1});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not write invalid IP', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconHttpPost", fems: "nf", name: "test", z: "flow" },
                { id: "nf", type: "feneconFems", hostname:"192.168.254.254", name:"TestFems", z: "flow" }];
    helper.load([node,nodeFems], flow, async function () {
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('fems').which.is.an.Object();
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('stats',{ok:0,error:0,exception:0});
        await delay(50);
        n1.receive({ topic:"foo/bar", payload:0 });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        n1.should.have.a.property('stats',{ok:0,error:0,exception:1});
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });
*/
});

var should = require("should");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
var helper = require("node-red-node-test-helper");
var node   = require("../matter_connection_manager.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'matter_connection_manager Node', function () {
    "use strict";

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function(done) {
      helper.unload().then(function() {
          return Context.clean({allNodes: {}});
      }).then(function () {
          return Context.close();
      }).then(function () {
          helper.stopServer(done);
      });
  });

  it('should be loaded', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "matterConnMan", name: "test", z:"flow" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('restart', 5000);
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

  it('should start and handle a connection', function (done) {
    this.timeout( 20000 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "matterConnMan", restart:0.4, name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg.topic);
        c++;
        try {
          msg.should.have.property('topic',"open");
          msg.should.not.have.property('payload');
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('restart', 400);
        await delay(1000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        n1.receive({ topic:"matter", payload:"connected" });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        // closed state
        n1.receive({ topic:"matter", payload:"closed" });
        await delay(700);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        n1.receive({ topic:"matter", payload:"connected" });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        // error state
        n1.receive({ topic:"matter", payload:"error" });
        await delay(700);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 3 );
        await delay(400);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 4 );
        await delay(400);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 5 );
        n1.receive({ topic:"matter", payload:"connected" });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 5 );
        await delay(1000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 5 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

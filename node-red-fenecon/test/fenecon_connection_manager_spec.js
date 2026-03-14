var should = require("should");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
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
          return Context.clean({allNodes: {}});
      }).then(function () {
          return Context.close();
      }).then(function () {
          helper.stopServer(done);
      });
  });

  it('should be loaded', function (done) {
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconConnMan", name: "test", z:"flow" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('cyclic', 15000);
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.context().flow.get("wsAlive_2").should.be.approximately( Date.now()-50, 5 );
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
                { id: "n1", type: "feneconConnMan", cyclic: "0.5", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        try {
          msg.should.have.property('topic',"open");
          msg.should.not.have.property('payload');
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('cyclic', 500);
        await delay(600);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        n1.receive({ topic:"fems", payload:"connected" });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        n1.context().flow.get("wsAlive_2").should.be.approximately( Date.now()-50, 25 );
        for( let i=0; i<10; i++)
        {
            await delay(500);
            n1.context().flow.set( "wsAlive_2", Date.now() );
            n1.warn.should.have.callCount(0);
            n1.error.should.have.callCount(0);
            c.should.match( 1 );
        }
        // closed state
        n1.receive({ topic:"fems", payload:"closed" });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        n1.context().flow.get("wsAlive_2").should.be.approximately( Date.now()-50, 25 );
        for( let i=0; i<4; i++)
        {
            await delay(500);
            n1.warn.should.have.callCount(0);
            n1.error.should.have.callCount(0);
            c.should.match( 1 );
        }
        await delay(500);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        n1.receive({ topic:"fems", payload:"connected" });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        n1.context().flow.get("wsAlive_2").should.be.approximately( Date.now()-50, 25 );
        // error state
        n1.receive({ topic:"fems", payload:"error" });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        n1.context().flow.get("wsAlive_2").should.be.approximately( Date.now()-50, 25 );
        for( let i=0; i<4; i++)
        {
            await delay(500);
            n1.warn.should.have.callCount(0);
            n1.error.should.have.callCount(0);
            c.should.match( 2 );
        }
        await delay(500);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 3 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle timeouts', function (done) {
    this.timeout( 10000 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "feneconConnMan", cyclic: "0.5", name: "test", wires: [["n2"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var nf = helper.getNode("nf");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        try {
          msg.should.have.property('topic',"open");
          msg.should.not.have.property('payload');
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('cyclic', 500);
        await delay(600);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        n1.receive({ topic:"fems", payload:"connected" });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 1 );
        n1.context().flow.get("wsAlive_2").should.be.approximately( Date.now()-50, 25 );
        
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

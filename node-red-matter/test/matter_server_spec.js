var should = require("should");
var Context= require("/usr/lib/node_modules/node-red/node_modules/@node-red/runtime/lib/nodes/context/");
var helper = require("node-red-node-test-helper");
var node   = require("../matter_server.js");
require("./matter_spec.js");
require("./sendqueue_spec.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'matter_server Node', function () {
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
    var flow = [{ id: "n1", type: "matterServer", name: "test", z:"flow" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host', '');
        n1.should.have.a.property('port', 5580);
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('eventPrefix', "");
        n1.should.have.a.property('onlinePrefix', "");
        n1.should.have.a.property('contextVar', "");
        n1.should.have.a.property('state','closed');
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('matter');
        n1.queue.isEmpty().should.match( true );
        should.not.exist( n1.context().flow.get("matter") );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should connect and get data', function (done) {
    this.timeout( 10000 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "matterServer", host:"localhost", name: "test", wires: [["n2"],["n3"],["n5"],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" },
                { id: "n5", type: "helper", z: "flow" }];
    helper.load([node], flow, async function () {
      var n5 = helper.getNode("n5");
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c1 = 0;
      var c2 = 0;
      var c3 = 0;
      var c4 = 0;
      var actualState;
      n2.on("input", function (msg) {
        //console.log(msg);
        c1++;
        try {
          msg.should.have.property('topic').which.is.a.String();
          msg.should.have.property('payload').which.is.an.Object();
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        //console.log(msg);
        c2++;
        try {
          done("tbd")
        }
        catch(err) {
          done(err);
        }
      });
      n4.on("input", function (msg) {
        //console.log(msg.payload);
        c3++;
        try {
          msg.should.have.property('topic','matter');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
        }
        catch(err) {
          done(err);
        }
      });
      n5.on("input", function (msg) {
        //console.log(msg);
        c4++;
        try {
          msg.should.have.property('topic').which.is.a.String();
          msg.should.have.property('online').which.is.a.Boolean();
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host', 'localhost');
        n1.should.have.a.property('port', 5580);
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('eventPrefix', "");
        n1.should.have.a.property('onlinePrefix', "");
        n1.should.have.a.property('contextVar', "");
        n1.should.have.a.property('state','closed');
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 0 );
        c4.should.match( 0 );
        n1.queue.isEmpty().should.match( true );
        n1.receive({ topic:"open" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        c1.should.be.above( 0 );
        c2.should.match( 0 );
        c3.should.match( 4 );
        c4.should.be.aboveOrEqual( 2 );
        let c1_soll = c1;
        n1.receive({ topic:"open" }); // 2nd
        await delay(50);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        c1.should.match( c1_soll );
        c2.should.match( 0 );
        c3.should.match( 5 );
        c4.should.be.aboveOrEqual( 2 );
        await delay(4000);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        c1.should.be.aboveOrEqual( c1_soll );
        c1_soll = c1;
        c2.should.match( 0 );
        c3.should.match( 5 );
        c4.should.be.aboveOrEqual( 2 );
        n1.should.have.a.property("matter");
        n1.queue.isEmpty().should.match( true );

        for( const i in n1.matter._dataById )
        {
          const n = n1.matter._dataById[i];
          n.should.have.a.property("online").which.is.Boolean();
          n.should.have.a.property("time").which.is.a.Number();
          n.should.have.a.property("make").which.is.a.String();
          n.should.have.a.property("model").which.is.a.String();
          n.should.have.a.property("label").which.is.a.String();
          n.should.have.a.property("name").which.is.a.String();
          n.should.have.a.property("internal").which.is.an.Object();
          n.should.have.a.property("data").which.is.an.Object();
          if( n.label )
          {
            n.should.have.a.property("ip6").which.is.a.String();
          }
        }

        n1.receive({ topic:"get_nodes" });
        await delay(200);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        c1.should.be.above( c1_soll );
        c1_soll = c1;
        c2.should.match( 0 );
        c3.should.match( 5 );
        c4.should.be.aboveOrEqual( 4 );
        n1.receive({ topic:"close" });
        await delay(200);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'closed' );
        c1.should.match( c1_soll );
        c2.should.match( 0 );
        c3.should.match( 7 );
        c4.should.be.aboveOrEqual( 2 );
        n1.queue.isEmpty().should.match( true );
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
                { id: "n1", type: "matterServer", host:"foobar:lan", name: "test", wires: [["n2"],["n3"],[],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" }];
    helper.load([node], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
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
          msg.should.have.property('topic','matter');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host', 'foobar:lan');
        n1.should.have.a.property('port', 5580);
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('eventPrefix', "");
        n1.should.have.a.property('contextVar', "");
        n1.should.have.a.property('state','closed');
        await delay(50);
        n1.receive({ topic:"open" });
        await delay(2000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        actualState.should.match( 'error' );
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 1 );
        n1.queue.isEmpty().should.match( true );
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
                { id: "n1", type: "matterServer", host:"foobar.lan", name: "test", wires: [["n2"],["n3"],[],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" }];
    helper.load([node], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
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
          msg.should.have.property('topic','matter');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host', 'foobar.lan');
        n1.should.have.a.property('port', 5580);
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('eventPrefix', "");
        n1.should.have.a.property('contextVar', "");
        n1.should.have.a.property('state','closed');
        await delay(50);
        n1.receive({ topic:"open" });
        await delay(2000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        actualState.should.match( 'error' );
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 2 );
        n1.queue.isEmpty().should.match( true );
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
                { id: "n1", type: "matterServer", host:"192.168.254.254", name: "test", wires: [["n2"],["n3"],[],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" }];
    helper.load([node], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
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
          msg.should.have.property('topic','matter');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host', '192.168.254.254');
        n1.should.have.a.property('port', 5580);
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('eventPrefix', "");
        n1.should.have.a.property('contextVar', "");
        n1.should.have.a.property('state','closed');
        await delay(50);
        n1.receive({ topic:"open" });
        await delay(2000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        actualState.should.match( 'error' );
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 2 );
        n1.queue.isEmpty().should.match( true );
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
                { id: "n1", type: "matterServer", host:"localhost", name: "test", wires: [["n2"],["n3"],[],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" }];
    helper.load([node], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
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
          msg.should.have.property('topic','matter');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host', 'localhost');
        n1.should.have.a.property('port', 5580);
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('eventPrefix', "");
        n1.should.have.a.property('contextVar', "");
        n1.should.have.a.property('state','closed');
        await delay(50);
        n1.receive({ topic:"close" });
        await delay(50);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'closed' );
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 1 );
        n1.receive({ topic:"Rocky", payload:{command:"rvc.stop"} });
        await delay(50);
        n1.warn.should.have.callCount(1);
        n1.error.should.have.callCount(1);
        actualState.should.match( 'closed' );
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 1 );
        n1.queue.isEmpty().should.match( true );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should send commands', function (done) {
    this.timeout( 10000 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "matterServer", host:"localhost", name: "test", wires: [["n2"],["n3"],[],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" }];
    helper.load([node], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c1 = 0;
      var c2 = 0;
      var c3 = 0;
      var actualState;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic').which.is.a.String();
          msg.should.have.property('payload').which.is.an.Object();
          ++c1;
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        console.log(msg);
        try {
          done("tbd")
        }
        catch(err) {
          done(err);
        }
      });
      n4.on("input", function (msg) {
        console.log(msg.payload);
        c3++;
        try {
          msg.should.have.property('topic','matter');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host', 'localhost');
        n1.should.have.a.property('port', 5580);
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('eventPrefix', "");
        n1.should.have.a.property('contextVar', "");
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
        c1.should.be.above( 0 );
        c2.should.match( 0 );
        c3.should.match( 4 );
        await delay(4000);
        n1.queue.isEmpty().should.match( true );
        //
        n1.receive({ topic:"Rocky", payload:{command:"rvc.stop"} });
        await delay(150);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c2.should.match( 0 );
        c3.should.match( 4 );
        //
        n1.receive({ topic:"FooBar", payload:{command:"rvc.stop"} });
        await delay(150);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c2.should.match( 0 );
        c3.should.match( 4 );
        //
        n1.receive({ topic:"Rocky", payload:{command:"rvc.foobar"} });
        await delay(150);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(2);
        c2.should.match( 0 );
        c3.should.match( 4 );
        //
        n1.receive({ topic:"close" });
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(2);
        actualState.should.match( 'closed' );
        c2.should.match( 0 );
        c3.should.match( 6 );
        n1.queue.isEmpty().should.match( true );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should do time sync', function (done) {
    this.timeout( 30000 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "matterServer", host:"localhost", name: "test", wires: [["n2"],["n3"],[],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" }];
    helper.load([node], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c1 = 0;
      var c2 = 0;
      var c3 = 0;
      var actualState;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          msg.should.have.property('topic').which.is.a.String();
          msg.should.have.property('payload').which.is.an.Object();
          ++c1;
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        console.log(msg);
        try {
          done("tbd")
        }
        catch(err) {
          done(err);
        }
      });
      n4.on("input", function (msg) {
        console.log(msg.payload);
        c3++;
        try {
          msg.should.have.property('topic','matter');
          msg.should.have.property('payload').which.is.a.String();
          actualState = msg.payload;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host', 'localhost');
        n1.should.have.a.property('port', 5580);
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('eventPrefix', "");
        n1.should.have.a.property('contextVar', "");
        n1.should.have.a.property('state','closed');
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 0 );
        c2.should.match( 0 );
        c3.should.match( 0 );
        n1.queue.isEmpty().should.match( true );
        n1.receive({ topic:"open" });
        await delay(150);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        c1.should.be.above( 0 );
        c2.should.match( 0 );
        c3.should.match( 4 );
        await delay(4000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        c1.should.be.above( 0 );
        c2.should.match( 0 );
        c3.should.match( 4 );
        n1.queue.isEmpty().should.match( true );
        //
        n1.receive({ topic:"timeSync" });
        await delay(10);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c2.should.match( 0 );
        c3.should.match( 4 );
        n1.queue.isEmpty().should.match( false );
        await delay(12000);
        n1.queue.isEmpty().should.match( true );
        //
        n1.receive({ topic:"close" });
        await delay(150);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'closed' );
        c2.should.match( 0 );
        c3.should.match( 6 );
        n1.queue.isEmpty().should.match( true );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should ping Alpstuga (#21)', function (done) {
    this.timeout( 30000 );
    var flow = [{ id: 'flow', type: 'tab' },
                { id: "n1", type: "matterServer", host:"localhost", name: "test", wires: [["n2"],["n3"],[],["n4"]], z: "flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" },
                { id: "n4", type: "helper", z: "flow" }];
    helper.load([node], flow, async function () {
      var n4 = helper.getNode("n4");
      var n3 = helper.getNode("n3");
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var actualState;
      n2.on("input", function (msg) {
      });
      n3.on("input", function (msg) {
      });
      n4.on("input", function (msg) {
        actualState = msg.payload;
      });
      try{
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('host', 'localhost');
        n1.should.have.a.property('port', 5580);
        n1.should.have.a.property('statusPrefix', "");
        n1.should.have.a.property('eventPrefix', "");
        n1.should.have.a.property('contextVar', "");
        n1.should.have.a.property('state','closed');
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.queue.isEmpty().should.match( true );
        n1.receive({ topic:"open" });
        await delay(150);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        await delay(4000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'connected' );
        n1.queue.isEmpty().should.match( true );
        //
        n1.receive({ topic:"ping_node", payload:21 });
        await delay(8000);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.queue.isEmpty().should.match( true );
        //
        n1.receive({ topic:"close" });
        await delay(150);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        actualState.should.match( 'closed' );
        n1.queue.isEmpty().should.match( true );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

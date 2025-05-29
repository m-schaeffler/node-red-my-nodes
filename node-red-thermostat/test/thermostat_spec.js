var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../thermostat.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'thermostat Node', function () {
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
    let flow = [{ id: "n1", type: "thermostat", name: "test", wires: [["n2"],["n3"]], z:"flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let c1 = 0;
      let c2 = 0;
      n2.on("input", function (msg) {
        try {
          c1++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',false);
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          c2++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',false);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', 'thermostat');
        n1.should.have.a.property('nominal', 20);
        n1.should.have.a.property('cycleTime', 600);
        n1.should.have.a.property('cycleCount', 1);
        await delay(500);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:20,cycleTime:600,cycleCount:1});
        should.not.exist( n1.context().get("data") );
        c1.should.match( 1 );
        c2.should.match( 1 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should store data', function (done) {
    let flow = [{ id: "n1", type: "thermostat", name: "test", wires: [["n2"],["n3"]], z:"flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let c1 = 0;
      let c2 = 0;
      n2.on("input", function (msg) {
        try {
          c1++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',false);
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          c2++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',false);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', 'thermostat');
        n1.should.have.a.property('nominal', 20);
        n1.should.have.a.property('cycleTime', 600);
        n1.should.have.a.property('cycleCount', 1);
        await delay(500);
        n1.should.have.a.property('data',{nominal:20,cycleTime:600,cycleCount:1});
        c1.should.match( 1 );
        c2.should.match( 1 );
        // change nominal data
        n1.receive({ topic:"data", payload: {
          nominal:    22,
          cycleTime:  900,
          cycleCount: 3
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:22,cycleTime:900,cycleCount:3});
        n1.context().get("data").should.match(n1.data);
        // set actual data
        n1.receive({ topic:"data", payload: {
          block:       false,
          temperature: 19
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:22,cycleTime:900,cycleCount:3,block:false,temperature:19});
        n1.context().get("data").should.match(n1.data);
        // reset
        n1.receive({ reset: true });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:20,cycleTime:600,cycleCount:1,block:false,temperature:19});
        n1.context().get("data").should.match(n1.data);
        c1.should.match( 1 );
        c2.should.match( 1 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

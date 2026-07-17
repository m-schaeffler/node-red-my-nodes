var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../matter_shelly_sim.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'matter_shelly_sim Node', function () {
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
    var flow = [{ id: "n1", type: "matterShellySim", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.log.should.have.callCount(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should just forward unknown messages', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"FooBar");
          msg.should.have.a.property('payload',{ command:"levelcontrol.movetolevel", data: 50 });
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"FooBar", payload: { command:"levelcontrol.movetolevel", data: 50 } });
        await delay(50);
        n1.log.should.have.callCount(0);
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

  it('should convert output messages with simple data', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"Output");
          msg.should.have.a.property('payload',{ command:c<12?(c%2?"onoff.off":"onoff.on"):"onoff.toggle", data: null });
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: true } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: false } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "true" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "false" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: 1 } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: 0 } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "1" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "0" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "on" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "off" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "on" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "disabled" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "toggle" } });
        await delay(50);
        n1.receive({ topic:"Output", payload: { command:"output", data: "invalid" } });
        await delay(50);
        n1.log.should.have.callCount(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(1);
        c.should.match( 13 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should convert relay messages', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"Relay");
          msg.should.have.a.property('payload',{ command: c%2?"onoff.off":"onoff.on", data: null });
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"Relay", payload: { command:"relay", data: true } });
        await delay(50);
        n1.receive({ topic:"Relay", payload: { command:"relay", data: false } });
        await delay(50);
        n1.log.should.have.callCount(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should convert switch messages', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"Relay");
          msg.should.have.a.property('payload',{ command: c%2?"onoff.off":"onoff.on", data: null });
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"Relay", payload: { command:"relay", data: true } });
        await delay(50);
        n1.receive({ topic:"Relay", payload: { command:"relay", data: false } });
        await delay(50);
        n1.log.should.have.callCount(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should convert light messages with simple data', function (done) {
    var flow = [{ id: "n1", type: "matterShellySim", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var c  = 0;
      n2.on("input", function (msg) {
        try {
          //console.log(msg)
          msg.should.have.a.property('topic',"Relay");
          msg.should.have.a.property('payload',{ command: c%2?"onoff.off":"onoff.on", data: null });
          ++c;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        await delay(50);
        n1.receive({ topic:"Relay", payload: { command:"relay", data: true } });
        await delay(50);
        n1.receive({ topic:"Relay", payload: { command:"relay", data: false } });
        await delay(50);
        n1.log.should.have.callCount(0);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

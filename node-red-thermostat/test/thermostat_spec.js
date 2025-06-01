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
        n1.should.have.a.property('minDelta', 0.25);
        n1.should.have.a.property('summand', 0.4);
        n1.should.have.a.property('factor', 0.2);
        n1.should.have.a.property('cycleTime', 600);
        n1.should.have.a.property('cycleCount', 1);
        n1.should.have.a.property('feedback', "boolean");
        await delay(500);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1});
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
        n1.should.have.a.property('feedback', "boolean");
        await delay(500);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1});
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
        n1.should.have.a.property('data',{nominal:22,factor:0.2,cycleTime:900,cycleCount:3});
        n1.context().get("data").should.match(n1.data);
        // change closed loop control data
        n1.receive({ topic:"data", payload: {
          factor: 2
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:22,factor:0.4,cycleTime:900,cycleCount:3});
        n1.context().get("data").should.match(n1.data);
        // set actual data
        n1.receive({ topic:"data", payload: {
          block:       false,
          temperature: 19
        } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:22,factor:0.4,cycleTime:900,cycleCount:3,block:false,temperature:19});
        n1.context().get("data").should.match(n1.data);
        // reset
        n1.receive({ reset: true });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1,block:false,temperature:19});
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

  it('should switch on and off', function (done) {
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
        //console.log(msg);
        try {
          c1++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',Boolean((c1-1)%2));
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        try {
          c2++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',Boolean((c2-1)%2));
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
        n1.should.have.a.property('feedback', "boolean");
        await delay(500);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1});
        c1.should.match( 1 );
        c2.should.match( 1 );
        // switch on
        n1.receive({ topic:"data", payload: { temperature: 19.7, trigger: true } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 2 );
        // switch off
        n1.receive({ topic:"data", payload: { trigger: false } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 3 );
        c2.should.match( 3 );
        // switch on
        n1.receive({ topic:"data", payload: { trigger: "on" } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 4 );
        c2.should.match( 4 );
        // switch off
        n1.receive({ topic:"data", payload: { trigger: "off" } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 5 );
        c2.should.match( 5 );
        // switch on
        n1.receive({ topic:"data", payload: true });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 6 );
        c2.should.match( 6 );
        // switch off
        n1.receive({ topic:"data", payload: false });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 7 );
        c2.should.match( 7 );
        // switch on
        n1.receive({ topic:"data", payload: { trigger: "on" } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 8 );
        c2.should.match( 8 );
        // reset
        n1.receive({ reset: true });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1,temperature:19.7});
        n1.context().get("data").should.match(n1.data);
        c1.should.match( 9 );
        c2.should.match( 9 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should handle double switching', function (done) {
    let flow = [{ id: "n1", type: "thermostat", feedback:"on_off", name: "test", wires: [["n2"],["n3"]], z:"flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let c1 = 0;
      let c2 = 0;
      n2.on("input", function (msg) {
        //console.log("  c1",msg);
        try {
          c1++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',Boolean((c1-1)%2)?"on":"off");
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        //console.log("  c2",msg);
        try {
          c2++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',Boolean((c2-1)%2));
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
        n1.should.have.a.property('feedback', "on_off");
        await delay(500);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1});
        c1.should.match( 1 );
        c2.should.match( 1 );
        // switch on
        n1.receive({ topic:"data", payload: { temperature:19.7, trigger: true } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 2 );
        // 2nd switch on
        n1.receive({ topic:"data", payload: { trigger: true } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 2 );
        // switch off
        n1.receive({ topic:"data", payload: { trigger: false } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 3 );
        c2.should.match( 3 );
        // 2nd switch off
        n1.receive({ topic:"data", payload: { trigger: false } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1,temperature:19.7});
        n1.context().get("data").should.match(n1.data);
        c1.should.match( 3 );
        c2.should.match( 3 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not switch on with high temp', function (done) {
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
        //console.log(msg);
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
        n1.should.have.a.property('feedback', "boolean");
        await delay(500);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1});
        c1.should.match( 1 );
        c2.should.match( 1 );
        // switch on
        n1.receive({ topic:"data", payload: { temperature: 19.8, trigger: true } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 2 );
        // switch off
        n1.receive({ topic:"data", payload: { trigger: false } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1,temperature:19.8});
        n1.context().get("data").should.match(n1.data);
        c1.should.match( 2 );
        c2.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not switch on without temp', function (done) {
    let flow = [{ id: "n1", type: "thermostat", feedback:"cycleCount", name: "test", wires: [["n2"],["n3"]], z:"flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let c1 = 0;
      let c2 = 0;
      n2.on("input", function (msg) {
        //console.log(msg);
        try {
          c1++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',0);
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
        n1.should.have.a.property('feedback', "cycleCount");
        await delay(500);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1});
        c1.should.match( 1 );
        c2.should.match( 1 );
        // switch on
        n1.receive({ topic:"data", payload: { trigger: true } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 2 );
        // switch off
        n1.receive({ topic:"data", payload: { trigger: false } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1});
        n1.context().get("data").should.match(n1.data);
        c1.should.match( 2 );
        c2.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should do one cycle', function (done) {
    this.timeout( 15000 );
    let flow = [{ id: "n1", type: "thermostat", cycleTime:"10", feedback:"0_1", name: "test", wires: [["n2"],["n3"]], z:"flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let c1 = 0;
      let c2 = 0;
      n2.on("input", function (msg) {
        //console.log("  c1",msg);
        try {
          c1++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',(c1-1)%2);
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        //console.log("  c2",msg);
        try {
          c2++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',Boolean((c2-1)%2));
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', 'thermostat');
        n1.should.have.a.property('nominal', 20);
        n1.should.have.a.property('cycleTime', 10);
        n1.should.have.a.property('cycleCount', 1);
        n1.should.have.a.property('feedback', "0_1");
        await delay(500);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:10,cycleCount:1});
        c1.should.match( 1 );
        c2.should.match( 1 );
        // switch on
        n1.receive({ topic:"data", payload: { temperature: 18.9, trigger: true } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 2 );
        await delay(4100);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 2 );
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 3 );
        c2.should.match( 3 );
        await delay(6000);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:10,cycleCount:1,temperature:18.9});
        n1.context().get("data").should.match(n1.data);
        c1.should.match( 3 );
        c2.should.match( 3 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should do four cycles', function (done) {
    this.timeout( 45000 );
    let flow = [{ id: "n1", type: "thermostat", cycleTime:"10", feedback:"cycleCount", name: "test", wires: [["n2"],["n3"]], z:"flow" },
                { id: "n2", type: "helper", z: "flow" },
                { id: "n3", type: "helper", z: "flow" }];
    helper.load(node, flow, async function () {
      let n1 = helper.getNode("n1");
      let n2 = helper.getNode("n2");
      let n3 = helper.getNode("n3");
      let c1 = 0;
      let c2 = 0;
      let time;
      n2.on("input", function (msg) {
        //console.log("  c1",msg,Date.now()-time);
        try {
          c1++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',((c1-1)%2)*4);
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        //console.log("  c2",msg,Date.now()-time);
        try {
          c2++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',Boolean((c2-1)%2));
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', 'thermostat');
        n1.should.have.a.property('nominal', 20);
        n1.should.have.a.property('cycleTime', 10);
        n1.should.have.a.property('cycleCount', 1);
        n1.should.have.a.property('feedback', "cycleCount");
        await delay(500);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:10,cycleCount:1});
        c1.should.match( 1 );
        c2.should.match( 1 );
        // switch on
        time = Date.now();
        n1.receive({ topic:"data", payload: { temperature: 18.1 } });
        n1.receive({ topic:"data", payload: 4 });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 2 );
        await delay(6340);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 2 );
        // 1st off
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 3 );
        await delay(3360);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 3 );
        // 2nd on
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 4 );
        await delay(5220);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 4 );
        // 2nd off
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 5 );
        await delay(4380);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 5 );
        // 3rd on
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 6 );
        await delay(4400);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 6 );
        // 3rd off
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 7 );
        await delay(5200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 7 );
        // 4th on
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 8 );
        await delay(4400);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 8 );
        // 4th off
        await delay(200);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 3 );
        c2.should.match( 9 );
        await delay(6000);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:10,cycleCount:4,temperature:18.1});
        n1.context().get("data").should.match(n1.data);
        c1.should.match( 3 );
        c2.should.match( 9 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should support block', function (done) {
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
        //console.log(msg);
        try {
          c1++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',Boolean((c1-1)%2));
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        //console.log("c2:",msg);
        try {
          c2++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',Boolean((c2-1)%2));
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
        n1.should.have.a.property('feedback', "boolean");
        await delay(500);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1});
        c1.should.match( 1 );
        c2.should.match( 1 );
        // switch on
        n1.receive({ topic:"data", payload: { temperature: 19.7, trigger: true } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 2 );
        // block
        n1.receive({ topic:"data", payload: { block: true } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 3 );
        // unblock
        n1.receive({ topic:"data", payload: { block: false } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 4 );
        // switch off
        n1.receive({ topic:"data", payload: { trigger: false } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1,temperature:19.7,block:false});
        n1.context().get("data").should.match(n1.data);
        c1.should.match( 3 );
        c2.should.match( 5 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should support block in other order', function (done) {
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
        //console.log(msg);
        try {
          c1++;
          msg.should.have.a.property('topic','thermostat');
          msg.should.have.a.property('payload',Boolean((c1-1)%2));
        }
        catch(err) {
          done(err);
        }
      });
      n3.on("input", function (msg) {
        //console.log("c2:",msg);
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
        n1.should.have.a.property('feedback', "boolean");
        await delay(500);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1});
        c1.should.match( 1 );
        c2.should.match( 1 );
        // block
        n1.receive({ topic:"data", payload: { temperature: 19.7, block: true } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 1 );
        c2.should.match( 1 );
        // switch on
        n1.receive({ topic:"data", payload: { trigger: true } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 2 );
        c2.should.match( 2 );
        // switch off
        n1.receive({ topic:"data", payload: { trigger: false } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        c1.should.match( 3 );
        c2.should.match( 2 );
        // unblock
        n1.receive({ topic:"data", payload: { block: false } });
        await delay(50);
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        n1.should.have.a.property('data',{nominal:20,factor:0.2,cycleTime:600,cycleCount:1,temperature:19.7,block:false});
        n1.context().get("data").should.match(n1.data);
        c1.should.match( 3 );
        c2.should.match( 2 );
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

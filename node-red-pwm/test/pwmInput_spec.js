var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../pwm_input.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'pwm_input Node', function () {
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
    var flow = [{ id: "n1", type: "pwmInput", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('measureTime', 3600000);
        n1.should.have.a.property('showState', false);
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

  it('should work without any input', function (done) {
    this.timeout( 8000 );
    var flow = [{ id: "n1", type: "pwmInput", measureTime:"5", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        console.log(msg);
        try {
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('measureTime', 5000);
        await delay(6000);
        c.should.match( 0 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with single input, false', function (done) {
    this.timeout( 8000 );
    var flow = [{ id: "n1", type: "pwmInput", measureTime:"5", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      const start = Date.now();
      n2.on("input", function (msg) {
        console.log(msg);
        try {
          c++;
          msg.should.have.property('topic','single');
          msg.should.have.property('payload',0);
          const delta = Date.now() - start;
          delta.should.be.approximately( 1000, 20 );
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('measureTime', 5000);
        await delay(50);
        n1.receive({ topic: "single", payload: false });
        await delay(6000);
        c.should.match( 1 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with single input, true', function (done) {
    this.timeout( 8000 );
    var flow = [{ id: "n1", type: "pwmInput", measureTime:"5", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      const start = Date.now();
      n2.on("input", function (msg) {
        console.log(msg);
        try {
          c++;
          msg.should.have.property('topic','single');
          msg.should.have.property('payload',1);
          const delta = Date.now() - start;
          delta.should.be.approximately( 1000, 20 );
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('measureTime', 5000);
        await delay(50);
        n1.receive({ topic: "single", payload: true });
        await delay(6000);
        c.should.match( 1 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should not use invalid data', function (done) {
    var flow = [{ id: "n1", type: "pwmInput", measureTime:"5", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('topic',"Valid");
          msg.should.have.a.property('payload',0);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try{
        n1.should.have.a.property('measureTime', 5000);
        await delay(50);
        n1.receive({ topic:"FooBar", invalid:true, payload: true });
        await delay(50);
        n1.receive({ topic:"FooBar", invalid:true, payload: false });
        await delay(50);
        n1.receive({ topic:"FooBar", payload: "text" });
        await delay(50);
        n1.receive({ topic:"FooBar", payload: 0.5 });
        await delay(50);
        n1.receive({ topic:"FooBar", payload: null });
        await delay(50);
        n1.receive({ topic:"FooBar", payload: {} });
        await delay(50);
        n1.receive({ topic:"Valid", payload: 0 });
        await delay(1000);
        c.should.match( 1 );
        n1.warn.should.have.callCount(4);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "pwmInput", measureTime:"5", name: "test", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',0);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload.value");
        n1.should.have.a.property('propertyType', "msg");
        await delay(50);
        n1.receive({ topic:"object", payload: {a:1,value:0,b:1} });
        await delay(1000);
        c.should.match( 1 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have Jsonata', function (done) {
    var flow = [{ id: "n1", type: "pwmInput", measureTime:"5", name: "test", property:"1-payload", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.a.property('payload',1);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "1-payload");
        n1.should.have.a.property('propertyType', "jsonata");
        await delay(50);
        n1.receive({ topic:"JSONata", payload: 0 });
        await delay(1000);
        c.should.match( 1 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

});

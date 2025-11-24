var should = require("should");
var helper = require("node-red-node-test-helper");
var node   = require("../math_rising.js");

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe( 'math_rising Node', function () {
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
    var flow = [{ id: "n1", type: "raisingEdge", name: "test" }];
    helper.load(node, flow, async function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.a.property('name', 'test');
        n1.should.have.a.property('topic', '');
        n1.should.have.a.property('property', 'payload');
        n1.should.have.a.property('propertyType', 'msg');
        n1.should.have.a.property('threshold', NaN);
        n1.should.have.a.property('consecutive', 1);
        n1.should.have.a.property('output', true);
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

  it('should check for rising edge', function (done) {
    const numbers = [1000,10,99.9,100,100.1,1000,0];
    var flow = [{ id: "n1", type: "raisingEdge", output: "Text", outputType:"str", name: "test", threshold:"100", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          msg.should.have.property('topic','edge');
          msg.should.have.property('payload','Text');
          msg.should.have.property('value',100.1);
          msg.should.have.property('edge','rising');
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('threshold', 100);
        n1.should.have.a.property('output', 'Text');
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ topic:"edge", payload: i });
          await delay(50);
        }
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

  it('should respect consecutive parameter', function (done) {
    const numbers = [1000,150,10,400,40,250,251,252];
    var flow = [{ id: "n1", type: "raisingEdge", output: "42", outputType:"num", topic:"newtopic", name: "test", threshold:"100", consecutive:"3", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          c++;
          msg.should.have.property('topic','newtopic');
          msg.should.have.property('payload',42);
          msg.should.have.property('value',252);
          msg.should.have.property('edge','rising');
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('topic', 'newtopic');
        n1.should.have.a.property('threshold', 100);
        n1.should.have.a.property('consecutive', 3);
        n1.should.have.a.property('output', 42);
        await delay(50);
        for( const i of numbers )
        {
          n1.receive({ topic:"edge", payload: i });
          await delay(50);
        }
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

  it('should not forward invalid data', function (done) {
    var flow = [{ id: "n1", type: "raisingEdge", name: "test", threshold:"100", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.property('payload',true);
          msg.should.have.property('value',5000);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('output', true);
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ invalid:true, payload: 1000 });
        await delay(50);
        n1.receive({ invalid:true, payload: 0 });
        await delay(50);
        n1.receive({ invalid:true, payload: 1000 });
        await delay(50);
        n1.receive({ payload: undefined });
        await delay(50);
        n1.receive({ payload: "FooBar" });
        await delay(50);
        n1.receive({ payload: NaN });
        await delay(50);
        c.should.match( 0 );
        n1.receive({ payload: 5000 });
        await delay(50);
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

  it('should work with different topics', function (done) {
    var flow = [{ id: "n1", type: "raisingEdge", threshold:"100", output:"false", outputType:"bool", name: "test", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.property('payload',false);
          msg.should.have.a.property('value',c*1000);
          msg.should.have.a.property('topic',c===1?"A":"B");
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('output', false);
        await delay(50);
        n1.receive({ topic:"A", payload: 0 });
        await delay(50);
        n1.receive({ topic:"B", payload: 0 });
        await delay(50);
        n1.receive({ topic:"A", payload: 1000 });
        await delay(50);
        n1.receive({ topic:"B", payload: 2000 });
        await delay(50);
        c.should.match( 2 );
        n1.warn.should.have.callCount(0);
        n1.error.should.have.callCount(0);
        done();
      }
      catch(err) {
        done(err);
      }
    });
  });

  it('should have reset', function (done) {
    const json = { text:"Text", num:42 };
    var flow = [{ id: "n1", type: "raisingEdge", output:JSON.stringify(json), outputType:"json", name: "test", threshold:"100", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        c++;
        try {
          msg.should.have.property('payload',json);
          msg.should.have.property('value',5000);
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('output', json);
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ reset: true });
        await delay(50);
        n1.receive({ payload: 1000 });
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ topic: "init" });
        await delay(50);
        n1.receive({ payload: 1000 });
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ payload: 5000 });
        await delay(50);
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

  it('should work with objects', function (done) {
    var flow = [{ id: "n1", type: "raisingEdge", name: "test", threshold:"100", property:"payload.value", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('payload',true);
          msg.should.have.property('value',110);
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
        n1.receive({ payload: {value:0} });
        await delay(50);
        n1.receive({ payload: {a:1,value:110,b:88} });
        await delay(50);
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
    var flow = [{ id: "n1", type: "raisingEdge", name: "test", threshold:"100", property:"payload+5", propertyType:"jsonata", wires: [["n2"]] },
                { id: "n2", type: "helper" }];
    helper.load(node, flow, async function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      var c = 0;
      n2.on("input", function (msg) {
        try {
          msg.should.have.property('payload',true);
          msg.should.have.property('value',98+5);
          c++;
        }
        catch(err) {
          done(err);
        }
      });
      try {
        n1.should.have.a.property('property', "payload+5");
        n1.should.have.a.property('propertyType', "jsonata");
        await delay(50);
        n1.receive({ payload: 0 });
        await delay(50);
        n1.receive({ payload: 98 });
        await delay(50);
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
